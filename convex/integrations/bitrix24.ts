import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// --- Internal mutations for DB writes ---

// Verify webhook token against project's webhookSecret and return the project.
const verifyAndGetProject = internalMutation({
  args: { applicationToken: v.string() },
  handler: async (ctx, args) => {
    const projects = await ctx.db.query("projects").collect();
    const project = projects.find(
      (p) =>
        p.crmProvider === "bitrix24" &&
        p.crmConfig?.webhookSecret === args.applicationToken
    );
    return project ?? null;
  },
});

// Find all Bitrix24-configured projects (fallback when no token provided).
const findBitrix24Projects = internalMutation({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    return projects.filter((p) => p.crmProvider === "bitrix24");
  },
});

// Resolve an ad by externalAdId.
const resolveAdByExternalId = internalMutation({
  args: { externalAdId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ads")
      .withIndex("by_external_id", (q) =>
        q.eq("externalAdId", args.externalAdId)
      )
      .first();
  },
});

// Upsert a lead by externalDealId.
const upsertLead = internalMutation({
  args: {
    projectId: v.id("projects"),
    externalDealId: v.string(),
    adId: v.optional(v.id("ads")),
    channel: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    const { externalDealId, projectId, ...fields } = args;

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
      });
      return existing._id;
    } else {
      const leadId = await ctx.db.insert("leads", {
        projectId,
        externalDealId,
        ...fields,
        isQualified: false,
        qualifiedAt: undefined,
      });
      return leadId;
    }
  },
});

// Create a sale record for a won deal.
const createSaleFromDeal = internalMutation({
  args: {
    projectId: v.id("projects"),
    leadId: v.optional(v.id("leads")),
    adId: v.optional(v.id("ads")),
    channel: v.optional(v.string()),
    externalDealId: v.string(),
    amount: v.number(),
    clientName: v.optional(v.string()),
    clientPhone: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const nowStr = new Date(now).toISOString().split("T")[0];

    // Check if sale already exists
    const existingSales = await ctx.db
      .query("sales")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const existing = existingSales.find(
      (s) => s.externalDealId === args.externalDealId
    );

    if (existing) {
      await ctx.db.patch(existing._id, {
        amount: args.amount,
        dealStatus: "won",
        updatedAt: now,
      });
      return existing._id;
    }

    let registrationDate = now;
    if (args.leadId) {
      const lead = await ctx.db.get(args.leadId);
      if (lead) {
        registrationDate = lead.createdAt;
      }
    }

    const registrationDateStr = new Date(registrationDate)
      .toISOString()
      .split("T")[0];
    const daysToSale = Math.round((now - registrationDate) / 86400000);

    let matchQuality: "exact" | "channel_only" | "none" = "none";
    if (args.adId) matchQuality = "exact";
    else if (args.channel) matchQuality = "channel_only";

    const saleId = await ctx.db.insert("sales", {
      projectId: args.projectId,
      leadId: args.leadId,
      adId: args.adId,
      channel: args.channel,
      externalDealId: args.externalDealId,
      dealStatus: "won",
      amount: args.amount,
      clientName: args.clientName,
      clientPhone: args.clientPhone,
      saleDate: now,
      saleDateStr: nowStr,
      registrationDate,
      registrationDateStr,
      whatsappRequests: 0,
      appointmentsScheduled: 0,
      appointmentsAttended: 0,
      plansSent: 0,
      treatmentCompleted: false,
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

// Find a lead by project + externalDealId.
const findLeadByExternalDealId = internalMutation({
  args: {
    projectId: v.id("projects"),
    externalDealId: v.string(),
  },
  handler: async (ctx, args) => {
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return leads.find((l) => l.externalDealId === args.externalDealId) ?? null;
  },
});

// --- Main webhook handler ---

export const handleWebhook = internalAction({
  args: {
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const payload = args.payload;

    console.log(
      "Bitrix24 webhook received:",
      JSON.stringify(payload).slice(0, 500)
    );

    // Bitrix24 sends: { event, data, auth: { application_token, domain } }
    const event = payload.event as string | undefined;
    const data = payload.data || {};
    const auth = payload.auth || {};
    const applicationToken = auth.application_token || "";

    // Verify token and find the project
    let project: any = null;

    if (applicationToken) {
      project = await ctx.runMutation(
        internal.integrations.bitrix24.verifyAndGetProject,
        { applicationToken }
      );
    }

    // Fallback: use the first Bitrix24-configured project
    if (!project) {
      const projects = await ctx.runMutation(
        internal.integrations.bitrix24.findBitrix24Projects,
        {}
      );
      if (projects.length > 0) {
        project = projects[0];
      }
    }

    if (!project) {
      console.error("Bitrix24 webhook: no matching project found");
      return;
    }

    const projectId = project._id as Id<"projects">;
    const apiBaseUrl = project.crmConfig?.apiBaseUrl;
    const accessToken = project.crmConfig?.accessToken;

    if (!apiBaseUrl) {
      console.error(
        "Bitrix24 webhook: project has no apiBaseUrl configured"
      );
      return;
    }

    // Supported events
    const supportedEvents = [
      "ONCRMLEADADD",
      "ONCRMLEADUPDATE",
      "ONCRMDEALUPDATE",
      "ONCRMDEALADD",
    ];

    if (!event || !supportedEvents.includes(event)) {
      console.log(`Bitrix24: ignoring unsupported event "${event}"`);
      return;
    }

    try {
      // Bitrix24 only sends the entity ID in the webhook; we must fetch full data via REST API.
      const entityId = data.FIELDS?.ID || data.ID;
      if (!entityId) {
        console.error("Bitrix24 webhook: no entity ID in payload");
        return;
      }

      const isLead = event.includes("LEAD");
      const entityData = await fetchBitrixEntity(
        apiBaseUrl,
        accessToken,
        isLead ? "lead" : "deal",
        entityId
      );

      if (!entityData) {
        console.error(
          `Bitrix24: failed to fetch ${isLead ? "lead" : "deal"} ${entityId}`
        );
        return;
      }

      await processBitrixEntity(
        ctx,
        projectId,
        isLead ? "lead" : "deal",
        entityData
      );
    } catch (error: any) {
      console.error(`Bitrix24 event processing error:`, error.message);
    }
  },
});

// --- REST API helper ---

async function fetchBitrixEntity(
  apiBaseUrl: string,
  accessToken: string | undefined,
  entityType: "lead" | "deal",
  entityId: string
): Promise<any | null> {
  const method =
    entityType === "lead" ? "crm.lead.get" : "crm.deal.get";

  // Build URL — apiBaseUrl might already include /rest/ or webhook path
  let url = `${apiBaseUrl.replace(/\/$/, "")}/rest/${method}?id=${entityId}`;

  // If access token is available, add it as auth parameter
  if (accessToken) {
    url += `&auth=${accessToken}`;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `Bitrix24 API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const json = await response.json();

    // Bitrix24 REST returns { result: {...} }
    return json.result || null;
  } catch (error: any) {
    console.error(`Bitrix24 fetch error:`, error.message);
    return null;
  }
}

// --- Entity processing ---

async function processBitrixEntity(
  ctx: any,
  projectId: Id<"projects">,
  entityType: "lead" | "deal",
  entity: any
) {
  const externalDealId = String(entity.ID);
  const title = entity.TITLE || "";
  const opportunity = Number(entity.OPPORTUNITY || 0);
  const statusId = entity.STATUS_ID || entity.STAGE_ID || "";
  const categoryId = entity.CATEGORY_ID || "";
  const responsibleId = entity.ASSIGNED_BY_ID
    ? String(entity.ASSIGNED_BY_ID)
    : undefined;

  // Extract phone from PHONE field (Bitrix multifield)
  let phone = "unknown";
  if (entity.PHONE && Array.isArray(entity.PHONE) && entity.PHONE.length > 0) {
    phone = entity.PHONE[0].VALUE || "unknown";
  }

  // Extract UTM fields from UF_* custom fields
  const utmSource = entity.UTM_SOURCE || entity.UF_CRM_UTM_SOURCE || undefined;
  const utmMedium = entity.UTM_MEDIUM || entity.UF_CRM_UTM_MEDIUM || undefined;
  const utmCampaign =
    entity.UTM_CAMPAIGN || entity.UF_CRM_UTM_CAMPAIGN || undefined;
  const utmContent =
    entity.UTM_CONTENT || entity.UF_CRM_UTM_CONTENT || undefined;
  const utmTerm = entity.UTM_TERM || entity.UF_CRM_UTM_TERM || undefined;

  // Try to resolve ad from UF_AD_ID or similar custom field
  const externalAdId =
    entity.UF_CRM_AD_ID || entity.UF_AD_ID || undefined;

  let adId: Id<"ads"> | undefined;
  let channel: string | undefined;

  if (externalAdId) {
    const ad = await ctx.runMutation(
      internal.integrations.bitrix24.resolveAdByExternalId,
      { externalAdId: String(externalAdId) }
    );
    if (ad) {
      adId = ad._id;
      channel = ad.channel;
    }
  }

  if (!channel && utmSource) {
    channel = utmSource;
  }

  // Determine if won
  const isWon =
    statusId === "WON" ||
    statusId === "C1:WON" ||
    statusId.endsWith(":WON");

  // Upsert the lead
  const leadId = await ctx.runMutation(
    internal.integrations.bitrix24.upsertLead,
    {
      projectId,
      externalDealId,
      adId,
      channel,
      phone,
      clientName: title || undefined,
      contactType: "crm",
      leadType: "bitrix24",
      budget: opportunity,
      status: statusId,
      pipeline: categoryId ? String(categoryId) : "default",
      responsible: responsibleId,
      createdAt: entity.DATE_CREATE
        ? new Date(entity.DATE_CREATE).getTime()
        : Date.now(),
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
    }
  );

  // If won, create a sale record
  if (isWon && opportunity > 0) {
    const existingLead = await ctx.runMutation(
      internal.integrations.bitrix24.findLeadByExternalDealId,
      { projectId, externalDealId }
    );

    await ctx.runMutation(internal.integrations.bitrix24.createSaleFromDeal, {
      projectId,
      leadId: existingLead?._id,
      adId,
      channel,
      externalDealId,
      amount: opportunity,
      clientName: title || undefined,
      clientPhone: phone !== "unknown" ? phone : undefined,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
    });

    console.log(
      `Bitrix24: Created sale for won ${entityType} ${externalDealId}, amount=${opportunity}`
    );
  }

  console.log(
    `Bitrix24: Processed ${entityType} ${externalDealId} (status=${statusId})`
  );
}
