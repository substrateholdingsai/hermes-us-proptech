PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS leads (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  source      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new',
  score       INTEGER NOT NULL DEFAULT 0,
  contact     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (tenant_id, subject, source)
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(tenant_id, score);

CREATE TABLE IF NOT EXISTS harvest_runs (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source       TEXT NOT NULL,
  limit_count  INTEGER NOT NULL DEFAULT 20,
  dry_run      INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'completed',
  credits_used INTEGER NOT NULL DEFAULT 0,
  leads_json   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_harvest_runs_tenant ON harvest_runs(tenant_id, created_at);
