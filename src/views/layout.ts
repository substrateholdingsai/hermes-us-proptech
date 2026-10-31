export function layout(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="en" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} Â· VEKTOR</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
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
.vektor-credits-bar{height:4px;background:#22D3EE;border-radius:2px;transition:width .4s ease;}
.vektor-scanline{background:repeating-linear-gradient(0deg,rgba(34,211,238,.025) 0,rgba(34,211,238,.025) 1px,transparent 1px,transparent 3px);}
.vektor-watermark{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(-25deg);font-family:'JetBrains Mono',monospace;font-size:36px;color:rgba(139,148,158,.06);pointer-events:none;z-index:40;white-space:nowrap;letter-spacing:.15em;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 1.8s infinite;}
</style></head><body class="bg-vektor-void text-vektor-pri min-h-screen">
<div class="flex h-screen overflow-hidden">
<aside class="w-64 bg-vektor-surface border-r border-vektor-line p-5 flex flex-col gap-6 select-none shrink-0">
  <div class="flex items-center gap-3">
    <img src="/assets/vektor/monogram-vektor.svg" class="w-8 h-8" alt="VEKTOR Monogram">
    <div>
      <div class="font-display font-bold text-lg text-vektor-pri tracking-tight flex items-center gap-1.5">
        <span>VEKTOR</span>
        <span class="text-[9px] font-mono uppercase bg-vektor-cyan/15 text-vektor-cyan px-1.5 py-0.5 rounded border border-vektor-cyan/30">OPS</span>
      </div>
      <div class="text-[10px] font-mono text-vektor-mut tracking-wider">INTELIGENCIA INMOBILIARIA</div>
    </div>
  </div>

  <nav class="flex flex-col gap-1 text-xs font-medium">
    <a href="/dashboard" class="flex items-center gap-2.5 px-3 py-2.5 rounded transition ${title === 'Console' ? 'bg-vektor-cyan/15 text-vektor-cyan font-semibold border border-vektor-cyan/30' : 'text-vektor-sec hover:text-vektor-pri hover:bg-vektor-surface-2'}">
      <span>Panel Principal</span>
    </a>
    <a href="/dashboard/launchpad" class="flex items-center gap-2.5 px-3 py-2.5 rounded transition ${title === 'Probes' ? 'bg-vektor-cyan/15 text-vektor-cyan font-semibold border border-vektor-cyan/30' : 'text-vektor-sec hover:text-vektor-pri hover:bg-vektor-surface-2'}">
      <span>Buscador de Dueños y Propiedades</span>
    </a>
    <a href="/dashboard/explorer" class="flex items-center gap-2.5 px-3 py-2.5 rounded transition ${title === 'Explorer' ? 'bg-vektor-cyan/15 text-vektor-cyan font-semibold border border-vektor-cyan/30' : 'text-vektor-sec hover:text-vektor-pri hover:bg-vektor-surface-2'}">
      <span>Directorio y Contactos Guardados</span>
    </a>
    <a href="/dashboard/harvester" class="flex items-center justify-between px-3 py-2.5 rounded transition ${title === 'Harvester' ? 'bg-vektor-cyan/15 text-vektor-cyan font-semibold border border-vektor-cyan/30' : 'text-vektor-sec hover:text-vektor-pri hover:bg-vektor-surface-2'}">
      <span>Encontrar Compradores</span>
      <span class="badge-info text-[10px] px-1.5 py-0.5 rounded font-mono">HOT</span>
    </a>
    <a href="/dashboard/dossier" class="flex items-center gap-2.5 px-3 py-2.5 rounded transition ${title === 'Dossier' ? 'bg-vektor-cyan/15 text-vektor-cyan font-semibold border border-vektor-cyan/30' : 'text-vektor-sec hover:text-vektor-pri hover:bg-vektor-surface-2'}">
      <span>Reportes y Expedientes PDF</span>
    </a>
    <div class="border-t border-vektor-line my-2"></div>
    <a href="/docs" target="_blank" class="flex items-center justify-between px-3 py-2.5 rounded transition text-vektor-sec hover:text-vektor-cyan hover:bg-vektor-surface-2">
      <span>Documentación Técnica (API)</span>
      <span class="text-[10px] font-mono">â†—</span>
    </a>
    <a href="/" target="_blank" class="flex items-center justify-between px-3 py-2.5 rounded transition text-vektor-sec hover:text-vektor-cyan hover:bg-vektor-surface-2">
      <span>Página de Inicio Pública</span>
      <span class="text-[10px] font-mono">â†—</span>
    </a>
  </nav>

  <div class="mt-auto bg-vektor-canvas border border-vektor-line rounded p-3">
    <div class="flex justify-between items-center text-[11px] mb-1.5 font-mono">
      <span class="text-vektor-mut">CRÉDITOS DISPONIBLES</span>
      <span class="text-vektor-cyan font-semibold" id="sidebarCredits">1,000</span>
    </div>
    <div class="w-full bg-vektor-surface rounded-full h-1.5 overflow-hidden">
      <div id="sidebarCreditsBar" class="vektor-credits-bar" style="width: 20%"></div>
    </div>
    <div class="text-[10px] text-vektor-mut mt-1.5 flex justify-between">
      <span>Workspace: default</span>
      <span class="text-vektor-green font-mono">ACTIVE</span>
    </div>
  </div>
</aside>

<main class="flex-1 flex flex-col overflow-hidden">
  <header class="h-12 bg-vektor-canvas border-b border-vektor-line flex items-center justify-between px-6 text-xs shrink-0 select-none">
    <div class="flex items-center gap-2.5">
      <span class="w-2 h-2 rounded-full bg-vektor-green pulse"></span>
      <span class="font-mono text-vektor-green font-medium tracking-wide">SYSTEM OPERATIONAL Â· vektor-ops</span>
    </div>
    <div class="flex items-center gap-4">
      <div class="font-mono text-vektor-cyan text-xs">47 HITS Â· 24h</div>
      <div class="h-3 w-px bg-vektor-line"></div>
      <button onclick="openKeyModal()" class="flex items-center gap-1.5 font-mono text-xs text-vektor-sec hover:text-vektor-cyan transition bg-vektor-surface border border-vektor-line px-2.5 py-1 rounded">
        <span>âš™ API Key</span>
        <span class="text-[10px] text-vektor-cyan" id="keyPrefixBadge">hermes_d...</span>
      </button>
    </div>
  </header>
  <section class="flex-1 overflow-auto p-6">${body}</section>
</main>
</div>

<!-- Modal API Key -->
<div id="keyModal" class="hidden fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div class="bg-vektor-surface border border-vektor-hi rounded-lg p-6 w-full max-w-md shadow-2xl">
    <div class="flex items-center justify-between mb-2">
      <h3 class="font-display font-bold text-base text-vektor-pri">API Authentication Key</h3>
      <span class="text-[10px] font-mono uppercase bg-vektor-cyan/15 text-vektor-cyan px-2 py-0.5 rounded border border-vektor-cyan/30">BEARER</span>
    </div>
    <p class="text-xs text-vektor-sec mb-4">Requests to <code class="text-vektor-cyan font-mono">/api/v1/intelligence/*</code> are authenticated with this token. Stored locally in your browser.</p>
    <div class="space-y-3">
      <label class="text-[11px] font-mono text-vektor-mut uppercase">Current Key</label>
      <input id="apiKeyInput" type="text" class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2 text-xs font-mono text-vektor-pri outline-none" />
      <div class="text-[11px] text-vektor-mut flex justify-between">
        <span>Default local dev key:</span>
        <button onclick="document.getElementById('apiKeyInput').value='hermes_dev_secret_key_2026'" class="text-vektor-cyan hover:underline font-mono">Use dev default</button>
      </div>
    </div>
    <div class="flex gap-2 mt-5 justify-end">
      <button onclick="closeKeyModal()" class="px-4 py-1.5 text-xs text-vektor-sec hover:text-vektor-pri">Cancel</button>
      <button onclick="saveKey()" class="px-4 py-1.5 text-xs bg-vektor-cyan text-vektor-void font-bold rounded hover:bg-vektor-cyan-hi transition">Save & Apply</button>
    </div>
  </div>
</div>

<script>
const KEY_STORAGE = 'hermes_api_key';
function getApiKey() {
  const k = localStorage.getItem(KEY_STORAGE);
  return k && k.trim() ? k.trim() : 'hermes_dev_secret_key_2026';
}
function updateKeyBadge() {
  const k = getApiKey();
  const el = document.getElementById('keyPrefixBadge');
  if (el) el.textContent = k.slice(0, 8) + '...';
}
function openKeyModal() {
  document.getElementById('keyModal').classList.remove('hidden');
  document.getElementById('apiKeyInput').value = getApiKey();
}
function closeKeyModal() {
  document.getElementById('keyModal').classList.add('hidden');
}
function saveKey() {
  const v = document.getElementById('apiKeyInput').value.trim();
  if (v) {
    localStorage.setItem(KEY_STORAGE, v);
  } else {
    localStorage.removeItem(KEY_STORAGE);
  }
  updateKeyBadge();
  closeKeyModal();
  window.location.reload();
}
async function api(path, opts = {}) {
  const token = getApiKey();
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  return res;
}
updateKeyBadge();
</script>
</body></html>`;
}
