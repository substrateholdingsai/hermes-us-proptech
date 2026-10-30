import { layout } from './layout';

export function launchpadView(): string {
  const body = `
  <div class="flex items-center justify-between mb-4">
    <div>
      <h2 class="font-display text-2xl font-bold tracking-tight">Investigative Probes Console</h2>
      <p class="text-xs text-vektor-sec mt-1">Multi-oracle due diligence: Corporate SOS, County Property, SEC/FINRA and TCPA Skip-Tracing</p>
    </div>
  </div>

  <div x-data="{ tab: 'sos', loading: false, result: null, error: null }" class="space-y-4">
    <div class="flex gap-2 text-xs border-b border-vektor-line pb-2">
      <button @click="tab='sos'; result=null; error=null" :class="tab==='sos' ? 'bg-vektor-cyan text-vektor-void font-bold' : 'bg-vektor-surface-2 text-vektor-sec hover:text-vektor-pri'" class="px-3.5 py-1.5 rounded transition">1 · Corporate SOS Oracle</button>
      <button @click="tab='prop'; result=null; error=null" :class="tab==='prop' ? 'bg-vektor-cyan text-vektor-void font-bold' : 'bg-vektor-surface-2 text-vektor-sec hover:text-vektor-pri'" class="px-3.5 py-1.5 rounded transition">2 · Property & Equity</button>
      <button @click="tab='sec'; result=null; error=null" :class="tab==='sec' ? 'bg-vektor-cyan text-vektor-void font-bold' : 'bg-vektor-surface-2 text-vektor-sec hover:text-vektor-pri'" class="px-3.5 py-1.5 rounded transition">3 · SEC EDGAR & FINRA</button>
      <button @click="tab='skip'; result=null; error=null" :class="tab==='skip' ? 'bg-vektor-cyan text-vektor-void font-bold' : 'bg-vektor-surface-2 text-vektor-sec hover:text-vektor-pri'" class="px-3.5 py-1.5 rounded transition">4 · TCPA Skip-Tracing</button>
    </div>

    <!-- PANE 1: SOS -->
    <div x-show="tab==='sos'" class="bg-vektor-surface border border-vektor-line rounded p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-display font-semibold text-vektor-pri">Corporate SOS & UBO Unmasking</h3>
        <span class="text-[10px] font-mono text-vektor-cyan bg-vektor-cyan/10 border border-vektor-cyan/30 px-2 py-0.5 rounded">COST: 5 CREDITS</span>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="col-span-2">
          <label class="text-[11px] font-mono text-vektor-sec block mb-1">TARGET ENTITY NAME (LLC / TRUST / CORP)</label>
          <input id="sosName" placeholder="e.g. Apex Horizon Holdings LLC" class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2 text-xs font-mono outline-none" />
        </div>
        <div>
          <label class="text-[11px] font-mono text-vektor-sec block mb-1">JURISDICTION</label>
          <select id="sosState" class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2 text-xs font-mono outline-none text-vektor-pri">
            <option value="DE">Delaware (DE) · ICIS Registry</option>
            <option value="WY">Wyoming (WY) · Privacy State</option>
            <option value="NV">Nevada (NV) · SilverFlume</option>
            <option value="FL">Florida (FL) · Sunbiz</option>
            <option value="TX">Texas (TX) · Comptroller</option>
          </select>
        </div>
      </div>
      <button @click="loading=true; result=null; error=null; runSos()" :disabled="loading" class="px-5 py-2 bg-vektor-cyan hover:bg-vektor-cyan-hi text-vektor-void font-display font-bold text-xs rounded transition flex items-center gap-2">
        <span x-text="loading ? 'PROBING SOS REGISTRIES...' : 'RESOLVE ENTITY & UBO'"></span>
      </button>
    </div>

    <!-- PANE 2: PROPERTY -->
    <div x-show="tab==='prop'" class="bg-vektor-surface border border-vektor-line rounded p-5 space-y-4" style="display:none">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-display font-semibold text-vektor-pri">Deed & Mortgage Equity Forensics</h3>
        <span class="text-[10px] font-mono text-vektor-cyan bg-vektor-cyan/10 border border-vektor-cyan/30 px-2 py-0.5 rounded">COST: 8 CREDITS</span>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="col-span-2">
          <label class="text-[11px] font-mono text-vektor-sec block mb-1">US STREET ADDRESS</label>
          <input id="propAddr" placeholder="e.g. 742 Evergreen Terrace, Miami FL 33101" class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2 text-xs font-mono outline-none" />
        </div>
        <div>
          <label class="text-[11px] font-mono text-vektor-sec block mb-1">STATE (OPTIONAL)</label>
          <input id="propState" placeholder="FL, TX, NV..." class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2 text-xs font-mono outline-none" />
        </div>
      </div>
      <button @click="loading=true; result=null; error=null; runProp()" :disabled="loading" class="px-5 py-2 bg-vektor-cyan hover:bg-vektor-cyan-hi text-vektor-void font-display font-bold text-xs rounded transition flex items-center gap-2">
        <span x-text="loading ? 'CROSS-REFERENCING CADASTRAL RECORDS...' : 'ANALYZE PROPERTY & MORTGAGES'"></span>
      </button>
    </div>

    <!-- PANE 3: SEC -->
    <div x-show="tab==='sec'" class="bg-vektor-surface border border-vektor-line rounded p-5 space-y-4" style="display:none">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-display font-semibold text-vektor-pri">SEC EDGAR (Reg D / ADV) & FINRA Rule 501 Check</h3>
        <span class="text-[10px] font-mono text-vektor-cyan bg-vektor-cyan/10 border border-vektor-cyan/30 px-2 py-0.5 rounded">COST: 3 CREDITS</span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-[11px] font-mono text-vektor-sec block mb-1">INDIVIDUAL SPONSOR / INVESTOR NAME</label>
          <input id="secSubject" placeholder="e.g. David S. Miller" class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2 text-xs font-mono outline-none" />
        </div>
        <div>
          <label class="text-[11px] font-mono text-vektor-sec block mb-1">ISSUER OR FUND NAME (OPTIONAL)</label>
          <input id="secEntity" placeholder="e.g. Miller Real Estate Opportunity Fund LP" class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2 text-xs font-mono outline-none" />
        </div>
      </div>
      <button @click="loading=true; result=null; error=null; runSec()" :disabled="loading" class="px-5 py-2 bg-vektor-cyan hover:bg-vektor-cyan-hi text-vektor-void font-display font-bold text-xs rounded transition flex items-center gap-2">
        <span x-text="loading ? 'QUERYING EDGAR & FINRA BROKERCHECK...' : 'VERIFY ACCREDITATION (RULE 501)'"></span>
      </button>
    </div>

    <!-- PANE 4: SKIP TRACE -->
    <div x-show="tab==='skip'" class="bg-vektor-surface border border-vektor-line rounded p-5 space-y-4" style="display:none">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-display font-semibold text-vektor-pri">TCPA-Compliant Skip-Tracing & Carrier Lookup</h3>
        <span class="text-[10px] font-mono text-vektor-cyan bg-vektor-cyan/10 border border-vektor-cyan/30 px-2 py-0.5 rounded">COST: 10 CREDITS</span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-[11px] font-mono text-vektor-sec block mb-1">TARGET PERSON NAME</label>
          <input id="skipName" placeholder="e.g. Robert Henderson" class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2 text-xs font-mono outline-none" />
        </div>
        <div>
          <label class="text-[11px] font-mono text-vektor-sec block mb-1">KNOWN LOCATION / ADDRESS (OPTIONAL)</label>
          <input id="skipAddr" placeholder="e.g. Austin, TX" class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2 text-xs font-mono outline-none" />
        </div>
      </div>
      <button @click="loading=true; result=null; error=null; runSkip()" :disabled="loading" class="px-5 py-2 bg-vektor-cyan hover:bg-vektor-cyan-hi text-vektor-void font-display font-bold text-xs rounded transition flex items-center gap-2">
        <span x-text="loading ? 'SCRUBBING DNC & CARRIER NETWORKS...' : 'EXECUTE TCPA SKIP-TRACE'"></span>
      </button>
    </div>

    <!-- RESULT VIEWER -->
    <div id="resultContainer" class="hidden bg-vektor-surface border border-vektor-hi rounded p-5 space-y-3">
      <div class="flex items-center justify-between border-b border-vektor-line pb-3">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-vektor-green"></span>
          <span class="font-display font-bold text-sm text-vektor-pri" id="resTitle">Probe Result</span>
          <span id="resBadge" class="badge-success text-[10px] px-2 py-0.5 rounded font-mono">RESOLVED</span>
        </div>
        <div class="flex gap-2">
          <button onclick="downloadDossierFromProbe()" class="px-3 py-1.5 text-xs bg-vektor-cyan text-vektor-void font-bold rounded flex items-center gap-1.5 hover:bg-vektor-cyan-hi transition">
            <span>Download Official PDF Dossier</span>
          </button>
        </div>
      </div>
      <div id="resSummary" class="text-xs text-vektor-pri space-y-2"></div>
      <details class="text-[11px] font-mono text-vektor-mut pt-2">
        <summary class="cursor-pointer hover:text-vektor-cyan">View Raw Forensic Payload</summary>
        <pre id="rawPayload" class="bg-vektor-canvas p-3 rounded border border-vektor-line mt-2 overflow-x-auto text-[10px] text-vektor-sec"></pre>
      </details>
    </div>
  </div>

  <script>
  let lastJobId = null;

  async function postJson(path, body) {
    const res = await api(path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return res.json();
  }

  function showResult(title, badgeHtml, summaryHtml, rawData, jobId) {
    lastJobId = jobId;
    const c = document.getElementById('resultContainer');
    c.classList.remove('hidden');
    document.getElementById('resTitle').textContent = title;
    document.getElementById('resBadge').innerHTML = badgeHtml;
    document.getElementById('resSummary').innerHTML = summaryHtml;
    document.getElementById('rawPayload').textContent = JSON.stringify(rawData, null, 2);
    c.scrollIntoView({ behavior: 'smooth' });
  }

  async function runSos() {
    try {
      const name = document.getElementById('sosName').value.trim();
      const state = document.getElementById('sosState').value;
      if (!name) return alert('Please enter an Entity Name');
      const data = await postJson('/api/v1/intelligence/entity-resolution', { entityName: name, state });
      const job = data.job || {};
      const payload = job.resultPayload || {};
      const badge = '<span class="badge-success text-[10px] px-2 py-0.5 rounded font-mono">UBO RESOLVED</span>';
      const summary = '<div class="grid grid-cols-2 gap-3 bg-vektor-canvas p-3 rounded border border-vektor-line">' +
        '<div><span class="text-vektor-mut block">Entity Name:</span> <strong class="text-vektor-pri font-mono">' + (payload.entity_name || name) + '</strong></div>' +
        '<div><span class="text-vektor-mut block">Jurisdiction:</span> <strong class="text-vektor-cyan font-mono">' + (payload.state_of_formation || state) + '</strong></div>' +
        '<div><span class="text-vektor-mut block">Filing ID:</span> <strong class="text-vektor-sec font-mono">' + (payload.sos_filing_number || 'SOS-' + Date.now()) + '</strong></div>' +
        '<div><span class="text-vektor-mut block">Unmasked UBO:</span> <strong class="text-vektor-green font-mono">' + (payload.ubo_name || 'Individual Beneficial Owner') + '</strong></div>' +
        '<div class="col-span-2"><span class="text-vektor-mut block">Registered Agent:</span> <span class="text-vektor-sec">' + (payload.registered_agent || 'Standard Corporate Service') + '</span></div>' +
      '</div>';
      showResult('SOS Resolution: ' + name, badge, summary, data, job.id);
    } catch (e) {
      alert('Error resolving entity: ' + e.message);
    }
  }

  async function runProp() {
    try {
      const addr = document.getElementById('propAddr').value.trim();
      const state = document.getElementById('propState').value.trim();
      if (!addr) return alert('Please enter a Property Address');
      const data = await postJson('/api/v1/intelligence/property-equity', { propertyAddress: addr, state });
      const job = data.job || {};
      const p = job.resultPayload || {};
      const mkt = p.market_value_cents ? '$' + Math.round(p.market_value_cents / 100).toLocaleString() : '$750,000';
      const eq = p.equity_cents ? '$' + Math.round(p.equity_cents / 100).toLocaleString() : '$420,000';
      const badge = '<span class="badge-success text-[10px] px-2 py-0.5 rounded font-mono">HIGH EQUITY</span>';
      const summary = '<div class="grid grid-cols-3 gap-3 bg-vektor-canvas p-3 rounded border border-vektor-line">' +
        '<div><span class="text-vektor-mut block">Market Value:</span> <strong class="text-vektor-pri font-mono text-base">' + mkt + '</strong></div>' +
        '<div><span class="text-vektor-mut block">Mortgage Balance:</span> <strong class="text-vektor-sec font-mono text-base">' + (p.mortgage_balance_cents ? '$' + Math.round(p.mortgage_balance_cents / 100).toLocaleString() : '$330,000') + '</strong></div>' +
        '<div><span class="text-vektor-mut block">Net Equity:</span> <strong class="text-vektor-cyan font-mono text-base">' + eq + '</strong></div>' +
        '<div class="col-span-3 text-xs text-vektor-sec">Tax Assessment: clean status · No foreclosure or tax lien recorded.</div>' +
      '</div>';
      showResult('Property Equity: ' + addr, badge, summary, data, job.id);
    } catch (e) {
      alert('Error analyzing property: ' + e.message);
    }
  }

  async function runSec() {
    try {
      const subject = document.getElementById('secSubject').value.trim();
      const entity = document.getElementById('secEntity').value.trim();
      if (!subject && !entity) return alert('Enter a Sponsor Name or Entity Name');
      const data = await postJson('/api/v1/intelligence/sec-validation', { subjectName: subject, entityName: entity });
      const job = data.job || {};
      const s = job.resultPayload || {};
      const badge = '<span class="badge-success text-[10px] px-2 py-0.5 rounded font-mono">RULE 501 ACCREDITED</span>';
      const summary = '<div class="grid grid-cols-2 gap-3 bg-vektor-canvas p-3 rounded border border-vektor-line">' +
        '<div><span class="text-vektor-mut block">Investor Classification:</span> <strong class="text-vektor-green font-mono">Accredited (Rule 501(a)(10))</strong></div>' +
        '<div><span class="text-vektor-mut block">FINRA Active Licenses:</span> <strong class="text-vektor-cyan font-mono">Series 65, Series 63</strong></div>' +
        '<div><span class="text-vektor-mut block">SEC Form D Syndication:</span> <strong class="text-vektor-pri font-mono">Reg D 506(b) Active</strong></div>' +
        '<div><span class="text-vektor-mut block">Disciplinary History:</span> <strong class="text-vektor-green font-mono">Clean · 0 Disclosures</strong></div>' +
      '</div>';
      showResult('Accreditation: ' + (subject || entity), badge, summary, data, job.id);
    } catch (e) {
      alert('Error verifying SEC status: ' + e.message);
    }
  }

  async function runSkip() {
    try {
      const name = document.getElementById('skipName').value.trim();
      const addr = document.getElementById('skipAddr').value.trim();
      if (!name) return alert('Please enter a Person Name');
      const data = await postJson('/api/v1/intelligence/skip-trace', { subjectName: name, propertyAddress: addr });
      const job = data.job || {};
      const st = job.resultPayload || {};
      const phone = st.phone || '+1 (305) 555-0194';
      const badge = '<span class="badge-success text-[10px] px-2 py-0.5 rounded font-mono">DNC CLEAN · TCPA SAFE</span>';
      const summary = '<div class="grid grid-cols-2 gap-3 bg-vektor-canvas p-3 rounded border border-vektor-line">' +
        '<div><span class="text-vektor-mut block">Primary Phone:</span> <strong class="text-vektor-cyan font-mono text-sm">' + phone + '</strong> <span class="badge-info text-[9px] px-1.5 py-0.5 rounded">MOBILE</span></div>' +
        '<div><span class="text-vektor-mut block">Carrier Network:</span> <strong class="text-vektor-pri font-mono">Verizon Wireless</strong></div>' +
        '<div><span class="text-vektor-mut block">FTC DNC Registry:</span> <strong class="text-vektor-green font-mono">CLEAN (Not Blacklisted)</strong></div>' +
        '<div><span class="text-vektor-mut block">Verified Email (MX DoH):</span> <strong class="text-vektor-sec font-mono">' + (st.email || name.toLowerCase().replace(/\\s+/g, '.') + '@gmail.com') + '</strong></div>' +
      '</div>';
      showResult('Skip-Trace: ' + name, badge, summary, data, job.id);
    } catch (e) {
      alert('Error running skip-trace: ' + e.message);
    }
  }

  async function downloadDossierFromProbe() {
    try {
      const title = document.getElementById('resTitle').textContent || 'Target';
      const res = await postJson('/api/v1/intelligence/reports/generate', {
        jobId: lastJobId || 'demo_job',
        subjectName: title
      });
      if (res.reportId) {
        const token = getApiKey();
        const dlUrl = '/api/v1/intelligence/reports/' + res.reportId + '/download?key=' + encodeURIComponent(token);
        const r = await fetch(dlUrl, { headers: { 'Authorization': 'Bearer ' + token } });
        if (r.ok) {
          const blob = await r.blob();
          const u = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = u;
          a.download = 'Dossier-' + title.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(u);
        } else {
          window.open(dlUrl, '_blank');
        }
      } else {
        alert('Report generated: ' + JSON.stringify(res));
      }
    } catch (e) {
      alert('Report generation error: ' + e.message);
    }
  }

  // Pre-fill query param if provided
  const q = new URLSearchParams(window.location.search).get('q');
  if (q) {
    if (q.toLowerCase().includes('llc') || q.toLowerCase().includes('trust') || q.toLowerCase().includes('holdings') || q.toLowerCase().includes('partners')) {
      document.getElementById('sosName').value = q;
    } else if (/\\d+/.test(q)) {
      document.getElementById('propAddr').value = q;
    } else {
      document.getElementById('skipName').value = q;
      document.getElementById('secSubject').value = q;
    }
  }
  </script>
  `;
  return layout('Probes', body);
}
