/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adAccounts from "../adAccounts.js";
import type * as adDailyStats from "../adDailyStats.js";
import type * as adGroups from "../adGroups.js";
import type * as ads from "../ads.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as campaigns from "../campaigns.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as import_ from "../import.js";
import type * as integrations_amocrm from "../integrations/amocrm.js";
import type * as integrations_bitrix24 from "../integrations/bitrix24.js";
import type * as integrations_facebook from "../integrations/facebook.js";
import type * as integrations_google from "../integrations/google.js";
import type * as integrations_sync from "../integrations/sync.js";
import type * as leads from "../leads.js";
import type * as lib_aggregation from "../lib/aggregation.js";
import type * as lib_attribution from "../lib/attribution.js";
import type * as lib_metrics from "../lib/metrics.js";
import type * as lib_normalization from "../lib/normalization.js";
import type * as members from "../members.js";
import type * as projects from "../projects.js";
import type * as sales from "../sales.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adAccounts: typeof adAccounts;
  adDailyStats: typeof adDailyStats;
  adGroups: typeof adGroups;
  ads: typeof ads;
  analytics: typeof analytics;
  auth: typeof auth;
  campaigns: typeof campaigns;
  crons: typeof crons;
  dashboard: typeof dashboard;
  http: typeof http;
  import: typeof import_;
  "integrations/amocrm": typeof integrations_amocrm;
  "integrations/bitrix24": typeof integrations_bitrix24;
  "integrations/facebook": typeof integrations_facebook;
  "integrations/google": typeof integrations_google;
  "integrations/sync": typeof integrations_sync;
  leads: typeof leads;
  "lib/aggregation": typeof lib_aggregation;
  "lib/attribution": typeof lib_attribution;
  "lib/metrics": typeof lib_metrics;
  "lib/normalization": typeof lib_normalization;
  members: typeof members;
  projects: typeof projects;
  sales: typeof sales;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
