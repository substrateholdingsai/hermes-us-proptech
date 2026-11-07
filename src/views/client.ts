import { layout } from './layout';

// Dark-first VEKTOR client shell. Tokens exactos del Design System.
export function clientLoginView(): string {
  return `<!DOCTYPE html><html lang="es" class="dark"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Login · VEKTOR</title>
<link rel="icon" href="/assets/vektor/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={theme:{extend:{colors:{'vektor-void':'#0A0E14','vektor-canvas':'#0F1419','vektor-surface':'#161B22','vektor-surface-2':'#1C2128','vektor-line':'#21262D','vektor-hi':'#30363D','vektor-pri':'#E6EDF3','vektor-sec':'#8B949E','vektor-mut':'#6E7681','vektor-cyan':'#22D3EE','vektor-cyan-hi':'#67E8F9','vektor-green':'#3FB950','vektor-amber':'#D29922','vektor-red':'#F85149','vektor-blue':'#79C0FF'}}}};</script>
<style>
body{font-family:Inter,sans-serif;background:#0A0E14;color:#E6EDF3;}
.font-display{font-family:'Space Grotesk',sans-serif;}
.font-mono{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;}
.badge-success{background:rgba(63,185,80,.14);color:#3FB950;border:1px solid rgba(63,185,80,.30);}
.badge-warning{background:rgba(210,153,34,.14);color:#D29922;border:1px solid rgba(210,153,34,.30);}
.badge-danger{background:rgba(248,81,73,.14);color:#F85149;border:1px solid rgba(248,81,73,.30);}
.badge-info{background:rgba(121,192,255,.14);color:#79C0FF;border:1px solid rgba(121,192,255,.30);}
</style></head>
<body class="bg-vektor-void text-vektor-pri min-h-screen flex items-center justify-center p-6">
  <div class="w-full max-w-md">
    <div class="flex flex-col items-center mb-8">
      <img src="/assets/vektor/logo-lockup.svg" alt="VEKTOR" class="w-full max-w-sm" />
      <div class="mt-4 font-display text-xl text-vektor-pri tracking-tight">Futura Capital</div>
      <div class="text-[11px] font-mono text-vektor-mut tracking-wider mt-1">CLIENT ACCESS · VEKTOR</div>
    </div>
    <form id="loginForm" class="bg-vektor-surface border border-vektor-line rounded-lg p-6 space-y-4" autocomplete="on">
      <div>
        <label for="email" class="block text-xs font-mono text-vektor-sec uppercase tracking-wider mb-1.5">Email</label>
        <input id="email" name="email" type="email" required autocomplete="username"
          class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2.5 text-sm text-vektor-pri outline-none transition" />
      </div>
      <div>
        <label for="password" class="block text-xs font-mono text-vektor-sec uppercase tracking-wider mb-1.5">Password</label>
        <input id="password" name="password" type="password" required autocomplete="current-password"
          class="w-full bg-vektor-canvas border border-vektor-line focus:border-vektor-cyan rounded px-3 py-2.5 text-sm text-vektor-pri outline-none transition" />
      </div>
      <button type="submit" class="w-full bg-vektor-cyan hover:bg-vektor-cyan-hi text-vektor-void font-display font-bold text-sm tracking-wide rounded py-2.5 transition">Login</button>
      <div id="msg" class="text-sm text-vektor-red font-mono min-h-[1.25rem]" role="alert"></div>
    </form>
  </div>
  <script>
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('msg');
    msg.textContent = '';
    try {
      const res = await fetch('/api/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.href = '/client';
      } else {
        msg.textContent = 'Credenciales inválidas';
      }
    } catch (err) {
      msg.textContent = 'Credenciales inválidas';
    }
  });
  </script>
</body></html>`;
}

export function clientPanelView(): string {
  return `<!DOCTYPE html><html lang="es" class="dark"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Panel · VEKTOR</title>
<link rel="icon" href="/assets/vektor/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={theme:{extend:{colors:{'vektor-void':'#0A0E14','vektor-canvas':'#0F1419','vektor-surface':'#161B22','vektor-surface-2':'#1C2128','vektor-line':'#21262D','vektor-hi':'#30363D','vektor-pri':'#E6EDF3','vektor-sec':'#8B949E','vektor-mut':'#6E7681','vektor-cyan':'#22D3EE','vektor-cyan-hi':'#67E8F9','vektor-green':'#3FB950','vektor-amber':'#D29922','vektor-red':'#F85149','vektor-blue':'#79C0FF'}}}};</script>
<style>
body{font-family:Inter,sans-serif;background:#0A0E14;color:#E6EDF3;}
.font-display{font-family:'Space Grotesk',sans-serif;}
.font-mono{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;}
.badge-success{background:rgba(63,185,80,.14);color:#3FB950;border:1px solid rgba(63,185,80,.30);}
.badge-warning{background:rgba(210,153,34,.14);color:#D29922;border:1px solid rgba(210,153,34,.30);}
.badge-danger{background:rgba(248,81,73,.14);color:#F85149;border:1px solid rgba(248,81,73,.30);}
.badge-info{background:rgba(121,192,255,.14);color:#79C0FF;border:1px solid rgba(121,192,255,.30);}
.vektor-bg-pattern{background-image:url('/assets/vektor/pattern-vektor.svg');background-size:32px 32px;opacity:0.08;pointer-events:none;}
</style></head>
<body class="bg-vektor-void text-vektor-pri min-h-screen">
  <div class="fixed inset-0 vektor-bg-pattern"></div>
  <div class="relative z-10">
    <header class="h-14 bg-vektor-canvas/95 border-b border-vektor-line flex items-center justify-between px-6">
      <div class="flex items-center gap-3">
        <img src="/assets/vektor/monogram-vektor.svg" class="w-8 h-8" alt="VEKTOR" />
        <div class="font-display font-bold text-lg text-vektor-pri tracking-tight">VEKTOR</div>
        <span class="text-vektor-mut">·</span>
        <div class="text-sm text-vektor-sec" id="tenantName">Futura Capital</div>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 font-mono text-sm text-vektor-cyan">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><use href="/assets/vektor/sprite-tracing.svg#credit"></use></svg>
          <span id="credits">0</span>
        </div>
        <button id="logoutBtn" class="text-xs font-mono text-vektor-sec hover:text-vektor-cyan border border-vektor-line rounded px-3 py-1.5 transition">Logout</button>
      </div>
    </header>
    <main class="p-6 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-vektor-surface border border-vektor-line rounded-lg p-4">
          <div class="text-[11px] font-mono text-vektor-mut uppercase tracking-wider">Leads</div>
          <div class="font-mono text-2xl text-vektor-pri font-bold mt-1" id="kpiLeads">0</div>
        </div>
        <div class="bg-vektor-surface border border-vektor-line rounded-lg p-4">
          <div class="text-[11px] font-mono text-vektor-mut uppercase tracking-wider">Dossiers</div>
          <div class="font-mono text-2xl text-vektor-pri font-bold mt-1" id="kpiDossiers">0</div>
        </div>
        <div class="bg-vektor-surface border border-vektor-line rounded-lg p-4">
          <div class="text-[11px] font-mono text-vektor-mut uppercase tracking-wider">Créditos restantes</div>
          <div class="font-mono text-2xl text-vektor-cyan font-bold mt-1" id="kpiCredits">0</div>
        </div>
      </div>

      <section class="bg-vektor-surface border border-vektor-line rounded-lg p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-display font-bold text-sm text-vektor-pri tracking-wide flex items-center gap-2">
            <svg class="w-4 h-4 text-vektor-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><use href="/assets/vektor/sprite-tracing.svg#target"></use></svg>
            Leads
          </h2>
          <span class="text-[11px] font-mono text-vektor-mut">tenant scope</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="text-vektor-sec text-left border-b border-vektor-line">
                <th class="py-2.5 font-medium">Sujeto</th>
                <th class="py-2.5 font-medium">Fuente</th>
                <th class="py-2.5 font-medium">Score</th>
                <th class="py-2.5 font-medium">Contacto</th>
                <th class="py-2.5 font-medium">Estado</th>
                <th class="py-2.5 font-medium text-right">Capital</th>
              </tr>
            </thead>
            <tbody id="leadsBody" class="divide-y divide-vektor-line">
              <tr><td colspan="6" class="py-4 text-center text-vektor-mut">Cargando leads…</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="bg-vektor-surface border border-vektor-line rounded-lg p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-display font-bold text-sm text-vektor-pri tracking-wide flex items-center gap-2">
            <svg class="w-4 h-4 text-vektor-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><use href="/assets/vektor/sprite-tracing.svg#dossier"></use></svg>
            Dossiers
          </h2>
        </div>
        <div id="dossiersBody" class="space-y-3">
          <div class="text-vektor-mut text-xs">Cargando dossiers…</div>
        </div>
      </section>
    </main>
  </div>
  <script>
  function moneyCompact(n){ n=Number(n||0); if (n>=1e9) return '$'+(n/1e9).toFixed(1)+'B'; if (n>=1e6) return '$'+(n/1e6).toFixed(1)+'M'; if (n>=1e3) return '$'+(n/1e3).toFixed(0)+'K'; return '$'+n.toLocaleString(); }
  function moneyFull(n){ return '$'+Number(n||0).toLocaleString('en-US',{maximumFractionDigits:0}); }
  function esc(s){ const d=document.createElement('div'); d.textContent=s==null?'':String(s); return d.innerHTML; }
  function scoreBadge(score){
    const n=Number(score||0);
    if (n>=80) return '<span class="badge-success text-[10px] px-2 py-0.5 rounded font-mono">'+n+'</span>';
    if (n>=60) return '<span class="badge-warning text-[10px] px-2 py-0.5 rounded font-mono">'+n+'</span>';
    return '<span class="badge-info text-[10px] px-2 py-0.5 rounded font-mono">'+n+'</span>';
  }
  async function load() {
    let me = {};
    try {
      const r = await fetch('/api/client/me', { credentials: 'include' });
      if (r.status === 401) { window.location.href = '/client/login'; return; }
      me = await r.json();
    } catch (e) { me = {}; }
    const tenantName = me.tenant_name || me.tenant_id || 'Cliente';
    document.getElementById('tenantName').textContent = tenantName;
    const credits = me.credits_remaining ?? me.credits ?? me.credit_balance ?? 0;
    document.getElementById('credits').textContent = Number(credits).toLocaleString('en-US');
    document.getElementById('kpiCredits').textContent = Number(credits).toLocaleString('en-US');

    let leads = [];
    try {
      const r = await fetch('/api/client/leads?limit=100', { credentials: 'include' });
      const d = await r.json();
      leads = d.leads || d.items || [];
    } catch (e) { leads = []; }
    document.getElementById('kpiLeads').textContent = leads.length;
    const tbody = document.getElementById('leadsBody');
    tbody.innerHTML = '';
    if (!leads.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-vektor-mut">Sin leads</td></tr>';
    } else {
      leads.forEach((l) => {
        const tr = document.createElement('tr');
        const cik = l.cik ? '<div class="font-mono text-[10px] text-vektor-blue mt-0.5">'+esc(l.cik)+'</div>' : '';
        const contact = l.contact || l.email || l.phone || '—';
        const cap = l.capital != null ? moneyFull(l.capital) : '—';
        const src = l.source || (l.sec_form_d ? 'sec_form_d' : (l.type || '—'));
        tr.innerHTML =
          '<td class="py-2.5"><div class="text-vektor-pri">'+esc(l.subject || l.name || l.id)+'</div>'+cik+'</td>'+
          '<td class="py-2.5 font-mono text-vektor-sec">'+esc(src)+'</td>'+
          '<td class="py-2.5">'+scoreBadge(l.score)+'</td>'+
          '<td class="py-2.5 text-vektor-sec">'+esc(contact)+'</td>'+
          '<td class="py-2.5"><span class="badge-info text-[10px] px-2 py-0.5 rounded font-mono">'+esc(l.status || 'new')+'</span></td>'+
          '<td class="py-2.5 text-right font-mono text-vektor-pri">'+esc(cap)+'</td>';
        tbody.appendChild(tr);
      });
    }

    let reports = [];
    try {
      const r = await fetch('/api/client/reports?limit=100', { credentials: 'include' });
      const d = await r.json();
      reports = d.reports || d.items || [];
    } catch (e) { reports = []; }
    document.getElementById('kpiDossiers').textContent = reports.length;
    const dbox = document.getElementById('dossiersBody');
    dbox.innerHTML = '';
    if (!reports.length) {
      dbox.innerHTML = '<div class="text-vektor-mut text-xs">Sin dossiers</div>';
    } else {
      reports.forEach((r) => {
        const card = document.createElement('div');
        card.className = 'bg-vektor-canvas border border-vektor-line rounded-lg p-4 flex items-center justify-between gap-4';
        const statusCls = r.status === 'completed' ? 'badge-success' : (r.status === 'failed' ? 'badge-danger' : 'badge-info');
        card.innerHTML =
          '<div>'+
            '<div class="text-sm text-vektor-pri font-medium">'+esc(r.subject || r.sujeto || r.id)+'</div>'+
            '<div class="text-[11px] font-mono text-vektor-mut mt-1">'+esc(r.created_at || '')+' · '+Number(r.credits_used||0)+' créditos</div>'+
          '</div>'+
          '<div class="flex items-center gap-3">'+
            '<span class="'+statusCls+' text-[10px] px-2 py-0.5 rounded font-mono">'+esc(r.status || 'completed')+'</span>'+
            '<a href="/api/client/reports/'+encodeURIComponent(r.id)+'/download" class="text-xs font-mono text-vektor-cyan hover:underline border border-vektor-cyan/30 rounded px-3 py-1.5">Descargar PDF</a>'+
          '</div>';
        dbox.appendChild(card);
      });
    }
  }
  load();
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await fetch('/api/client/logout', { method: 'POST', credentials: 'include' }); } catch (e) {}
    window.location.href = '/client/login';
  });
  </script>
</body></html>`;
}
