import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToArrayBuffer(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return arrayBufferToHex(derived);
}

function generateSalt(): string {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  return arrayBufferToHex(saltBytes.buffer);
}

// Register: create a user record with hashed password, return the user ID
export const register = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      throw new Error("Email already registered");
    }
    if (args.password.length < 6) {
      throw new Error("Password too short");
    }
    const salt = generateSalt();
    const passwordHash = await hashPassword(args.password, salt);
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      phone: args.phone,
      passwordHash,
      salt,
    });
    return userId;
  },
});

// Login: find user by email, verify password, return user data
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user) {
      throw new Error("User not found");
    }
    if (!user.passwordHash || !user.salt) {
      // Legacy user without password — set password on first login
      const salt = generateSalt();
      const passwordHash = await hashPassword(args.password, salt);
      await ctx.db.patch(user._id, { passwordHash, salt });
    } else {
      const hash = await hashPassword(args.password, user.salt);
      if (hash !== user.passwordHash) {
        throw new Error("Invalid password");
      }
    }
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    };
  },
});

// Get current user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
