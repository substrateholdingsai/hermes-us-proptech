import type { Env } from '../../types/env';
import type { FinraIndividualRecord } from './types';

const FINRA_UA = 'HermesPropTech/1.0 (compliance@hermesproptech.internal)';

export function isAccreditedByLicense(licenses: string[]): boolean {
  const accreditedLicenses = ['Series 7', 'Series 65', 'Series 82', '7', '65', '82'];
  return licenses.some((l) => accreditedLicenses.some((a) => l.toLowerCase().includes(a.toLowerCase())));
}

export async function searchFinra(_env: Env, name: string): Promise<FinraIndividualRecord | null> {
  const url = `https://api.brokercheck.finra.org/search/individual?query=${encodeURIComponent(name)}&limit=5`;
  let data: any = null;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': FINRA_UA, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch {
    return null;
  }

  const hits: any[] = data?.hits?.hits || data?.results || data?.data || [];
  const first = hits[0];
  if (!first) return null;
  const s = first?._source || first?.individual || first || {};

  const basic = s.basicInformation || s.basic || s;
  const fullName = [basic?.firstName, basic?.lastName].filter(Boolean).join(' ') || String(basic?.fullName || name);

  const exams: any[] = s.exams || s.examResults || [];
  const activeLicenses: string[] = [];
  for (const e of exams) {
    const examName = String(e?.examName || e?.name || e?.examCode || '');
    if (examName) activeLicenses.push(examName);
  }

  const isAccredited = isAccreditedByLicense(activeLicenses);

  const disclosures: any[] = s.disclosures || s.disclosureCount ? [s.disclosures] : [];
  const hasDisciplinaryHistory =
    (typeof s.disclosureCount === 'number' && s.disclosureCount > 0) ||
    (Array.isArray(s.disclosures) && s.disclosures.length > 0) ||
    disclosures.length > 0;

  const currentFirm = s.currentEmployments?.[0]?.firmName || s.firmName || undefined;
  const yearsOfExperience = Number(s.yearsOfExperience || s.experienceYears || 0);

  return {
    crdNumber: String(s.crdNumber || basic?.crdNumber || ''),
    fullName,
    currentFirm,
    activeLicenses,
    isAccreditedByLicense: isAccredited,
    hasDisciplinaryHistory,
    yearsOfExperience,
  };
}
export const isAccredited = isAccreditedByLicense;
export const isQualifiedPurchaser = (aum: number) => aum > 5000000;
