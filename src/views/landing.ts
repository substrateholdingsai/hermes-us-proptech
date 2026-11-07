export function landingView(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>VEKTOR · Hermes US PropTech Intelligence API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config={theme:{extend:{colors:{'vektor-void':'#0A0E14','vektor-canvas':'#0F1419','vektor-surface':'#161B22','vektor-surface-2':'#1C2128','vektor-line':'#21262D','vektor-hi':'#30363D','vektor-pri':'#E6EDF3','vektor-sec':'#8B949E','vektor-mut':'#6E7681','vektor-cyan':'#22D3EE','vektor-cyan-hi':'#67E8F9','vektor-green':'#3FB950','vektor-amber':'#D29922','vektor-red':'#F85149','vektor-blue':'#79C0FF'}}}};</script>
  <style>
    body{font-family:Inter,sans-serif;background:#0A0E14;color:#E6EDF3;}
    .font-display{font-family:'Space Grotesk',sans-serif;}
    .font-mono{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;}
    .badge-success{background:rgba(63,185,80,.14);color:#3FB950;border:1px solid rgba(63,185,80,.30);}
    .badge-info{background:rgba(121,192,255,.14);color:#79C0FF;border:1px solid rgba(121,192,255,.30);}
    .badge-warning{background:rgba(210,153,34,.14);color:#D29922;border:1px solid rgba(210,153,34,.30);}
    .grid-bg{background-image:linear-gradient(rgba(34,211,238,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.04) 1px,transparent 1px);background-size:48px 48px;}
  </style>
</head>
<body class="bg-vektor-void text-vektor-pri">
  <header class="border-b border-vektor-line bg-vektor-canvas/80 backdrop-blur sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <img src="/assets/vektor/monogram-vektor.svg" class="w-8 h-8" alt="VEKTOR" />
        <span class="font-display font-bold text-vektor-cyan tracking-wide">VEKTOR</span>
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm text-vektor-sec">
        <a href="#features" class="hover:text-vektor-pri">Features</a>
        <a href="#compliance" class="hover:text-vektor-pri">Compliance</a>
        <a href="#pricing" class="hover:text-vektor-pri">Pricing</a>
        <a href="/docs" class="hover:text-vektor-pri">API Docs</a>
      </nav>
      <a href="/dashboard" class="px-4 py-2 rounded bg-vektor-cyan text-vektor-void font-semibold text-sm hover:bg-vektor-cyan-hi">Super Admin</a>
      <button id="clientAccessBtn" class="px-4 py-2 rounded border border-vektor-hi text-vektor-pri text-sm hover:border-vektor-cyan">Acceso Clientes</button>
    </div>
  </header>

  <section class="relative overflow-hidden grid-bg">
    <div class="max-w-7xl mx-auto px-6 py-24 text-center">
      <div class="flex items-center justify-center gap-2 mb-6">
        <span class="badge-success px-3 py-1 rounded-full text-xs font-mono">TCPA Safe</span>
        <span class="badge-info px-3 py-1 rounded-full text-xs font-mono">Rule 501(a)(10) Accredited</span>
        <span class="badge-warning px-3 py-1 rounded-full text-xs font-mono">UBO Resolved</span>
      </div>
      <h1 class="font-display text-4xl md:text-6xl font-bold leading-tight max-w-4xl mx-auto">
        Institutional-Grade US Real Estate Intelligence, Delivered as an API
      </h1>
      <p class="mt-6 text-lg text-vektor-sec max-w-3xl mx-auto">
        Penetrate corporate veils, quantify deed-level equity, validate SEC and FINRA accreditation, and skip-trace with TCPA-safe precision—so your capital and pipeline move faster.
      </p>
      <div class="mt-10 flex items-center justify-center gap-4">
        <a href="/dashboard" class="px-6 py-3 rounded bg-vektor-cyan text-vektor-void font-semibold hover:bg-vektor-cyan-hi">Get Started</a>
        <a href="/docs" class="px-6 py-3 rounded border border-vektor-hi text-vektor-pri hover:border-vektor-cyan">Explore API</a>
      </div>
    </div>
  </section>

  <section id="features" class="max-w-7xl mx-auto px-6 py-20">
    <h2 class="font-display text-3xl font-bold mb-2">Four Pillars of Institutional Intelligence</h2>
    <p class="text-vektor-sec mb-10">One API. Four deep-dive engines. Built for funds, wholesalers, and institutional operators.</p>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-vektor-surface border border-vektor-line rounded-lg p-6">
        <div class="text-2xl mb-3">🏢</div>
        <h3 class="font-display font-semibold mb-2">Corporate Veil Penetration (SOS)</h3>
        <p class="text-sm text-vektor-sec">Resolve LLCs, trusts, and UBOs across DE, WY, NV, FL, and TX with filing-grade accuracy and control trees.</p>
      </div>
      <div class="bg-vektor-surface border border-vektor-line rounded-lg p-6">
        <div class="text-2xl mb-3">🏡</div>
        <h3 class="font-display font-semibold mb-2">Deed & Mortgage Equity Intelligence</h3>
        <p class="text-sm text-vektor-sec">Catastro-grade assessments, market valuation, mortgage balance, and net equity computed down to the cent.</p>
      </div>
      <div class="bg-vektor-surface border border-vektor-line rounded-lg p-6">
        <div class="text-2xl mb-3">⚖️</div>
        <h3 class="font-display font-semibold mb-2">SEC & FINRA Regulatory Accreditation</h3>
        <p class="text-sm text-vektor-sec">Form D, Form ADV, and BrokerCheck Series 7/65 validation under Rule 501(a)(10) for QP and accredited investors.</p>
      </div>
      <div class="bg-vektor-surface border border-vektor-line rounded-lg p-6">
        <div class="text-2xl mb-3">📞</div>
        <h3 class="font-display font-semibold mb-2">TCPA-Safe Direct Skip-Tracing</h3>
        <p class="text-sm text-vektor-sec">Carrier lookup, national DNC scrubbing, and Cloudflare DoH email verification before you dial.</p>
      </div>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-6 py-20">
    <div class="grid lg:grid-cols-2 gap-10 items-center">
      <div>
        <h2 class="font-display text-3xl font-bold mb-4">Live Executive Dossier Preview</h2>
        <p class="text-vektor-sec mb-6">Every resolved target compiles into a branded, audit-ready PDF dossier—watermarked, timestamped, and streamed from Cloudflare R2.</p>
        <ul class="space-y-2 text-sm text-vektor-sec">
          <li>• Entity tree and UBO resolution</li>
          <li>• Property equity breakdown in dollars</li>
          <li>• SEC/FINRA accreditation status</li>
          <li>• TCPA-clean contact channels</li>
        </ul>
        <a href="/docs" class="inline-block mt-6 px-5 py-2.5 rounded border border-vektor-hi text-vektor-pri hover:border-vektor-cyan">Download Sample PDF</a>
      </div>
      <div class="relative bg-vektor-surface border border-vektor-line rounded-lg p-6 font-mono text-xs">
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span class="text-vektor-red/10 text-4xl font-display rotate-[-30deg]">HERMES CONFIDENTIAL</span>
        </div>
        <div class="space-y-2 relative">
          <div class="text-vektor-cyan">DOSSIER · HERMES US PROPTECH</div>
          <div class="text-vektor-sec">Subject: Acme Holdings LLC (DE)</div>
          <div class="text-vektor-sec">UBO: Jane Roe · 62% control</div>
          <div class="text-vektor-sec">Property: 123 Main St, Miami FL</div>
          <div class="text-vektor-sec">Market Value: $1,250,000.00</div>
          <div class="text-vektor-sec">Equity: $412,500.00 (33.0%)</div>
          <div class="text-vektor-sec">Accredited: Rule 501(a)(10) · Series 65</div>
          <div class="text-vektor-sec">Phone: +1 (305) 555-0142 · Mobile · DNC Clean</div>
          <div class="text-vektor-green mt-3">STATUS: VERIFIED · AUDIT-READY</div>
        </div>
      </div>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-6 py-20" id="compliance">
    <h2 class="font-display text-3xl font-bold mb-2">CRM & Workflow Integrations</h2>
    <p class="text-vektor-sec mb-10">Push verified leads straight into the systems your team already runs.</p>
    <div class="grid md:grid-cols-4 gap-4">
      <div class="bg-vektor-surface border border-vektor-line rounded-lg p-5 text-center">
        <div class="font-display font-semibold">Follow Up Boss</div>
        <div class="text-xs text-vektor-sec mt-1">People, notes, tags</div>
      </div>
      <div class="bg-vektor-surface border border-vektor-line rounded-lg p-5 text-center">
        <div class="font-display font-semibold">HubSpot</div>
        <div class="text-xs text-vektor-sec mt-1">Contacts & custom props</div>
      </div>
      <div class="bg-vektor-surface border border-vektor-line rounded-lg p-5 text-center">
        <div class="font-display font-semibold">Salesforce</div>
        <div class="text-xs text-vektor-sec mt-1">Lead / Account ingest</div>
      </div>
      <div class="bg-vektor-surface border border-vektor-line rounded-lg p-5 text-center">
        <div class="font-display font-semibold">Zapier</div>
        <div class="text-xs text-vektor-sec mt-1">HMAC-signed webhooks</div>
      </div>
    </div>
  </section>

  <section id="pricing" class="max-w-7xl mx-auto px-6 py-20">
    <h2 class="font-display text-3xl font-bold mb-2">Credit-Based Pricing</h2>
    <p class="text-vektor-sec mb-10">Pay only for the intelligence you consume. Credits never expire on annual plans.</p>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="bg-vektor-surface border border-vektor-line rounded-lg p-6">
        <div class="font-display font-semibold text-lg">Starter</div>
        <div class="font-mono text-3xl mt-2">$299<span class="text-sm text-vektor-sec">/mo</span></div>
        <div class="text-sm text-vektor-sec mt-1">1,000 credits</div>
        <ul class="mt-4 space-y-1 text-sm text-vektor-sec">
          <li>Entity resolution (5 cr)</li>
          <li>Property equity (8 cr)</li>
          <li>SEC validation (3 cr)</li>
        </ul>
      </div>
      <div class="bg-vektor-surface border border-vektor-cyan rounded-lg p-6 shadow-lg shadow-vektor-cyan/10">
        <div class="font-display font-semibold text-lg">Professional</div>
        <div class="font-mono text-3xl mt-2">$999<span class="text-sm text-vektor-sec">/mo</span></div>
        <div class="text-sm text-vektor-sec mt-1">5,000 credits</div>
        <ul class="mt-4 space-y-1 text-sm text-vektor-sec">
          <li>Skip-trace (10 cr)</li>
          <li>Executive PDF dossiers</li>
          <li>CRM sync & webhooks</li>
        </ul>
      </div>
      <div class="bg-vektor-surface border border-vektor-line rounded-lg p-6">
        <div class="font-display font-semibold text-lg">Enterprise</div>
        <div class="font-mono text-3xl mt-2">Custom</div>
        <div class="text-sm text-vektor-sec mt-1">Volume credits</div>
        <ul class="mt-4 space-y-1 text-sm text-vektor-sec">
          <li>Dedicated support</li>
          <li>Custom data feeds</li>
          <li>SLA & SSO</li>
        </ul>
      </div>
    </div>
  </section>

  <footer class="border-t border-vektor-line bg-vektor-canvas mt-10">
    <div class="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-4 gap-6 text-sm text-vektor-sec">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <img src="/assets/vektor/monogram-vektor.svg" class="w-6 h-6" alt="VEKTOR" />
          <span class="font-display font-bold text-vektor-cyan">VEKTOR</span>
        </div>
        <p>Hermes US PropTech Intelligence API.</p>
      </div>
      <div>
        <div class="font-display font-semibold text-vektor-pri mb-2">Product</div>
        <div class="space-y-1"><a href="#features" class="hover:text-vektor-pri">Features</a><br><a href="#pricing" class="hover:text-vektor-pri">Pricing</a><br><a href="/docs" class="hover:text-vektor-pri">API Docs</a></div>
      </div>
      <div>
        <div class="font-display font-semibold text-vektor-pri mb-2">Company</div>
        <div class="space-y-1"><a href="/dashboard" class="hover:text-vektor-pri">Console</a><br><a href="#compliance" class="hover:text-vektor-pri">Compliance</a></div>
      </div>
      <div>
        <div class="font-display font-semibold text-vektor-pri mb-2">Legal</div>
        <div class="space-y-1">Privacy · Terms · Security</div>
      </div>
    </div>
    <div class="max-w-7xl mx-auto px-6 pb-8 text-xs text-vektor-mut">
      © 2026 Hermes US PropTech. All rights reserved. Data provided for informational purposes only and does not constitute legal, tax, or investment advice. TCPA compliance, consent management, and permissible use of consumer data are the responsibility of the customer. Credit costs and pricing subject to change.
    </div>
  </footer>

  <div id="clientModal" class="hidden fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-vektor-surface border border-vektor-hi rounded-lg p-6 w-full max-w-md shadow-2xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-display font-bold text-base text-vektor-pri">Acceso Clientes</h3>
        <button id="clientModalClose" class="text-vektor-sec hover:text-vektor-pri text-lg leading-none">&times;</button>
      </div>
      <form id="clientModalForm" class="space-y-4">
        <div>
          <label for="clientEmail" class="block text-xs font-mono text-vektor-sec uppercase tracking-wider mb-1.5">Email</label>
          <input id="clientEmail" type="email" required class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2.5 text-sm text-vektor-pri outline-none transition" />
        </div>
        <div>
          <label for="clientPassword" class="block text-xs font-mono text-vektor-sec uppercase tracking-wider mb-1.5">Password</label>
          <input id="clientPassword" type="password" required class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2.5 text-sm text-vektor-pri outline-none transition" />
        </div>
        <button type="submit" class="w-full bg-vektor-cyan hover:bg-vektor-cyan-hi text-vektor-void font-display font-bold text-sm tracking-wide rounded py-2.5 transition">Login</button>
        <div id="clientModalMsg" class="text-sm text-vektor-red font-mono min-h-[1.25rem]" role="alert"></div>
      </form>
    </div>
  </div>
  <script>
  (function(){
    var btn=document.getElementById('clientAccessBtn');
    var modal=document.getElementById('clientModal');
    var close=document.getElementById('clientModalClose');
    function open(){ if(modal) modal.classList.remove('hidden'); }
    function shut(){ if(modal) modal.classList.add('hidden'); }
    if(btn) btn.addEventListener('click', open);
    if(close) close.addEventListener('click', shut);
    if(modal) modal.addEventListener('click', function(e){ if(e.target===modal) shut(); });
    var form=document.getElementById('clientModalForm');
    if(form) form.addEventListener('submit', async function(e){
      e.preventDefault();
      var msg=document.getElementById('clientModalMsg');
      if(msg) msg.textContent='';
      try {
        var res=await fetch('/api/client/login', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ email: document.getElementById('clientEmail').value, password: document.getElementById('clientPassword').value }) });
        if(res.ok){ window.location.href='/client'; }
        else { if(msg) msg.textContent='Credenciales inválidas'; }
      } catch(err){ if(msg) msg.textContent='Credenciales inválidas'; }
    });
  })();
  </script>

</body>
</html>`;
}
