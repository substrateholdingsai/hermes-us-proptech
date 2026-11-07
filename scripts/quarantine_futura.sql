-- Quarantine Futura Capital synthetic data (DO NOT RUN without Pablo approval)
-- Marks the 12 leads from harvest run harvest_run_mw5u7kjl_9d38856f79b4 and dossier 4764a343-0d17-415f-b519-ba3b05482bba as quarantined.
-- No credits are refunded by this script.

UPDATE reports
SET quarantined = 1,
    verification_status = 'unverified',
    data_source = COALESCE(data_source, 'harvest_fixture'),
    queried_at = COALESCE(queried_at, datetime('now'))
WHERE id = '4764a343-0d17-415f-b519-ba3b05482bba';

UPDATE leads
SET quarantined = 1,
    verification_status = 'unverified',
    data_source = COALESCE(data_source, 'harvest_fixture'),
    queried_at = COALESCE(queried_at, datetime('now'))
WHERE id IN (
  SELECT json_extract(je.value, '$.id')
  FROM harvest_runs hr, json_each(hr.leads_json, '$.ingestedLeads') je
  WHERE hr.id = 'harvest_run_mw5u7kjl_9d38856f79b4'
);

INSERT INTO audit_logs (id, tenant_id, action, resource_type, resource_id, actor, metadata, created_at)
VALUES ('audit_quarantine_futura', 'futura_capital', 'quarantine', 'harvest_run', 'harvest_run_mw5u7kjl_9d38856f79b4', 'staypuft', '{"leads":12,"dossier":"4764a343-0d17-415f-b519-ba3b05482bba","credits_refunded":0}', datetime('now'));
