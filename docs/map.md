# Hermes US Intel — Mapa del Proyecto

## Estructura

```
hermes-us-proptech/
├── wrangler.jsonc
├── Dockerfile.sandbox
├── package.json
├── tsconfig.json
├── .gitignore
├── docs/map.md
├── migrations/
│   ├── 0001_init.sql
│   └── 0002_tenants_and_credits.sql
└── src/
    ├── index.ts
    ├── types/
    │   ├── env.ts
    │   └── auth.ts
    ├── lib/
    │   ├── logger.ts
    │   └── crypto.ts
    ├── middleware/
    │   └── auth.ts
    ├── durable/
    │   └── hermes-sandbox.ts
    ├── services/
    │   ├── db.ts
    │   ├── credits.ts
    │   ├── hermesAgent.ts
    │   └── sos/
    │       ├── types.ts
    │       ├── common.ts
    │       ├── florida.ts
    │       ├── texas.ts
    │       ├── wyoming.ts
    │       ├── delaware.ts
    │       ├── nevada.ts
    │       └── index.ts
    └── routes/
        └── intelligence.ts
```

## Checklist

### Completado
- [x] Scaffolding + git
- [x] D1/R2/AI/DO bindings y migraciones
- [x] Auth multi-tenant + créditos
- [x] SOS multi-state (TX, FL, WY, DE, NV) + UBO AI
- [x] Typecheck OK

### Pendiente
- [ ] Integraciones reales County/SEC/Carrier/DNC/SMTP
- [ ] PDF/CRM
- [ ] Frontend
- [ ] Tests/CI
- [ ] Deploy
- [ ] OpenAPI
