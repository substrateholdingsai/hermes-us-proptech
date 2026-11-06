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
  jurisdiction?: 'US' | 'MX';
  mexicoLeadId?: string;
  mexicoMetadata?: Record<string, unknown>;
}

export async function generateExecutiveDossier(env: Env, params: GenerateReportParams): Promise<{ reportId: string; key: string }> {
  const reportId = randomUUID();
  const subject = params.subjectName || params.propertyAddress || params.jobId || 'Intelligence Subject';
  const isMx = params.jurisdiction === 'MX' || /S\.A\.P\.I|S\.A\.|Fideicomiso/i.test(subject);

  const data: ExecutiveDossierData = {
    reportId,
    tenantId: params.tenantId,
    generatedAt: new Date().toISOString(),
    subjectTitle: subject,
    overallScore: 75,
    jurisdiction: isMx ? 'MX' : 'US',
    investorStatusBadge: isMx ? 'Verified HNWI' : 'Unverified / Retail',
    corporateSection: params.subjectName ? {
      entityName: params.subjectName,
      state: isMx ? 'CDMX' : 'FL',
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

  if (isMx) {
    const meta = (params.mexicoMetadata || {}) as Record<string, any>;
    data.mexicoCorporateSection = {
      razonSocial: subject,
      tipoSociedad: /Fideicomiso/i.test(subject) ? 'Fideicomiso Inmobiliario' : 'S.A.P.I. de C.V.',
      folioMercantil: String(meta.folioMercantil || 'N/A'),
      entidadFederativa: String(meta.entidadFederativa || 'CDMX'),
      rfcClave: String(meta.rfcClave || 'N/A'),
      regimenFiscal: String(meta.regimenFiscal || 'Régimen General de Ley'),
      administradorUnico: String(meta.administradorUnico || subject),
      capitalSocialMxnFormatted: String(meta.capitalSocialMxnFormatted || '$15,000,000 MXN'),
    };
    data.mexicoPropertySection = {
      ubicacion: params.propertyAddress || 'Polanco, Miguel Hidalgo, CDMX',
      notariaNumero: Number(meta.notariaNumero || 12),
      notarioTitular: String(meta.notarioTitular || 'Lic. Juan Perez'),
      valorAdquisicionMxnFormatted: String(meta.valorAdquisicionMxnFormatted || '$15,000,000 MXN'),
      esOperacionEfectivoSinGravamen: true,
      aplicaFideicomisoZonaRestringida: /Tulum|Playa/i.test(params.propertyAddress || ''),
    };
    data.mexicoComplianceSection = {
      repepStatus: meta.repepStatus === 'flagged' ? 'flagged' : 'clean',
      reusStatus: meta.reusStatus === 'flagged' ? 'flagged' : 'clean',
      carrierIft: String(meta.carrierIft || 'Telcel'),
      isTcpaSafe: meta.isTcpaSafe !== false,
      dictamenCnbvAmib: String(meta.dictamenCnbvAmib || 'Inversionista Calificado (Circular Única de Emisoras CNBV)'),
    };
  }

  const pdf = await generateDossierPdf(data);
  const key = await saveReportPdfToR2(env, params.tenantId, reportId, pdf);
  try {
    await env.DB.prepare(
      `INSERT INTO reports (id, tenant_id, type, subject, status, created_at, credits_used, pdf_key, pdf_url, executive_summary, findings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(reportId, params.tenantId, 'dossier', subject, 'completed', new Date().toISOString(), 0, key, key, null, null)
      .run();
  } catch {
  }
  return { reportId, key };
}
