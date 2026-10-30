import type { Env } from '../../types/env';

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function fetchText(url: string, timeoutMs = 15000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export function pickMatch(html: string, regex: RegExp): string | null {
  const m = html.match(regex);
  if (!m || m[1] === undefined) return null;
  return m[1].trim();
}

export function normalizeStatus(raw: string | null): import('./types').SOSEntityStatus {
  if (!raw) return 'unknown';
  const v = raw.toLowerCase();
  if (v.includes('active') || v.includes('good standing')) return 'active';
  if (v.includes('inactive')) return 'inactive';
  if (v.includes('forfeit')) return 'forfeited';
  if (v.includes('dissolv')) return 'dissolved';
  if (v.includes('good standing')) return 'in_good_standing';
  return 'unknown';
}

export function inferEntityType(name: string): 'llc' | 'corp' | 'trust' | 'lp' | 'other' {
  const n = name.toLowerCase();
  if (n.includes('trust')) return 'trust';
  if (n.includes(' llc') || n.endsWith(' llc') || n.includes('l.l.c')) return 'llc';
  if (n.includes(' corp') || n.includes(' inc') || n.includes(' corporation')) return 'corp';
  if (n.includes(' lp') || n.includes(' limited partnership')) return 'lp';
  return 'other';
}

export async function notifySandbox(env: Env, entityName: string, state: string): Promise<void> {
  if (!env.HERMES_SANDBOX) return;
  try {
    const id = env.HERMES_SANDBOX.idFromName(`sos-${state}-${entityName}`);
    const stub = env.HERMES_SANDBOX.get(id);
    await stub.fetch('http://sandbox.local/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: `sos_${Date.now()}`, taskType: 'entity_resolution', contextData: { entityName, state } }),
    });
  } catch {
    // ignore
  }
}
