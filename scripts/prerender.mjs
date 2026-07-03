/**
 * Post-build prerender script.
 * Starts a local static server over dist/, uses Puppeteer to visit each route,
 * then writes the rendered HTML to dist/<route>/index.html.
 *
 * Usage: node scripts/prerender.mjs
 * (Run after vite build.)
 */

import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { createReadStream, existsSync, mkdirSync, writeFileSync, readFileSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '../dist');
const PORT = 4174;
const BASE = `http://localhost:${PORT}`;

// Routes to prerender — path : wait-for-selector (to detect content rendered)
const ROUTES = [
  { path: '/',                               selector: 'h1' },
  { path: '/sa-funkar-det',                  selector: 'h1' },
  { path: '/kop-bil',                        selector: 'h1' },
  { path: '/om-oss',                         selector: 'h1' },
  { path: '/vanliga-fragor',                 selector: 'h1' },
  { path: '/priser',                         selector: 'h1' },
  { path: '/guider',                         selector: 'h1' },
  { path: '/guider/kopa-begagnad-bil',       selector: 'h1' },
  { path: '/guider/forhandla-bilpris',       selector: 'h1' },
  { path: '/guider/salja-bil-basta-pris',    selector: 'h1' },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ico':  'image/x-icon',
  '.csv':  'text/csv',
  '.txt':  'text/plain',
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const urlPath = req.url.split('?')[0];
      let filePath = join(DIST, urlPath);

      // Directory → index.html
      if (existsSync(filePath) && statSync(filePath).isDirectory()) {
        filePath = join(filePath, 'index.html');
      }

      // Unknown file → SPA fallback
      if (!existsSync(filePath)) {
        filePath = join(DIST, 'index.html');
      }

      const ext = extname(filePath).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      createReadStream(filePath).pipe(res);
    });

    server.on('error', reject);
    server.listen(PORT, () => resolve(server));
  });
}

function writeRoute(routePath, html) {
  if (routePath === '/') {
    writeFileSync(join(DIST, 'index.html'), html, 'utf-8');
    return;
  }
  const dir = join(DIST, routePath.replace(/^\//, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
}

async function prerender() {
  console.log('Starting static server on port', PORT);
  const server = await startServer();

  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  let failed = 0;

  for (const route of ROUTES) {
    const url = `${BASE}${route.path}`;
    console.log(`  Rendering ${route.path}`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Suppress console noise from the app
    page.on('console', () => {});
    page.on('pageerror', () => {});

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for the primary content selector
      await page.waitForSelector(route.selector, { timeout: 15000 });

      // Small extra settle time for useEffect / setPageMeta to fire
      await new Promise(r => setTimeout(r, 800));

      const html = await page.content();

      // Sanity check: confirm H1 text made it into the HTML
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (!h1Match) {
        console.warn(`  WARNING: no <h1> found in rendered HTML for ${route.path}`);
        failed++;
      } else {
        const h1Text = h1Match[1].replace(/<[^>]+>/g, '').trim().slice(0, 60);
        console.log(`  OK  h1="${h1Text}"`);
      }

      writeRoute(route.path, html);
    } catch (err) {
      console.error(`  ERROR rendering ${route.path}:`, err.message);
      failed++;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  if (failed > 0) {
    console.error(`\nPrerendering completed with ${failed} error(s).`);
    process.exit(1);
  } else {
    console.log(`\nPrerendering complete. ${ROUTES.length} routes written to dist/.`);
  }
}

prerender().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
