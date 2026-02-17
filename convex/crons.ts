import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "sync-ad-stats",
  { hourUTC: 6, minuteUTC: 0 }, // 6am UTC = ~12pm Almaty
  internal.integrations.sync.syncAllProjects
);

export default crons;
