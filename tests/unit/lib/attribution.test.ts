import { describe, it, expect } from "vitest";
import {
  getAdActivePeriods,
  attributeSalesForAd,
  SaleForAttribution,
} from "../../../convex/lib/attribution";

// ---------------------------------------------------------------------------
// getAdActivePeriods
// ---------------------------------------------------------------------------
describe("getAdActivePeriods", () => {
  it("returns empty map for empty array", () => {
    const result = getAdActivePeriods([]);
    expect(result.size).toBe(0);
  });

  it("single ad, single date -> firstDate == lastDate", () => {
    const result = getAdActivePeriods([
      { adId: "ad1", date: "2024-06-15" },
    ]);
    expect(result.size).toBe(1);
    const period = result.get("ad1");
    expect(period).toEqual({ firstDate: "2024-06-15", lastDate: "2024-06-15" });
  });

  it("single ad, multiple dates -> correct min/max", () => {
    const result = getAdActivePeriods([
      { adId: "ad1", date: "2024-06-15" },
      { adId: "ad1", date: "2024-06-10" },
      { adId: "ad1", date: "2024-06-20" },
      { adId: "ad1", date: "2024-06-18" },
    ]);
    expect(result.size).toBe(1);
    const period = result.get("ad1");
    expect(period).toEqual({ firstDate: "2024-06-10", lastDate: "2024-06-20" });
  });

  it("multiple ads -> correct per-ad periods", () => {
    const result = getAdActivePeriods([
      { adId: "ad1", date: "2024-06-15" },
      { adId: "ad2", date: "2024-07-01" },
      { adId: "ad1", date: "2024-06-10" },
      { adId: "ad2", date: "2024-07-15" },
      { adId: "ad1", date: "2024-06-20" },
      { adId: "ad2", date: "2024-07-05" },
    ]);
    expect(result.size).toBe(2);
    expect(result.get("ad1")).toEqual({ firstDate: "2024-06-10", lastDate: "2024-06-20" });
    expect(result.get("ad2")).toEqual({ firstDate: "2024-07-01", lastDate: "2024-07-15" });
  });

  it("unsorted dates -> still finds correct min/max", () => {
    const result = getAdActivePeriods([
      { adId: "ad1", date: "2024-06-20" },
      { adId: "ad1", date: "2024-06-05" },
      { adId: "ad1", date: "2024-06-30" },
      { adId: "ad1", date: "2024-06-01" },
      { adId: "ad1", date: "2024-06-15" },
    ]);
    expect(result.get("ad1")).toEqual({ firstDate: "2024-06-01", lastDate: "2024-06-30" });
  });

  it("handles dates across months and years", () => {
    const result = getAdActivePeriods([
      { adId: "ad1", date: "2023-12-25" },
      { adId: "ad1", date: "2024-01-05" },
    ]);
    expect(result.get("ad1")).toEqual({ firstDate: "2023-12-25", lastDate: "2024-01-05" });
  });
});

// ---------------------------------------------------------------------------
// attributeSalesForAd
// ---------------------------------------------------------------------------

function makeSale(overrides: Partial<SaleForAttribution> & { _id: string }): SaleForAttribution {
  return {
    adId: "ad1",
    amount: 1000,
    registrationDateStr: "2024-06-15",
    saleDateStr: "2024-06-20",
    clientName: "Client",
    dealStatus: "closed",
    dealLink: "https://crm.example.com/deal/1",
    ...overrides,
  };
}

describe("attributeSalesForAd", () => {
  describe("direct sales", () => {
    it("attributes sale when registrationDateStr === statDate", () => {
      const sales = [makeSale({ _id: "s1", registrationDateStr: "2024-06-15" })];
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-20", sales);

      expect(result.salesCount).toBe(1);
      expect(result.salesAmount).toBe(1000);
      expect(result.lateSalesCount).toBe(0);
      expect(result.lateSalesAmount).toBe(0);
      expect(result.details).toHaveLength(1);
      expect(result.details[0].isLateSale).toBe(false);
    });

    it("attributes multiple direct sales on the same date", () => {
      const sales = [
        makeSale({ _id: "s1", registrationDateStr: "2024-06-15", amount: 500 }),
        makeSale({ _id: "s2", registrationDateStr: "2024-06-15", amount: 700 }),
      ];
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-20", sales);

      expect(result.salesCount).toBe(2);
      expect(result.salesAmount).toBe(1200);
      expect(result.lateSalesCount).toBe(0);
      expect(result.lateSalesAmount).toBe(0);
    });
  });

  describe("late sales", () => {
    it("attributes late sale when statDate === lastActiveDate and registration within 7 days", () => {
      const sales = [
        makeSale({ _id: "s1", registrationDateStr: "2024-06-17", amount: 2000 }),
      ];
      // statDate === lastActiveDate = "2024-06-15", registration "2024-06-17" is 2 days after
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-15", sales);

      expect(result.salesCount).toBe(1);
      expect(result.salesAmount).toBe(2000);
      expect(result.lateSalesCount).toBe(1);
      expect(result.lateSalesAmount).toBe(2000);
      expect(result.details[0].isLateSale).toBe(true);
    });

    it("attributes late sale on exactly day 7 boundary", () => {
      const sales = [
        makeSale({ _id: "s1", registrationDateStr: "2024-06-22", amount: 1500 }),
      ];
      // statDate === lastActiveDate = "2024-06-15"
      // addDays("2024-06-15", 7) = "2024-06-22"
      // registration "2024-06-22" <= "2024-06-22" -> attributed
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-15", sales);

      expect(result.salesCount).toBe(1);
      expect(result.lateSalesCount).toBe(1);
      expect(result.lateSalesAmount).toBe(1500);
    });

    it("does NOT attribute late sale beyond 7 days", () => {
      const sales = [
        makeSale({ _id: "s1", registrationDateStr: "2024-06-23", amount: 1500 }),
      ];
      // "2024-06-23" > addDays("2024-06-15", 7) which is "2024-06-22"
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-15", sales);

      expect(result.salesCount).toBe(0);
      expect(result.salesAmount).toBe(0);
      expect(result.lateSalesCount).toBe(0);
      expect(result.lateSalesAmount).toBe(0);
      expect(result.details).toHaveLength(0);
    });

    it("does NOT attribute late sale when statDate !== lastActiveDate", () => {
      const sales = [
        makeSale({ _id: "s1", registrationDateStr: "2024-06-17", amount: 2000 }),
      ];
      // statDate "2024-06-15" !== lastActiveDate "2024-06-20"
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-20", sales);

      expect(result.salesCount).toBe(0);
      expect(result.salesAmount).toBe(0);
      expect(result.lateSalesCount).toBe(0);
    });

    it("does NOT attribute late sale when registration equals statDate (that is a direct sale, not late)", () => {
      // registration must be strictly > statDate for late attribution
      const sales = [
        makeSale({ _id: "s1", registrationDateStr: "2024-06-15" }),
      ];
      // statDate === lastActiveDate = "2024-06-15", registration === statDate
      // This is a direct sale, not a late sale
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-15", sales);

      expect(result.salesCount).toBe(1);
      expect(result.lateSalesCount).toBe(0); // It's direct, not late
      expect(result.details[0].isLateSale).toBe(false);
    });
  });

  describe("mixed direct + late sales", () => {
    it("correctly separates direct and late sales", () => {
      const sales = [
        makeSale({ _id: "s1", registrationDateStr: "2024-06-15", amount: 500 }),
        makeSale({ _id: "s2", registrationDateStr: "2024-06-18", amount: 700 }),
        makeSale({ _id: "s3", registrationDateStr: "2024-06-20", amount: 300 }),
      ];
      // statDate === lastActiveDate = "2024-06-15"
      // s1: direct (registration === statDate)
      // s2: late (within 7 days after statDate)
      // s3: late (within 7 days after statDate: 2024-06-15 + 7 = 2024-06-22)
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-15", sales);

      expect(result.salesCount).toBe(3);
      expect(result.salesAmount).toBe(1500);
      expect(result.lateSalesCount).toBe(2);
      expect(result.lateSalesAmount).toBe(1000);

      // Verify direct sale detail
      const directDetail = result.details.find((d) => d.registrationDate === "2024-06-15");
      expect(directDetail?.isLateSale).toBe(false);

      // Verify late sale details
      const lateDetails = result.details.filter((d) => d.isLateSale);
      expect(lateDetails).toHaveLength(2);
    });
  });

  describe("no matching sales", () => {
    it("returns zero counts when salesForAd is empty", () => {
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-20", []);

      expect(result.salesCount).toBe(0);
      expect(result.salesAmount).toBe(0);
      expect(result.lateSalesCount).toBe(0);
      expect(result.lateSalesAmount).toBe(0);
      expect(result.details).toHaveLength(0);
    });

    it("returns zero counts when no sales match the date criteria", () => {
      const sales = [
        makeSale({ _id: "s1", registrationDateStr: "2024-05-01" }),
        makeSale({ _id: "s2", registrationDateStr: "2024-07-01" }),
      ];
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-20", sales);

      expect(result.salesCount).toBe(0);
      expect(result.salesAmount).toBe(0);
      expect(result.details).toHaveLength(0);
    });
  });

  describe("details array structure", () => {
    it("contains correct fields for each attributed sale", () => {
      const sales = [
        makeSale({
          _id: "s1",
          registrationDateStr: "2024-06-15",
          saleDateStr: "2024-06-20",
          clientName: "Acme Corp",
          amount: 2500,
          dealStatus: "won",
          dealLink: "https://crm.example.com/deal/42",
        }),
      ];
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-20", sales);

      expect(result.details).toHaveLength(1);
      const detail = result.details[0];
      expect(detail).toEqual({
        client: "Acme Corp",
        amount: 2500,
        status: "won",
        link: "https://crm.example.com/deal/42",
        saleDate: "2024-06-20",
        registrationDate: "2024-06-15",
        isLateSale: false,
      });
    });

    it("handles sale with missing optional fields (clientName, dealLink)", () => {
      const sales: SaleForAttribution[] = [
        {
          _id: "s1",
          adId: "ad1",
          amount: 100,
          registrationDateStr: "2024-06-15",
          saleDateStr: "2024-06-20",
          dealStatus: "pending",
          // no clientName, no dealLink
        },
      ];
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-20", sales);

      expect(result.details[0].client).toBeUndefined();
      expect(result.details[0].link).toBeUndefined();
      expect(result.details[0].status).toBe("pending");
    });
  });

  describe("edge cases", () => {
    it("late sale across month boundary", () => {
      const sales = [
        makeSale({ _id: "s1", registrationDateStr: "2024-07-03", amount: 800 }),
      ];
      // statDate = lastActiveDate = "2024-06-28"
      // addDays("2024-06-28", 7) = "2024-07-05"
      // "2024-07-03" <= "2024-07-05" -> attributed
      const result = attributeSalesForAd("ad1", "2024-06-28", "2024-06-28", sales);

      expect(result.salesCount).toBe(1);
      expect(result.lateSalesCount).toBe(1);
    });

    it("late sale across year boundary", () => {
      const sales = [
        makeSale({ _id: "s1", registrationDateStr: "2025-01-03", amount: 800 }),
      ];
      // statDate = lastActiveDate = "2024-12-30"
      // addDays("2024-12-30", 7) = "2025-01-06"
      // "2025-01-03" <= "2025-01-06" -> attributed
      const result = attributeSalesForAd("ad1", "2024-12-30", "2024-12-30", sales);

      expect(result.salesCount).toBe(1);
      expect(result.lateSalesCount).toBe(1);
    });

    it("registration day 1 after lastActiveDate is attributed as late", () => {
      const sales = [
        makeSale({ _id: "s1", registrationDateStr: "2024-06-16", amount: 300 }),
      ];
      const result = attributeSalesForAd("ad1", "2024-06-15", "2024-06-15", sales);

      expect(result.lateSalesCount).toBe(1);
    });
  });
});
