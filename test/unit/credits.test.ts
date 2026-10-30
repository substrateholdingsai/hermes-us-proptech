import { describe, it, expect } from 'vitest';
import { getTenantBalance, hasSufficientCredits, deductCredits } from '../../src/services/credits';

function createDb(initialBalance = 1000) {
  let balance = initialBalance;
  const transactions: any[] = [];
  const prepare = (sql: string) => {
    const stmt: any = {
      _sql: sql,
      _args: [] as any[],
      bind(...args: any[]) { this._args = args; return this; },
      async first() {
        if (sql.includes('SELECT credit_balance FROM tenants')) {
          return { credit_balance: balance };
        }
        return null;
      },
      async all() { return { results: transactions }; },
      async run() { return { success: true }; },
    };
    return stmt;
  };
  const batch = async (stmts: any[]) => {
    for (const s of stmts) {
      const sql = s._sql;
      const args = s._args;
      if (sql.startsWith('UPDATE tenants')) {
        balance = args[0];
      } else if (sql.includes('INSERT INTO credit_transactions')) {
        transactions.push({
          id: args[0], tenant_id: args[1], amount: args[2], balance_after: args[3],
          task_type: args[4], job_id: args[5], description: args[6], created_at: args[7],
        });
      }
    }
    return [];
  };
  return { db: { prepare, batch } as any, getBalance: () => balance, getTx: () => transactions };
}

describe('credits', () => {
  it('hasSufficientCredits true when balance >= required', async () => {
    const { db } = createDb(100);
    expect(await hasSufficientCredits(db, 't', 50)).toBe(true);
    expect(await hasSufficientCredits(db, 't', 100)).toBe(true);
  });

  it('hasSufficientCredits false when insufficient', async () => {
    const { db } = createDb(10);
    expect(await hasSufficientCredits(db, 't', 50)).toBe(false);
  });

  it('deductCredits rejects when insufficient', async () => {
    const { db } = createDb(5);
    const res = await deductCredits(db, 't', 10, 'entity_resolution');
    expect(res.success).toBe(false);
    expect(res.newBalance).toBe(5);
  });

  it('deducts exact amount and records transaction', async () => {
    const { db, getBalance, getTx } = createDb(100);
    const res = await deductCredits(db, 't', 30, 'entity_resolution', 'job1');
    expect(res.success).toBe(true);
    expect(res.newBalance).toBe(70);
    expect(getBalance()).toBe(70);
    const txs = getTx();
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(-30);
    expect(txs[0].balance_after).toBe(70);
    expect(txs[0].task_type).toBe('entity_resolution');
  });
});