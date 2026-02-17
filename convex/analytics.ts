// Analytics query: builds the hierarchical TableRowData[] tree for the
// DataTable component on the Analytics page.
//
// Hierarchy:  adAccount ("project" type) -> campaign -> adGroup ("group") -> ad
// Each level aggregates metrics from its children and computes derived KPIs.
// Income is computed via the attribution engine (direct + late sales).

import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import {
  MetricSet,
  TableRowData,
  sumMetrics,
  buildTableRowData,
  rowToMetricSet,
} from "./lib/aggregation";
import {
  getAdActivePeriods,
  attributeSalesForAd,
  SaleForAttribution,
} from "./lib/attribution";

// ---------------------------------------------------------------------------
// Main hierarchical data query
// ---------------------------------------------------------------------------

export const getHierarchicalData = query({
  args: {
    projectId: v.id("projects"),
    startTs: v.number(),
    endTs: v.number(),
  },
  handler: async (ctx, args): Promise<TableRowData[]> => {
    // ----- 1. Fetch all adDailyStats for the project in the date range -----
    const stats = await ctx.db
      .query("adDailyStats")
      .withIndex("by_project_date", (q) =>
        q
          .eq("projectId", args.projectId)
          .gte("dateTs", args.startTs)
          .lte("dateTs", args.endTs)
      )
      .collect();

    // ----- 2. Fetch hierarchy entities for this project --------------------
    const ads = await ctx.db
      .query("ads")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const adGroups = await ctx.db
      .query("adGroups")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const adAccounts = await ctx.db
      .query("adAccounts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // ----- 3. Fetch ALL sales for project (attribution needs full history) -
    const allSales = await ctx.db
      .query("sales")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // ----- 4. Fetch ALL leads for project (for qualified-lead counts) ------
    const allLeads = await ctx.db
      .query("leads")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // ----- 5. Utility: group items by a string key -------------------------
    function groupByKey<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
      const map = new Map<string, T[]>();
      for (const item of items) {
        const key = keyFn(item);
        const group = map.get(key);
        if (group) {
          group.push(item);
        } else {
          map.set(key, [item]);
        }
      }
      return map;
    }

    // ----- 6. Get ad active periods from stats data ------------------------
    const activePeriods = getAdActivePeriods(
      stats.map((s) => ({ adId: s.adId as string, date: s.date }))
    );

    // ----- 7. Group stats by adId, SUM metrics -----------------------------
    const statsGroupedByAd = groupByKey(stats, (s) => s.adId as string);
    const statsByAd = new Map<string, MetricSet>();
    for (const [adIdStr, adStats] of statsGroupedByAd) {
      statsByAd.set(adIdStr, sumMetrics(adStats));
    }

    // ----- 8. Prepare sales & leads lookups per ad -------------------------

    // Convert sales to attribution format, filtering out those with no adId
    const attributableSales: SaleForAttribution[] = allSales
      .filter((sale) => sale.adId != null)
      .map((sale) => ({
        _id: sale._id as string,
        adId: sale.adId as string,
        amount: sale.amount,
        registrationDateStr: sale.registrationDateStr,
        saleDateStr: sale.saleDateStr,
        clientName: sale.clientName,
        dealStatus: sale.dealStatus,
        dealLink: sale.dealLink,
      }));

    const salesByAd = groupByKey(attributableSales, (s) => s.adId as string);

    // Qualified leads count per ad
    const qLeadsByAd = new Map<string, number>();
    for (const lead of allLeads) {
      if (!lead.adId || !lead.isQualified) continue;
      const adIdStr = lead.adId as string;
      qLeadsByAd.set(adIdStr, (qLeadsByAd.get(adIdStr) ?? 0) + 1);
    }

    // ----- 9. Run attribution per ad to compute income & sales count -------
    const adIncome = new Map<string, number>();
    const adSalesCount = new Map<string, number>();

    for (const adIdStr of statsByAd.keys()) {
      const adSales = salesByAd.get(adIdStr) ?? [];
      const period = activePeriods.get(adIdStr);
      const lastActiveDate = period?.lastDate ?? "";

      // Collect unique stat dates for this ad from the already-grouped stats
      const adStatDates = new Set(
        (statsGroupedByAd.get(adIdStr) ?? []).map((s) => s.date)
      );

      let totalIncome = 0;
      let totalSalesCount = 0;

      // Track attributed sale IDs to avoid double-counting across dates
      const attributedSaleIds = new Set<string>();

      for (const statDate of adStatDates) {
        const attribution = attributeSalesForAd(
          adIdStr,
          statDate,
          lastActiveDate,
          adSales
        );

        for (const detail of attribution.details) {
          // Find the matching sale to get its unique ID
          const matchingSale = adSales.find(
            (s) =>
              s.registrationDateStr === detail.registrationDate &&
              s.amount === detail.amount &&
              s.clientName === detail.client &&
              !attributedSaleIds.has(s._id)
          );
          if (matchingSale && !attributedSaleIds.has(matchingSale._id)) {
            attributedSaleIds.add(matchingSale._id);
            totalIncome += detail.amount;
            totalSalesCount += 1;
          }
        }
      }

      adIncome.set(adIdStr, totalIncome);
      adSalesCount.set(adIdStr, totalSalesCount);
    }

    // ----- 10. Build the hierarchy tree ------------------------------------

    const adsByGroup = groupByKey(ads, (ad) => ad.adGroupId as string);
    const groupsByCampaign = groupByKey(adGroups, (ag) => ag.campaignId as string);
    const campaignsByAccount = groupByKey(campaigns, (c) => c.adAccountId as string);

    // -- Level 4: build ad rows --
    function buildAdRow(
      ad: Doc<"ads">,
      accountName: string
    ): TableRowData | null {
      const adIdStr = ad._id as string;
      const metrics = statsByAd.get(adIdStr);
      // Skip ads with no stats in this date range
      if (!metrics) return null;

      return buildTableRowData({
        id: adIdStr,
        name: ad.name,
        type: "ad",
        isActive: ad.isActive,
        account: accountName,
        metrics,
        income: adIncome.get(adIdStr) ?? 0,
        qLeads: qLeadsByAd.get(adIdStr) ?? 0,
        salesCount: adSalesCount.get(adIdStr) ?? 0,
        adId: ad.externalAdId,
      });
    }

    // Build a parent row by aggregating its children
    function buildParentRow(
      id: string,
      name: string,
      type: TableRowData["type"],
      isActive: boolean,
      account: string,
      childRows: TableRowData[]
    ): TableRowData {
      return buildTableRowData({
        id,
        name,
        type,
        isActive,
        account,
        metrics: sumMetrics(childRows.map(rowToMetricSet)),
        income: childRows.reduce((sum, r) => sum + r.income, 0),
        qLeads: childRows.reduce((sum, r) => sum + r.qLeads, 0),
        salesCount: childRows.reduce((sum, r) => sum + r.sales, 0),
        children: childRows,
      });
    }

    // -- Level 3: build ad group rows --
    function buildGroupRow(
      group: Doc<"adGroups">,
      accountName: string
    ): TableRowData | null {
      const groupAds = adsByGroup.get(group._id as string) ?? [];
      const childRows = groupAds
        .map((ad) => buildAdRow(ad, accountName))
        .filter((row): row is TableRowData => row !== null);

      if (childRows.length === 0) return null;
      return buildParentRow(group._id as string, group.name, "group", group.isActive, accountName, childRows);
    }

    // -- Level 2: build campaign rows --
    function buildCampaignRow(
      campaign: Doc<"campaigns">,
      accountName: string
    ): TableRowData | null {
      const campaignGroups = groupsByCampaign.get(campaign._id as string) ?? [];
      const childRows = campaignGroups
        .map((group) => buildGroupRow(group, accountName))
        .filter((row): row is TableRowData => row !== null);

      if (childRows.length === 0) return null;
      return buildParentRow(campaign._id as string, campaign.name, "campaign", campaign.isActive, accountName, childRows);
    }

    // -- Level 1: build ad account rows (type = "project") --
    const channelLabels: Record<string, string> = {
      facebook: "Facebook Ads",
      google: "Google Ads",
      tiktok: "TikTok Ads",
    };

    const topLevelRows: TableRowData[] = [];

    for (const account of adAccounts) {
      const accountIdStr = account._id as string;
      const accountCampaigns = campaignsByAccount.get(accountIdStr) ?? [];
      const childRows = accountCampaigns
        .map((campaign) => buildCampaignRow(campaign, account.name))
        .filter((row): row is TableRowData => row !== null);

      if (childRows.length === 0) continue;

      const displayName = channelLabels[account.channel] ?? account.name;
      topLevelRows.push(
        buildParentRow(accountIdStr, displayName, "project", account.isActive, account.name, childRows)
      );
    }

    return topLevelRows;
  },
});
