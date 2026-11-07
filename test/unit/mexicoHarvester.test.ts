import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createMockDb } from '../helpers/mockDb';
import { harvestLeads } from '../../src/services/harvester';
import type { TenantContext } from '../../src/services/hermesAgent';
import { scrubRepep, normalizeMexicoPhone } from '../../src/services/harvester/mexico/repepScrubbing';

describe('mexico harvester', () => {
  let ctx: TenantContext;
  beforeAll(() => {
    const db = createMockDb({ tenants: [{ id: 'default', name: 'Default Workspace', plan: 'starter', credit_balance: 1000, is_active: 1 }] });
    ctx = { tenantId: 'default', env: { ENVIRONMENT: 'test', DB: db, AI: undefined } as any };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));
  });

  it('normalizes Mexico phone', () => {
    expect(normalizeMexicoPhone('+52 55 1234 5678')).toBe('5512345678');
    expect(normalizeMexicoPhone('5215512345678')).toBe('5512345678');
  });

  it('scrubs REPEP as unknown without authorized query', () => {
    const res = scrubRepep('55 1234 5678');
    expect(res.normalizedPhone).toBe('5512345678');
    expect(res.repepStatus).toBe('unknown');
    expect(res.reusStatus).toBe('unknown');
    expect(res.isTcpaSafe).toBe(false);
  });

  it('disables SIGER (no fixed data)', async () => {
    const batch = await harvestLeads(ctx, { source: 'siger_sapi', limit: 3, autoEnrich: false, entidadFederativa: 'CDMX' });
    expect(batch.leads.length).toBe(0);
    expect(batch.creditsConsumed).toBe(0);
  });

  it('disables RPPyC (no fixed data)', async () => {
    const batch = await harvestLeads(ctx, { source: 'rppyc_luxury_acquisitions', limit: 2, autoEnrich: false, minAmountMxn: 30000000 });
    expect(batch.leads.length).toBe(0);
    expect(batch.creditsConsumed).toBe(0);
  });

  it('disables CNBV (no fixed data)', async () => {
    const batch = await harvestLeads(ctx, { source: 'cnbv_qualified_investors', limit: 2, autoEnrich: false });
    expect(batch.leads.length).toBe(0);
    expect(batch.creditsConsumed).toBe(0);
  });
});
