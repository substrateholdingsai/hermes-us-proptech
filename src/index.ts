import { Hono } from 'hono';
import type { Env } from './types/env';
import { intelligence } from './routes/intelligence';
import { dashboard, serveVektorAsset } from './routes/dashboard';
import { docsRouter } from './routes/docs';
import { openApiSpec } from './docs/openapi';
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
app.route('/dashboard', dashboard);
app.get('/', (c) => c.redirect('/dashboard'));

app.get('/health', (c) => c.json({ ok: true, service: 'hermes-us-proptech' }));

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export { app };
export default app;