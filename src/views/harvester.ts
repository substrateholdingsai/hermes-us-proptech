import { layout } from './layout';

export function harvesterView(): string {
  const body = `
  <div class="mb-6">
    <h1 class="font-display text-2xl font-bold text-vektor-pri">VEKTOR Lead Harvester</h1>
    <p class="text-vektor-sec text-sm mt-1">Automated institutional lead mining from SEC Form D, luxury cash buyers, HNWI RIAs, SIGER and RPPyC.</p>
  </div>

  <div class="bg-vektor-surface border border-vektor-line rounded-lg p-6 mb-6">
    <div class="flex items-center gap-3 mb-4">
      <button id="jurUS" onclick="setJurisdiction('US')" class="px-4 py-2 rounded bg-vektor-cyan text-vektor-void font-bold text-sm">🇺🇸 United States (SEC / Deeds)</button>
      <button id="jurMX" onclick="setJurisdiction('MX')" class="px-4 py-2 rounded border border-vektor-hi text-vektor-sec text-sm">🇲🇽 México (SIGER / RPPyC)</button>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div>
        <label class="text-[11px] font-mono text-vektor-mut uppercase mb-2 block">Mining Channel</label>
        <div id="usSources" class="space-y-2">
          <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="source" value="sec_form_d" checked class="accent-cyan-400"> 💎 SEC Form D Syndications</label>
          <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="source" value="luxury_cash_buyers" class="accent-cyan-400"> 🏰 Luxury Cash Buyers</label>
          <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="source" value="ria_family_offices" class="accent-cyan-400"> 📈 HNWI RIAs (Form ADV)</label>
        </div>
        <div id="mxSources" class="space-y-2 hidden">
          <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="source" value="siger_sapi" checked class="accent-cyan-400"> SIGER 2.0 - S.A.P.I. & Family Offices</label>
          <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="source" value="rppyc_luxury_acquisitions" class="accent-cyan-400"> RPPyC - Adquisiciones de Lujo (Cash Deals)</label>
          <label class="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="source" value="cnbv_qualified_investors" class="accent-cyan-400"> Inversionistas Calificados CNBV / AMIB</label>
        </div>
      </div>
      <div>
        <label class="text-[11px] font-mono text-vektor-mut uppercase mb-2 block">Jurisdiction</label>
        <select id="stateFilter" class="w-full bg-vektor-canvas border border-vektor-line rounded px-3 py-2 text-sm">
          <option value="">All Jurisdictions</option>
          <option value="FL">Florida (FL)</option>
          <option value="TX">Texas (TX)</option>
          <option value="DE">Delaware (DE)</option>
          <option value="NV">Nevada (NV)</option>
          <option value="WY">Wyoming (WY)</option>
          <option value="NY">New York (NY)</option>
          <option value="CA">California (CA)</option>
        </select>
        <label class="text-[11px] font-mono text-vektor-mut uppercase mt-4 mb-2 block">Quantity</label>
        <select id="limitSelect" class="w-full bg-vektor-canvas border border-vektor-line rounded px-3 py-2 text-sm">
          <option value="5">5 Leads (50 cr)</option>
          <option value="10" selected>10 Leads (100 cr)</option>
          <option value="25">25 Leads (250 cr)</option>
        </select>
      </div>
      <div class="flex flex-col justify-end">
        <button id="harvestBtn" onclick="runHarvest()" class="px-6 py-3 bg-vektor-cyan text-vektor-void font-display font-bold text-sm rounded hover:bg-vektor-cyan-hi transition">
          HARVEST INSTITUTIONAL LEADS
        </button>
        <div id="harvestStatus" class="text-xs text-vektor-sec mt-2 font-mono"></div>
      </div>
    </div>
  </div>

  <div id="radarBar" class="hidden h-1 bg-vektor-canvas border border-vektor-line rounded mb-6 overflow-hidden">
    <div class="h-full bg-vektor-cyan animate-pulse" style="width:100%"></div>
  </div>

  <div class="bg-vektor-surface border border-vektor-line rounded-lg p-5 mb-6">
    <h3 class="font-display font-bold text-sm text-vektor-pri mb-3">Automated Recurring Sweeps (Cron)</h3>
    <div id="schedulesList" class="space-y-3"></div>
  </div>

  <div class="bg-vektor-surface border border-vektor-line rounded-lg p-5">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-display font-bold text-sm text-vektor-pri">Harvested Leads</h3>
      <div class="flex gap-2">
        <button onclick="exportCsv()" class="text-xs px-3 py-1.5 border border-vektor-hi rounded text-vektor-sec hover:text-vektor-cyan">Export CSV</button>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-vektor-sec text-left border-b border-vektor-line">
            <th class="py-2.5 font-medium">Contact</th>
            <th class="py-2.5 font-medium">Entity / Fund</th>
            <th class="py-2.5 font-medium">Role</th>
            <th class="py-2.5 font-medium">Jurisdiction</th>
            <th class="py-2.5 font-medium">Deal Size</th>
            <th class="py-2.5 font-medium">Badges</th>
            <th class="py-2.5 font-medium">Phone</th>
            <th class="py-2.5 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody id="harvestResults" class="divide-y divide-vektor-line">
          <tr><td colspan="8" class="py-6 text-center text-vektor-mut">No leads harvested yet. Press HARVEST to begin.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
  let lastBatch = null;
  let currentJurisdiction = 'US';
  window.__harvestLeadsMap = {};

  const US_STATES = [
    { value: '', label: 'All Jurisdictions' },
    { value: 'FL', label: 'Florida (FL)' },
    { value: 'TX', label: 'Texas (TX)' },
    { value: 'DE', label: 'Delaware (DE)' },
    { value: 'NV', label: 'Nevada (NV)' },
    { value: 'WY', label: 'Wyoming (WY)' },
    { value: 'NY', label: 'New York (NY)' },
    { value: 'CA', label: 'California (CA)' }
  ];

  const MX_STATES = [
    { value: '', label: 'Todas las Entidades' },
    { value: 'CDMX', label: 'CDMX (Polanco / Lomas)' },
    { value: 'NL', label: 'Nuevo León (San Pedro)' },
    { value: 'JAL', label: 'Jalisco (Zapopan)' },
    { value: 'QROO', label: 'Quintana Roo (Tulum / Riviera)' },
    { value: 'YUC', label: 'Yucatán (Mérida)' },
    { value: 'BCS', label: 'Baja California Sur (Los Cabos)' }
  ];

  function setJurisdiction(j) {
    currentJurisdiction = j;
    const usBtn = document.getElementById('jurUS');
    const mxBtn = document.getElementById('jurMX');
    const usSources = document.getElementById('usSources');
    const mxSources = document.getElementById('mxSources');
    const stateFilter = document.getElementById('stateFilter');

    if (j === 'US') {
      usBtn.className = 'px-4 py-2 rounded bg-vektor-cyan text-vektor-void font-bold text-sm';
      mxBtn.className = 'px-4 py-2 rounded border border-vektor-hi text-vektor-sec text-sm';
      usSources.classList.remove('hidden');
      mxSources.classList.add('hidden');
      stateFilter.innerHTML = US_STATES.map(s => '<option value="' + s.value + '">' + s.label + '</option>').join('');
      const first = usSources.querySelector('input[name="source"]');
      if (first) first.checked = true;
    } else {
      mxBtn.className = 'px-4 py-2 rounded bg-vektor-cyan text-vektor-void font-bold text-sm';
      usBtn.className = 'px-4 py-2 rounded border border-vektor-hi text-vektor-sec text-sm';
      mxSources.classList.remove('hidden');
      usSources.classList.add('hidden');
      stateFilter.innerHTML = MX_STATES.map(s => '<option value="' + s.value + '">' + s.label + '</option>').join('');
      const first = mxSources.querySelector('input[name="source"]');
      if (first) first.checked = true;
    }
  }

  async function runHarvest() {
    const source = document.querySelector('input[name="source"]:checked').value;
    const state = document.getElementById('stateFilter').value;
    const limit = Number(document.getElementById('limitSelect').value);
    const btn = document.getElementById('harvestBtn');
    const status = document.getElementById('harvestStatus');
    const radar = document.getElementById('radarBar');
    btn.disabled = true;
    btn.textContent = 'HARVESTING...';
    radar.classList.remove('hidden');
    status.textContent = 'Mining institutional records...';
    try {
      const body = { source, limit, jurisdiction: currentJurisdiction };
      if (state) {
        if (currentJurisdiction === 'MX') body.entidadFederativa = state;
        else body.state = state;
      }
      const res = await api('/api/v1/intelligence/harvest', { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        status.textContent = data.error || 'Harvest failed';
        return;
      }
      lastBatch = data.batch;
      status.textContent = 'Harvested ' + data.batch.leads.length + ' leads · ' + data.batch.creditsConsumed + ' credits consumed';
      renderResults(data.batch.leads);
    } catch (e) {
      status.textContent = 'Error: ' + e.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'HARVEST INSTITUTIONAL LEADS';
      radar.classList.add('hidden');
    }
  }

  function renderResults(leads) {
    const tbody = document.getElementById('harvestResults');
    if (!leads || !leads.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="py-6 text-center text-vektor-mut">No leads found.</td></tr>';
      return;
    }
    window.__harvestLeadsMap = window.__harvestLeadsMap || {};
    tbody.innerHTML = leads.map(l => {
      window.__harvestLeadsMap[l.id] = l;
      const badges = [];
      if (l.accreditationBadge) badges.push('<span class="badge-info px-1.5 py-0.5 rounded text-[10px]">' + l.accreditationBadge + '</span>');
      if (l.dncStatus === 'clean') badges.push('<span class="badge-success px-1.5 py-0.5 rounded text-[10px]">REPEP Clean</span>');
      if (l.isTcpaSafe) badges.push('<span class="badge-success px-1.5 py-0.5 rounded text-[10px]">TCPA Safe</span>');
      if (l.mexicoMetadata && l.mexicoMetadata.folioMercantil) badges.push('<span class="badge-warning px-1.5 py-0.5 rounded text-[10px]">S.A.P.I. Verificada</span>');
      return '<tr class="hover:bg-vektor-surface-2/60 transition">' +
        '<td class="py-2.5 text-vektor-pri font-medium">' + l.primaryContactName + '</td>' +
        '<td class="py-2.5 text-vektor-sec">' + l.entityOrFundName + '</td>' +
        '<td class="py-2.5 font-mono text-vektor-sec text-[11px]">' + l.contactRole + '</td>' +
        '<td class="py-2.5 font-mono text-vektor-cyan">' + l.jurisdiction + '</td>' +
        '<td class="py-2.5 font-mono text-vektor-sec">' + l.dealSizeFormatted + '</td>' +
        '<td class="py-2.5 space-x-1">' + badges.join(' ') + '</td>' +
        '<td class="py-2.5 font-mono text-vektor-sec text-[11px]">' + (l.phone || '—') + '</td>' +
        '<td class="py-2.5 text-right"><button onclick="downloadDossier(\'' + l.id + '\')" class="text-vektor-cyan hover:underline font-mono text-[11px]">Dossier PDF</button></td>' +
      '</tr>';
    }).join('');
  }

  async function loadSchedules() {
    try {
      const res = await api('/api/v1/intelligence/harvest/schedules');
      const data = await res.json();
      const list = document.getElementById('schedulesList');
      const schedules = data.schedules || [];
      if (!schedules.length) {
        list.innerHTML = '<div class="text-vektor-mut text-sm">No automated sweeps configured.</div>';
        return;
      }
      list.innerHTML = schedules.map(s => {
        return '<div class="bg-vektor-canvas border border-vektor-line rounded p-4 flex items-center justify-between">' +
          '<div>' +
            '<div class="font-display font-semibold text-vektor-pri">' + (s.name || 'Scheduled Harvest') + '</div>' +
            '<div class="text-xs text-vektor-sec mt-1">Source: ' + s.source + ' · ' + s.jurisdiction + ' · ' + (s.state || 'All') + '</div>' +
            '<div class="text-[11px] text-vektor-mut mt-1 font-mono">CRON ACTIVE: ' + s.cron_expression + ' → Syncing to CRM</div>' +
          '</div>' +
          '<button onclick="runSchedule(\'' + s.id + '\')" class="px-3 py-1.5 text-xs border border-vektor-hi rounded text-vektor-sec hover:text-vektor-cyan">RUN NOW</button>' +
        '</div>';
      }).join('');
    } catch (e) {
      console.warn('schedules load deferred', e);
    }
  }

  async function runSchedule(id) {
    const status = document.getElementById('harvestStatus');
    status.textContent = 'Running scheduled sweep...';
    try {
      const res = await api('/api/v1/intelligence/harvest/schedules/' + id + '/run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { status.textContent = data.error || 'Run failed'; return; }
      status.textContent = 'Sweep completed: ' + (data.batch?.leads?.length || 0) + ' leads';
      if (data.batch?.leads) renderResults(data.batch.leads);
    } catch (e) {
      status.textContent = 'Error: ' + e.message;
    }
  }

  async function downloadDossier(id) {
    const lead = (window.__harvestLeadsMap && window.__harvestLeadsMap[id]) || (lastBatch && lastBatch.leads.find(x => x.id === id));
    if (!lead) {
      alert('Lead data not found');
      return;
    }
    try {
      const res = await api('/api/v1/intelligence/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          subjectName: lead.entityOrFundName,
          jurisdiction: currentJurisdiction,
          mexicoMetadata: lead.mexicoMetadata
        })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Report failed'); return; }
      const pdfRes = await api('/api/v1/intelligence/reports/' + data.reportId + '/download');
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Hermes-Dossier-' + (lead.jurisdiction || 'Lead') + '-' + data.reportId.slice(0, 8) + '.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error downloading dossier: ' + e.message);
    }
  }

  function exportCsv() {
    if (!lastBatch || !lastBatch.leads) return;
    const rows = [['Contact','Entity','Role','Jurisdiction','DealSize','Phone','Email','TCPA']];
    lastBatch.leads.forEach(l => rows.push([l.primaryContactName, l.entityOrFundName, l.contactRole, l.jurisdiction, l.dealSizeFormatted, l.phone, l.email, l.isTcpaSafe]));
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hermes-harvest.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  loadSchedules();
  </script>
  `;
  return layout('Harvester', body);
}
