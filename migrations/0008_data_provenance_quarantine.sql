-- Hermes US Intel - Data provenance and quarantine (migration 0008)
PRAGMA foreign_keys = ON;

ALTER TABLE investor_profiles ADD COLUMN data_source TEXT;
ALTER TABLE investor_profiles ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE investor_profiles ADD COLUMN source_url TEXT;
ALTER TABLE investor_profiles ADD COLUMN source_id TEXT;
ALTER TABLE investor_profiles ADD COLUMN verified_at TEXT;
ALTER TABLE investor_profiles ADD COLUMN queried_at TEXT;
ALTER TABLE investor_profiles ADD COLUMN quarantined INTEGER NOT NULL DEFAULT 0;

ALTER TABLE properties ADD COLUMN data_source TEXT;
ALTER TABLE properties ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE properties ADD COLUMN source_url TEXT;
ALTER TABLE properties ADD COLUMN source_id TEXT;
ALTER TABLE properties ADD COLUMN verified_at TEXT;
ALTER TABLE properties ADD COLUMN queried_at TEXT;
ALTER TABLE properties ADD COLUMN quarantined INTEGER NOT NULL DEFAULT 0;

ALTER TABLE entity_lookups ADD COLUMN data_source TEXT;
ALTER TABLE entity_lookups ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE entity_lookups ADD COLUMN source_url TEXT;
ALTER TABLE entity_lookups ADD COLUMN source_id TEXT;
ALTER TABLE entity_lookups ADD COLUMN verified_at TEXT;
ALTER TABLE entity_lookups ADD COLUMN queried_at TEXT;
ALTER TABLE entity_lookups ADD COLUMN quarantined INTEGER NOT NULL DEFAULT 0;

ALTER TABLE skip_trace_records ADD COLUMN data_source TEXT;
ALTER TABLE skip_trace_records ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE skip_trace_records ADD COLUMN source_url TEXT;
ALTER TABLE skip_trace_records ADD COLUMN source_id TEXT;
ALTER TABLE skip_trace_records ADD COLUMN verified_at TEXT;
ALTER TABLE skip_trace_records ADD COLUMN queried_at TEXT;
ALTER TABLE skip_trace_records ADD COLUMN quarantined INTEGER NOT NULL DEFAULT 0;

ALTER TABLE leads ADD COLUMN data_source TEXT;
ALTER TABLE leads ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE leads ADD COLUMN source_url TEXT;
ALTER TABLE leads ADD COLUMN source_id TEXT;
ALTER TABLE leads ADD COLUMN verified_at TEXT;
ALTER TABLE leads ADD COLUMN queried_at TEXT;
ALTER TABLE leads ADD COLUMN quarantined INTEGER NOT NULL DEFAULT 0;

ALTER TABLE reports ADD COLUMN data_source TEXT;
ALTER TABLE reports ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE reports ADD COLUMN source_url TEXT;
ALTER TABLE reports ADD COLUMN source_id TEXT;
ALTER TABLE reports ADD COLUMN verified_at TEXT;
ALTER TABLE reports ADD COLUMN queried_at TEXT;
ALTER TABLE reports ADD COLUMN quarantined INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_leads_quarantined ON leads(tenant_id, quarantined);
CREATE INDEX IF NOT EXISTS idx_reports_quarantined ON reports(tenant_id, quarantined);
CREATE INDEX IF NOT EXISTS idx_investor_quarantined ON investor_profiles(tenant_id, quarantined);
