import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  enrichWithAdHierarchy,
  computeMatchQuality,
  computeDaysToSale,
} from "./lib/normalization";

// Create a new sale record.
// Auto-computes daysToSale, matchQuality, and timestamps.
// When adId is provided, auto-populates denormalized ad hierarchy names.
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    leadId: v.optional(v.id("leads")),
    adId: v.optional(v.id("ads")),
    channel: v.optional(v.string()),
    externalDealId: v.optional(v.string()),
    dealLink: v.optional(v.string()),
    dealStatus: v.string(),
    amount: v.number(),
    clientName: v.optional(v.string()),
    clientPhone: v.optional(v.string()),
    saleDate: v.number(),
    saleDateStr: v.string(),
    registrationDate: v.number(),
    registrationDateStr: v.string(),
    whatsappRequests: v.number(),
    appointmentsScheduled: v.number(),
    plansSent: v.number(),
    treatmentCompleted: v.boolean(),
    adName: v.optional(v.string()),
    adGroupName: v.optional(v.string()),
    campaignName: v.optional(v.string()),
    creativeName: v.optional(v.string()),
    responsible: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Auto-compute derived fields
    const daysToSale = computeDaysToSale(args.registrationDate, args.saleDate);
    const matchQuality = computeMatchQuality(args.adId, args.channel);
    const now = Date.now();

    // Auto-enrich denormalized names from ad hierarchy when adId is provided
    let adName = args.adName;
    let adGroupName = args.adGroupName;
    let campaignName = args.campaignName;

    if (args.adId) {
      const hierarchy = await enrichWithAdHierarchy(ctx, args.adId);
      adName = adName ?? hierarchy.adName;
      adGroupName = adGroupName ?? hierarchy.adGroupName;
      campaignName = campaignName ?? hierarchy.campaignName;
    }

    const saleId = await ctx.db.insert("sales", {
      projectId: args.projectId,
      leadId: args.leadId,
      adId: args.adId,
      channel: args.channel,
      externalDealId: args.externalDealId,
      dealLink: args.dealLink,
      dealStatus: args.dealStatus,
      amount: args.amount,
      clientName: args.clientName,
      clientPhone: args.clientPhone,
      saleDate: args.saleDate,
      saleDateStr: args.saleDateStr,
      registrationDate: args.registrationDate,
      registrationDateStr: args.registrationDateStr,
      whatsappRequests: args.whatsappRequests,
      appointmentsScheduled: args.appointmentsScheduled,
      plansSent: args.plansSent,
      treatmentCompleted: args.treatmentCompleted,
      adName,
      adGroupName,
      campaignName,
      creativeName: args.creativeName,
      responsible: args.responsible,
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
      utmCampaign: args.utmCampaign,
      utmContent: args.utmContent,
      utmTerm: args.utmTerm,
      matchQuality,
      daysToSale,
      createdAt: now,
      updatedAt: now,
    });

    return saleId;
  },
});

// Upsert a sale by externalDealId within a project.
// Finds existing sale by project and externalDealId, then updates or creates.
export const upsertByExternalId = mutation({
  args: {
    projectId: v.id("projects"),
    externalDealId: v.string(),
    leadId: v.optional(v.id("leads")),
    adId: v.optional(v.id("ads")),
    channel: v.optional(v.string()),
    dealLink: v.optional(v.string()),
    dealStatus: v.string(),
    amount: v.number(),
    clientName: v.optional(v.string()),
    clientPhone: v.optional(v.string()),
    saleDate: v.number(),
    saleDateStr: v.string(),
    registrationDate: v.number(),
    registrationDateStr: v.string(),
    whatsappRequests: v.number(),
    appointmentsScheduled: v.number(),
    plansSent: v.number(),
    treatmentCompleted: v.boolean(),
    adName: v.optional(v.string()),
    adGroupName: v.optional(v.string()),
    campaignName: v.optional(v.string()),
    creativeName: v.optional(v.string()),
    responsible: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { externalDealId, projectId, ...fields } = args;

    // Auto-compute derived fields
    const daysToSale = computeDaysToSale(fields.registrationDate, fields.saleDate);
    const matchQuality = computeMatchQuality(fields.adId, fields.channel);
    const now = Date.now();

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

    // Find existing sale by project + externalDealId
    const existingSales = await ctx.db
      .query("sales")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    const existing = existingSales.find(
      (sale) => sale.externalDealId === externalDealId
    );

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...fields,
        externalDealId,
        adName,
        adGroupName,
        campaignName,
        matchQuality,
        daysToSale,
        updatedAt: now,
      });
      return existing._id;
    } else {
      const saleId = await ctx.db.insert("sales", {
        projectId,
        externalDealId,
        ...fields,
        adName,
        adGroupName,
        campaignName,
        matchQuality,
        daysToSale,
        createdAt: now,
        updatedAt: now,
      });
      return saleId;
    }
  },
});

// List sales for a project, with optional date range, phone search, and limit.
// Uses by_project_date index for efficient range queries.
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
      .query("sales")
      .withIndex("by_project_date", (q) => {
        let indexed = q.eq("projectId", args.projectId);
        if (args.startTs !== undefined && args.endTs !== undefined) {
          return indexed.gte("saleDate", args.startTs).lte("saleDate", args.endTs);
        } else if (args.startTs !== undefined) {
          return indexed.gte("saleDate", args.startTs);
        } else if (args.endTs !== undefined) {
          return indexed.lte("saleDate", args.endTs);
        }
        return indexed;
      });

    const allSales = await q.collect();

    // Post-filter by phone substring if provided
    let filtered = allSales;
    if (args.phoneSearch) {
      const search = args.phoneSearch.toLowerCase();
      filtered = allSales.filter(
        (sale) =>
          sale.clientPhone &&
          sale.clientPhone.toLowerCase().includes(search)
      );
    }

    return filtered.slice(0, effectiveLimit);
  },
});

// Count sales in a project within an optional date range.
export const countByProject = query({
  args: {
    projectId: v.id("projects"),
    startTs: v.optional(v.number()),
    endTs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("sales")
      .withIndex("by_project_date", (q) => {
        let indexed = q.eq("projectId", args.projectId);
        if (args.startTs !== undefined && args.endTs !== undefined) {
          return indexed.gte("saleDate", args.startTs).lte("saleDate", args.endTs);
        } else if (args.startTs !== undefined) {
          return indexed.gte("saleDate", args.startTs);
        } else if (args.endTs !== undefined) {
          return indexed.lte("saleDate", args.endTs);
        }
        return indexed;
      });

    const sales = await q.collect();
    return sales.length;
  },
});
