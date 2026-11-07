import type { TenantContext } from '../hermesAgent';
import type { HarvestParams, HarvestBatchResult, HarvestedLeadItem } from './types';
import { harvestSecFormD, harvestRiaFamilyOffices } from './secHarvester';
import { harvestLuxuryCashBuyers } from './luxuryCashHarvester';
import { harvestSigerSapi, harvestCnbvQualified } from './mexico/sigerHarvester';
import { harvestRppycLuxury } from './mexico/rppycHarvester';
import { newId, nowIso } from '../db';
import { deductCredits } from '../credits';

export async function harvestLeads(
  ctx: TenantContext,
  params: HarvestParams
): Promise<HarvestBatchResult> {
  const limit = params.limit || 10;
  let leads: HarvestedLeadItem[] = [];
  let sourceError: string | null = null;
  let disabled = false;

  try {
    switch (params.source) {
      case 'sec_form_d':
        leads = await harvestSecFormD(ctx, { ...params, limit });
        break;
      case 'luxury_cash_buyers':
        leads = await harvestLuxuryCashBuyers(ctx, { ...params, limit });
        break;
      case 'ria_family_offices':
        leads = await harvestRiaFamilyOffices(ctx, { ...params, limit });
        break;
      case 'siger_sapi':
        leads = await harvestSigerSapi(ctx, { ...params, limit });
        break;
      case 'rppyc_luxury_acquisitions':
        leads = await harvestRppycLuxury(ctx, { ...params, limit });
        break;
      case 'cnbv_qualified_investors':
        leads = await harvestCnbvQualified(ctx, { ...params, limit });
        break;
    }
  } catch (err) {
    sourceError = String(err);
  }

  const arrAny: any = leads;
  if (arrAny && arrAny.error) sourceError = arrAny.error;
  if (arrAny && arrAny.disabled) disabled = true;

  const creditsPerLead = 10;
  const queriedAt = nowIso();

  // Validate leads: require entity name.
  const validLeads = (leads || []).filter((l) => !!l && !!l.entityOrFundName);

  // Persist only valid leads, preserving provenance. Track accepted count.
  let acceptedCount = 0;
  const seen = new Set<string>();
  for (const lead of validLeads) {
    const key = `${lead.source}:${lead.sourceId || lead.entityOrFundName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Dedup against existing investor_profiles by source_id or entity_name.
    try {
      let existing: any = null;
      if (lead.sourceId) {
        existing = await ctx.env.DB.prepare(
          `SELECT id FROM investor_profiles WHERE tenant_id = ? AND source_id = ? LIMIT 1`
        ).bind(ctx.tenantId, lead.sourceId).first();
      }
      if (!existing) {
        existing = await ctx.env.DB.prepare(
          `SELECT id FROM investor_profiles WHERE tenant_id = ? AND entity_name = ? AND data_source = ? LIMIT 1`
        ).bind(ctx.tenantId, lead.entityOrFundName, lead.dataSource || lead.source).first();
      }
      if (existing) continue;
    } catch {
      // ignore dedup errors; attempt insert
    }

    let ok = true;
    try {
      await ctx.env.DB.prepare(
        `INSERT INTO investor_profiles (id, tenant_id, full_name, entity_name, email, phone, investor_type, sec_form_d, sec_form_adv, dnc_status, line_type, email_verified, equity_score, data_source, verification_status, source_url, source_id, verified_at, queried_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          newId('inv'),
          ctx.tenantId,
          lead.primaryContactName,
          lead.entityOrFundName,
          lead.email || null,
          lead.phone || null,
          lead.accreditationBadge === 'Qualified Purchaser' ? 'qualified_purchaser' : 'accredited',
          lead.source === 'sec_form_d' ? 1 : 0,
          lead.source === 'ria_family_offices' ? 1 : 0,
          lead.dncStatus === 'clean' ? 'clean' : (lead.dncStatus === 'flagged' ? 'flagged' : 'unknown'),
          lead.lineType,
          lead.email ? 1 : 0,
          80,
          lead.dataSource || lead.source,
          lead.verificationStatus,
          lead.sourceUrl,
          lead.sourceId,
          lead.verifiedAt,
          lead.queriedAt || queriedAt,
          nowIso(),
          nowIso()
        )
        .run();
    } catch {
      ok = false;
    }

    if (ok) {
      try {
        await ctx.env.DB.prepare(
          `INSERT INTO skip_trace_records (id, tenant_id, subject_name, subject_type, phone, email, line_type, dnc_status, smtp_verified, source, confidence, data_source, verification_status, source_url, source_id, queried_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            newId('st'),
            ctx.tenantId,
            lead.primaryContactName || lead.entityOrFundName,
            'person',
            lead.phone || null,
            lead.email || null,
            lead.lineType,
            lead.dncStatus === 'clean' ? 'clean' : (lead.dncStatus === 'flagged' ? 'flagged' : 'unknown'),
            lead.email ? 1 : 0,
            lead.source,
            lead.isTcpaSafe ? 1 : 0.5,
            lead.dataSource || lead.source,
            lead.verificationStatus,
            lead.sourceUrl,
            lead.sourceId,
            lead.queriedAt || queriedAt,
            nowIso()
          )
          .run();
      } catch {
        // ignore secondary
      }
    }

    if (lead.source === 'luxury_cash_buyers' && ok) {
      try {
        await ctx.env.DB.prepare(
          `INSERT INTO entity_lookups (id, tenant_id, entity_name, entity_type, state_of_formation, ubo_name, status, raw_payload, data_source, verification_status, source_url, source_id, created_at, updated_at)
           VALUES (?, ?, ?, 'llc', ?, ?, 'resolved', ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(newId('ent'), ctx.tenantId, lead.entityOrFundName, lead.jurisdiction, lead.primaryContactName, JSON.stringify(lead), lead.dataSource || lead.source, lead.verificationStatus, lead.sourceUrl, lead.sourceId, nowIso(), nowIso())
          .run();
      } catch {
        // ignore
      }
      if (lead.propertyAddress) {
        try {
          await ctx.env.DB.prepare(
            `INSERT INTO properties (id, tenant_id, address, county, state, assessed_value_cents, market_value_cents, mortgage_balance_cents, equity_cents, tax_amount_cents, data_source, verification_status, source_url, source_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              newId('prop'),
              ctx.tenantId,
              lead.propertyAddress,
              null,
              lead.jurisdiction,
              (lead.capitalOrDealSizeDollars || 0) * 100,
              (lead.capitalOrDealSizeDollars || 0) * 100,
              (lead.capitalOrDealSizeDollars || 0) * 100,
              lead.dataSource || lead.source,
              lead.verificationStatus,
              lead.sourceUrl,
              lead.sourceId,
              nowIso(),
              nowIso()
            )
            .run();
        } catch {
          // ignore
        }
      }
    }

    if ((lead.source === 'sec_form_d' || lead.source === 'ria_family_offices') && ok) {
      try {
        await ctx.env.DB.prepare(
          `INSERT INTO entity_lookups (id, tenant_id, entity_name, entity_type, state_of_formation, ubo_name, status, raw_payload, data_source, verification_status, source_url, source_id, created_at, updated_at)
           VALUES (?, ?, ?, 'other', ?, ?, 'resolved', ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(newId('ent'), ctx.tenantId, lead.entityOrFundName, lead.jurisdiction, lead.primaryContactName, JSON.stringify(lead), lead.dataSource || lead.source, lead.verificationStatus, lead.sourceUrl, lead.sourceId, nowIso(), nowIso())
          .run();
      } catch {
        // ignore
      }
    }

    if (ok) acceptedCount += 1;
  }

  try {
    await ctx.env.DB.prepare(
      `INSERT INTO audit_logs (id, tenant_id, action, resource_type, resource_id, actor, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(newId('audit'), ctx.tenantId, 'harvest_completed', 'harvest_batch', newId('batch'), 'harvester', JSON.stringify({ source: params.source, count: acceptedCount, creditsConsumed: acceptedCount * creditsPerLead }), nowIso())
      .run();
  } catch {
    // ignore
  }

  const creditsConsumed = acceptedCount * creditsPerLead;
  if (creditsConsumed > 0) {
    try {
      await deductCredits(ctx.env.DB, ctx.tenantId, creditsConsumed, `harvest_${params.source}`);
    } catch {
      // ignore
    }
  }

  let status: HarvestBatchResult['status'] = 'completed';
  if (disabled) status = 'disabled';
  else if (sourceError) status = 'error';
  else if (validLeads.length === 0) status = 'empty';

  return {
    batchId: newId('batch'),
    source: params.source,
    totalFound: leads.length,
    enrichedCount: validLeads.filter((l) => l.isTcpaSafe || l.phone).length,
    creditsConsumed,
    leads: validLeads,
    status,
    error: sourceError,
  };
}
