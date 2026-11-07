import { Hono } from 'hono';
import type { Env } from '../types/env';
import { hashPassword, verifyPassword } from '../lib/password';
import { signJwt, verifyJwt } from '../lib/jwt';
import { newId, nowIso } from '../services/db';

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

function mapUser(row: any) {
  return {
    id: row.id,
    tenant_id: row.tenant_id ?? row.tenantId ?? row.tenant ?? null,
    email: row.email,
    name: row.name ?? row.full_name ?? null,
    role: row.role ?? 'client',
    password_hash: row.password_hash ?? row.passwordHash ?? row.password ?? null,
    is_active: row.is_active ?? row.isActive ?? 1,
  };
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
    return c.json({ ok: false, error: 'invalid_credentials' }, 401);
  }
  const user = mapUser(found.row);
  if (!user.is_active) {
    return c.json({ ok: false, error: 'invalid_credentials' }, 401);
  }
  if (!user.password_hash || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ ok: false, error: 'invalid_credentials' }, 401);
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
  try {
    const row = await c.env.DB.prepare('SELECT credit_balance FROM tenants WHERE id = ?').bind(session.tenant_id).first<{ credit_balance: number }>();
    credits = row?.credit_balance ?? 0;
  } catch {
    credits = 0;
  }
  return c.json({
    ok: true,
    user: mapped ? { id: mapped.id, email: mapped.email, name: mapped.name, role: mapped.role, tenant_id: mapped.tenant_id } : { id: session.sub, email: session.email, role: session.role, tenant_id: session.tenant_id },
    tenant_id: session.tenant_id,
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

  const candidateTables = ['investor_profiles', 'leads', 'harvested_leads', 'entity_lookups'];
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
    name: row.full_name ?? row.name ?? row.primary_contact_name ?? row.subject_name ?? row.entity_name ?? null,
    company: row.entity_name ?? row.company ?? row.entityOrFundName ?? null,
    type: row.type ?? row.lead_type ?? row.source ?? (row.sec_form_d ? 'SEC Form D' : (row.investor_type ?? 'lead')),
    status: row.status ?? 'new',
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
  return c.html(`<!doctype html><html><head><title>Futura Capital Login</title></head><body>
  <h1>Futura Capital</h1>
  <form id="f">
    <input id="email" type="email" placeholder="email" />
    <input id="password" type="password" placeholder="password" />
    <button type="submit">Login</button>
  </form>
  <div id="msg"></div>
  <script>
  document.getElementById('f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('/api/client/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: document.getElementById('email').value, password: document.getElementById('password').value }) });
    const data = await res.json();
    if (res.ok) { window.location.href = '/client'; } else { document.getElementById('msg').textContent = data.error || 'login failed'; }
  });
  </script>
  </body></html>`);
});

clientPages.get('/', async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.redirect('/client/login');
  }
  return c.html(`<!doctype html><html><head><title>Futura Capital Panel</title></head><body>
  <h1>Panel Futura Capital</h1>
  <div id="credits"></div>
  <h2>Leads</h2><div id="leads"></div>
  <h2>Dossiers</h2><div id="reports"></div>
  <button onclick="fetch('/api/client/logout',{method:'POST'}).then(()=>location.href='/client/login')">Logout</button>
  <script>
  async function load() {
    const me = await fetch('/api/client/me').then(r=>r.json());
    document.getElementById('credits').textContent = 'Creditos: ' + (me.credits_remaining ?? me.credits ?? 0);
    const leads = await fetch('/api/client/leads').then(r=>r.json());
    document.getElementById('leads').textContent = JSON.stringify(leads.leads || leads.items || []);
    const reps = await fetch('/api/client/reports').then(r=>r.json());
    const div = document.getElementById('reports');
    div.innerHTML = '';
    (reps.reports || reps.items || []).forEach(r => {
      const a = document.createElement('a');
      a.href = '/api/client/reports/' + r.id + '/download';
      a.textContent = r.subject || r.id;
      div.appendChild(a);
      div.appendChild(document.createElement('br'));
    });
  }
  load();
  </script>
  </body></html>`);
});

export default clientApi;
