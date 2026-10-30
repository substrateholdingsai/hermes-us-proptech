import type { Env } from '../../types/env';
import { logger } from '../../lib/logger';
import { notifySandbox } from '../sos/common';

export async function searchContacts(
  env: Env,
  params: { subjectName: string; propertyAddress?: string }
): Promise<{ phones: string[]; emails: string[]; source: string }> {
  const { subjectName, propertyAddress } = params;

  // Commercial APIs (best effort) - if keys present, attempt; on any failure fall through.
  if (env.BATCHDATA_API_KEY) {
    try {
      const res = await fetch('https://api.batchdata.com/api/v1/property/skip-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.BATCHDATA_API_KEY}` },
        body: JSON.stringify({ name: subjectName, address: propertyAddress }),
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const phones = (data?.phones || []).map((p: any) => String(p?.number || p)).filter(Boolean);
        const emails = (data?.emails || []).map((e: any) => String(e?.email || e)).filter(Boolean);
        if (phones.length || emails.length) return { phones, emails, source: 'batchdata' };
      }
    } catch {
      // fall through
    }
  }

  if (env.HERMES_SANDBOX) {
    try {
      await notifySandbox(env, subjectName, 'skip_trace');
    } catch {
      // ignore
    }
  }

  if (env.AI) {
    try {
      const model = env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
      const prompt = `You are a skip-tracing assistant. Subject: "${subjectName}". Property: "${propertyAddress || 'N/A'}". Generate plausible US contact candidates. Return strict JSON: { "phones": ["+1..."], "emails": ["name@example.com"] }. 1-3 each.`;
      const res = (await env.AI.run(model, { messages: [{ role: 'user', content: prompt }], max_tokens: 200 })) as { response?: string };
      const text = res?.response || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]) as { phones?: string[]; emails?: string[] };
        return {
          phones: Array.isArray(data.phones) ? data.phones : [],
          emails: Array.isArray(data.emails) ? data.emails : [],
          source: 'ai_estimated',
        };
      }
    } catch (err) {
      logger.warn('AI skip-trace enrichment failed:', { error: String(err) });
    }
  }

  return { phones: [], emails: [], source: 'none' };
}
