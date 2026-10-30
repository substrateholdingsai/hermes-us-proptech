import type { Env } from '../../types/env';
import { fetchText, pickMatch, normalizeStatus, inferEntityType } from './common';
import type { SOSEntityResult } from './types';

export async function resolveTexas(_env: Env, entityName: string): Promise<SOSEntityResult> {
  const url = `https://mycpa.cpa.state.tx.us/coa/coaSearch.do?coaAction=search&coaSearchType=coaName&coaName=${encodeURIComponent(entityName)}`;
  let html = '';
  try {
    html = await fetchText(url);
  } catch {
    html = '';
  }

  const filingNumber = pickMatch(html, /SOS File Number:\s*([A-Za-z0-9-]+)/i) || pickMatch(html, /File Number:\s*([A-Za-z0-9-]+)/i) || '';
  const taxNumber = pickMatch(html, /Texas Taxpayer Number:\s*([A-Za-z0-9-]+)/i);
  const statusRaw = pickMatch(html, /Right to Transact Business:\s*([A-Za-z ]+)/i) || pickMatch(html, /Status:\s*([A-Za-z ]+)/i);
  const formationDate = pickMatch(html, /Incorporation Date:\s*([0-9\/]+)/i) || pickMatch(html, /Formation Date:\s*([0-9\/]+)/i);
  const agent = pickMatch(html, /Registered Agent:\s*([^\n<]+)/i) || 'Unknown';
  const agentAddress = pickMatch(html, /Registered Agent Address:\s*([^\n<]+)/i) || undefined;

  const officers: { name: string; role: string; address?: string }[] = [];
  const officerRegex = /([A-Z][A-Za-z ,.'-]+)\s*-\s*(Director|Officer|Manager|President|Member)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = officerRegex.exec(html)) !== null) {
    const _n = m[1]; const _r = m[2]; if (!_n || !_r) continue; officers.push({ name: _n.trim(), role: _r.trim() });
  }

  return {
    state: 'TX',
    entityName,
    filingNumber: filingNumber || (taxNumber ?? ''),
    status: normalizeStatus(statusRaw),
    formationDate,
    entityType: inferEntityType(entityName),
    registeredAgent: { name: agent.trim(), address: agentAddress?.trim() },
    officers,
    rawSourceUrl: url,
    isPrivacyState: false,
    uboCandidates: officers.map((o) => o.name),
  };
}
