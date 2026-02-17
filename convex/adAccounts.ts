import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    externalAccountId: v.string(),
    name: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("adAccounts", {
      projectId: args.projectId,
      externalAccountId: args.externalAccountId,
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
      .query("adAccounts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const update = mutation({
  args: {
    accountId: v.id("adAccounts"),
    name: v.optional(v.string()),
    channel: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { accountId, ...patch } = args;
    await ctx.db.patch(accountId, patch);
  },
});

export const toggleActive = mutation({
  args: {
    accountId: v.id("adAccounts"),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error(`Ad account ${args.accountId} not found`);
    }
    await ctx.db.patch(args.accountId, { isActive: !account.isActive });
  },
});
