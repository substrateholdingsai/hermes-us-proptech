import { Hono } from 'hono';
import type { Env } from '../types/env';
import { hashPassword, verifyPassword } from '../lib/password';
import { signJwt, verifyJwt } from '../lib/jwt';
import { newId, nowIso } from '../services/db';
import { clientLoginView, clientPanelView } from '../views/client';

export const clientApi = new Hono<{ Bindings: Env }>();
export const clientPages = new Hono<{ Bindings: Env }>();

const CLIENT_USER_TABLES = ['client_users', 'users', 'tenant_users', 'crm_users'];

function getJwtSecret(env: Env): string | null {
  const s = env.HERMES_JWT_SECRET || env.CRM_JWT_SECRET || env.JWT_SECRET;
  if (s && s.trim()) return s.trim();
  if ((env.ENVIRONMENT || 'development') === 'production') return null;
  return 'hermes-dev-only-jwt-secret';
}

function clampLimit(raw: string | undefined, fallback = 50): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(1, Math.floor(n)));
}

async function findUserByEmail(db: any, email: string): Promise<{ table: string; row: any } | null> {
  for (const table of CLIENT_USER_TABLES) {
    try {
      const row = await db.prepare(`SELECT * FROM ${table} WHERE email = ? LIMIT 1`).bind(email).first();
      if (row) return { table, row };
    } catch {
      // table may not exist
    }
  }
  return null;
}

async function findUserById(db: any, id: string): Promise<any | null> {
  for (const table of CLIENT_USER_TABLES) {
    try {
      const row = await db.prepare(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`).bind(id).first();
      if (row) return row;
    } catch {
      // ignore
    }
  }
  return null;
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function mapUser(row: any) {
  return {
    id: row.id,
    tenant_id: row.tenant_id ?? row.tenantId ?? row.tenant ?? null,
    email: row.email,
    name: row.name ?? row.full_name ?? null,
    role: row.role ?? 'client',
    password_hash: row.password_hash ?? row.passwordHash ?? row.password ?? null,
    is_active: row.is_active ?? row.isActive ?? 1,
    failed_attempts: Number(row.failed_attempts ?? row.failedAttempts ?? 0),
    locked_until: row.locked_until ?? row.lockedUntil ?? null,
  };
}

async function recordClientAudit(c: any, email: string, result: string): Promise<void> {
  try {
    await c.env.DB.prepare(
      `INSERT INTO internal_audit_log (id, actor, endpoint, method, result, status_code, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(newId('ia'), 'client', '/api/client/login', 'POST', `${result}:${email}`, 401, c.req.header('cf-connecting-ip') || null, nowIso())
      .run();
  } catch {
    // ignore
  }
}

async function getSession(c: any): Promise<any | null> {
  const secret = getJwtSecret(c.env);
  if (!secret) return null;
  const authHeader = c.req.header('authorization') || c.req.header('Authorization');
  let token: string | null = null;
  if (authHeader && /^Bearer\s+/i.test(authHeader)) token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    const cookie = c.req.header('cookie') || '';
    const m = cookie.match(/(?:^|;\s*)hermes_client_token=([^;]+)/);
    if (m) token = decodeURIComponent(m[1]);
  }
  if (!token) return null;
  const payload = await verifyJwt(token, secret);
  if (!payload) return null;
  if (!payload.tenant_id) return null;
  return payload;
}

function requireSession(c: any) {
  return getSession(c);
}

// ---------- auth ----------
clientApi.post('/login', async (c) => {
  let body: any = {};
  try { body = await c.req.json(); } catch { body = {}; }
  const email = String(body?.email ?? body?.username ?? body?.user ?? '').trim().toLowerCase();
  const password = String(body?.password ?? body?.pass ?? '');
  if (!email || !password) {
    return c.json({ ok: false, error: 'email and password are required' }, 400);
  }

  const found = await findUserByEmail(c.env.DB, email);
  if (!found) {
    await recordClientAudit(c, email, 'login_failed');
    return c.json({ ok: false, error: 'invalid_credentials' }, 401);
  }
  const user = mapUser(found.row);
  if (!user.is_active) {
    await recordClientAudit(c, email, 'login_failed');
    return c.json({ ok: false, error: 'invalid_credentials' }, 401);
  }

  const now = Date.now();
  let lockedUntilMs = user.locked_until ? Date.parse(user.locked_until) : NaN;
  if (Number.isFinite(lockedUntilMs) && lockedUntilMs > now) {
    await recordClientAudit(c, email, 'login_locked');
    return c.json({ ok: false, error: 'invalid_credentials' }, 401);
  }
  // expired lock: reset counter
  if (Number.isFinite(lockedUntilMs) && lockedUntilMs <= now) {
    try {
      await c.env.DB.prepare(`UPDATE ${found.table} SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`)
        .bind(nowIso(), user.id)
        .run();
    } catch {
      // ignore
    }
    user.failed_attempts = 0;
    user.locked_until = null;
  }

  if (!user.password_hash || !(await verifyPassword(password, user.password_hash))) {
    const attempts = (user.failed_attempts || 0) + 1;
    if (attempts >= LOCKOUT_THRESHOLD) {
      const lockUntil = new Date(now + LOCKOUT_MS).toISOString();
      try {
        await c.env.DB.prepare(`UPDATE ${found.table} SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?`)
          .bind(LOCKOUT_THRESHOLD, lockUntil, nowIso(), user.id)
          .run();
      } catch {
        // ignore
      }
      await recordClientAudit(c, email, 'login_locked');
    } else {
      try {
        await c.env.DB.prepare(`UPDATE ${found.table} SET failed_attempts = ?, updated_at = ? WHERE id = ?`)
          .bind(attempts, nowIso(), user.id)
          .run();
      } catch {
        // ignore
      }
      await recordClientAudit(c, email, 'login_failed');
    }
    return c.json({ ok: false, error: 'invalid_credentials' }, 401);
  }

  // success: reset
  try {
    await c.env.DB.prepare(`UPDATE ${found.table} SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`)
      .bind(nowIso(), user.id)
      .run();
  } catch {
    // ignore
  }

  const secret = getJwtSecret(c.env);
  if (!secret) {
    return c.json({ ok: false, error: 'jwt_secret_not_configured' }, 500);
  }
  const token = await signJwt(
    { sub: user.id, email: user.email, role: user.role, name: user.name ?? undefined, tenant_id: user.tenant_id } as any,
    secret
  );

  const isProd = (c.env.ENVIRONMENT || 'development') === 'production';
  c.header('Set-Cookie', `hermes_client_token=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax${isProd ? '; Secure' : ''}`);

  try {
    await c.env.DB.prepare(
      `INSERT INTO internal_audit_log (id, actor, endpoint, method, result, status_code, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(newId('ia'), 'client', '/api/client/login', 'POST', 'login_ok', 200, c.req.header('cf-connecting-ip') || null, nowIso())
      .run();
  } catch {
    // ignore
  }

  return c.json({
    ok: true,
    token,
    access_token: token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, tenant_id: user.tenant_id },
  });
});

clientApi.post('/logout', async (c) => {
  c.header('Set-Cookie', 'hermes_client_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return c.json({ ok: true });
});

clientApi.get('/me', async (c) => {
  const session = await requireSession(c);
  if (!session) return c.json({ ok: false, error: 'unauthorized' }, 401);
  const user = await findUserById(c.env.DB, session.sub);
  const mapped = user ? mapUser(user) : null;
  let credits = 0;
  let tenantName: string | null = null;
  try {
    const row = await c.env.DB.prepare('SELECT name, credit_balance FROM tenants WHERE id = ?').bind(session.tenant_id).first<{ name?: string; credit_balance: number }>();
    credits = row?.credit_balance ?? 0;
    tenantName = row?.name ?? null;
  } catch {
    credits = 0;
  }
  return c.json({
    ok: true,
    user: mapped ? { id: mapped.id, email: mapped.email, name: mapped.name, role: mapped.role, tenant_id: mapped.tenant_id } : { id: session.sub, email: session.email, role: session.role, tenant_id: session.tenant_id },
    tenant_id: session.tenant_id,
    tenant_name: tenantName,
    credits,
    credit_balance: credits,
    credits_remaining: credits,
  });
});

// ---------- leads ----------
clientApi.get('/leads', async (c) => {
  const session = await requireSession(c);
  if (!session) return c.json({ ok: false, error: 'unauthorized' }, 401);
  const tenantId = session.tenant_id;
  const limit = clampLimit(c.req.query('limit'));
  const offset = Math.max(0, Number(c.req.query('offset') || 0));

  const candidateTables = ['leads', 'investor_profiles', 'harvested_leads', 'entity_lookups'];
  let rows: any[] = [];
  for (const table of candidateTables) {
    try {
      const sql = `SELECT * FROM ${table} WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      const res = await c.env.DB.prepare(sql).bind(tenantId, limit, offset).all();
      const r = res?.results ?? [];
      if (r.length > 0) { rows = r; break; }
      if (rows.length === 0 && r.length === 0) {
        // keep trying; if all empty, rows stays []
      }
    } catch {
      // table missing
    }
  }
  // if all empty, try first table anyway for schema (already empty)
  const leads = rows.map((row: any) => ({
    id: row.id,
    subject: row.subject ?? row.full_name ?? row.name ?? row.primary_contact_name ?? row.subject_name ?? row.entity_name ?? null,
    name: row.full_name ?? row.name ?? row.primary_contact_name ?? row.subject_name ?? row.entity_name ?? null,
    company: row.entity_name ?? row.company ?? row.entityOrFundName ?? null,
    source: row.source ?? (row.sec_form_d ? 'sec_form_d' : null),
    sec_form_d: row.sec_form_d ?? null,
    type: row.type ?? row.lead_type ?? row.source ?? (row.sec_form_d ? 'SEC Form D' : (row.investor_type ?? 'lead')),
    status: row.status ?? 'new',
    score: row.score ?? row.equity_score ?? 0,
    contact: row.contact ?? row.email ?? row.phone ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    cik: row.cik ?? row.cik_number ?? null,
    capital: row.capital ?? row.amount ?? row.equity ?? null,
    created_at: row.created_at ?? row.createdAt ?? row.created ?? null,
    tenant_id: row.tenant_id,
  }));
  return c.json({ ok: true, leads, items: leads, count: leads.length, total: leads.length, limit, offset });
});

// ---------- reports ----------
clientApi.get('/reports', async (c) => {
  const session = await requireSession(c);
  if (!session) return c.json({ ok: false, error: 'unauthorized' }, 401);
  const tenantId = session.tenant_id;
  const limit = clampLimit(c.req.query('limit'));
  let rows: any[] = [];
  try {
    const res = await c.env.DB
      .prepare('SELECT * FROM reports WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?')
      .bind(tenantId, limit)
      .all();
    rows = res?.results ?? [];
  } catch {
    rows = [];
  }
  const reports = rows.map((row: any) => ({
    id: row.id,
    tenant_id: row.tenant_id,
    type: row.type ?? 'dossier',
    tipo: row.type ?? 'dossier',
    subject: row.subject ?? null,
    sujeto: row.subject ?? null,
    status: row.status ?? 'completed',
    created_at: row.created_at,
    credits_used: row.credits_used ?? 0,
    pdf_url: `/api/client/reports/${row.id}/download`,
  }));
  return c.json({ ok: true, reports, items: reports, count: reports.length, total: reports.length, limit });
});

clientApi.get('/reports/:id/download', async (c) => {
  const session = await requireSession(c);
  if (!session) return c.json({ ok: false, error: 'unauthorized' }, 401);
  const tenantId = session.tenant_id;
  const id = c.req.param('id');
  let row: any = null;
  try {
    row = await c.env.DB.prepare('SELECT * FROM reports WHERE id = ? LIMIT 1').bind(id).first();
  } catch {
    row = null;
  }
  if (!row || row.tenant_id !== tenantId) {
    return c.json({ ok: false, error: 'forbidden' }, 403);
  }
  const key = row.pdf_key ?? row.pdf_url ?? `reports/${tenantId}/${id}.pdf`;
  if (!c.env.R2) {
    return c.json({ ok: false, error: 'not_found' }, 404);
  }
  let obj: any = null;
  try {
    obj = await c.env.R2.get(key);
  } catch {
    obj = null;
  }
  if (!obj) {
    return c.json({ ok: false, error: 'not_found' }, 404);
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO internal_audit_log (id, actor, endpoint, method, result, status_code, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(newId('ia'), 'client', `/api/client/reports/${id}/download`, 'GET', 'download_ok', 200, c.req.header('cf-connecting-ip') || null, nowIso())
      .run();
  } catch {
    // ignore
  }

  const headers = new Headers();
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', `inline; filename="Hermes-Dossier-${id}.pdf"`);
  headers.set('Cache-Control', 'private, max-age=300');
  return new Response(obj.body, { headers });
});

// ---------- pages ----------
clientPages.get('/login', (c) => {
  return c.html(clientLoginView());
});

clientPages.get('/', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.redirect('/client/login');
  }
  return c.html(clientPanelView());
});

export default clientApi;
