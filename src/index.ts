import { Hono } from 'hono';
import type { Env } from './types/env';
import { intelligence } from './routes/intelligence';
import { dashboard, serveVektorAsset } from './routes/dashboard';
import { internal } from './routes/internal';
import { clientApi, clientPages } from './routes/client';
import { superadminApi, superadminPages } from './routes/superadmin';
import { landingView } from './views/landing';
import { docsRouter } from './routes/docs';
import { openApiSpec } from './docs/openapi';
import { runScheduledHarvester } from './services/harvester/scheduler';
import { HermesSandboxDO } from './durable/hermes-sandbox';

export { HermesSandboxDO };

const app = new Hono<{ Bindings: Env }>();

app.get('/assets/vektor/:file', (c) => {
  const file = c.req.param('file');
  const asset = serveVektorAsset(file);
  if (!asset) {
    return c.text('Asset not found', 404);
  }
  c.header('Content-Type', asset.ct);
  c.header('Cache-Control', 'public, max-age=86400');
  return c.body(asset.content);
});

app.route('/api/v1/intelligence', intelligence);
app.route('/docs', docsRouter);
app.route('/swagger', docsRouter);
app.get('/api/v1/openapi.json', (c) => c.json(openApiSpec));
app.get('/', (c) => c.html(landingView()));
app.route('/dashboard', dashboard);
app.route('/api/internal', internal);
app.route('/api/client', clientApi);
app.route('/api/superadmin', superadminApi);
app.route('/client', clientPages);
app.route('/superadmin', superadminPages);

app.get('/health', (c) => c.json({ ok: true, service: 'hermes-us-proptech' }));

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export { app };
(app as any).scheduled = async (_event: unknown, env: Env, ctx: { waitUntil: (p: Promise<any>) => void }) => {
  ctx.waitUntil(runScheduledHarvester(env));
};
export default app;

