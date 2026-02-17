import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "../../../convex/schema";
import { api } from "../../../convex/_generated/api";
import { modules } from "./modules";

async function setupHierarchy(t: any) {
  const userId = await t.mutation(api.auth.register, {
    email: "owner@example.com",
    name: "Owner",
  });
  const projectId = await t.mutation(api.projects.create, {
    name: "Test Project",
    userId,
  });
  const accountId = await t.mutation(api.adAccounts.create, {
    projectId,
    externalAccountId: "ext-acc-1",
    name: "Test Account",
    channel: "facebook",
  });
  const campaignId = await t.mutation(api.campaigns.create, {
    projectId,
    adAccountId: accountId,
    name: "Test Campaign",
    channel: "facebook",
  });
  const adGroupId = await t.mutation(api.adGroups.create, {
    campaignId,
    projectId,
    name: "Test Ad Group",
  });
  const adId = await t.mutation(api.ads.create, {
    adGroupId,
    campaignId,
    projectId,
    externalAdId: "ext-ad-1",
    name: "Test Ad",
    channel: "facebook",
  });
  return { userId, projectId, accountId, campaignId, adGroupId, adId };
}

const baseSaleDate = 1705363200000; // 2025-01-16 00:00:00 UTC
const baseRegDate = 1704931200000;  // 2025-01-11 00:00:00 UTC

function makeSaleArgs(
  projectId: any,
  overrides: Record<string, any> = {}
) {
  return {
    projectId,
    dealStatus: "closed",
    amount: 5000,
    saleDate: baseSaleDate,
    saleDateStr: "2025-01-16",
    registrationDate: baseRegDate,
    registrationDateStr: "2025-01-11",
    whatsappRequests: 1,
    appointmentsScheduled: 1,
    plansSent: 0,
    treatmentCompleted: false,
    ...overrides,
  };
}

describe("convex/sales", () => {
  describe("create", () => {
    it("inserts a sale with auto-computed daysToSale", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const saleId = await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId)
      );
      expect(saleId).toBeDefined();

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
      });
      expect(sales).toHaveLength(1);
      // 5 days between 2025-01-11 and 2025-01-16
      expect(sales[0].daysToSale).toBe(5);
    });

    it("inserts a sale with matchQuality='exact' when adId provided", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, { adId: h.adId })
      );

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
      });
      expect(sales[0].matchQuality).toBe("exact");
    });

    it("inserts a sale with matchQuality='channel_only' when only channel provided", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, { channel: "facebook" })
      );

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
      });
      expect(sales[0].matchQuality).toBe("channel_only");
    });

    it("inserts a sale with matchQuality='none' when no adId and no channel", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(api.sales.create, makeSaleArgs(h.projectId));

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
      });
      expect(sales[0].matchQuality).toBe("none");
    });

    it("auto-computes createdAt and updatedAt timestamps", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(api.sales.create, makeSaleArgs(h.projectId));

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
      });
      expect(sales[0].createdAt).toBeDefined();
      expect(sales[0].updatedAt).toBeDefined();
      expect(typeof sales[0].createdAt).toBe("number");
      expect(typeof sales[0].updatedAt).toBe("number");
    });

    it("auto-enriches ad names when adId provided", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, { adId: h.adId })
      );

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
      });
      expect(sales[0].adName).toBe("Test Ad");
      expect(sales[0].adGroupName).toBe("Test Ad Group");
      expect(sales[0].campaignName).toBe("Test Campaign");
    });

    it("does not overwrite explicit ad names with enriched ones", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, {
          adId: h.adId,
          adName: "Custom Ad Name",
          campaignName: "Custom Campaign",
        })
      );

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
      });
      expect(sales[0].adName).toBe("Custom Ad Name");
      expect(sales[0].campaignName).toBe("Custom Campaign");
      // adGroupName should be enriched since it was not explicitly provided
      expect(sales[0].adGroupName).toBe("Test Ad Group");
    });
  });

  describe("upsertByExternalId", () => {
    it("creates new sale when externalDealId does not exist", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const saleId = await t.mutation(api.sales.upsertByExternalId, {
        ...makeSaleArgs(h.projectId),
        externalDealId: "sale-123",
      });
      expect(saleId).toBeDefined();

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
      });
      expect(sales).toHaveLength(1);
      expect(sales[0].externalDealId).toBe("sale-123");
    });

    it("patches existing sale when externalDealId matches", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const saleId1 = await t.mutation(api.sales.upsertByExternalId, {
        ...makeSaleArgs(h.projectId, { amount: 5000 }),
        externalDealId: "sale-456",
      });

      const saleId2 = await t.mutation(api.sales.upsertByExternalId, {
        ...makeSaleArgs(h.projectId, { amount: 10000, dealStatus: "paid" }),
        externalDealId: "sale-456",
      });

      // Same ID returned
      expect(saleId2).toBe(saleId1);

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
      });
      expect(sales).toHaveLength(1);
      expect(sales[0].amount).toBe(10000);
      expect(sales[0].dealStatus).toBe("paid");
    });

    it("auto-computes matchQuality and daysToSale on upsert", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(api.sales.upsertByExternalId, {
        ...makeSaleArgs(h.projectId, { adId: h.adId }),
        externalDealId: "sale-789",
      });

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
      });
      expect(sales[0].matchQuality).toBe("exact");
      expect(sales[0].daysToSale).toBe(5);
    });
  });

  describe("listByProject", () => {
    it("returns sales filtered by date range (saleDate)", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const day1 = 1705276800000; // 2025-01-15
      const day2 = 1705363200000; // 2025-01-16
      const day3 = 1705449600000; // 2025-01-17

      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, {
          saleDate: day1,
          saleDateStr: "2025-01-15",
          clientPhone: "+71111111111",
        })
      );
      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, {
          saleDate: day2,
          saleDateStr: "2025-01-16",
          clientPhone: "+72222222222",
        })
      );
      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, {
          saleDate: day3,
          saleDateStr: "2025-01-17",
          clientPhone: "+73333333333",
        })
      );

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
        startTs: day2,
        endTs: day2,
      });
      expect(sales).toHaveLength(1);
      expect(sales[0].clientPhone).toBe("+72222222222");
    });

    it("filters by phone search substring", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, { clientPhone: "+79991112233" })
      );
      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, { clientPhone: "+79994445566" })
      );
      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, { clientPhone: "+78001234567" })
      );

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
        phoneSearch: "999",
      });
      expect(sales).toHaveLength(2);
    });

    it("respects limit parameter", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      for (let i = 0; i < 10; i++) {
        await t.mutation(
          api.sales.create,
          makeSaleArgs(h.projectId, {
            clientPhone: `+7999${String(i).padStart(7, "0")}`,
          })
        );
      }

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
        limit: 3,
      });
      expect(sales).toHaveLength(3);
    });

    it("defaults limit to 50", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      for (let i = 0; i < 55; i++) {
        await t.mutation(
          api.sales.create,
          makeSaleArgs(h.projectId, {
            clientPhone: `+7000${String(i).padStart(7, "0")}`,
          })
        );
      }

      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
      });
      expect(sales).toHaveLength(50);
    });
  });

  describe("countByProject", () => {
    it("returns count of sales in project", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(api.sales.create, makeSaleArgs(h.projectId));
      await t.mutation(api.sales.create, makeSaleArgs(h.projectId));
      await t.mutation(api.sales.create, makeSaleArgs(h.projectId));

      const count = await t.query(api.sales.countByProject, {
        projectId: h.projectId,
      });
      expect(count).toBe(3);
    });

    it("returns count within date range", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const day1 = 1705276800000; // 2025-01-15
      const day2 = 1705363200000; // 2025-01-16
      const day3 = 1705449600000; // 2025-01-17

      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, { saleDate: day1, saleDateStr: "2025-01-15" })
      );
      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, { saleDate: day2, saleDateStr: "2025-01-16" })
      );
      await t.mutation(
        api.sales.create,
        makeSaleArgs(h.projectId, { saleDate: day3, saleDateStr: "2025-01-17" })
      );

      const count = await t.query(api.sales.countByProject, {
        projectId: h.projectId,
        startTs: day1,
        endTs: day2,
      });
      expect(count).toBe(2);
    });

    it("returns 0 for project with no sales", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const count = await t.query(api.sales.countByProject, {
        projectId: h.projectId,
      });
      expect(count).toBe(0);
    });
  });
});
