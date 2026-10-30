import { Hono } from 'hono';
import type { Env } from './types/env';
import { intelligence } from './routes/intelligence';
import { dashboard } from './routes/dashboard';
import { HermesSandboxDO } from './durable/hermes-sandbox';

export { HermesSandboxDO };

const app = new Hono<{ Bindings: Env }>();

app.route('/api/v1/intelligence', intelligence);
app.route('/dashboard', dashboard);
app.get('/', (c) => c.redirect('/dashboard'));

app.get('/health', (c) => c.json({ ok: true, service: 'hermes-us-proptech' }));

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
