import type { MexicoLeadMetadata } from './mexico/types';

export type HarvestSource =
  | 'sec_form_d'
  | 'luxury_cash_buyers'
  | 'ria_family_offices'
  | 'siger_sapi'
  | 'rppyc_luxury_acquisitions'
  | 'cnbv_qualified_investors';

export type VerificationStatus = 'verified' | 'unverified' | 'estimated' | 'demo';

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
  primaryContactName: string | null;
  contactRole: string | null;
  jurisdiction: string;
  propertyAddress?: string | null;
  capitalOrDealSizeDollars: number | null;
  dealSizeFormatted: string;
  accreditationBadge: 'Accredited (Rule 501)' | 'Qualified Purchaser' | 'Verified HNWI';
  phone: string;
  lineType: string;
  dncStatus: 'clean' | 'flagged' | 'unknown';
  email: string;
  isTcpaSafe: boolean;
  harvestedAt: string;
  mexicoMetadata?: MexicoLeadMetadata;
  verificationStatus: VerificationStatus;
  dataSource: string;
  sourceUrl: string | null;
  sourceId: string | null;
  verifiedAt: string | null;
  queriedAt: string | null;
}

export interface HarvestBatchResult {
  batchId: string;
  source: HarvestSource;
  totalFound: number;
  enrichedCount: number;
  creditsConsumed: number;
  leads: HarvestedLeadItem[];
  status?: 'completed' | 'empty' | 'error' | 'disabled';
  error?: string | null;
}
