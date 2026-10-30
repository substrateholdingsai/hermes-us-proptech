import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchFinra, isAccreditedByLicense } from '../../src/services/sec/finra';
import { validateSecInvestor, classifyInvestorType } from '../../src/services/sec';

describe('sec/finra', () => {
  const env = {} as any;

  it('marks accredited when Series 65 present', () => {
    expect(isAccreditedByLicense(['Series 65'])).toBe(true);
    expect(isAccreditedByLicense(['Series 7'])).toBe(true);
    expect(isAccreditedByLicense(['Series 82'])).toBe(true);
  });

  it('marks not accredited without financial licenses', () => {
    expect(isAccreditedByLicense([])).toBe(false);
    expect(isAccreditedByLicense(['Series 99'])).toBe(false);
  });

  it('classifies qualified_purchaser when AUM > 5M', () => {
    expect(classifyInvestorType({ regulatoryAumDollars: 10_000_000 } as any, false, null)).toBe('qualified_purchaser');
    expect(classifyInvestorType({ regulatoryAumDollars: 1_000_000 } as any, true, null)).toBe('accredited');
  });

  describe('searchFinra (mocked)', () => {
    const originalFetch = global.fetch;
    beforeEach(() => { global.fetch = vi.fn() as any; });
    afterEach(() => { global.fetch = originalFetch; });

    it('returns accredited true for Series 65', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          hits: { hits: [{ _source: { basicInformation: { firstName: 'Jane', lastName: 'Doe', crdNumber: '123' }, exams: [{ examName: 'Series 65' }] } }] },
        }),
      });
      const rec = await searchFinra(env, 'Jane Doe');
      expect(rec).not.toBeNull();
      expect(rec!.isAccreditedByLicense).toBe(true);
    });

    it('returns accredited false without licenses', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          hits: { hits: [{ _source: { basicInformation: { firstName: 'John', lastName: 'Smith', crdNumber: '456' }, exams: [] } }] },
        }),
      });
      const rec = await searchFinra(env, 'John Smith');
      expect(rec).not.toBeNull();
      expect(rec!.isAccreditedByLicense).toBe(false);
    });
  });

  describe('validateSecInvestor qualified_purchaser (mocked)', () => {
    const originalFetch = global.fetch;
    beforeEach(() => { global.fetch = vi.fn() as any; });
    afterEach(() => { global.fetch = originalFetch; });

    it('classifies qualified_purchaser when Form ADV AUM > 5M', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          hits: { hits: [{ _source: { form_type: 'ADV', display_names: 'Acme Fund', regulatoryAumDollars: 10_000_000 } }] },
        }),
      });
      const ctx = { tenantId: 't', env };
      const res = await validateSecInvestor(ctx as any, { entityName: 'Acme Fund' });
      expect(res.investorType).toBe('qualified_purchaser');
    });
  });
});