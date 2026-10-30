export type HarvestSource = 'sec_form_d' | 'luxury_cash_buyers' | 'ria_family_offices';

export interface HarvestParams {
  source: HarvestSource;
  limit?: number;
  state?: string;
  minAmountDollars?: number;
  autoEnrich?: boolean;
}

export interface HarvestedLeadItem {
  id: string;
  source: HarvestSource;
  entityOrFundName: string;
  primaryContactName: string;
  contactRole: string;
  jurisdiction: string;
  capitalOrDealSizeDollars: number;
  dealSizeFormatted: string;
  accreditationBadge: 'Accredited (Rule 501)' | 'Qualified Purchaser' | 'Verified HNWI';
  phone: string;
  lineType: string;
  dncStatus: 'clean' | 'flagged';
  email: string;
  isTcpaSafe: boolean;
  harvestedAt: string;
}

export interface HarvestBatchResult {
  batchId: string;
  source: HarvestSource;
  totalFound: number;
  enrichedCount: number;
  creditsConsumed: number;
  leads: HarvestedLeadItem[];
}
