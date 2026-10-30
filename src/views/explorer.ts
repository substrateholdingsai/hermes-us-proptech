import { layout } from './layout';

export function explorerView(): string {
  const body = `
  <div class="flex items-center justify-between mb-4">
    <div>
      <h2 class="font-display text-2xl font-bold tracking-tight">Target & Forensics Explorer</h2>
      <p class="text-xs text-vektor-sec mt-1">Cross-database records with tabular precision and compliance verification</p>
    </div>
    <div class="flex gap-2">
      <button onclick="loadExplorerData()" class="px-3 py-1.5 text-xs bg-vektor-surface-2 border border-vektor-line hover:border-vektor-cyan text-vektor-sec hover:text-vektor-pri rounded flex items-center gap-1.5 transition">
        <span>↻ Refresh</span>
      </button>
    </div>
  </div>

  <div x-data="{ tab: 'targets' }" class="space-y-4">
    <div class="flex gap-2 text-xs border-b border-vektor-line pb-2">
      <button @click="tab='targets'; loadTargets()" :class="tab==='targets' ? 'bg-vektor-cyan text-vektor-void font-bold' : 'bg-vektor-surface-2 text-vektor-sec hover:text-vektor-pri'" class="px-3.5 py-1.5 rounded transition">Skip-Trace Targets</button>
      <button @click="tab='props'; loadProps()" :class="tab==='props' ? 'bg-vektor-cyan text-vektor-void font-bold' : 'bg-vektor-surface-2 text-vektor-sec hover:text-vektor-pri'" class="px-3.5 py-1.5 rounded transition">Properties & Equity</button>
      <button @click="tab='ents'; loadEntities()" :class="tab==='ents' ? 'bg-vektor-cyan text-vektor-void font-bold' : 'bg-vektor-surface-2 text-vektor-sec hover:text-vektor-pri'" class="px-3.5 py-1.5 rounded transition">Corporate Entities (SOS)</button>
    </div>

    <!-- TAB 1: TARGETS -->
    <div x-show="tab==='targets'" class="bg-vektor-surface border border-vektor-line rounded p-4">
      <div class="flex justify-between items-center mb-3">
        <input id="targetSearch" oninput="filterTargets()" placeholder="Filter targets by name, phone or email..." class="w-72 bg-vektor-canvas border border-vektor-line rounded px-3 py-1.5 text-xs focus:border-vektor-cyan outline-none" />
        <span id="targetCount" class="text-xs font-mono text-vektor-mut">0 records</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-vektor-sec border-b border-vektor-line text-left">
              <th class="py-2.5 font-medium">Subject</th>
              <th class="py-2.5 font-medium">Phone (E.164)</th>
              <th class="py-2.5 font-medium">Line Type</th>
              <th class="py-2.5 font-medium">DNC Status</th>
              <th class="py-2.5 font-medium">Email</th>
              <th class="py-2.5 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody id="targetRows" class="divide-y divide-vektor-line">
            <tr><td colspan="6" class="py-4 text-center text-vektor-mut">Loading targets...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 2: PROPERTIES -->
    <div x-show="tab==='props'" class="bg-vektor-surface border border-vektor-line rounded p-4" style="display:none">
      <div class="flex justify-between items-center mb-3">
        <input id="propSearch" oninput="filterProps()" placeholder="Filter by address, county or state..." class="w-72 bg-vektor-canvas border border-vektor-line rounded px-3 py-1.5 text-xs focus:border-vektor-cyan outline-none" />
        <span id="propCount" class="text-xs font-mono text-vektor-mut">0 records</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs font-mono">
          <thead>
            <tr class="text-vektor-sec border-b border-vektor-line text-left font-sans">
              <th class="py-2.5 font-medium">Address</th>
              <th class="py-2.5 font-medium">County / State</th>
              <th class="py-2.5 font-medium text-right">Market Value</th>
              <th class="py-2.5 font-medium text-right">Mortgage</th>
              <th class="py-2.5 font-medium text-right">Equity ($)</th>
              <th class="py-2.5 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody id="propRows" class="divide-y divide-vektor-line">
            <tr><td colspan="6" class="py-4 text-center text-vektor-mut font-sans">Loading properties...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: ENTITIES -->
    <div x-show="tab==='ents'" class="bg-vektor-surface border border-vektor-line rounded p-4" style="display:none">
      <div class="flex justify-between items-center mb-3">
        <input id="entSearch" oninput="filterEntities()" placeholder="Filter by entity name, state or UBO..." class="w-72 bg-vektor-canvas border border-vektor-line rounded px-3 py-1.5 text-xs focus:border-vektor-cyan outline-none" />
        <span id="entCount" class="text-xs font-mono text-vektor-mut">0 records</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-vektor-sec border-b border-vektor-line text-left">
              <th class="py-2.5 font-medium">Entity Name</th>
              <th class="py-2.5 font-medium">State</th>
              <th class="py-2.5 font-medium">Filing #</th>
              <th class="py-2.5 font-medium">Registered Agent</th>
              <th class="py-2.5 font-medium">Resolved UBO</th>
              <th class="py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody id="entRows" class="divide-y divide-vektor-line">
            <tr><td colspan="6" class="py-4 text-center text-vektor-mut">Loading entities...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
  let cachedTargets = [], cachedProps = [], cachedEnts = [];

  function formatDollar(cents) {
    if (!cents) return '$0';
    return '$' + Math.round(cents / 100).toLocaleString('en-US');
  }

  async function loadTargets() {
    try {
      const res = await api('/api/v1/intelligence/skip-trace');
      const data = await res.json();
      cachedTargets = data.records || [];
      renderTargets(cachedTargets);
    } catch (e) {
      document.getElementById('targetRows').innerHTML = '<tr><td colspan="6" class="py-4 text-center text-vektor-red">Failed to load targets</td></tr>';
    }
  }

  function renderTargets(list) {
    const el = document.getElementById('targetRows');
    document.getElementById('targetCount').textContent = list.length + ' records';
    if (!list.length) {
      el.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-vektor-mut">No target records found. Execute a Skip-Trace probe in Launchpad.</td></tr>';
      return;
    }
    el.innerHTML = list.map(t => {
      const isClean = t.dnc_status === 'clean';
      const isMobile = t.line_type === 'mobile';
      const dncBadge = isClean ? '<span class="badge-success px-1.5 py-0.5 rounded text-[10px]">DNC CLEAN</span>' : '<span class="badge-danger px-1.5 py-0.5 rounded text-[10px]">FLAGGED</span>';
      const lineBadge = isMobile ? '<span class="badge-info px-1.5 py-0.5 rounded text-[10px]">MOBILE</span>' : '<span class="badge-warning px-1.5 py-0.5 rounded text-[10px]">' + (t.line_type || 'UNKNOWN').toUpperCase() + '</span>';
      return '<tr class="hover:bg-vektor-surface-2/60 transition">' +
        '<td class="py-2.5 font-medium text-vektor-pri">' + (t.subject_name || '—') + '</td>' +
        '<td class="py-2.5 font-mono text-vektor-cyan">' + (t.phone || '—') + '</td>' +
        '<td class="py-2.5">' + lineBadge + '</td>' +
        '<td class="py-2.5">' + dncBadge + '</td>' +
        '<td class="py-2.5 font-mono text-vektor-sec">' + (t.email || '—') + '</td>' +
        '<td class="py-2.5 font-mono text-vektor-sec">' + Math.round((t.confidence || 0) * 100) + '%</td>' +
      '</tr>';
    }).join('');
  }

  function filterTargets() {
    const q = document.getElementById('targetSearch').value.toLowerCase();
    const filtered = cachedTargets.filter(t => 
      (t.subject_name || '').toLowerCase().includes(q) ||
      (t.phone || '').toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q)
    );
    renderTargets(filtered);
  }

  async function loadProps() {
    try {
      const res = await api('/api/v1/intelligence/properties');
      const data = await res.json();
      cachedProps = data.records || [];
      renderProps(cachedProps);
    } catch (e) {
      document.getElementById('propRows').innerHTML = '<tr><td colspan="6" class="py-4 text-center text-vektor-red">Failed to load properties</td></tr>';
    }
  }

  function renderProps(list) {
    const el = document.getElementById('propRows');
    document.getElementById('propCount').textContent = list.length + ' records';
    if (!list.length) {
      el.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-vektor-mut font-sans">No property records found. Run a Property Equity probe in Launchpad.</td></tr>';
      return;
    }
    el.innerHTML = list.map(p => {
      const equityPct = p.market_value_cents > 0 ? Math.round((p.equity_cents / p.market_value_cents) * 100) : 0;
      const statusBadge = equityPct >= 50 
        ? '<span class="badge-success px-1.5 py-0.5 rounded text-[10px] font-sans">EQUITY ' + equityPct + '%</span>'
        : '<span class="badge-warning px-1.5 py-0.5 rounded text-[10px] font-sans">EQUITY ' + equityPct + '%</span>';
      return '<tr class="hover:bg-vektor-surface-2/60 transition">' +
        '<td class="py-2.5 text-vektor-pri font-sans">' + (p.address || '—') + '</td>' +
        '<td class="py-2.5 text-vektor-sec font-sans">' + (p.county || '—') + ', ' + (p.state || '—') + '</td>' +
        '<td class="py-2.5 text-right text-vektor-pri">' + formatDollar(p.market_value_cents) + '</td>' +
        '<td class="py-2.5 text-right text-vektor-sec">' + formatDollar(p.mortgage_balance_cents) + '</td>' +
        '<td class="py-2.5 text-right text-vektor-cyan font-bold">' + formatDollar(p.equity_cents) + '</td>' +
        '<td class="py-2.5 text-center">' + statusBadge + '</td>' +
      '</tr>';
    }).join('');
  }

  function filterProps() {
    const q = document.getElementById('propSearch').value.toLowerCase();
    const filtered = cachedProps.filter(p => 
      (p.address || '').toLowerCase().includes(q) ||
      (p.county || '').toLowerCase().includes(q) ||
      (p.state || '').toLowerCase().includes(q)
    );
    renderProps(filtered);
  }

  async function loadEntities() {
    try {
      const res = await api('/api/v1/intelligence/entities');
      const data = await res.json();
      cachedEnts = data.records || [];
      renderEntities(cachedEnts);
    } catch (e) {
      document.getElementById('entRows').innerHTML = '<tr><td colspan="6" class="py-4 text-center text-vektor-red">Failed to load entities</td></tr>';
    }
  }

  function renderEntities(list) {
    const el = document.getElementById('entRows');
    document.getElementById('entCount').textContent = list.length + ' records';
    if (!list.length) {
      el.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-vektor-mut">No entity records found. Run an Entity Resolution probe in Launchpad.</td></tr>';
      return;
    }
    el.innerHTML = list.map(e => {
      const isResolved = e.status === 'resolved';
      const badge = isResolved 
        ? '<span class="badge-success px-1.5 py-0.5 rounded text-[10px]">RESOLVED</span>' 
        : '<span class="badge-warning px-1.5 py-0.5 rounded text-[10px]">' + (e.status || 'PENDING').toUpperCase() + '</span>';
      return '<tr class="hover:bg-vektor-surface-2/60 transition">' +
        '<td class="py-2.5 font-medium text-vektor-pri">' + (e.entity_name || '—') + '</td>' +
        '<td class="py-2.5 font-mono text-vektor-cyan">' + (e.state_of_formation || '—') + '</td>' +
        '<td class="py-2.5 font-mono text-vektor-sec">' + (e.sos_filing_number || '—') + '</td>' +
        '<td class="py-2.5 text-vektor-sec">' + (e.registered_agent || '—') + '</td>' +
        '<td class="py-2.5 font-medium text-vektor-cyan">' + (e.ubo_name || '—') + '</td>' +
        '<td class="py-2.5">' + badge + '</td>' +
      '</tr>';
    }).join('');
  }

  function filterEntities() {
    const q = document.getElementById('entSearch').value.toLowerCase();
    const filtered = cachedEnts.filter(e => 
      (e.entity_name || '').toLowerCase().includes(q) ||
      (e.state_of_formation || '').toLowerCase().includes(q) ||
      (e.ubo_name || '').toLowerCase().includes(q)
    );
    renderEntities(filtered);
  }

  function loadExplorerData() {
    loadTargets();
    loadProps();
    loadEntities();
  }

  loadTargets();
  </script>
  `;
  return layout('Explorer', body);
}
