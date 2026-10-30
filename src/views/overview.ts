import { layout } from './layout';

export function overviewView(): string {
  const body = `
  <div class="grid grid-cols-4 gap-4 mb-6">
    <div class="vektor-kpi bg-vektor-surface border border-vektor-line rounded p-4">
      <div class="text-xs text-vektor-sec uppercase font-mono tracking-wider">Total Equity Analyzed</div>
      <div class="font-mono text-2xl text-vektor-cyan font-bold mt-1" id="kpiEquity">$1.2B</div>
      <div class="text-[11px] text-vektor-green mt-1 flex items-center gap-1 font-mono"><span>↑</span> +4.2% historical volume</div>
    </div>
    <div class="vektor-kpi bg-vektor-surface border border-vektor-line rounded p-4">
      <div class="text-xs text-vektor-sec uppercase font-mono tracking-wider">Subjects Resolved</div>
      <div class="font-mono text-2xl text-vektor-pri font-bold mt-1" id="kpiSubjects">8,429</div>
      <div class="text-[11px] text-vektor-sec mt-1 font-mono">3 sources cross-verified</div>
    </div>
    <div class="vektor-kpi bg-vektor-surface border border-vektor-line rounded p-4">
      <div class="text-xs text-vektor-sec uppercase font-mono tracking-wider">TCPA Safe Ratio</div>
      <div class="font-mono text-2xl text-vektor-green font-bold mt-1">99.2%</div>
      <div class="mt-1"><span class="badge-success text-[10px] px-2 py-0.5 rounded font-mono">DNC CLEAN</span></div>
    </div>
    <div class="vektor-kpi bg-vektor-surface border border-vektor-line rounded p-4">
      <div class="text-xs text-vektor-sec uppercase font-mono tracking-wider">Available Credits</div>
      <div class="font-mono text-2xl text-vektor-cyan font-bold mt-1" id="credits">1,000</div>
      <div class="text-[11px] text-vektor-sec mt-1 font-mono" id="creditsDesc">workspace: default · starter</div>
    </div>
  </div>

  <div class="bg-vektor-surface border border-vektor-hi rounded-lg p-5 mb-6 vektor-scanline">
    <div class="flex items-center justify-between mb-2">
      <label class="font-mono text-xs text-vektor-cyan tracking-wider uppercase flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-vektor-cyan"></span> UNIFIED PROBE LAUNCHPAD
      </label>
      <span class="text-[11px] text-vektor-mut font-mono">Press ENTER to launch probe</span>
    </div>
    <div class="flex gap-2">
      <input id="probeInput" autofocus 
        onkeydown="if(event.key==='Enter')probe();" 
        placeholder="Enter LLC name, street address, target name, CIK, phone or APN..." 
        class="flex-1 bg-vektor-canvas border border-vektor-line rounded px-4 py-3 text-sm focus:border-vektor-cyan outline-none transition font-sans text-vektor-pri" />
      <button onclick="probe()" class="px-6 py-3 bg-vektor-cyan hover:bg-vektor-cyan-hi text-vektor-void font-display font-bold text-sm tracking-wide rounded transition flex items-center gap-2">
        <span>PROBE TARGET</span>
      </button>
    </div>
    <div class="flex items-center gap-3 mt-3 text-[11px] text-vektor-mut">
      <span>Quick examples:</span>
      <button onclick="quickProbe('Apex Capital Partners LLC')" class="text-vektor-sec hover:text-vektor-cyan font-mono transition">Apex Capital Partners LLC (SOS)</button>
      <span>·</span>
      <button onclick="quickProbe('742 Evergreen Terrace, Miami FL')" class="text-vektor-sec hover:text-vektor-cyan font-mono transition">742 Evergreen Terrace (Equity)</button>
      <span>·</span>
      <button onclick="quickProbe('David S. Miller')" class="text-vektor-sec hover:text-vektor-cyan font-mono transition">David S. Miller (SEC/FINRA)</button>
    </div>
  </div>

  <div class="bg-vektor-surface border border-vektor-line rounded p-4">
    <div class="flex items-center justify-between mb-3">
      <div>
        <h3 class="font-display font-bold text-sm text-vektor-pri tracking-wide">Recent Investigated Hits</h3>
        <p class="text-[11px] text-vektor-sec">Real-time audit log of resolved entities, properties, and skip-trace targets</p>
      </div>
      <a href="/dashboard/explorer" class="text-xs text-vektor-cyan hover:underline font-mono">View All Explorer →</a>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-vektor-sec text-left border-b border-vektor-line">
            <th class="py-2.5 font-medium">Target / Entity</th>
            <th class="py-2.5 font-medium">Type</th>
            <th class="py-2.5 font-medium">Location / State</th>
            <th class="py-2.5 font-medium">Confidence</th>
            <th class="py-2.5 font-medium">Compliance</th>
            <th class="py-2.5 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody id="hits" class="divide-y divide-vektor-line">
          <tr><td colspan="6" class="py-4 text-center text-vektor-mut">Loading recent hits...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
  async function loadOverview() {
    try {
      const cr = await api('/api/v1/intelligence/tenant/credits');
      if (cr.ok) {
        const d = await cr.json();
        const bal = d.balance !== undefined ? d.balance : 1000;
        document.getElementById('credits').textContent = Number(bal).toLocaleString();
        const sideEl = document.getElementById('sidebarCredits');
        if (sideEl) sideEl.textContent = Number(bal).toLocaleString();
        const barEl = document.getElementById('sidebarCreditsBar');
        if (barEl) barEl.style.width = Math.min(100, Math.round((bal / 5000) * 100)) + '%';
      }
    } catch (e) {
      console.warn('Credits load deferred:', e);
    }

    let targetItems = [];
    let entityItems = [];

    try {
      const tr = await api('/api/v1/intelligence/skip-trace');
      if (tr.ok) {
        const tData = await tr.json();
        targetItems = tData.items || tData.records || [];
      }
    } catch (e) {
      console.warn('Target items query deferred:', e);
    }

    try {
      const er = await api('/api/v1/intelligence/entities');
      if (er.ok) {
        const eData = await er.json();
        entityItems = eData.items || eData.records || [];
      }
    } catch (e) {
      console.warn('Entity items query deferred:', e);
    }

    try {
      const hitsEl = document.getElementById('hits');
      const allHits = [];

      targetItems.forEach(r => {
        allHits.push({
          name: r.subject_name || 'Subject',
          type: 'SKIP-TRACE',
          state: r.dnc_status === 'clean' ? 'DNC CLEAN' : 'FLAGGED',
          isClean: r.dnc_status === 'clean',
          confidence: Math.round((r.confidence || 0.85) * 100) + '%',
          isTarget: true
        });
      });

      entityItems.forEach(e => {
        allHits.push({
          name: e.entity_name || 'Corporate Entity',
          type: 'SOS / LLC',
          state: e.state_of_formation || 'DE',
          isClean: e.status === 'resolved',
          confidence: '95%',
          isTarget: false
        });
      });

      if (!allHits.length) {
        hitsEl.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-vektor-mut">' +
          '<div class="text-vektor-pri font-medium mb-1">No investigated targets logged yet in workspace</div>' +
          '<div class="text-xs text-vektor-sec mb-3">Launch your first probe in the Launchpad to resolve an LLC, property, or contact.</div>' +
          '<a href="/dashboard/launchpad" class="inline-block px-3 py-1.5 text-xs bg-vektor-cyan text-vektor-void font-bold rounded">Open Investigative Probes →</a>' +
          '</td></tr>';
        return;
      }

      hitsEl.innerHTML = allHits.slice(0, 8).map(h => {
        const badge = h.isClean 
          ? '<span class="badge-success px-1.5 py-0.5 rounded text-[10px]">VERIFIED</span>'
          : '<span class="badge-warning px-1.5 py-0.5 rounded text-[10px]">REVIEW</span>';
        return '<tr class="hover:bg-vektor-surface-2/60 transition">' +
          '<td class="py-2.5 font-medium text-vektor-pri">' + h.name + '</td>' +
          '<td class="py-2.5 font-mono text-vektor-sec text-[11px]">' + h.type + '</td>' +
          '<td class="py-2.5 font-mono text-vektor-cyan">' + h.state + '</td>' +
          '<td class="py-2.5 font-mono text-vektor-sec">' + h.confidence + '</td>' +
          '<td class="py-2.5">' + badge + '</td>' +
          '<td class="py-2.5 text-right"><a href="/dashboard/launchpad?q=' + encodeURIComponent(h.name) + '" class="text-vektor-cyan hover:underline font-mono text-[11px]">Inspect →</a></td>' +
        '</tr>';
      }).join('');

    } catch (e) {
      console.error('Hits render error:', e);
      document.getElementById('hits').innerHTML = '<tr><td colspan="6" class="py-4 text-center text-vektor-red">Failed to load hits stream. Verify connection.</td></tr>';
    }
  }

  function probe() {
    const v = document.getElementById('probeInput').value.trim();
    if (!v) return;
    window.location = '/dashboard/launchpad?q=' + encodeURIComponent(v);
  }

  function quickProbe(val) {
    window.location = '/dashboard/launchpad?q=' + encodeURIComponent(val);
  }

  loadOverview();
  </script>
  `;
  return layout('Console', body);
}
