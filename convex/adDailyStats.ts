import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const statsFields = {
  adId: v.id("ads"),
  projectId: v.id("projects"),
  date: v.string(),
  dateTs: v.number(),
  impressions: v.number(),
  clicks: v.number(),
  spend: v.number(),
  leads: v.number(),
  results: v.number(),
  whatsappRequests: v.number(),
  appointmentsScheduled: v.number(),
  treatmentsCompleted: v.number(),
  plansSent: v.number(),
  reach: v.number(),
};

export const upsert = mutation({
  args: statsFields,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adDailyStats")
      .withIndex("by_ad_date", (q) =>
        q.eq("adId", args.adId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("adDailyStats", args);
  },
});

export const upsertBatch = mutation({
  args: {
    records: v.array(v.object(statsFields)),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const record of args.records) {
      const existing = await ctx.db
        .query("adDailyStats")
        .withIndex("by_ad_date", (q) =>
          q.eq("adId", record.adId).eq("date", record.date)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, record);
        ids.push(existing._id);
      } else {
        ids.push(await ctx.db.insert("adDailyStats", record));
      }
    }
    return ids;
  },
});

export const getByProjectDateRange = query({
  args: {
    projectId: v.id("projects"),
    startTs: v.number(),
    endTs: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adDailyStats")
      .withIndex("by_project_date", (q) =>
        q
          .eq("projectId", args.projectId)
          .gte("dateTs", args.startTs)
          .lte("dateTs", args.endTs)
      )
      .collect();
  },
});

export const getByAdDateRange = query({
  args: {
    adId: v.id("ads"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adDailyStats")
      .withIndex("by_ad_date", (q) =>
        q
          .eq("adId", args.adId)
          .gte("date", args.startDate)
          .lte("date", args.endDate)
      )
      .collect();
  },
});
