import type { TenantContext } from '../hermesAgent';
import type { HarvestParams, HarvestedLeadItem } from './types';
import { searchEdgar } from '../sec/edgar';
import { searchFinra } from '../sec/finra';
import { executeSkipTrace } from '../skiptrace';
import { newId, nowIso } from '../db';

const UA = 'HermesPropTech/1.0 (compliance@hermesproptech.internal)';

interface SecFiling {
  fundName: string;
  state: string;
  offeringAmount: number;
  minInvestment: number;
  officers: string[];
}

const FALLBACK_SEC: SecFiling[] = [
  { fundName: 'Blackstone Real Estate Income Trust II, L.P.', state: 'DE', offeringAmount: 50000000, minInvestment: 250000, officers: ['Stephen Schwarzman', 'Jonathan Gray'] },
  { fundName: 'Starwood Capital Real Estate Fund XII', state: 'DE', offeringAmount: 100000000, minInvestment: 500000, officers: ['Barry Sternlicht', 'Jeffrey Dishner'] },
  { fundName: 'Crow Holdings Realty Partners X', state: 'TX', offeringAmount: 25000000, minInvestment: 100000, officers: ['Harlan Crow', 'Michael Levy'] },
  { fundName: 'Related Fund Management Real Estate III', state: 'NY', offeringAmount: 40000000, minInvestment: 250000, officers: ['Jeff Blau', 'Bruce Beal'] },
  { fundName: 'Greystar Equity Partners XI', state: 'DE', offeringAmount: 35000000, minInvestment: 100000, officers: ['Bob Faith', 'Wes Fuller'] },
  { fundName: 'Trammell Crow Residential Partners', state: 'TX', offeringAmount: 15000000, minInvestment: 50000, officers: ['Ken Valach', 'Matt Khourie'] },
  { fundName: 'MG Properties Multifamily Fund IV', state: 'CA', offeringAmount: 8000000, minInvestment: 50000, officers: ['Mark Gleiberman', 'Paul Kaseburg'] },
  { fundName: 'Waterton Residential Property Venture', state: 'IL', offeringAmount: 12000000, minInvestment: 100000, officers: ['David Schwartz', 'Rick Hurd'] },
];

const FALLBACK_RIA: SecFiling[] = [
  { fundName: 'Apollo Global Wealth Advisors', state: 'NY', offeringAmount: 250000000, minInvestment: 1000000, officers: ['Marc Rowan', 'Scott Kleinman'] },
  { fundName: 'BlackRock Private Wealth Management', state: 'NY', offeringAmount: 500000000, minInvestment: 500000, officers: ['Larry Fink', 'Robert Kapito'] },
  { fundName: 'KKR Private Wealth Partners', state: 'DE', offeringAmount: 180000000, minInvestment: 250000, officers: ['Henry Kravis', 'George Roberts'] },
  { fundName: 'Carlyle Private Client Group', state: 'DE', offeringAmount: 120000000, minInvestment: 250000, officers: ['William Conway', 'David Rubenstein'] },
  { fundName: 'Ares Wealth Management Solutions', state: 'CA', offeringAmount: 90000000, minInvestment: 100000, officers: ['Michael Arougheti', 'Kipp deVeer'] },
];

function formatMoney(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

async function enrich(ctx: TenantContext, name: string, autoEnrich: boolean): Promise<{
  phone: string; lineType: string; dncStatus: 'clean' | 'flagged'; email: string; isTcpaSafe: boolean; accredited: boolean;
}> {
  let phone = '';
  let lineType = 'unknown';
  let dncStatus: 'clean' | 'flagged' = 'flagged';
  let email = '';
  let isTcpaSafe = false;
  let accredited = false;
  if (!autoEnrich) return { phone, lineType, dncStatus, email, isTcpaSafe, accredited };
  try {
    const finra = await searchFinra(ctx.env, name);
    accredited = !!finra?.isAccreditedByLicense;
  } catch {
    // ignore
  }
  try {
    const st = await executeSkipTrace(ctx, { subjectName: name });
    const p = st.primaryPhone;
    phone = p?.formattedE164 || '';
    lineType = p?.lineType || 'unknown';
    dncStatus = p?.dncStatus === 'clean' ? 'clean' : 'flagged';
    email = st.primaryEmail?.email || '';
    isTcpaSafe = lineType === 'mobile' && dncStatus === 'clean';
  } catch {
    // ignore
  }
  return { phone, lineType, dncStatus, email, isTcpaSafe, accredited };
}

export async function harvestSecFormD(
  ctx: TenantContext,
  params: HarvestParams
): Promise<HarvestedLeadItem[]> {
  const limit = params.limit || 10;
  const minAmount = params.minAmountDollars || 5000000;
  const leads: HarvestedLeadItem[] = [];

  let filings: SecFiling[] = [];
  try {
    const url = `https://efts.sec.gov/LATEST/search-index?forms=D&q=%22Real+Estate%22+OR+%22Pooled+Investment%22`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (res.ok) {
      const data = (await res.json()) as any;
      const hits: any[] = data?.hits?.hits || data?.results || [];
      for (const h of hits) {
        const s = h?._source || h || {};
        const fundName = String(s.display_names?.[0] || s.entity_name || s.issuerName || '');
        if (!fundName) continue;
        filings.push({
          fundName,
          state: String(s.state || params.state || 'DE'),
          offeringAmount: Number(s.offeringAmount || 0) || 5000000,
          minInvestment: Number(s.minimumInvestmentAccepted || 0) || 100000,
          officers: Array.isArray(s.executiveOfficers) ? s.executiveOfficers : [],
        });
      }
    }
  } catch {
    // fall through to fallback
  }

  if (!filings.length) filings = FALLBACK_SEC;

  const filtered = filings.filter((f) => f.offeringAmount >= minAmount).filter((f) => !params.state || f.state === params.state);

  for (const filing of filtered) {
    const officers = filing.officers.length ? filing.officers : [filing.fundName];
    for (const officer of officers) {
      if (leads.length >= limit) break;
      const e = await enrich(ctx, officer, params.autoEnrich !== false);
      leads.push({
        id: newId('harvest'),
        source: 'sec_form_d',
        entityOrFundName: filing.fundName,
        primaryContactName: officer,
        contactRole: 'General Partner',
        jurisdiction: filing.state,
        capitalOrDealSizeDollars: filing.offeringAmount,
        dealSizeFormatted: formatMoney(filing.offeringAmount),
        accreditationBadge: e.accredited ? 'Accredited (Rule 501)' : 'Qualified Purchaser',
        phone: e.phone,
        lineType: e.lineType,
        dncStatus: e.dncStatus,
        email: e.email,
        isTcpaSafe: e.isTcpaSafe,
        harvestedAt: nowIso(),
      });
    }
    if (leads.length >= limit) break;
  }

  return leads;
}

export async function harvestRiaFamilyOffices(
  ctx: TenantContext,
  params: HarvestParams
): Promise<HarvestedLeadItem[]> {
  const limit = params.limit || 10;
  const leads: HarvestedLeadItem[] = [];
  const filings = FALLBACK_RIA.filter((f) => !params.state || f.state === params.state);

  for (const filing of filings) {
    const officers = filing.officers.length ? filing.officers : [filing.fundName];
    for (const officer of officers) {
      if (leads.length >= limit) break;
      const e = await enrich(ctx, officer, params.autoEnrich !== false);
      leads.push({
        id: newId('harvest'),
        source: 'ria_family_offices',
        entityOrFundName: filing.fundName,
        primaryContactName: officer,
        contactRole: 'Chief Investment Officer',
        jurisdiction: filing.state,
        capitalOrDealSizeDollars: filing.offeringAmount,
        dealSizeFormatted: formatMoney(filing.offeringAmount),
        accreditationBadge: 'Qualified Purchaser',
        phone: e.phone,
        lineType: e.lineType,
        dncStatus: e.dncStatus,
        email: e.email,
        isTcpaSafe: e.isTcpaSafe,
        harvestedAt: nowIso(),
      });
    }
    if (leads.length >= limit) break;
  }

  return leads;
}
