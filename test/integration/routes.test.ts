import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/index';
import { createMockDb } from '../helpers/mockDb';
import { hashApiKey } from '../../src/lib/crypto';

describe('routes', () => {
  let env: any;
  let devToken = 'hermes_dev_secret_key_2026';

  beforeAll(async () => {
    const devHash = await hashApiKey(devToken);
    const db = createMockDb({
      tenants: [{ id: 'default', name: 'Default Workspace', plan: 'starter', credit_balance: 1000, is_active: 1 }],
      apiKeys: [{ id: 'key_dev', tenant_id: 'default', key_prefix: 'hermes_d', key_hash: devHash, scopes_json: '["intel:read","intel:write","admin"]' }],
    });
    env = { ENVIRONMENT: 'test', DB: db, R2: undefined, AI: undefined } as any;
  });

  it('GET /health -> 200 ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, service: 'hermes-us-proptech' });
  });

  it('GET /assets/vektor/favicon.svg -> 200 image/svg+xml', async () => {
    const res = await app.request('/assets/vektor/favicon.svg');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/svg+xml');
  });

  it('GET /assets/vektor/archivo-inexistente.svg -> 404', async () => {
    const res = await app.request('/assets/vektor/archivo-inexistente.svg');
    expect(res.status).toBe(404);
  });

  it('GET / -> 200 landing contains VEKTOR', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('VEKTOR');
  });

  it('GET /dashboard -> 302 redirect to superadmin login', async () => {
    const res = await app.request('/dashboard');
    expect([301,302,303,307,308]).toContain(res.status);
    expect(res.headers.get('location')).toContain('/superadmin/login');
  });

  it('GET /dashboard/launchpad -> 302 redirect', async () => {
    const res = await app.request('/dashboard/launchpad');
    expect([301,302,303,307,308]).toContain(res.status);
  });

  it('GET /dashboard/explorer -> 302 redirect', async () => {
    const res = await app.request('/dashboard/explorer');
    expect([301,302,303,307,308]).toContain(res.status);
  });

  it('POST entity-resolution without auth -> 401', async () => {
    const res = await app.request('/api/v1/intelligence/entity-resolution', { method: 'POST' }, env);
    expect(res.status).toBe(401);
  });

  it('POST entity-resolution invalid token -> 401', async () => {
    const res = await app.request('/api/v1/intelligence/entity-resolution', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid_token_xyz' },
    }, env);
    expect(res.status).toBe(401);
  });

  it('POST entity-resolution with dev key -> 200', async () => {
    const res = await app.request('/api/v1/intelligence/entity-resolution', {
      method: 'POST',
      headers: { Authorization: `Bearer ${devToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityName: 'Acme LLC', state: 'DE' }),
    }, env);
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.ok).toBe(true);
  });
});