import type { HarvestedLeadItem } from './types';

export const LEAD_SCORE_THRESHOLD = 60;

export function scoreLead(lead: HarvestedLeadItem): number {
  let score = 0;

  const capital = Number(lead.capitalOrDealSizeDollars) || 0;
  if (capital >= 50_000_000) score += 40;
  else if (capital >= 10_000_000) score += 30;
  else if (capital >= 1_000_000) score += 20;
  else if (capital >= 100_000) score += 10;

  const realEstateSources = new Set([
    'sec_form_d',
    'siger_sapi',
    'luxury_cash_buyers',
    'rppyc_luxury_acquisitions',
  ]);
  if (realEstateSources.has(lead.source)) score += 20;

  const harvestedMs = Date.parse(lead.harvestedAt);
  if (Number.isFinite(harvestedMs)) {
    const days = (Date.now() - harvestedMs) / (1000 * 60 * 60 * 24);
    if (days <= 7) score += 20;
    else if (days <= 30) score += 15;
    else if (days <= 90) score += 10;
    else score += 5;
  }

  const hasEmail = !!lead.email;
  const hasPhone = !!lead.phone;
  if (hasEmail && hasPhone) score += 20;
  else if (hasEmail || hasPhone) score += 10;

  if (score < 0) score = 0;
  if (score > 100) score = 100;
  return Math.round(score);
}

export const scoreHarvestedLead = scoreLead;
export const calculateLeadScore = scoreLead;
export const leadScore = scoreLead;
