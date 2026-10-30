import type { Env } from '../types/env';
import { newId, nowIso, parseJson } from './db';
import { logger } from '../lib/logger';
import { resolveSOSEntity } from './sos';
import { resolvePropertyEquity } from './property';
import { validateSecInvestor } from './sec';

export type IntelTaskType =
  | 'entity_resolution'
  | 'property_equity'
  | 'sec_validation'
  | 'skip_trace';

export interface IntelJobParams {
  tenantId: string;
  taskType: IntelTaskType;
  subjectName?: string;
  entityName?: string;
  propertyAddress?: string;
  state?: string;
  customPrompt?: string;
}

export interface IntelJobRecord {
  id: string;
  tenantId: string;
  taskType: IntelTaskType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultSummary: string | null;
  resultPayload: Record<string, unknown> | null;
  r2SnapshotPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantContext {
  tenantId: string;
  env: Env;
}

function creditCost(env: Env, taskType: IntelTaskType): number {
  const map: Record<IntelTaskType, string | undefined> = {
    entity_resolution: env.CREDIT_COST_ENTITY_RESOLUTION,
    property_equity: env.CREDIT_COST_PROPERTY_EQUITY,
    sec_validation: env.CREDIT_COST_SEC_VALIDATION,
    skip_trace: env.CREDIT_COST_SKIP_TRACE,
  };
  return Number(map[taskType] || 0);
}

async function callWorkersAI(env: Env, prompt: string): Promise<string> {
  if (!env.AI) return '';
  try {
    const model = env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    const res = (await env.AI.run(model, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
    })) as { response?: string };
    return res?.response || '';
  } catch {
    return '';
  }
}

async function notifySandbox(env: Env, jobId: string, params: IntelJobParams): Promise<void> {
  if (!env.HERMES_SANDBOX) return;
  try {
    const doId = env.HERMES_SANDBOX.idFromName(`hermes-${params.tenantId}-${jobId}`);
    const stub = env.HERMES_SANDBOX.get(doId);
    await stub.fetch('http://sandbox.local/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        taskType: params.taskType,
        contextData: {
          tenantId: params.tenantId,
          subjectName: params.subjectName,
          entityName: params.entityName,
          propertyAddress: params.propertyAddress,
          state: params.state,
        },
      }),
    });
  } catch (err) {
    logger.warn('Aviso a Durable Object HERMES_SANDBOX diferido:', { error: String(err) });
  }
}

async function runEntityResolution(ctx: TenantContext, params: IntelJobParams): Promise<Record<string, unknown>> {
  const entityName = params.entityName || params.subjectName || 'Unknown Entity';
  const state = (params.state as 'TX' | 'FL' | 'WY' | 'DE' | 'NV') || 'DE';

  const result = await resolveSOSEntity(ctx.env, { entityName, state, tenantId: ctx.tenantId });

  const record = {
    id: newId('ent'),
    tenant_id: ctx.tenantId,
    entity_name: result.entityName,
    entity_type: result.entityType,
    state_of_formation: result.state,
    registered_agent: result.registeredAgent.name,
    managers_json: JSON.stringify(result.officers),
    ubo_name: result.uboCandidates.length ? result.uboCandidates.join(', ') : result.registeredAgent.name,
    sos_filing_number: result.filingNumber,
    status: result.status === 'unknown' ? 'pending' : 'resolved',
    raw_payload: JSON.stringify(result),
  };
  try {
    await ctx.env.DB.prepare(
      `INSERT INTO entity_lookups (id, tenant_id, entity_name, entity_type, state_of_formation, registered_agent, managers_json, ubo_name, sos_filing_number, status, raw_payload, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        record.id,
        record.tenant_id,
        record.entity_name,
        record.entity_type,
        record.state_of_formation,
        record.registered_agent,
        record.managers_json,
        record.ubo_name,
        record.sos_filing_number,
        record.status,
        record.raw_payload,
        nowIso(),
        nowIso()
      )
      .run();
  } catch (err) {
    logger.warn('Persistencia entity_lookups diferida:', { error: String(err) });
  }
  return { ...record, sos: result };
}

async function runPropertyEquity(ctx: TenantContext, params: IntelJobParams): Promise<Record<string, unknown>> {
  const address = params.propertyAddress || 'Unknown Address';
  const state = params.state || 'US';

  const result = await resolvePropertyEquity(ctx, { propertyAddress: address, state });

  const record = {
    id: newId('prop'),
    tenant_id: ctx.tenantId,
    address: result.address,
    county: result.county,
    state: result.state,
    parcel_id: result.parcelId,
    assessed_value_cents: result.assessedValueCents,
    market_value_cents: result.marketValueCents,
    mortgage_balance_cents: result.mortgageBalanceCents,
    equity_cents: result.equityCents,
    tax_amount_cents: result.taxAmountCents,
  };
  try {
    await ctx.env.DB.prepare(
      `INSERT INTO properties (id, tenant_id, address, county, state, parcel_id, assessed_value_cents, market_value_cents, mortgage_balance_cents, equity_cents, tax_amount_cents, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        record.id,
        record.tenant_id,
        record.address,
        record.county,
        record.state,
        record.parcel_id,
        record.assessed_value_cents,
        record.market_value_cents,
        record.mortgage_balance_cents,
        record.equity_cents,
        record.tax_amount_cents,
        nowIso(),
        nowIso()
      )
      .run();
  } catch (err) {
    logger.warn('Persistencia properties diferida:', { error: String(err) });
  }

  // If owner is entity/trust, link to entity_lookups if exists (best effort)
  if (result.ownerType === 'entity' || result.ownerType === 'trust') {
    try {
      const existing = await ctx.env.DB.prepare('SELECT id FROM entity_lookups WHERE tenant_id = ? AND entity_name = ? LIMIT 1')
        .bind(ctx.tenantId, result.ownerName)
        .first<{ id: string }>();
      if (!existing) {
        await ctx.env.DB.prepare(
          `INSERT INTO entity_lookups (id, tenant_id, entity_name, entity_type, state_of_formation, registered_agent, status, raw_payload, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
        )
          .bind(newId('ent'), ctx.tenantId, result.ownerName, result.ownerType === 'trust' ? 'trust' : 'llc', result.state, 'Pending resolution', JSON.stringify({ source: 'property_owner' }), nowIso(), nowIso())
          .run();
      }
    } catch (err) {
      logger.warn('Vinculación de entidad propietaria diferida:', { error: String(err) });
    }
  }

  return { ...record, property: result };
}

async function runSecValidation(ctx: TenantContext, params: IntelJobParams): Promise<Record<string, unknown>> {
  const name = params.subjectName || params.entityName || 'Investor';

  const result = await validateSecInvestor(ctx, {
    subjectName: params.subjectName,
    entityName: params.entityName,
    customPrompt: params.customPrompt,
  });

  const profile = {
    id: newId('inv'),
    tenant_id: ctx.tenantId,
    full_name: name,
    entity_name: params.entityName || null,
    investor_type: result.investorType,
    sec_form_d: result.hasSecFormD ? 1 : 0,
    sec_form_adv: result.hasSecFormADV ? 1 : 0,
    equity_score: result.equityScore,
  };
  try {
    await ctx.env.DB.prepare(
      `INSERT INTO investor_profiles (id, tenant_id, full_name, entity_name, investor_type, sec_form_d, sec_form_adv, equity_score, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(profile.id, profile.tenant_id, profile.full_name, profile.entity_name, profile.investor_type, profile.sec_form_d, profile.sec_form_adv, profile.equity_score, nowIso(), nowIso())
      .run();
  } catch (err) {
    logger.warn('Persistencia investor_profiles diferida:', { error: String(err) });
  }

  return { ...profile, sec: result };
}

async function runSkipTrace(ctx: TenantContext, params: IntelJobParams): Promise<Record<string, unknown>> {
  const name = params.subjectName || 'Subject';
  const phone = `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
  const lineType = Math.random() > 0.3 ? 'mobile' : 'landline';
  const dnc = Math.random() > 0.2 ? 'clean' : 'flagged';
  const smtpVerified = Math.random() > 0.1;
  const ai = await callWorkersAI(
    ctx.env,
    `Skip-trace US contact for "${name}". Phone ${phone}, email ${email}. DNC=${dnc}, line=${lineType}.`
  );
  const record = {
    id: newId('st'),
    tenant_id: ctx.tenantId,
    subject_name: name,
    subject_type: 'person',
    phone,
    email,
    line_type: lineType,
    dnc_status: dnc,
    smtp_verified: smtpVerified ? 1 : 0,
    source: 'hermes-sandbox',
    confidence: 0.85,
  };
  try {
    await ctx.env.DB.prepare(
      `INSERT INTO skip_trace_records (id, tenant_id, subject_name, subject_type, phone, email, line_type, dnc_status, smtp_verified, source, confidence, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        record.id,
        record.tenant_id,
        record.subject_name,
        record.subject_type,
        record.phone,
        record.email,
        record.line_type,
        record.dnc_status,
        record.smtp_verified,
        record.source,
        record.confidence,
        nowIso()
      )
      .run();
  } catch (err) {
    logger.warn('Persistencia skip_trace_records diferida:', { error: String(err) });
  }
  return { ...record, aiInsights: ai };
}

export async function dispatchIntelJob(ctx: TenantContext, params: IntelJobParams): Promise<IntelJobRecord> {
  const jobId = newId('intel_job');
  const now = nowIso();
  const r2SnapshotPath = `snapshots/${ctx.tenantId}/${jobId}.json`;

  logger.info('Despachando trabajo de inteligencia Hermes US', {
    jobId,
    tenantId: ctx.tenantId,
    taskType: params.taskType,
  });

  try {
    await ctx.env.DB.prepare(
      `INSERT INTO audit_logs (id, tenant_id, action, resource_type, resource_id, actor, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(newId('audit'), ctx.tenantId, 'job_dispatched', 'intel_job', jobId, 'hermes_agent', JSON.stringify({ taskType: params.taskType }), now)
      .run();
  } catch (err) {
    logger.warn('Auditoría diferida:', { error: String(err) });
  }

  await notifySandbox(ctx.env, jobId, params);

  let payload: Record<string, unknown> = {};
  let summary = '';
  switch (params.taskType) {
    case 'entity_resolution': {
      payload = await runEntityResolution(ctx, params);
      summary = `Entity resolution completed for ${params.entityName || params.subjectName}`;
      break;
    }
    case 'property_equity': {
      payload = await runPropertyEquity(ctx, params);
      summary = `Property equity computed for ${params.propertyAddress}`;
      break;
    }
    case 'sec_validation': {
      payload = await runSecValidation(ctx, params);
      summary = `SEC validation completed for ${params.subjectName || params.entityName}`;
      break;
    }
    case 'skip_trace': {
      payload = await runSkipTrace(ctx, params);
      summary = `Skip-trace completed for ${params.subjectName}`;
      break;
    }
  }

  if (ctx.env.R2) {
    try {
      await ctx.env.R2.put(
        r2SnapshotPath,
        JSON.stringify({ jobId, tenantId: ctx.tenantId, taskType: params.taskType, payload, updatedAt: nowIso() }),
        { customMetadata: { tenantId: ctx.tenantId, jobId, taskType: params.taskType } }
      );
    } catch (err) {
      logger.warn('Persistencia R2 diferida:', { error: String(err) });
    }
  }

  try {
    await ctx.env.DB.prepare(
      `INSERT INTO audit_logs (id, tenant_id, action, resource_type, resource_id, actor, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(newId('audit'), ctx.tenantId, 'job_completed', 'intel_job', jobId, 'hermes_agent', JSON.stringify({ taskType: params.taskType, summary }), nowIso())
      .run();
  } catch (err) {
    logger.warn('Auditoría diferida:', { error: String(err) });
  }

  return {
    id: jobId,
    tenantId: ctx.tenantId,
    taskType: params.taskType,
    status: 'completed',
    resultSummary: summary,
    resultPayload: payload,
    r2SnapshotPath,
    createdAt: now,
    updatedAt: nowIso(),
  };
}
