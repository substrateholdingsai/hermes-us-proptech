export interface ExecutiveDossierData {
  reportId: string;
  tenantId: string;
  generatedAt: string;
  subjectTitle: string;
  overallScore: number;
  investorStatusBadge: 'Accredited Investor' | 'Qualified Purchaser' | 'Unverified / Retail';
  corporateSection?: {
    entityName: string;
    state: string;
    filingNumber: string;
    status: string;
    registeredAgent: string;
    managers: Array<{ name: string; role: string }>;
    uboName: string | null;
  };
  propertySection?: {
    address: string;
    county: string;
    parcelId: string;
    marketValueFormatted: string;
    mortgageBalanceFormatted: string;
    equityFormatted: string;
    equityPercent: number;
    isTaxDelinquent: boolean;
  };
  regulatorySection?: {
    hasFormD: boolean;
    hasFormADV: boolean;
    activeLicenses: string[];
    hasDisciplinaryHistory: boolean;
    verdictSummary: string;
  };
  contactSection?: {
    phoneFormatted?: string;
    lineType?: string;
    carrierName?: string;
    dncStatus?: string;
    email?: string;
    smtpVerified?: boolean;
    isTcpaSafe?: boolean;
  };
}
