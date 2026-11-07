-- Hermes US Intel - Super Admin auth
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO tenants (id, name, plan, credit_balance, is_active)
VALUES ('ark_systems', 'Ark Systems', 'enterprise', 0, 1);

CREATE TABLE IF NOT EXISTS super_admins (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'super_admin',
  is_active INTEGER NOT NULL DEFAULT 1,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
CREATE INDEX IF NOT EXISTS idx_super_admins_tenant ON super_admins(tenant_id);
