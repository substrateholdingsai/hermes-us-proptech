import type { Env } from '../../types/env';
import type { TenantContext } from '../hermesAgent';
import type { HarvestedLeadItem } from './types';
import { harvestSecFormD } from './secHarvester';
import { harvestSigerSapi } from './mexico/sigerHarvester';
import { scoreLead, LEAD_SCORE_THRESHOLD } from './leadScoring';
import { newId, nowIso } from '../db';
import { getTenantBalance, deductCredits } from '../credits';

export const LEAD_HARVEST_SOURCES = ['sec_form_d', 'siger_sapi'] as const;
export type LeadHarvestSource = (typeof LEAD_HARVEST_SOURCES)[number];

export const LEAD_CREDIT_COST = 10;
export const LEAD_SCORE_THRESHOLD_VALUE = LEAD_SCORE_THRESHOLD;

export interface LeadRecord {
  id: string;
  tenant_id: string;
  subject: string;
  source: string;
  status: string;
  score: number;
  contact: string | null;
  created_at: string;
}

export interface ScoredHarvestedLead extends HarvestedLeadItem {
  score: number;
}

export interface LeadHarvestRunResult {
  runId: string;
  tenant_id: string;
  source: string;
  limit: number;
  dry_run: boolean;
  status: string;
  totalFound: number;
  ingestedCount: number;
  skippedDuplicateCount: number;
  skippedLowScoreCount: number;
  creditsUsed: number;
  creditsRemaining: number;
  leads: ScoredHarvestedLead[];
  ingestedLeads: LeadRecord[];
  createdAt: string;
  error?: string | null;
}

function isLeadHarvestSource(source: string): source is LeadHarvestSource {
  return (LEAD_HARVEST_SOURCES as readonly string[]).includes(source);
}

async function storeRun(
  db: any,
  runId: string,
  tenantId: string,
  source: string,
  limit: number,
  dryRun: boolean,
  creditsUsed: number,
  leads: ScoredHarvestedLead[],
  ingestedLeads: LeadRecord[]
): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO harvest_runs (id, tenant_id, source, limit_count, dry_run, status, credits_used, leads_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        runId,
        tenantId,
        source,
        limit,
        dryRun ? 1 : 0,
        dryRun ? 'dry_run' : 'completed',
        creditsUsed,
        JSON.stringify({ leads, ingestedLeads }),
        nowIso()
      )
      .run();
  } catch {
    // ignore persistence errors
  }
}

export async function runLeadHarvest(
  env: Env,
  params: { tenantId: string; source: string; limit?: number; dryRun?: boolean }
): Promise<LeadHarvestRunResult> {
  const tenantId = params.tenantId;
  const source = params.source;
  const limit = Math.min(20, Math.max(1, Math.floor(params.limit ?? 20)));
  const dryRun = params.dryRun === true;

  if (!isLeadHarvestSource(source)) {
    throw new Error('invalid_source');
  }

  const ctx: TenantContext = { tenantId, env };
  let harvested: HarvestedLeadItem[] = [];
  let sourceError: string | null = null;
  try {
    if (source === 'sec_form_d') {
      harvested = await harvestSecFormD(ctx, { source, limit, autoEnrich: true });
    } else {
      harvested = await harvestSigerSapi(ctx, { source, limit, autoEnrich: true });
    }
  } catch (err) {
    sourceError = String(err);
    harvested = [];
  }
  const arrAny: any = harvested;
  if (arrAny && arrAny.error) sourceError = arrAny.error;

  const scored: ScoredHarvestedLead[] = harvested.map((lead) => ({
    ...lead,
    score: scoreLead(lead),
  }));

  const qualifying = scored.filter((lead) => lead.score >= LEAD_SCORE_THRESHOLD);
  const skippedLowScoreCount = scored.length - qualifying.length;

  const db: any = env.DB;
  const newQualifying: ScoredHarvestedLead[] = [];
  let skippedDuplicateCount = 0;

  for (const lead of qualifying) {
    const subject = lead.entityOrFundName || lead.primaryContactName;
    let existing: any = null;
    try {
      existing = await db
        .prepare('SELECT id FROM leads WHERE tenant_id = ? AND subject = ? AND source = ? LIMIT 1')
        .bind(tenantId, subject, source)
        .first();
    } catch {
      existing = null;
    }
    if (existing) {
      skippedDuplicateCount += 1;
    } else {
      newQualifying.push(lead);
    }
  }

  const creditsRequired = newQualifying.length * LEAD_CREDIT_COST;
  const balance = await getTenantBalance(db, tenantId);

  if (!dryRun && creditsRequired > 0 && balance < creditsRequired) {
    const err: any = new Error('insufficient_credits');
    err.code = 'insufficient_credits';
    err.required = creditsRequired;
    err.currentBalance = balance;
    throw err;
  }

  const runId = newId('harvest_run');
  const createdAt = nowIso();

  if (dryRun) {
    await storeRun(db, runId, tenantId, source, limit, true, 0, scored, []);
    return {
      runId,
      tenant_id: tenantId,
      source,
      limit,
      dry_run: true,
      status: sourceError ? 'error' : 'dry_run',
      totalFound: harvested.length,
      ingestedCount: 0,
      skippedDuplicateCount,
      skippedLowScoreCount,
      creditsUsed: 0,
      creditsRemaining: balance,
      leads: scored,
      ingestedLeads: [],
      createdAt,
      error: sourceError,
    };
  }

  const ingestedLeads: LeadRecord[] = [];
  for (const lead of newQualifying) {
    const subject = lead.entityOrFundName || lead.primaryContactName || '';
    const contact = lead.email || lead.phone || null;
    const id = newId('lead');
    try {
      await db
        .prepare(
          'INSERT INTO leads (id, tenant_id, subject, source, status, score, contact, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(id, tenantId, subject, source, 'new', lead.score, contact, nowIso())
        .run();
      ingestedLeads.push({
        id,
        tenant_id: tenantId,
        subject,
        source,
        status: 'new',
        score: lead.score,
        contact,
        created_at: createdAt,
      });
    } catch {
      // duplicate or persistence error: count as skipped duplicate
      skippedDuplicateCount += 1;
    }
  }

  const actuallyIngested = ingestedLeads.length;
  const cost = actuallyIngested * LEAD_CREDIT_COST;
  if (cost > 0) {
    await deductCredits(db, tenantId, cost, `harvest_${source}`, runId);
  }
  const remaining = await getTenantBalance(db, tenantId);

  await storeRun(db, runId, tenantId, source, limit, false, cost, scored, ingestedLeads);

  try {
    await db
      .prepare(
        `INSERT INTO internal_audit_log (id, actor, endpoint, method, result, status_code, ip, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        newId('ia'),
        'staypuft',
        '/api/internal/harvest/run',
        'POST',
        `harvest_run:${tenantId}:${runId}:${actuallyIngested}`,
        200,
        null,
        nowIso()
      )
      .run();
  } catch {
    // ignore
  }

  let finalStatus = 'completed';
  if (arrAny && arrAny.disabled) finalStatus = 'disabled';
  else if (sourceError) finalStatus = 'error';
  else if (harvested.length === 0) finalStatus = 'empty';

  return {
    runId,
    tenant_id: tenantId,
    source,
    limit,
    dry_run: false,
    status: finalStatus,
    totalFound: harvested.length,
    ingestedCount: actuallyIngested,
    skippedDuplicateCount,
    skippedLowScoreCount,
    creditsUsed: cost,
    creditsRemaining: remaining,
    leads: scored,
    ingestedLeads,
    createdAt,
    error: sourceError,
  };
}
