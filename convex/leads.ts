import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { enrichWithAdHierarchy } from "./lib/normalization";

// Create a new lead. Sets isQualified=false by default.
// When adId is provided, auto-populates denormalized ad/adGroup/campaign names.
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    adId: v.optional(v.id("ads")),
    channel: v.optional(v.string()),
    externalDealId: v.optional(v.string()),
    dealLink: v.optional(v.string()),
    phone: v.string(),
    clientName: v.optional(v.string()),
    contactType: v.string(),
    leadType: v.string(),
    budget: v.number(),
    status: v.string(),
    pipeline: v.string(),
    responsible: v.optional(v.string()),
    createdAt: v.number(),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    adName: v.optional(v.string()),
    adGroupName: v.optional(v.string()),
    campaignName: v.optional(v.string()),
    creativeName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let adName = args.adName;
    let adGroupName = args.adGroupName;
    let campaignName = args.campaignName;

    // Auto-enrich denormalized names from ad hierarchy when adId is provided
    if (args.adId) {
      const hierarchy = await enrichWithAdHierarchy(ctx, args.adId);
      adName = adName ?? hierarchy.adName;
      adGroupName = adGroupName ?? hierarchy.adGroupName;
      campaignName = campaignName ?? hierarchy.campaignName;
    }

    const leadId = await ctx.db.insert("leads", {
      projectId: args.projectId,
      adId: args.adId,
      channel: args.channel,
      externalDealId: args.externalDealId,
      dealLink: args.dealLink,
      phone: args.phone,
      clientName: args.clientName,
      contactType: args.contactType,
      leadType: args.leadType,
      budget: args.budget,
      status: args.status,
      pipeline: args.pipeline,
      responsible: args.responsible,
      createdAt: args.createdAt,
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
      utmCampaign: args.utmCampaign,
      utmContent: args.utmContent,
      utmTerm: args.utmTerm,
      adName,
      adGroupName,
      campaignName,
      creativeName: args.creativeName,
      isQualified: false,
      qualifiedAt: undefined,
    });

    return leadId;
  },
});

// Upsert a lead by externalDealId within a project.
// Finds existing lead by iterating leads matching projectId and checking
// externalDealId, then either patches or creates.
export const upsertByExternalId = mutation({
  args: {
    projectId: v.id("projects"),
    externalDealId: v.string(),
    adId: v.optional(v.id("ads")),
    channel: v.optional(v.string()),
    dealLink: v.optional(v.string()),
    phone: v.string(),
    clientName: v.optional(v.string()),
    contactType: v.string(),
    leadType: v.string(),
    budget: v.number(),
    status: v.string(),
    pipeline: v.string(),
    responsible: v.optional(v.string()),
    createdAt: v.number(),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    adName: v.optional(v.string()),
    adGroupName: v.optional(v.string()),
    campaignName: v.optional(v.string()),
    creativeName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { externalDealId, projectId, ...fields } = args;

    // Auto-enrich denormalized names when adId is provided
    let adName = fields.adName;
    let adGroupName = fields.adGroupName;
    let campaignName = fields.campaignName;

    if (fields.adId) {
      const hierarchy = await enrichWithAdHierarchy(ctx, fields.adId);
      adName = adName ?? hierarchy.adName;
      adGroupName = adGroupName ?? hierarchy.adGroupName;
      campaignName = campaignName ?? hierarchy.campaignName;
    }

    // Find existing lead by project + externalDealId
    const existingLeads = await ctx.db
      .query("leads")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    const existing = existingLeads.find(
      (lead) => lead.externalDealId === externalDealId
    );

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...fields,
        externalDealId,
        adName,
        adGroupName,
        campaignName,
      });
      return existing._id;
    } else {
      const leadId = await ctx.db.insert("leads", {
        projectId,
        externalDealId,
        ...fields,
        adName,
        adGroupName,
        campaignName,
        isQualified: false,
        qualifiedAt: undefined,
      });
      return leadId;
    }
  },
});

// Qualify a lead: sets isQualified=true and qualifiedAt=now.
export const qualify = mutation({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.leadId, {
      isQualified: true,
      qualifiedAt: Date.now(),
    });
  },
});

// List leads for a project, with optional date range, phone search, and limit.
// Uses by_project_created index for efficient range queries.
export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    startTs: v.optional(v.number()),
    endTs: v.optional(v.number()),
    phoneSearch: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const effectiveLimit = args.limit ?? 50;

    let q = ctx.db
      .query("leads")
      .withIndex("by_project_created", (q) => {
        let indexed = q.eq("projectId", args.projectId);
        if (args.startTs !== undefined && args.endTs !== undefined) {
          return indexed.gte("createdAt", args.startTs).lte("createdAt", args.endTs);
        } else if (args.startTs !== undefined) {
          return indexed.gte("createdAt", args.startTs);
        } else if (args.endTs !== undefined) {
          return indexed.lte("createdAt", args.endTs);
        }
        return indexed;
      });

    const allLeads = await q.collect();

    // Post-filter by phone substring if provided
    let filtered = allLeads;
    if (args.phoneSearch) {
      const search = args.phoneSearch.toLowerCase();
      filtered = allLeads.filter((lead) =>
        lead.phone.toLowerCase().includes(search)
      );
    }

    // Apply limit
    return filtered.slice(0, effectiveLimit);
  },
});

// List qualified leads for a project, with optional date range and limit.
export const listQualifiedByProject = query({
  args: {
    projectId: v.id("projects"),
    startTs: v.optional(v.number()),
    endTs: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const effectiveLimit = args.limit ?? 50;

    let q = ctx.db
      .query("leads")
      .withIndex("by_project_created", (q) => {
        let indexed = q.eq("projectId", args.projectId);
        if (args.startTs !== undefined && args.endTs !== undefined) {
          return indexed.gte("createdAt", args.startTs).lte("createdAt", args.endTs);
        } else if (args.startTs !== undefined) {
          return indexed.gte("createdAt", args.startTs);
        } else if (args.endTs !== undefined) {
          return indexed.lte("createdAt", args.endTs);
        }
        return indexed;
      });

    const allLeads = await q.collect();

    // Post-filter to only qualified leads
    const qualified = allLeads.filter((lead) => lead.isQualified === true);

    return qualified.slice(0, effectiveLimit);
  },
});

// Count leads in a project within an optional date range.
export const countByProject = query({
  args: {
    projectId: v.id("projects"),
    startTs: v.optional(v.number()),
    endTs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("leads")
      .withIndex("by_project_created", (q) => {
        let indexed = q.eq("projectId", args.projectId);
        if (args.startTs !== undefined && args.endTs !== undefined) {
          return indexed.gte("createdAt", args.startTs).lte("createdAt", args.endTs);
        } else if (args.startTs !== undefined) {
          return indexed.gte("createdAt", args.startTs);
        } else if (args.endTs !== undefined) {
          return indexed.lte("createdAt", args.endTs);
        }
        return indexed;
      });

    const leads = await q.collect();
    return leads.length;
  },
});
