# Hermes US Intel — Mapa del Proyecto

## Estructura

```
hermes-us-proptech/
├── wrangler.jsonc              # Bindings: AI, D1, R2, HERMES_SANDBOX DO
├── Dockerfile.sandbox          # Runtime Hermes (Python 3.11 + shim)
├── package.json
├── tsconfig.json
├── .gitignore
├── docs/
│   └── map.md
├── migrations/
│   └── 0001_init.sql           # investor_profiles, properties, entity_lookups,
│                               # skip_trace_records, audit_logs
└── src/
    ├── index.ts                # Hono app + DO export
    ├── types/
    │   └── env.ts
    ├── lib/
    │   └── logger.ts
    ├── durable/
    │   └── hermes-sandbox.ts   # HermesSandboxDO
    ├── services/
    │   ├── db.ts
    │   └── hermesAgent.ts      # Orquestador de inteligencia US
    └── routes/
        └── intelligence.ts     # /api/v1/intelligence/*
```

## Checklist

### Completado
- [x] Repositorio independiente inicializado (git, remote origin, rama main)
- [x] `wrangler.jsonc` con bindings D1/R2/Workers AI/DO sandbox
- [x] D1 remoto creado y `database_id` real configurado
- [x] R2 bucket `hermes-intel-snapshots` (existente/reutilizado)
- [x] Migración `0001_init.sql` aplicada (local + remoto)
- [x] `Dockerfile.sandbox` para Hermes Agent
- [x] Orquestador `src/services/hermesAgent.ts` (entity resolution, property equity, SEC validation, skip-trace)
- [x] Rutas Hono `src/routes/intelligence.ts`
- [x] Durable Object `HermesSandboxDO`
- [x] Tipos de entorno y utilidades base
- [x] `.gitignore`
- [x] `typecheck` pasando

### Pendiente / Por construir
- [ ] Autenticación multi-tenant (guards, middleware, scopes)
- [ ] Contexto de tenant resuelto por request (x-tenant-id / subdominio)
- [ ] Gestión de créditos / consumo por operación
- [ ] Rutas de consulta (GET dossiers, perfiles, propiedades, auditoría)
- [ ] Integración real con SOS (Delaware/Wyoming/Nevada/Florida/Texas)
- [ ] Integración County Assessor / Recorder of Deeds
- [ ] Integración SEC EDGAR (Form D / Form ADV)
- [ ] Carrier lookup + DNC scrubbing + verificación SMTP real
- [ ] Exportación PDF a R2 y descarga de reportes
- [ ] Integración CRM (HubSpot, Salesforce, Follow Up Boss)
- [ ] Frontend / dashboard
- [ ] Tests (unit + integración)
- [ ] CI/CD (GitHub Actions)
- [ ] Observabilidad avanzada y rate limiting
- [ ] Deploy a producción (wrangler deploy)
- [ ] Documentación de API (OpenAPI)
