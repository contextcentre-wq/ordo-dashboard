export type Page = 'dashboard' | 'analytics' | 'members' | 'settings';

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export interface FunnelStage {
  label: string;
  value: number;
  displayValue: string;
  conversionRate: number;
  isGood?: boolean;
}

export interface Metric {
  label: string;
  value: string;
}

export interface TableRowData {
  id: string;
  name: string;
  type: 'project' | 'campaign' | 'group' | 'ad';
  isActive: boolean;
  account: string;
  expenses: number;
  income: number;
  roas: number;
  reach: number;
  impressions: number;
  cpm: number;
  clicks: number;
  ctr: number;
  cpc: number;
  results: number;
  cpr: number;
  leads: number;
  cpl: number;
  qLeads: number;
  cpql: number;
  sales: number;
  cps: number;
  aov: number;
  adId?: string;
  children?: TableRowData[];
}

export interface LeadRecord {
  id: string;
  creationDate: string;
  phone: string;
  contactType: string;
  deal: string;
  leadType: string;
  budget: number;
  status: string;
  pipeline: string;
  ad: string;
  creative: string;
  project: string;
  campaign: string;
  group: string;
  responsible: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
}

export interface SaleRecord extends LeadRecord {
  saleDate: string;
  dealCycle: string;
}

export interface Member {
  id: string;
  phone: string;
  status: 'active' | 'invited';
  registrationDate: string;
  role: 'owner' | 'admin' | 'user';
}
