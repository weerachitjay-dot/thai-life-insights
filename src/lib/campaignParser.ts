import { CampaignData, CampaignStatus, ProductCategory, CampaignObjective } from '@/types';

// Regex Pattern: <OBJECTIVE>_<BRAND>+<PRODUCT>_<VERSION>
const CAMPAIGN_REGEX = /^([A-Z]+)_([A-Z]+)\+([A-Z0-9\-]+)_(.+)$/;

export function parseCampaignName(rawName: string): Partial<CampaignData> {
  const match = rawName.match(CAMPAIGN_REGEX);

  if (!match) {
    return {
      objective: 'UNKNOWN',
      product: 'Unknown',
      category: 'Other'
    };
  }

  const objectiveRaw = match[1];
  const productCode = match[3];

  // Map Category
  let category: ProductCategory = 'Other';
  if (productCode.startsWith('LIFE-')) category = 'Life';
  else if (productCode.startsWith('SAVING-')) category = 'Saving';
  else if (productCode.startsWith('HEALTH-')) category = 'Health';

  return {
    objective: objectiveRaw as CampaignObjective,
    brand: match[2],
    product: productCode,
    category
  };
}

// Logic ตัดสินใจ Status (AI Rule-Based)
export function calculateStatus(
  cpl: number, 
  avgCpl: number, 
  frequency: number,
  leads: number,
  spend: number
): CampaignStatus {
  if (leads === 0 && spend > 5000) return 'KILL';
  if (cpl < avgCpl && frequency < 2.5) return 'SCALE';
  if (frequency > 3 || cpl > avgCpl * 1.2) return 'RISK';
  return 'HOLD';
}

// Format currency in Thai Baht
export function formatCurrency(amount: number): string {
  return `฿${amount.toLocaleString('th-TH')}`;
}

// Format number with Thai locale
export function formatNumber(num: number): string {
  return num.toLocaleString('th-TH');
}
