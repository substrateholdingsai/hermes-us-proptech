import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/index';
import { hashPassword } from '../../src/lib/password';
import { signJwt } from '../../src/lib/jwt';

async function makeUser(email: string, password: string, tenantId: string) {
  return {
    id: `usr_${email}`,
    tenant_id: tenantId,
    email,
    password_hash: await hashPassword(password),
    name: 'Futura User',
    role: 'client',
    is_active: 1,
  };
}

function createMockDb(opts: any) {
  const tenants = opts.tenants ?? [];
  const clientUsers = opts.clientUsers ?? [];
  const reports = opts.reports ?? [];
  const investorProfiles = opts.investorProfiles ?? [];

  function firstFor(sql: string, args: any[]) {
    const s = sql.toLowerCase();
    if (s.includes('from client_users') || s.includes('from users') || s.includes('from tenant_users') || s.includes('from crm_users')) {
      if (s.includes('where email = ?')) {
        const u = clientUsers.find((x: any) => x.email === args[0]);
        return u || null;
      }
      if (s.includes('where id = ?')) {
        const u = clientUsers.find((x: any) => x.id === args[0]);
        return u || null;
      }
    }
    if (s.includes('from tenants') && s.includes('where id = ?')) {
      const t = tenants.find((x: any) => x.id === args[0]);
      return t ? { credit_balance: t.credit_balance } : null;
    }
    if (s.includes('from tenants') && s.includes('count(*)')) {
      return { cnt: tenants.length };
    }
    if (s.includes('from reports') && s.includes('where id = ?')) {
      const r = reports.find((x: any) => x.id === args[0]);
      return r || null;
    }
    if (s.includes('from investor_profiles')) {
      return null;
    }
    return null;
  }

  function allFor(sql: string, args: any[]) {
    const s = sql.toLowerCase();
    if (s.includes('from reports') && s.includes('where tenant_id = ?')) {
      const filtered = reports.filter((r: any) => r.tenant_id === args[0]);
      const limit = args[1] ?? filtered.length;
      return { results: filtered.slice(0, limit) };
    }
    if (s.includes('from investor_profiles') && s.includes('where tenant_id = ?')) {
      const filtered = investorProfiles.filter((r: any) => r.tenant_id === args[0]);
      const limit = args[1] ?? filtered.length;
      const offset = args[2] ?? 0;
      return { results: filtered.slice(offset, offset + limit) };
    }
    if (s.includes('from tenants') && s.includes('select id, name')) {
      return { results: tenants.map((t: any) => ({ id: t.id, name: t.name, credit_balance: t.credit_balance, plan: t.plan, is_active: t.is_active })) };
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
      const args = a;
      const s = sql.toLowerCase();
      if (s.includes('update') && s.includes('client_users')) {
        const id = args[args.length - 1];
        const u = clientUsers.find((x: any) => x.id === id);
        if (u) {
          if (s.includes('failed_attempts = ?') && s.includes('locked_until = ?')) {
            u.failed_attempts = args[0];
            u.locked_until = args[1];
          } else if (s.includes('failed_attempts = ?')) {
            u.failed_attempts = args[0];
          }
          if (s.includes('failed_attempts = 0')) {
            u.failed_attempts = 0;
          }
          if (s.includes('locked_until = null')) {
            u.locked_until = null;
          }
        }
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
    async batch() { return []; },
  };
  return db;
}

const SECRET = 'test-jwt-secret-123';
let env: any;
let user: any;

beforeAll(async () => {
  user = await makeUser('futura@test.com', 'password123', 'futura_capital');
  const db = createMockDb({
    tenants: [
      { id: 'futura_capital', name: 'Futura Capital', plan: 'enterprise', credit_balance: 42, is_active: 1 },
      { id: 'default', name: 'Default Workspace', plan: 'starter', credit_balance: 945, is_active: 1 },
    ],
    clientUsers: [user],
    reports: [
      { id: 'rep1', tenant_id: 'futura_capital', type: 'dossier', subject: 'Futura Dossier', status: 'completed', created_at: '2026-11-01T00:00:00Z', credits_used: 5, pdf_key: 'reports/futura_capital/rep1.pdf' },
      { id: 'rep2', tenant_id: 'default', type: 'dossier', subject: 'Default Dossier', status: 'completed', created_at: '2026-11-02T00:00:00Z', credits_used: 3, pdf_key: 'reports/default/rep2.pdf' },
    ],
  });
  env = {
    ENVIRONMENT: 'test',
    DB: db,
    R2: {
      async get(key: string) {
        if (key === 'reports/futura_capital/rep1.pdf') {
          return { body: new Uint8Array([1, 2, 3]) };
        }
        return null;
      },
    },
    AI: {},
    HERMES_STAYPUFT_API_KEY: 'staypuft',
    HERMES_JWT_SECRET: SECRET,
  };
});

describe('client auth', () => {
  it('login invalid -> 401', async () => {
    const res = await app.request('/api/client/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'futura@test.com', password: 'wrong' }),
    }, env);
    expect(res.status).toBe(401);
  });

  it('login valid -> 200 + token', async () => {
    const res = await app.request('/api/client/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'futura@test.com', password: 'password123' }),
    }, env);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(json.token).toBeTruthy();
  });

  it('session expired -> 401', async () => {
    const expired = await signJwt({ sub: user.id, email: user.email, role: 'client', tenant_id: 'futura_capital' } as any, SECRET, -10);
    const res = await app.request('/api/client/me', {
      headers: { Authorization: `Bearer ${expired}` },
    }, env);
    expect(res.status).toBe(401);
  });

  it('leads/reports tenant isolation', async () => {
    const loginRes = await app.request('/api/client/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'futura@test.com', password: 'password123' }),
    }, env);
    const { token } = await loginRes.json();
    const reps = await app.request('/api/client/reports', { headers: { Authorization: `Bearer ${token}` } }, env);
    const rjson: any = await reps.json();
    expect(rjson.reports.every((r: any) => r.tenant_id === 'futura_capital')).toBe(true);
    expect(rjson.reports.length).toBe(1);
  });

  it('foreign dossier download -> 403', async () => {
    const loginRes = await app.request('/api/client/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'futura@test.com', password: 'password123' }),
    }, env);
    const { token } = await loginRes.json();
    const res = await app.request('/api/client/reports/rep2/download', { headers: { Authorization: `Bearer ${token}` } }, env);
    expect(res.status).toBe(403);
  });

  it('own dossier download -> 200', async () => {
    const loginRes = await app.request('/api/client/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'futura@test.com', password: 'password123' }),
    }, env);
    const { token } = await loginRes.json();
    const res = await app.request('/api/client/reports/rep1/download', { headers: { Authorization: `Bearer ${token}` } }, env);
    expect(res.status).toBe(200);
  });

  it('reports pagination cap 100', async () => {
    const many = Array.from({ length: 150 }, (_, i) => ({ id: `rx${i}`, tenant_id: 'futura_capital', type: 'dossier', subject: `S${i}`, status: 'completed', created_at: '2026-11-01T00:00:00Z', credits_used: 1, pdf_key: null }));
    const db2 = createMockDb({ tenants: [{ id: 'futura_capital', name: 'Futura', plan: 'enterprise', credit_balance: 0, is_active: 1 }], clientUsers: [user], reports: many });
    const env2: any = { ...env, DB: db2 };
    const loginRes = await app.request('/api/client/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'futura@test.com', password: 'password123' }),
    }, env2);
    const { token } = await loginRes.json();
    const res = await app.request('/api/client/reports?limit=200', { headers: { Authorization: `Bearer ${token}` } }, env2);
    const json: any = await res.json();
    expect(json.reports.length).toBe(100);
  });
  it('lockout: 4 failures still allow 5th attempt, 5th locks', async () => {
    user.failed_attempts = 0;
    user.locked_until = null;
    for (let i = 0; i < 4; i++) {
      const res = await app.request('/api/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'futura@test.com', password: 'wrong' }),
      }, env);
      expect(res.status).toBe(401);
    }
    expect(user.failed_attempts).toBe(4);
    const fifth = await app.request('/api/client/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'futura@test.com', password: 'wrong' }),
    }, env);
    expect(fifth.status).toBe(401);
    expect(user.failed_attempts).toBe(5);
    expect(user.locked_until).toBeTruthy();
  });

  it('lockout: during lock even correct password is rejected', async () => {
    user.failed_attempts = 5;
    user.locked_until = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const res = await app.request('/api/client/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'futura@test.com', password: 'password123' }),
    }, env);
    expect(res.status).toBe(401);
  });

  it('lockout: after expiry login succeeds and resets counter', async () => {
    user.failed_attempts = 5;
    user.locked_until = new Date(Date.now() - 1000).toISOString();
    const res = await app.request('/api/client/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'futura@test.com', password: 'password123' }),
    }, env);
    expect(res.status).toBe(200);
    expect(user.failed_attempts).toBe(0);
    expect(user.locked_until).toBeNull();
  });

  it('lockout: successful login resets counter', async () => {
    user.failed_attempts = 3;
    user.locked_until = null;
    const res = await app.request('/api/client/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'futura@test.com', password: 'password123' }),
    }, env);
    expect(res.status).toBe(200);
    expect(user.failed_attempts).toBe(0);
    expect(user.locked_until).toBeNull();
  });
});
