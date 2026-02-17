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

function makeLeadArgs(
  projectId: any,
  overrides: Record<string, any> = {}
) {
  return {
    projectId,
    phone: "+79991112233",
    contactType: "whatsapp",
    leadType: "new",
    budget: 1000,
    status: "open",
    pipeline: "main",
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("convex/leads", () => {
  describe("create", () => {
    it("inserts lead with isQualified=false", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const leadId = await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId)
      );
      expect(leadId).toBeDefined();

      const leads = await t.query(api.leads.listByProject, {
        projectId: h.projectId,
      });
      expect(leads).toHaveLength(1);
      expect(leads[0].isQualified).toBe(false);
      expect(leads[0].phone).toBe("+79991112233");
    });

    it("auto-enriches ad names when adId provided", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { adId: h.adId })
      );

      const leads = await t.query(api.leads.listByProject, {
        projectId: h.projectId,
      });
      expect(leads[0].adName).toBe("Test Ad");
      expect(leads[0].adGroupName).toBe("Test Ad Group");
      expect(leads[0].campaignName).toBe("Test Campaign");
    });

    it("does not overwrite explicit ad names with enriched ones", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, {
          adId: h.adId,
          adName: "Custom Ad Name",
        })
      );

      const leads = await t.query(api.leads.listByProject, {
        projectId: h.projectId,
      });
      // Explicit name should be preserved (not overwritten by hierarchy)
      expect(leads[0].adName).toBe("Custom Ad Name");
    });

    it("creates lead without adId", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(api.leads.create, makeLeadArgs(h.projectId));

      const leads = await t.query(api.leads.listByProject, {
        projectId: h.projectId,
      });
      expect(leads[0].adId).toBeUndefined();
      expect(leads[0].adName).toBeUndefined();
    });
  });

  describe("upsertByExternalId", () => {
    it("creates new lead when externalDealId does not exist", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const leadId = await t.mutation(api.leads.upsertByExternalId, {
        ...makeLeadArgs(h.projectId),
        externalDealId: "deal-123",
      });
      expect(leadId).toBeDefined();

      const leads = await t.query(api.leads.listByProject, {
        projectId: h.projectId,
      });
      expect(leads).toHaveLength(1);
      expect(leads[0].externalDealId).toBe("deal-123");
      expect(leads[0].isQualified).toBe(false);
    });

    it("patches existing lead when externalDealId matches", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const leadId1 = await t.mutation(api.leads.upsertByExternalId, {
        ...makeLeadArgs(h.projectId, { budget: 1000 }),
        externalDealId: "deal-456",
      });

      const leadId2 = await t.mutation(api.leads.upsertByExternalId, {
        ...makeLeadArgs(h.projectId, { budget: 2000, status: "closed" }),
        externalDealId: "deal-456",
      });

      // Same ID returned
      expect(leadId2).toBe(leadId1);

      const leads = await t.query(api.leads.listByProject, {
        projectId: h.projectId,
      });
      expect(leads).toHaveLength(1);
      expect(leads[0].budget).toBe(2000);
      expect(leads[0].status).toBe("closed");
    });
  });

  describe("qualify", () => {
    it("sets isQualified=true and qualifiedAt", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const leadId = await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId)
      );

      await t.mutation(api.leads.qualify, { leadId });

      const leads = await t.query(api.leads.listByProject, {
        projectId: h.projectId,
      });
      expect(leads[0].isQualified).toBe(true);
      expect(leads[0].qualifiedAt).toBeDefined();
      expect(typeof leads[0].qualifiedAt).toBe("number");
    });
  });

  describe("listByProject", () => {
    it("returns leads filtered by date range", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const baseTime = 1700000000000;
      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { createdAt: baseTime, phone: "+71111111111" })
      );
      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, {
          createdAt: baseTime + 86400000,
          phone: "+72222222222",
        })
      );
      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, {
          createdAt: baseTime + 86400000 * 2,
          phone: "+73333333333",
        })
      );

      // Query only the middle day
      const leads = await t.query(api.leads.listByProject, {
        projectId: h.projectId,
        startTs: baseTime + 86400000,
        endTs: baseTime + 86400000,
      });
      expect(leads).toHaveLength(1);
      expect(leads[0].phone).toBe("+72222222222");
    });

    it("filters by phone search substring", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { phone: "+79991112233" })
      );
      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { phone: "+79994445566" })
      );
      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { phone: "+78001234567" })
      );

      const leads = await t.query(api.leads.listByProject, {
        projectId: h.projectId,
        phoneSearch: "999",
      });
      expect(leads).toHaveLength(2);
    });

    it("defaults limit to 50", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      // Create many leads
      for (let i = 0; i < 55; i++) {
        await t.mutation(
          api.leads.create,
          makeLeadArgs(h.projectId, { phone: `+7000000${String(i).padStart(4, "0")}` })
        );
      }

      const leads = await t.query(api.leads.listByProject, {
        projectId: h.projectId,
      });
      expect(leads).toHaveLength(50);
    });

    it("respects custom limit", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      for (let i = 0; i < 10; i++) {
        await t.mutation(
          api.leads.create,
          makeLeadArgs(h.projectId, { phone: `+7999${String(i).padStart(7, "0")}` })
        );
      }

      const leads = await t.query(api.leads.listByProject, {
        projectId: h.projectId,
        limit: 3,
      });
      expect(leads).toHaveLength(3);
    });
  });

  describe("listQualifiedByProject", () => {
    it("returns only qualified leads", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const leadId1 = await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { phone: "+71111111111" })
      );
      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { phone: "+72222222222" })
      );

      // Qualify only the first lead
      await t.mutation(api.leads.qualify, { leadId: leadId1 });

      const qualified = await t.query(api.leads.listQualifiedByProject, {
        projectId: h.projectId,
      });
      expect(qualified).toHaveLength(1);
      expect(qualified[0].phone).toBe("+71111111111");
      expect(qualified[0].isQualified).toBe(true);
    });

    it("returns empty when no leads are qualified", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId)
      );

      const qualified = await t.query(api.leads.listQualifiedByProject, {
        projectId: h.projectId,
      });
      expect(qualified).toHaveLength(0);
    });
  });

  describe("countByProject", () => {
    it("returns count of leads in project", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { phone: "+71111111111" })
      );
      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { phone: "+72222222222" })
      );
      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { phone: "+73333333333" })
      );

      const count = await t.query(api.leads.countByProject, {
        projectId: h.projectId,
      });
      expect(count).toBe(3);
    });

    it("returns count within date range", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const baseTime = 1700000000000;
      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { createdAt: baseTime })
      );
      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { createdAt: baseTime + 86400000 })
      );
      await t.mutation(
        api.leads.create,
        makeLeadArgs(h.projectId, { createdAt: baseTime + 86400000 * 5 })
      );

      const count = await t.query(api.leads.countByProject, {
        projectId: h.projectId,
        startTs: baseTime,
        endTs: baseTime + 86400000,
      });
      expect(count).toBe(2);
    });

    it("returns 0 for project with no leads", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const count = await t.query(api.leads.countByProject, {
        projectId: h.projectId,
      });
      expect(count).toBe(0);
    });
  });
});
