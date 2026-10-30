import { describe, it, expect } from 'vitest';
import { generateDossierPdf } from '../../src/services/reports/pdfGenerator';
import type { ExecutiveDossierData } from '../../src/services/reports/types';

describe('mexico pdf dossier', () => {
  it('generates PDF with MX header', async () => {
    const data: ExecutiveDossierData = {
      reportId: 'rep_mx_1',
      tenantId: 'default',
      generatedAt: new Date().toISOString(),
      subjectTitle: 'Inmobiliaria Polanco S.A.P.I. de C.V.',
      overallScore: 88,
      jurisdiction: 'MX',
      investorStatusBadge: 'Verified HNWI',
      mexicoCorporateSection: {
        razonSocial: 'Inmobiliaria Polanco S.A.P.I. de C.V.',
        tipoSociedad: 'S.A.P.I. de C.V.',
        folioMercantil: '284567',
        entidadFederativa: 'CDMX',
        rfcClave: 'IPO200101ABC',
        regimenFiscal: 'Régimen General de Ley',
        administradorUnico: 'Carlos Slim Domit',
        capitalSocialMxnFormatted: '$50,000,000 MXN',
      },
      mexicoPropertySection: {
        ubicacion: 'Polanco, Miguel Hidalgo, CDMX',
        notariaNumero: 12,
        notarioTitular: 'Lic. Juan Perez',
        valorAdquisicionMxnFormatted: '$45,000,000 MXN',
        esOperacionEfectivoSinGravamen: true,
        aplicaFideicomisoZonaRestringida: false,
      },
      mexicoComplianceSection: {
        repepStatus: 'clean',
        reusStatus: 'clean',
        carrierIft: 'Telcel',
        isTcpaSafe: true,
        dictamenCnbvAmib: 'Inversionista Calificado (Circular Única de Emisoras CNBV)',
      },
      contactSection: { phoneFormatted: '+52 5512345678' },
    };

    const pdf = await generateDossierPdf(data);
    expect(pdf).toBeInstanceOf(Uint8Array);
    const header = String.fromCharCode(...pdf.slice(0, 8));
    expect(header).toContain('%PDF-');
    expect(pdf.byteLength).toBeGreaterThan(1500);
  });
});
