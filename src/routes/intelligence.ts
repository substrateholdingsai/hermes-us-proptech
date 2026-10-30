import { Hono } from 'hono';
import type { Env } from '../types/env';
import { dispatchIntelJob } from '../services/hermesAgent';
import { logger } from '../lib/logger';

export const intelligence = new Hono<{ Bindings: Env }>();

function tenantIdFrom(c: any): string {
  return c.req.header('x-tenant-id') || 'default';
}

intelligence.post('/entity-resolution', async (c) => {
  let body: { entityName?: string; state?: string; customPrompt?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const tenantId = tenantIdFrom(c);
  const ctx = { tenantId, env: c.env };
  try {
    const job = await dispatchIntelJob(ctx, {
      tenantId,
      taskType: 'entity_resolution',
      entityName: body.entityName,
      state: body.state,
      customPrompt: body.customPrompt,
    });
    return c.json({ ok: true, job });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Error entity resolution:', { error: msg });
    return c.json({ ok: false, error: msg }, 500);
  }
});

intelligence.post('/property-equity', async (c) => {
  let body: { propertyAddress?: string; state?: string; customPrompt?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const tenantId = tenantIdFrom(c);
  const ctx = { tenantId, env: c.env };
  try {
    const job = await dispatchIntelJob(ctx, {
      tenantId,
      taskType: 'property_equity',
      propertyAddress: body.propertyAddress,
      state: body.state,
      customPrompt: body.customPrompt,
    });
    return c.json({ ok: true, job });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Error property equity:', { error: msg });
    return c.json({ ok: false, error: msg }, 500);
  }
});

intelligence.post('/sec-validation', async (c) => {
  let body: { subjectName?: string; entityName?: string; customPrompt?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const tenantId = tenantIdFrom(c);
  const ctx = { tenantId, env: c.env };
  try {
    const job = await dispatchIntelJob(ctx, {
      tenantId,
      taskType: 'sec_validation',
      subjectName: body.subjectName,
      entityName: body.entityName,
      customPrompt: body.customPrompt,
    });
    return c.json({ ok: true, job });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Error sec validation:', { error: msg });
    return c.json({ ok: false, error: msg }, 500);
  }
});

intelligence.post('/skip-trace', async (c) => {
  let body: { subjectName?: string; customPrompt?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const tenantId = tenantIdFrom(c);
  const ctx = { tenantId, env: c.env };
  try {
    const job = await dispatchIntelJob(ctx, {
      tenantId,
      taskType: 'skip_trace',
      subjectName: body.subjectName,
      customPrompt: body.customPrompt,
    });
    return c.json({ ok: true, job });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Error skip trace:', { error: msg });
    return c.json({ ok: false, error: msg }, 500);
  }
});

intelligence.get('/health', (c) => c.json({ ok: true, service: 'hermes-us-intel' }));
