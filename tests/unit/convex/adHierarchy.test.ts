import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "../../../convex/schema";
import { api } from "../../../convex/_generated/api";
import { modules } from "./modules";

async function setupProject(t: any) {
  const userId = await t.mutation(api.auth.register, {
    email: "owner@example.com",
    name: "Owner",
  });
  const projectId = await t.mutation(api.projects.create, {
    name: "Test Project",
    userId,
  });
  return { userId, projectId };
}

async function setupHierarchy(t: any) {
  const { userId, projectId } = await setupProject(t);
  const accountId = await t.mutation(api.adAccounts.create, {
    projectId,
    externalAccountId: "ext-acc-1",
    name: "Test Account",
    channel: "facebook",
  });
  const campaignId = await t.mutation(api.campaigns.create, {
    projectId,
    adAccountId: accountId,
    name: "Test Campaign",
    channel: "facebook",
  });
  const adGroupId = await t.mutation(api.adGroups.create, {
    campaignId,
    projectId,
    name: "Test Ad Group",
  });
  const adId = await t.mutation(api.ads.create, {
    adGroupId,
    campaignId,
    projectId,
    externalAdId: "ext-ad-1",
    name: "Test Ad",
    channel: "facebook",
  });
  return { userId, projectId, accountId, campaignId, adGroupId, adId };
}

describe("convex/adAccounts", () => {
  describe("create", () => {
    it("creates an ad account with isActive=true by default", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "ext-acc-1",
        name: "Facebook Account",
        channel: "facebook",
      });
      expect(accountId).toBeDefined();

      const accounts = await t.query(api.adAccounts.listByProject, {
        projectId,
      });
      expect(accounts).toHaveLength(1);
      expect(accounts[0].isActive).toBe(true);
      expect(accounts[0].name).toBe("Facebook Account");
      expect(accounts[0].channel).toBe("facebook");
    });
  });

  describe("listByProject", () => {
    it("returns accounts for a project", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-1",
        name: "Account 1",
        channel: "facebook",
      });
      await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-2",
        name: "Account 2",
        channel: "google",
      });

      const accounts = await t.query(api.adAccounts.listByProject, {
        projectId,
      });
      expect(accounts).toHaveLength(2);
    });

    it("returns empty array for project with no accounts", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accounts = await t.query(api.adAccounts.listByProject, {
        projectId,
      });
      expect(accounts).toHaveLength(0);
    });
  });

  describe("update", () => {
    it("patches name, channel, and isActive", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-upd",
        name: "Old Name",
        channel: "facebook",
      });

      await t.mutation(api.adAccounts.update, {
        accountId,
        name: "New Name",
        channel: "google",
        isActive: false,
      });

      const accounts = await t.query(api.adAccounts.listByProject, {
        projectId,
      });
      expect(accounts[0].name).toBe("New Name");
      expect(accounts[0].channel).toBe("google");
      expect(accounts[0].isActive).toBe(false);
    });
  });

  describe("toggleActive", () => {
    it("toggles isActive from true to false", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-toggle",
        name: "Toggle Account",
        channel: "facebook",
      });

      await t.mutation(api.adAccounts.toggleActive, { accountId });

      const accounts = await t.query(api.adAccounts.listByProject, {
        projectId,
      });
      expect(accounts[0].isActive).toBe(false);
    });

    it("toggles isActive from false to true", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-toggle2",
        name: "Toggle Account",
        channel: "facebook",
      });

      // First toggle: true -> false
      await t.mutation(api.adAccounts.toggleActive, { accountId });
      // Second toggle: false -> true
      await t.mutation(api.adAccounts.toggleActive, { accountId });

      const accounts = await t.query(api.adAccounts.listByProject, {
        projectId,
      });
      expect(accounts[0].isActive).toBe(true);
    });
  });
});

describe("convex/campaigns", () => {
  describe("create", () => {
    it("creates a campaign with isActive=true", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-1",
        name: "Account",
        channel: "facebook",
      });

      const campaignId = await t.mutation(api.campaigns.create, {
        projectId,
        adAccountId: accountId,
        name: "My Campaign",
        channel: "facebook",
      });
      expect(campaignId).toBeDefined();

      const campaigns = await t.query(api.campaigns.listByProject, {
        projectId,
      });
      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].name).toBe("My Campaign");
      expect(campaigns[0].isActive).toBe(true);
    });
  });

  describe("listByProject", () => {
    it("returns all campaigns for a project", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-1",
        name: "Account",
        channel: "facebook",
      });

      await t.mutation(api.campaigns.create, {
        projectId,
        adAccountId: accountId,
        name: "Campaign 1",
        channel: "facebook",
      });
      await t.mutation(api.campaigns.create, {
        projectId,
        adAccountId: accountId,
        name: "Campaign 2",
        channel: "facebook",
      });

      const campaigns = await t.query(api.campaigns.listByProject, {
        projectId,
      });
      expect(campaigns).toHaveLength(2);
    });
  });

  describe("listByAccount", () => {
    it("returns campaigns for a specific ad account", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId1 = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-1",
        name: "Account 1",
        channel: "facebook",
      });
      const accountId2 = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-2",
        name: "Account 2",
        channel: "google",
      });

      await t.mutation(api.campaigns.create, {
        projectId,
        adAccountId: accountId1,
        name: "FB Campaign",
        channel: "facebook",
      });
      await t.mutation(api.campaigns.create, {
        projectId,
        adAccountId: accountId2,
        name: "Google Campaign",
        channel: "google",
      });

      const fbCampaigns = await t.query(api.campaigns.listByAccount, {
        adAccountId: accountId1,
      });
      expect(fbCampaigns).toHaveLength(1);
      expect(fbCampaigns[0].name).toBe("FB Campaign");
    });
  });

  describe("update", () => {
    it("patches campaign name and channel", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-1",
        name: "Account",
        channel: "facebook",
      });
      const campaignId = await t.mutation(api.campaigns.create, {
        projectId,
        adAccountId: accountId,
        name: "Old Campaign",
        channel: "facebook",
      });

      await t.mutation(api.campaigns.update, {
        campaignId,
        name: "New Campaign",
        isActive: false,
      });

      const campaigns = await t.query(api.campaigns.listByProject, {
        projectId,
      });
      expect(campaigns[0].name).toBe("New Campaign");
      expect(campaigns[0].isActive).toBe(false);
    });
  });

  describe("toggleActive", () => {
    it("toggles campaign isActive", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-1",
        name: "Account",
        channel: "facebook",
      });
      const campaignId = await t.mutation(api.campaigns.create, {
        projectId,
        adAccountId: accountId,
        name: "Campaign",
        channel: "facebook",
      });

      await t.mutation(api.campaigns.toggleActive, { campaignId });

      const campaigns = await t.query(api.campaigns.listByProject, {
        projectId,
      });
      expect(campaigns[0].isActive).toBe(false);
    });
  });
});

describe("convex/adGroups", () => {
  describe("create", () => {
    it("creates an ad group with isActive=true", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-1",
        name: "Account",
        channel: "facebook",
      });
      const campaignId = await t.mutation(api.campaigns.create, {
        projectId,
        adAccountId: accountId,
        name: "Campaign",
        channel: "facebook",
      });

      const adGroupId = await t.mutation(api.adGroups.create, {
        campaignId,
        projectId,
        name: "My Ad Group",
      });
      expect(adGroupId).toBeDefined();

      const adGroups = await t.query(api.adGroups.listByCampaign, {
        campaignId,
      });
      expect(adGroups).toHaveLength(1);
      expect(adGroups[0].name).toBe("My Ad Group");
      expect(adGroups[0].isActive).toBe(true);
    });
  });

  describe("listByCampaign", () => {
    it("returns ad groups for a specific campaign", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-1",
        name: "Account",
        channel: "facebook",
      });
      const campaignId = await t.mutation(api.campaigns.create, {
        projectId,
        adAccountId: accountId,
        name: "Campaign",
        channel: "facebook",
      });

      await t.mutation(api.adGroups.create, {
        campaignId,
        projectId,
        name: "Group 1",
      });
      await t.mutation(api.adGroups.create, {
        campaignId,
        projectId,
        name: "Group 2",
      });

      const adGroups = await t.query(api.adGroups.listByCampaign, {
        campaignId,
      });
      expect(adGroups).toHaveLength(2);
    });
  });

  describe("listByProject", () => {
    it("returns all ad groups for a project", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-1",
        name: "Account",
        channel: "facebook",
      });
      const campaignId = await t.mutation(api.campaigns.create, {
        projectId,
        adAccountId: accountId,
        name: "Campaign",
        channel: "facebook",
      });

      await t.mutation(api.adGroups.create, {
        campaignId,
        projectId,
        name: "Group 1",
      });

      const adGroups = await t.query(api.adGroups.listByProject, { projectId });
      expect(adGroups).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("patches name and isActive", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-1",
        name: "Account",
        channel: "facebook",
      });
      const campaignId = await t.mutation(api.campaigns.create, {
        projectId,
        adAccountId: accountId,
        name: "Campaign",
        channel: "facebook",
      });
      const adGroupId = await t.mutation(api.adGroups.create, {
        campaignId,
        projectId,
        name: "Old Name",
      });

      await t.mutation(api.adGroups.update, {
        adGroupId,
        name: "New Name",
        isActive: false,
      });

      const adGroups = await t.query(api.adGroups.listByCampaign, {
        campaignId,
      });
      expect(adGroups[0].name).toBe("New Name");
      expect(adGroups[0].isActive).toBe(false);
    });
  });

  describe("toggleActive", () => {
    it("toggles ad group isActive", async () => {
      const t = convexTest(schema, modules);
      const { projectId } = await setupProject(t);
      const accountId = await t.mutation(api.adAccounts.create, {
        projectId,
        externalAccountId: "acc-1",
        name: "Account",
        channel: "facebook",
      });
      const campaignId = await t.mutation(api.campaigns.create, {
        projectId,
        adAccountId: accountId,
        name: "Campaign",
        channel: "facebook",
      });
      const adGroupId = await t.mutation(api.adGroups.create, {
        campaignId,
        projectId,
        name: "Toggle Group",
      });

      await t.mutation(api.adGroups.toggleActive, { adGroupId });

      const adGroups = await t.query(api.adGroups.listByCampaign, {
        campaignId,
      });
      expect(adGroups[0].isActive).toBe(false);
    });
  });
});

describe("convex/ads", () => {
  describe("create", () => {
    it("creates an ad with isActive=true", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const ads = await t.query(api.ads.listByGroup, {
        adGroupId: h.adGroupId,
      });
      expect(ads).toHaveLength(1);
      expect(ads[0].name).toBe("Test Ad");
      expect(ads[0].isActive).toBe(true);
      expect(ads[0].channel).toBe("facebook");
      expect(ads[0].externalAdId).toBe("ext-ad-1");
    });
  });

  describe("listByGroup", () => {
    it("returns ads for a specific ad group", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      // Add another ad in the same group
      await t.mutation(api.ads.create, {
        adGroupId: h.adGroupId,
        campaignId: h.campaignId,
        projectId: h.projectId,
        externalAdId: "ext-ad-2",
        name: "Second Ad",
        channel: "facebook",
      });

      const ads = await t.query(api.ads.listByGroup, {
        adGroupId: h.adGroupId,
      });
      expect(ads).toHaveLength(2);
    });
  });

  describe("listByProject", () => {
    it("returns all ads for a project", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      const ads = await t.query(api.ads.listByProject, {
        projectId: h.projectId,
      });
      expect(ads).toHaveLength(1);
      expect(ads[0].name).toBe("Test Ad");
    });
  });

  describe("getByExternalId", () => {
    it("returns ad by external ID", async () => {
      const t = convexTest(schema, modules);
      await setupHierarchy(t);

      const ad = await t.query(api.ads.getByExternalId, {
        externalAdId: "ext-ad-1",
      });
      expect(ad).not.toBeNull();
      expect(ad!.name).toBe("Test Ad");
    });

    it("returns null for non-existent external ID", async () => {
      const t = convexTest(schema, modules);
      const ad = await t.query(api.ads.getByExternalId, {
        externalAdId: "nonexistent",
      });
      expect(ad).toBeNull();
    });
  });

  describe("update", () => {
    it("patches ad name and channel", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(api.ads.update, {
        adId: h.adId,
        name: "Updated Ad",
        channel: "google",
      });

      const ads = await t.query(api.ads.listByGroup, {
        adGroupId: h.adGroupId,
      });
      expect(ads[0].name).toBe("Updated Ad");
      expect(ads[0].channel).toBe("google");
    });

    it("cascades name update to leads", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      // Create a lead linked to this ad
      await t.mutation(api.leads.create, {
        projectId: h.projectId,
        adId: h.adId,
        phone: "+79991112233",
        contactType: "whatsapp",
        leadType: "new",
        budget: 1000,
        status: "open",
        pipeline: "main",
        createdAt: Date.now(),
      });

      // Update ad name
      await t.mutation(api.ads.update, {
        adId: h.adId,
        name: "Renamed Ad",
      });

      // Verify lead's adName was cascaded
      const leads = await t.query(api.leads.listByProject, {
        projectId: h.projectId,
      });
      expect(leads[0].adName).toBe("Renamed Ad");
    });

    it("cascades name update to sales", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      // Create a sale linked to this ad
      const now = Date.now();
      await t.mutation(api.sales.create, {
        projectId: h.projectId,
        adId: h.adId,
        dealStatus: "closed",
        amount: 5000,
        saleDate: now,
        saleDateStr: "2025-01-15",
        registrationDate: now - 86400000 * 5,
        registrationDateStr: "2025-01-10",
        whatsappRequests: 1,
        appointmentsScheduled: 1,
        plansSent: 0,
        treatmentCompleted: true,
      });

      // Update ad name
      await t.mutation(api.ads.update, {
        adId: h.adId,
        name: "Renamed Ad For Sales",
      });

      // Verify sale's adName was cascaded
      const sales = await t.query(api.sales.listByProject, {
        projectId: h.projectId,
      });
      expect(sales[0].adName).toBe("Renamed Ad For Sales");
    });
  });

  describe("toggleActive", () => {
    it("toggles ad isActive", async () => {
      const t = convexTest(schema, modules);
      const h = await setupHierarchy(t);

      await t.mutation(api.ads.toggleActive, { adId: h.adId });

      const ads = await t.query(api.ads.listByGroup, {
        adGroupId: h.adGroupId,
      });
      expect(ads[0].isActive).toBe(false);
    });
  });
});
