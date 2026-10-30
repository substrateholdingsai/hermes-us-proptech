import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ExecutiveDossierData } from './types';

export async function generateDossierPdf(data: ExecutiveDossierData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let y = 760;
  const line = (text: string, size = 11, f = font, color = rgb(0.06, 0.09, 0.16)) => {
    page.drawText(text, { x: 50, y, size, font: f, color });
    y -= size + 4;
  };

  const isMx = data.jurisdiction === 'MX' || !!data.mexicoCorporateSection;

  if (isMx) {
    line('HERMES INTELLIGENCE DOSSIER · MÉXICO JURISDICTION', 16, bold);
    line(`Report ID: ${data.reportId}`);
    line(`Tenant: ${data.tenantId}`);
    line(`Generated: ${data.generatedAt}`);
    line(`Subject: ${data.subjectTitle}`);
    line(`Overall Score: ${data.overallScore}/100`);
    line(`Investor Status: ${data.investorStatusBadge}`);
    y -= 8;

    if (data.mexicoCorporateSection) {
      const m = data.mexicoCorporateSection;
      line('Bloque 1 - Estructura Corporativa & UBO (SIGER 2.0)', 13, bold);
      line(`Razón Social: ${m.razonSocial}`);
      line(`Folio Mercantil: ${m.folioMercantil} | Estado: ${m.entidadFederativa}`);
      line(`Clave RFC: ${m.rfcClave} | Régimen: ${m.regimenFiscal}`);
      line(`Administrador Único: ${m.administradorUnico}`);
      line(`Capital Social Suscrito: ${m.capitalSocialMxnFormatted}`);
      y -= 6;
    }

    if (data.mexicoPropertySection) {
      const p = data.mexicoPropertySection;
      line('Bloque 2 - Registro de la Propiedad & Notarial (RPPyC)', 13, bold);
      line(`Ubicación / Corredor: ${p.ubicacion}`);
      if (p.folioReal) line(`Folio Real: ${p.folioReal}`);
      line(`Notaría: Notaría Pública No. ${p.notariaNumero} (${p.notarioTitular})`);
      line(`Valor de Operación: ${p.valorAdquisicionMxnFormatted} (Cash Acquisition: ${p.esOperacionEfectivoSinGravamen ? 'Sí' : 'No'})`);
      line(`Zona Restringida (Art. 27 Constitucional): ${p.aplicaFideicomisoZonaRestringida ? 'Fideicomiso Inmobiliario Activo' : 'No Aplica'}`);
      y -= 6;
    }

    if (data.mexicoComplianceSection) {
      const c = data.mexicoComplianceSection;
      line('Bloque 3 - Cumplimiento Telecom & Ley de Protección al Consumidor', 13, bold);
      line(`Teléfono E.164: ${data.contactSection?.phoneFormatted ?? ''} (Carrier: ${c.carrierIft})`);
      line(`Dictamen PROFECO REPEP: ${c.repepStatus === 'clean' ? 'No Inscrito (Limpio para Contacto Comercial)' : 'Restringido'}`);
      line(`Dictamen CONDUSEF REUS: ${c.reusStatus === 'clean' ? 'Limpio' : 'Restringido'}`);
      line(`Cumplimiento Art. 16-18 LFPC: ${c.isTcpaSafe ? 'Aprobado (TCPA/LFPC Compliant)' : 'No Seguro'}`);
      line(`Clasificación Bursátil CNBV: ${c.dictamenCnbvAmib}`);
      y -= 6;
    }

    y -= 10;
    line('Dictamen confidencial para debida diligencia patrimonial y cumplimiento PLD/FT en los Estados Unidos Mexicanos.', 8, font, rgb(0.4, 0.45, 0.5));
    return doc.save();
  }

  line('HERMES INTELLIGENCE DOSSIER', 18, bold);
  line(`Report ID: ${data.reportId}`);
  line(`Tenant: ${data.tenantId}`);
  line(`Generated: ${data.generatedAt}`);
  line(`Subject: ${data.subjectTitle}`);
  line(`Overall Score: ${data.overallScore}/100`);
  line(`Investor Status: ${data.investorStatusBadge}`);
  y -= 8;
  if (data.corporateSection) {
    line('Block 1 - Corporate Structure & UBO', 13, bold);
    line(`Entity: ${data.corporateSection.entityName}`);
    line(`State: ${data.corporateSection.state} | Filing: ${data.corporateSection.filingNumber}`);
    line(`Status: ${data.corporateSection.status} | Agent: ${data.corporateSection.registeredAgent}`);
    line(`UBO: ${data.corporateSection.uboName ?? 'N/A'}`);
    y -= 6;
  }
  if (data.propertySection) {
    line('Block 2 - Property & Equity', 13, bold);
    line(`Address: ${data.propertySection.address}`);
    line(`County: ${data.propertySection.county} | Parcel: ${data.propertySection.parcelId}`);
    line(`Market Value: ${data.propertySection.marketValueFormatted}`);
    line(`Mortgage: ${data.propertySection.mortgageBalanceFormatted} | Equity: ${data.propertySection.equityFormatted} (${data.propertySection.equityPercent}%)`);
    line(`Tax Delinquent: ${data.propertySection.isTaxDelinquent ? 'Yes' : 'No'}`);
    y -= 6;
  }
  if (data.regulatorySection) {
    line('Block 3 - Regulatory (SEC/FINRA)', 13, bold);
    line(`Form D: ${data.regulatorySection.hasFormD ? 'Yes' : 'No'} | Form ADV: ${data.regulatorySection.hasFormADV ? 'Yes' : 'No'}`);
    line(`Licenses: ${data.regulatorySection.activeLicenses.join(', ') || 'None'}`);
    line(`Disciplinary History: ${data.regulatorySection.hasDisciplinaryHistory ? 'Yes' : 'No'}`);
    line(data.regulatorySection.verdictSummary);
    y -= 6;
  }
  if (data.contactSection) {
    line('Block 4 - Contact & TCPA', 13, bold);
    line(`Phone: ${data.contactSection.phoneFormatted ?? ''} (${data.contactSection.lineType ?? ''})`);
    line(`Carrier: ${data.contactSection.carrierName ?? ''} | DNC: ${data.contactSection.dncStatus ?? ''}`);
    line(`Email: ${data.contactSection.email ?? ''} | SMTP Verified: ${data.contactSection.smtpVerified ? 'Yes' : 'No'}`);
    line(`TCPA Safe: ${data.contactSection.isTcpaSafe ? 'Yes' : 'No'}`);
  }
  y -= 10;
  line('Confidential - For internal due diligence use only.', 8, font, rgb(0.4, 0.45, 0.5));
  return doc.save();
}
