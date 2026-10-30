import { Hono } from 'hono';
import type { Env } from '../types/env';
import { overviewView } from '../views/overview';
import { launchpadView } from '../views/launchpad';
import { explorerView } from '../views/explorer';
import { dossierModalView } from '../views/dossierModal';

export const dashboard = new Hono<{ Bindings: Env }>();

dashboard.get('/assets/vektor/:file', async (c) => {
  const file = c.req.param('file');
  const ct = file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.json') ? 'application/json' : 'application/octet-stream';
  c.header('Content-Type', ct);
  c.header('Cache-Control', 'public, max-age=86400');
  return c.text('', 404);
});

dashboard.get('/', (c) => c.html(overviewView()));
dashboard.get('/launchpad', (c) => c.html(launchpadView()));
dashboard.get('/explorer', (c) => c.html(explorerView()));
dashboard.get('/dossier', (c) => c.html(dossierModalView()));
