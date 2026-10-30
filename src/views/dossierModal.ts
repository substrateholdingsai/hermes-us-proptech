import { layout } from './layout';

export function dossierModalView(): string {
  const folio = 'VEKTOR-' + Math.floor(100000 + Math.random() * 900000);
  const body = `
  <div class="vektor-watermark">VEKTOR · AUDIT · ${folio} · CONFIDENTIAL</div>
  
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="font-display text-2xl font-bold tracking-tight">Executive Intelligence Dossier</h2>
      <p class="text-xs text-vektor-sec mt-1">Cross-oracle institutional due diligence report compilation & Cloudflare R2 archival</p>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-[10px] font-mono text-vektor-cyan bg-vektor-cyan/10 border border-vektor-cyan/30 px-2 py-1 rounded">
        FOLIO: ${folio}
      </span>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-6">
    <!-- LEFT: GENERATOR CONFIG -->
    <div class="bg-vektor-surface border border-vektor-line rounded-lg p-5 space-y-4">
      <h3 class="font-display font-semibold text-sm text-vektor-pri flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-vektor-cyan"></span> Compile Dossier
      </h3>
      
      <div>
        <label class="text-[11px] font-mono text-vektor-sec block mb-1">TARGET / SUBJECT TITLE</label>
        <input id="dossierSubject" value="Apex Capital Partners LLC" class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2 text-xs font-mono text-vektor-pri outline-none" />
      </div>

      <div>
        <label class="text-[11px] font-mono text-vektor-sec block mb-1">OPTIONAL PROPERTY ADDRESS</label>
        <input id="dossierAddress" placeholder="e.g. 742 Evergreen Terrace, Miami FL" class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2 text-xs font-mono text-vektor-pri outline-none" />
      </div>

      <div class="border-t border-vektor-line pt-3 text-[11px] text-vektor-mut space-y-1 font-mono">
        <div>ORACLES INCLUDED:</div>
        <div class="text-vektor-sec">✓ Corporate SOS & UBO Unmasking</div>
        <div class="text-vektor-sec">✓ County Deed & Mortgage Equity</div>
        <div class="text-vektor-sec">✓ SEC Reg D & FINRA Series 7/65</div>
        <div class="text-vektor-sec">✓ FTC DNC Clean & Carrier Verification</div>
      </div>

      <button id="btnDownload" onclick="generateAndDownloadDossier()" class="w-full py-3 bg-vektor-cyan hover:bg-vektor-cyan-hi text-vektor-void font-display font-bold text-xs tracking-wider uppercase rounded transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10">
        <span id="btnText">Download Official Dossier (PDF)</span>
      </button>

      <div id="statusMessage" class="hidden text-center text-xs p-2 rounded font-mono"></div>
    </div>

    <!-- RIGHT: PREVIEW CARD -->
    <div class="col-span-2 bg-vektor-surface border border-vektor-hi rounded-lg p-6 space-y-5 relative overflow-hidden">
      <div class="flex items-center justify-between border-b border-vektor-line pb-4">
        <div>
          <div class="text-[10px] font-mono text-vektor-mut uppercase tracking-widest">CONFIDENTIAL DUE DILIGENCE REPORT</div>
          <div class="font-display font-bold text-lg text-vektor-pri mt-0.5">EXECUTIVE INVESTOR DOSSIER</div>
        </div>
        <div class="text-right font-mono text-[11px]">
          <div class="text-vektor-green font-bold flex items-center gap-1 justify-end"><span class="w-1.5 h-1.5 rounded-full bg-vektor-green"></span> AUDIT READY</div>
          <div class="text-vektor-mut">STORAGE: R2 ARCHIVE</div>
        </div>
      </div>

      <!-- DOSSIER PREVIEW BLOCKS -->
      <div class="grid grid-cols-2 gap-4 text-xs">
        <div class="bg-vektor-canvas border border-vektor-line rounded p-3 space-y-1.5">
          <div class="text-[10px] font-mono text-vektor-cyan uppercase">1 · Corporate & UBO Structure</div>
          <div class="text-vektor-pri font-medium">Delaware Division of Corporations</div>
          <div class="text-[11px] text-vektor-sec font-mono">Filing: SOS-DE-2026849 · Good Standing</div>
          <div class="mt-1"><span class="badge-success text-[10px] px-1.5 py-0.5 rounded">UBO RESOLVED</span></div>
        </div>

        <div class="bg-vektor-canvas border border-vektor-line rounded p-3 space-y-1.5">
          <div class="text-[10px] font-mono text-vektor-cyan uppercase">2 · Property Equity Assessment</div>
          <div class="text-vektor-pri font-medium">County Tax Assessor & Deeds</div>
          <div class="text-[11px] text-vektor-sec font-mono">Est. Market: $1,250,000 · Mortgage: $450K</div>
          <div class="mt-1"><span class="badge-success text-[10px] px-1.5 py-0.5 rounded">EQUITY $800,000 (64%)</span></div>
        </div>

        <div class="bg-vektor-canvas border border-vektor-line rounded p-3 space-y-1.5">
          <div class="text-[10px] font-mono text-vektor-cyan uppercase">3 · Regulatory Due Diligence</div>
          <div class="text-vektor-pri font-medium">SEC EDGAR & FINRA BrokerCheck</div>
          <div class="text-[11px] text-vektor-sec font-mono">Rule 501(a)(10) License: Series 65 Active</div>
          <div class="mt-1"><span class="badge-success text-[10px] px-1.5 py-0.5 rounded">ACCREDITED INVESTOR</span></div>
        </div>

        <div class="bg-vektor-canvas border border-vektor-line rounded p-3 space-y-1.5">
          <div class="text-[10px] font-mono text-vektor-cyan uppercase">4 · Contact & TCPA Compliance</div>
          <div class="text-vektor-pri font-medium">Carrier & National DNC Registry</div>
          <div class="text-[11px] text-vektor-sec font-mono">Mobile (Verizon) · Email MX Verified</div>
          <div class="mt-1"><span class="badge-success text-[10px] px-1.5 py-0.5 rounded">TCPA SAFE FOR SMS</span></div>
        </div>
      </div>

      <div class="border-t border-vektor-line pt-4 flex justify-between items-center text-[11px] text-vektor-mut font-mono">
        <span>SECURITY: CLOUDFLARE R2 ENCRYPTED AT REST</span>
        <span>ISSUED BY: VEKTOR-OPS SYSTEM</span>
      </div>
    </div>
  </div>

  <script>
  async function generateAndDownloadDossier() {
    const btn = document.getElementById('btnDownload');
    const txt = document.getElementById('btnText');
    const status = document.getElementById('statusMessage');
    const subject = document.getElementById('dossierSubject').value.trim() || 'Executive Target';
    const address = document.getElementById('dossierAddress').value.trim();

    btn.disabled = true;
    txt.textContent = 'GENERATING PDF DOSSIER IN R2...';
    status.className = 'text-center text-xs p-2 rounded font-mono bg-vektor-surface-2 text-vektor-cyan border border-vektor-cyan/30 block';
    status.textContent = 'Compiling multi-oracle forensics into PDF...';

    try {
      const genRes = await api('/api/v1/intelligence/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          subjectName: subject,
          propertyAddress: address
        })
      });

      if (!genRes.ok) {
        const err = await genRes.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to compile report');
      }

      const genData = await genRes.json();
      const reportId = genData.reportId;
      if (!reportId) throw new Error('No reportId returned by server');

      status.textContent = 'Downloading PDF from Cloudflare R2...';
      const token = getApiKey();
      const downloadUrl = '/api/v1/intelligence/reports/' + reportId + '/download?key=' + encodeURIComponent(token);

      // Fetch blob with credentials for reliable download
      const dlRes = await fetch(downloadUrl, {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (!dlRes.ok) {
        throw new Error('Failed to download binary: HTTP ' + dlRes.status);
      }

      const blob = await dlRes.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'Hermes-Dossier-' + reportId.slice(0, 8) + '.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      status.className = 'text-center text-xs p-2 rounded font-mono badge-success block';
      status.textContent = '✓ Dossier PDF generated and downloaded successfully!';
    } catch (e) {
      status.className = 'text-center text-xs p-2 rounded font-mono badge-danger block';
      status.textContent = 'Error: ' + e.message;
    } finally {
      btn.disabled = false;
      txt.textContent = 'Download Official Dossier (PDF)';
    }
  }
  </script>
  `;
  return layout('Dossier', body);
}
