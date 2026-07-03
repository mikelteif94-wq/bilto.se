/**
 * Generates public/sitemap.xml from all known routes.
 * Run: node scripts/generate-sitemap.mjs
 * Called automatically by `npm run build:static`.
 */

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://bilto.se';
const TODAY = new Date().toISOString().split('T')[0];

// ─── Data (mirrors src/lib/seo-pages.ts + src/lib/guides.ts) ────────────────

const SEO_CITIES = [
  'stockholm', 'goteborg', 'malmo', 'uppsala', 'vasteras', 'orebro',
  'linkoping', 'helsingborg', 'jonkoping', 'norrkoping', 'lund', 'umea',
  'gavle', 'boras', 'eskilstuna', 'karlstad', 'taby', 'vaxjo', 'halmstad',
  'balsta', 'avesta', 'arvika', 'alingsas', 'sundsvall', 'lulea',
  'ostersund', 'nacka', 'sodertalje', 'huddinge',
];

const SEO_BRANDS = [
  'volvo', 'bmw', 'kia', 'audi', 'mercedes', 'volkswagen', 'toyota',
  'ford', 'tesla', 'hyundai', 'skoda', 'peugeot', 'renault', 'nissan',
  'mazda', 'opel', 'seat', 'mini', 'honda', 'subaru', 'polestar',
  'land-rover',
];

const SEO_TOPICS = [
  'forhandla-bil', 'bilkopshjalp', 'spara-pengar-bilkop',
  'sank-manadskostnad-bil', 'byta-bil', 'bilradgivare', 'gratis-bilvardering',
];

const GUIDE_SLUGS = [
  'kopa-begagnad-bil',
  'forhandla-bilpris',
  'salja-bil-basta-pris',
];

// ─── URL builder ─────────────────────────────────────────────────────────────

function url(loc, { priority = '0.6', changefreq = 'weekly', lastmod = TODAY } = {}) {
  return `  <url>\n    <loc>${BASE}${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

// ─── Build entries ────────────────────────────────────────────────────────────

const entries = [
  // Core pages
  url('/',              { priority: '1.0', changefreq: 'daily' }),
  url('/salj-bil',      { priority: '0.9' }),
  url('/sa-funkar-det', { priority: '0.9' }),
  url('/kop-bil',       { priority: '0.9', changefreq: 'daily' }),
  url('/kop-bil-hjalp', { priority: '0.8' }),
  url('/kontakt',       { priority: '0.8' }),
  url('/priser',        { priority: '0.8', changefreq: 'monthly' }),
  url('/vanliga-fragor',{ priority: '0.7', changefreq: 'monthly' }),
  url('/guider',        { priority: '0.8' }),
  url('/om-oss',        { priority: '0.6', changefreq: 'monthly' }),
  url('/blogg',         { priority: '0.7' }),
  url('/salj-din-bil',  { priority: '0.8' }),
  url('/salj-bil-hjalp',{ priority: '0.7' }),
  url('/integritetspolicy', { priority: '0.3', changefreq: 'monthly' }),
  url('/anvandarvillkor',   { priority: '0.3', changefreq: 'monthly' }),
  url('/webbplatskarta',    { priority: '0.3', changefreq: 'monthly' }),

  // SEO topic pages
  ...SEO_TOPICS.map(s => url(`/${s}`, { priority: '0.8' })),

  // Guide articles
  ...GUIDE_SLUGS.map(s => url(`/guider/${s}`, { priority: '0.7', changefreq: 'monthly' })),

  // City pages
  ...SEO_CITIES.map(s => url(`/salj-din-bil-i-${s}`, { priority: '0.7' })),

  // Brand pages
  ...SEO_BRANDS.map(s => url(`/salj-din-${s}`, { priority: '0.7' })),
];

// ─── Write XML ────────────────────────────────────────────────────────────────

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

${entries.join('\n\n')}

</urlset>
`;

const out = join(__dirname, '../public/sitemap.xml');
writeFileSync(out, xml, 'utf-8');
console.log(`Sitemap written to public/sitemap.xml (${entries.length} URLs)`);
