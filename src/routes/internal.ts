import { Hono } from 'hono';
import type { Env } from '../types/env';
import { newId, nowIso } from '../services/db';
import { generateExecutiveDossier } from '../services/reports';
import { getTenantBalance, hasSufficientCredits, deductCredits } from '../services/credits';
import { runLeadHarvest } from '../services/harvester/leadHarvester';

export const internal = new Hono<{ Bindings: Env }>();

function clampLimit(raw: string | undefined, fallback = 50): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(1, Math.floor(n)));
}

async function recordAudit(c: any, statusCode: number, result: string): Promise<void> {
  try {
    const db = c.env?.DB;
    if (!db) return;
    const id = `ia_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db
      .prepare(
        `INSERT INTO internal_audit_log (id, actor, endpoint, method, result, status_code, ip, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        'staypuft',
        c.req.path,
        c.req.method,
        result,
        statusCode,
        c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null,
        new Date().toISOString()
      )
      .run();
  } catch {
  }
}

internal.use('*', async (c, next) => {
  const expected = c.env?.HERMES_STAYPUFT_API_KEY || c.env?.STAYPUFT_API_KEY;
  const provided = c.req.header('x-staypuft-key');
  if (!expected || !provided || provided !== expected) {
    await recordAudit(c, 401, 'unauthorized');
    return c.json({ ok: false, error: 'unauthorized' }, 401);
  }
  await next();
  await recordAudit(c, (c.res && c.res.status) || 200, 'ok');
});

function normalizeReport(row: any) {
  const tenantId = row?.tenant_id ?? row?.tenantId ?? null;
  const type = row?.type ?? row?.report_type ?? row?.tipo ?? 'dossier';
  const subject = row?.subject ?? row?.sujeto ?? row?.subject_name ?? row?.title ?? row?.entity_name ?? null;
  const status = row?.status ?? 'completed';
  const createdAt = row?.created_at ?? row?.createdAt ?? null;
  const creditsUsed = row?.credits_used ?? row?.creditsUsed ?? row?.credit_cost ?? 0;
  const pdfUrl =
    row?.pdf_url ?? row?.pdfUrl ?? row?.pdf_key ?? row?.r2_key ?? row?.key ??
    (row?.id ? `/api/v1/intelligence/reports/${row.id}/download` : null);
  return {
    id: row?.id,
    tenant_id: tenantId,
    tenantId,
    type,
    tipo: type,
    subject,
    sujeto: subject,
    status,
    created_at: createdAt,
    createdAt,
    credits_used: creditsUsed,
    creditsUsed,
    pdf_url: pdfUrl,
    pdfUrl,
    pdf_key: row?.pdf_key ?? row?.pdf_url ?? null,
  };
}

internal.get('/status', async (c) => {
  const db = c.env.DB;
  let tenantCount = 0;
  let totalCredits = 0;
  let d1Ok = false;
  try {
    const row = await db
      .prepare('SELECT COUNT(*) AS cnt, COALESCE(SUM(credit_balance), 0) AS credits FROM tenants')
      .first<{ cnt: number; credits: number }>();
    tenantCount = row?.cnt ?? 0;
    totalCredits = row?.credits ?? 0;
    d1Ok = true;
  } catch {
    d1Ok = false;
  }

  const r2Ok = !!c.env.R2;
  const aiOk = !!c.env.AI;
  const doOk = !!c.env.HERMES_SANDBOX;

  let lastHarvest: any = null;
  try {
    lastHarvest = await db
      .prepare('SELECT id, last_run_at, last_status FROM harvest_schedules ORDER BY last_run_at DESC LIMIT 1')
      .first();
  } catch {
    lastHarvest = null;
  }

  let lastDossier: any = null;
  try {
    const row = await db
      .prepare('SELECT id, tenant_id, type, subject, status, created_at FROM reports ORDER BY created_at DESC LIMIT 1')
      .first();
    lastDossier = row ? normalizeReport(row) : null;
  } catch {
    lastDossier = null;
  }

  return c.json({
    ok: true,
    service: 'hermes-us-intel',
    environment: c.env.ENVIRONMENT,
    bindings: { d1: d1Ok, r2: r2Ok, ai: aiOk, durableObjects: doOk },
    d1: d1Ok,
    r2: r2Ok,
    ai: aiOk,
    do: doOk,
    durableObjects: doOk,
    tenantCount,
    tenants: tenantCount,
    tenant_count: tenantCount,
    credits: totalCredits,
    totalCredits,
    creditBalance: totalCredits,
    lastHarvest,
    last_harvest: lastHarvest,
    lastDossier,
    last_dossier: lastDossier,
    lastReport: lastDossier,
  });
});

internal.get('/reports', async (c) => {
  const db = c.env.DB;
  const tenantId = c.req.query('tenant_id') || c.req.query('tenantId');
  const limit = clampLimit(c.req.query('limit'));
  let rows: any[] = [];
  try {
    let sql = 'SELECT * FROM reports';
    const binds: any[] = [];
    if (tenantId) {
      sql += ' WHERE tenant_id = ?';
      binds.push(tenantId);
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    binds.push(limit);
    const stmt = db.prepare(sql);
    const res =
      binds.length === 2
        ? await stmt.bind(binds[0], binds[1]).all()
        : await stmt.bind(binds[0]).all();
    rows = res?.results ?? [];
  } catch {
    rows = [];
  }
  const reports = rows.map(normalizeReport);
  return c.json({
    ok: true,
    reports,
    items: reports,
    data: reports,
    count: reports.length,
    total: reports.length,
    limit,
  });
});

internal.get('/reports/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const tenantId = c.req.query('tenant_id') || c.req.query('tenantId');
  let row: any = null;
  try {
    let sql = 'SELECT * FROM reports WHERE id = ?';
    const binds: any[] = [id];
    if (tenantId) {
      sql += ' AND tenant_id = ?';
      binds.push(tenantId);
    }
    const stmt = db.prepare(sql);
    row = binds.length === 2 ? await stmt.bind(binds[0], binds[1]).first() : await stmt.bind(binds[0]).first();
  } catch {
    row = null;
  }
  if (!row) {
    return c.json({ ok: false, error: 'not_found' }, 404);
  }
  const report = normalizeReport(row);
  const summary =
    row.executive_summary ?? row.summary ?? row.resumen ?? row.resumen_ejecutivo ?? row.executiveSummary ?? null;
  const findingsRaw = row.findings ?? row.hallazgos ?? row.findings_json ?? row.result ?? null;
  let findings = findingsRaw;
  if (typeof findingsRaw === 'string') {
    try {
      findings = JSON.parse(findingsRaw);
    } catch {
      findings = findingsRaw;
    }
  }
  return c.json({
    ok: true,
    report,
    item: report,
    summary,
    executiveSummary: summary,
    resumen: summary,
    resumen_ejecutivo: summary,
    findings,
    hallazgos: findings,
  });
});

internal.get('/tenants', async (c) => {
  const db = c.env.DB;
  let rows: any[] = [];
  try {
    const res = await db
      .prepare('SELECT id, name, credit_balance, plan, is_active FROM tenants ORDER BY name ASC LIMIT 100')
      .all();
    rows = res?.results ?? [];
  } catch {
    rows = [];
  }
  const tenants = rows.map((r) => ({
    id: r.id,
    name: r.name,
    nombre: r.name,
    credits: r.credit_balance,
    credit_balance: r.credit_balance,
    credits_remaining: r.credit_balance,
    plan: r.plan,
    is_active: r.is_active,
  }));
  return c.json({ ok: true, tenants, items: tenants, data: tenants, count: tenants.length });
});

internal.get('/metrics', async (c) => {
  const db = c.env.DB;
  let dossiersGenerated = 0;
  let harvests = 0;
  let creditsConsumed = 0;
  let recentErrors: any[] = [];
  try {
    const row = await db.prepare('SELECT COUNT(*) AS cnt FROM reports').first<{ cnt: number }>();
    dossiersGenerated = row?.cnt ?? 0;
  } catch {
    dossiersGenerated = 0;
  }
  try {
    const row = await db.prepare('SELECT COUNT(*) AS cnt FROM harvest_schedules').first<{ cnt: number }>();
    harvests = row?.cnt ?? 0;
  } catch {
    harvests = 0;
  }
  try {
    const row = await db.prepare('SELECT COUNT(*) AS cnt FROM harvest_runs').first<{ cnt: number }>();
    if (typeof row?.cnt === 'number') harvests = row.cnt;
  } catch {
  }
  try {
    const row = await db
      .prepare('SELECT COALESCE(SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END), 0) AS total FROM credit_transactions')
      .first<{ total: number }>();
    creditsConsumed = row?.total ?? 0;
  } catch {
    creditsConsumed = 0;
  }
  try {
    const res = await db
      .prepare("SELECT id, tenant_id, type, subject, status, created_at FROM reports WHERE status IN ('failed','error') ORDER BY created_at DESC LIMIT 10")
      .all();
    recentErrors = res?.results ?? [];
  } catch {
    recentErrors = [];
  }
  return c.json({
    ok: true,
    dossiersGenerated,
    dossiers_generated: dossiersGenerated,
    reportsGenerated: dossiersGenerated,
    harvests,
    totalHarvests: harvests,
    creditsConsumed,
    credits_consumed: creditsConsumed,
    totalCreditsConsumed: creditsConsumed,
    recentErrors,
    recent_errors: recentErrors,
    errors: recentErrors,
  });
});

import { hashPassword } from '../lib/password';

internal.post('/users', async (c) => {
  let body: any = {};
  try { body = await c.req.json(); } catch { body = {}; }
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  const name = body?.name ?? null;
  const tenantId = String(body?.tenant_id ?? body?.tenantId ?? '').trim();
  const role = String(body?.role ?? 'client').trim() || 'client';
  if (!email || !password || !tenantId) {
    return c.json({ ok: false, error: 'email, password and tenant_id are required' }, 400);
  }
  if (password.length < 8) {
    return c.json({ ok: false, error: 'password too short' }, 400);
  }

  const hash = await hashPassword(password);
  const id = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const table = role === 'super_admin' ? 'super_admins' : 'client_users';
  try {
    await c.env.DB.prepare(
      `INSERT INTO ${table} (id, tenant_id, email, password_hash, name, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
    )
      .bind(id, tenantId, email, hash, name, role, new Date().toISOString(), new Date().toISOString())
      .run();
  } catch (err: any) {
    return c.json({ ok: false, error: err?.message || 'create_failed' }, 400);
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO internal_audit_log (id, actor, endpoint, method, result, status_code, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(`ia_${Date.now().toString(36)}`, 'staypuft', '/api/internal/users', 'POST', 'user_created', 201, c.req.header('cf-connecting-ip') || null, new Date().toISOString())
      .run();
  } catch {
    // ignore
  }

  return c.json({ ok: true, user: { id, email, name, role, tenant_id: tenantId } }, 201);
});
const ALLOWED_SUBJECT_TYPES = new Set(['entity', 'property', 'investor']);
const ALLOWED_STATES = new Set(['TX', 'FL', 'WY', 'DE', 'NV']);
const TASK_COSTS: Record<string, number> = {
  entity_resolution: 5,
  property_equity: 8,
  sec_validation: 3,
  skip_trace: 10,
};
const ALL_TASKS = ['entity_resolution', 'property_equity', 'sec_validation', 'skip_trace'];

internal.post('/reports/generate', async (c) => {
  let body: any = {};
  try { body = await c.req.json(); } catch { body = {}; }

  const tenantId = String(body?.tenant_id ?? body?.tenantId ?? '').trim();
  const subject = String(body?.subject ?? '').trim();
  const subjectType = body?.subject_type ?? body?.subjectType ?? null;
  const state = body?.state ?? null;
  const tasksRaw = Array.isArray(body?.tasks) ? body.tasks : ALL_TASKS;
  const tasks = tasksRaw.map((t: any) => String(t).trim()).filter(Boolean);
  const dryRun = body?.dry_run === true || body?.dryRun === true;

  if (!tenantId) {
    return c.json({ ok: false, error: 'tenant_id is required' }, 400);
  }
  if (!subject) {
    return c.json({ ok: false, error: 'subject is required' }, 400);
  }
  if (subjectType !== null && subjectType !== undefined && !ALLOWED_SUBJECT_TYPES.has(String(subjectType))) {
    return c.json({ ok: false, error: 'invalid_subject_type' }, 400);
  }
  if (state !== null && state !== undefined && state !== 'null' && !ALLOWED_STATES.has(String(state))) {
    return c.json({ ok: false, error: 'invalid_state' }, 400);
  }
  if (tasks.length === 0 || tasks.some((t: string) => !TASK_COSTS[t])) {
    return c.json({ ok: false, error: 'invalid_tasks' }, 400);
  }

  const db = c.env.DB;
  let tenant: any = null;
  try {
    const res = await db.prepare('SELECT id, name, credit_balance, plan, is_active FROM tenants WHERE id = ?').bind(tenantId).first();
    tenant = res;
  } catch {
    const all = await db.prepare('SELECT id, name, credit_balance, plan, is_active FROM tenants').all();
    tenant = (all?.results ?? []).find((t: any) => t.id === tenantId) || null;
  }
  if (!tenant || tenant.is_active !== 1 && tenant.is_active !== true) {
    return c.json({ ok: false, error: 'tenant_not_found_or_inactive' }, 400);
  }

  const cost = tasks.reduce((sum: number, t: string) => sum + (TASK_COSTS[t] || 0), 0);

  // duplicate check: recent report for same tenant+subject within 1 hour
  let duplicate: any = null;
  try {
    const res = await db.prepare(
      `SELECT * FROM reports WHERE tenant_id = ? AND subject = ? ORDER BY created_at DESC LIMIT 1`
    ).bind(tenantId, subject).first();
    duplicate = res || null;
  } catch {
    duplicate = null;
  }
  if (duplicate) {
    const created = Date.parse(duplicate.created_at);
    const recent = Number.isFinite(created) && (Date.now() - created) < 60 * 60 * 1000;
    if (recent) {
      return c.json({
        ok: true,
        duplicate: true,
        reportId: duplicate.id,
        jobId: duplicate.id,
        status: duplicate.status ?? 'completed',
        tenant_id: tenantId,
        credits_used: 0,
        credits_remaining: tenant.credit_balance,
        pdf_url: `/api/internal/reports/${duplicate.id}/download`,
      });
    }
  }

  // rate limit: max 5 generations per hour per tenant
  let recentCount = 0;
  try {
    const res = await db.prepare(
      `SELECT COUNT(*) AS cnt FROM reports WHERE tenant_id = ? AND created_at >= ?`
    ).bind(tenantId, new Date(Date.now() - 60 * 60 * 1000).toISOString()).first<{ cnt: number }>();
    recentCount = res?.cnt ?? 0;
  } catch {
    recentCount = 0;
  }
  if (recentCount >= 5) {
    return c.json({ ok: false, error: 'rate_limited' }, 429);
  }

  if (dryRun) {
    return c.json({
      ok: true,
      dry_run: true,
      tenant_id: tenantId,
      subject,
      valid: true,
      estimated_credits: cost,
      credits_remaining: tenant.credit_balance,
    });
  }

  const balance = await getTenantBalance(c.env.DB, tenantId);
  if (balance < cost) {
    return c.json({ ok: false, error: 'insufficient_credits', required: cost, currentBalance: balance }, 402);
  }

  const { reportId } = await generateExecutiveDossier(c.env, {
    tenantId,
    subjectName: subject,
    propertyAddress: subjectType === 'property' ? subject : undefined,
    jurisdiction: 'US',
  });

  const deduction = await deductCredits(c.env.DB, tenantId, cost, 'dossier_generation', reportId);
  try {
    await c.env.DB.prepare('UPDATE reports SET credits_used = ? WHERE id = ?').bind(cost, reportId).run();
  } catch {
    // ignore
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO internal_audit_log (id, actor, endpoint, method, result, status_code, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(newId('ia'), 'staypuft', '/api/internal/reports/generate', 'POST', `dossier_generated:${tenantId}:${reportId}`, 201, c.req.header('cf-connecting-ip') || null, nowIso())
      .run();
  } catch {
    // ignore
  }

  const remaining = deduction.success ? deduction.newBalance : await getTenantBalance(c.env.DB, tenantId);
  return c.json({
    ok: true,
    reportId,
    jobId: reportId,
    status: 'completed',
    tenant_id: tenantId,
    credits_used: cost,
    credits_remaining: remaining,
    pdf_url: `/api/internal/reports/${reportId}/download`,
  });
});

internal.get('/reports/:id/download', async (c) => {
  const id = c.req.param('id');
  let row: any = null;
  try {
    row = await c.env.DB.prepare('SELECT * FROM reports WHERE id = ? LIMIT 1').bind(id).first();
  } catch {
    row = null;
  }
  if (!row) return c.json({ ok: false, error: 'not_found' }, 404);
  const key = row.pdf_key ?? row.pdf_url ?? row.pdfKey ?? null;
  if (!key || !c.env.R2) return c.json({ ok: false, error: 'not_found' }, 404);
  let obj: any = null;
  try { obj = await c.env.R2.get(key); } catch { obj = null; }
  if (!obj) return c.json({ ok: false, error: 'not_found' }, 404);
  const headers = new Headers();
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', `inline; filename="Hermes-Dossier-${id}.pdf"`);
  return new Response(obj.body, { headers });
});

// ---------- Hermes Lead Harvester v1 ----------
function clampHarvestLimit(raw: any, fallback = 20): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(20, Math.max(1, Math.floor(n)));
}

async function getTenantRow(db: any, tenantId: string): Promise<any> {
  try {
    return await db.prepare('SELECT id, name, credit_balance, plan, is_active FROM tenants WHERE id = ?').bind(tenantId).first();
  } catch {
    const all = await db.prepare('SELECT id, name, credit_balance, plan, is_active FROM tenants').all();
    return (all?.results ?? []).find((t: any) => t.id === tenantId) || null;
  }
}

internal.post('/harvest/run', async (c) => {
  let body: any = {};
  try { body = await c.req.json(); } catch { body = {}; }

  const tenantId = String(body?.tenant_id ?? body?.tenantId ?? '').trim();
  const source = String(body?.source ?? 'sec_form_d').trim();
  const limit = clampHarvestLimit(body?.limit, 20);
  const dryRun = body?.dry_run === true || body?.dryRun === true;

  if (!tenantId) {
    return c.json({ ok: false, error: 'tenant_id is required' }, 400);
  }

  const db = c.env.DB;
  const tenant = await getTenantRow(db, tenantId);
  if (!tenant || (tenant.is_active !== 1 && tenant.is_active !== true)) {
    return c.json({ ok: false, error: 'tenant_not_found_or_inactive' }, 400);
  }

  try {
    const result = await runLeadHarvest(c.env, { tenantId, source, limit, dryRun });
    return c.json({ ok: true, ...result, run_id: result.runId, id: result.runId, credits_remaining: result.creditsRemaining, creditsRemaining: result.creditsRemaining, ingested_count: result.ingestedCount, skipped_duplicate_count: result.skippedDuplicateCount, skipped_low_score_count: result.skippedLowScoreCount, total_found: result.totalFound, ingested_leads: result.ingestedLeads });
  } catch (err: any) {
    if (err?.code === 'insufficient_credits') {
      return c.json({ ok: false, error: 'insufficient_credits', required: err.required, currentBalance: err.currentBalance }, 402);
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'invalid_source') {
      return c.json({ ok: false, error: 'invalid_source' }, 400);
    }
    return c.json({ ok: false, error: msg }, 400);
  }
});

function normalizeHarvestRun(row: any): any {
  let leads: any = [];
  let ingested: any = [];
  try {
    const parsed = JSON.parse(row?.leads_json ?? row?.leadsJson ?? '{}');
    leads = parsed?.leads ?? parsed?.items ?? [];
    ingested = parsed?.ingestedLeads ?? parsed?.ingested_leads ?? [];
  } catch {
    leads = [];
    ingested = [];
  }
  return {
    id: row?.id,
    tenant_id: row?.tenant_id ?? row?.tenantId ?? null,
    source: row?.source ?? null,
    limit: row?.limit_count ?? row?.limit ?? null,
    dry_run: row?.dry_run === 1 || row?.dry_run === true,
    status: row?.status ?? 'completed',
    credits_used: row?.credits_used ?? 0,
    leads,
    ingested_leads: ingested,
    ingestedLeads: ingested,
    created_at: row?.created_at ?? row?.createdAt ?? null,
  };
}

async function fetchHarvestRun(db: any, id: string): Promise<any> {
  try {
    return await db.prepare('SELECT * FROM harvest_runs WHERE id = ?').bind(id).first();
  } catch {
    return null;
  }
}

internal.get('/harvest/runs/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const tenantId = c.req.query('tenant_id') || c.req.query('tenantId');
  const row = await fetchHarvestRun(db, id);
  if (!row) return c.json({ ok: false, error: 'not_found' }, 404);
  if (tenantId && row.tenant_id !== tenantId) return c.json({ ok: false, error: 'not_found' }, 404);
  const run = normalizeHarvestRun(row);
  return c.json({ ok: true, run, leads: run.leads, ingested_leads: run.ingested_leads, ingestedLeads: run.ingestedLeads });
});

internal.get('/harvest/run/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const row = await fetchHarvestRun(db, id);
  if (!row) return c.json({ ok: false, error: 'not_found' }, 404);
  const run = normalizeHarvestRun(row);
  return c.json({ ok: true, run, leads: run.leads, ingested_leads: run.ingested_leads, ingestedLeads: run.ingestedLeads });
});

internal.get('/harvest/results/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const row = await fetchHarvestRun(db, id);
  if (!row) return c.json({ ok: false, error: 'not_found' }, 404);
  const run = normalizeHarvestRun(row);
  return c.json({ ok: true, run, leads: run.leads, ingested_leads: run.ingested_leads, ingestedLeads: run.ingestedLeads });
});

internal.get('/harvest-runs/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const row = await fetchHarvestRun(db, id);
  if (!row) return c.json({ ok: false, error: 'not_found' }, 404);
  const run = normalizeHarvestRun(row);
  return c.json({ ok: true, run, leads: run.leads, ingested_leads: run.ingested_leads, ingestedLeads: run.ingestedLeads });
});

internal.get('/harvest/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  if (id === 'run' || id === 'runs' || id === 'results') {
    return c.json({ ok: false, error: 'not_found' }, 404);
  }
  const row = await fetchHarvestRun(db, id);
  if (!row) return c.json({ ok: false, error: 'not_found' }, 404);
  const run = normalizeHarvestRun(row);
  return c.json({ ok: true, run, leads: run.leads, ingested_leads: run.ingested_leads, ingestedLeads: run.ingestedLeads });
});

internal.get('/leads', async (c) => {
  const db = c.env.DB;
  const tenantId = c.req.query('tenant_id') || c.req.query('tenantId');
  const limit = clampLimit(c.req.query('limit'));
  let rows: any[] = [];
  try {
    let sql = 'SELECT * FROM leads';
    const binds: any[] = [];
    if (tenantId) {
      sql += ' WHERE tenant_id = ?';
      binds.push(tenantId);
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    binds.push(limit);
    const stmt = db.prepare(sql);
    const res = binds.length === 2 ? await stmt.bind(binds[0], binds[1]).all() : await stmt.bind(binds[0]).all();
    rows = res?.results ?? [];
  } catch {
    rows = [];
  }
  const leads = rows.map((row: any) => ({
    id: row.id,
    tenant_id: row.tenant_id,
    subject: row.subject,
    source: row.source,
    status: row.status,
    score: row.score,
    contact: row.contact,
    created_at: row.created_at,
    name: row.subject,
  }));
  return c.json({ ok: true, leads, items: leads, count: leads.length, total: leads.length, limit });
});

export default internal;

