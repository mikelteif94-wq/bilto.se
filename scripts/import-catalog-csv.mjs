/**
 * Usage: node scripts/import-catalog-csv.mjs public/car-catalog-edit.csv
 *
 * Reads the CSV and patches pros/cons/meta_description in all
 * src/lib/comparison/data/cars-*.ts files.
 *
 * CSV format (semicolon-delimited pros/cons):
 *   id,pros,cons,meta_description
 *   audi_a3,"Pro 1;Pro 2","Con 1;Con 2","Some description"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCsv(text) {
  const rows = [];
  let i = 0;
  while (i < text.length) {
    const row = [];
    while (i < text.length && text[i] !== '\n') {
      if (text[i] === '"') {
        i++;
        let field = '';
        while (i < text.length) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') { field += '"'; i += 2; }
            else { i++; break; }
          } else {
            field += text[i++];
          }
        }
        row.push(field);
        if (text[i] === ',') i++;
      } else {
        let field = '';
        while (i < text.length && text[i] !== ',' && text[i] !== '\n') field += text[i++];
        row.push(field);
        if (text[i] === ',') i++;
      }
    }
    if (text[i] === '\n') i++;
    if (row.length > 0 && !(row.length === 1 && row[0] === '')) rows.push(row);
  }
  return rows;
}

function loadCsv(csvPath) {
  const text = fs.readFileSync(csvPath, 'utf8').replace(/\r/g, '');
  const rows = parseCsv(text);
  const [header, ...data] = rows;
  const idIdx = header.indexOf('id');
  const prosIdx = header.indexOf('pros');
  const consIdx = header.indexOf('cons');
  const metaIdx = header.indexOf('meta_description');

  const map = new Map();
  for (const row of data) {
    const id = row[idIdx]?.trim();
    if (!id) continue;
    map.set(id, {
      pros: row[prosIdx]?.split(';').map(s => s.trim()).filter(Boolean) ?? [],
      cons: row[consIdx]?.split(';').map(s => s.trim()).filter(Boolean) ?? [],
      meta_description: row[metaIdx]?.trim() ?? '',
    });
  }
  return map;
}

function escStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function arrLiteral(items) {
  return `[${items.map(s => `'${escStr(s)}'`).join(', ')}]`;
}

// ── Patch a single data file ──────────────────────────────────────────────────
// Strategy: find each car object by locating `id: 'xxx'`, then walk forward
// to find the pros/cons lines and replace them in-place.
function patchFile(filePath, map) {
  let src = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;

  for (const [id, { pros, cons, meta_description }] of map) {
    // Find the position of this car's id
    const idMarker = `id: '${id}'`;
    const idPos = src.indexOf(idMarker);
    if (idPos === -1) continue;

    // Find the closing `},` or `}` of this object: we scan for pros/cons
    // within a reasonable window (2000 chars) after the id
    const window = src.slice(idPos, idPos + 2000);

    // Replace pros array within window
    const prosRe = /pros:\s*\[[^\]]*\]/;
    const consRe = /cons:\s*\[[^\]]*\]/;

    const newPros = `pros: ${arrLiteral(pros)}`;
    const newCons = `cons: ${arrLiteral(cons)}`;

    let newWindow = window.replace(prosRe, newPros).replace(consRe, newCons);

    if (newWindow !== window) {
      src = src.slice(0, idPos) + newWindow + src.slice(idPos + 2000);
      changeCount++;
    }

    // Handle meta_description
    if (meta_description) {
      const idPos2 = src.indexOf(idMarker);
      const win2 = src.slice(idPos2, idPos2 + 2000);
      const metaRe = /meta_description:\s*(?:'[^']*'|"[^"]*"|null|undefined)/;
      const newMeta = `meta_description: '${escStr(meta_description)}'`;

      if (metaRe.test(win2)) {
        const newWin2 = win2.replace(metaRe, newMeta);
        src = src.slice(0, idPos2) + newWin2 + src.slice(idPos2 + 2000);
      } else {
        // Insert after slug field inside window
        const slugRe = /slug:\s*'[^']*'/;
        const newWin2 = win2.replace(slugRe, (m) => `${m},\n    meta_description: '${escStr(meta_description)}'`);
        src = src.slice(0, idPos2) + newWin2 + src.slice(idPos2 + 2000);
      }
    }
  }

  fs.writeFileSync(filePath, src, 'utf8');
  return changeCount;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const csvArg = process.argv[2];
if (!csvArg) {
  console.error('Usage: node scripts/import-catalog-csv.mjs <path-to-csv>');
  process.exit(1);
}

const csvPath = path.resolve(ROOT, csvArg);
console.log(`Reading CSV: ${csvPath}`);
const map = loadCsv(csvPath);
console.log(`Loaded ${map.size} entries from CSV`);

const dataDir = path.join(ROOT, 'src/lib/comparison/data');
const files = fs.readdirSync(dataDir).filter(f => f.startsWith('cars-') && f.endsWith('.ts'));

let total = 0;
for (const file of files) {
  const filePath = path.join(dataDir, file);
  const count = patchFile(filePath, map);
  console.log(`  ${file}: ${count} cars updated`);
  total += count;
}

console.log(`\nDone. Updated ${total} cars across ${files.length} files.`);
