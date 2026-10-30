import { layout } from './layout';

export function overviewView(): string {
  const body = `
  <div class="grid grid-cols-4 gap-4 mb-6">
    <div class="bg-vektor-surface border border-vektor-line rounded p-4"><div class="text-xs text-vektor-sec">Total Equity</div><div class="font-mono text-2xl text-vektor-cyan">$1.2B</div><div class="text-xs text-vektor-green">+4.2%</div></div>
    <div class="bg-vektor-surface border border-vektor-line rounded p-4"><div class="text-xs text-vektor-sec">Subjects Resolved</div><div class="font-mono text-2xl">8,429</div></div>
    <div class="bg-vektor-surface border border-vektor-line rounded p-4"><div class="text-xs text-vektor-sec">TCPA Compliance</div><div class="font-mono text-2xl">99.2%</div><span class="badge-success text-xs px-2 py-0.5 rounded">TCPA Safe</span></div>
    <div class="bg-vektor-surface border border-vektor-line rounded p-4"><div class="text-xs text-vektor-sec">Available Credits</div><div class="font-mono text-2xl" id="credits">—</div></div>
  </div>
  <div class="bg-vektor-surface border border-vektor-line rounded p-4 mb-6 vektor-scanline">
    <input id="probeInput" autofocus placeholder="Enter LLC name, street address, target name, phone or CIK..." class="w-full bg-vektor-canvas border border-vektor-line rounded px-4 py-3 text-sm focus:border-vektor-cyan outline-none" />
    <button onclick="probe()" class="mt-3 px-4 py-2 bg-vektor-cyan text-vektor-void font-display font-bold rounded">PROBE TARGET</button>
  </div>
  <div class="bg-vektor-surface border border-vektor-line rounded p-4">
    <h3 class="font-display mb-3">Recent Hits</h3>
    <table class="w-full text-sm"><thead><tr class="text-vektor-sec text-left"><th class="py-2">Subject</th><th>Type</th><th>Status</th></tr></thead><tbody id="hits"></tbody></table>
  </div>
  <script>
  async function loadCredits(){const r=await api('/api/v1/intelligence/tenant/credits');if(r.ok){const d=await r.json();document.getElementById('credits').textContent=d.balance;}}
  function probe(){const v=document.getElementById('probeInput').value;window.location='/dashboard/launchpad?q='+encodeURIComponent(v);}
  loadCredits();
  </script>`;
  return layout('Console', body);
}
