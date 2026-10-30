import type { MexicoLeadMetadata } from './mexico/types';

export type HarvestSource =
  | 'sec_form_d'
  | 'luxury_cash_buyers'
  | 'ria_family_offices'
  | 'siger_sapi'
  | 'rppyc_luxury_acquisitions'
  | 'cnbv_qualified_investors';

export interface HarvestParams {
  source: HarvestSource;
  limit?: number;
  state?: string;
  minAmountDollars?: number;
  autoEnrich?: boolean;
  jurisdiction?: 'US' | 'MX';
  entidadFederativa?: 'CDMX' | 'NL' | 'JAL' | 'QROO' | 'YUC' | 'BCS';
  minAmountMxn?: number;
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
  mexicoMetadata?: MexicoLeadMetadata;
}

export interface HarvestBatchResult {
  batchId: string;
  source: HarvestSource;
  totalFound: number;
  enrichedCount: number;
  creditsConsumed: number;
  leads: HarvestedLeadItem[];
}
