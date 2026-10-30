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

  it('harvests SEC Form D leads', async () => {
    const batch = await harvestLeads(ctx, { source: 'sec_form_d', limit: 5, autoEnrich: false });
    expect(batch.leads.length).toBe(5);
    expect(batch.source).toBe('sec_form_d');
    expect(batch.creditsConsumed).toBe(50);
    expect(batch.leads[0].dealSizeFormatted).toMatch(/^\$/);
  });

  it('harvests luxury cash buyers', async () => {
    const batch = await harvestLeads(ctx, { source: 'luxury_cash_buyers', limit: 3, autoEnrich: false, minAmountDollars: 2000000 });
    expect(batch.leads.length).toBe(3);
    expect(batch.leads.every((l) => l.source === 'luxury_cash_buyers')).toBe(true);
  });

  it('harvests RIA family offices', async () => {
    const batch = await harvestLeads(ctx, { source: 'ria_family_offices', limit: 4, autoEnrich: false });
    expect(batch.leads.length).toBe(4);
    expect(batch.leads[0].accreditationBadge).toBe('Qualified Purchaser');
  });
});
