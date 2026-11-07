-- Delete Futura Capital quarantined data and refund 146 credits (DO NOT RUN without Pablo approval)
-- Refunds 120 credits (12 leads x 10) + 26 credits (dossier) = 146 credits.

BEGIN TRANSACTION;

DELETE FROM leads
WHERE tenant_id = 'futura_capital'
  AND id IN (
    SELECT json_extract(je.value, '$.id')
    FROM harvest_runs hr, json_each(hr.leads_json, '$.ingestedLeads') je
    WHERE hr.id = 'harvest_run_mw5u7kjl_9d38856f79b4'
  );

DELETE FROM reports
WHERE id = '4764a343-0d17-415f-b519-ba3b05482bba';

UPDATE tenants
SET credit_balance = credit_balance + 146,
    updated_at = datetime('now')
WHERE id = 'futura_capital';

INSERT INTO credit_transactions (id, tenant_id, amount, balance_after, task_type, job_id, description, created_at)
SELECT 'ctx_refund_futura_' || lower(hex(randomblob(4))), 'futura_capital', 146,
       (SELECT credit_balance FROM tenants WHERE id = 'futura_capital'),
       'refund_quarantine', 'harvest_run_mw5u7kjl_9d38856f79b4',
       'Refund 146 credits for quarantined Futura leads/dossier', datetime('now');

INSERT INTO audit_logs (id, tenant_id, action, resource_type, resource_id, actor, metadata, created_at)
VALUES ('audit_delete_futura', 'futura_capital', 'delete_refund', 'harvest_run', 'harvest_run_mw5u7kjl_9d38856f79b4', 'staypuft', '{"credits_refunded":146}', datetime('now'));

COMMIT;
