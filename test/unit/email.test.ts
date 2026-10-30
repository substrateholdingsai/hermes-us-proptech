import { describe, it, expect } from 'vitest';
import { validateEmail, isValidEmailSyntax, isDisposableDomain } from '../../src/services/skiptrace/email';

describe('email', () => {
  it('validates RFC5322 syntax', () => {
    expect(isValidEmailSyntax('user@example.com')).toBe(true);
    expect(isValidEmailSyntax('bad-email')).toBe(false);
    expect(isValidEmailSyntax('a@b')).toBe(false);
    expect(isValidEmailSyntax('')).toBe(false);
  });

  it('blocks disposable domains', () => {
    expect(isDisposableDomain('mailinator.com')).toBe(true);
    expect(isDisposableDomain('guerrillamail.com')).toBe(true);
    expect(isDisposableDomain('gmail.com')).toBe(false);
  });

  it('validateEmail marks disposable', async () => {
    const r = await validateEmail('test@mailinator.com');
    expect(r.isValidSyntax).toBe(true);
    expect(r.isDisposable).toBe(true);
  });
});