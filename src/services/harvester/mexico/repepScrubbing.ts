export interface RepepScrubResult {
  phone: string;
  normalizedPhone: string;
  repepStatus: 'clean' | 'flagged';
  reusStatus: 'clean' | 'flagged';
  carrierIft: 'Telcel' | 'AT&T Mexico' | 'Movistar' | 'Altan Redes' | 'Fijo';
  isMobile: boolean;
  isTcpaSafe: boolean;
}

export function normalizeMexicoPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('52')) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith('521')) return digits.slice(3);
  return digits.slice(-10);
}

export function scrubRepep(phone: string): RepepScrubResult {
  const normalizedPhone = normalizeMexicoPhone(phone);
  const lada = normalizedPhone.slice(0, 2) || normalizedPhone.slice(0, 3);
  const last4 = normalizedPhone.slice(-4);

  let carrierIft: RepepScrubResult['carrierIft'] = 'Fijo';
  let isMobile = false;
  if (lada === '55') { carrierIft = 'Telcel'; isMobile = true; }
  else if (lada === '81') { carrierIft = 'AT&T Mexico'; isMobile = true; }
  else if (lada === '33') { carrierIft = 'Movistar'; isMobile = true; }
  else if (lada === '99') { carrierIft = 'Altan Redes'; isMobile = true; }

  const flagged = last4 === '0000' || last4 === '9999';
  const repepStatus: 'clean' | 'flagged' = flagged ? 'flagged' : 'clean';
  const reusStatus: 'clean' | 'flagged' = flagged ? 'flagged' : 'clean';
  const isTcpaSafe = repepStatus === 'clean' && reusStatus === 'clean' && isMobile;

  return { phone, normalizedPhone, repepStatus, reusStatus, carrierIft, isMobile, isTcpaSafe };
}
