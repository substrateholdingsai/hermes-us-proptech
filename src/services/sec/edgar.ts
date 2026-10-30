import type { FormDFiling, FormADVFiling } from './types';

const SEC_UA = 'HermesPropTech/1.0 (compliance@hermesproptech.internal)';

export async function searchEdgar(query: string): Promise<{ formD: FormDFiling[]; formADV: FormADVFiling | null }> {
  const url = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(query)}&forms=D,ADV`;
  const result = { formD: [] as FormDFiling[], formADV: null as FormADVFiling | null };
  try {
    const res = await fetch(url, { headers: { 'User-Agent': SEC_UA, Accept: 'application/json' } });
    if (!res.ok) return result;
    const data = (await res.json()) as any;
    const hits: any[] = data?.hits?.hits || data?.results || [];
    for (const h of hits) {
      const s = h?._source || h || {};
      const formType = String(s.form_type || s.forms || s.form || '').toUpperCase();
      const displayName = (Array.isArray(s.display_names) ? s.display_names[0] : s.display_names) || s.entity_name || query;
      if (formType.includes('ADV')) {
        if (!result.formADV) {
          result.formADV = {
            crdNumber: String(s.crdNumber || ''),
            secNumber: String(s.secNumber || (Array.isArray(s.ciks) ? s.ciks[0] : s.ciks) || ''),
            primaryBusinessName: String(displayName),
            regulatoryAumDollars: Number(s.regulatoryAumDollars || s.aum || 0),
            hasHighNetWorthClients: Boolean(s.hasHighNetWorthClients),
            hasPrivateFundClients: Boolean(s.hasPrivateFundClients),
          };
        }
      } else if (formType.includes('D')) {
        result.formD.push({
          accessionNumber: String(s.accession_no || s.accessionNumber || h?._id || ''),
          filingDate: String(s.file_date || s.filingDate || ''),
          issuerName: String(displayName),
          offeringAmount: Number(s.offeringAmount || 0),
          amountSold: Number(s.amountSold || 0),
          remainingAmount: Number(s.remainingAmount || 0),
          minimumInvestmentAccepted: Number(s.minimumInvestmentAccepted || 0),
          federalExemptions: Array.isArray(s.federalExemptions) ? s.federalExemptions : [],
          executiveOfficers: Array.isArray(s.executiveOfficers) ? s.executiveOfficers : [],
          isRealEstateFund: /real estate|property|fund|realty/i.test(String(displayName)),
        });
      }
    }
  } catch {
    // ignore
  }
  return result;
}