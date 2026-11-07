import { Hono } from 'hono';
import type { Env } from '../types/env';
import { overviewView } from '../views/overview';
import { launchpadView } from '../views/launchpad';
import { explorerView } from '../views/explorer';
import { dossierModalView } from '../views/dossierModal';
import { harvesterView } from '../views/harvester';
import { VEKTOR_ASSETS } from '../lib/vektorAssets';
import { getSessionSuperAdmin } from './superadmin';

export const dashboard = new Hono<{ Bindings: Env }>();

dashboard.use('*', async (c, next) => {
  const p = c.req.path || '';
  if (p.includes('/assets/vektor/')) return next();
  const session = await getSessionSuperAdmin(c);
  if (!session || session.role !== 'super_admin') {
    return c.redirect('/superadmin/login');
  }
  await next();
});

export function serveVektorAsset(file: string) {
  const content = VEKTOR_ASSETS[file];
  if (!content) return null;
  const ct = file.endsWith('.svg')
    ? 'image/svg+xml'
    : file.endsWith('.json')
    ? 'application/json'
    : 'application/octet-stream';
  return { content, ct };
}

dashboard.get('/assets/vektor/:file', async (c) => {
  const file = c.req.param('file');
  const asset = serveVektorAsset(file);
  if (!asset) {
    return c.text('Asset not found', 404);
  }
  c.header('Content-Type', asset.ct);
  c.header('Cache-Control', 'public, max-age=86400');
  return c.body(asset.content);
});

dashboard.get('/', (c) => c.html(overviewView()));
dashboard.get('/launchpad', (c) => c.html(launchpadView()));
dashboard.get('/explorer', (c) => c.html(explorerView()));
dashboard.get('/harvester', (c) => c.html(harvesterView()));
dashboard.get('/dossier', (c) => c.html(dossierModalView()));
