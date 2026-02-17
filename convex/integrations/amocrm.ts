import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// --- Internal mutations for DB writes from within actions ---

// Resolve an ad by externalAdId — returns the ad document or null.
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

// Find a project by its CRM webhook secret.
const findProjectByWebhookSecret = internalMutation({
  args: { webhookSecret: v.string() },
  handler: async (ctx, args) => {
    const projects = await ctx.db.query("projects").collect();
    return projects.find(
      (p) => p.crmConfig?.webhookSecret === args.webhookSecret
    ) ?? null;
  },
});

// Find all projects configured with AmoCRM as CRM provider.
const findAmoCrmProjects = internalMutation({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    return projects.filter((p) => p.crmProvider === "amocrm");
  },
});

// Upsert a lead by externalDealId within a project.
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

// Create a sale record when a deal is won.
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

    // Check if sale already exists for this externalDealId
    const existingSales = await ctx.db
      .query("sales")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const existing = existingSales.find(
      (s) => s.externalDealId === args.externalDealId
    );

    if (existing) {
      // Update existing sale
      await ctx.db.patch(existing._id, {
        amount: args.amount,
        dealStatus: "won",
        updatedAt: now,
      });
      return existing._id;
    }

    // Determine registration date from lead if available
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

// Find an existing lead by project + externalDealId.
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

    console.log("AmoCRM webhook received:", JSON.stringify(payload).slice(0, 500));

    // Determine which project this webhook belongs to.
    // Try matching by webhook secret in the account subdomain field,
    // or fall back to the first AmoCRM-configured project.
    let projectId: Id<"projects"> | null = null;

    if (payload.account?.subdomain) {
      const project = await ctx.runMutation(
        internal.integrations.amocrm.findProjectByWebhookSecret,
        { webhookSecret: payload.account.subdomain }
      );
      if (project) {
        projectId = project._id;
      }
    }

    // Fallback: use the first project configured with AmoCRM
    if (!projectId) {
      const amoCrmProjects = await ctx.runMutation(
        internal.integrations.amocrm.findAmoCrmProjects,
        {}
      );
      if (amoCrmProjects.length > 0) {
        projectId = amoCrmProjects[0]._id;
      }
    }

    if (!projectId) {
      console.error("AmoCRM webhook: no matching project found");
      return;
    }

    // AmoCRM sends arrays under keys like leads[add], leads[update], leads[status]
    // In URL-encoded format these become flat keys; in JSON they may be nested.
    const events = extractAmoCrmEvents(payload);

    for (const event of events) {
      try {
        await processAmoCrmEvent(ctx, projectId, event);
      } catch (error: any) {
        console.error(
          `AmoCRM event processing error for deal ${event.id}:`,
          error.message
        );
      }
    }
  },
});

// --- Helper types and functions ---

interface AmoCrmEvent {
  type: "add" | "update" | "status";
  id: string;
  name: string;
  price: number;
  statusId: string;
  pipelineId: string;
  phone: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  adId?: string;
  responsibleUserId?: string;
}

function extractAmoCrmEvents(payload: any): AmoCrmEvent[] {
  const events: AmoCrmEvent[] = [];

  // Handle both nested object format and flat URL-encoded format
  const eventTypes: Array<{ key: string; type: "add" | "update" | "status" }> = [
    { key: "leads[add]", type: "add" },
    { key: "leads[update]", type: "update" },
    { key: "leads[status]", type: "status" },
  ];

  for (const { key, type } of eventTypes) {
    // Try nested format: payload.leads.add, payload.leads.update, etc.
    const nestedKey = key.replace("leads[", "").replace("]", "");
    const leadsArray =
      payload[key] ||
      payload.leads?.[nestedKey] ||
      [];

    // AmoCRM sends an array of lead objects (or a single object)
    const leads = Array.isArray(leadsArray) ? leadsArray : [leadsArray];

    for (const lead of leads) {
      if (!lead || !lead.id) continue;

      // Extract custom fields (phone, UTMs, ad_id)
      const customFields = parseCustomFields(lead.custom_fields || []);

      events.push({
        type,
        id: String(lead.id),
        name: lead.name || "",
        price: Number(lead.price || lead.sale || 0),
        statusId: String(lead.status_id || ""),
        pipelineId: String(lead.pipeline_id || ""),
        phone: customFields.phone || "",
        utmSource: customFields.utm_source,
        utmMedium: customFields.utm_medium,
        utmCampaign: customFields.utm_campaign,
        utmContent: customFields.utm_content,
        utmTerm: customFields.utm_term,
        adId: customFields.ad_id,
        responsibleUserId: lead.responsible_user_id
          ? String(lead.responsible_user_id)
          : undefined,
      });
    }
  }

  return events;
}

const CUSTOM_FIELD_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function parseCustomFields(
  customFields: any[]
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  if (!Array.isArray(customFields)) return result;

  for (const field of customFields) {
    const name = (field.name || field.code || "").toLowerCase();
    const value =
      field.values?.[0]?.value || field.values?.[0]?.enum || field.value || "";

    if (name.includes("phone") || name === "телефон") {
      result.phone = String(value);
    } else if (name === "ad_id" || name === "рекламный_id") {
      result.ad_id = String(value);
    } else if (CUSTOM_FIELD_KEYS.includes(name as any)) {
      result[name] = String(value);
    }
  }

  return result;
}

// AmoCRM "won" statuses: status_id=142 is the standard "successfully realized" status.
// Different pipelines may use different IDs; 142 is the conventional default.
const AMO_WON_STATUS_IDS = ["142"];

async function processAmoCrmEvent(
  ctx: any,
  projectId: Id<"projects">,
  event: AmoCrmEvent
) {
  // Resolve ad from externalAdId if present
  let adId: Id<"ads"> | undefined;
  let channel: string | undefined;

  if (event.adId) {
    const ad = await ctx.runMutation(
      internal.integrations.amocrm.resolveAdByExternalId,
      { externalAdId: event.adId }
    );
    if (ad) {
      adId = ad._id;
      channel = ad.channel;
    }
  }

  // Derive channel from UTM source if ad lookup did not succeed
  if (!channel && event.utmSource) {
    channel = event.utmSource;
  }

  const isWon =
    event.type === "status" && AMO_WON_STATUS_IDS.includes(event.statusId);

  // Always upsert the lead first
  const leadId = await ctx.runMutation(
    internal.integrations.amocrm.upsertLead,
    {
      projectId,
      externalDealId: event.id,
      adId,
      channel,
      phone: event.phone || "unknown",
      clientName: event.name || undefined,
      contactType: "crm",
      leadType: "amocrm",
      budget: event.price,
      status: event.statusId,
      pipeline: event.pipelineId,
      responsible: event.responsibleUserId,
      createdAt: Date.now(),
      utmSource: event.utmSource,
      utmMedium: event.utmMedium,
      utmCampaign: event.utmCampaign,
      utmContent: event.utmContent,
      utmTerm: event.utmTerm,
    }
  );

  // If the deal is won, create a sale record
  if (isWon && event.price > 0) {
    // Look up the lead we just upserted to link to it
    const existingLead = await ctx.runMutation(
      internal.integrations.amocrm.findLeadByExternalDealId,
      { projectId, externalDealId: event.id }
    );

    await ctx.runMutation(internal.integrations.amocrm.createSaleFromDeal, {
      projectId,
      leadId: existingLead?._id,
      adId,
      channel,
      externalDealId: event.id,
      amount: event.price,
      clientName: event.name || undefined,
      clientPhone: event.phone || undefined,
      utmSource: event.utmSource,
      utmMedium: event.utmMedium,
      utmCampaign: event.utmCampaign,
      utmContent: event.utmContent,
      utmTerm: event.utmTerm,
    });

    console.log(
      `AmoCRM: Created sale for won deal ${event.id}, amount=${event.price}`
    );
  }

  console.log(
    `AmoCRM: Processed ${event.type} event for deal ${event.id} (status=${event.statusId})`
  );
}
