import { Hono } from 'hono';
import type { Env } from '../types/env';
import { openApiSpec } from '../docs/openapi';

export const docsRouter = new Hono<{ Bindings: Env }>();

docsRouter.get('/openapi.json', (c) => c.json(openApiSpec));

function renderSwaggerUi(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>API Docs · VEKTOR / Hermes US PropTech</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0A0E14; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/api/v1/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis],
    });
  </script>
</body>
</html>`;
}

docsRouter.get('/', (c) => c.html(renderSwaggerUi()));
docsRouter.get('/swagger', (c) => c.html(renderSwaggerUi()));
