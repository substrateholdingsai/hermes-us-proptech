-- Hermes US Intel - Internal connector (StayPuft) read-only
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'dossier',
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  credits_used INTEGER NOT NULL DEFAULT 0,
  pdf_key TEXT,
  pdf_url TEXT,
  executive_summary TEXT,
  findings TEXT,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_reports_tenant ON reports(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);

CREATE TABLE IF NOT EXISTS internal_audit_log (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL DEFAULT 'staypuft',
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  result TEXT,
  status_code INTEGER,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_internal_audit_created ON internal_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_internal_audit_endpoint ON internal_audit_log(endpoint);
