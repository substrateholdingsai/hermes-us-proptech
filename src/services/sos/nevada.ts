import type { Env } from '../../types/env';
import { fetchText, pickMatch, normalizeStatus, inferEntityType } from './common';
import type { SOSEntityResult } from './types';

export async function resolveNevada(_env: Env, entityName: string): Promise<SOSEntityResult> {
  const url = `https://esos.nv.gov/EntitySearch/OnlineEntitySearch?searchTerm=${encodeURIComponent(entityName)}`;
  let html = '';
  try {
    html = await fetchText(url);
  } catch {
    html = '';
  }

  const filingNumber = pickMatch(html, /NV Business ID:\s*([A-Za-z0-9-]+)/i) || pickMatch(html, /Entity ID:\s*([A-Za-z0-9-]+)/i) || '';
  const statusRaw = pickMatch(html, /Status:\s*([A-Za-z ]+)/i);
  const formationDate = pickMatch(html, /Date of Registration:\s*([0-9\/]+)/i) || pickMatch(html, /Formation Date:\s*([0-9\/]+)/i);
  const agent = pickMatch(html, /Registered Agent:\s*([^\n<]+)/i) || 'Unknown';
  const agentAddress = pickMatch(html, /Registered Agent Address:\s*([^\n<]+)/i) || undefined;

  const officers: { name: string; role: string; address?: string }[] = [];
  const officerRegex = /([A-Z][A-Za-z ,.'-]+)\s*-\s*(Manager|Member|Officer|Director)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = officerRegex.exec(html)) !== null) {
    const _n = m[1]; const _r = m[2]; if (!_n || !_r) continue; officers.push({ name: _n.trim(), role: _r.trim() });
  }

  return {
    state: 'NV',
    entityName,
    filingNumber,
    status: normalizeStatus(statusRaw),
    formationDate,
    entityType: inferEntityType(entityName),
    registeredAgent: { name: agent.trim(), address: agentAddress?.trim() },
    officers,
    rawSourceUrl: url,
    isPrivacyState: true,
    uboCandidates: officers.map((o) => o.name),
  };
}
