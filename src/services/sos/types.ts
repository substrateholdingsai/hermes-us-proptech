export type USStateCode = 'TX' | 'FL' | 'WY' | 'DE' | 'NV';
export type SOSEntityStatus = 'active' | 'inactive' | 'forfeited' | 'dissolved' | 'in_good_standing' | 'unknown';

export interface SOSOfficer {
  name: string;
  role: string;
  address?: string;
}

export interface SOSEntityResult {
  state: USStateCode;
  entityName: string;
  filingNumber: string;
  status: SOSEntityStatus;
  formationDate: string | null;
  entityType: 'llc' | 'corp' | 'trust' | 'lp' | 'other';
  registeredAgent: {
    name: string;
    address?: string;
  };
  principalAddress?: string;
  mailingAddress?: string;
  officers: SOSOfficer[];
  rawSourceUrl?: string;
  isPrivacyState: boolean;
  uboCandidates: string[];
}
