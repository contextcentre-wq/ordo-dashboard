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

function makeStatRecord(
  adId: any,
  projectId: any,
  date: string,
  dateTs: number,
  overrides: Partial<{
    impressions: number;
    clicks: number;
    spend: number;
    leads: number;
    results: number;
    whatsappRequests: number;
    appointmentsScheduled: number;
    treatmentsCompleted: number;
    plansSent: number;
    reach: number;
  }> = {}
) {
  return {
    adId,
    projectId,
    date,
    dateTs,
    impressions: overrides.impressions ?? 1000,
    clicks: overrides.clicks ?? 100,
    spend: overrides.spend ?? 50,
    leads: overrides.leads ?? 10,
    results: overrides.results ?? 5,
    whatsappRequests: overrides.whatsappRequests ?? 3,
    appointmentsScheduled: overrides.appointmentsScheduled ?? 2,
    treatmentsCompleted: overrides.treatmentsCompleted ?? 1,
    plansSent: overrides.plansSent ?? 1,
    reach: overrides.reach ?? 800,
  };
}

describe("convex/adDailyStats", () => {
  describe("upsert", () => {
    it("inserts a new stat record", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const statId = await t.mutation(
        api.adDailyStats.upsert,
        makeStatRecord(h.adId, h.projectId, "2025-01-15", 1736899200000)
      );
      expect(statId).toBeDefined();

      const stats = await t.query(api.adDailyStats.getByProjectDateRange, {
        projectId: h.projectId,
        startTs: 1736899200000,
        endTs: 1736899200000,
      });
      expect(stats).toHaveLength(1);
      expect(stats[0].impressions).toBe(1000);
      expect(stats[0].clicks).toBe(100);
      expect(stats[0].date).toBe("2025-01-15");
    });

    it("updates existing record (idempotent by adId+date)", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const statId1 = await t.mutation(
        api.adDailyStats.upsert,
        makeStatRecord(h.adId, h.projectId, "2025-01-15", 1736899200000, {
          impressions: 1000,
        })
      );

      const statId2 = await t.mutation(
        api.adDailyStats.upsert,
        makeStatRecord(h.adId, h.projectId, "2025-01-15", 1736899200000, {
          impressions: 2000,
        })
      );

      // Should return the same ID (update, not insert)
      expect(statId2).toBe(statId1);

      const stats = await t.query(api.adDailyStats.getByProjectDateRange, {
        projectId: h.projectId,
        startTs: 1736899200000,
        endTs: 1736899200000,
      });
      expect(stats).toHaveLength(1);
      expect(stats[0].impressions).toBe(2000);
    });
  });

  describe("upsertBatch", () => {
    it("processes an array of records", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const records = [
        makeStatRecord(h.adId, h.projectId, "2025-01-15", 1736899200000, {
          impressions: 100,
        }),
        makeStatRecord(h.adId, h.projectId, "2025-01-16", 1736985600000, {
          impressions: 200,
        }),
        makeStatRecord(h.adId, h.projectId, "2025-01-17", 1737072000000, {
          impressions: 300,
        }),
      ];

      const ids = await t.mutation(api.adDailyStats.upsertBatch, { records });
      expect(ids).toHaveLength(3);

      const stats = await t.query(api.adDailyStats.getByProjectDateRange, {
        projectId: h.projectId,
        startTs: 1736899200000,
        endTs: 1737072000000,
      });
      expect(stats).toHaveLength(3);
    });

    it("updates existing records in batch", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      // Insert first
      await t.mutation(api.adDailyStats.upsertBatch, {
        records: [
          makeStatRecord(h.adId, h.projectId, "2025-01-15", 1736899200000, {
            impressions: 100,
          }),
        ],
      });

      // Upsert with updated data
      await t.mutation(api.adDailyStats.upsertBatch, {
        records: [
          makeStatRecord(h.adId, h.projectId, "2025-01-15", 1736899200000, {
            impressions: 999,
          }),
          makeStatRecord(h.adId, h.projectId, "2025-01-16", 1736985600000, {
            impressions: 200,
          }),
        ],
      });

      const stats = await t.query(api.adDailyStats.getByProjectDateRange, {
        projectId: h.projectId,
        startTs: 1736899200000,
        endTs: 1736985600000,
      });
      expect(stats).toHaveLength(2);
      const day15 = stats.find((s: any) => s.date === "2025-01-15");
      expect(day15!.impressions).toBe(999);
    });
  });

  describe("getByProjectDateRange", () => {
    it("filters by projectId and dateTs range", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(api.adDailyStats.upsertBatch, {
        records: [
          makeStatRecord(h.adId, h.projectId, "2025-01-10", 1736467200000),
          makeStatRecord(h.adId, h.projectId, "2025-01-15", 1736899200000),
          makeStatRecord(h.adId, h.projectId, "2025-01-20", 1737331200000),
        ],
      });

      // Query only the middle date
      const stats = await t.query(api.adDailyStats.getByProjectDateRange, {
        projectId: h.projectId,
        startTs: 1736899200000,
        endTs: 1736899200000,
      });
      expect(stats).toHaveLength(1);
      expect(stats[0].date).toBe("2025-01-15");
    });

    it("returns empty for range with no data", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const stats = await t.query(api.adDailyStats.getByProjectDateRange, {
        projectId: h.projectId,
        startTs: 1000000000000,
        endTs: 1000000000001,
      });
      expect(stats).toHaveLength(0);
    });
  });

  describe("getByAdDateRange", () => {
    it("filters by adId and date string range", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(api.adDailyStats.upsertBatch, {
        records: [
          makeStatRecord(h.adId, h.projectId, "2025-01-10", 1736467200000),
          makeStatRecord(h.adId, h.projectId, "2025-01-15", 1736899200000),
          makeStatRecord(h.adId, h.projectId, "2025-01-20", 1737331200000),
        ],
      });

      const stats = await t.query(api.adDailyStats.getByAdDateRange, {
        adId: h.adId,
        startDate: "2025-01-14",
        endDate: "2025-01-16",
      });
      expect(stats).toHaveLength(1);
      expect(stats[0].date).toBe("2025-01-15");
    });

    it("returns all stats within inclusive range", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(api.adDailyStats.upsertBatch, {
        records: [
          makeStatRecord(h.adId, h.projectId, "2025-01-10", 1736467200000),
          makeStatRecord(h.adId, h.projectId, "2025-01-15", 1736899200000),
          makeStatRecord(h.adId, h.projectId, "2025-01-20", 1737331200000),
        ],
      });

      const stats = await t.query(api.adDailyStats.getByAdDateRange, {
        adId: h.adId,
        startDate: "2025-01-10",
        endDate: "2025-01-20",
      });
      expect(stats).toHaveLength(3);
    });
  });
});
