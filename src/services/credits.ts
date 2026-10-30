import { newId, nowIso } from './db';

export async function getTenantBalance(db: D1Database, tenantId: string): Promise<number> {
  const row = await db.prepare('SELECT credit_balance FROM tenants WHERE id = ?').bind(tenantId).first<{ credit_balance: number }>();
  return row?.credit_balance ?? 0;
}

export async function hasSufficientCredits(db: D1Database, tenantId: string, required: number): Promise<boolean> {
  const balance = await getTenantBalance(db, tenantId);
  return balance >= required;
}

export async function deductCredits(
  db: D1Database,
  tenantId: string,
  cost: number,
  taskType: string,
  jobId?: string
): Promise<{ success: boolean; newBalance: number }> {
  const balance = await getTenantBalance(db, tenantId);
  if (balance < cost) {
    return { success: false, newBalance: balance };
  }
  const newBalance = balance - cost;

  await db.batch([
    db.prepare('UPDATE tenants SET credit_balance = ?, updated_at = ? WHERE id = ?').bind(newBalance, nowIso(), tenantId),
    db.prepare(
      `INSERT INTO credit_transactions (id, tenant_id, amount, balance_after, task_type, job_id, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(newId('ctx'), tenantId, -cost, newBalance, taskType, jobId ?? null, `Deduction for ${taskType}`, nowIso()),
  ]);

  return { success: true, newBalance };
}
