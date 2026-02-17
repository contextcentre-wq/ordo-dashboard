import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "../../../convex/schema";
import { api } from "../../../convex/_generated/api";
import { modules } from "./modules";

describe("convex/auth", () => {
  describe("register", () => {
    it("creates a new user and returns the user ID", async () => {
      const t = convexTest(schema, modules);
      const userId = await t.mutation(api.auth.register, {
        email: "test@example.com",
        name: "Test User",
      });
      expect(userId).toBeDefined();

      // Verify user exists in DB
      const user = await t.query(api.auth.getUser, { userId });
      expect(user).not.toBeNull();
      expect(user!.email).toBe("test@example.com");
      expect(user!.name).toBe("Test User");
    });

    it("creates a user with optional phone field", async () => {
      const t = convexTest(schema, modules);
      const userId = await t.mutation(api.auth.register, {
        email: "phone@example.com",
        name: "Phone User",
        phone: "+79991234567",
      });
      const user = await t.query(api.auth.getUser, { userId });
      expect(user!.phone).toBe("+79991234567");
    });

    it("throws 'Email already registered' for duplicate email", async () => {
      const t = convexTest(schema, modules);
      await t.mutation(api.auth.register, {
        email: "dup@example.com",
        name: "First User",
      });
      await expect(
        t.mutation(api.auth.register, {
          email: "dup@example.com",
          name: "Second User",
        })
      ).rejects.toThrow("Email already registered");
    });
  });

  describe("login", () => {
    it("finds user by email and returns user data", async () => {
      const t = convexTest(schema, modules);
      const userId = await t.mutation(api.auth.register, {
        email: "login@example.com",
        name: "Login User",
        phone: "+71112223344",
      });
      const result = await t.mutation(api.auth.login, {
        email: "login@example.com",
      });
      expect(result._id).toBe(userId);
      expect(result.email).toBe("login@example.com");
      expect(result.name).toBe("Login User");
      expect(result.phone).toBe("+71112223344");
    });

    it("throws 'User not found' for missing email", async () => {
      const t = convexTest(schema, modules);
      await expect(
        t.mutation(api.auth.login, { email: "nonexistent@example.com" })
      ).rejects.toThrow("User not found");
    });
  });

  describe("getUser", () => {
    it("returns user by ID", async () => {
      const t = convexTest(schema, modules);
      const userId = await t.mutation(api.auth.register, {
        email: "getuser@example.com",
        name: "Get User",
      });
      const user = await t.query(api.auth.getUser, { userId });
      expect(user).not.toBeNull();
      expect(user!._id).toBe(userId);
      expect(user!.email).toBe("getuser@example.com");
      expect(user!.name).toBe("Get User");
    });
  });
});
