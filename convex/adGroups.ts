import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    campaignId: v.id("campaigns"),
    projectId: v.id("projects"),
    externalAdsetId: v.optional(v.string()),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("adGroups", {
      campaignId: args.campaignId,
      projectId: args.projectId,
      externalAdsetId: args.externalAdsetId,
      name: args.name,
      isActive: true,
    });
    return id;
  },
});

export const listByCampaign = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adGroups")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
  },
});

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adGroups")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const update = mutation({
  args: {
    adGroupId: v.id("adGroups"),
    name: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { adGroupId, ...patch } = args;
    await ctx.db.patch(adGroupId, patch);
  },
});

export const toggleActive = mutation({
  args: {
    adGroupId: v.id("adGroups"),
  },
  handler: async (ctx, args) => {
    const adGroup = await ctx.db.get(args.adGroupId);
    if (!adGroup) {
      throw new Error(`Ad group ${args.adGroupId} not found`);
    }
    await ctx.db.patch(args.adGroupId, { isActive: !adGroup.isActive });
  },
});
