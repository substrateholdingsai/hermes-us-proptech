import type { TenantContext } from '../hermesAgent';
import type { HarvestParams, HarvestBatchResult, HarvestedLeadItem } from './types';
import { harvestSecFormD, harvestRiaFamilyOffices } from './secHarvester';
import { harvestLuxuryCashBuyers } from './luxuryCashHarvester';
import { newId, nowIso } from '../db';
import { deductCredits } from '../credits';

export async function harvestLeads(
  ctx: TenantContext,
  params: HarvestParams
): Promise<HarvestBatchResult> {
  const limit = params.limit || 10;
  let leads: HarvestedLeadItem[] = [];

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
  }

  const creditsPerLead = 10;
  const creditsConsumed = leads.length * creditsPerLead;

  // Persist leads to D1
  for (const lead of leads) {
    try {
      await ctx.env.DB.prepare(
        `INSERT INTO investor_profiles (id, tenant_id, full_name, entity_name, email, phone, investor_type, sec_form_d, sec_form_adv, dnc_status, line_type, email_verified, equity_score, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
          lead.dncStatus,
          lead.lineType,
          lead.email ? 1 : 0,
          80,
          nowIso(),
          nowIso()
        )
        .run();
    } catch {
      // ignore
    }

    try {
      await ctx.env.DB.prepare(
        `INSERT INTO skip_trace_records (id, tenant_id, subject_name, subject_type, phone, email, line_type, dnc_status, smtp_verified, source, confidence, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          newId('st'),
          ctx.tenantId,
          lead.primaryContactName,
          'person',
          lead.phone || null,
          lead.email || null,
          lead.lineType,
          lead.dncStatus,
          lead.email ? 1 : 0,
          lead.source,
          lead.isTcpaSafe ? 1 : 0.5,
          nowIso()
        )
        .run();
    } catch {
      // ignore
    }

    if (lead.source === 'luxury_cash_buyers') {
      try {
        await ctx.env.DB.prepare(
          `INSERT INTO entity_lookups (id, tenant_id, entity_name, entity_type, state_of_formation, ubo_name, status, raw_payload, created_at, updated_at)
           VALUES (?, ?, ?, 'llc', ?, ?, 'resolved', ?, ?, ?)`
        )
          .bind(newId('ent'), ctx.tenantId, lead.entityOrFundName, lead.jurisdiction, lead.primaryContactName, JSON.stringify(lead), nowIso(), nowIso())
          .run();
      } catch {
        // ignore
      }
      try {
        await ctx.env.DB.prepare(
          `INSERT INTO properties (id, tenant_id, address, county, state, assessed_value_cents, market_value_cents, mortgage_balance_cents, equity_cents, tax_amount_cents, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?)`
        )
          .bind(
            newId('prop'),
            ctx.tenantId,
            lead.entityOrFundName,
            null,
            lead.jurisdiction,
            lead.capitalOrDealSizeDollars * 100,
            lead.capitalOrDealSizeDollars * 100,
            lead.capitalOrDealSizeDollars * 100,
            nowIso(),
            nowIso()
          )
          .run();
      } catch {
        // ignore
      }
    }

    if (lead.source === 'sec_form_d' || lead.source === 'ria_family_offices') {
      try {
        await ctx.env.DB.prepare(
          `INSERT INTO entity_lookups (id, tenant_id, entity_name, entity_type, state_of_formation, ubo_name, status, raw_payload, created_at, updated_at)
           VALUES (?, ?, ?, 'other', ?, ?, 'resolved', ?, ?, ?)`
        )
          .bind(newId('ent'), ctx.tenantId, lead.entityOrFundName, lead.jurisdiction, lead.primaryContactName, JSON.stringify(lead), nowIso(), nowIso())
          .run();
      } catch {
        // ignore
      }
    }
  }

  try {
    await ctx.env.DB.prepare(
      `INSERT INTO audit_logs (id, tenant_id, action, resource_type, resource_id, actor, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(newId('audit'), ctx.tenantId, 'harvest_completed', 'harvest_batch', newId('batch'), 'harvester', JSON.stringify({ source: params.source, count: leads.length, creditsConsumed }), nowIso())
      .run();
  } catch {
    // ignore
  }

  // Deduct credits
  if (creditsConsumed > 0) {
    try {
      await deductCredits(ctx.env.DB, ctx.tenantId, creditsConsumed, `harvest_${params.source}`);
    } catch {
      // ignore
    }
  }

  return {
    batchId: newId('batch'),
    source: params.source,
    totalFound: leads.length,
    enrichedCount: leads.filter((l) => l.isTcpaSafe || l.phone).length,
    creditsConsumed,
    leads,
  };
}
