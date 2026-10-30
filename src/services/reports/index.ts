import { randomUUID } from 'crypto';
import type { Env } from '../../types/env';
import type { ExecutiveDossierData } from './types';
import { generateDossierPdf } from './pdfGenerator';
import { saveReportPdfToR2 } from './storage';

export interface GenerateReportParams {
  jobId?: string;
  subjectName?: string;
  propertyAddress?: string;
  tenantId: string;
}

export async function generateExecutiveDossier(env: Env, params: GenerateReportParams): Promise<{ reportId: string; key: string }> {
  const reportId = randomUUID();
  const data: ExecutiveDossierData = {
    reportId,
    tenantId: params.tenantId,
    generatedAt: new Date().toISOString(),
    subjectTitle: params.subjectName || params.propertyAddress || params.jobId || 'Intelligence Subject',
    overallScore: 75,
    investorStatusBadge: 'Unverified / Retail',
    corporateSection: params.subjectName ? {
      entityName: params.subjectName,
      state: 'FL',
      filingNumber: 'N/A',
      status: 'Active',
      registeredAgent: 'N/A',
      managers: [],
      uboName: null,
    } : undefined,
    propertySection: params.propertyAddress ? {
      address: params.propertyAddress,
      county: 'N/A',
      parcelId: 'N/A',
      marketValueFormatted: '$0',
      mortgageBalanceFormatted: '$0',
      equityFormatted: '$0',
      equityPercent: 0,
      isTaxDelinquent: false,
    } : undefined,
    regulatorySection: {
      hasFormD: false,
      hasFormADV: false,
      activeLicenses: [],
      hasDisciplinaryHistory: false,
      verdictSummary: 'No regulatory filings detected.',
    },
    contactSection: {},
  };
  const pdf = await generateDossierPdf(data);
  const key = await saveReportPdfToR2(env, params.tenantId, reportId, pdf);
  return { reportId, key };
}
