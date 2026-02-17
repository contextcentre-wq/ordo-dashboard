import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// --- Internal mutations for hierarchy auto-creation ---

// Find or create an ad account by externalAccountId.
const findOrCreateAdAccount = internalMutation({
  args: {
    projectId: v.id("projects"),
    externalAccountId: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adAccounts")
      .withIndex("by_external_id", (q) =>
        q.eq("externalAccountId", args.externalAccountId)
      )
      .first();

    if (existing) return existing._id;

    const id = await ctx.db.insert("adAccounts", {
      projectId: args.projectId,
      externalAccountId: args.externalAccountId,
      name: `Google Ads ${args.externalAccountId}`,
      channel: args.channel,
      isActive: true,
    });
    return id;
  },
});

// Find or create a campaign by external campaign resource name.
const findOrCreateCampaign = internalMutation({
  args: {
    projectId: v.id("projects"),
    adAccountId: v.id("adAccounts"),
    externalCampaignId: v.string(),
    name: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const existing = campaigns.find(
      (c) => c.externalCampaignId === args.externalCampaignId
    );

    if (existing) {
      if (existing.name !== args.name) {
        await ctx.db.patch(existing._id, { name: args.name });
      }
      return existing._id;
    }

    const id = await ctx.db.insert("campaigns", {
      projectId: args.projectId,
      adAccountId: args.adAccountId,
      externalCampaignId: args.externalCampaignId,
      name: args.name,
      channel: args.channel,
      isActive: true,
    });
    return id;
  },
});

// Find or create an ad group by external ad group resource name.
const findOrCreateAdGroup = internalMutation({
  args: {
    projectId: v.id("projects"),
    campaignId: v.id("campaigns"),
    externalAdsetId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const adGroups = await ctx.db
      .query("adGroups")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const existing = adGroups.find(
      (g) => g.externalAdsetId === args.externalAdsetId
    );

    if (existing) {
      if (existing.name !== args.name) {
        await ctx.db.patch(existing._id, { name: args.name });
      }
      return existing._id;
    }

    const id = await ctx.db.insert("adGroups", {
      campaignId: args.campaignId,
      projectId: args.projectId,
      externalAdsetId: args.externalAdsetId,
      name: args.name,
      isActive: true,
    });
    return id;
  },
});

// Find or create an ad by externalAdId.
const findOrCreateAd = internalMutation({
  args: {
    projectId: v.id("projects"),
    adGroupId: v.id("adGroups"),
    campaignId: v.id("campaigns"),
    externalAdId: v.string(),
    name: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ads")
      .withIndex("by_external_id", (q) =>
        q.eq("externalAdId", args.externalAdId)
      )
      .first();

    if (existing) {
      if (existing.name !== args.name) {
        await ctx.db.patch(existing._id, { name: args.name });
      }
      return existing._id;
    }

    const id = await ctx.db.insert("ads", {
      adGroupId: args.adGroupId,
      campaignId: args.campaignId,
      projectId: args.projectId,
      externalAdId: args.externalAdId,
      name: args.name,
      channel: args.channel,
      isActive: true,
    });
    return id;
  },
});

// Upsert daily stats for an ad.
const upsertDailyStats = internalMutation({
  args: {
    adId: v.id("ads"),
    projectId: v.id("projects"),
    date: v.string(),
    dateTs: v.number(),
    impressions: v.number(),
    clicks: v.number(),
    spend: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adDailyStats")
      .withIndex("by_ad_date", (q) =>
        q.eq("adId", args.adId).eq("date", args.date)
      )
      .first();

    const record = {
      adId: args.adId,
      projectId: args.projectId,
      date: args.date,
      dateTs: args.dateTs,
      impressions: args.impressions,
      clicks: args.clicks,
      spend: args.spend,
      leads: 0,
      results: 0,
      reach: 0,
      whatsappRequests: 0,
      appointmentsScheduled: 0,
      treatmentsCompleted: 0,
      plansSent: 0,
    };

    if (existing) {
      await ctx.db.patch(existing._id, record);
      return existing._id;
    } else {
      return await ctx.db.insert("adDailyStats", record);
    }
  },
});

// --- Main sync action ---

export const syncAdStats = internalAction({
  args: {
    projectId: v.id("projects"),
    adPlatformConfig: v.object({
      channel: v.string(),
      accountId: v.string(),
      accessToken: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { projectId, adPlatformConfig } = args;
    const { accountId, accessToken } = adPlatformConfig;

    if (!accessToken) {
      console.error(
        `Google Ads sync: no access token for account ${accountId}`
      );
      return { success: false, error: "No access token", rowsSynced: 0 };
    }

    console.log(`Google Ads sync: starting for account ${accountId}`);

    // Determine date range: last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    // Find or create the ad account
    const adAccountId = await ctx.runMutation(
      internal.integrations.google.findOrCreateAdAccount,
      {
        projectId,
        externalAccountId: accountId,
        channel: "google",
      }
    );

    // Google Ads GAQL query for ad-level performance
    const gaqlQuery = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        segments.date
      FROM ad_group_ad
      WHERE segments.date BETWEEN '${startDateStr}' AND '${endDateStr}'
    `.trim();

    // Google Ads REST API: customers/{customerId}/googleAds:searchStream
    const url = `https://googleads.googleapis.com/v16/customers/${accountId}/googleAds:searchStream`;

    let totalRows = 0;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        },
        body: JSON.stringify({ query: gaqlQuery }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `Google Ads API error: ${response.status} — ${errorBody.slice(0, 300)}`
        );
        return {
          success: false,
          error: `API error ${response.status}`,
          rowsSynced: 0,
        };
      }

      const json = await response.json();

      // searchStream returns an array of batches, each with a results array
      const batches = Array.isArray(json) ? json : [json];

      for (const batch of batches) {
        const results = batch.results || [];

        for (const row of results) {
          try {
            const processed = await processGoogleRow(
              ctx,
              projectId,
              adAccountId,
              row
            );
            if (processed) totalRows++;
          } catch (error: any) {
            console.error(
              `Google Ads sync: error processing row:`,
              error.message
            );
          }
        }
      }
    } catch (error: any) {
      console.error(`Google Ads sync fetch error:`, error.message);
      return {
        success: false,
        error: error.message,
        rowsSynced: totalRows,
      };
    }

    console.log(
      `Google Ads sync: completed for account ${accountId}, ${totalRows} rows synced`
    );

    return { success: true, rowsSynced: totalRows };
  },
});

// --- Helpers ---

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function processGoogleRow(
  ctx: any,
  projectId: Id<"projects">,
  adAccountId: Id<"adAccounts">,
  row: any
): Promise<boolean> {
  const campaign = row.campaign || {};
  const adGroup = row.adGroup || {};
  const adGroupAd = row.adGroupAd?.ad || {};
  const metrics = row.metrics || {};
  const segments = row.segments || {};

  const campaignId = campaign.id ? String(campaign.id) : null;
  const campaignName = campaign.name || `Campaign ${campaignId}`;
  const adGroupId = adGroup.id ? String(adGroup.id) : null;
  const adGroupName = adGroup.name || `Ad Group ${adGroupId}`;
  const adId = adGroupAd.id ? String(adGroupAd.id) : null;
  const adName = adGroupAd.name || `Ad ${adId}`;
  const dateStr = segments.date;

  if (!campaignId || !adGroupId || !adId || !dateStr) {
    return false;
  }

  // Auto-create campaign
  const convexCampaignId = await ctx.runMutation(
    internal.integrations.google.findOrCreateCampaign,
    {
      projectId,
      adAccountId,
      externalCampaignId: campaignId,
      name: campaignName,
      channel: "google",
    }
  );

  // Auto-create ad group
  const convexAdGroupId = await ctx.runMutation(
    internal.integrations.google.findOrCreateAdGroup,
    {
      projectId,
      campaignId: convexCampaignId,
      externalAdsetId: adGroupId,
      name: adGroupName,
    }
  );

  // Auto-create ad
  const convexAdId = await ctx.runMutation(
    internal.integrations.google.findOrCreateAd,
    {
      projectId,
      adGroupId: convexAdGroupId,
      campaignId: convexCampaignId,
      externalAdId: adId,
      name: adName,
      channel: "google",
    }
  );

  // Extract metrics — Google Ads returns cost in micros (1/1,000,000 of currency)
  const impressions = Number(metrics.impressions || 0);
  const clicks = Number(metrics.clicks || 0);
  const costMicros = Number(metrics.costMicros || metrics.cost_micros || 0);
  const spend = costMicros / 1_000_000;

  // Upsert daily stats
  const dateTs = new Date(dateStr).getTime();

  await ctx.runMutation(internal.integrations.google.upsertDailyStats, {
    adId: convexAdId,
    projectId,
    date: dateStr,
    dateTs,
    impressions,
    clicks,
    spend,
  });

  return true;
}
