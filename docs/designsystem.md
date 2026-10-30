# 📄 skiptracing-vektor.md

- **Versión:** 1.0.0
- **Instancia:** VEKTOR
- **Cliente / Tenant:** Plataforma de Skip Tracing / Debida Diligencia Financiera
- **Tipo de Huésped:** `ops` (inteligencia operacional) + `service` (SaaS B2B)
- **Sistema:** VEKTOR — Skip Tracing Intelligence
- **Fecha:** 2026-10-29
- **Stack frontend recomendado:** Hono (HTML/JSX) + Tailwind + Lucide + Alpine.js, servido desde el mismo Worker en `/dashboard`
- **Filosofía:** cada dato es un vector; cada cruce, una señal; cada sujeto, un punto resuelto

> **VEKTOR no busca personas. Resuelve identidades.**
> El color aquí nunca decora: es dato. El cian es foco. El verde, conformidad.
> El rojo, bloqueo. El ámbar, revisión. Todo lo demás es gris.

---

## 1 · Manifiesto

Skip tracing profesional no es trabajo de detective. Es **cruce forense de fuentes**:
registros catastrales, filings SEC, UBOs, listas DNC, sanciones OFAC/FINRA, equity inmobiliario,
historial de teléfonos, verificación de emails.

VEKTOR es la consola del analista que convierte ese ruido en un **vector preciso hacia el sujeto**.
No prometemos magia: ofrecemos densidad, contraste, resolución y trazabilidad de cada fuente.

**Modo por defecto: dark-first.** Los analistas trabajan 6–10 horas frente a la pantalla.
La oscuridad azulada reduce fatiga y maximiza la legibilidad de los estados semánticos.

---

## 2 · Tokens de color

### 2.1 · Núcleo oscuro (default)

| Rol | Token | HEX | HSL | Tailwind | Contraste WCAG |
|---|---|---:|---|---|---|
| Fondo maestro | `bg-primary` | `#0A0E14` | `hsl(215 30% 6%)` | `bg-vektor-void` | — |
| Lienzo | `bg-canvas` | `#0F1419` | `hsl(215 22% 8%)` | `bg-vektor-canvas` | — |
| Superficie | `bg-surface` | `#161B22` | `hsl(215 18% 11%)` | `bg-vektor-surface` | — |
| Superficie elevada | `bg-surface-2` | `#1C2128` | `hsl(215 15% 13%)` | `bg-vektor-surface-2` | — |
| Borde | `border-line` | `#21262D` | `hsl(215 14% 15%)` | `border-vektor-line` | Decorativo |
| Borde elevado | `border-hi` | `#30363D` | `hsl(215 13% 21%)` | `border-vektor-hi` | Decorativo |
| Texto primario | `text-primary` | `#E6EDF3` | `hsl(215 25% 93%)` | `text-vektor-pri` | `16.37:1` AAA |
| Texto secundario | `text-secondary` | `#8B949E` | `hsl(215 11% 58%)` | `text-vektor-sec` | `6.29:1` AA |
| Texto muted | `text-muted` | `#6E7681` | `hsl(215 8% 47%)` | `text-vektor-mut` | `4.21:1` AA-large |

### 2.2 · Acento de marca — cian scanner

| Rol | Token | HEX | HSL | Tailwind | Uso |
|---|---|---:|---|---|---|
| Acento primario | `accent-500` | `#22D3EE` | `hsl(187 84% 53%)` | `bg-vektor-cyan` | Botón primario, focus ring, vector activo |
| Acento luminoso | `accent-400` | `#67E8F9` | `hsl(187 92% 69%)` | `bg-vektor-cyan-hi` | Hover, glow sutil, scan line |
| Texto sobre acento | `accent-fg` | `#0A0E14` | `hsl(215 30% 6%)` | `text-vektor-cyan-fg` | Texto en botón primario |

Contraste: `10.70:1` (AAA) texto oscuro sobre cian; `13.34:1` (AAA) cian bright sobre void.

### 2.3 · Semáforo financiero / regulatorio

| Estado | Fondo sólido | HSL | Texto sobre fondo | Fondo badge | Texto del badge | Uso semántico |
|---|---|---|---|---|---|---|
| **Success** | `#3FB950` | `hsl(137 53% 49%)` | `#0A0E14` (`7.66:1` AAA) | `rgba(63,185,80,0.14)` | `#3FB950` | Equity alto, acreditado Rule 501, DNC clean, email verificado |
| **Warning** | `#D29922` | `hsl(40 72% 48%)` | `#0A0E14` (`7.66:1` AAA) | `rgba(210,153,34,0.14)` | `#D29922` | Impuestos vencidos, landline, sin Form D |
| **Danger** | `#F85149` | `hsl(3 92% 63%)` | `#0A0E14` recomendado | `rgba(248,81,73,0.14)` | `#F85149` | DNC blacklist, entidad disuelta, sanción FINRA |
| **Info** | `#79C0FF` | `hsl(212 100% 74%)` | `#0A0E14` | `rgba(121,192,255,0.14)` | `#79C0FF` | CIK, folio catastral, APN, cifras neutrales |

#### Regla de badges (oscura)

Los badges SIEMPRE usan **fondo semitransparente del estado + texto del estado brillante**:

```css
.badge-success { background: rgba(63,185,80,0.14); color: #3FB950; border: 1px solid rgba(63,185,80,0.30); }
.badge-warning { background: rgba(210,153,34,0.14); color: #D29922; border: 1px solid rgba(210,153,34,0.30); }
.badge-danger  { background: rgba(248,81,73,0.14); color: #F85149; border: 1px solid rgba(248,81,73,0.30); }
.badge-info    { background: rgba(121,192,255,0.14); color: #79C0FF; border: 1px solid rgba(121,192,255,0.30); }
```

⚠️ **Nunca** texto blanco sobre verde sólido `#3FB950` (solo 2.15:1, falla).
⚠️ **Nunca** texto blanco sobre rojo sólido `#F85149` (2.84:1, falla).
✅ Texto oscuro sobre el sólido sí funciona (`7.66:1` AAA) — solo para botones de acción con color de estado.

### 2.4 · Modo claro (auditoría / reporting)

Disponible como toggle. Para bancos, fondos y compliance officers que imprimen o presentan a juntas.

| Rol | HEX |
|---|---:|
| `bg-primary` claro | `#FFFFFF` |
| `bg-canvas` claro | `#F6F8FA` |
| `bg-surface` claro | `#FFFFFF` |
| `border-line` claro | `#D0D7DE` |
| `text-primary` claro | `#1F2328` |
| `text-secondary` claro | `#59636E` |
| `accent-500` claro (más profundo) | `#0891B2` |

---

## 3 · Tríada tipográfica

| Rol | Fuente | Peso | Uso |
|---|---|---:|---|
| Display | `Space Grotesk` | 600–700 | Hero, títulos de sala de investigación, nombre del tenant |
| Cuerpo / UI | `Inter` | 400–500 | Dashboard, tablas, formularios, lectura densa |
| Mono | `JetBrains Mono` | 400–500 | **Obligatoria con `tabular-nums`**: montos, APN, CIK, folios, hashes, teléfonos, SSN enmascarado |

### Formato de montos

- **KPI stat cards:** formato compacto `$1.2M` / `$842K` / `$3.4B`
- **Data tables:** formato completo con comas `$1,250,000` (nunca centavos — skip tracing trabaja con equity alto)
- **Badges financieros:** formato compacto siempre (`Equity $2.3M`)
- **Folios/CIK:** mono puro sin comas `0001234567`

---

## 4 · Metáfora de operación

| Concepto genérico | Vocabulario VEKTOR |
|---|---|
| Búsqueda | `probe` o `query` |
| Resultado encontrado | `hit` o `match` |
| Fuente de datos | `source` o `oracle` |
| Cruzar/validar identidad | `resolve` |
| Informe / reporte | `dossier` |
| Sujeto | `target` o `subject` |
| Red de conexiones | `graph` |
| Créditos consumibles | `credits` |
| Lanzamiento rápido | `launchpad` |
| Caso / investigación | `case` |

---

## 5 · Capa artística y Reglas

**Prohibido:**
- Clichés de detective privado (lupas, huellas dactilares, siluetas con sombrero, ojos gigantes)
- Iconografía "Big Brother" / vigilancia opresiva
- Gradientes neón tipo cyberpunk
- Glassmorphism, blur decorativo excesivo
- Ilustraciones con siluetas humanas reconocibles

**Permitido:**
- Geometría de convergencia (vectores, cruces, nodos)
- Rejilla sutil de radar / scanline
- Color como dato puro, sin decoración
- Tipografía densa y técnica
- Monocromía con acento único (cian scanner)
