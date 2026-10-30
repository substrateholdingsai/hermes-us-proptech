export function buildDossierHtml(data: any): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hermes Dossier</title><style>
body{font-family:Inter,Helvetica,Arial,sans-serif;color:#0f172a;margin:24px;}
h1{color:#0f172a;} .badge{display:inline-block;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:600;}
.badge.green{background:#10b981;color:#fff;} .badge.amber{background:#f59e0b;color:#fff;} .badge.red{background:#ef4444;color:#fff;}
table{width:100%;border-collapse:collapse;margin:12px 0;} th,td{border:1px solid #cbd5e1;padding:6px;font-size:12px;}
@media print{body{margin:0;}}
</style></head><body>
<h1>Hermes Intelligence Dossier</h1>
<p>Report ID: ${data.reportId} | Tenant: ${data.tenantId} | Generated: ${data.generatedAt}</p>
<p>Subject: ${data.subjectTitle}</p>
<p>Overall Score: ${data.overallScore}/100</p>
<p>Investor Status: <span class="badge green">${data.investorStatusBadge}</span></p>
${data.corporateSection ? `<h2>Corporate / UBO</h2><p>${data.corporateSection.entityName} - ${data.corporateSection.state}</p>` : ''}
${data.propertySection ? `<h2>Property / Equity</h2><p>${data.propertySection.address} | Equity: ${data.propertySection.equityFormatted} (${data.propertySection.equityPercent}%)</p>` : ''}
${data.regulatorySection ? `<h2>Regulatory</h2><p>${data.regulatorySection.verdictSummary}</p>` : ''}
${data.contactSection ? `<h2>Contact / TCPA</h2><p>${data.contactSection.email ?? ''} ${data.contactSection.isTcpaSafe ? 'TCPA Safe' : ''}</p>` : ''}
<p style="font-size:9px;color:#64748b;">Confidential. For internal due diligence use only.</p>
</body></html>`;
}
