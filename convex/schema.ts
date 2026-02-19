import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // --- AUTH & TEAM ---

  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    salt: v.optional(v.string()),
  }).index("by_email", ["email"]),

  members: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("user")
    ),
    status: v.union(v.literal("active"), v.literal("invited")),
    invitedAt: v.number(),
    joinedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_user", ["projectId", "userId"]),

  // --- CORE HIERARCHY ---

  projects: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
    crmProvider: v.optional(
      v.union(v.literal("amocrm"), v.literal("bitrix24"))
    ),
    crmConfig: v.optional(
      v.object({
        webhookSecret: v.optional(v.string()),
        apiBaseUrl: v.optional(v.string()),
        accessToken: v.optional(v.string()),
      })
    ),
    adPlatforms: v.optional(
      v.array(
        v.object({
          channel: v.string(),
          accountId: v.string(),
          accessToken: v.optional(v.string()),
          isActive: v.boolean(),
        })
      )
    ),
  }).index("by_owner", ["ownerId"]),

  adAccounts: defineTable({
    projectId: v.id("projects"),
    externalAccountId: v.string(),
    name: v.string(),
    channel: v.string(),
    isActive: v.boolean(),
  })
    .index("by_project", ["projectId"])
    .index("by_external_id", ["externalAccountId"]),

  campaigns: defineTable({
    projectId: v.id("projects"),
    adAccountId: v.id("adAccounts"),
    externalCampaignId: v.optional(v.string()),
    name: v.string(),
    channel: v.string(),
    isActive: v.boolean(),
  })
    .index("by_project", ["projectId"])
    .index("by_account", ["adAccountId"]),

  adGroups: defineTable({
    campaignId: v.id("campaigns"),
    projectId: v.id("projects"),
    externalAdsetId: v.optional(v.string()),
    name: v.string(),
    isActive: v.boolean(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_project", ["projectId"]),

  ads: defineTable({
    adGroupId: v.id("adGroups"),
    campaignId: v.id("campaigns"),
    projectId: v.id("projects"),
    externalAdId: v.string(),
    name: v.string(),
    channel: v.string(),
    isActive: v.boolean(),
  })
    .index("by_adGroup", ["adGroupId"])
    .index("by_campaign", ["campaignId"])
    .index("by_project", ["projectId"])
    .index("by_external_id", ["externalAdId"]),

  // --- DAILY PERFORMANCE SNAPSHOTS ---

  adDailyStats: defineTable({
    adId: v.id("ads"),
    projectId: v.id("projects"),
    date: v.string(),
    dateTs: v.number(),
    impressions: v.number(),
    clicks: v.number(),
    spend: v.number(),
    leads: v.number(),
    results: v.number(),
    whatsappRequests: v.number(),
    appointmentsScheduled: v.number(),
    appointmentsAttended: v.number(),
    treatmentsCompleted: v.number(),
    plansSent: v.number(),
    reach: v.number(),
  })
    .index("by_ad", ["adId"])
    .index("by_ad_date", ["adId", "date"])
    .index("by_project_date", ["projectId", "dateTs"]),

  // --- CRM / SALES DATA ---

  leads: defineTable({
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
    isQualified: v.boolean(),
    qualifiedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_created", ["projectId", "createdAt"])
    .index("by_ad", ["adId"])
    .index("by_phone", ["phone"]),

  sales: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
    whatsappRequests: v.number(),
    appointmentsScheduled: v.number(),
    appointmentsAttended: v.number(),
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
    matchQuality: v.union(
      v.literal("exact"),
      v.literal("channel_only"),
      v.literal("none")
    ),
    daysToSale: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_date", ["projectId", "saleDate"])
    .index("by_ad", ["adId"])
    .index("by_ad_registration", ["adId", "registrationDateStr"])
    .index("by_lead", ["leadId"]),
});
