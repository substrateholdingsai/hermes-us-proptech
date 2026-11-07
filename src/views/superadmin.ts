export function superadminLoginView(): string {
  return `<!DOCTYPE html><html lang="es" class="dark"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Super Admin Login · VEKTOR</title>
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
      <div class="mt-4 font-display text-xl text-vektor-pri tracking-tight">Super Admin</div>
      <div class="text-[11px] font-mono text-vektor-mut tracking-wider mt-1">ARK SYSTEMS · VEKTOR</div>
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
      const res = await fetch('/api/superadmin/login', {
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
        window.location.href = '/dashboard';
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
