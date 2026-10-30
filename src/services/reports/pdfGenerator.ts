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
