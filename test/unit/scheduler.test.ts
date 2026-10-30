import { describe, it, expect, vi, beforeAll } from 'vitest';
import { runScheduledHarvester } from '../../src/services/harvester/scheduler';

describe('scheduler', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));
  });

  it('runs scheduled harvests', async () => {
    const schedule = {
      id: 'sched1',
      tenant_id: 'default',
      name: 'Test Schedule',
      cron_expression: '0 12 * * 1',
      source: 'sec_form_d',
      jurisdiction: 'US',
      state: 'FL',
      min_amount_dollars: 5000000,
      limit_per_run: 3,
      auto_sync_crm: 0,
      is_active: 1,
    };

    const db: any = {
      prepare(sql: string) {
        const s = sql.toLowerCase();
        return {
          _sql: sql,
          bind(...args: any[]) {
            return {
              async all() {
                if (s.includes('harvest_schedules')) return { results: [schedule] };
                if (s.includes('crm_integrations')) return { results: [] };
                return { results: [] };
              },
              async first() { return null; },
              async run() { return { success: true }; },
            };
          },
          async all() {
            if (s.includes('harvest_schedules')) return { results: [schedule] };
            if (s.includes('crm_integrations')) return { results: [] };
            return { results: [] };
          },
          async first() { return null; },
          async run() { return { success: true }; },
        };
      },
    };

    const env: any = { ENVIRONMENT: 'test', DB: db, AI: undefined };
    const result = await runScheduledHarvester(env);
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
  });
});
