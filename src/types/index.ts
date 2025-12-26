// โครงสร้างข้อมูลตาม Spec Thai Life
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

export type CampaignObjective = 'LEADGENERATION' | 'CONVERSIONS' | 'MESSAGES' | 'UNKNOWN';
export type ProductCategory = 'Life' | 'Saving' | 'Health' | 'Other';
export type CampaignStatus = 'SCALE' | 'HOLD' | 'RISK' | 'KILL' | 'UNKNOWN';
export type AdAccount = 'Account A' | 'Account B';

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
