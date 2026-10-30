export type LineType = 'mobile' | 'landline' | 'voip' | 'unknown';
export type DncStatus = 'clean' | 'flagged' | 'unknown';

export interface PhoneValidation {
  rawPhone: string;
  formattedE164: string;
  isValid: boolean;
  lineType: LineType;
  carrierName?: string;
  dncStatus: DncStatus;
  isTcpaSafeForSms: boolean;
}

export interface EmailValidation {
  email: string;
  isValidSyntax: boolean;
  hasMxRecords: boolean;
  isDisposable: boolean;
  mxHosts: string[];
  smtpVerified: boolean;
}

export interface SkipTraceResult {
  subjectName: string;
  primaryPhone: PhoneValidation | null;
  secondaryPhones: PhoneValidation[];
  primaryEmail: EmailValidation | null;
  secondaryEmails: EmailValidation[];
  confidenceScore: number;
  source: string;
}
