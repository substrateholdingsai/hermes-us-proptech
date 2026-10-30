import type { Env } from '../../types/env';
import type { TenantContext } from '../hermesAgent';
import type { HarvestParams } from './types';
import type { NormalizedLead, CrmSyncConfig } from '../crm/types';
import { harvestLeads } from './index';
import { syncLeadToCrm } from '../crm';
import { newId, nowIso } from '../db';

function toNormalizedLead(lead: any): NormalizedLead {
  return {
    fullName: lead.primaryContactName || lead.entityOrFundName || 'Unknown',
    email: lead.email || undefined,
    phone: lead.phone || undefined,
    lineType: (lead.lineType === 'mobile' || lead.lineType === 'landline' || lead.lineType === 'voip') ? lead.lineType : 'unknown',
    dncStatus: lead.dncStatus === 'clean' ? 'clean' : 'flagged',
    state: lead.jurisdiction,
    investorType: lead.accreditationBadge === 'Qualified Purchaser' ? 'qualified_purchaser' : 'accredited',
    uboName: lead.entityOrFundName,
    source: 'VEKTOR Harvester',
    notes: `${lead.entityOrFundName} · ${lead.dealSizeFormatted}`,
  };
}

export async function runScheduledHarvester(env: Env): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  let schedules: any[] = [];
  try {
    const res = await env.DB.prepare('SELECT * FROM harvest_schedules WHERE is_active = 1').all();
    schedules = (res as any)?.results ?? [];
  } catch {
    return { processed, errors };
  }

  for (const schedule of schedules) {
    try {
      const tenantId = String(schedule.tenant_id);
      const ctx: TenantContext = { tenantId, env };

      const params: HarvestParams = {
        source: schedule.source,
        limit: Number(schedule.limit_per_run) || 10,
        jurisdiction: schedule.jurisdiction === 'MX' ? 'MX' : 'US',
        minAmountDollars: schedule.min_amount_dollars ? Number(schedule.min_amount_dollars) : undefined,
        autoEnrich: true,
      };
      if (schedule.jurisdiction === 'MX') {
        params.entidadFederativa = schedule.state;
      } else {
        params.state = schedule.state || undefined;
      }

      const batch = await harvestLeads(ctx, params);

      if (schedule.auto_sync_crm === 1 && batch.leads.length > 0) {
        let crmConfigs: CrmSyncConfig[] = [];
        try {
          const crmRes = await env.DB.prepare('SELECT * FROM crm_integrations WHERE tenant_id = ? AND is_active = 1').bind(tenantId).all();
          const rows = (crmRes as any)?.results ?? [];
          crmConfigs = rows.map((r: any) => ({
            provider: String(r.provider) as CrmSyncConfig['provider'],
            endpointUrl: r.endpoint_url ? String(r.endpoint_url) : r.endpointUrl ? String(r.endpointUrl) : undefined,
            apiKey: r.api_key ? String(r.api_key) : r.apiKey ? String(r.apiKey) : undefined,
            secret: r.secret ? String(r.secret) : undefined,
            isActive: true,
          }));
        } catch {
          crmConfigs = [];
        }

        if (crmConfigs.length > 0) {
          for (const lead of batch.leads) {
            try {
              await syncLeadToCrm(ctx, toNormalizedLead(lead), crmConfigs);
            } catch {
              // continue
            }
          }
        }
      }

      try {
        await env.DB.prepare('UPDATE harvest_schedules SET last_run_at = ?, last_status = ? WHERE id = ?')
          .bind(nowIso(), 'success', schedule.id)
          .run();
      } catch {
        // ignore
      }

      try {
        await env.DB.prepare(
          `INSERT INTO audit_logs (id, tenant_id, action, resource_type, resource_id, actor, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(newId('audit'), tenantId, 'scheduled_harvest_run', 'harvest_schedule', String(schedule.id), 'scheduler', JSON.stringify({ source: schedule.source, count: batch.leads.length }), nowIso())
          .run();
      } catch {
        // ignore
      }

      processed++;
    } catch (err) {
      errors++;
      try {
        await env.DB.prepare('UPDATE harvest_schedules SET last_run_at = ?, last_status = ? WHERE id = ?')
          .bind(nowIso(), 'error', schedule.id)
          .run();
      } catch {
        // ignore
      }
    }
  }

  return { processed, errors };
}
