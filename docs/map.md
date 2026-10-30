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
│   └── map.md
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
    │   └── hermesAgent.ts
    └── routes/
        └── intelligence.ts
```

## Checklist

### Completado
- [x] Repositorio independiente + commits base/final
- [x] `wrangler.jsonc` (D1/R2/AI/DO) y D1 remoto creado
- [x] Migraciones `0001_init`, `0002_tenants_and_credits` (local + remoto)
- [x] R2 bucket `hermes-intel-snapshots`
- [x] Dockerfile sandbox
- [x] Orquestador `hermesAgent.ts` (entity/property/sec/skip-trace)
- [x] Autenticación multi-tenant (API keys SHA-256, scopes)
- [x] Ledger de créditos (balance, transacciones, deducción)
- [x] Rutas intelligence protegidas + GET de consulta
- [x] Typecheck OK

### Pendiente
- [ ] Autenticación avanzada (rotación/revocación UI)
- [ ] Integraciones reales SOS/County/SEC/Carrier/DNC/SMTP
- [ ] Exportación PDF a R2 y CRM
- [ ] Frontend/dashboard
- [ ] Tests y CI/CD
- [ ] Deploy producción
- [ ] OpenAPI
