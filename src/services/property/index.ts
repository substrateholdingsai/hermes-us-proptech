import type { Env } from '../../types/env';
import type { TenantContext } from '../hermesAgent';
import type { PropertyRecordResult } from './types';
import { tryAggregator } from './aggregator';
import { resolveMiamiDade } from './counties/miamiDade';
import { resolveOrangeFL } from './counties/orangeFl';
import { resolveHarrisTX } from './counties/harrisTx';
import { resolveDallasTX } from './counties/dallasTx';
import { resolveClarkNV } from './counties/clarkNv';
import { logger } from '../../lib/logger';

function aiEstimatedFallback(address: string, state: string): PropertyRecordResult {
  const market = 35000000;
  const mortgage = 21000000;
  const equity = market - mortgage;
  return {
    address,
    county: 'Unknown',
    state,
    parcelId: '',
    assessedValueCents: Math.round(market * 0.85),
    marketValueCents: market,
    mortgageBalanceCents: mortgage,
    equityCents: equity,
    equityPercent: Math.round((equity / market) * 100),
    taxAmountCents: Math.round(market * 0.012),
    isTaxDelinquent: false,
    lastSaleDate: null,
    lastSalePriceCents: null,
    ownerName: 'Unknown',
    ownerType: 'unknown',
    dataSource: 'ai_estimated',
  };
}

async function aiEstimate(env: Env, address: string, state: string): Promise<PropertyRecordResult> {
  if (!env.AI) return aiEstimatedFallback(address, state);
  try {
    const model = env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
    const prompt = `Estimate US property values for address "${address}" in ${state}. Return strict JSON with keys: marketValueCents (number), mortgageBalanceCents (number), taxAmountCents (number), assessedValueCents (number), lastSaleDate (string or null), ownerName (string), county (string). Conservative estimates.`;
    const res = (await env.AI.run(model, { messages: [{ role: 'user', content: prompt }], max_tokens: 300 })) as { response?: string };
    const text = res?.response || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const data = JSON.parse(match[0]) as Record<string, unknown>;
      const market = Number(data.marketValueCents) || 35000000;
      const mortgage = Number(data.mortgageBalanceCents) || Math.round(market * 0.6);
      const equity = market - mortgage;
      return {
        address,
        county: String(data.county || 'Unknown'),
        state,
        parcelId: '',
        assessedValueCents: Number(data.assessedValueCents) || Math.round(market * 0.85),
        marketValueCents: market,
        mortgageBalanceCents: mortgage,
        equityCents: equity,
        equityPercent: market > 0 ? Math.round((equity / market) * 100) : 0,
        taxAmountCents: Number(data.taxAmountCents) || Math.round(market * 0.012),
        isTaxDelinquent: false,
        lastSaleDate: (data.lastSaleDate as string) || null,
        lastSalePriceCents: null,
        ownerName: String(data.ownerName || 'Unknown'),
        ownerType: 'unknown',
        dataSource: 'ai_estimated',
      };
    }
  } catch {
    // fall through
  }
  return aiEstimatedFallback(address, state);
}

export async function resolvePropertyEquity(
  ctx: TenantContext,
  params: { propertyAddress: string; state?: string }
): Promise<PropertyRecordResult> {
  const address = params.propertyAddress;
  const state = params.state || 'US';

  const agg = await tryAggregator(ctx.env, { propertyAddress: address, state });
  if (agg) return agg;

  const resolvers: Array<(env: Env, p: { propertyAddress: string; state?: string }) => Promise<PropertyRecordResult | null>> = [];
  const lowerAddr = address.toLowerCase();
  if (state === 'FL') {
    if (lowerAddr.includes('miami')) resolvers.push(resolveMiamiDade);
    if (lowerAddr.includes('orlando') || lowerAddr.includes('orange')) resolvers.push(resolveOrangeFL);
    if (resolvers.length === 0) resolvers.push(resolveMiamiDade, resolveOrangeFL);
  } else if (state === 'TX') {
    if (lowerAddr.includes('houston') || lowerAddr.includes('harris')) resolvers.push(resolveHarrisTX);
    if (lowerAddr.includes('dallas')) resolvers.push(resolveDallasTX);
    if (resolvers.length === 0) resolvers.push(resolveHarrisTX, resolveDallasTX);
  } else if (state === 'NV') {
    resolvers.push(resolveClarkNV);
  }

  for (const resolve of resolvers) {
    try {
      const r = await resolve(ctx.env, { propertyAddress: address, state });
      if (r) return r;
    } catch (err) {
      logger.warn('County resolver failed:', { error: String(err) });
    }
  }

  return {
    address,
    county: 'Sin datos',
    state,
    parcelId: '',
    assessedValueCents: 0,
    marketValueCents: 0,
    mortgageBalanceCents: 0,
    equityCents: 0,
    equityPercent: 0,
    taxAmountCents: 0,
    isTaxDelinquent: false,
    lastSaleDate: null,
    lastSalePriceCents: null,
    ownerName: 'Sin datos',
    ownerType: 'unknown',
    dataSource: 'none',
  };
}
