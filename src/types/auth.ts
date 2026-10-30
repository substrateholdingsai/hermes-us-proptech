export type IntelScope = 'intel:read' | 'intel:write' | 'admin';

export interface Tenant {
  id: string;
  name: string;
  plan: 'starter' | 'pro' | 'enterprise';
  credit_balance: number;
  is_active: number;
}

export interface ApiKey {
  id: string;
  tenant_id: string;
  key_prefix: string;
  key_hash: string;
  scopes_json: string;
  scopes: IntelScope[];
  expires_at: string | null;
  revoked_at: string | null;
}

export interface AuthContext {
  tenant: Tenant;
  apiKey: ApiKey;
}

declare module 'hono' {
  interface ContextVariableMap {
    tenant: Tenant;
    apiKey: ApiKey;
    auth: AuthContext;
  }
}
