import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { createMockDb } from '../helpers/mockDb';
import { harvestLeads } from '../../src/services/harvester';
import { resolvePropertyEquity } from '../../src/services/property';
import type { TenantContext } from '../../src/services/hermesAgent';

describe('remediation', () => {
  let ctx: TenantContext;
  beforeAll(() => {
    const db = createMockDb({ tenants: [{ id: 'default', name: 'Default Workspace', plan: 'starter', credit_balance: 1000, is_active: 1 }] });
    ctx = { tenantId: 'default', env: { ENVIRONMENT: 'test', DB: db, AI: undefined } as any };
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('SEC empty response -> 0 leads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ hits: { hits: [] } }), { status: 200 })));
    const batch = await harvestLeads(ctx, { source: 'sec_form_d', limit: 5, autoEnrich: false });
    expect(batch.leads.length).toBe(0);
    expect(batch.creditsConsumed).toBe(0);
  });

  it('SEC missing offeringAmount -> null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      hits: { hits: [{ _source: { display_names: ['Fund X'], state: 'DE', executiveOfficers: ['Officer Y'] } }] }
    }), { status: 200 })));
    const batch = await harvestLeads(ctx, { source: 'sec_form_d', limit: 5, autoEnrich: false });
    expect(batch.leads.length).toBe(1);
    expect(batch.leads[0].capitalOrDealSizeDollars).toBeNull();
  });

  it('SEC missing officers -> null contact', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      hits: { hits: [{ _source: { display_names: ['Fund Z'], state: 'DE' } }] }
    }), { status: 200 })));
    const batch = await harvestLeads(ctx, { source: 'sec_form_d', limit: 5, autoEnrich: false });
    expect(batch.leads.length).toBe(1);
    expect(batch.leads[0].primaryContactName).toBeNull();
  });

  it('property without verified data -> sin datos', async () => {
    const r = await resolvePropertyEquity(ctx, { propertyAddress: '123 Main St', state: 'TX' });
    expect(r.dataSource).toBe('none');
    expect(r.marketValueCents).toBe(0);
    expect(r.ownerName).toBe('Sin datos');
  });
});
