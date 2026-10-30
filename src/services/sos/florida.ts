import type { Env } from '../../types/env';
import { fetchText, pickMatch, normalizeStatus, inferEntityType } from './common';
import type { SOSEntityResult } from './types';

export async function resolveFlorida(_env: Env, entityName: string): Promise<SOSEntityResult> {
  const url = `https://search.sunbiz.org/Inquiry/CorporationSearch/ByName?corporateName=${encodeURIComponent(entityName)}`;
  let html = '';
  try {
    html = await fetchText(url);
  } catch {
    html = '';
  }

  const filingNumber = pickMatch(html, /Document Number:\s*([A-Za-z0-9]+)/i) || '';
  const statusRaw = pickMatch(html, /Status:\s*([A-Za-z ]+)/i);
  const formationDate = pickMatch(html, /Date Filed:\s*([0-9\/]+)/i);
  const agent = pickMatch(html, /Registered Agent Name:\s*([^\n<]+)/i) || 'Unknown';
  const agentAddress = pickMatch(html, /Registered Agent Address:\s*([^\n<]+)/i) || undefined;
  const principalAddress = pickMatch(html, /Principal Address:\s*([^\n<]+)/i) || undefined;

  const officers: { name: string; role: string; address?: string }[] = [];
  const officerRegex = /([A-Z][A-Za-z ,.'-]+)\s*-\s*(Manager|Managing Member|President|Director|MGRM?|MGR)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = officerRegex.exec(html)) !== null) {
    const _n = m[1]; const _r = m[2]; if (!_n || !_r) continue; officers.push({ name: _n.trim(), role: _r.trim(), address: undefined });
  }

  return {
    state: 'FL',
    entityName,
    filingNumber,
    status: normalizeStatus(statusRaw),
    formationDate,
    entityType: inferEntityType(entityName),
    registeredAgent: { name: agent.trim(), address: agentAddress?.trim() },
    principalAddress: principalAddress?.trim(),
    officers,
    rawSourceUrl: url,
    isPrivacyState: false,
    uboCandidates: officers.map((o) => o.name),
  };
}
