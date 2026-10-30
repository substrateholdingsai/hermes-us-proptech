import type { TenantContext } from '../hermesAgent';
import type { NormalizedLead, CrmSyncConfig, CrmSyncResult } from './types';
import { pushToFollowUpBoss } from './followupboss';
import { pushToHubSpot } from './hubspot';
import { pushToSalesforce } from './salesforce';
import { dispatchWebhook } from './webhooks';

export { buildFollowUpBossPayload } from './followupboss';
export { buildHubSpotPayload } from './hubspot';
export { buildSalesforcePayload } from './salesforce';

export function normalizeLead(lead: NormalizedLead): NormalizedLead {
  return {
    ...lead,
    fullName: (lead.fullName || '').trim(),
    source: lead.source || 'VEKTOR Intelligence',
  };
}

export async function syncLeadToCrm(
  ctx: TenantContext,
  lead: NormalizedLead,
  config?: CrmSyncConfig | CrmSyncConfig[]
): Promise<CrmSyncResult[]> {
  const normalized = normalizeLead(lead);

  const configs: CrmSyncConfig[] = [];
  if (config) {
    configs.push(...(Array.isArray(config) ? config : [config]));
  } else {
    try {
      const { results } = await ctx.env.DB.prepare(
        'SELECT * FROM crm_integrations WHERE tenant_id = ? AND is_active = 1'
      )
        .bind(ctx.tenantId)
        .all();
      for (const row of results ?? []) {
        const r = row as Record<string, unknown>;
        configs.push({
          provider: String(r.provider) as CrmSyncConfig['provider'],
          endpointUrl: r.endpoint_url ? String(r.endpoint_url) : r.endpointUrl ? String(r.endpointUrl) : undefined,
          apiKey: r.api_key ? String(r.api_key) : r.apiKey ? String(r.apiKey) : undefined,
          secret: r.secret ? String(r.secret) : undefined,
          isActive: true,
        });
      }
    } catch {
      // ignore missing table
    }
  }

  const active = configs.filter((c) => c.isActive);
  const results: CrmSyncResult[] = await Promise.all(
    active.map(async (cfg) => {
      switch (cfg.provider) {
        case 'followupboss':
          return pushToFollowUpBoss(normalized, cfg);
        case 'hubspot':
          return pushToHubSpot(normalized, cfg);
        case 'salesforce':
          return pushToSalesforce(normalized, cfg);
        case 'webhook':
          return dispatchWebhook({
            config: cfg,
            event: 'target.resolved',
            tenantId: ctx.tenantId,
            lead: normalized,
            db: ctx.env.DB,
          });
        default:
          return { provider: cfg.provider, success: false, statusCode: 400, error: 'unknown_provider' };
      }
    })
  );

  try {
    await ctx.env.DB.prepare(
      `INSERT INTO audit_logs (id, tenant_id, action, resource_type, resource_id, actor, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        ctx.tenantId,
        'crm_sync',
        'crm',
        ctx.tenantId,
        'crm_sync',
        JSON.stringify({ providers: results.map((r) => r.provider), success: results.every((r) => r.success) }),
        new Date().toISOString()
      )
      .run();
  } catch {
    // ignore
  }

  return results;
}
