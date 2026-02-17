import { describe, it, expect } from "vitest";
import {
  computeMatchQuality,
  computeDaysToSale,
} from "../../../convex/lib/normalization";

// ---------------------------------------------------------------------------
// computeMatchQuality
// ---------------------------------------------------------------------------
describe("computeMatchQuality", () => {
  describe("returns 'exact' when adId is truthy", () => {
    it("with adId string and channel string", () => {
      expect(computeMatchQuality("ad_123", "facebook")).toBe("exact");
    });

    it("with adId string and channel null", () => {
      expect(computeMatchQuality("ad_123", null)).toBe("exact");
    });

    it("with adId string and channel undefined", () => {
      expect(computeMatchQuality("ad_123", undefined)).toBe("exact");
    });

    it("with adId string and channel empty string", () => {
      expect(computeMatchQuality("ad_123", "")).toBe("exact");
    });
  });

  describe("returns 'channel_only' when adId is falsy but channel is truthy", () => {
    it("with adId null and channel string", () => {
      expect(computeMatchQuality(null, "facebook")).toBe("channel_only");
    });

    it("with adId undefined and channel string", () => {
      expect(computeMatchQuality(undefined, "facebook")).toBe("channel_only");
    });

    it("with adId empty string and channel string", () => {
      expect(computeMatchQuality("", "google")).toBe("channel_only");
    });

    it("with adId null and channel string", () => {
      expect(computeMatchQuality(null, "instagram")).toBe("channel_only");
    });
  });

  describe("returns 'none' when both are falsy", () => {
    it("with both null", () => {
      expect(computeMatchQuality(null, null)).toBe("none");
    });

    it("with both undefined", () => {
      expect(computeMatchQuality(undefined, undefined)).toBe("none");
    });

    it("with null and undefined", () => {
      expect(computeMatchQuality(null, undefined)).toBe("none");
    });

    it("with undefined and null", () => {
      expect(computeMatchQuality(undefined, null)).toBe("none");
    });

    it("with both empty strings", () => {
      expect(computeMatchQuality("", "")).toBe("none");
    });

    it("with null and empty string", () => {
      expect(computeMatchQuality(null, "")).toBe("none");
    });

    it("with empty string and null", () => {
      expect(computeMatchQuality("", null)).toBe("none");
    });

    it("with undefined and empty string", () => {
      expect(computeMatchQuality(undefined, "")).toBe("none");
    });
  });
});

// ---------------------------------------------------------------------------
// computeDaysToSale
// ---------------------------------------------------------------------------
describe("computeDaysToSale", () => {
  const ONE_DAY_MS = 86400000;

  it("returns 0 for same day (same timestamp)", () => {
    const timestamp = new Date("2024-06-15T12:00:00Z").getTime();
    expect(computeDaysToSale(timestamp, timestamp)).toBe(0);
  });

  it("returns 0 for less than half a day difference", () => {
    const reg = new Date("2024-06-15T10:00:00Z").getTime();
    const sale = new Date("2024-06-15T20:00:00Z").getTime();
    // 10 hours apart = 36000000ms, 36000000/86400000 = 0.4167, rounds to 0
    expect(computeDaysToSale(reg, sale)).toBe(0);
  });

  it("returns 1 for exactly 1 day apart", () => {
    const reg = new Date("2024-06-15T12:00:00Z").getTime();
    const sale = reg + ONE_DAY_MS;
    expect(computeDaysToSale(reg, sale)).toBe(1);
  });

  it("returns 30 for 30 days apart", () => {
    const reg = new Date("2024-06-01T12:00:00Z").getTime();
    const sale = reg + 30 * ONE_DAY_MS;
    expect(computeDaysToSale(reg, sale)).toBe(30);
  });

  it("returns 365 for exactly one year", () => {
    const reg = new Date("2024-01-01T00:00:00Z").getTime();
    const sale = reg + 365 * ONE_DAY_MS;
    expect(computeDaysToSale(reg, sale)).toBe(365);
  });

  it("handles rounding correctly (rounds to nearest day)", () => {
    const reg = new Date("2024-06-15T00:00:00Z").getTime();

    // 1.4 days -> rounds to 1
    const sale14 = reg + 1.4 * ONE_DAY_MS;
    expect(computeDaysToSale(reg, sale14)).toBe(1);

    // 1.5 days -> rounds to 2
    const sale15 = reg + 1.5 * ONE_DAY_MS;
    expect(computeDaysToSale(reg, sale15)).toBe(2);

    // 1.6 days -> rounds to 2
    const sale16 = reg + 1.6 * ONE_DAY_MS;
    expect(computeDaysToSale(reg, sale16)).toBe(2);
  });

  it("handles 7 days apart", () => {
    const reg = new Date("2024-06-15T12:00:00Z").getTime();
    const sale = reg + 7 * ONE_DAY_MS;
    expect(computeDaysToSale(reg, sale)).toBe(7);
  });

  it("handles fractional day at boundary (12 hours = 0.5 days, rounds to 1)", () => {
    const reg = new Date("2024-06-15T00:00:00Z").getTime();
    const sale = reg + 12 * 3600_000; // 12 hours
    // 12h / 24h = 0.5, Math.round(0.5) = 1
    expect(computeDaysToSale(reg, sale)).toBe(1);
  });
});
