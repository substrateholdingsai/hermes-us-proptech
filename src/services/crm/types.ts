export type CrmProvider = 'webhook' | 'followupboss' | 'hubspot' | 'salesforce';

export interface NormalizedLead {
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  lineType?: 'mobile' | 'landline' | 'voip' | 'unknown';
  dncStatus?: 'clean' | 'flagged' | 'unknown';
  propertyAddress?: string;
  county?: string;
  state?: string;
  marketValueDollars?: number;
  equityDollars?: number;
  equityPercent?: number;
  investorType?: 'accredited' | 'qualified_purchaser' | 'unknown';
  uboName?: string;
  source: string;
  notes?: string;
}

export interface CrmSyncConfig {
  provider: CrmProvider;
  endpointUrl?: string;
  apiKey?: string;
  secret?: string;
  isActive: boolean;
}

export interface CrmSyncResult {
  provider: CrmProvider;
  success: boolean;
  externalId?: string;
  statusCode: number;
  error?: string;
}
