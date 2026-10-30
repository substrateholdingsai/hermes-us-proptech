export interface FormDFiling {
  accessionNumber: string;
  filingDate: string;
  issuerName: string;
  offeringAmount: number;
  amountSold: number;
  remainingAmount: number;
  minimumInvestmentAccepted: number;
  federalExemptions: string[];
  executiveOfficers: string[];
  isRealEstateFund: boolean;
}

export interface FormADVFiling {
  crdNumber: string;
  secNumber: string;
  primaryBusinessName: string;
  regulatoryAumDollars: number;
  hasHighNetWorthClients: boolean;
  hasPrivateFundClients: boolean;
}

export interface FinraIndividualRecord {
  crdNumber: string;
  fullName: string;
  currentFirm?: string;
  activeLicenses: string[];
  isAccreditedByLicense: boolean;
  hasDisciplinaryHistory: boolean;
  yearsOfExperience: number;
}

export interface SecValidationResult {
  subjectName: string;
  entityName?: string;
  investorType: 'unknown' | 'accredited' | 'qualified_purchaser';
  hasSecFormD: boolean;
  hasSecFormADV: boolean;
  formDFilings: FormDFiling[];
  formADVData: FormADVFiling | null;
  finraRecord: FinraIndividualRecord | null;
  accreditationConfidence: number;
  equityScore: number;
  verdictSummary: string;
}
