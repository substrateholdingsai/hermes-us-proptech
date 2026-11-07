-- Hermes US Intel - Client auth (Futura Capital)
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO tenants (id, name, plan, credit_balance, is_active)
VALUES ('futura_capital', 'Futura Capital', 'enterprise', 0, 1);

CREATE TABLE IF NOT EXISTS client_users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'client',
  is_active INTEGER NOT NULL DEFAULT 1,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_client_users_tenant ON client_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
