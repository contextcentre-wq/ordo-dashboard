import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// List projects user is a member of
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const projects = await Promise.all(
      memberships.map((m) => ctx.db.get(m.projectId))
    );

    return projects.filter(Boolean);
  },
});

// Get single project with access check
export const get = query({
  args: { projectId: v.id("projects"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("members")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();
    if (!member) throw new Error("Access denied");

    return await ctx.db.get(args.projectId);
  },
});

// Create project + auto-create owner member
export const create = mutation({
  args: { name: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      ownerId: args.userId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("members", {
      userId: args.userId,
      projectId,
      role: "owner",
      status: "active",
      invitedAt: Date.now(),
      joinedAt: Date.now(),
    });

    return projectId;
  },
});

// Update project
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    crmProvider: v.optional(
      v.union(v.literal("amocrm"), v.literal("bitrix24"))
    ),
    crmConfig: v.optional(
      v.object({
        webhookSecret: v.optional(v.string()),
        apiBaseUrl: v.optional(v.string()),
        accessToken: v.optional(v.string()),
      })
    ),
    adPlatforms: v.optional(
      v.array(
        v.object({
          channel: v.string(),
          accountId: v.string(),
          accessToken: v.optional(v.string()),
          isActive: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // Access check: must be owner or admin
    const member = await ctx.db
      .query("members")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new Error("Access denied");
    }

    const { projectId, userId: _userId, ...patch } = args;
    await ctx.db.patch(projectId, patch);
  },
});

// Remove project
export const remove = mutation({
  args: { projectId: v.id("projects"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("members")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();
    if (!member || member.role !== "owner") {
      throw new Error("Only the owner can delete a project");
    }

    // Delete all members
    const members = await ctx.db
      .query("members")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const m of members) {
      await ctx.db.delete(m._id);
    }

    await ctx.db.delete(args.projectId);
  },
});
