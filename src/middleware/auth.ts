import { createMiddleware } from 'hono/factory';
import type { Env } from '../types/env';
import type { Tenant, ApiKey, IntelScope } from '../types/auth';
import { hashApiKey } from '../lib/crypto';

export const authMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const authHeader = c.req.header('authorization');
  const apiKeyHeader = c.req.header('x-api-key');

  let token: string | undefined;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (apiKeyHeader) {
    token = apiKeyHeader.trim();
  }

  if (!token) {
    return c.json({ ok: false, error: 'unauthorized', message: 'Missing or invalid API key' }, 401);
  }

  const hash = await hashApiKey(token);

  const row = await c.env.DB.prepare(
    `SELECT ak.id AS key_id, ak.tenant_id, ak.key_prefix, ak.key_hash, ak.scopes_json, ak.expires_at, ak.revoked_at,
            t.id AS tenant_id, t.name AS tenant_name, t.plan, t.credit_balance, t.is_active
     FROM api_keys ak
     JOIN tenants t ON t.id = ak.tenant_id
     WHERE ak.key_hash = ?`
  )
    .bind(hash)
    .first<{
      key_id: string;
      tenant_id: string;
      key_prefix: string;
      key_hash: string;
      scopes_json: string;
      expires_at: string | null;
      revoked_at: string | null;
      tenant_name: string;
      plan: 'starter' | 'pro' | 'enterprise';
      credit_balance: number;
      is_active: number;
    }>();

  if (!row) {
    return c.json({ ok: false, error: 'unauthorized', message: 'Missing or invalid API key' }, 401);
  }
  if (row.revoked_at) {
    return c.json({ ok: false, error: 'unauthorized', message: 'Missing or invalid API key' }, 401);
  }
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return c.json({ ok: false, error: 'unauthorized', message: 'Missing or invalid API key' }, 401);
  }
  if (!row.is_active) {
    return c.json({ ok: false, error: 'unauthorized', message: 'Missing or invalid API key' }, 401);
  }

  let scopes: IntelScope[] = [];
  try {
    scopes = JSON.parse(row.scopes_json) as IntelScope[];
  } catch {
    scopes = [];
  }

  const apiKey: ApiKey = {
    id: row.key_id,
    tenant_id: row.tenant_id,
    key_prefix: row.key_prefix,
    key_hash: row.key_hash,
    scopes_json: row.scopes_json,
    scopes,
    expires_at: row.expires_at,
    revoked_at: row.revoked_at,
  };

  const tenant: Tenant = {
    id: row.tenant_id,
    name: row.tenant_name,
    plan: row.plan,
    credit_balance: row.credit_balance,
    is_active: row.is_active,
  };

  c.set('tenant', tenant);
  c.set('apiKey', apiKey);
  c.set('auth', { tenant, apiKey });

  await next();
});

export function requireScope(scope: IntelScope) {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const apiKey = c.get('apiKey');
    if (!apiKey || (!apiKey.scopes.includes(scope) && !apiKey.scopes.includes('admin'))) {
      return c.json({ ok: false, error: 'forbidden', message: 'Insufficient scope' }, 403);
    }
    await next();
  });
}
