// โครงสร้างข้อมูลตาม Spec Thai Life - Enterprise Dashboard

// Campaign Status Types
export type CampaignStatus = 'SCALE' | 'HOLD' | 'RISK' | 'KILL' | 'UNKNOWN';
export type CampaignObjective = 'LEADGENERATION' | 'CONVERSIONS' | 'MESSAGES' | 'UNKNOWN';
export type ProductCategory = 'Life' | 'Saving' | 'Health' | 'Other';
export type AdAccount = 'Account A' | 'Account B' | 'All Accounts';

// Lead Types (Critical: Do not mix metrics)
export type LeadType = 'meta' | 'sent' | 'tl';

// Base Campaign Data
export interface CampaignData {
  id: string;
  name: string;
  spend: number;
  leads: number;
  cpl: number;
  impressions: number;
  objective: CampaignObjective;
  brand: string;
  product: string;
  category: ProductCategory;
  status: CampaignStatus;
}

// Overview Page - Uses SENT Leads as primary metric
export interface OverviewKpiData {
  sentLeads: number;
  sentLeadsTarget: number;
  avgCplSent: number;
  totalSpend: number;
  projectedSentLeads: number;
}

export interface PerformanceRow {
  product: string;
  category: ProductCategory;
  businessTarget: number; // Partner/TL target from business
  expectedConvRate: number; // Expected Sent -> TL conversion rate
  targetSent: number; // Calculated: businessTarget / expectedConvRate
  actualSent: number; // Sent Leads (Primary metric)
  percentAchieved: number;
  partnerLeads: number; // TL Leads (Shadow metric)
  convRate: number; // (Partner Leads / Sent Leads) * 100
  runRateStatus: 'on-track' | 'at-risk' | 'behind';
}

// Product Master Page - 3-Layer Matrix
export interface ProductMasterRow {
  product: string;
  category: ProductCategory;
  // Meta Layer
  metaSpend: number;
  metaLeads: number;
  metaCpl: number;
  // Quality Layer (Sent)
  sentLeads: number;
  screeningRate: number; // percentage
  sentCpl: number;
  // Business Layer (TL)
  tlLeads: number;
  revenue: number;
  roi: number;
}

// Leads Analysis Page - Funnel Data
export interface FunnelData {
  metaLeads: number;
  sentLeads: number;
  tlLeads: number;
  metaToSentDropoff: number;
  sentToTlDropoff: number;
}

export interface ProductDropoffData {
  product: string;
  metaLeads: number;
  sentLeads: number;
  tlLeads: number;
  screeningRate: number;
  conversionRate: number;
}

// Creative Analysis Page - Uses META Leads only
export interface CreativeData {
  id: string;
  thumbnail: string;
  name: string;
  spend: number;
  metaLeads: number;
  cplMeta: number;
  ctr: number;
  frequency: number;
  status: CampaignStatus;
  fatigueAlert: boolean;
}

// Cost & Profit Page
export interface CostProfitData {
  product: string;
  category: ProductCategory;
  spend: number;
  tlLeads: number; // Confirmed leads
  revenue: number;
  profit: number;
  roi: number;
}

// Smart Audience Page
export interface AudienceData {
  audienceName: string;
  spend: number;
  metaLeads: number;
  sentLeads: number;
  cplMeta: number;
  cplSent: number;
  conversionRate: number;
  status: CampaignStatus;
}

// Legacy types for backward compatibility
export interface KpiData {
  totalSpend: number;
  totalLeads: number;
  avgCpl: number;
  riskCampaigns: number;
}

export interface ProductMatrixRow {
  product: string;
  category: ProductCategory;
  leadGen: { cpl: number; status: CampaignStatus } | null;
  conversion: { cpl: number; status: CampaignStatus } | null;
  messages: { cpl: number; status: CampaignStatus } | null;
  action: string;
}

export interface ProductSetting {
  product_code: string;
  sell_price: number;
  owner_name: string;
  target_cpl: number;
}
