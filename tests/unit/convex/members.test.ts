import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "../../../convex/schema";
import { api } from "../../../convex/_generated/api";
import { modules } from "./modules";

async function setupProjectWithOwner(t: any) {
  const userId = await t.mutation(api.auth.register, {
    email: "owner@example.com",
    name: "Owner User",
    phone: "+70001112233",
  });
  const projectId = await t.mutation(api.projects.create, {
    name: "Test Project",
    userId,
  });
  return { userId, projectId };
}

describe("convex/members", () => {
  describe("listByProject", () => {
    it("returns enriched members with email, name, phone, role, status", async () => {
      const t = convexTest(schema, modules);
      const { userId, projectId } = await setupProjectWithOwner(t);

      const members = await t.query(api.members.listByProject, {
        projectId,
        userId,
      });
      expect(members).toHaveLength(1);

      const ownerMember = members[0];
      expect(ownerMember.email).toBe("owner@example.com");
      expect(ownerMember.name).toBe("Owner User");
      expect(ownerMember.phone).toBe("+70001112233");
      expect(ownerMember.role).toBe("owner");
      expect(ownerMember.status).toBe("active");
      expect(ownerMember.userId).toBe(userId);
    });

    it("throws 'Access denied' for non-member", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProjectWithOwner(t);
      const otherId = await t.mutation(api.auth.register, {
        email: "other@example.com",
        name: "Other",
      });
      await expect(
        t.query(api.members.listByProject, {
          projectId,
          userId: otherId,
        })
      ).rejects.toThrow("Access denied");
    });
  });

  describe("invite", () => {
    it("creates an invited member record", async () => {
      const t = convexTest(schema, modules);
      const { userId, projectId } = await setupProjectWithOwner(t);

      const memberId = await t.mutation(api.members.invite, {
        projectId,
        userId,
        email: "invited@example.com",
        role: "user",
      });
      expect(memberId).toBeDefined();

      const members = await t.query(api.members.listByProject, {
        projectId,
        userId,
      });
      expect(members).toHaveLength(2);
      const invitedMember = members.find(
        (m: any) => m.email === "invited@example.com"
      );
      expect(invitedMember).toBeDefined();
      expect(invitedMember!.role).toBe("user");
      expect(invitedMember!.status).toBe("invited");
    });

    it("creates a user record if email not found", async () => {
      const t = convexTest(schema, modules);
      const { userId, projectId } = await setupProjectWithOwner(t);

      await t.mutation(api.members.invite, {
        projectId,
        userId,
        email: "newuser@example.com",
        phone: "+79998887766",
        role: "admin",
      });

      // The new user should be findable via login
      const loginResult = await t.mutation(api.auth.login, {
        email: "newuser@example.com",
      });
      expect(loginResult.email).toBe("newuser@example.com");
    });

    it("uses existing user if email already exists", async () => {
      const t = convexTest(schema, modules);
      const { userId, projectId } = await setupProjectWithOwner(t);
      const existingUserId = await t.mutation(api.auth.register, {
        email: "existing@example.com",
        name: "Existing User",
      });

      await t.mutation(api.members.invite, {
        projectId,
        userId,
        email: "existing@example.com",
        role: "user",
      });

      const members = await t.query(api.members.listByProject, {
        projectId,
        userId,
      });
      const invitedMember = members.find(
        (m: any) => m.email === "existing@example.com"
      );
      expect(invitedMember!.userId).toBe(existingUserId);
    });

    it("prevents duplicate membership", async () => {
      const t = convexTest(schema, modules);
      const { userId, projectId } = await setupProjectWithOwner(t);

      await t.mutation(api.members.invite, {
        projectId,
        userId,
        email: "dup@example.com",
        role: "user",
      });

      await expect(
        t.mutation(api.members.invite, {
          projectId,
          userId,
          email: "dup@example.com",
          role: "admin",
        })
      ).rejects.toThrow("User is already a member of this project");
    });

    it("only owner/admin can invite", async () => {
      const t = convexTest(schema, modules);
      const { userId: ownerId, projectId } = await setupProjectWithOwner(t);

      // Invite a regular user
      const regularId = await t.mutation(api.auth.register, {
        email: "regular@example.com",
        name: "Regular",
      });
      await t.mutation(api.members.invite, {
        projectId,
        userId: ownerId,
        email: "regular@example.com",
        role: "user",
      });

      // Regular user should not be able to invite
      await expect(
        t.mutation(api.members.invite, {
          projectId,
          userId: regularId,
          email: "target@example.com",
          role: "user",
        })
      ).rejects.toThrow("Only owner/admin can invite members");
    });
  });

  describe("updateRole", () => {
    it("changes role to admin", async () => {
      const t = convexTest(schema, modules);
      const { userId: ownerId, projectId } = await setupProjectWithOwner(t);

      const memberId = await t.mutation(api.members.invite, {
        projectId,
        userId: ownerId,
        email: "user@example.com",
        role: "user",
      });

      await t.mutation(api.members.updateRole, {
        memberId,
        userId: ownerId,
        newRole: "admin",
      });

      const members = await t.query(api.members.listByProject, {
        projectId,
        userId: ownerId,
      });
      const updated = members.find((m: any) => m.email === "user@example.com");
      expect(updated!.role).toBe("admin");
    });

    it("changes role to user", async () => {
      const t = convexTest(schema, modules);
      const { userId: ownerId, projectId } = await setupProjectWithOwner(t);

      const memberId = await t.mutation(api.members.invite, {
        projectId,
        userId: ownerId,
        email: "admin@example.com",
        role: "admin",
      });

      await t.mutation(api.members.updateRole, {
        memberId,
        userId: ownerId,
        newRole: "user",
      });

      const members = await t.query(api.members.listByProject, {
        projectId,
        userId: ownerId,
      });
      const updated = members.find(
        (m: any) => m.email === "admin@example.com"
      );
      expect(updated!.role).toBe("user");
    });

    it("cannot change owner's role", async () => {
      const t = convexTest(schema, modules);
      const { userId: ownerId, projectId } = await setupProjectWithOwner(t);

      // Get the owner's member record
      const members = await t.query(api.members.listByProject, {
        projectId,
        userId: ownerId,
      });
      const ownerMember = members.find((m: any) => m.role === "owner");

      await expect(
        t.mutation(api.members.updateRole, {
          memberId: ownerMember!._id,
          userId: ownerId,
          newRole: "admin",
        })
      ).rejects.toThrow("Cannot change the owner's role");
    });

    it("only owner/admin can change roles", async () => {
      const t = convexTest(schema, modules);
      const { userId: ownerId, projectId } = await setupProjectWithOwner(t);

      // Invite regular user and another user
      const regularId = await t.mutation(api.auth.register, {
        email: "regular2@example.com",
        name: "Regular",
      });
      await t.mutation(api.members.invite, {
        projectId,
        userId: ownerId,
        email: "regular2@example.com",
        role: "user",
      });
      const targetMemberId = await t.mutation(api.members.invite, {
        projectId,
        userId: ownerId,
        email: "target2@example.com",
        role: "user",
      });

      await expect(
        t.mutation(api.members.updateRole, {
          memberId: targetMemberId,
          userId: regularId,
          newRole: "admin",
        })
      ).rejects.toThrow("Only owner/admin can change roles");
    });
  });

  describe("remove", () => {
    it("deletes member record", async () => {
      const t = convexTest(schema, modules);
      const { userId: ownerId, projectId } = await setupProjectWithOwner(t);

      const memberId = await t.mutation(api.members.invite, {
        projectId,
        userId: ownerId,
        email: "removable@example.com",
        role: "user",
      });

      await t.mutation(api.members.remove, {
        memberId,
        userId: ownerId,
      });

      const members = await t.query(api.members.listByProject, {
        projectId,
        userId: ownerId,
      });
      expect(members).toHaveLength(1); // only the owner remains
      expect(members[0].role).toBe("owner");
    });

    it("cannot remove owner", async () => {
      const t = convexTest(schema, modules);
      const { userId: ownerId, projectId } = await setupProjectWithOwner(t);

      const members = await t.query(api.members.listByProject, {
        projectId,
        userId: ownerId,
      });
      const ownerMember = members.find((m: any) => m.role === "owner");

      await expect(
        t.mutation(api.members.remove, {
          memberId: ownerMember!._id,
          userId: ownerId,
        })
      ).rejects.toThrow("Cannot remove the project owner");
    });

    it("only owner/admin can remove members", async () => {
      const t = convexTest(schema, modules);
      const { userId: ownerId, projectId } = await setupProjectWithOwner(t);

      const regularId = await t.mutation(api.auth.register, {
        email: "regular3@example.com",
        name: "Regular",
      });
      await t.mutation(api.members.invite, {
        projectId,
        userId: ownerId,
        email: "regular3@example.com",
        role: "user",
      });
      const targetMemberId = await t.mutation(api.members.invite, {
        projectId,
        userId: ownerId,
        email: "target3@example.com",
        role: "user",
      });

      await expect(
        t.mutation(api.members.remove, {
          memberId: targetMemberId,
          userId: regularId,
        })
      ).rejects.toThrow("Only owner/admin can remove members");
    });
  });
});
