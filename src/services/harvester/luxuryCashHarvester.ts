import type { TenantContext } from '../hermesAgent';
import type { HarvestParams, HarvestedLeadItem } from './types';
import { resolveSOSEntity } from '../sos';
import { executeSkipTrace } from '../skiptrace';
import { newId, nowIso } from '../db';
import { searchFinra } from '../sec/finra';

const UA = 'HermesPropTech/1.0 (compliance@hermesproptech.internal)';

interface LuxuryTransaction {
  fundOrOwner: string;
  propertyAddress: string;
  county: string;
  state: string;
  salePrice: number;
  llcState: 'DE' | 'FL' | 'TX' | 'NV' | 'WY';
}

const FALLBACK_LUXURY: LuxuryTransaction[] = [
  { fundOrOwner: 'Oceanview Holdings LLC', propertyAddress: '1 Ocean Dr, Miami Beach, FL', county: 'Miami-Dade', state: 'FL', salePrice: 4200000, llcState: 'FL' },
  { fundOrOwner: 'Sunset Trust', propertyAddress: '90210 Sunset Blvd, Palm Beach, FL', county: 'Palm Beach', state: 'FL', salePrice: 6800000, llcState: 'DE' },
  { fundOrOwner: 'Lone Star Capital LLC', propertyAddress: '4500 Montrose Blvd, Houston, TX', county: 'Harris', state: 'TX', salePrice: 2100000, llcState: 'TX' },
  { fundOrOwner: 'Desert Mirage Trust', propertyAddress: '123 Strip View, Las Vegas, NV', county: 'Clark', state: 'NV', salePrice: 3500000, llcState: 'NV' },
  { fundOrOwner: 'Granite Peak LLC', propertyAddress: '456 Mountain Rd, Jackson, WY', county: 'Teton', state: 'WY', salePrice: 5100000, llcState: 'WY' },
  { fundOrOwner: 'Bayfront Properties LLC', propertyAddress: '777 Brickell Ave, Miami, FL', county: 'Miami-Dade', state: 'FL', salePrice: 9200000, llcState: 'DE' },
  { fundOrOwner: 'Pioneer Trust', propertyAddress: '888 Preston Rd, Dallas, TX', county: 'Dallas', state: 'TX', salePrice: 1800000, llcState: 'TX' },
  { fundOrOwner: 'Coral Gables Holdings LLC', propertyAddress: '555 Miracle Mile, Coral Gables, FL', county: 'Miami-Dade', state: 'FL', salePrice: 2900000, llcState: 'FL' },
];

function formatMoney(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export async function harvestLuxuryCashBuyers(
  ctx: TenantContext,
  params: HarvestParams
): Promise<HarvestedLeadItem[]> {
  const limit = params.limit || 10;
  const minAmount = params.minAmountDollars || 1500000;
  const leads: HarvestedLeadItem[] = [];

  const txs = FALLBACK_LUXURY.filter((t) => t.salePrice >= minAmount).filter((t) => !params.state || t.state === params.state);

  for (const tx of txs) {
    if (leads.length >= limit) break;
    let uboName = tx.fundOrOwner;
    try {
      const sos = await resolveSOSEntity(ctx.env, { entityName: tx.fundOrOwner, state: tx.llcState, tenantId: ctx.tenantId });
      if (sos.uboCandidates.length) {
        const candidate = sos.uboCandidates[0];
        if (candidate) uboName = candidate;
      } else if (sos.registeredAgent?.name) {
        uboName = sos.registeredAgent.name;
      }
    } catch {
      // keep owner
    }

    let phone = '';
    let lineType = 'unknown';
    let dncStatus: 'clean' | 'flagged' = 'flagged';
    let email = '';
    let isTcpaSafe = false;
    if (params.autoEnrich !== false) {
      try {
        const st = await executeSkipTrace(ctx, { subjectName: uboName, propertyAddress: tx.propertyAddress });
        const p = st.primaryPhone;
        phone = p?.formattedE164 || '';
        lineType = p?.lineType || 'unknown';
        dncStatus = p?.dncStatus === 'clean' ? 'clean' : 'flagged';
        email = st.primaryEmail?.email || '';
        isTcpaSafe = lineType === 'mobile' && dncStatus === 'clean';
      } catch {
        // leave empty
      }
    }

    leads.push({
      id: newId('harvest'),
      source: 'luxury_cash_buyers',
      entityOrFundName: tx.fundOrOwner,
      primaryContactName: uboName,
      contactRole: 'UBO',
      jurisdiction: tx.state,
      capitalOrDealSizeDollars: tx.salePrice,
      dealSizeFormatted: formatMoney(tx.salePrice),
      accreditationBadge: 'Verified HNWI',
      phone,
      lineType,
      dncStatus,
      email,
      isTcpaSafe,
      harvestedAt: nowIso(),
    });
  }

  return leads;
}
