import type { Env } from '../../types/env';
import { fetchText, pickMatch, normalizeStatus, inferEntityType } from './common';
import type { SOSEntityResult } from './types';

export async function resolveWyoming(_env: Env, entityName: string): Promise<SOSEntityResult> {
  const url = `https://wyobiz.wyo.gov/Business/FilingSearch.aspx?searchTerm=${encodeURIComponent(entityName)}`;
  let html = '';
  try {
    html = await fetchText(url);
  } catch {
    html = '';
  }

  const filingNumber = pickMatch(html, /Filing ID:\s*([A-Za-z0-9-]+)/i) || pickMatch(html, /Filing Number:\s*([A-Za-z0-9-]+)/i) || '';
  const statusRaw = pickMatch(html, /Status:\s*([A-Za-z ]+)/i);
  const formationDate = pickMatch(html, /Date of Formation:\s*([0-9\/]+)/i) || pickMatch(html, /Formation Date:\s*([0-9\/]+)/i);
  const agent = pickMatch(html, /Registered Agent:\s*([^\n<]+)/i) || 'Unknown';
  const agentAddress = pickMatch(html, /Registered Agent Address:\s*([^\n<]+)/i) || undefined;

  return {
    state: 'WY',
    entityName,
    filingNumber,
    status: normalizeStatus(statusRaw),
    formationDate,
    entityType: inferEntityType(entityName),
    registeredAgent: { name: agent.trim(), address: agentAddress?.trim() },
    officers: [],
    rawSourceUrl: url,
    isPrivacyState: true,
    uboCandidates: [],
  };
}
