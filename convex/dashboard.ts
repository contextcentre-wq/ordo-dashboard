// Dashboard summary query: computes funnel stages, KPI metrics, top campaigns,
// recent events, income/expense totals, and stat cards for the Dashboard page.
//
// Uses the attribution engine for accurate income calculation and the shared
// metric helpers for all derived KPIs.

import { query } from "./_generated/server";
import { v } from "convex/values";
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
  calcCPShow,
} from "./lib/metrics";
import {
  formatDisplayValue,
  formatRelativeTime,
  round1,
  round2,
} from "./lib/aggregation";
import {
  getAdActivePeriods,
  attributeSalesForAd,
  SaleForAttribution,
} from "./lib/attribution";

// ---------------------------------------------------------------------------
// Main dashboard summary query
// ---------------------------------------------------------------------------

export const getDashboardSummary = query({
  args: {
    projectId: v.id("projects"),
    startTs: v.number(),
    endTs: v.number(),
  },
  handler: async (ctx, args) => {
    // ----- Fetch all relevant data -----------------------------------------
    const dailyStats = await ctx.db
      .query("adDailyStats")
      .withIndex("by_project_date", (q) =>
        q
          .eq("projectId", args.projectId)
          .gte("dateTs", args.startTs)
          .lte("dateTs", args.endTs)
      )
      .collect();

    const leads = await ctx.db
      .query("leads")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const sales = await ctx.db
      .query("sales")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const ads = await ctx.db
      .query("ads")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // ----- Aggregate totals from daily stats -------------------------------
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalSpend = 0;
    let totalResults = 0;
    let totalReach = 0;
    let totalStatsLeads = 0;
    let totalAppointmentsScheduled = 0;
    let totalAppointmentsAttended = 0;

    for (const stat of dailyStats) {
      totalImpressions += stat.impressions;
      totalClicks += stat.clicks;
      totalSpend += stat.spend;
      totalResults += stat.results;
      totalReach += stat.reach;
      totalStatsLeads += stat.leads;
      totalAppointmentsScheduled += stat.appointmentsScheduled;
      totalAppointmentsAttended += stat.appointmentsAttended ?? 0;
    }

    // ----- Leads counts ----------------------------------------------------
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter((l) => l.isQualified).length;

    // ----- Attribution-based income ----------------------------------------
    // Group sales by adId for the attribution engine
    const salesByAd = new Map<string, SaleForAttribution[]>();
    for (const sale of sales) {
      const adIdStr = sale.adId ? (sale.adId as string) : null;
      if (!adIdStr) continue;
      const saleForAttr: SaleForAttribution = {
        _id: sale._id as string,
        adId: adIdStr,
        amount: sale.amount,
        registrationDateStr: sale.registrationDateStr,
        saleDateStr: sale.saleDateStr,
        clientName: sale.clientName,
        dealStatus: sale.dealStatus,
        dealLink: sale.dealLink,
      };
      const existing = salesByAd.get(adIdStr);
      if (existing) {
        existing.push(saleForAttr);
      } else {
        salesByAd.set(adIdStr, [saleForAttr]);
      }
    }

    // Get active periods per ad from stats
    const activePeriods = getAdActivePeriods(
      dailyStats.map((s) => ({ adId: s.adId as string, date: s.date }))
    );

    // Group stats by adId to know which dates each ad was active
    const statDatesByAd = new Map<string, Set<string>>();
    for (const stat of dailyStats) {
      const adIdStr = stat.adId as string;
      const existing = statDatesByAd.get(adIdStr);
      if (existing) {
        existing.add(stat.date);
      } else {
        statDatesByAd.set(adIdStr, new Set([stat.date]));
      }
    }

    // Run attribution per ad and accumulate totals
    let totalIncome = 0;
    let totalSalesCount = 0;
    const adIncome = new Map<string, number>();
    const adSalesCount = new Map<string, number>();

    for (const [adIdStr, adStatDates] of statDatesByAd.entries()) {
      const adSales = salesByAd.get(adIdStr) ?? [];
      const period = activePeriods.get(adIdStr);
      const lastActiveDate = period?.lastDate ?? "";

      let adTotalIncome = 0;
      let adTotalSalesCount = 0;
      const attributedSaleIds = new Set<string>();

      for (const statDate of adStatDates) {
        const attribution = attributeSalesForAd(
          adIdStr,
          statDate,
          lastActiveDate,
          adSales
        );

        for (const detail of attribution.details) {
          const matchingSale = adSales.find(
            (s) =>
              s.registrationDateStr === detail.registrationDate &&
              s.amount === detail.amount &&
              s.clientName === detail.client &&
              !attributedSaleIds.has(s._id)
          );
          if (matchingSale && !attributedSaleIds.has(matchingSale._id)) {
            attributedSaleIds.add(matchingSale._id);
            adTotalIncome += detail.amount;
            adTotalSalesCount += 1;
          }
        }
      }

      adIncome.set(adIdStr, adTotalIncome);
      adSalesCount.set(adIdStr, adTotalSalesCount);
      totalIncome += adTotalIncome;
      totalSalesCount += adTotalSalesCount;
    }

    // Also count unattributed sales (no adId or no matching stats)
    for (const sale of sales) {
      const adIdStr = sale.adId ? (sale.adId as string) : null;
      if (!adIdStr || !statDatesByAd.has(adIdStr)) {
        totalIncome += sale.amount;
        totalSalesCount += 1;
      }
    }

    const totalExpense = totalSpend;
    const activeCampaignsCount = campaigns.filter((c) => c.isActive).length;

    // ----- Compute KPI metrics ---------------------------------------------
    const cpm = calcCPM(totalExpense, totalImpressions);
    const cpc = calcCPC(totalExpense, totalClicks);
    const ctr = calcCTR(totalClicks, totalImpressions);
    const cpr = calcCPR(totalExpense, totalResults);
    const cpl = calcCPL(totalExpense, totalLeads);
    const cpql = calcCPqL(totalExpense, qualifiedLeads);
    const cps = calcCPS(totalExpense, totalSalesCount);
    const aov = calcAOV(totalIncome, totalSalesCount);
    const roas = calcROAS(totalIncome, totalExpense);
    const cpshow = calcCPShow(totalExpense, totalAppointmentsAttended);

    // ----- Build funnel stages (FunnelStage[]) -----------------------------
    const funnel = [
      {
        label: "Охваты",
        value: totalReach,
        displayValue: formatDisplayValue(totalReach),
        conversionRate: 0,
      },
      {
        label: "Показы",
        value: totalImpressions,
        displayValue: formatDisplayValue(totalImpressions),
        conversionRate:
          totalReach > 0
            ? round2((totalImpressions / totalReach) * 100)
            : 0,
      },
      {
        label: "Клики",
        value: totalClicks,
        displayValue: formatDisplayValue(totalClicks),
        conversionRate:
          totalImpressions > 0
            ? round2((totalClicks / totalImpressions) * 100)
            : 0,
      },
      {
        label: "Результаты",
        value: totalResults,
        displayValue: formatDisplayValue(totalResults),
        conversionRate:
          totalClicks > 0
            ? round2((totalResults / totalClicks) * 100)
            : 0,
      },
      {
        label: "Лиды",
        value: totalLeads,
        displayValue: formatDisplayValue(totalLeads),
        conversionRate:
          totalResults > 0
            ? round2((totalLeads / totalResults) * 100)
            : 0,
      },
      {
        label: "кЛиды",
        value: qualifiedLeads,
        displayValue: formatDisplayValue(qualifiedLeads),
        conversionRate:
          totalLeads > 0
            ? round2((qualifiedLeads / totalLeads) * 100)
            : 0,
      },
    ];

    // ----- Admin & Doctor metrics for 3-section funnel -----------------------
    const adminMetrics = {
      appointmentsScheduled: totalAppointmentsScheduled,
      appointmentsAttended: totalAppointmentsAttended,
      salesCount: totalSalesCount,
      conversionToAppointment:
        qualifiedLeads > 0
          ? round2((totalAppointmentsScheduled / qualifiedLeads) * 100)
          : 0,
      conversionToShowUp:
        totalAppointmentsScheduled > 0
          ? round2(
              (totalAppointmentsAttended / totalAppointmentsScheduled) * 100
            )
          : 0,
    };

    const doctorMetrics = {
      averageCheck: aov,
      conversionToTotal:
        totalAppointmentsAttended > 0
          ? round2((totalSalesCount / totalAppointmentsAttended) * 100)
          : 0,
    };

    // ----- Build KPI cards (Metric[]) --------------------------------------
    const kpis = [
      { label: "CPM", value: `$${cpm.toFixed(2)}` },
      { label: "CPC", value: `$${cpc.toFixed(2)}` },
      { label: "CTR", value: `${ctr.toFixed(2)}%` },
      { label: "CPR", value: `$${cpr.toFixed(2)}` },
      { label: "CPL", value: `$${cpl.toFixed(2)}` },
      { label: "CPqL", value: `$${cpql.toFixed(2)}` },
      { label: "CPS", value: `$${cps.toFixed(2)}` },
      { label: "AOV", value: `$${aov.toFixed(2)}` },
      { label: "CPShow", value: `$${cpshow.toFixed(2)}` },
    ];

    // ----- Top 5 campaigns by results -------------------------------------
    // Build a map of campaignId -> list of adIds
    const adsByCampaign = new Map<string, string[]>();
    for (const ad of ads) {
      const campaignIdStr = ad.campaignId as string;
      const existing = adsByCampaign.get(campaignIdStr);
      if (existing) {
        existing.push(ad._id as string);
      } else {
        adsByCampaign.set(campaignIdStr, [ad._id as string]);
      }
    }

    // Aggregate stats per ad for campaign-level rollup
    const statsByAd = new Map<
      string,
      { spend: number; results: number }
    >();
    for (const stat of dailyStats) {
      const adIdStr = stat.adId as string;
      const existing = statsByAd.get(adIdStr) ?? { spend: 0, results: 0 };
      existing.spend += stat.spend;
      existing.results += stat.results;
      statsByAd.set(adIdStr, existing);
    }

    const topCampaigns = campaigns
      .map((campaign) => {
        const campaignAdIds =
          adsByCampaign.get(campaign._id as string) ?? [];
        let campaignSpend = 0;
        let campaignResults = 0;
        let campaignIncome = 0;

        for (const adIdStr of campaignAdIds) {
          const adStats = statsByAd.get(adIdStr);
          if (adStats) {
            campaignSpend += adStats.spend;
            campaignResults += adStats.results;
          }
          campaignIncome += adIncome.get(adIdStr) ?? 0;
        }

        return {
          name: campaign.name,
          results: campaignResults,
          roas: round2(calcROAS(campaignIncome, campaignSpend)),
        };
      })
      .filter((c) => c.results > 0)
      .sort((a, b) => b.results - a.results)
      .slice(0, 5);

    // ----- Last 6 events (leads + sales, sorted by time desc) --------------
    type EventItem = {
      type: "lead" | "sale" | "campaign";
      text: string;
      time: string;
      sortTs: number;
    };

    const leadEvents: EventItem[] = leads
      .map((lead) => ({
        type: "lead" as const,
        text: `Новый лид — ${maskPhone(lead.phone)}`,
        time: formatRelativeTime(lead.createdAt),
        sortTs: lead.createdAt,
      }));

    const saleEvents: EventItem[] = sales
      .map((sale) => ({
        type: "sale" as const,
        text: `Продажа — $${sale.amount.toLocaleString()}`,
        time: formatRelativeTime(sale.createdAt),
        sortTs: sale.createdAt,
      }));

    const recentEvents = [...leadEvents, ...saleEvents]
      .sort((a, b) => b.sortTs - a.sortTs)
      .slice(0, 6)
      .map(({ type, text, time }) => ({ type, text, time }));

    // ----- Campaign stats ---------------------------------------------------
    const campaignStats = {
      activeCampaignsCount,
      totalResults,
      cpr: round2(cpr),
      qualifiedLeads,
    };

    // ----- Return full summary ---------------------------------------------
    return {
      funnel,
      kpis,
      income: round2(totalIncome),
      expense: round2(totalExpense),
      roasValue: round2(roas),
      topCampaigns,
      recentEvents,
      campaignStats,
      adminMetrics,
      doctorMetrics,
    };
  },
});

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Mask a phone number for display: show prefix and last 4 digits.
 * E.g. "+7 701 234 5678" -> "+7 701 *** 5678"
 */
function maskPhone(phone: string): string {
  if (phone.length <= 8) return phone;
  return phone.slice(0, 8) + " *** " + phone.slice(-4);
}
