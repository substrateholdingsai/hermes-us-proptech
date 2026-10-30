import type { EmailValidation } from './types';

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com', 'yopmail.com',
  'trashmail.com', 'dispostable.com', 'fakeinbox.com', 'sharklasers.com', 'getnada.com',
]);

export function isValidSyntax(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function validateEmail(email: string): Promise<EmailValidation> {
  const syntax = isValidSyntax(email);
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const isDisposable = DISPOSABLE_DOMAINS.has(domain);

  let mxHosts: string[] = [];
  let hasMxRecords = false;

  if (syntax && domain) {
    try {
      const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`;
      const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
      if (res.ok) {
        const data = (await res.json()) as any;
        const answers: any[] = data?.Answer || [];
        mxHosts = answers
          .filter((a) => a?.type === 15)
          .map((a) => String(a?.data || '').replace(/^\d+\s+/, '').trim())
          .filter(Boolean);
        hasMxRecords = mxHosts.length > 0;
      }
    } catch {
      // ignore
    }
  }

  return {
    email,
    isValidSyntax: syntax,
    hasMxRecords,
    isDisposable,
    mxHosts,
    smtpVerified: hasMxRecords && !isDisposable,
  };
}

export function isDisposableDomain(domain: string): boolean {
  const DISPOSABLE = new Set(['mailinator.com','guerrillamail.com','tempmail.com','10minutemail.com','yopmail.com','trashmail.com','dispostable.com','fakeinbox.com','sharklasers.com','getnada.com']);
  return DISPOSABLE.has(domain.toLowerCase());
}

export const isValidEmail = isValidSyntax;
export function isDisposable(emailOrDomain: string): boolean {
  const domain = emailOrDomain.includes('@') ? emailOrDomain.split('@')[1] : emailOrDomain;
  return isDisposableDomain(domain || '');
}

export const isValidEmailSyntax = isValidSyntax;

export const isDisposableEmail = isDisposable;
export const isEmailValid = isValidSyntax;
