import { Hono } from 'hono';
import type { Env } from '../types/env';
import { dispatchIntelJob } from '../services/hermesAgent';
import { logger } from '../lib/logger';
import { authMiddleware, requireScope } from '../middleware/auth';
import { getTenantBalance, hasSufficientCredits, deductCredits } from '../services/credits';

export const intelligence = new Hono<{ Bindings: Env }>();

intelligence.use('*', authMiddleware);

function toInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function tenantId(c: any): string {
  return c.get('tenant').id;
}

// ── POST endpoints ────────────────────────────────────────────────────────────

intelligence.post('/entity-resolution', requireScope('intel:write'), async (c) => {
  let body: { entityName?: string; state?: string; customPrompt?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const tenant = c.get('tenant');
  const required = Number(c.env.CREDIT_COST_ENTITY_RESOLUTION || 5);
  if (!(await hasSufficientCredits(c.env.DB, tenant.id, required))) {
    const balance = await getTenantBalance(c.env.DB, tenant.id);
    return c.json({ ok: false, error: 'insufficient_credits', required, currentBalance: balance }, 402);
  }
  const ctx = { tenantId: tenant.id, env: c.env };
  try {
    const job = await dispatchIntelJob(ctx, {
      tenantId: tenant.id,
      taskType: 'entity_resolution',
      entityName: body.entityName,
      state: body.state,
      customPrompt: body.customPrompt,
    });
    await deductCredits(c.env.DB, tenant.id, required, 'entity_resolution', job.id);
    const newBalance = await getTenantBalance(c.env.DB, tenant.id);
    return c.json({ ok: true, job, creditBalance: newBalance });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Error entity resolution:', { error: msg });
    return c.json({ ok: false, error: msg }, 500);
  }
});

intelligence.post('/property-equity', requireScope('intel:write'), async (c) => {
  let body: { propertyAddress?: string; state?: string; customPrompt?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const tenant = c.get('tenant');
  const required = Number(c.env.CREDIT_COST_PROPERTY_EQUITY || 8);
  if (!(await hasSufficientCredits(c.env.DB, tenant.id, required))) {
    const balance = await getTenantBalance(c.env.DB, tenant.id);
    return c.json({ ok: false, error: 'insufficient_credits', required, currentBalance: balance }, 402);
  }
  const ctx = { tenantId: tenant.id, env: c.env };
  try {
    const job = await dispatchIntelJob(ctx, {
      tenantId: tenant.id,
      taskType: 'property_equity',
      propertyAddress: body.propertyAddress,
      state: body.state,
      customPrompt: body.customPrompt,
    });
    await deductCredits(c.env.DB, tenant.id, required, 'property_equity', job.id);
    const newBalance = await getTenantBalance(c.env.DB, tenant.id);
    return c.json({ ok: true, job, creditBalance: newBalance });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Error property equity:', { error: msg });
    return c.json({ ok: false, error: msg }, 500);
  }
});

intelligence.post('/sec-validation', requireScope('intel:write'), async (c) => {
  let body: { subjectName?: string; entityName?: string; customPrompt?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const tenant = c.get('tenant');
  const required = Number(c.env.CREDIT_COST_SEC_VALIDATION || 3);
  if (!(await hasSufficientCredits(c.env.DB, tenant.id, required))) {
    const balance = await getTenantBalance(c.env.DB, tenant.id);
    return c.json({ ok: false, error: 'insufficient_credits', required, currentBalance: balance }, 402);
  }
  const ctx = { tenantId: tenant.id, env: c.env };
  try {
    const job = await dispatchIntelJob(ctx, {
      tenantId: tenant.id,
      taskType: 'sec_validation',
      subjectName: body.subjectName,
      entityName: body.entityName,
      customPrompt: body.customPrompt,
    });
    await deductCredits(c.env.DB, tenant.id, required, 'sec_validation', job.id);
    const newBalance = await getTenantBalance(c.env.DB, tenant.id);
    return c.json({ ok: true, job, creditBalance: newBalance });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Error sec validation:', { error: msg });
    return c.json({ ok: false, error: msg }, 500);
  }
});

intelligence.post('/skip-trace', requireScope('intel:write'), async (c) => {
  let body: { subjectName?: string; customPrompt?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const tenant = c.get('tenant');
  const required = Number(c.env.CREDIT_COST_SKIP_TRACE || 10);
  if (!(await hasSufficientCredits(c.env.DB, tenant.id, required))) {
    const balance = await getTenantBalance(c.env.DB, tenant.id);
    return c.json({ ok: false, error: 'insufficient_credits', required, currentBalance: balance }, 402);
  }
  const ctx = { tenantId: tenant.id, env: c.env };
  try {
    const job = await dispatchIntelJob(ctx, {
      tenantId: tenant.id,
      taskType: 'skip_trace',
      subjectName: body.subjectName,
      customPrompt: body.customPrompt,
    });
    await deductCredits(c.env.DB, tenant.id, required, 'skip_trace', job.id);
    const newBalance = await getTenantBalance(c.env.DB, tenant.id);
    return c.json({ ok: true, job, creditBalance: newBalance });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Error skip trace:', { error: msg });
    return c.json({ ok: false, error: msg }, 500);
  }
});

// ── GET endpoints ─────────────────────────────────────────────────────────────

intelligence.get('/tenant/credits', requireScope('intel:read'), async (c) => {
  const tenant = c.get('tenant');
  const balance = await getTenantBalance(c.env.DB, tenant.id);
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM credit_transactions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10'
  )
    .bind(tenant.id)
    .all();
  return c.json({ ok: true, balance, transactions: results ?? [] });
});

intelligence.get('/entities', requireScope('intel:read'), async (c) => {
  const tenant = c.get('tenant');
  const limit = toInt(c.req.query('limit'), 20);
  const offset = Math.max(0, Number(c.req.query('offset') || 0));
  const search = c.req.query('search');
  const state = c.req.query('state');

  let sql = 'SELECT * FROM entity_lookups WHERE tenant_id = ?';
  const binds: (string | number)[] = [tenant.id];
  if (search) {
    sql += ' AND entity_name LIKE ?';
    binds.push(`%${search}%`);
  }
  if (state) {
    sql += ' AND state_of_formation = ?';
    binds.push(state);
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  binds.push(limit, offset);

  const { results } = await c.env.DB.prepare(sql).bind(...binds).all();
  return c.json({ ok: true, items: results ?? [], limit, offset });
});

intelligence.get('/entities/:id', requireScope('intel:read'), async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT * FROM entity_lookups WHERE tenant_id = ? AND id = ?')
    .bind(tenant.id, id)
    .first();
  if (!row) return c.json({ ok: false, error: 'not_found' }, 404);
  return c.json({ ok: true, item: row });
});

intelligence.get('/properties', requireScope('intel:read'), async (c) => {
  const tenant = c.get('tenant');
  const limit = toInt(c.req.query('limit'), 20);
  const offset = Math.max(0, Number(c.req.query('offset') || 0));
  const county = c.req.query('county');
  const state = c.req.query('state');
  const minEquity = c.req.query('minEquity');

  let sql = 'SELECT * FROM properties WHERE tenant_id = ?';
  const binds: (string | number)[] = [tenant.id];
  if (county) {
    sql += ' AND county = ?';
    binds.push(county);
  }
  if (state) {
    sql += ' AND state = ?';
    binds.push(state);
  }
  if (minEquity) {
    sql += ' AND equity_cents >= ?';
    binds.push(Number(minEquity));
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  binds.push(limit, offset);

  const { results } = await c.env.DB.prepare(sql).bind(...binds).all();
  return c.json({ ok: true, items: results ?? [], limit, offset });
});

intelligence.get('/investors', requireScope('intel:read'), async (c) => {
  const tenant = c.get('tenant');
  const limit = toInt(c.req.query('limit'), 20);
  const offset = Math.max(0, Number(c.req.query('offset') || 0));
  const investorType = c.req.query('investor_type');
  const secFormD = c.req.query('sec_form_d');

  let sql = 'SELECT * FROM investor_profiles WHERE tenant_id = ?';
  const binds: (string | number)[] = [tenant.id];
  if (investorType) {
    sql += ' AND investor_type = ?';
    binds.push(investorType);
  }
  if (secFormD !== undefined && secFormD !== '') {
    sql += ' AND sec_form_d = ?';
    binds.push(Number(secFormD));
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  binds.push(limit, offset);

  const { results } = await c.env.DB.prepare(sql).bind(...binds).all();
  return c.json({ ok: true, items: results ?? [], limit, offset });
});

intelligence.get('/skip-trace', requireScope('intel:read'), async (c) => {
  const tenant = c.get('tenant');
  const limit = toInt(c.req.query('limit'), 20);
  const offset = Math.max(0, Number(c.req.query('offset') || 0));
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM skip_trace_records WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
    .bind(tenant.id, limit, offset)
    .all();
  return c.json({ ok: true, items: results ?? [], limit, offset });
});

intelligence.get('/audit-logs', requireScope('intel:read'), async (c) => {
  const tenant = c.get('tenant');
  const limit = toInt(c.req.query('limit'), 20);
  const offset = Math.max(0, Number(c.req.query('offset') || 0));
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM audit_logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
    .bind(tenant.id, limit, offset)
    .all();
  return c.json({ ok: true, items: results ?? [], limit, offset });
});

intelligence.get('/health', (c) => c.json({ ok: true, service: 'hermes-us-intel' }));
