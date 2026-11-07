import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/index';
import { hashApiKey } from '../../src/lib/crypto';

function createMockDb(opts: any = {}) {
  const tenants = opts.tenants ?? [];
  const reports = opts.reports ?? [];
  const creditTransactions = opts.creditTransactions ?? [];
  const harvestSchedules = opts.harvestSchedules ?? [];

  function firstFor(sql: string, args: any[]) {
    const s = sql.toLowerCase();
    if (s.includes('from tenants') && s.includes('count(*)')) {
      return { cnt: tenants.length, credits: tenants.reduce((a: any, t: any) => a + (t.credit_balance || 0), 0) };
    }
    if (s.includes('from reports') && s.includes('count(*)')) {
      let filtered = reports;
      if (s.includes('where tenant_id = ?')) filtered = reports.filter((r: any) => r.tenant_id === args[0]);
      if (s.includes("status in")) filtered = reports.filter((r: any) => r.status === 'failed' || r.status === 'error');
      return { cnt: filtered.length };
    }
    if (s.includes('from harvest_schedules') && s.includes('count(*)')) {
      return { cnt: harvestSchedules.length };
    }
    if (s.includes('from harvest_runs') && s.includes('count(*)')) {
      return { cnt: 0 };
    }
    if (s.includes('from credit_transactions') && s.includes('sum(')) {
      const total = creditTransactions.reduce((a: any, t: any) => a + (t.amount < 0 ? -t.amount : 0), 0);
      return { total };
    }
    if (s.includes('from reports') && s.includes('order by created_at desc limit 1')) {
      const sorted = [...reports].sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)));
      return sorted[0] || null;
    }
    if (s.includes('from harvest_schedules') && s.includes('order by last_run_at desc limit 1')) {
      return harvestSchedules[0] || null;
    }
    if (s.includes('from reports') && s.includes('where id = ?')) {
      const id = args[0];
      let row = reports.find((r: any) => r.id === id);
      if (args[1]) row = reports.find((r: any) => r.id === id && r.tenant_id === args[1]);
      return row || null;
    }
    if (s.includes('select credit_balance from tenants')) {
      const t = tenants.find((x: any) => x.id === args[0]);
      return t ? { credit_balance: t.credit_balance } : null;
    }
    if (s.includes('from tenants') && s.includes('where id = ?')) {
      const t = tenants.find((x: any) => x.id === args[0]);
      return t ? { id: t.id, name: t.name, credit_balance: t.credit_balance, plan: t.plan, is_active: t.is_active } : null;
    }
    if (s.includes('from reports') && s.includes('where tenant_id = ?') && s.includes('and subject = ?')) {
      const filtered = reports.filter((r: any) => r.tenant_id === args[0] && r.subject === args[1]);
      const sorted = [...filtered].sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)));
      return sorted[0] || null;
    }
    if (s.includes('from reports') && s.includes('count(*)') && s.includes('where tenant_id = ?')) {
      const threshold = args.length > 1 ? args[args.length - 1] : null;
      let filtered = reports.filter((r: any) => r.tenant_id === args[0]);
      if (threshold && (s.includes('created_at >=') || s.includes('created_at >='))) {
        filtered = filtered.filter((r: any) => String(r.created_at) >= String(args[1]));
      }
      return { cnt: filtered.length };
    }
    return null;
  }

  function allFor(sql: string, args: any[]) {
    const s = sql.toLowerCase();
    if (s.includes('from reports')) {
      let filtered = [...reports];
      if (s.includes('where tenant_id = ?')) {
        filtered = filtered.filter((r: any) => r.tenant_id === args[0]);
      }
      if (s.includes("status in ('failed','error')")) {
        filtered = filtered.filter((r: any) => r.status === 'failed' || r.status === 'error');
      }
      filtered.sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)));
      const last = args[args.length - 1];
      const limit = args.length > 0 && Number.isFinite(Number(last)) ? Number(last) : filtered.length;
      filtered = filtered.slice(0, limit);
      return { results: filtered };
    }
    if (s.includes('from tenants') && s.includes('select id, name')) {
      return { results: tenants.map((t: any) => ({ id: t.id, name: t.name, credit_balance: t.credit_balance, plan: t.plan, is_active: t.is_active })) };
    }
    if (s.includes('credit_transactions')) {
      return { results: creditTransactions.filter((t: any) => !args.length || t.tenant_id === args[0]) };
    }
    if (s.includes('harvest_schedules')) {
      return { results: harvestSchedules };
    }
    return { results: [] };
  }

  const db: any = {
    prepare(sql: string) {
      const stmt: any = {
        _sql: sql,
        _args: [] as any[],
        bind(...a: any[]) {
          const b: any = {
            _sql: sql,
            _args: a,
            async first() { return firstFor(sql, a); },
            async all() { return allFor(sql, a); },
            async run() {
              const s = sql.toLowerCase();
              if (s.includes('insert into reports')) {
                reports.push({
                  id: a[0], tenant_id: a[1], type: a[2], subject: a[3], status: a[4],
                  created_at: a[5], credits_used: a[6], pdf_key: a[7], pdf_url: a[8],
                });
              }
              if (s.includes('update reports') && s.includes('credits_used')) {
                const r = reports.find((x: any) => x.id === a[a.length - 1]);
                if (r) r.credits_used = a[0];
              }
              return { success: true };
            },
          };
          return b;
        },
        async first() { return firstFor(sql, []); },
        async all() { return allFor(sql, []); },
        async run() { return { success: true }; },
      };
      return stmt;
    },
    async batch(stmts: any[]) {
      for (const st of stmts || []) {
        const sql = String(st._sql || '').toLowerCase();
        const a = st._args || [];
        if (sql.includes('update tenants') && sql.includes('credit_balance')) {
          const t = tenants.find((x: any) => x.id === a[a.length - 1]);
          if (t) t.credit_balance = a[0];
        }
        if (sql.includes('insert into credit_transactions')) {
          creditTransactions.push({ id: a[0], tenant_id: a[1], amount: a[2], balance_after: a[3], task_type: a[4], job_id: a[5], created_at: a[7] });
        }
      }
      return [];
    },
  };
  return db;
}

const KEY = 'hermes_staypuft_test_key';
let env: any;

beforeAll(async () => {
  const db = createMockDb({
    tenants: [
      { id: 't1', name: 'Tenant One', plan: 'pro', credit_balance: 100, is_active: 1 },
      { id: 't2', name: 'Tenant Two', plan: 'starter', credit_balance: 50, is_active: 1 },
    ],
    reports: [
      { id: 'r1', tenant_id: 't1', type: 'SOS', subject: 'Acme LLC', status: 'completed', created_at: '2026-11-01T00:00:00Z', credits_used: 5, pdf_url: 'reports/t1/r1.pdf' },
      { id: 'r2', tenant_id: 't2', type: 'property', subject: 'House', status: 'completed', created_at: '2026-11-02T00:00:00Z', credits_used: 8, pdf_url: 'reports/t2/r2.pdf' },
    ],
    creditTransactions: [
      { id: 'c1', tenant_id: 't1', amount: -5, balance_after: 95, created_at: '2026-11-01T00:00:00Z' },
    ],
    harvestSchedules: [{ id: 'h1', last_run_at: '2026-11-01T00:00:00Z', last_status: 'success' }],
  });
  const r2Store: Record<string, any> = {};
  const r2 = {
    async put(key: string, value: any) { r2Store[key] = { body: value }; return { key }; },
    async get(key: string) { return r2Store[key] || null; },
  };
  env = { ENVIRONMENT: 'production', DB: db, R2: r2 as any, AI: {} as any, HERMES_SANDBOX: {} as any, HERMES_STAYPUFT_API_KEY: KEY };
});

describe('internal connector', () => {
  it('GET /api/internal/status without key -> 401', async () => {
    const res = await app.request('/api/internal/status', {}, env);
    expect(res.status).toBe(401);
  });

  it('GET /api/internal/status with bad key -> 401', async () => {
    const res = await app.request('/api/internal/status', { headers: { 'X-StayPuft-Key': 'bad' } }, env);
    expect(res.status).toBe(401);
  });

  it('GET /api/internal/status with valid key -> 200', async () => {
    const res = await app.request('/api/internal/status', { headers: { 'X-StayPuft-Key': KEY } }, env);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(json.tenantCount).toBe(2);
  });

  it('GET /api/internal/reports pagination cap 100', async () => {
    const many = Array.from({ length: 150 }, (_, i) => ({
      id: `rx${i}`, tenant_id: 't1', type: 'dossier', subject: `S${i}`, status: 'completed',
      created_at: `2026-11-01T00:00:${String(i % 60).padStart(2, '0')}Z`, credits_used: 1, pdf_url: null,
    }));
    const env2: any = { ...env, DB: createMockDb({ tenants: env.DB ? [] : [], reports: many, creditTransactions: [], harvestSchedules: [] }) };
    // keep tenants
    env2.DB = createMockDb({ tenants: [{ id: 't1', name: 'T1', plan: 'pro', credit_balance: 1, is_active: 1 }], reports: many });
    const res = await app.request('/api/internal/reports?tenant_id=t1&limit=200', { headers: { 'X-StayPuft-Key': KEY } }, env2);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.reports.length).toBe(100);
  });

  it('GET /api/internal/reports tenant isolation', async () => {
    const res = await app.request('/api/internal/reports?tenant_id=t1', { headers: { 'X-StayPuft-Key': KEY } }, env);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.reports.every((r: any) => r.tenant_id === 't1')).toBe(true);
    expect(json.reports.length).toBe(1);
  });

  it('GET /api/internal/reports/:id -> 200 and 404', async () => {
    const res = await app.request('/api/internal/reports/r1', { headers: { 'X-StayPuft-Key': KEY } }, env);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.report.id).toBe('r1');
    const res2 = await app.request('/api/internal/reports/nope', { headers: { 'X-StayPuft-Key': KEY } }, env);
    expect(res2.status).toBe(404);
  });

  it('GET /api/internal/tenants -> 200', async () => {
    const res = await app.request('/api/internal/tenants', { headers: { 'X-StayPuft-Key': KEY } }, env);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.tenants.length).toBe(2);
  });

  it('GET /api/internal/metrics -> 200', async () => {
    const res = await app.request('/api/internal/metrics', { headers: { 'X-StayPuft-Key': KEY } }, env);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.dossiersGenerated).toBe(2);
    expect(json.creditsConsumed).toBe(5);
  });

  it('POST /api/internal/reports/generate without key -> 401', async () => {
    const res = await app.request('/api/internal/reports/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: 't1', subject: 'Acme' }) }, env);
    expect(res.status).toBe(401);
  });

  it('POST /api/internal/reports/generate unknown tenant -> 400', async () => {
    const res = await app.request('/api/internal/reports/generate', { method: 'POST', headers: { 'X-StayPuft-Key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: 'nope', subject: 'Acme', tasks: ['entity_resolution'] }) }, env);
    expect(res.status).toBe(400);
  });

  it('POST /api/internal/reports/generate insufficient credits -> 402 no charge', async () => {
    const env2: any = { ...env, DB: createMockDb({ tenants: [{ id: 't1', name: 'T1', plan: 'pro', credit_balance: 1, is_active: 1 }], reports: [], creditTransactions: [] }) };
    const r2Store: Record<string, any> = {};
    env2.R2 = { async put(k: string, v: any) { r2Store[k] = { body: v }; return { key: k }; }, async get(k: string) { return r2Store[k] || null; } } as any;
    const res = await app.request('/api/internal/reports/generate', { method: 'POST', headers: { 'X-StayPuft-Key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: 't1', subject: 'Acme', tasks: ['entity_resolution', 'property_equity', 'sec_validation', 'skip_trace'] }) }, env2);
    expect(res.status).toBe(402);
  });

  it('POST /api/internal/reports/generate dry_run no charge', async () => {
    const env2: any = { ...env, DB: createMockDb({ tenants: [{ id: 't1', name: 'T1', plan: 'pro', credit_balance: 100, is_active: 1 }], reports: [], creditTransactions: [] }) };
    const r2Store: Record<string, any> = {};
    env2.R2 = { async put(k: string, v: any) { r2Store[k] = { body: v }; return { key: k }; }, async get(k: string) { return r2Store[k] || null; } } as any;
    const res = await app.request('/api/internal/reports/generate', { method: 'POST', headers: { 'X-StayPuft-Key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: 't1', subject: 'Acme', dry_run: true }) }, env2);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.dry_run).toBe(true);
    expect(json.estimated_credits).toBe(26);
  });

  it('POST /api/internal/reports/generate full charges 26 and creates report', async () => {
    const env2: any = { ...env, DB: createMockDb({ tenants: [{ id: 't1', name: 'T1', plan: 'pro', credit_balance: 100, is_active: 1 }], reports: [], creditTransactions: [] }) };
    const r2Store: Record<string, any> = {};
    env2.R2 = { async put(k: string, v: any) { r2Store[k] = { body: v }; return { key: k }; }, async get(k: string) { return r2Store[k] || null; } } as any;
    const res = await app.request('/api/internal/reports/generate', { method: 'POST', headers: { 'X-StayPuft-Key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant_id: 't1', subject: 'Acme LLC', tasks: ['entity_resolution', 'property_equity', 'sec_validation', 'skip_trace'] }) }, env2);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.credits_used).toBe(26);
    expect(json.credits_remaining).toBe(74);
    expect(json.reportId).toBeTruthy();
    const db = env2.DB;
    const r = await db.prepare('SELECT * FROM reports WHERE id = ?').bind(json.reportId).first();
    expect(r).toBeTruthy();
    expect(r.subject).toBe('Acme LLC');
  });

  it('POST /api/internal/reports/generate duplicate does not charge twice', async () => {
    const env2: any = { ...env, DB: createMockDb({ tenants: [{ id: 't1', name: 'T1', plan: 'pro', credit_balance: 100, is_active: 1 }], reports: [], creditTransactions: [] }) };
    const r2Store: Record<string, any> = {};
    env2.R2 = { async put(k: string, v: any) { r2Store[k] = { body: v }; return { key: k }; }, async get(k: string) { return r2Store[k] || null; } } as any;
    const body = JSON.stringify({ tenant_id: 't1', subject: 'Dup Subject', tasks: ['entity_resolution', 'property_equity', 'sec_validation', 'skip_trace'] });
    const res1 = await app.request('/api/internal/reports/generate', { method: 'POST', headers: { 'X-StayPuft-Key': KEY, 'Content-Type': 'application/json' }, body }, env2);
    expect(res1.status).toBe(200);
    const j1: any = await res1.json();
    const res2 = await app.request('/api/internal/reports/generate', { method: 'POST', headers: { 'X-StayPuft-Key': KEY, 'Content-Type': 'application/json' }, body }, env2);
    expect(res2.status).toBe(200);
    const j2: any = await res2.json();
    expect(j2.duplicate).toBe(true);
    expect(j2.reportId).toBe(j1.reportId);
  });
});
