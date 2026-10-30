import { Hono } from 'hono';
import type { Env } from '../types/env';
import { dispatchIntelJob } from '../services/hermesAgent';
import { logger } from '../lib/logger';
import { authMiddleware, requireScope } from '../middleware/auth';
import { getTenantBalance, hasSufficientCredits, deductCredits } from '../services/credits';
import { resolveSOSEntity } from '../services/sos';
import type { USStateCode } from '../services/sos/types';
import { generateExecutiveDossier } from '../services/reports';
import { getReportPdfFromR2 } from '../services/reports/storage';
import { syncLeadToCrm, normalizeLead } from '../services/crm';
import type { NormalizedLead, CrmSyncConfig } from '../services/crm/types';
import { harvestLeads } from '../services/harvester';
import type { HarvestParams } from '../services/harvester/types';
import { newId } from '../services/db';

export const intelligence = new Hono<{ Bindings: Env }>();

intelligence.use('*', authMiddleware);

function normalizeLeadFromJob(payload: Record<string, unknown>, taskType?: string): NormalizedLead {
  const base: NormalizedLead = {
    fullName: String(payload.subjectName || payload.entityName || payload.fullName || 'Unknown'),
    source: 'VEKTOR Intelligence',
  };
  if (payload.email) base.email = String(payload.email);
  if (payload.phone) base.phone = String(payload.phone);
  if (payload.lineType) base.lineType = payload.lineType as NormalizedLead['lineType'];
  if (payload.dncStatus) base.dncStatus = payload.dncStatus as NormalizedLead['dncStatus'];
  if (payload.propertyAddress) base.propertyAddress = String(payload.propertyAddress);
  if (payload.county) base.county = String(payload.county);
  if (payload.state) base.state = String(payload.state);
  if (payload.marketValueCents) base.marketValueDollars = Number(payload.marketValueCents) / 100;
  if (payload.equityCents) base.equityDollars = Number(payload.equityCents) / 100;
  if (payload.equityPercent) base.equityPercent = Number(payload.equityPercent);
  if (payload.investorType) base.investorType = payload.investorType as NormalizedLead['investorType'];
  if (payload.uboName) base.uboName = String(payload.uboName);
  return base;
}

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

intelligence.get('/sos/resolve', requireScope('intel:read'), async (c) => {
  const entityName = c.req.query('entityName');
  const state = c.req.query('state') as USStateCode;
  if (!entityName || !state) {
    return c.json({ ok: false, error: 'missing_params', message: 'entityName and state are required' }, 400);
  }
  try {
    const result = await resolveSOSEntity(c.env, { entityName, state, tenantId: c.get('tenant').id });
    return c.json({ ok: true, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Error SOS resolve:', { error: msg });
    return c.json({ ok: false, error: msg }, 500);
  }
});

intelligence.post('/reports/generate', requireScope('intel:read'), async (c) => {
  let body: { jobId?: string; subjectName?: string; propertyAddress?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const tenant = c.get('tenant');
  try {
    const { reportId } = await generateExecutiveDossier(c.env, {
      tenantId: tenant.id,
      jobId: body.jobId,
      subjectName: body.subjectName,
      propertyAddress: body.propertyAddress,
    });
    return c.json({ ok: true, reportId, downloadUrl: `/api/v1/intelligence/reports/${reportId}/download` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Error generate report:', { error: msg });
    return c.json({ ok: false, error: msg }, 500);
  }
});

intelligence.get('/reports/:reportId/download', requireScope('intel:read'), async (c) => {
  const tenant = c.get('tenant');
  const reportId = c.req.param('reportId');
  const obj = await getReportPdfFromR2(c.env, tenant.id, reportId);
  if (!obj) return c.json({ ok: false, error: 'not_found' }, 404);
  const headers = new Headers();
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', `inline; filename="Hermes-Dossier-${reportId}.pdf"`);
  headers.set('Cache-Control', 'private, max-age=3600');
  return new Response(obj.body, { headers });
});

intelligence.post('/crm/sync', requireScope('intel:write'), async (c) => {
  let body: { lead?: NormalizedLead; config?: CrmSyncConfig; jobId?: string; provider?: string; event?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const tenant = c.get('tenant');
  const ctx = { tenantId: tenant.id, env: c.env };

  let lead: NormalizedLead | null = body.lead ? normalizeLead(body.lead) : null;

  if (!lead && body.jobId) {
    try {
      const obj = await c.env.R2?.get(`snapshots/${tenant.id}/${body.jobId}.json`);
      if (obj) {
        const snap = JSON.parse(await obj.text());
        const payload = (snap.resultPayload || snap.payload || {}) as Record<string, unknown>;
        lead = normalizeLeadFromJob(payload, snap.taskType);
      }
    } catch {
      lead = null;
    }
  }

  if (!lead) {
    return c.json({ ok: false, error: 'missing_lead', message: 'lead or jobId is required' }, 400);
  }

  let config: CrmSyncConfig | undefined = body.config;
  if (!config && body.provider) {
    config = { provider: body.provider as CrmSyncConfig['provider'], isActive: true };
  }

  try {
    const results = await syncLeadToCrm(ctx, lead, config);
    return c.json({ ok: true, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Error CRM sync:', { error: msg });
    return c.json({ ok: false, error: msg }, 500);
  }
});

intelligence.post('/harvest', requireScope('intel:write'), async (c) => {
  let body: HarvestParams = { source: 'sec_form_d' };
  try {
    body = await c.req.json();
  } catch {
    body = { source: 'sec_form_d' };
  }
  const tenant = c.get('tenant');
  const ctx = { tenantId: tenant.id, env: c.env };
  const limit = body.limit || 10;
  const required = limit * 10;
  if (!(await hasSufficientCredits(c.env.DB, tenant.id, required))) {
    const balance = await getTenantBalance(c.env.DB, tenant.id);
    return c.json({ ok: false, error: 'insufficient_credits', required, currentBalance: balance }, 402);
  }
  try {
    const batch = await harvestLeads(ctx, body);
    return c.json({ ok: true, batch });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Error harvest:', { error: msg });
    return c.json({ ok: false, error: msg }, 500);
  }
});

intelligence.get('/harvest/schedules', requireScope('intel:read'), async (c) => {
  const tenant = c.get('tenant');
  const { results } = await c.env.DB.prepare('SELECT * FROM harvest_schedules WHERE tenant_id = ? ORDER BY created_at DESC').bind(tenant.id).all();
  return c.json({ ok: true, schedules: results ?? [] });
});

intelligence.post('/harvest/schedules', requireScope('intel:write'), async (c) => {
  let body: any = {};
  try { body = await c.req.json(); } catch { body = {}; }
  const tenant = c.get('tenant');
  const id = newId('sched');
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `INSERT INTO harvest_schedules (id, tenant_id, name, cron_expression, source, jurisdiction, state, min_amount_dollars, limit_per_run, auto_sync_crm, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    tenant.id,
    body.name || 'Scheduled Harvest',
    body.cron_expression || '0 12 * * 1',
    body.source || 'sec_form_d',
    body.jurisdiction || 'US',
    body.state || null,
    body.min_amount_dollars ?? 1500000,
    body.limit_per_run ?? 10,
    body.auto_sync_crm === false ? 0 : 1,
    body.is_active === false ? 0 : 1,
    now,
    now
  ).run();
  return c.json({ ok: true, schedule: { id, tenant_id: tenant.id, name: body.name || 'Scheduled Harvest' } });
});

intelligence.post('/harvest/schedules/:id/run', requireScope('intel:write'), async (c) => {
  const tenant = c.get('tenant');
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT * FROM harvest_schedules WHERE id = ? AND tenant_id = ?').bind(id, tenant.id).first();
  if (!row) return c.json({ ok: false, error: 'not_found' }, 404);
  const schedule: any = row;
  const ctx = { tenantId: tenant.id, env: c.env };
  const params: any = {
    source: schedule.source,
    limit: Number(schedule.limit_per_run) || 10,
    jurisdiction: schedule.jurisdiction === 'MX' ? 'MX' : 'US',
    minAmountDollars: schedule.min_amount_dollars ? Number(schedule.min_amount_dollars) : undefined,
    autoEnrich: true,
  };
  if (schedule.jurisdiction === 'MX') params.entidadFederativa = schedule.state;
  else params.state = schedule.state || undefined;

  const batch = await harvestLeads(ctx, params);

  if (schedule.auto_sync_crm === 1 && batch.leads.length > 0) {
    try {
      const crmRes = await c.env.DB.prepare('SELECT * FROM crm_integrations WHERE tenant_id = ? AND is_active = 1').bind(tenant.id).all();
      const configs: CrmSyncConfig[] = (crmRes.results ?? []).map((r: any) => ({
        provider: String(r.provider) as CrmSyncConfig['provider'],
        endpointUrl: r.endpoint_url ? String(r.endpoint_url) : r.endpointUrl ? String(r.endpointUrl) : undefined,
        apiKey: r.api_key ? String(r.api_key) : r.apiKey ? String(r.apiKey) : undefined,
        secret: r.secret ? String(r.secret) : undefined,
        isActive: true,
      }));
      if (configs.length > 0) {
        for (const lead of batch.leads) {
          const normalized: NormalizedLead = {
            fullName: lead.primaryContactName || lead.entityOrFundName,
            email: lead.email,
            phone: lead.phone,
            lineType: (lead.lineType === 'mobile' || lead.lineType === 'landline' || lead.lineType === 'voip') ? lead.lineType : 'unknown',
            dncStatus: lead.dncStatus === 'clean' ? 'clean' : 'flagged',
            state: lead.jurisdiction,
            investorType: lead.accreditationBadge === 'Qualified Purchaser' ? 'qualified_purchaser' : 'accredited',
            uboName: lead.entityOrFundName,
            source: 'VEKTOR Harvester',
          };
          await syncLeadToCrm(ctx, normalized, configs);
        }
      }
    } catch {
      // ignore
    }
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare('UPDATE harvest_schedules SET last_run_at = ?, last_status = ? WHERE id = ?').bind(now, 'success', id).run();

  return c.json({ ok: true, batch });
});

intelligence.post('/crm/integrations', requireScope('intel:write'), async (c) => {
  let body: any = {};
  try { body = await c.req.json(); } catch { body = {}; }
  const tenant = c.get('tenant');
  const id = newId('crm');
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `INSERT INTO crm_integrations (id, tenant_id, provider, endpoint_url, api_key, secret, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    tenant.id,
    body.provider || 'webhook',
    body.endpointUrl || body.endpoint_url || null,
    body.apiKey || body.api_key || null,
    body.secret || null,
    body.isActive === false ? 0 : 1,
    now,
    now
  ).run();
  return c.json({ ok: true, integration: { id, provider: body.provider || 'webhook' } });
});

intelligence.get('/health', (c) => c.json({ ok: true, service: 'hermes-us-intel' }));
