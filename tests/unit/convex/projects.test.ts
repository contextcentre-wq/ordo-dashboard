import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "../../../convex/schema";
import { api } from "../../../convex/_generated/api";
import { modules } from "./modules";

describe("convex/projects", () => {
  describe("create", () => {
    it("inserts project and auto-creates owner member", async () => {
      const t = convexTest(schema, modules);
      const userId = await t.mutation(api.auth.register, {
        email: "owner@example.com",
        name: "Owner",
      });
      const projectId = await t.mutation(api.projects.create, {
        name: "Test Project",
        userId,
      });
      expect(projectId).toBeDefined();

      // Verify project exists
      const project = await t.query(api.projects.get, { projectId, userId });
      expect(project).not.toBeNull();
      expect(project!.name).toBe("Test Project");
      expect(project!.ownerId).toBe(userId);

      // Verify owner member was auto-created
      const members = await t.query(api.members.listByProject, {
        projectId,
        userId,
      });
      expect(members).toHaveLength(1);
      expect(members[0].role).toBe("owner");
      expect(members[0].status).toBe("active");
      expect(members[0].userId).toBe(userId);
    });

    it("returns the projectId", async () => {
      const t = convexTest(schema, modules);
      const userId = await t.mutation(api.auth.register, {
        email: "user@example.com",
        name: "User",
      });
      const projectId = await t.mutation(api.projects.create, {
        name: "My Project",
        userId,
      });
      expect(typeof projectId).toBe("string");
    });
  });

  describe("list", () => {
    it("returns projects user is member of", async () => {
      const t = convexTest(schema, modules);
      const userId = await t.mutation(api.auth.register, {
        email: "list@example.com",
        name: "List User",
      });
      await t.mutation(api.projects.create, { name: "Project A", userId });
      await t.mutation(api.projects.create, { name: "Project B", userId });

      const projects = await t.query(api.projects.list, { userId });
      expect(projects).toHaveLength(2);
      const names = projects.map((p: any) => p.name);
      expect(names).toContain("Project A");
      expect(names).toContain("Project B");
    });

    it("returns empty array for user with no projects", async () => {
      const t = convexTest(schema, modules);
      const userId = await t.mutation(api.auth.register, {
        email: "noproj@example.com",
        name: "No Projects",
      });
      const projects = await t.query(api.projects.list, { userId });
      expect(projects).toHaveLength(0);
    });
  });

  describe("get", () => {
    it("returns project with access check for member", async () => {
      const t = convexTest(schema, modules);
      const userId = await t.mutation(api.auth.register, {
        email: "get@example.com",
        name: "Get User",
      });
      const projectId = await t.mutation(api.projects.create, {
        name: "My Project",
        userId,
      });
      const project = await t.query(api.projects.get, { projectId, userId });
      expect(project).not.toBeNull();
      expect(project!.name).toBe("My Project");
    });

    it("throws 'Access denied' for non-member", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await t.mutation(api.auth.register, {
        email: "owner@example.com",
        name: "Owner",
      });
      const otherId = await t.mutation(api.auth.register, {
        email: "other@example.com",
        name: "Other",
      });
      const projectId = await t.mutation(api.projects.create, {
        name: "Private Project",
        userId: ownerId,
      });
      await expect(
        t.query(api.projects.get, { projectId, userId: otherId })
      ).rejects.toThrow("Access denied");
    });
  });

  describe("update", () => {
    it("patches name for owner", async () => {
      const t = convexTest(schema, modules);
      const userId = await t.mutation(api.auth.register, {
        email: "upd@example.com",
        name: "Updater",
      });
      const projectId = await t.mutation(api.projects.create, {
        name: "Old Name",
        userId,
      });
      await t.mutation(api.projects.update, {
        projectId,
        userId,
        name: "New Name",
      });
      const project = await t.query(api.projects.get, { projectId, userId });
      expect(project!.name).toBe("New Name");
    });

    it("patches crmProvider and crmConfig for admin", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await t.mutation(api.auth.register, {
        email: "owner2@example.com",
        name: "Owner",
      });
      const projectId = await t.mutation(api.projects.create, {
        name: "CRM Project",
        userId: ownerId,
      });
      // Invite an admin
      const adminId = await t.mutation(api.auth.register, {
        email: "admin@example.com",
        name: "Admin",
      });
      await t.mutation(api.members.invite, {
        projectId,
        userId: ownerId,
        email: "admin@example.com",
        role: "admin",
      });
      // Admin updates the project
      await t.mutation(api.projects.update, {
        projectId,
        userId: adminId,
        crmProvider: "amocrm",
        crmConfig: {
          webhookSecret: "secret123",
          apiBaseUrl: "https://api.amocrm.ru",
        },
      });
      const project = await t.query(api.projects.get, {
        projectId,
        userId: ownerId,
      });
      expect(project!.crmProvider).toBe("amocrm");
      expect(project!.crmConfig?.webhookSecret).toBe("secret123");
    });

    it("throws 'Access denied' for non-member", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await t.mutation(api.auth.register, {
        email: "owner3@example.com",
        name: "Owner",
      });
      const otherId = await t.mutation(api.auth.register, {
        email: "other3@example.com",
        name: "Other",
      });
      const projectId = await t.mutation(api.projects.create, {
        name: "Locked Project",
        userId: ownerId,
      });
      await expect(
        t.mutation(api.projects.update, {
          projectId,
          userId: otherId,
          name: "Hacked Name",
        })
      ).rejects.toThrow("Access denied");
    });

    it("throws 'Access denied' for regular user", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await t.mutation(api.auth.register, {
        email: "owner4@example.com",
        name: "Owner",
      });
      const projectId = await t.mutation(api.projects.create, {
        name: "Team Project",
        userId: ownerId,
      });
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
      await expect(
        t.mutation(api.projects.update, {
          projectId,
          userId: regularId,
          name: "Attempt",
        })
      ).rejects.toThrow("Access denied");
    });
  });

  describe("remove", () => {
    it("deletes project and all members when owner calls", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await t.mutation(api.auth.register, {
        email: "rmowner@example.com",
        name: "Owner",
      });
      const projectId = await t.mutation(api.projects.create, {
        name: "To Delete",
        userId: ownerId,
      });
      // Invite another member
      await t.mutation(api.members.invite, {
        projectId,
        userId: ownerId,
        email: "invited@example.com",
        role: "user",
      });

      await t.mutation(api.projects.remove, { projectId, userId: ownerId });

      // Project should be gone
      await expect(
        t.query(api.projects.get, { projectId, userId: ownerId })
      ).rejects.toThrow("Access denied");
    });

    it("throws when non-owner tries to delete", async () => {
      const t = convexTest(schema, modules);
      const ownerId = await t.mutation(api.auth.register, {
        email: "rmowner2@example.com",
        name: "Owner",
      });
      const adminId = await t.mutation(api.auth.register, {
        email: "rmadmin@example.com",
        name: "Admin",
      });
      const projectId = await t.mutation(api.projects.create, {
        name: "Keep This",
        userId: ownerId,
      });
      await t.mutation(api.members.invite, {
        projectId,
        userId: ownerId,
        email: "rmadmin@example.com",
        role: "admin",
      });
      await expect(
        t.mutation(api.projects.remove, { projectId, userId: adminId })
      ).rejects.toThrow("Only the owner can delete a project");
    });
  });
});
