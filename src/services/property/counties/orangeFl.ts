import type { Env } from '../../../types/env';
import type { PropertyRecordResult } from '../types';

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

function estimateMortgage(market: number, salePrice: number | null, saleDate: string | null): number {
  if (!salePrice || salePrice <= 0) return 0;
  let principal = Math.round(salePrice * 0.8);
  if (saleDate) {
    const d = new Date(saleDate);
    if (!isNaN(d.getTime())) {
      const years = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (years >= 15) principal = Math.round(principal * 0.3);
      else if (years >= 5) principal = Math.round(principal * (1 - years / 30));
    }
  }
  if (principal < 0) principal = 0;
  if (principal > market) principal = market;
  return principal;
}

function inferOwnerType(name: string): 'individual' | 'entity' | 'trust' | 'unknown' {
  const n = name.toLowerCase();
  if (n.includes('trust')) return 'trust';
  if (n.includes('llc') || n.includes('inc') || n.includes('corp') || n.includes('ltd')) return 'entity';
  if (name.trim().length > 0) return 'individual';
  return 'unknown';
}

export async function resolveOrangeFL(
  _env: Env,
  params: { propertyAddress: string; state?: string }
): Promise<PropertyRecordResult | null> {
  const address = params.propertyAddress;
  const url = `https://www.ocpafl.org/searches/parcelSearch.aspx?search=${encodeURIComponent(address)}`;
  let html = '';
  try {
    html = await fetchText(url);
  } catch {
    return null;
  }
  const parcelId = (html.match(/Parcel ID:\s*([A-Za-z0-9-]+)/i)?.[1] || '').trim();
  const ownerName = (html.match(/Owner:\s*([^\n<]+)/i)?.[1] || 'Unknown').trim();
  const assessed = parseFloat(html.match(/Assessed Value:\s*\$?([\d,]+)/i)?.[1]?.replace(/,/g, '') || '0');
  const market = parseFloat(html.match(/Market Value:\s*\$?([\d,]+)/i)?.[1]?.replace(/,/g, '') || '0');
  const tax = parseFloat(html.match(/Tax Amount:\s*\$?([\d,]+)/i)?.[1]?.replace(/,/g, '') || '0');
  const saleDateMatch = html.match(/Sale Date:\s*([0-9\/]+)/i)?.[1] || null;
  const salePrice = parseFloat(html.match(/Sale Price:\s*\$?([\d,]+)/i)?.[1]?.replace(/,/g, '') || '0');

  if (!parcelId && !market) return null;

  const marketCents = toCents(market || assessed);
  const assessedCents = toCents(assessed || market);
  const taxCents = toCents(tax);
  const salePriceCents = salePrice > 0 ? toCents(salePrice) : null;
  const mortgage = estimateMortgage(marketCents, salePriceCents, saleDateMatch);
  const equity = marketCents - mortgage;
  const equityPercent = marketCents > 0 ? Math.round((equity / marketCents) * 100) : 0;

  return {
    address,
    county: 'Orange',
    state: params.state || 'FL',
    parcelId,
    assessedValueCents: assessedCents,
    marketValueCents: marketCents,
    mortgageBalanceCents: mortgage,
    equityCents: equity,
    equityPercent,
    taxAmountCents: taxCents,
    isTaxDelinquent: /delinquent/i.test(html),
    lastSaleDate: saleDateMatch,
    lastSalePriceCents: salePriceCents,
    ownerName,
    ownerType: inferOwnerType(ownerName),
    dataSource: 'county_assessor',
  };
}
