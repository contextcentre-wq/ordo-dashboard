import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// --- Internal mutations for hierarchy auto-creation ---

// Find or create an ad account by externalAccountId for a project.
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
      name: `Facebook ${args.externalAccountId}`,
      channel: args.channel,
      isActive: true,
    });
    return id;
  },
});

// Find or create a campaign by externalCampaignId.
const findOrCreateCampaign = internalMutation({
  args: {
    projectId: v.id("projects"),
    adAccountId: v.id("adAccounts"),
    externalCampaignId: v.string(),
    name: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    // Search for existing campaign with matching externalCampaignId
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const existing = campaigns.find(
      (c) => c.externalCampaignId === args.externalCampaignId
    );

    if (existing) {
      // Update name if changed
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

// Find or create an ad group by externalAdsetId.
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
    leads: v.number(),
    results: v.number(),
    reach: v.number(),
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
      leads: args.leads,
      results: args.results,
      reach: args.reach,
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
        `Facebook sync: no access token for account ${accountId}`
      );
      return { success: false, error: "No access token", rowsSynced: 0 };
    }

    console.log(`Facebook sync: starting for account ${accountId}`);

    // Determine date range: last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const timeRange = JSON.stringify({
      since: formatDate(startDate),
      until: formatDate(endDate),
    });

    // Find or create the ad account
    const adAccountId = await ctx.runMutation(
      internal.integrations.facebook.findOrCreateAdAccount,
      {
        projectId,
        externalAccountId: accountId,
        channel: "facebook",
      }
    );

    let totalRows = 0;
    let nextUrl: string | null = buildInsightsUrl(
      accountId,
      accessToken,
      timeRange
    );

    try {
      // Paginate through all results
      while (nextUrl) {
        const response = await fetch(nextUrl);

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(
            `Facebook API error: ${response.status} — ${errorBody.slice(0, 300)}`
          );
          return {
            success: false,
            error: `API error ${response.status}`,
            rowsSynced: totalRows,
          };
        }

        const json = await response.json();
        const data = json.data || [];

        for (const row of data) {
          try {
            const rowResult = await processInsightRow(
              ctx,
              projectId,
              adAccountId,
              row
            );
            if (rowResult) totalRows++;
          } catch (error: any) {
            console.error(
              `Facebook sync: error processing row:`,
              error.message
            );
          }
        }

        // Check for pagination
        nextUrl = json.paging?.next || null;
      }
    } catch (error: any) {
      console.error(`Facebook sync fetch error:`, error.message);
      return {
        success: false,
        error: error.message,
        rowsSynced: totalRows,
      };
    }

    console.log(
      `Facebook sync: completed for account ${accountId}, ${totalRows} rows synced`
    );

    return { success: true, rowsSynced: totalRows };
  },
});

// --- Helpers ---

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function buildInsightsUrl(
  accountId: string,
  accessToken: string,
  timeRange: string
): string {
  const fields = [
    "impressions",
    "clicks",
    "spend",
    "actions",
    "reach",
    "campaign_name",
    "campaign_id",
    "adset_name",
    "adset_id",
    "ad_name",
    "ad_id",
  ].join(",");

  const params = new URLSearchParams({
    fields,
    time_range: timeRange,
    time_increment: "1", // daily breakdown
    level: "ad",
    limit: "500",
    access_token: accessToken,
  });

  return `https://graph.facebook.com/v19.0/act_${accountId}/insights?${params.toString()}`;
}

async function processInsightRow(
  ctx: any,
  projectId: Id<"projects">,
  adAccountId: Id<"adAccounts">,
  row: any
): Promise<boolean> {
  const campaignId = row.campaign_id;
  const campaignName = row.campaign_name || `Campaign ${campaignId}`;
  const adsetId = row.adset_id;
  const adsetName = row.adset_name || `Adset ${adsetId}`;
  const adId = row.ad_id;
  const adName = row.ad_name || `Ad ${adId}`;
  const dateStr = row.date_start;

  if (!campaignId || !adsetId || !adId || !dateStr) {
    return false;
  }

  // Auto-create campaign
  const convexCampaignId = await ctx.runMutation(
    internal.integrations.facebook.findOrCreateCampaign,
    {
      projectId,
      adAccountId,
      externalCampaignId: String(campaignId),
      name: campaignName,
      channel: "facebook",
    }
  );

  // Auto-create ad group
  const convexAdGroupId = await ctx.runMutation(
    internal.integrations.facebook.findOrCreateAdGroup,
    {
      projectId,
      campaignId: convexCampaignId,
      externalAdsetId: String(adsetId),
      name: adsetName,
    }
  );

  // Auto-create ad
  const convexAdId = await ctx.runMutation(
    internal.integrations.facebook.findOrCreateAd,
    {
      projectId,
      adGroupId: convexAdGroupId,
      campaignId: convexCampaignId,
      externalAdId: String(adId),
      name: adName,
      channel: "facebook",
    }
  );

  // Extract metrics
  const impressions = Number(row.impressions || 0);
  const clicks = Number(row.clicks || 0);
  const spend = Number(row.spend || 0);
  const reach = Number(row.reach || 0);

  // Extract leads/results from actions array
  let leads = 0;
  let results = 0;
  if (Array.isArray(row.actions)) {
    for (const action of row.actions) {
      if (action.action_type === "lead") {
        leads += Number(action.value || 0);
      }
      if (
        action.action_type === "offsite_conversion.fb_pixel_lead" ||
        action.action_type === "lead"
      ) {
        results += Number(action.value || 0);
      }
    }
  }

  // Upsert daily stats
  const dateTs = new Date(dateStr).getTime();

  await ctx.runMutation(internal.integrations.facebook.upsertDailyStats, {
    adId: convexAdId,
    projectId,
    date: dateStr,
    dateTs,
    impressions,
    clicks,
    spend,
    leads,
    results,
    reach,
  });

  return true;
}
