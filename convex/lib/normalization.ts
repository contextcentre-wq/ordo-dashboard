import { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import { DataModel } from "../_generated/dataModel";
import { Id } from "../_generated/dataModel";

// Enrich a record with ad hierarchy names by looking up ad -> adGroup -> campaign.
// Works with both query and mutation contexts.
export async function enrichWithAdHierarchy(
  ctx: { db: GenericQueryCtx<DataModel>["db"] },
  adId: Id<"ads">
): Promise<{
  adName: string | undefined;
  adGroupName: string | undefined;
  campaignName: string | undefined;
}> {
  const ad = await ctx.db.get(adId);
  if (!ad) {
    return { adName: undefined, adGroupName: undefined, campaignName: undefined };
  }

  const adGroup = await ctx.db.get(ad.adGroupId);
  const campaign = await ctx.db.get(ad.campaignId);

  return {
    adName: ad.name,
    adGroupName: adGroup?.name,
    campaignName: campaign?.name,
  };
}

// Compute match quality based on available linking data.
export function computeMatchQuality(
  adId: string | null | undefined,
  channel: string | null | undefined
): "exact" | "channel_only" | "none" {
  if (adId) return "exact";
  if (channel) return "channel_only";
  return "none";
}

// Compute days between registration and sale (in whole days).
export function computeDaysToSale(
  registrationDate: number,
  saleDate: number
): number {
  return Math.round((saleDate - registrationDate) / 86400000);
}
