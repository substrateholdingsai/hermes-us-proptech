import type { Env } from '../../types/env';
import type { PropertyRecordResult } from './types';

interface RentCastProperty {
  formattedAddress?: string;
  county?: string;
  state?: string;
  apn?: string;
  assessedValue?: number;
  price?: number;
  taxAssessedValue?: number;
  propertyTaxes?: { total?: number };
  lastSaleDate?: string;
  lastSalePrice?: number;
  ownerName?: string;
  ownerOccupied?: boolean;
}

async function fetchJson(url: string, headers: Record<string, string>): Promise<any> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

function toCents(dollars: number | undefined | null): number {
  if (typeof dollars !== 'number' || !Number.isFinite(dollars)) return 0;
  return Math.round(dollars * 100);
}

function inferOwnerType(name: string): 'individual' | 'entity' | 'trust' | 'unknown' {
  const n = name.toLowerCase();
  if (n.includes('trust')) return 'trust';
  if (n.includes('llc') || n.includes('inc') || n.includes('corp') || n.includes('ltd')) return 'entity';
  if (name.trim().length > 0) return 'individual';
  return 'unknown';
}

export async function tryAggregator(
  env: Env,
  params: { propertyAddress: string; state?: string }
): Promise<PropertyRecordResult | null> {
  const address = params.propertyAddress;

  // RentCast
  if (env.RENTCAST_API_KEY) {
    try {
      const url = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}`;
      const data = await fetchJson(url, { 'X-Api-Key': env.RENTCAST_API_KEY, Accept: 'application/json' });
      const prop: RentCastProperty | undefined = Array.isArray(data) ? data[0] : data;
      if (prop) {
        const assessed = toCents(prop.assessedValue ?? prop.taxAssessedValue);
        const market = toCents(prop.price ?? prop.assessedValue);
        const tax = toCents(prop.propertyTaxes?.total);
        const lastSalePrice = prop.lastSalePrice != null ? toCents(prop.lastSalePrice) : null;
        const mortgage = estimateMortgage(market, lastSalePrice, prop.lastSaleDate ?? null);
        const equity = market - mortgage;
        const equityPercent = market > 0 ? Math.round((equity / market) * 100) : 0;
        const ownerName = prop.ownerName || 'Unknown';
        return {
          address,
          county: prop.county || 'Unknown',
          state: prop.state || params.state || 'US',
          parcelId: prop.apn || '',
          assessedValueCents: assessed,
          marketValueCents: market,
          mortgageBalanceCents: mortgage,
          equityCents: equity,
          equityPercent,
          taxAmountCents: tax,
          isTaxDelinquent: false,
          lastSaleDate: prop.lastSaleDate || null,
          lastSalePriceCents: lastSalePrice,
          ownerName,
          ownerType: inferOwnerType(ownerName),
          dataSource: 'aggregator',
        };
      }
    } catch {
      // fall through
    }
  }

  // ATTOM (best effort)
  if (env.ATTOM_API_KEY) {
    try {
      const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(address)}`;
      const data = await fetchJson(url, { apikey: env.ATTOM_API_KEY, Accept: 'application/json' });
      const prop = data?.property?.[0];
      if (prop) {
        const assessed = toCents(prop.assessment?.assessed?.assdTtlValue);
        const market = toCents(prop.assessment?.market?.mktTtlValue ?? prop.assessment?.assessed?.assdTtlValue);
        const tax = toCents(prop.assessment?.tax?.taxAmt);
        const lastSalePrice = prop.sale?.amount?.saleAmt ? toCents(prop.sale.amount.saleAmt) : null;
        const lastSaleDate = prop.sale?.amount?.saleRecDate || null;
        const mortgage = estimateMortgage(market, lastSalePrice, lastSaleDate);
        const equity = market - mortgage;
        const equityPercent = market > 0 ? Math.round((equity / market) * 100) : 0;
        const ownerName = prop.owner?.owner1?.fullName || 'Unknown';
        return {
          address,
          county: prop.address?.county || 'Unknown',
          state: prop.address?.state || params.state || 'US',
          parcelId: prop.identifier?.apn || '',
          assessedValueCents: assessed,
          marketValueCents: market,
          mortgageBalanceCents: mortgage,
          equityCents: equity,
          equityPercent,
          taxAmountCents: tax,
          isTaxDelinquent: false,
          lastSaleDate,
          lastSalePriceCents: lastSalePrice,
          ownerName,
          ownerType: inferOwnerType(ownerName),
          dataSource: 'aggregator',
        };
      }
    } catch {
      // fall through
    }
  }

  return null;
}

function estimateMortgage(marketValueCents: number, lastSalePriceCents: number | null, lastSaleDate: string | null): number {
  if (!lastSalePriceCents || lastSalePriceCents <= 0) return 0;
  // initial loan ~80% LTV
  let principal = Math.round(lastSalePriceCents * 0.8);
  if (!lastSaleDate) return principal;
  const sale = new Date(lastSaleDate);
  if (isNaN(sale.getTime())) return principal;
  const years = (Date.now() - sale.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (years >= 15) {
    // amortized heavily / possibly free and clear
    principal = Math.round(principal * 0.3);
  } else if (years >= 5) {
    principal = Math.round(principal * (1 - years / 30));
  }
  if (principal < 0) principal = 0;
  // cap at market value
  if (principal > marketValueCents) principal = marketValueCents;
  return principal;
}
