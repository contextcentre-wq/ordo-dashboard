export type Page = 'dashboard' | 'sources' | 'audiences' | 'settings';

export interface FunnelStage {
  label: string;
  value: number;
  displayValue: string; // e.g., "1.6 млн"
  conversionRate: number; // e.g. 100 or 113.6
  isGood?: boolean; // Determines bubble color if needed, defaulting to green based on specs
}

export interface Metric {
  label: string;
  value: string; // Pre-formatted string e.g. "$3.74"
}

export interface TableRowData {
  id: string;
  name: string;
  type: 'project' | 'campaign' | 'group' | 'ad';
  isActive: boolean;
  expenses: number;
  income: number;
  romi: number;
  reach: number;
  impressions: number;
  cpm: number;
  clicks: number;
  ctr: number;
  cpc: number;
  // New fields from screenshots
  results: number;
  cpr: number;
  leads: number;
  cpl: number;
  qLeads: number; // кЛиды
  cpql: number;
  sales: number;
  cps: number;
  adId?: string; // Only for ads

  children?: TableRowData[]; // For nested rows
}