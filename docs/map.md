# Hermes US Intel — Mapa del Proyecto

## Estructura

```
hermes-us-proptech/
├── wrangler.jsonc
├── Dockerfile.sandbox
├── package.json
├── tsconfig.json
├── .gitignore
├── docs/
│   ├── map.md
│   └── designsystem.md
├── migrations/
│   ├── 0001_init.sql
│   └── 0002_tenants_and_credits.sql
├── public/
│   └── assets/vektor/          # Vector asset kit VEKTOR
├── scripts/
│   ├── forge-vektor-assets.py
│   └── pack-assets.js
└── src/
    ├── index.ts
    ├── types/
    │   ├── env.ts
    │   └── auth.ts
    ├── lib/
    │   ├── logger.ts
    │   ├── crypto.ts
    │   └── vektorAssets.ts
    ├── middleware/
    │   └── auth.ts
    ├── durable/
    │   └── hermes-sandbox.ts
    ├── services/
    │   ├── db.ts
    │   ├── credits.ts
    │   ├── hermesAgent.ts
    │   ├── sos/
    │   ├── property/
    │   ├── sec/
    │   ├── skiptrace/
    │   └── reports/
    ├── views/
    │   ├── layout.ts
    │   ├── overview.ts
    │   ├── launchpad.ts
    │   ├── explorer.ts
    │   └── dossierModal.ts
    └── routes/
        ├── intelligence.ts
        └── dashboard.ts
```

## Checklist

### Completado
- [x] Scaffolding + git
- [x] D1/R2/AI/DO bindings y migraciones
- [x] Auth multi-tenant + créditos
- [x] SOS multi-state + UBO AI (TX, FL, WY, DE, NV)
- [x] Property equity híbrido (Aggregator + County Assessors)
- [x] SEC EDGAR (Form D/ADV) + FINRA BrokerCheck validation engine
- [x] Skip-trace TCPA-compliant + carrier + email MX DoH
- [x] Dossiers ejecutivos PDF + R2 Storage & Download
- [x] Frontend VEKTOR v1.0.0 (Hono Edge UI + Tailwind + Lucide + Alpine)
- [x] Typecheck OK (0 errores)

### Pendiente
- [ ] Integración CRM Webhooks (HubSpot, Salesforce, Follow Up Boss)
- [x] Tests automatizados (Vitest): unit + integration (30 tests OK)
- [ ] CI/CD (GitHub Actions)
- [ ] Documentación OpenAPI (Swagger)
- [ ] Deploy a producción (`wrangler deploy`)



