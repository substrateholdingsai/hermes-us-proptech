import type { NormalizedLead, CrmSyncConfig, CrmSyncResult } from './types';

function splitName(lead: NormalizedLead): { FirstName: string; LastName: string } {
  if (lead.firstName || lead.lastName) {
    return { FirstName: lead.firstName || '', LastName: lead.lastName || '' };
  }
  const parts = lead.fullName.trim().split(/\s+/);
  return { FirstName: parts[0] || '', LastName: parts.slice(1).join(' ') || parts[0] || '' };
}

export function buildSalesforcePayload(lead: NormalizedLead): Record<string, unknown> {
  const { FirstName, LastName } = splitName(lead);
  const payload: Record<string, unknown> = {
    FirstName,
    LastName,
    Company: lead.uboName || lead.fullName || 'VEKTOR Lead',
    LeadSource: 'VEKTOR Intelligence',
    Description: lead.notes || '',
  };
  if (lead.email) payload.Email = lead.email;
  if (lead.phone) payload.Phone = lead.phone;
  if (lead.propertyAddress) payload.Street = lead.propertyAddress;
  if (lead.state) payload.State = lead.state;
  if (lead.county) payload.City = lead.county;
  if (lead.equityDollars !== undefined) payload.VEKTOR_Equity__c = lead.equityDollars;
  if (lead.investorType) payload.VEKTOR_Accredited_Status__c = lead.investorType;
  return payload;
}

export async function pushToSalesforce(lead: NormalizedLead, config: CrmSyncConfig): Promise<CrmSyncResult> {
  const provider = 'salesforce' as const;
  if (!config.apiKey) {
    return { provider, success: false, statusCode: 400, error: 'missing_api_key' };
  }
  const endpoint = config.endpointUrl || 'https://login.salesforce.com/services/data/v59.0/sobjects/Lead/';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(buildSalesforcePayload(lead)),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    let externalId: string | undefined;
    let text = '';
    try {
      text = await res.text();
      const json = text ? JSON.parse(text) : {};
      externalId = json?.id ? String(json.id) : undefined;
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
