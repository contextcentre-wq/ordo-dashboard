import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

// --- Internal mutation to fetch all projects with active ad platforms ---

const getProjectsWithActiveAdPlatforms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allProjects = await ctx.db.query("projects").collect();

    // Filter to projects that have at least one active ad platform configured
    return allProjects.filter(
      (project) =>
        project.adPlatforms &&
        project.adPlatforms.length > 0 &&
        project.adPlatforms.some((platform) => platform.isActive)
    );
  },
});

// --- Main orchestration action ---

export const syncAllProjects = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Sync: starting daily ad stats sync for all projects");

    const projects = await ctx.runMutation(
      internal.integrations.sync.getProjectsWithActiveAdPlatforms,
      {}
    );

    if (projects.length === 0) {
      console.log("Sync: no projects with active ad platforms found");
      return { projectsSynced: 0, results: [] };
    }

    console.log(
      `Sync: found ${projects.length} project(s) with active ad platforms`
    );

    const results: Array<{
      projectId: string;
      projectName: string;
      channel: string;
      success: boolean;
      rowsSynced: number;
      error?: string;
    }> = [];

    for (const project of projects) {
      const activePlatforms = (project.adPlatforms || []).filter(
        (p) => p.isActive
      );

      for (const platform of activePlatforms) {
        const { channel, accountId, accessToken } = platform;

        console.log(
          `Sync: syncing project "${project.name}" — channel=${channel}, account=${accountId}`
        );

        try {
          let syncResult: { success: boolean; rowsSynced: number; error?: string };

          if (channel === "facebook" || channel === "instagram") {
            syncResult = await ctx.runAction(
              internal.integrations.facebook.syncAdStats,
              {
                projectId: project._id,
                adPlatformConfig: { channel, accountId, accessToken },
              }
            );
          } else if (channel === "google") {
            syncResult = await ctx.runAction(
              internal.integrations.google.syncAdStats,
              {
                projectId: project._id,
                adPlatformConfig: { channel, accountId, accessToken },
              }
            );
          } else {
            console.warn(
              `Sync: unsupported channel "${channel}" for project "${project.name}"`
            );
            syncResult = {
              success: false,
              rowsSynced: 0,
              error: `Unsupported channel: ${channel}`,
            };
          }

          results.push({
            projectId: project._id,
            projectName: project.name,
            channel,
            success: syncResult.success,
            rowsSynced: syncResult.rowsSynced,
            error: syncResult.error,
          });

          console.log(
            `Sync: project "${project.name}" channel=${channel} — ` +
              (syncResult.success
                ? `success, ${syncResult.rowsSynced} rows`
                : `failed: ${syncResult.error}`)
          );
        } catch (error: any) {
          console.error(
            `Sync: error syncing project "${project.name}" channel=${channel}:`,
            error.message
          );

          results.push({
            projectId: project._id,
            projectName: project.name,
            channel,
            success: false,
            rowsSynced: 0,
            error: error.message,
          });
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const totalRows = results.reduce((sum, r) => sum + r.rowsSynced, 0);

    console.log(
      `Sync: completed. ${successCount}/${results.length} syncs succeeded, ${totalRows} total rows synced`
    );

    return {
      projectsSynced: projects.length,
      results,
    };
  },
});
