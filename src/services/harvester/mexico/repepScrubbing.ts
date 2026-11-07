export interface RepepScrubResult {
  phone: string;
  normalizedPhone: string;
  repepStatus: 'clean' | 'flagged' | 'unknown';
  reusStatus: 'clean' | 'flagged' | 'unknown';
  carrierIft: 'Telcel' | 'AT&T Mexico' | 'Movistar' | 'Altan Redes' | 'Fijo' | 'unknown';
  isMobile: boolean;
  isTcpaSafe: boolean;
}

export function normalizeMexicoPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('52')) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith('521')) return digits.slice(3);
  return digits.slice(-10);
}

// No inference: without a validated query to an authorized service, status stays unknown/unverified.
export function scrubRepep(_phone: string): RepepScrubResult {
  const normalizedPhone = normalizeMexicoPhone(_phone);
  return {
    phone: _phone,
    normalizedPhone,
    repepStatus: 'unknown',
    reusStatus: 'unknown',
    carrierIft: 'unknown',
    isMobile: false,
    isTcpaSafe: false,
  };
}
