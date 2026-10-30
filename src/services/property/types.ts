export interface PropertyRecordResult {
  address: string;
  county: string;
  state: string;
  parcelId: string;
  legalDescription?: string;
  assessedValueCents: number;
  marketValueCents: number;
  mortgageBalanceCents: number;
  equityCents: number;
  equityPercent: number; // 0 a 100
  taxAmountCents: number;
  isTaxDelinquent: boolean;
  lastSaleDate: string | null;
  lastSalePriceCents: number | null;
  ownerName: string;
  ownerType: 'individual' | 'entity' | 'trust' | 'unknown';
  dataSource: 'aggregator' | 'county_assessor' | 'sandbox_forensics' | 'ai_estimated';
}
