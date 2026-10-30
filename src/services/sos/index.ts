import type { Env } from '../../types/env';
import type { SOSEntityResult, USStateCode } from './types';
import { resolveFlorida } from './florida';
import { resolveTexas } from './texas';
import { resolveWyoming } from './wyoming';
import { resolveDelaware } from './delaware';
import { resolveNevada } from './nevada';
import { notifySandbox } from './common';
import { logger } from '../../lib/logger';

async function inferUBOCandidates(env: Env, result: SOSEntityResult): Promise<string[]> {
  if (!env.AI) return result.uboCandidates;
  try {
    const model = env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    const prompt = `You are a US corporate intelligence analyst. Given a ${result.state} entity "${result.entityName}" with registered agent "${result.registeredAgent.name}" and officers ${JSON.stringify(result.officers)}, identify likely Ultimate Beneficial Owners (UBOs). Exclude registered agents and nominee services. Return a JSON array of candidate names only.`;
    const res = (await env.AI.run(model, { messages: [{ role: 'user', content: prompt }], max_tokens: 200 })) as { response?: string };
    const text = res?.response || '';
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const arr = JSON.parse(match[0]) as string[];
        if (Array.isArray(arr)) return arr.filter((x) => typeof x === 'string');
      } catch {
        // fall through
      }
    }
    return result.uboCandidates;
  } catch {
    return result.uboCandidates;
  }
}

export async function resolveSOSEntity(
  env: Env,
  params: { entityName: string; state: USStateCode; tenantId: string }
): Promise<SOSEntityResult> {
  const { entityName, state } = params;

  let result: SOSEntityResult;
  switch (state) {
    case 'FL':
      result = await resolveFlorida(env, entityName);
      break;
    case 'TX':
      result = await resolveTexas(env, entityName);
      break;
    case 'WY':
      result = await resolveWyoming(env, entityName);
      break;
    case 'DE':
      result = await resolveDelaware(env, entityName);
      break;
    case 'NV':
      result = await resolveNevada(env, entityName);
      break;
    default:
      throw new Error(`Unsupported state: ${state}`);
  }

  if (!result.filingNumber && !result.officers.length) {
    await notifySandbox(env, entityName, state);
  }

  if (result.isPrivacyState || result.officers.length === 0) {
    result.uboCandidates = await inferUBOCandidates(env, result);
  } else if (result.uboCandidates.length === 0) {
    result.uboCandidates = result.officers.map((o) => o.name);
  }

  logger.info('SOS resolution completed', { state, entityName, filingNumber: result.filingNumber });
  return result;
}
