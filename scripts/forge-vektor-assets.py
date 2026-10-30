#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VEKTOR — Fábrica Vectorial · Skip Tracing Intelligence
Stdlib pura: math, random, pathlib, json, argparse. Cero Pillow/Cairo.
"""

import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import argparse
import json
import math
import random
from pathlib import Path

XML = '<?xml version="1.0" encoding="UTF-8"?>\n'
_rng = random.Random(20261029)
NOISE_SEED = _rng.randint(1000, 9999)

# ── Paleta VEKTOR (dark-first) ──
VOID       = "#0A0E14"
CANVAS     = "#0F1419"
SURFACE    = "#161B22"
SURFACE_2  = "#1C2128"
LINE       = "#21262D"
LINE_HI    = "#30363D"
TEXT_PRI   = "#E6EDF3"
TEXT_SEC   = "#8B949E"
TEXT_MUT   = "#6E7681"
CYAN       = "#22D3EE"
CYAN_HI    = "#67E8F9"
SUCCESS    = "#3FB950"
WARNING    = "#D29922"
DANGER     = "#F85149"
INFO       = "#79C0FF"


# ══════════════ MOTIVO: vector convergente (3 líneas a un punto) ══════════════
def vector_converge(cx, cy, radius, color=CYAN, sw=3, n_vectors=3, target_r=3):
    """Tres vectores convergiendo a un punto: el sujeto resuelto."""
    lines = []
    angles = [150, 30, 270]
    for ang in angles:
        rad = math.radians(ang)
        x1 = cx + radius * math.cos(rad)
        y1 = cy - radius * math.sin(rad)
        lines.append(
            f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{cx}" y2="{cy}" '
            f'stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>'
        )
    target = f'<circle cx="{cx}" cy="{cy}" r="{target_r}" fill="{color}"/>'
    return "\n    ".join(lines) + "\n    " + target


# ══════════════ FAVICON (viewBox 64, rx=14) ══════════════
FAVICON_SVG = XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <radialGradient id="favBg" cx="50%" cy="50%" r="70%">
      <stop offset="0" stop-color="{SURFACE}"/>
      <stop offset="1" stop-color="{VOID}"/>
    </radialGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#favBg)"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" fill="none" stroke="{LINE_HI}" stroke-width="1"/>
  <g transform="translate(0 0)">
    {vector_converge(32, 32, 18, CYAN, 3.5, 3, 3.5)}
  </g>
</svg>
"""


# ══════════════ LOGO LOCKUP (~640×160) ══════════════
LOGO_LOCKUP_SVG = XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" width="640" height="160">
  <g transform="translate(32 32) scale(1.5)">
    <rect width="64" height="64" rx="14" fill="{VOID}"/>
    <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" fill="none" stroke="{LINE_HI}" stroke-width="1"/>
    {vector_converge(32, 32, 18, CYAN, 3.5, 3, 3.5)}
  </g>

  <text x="160" y="84" font-family="'Space Grotesk', 'Inter', system-ui, sans-serif"
        font-size="58" font-weight="700" letter-spacing="-1" fill="{TEXT_PRI}">VEKTOR</text>
  <text x="162" y="114" font-family="'JetBrains Mono', Consolas, monospace"
        font-size="14" font-weight="500" letter-spacing="4" fill="{CYAN}">SKIP TRACING INTELLIGENCE</text>

  <line x1="160" y1="130" x2="600" y2="130" stroke="{LINE_HI}" stroke-width="1"/>
  <g transform="translate(162 140)">
    <circle cx="0" cy="0" r="3" fill="{SUCCESS}"/>
    <text x="10" y="4" font-family="'JetBrains Mono', Consolas, monospace"
          font-size="11" fill="{TEXT_MUT}" letter-spacing="1">SYSTEM OPERATIONAL</text>
  </g>
  <text x="600" y="144" font-family="'JetBrains Mono', Consolas, monospace"
        font-size="11" fill="{TEXT_MUT}" letter-spacing="1" text-anchor="end">v1.0.0</text>
</svg>
"""


# ══════════════ MONOGRAMA VEKTOR ══════════════
MONOGRAM_SVG = XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <radialGradient id="monoBg" cx="50%" cy="50%" r="70%">
      <stop offset="0" stop-color="{SURFACE_2}"/>
      <stop offset="1" stop-color="{VOID}"/>
    </radialGradient>
  </defs>
  <circle cx="64" cy="64" r="58" fill="url(#monoBg)" stroke="{LINE_HI}" stroke-width="1.5"/>
  <circle cx="64" cy="64" r="48" fill="none" stroke="{LINE}" stroke-width="1" stroke-dasharray="2 4" opacity="0.6"/>
  <circle cx="64" cy="64" r="34" fill="none" stroke="{LINE}" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>
  {vector_converge(64, 64, 38, CYAN, 4, 3, 5)}
</svg>
"""


# ══════════════ PATRÓN RADAR (grid + punto central, seamless, <4KB, opac. ≤8%) ══════════════
def build_pattern_vektor() -> str:
    """Grid tipo radar con punto central más brillante. Opacidad total ≤8%."""
    dots = []
    # grid de puntos a 8px, con punto más grande cada 32px (centro de radar)
    for gx in range(0, 32, 8):
        for gy in range(0, 32, 8):
            if gx == 16 and gy == 16:
                # centro de radar
                dots.append(f'<circle cx="{gx}" cy="{gy}" r="1.6" fill="{CYAN}" opacity="0.18"/>')
                dots.append(f'<circle cx="{gx}" cy="{gy}" r="4" fill="none" stroke="{CYAN}" stroke-width="0.6" opacity="0.12"/>')
            else:
                dots.append(f'<circle cx="{gx}" cy="{gy}" r="0.5" fill="{TEXT_MUT}" opacity="0.22"/>')
    # cruz de radar
    cross = [
        f'<line x1="16" y1="0" x2="16" y2="32" stroke="{LINE_HI}" stroke-width="0.5" opacity="0.4"/>',
        f'<line x1="0" y1="16" x2="32" y2="16" stroke="{LINE_HI}" stroke-width="0.5" opacity="0.4"/>',
    ]
    body = "\n    ".join(dots + cross)
    return XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <g>
    {body}
  </g>
</svg>
"""


# ══════════════ TEXTURA SCANLINE (líneas CRT horizontales) ══════════════
TEXTURE_SCANLINE_SVG = XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 6" width="64" height="6">
  <line x1="0" y1="1" x2="64" y2="1" stroke="{CYAN}" stroke-width="0.5" opacity="0.035"/>
  <line x1="0" y1="4" x2="64" y2="4" stroke="{CYAN}" stroke-width="0.5" opacity="0.035"/>
</svg>
"""


# ══════════════ DIVISOR SCAN (línea con punto cian activo) ══════════════
DIVIDER_SCAN_SVG = XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 24" width="600" height="24">
  <line x1="0" y1="12" x2="240" y2="12" stroke="{LINE_HI}" stroke-width="1"/>
  <line x1="360" y1="12" x2="600" y2="12" stroke="{LINE_HI}" stroke-width="1"/>

  <circle cx="300" cy="12" r="8" fill="{VOID}" stroke="{CYAN}" stroke-width="1.5"/>
  <circle cx="300" cy="12" r="3" fill="{CYAN}"/>
  <circle cx="300" cy="12" r="12" fill="none" stroke="{CYAN}" stroke-width="0.5" opacity="0.4"/>

  <circle cx="240" cy="12" r="1.5" fill="{LINE_HI}"/>
  <circle cx="360" cy="12" r="1.5" fill="{LINE_HI}"/>

  <line x1="100" y1="12" x2="120" y2="12" stroke="{CYAN}" stroke-width="1" opacity="0.6"/>
  <line x1="480" y1="12" x2="500" y2="12" stroke="{CYAN}" stroke-width="1" opacity="0.6"/>
</svg>
"""


# ══════════════ OG IMAGE (1200×630, safe zone 100px) ══════════════
OG_IMAGE_SVG = XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="ogBg" cx="30%" cy="40%" r="80%">
      <stop offset="0" stop-color="{SURFACE}"/>
      <stop offset="1" stop-color="{VOID}"/>
    </radialGradient>
    <pattern id="ogGrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="16" cy="16" r="0.5" fill="{TEXT_MUT}" opacity="0.22"/>
      <circle cx="16" cy="16" r="4" fill="none" stroke="{LINE_HI}" stroke-width="0.5" opacity="0.25"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#ogBg)"/>
  <rect width="1200" height="630" fill="url(#ogGrid)"/>

  <!-- marco de safe zone -->
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="{LINE_HI}" stroke-width="1"/>

  <!-- banda de estado superior tipo terminal -->
  <rect x="40" y="40" width="1120" height="36" fill="{VOID}"/>
  <circle cx="68" cy="58" r="5" fill="{SUCCESS}"/>
  <text x="86" y="63" font-family="'JetBrains Mono', Consolas, monospace"
        font-size="12" fill="{TEXT_SEC}" letter-spacing="2">SYSTEM OPERATIONAL · vektor-ops</text>
  <text x="1140" y="63" font-family="'JetBrains Mono', Consolas, monospace"
        font-size="12" fill="{CYAN}" letter-spacing="2" text-anchor="end">47 HITS · 24h</text>

  <!-- monograma grande -->
  <g transform="translate(120 160) scale(1.8)">
    <circle cx="64" cy="64" r="58" fill="{VOID}" stroke="{LINE_HI}" stroke-width="1.5"/>
    <circle cx="64" cy="64" r="48" fill="none" stroke="{LINE}" stroke-width="1" stroke-dasharray="2 4" opacity="0.6"/>
    <circle cx="64" cy="64" r="34" fill="none" stroke="{LINE}" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>
    {vector_converge(64, 64, 38, CYAN, 4, 3, 5)}
  </g>

  <!-- tipografía -->
  <text x="420" y="250" font-family="'Space Grotesk', 'Inter', system-ui, sans-serif"
        font-size="96" font-weight="700" letter-spacing="-2" fill="{TEXT_PRI}">VEKTOR</text>
  <text x="422" y="310" font-family="'JetBrains Mono', Consolas, monospace"
        font-size="22" font-weight="500" letter-spacing="5" fill="{CYAN}">SKIP TRACING INTELLIGENCE</text>

  <line x1="420" y1="340" x2="880" y2="340" stroke="{LINE_HI}" stroke-width="1"/>

  <text x="422" y="384" font-family="'Inter', system-ui, sans-serif"
        font-size="22" fill="{TEXT_SEC}">Cada dato es un vector. Cada cruce, una señal.</text>

  <!-- KPIs simuladas -->
  <g transform="translate(420 420)">
    <rect width="200" height="80" fill="{SURFACE}" stroke="{LINE}" rx="6"/>
    <text x="16" y="28" font-family="'JetBrains Mono', Consolas, monospace"
          font-size="10" fill="{TEXT_MUT}" letter-spacing="2">TOTAL EQUITY</text>
    <text x="16" y="62" font-family="'Space Grotesk', sans-serif"
          font-size="32" font-weight="700" fill="{TEXT_PRI}">$1.2B</text>
  </g>
  <g transform="translate(640 420)">
    <rect width="200" height="80" fill="{SURFACE}" stroke="{LINE}" rx="6"/>
    <text x="16" y="28" font-family="'JetBrains Mono', Consolas, monospace"
          font-size="10" fill="{TEXT_MUT}" letter-spacing="2">SUBJECTS RESOLVED</text>
    <text x="16" y="62" font-family="'Space Grotesk', sans-serif"
          font-size="32" font-weight="700" fill="{TEXT_PRI}">8,429</text>
  </g>
  <g transform="translate(860 420)">
    <rect width="200" height="80" fill="{SURFACE}" stroke="{LINE}" rx="6"/>
    <text x="16" y="28" font-family="'JetBrains Mono', Consolas, monospace"
          font-size="10" fill="{TEXT_MUT}" letter-spacing="2">TCPA SAFE</text>
    <text x="16" y="62" font-family="'Space Grotesk', sans-serif"
          font-size="32" font-weight="700" fill="{SUCCESS}">99.2%</text>
  </g>

  <!-- watermark -->
  <text x="1160" y="590" font-family="'JetBrains Mono', Consolas, monospace"
        font-size="11" fill="{TEXT_MUT}" letter-spacing="2" text-anchor="end">vektor.arksystems.site</text>
</svg>
"""


# ══════════════ SPRITE GREMIAL SKIP TRACING (8 iconos, 192×24) ══════════════
SPRITE_ICONS = [
    # target / crosshair
    ("target",
     """<circle cx="12" cy="12" r="8"/>
     <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
     <circle cx="12" cy="12" r="2" fill="currentColor"/>"""),
    # dossier / ficha
    ("dossier",
     """<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
     <path d="M14 3v6h6"/>
     <path d="M8 13h8M8 17h5"/>"""),
    # graph / red de nodos
    ("graph",
     """<circle cx="12" cy="12" r="2.5"/>
     <circle cx="5" cy="5" r="1.5"/>
     <circle cx="19" cy="5" r="1.5"/>
     <circle cx="5" cy="19" r="1.5"/>
     <circle cx="19" cy="19" r="1.5"/>
     <path d="M10 10 6.5 6.5M14 10l3.5-3.5M10 14l-3.5 3.5M14 14l3.5 3.5"/>"""),
    # credit / moneda
    ("credit",
     """<circle cx="12" cy="12" r="9"/>
     <path d="M12 7v10M9 10h6M9 14h6"/>"""),
    # shield / cumplimiento TCPA
    ("shield",
     """<path d="M12 3 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z"/>
     <path d="M9 12l2 2 4-4"/>"""),
    # warning / alerta
    ("warning",
     """<path d="M12 3 2 21h20z"/>
     <path d="M12 10v5M12 18h.01"/>"""),
    # dnc-clean / check limpio
    ("dnc-clean",
     """<rect x="3" y="4" width="18" height="16" rx="2"/>
     <path d="M8 12l3 3 5-6"/>"""),
    # accredited / Rule 501 estrella
    ("accredited",
     """<path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8l-5.8 3.1 1.1-6.5L2.6 9.8l6.5-.9z"/>"""),
]


def build_sprite_tracing() -> str:
    groups = []
    for i, (icon_id, paths) in enumerate(SPRITE_ICONS):
        x = i * 24
        groups.append(
            f'<g id="{icon_id}" transform="translate({x} 0)" fill="none" '
            f'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
            f'stroke-linejoin="round">\n    {paths}\n  </g>'
        )
    body = "\n  ".join(groups)
    return XML + f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 24" width="192" height="24" style="color:{CYAN}">
  {body}
</svg>
"""


# ══════════════ HELPERS ══════════════
def write_asset(out_dir: Path, name: str, content: str) -> Path:
    path = out_dir / name
    if not content.endswith("\n"):
        content += "\n"
    path.write_text(content, encoding="utf-8")
    return path


def kb(size_bytes: int) -> float:
    return round(size_bytes / 1024, 2)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="VEKTOR vector forge — Skip Tracing Intelligence (stdlib pura)."
    )
    parser.add_argument("--out", default="public/assets/vektor",
                        help="Directorio de salida. Ej.: public/assets/vektor")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    assets = [
        ("favicon.svg", FAVICON_SVG),
        ("logo-lockup.svg", LOGO_LOCKUP_SVG),
        ("monogram-vektor.svg", MONOGRAM_SVG),
        ("pattern-vektor.svg", build_pattern_vektor()),
        ("texture-scanline.svg", TEXTURE_SCANLINE_SVG),
        ("divider-scan.svg", DIVIDER_SCAN_SVG),
        ("og-image.svg", OG_IMAGE_SVG),
        ("sprite-tracing.svg", build_sprite_tracing()),
    ]

    records = []
    for name, content in assets:
        path = write_asset(out_dir, name, content)
        size = path.stat().st_size
        records.append({"path": name, "bytes": size, "kb": kb(size)})

    # validación pattern <4KB
    p_rec = next(r for r in records if r["path"] == "pattern-vektor.svg")
    pattern_ok = p_rec["bytes"] < 4096

    manifest = {
        "schema": "bobs.asset-manifest.v1",
        "system": "VEKTOR",
        "slug": "skiptracing-vektor",
        "cliente": "Skip Tracing Intelligence Platform",
        "huesped": "ops",
        "kind": "vector-forge",
        "stdlib_only": True,
        "noise_seed": NOISE_SEED,
        "files": records,
        "total_bytes": sum(r["bytes"] for r in records),
        "total_kb": round(sum(r["bytes"] for r in records) / 1024, 2),
        "checks": {"pattern_vektor_under_4kb": pattern_ok},
    }

    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    manifest_size = manifest_path.stat().st_size

    print("\n🎯 VEKTOR — Fábrica Vectorial · Skip Tracing Intelligence")
    print(f"📁 Salida: {out_dir.resolve()}")
    print("─" * 58)
    for record in records:
        flag = "  ✓<4KB" if record["path"] == "pattern-vektor.svg" and pattern_ok else ""
        print(f"{record['path']:<28} {record['kb']:>8.2f} KB{flag}")
    print("─" * 58)
    print(f"{'manifest.json':<28} {kb(manifest_size):>8.2f} KB")
    print(f"{'TOTAL SVG':<28} {manifest['total_kb']:>8.2f} KB")
    print("✓ Dark-first · Color = dato · Cero clichés de detective")
    print("✅ Listo. Zero Pillow. Zero dependencias externas.\n")


if __name__ == "__main__":
    main()
