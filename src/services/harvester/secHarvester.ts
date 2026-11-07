import type { TenantContext } from '../hermesAgent';
import type { HarvestParams, HarvestedLeadItem } from './types';
import { executeSkipTrace } from '../skiptrace';
import { newId, nowIso } from '../db';
import { searchFinra } from '../sec/finra';

const UA = 'HermesPropTech/1.0 (compliance@hermesproptech.internal)';

interface SecFiling {
  fundName: string;
  state: string;
  offeringAmount: number | null;
  minInvestment: number | null;
  officers: string[];
  sourceId: string | null;
  sourceUrl: string | null;
}

function formatMoney(n: number | null): string {
  if (n === null) return '';
  return `$${n.toLocaleString('en-US')}`;
}

async function enrich(ctx: TenantContext, name: string, autoEnrich: boolean): Promise<{
  phone: string; lineType: string; dncStatus: 'clean' | 'flagged' | 'unknown'; email: string; isTcpaSafe: boolean; accredited: boolean;
}> {
  let phone = '';
  let lineType = 'unknown';
  let dncStatus: 'clean' | 'flagged' | 'unknown' = 'unknown';
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
  const minAmount = params.minAmountDollars || 0;
  const leads: HarvestedLeadItem[] = [];
  const queriedAt = nowIso();

  let filings: SecFiling[] = [];
  try {
    const url = `https://efts.sec.gov/LATEST/search-index?forms=D&q=%22Real+Estate%22+OR+%22Pooled+Investment%22`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) {
      const arr: any = leads;
      arr.error = `sec_http_${res.status}`;
      return arr;
    }
    const data = (await res.json()) as any;
    const hits: any[] = data?.hits?.hits || data?.results || [];
    for (const h of hits) {
      const s = h?._source || h || {};
      const fundName = String(s.display_names?.[0] || s.entity_name || s.issuerName || '');
      if (!fundName) continue;
      const offeringAmountRaw = s.offeringAmount ?? s.offering_amount ?? null;
      const offeringAmount = offeringAmountRaw !== null && offeringAmountRaw !== undefined && offeringAmountRaw !== '' ? Number(offeringAmountRaw) : null;
      const minInvRaw = s.minimumInvestmentAccepted ?? s.minimum_investment_accepted ?? null;
      const minInvestment = minInvRaw !== null && minInvRaw !== undefined && minInvRaw !== '' ? Number(minInvRaw) : null;
      const officers = Array.isArray(s.executiveOfficers) ? s.executiveOfficers : (Array.isArray(s.officers) ? s.officers : []);
      filings.push({
        fundName,
        state: String(s.state || params.state || 'DE'),
        offeringAmount: Number.isFinite(offeringAmount as number) ? offeringAmount : null,
        minInvestment: Number.isFinite(minInvestment as number) ? minInvestment : null,
        officers,
        sourceId: String(s.accession_no || s.accessionNumber || h?._id || '') || null,
        sourceUrl: `https://efts.sec.gov/LATEST/search-index?forms=D`,
      });
    }
  } catch (err) {
    const arr: any = leads;
    arr.error = `sec_fetch_error: ${String(err)}`;
    return arr;
  }

  const filtered = filings.filter((f) => (minAmount ? (f.offeringAmount ?? 0) >= minAmount : true)).filter((f) => !params.state || f.state === params.state);

  for (const filing of filtered) {
    const officers = filing.officers.length ? filing.officers : [];
    if (officers.length === 0) {
      // missing officers -> single lead with null contact
      if (leads.length >= limit) break;
      const e = await enrich(ctx, filing.fundName, false);
      leads.push({
        id: newId('harvest'),
        source: 'sec_form_d',
        entityOrFundName: filing.fundName,
        primaryContactName: null,
        contactRole: null,
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
        verificationStatus: 'verified',
        dataSource: 'sec_edgar',
        sourceUrl: filing.sourceUrl,
        sourceId: filing.sourceId,
        verifiedAt: queriedAt,
        queriedAt,
      });
      continue;
    }
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
        verificationStatus: 'verified',
        dataSource: 'sec_edgar',
        sourceUrl: filing.sourceUrl,
        sourceId: filing.sourceId,
        verifiedAt: queriedAt,
        queriedAt,
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
  // No authorized automated access implemented: do not simulate with fixed data.
  const leads: any = [];
  leads.error = 'source_disabled_no_authorized_access';
  leads.disabled = true;
  return leads;
}
