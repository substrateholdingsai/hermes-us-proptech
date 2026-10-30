import type { NormalizedLead, CrmSyncConfig, CrmSyncResult } from './types';

function splitName(lead: NormalizedLead): { firstname: string; lastname: string } {
  if (lead.firstName || lead.lastName) {
    return { firstname: lead.firstName || '', lastname: lead.lastName || '' };
  }
  const parts = lead.fullName.trim().split(/\s+/);
  return { firstname: parts[0] || '', lastname: parts.slice(1).join(' ') };
}

export function buildHubSpotPayload(lead: NormalizedLead): Record<string, unknown> {
  const { firstname, lastname } = splitName(lead);
  const properties: Record<string, unknown> = {
    firstname,
    lastname,
  };
  if (lead.email) properties.email = lead.email;
  if (lead.phone) properties.phone = lead.phone;
  if (lead.propertyAddress) properties.address = lead.propertyAddress;
  if (lead.state) properties.state = lead.state;
  if (lead.county) properties.city = lead.county;
  if (lead.equityDollars !== undefined) properties.vektor_equity = lead.equityDollars;
  if (lead.investorType) properties.vektor_accredited_status = lead.investorType;
  if (lead.dncStatus) properties.vektor_dnc_clean = lead.dncStatus === 'clean';
  if (lead.marketValueDollars !== undefined) properties.vektor_market_value = lead.marketValueDollars;
  if (lead.equityPercent !== undefined) properties.vektor_equity_percent = lead.equityPercent;
  if (lead.uboName) properties.vektor_ubo_name = lead.uboName;
  return { properties };
}

export async function pushToHubSpot(lead: NormalizedLead, config: CrmSyncConfig): Promise<CrmSyncResult> {
  const provider = 'hubspot' as const;
  if (!config.apiKey) {
    return { provider, success: false, statusCode: 400, error: 'missing_api_key' };
  }
  const endpoint = config.endpointUrl || 'https://api.hubspot.com/crm/v3/objects/contacts';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(buildHubSpotPayload(lead)),
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
