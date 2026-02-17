import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// List members of a project
export const listByProject = query({
  args: { projectId: v.id("projects"), userId: v.id("users") },
  handler: async (ctx, args) => {
    // Access check
    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();
    if (!currentMember) throw new Error("Access denied");

    const members = await ctx.db
      .query("members")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Enrich with user info
    const enriched = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          _id: m._id,
          phone: user?.phone ?? "",
          email: user?.email ?? "",
          name: user?.name ?? "",
          status: m.status,
          role: m.role,
          invitedAt: m.invitedAt,
          joinedAt: m.joinedAt,
          userId: m.userId,
        };
      })
    );

    return enriched;
  },
});

// Invite a member by email (create user if needed, create member record)
export const invite = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"), // the inviter
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    // Access check: only owner/admin can invite
    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();
    if (
      !currentMember ||
      (currentMember.role !== "owner" && currentMember.role !== "admin")
    ) {
      throw new Error("Only owner/admin can invite members");
    }

    // Find or create user by email
    const existingInvitee = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    const inviteeId = existingInvitee
      ? existingInvitee._id
      : await ctx.db.insert("users", {
          email: args.email,
          phone: args.phone,
        });

    // Check if already a member
    const existingMember = await ctx.db
      .query("members")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", inviteeId)
      )
      .first();
    if (existingMember) {
      throw new Error("User is already a member of this project");
    }

    const memberId = await ctx.db.insert("members", {
      userId: inviteeId,
      projectId: args.projectId,
      role: args.role,
      status: "invited",
      invitedAt: Date.now(),
    });

    return memberId;
  },
});

// Update member role
export const updateRole = mutation({
  args: {
    memberId: v.id("members"),
    userId: v.id("users"), // the requester
    newRole: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    // Access check
    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", member.projectId).eq("userId", args.userId)
      )
      .first();
    if (
      !currentMember ||
      (currentMember.role !== "owner" && currentMember.role !== "admin")
    ) {
      throw new Error("Only owner/admin can change roles");
    }

    // Can't change owner's role
    if (member.role === "owner") {
      throw new Error("Cannot change the owner's role");
    }

    await ctx.db.patch(args.memberId, { role: args.newRole });
  },
});

// Remove member
export const remove = mutation({
  args: {
    memberId: v.id("members"),
    userId: v.id("users"), // the requester
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    // Access check
    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", member.projectId).eq("userId", args.userId)
      )
      .first();
    if (
      !currentMember ||
      (currentMember.role !== "owner" && currentMember.role !== "admin")
    ) {
      throw new Error("Only owner/admin can remove members");
    }

    // Can't remove owner
    if (member.role === "owner") {
      throw new Error("Cannot remove the project owner");
    }

    await ctx.db.delete(args.memberId);
  },
});
