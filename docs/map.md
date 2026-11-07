# Hermes US Intel — Mapa del Proyecto

## Estructura

```
hermes-us-proptech/
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI: Typecheck + Vitest Suite
│       └── deploy.yml          # CD: D1 Migrations + Wrangler Deploy
├── wrangler.jsonc
├── Dockerfile.sandbox
├── package.json
├── tsconfig.json
├── .gitignore
├── docs/
│   ├── map.md
│   ├── designsystem.md
│   └── openapi.json
├── migrations/
│   ├── 0001_init.sql
│   ├── 0002_tenants_and_credits.sql
│   ├── 0003_scheduled_harvester.sql
│   ├── 0004_internal_connector.sql
│   └── 0005_client_auth.sql
├── public/
│   └── assets/vektor/          # Vector asset kit VEKTOR
├── scripts/
│   ├── forge-vektor-assets.py
│   └── pack-assets.js
├── test/
│   ├── helpers/
│   │   └── mockDb.ts
│   ├── unit/
│   └── integration/
├── src/
│   ├── index.ts
│   ├── docs/
│   │   └── openapi.ts
│   ├── types/
│   │   ├── env.ts
│   │   └── auth.ts
│   ├── lib/
│   │   ├── logger.ts
│   │   ├── crypto.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── vektorAssets.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── durable/
│   │   └── hermes-sandbox.ts
│   ├── services/
│   │   ├── db.ts
│   │   ├── credits.ts
│   │   ├── hermesAgent.ts
│   │   ├── sos/
│   │   ├── property/
│   │   ├── sec/
│   │   ├── skiptrace/
│   │   ├── reports/
│   │   ├── crm/
│   │   └── harvester/
│   │       ├── types.ts
│   │       ├── secHarvester.ts
│   │       ├── luxuryCashHarvester.ts
│   │       ├── scheduler.ts
│   │       ├── index.ts
│   │       └── mexico/
│   ├── views/
│   │   ├── layout.ts
│   │   ├── overview.ts
│   │   ├── launchpad.ts
│   │   ├── explorer.ts
│   │   ├── dossierModal.ts
│   │   ├── landing.ts
│   │   └── harvester.ts
│   └── routes/
│       ├── intelligence.ts
│       ├── dashboard.ts
│       ├── docs.ts
│       ├── internal.ts
│       └── client.ts
```

## Checklist

### Completado
- [x] Scaffolding + git
- [x] D1/R2/AI/DO bindings y migraciones (0001–0005)
- [x] Auth multi-tenant + créditos
- [x] SOS multi-state + UBO AI (TX, FL, WY, DE, NV)
- [x] Property equity híbrido (Aggregator + County Assessors)
- [x] SEC EDGAR (Form D/ADV) + FINRA BrokerCheck validation engine
- [x] Skip-trace TCPA-compliant + carrier + email MX DoH
- [x] Dossiers ejecutivos PDF + R2 Storage & Download
- [x] Dossiers México (SIGER/RPPyC/CNBV)
- [x] Frontend VEKTOR v1.0.0 (Hono Edge UI + Tailwind + Lucide + Alpine)
- [x] Typecheck OK (0 errores)
- [x] Tests automatizados (Vitest): unit + integration (63 tests OK)
- [x] CI/CD (GitHub Actions: ci.yml + deploy.yml)
- [x] Documentación OpenAPI (Swagger)
- [x] Integración CRM Webhooks (HubSpot, Salesforce, Follow Up Boss)
- [x] Landing page institucional
- [x] VEKTOR Lead Harvester (SEC Form D + luxury cash buyers)
- [x] Harvester programado con auto-sync CRM
- [x] Internal connector read-only (StayPuft, `/api/internal/*`)
- [x] Disparo interno de dossiers (`POST /api/internal/reports/generate`)
- [x] Panel de cliente Futura (`/client`, `/client/login`, `/api/client/*`)
- [x] Auth de cliente (JWT HS256, 8h, lockout 5 intentos / 15 min)
- [x] Deploy a producción (`wrangler deploy`)
- [x] Producción con Llama 3.3 70B (`AI_MODEL`)

### Pendiente
- (ninguno)
