import { Hono } from 'hono';
import type { Env } from '../types/env';
import { hashPassword, verifyPassword } from '../lib/password';
import { signJwt, verifyJwt } from '../lib/jwt';
import { newId, nowIso } from '../services/db';
import { superadminLoginView } from '../views/superadmin';

export const superadminApi = new Hono<{ Bindings: Env }>();
export const superadminPages = new Hono<{ Bindings: Env }>();

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function getJwtSecret(env: any): string | null {
  if (!env) return null;
  const s = env.HERMES_JWT_SECRET || env.CRM_JWT_SECRET || env.JWT_SECRET;
  if (s && s.trim()) return s.trim();
  if ((env.ENVIRONMENT || 'development') === 'production') return null;
  return 'hermes-dev-only-jwt-secret';
}

function mapUser(row: any) {
  return {
    id: row.id,
    tenant_id: row.tenant_id ?? row.tenantId ?? row.tenant ?? null,
    email: row.email,
    name: row.name ?? row.full_name ?? null,
    role: row.role ?? 'super_admin',
    password_hash: row.password_hash ?? row.passwordHash ?? row.password ?? null,
    is_active: row.is_active ?? row.isActive ?? 1,
    failed_attempts: Number(row.failed_attempts ?? row.failedAttempts ?? 0),
    locked_until: row.locked_until ?? row.lockedUntil ?? null,
  };
}

async function findUserByEmail(db: any, email: string): Promise<{ row: any } | null> {
  try {
    const row = await db.prepare('SELECT * FROM super_admins WHERE email = ? LIMIT 1').bind(email).first();
    if (row) return { row };
  } catch {
    // table may not exist
  }
  return null;
}

async function findUserById(db: any, id: string): Promise<any | null> {
  try {
    const row = await db.prepare('SELECT * FROM super_admins WHERE id = ? LIMIT 1').bind(id).first();
    if (row) return row;
  } catch {
    // ignore
  }
  return null;
}

export async function getSessionSuperAdmin(c: any): Promise<any | null> {
  const secret = getJwtSecret(c.env);
  if (!secret) return null;
  const authHeader = c.req.header('authorization') || c.req.header('Authorization');
  let token: string | null = null;
  if (authHeader && /^Bearer\s+/i.test(authHeader)) token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    const cookie = c.req.header('cookie') || '';
    const m = cookie.match(/(?:^|;\s*)hermes_superadmin_token=([^;]+)/);
    if (m) token = decodeURIComponent(m[1]);
  }
  if (!token) return null;
  const payload = await verifyJwt(token, secret);
  if (!payload) return null;
  if (payload.role !== 'super_admin') return null;
  if (!payload.tenant_id) return null;
  return payload;
}

function requireSession(c: any) {
  return getSessionSuperAdmin(c);
}

// ---------- auth ----------
superadminApi.post('/login', async (c) => {
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

  const now = Date.now();
  let lockedUntilMs = user.locked_until ? Date.parse(user.locked_until) : NaN;
  if (Number.isFinite(lockedUntilMs) && lockedUntilMs > now) {
    return c.json({ ok: false, error: 'invalid_credentials' }, 401);
  }
  if (Number.isFinite(lockedUntilMs) && lockedUntilMs <= now) {
    try {
      await c.env.DB.prepare(`UPDATE super_admins SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`)
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
        await c.env.DB.prepare(`UPDATE super_admins SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?`)
          .bind(LOCKOUT_THRESHOLD, lockUntil, nowIso(), user.id)
          .run();
      } catch {
        // ignore
      }
    } else {
      try {
        await c.env.DB.prepare(`UPDATE super_admins SET failed_attempts = ?, updated_at = ? WHERE id = ?`)
          .bind(attempts, nowIso(), user.id)
          .run();
      } catch {
        // ignore
      }
    }
    return c.json({ ok: false, error: 'invalid_credentials' }, 401);
  }

  // success: reset
  try {
    await c.env.DB.prepare(`UPDATE super_admins SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`)
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
  c.header('Set-Cookie', `hermes_superadmin_token=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax${isProd ? '; Secure' : ''}`);

  return c.json({
    ok: true,
    token,
    access_token: token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, tenant_id: user.tenant_id },
  });
});

superadminApi.post('/logout', async (c) => {
  c.header('Set-Cookie', 'hermes_superadmin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return c.json({ ok: true });
});

superadminApi.get('/me', async (c) => {
  const session = await requireSession(c);
  if (!session) return c.json({ ok: false, error: 'unauthorized' }, 401);
  const user = await findUserById(c.env.DB, session.sub);
  const mapped = user ? mapUser(user) : null;
  return c.json({
    ok: true,
    user: mapped ? { id: mapped.id, email: mapped.email, name: mapped.name, role: mapped.role, tenant_id: mapped.tenant_id } : { id: session.sub, email: session.email, role: session.role, tenant_id: session.tenant_id },
    tenant_id: session.tenant_id,
  });
});

superadminApi.post('/change-password', async (c) => {
  const session = await requireSession(c);
  if (!session) return c.json({ ok: false, error: 'unauthorized' }, 401);
  let body: any = {};
  try { body = await c.req.json(); } catch { body = {}; }
  const currentPassword = String(body?.current_password ?? body?.currentPassword ?? '');
  const newPassword = String(body?.new_password ?? body?.newPassword ?? '');
  if (!currentPassword || !newPassword) {
    return c.json({ ok: false, error: 'current_password and new_password are required' }, 400);
  }
  if (newPassword.length < 8) {
    return c.json({ ok: false, error: 'password too short' }, 400);
  }
  const user = await findUserById(c.env.DB, session.sub);
  if (!user) return c.json({ ok: false, error: 'unauthorized' }, 401);
  const mapped = mapUser(user);
  if (!mapped.password_hash || !(await verifyPassword(currentPassword, mapped.password_hash))) {
    return c.json({ ok: false, error: 'invalid_credentials' }, 401);
  }
  const hash = await hashPassword(newPassword);
  try {
    await c.env.DB.prepare(`UPDATE super_admins SET password_hash = ?, failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`)
      .bind(hash, nowIso(), mapped.id)
      .run();
  } catch {
    return c.json({ ok: false, error: 'update_failed' }, 500);
  }
  return c.json({ ok: true });
});

// ---------- pages ----------
superadminPages.get('/login', (c) => {
  return c.html(superadminLoginView());
});

superadminPages.get('/', async (c) => {
  const session = await getSessionSuperAdmin(c);
  if (!session) {
    return c.redirect('/superadmin/login');
  }
  return c.redirect('/dashboard');
});

export default superadminApi;
