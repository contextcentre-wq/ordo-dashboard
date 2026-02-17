import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    adGroupId: v.id("adGroups"),
    campaignId: v.id("campaigns"),
    projectId: v.id("projects"),
    externalAdId: v.string(),
    name: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("ads", {
      adGroupId: args.adGroupId,
      campaignId: args.campaignId,
      projectId: args.projectId,
      externalAdId: args.externalAdId,
      name: args.name,
      channel: args.channel,
      isActive: true,
    });
    return id;
  },
});

export const listByGroup = query({
  args: {
    adGroupId: v.id("adGroups"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ads")
      .withIndex("by_adGroup", (q) => q.eq("adGroupId", args.adGroupId))
      .collect();
  },
});

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ads")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getByExternalId = query({
  args: {
    externalAdId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ads")
      .withIndex("by_external_id", (q) =>
        q.eq("externalAdId", args.externalAdId)
      )
      .first();
  },
});

export const update = mutation({
  args: {
    adId: v.id("ads"),
    name: v.optional(v.string()),
    channel: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { adId, ...patch } = args;
    await ctx.db.patch(adId, patch);

    // Cascade update denormalized adName on related leads and sales
    if (patch.name !== undefined) {
      const relatedLeads = await ctx.db
        .query("leads")
        .withIndex("by_ad", (q) => q.eq("adId", adId))
        .collect();
      for (const lead of relatedLeads) {
        await ctx.db.patch(lead._id, { adName: patch.name });
      }

      const relatedSales = await ctx.db
        .query("sales")
        .withIndex("by_ad", (q) => q.eq("adId", adId))
        .collect();
      for (const sale of relatedSales) {
        await ctx.db.patch(sale._id, { adName: patch.name });
      }
    }
  },
});

export const toggleActive = mutation({
  args: {
    adId: v.id("ads"),
  },
  handler: async (ctx, args) => {
    const ad = await ctx.db.get(args.adId);
    if (!ad) {
      throw new Error(`Ad ${args.adId} not found`);
    }
    await ctx.db.patch(args.adId, { isActive: !ad.isActive });
  },
});
