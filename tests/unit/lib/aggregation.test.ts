import { describe, it, expect, vi, afterEach } from "vitest";
import {
  emptyMetricSet,
  sumMetrics,
  buildTableRowData,
  formatMetricValue,
  formatDisplayValue,
  formatRelativeTime,
  rowToMetricSet,
  round2,
  round1,
  MetricSet,
  TableRowData,
} from "../../../convex/lib/aggregation";

// ---------------------------------------------------------------------------
// emptyMetricSet
// ---------------------------------------------------------------------------
describe("emptyMetricSet", () => {
  it("returns object with all 10 fields set to 0", () => {
    const result = emptyMetricSet();
    expect(result).toEqual({
      impressions: 0,
      clicks: 0,
      spend: 0,
      leads: 0,
      results: 0,
      reach: 0,
      whatsappRequests: 0,
      appointmentsScheduled: 0,
      treatmentsCompleted: 0,
      plansSent: 0,
    });
  });

  it("returns a new object each time (not shared reference)", () => {
    const a = emptyMetricSet();
    const b = emptyMetricSet();
    expect(a).not.toBe(b);
    a.clicks = 99;
    expect(b.clicks).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// sumMetrics
// ---------------------------------------------------------------------------
describe("sumMetrics", () => {
  it("returns zeros for empty array", () => {
    const result = sumMetrics([]);
    expect(result).toEqual(emptyMetricSet());
  });

  it("returns same values for single item", () => {
    const item: MetricSet = {
      impressions: 100,
      clicks: 10,
      spend: 50,
      leads: 5,
      results: 3,
      reach: 200,
      whatsappRequests: 2,
      appointmentsScheduled: 1,
      treatmentsCompleted: 1,
      plansSent: 0,
    };
    const result = sumMetrics([item]);
    expect(result).toEqual(item);
  });

  it("correctly sums multiple items", () => {
    const items: MetricSet[] = [
      {
        impressions: 100,
        clicks: 10,
        spend: 50,
        leads: 5,
        results: 3,
        reach: 200,
        whatsappRequests: 2,
        appointmentsScheduled: 1,
        treatmentsCompleted: 1,
        plansSent: 0,
      },
      {
        impressions: 200,
        clicks: 20,
        spend: 80,
        leads: 8,
        results: 4,
        reach: 300,
        whatsappRequests: 3,
        appointmentsScheduled: 2,
        treatmentsCompleted: 0,
        plansSent: 1,
      },
      {
        impressions: 50,
        clicks: 5,
        spend: 20,
        leads: 2,
        results: 1,
        reach: 100,
        whatsappRequests: 0,
        appointmentsScheduled: 0,
        treatmentsCompleted: 0,
        plansSent: 0,
      },
    ];
    const result = sumMetrics(items);
    expect(result).toEqual({
      impressions: 350,
      clicks: 35,
      spend: 150,
      leads: 15,
      results: 8,
      reach: 600,
      whatsappRequests: 5,
      appointmentsScheduled: 3,
      treatmentsCompleted: 1,
      plansSent: 1,
    });
  });

  it("handles large numbers", () => {
    const items: MetricSet[] = [
      {
        impressions: 10000000,
        clicks: 500000,
        spend: 2000000,
        leads: 50000,
        results: 25000,
        reach: 8000000,
        whatsappRequests: 10000,
        appointmentsScheduled: 5000,
        treatmentsCompleted: 3000,
        plansSent: 2000,
      },
      {
        impressions: 20000000,
        clicks: 1000000,
        spend: 4000000,
        leads: 100000,
        results: 50000,
        reach: 16000000,
        whatsappRequests: 20000,
        appointmentsScheduled: 10000,
        treatmentsCompleted: 6000,
        plansSent: 4000,
      },
    ];
    const result = sumMetrics(items);
    expect(result.impressions).toBe(30000000);
    expect(result.clicks).toBe(1500000);
    expect(result.spend).toBe(6000000);
  });
});

// ---------------------------------------------------------------------------
// buildTableRowData
// ---------------------------------------------------------------------------
describe("buildTableRowData", () => {
  const baseMetrics: MetricSet = {
    impressions: 10000,
    clicks: 500,
    spend: 1000,
    leads: 50,
    results: 30,
    reach: 8000,
    whatsappRequests: 10,
    appointmentsScheduled: 5,
    treatmentsCompleted: 3,
    plansSent: 2,
  };

  it("computes all derived KPIs correctly", () => {
    const result = buildTableRowData({
      id: "row1",
      name: "Test Campaign",
      type: "campaign",
      isActive: true,
      account: "account1",
      metrics: baseMetrics,
      income: 5000,
      qLeads: 20,
      salesCount: 10,
    });

    // Verify identity fields
    expect(result.id).toBe("row1");
    expect(result.name).toBe("Test Campaign");
    expect(result.type).toBe("campaign");
    expect(result.isActive).toBe(true);
    expect(result.account).toBe("account1");

    // Verify raw metrics
    expect(result.reach).toBe(8000);
    expect(result.impressions).toBe(10000);
    expect(result.clicks).toBe(500);
    expect(result.results).toBe(30);
    expect(result.leads).toBe(50);
    expect(result.qLeads).toBe(20);
    expect(result.sales).toBe(10);

    // Verify expense/income rounding
    expect(result.expenses).toBe(1000); // round2(1000)
    expect(result.income).toBe(5000);   // round2(5000)

    // CTR = (500 / 10000) * 100 = 5.00
    expect(result.ctr).toBe(5);

    // CPC = 1000 / 500 = 2.00
    expect(result.cpc).toBe(2);

    // CPM = (1000 / 10000) * 1000 = 100.00
    expect(result.cpm).toBe(100);

    // CPR = 1000 / 30 = 33.33
    expect(result.cpr).toBe(33.33);

    // CPL = 1000 / 50 = 20.00
    expect(result.cpl).toBe(20);

    // CPqL = 1000 / 20 = 50.00
    expect(result.cpql).toBe(50);

    // CPS = 1000 / 10 = 100.00
    expect(result.cps).toBe(100);

    // AOV = 5000 / 10 = 500.00
    expect(result.aov).toBe(500);

    // ROAS = ((5000 - 1000) / 1000) * 100 = 400.0
    expect(result.roas).toBe(400);
  });

  it("rounds expenses and income to 2 decimals", () => {
    const metrics = { ...baseMetrics, spend: 1234.5678 };
    const result = buildTableRowData({
      id: "r",
      name: "R",
      type: "ad",
      isActive: true,
      account: "a",
      metrics,
      income: 9876.5432,
      qLeads: 10,
      salesCount: 5,
    });
    expect(result.expenses).toBe(1234.57);
    expect(result.income).toBe(9876.54);
  });

  it("rounds roas to 1 decimal", () => {
    // income = 1333, expense = 1000
    // ROAS = ((1333-1000)/1000)*100 = 33.3
    const metrics = { ...baseMetrics, spend: 1000 };
    const result = buildTableRowData({
      id: "r",
      name: "R",
      type: "ad",
      isActive: true,
      account: "a",
      metrics,
      income: 1333,
      qLeads: 10,
      salesCount: 5,
    });
    expect(result.roas).toBe(33.3);
  });

  it("includes children when provided and non-empty", () => {
    const child: TableRowData = {
      id: "child1",
      name: "Child",
      type: "ad",
      isActive: true,
      account: "a",
      expenses: 100,
      income: 200,
      roas: 100,
      reach: 500,
      impressions: 1000,
      cpm: 100,
      clicks: 50,
      ctr: 5,
      cpc: 2,
      results: 10,
      cpr: 10,
      leads: 5,
      cpl: 20,
      qLeads: 3,
      cpql: 33.33,
      sales: 2,
      cps: 50,
      aov: 100,
    };

    const result = buildTableRowData({
      id: "parent",
      name: "Parent",
      type: "campaign",
      isActive: true,
      account: "a",
      metrics: baseMetrics,
      income: 5000,
      qLeads: 20,
      salesCount: 10,
      children: [child],
    });

    expect(result.children).toBeDefined();
    expect(result.children).toHaveLength(1);
    expect(result.children![0].id).toBe("child1");
  });

  it("does not include children property when children is undefined", () => {
    const result = buildTableRowData({
      id: "r",
      name: "R",
      type: "ad",
      isActive: true,
      account: "a",
      metrics: baseMetrics,
      income: 5000,
      qLeads: 20,
      salesCount: 10,
    });
    expect(result).not.toHaveProperty("children");
  });

  it("does not include children property when children is empty array", () => {
    const result = buildTableRowData({
      id: "r",
      name: "R",
      type: "ad",
      isActive: true,
      account: "a",
      metrics: baseMetrics,
      income: 5000,
      qLeads: 20,
      salesCount: 10,
      children: [],
    });
    expect(result).not.toHaveProperty("children");
  });

  it("includes adId when provided", () => {
    const result = buildTableRowData({
      id: "r",
      name: "R",
      type: "ad",
      isActive: true,
      account: "a",
      metrics: baseMetrics,
      income: 5000,
      qLeads: 20,
      salesCount: 10,
      adId: "ad_12345",
    });
    expect(result.adId).toBe("ad_12345");
  });

  it("does not include adId when not provided", () => {
    const result = buildTableRowData({
      id: "r",
      name: "R",
      type: "ad",
      isActive: true,
      account: "a",
      metrics: baseMetrics,
      income: 5000,
      qLeads: 20,
      salesCount: 10,
    });
    expect(result).not.toHaveProperty("adId");
  });

  it("handles zero denominator cases gracefully (zero sales, zero clicks, etc.)", () => {
    const zeroMetrics: MetricSet = {
      impressions: 0,
      clicks: 0,
      spend: 1000,
      leads: 0,
      results: 0,
      reach: 0,
      whatsappRequests: 0,
      appointmentsScheduled: 0,
      treatmentsCompleted: 0,
      plansSent: 0,
    };

    const result = buildTableRowData({
      id: "r",
      name: "R",
      type: "ad",
      isActive: true,
      account: "a",
      metrics: zeroMetrics,
      income: 0,
      qLeads: 0,
      salesCount: 0,
    });

    expect(result.ctr).toBe(0);    // 0/0 * 100
    expect(result.cpc).toBe(0);    // 1000/0
    expect(result.cpm).toBe(0);    // (1000/0)*1000
    expect(result.cpr).toBe(0);    // 1000/0
    expect(result.cpl).toBe(0);    // 1000/0
    expect(result.cpql).toBe(0);   // 1000/0
    expect(result.cps).toBe(0);    // 1000/0
    expect(result.aov).toBe(0);    // 0/0
    expect(result.roas).toBe(-100); // ((0-1000)/1000)*100 = -100, round1(-100) = -100
  });
});

// ---------------------------------------------------------------------------
// formatMetricValue
// ---------------------------------------------------------------------------
describe("formatMetricValue", () => {
  describe("currency", () => {
    it("formats with dollar sign and 2 decimals", () => {
      expect(formatMetricValue(3.74, "currency")).toBe("$3.74");
    });

    it("formats whole number with .00", () => {
      expect(formatMetricValue(100, "currency")).toBe("$100.00");
    });

    it("formats zero", () => {
      expect(formatMetricValue(0, "currency")).toBe("$0.00");
    });

    it("formats large value", () => {
      expect(formatMetricValue(12345.678, "currency")).toBe("$12345.68");
    });

    it("formats single decimal place", () => {
      expect(formatMetricValue(5.5, "currency")).toBe("$5.50");
    });
  });

  describe("percent", () => {
    it("formats with percent sign and 2 decimals", () => {
      expect(formatMetricValue(0.85, "percent")).toBe("0.85%");
    });

    it("formats whole number with .00", () => {
      expect(formatMetricValue(50, "percent")).toBe("50.00%");
    });

    it("formats zero", () => {
      expect(formatMetricValue(0, "percent")).toBe("0.00%");
    });

    it("formats large percentage", () => {
      expect(formatMetricValue(225.2, "percent")).toBe("225.20%");
    });
  });
});

// ---------------------------------------------------------------------------
// formatDisplayValue
// ---------------------------------------------------------------------------
describe("formatDisplayValue", () => {
  describe("millions", () => {
    it("formats 1,600,000 as '1.6 млн'", () => {
      expect(formatDisplayValue(1600000)).toBe("1.6 млн");
    });

    it("formats 2,000,000 as '2 млн' (strips trailing .0)", () => {
      expect(formatDisplayValue(2000000)).toBe("2 млн");
    });

    it("formats 1,000,000 as '1 млн'", () => {
      expect(formatDisplayValue(1000000)).toBe("1 млн");
    });

    it("formats 10,500,000 as '10.5 млн'", () => {
      expect(formatDisplayValue(10500000)).toBe("10.5 млн");
    });
  });

  describe("thousands", () => {
    it("formats 15,156 as '15,156'", () => {
      expect(formatDisplayValue(15156)).toBe("15,156");
    });

    it("formats 1,000 as '1,000'", () => {
      expect(formatDisplayValue(1000)).toBe("1,000");
    });

    it("formats 999,999 as '999,999'", () => {
      expect(formatDisplayValue(999999)).toBe("999,999");
    });
  });

  describe("small values", () => {
    it("formats 107 as '107'", () => {
      expect(formatDisplayValue(107)).toBe("107");
    });

    it("formats 0 as '0'", () => {
      expect(formatDisplayValue(0)).toBe("0");
    });

    it("formats 999 as '999'", () => {
      expect(formatDisplayValue(999)).toBe("999");
    });

    it("formats 1 as '1'", () => {
      expect(formatDisplayValue(1)).toBe("1");
    });
  });
});

// ---------------------------------------------------------------------------
// formatRelativeTime
// ---------------------------------------------------------------------------
describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 'только что' for less than 1 minute ago", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    expect(formatRelativeTime(now - 30_000)).toBe("только что");
    expect(formatRelativeTime(now - 59_000)).toBe("только что");
    expect(formatRelativeTime(now)).toBe("только что");
  });

  it("returns minutes for 1-59 minutes", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    expect(formatRelativeTime(now - 60_000)).toBe("1 мин назад");
    expect(formatRelativeTime(now - 5 * 60_000)).toBe("5 мин назад");
    expect(formatRelativeTime(now - 59 * 60_000)).toBe("59 мин назад");
  });

  it("returns hours for 1-23 hours", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    // 2 hours exactly
    expect(formatRelativeTime(now - 2 * 3600_000)).toBe("2 ч назад");
    // 5 hours exactly
    expect(formatRelativeTime(now - 5 * 3600_000)).toBe("5 ч назад");
  });

  it("returns half hours (X.5) for 1h30m when diffHour < 2", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    // 1 hour 30 minutes = 90 minutes
    expect(formatRelativeTime(now - 90 * 60_000)).toBe("1.5 ч назад");
  });

  it("returns whole hours when remainder < 30 min for hours < 2", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    // 1 hour 15 minutes = 75 minutes -> diffHour=1, remainder=15 < 30
    expect(formatRelativeTime(now - 75 * 60_000)).toBe("1 ч назад");
  });

  it("returns days for 1-29 days", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    expect(formatRelativeTime(now - 24 * 3600_000)).toBe("1 дн назад");
    expect(formatRelativeTime(now - 7 * 24 * 3600_000)).toBe("7 дн назад");
    expect(formatRelativeTime(now - 29 * 24 * 3600_000)).toBe("29 дн назад");
  });

  it("returns months for 30+ days", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    expect(formatRelativeTime(now - 30 * 24 * 3600_000)).toBe("1 мес назад");
    expect(formatRelativeTime(now - 60 * 24 * 3600_000)).toBe("2 мес назад");
    expect(formatRelativeTime(now - 365 * 24 * 3600_000)).toBe("12 мес назад");
  });
});

// ---------------------------------------------------------------------------
// rowToMetricSet
// ---------------------------------------------------------------------------
describe("rowToMetricSet", () => {
  it("extracts correct fields from TableRowData", () => {
    const row: TableRowData = {
      id: "r1",
      name: "Test Row",
      type: "ad",
      isActive: true,
      account: "acct",
      expenses: 1500,
      income: 5000,
      roas: 233.3,
      reach: 8000,
      impressions: 10000,
      cpm: 150,
      clicks: 500,
      ctr: 5,
      cpc: 3,
      results: 30,
      cpr: 50,
      leads: 50,
      cpl: 30,
      qLeads: 20,
      cpql: 75,
      sales: 10,
      cps: 150,
      aov: 500,
    };

    const result = rowToMetricSet(row);

    expect(result).toEqual({
      impressions: 10000,
      clicks: 500,
      spend: 1500,       // mapped from expenses
      leads: 50,
      results: 30,
      reach: 8000,
      whatsappRequests: 0,
      appointmentsScheduled: 0,
      treatmentsCompleted: 0,
      plansSent: 0,
    });
  });

  it("maps expenses to spend", () => {
    const row: TableRowData = {
      id: "r1",
      name: "T",
      type: "ad",
      isActive: true,
      account: "a",
      expenses: 999.99,
      income: 0,
      roas: 0,
      reach: 0,
      impressions: 0,
      cpm: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      results: 0,
      cpr: 0,
      leads: 0,
      cpl: 0,
      qLeads: 0,
      cpql: 0,
      sales: 0,
      cps: 0,
      aov: 0,
    };
    expect(rowToMetricSet(row).spend).toBe(999.99);
  });

  it("sets whatsapp, appointment, treatment, plans to 0", () => {
    const row: TableRowData = {
      id: "r1",
      name: "T",
      type: "ad",
      isActive: true,
      account: "a",
      expenses: 100,
      income: 200,
      roas: 100,
      reach: 500,
      impressions: 1000,
      cpm: 100,
      clicks: 50,
      ctr: 5,
      cpc: 2,
      results: 10,
      cpr: 10,
      leads: 5,
      cpl: 20,
      qLeads: 3,
      cpql: 33.33,
      sales: 2,
      cps: 50,
      aov: 100,
    };

    const result = rowToMetricSet(row);
    expect(result.whatsappRequests).toBe(0);
    expect(result.appointmentsScheduled).toBe(0);
    expect(result.treatmentsCompleted).toBe(0);
    expect(result.plansSent).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// round2
// ---------------------------------------------------------------------------
describe("round2", () => {
  it("rounds to 2 decimal places", () => {
    expect(round2(3.14159)).toBe(3.14);
  });

  it("rounds up at .005 (IEEE 754: 1.005*100 = 100.4999... so rounds down)", () => {
    // Due to floating point, 1.005 * 100 = 100.49999999999999, which rounds to 100 -> 1.00
    expect(round2(1.005)).toBe(1);
    // But 2.005 rounds correctly because 2.005 * 100 = 200.5 exactly
    expect(round2(2.005)).toBe(2.01);
  });

  it("keeps exact values", () => {
    expect(round2(5.00)).toBe(5);
    expect(round2(3.14)).toBe(3.14);
  });

  it("handles zero", () => {
    expect(round2(0)).toBe(0);
  });

  it("handles negative values", () => {
    expect(round2(-3.14159)).toBe(-3.14);
  });

  it("handles large numbers", () => {
    expect(round2(123456.789)).toBe(123456.79);
  });
});

// ---------------------------------------------------------------------------
// round1
// ---------------------------------------------------------------------------
describe("round1", () => {
  it("rounds to 1 decimal place", () => {
    expect(round1(3.14159)).toBe(3.1);
  });

  it("rounds up at .05", () => {
    expect(round1(1.05)).toBe(1.1);
  });

  it("keeps exact values", () => {
    expect(round1(5.0)).toBe(5);
    expect(round1(3.1)).toBe(3.1);
  });

  it("handles zero", () => {
    expect(round1(0)).toBe(0);
  });

  it("handles negative values", () => {
    expect(round1(-3.14159)).toBe(-3.1);
  });

  it("handles large numbers", () => {
    expect(round1(123456.789)).toBe(123456.8);
  });
});
