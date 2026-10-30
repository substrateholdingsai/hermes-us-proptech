-- Hermes US Intel · esquema inicial (D1 · SQLite)
-- Migración 0001

PRAGMA foreign_keys = ON;

-- ── Perfiles de inversionista / propietario ───────────────────────────────────
CREATE TABLE IF NOT EXISTS investor_profiles (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  full_name       TEXT,
  entity_name     TEXT,            -- LLC / Trust / Corp detrás del inmueble
  email           TEXT,
  phone           TEXT,
  investor_type   TEXT NOT NULL DEFAULT 'unknown'
                  CHECK (investor_type IN ('unknown','accredited','qualified_purchaser')),
  sec_form_d      INTEGER NOT NULL DEFAULT 0 CHECK (sec_form_d IN (0,1)),
  sec_form_adv    INTEGER NOT NULL DEFAULT 0 CHECK (sec_form_adv IN (0,1)),
  dnc_status      TEXT NOT NULL DEFAULT 'unknown'
                  CHECK (dnc_status IN ('unknown','clean','flagged')),
  line_type       TEXT NOT NULL DEFAULT 'unknown'
                  CHECK (line_type IN ('unknown','mobile','landline','voip')),
  email_verified  INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0,1)),
  equity_score    REAL NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_investor_tenant ON investor_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_investor_entity ON investor_profiles(tenant_id, entity_name);

-- ── Propiedades inmobiliarias (County records) ────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id                   TEXT PRIMARY KEY,
  tenant_id            TEXT NOT NULL,
  address              TEXT NOT NULL,
  county               TEXT,
  state                TEXT,
  parcel_id            TEXT,
  assessed_value_cents INTEGER NOT NULL DEFAULT 0,
  market_value_cents   INTEGER NOT NULL DEFAULT 0,
  mortgage_balance_cents INTEGER NOT NULL DEFAULT 0,
  equity_cents         INTEGER NOT NULL DEFAULT 0,
  tax_amount_cents     INTEGER NOT NULL DEFAULT 0,
  owner_entity_id      TEXT,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_county ON properties(tenant_id, county, state);

-- ── Resolución de entidades (SOS / UBO) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS entity_lookups (
  id                  TEXT PRIMARY KEY,
  tenant_id           TEXT NOT NULL,
  entity_name         TEXT NOT NULL,
  entity_type         TEXT NOT NULL DEFAULT 'llc'
                      CHECK (entity_type IN ('llc','trust','corp','other')),
  state_of_formation  TEXT,
  registered_agent    TEXT,
  managers_json       TEXT,        -- JSON array
  ubo_name            TEXT,
  sos_filing_number   TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','resolved','failed')),
  raw_payload         TEXT,        -- JSON
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entity_tenant ON entity_lookups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entity_name ON entity_lookups(tenant_id, entity_name);

-- ── Registros de skip-tracing ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skip_trace_records (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL,
  subject_name   TEXT NOT NULL,
  subject_type   TEXT NOT NULL DEFAULT 'person'
                 CHECK (subject_type IN ('person','entity')),
  phone          TEXT,
  email          TEXT,
  line_type      TEXT NOT NULL DEFAULT 'unknown'
                 CHECK (line_type IN ('unknown','mobile','landline','voip')),
  dnc_status     TEXT NOT NULL DEFAULT 'unknown'
                 CHECK (dnc_status IN ('unknown','clean','flagged')),
  smtp_verified  INTEGER NOT NULL DEFAULT 0 CHECK (smtp_verified IN (0,1)),
  source         TEXT,
  confidence     REAL NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_skiptrace_tenant ON skip_trace_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_skiptrace_subject ON skip_trace_records(tenant_id, subject_name);

-- ── Bitácora de auditoría ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT,
  actor         TEXT NOT NULL DEFAULT 'system',
  metadata      TEXT,             -- JSON
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
