// Shared aggregation helpers for rolling up ad metrics into the hierarchical
// TableRowData tree consumed by the front-end DataTable component.

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
} from "./metrics";

// ---- Types ----------------------------------------------------------------

/** Raw summable metric fields that exist on adDailyStats rows. */
export interface MetricSet {
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
  results: number;
  reach: number;
  whatsappRequests: number;
  appointmentsScheduled: number;
  treatmentsCompleted: number;
  plansSent: number;
}

/**
 * The front-end TableRowData shape.
 * Duplicated here so convex server code does not import from the
 * browser-side types.ts (which may reference DOM / React types).
 */
export interface TableRowData {
  id: string;
  name: string;
  type: "project" | "campaign" | "group" | "ad";
  isActive: boolean;
  account: string;
  expenses: number;
  income: number;
  roas: number;
  reach: number;
  impressions: number;
  cpm: number;
  clicks: number;
  ctr: number;
  cpc: number;
  results: number;
  cpr: number;
  leads: number;
  cpl: number;
  qLeads: number;
  cpql: number;
  sales: number;
  cps: number;
  aov: number;
  adId?: string;
  children?: TableRowData[];
}

// ---- Helpers ---------------------------------------------------------------

/** Return a MetricSet with every field set to 0. */
export function emptyMetricSet(): MetricSet {
  return {
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
  };
}

/**
 * Sum an array of MetricSets into a single MetricSet.
 * All summable fields are added together.  Derived rate / cost metrics
 * (CTR, CPC, CPM, etc.) are NOT computed here -- they are calculated
 * later via `buildTableRowData`.
 */
export function sumMetrics(items: MetricSet[]): MetricSet {
  const totals = emptyMetricSet();
  for (const item of items) {
    totals.impressions += item.impressions;
    totals.clicks += item.clicks;
    totals.spend += item.spend;
    totals.leads += item.leads;
    totals.results += item.results;
    totals.reach += item.reach;
    totals.whatsappRequests += item.whatsappRequests;
    totals.appointmentsScheduled += item.appointmentsScheduled;
    totals.treatmentsCompleted += item.treatmentsCompleted;
    totals.plansSent += item.plansSent;
  }
  return totals;
}

/**
 * Build a fully-formed TableRowData object from aggregated inputs.
 *
 * Derived metrics (CTR, CPC, CPM, CPR, CPL, CPqL, CPS, AOV, ROAS) are
 * computed from the raw sums, income, qualified-leads, and sales count
 * passed in.
 */
export function buildTableRowData(params: {
  id: string;
  name: string;
  type: "project" | "campaign" | "group" | "ad";
  isActive: boolean;
  account: string;
  metrics: MetricSet;
  income: number;
  qLeads: number;
  salesCount: number;
  adId?: string;
  children?: TableRowData[];
}): TableRowData {
  const m = params.metrics;
  const expense = m.spend;
  const income = params.income;

  const ctr = calcCTR(m.clicks, m.impressions);
  const cpc = calcCPC(m.spend, m.clicks);
  const cpm = calcCPM(m.spend, m.impressions);
  const cpr = calcCPR(m.spend, m.results);
  const cpl = calcCPL(m.spend, m.leads);
  const cpql = calcCPqL(m.spend, params.qLeads);
  const cps = calcCPS(m.spend, params.salesCount);
  const aov = calcAOV(income, params.salesCount);
  const roas = calcROAS(income, expense);

  const row: TableRowData = {
    id: params.id,
    name: params.name,
    type: params.type,
    isActive: params.isActive,
    account: params.account,
    expenses: round2(expense),
    income: round2(income),
    roas: round1(roas),
    reach: m.reach,
    impressions: m.impressions,
    cpm: round2(cpm),
    clicks: m.clicks,
    ctr: round2(ctr),
    cpc: round2(cpc),
    results: m.results,
    cpr: round2(cpr),
    leads: m.leads,
    cpl: round2(cpl),
    qLeads: params.qLeads,
    cpql: round2(cpql),
    sales: params.salesCount,
    cps: round2(cps),
    aov: round2(aov),
  };

  if (params.adId !== undefined) {
    row.adId = params.adId;
  }

  if (params.children !== undefined && params.children.length > 0) {
    row.children = params.children;
  }

  return row;
}

/**
 * Format a metric value as a display string for KPI cards.
 *
 * - `currency` -> e.g. "$3.74"
 * - `percent`  -> e.g. "0.85%" or "225.2%"
 */
export function formatMetricValue(
  value: number,
  type: "currency" | "percent"
): string {
  if (type === "currency") {
    return `$${value.toFixed(2)}`;
  }
  return `${value.toFixed(2)}%`;
}

/**
 * Format a large number for display in funnel stages.
 * E.g. 1600000 -> "1.6 млн", 15156 -> "15,156", 107 -> "107".
 */
export function formatDisplayValue(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    // Show 1 decimal place, strip trailing zero
    const formatted = millions.toFixed(1).replace(/\.0$/, "");
    return `${formatted} млн`;
  }
  if (value >= 1_000) {
    return value.toLocaleString("en-US");
  }
  return String(value);
}

/**
 * Format a timestamp as a Russian relative-time string.
 * Returns strings like "2 мин назад", "1 ч назад", "3 дн назад".
 */
export function formatRelativeTime(timestampMs: number): string {
  const now = Date.now();
  const diffMs = now - timestampMs;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) {
    return "только что";
  }
  if (diffMin < 60) {
    return `${diffMin} мин назад`;
  }
  if (diffHour < 24) {
    if (diffMin % 60 >= 30 && diffHour < 2) {
      return `${diffHour}.5 ч назад`;
    }
    return `${diffHour} ч назад`;
  }
  if (diffDay < 30) {
    return `${diffDay} дн назад`;
  }
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth} мес назад`;
}

/**
 * Extract a MetricSet from a TableRowData row so parent levels
 * can re-aggregate from children.  The whatsapp/appointment/treatment/plans
 * fields are not present on TableRowData so they zero out, which is fine
 * because those fields are not used for any derived KPI formula.
 */
export function rowToMetricSet(row: TableRowData): MetricSet {
  return {
    impressions: row.impressions,
    clicks: row.clicks,
    spend: row.expenses,
    leads: row.leads,
    results: row.results,
    reach: row.reach,
    whatsappRequests: 0,
    appointmentsScheduled: 0,
    treatmentsCompleted: 0,
    plansSent: 0,
  };
}

// ---- Rounding utilities ----------------------------------------------------

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
