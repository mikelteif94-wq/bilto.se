/**
 * Usage: node scripts/update-specs-from-json.mjs
 *
 * Reads bilar_latt.json and updates fuel_types + body_type in all cars-*.ts files.
 * Pricing (new_from_sek, new_to_sek, used_from_sek, monthly_*) is NOT touched.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src/lib/comparison/data');

// ── Mapping helpers ───────────────────────────────────────────────────────────

function mapDrivmedel(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const fuels = [];
  if (lower.includes('bensin')) fuels.push('bensin');
  if (lower.includes('diesel')) fuels.push('diesel');
  if (lower.includes('laddhybrid') || lower.includes('bensin + el') || lower.includes('phev')) fuels.push('laddhybrid');
  else if (lower.includes('hybrid') || lower.includes('mildhybrid')) fuels.push('hybrid');
  if (lower.includes('el') && !lower.includes('bensin + el')) fuels.push('el');
  // Special case: "Bensin + el" = laddhybrid (already handled above)
  if (lower === 'bensin + el') return ['laddhybrid'];
  if (lower === 'el') return ['el'];
  if (lower === 'bensin') return ['bensin'];
  if (lower === 'diesel') return ['diesel'];
  return fuels.length ? fuels : null;
}

function mapKaross(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes('suv')) return 'suv';
  if (lower.includes('halvkombi')) return 'hatchback';
  if (lower.includes('kombi')) return 'kombi';
  if (lower.includes('cab') || lower.includes('cabriolet') || lower.includes('roadster')) return 'cab';
  if (lower.includes('mpv') || lower.includes('skåp') || lower.includes('van') || lower.includes('minibuss')) return 'mpv';
  if (lower.includes('coupé') || lower.includes('coupe')) return 'coupe';
  if (lower.includes('sedan')) return 'sedan';
  if (lower.includes('pickup')) return 'sedan'; // closest available
  return null;
}

// Slug aliases: ts-slug → json-slug overrides
const SLUG_ALIASES = {
  'audi-a3': 'audi-a3-sportback',
  'audi-a4': 'audi-a4-avant',
  'audi-a6': 'audi-a6-avant',
  'audi-a6-e-tron': 'audi-a6-avant-e-tron',
  'bmw-2-serie-active-tourer': 'bmw-2-active-tourer',
  'bmw-2-serie': 'bmw-2-serie-gran-coupe',
  'bmw-4-serie': 'bmw-4-serie-coupe',
  'ds-ds7': 'ds-7-crossback',
  'mercedes-a-klass': 'mercedes-benz-a-klass',
  'mercedes-b-klass': 'mercedes-benz-b-klass',
  'mercedes-c-klass': 'mercedes-benz-c-klass',
  'mercedes-cla': 'mercedes-benz-cla',
  'mercedes-cls': 'mercedes-benz-cls',
  'mercedes-e-klass': 'mercedes-benz-e-klass',
  'mercedes-eqa': 'mercedes-benz-eqa',
  'mercedes-eqb': 'mercedes-benz-eqb',
  'mercedes-eqc': 'mercedes-benz-eqc',
  'mercedes-eqe': 'mercedes-benz-eqe',
  'mercedes-eqs': 'mercedes-benz-eqs',
  'mercedes-eqs-suv': 'mercedes-benz-eqs-suv',
  'mercedes-gla': 'mercedes-benz-gla',
  'mercedes-glb': 'mercedes-benz-glb',
  'mercedes-glc': 'mercedes-benz-glc',
  'mercedes-gle': 'mercedes-benz-gle',
  'mercedes-gls': 'mercedes-benz-gls',
  'mercedes-s-klass': 'mercedes-benz-s-klass',
  'mercedes-v-klass': 'mercedes-benz-v-klass',
  'mg-mg4': 'mg-4',
  'mini-cooper-se': 'mini-cooper',
  'renault-scenic-e-tech': 'renault-scenic',
  'seat-arona': 'seat-ibiza',
  'toyota-corolla': 'toyota-corolla-hybrid',
  'volkswagen-passat': 'volkswagen-passat-variant',
};

// ── Load JSON source ──────────────────────────────────────────────────────────

const jsonPath = path.join(DATA_DIR, 'bilar_latt.json');
const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const bySlug = new Map();
for (const car of raw) {
  bySlug.set(car.slug, car);
}

// ── Patch helpers ─────────────────────────────────────────────────────────────

function arrLiteral(items) {
  return `[${items.map(s => `'${s}'`).join(', ')}]`;
}

function patchFuelTypes(src, idPos, newFuels) {
  const window = src.slice(idPos, idPos + 2000);
  const re = /fuel_types:\s*\[[^\]]*\]/;
  const replacement = `fuel_types: ${arrLiteral(newFuels)}`;
  if (!re.test(window)) return src;
  const newWindow = window.replace(re, replacement);
  return src.slice(0, idPos) + newWindow + src.slice(idPos + 2000);
}

function patchBodyType(src, idPos, newBodyType) {
  const window = src.slice(idPos, idPos + 2000);
  const re = /body_type:\s*'[^']*'/;
  const replacement = `body_type: '${newBodyType}'`;
  if (!re.test(window)) return src;
  const newWindow = window.replace(re, replacement);
  return src.slice(0, idPos) + newWindow + src.slice(idPos + 2000);
}

// ── Process each file ─────────────────────────────────────────────────────────

const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('cars-') && f.endsWith('.ts'));
let totalUpdated = 0;

for (const fname of files) {
  const filePath = path.join(DATA_DIR, fname);
  let src = fs.readFileSync(filePath, 'utf8');
  let fileChanges = 0;

  // Extract all id+slug pairs from this file
  const idSlugRe = /id:\s*'([^']+)'[^}]*?slug:\s*'([^']+)'/gs;
  const pairs = [];
  let m;
  while ((m = idSlugRe.exec(src)) !== null) {
    pairs.push({ id: m[1], slug: m[2], pos: m.index });
  }

  for (const { id, slug, pos } of pairs) {
    // Find actual slug in JSON (with alias fallback)
    const resolvedSlug = SLUG_ALIASES[slug] || slug;
    const jsonCar = bySlug.get(resolvedSlug);
    if (!jsonCar) continue;

    const idMarker = `id: '${id}'`;
    const idPos = src.indexOf(idMarker, Math.max(0, pos - 50));
    if (idPos === -1) continue;

    const newFuels = mapDrivmedel(jsonCar.drivmedel);
    const newBodyType = mapKaross(jsonCar.kaross);

    let changed = false;

    if (newFuels) {
      const before = src;
      src = patchFuelTypes(src, idPos, newFuels);
      if (src !== before) changed = true;
    }

    if (newBodyType) {
      const before = src;
      src = patchBodyType(src, idPos, newBodyType);
      if (src !== before) changed = true;
    }

    if (changed) fileChanges++;
  }

  fs.writeFileSync(filePath, src, 'utf8');
  console.log(`  ${fname}: ${fileChanges} cars updated`);
  totalUpdated += fileChanges;
}

console.log(`\nDone. Updated ${totalUpdated} cars across ${files.length} files.`);
