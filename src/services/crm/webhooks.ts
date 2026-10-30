import type { D1Database } from '@cloudflare/workers-types';
import { signWebhookPayload } from './hmac';
import type { NormalizedLead, CrmSyncConfig, CrmSyncResult } from './types';

export interface WebhookDispatchParams {
  config: CrmSyncConfig;
  event: string;
  tenantId: string;
  lead: NormalizedLead;
  db?: D1Database;
}

export async function dispatchWebhook(params: WebhookDispatchParams): Promise<CrmSyncResult> {
  const provider = 'webhook' as const;
  const { config, event, tenantId, lead, db } = params;
  if (!config.endpointUrl) {
    return { provider, success: false, statusCode: 400, error: 'missing_endpoint_url' };
  }
  const timestamp = new Date().toISOString();
  const payload = { event, timestamp, tenantId, lead };
  const payloadString = JSON.stringify(payload);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.secret) {
    headers['X-Hermes-Signature-256'] = await signWebhookPayload(payloadString, config.secret);
  }
  headers['X-Hermes-Timestamp'] = timestamp;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let statusCode = 0;
  let error: string | undefined;
  let success = false;
  try {
    const res = await fetch(config.endpointUrl, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    statusCode = res.status;
    success = res.ok;
    if (!res.ok) {
      try {
        error = await res.text();
      } catch {
        error = res.statusText;
      }
    }
  } catch (err) {
    clearTimeout(timeout);
    error = err instanceof Error ? err.message : String(err);
  }

  if (db) {
    try {
      await db.prepare(
        `INSERT INTO audit_logs (id, tenant_id, action, resource_type, resource_id, actor, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          crypto.randomUUID(),
          tenantId,
          'webhook_dispatched',
          'crm_webhook',
          config.endpointUrl,
          'crm_sync',
          JSON.stringify({ event, success, statusCode }),
          timestamp
        )
        .run();
    } catch {
      // ignore
    }
  }

  return { provider, success, statusCode, error };
}
