PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS harvest_schedules (
  id                  TEXT PRIMARY KEY,
  tenant_id           TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  cron_expression     TEXT NOT NULL DEFAULT '0 12 * * 1',
  source              TEXT NOT NULL,
  jurisdiction        TEXT NOT NULL DEFAULT 'US' CHECK (jurisdiction IN ('US', 'MX')),
  state               TEXT,
  min_amount_dollars  INTEGER DEFAULT 1500000,
  limit_per_run       INTEGER DEFAULT 10,
  auto_sync_crm       INTEGER NOT NULL DEFAULT 1 CHECK (auto_sync_crm IN (0, 1)),
  is_active           INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  last_run_at         TEXT,
  last_status         TEXT,
  created_at          TEXT DEFAULT (datetime('now')),
  updated_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS crm_integrations (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL CHECK (provider IN ('webhook', 'followupboss', 'hubspot', 'salesforce')),
  endpoint_url  TEXT,
  api_key       TEXT,
  secret        TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_schedules_active ON harvest_schedules(is_active, tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_tenant ON crm_integrations(tenant_id, is_active);

INSERT OR IGNORE INTO harvest_schedules (id, tenant_id, name, cron_expression, source, jurisdiction, state, auto_sync_crm, is_active)
VALUES ('sched_weekly_us', 'default', 'Weekly SEC Form D Real Estate Sweeper', '0 12 * * 1', 'sec_form_d', 'US', 'FL', 1, 1);

INSERT OR IGNORE INTO harvest_schedules (id, tenant_id, name, cron_expression, source, jurisdiction, state, auto_sync_crm, is_active)
VALUES ('sched_weekly_mx', 'default', 'Weekly CDMX/NL S.A.P.I. Luxury Harvester', '0 12 * * 1', 'siger_sapi', 'MX', 'CDMX', 1, 1);
