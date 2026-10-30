import { layout } from './layout';

export function launchpadView(): string {
  const body = `<h2 class="font-display text-xl mb-4">Probes</h2>
  <div x-data="{tab:'sos'}" class="space-y-4">
    <div class="flex gap-2 text-sm">
      <button @click="tab='sos'" class="px-3 py-1 rounded bg-vektor-surface-2">Corporate SOS</button>
      <button @click="tab='prop'" class="px-3 py-1 rounded bg-vektor-surface-2">Property Equity</button>
      <button @click="tab='sec'" class="px-3 py-1 rounded bg-vektor-surface-2">SEC & FINRA</button>
      <button @click="tab='skip'" class="px-3 py-1 rounded bg-vektor-surface-2">TCPA Skip-Trace</button>
    </div>
    <div x-show="tab==='sos'" class="bg-vektor-surface border border-vektor-line rounded p-4 space-y-2">
      <input id="sosName" placeholder="Entity Name" class="w-full bg-vektor-canvas border border-vektor-line rounded px-3 py-2 text-sm" />
      <select id="sosState" class="bg-vektor-canvas border border-vektor-line rounded px-3 py-2 text-sm"><option>TX</option><option>FL</option><option>WY</option><option>DE</option><option>NV</option></select>
      <button onclick="runSos()" class="px-4 py-2 bg-vektor-cyan text-vektor-void font-bold rounded">Resolve</button>
      <pre id="sosOut" class="font-mono text-xs mt-3"></pre>
    </div>
    <div x-show="tab==='prop'" class="bg-vektor-surface border border-vektor-line rounded p-4 space-y-2">
      <input id="propAddr" placeholder="Property Address" class="w-full bg-vektor-canvas border border-vektor-line rounded px-3 py-2 text-sm" />
      <button onclick="runProp()" class="px-4 py-2 bg-vektor-cyan text-vektor-void font-bold rounded">Analyze</button>
      <pre id="propOut" class="font-mono text-xs mt-3"></pre>
    </div>
    <div x-show="tab==='sec'" class="bg-vektor-surface border border-vektor-line rounded p-4 space-y-2">
      <input id="secSubject" placeholder="Subject Name" class="w-full bg-vektor-canvas border border-vektor-line rounded px-3 py-2 text-sm" />
      <input id="secEntity" placeholder="Entity Name" class="w-full bg-vektor-canvas border border-vektor-line rounded px-3 py-2 text-sm" />
      <button onclick="runSec()" class="px-4 py-2 bg-vektor-cyan text-vektor-void font-bold rounded">Validate</button>
      <pre id="secOut" class="font-mono text-xs mt-3"></pre>
    </div>
    <div x-show="tab==='skip'" class="bg-vektor-surface border border-vektor-line rounded p-4 space-y-2">
      <input id="skipName" placeholder="Subject Name" class="w-full bg-vektor-canvas border border-vektor-line rounded px-3 py-2 text-sm" />
      <button onclick="runSkip()" class="px-4 py-2 bg-vektor-cyan text-vektor-void font-bold rounded">Trace</button>
      <pre id="skipOut" class="font-mono text-xs mt-3"></pre>
    </div>
  </div>
  <script>
  async function post(path,body){const r=await api(path,{method:'POST',body:JSON.stringify(body)});return r.json();}
  async function runSos(){document.getElementById('sosOut').textContent=JSON.stringify(await post('/api/v1/intelligence/entity-resolution',{entityName:document.getElementById('sosName').value,state:document.getElementById('sosState').value}),null,2);}
  async function runProp(){document.getElementById('propOut').textContent=JSON.stringify(await post('/api/v1/intelligence/property-equity',{propertyAddress:document.getElementById('propAddr').value}),null,2);}
  async function runSec(){document.getElementById('secOut').textContent=JSON.stringify(await post('/api/v1/intelligence/sec-validation',{subjectName:document.getElementById('secSubject').value,entityName:document.getElementById('secEntity').value}),null,2);}
  async function runSkip(){document.getElementById('skipOut').textContent=JSON.stringify(await post('/api/v1/intelligence/skip-trace',{subjectName:document.getElementById('skipName').value}),null,2);}
  </script>`;
  return layout('Probes', body);
}
