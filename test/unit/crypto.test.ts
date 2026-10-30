import { describe, it, expect } from 'vitest';
import { hashApiKey } from '../../src/lib/crypto';

describe('crypto hashApiKey', () => {
  it('generates consistent hex hashes', async () => {
    const a = await hashApiKey('hello');
    const b = await hashApiKey('hello');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('dev key produces 64-char hex SHA-256', async () => {
    const h = await hashApiKey('hermes_dev_secret_key_2026');
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]+$/);
  });

  it('different strings produce different hashes', async () => {
    const a = await hashApiKey('foo');
    const b = await hashApiKey('bar');
    expect(a).not.toBe(b);
  });
});