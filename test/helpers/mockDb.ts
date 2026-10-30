export interface MockTenant { id: string; name: string; plan: string; credit_balance: number; is_active: number; }
export interface MockApiKey {
  id: string; tenant_id: string; key_prefix: string; key_hash: string; scopes_json: string;
  expires_at?: string | null; revoked_at?: string | null;
}

export function createMockDb(opts: { tenants?: MockTenant[]; apiKeys?: MockApiKey[] } = {}) {
  const tenants = new Map<string, MockTenant>();
  for (const t of opts.tenants ?? []) tenants.set(t.id, { ...t });
  const apiKeysByHash = new Map<string, MockApiKey>();
  for (const k of opts.apiKeys ?? []) apiKeysByHash.set(k.key_hash, { ...k });
  const transactions: any[] = [];

  function findTenant(id: string) { return tenants.get(id); }

  function firstFor(sql: string, args: any[]) {
    const s = sql.toLowerCase();
    if (s.includes('from api_keys') && s.includes('key_hash')) {
      const key = apiKeysByHash.get(args[0]);
      if (!key) return null;
      const t = findTenant(key.tenant_id);
      if (!t || !t.is_active) return null;
      if (key.revoked_at) return null;
      if (key.expires_at && new Date(key.expires_at).getTime() < Date.now()) return null;
      return {
        key_id: key.id,
        tenant_id: key.tenant_id,
        key_prefix: key.key_prefix,
        key_hash: key.key_hash,
        scopes_json: key.scopes_json,
        expires_at: key.expires_at ?? null,
        revoked_at: key.revoked_at ?? null,
        tenant_name: t.name,
        plan: t.plan,
        credit_balance: t.credit_balance,
        is_active: t.is_active,
      };
    }
    if (s.includes('select credit_balance from tenants')) {
      const t = findTenant(args[0]);
      return t ? { credit_balance: t.credit_balance } : null;
    }
    return null;
  }

  function allFor(sql: string, args: any[]) {
    if (sql.toLowerCase().includes('credit_transactions')) {
      return { results: transactions.filter((t) => t.tenant_id === (args[0] ?? t.tenant_id)) };
    }
    return { results: [] };
  }

  const db: any = {
    prepare(sql: string) {
      const stmt: any = {
        _sql: sql,
        _args: [] as any[],
        bind(...a: any[]) {
          const b: any = {
            _sql: sql,
            _args: a,
            async first() { return firstFor(sql, a); },
            async all() { return allFor(sql, a); },
            async run() { return { success: true }; },
          };
          return b;
        },
        async first() { return firstFor(sql, []); },
        async all() { return allFor(sql, []); },
        async run() { return { success: true }; },
      };
      return stmt;
    },
    async batch(stmts: any[]) {
      for (const s of stmts) {
        const sql = (s._sql || '').toLowerCase();
        const args = s._args || [];
        if (sql.startsWith('update tenants') && sql.includes('credit_balance')) {
          const t = findTenant(args[2]);
          if (t) t.credit_balance = args[0];
        } else if (sql.includes('insert into credit_transactions')) {
          transactions.push({
            id: args[0], tenant_id: args[1], amount: args[2], balance_after: args[3],
            task_type: args[4], job_id: args[5], description: args[6], created_at: args[7],
          });
        }
      }
      return [];
    },
  };

  return db;
}