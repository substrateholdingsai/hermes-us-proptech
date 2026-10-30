export function layout(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · VEKTOR</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script>tailwind.config={theme:{extend:{colors:{'vektor-void':'#0A0E14','vektor-canvas':'#0F1419','vektor-surface':'#161B22','vektor-surface-2':'#1C2128','vektor-line':'#21262D','vektor-hi':'#30363D','vektor-pri':'#E6EDF3','vektor-sec':'#8B949E','vektor-mut':'#6E7681','vektor-cyan':'#22D3EE','vektor-cyan-hi':'#67E8F9','vektor-green':'#3FB950','vektor-amber':'#D29922','vektor-red':'#F85149','vektor-blue':'#79C0FF'}}}};</script>
<style>
body{font-family:Inter,sans-serif;background:#0A0E14;color:#E6EDF3;}
.font-display{font-family:'Space Grotesk',sans-serif;}
.font-mono{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;}
.badge-success{background:rgba(63,185,80,.14);color:#3FB950;border:1px solid rgba(63,185,80,.30);}
.badge-warning{background:rgba(210,153,34,.14);color:#D29922;border:1px solid rgba(210,153,34,.30);}
.badge-danger{background:rgba(248,81,73,.14);color:#F85149;border:1px solid rgba(248,81,73,.30);}
.badge-info{background:rgba(121,192,255,.14);color:#79C0FF;border:1px solid rgba(121,192,255,.30);}
.vektor-credits-bar{height:6px;background:#22D3EE;border-radius:3px;}
.vektor-scanline{background:repeating-linear-gradient(0deg,rgba(34,211,238,.03) 0,rgba(34,211,238,.03) 1px,transparent 1px,transparent 3px);}
.vektor-watermark{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(-30deg);font-family:'JetBrains Mono',monospace;font-size:48px;color:rgba(248,81,73,.08);pointer-events:none;z-index:40;white-space:nowrap;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 1.5s infinite;}
</style></head><body class="bg-vektor-void text-vektor-pri">
<div class="flex h-screen">
<aside class="w-60 bg-vektor-surface border-r border-vektor-line p-4 flex flex-col gap-4">
  <div class="flex items-center gap-2"><img src="/assets/vektor/monogram-vektor.svg" class="w-8 h-8"><span class="font-display font-bold text-vektor-cyan">VEKTOR</span></div>
  <nav class="flex flex-col gap-1 text-sm">
    <a href="/dashboard" class="px-3 py-2 rounded hover:bg-vektor-surface-2">Console</a>
    <a href="/dashboard/launchpad" class="px-3 py-2 rounded hover:bg-vektor-surface-2">Probes</a>
    <a href="/dashboard/explorer" class="px-3 py-2 rounded hover:bg-vektor-surface-2">Explorer</a>
    <a href="/dashboard/audit" class="px-3 py-2 rounded hover:bg-vektor-surface-2">Audit Logs</a>
    <a href="/docs" class="px-3 py-2 rounded hover:bg-vektor-surface-2">API Docs (Swagger)</a>
  </nav>
  <div class="mt-auto">
    <div class="text-xs text-vektor-sec mb-1">credits · 1,247 / 5,000</div>
    <div class="vektor-credits-bar" style="width:25%"></div>
  </div>
</aside>
<main class="flex-1 flex flex-col">
  <header class="h-12 bg-vektor-canvas border-b border-vektor-line flex items-center justify-between px-4 text-xs">
    <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-vektor-green pulse"></span><span class="font-mono text-vektor-green">SYSTEM OPERATIONAL · vektor-ops</span></div>
    <div class="font-mono text-vektor-cyan">47 HITS · 24h</div>
    <button onclick="openKeyModal()" class="text-vektor-sec hover:text-vektor-cyan">⚙ API Key</button>
  </header>
  <section class="flex-1 overflow-auto p-6">${body}</section>
</main>
</div>
<div id="keyModal" class="hidden fixed inset-0 bg-black/60 flex items-center justify-center z-50">
  <div class="bg-vektor-surface p-6 rounded border border-vektor-hi w-96">
    <h3 class="font-display mb-3">API Key</h3>
    <input id="apiKeyInput" class="w-full bg-vektor-canvas border border-vektor-line rounded px-3 py-2 text-sm font-mono" />
    <div class="flex gap-2 mt-3 justify-end">
      <button onclick="closeKeyModal()" class="px-3 py-1 text-sm text-vektor-sec">Cancel</button>
      <button onclick="saveKey()" class="px-3 py-1 text-sm bg-vektor-cyan text-vektor-void rounded">Save</button>
    </div>
  </div>
</div>
<script>
const KEY_STORAGE='hermes_api_key';
function getApiKey(){return localStorage.getItem(KEY_STORAGE)||'hermes_dev_secret_key_2026';}
function openKeyModal(){document.getElementById('keyModal').classList.remove('hidden');document.getElementById('apiKeyInput').value=getApiKey();}
function closeKeyModal(){document.getElementById('keyModal').classList.add('hidden');}
function saveKey(){localStorage.setItem(KEY_STORAGE,document.getElementById('apiKeyInput').value);closeKeyModal();}
async function api(path,opts={}){const r=await fetch(path,{...opts,headers:{'Authorization':'Bearer '+getApiKey(),'Content-Type':'application/json',...(opts.headers||{})}});return r;}
</script>
${body.includes('lucide.createIcons')?'':'<script>if(window.lucide)lucide.createIcons();</script>'}
</body></html>`;
}
