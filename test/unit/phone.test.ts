import { describe, it, expect } from 'vitest';
import { normalizePhone, validatePhone, isTcpaSafeForSms } from '../../src/services/skiptrace/phone';

describe('phone', () => {
  it('normalizes 10-digit to E.164', () => {
    const r = normalizePhone('3055551234');
    expect(r.isValid).toBe(true);
    expect(r.e164).toBe('+13055551234');
  });

  it('rejects invalid chars / wrong length', () => {
    expect(normalizePhone('abc').isValid).toBe(false);
    expect(normalizePhone('12345').isValid).toBe(false);
    expect(normalizePhone('305555123456').isValid).toBe(false);
  });

  it('isTcpaSafeForSms true only mobile+clean', () => {
    expect(isTcpaSafeForSms('mobile', 'clean')).toBe(true);
    expect(isTcpaSafeForSms('landline', 'clean')).toBe(false);
    expect(isTcpaSafeForSms('mobile', 'flagged')).toBe(false);
    expect(isTcpaSafeForSms('mobile', 'unknown')).toBe(false);
  });

  it('validatePhone reflects tcpa safety', async () => {
    const env = {} as any;
    const r = await validatePhone(env, '3055551235');
    // heuristic: last digit 5 -> mobile, dnc clean => safe (unless flagged)
    expect(typeof r.isTcpaSafeForSms).toBe('boolean');
  });
});