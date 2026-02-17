import { describe, it, expect } from "vitest";
import {
  calcCTR,
  calcCPC,
  calcCPM,
  calcCPL,
  calcCPR,
  calcCPS,
  calcCPqL,
  calcAOV,
  calcROAS,
} from "../../../convex/lib/metrics";

// ---------------------------------------------------------------------------
// calcCTR — (clicks / impressions) * 100
// ---------------------------------------------------------------------------
describe("calcCTR", () => {
  it("returns correct CTR for normal values", () => {
    expect(calcCTR(50, 1000)).toBe(5);
  });

  it("returns 0 when impressions is 0 (zero denominator)", () => {
    expect(calcCTR(50, 0)).toBe(0);
  });

  it("returns 0 when clicks is 0 (zero numerator)", () => {
    expect(calcCTR(0, 1000)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(calcCTR(0, 0)).toBe(0);
  });

  it("handles large values", () => {
    expect(calcCTR(500000, 10000000)).toBe(5);
  });

  it("handles decimal results", () => {
    // 3 / 7 * 100 = 42.857142857142854
    const result = calcCTR(3, 7);
    expect(result).toBeCloseTo(42.8571, 3);
  });

  it("can exceed 100% when clicks > impressions", () => {
    expect(calcCTR(200, 100)).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// calcCPC — spend / clicks
// ---------------------------------------------------------------------------
describe("calcCPC", () => {
  it("returns correct CPC for normal values", () => {
    expect(calcCPC(500, 100)).toBe(5);
  });

  it("returns 0 when clicks is 0 (zero denominator)", () => {
    expect(calcCPC(500, 0)).toBe(0);
  });

  it("returns 0 when spend is 0 (zero numerator)", () => {
    expect(calcCPC(0, 100)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(calcCPC(0, 0)).toBe(0);
  });

  it("handles large values", () => {
    expect(calcCPC(1000000, 500000)).toBe(2);
  });

  it("handles decimal results", () => {
    const result = calcCPC(100, 3);
    expect(result).toBeCloseTo(33.3333, 3);
  });
});

// ---------------------------------------------------------------------------
// calcCPM — (spend / impressions) * 1000
// ---------------------------------------------------------------------------
describe("calcCPM", () => {
  it("returns correct CPM for normal values", () => {
    expect(calcCPM(500, 100000)).toBe(5);
  });

  it("returns 0 when impressions is 0 (zero denominator)", () => {
    expect(calcCPM(500, 0)).toBe(0);
  });

  it("returns 0 when spend is 0 (zero numerator)", () => {
    expect(calcCPM(0, 100000)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(calcCPM(0, 0)).toBe(0);
  });

  it("handles large values", () => {
    expect(calcCPM(5000000, 1000000000)).toBe(5);
  });

  it("handles decimal results", () => {
    const result = calcCPM(100, 3000);
    expect(result).toBeCloseTo(33.3333, 3);
  });
});

// ---------------------------------------------------------------------------
// calcCPL — spend / leads
// ---------------------------------------------------------------------------
describe("calcCPL", () => {
  it("returns correct CPL for normal values", () => {
    expect(calcCPL(1000, 50)).toBe(20);
  });

  it("returns 0 when leads is 0 (zero denominator)", () => {
    expect(calcCPL(1000, 0)).toBe(0);
  });

  it("returns 0 when spend is 0 (zero numerator)", () => {
    expect(calcCPL(0, 50)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(calcCPL(0, 0)).toBe(0);
  });

  it("handles large values", () => {
    expect(calcCPL(10000000, 100000)).toBe(100);
  });

  it("handles decimal results", () => {
    const result = calcCPL(100, 7);
    expect(result).toBeCloseTo(14.2857, 3);
  });
});

// ---------------------------------------------------------------------------
// calcCPR — spend / results
// ---------------------------------------------------------------------------
describe("calcCPR", () => {
  it("returns correct CPR for normal values", () => {
    expect(calcCPR(600, 30)).toBe(20);
  });

  it("returns 0 when results is 0 (zero denominator)", () => {
    expect(calcCPR(600, 0)).toBe(0);
  });

  it("returns 0 when spend is 0 (zero numerator)", () => {
    expect(calcCPR(0, 30)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(calcCPR(0, 0)).toBe(0);
  });

  it("handles large values", () => {
    expect(calcCPR(5000000, 250000)).toBe(20);
  });

  it("handles decimal results", () => {
    const result = calcCPR(100, 3);
    expect(result).toBeCloseTo(33.3333, 3);
  });
});

// ---------------------------------------------------------------------------
// calcCPS — spend / sales
// ---------------------------------------------------------------------------
describe("calcCPS", () => {
  it("returns correct CPS for normal values", () => {
    expect(calcCPS(1000, 10)).toBe(100);
  });

  it("returns 0 when sales is 0 (zero denominator)", () => {
    expect(calcCPS(1000, 0)).toBe(0);
  });

  it("returns 0 when spend is 0 (zero numerator)", () => {
    expect(calcCPS(0, 10)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(calcCPS(0, 0)).toBe(0);
  });

  it("handles large values", () => {
    expect(calcCPS(10000000, 100000)).toBe(100);
  });

  it("handles decimal results", () => {
    const result = calcCPS(100, 7);
    expect(result).toBeCloseTo(14.2857, 3);
  });
});

// ---------------------------------------------------------------------------
// calcCPqL — spend / qualifiedLeads
// ---------------------------------------------------------------------------
describe("calcCPqL", () => {
  it("returns correct CPqL for normal values", () => {
    expect(calcCPqL(2000, 40)).toBe(50);
  });

  it("returns 0 when qualifiedLeads is 0 (zero denominator)", () => {
    expect(calcCPqL(2000, 0)).toBe(0);
  });

  it("returns 0 when spend is 0 (zero numerator)", () => {
    expect(calcCPqL(0, 40)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(calcCPqL(0, 0)).toBe(0);
  });

  it("handles large values", () => {
    expect(calcCPqL(5000000, 100000)).toBe(50);
  });

  it("handles decimal results", () => {
    const result = calcCPqL(100, 3);
    expect(result).toBeCloseTo(33.3333, 3);
  });
});

// ---------------------------------------------------------------------------
// calcAOV — totalIncome / salesCount
// ---------------------------------------------------------------------------
describe("calcAOV", () => {
  it("returns correct AOV for normal values", () => {
    expect(calcAOV(50000, 100)).toBe(500);
  });

  it("returns 0 when salesCount is 0 (zero denominator)", () => {
    expect(calcAOV(50000, 0)).toBe(0);
  });

  it("returns 0 when totalIncome is 0 (zero numerator)", () => {
    expect(calcAOV(0, 100)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(calcAOV(0, 0)).toBe(0);
  });

  it("handles large values", () => {
    expect(calcAOV(100000000, 200000)).toBe(500);
  });

  it("handles decimal results", () => {
    const result = calcAOV(1000, 3);
    expect(result).toBeCloseTo(333.3333, 3);
  });
});

// ---------------------------------------------------------------------------
// calcROAS — ((income - expense) / expense) * 100
// ---------------------------------------------------------------------------
describe("calcROAS", () => {
  it("returns correct ROAS for profitable campaign", () => {
    // ((5000 - 1000) / 1000) * 100 = 400
    expect(calcROAS(5000, 1000)).toBe(400);
  });

  it("returns 0 when expense is 0 (zero denominator)", () => {
    expect(calcROAS(5000, 0)).toBe(0);
  });

  it("returns -100 when income is 0 and expense > 0", () => {
    // ((0 - 1000) / 1000) * 100 = -100
    expect(calcROAS(0, 1000)).toBe(-100);
  });

  it("returns 0 when both are 0", () => {
    expect(calcROAS(0, 0)).toBe(0);
  });

  it("returns negative ROAS for unprofitable campaign", () => {
    // ((200 - 1000) / 1000) * 100 = -80
    expect(calcROAS(200, 1000)).toBe(-80);
  });

  it("returns 0 for break-even (income equals expense)", () => {
    expect(calcROAS(1000, 1000)).toBe(0);
  });

  it("handles large values", () => {
    // ((10000000 - 2000000) / 2000000) * 100 = 400
    expect(calcROAS(10000000, 2000000)).toBe(400);
  });

  it("handles decimal results", () => {
    // ((150 - 100) / 100) * 100 = 50
    expect(calcROAS(150, 100)).toBe(50);
    // ((333 - 200) / 200) * 100 = 66.5
    expect(calcROAS(333, 200)).toBe(66.5);
  });
});
