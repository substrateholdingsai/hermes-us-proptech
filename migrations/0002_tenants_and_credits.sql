-- Hermes US Intel · Tenants, API Keys y Créditos
-- Migración 0002 (D1 · SQLite)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenants (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  plan           TEXT NOT NULL DEFAULT 'starter'
                 CHECK (plan IN ('starter', 'pro', 'enterprise')),
  credit_balance INTEGER NOT NULL DEFAULT 1000 CHECK (credit_balance >= 0),
  is_active      INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_keys (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_prefix  TEXT NOT NULL,
  key_hash    TEXT NOT NULL UNIQUE,
  scopes_json TEXT NOT NULL DEFAULT '["intel:read","intel:write"]',
  expires_at  TEXT,
  revoked_at  TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id),
  amount        INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  task_type     TEXT,
  job_id        TEXT,
  description   TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_credit_tx_tenant ON credit_transactions(tenant_id, created_at);

INSERT OR IGNORE INTO tenants (id, name, plan, credit_balance, is_active)
VALUES ('default', 'Default Workspace', 'starter', 1000, 1);

INSERT OR IGNORE INTO api_keys (id, tenant_id, key_prefix, key_hash, scopes_json)
VALUES ('key_dev', 'default', 'hermes_d', 'e41bdd9b8cdb1cd46dbfa681e39665cc7acecaf1457ec4ec20f515fba438da1f', '["intel:read","intel:write","admin"]');
