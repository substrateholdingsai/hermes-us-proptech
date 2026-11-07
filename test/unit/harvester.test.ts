import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createMockDb } from '../helpers/mockDb';
import { hashApiKey } from '../../src/lib/crypto';
import { harvestLeads } from '../../src/services/harvester';
import type { TenantContext } from '../../src/services/hermesAgent';

describe('harvester', () => {
  let ctx: TenantContext;
  beforeAll(async () => {
    const db = createMockDb({ tenants: [{ id: 'default', name: 'Default Workspace', plan: 'starter', credit_balance: 1000, is_active: 1 }] });
    ctx = { tenantId: 'default', env: { ENVIRONMENT: 'test', DB: db, AI: undefined } as any };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));
  });

  it('does not generate leads when SEC fetch fails', async () => {
    const batch = await harvestLeads(ctx, { source: 'sec_form_d', limit: 5, autoEnrich: false });
    expect(batch.leads.length).toBe(0);
    expect(batch.creditsConsumed).toBe(0);
    expect(batch.status).toBe('error');
  });

  it('disables luxury cash buyers (no fixed data)', async () => {
    const batch = await harvestLeads(ctx, { source: 'luxury_cash_buyers', limit: 3, autoEnrich: false, minAmountDollars: 2000000 });
    expect(batch.leads.length).toBe(0);
    expect(batch.creditsConsumed).toBe(0);
  });

  it('disables RIA family offices (no fixed data)', async () => {
    const batch = await harvestLeads(ctx, { source: 'ria_family_offices', limit: 4, autoEnrich: false });
    expect(batch.leads.length).toBe(0);
    expect(batch.creditsConsumed).toBe(0);
  });
});
