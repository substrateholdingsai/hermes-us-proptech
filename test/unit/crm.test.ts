import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { signWebhookPayload } from '../../src/services/crm/hmac';
import { buildFollowUpBossPayload, buildHubSpotPayload } from '../../src/services/crm';
import { normalizeLead } from '../../src/services/crm';

describe('crm', () => {
  it('signWebhookPayload produces valid HMAC-SHA256', async () => {
    const payload = '{"event":"target.resolved"}';
    const secret = 'super-secret';
    const sig = await signWebhookPayload(payload, secret);
    expect(sig).toMatch(/^sha256=[0-9a-f]{64}$/);
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(sig).toBe(expected);
  });

  it('normalizes lead', () => {
    const lead = normalizeLead({ fullName: '  Jane Roe  ', source: '' } as any);
    expect(lead.fullName).toBe('Jane Roe');
    expect(lead.source).toBe('VEKTOR Intelligence');
  });

  it('builds Follow Up Boss payload', () => {
    const lead = {
      fullName: 'Jane Roe',
      email: 'jane@example.com',
      phone: '+15551234567',
      source: 'VEKTOR Intelligence',
    } as any;
    const payload: any = buildFollowUpBossPayload(lead);
    expect(payload.firstName).toBe('Jane');
    expect(payload.lastName).toBe('Roe');
    expect(payload.emails).toEqual([{ value: 'jane@example.com' }]);
    expect(payload.phones).toEqual([{ value: '+15551234567' }]);
    expect(payload.stage).toBe('Hot Lead');
    expect(payload.tags).toContain('High-Equity');
  });

  it('builds HubSpot payload', () => {
    const lead = {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+15559876543',
      propertyAddress: '123 Main St',
      state: 'FL',
      equityDollars: 250000,
      investorType: 'accredited',
      dncStatus: 'clean',
      source: 'VEKTOR Intelligence',
    } as any;
    const payload: any = buildHubSpotPayload(lead);
    expect(payload.properties.firstname).toBe('John');
    expect(payload.properties.lastname).toBe('Doe');
    expect(payload.properties.email).toBe('john@example.com');
    expect(payload.properties.vektor_equity).toBe(250000);
    expect(payload.properties.vektor_accredited_status).toBe('accredited');
    expect(payload.properties.vektor_dnc_clean).toBe(true);
  });
});
