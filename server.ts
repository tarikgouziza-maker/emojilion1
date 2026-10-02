import express from 'express';
import path from 'path';
import fs from 'fs';
import { createMemoryRepositories } from './core/repositories/memory-repository.ts';
import { handleUniversalApiRequest } from './core/router.ts';
import { OFFICIAL_CATEGORIES } from './src/data/unicodeCategories.ts';
import { ALL_EMOJIS } from './src/data/emojis/index.ts';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  app.use(express.json());

  // Load existing persistent database.json if available
  const dbFile = path.resolve(process.cwd(), 'data/database.json');
  let initialAdmins: any[] | undefined;
  if (fs.existsSync(dbFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
      if (Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0) {
        initialAdmins = parsed.adminUsers;
      }
    } catch (e) {
      console.warn('Failed to parse data/database.json, using defaults');
    }
  }

  // Create repository container
  const repos = createMemoryRepositories({
    admins: initialAdmins
  });

  // -------------------------------------------------------------
  // Universal API Dispatcher (Shared with Cloudflare Pages Functions)
  // -------------------------------------------------------------
  app.all('/api/*', async (req, res) => {
    try {
      const protocol = req.protocol || 'http';
      const host = req.get('host') || `localhost:${PORT}`;
      const fullUrl = `${protocol}://${host}${req.originalUrl}`;

      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      }

      const init: RequestInit = {
        method: req.method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
        init.body = JSON.stringify(req.body || {});
      }

      const webRequest = new Request(fullUrl, init);
      const webResponse = await handleUniversalApiRequest(webRequest, repos);

      res.status(webResponse.status);
      webResponse.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });

      const responseText = await webResponse.text();
      res.send(responseText);
    } catch (err: any) {
      console.error('API Error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // -------------------------------------------------------------
  // Dynamic SEO XML Sitemap & Robots.txt
  // -------------------------------------------------------------
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = process.env.APP_URL || `https://${req.get('host') || 'emojilion.com'}`;
    const date = new Date().toISOString().split('T')[0];

    const staticRoutes = [
      '',
      '/categories/',
      '/gender/',
    ];

    const categoryRoutes = OFFICIAL_CATEGORIES.map(c => `/category/${c.slug}/`);
    const subcategoryRoutes = OFFICIAL_CATEGORIES.flatMap(c => 
      c.subcategories.map(s => `/category/${c.slug}/${s.slug}/`)
    );
    const emojiRoutes = ALL_EMOJIS.map(e => `/emoji/${e.slug}/`);

    const allUrls = [
      ...staticRoutes.map(r => ({ loc: `${baseUrl}${r}`, changefreq: 'daily', priority: '1.0' })),
      ...categoryRoutes.map(r => ({ loc: `${baseUrl}${r}`, changefreq: 'weekly', priority: '0.8' })),
      ...subcategoryRoutes.map(r => ({ loc: `${baseUrl}${r}`, changefreq: 'weekly', priority: '0.7' })),
      ...emojiRoutes.map(r => ({ loc: `${baseUrl}${r}`, changefreq: 'monthly', priority: '0.6' })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  });

  app.get('/robots.txt', (req, res) => {
    const baseUrl = process.env.APP_URL || `https://${req.get('host') || 'emojilion.com'}`;
    const robots = `User-agent: *
Disallow: /admin/
Disallow: /api/
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
    res.header('Content-Type', 'text/plain');
    res.send(robots);
  });

  // -------------------------------------------------------------
  // Vite Dev Server / Static Hosting
  // -------------------------------------------------------------
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`EmojiLion server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start EmojiLion server:', err);
  process.exit(1);
});
