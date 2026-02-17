import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    adAccountId: v.id("adAccounts"),
    externalCampaignId: v.optional(v.string()),
    name: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("campaigns", {
      projectId: args.projectId,
      adAccountId: args.adAccountId,
      externalCampaignId: args.externalCampaignId,
      name: args.name,
      channel: args.channel,
      isActive: true,
    });
    return id;
  },
});

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const listByAccount = query({
  args: {
    adAccountId: v.id("adAccounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_account", (q) => q.eq("adAccountId", args.adAccountId))
      .collect();
  },
});

export const update = mutation({
  args: {
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    channel: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { campaignId, ...patch } = args;
    await ctx.db.patch(campaignId, patch);
  },
});

export const toggleActive = mutation({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${args.campaignId} not found`);
    }
    await ctx.db.patch(args.campaignId, { isActive: !campaign.isActive });
  },
});
