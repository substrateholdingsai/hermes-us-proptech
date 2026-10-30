import type { NormalizedLead, CrmSyncConfig, CrmSyncResult } from './types';

function splitName(lead: NormalizedLead): { firstName: string; lastName: string } {
  if (lead.firstName || lead.lastName) {
    return { firstName: lead.firstName || '', lastName: lead.lastName || '' };
  }
  const parts = lead.fullName.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

export function buildFollowUpBossPayload(lead: NormalizedLead): Record<string, unknown> {
  const { firstName, lastName } = splitName(lead);
  const payload: Record<string, unknown> = {
    firstName,
    lastName,
    stage: 'Hot Lead',
    source: 'VEKTOR Intelligence',
    tags: ['High-Equity', 'DNC-Clean', 'Rule-501'],
  };
  if (lead.email) payload.emails = [{ value: lead.email }];
  if (lead.phone) payload.phones = [{ value: lead.phone }];
  if (lead.notes) payload.notes = lead.notes;
  return payload;
}

export async function pushToFollowUpBoss(lead: NormalizedLead, config: CrmSyncConfig): Promise<CrmSyncResult> {
  const provider = 'followupboss' as const;
  if (!config.apiKey) {
    return { provider, success: false, statusCode: 400, error: 'missing_api_key' };
  }
  const endpoint = config.endpointUrl || 'https://api.followupboss.com/v1/people';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${config.apiKey}:`)}`,
      },
      body: JSON.stringify(buildFollowUpBossPayload(lead)),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    let externalId: string | undefined;
    let text = '';
    try {
      text = await res.text();
      const json = text ? JSON.parse(text) : {};
      externalId = json?.id ? String(json.id) : json?.person?.id ? String(json.person.id) : undefined;
    } catch {
      // ignore
    }
    return {
      provider,
      success: res.ok,
      externalId,
      statusCode: res.status,
      error: res.ok ? undefined : text || res.statusText,
    };
  } catch (err) {
    clearTimeout(timeout);
    return { provider, success: false, statusCode: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
