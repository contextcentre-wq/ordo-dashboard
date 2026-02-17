import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const importHierarchy = action({
  args: {
    projectId: v.id("projects"),
    data: v.object({
      accounts: v.array(
        v.object({
          externalAccountId: v.string(),
          name: v.string(),
          channel: v.string(),
        })
      ),
      campaigns: v.array(
        v.object({
          externalAccountId: v.string(),
          externalCampaignId: v.optional(v.string()),
          name: v.string(),
          channel: v.string(),
        })
      ),
      adGroups: v.array(
        v.object({
          externalCampaignId: v.string(),
          externalAdsetId: v.optional(v.string()),
          name: v.string(),
        })
      ),
      ads: v.array(
        v.object({
          externalAdsetId: v.string(),
          externalAdId: v.string(),
          name: v.string(),
          channel: v.string(),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const { projectId, data } = args;

    // Maps from external IDs to Convex IDs for linking hierarchy
    const accountMap = new Map<string, string>();
    const campaignMap = new Map<string, string>();
    const adGroupMap = new Map<string, string>();
    // Track which campaign each ad group belongs to
    const adGroupToCampaignMap = new Map<string, string>();

    // 1. Import ad accounts, deduplicating by externalAccountId
    const seenAccounts = new Set<string>();
    for (const account of data.accounts) {
      if (seenAccounts.has(account.externalAccountId)) continue;
      seenAccounts.add(account.externalAccountId);

      const accountId = await ctx.runMutation(api.adAccounts.create, {
        projectId,
        externalAccountId: account.externalAccountId,
        name: account.name,
        channel: account.channel,
      });
      accountMap.set(account.externalAccountId, accountId);
    }

    // 2. Import campaigns, linking to accounts via externalAccountId
    const seenCampaigns = new Set<string>();
    for (const campaign of data.campaigns) {
      const dedupeKey =
        campaign.externalCampaignId ??
        `${campaign.externalAccountId}:${campaign.name}`;
      if (seenCampaigns.has(dedupeKey)) continue;
      seenCampaigns.add(dedupeKey);

      const adAccountId = accountMap.get(campaign.externalAccountId);
      if (!adAccountId) {
        console.warn(
          `Skipping campaign "${campaign.name}": no account found for externalAccountId "${campaign.externalAccountId}"`
        );
        continue;
      }

      const campaignId = await ctx.runMutation(api.campaigns.create, {
        projectId,
        adAccountId: adAccountId as any,
        externalCampaignId: campaign.externalCampaignId,
        name: campaign.name,
        channel: campaign.channel,
      });

      if (campaign.externalCampaignId) {
        campaignMap.set(campaign.externalCampaignId, campaignId);
      }
    }

    // 3. Import ad groups, linking to campaigns via externalCampaignId
    const seenAdGroups = new Set<string>();
    for (const adGroup of data.adGroups) {
      const dedupeKey =
        adGroup.externalAdsetId ??
        `${adGroup.externalCampaignId}:${adGroup.name}`;
      if (seenAdGroups.has(dedupeKey)) continue;
      seenAdGroups.add(dedupeKey);

      const campaignId = campaignMap.get(adGroup.externalCampaignId);
      if (!campaignId) {
        console.warn(
          `Skipping ad group "${adGroup.name}": no campaign found for externalCampaignId "${adGroup.externalCampaignId}"`
        );
        continue;
      }

      const adGroupId = await ctx.runMutation(api.adGroups.create, {
        campaignId: campaignId as any,
        projectId,
        externalAdsetId: adGroup.externalAdsetId,
        name: adGroup.name,
      });

      if (adGroup.externalAdsetId) {
        adGroupMap.set(adGroup.externalAdsetId, adGroupId);
        adGroupToCampaignMap.set(adGroup.externalAdsetId, campaignId);
      }
    }

    // 4. Import ads, linking to ad groups via externalAdsetId
    const seenAds = new Set<string>();
    for (const ad of data.ads) {
      if (seenAds.has(ad.externalAdId)) continue;
      seenAds.add(ad.externalAdId);

      const adGroupId = adGroupMap.get(ad.externalAdsetId);
      if (!adGroupId) {
        console.warn(
          `Skipping ad "${ad.name}": no ad group found for externalAdsetId "${ad.externalAdsetId}"`
        );
        continue;
      }

      // Resolve campaignId from the adGroup's externalAdsetId
      const campaignId = adGroupToCampaignMap.get(ad.externalAdsetId);
      if (!campaignId) {
        console.warn(
          `Skipping ad "${ad.name}": could not resolve campaignId for adGroup with externalAdsetId "${ad.externalAdsetId}"`
        );
        continue;
      }

      await ctx.runMutation(api.ads.create, {
        adGroupId: adGroupId as any,
        campaignId: campaignId as any,
        projectId,
        externalAdId: ad.externalAdId,
        name: ad.name,
        channel: ad.channel,
      });
    }

    return {
      accountsImported: seenAccounts.size,
      campaignsImported: seenCampaigns.size,
      adGroupsImported: seenAdGroups.size,
      adsImported: seenAds.size,
    };
  },
});

export const importStats = action({
  args: {
    projectId: v.id("projects"),
    records: v.array(
      v.object({
        adId: v.id("ads"),
        date: v.string(),
        dateTs: v.number(),
        impressions: v.number(),
        clicks: v.number(),
        spend: v.number(),
        leads: v.number(),
        results: v.number(),
        whatsappRequests: v.number(),
        appointmentsScheduled: v.number(),
        treatmentsCompleted: v.number(),
        plansSent: v.number(),
        reach: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { projectId, records } = args;

    // Batch records into chunks to stay within mutation limits
    const BATCH_SIZE = 50;
    let totalUpserted = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE).map((record) => ({
        ...record,
        projectId,
      }));

      await ctx.runMutation(api.adDailyStats.upsertBatch, {
        records: batch,
      });

      totalUpserted += batch.length;
    }

    return { totalUpserted };
  },
});
