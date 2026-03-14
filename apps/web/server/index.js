import express from 'express';
import compression from 'compression';
import { renderPage } from 'vike/server';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import { sitemapHandler } from './sitemap.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

async function startServer() {
  const app = express();

  app.use(compression());

  // Sitemap — before static middleware so the dynamic version always wins
  app.get('/sitemap.xml', sitemapHandler);

  if (isProduction) {
    // In production, serve pre-built client assets
    const clientDir = resolve(__dirname, '../dist/client');
    app.use(sirv(clientDir, { immutable: true, maxAge: 31536000 }));
  } else {
    // In dev, let Vite handle everything via middleware
    const vite = await import('vite');
    const viteDevServer = await vite.createServer({
      root: resolve(__dirname, '..'),
      server: { middlewareMode: true },
    });
    app.use(viteDevServer.middlewares);
  }

  // Vike SSR handler – catches all routes not handled above
  app.get('/{*path}', async (req, res, next) => {
    const pageContextInit = {
      urlOriginal: req.originalUrl,
      headersOriginal: req.headers,
    };

    const pageContext = await renderPage(pageContextInit);
    const { httpResponse } = pageContext;

    if (!httpResponse) {
      return next();
    }

    const { statusCode, headers } = httpResponse;
    headers.forEach(([name, value]) => res.setHeader(name, value));
    res.status(statusCode);
    httpResponse.pipe(res);
  });

  app.listen(port, () => {
    console.log(`[SSR] Server running at http://localhost:${port}`);
  });
}

startServer();
