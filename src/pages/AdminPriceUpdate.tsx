import { useCallback, useRef, useState } from 'react';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onBack: () => void;
}

type Status = 'idle' | 'parsing' | 'previewing' | 'importing' | 'done';

interface PriceRow {
  make: string;
  model: string;
  uppskattad?: boolean;
  // Priser
  pris_ny_fran: number | null;
  pris_ny_till: number | null;
  pris_begagnat: number | null;
  pris_begagnat_spann_min: number | null;
  pris_begagnat_spann_max: number | null;
  pris_billigast: number | null;
  manadskostnad_ny: number | null;
  manadskostnad_begagnad: number | null;
  // Drivlina
  drivlina: string | null;
  drivlina_kort: string | null;
  drivetrain_type: string | null;
  // Bränsle
  drivmedel: string | null;
  fuel_types: string[] | null;
}

interface ImportResult {
  make: string;
  model: string;
  status: 'updated' | 'not_found' | 'error';
  error?: string;
}

// Accepts both "Bensin; Diesel" and "Bensin, Diesel" (CSV may use either)
const FUEL_MAP: Record<string, string[]> = {
  'el': ['el'],
  'bensin': ['bensin'],
  'diesel': ['diesel'],
  'laddhybrid': ['laddhybrid'],
  'hybrid': ['hybrid'],
  'mildhybrid': ['hybrid'],
  'vätgas': ['vätgas'],
  'hydrogen': ['vätgas'],
  'bensin + el': ['bensin', 'laddhybrid'],
  'diesel + el': ['diesel', 'laddhybrid'],
  'mildhybrid bensin': ['bensin', 'hybrid'],
  'mildhybrid diesel': ['diesel', 'hybrid'],
};

function parseFuelTypes(raw: string): string[] | null {
  if (!raw.trim()) return null;
  // Support both comma and semicolon as separator
  const parts = raw.split(/[,;]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const result = new Set<string>();
  for (const p of parts) {
    const mapped = FUEL_MAP[p];
    if (mapped) {
      mapped.forEach(f => result.add(f));
    } else {
      result.add(p);
    }
  }
  return result.size > 0 ? Array.from(result) : null;
}

// Extract a number from Swedish price text like "från ~460 000", "~494 500", "274 300"
function extractNum(s: string): number | null {
  // Remove non-numeric chars except spaces (used as thousands sep) and decimal separators
  const cleaned = s.replace(/[^\d\s]/g, ' ').trim();
  // Collapse spaces and take first contiguous number block
  const firstNum = cleaned.trim().replace(/\s+/g, '');
  if (!firstNum) return null;
  const n = Number(firstNum);
  return isNaN(n) || n === 0 ? null : n;
}

// Parse a price that might be a range: "274 300 – 306 300", "från ~460 000", "~494 500"
function parsePriceRange(raw: string): { min: number | null; max: number | null } {
  // Split on en-dash (–) which Swedish price ranges use
  if (raw.includes('–')) {
    const parts = raw.split('–').map(p => p.trim());
    return { min: extractNum(parts[0]), max: extractNum(parts[1] ?? '') };
  }
  return { min: extractNum(raw), max: null };
}

function numOrNull(s: string): number | null {
  return extractNum(s);
}

function parseLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      fields.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function parseRows(text: string): PriceRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map(h =>
    h.trim().toLowerCase()
      .replace(/ä/g, 'a').replace(/å/g, 'a').replace(/ö/g, 'o')
      .replace(/\s+/g, '_')
  );

  const idx = (name: string) => headers.indexOf(name);
  const get = (names: string[], cols: string[]) => {
    for (const n of names) {
      const i = idx(n);
      if (i >= 0 && cols[i]?.trim()) return cols[i].trim();
    }
    return '';
  };

  const rows: PriceRow[] = [];

  for (let r = 1; r < lines.length; r++) {
    const cols = parseLine(lines[r]);
    const make = get(['marke', 'make', 'marke'], cols);
    const model = get(['modell', 'model'], cols);
    if (!make || !model) continue;

    const drivmedel = get(['drivmedel', 'bransle', 'fuel'], cols);
    const drivlina = get(['drivlina', 'drivetrain'], cols);
    const drivlinaKort = get(['drivlina_kort'], cols);
    const uppskattadRaw = get(['uppskattad', 'estimated'], cols);

    // Parse pris_sek column (e.g. "274 300 – 306 300", "från ~460 000", "~494 500")
    const prisSekRaw = get(['pris_sek', 'pris', 'price_sek', 'price'], cols);
    const prisSekRange = prisSekRaw ? parsePriceRange(prisSekRaw) : { min: null, max: null };

    // Derive drivetrain_type from Swedish drivlina
    let drivetrain_type: string | null = null;
    if (drivlina) {
      const d = drivlina.toLowerCase();
      if (d.includes('fyr') || d.includes('awd') || d.includes('4x4')) {
        drivetrain_type = 'Fyrhjulsdrift';
      } else if (d.includes('bak') || d.includes('rwd')) {
        drivetrain_type = 'Bakhjulsdrift';
      } else if (d.includes('fram') || d.includes('fwd') || d.includes('tv') || d.includes('framhjul')) {
        drivetrain_type = 'Framhjulsdrift';
      }
    }
    if (drivlinaKort) drivetrain_type = drivlinaKort;

    // Explicit price columns take priority; fall back to pris_sek range
    const prisNyFran = numOrNull(get(['pris_ny_fran', 'ny_fran', 'nypris_fran'], cols)) ?? prisSekRange.min;
    const prisNyTill = numOrNull(get(['pris_ny_till', 'ny_till', 'nypris_till'], cols)) ?? prisSekRange.max;

    rows.push({
      make,
      model,
      uppskattad: uppskattadRaw.toLowerCase() === 'ja',
      pris_ny_fran: prisNyFran,
      pris_ny_till: prisNyTill,
      pris_begagnat: numOrNull(get(['pris_begagnat', 'begagnatpris', 'beg_pris'], cols)),
      pris_begagnat_spann_min: numOrNull(get(['pris_begagnat_spann_min', 'beg_min'], cols)),
      pris_begagnat_spann_max: numOrNull(get(['pris_begagnat_spann_max', 'beg_max'], cols)),
      pris_billigast: numOrNull(get(['pris_billigast', 'billigast'], cols)),
      manadskostnad_ny: numOrNull(get(['manadskostnad_ny', 'man_ny', 'maned_ny'], cols)),
      manadskostnad_begagnad: numOrNull(get(['manadskostnad_begagnad', 'man_beg', 'maned_beg'], cols)),
      drivlina: drivlina || null,
      drivlina_kort: drivlinaKort || drivetrain_type,
      drivetrain_type,
      drivmedel: drivmedel || null,
      fuel_types: drivmedel ? parseFuelTypes(drivmedel) : null,
    });
  }

  return rows;
}

function downloadTemplate() {
  const csv = [
    'marke,modell,pris_ny_fran,pris_ny_till,pris_begagnat,pris_begagnat_spann_min,pris_begagnat_spann_max,pris_billigast,manadskostnad_ny,manadskostnad_begagnad,drivlina,drivmedel',
    'Volvo,XC60,549900,749900,320000,280000,420000,215000,8500,5200,Framhjulsdrift;Fyrhjulsdrift,Bensin;Mildhybrid bensin;Laddhybrid',
    'BMW,X5,799000,1100000,480000,420000,650000,350000,12000,7500,Fyrhjulsdrift,Bensin;Diesel;Laddhybrid',
    'Tesla,Model 3,449900,649900,260000,220000,380000,189000,7200,4100,Bakhjulsdrift;Fyrhjulsdrift,El',
  ].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bilto_priser_mall.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function fmtK(n: number | null): string {
  if (n === null) return '–';
  return `${Math.round(n / 1000)}k`;
}

export default function AdminPriceUpdate({ onBack }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setParseError(null);
    setStatus('parsing');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseRows(text);
        if (parsed.length === 0) {
          setParseError('Ingen giltig data hittades. Kontrollera att filen har kolumnerna märke och modell.');
          setStatus('idle');
          return;
        }
        setRows(parsed);
        setStatus('previewing');
      } catch {
        setParseError('Kunde inte läsa filen. Kontrollera att formatet är korrekt CSV.');
        setStatus('idle');
      }
    };
    reader.readAsText(file, 'utf-8');
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const runImport = useCallback(async () => {
    setStatus('importing');
    setProgress(0);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setResults([{ make: '–', model: '–', status: 'error', error: 'Inte inloggad som admin.' }]);
      setStatus('done');
      return;
    }

    const PRICE_FIELDS: (keyof PriceRow)[] = [
      'pris_ny_fran', 'pris_ny_till', 'pris_begagnat',
      'pris_begagnat_spann_min', 'pris_begagnat_spann_max',
      'pris_billigast', 'manadskostnad_ny', 'manadskostnad_begagnad',
      'drivlina', 'drivlina_kort', 'drivetrain_type',
      'drivmedel', 'fuel_types',
    ];

    const BATCH = 50;
    const resultList: ImportResult[] = [];
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/catalog-import`;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH).map(row => {
        const payload: Record<string, unknown> = { make: row.make, model: row.model };
        for (const f of PRICE_FIELDS) {
          if (row[f] !== null && row[f] !== undefined) payload[f as string] = row[f];
        }
        return payload;
      });

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ rows: batch }),
        });

        if (!res.ok) {
          const text = await res.text();
          for (const r of batch) {
            resultList.push({ make: String(r.make), model: String(r.model), status: 'error', error: text });
          }
        } else {
          const { results: batchResults } = await res.json() as { results: ImportResult[] };
          resultList.push(...batchResults);
        }
      } catch (err) {
        for (const r of batch) {
          resultList.push({ make: String(r.make), model: String(r.model), status: 'error', error: String(err) });
        }
      }

      setProgress(Math.round(Math.min(i + BATCH, rows.length) / rows.length * 100));
    }

    setResults(resultList);
    setStatus('done');
  }, [rows]);

  const reset = () => {
    setStatus('idle');
    setRows([]);
    setResults([]);
    setParseError(null);
    setProgress(0);
  };

  const updated = results.filter(r => r.status === 'updated').length;
  const notFound = results.filter(r => r.status === 'not_found').length;
  const errors = results.filter(r => r.status === 'error').length;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka
            </button>
            <span className="text-slate-300">/</span>
            <h1 className="text-lg font-semibold text-slate-900">Uppdatera priser, drivlina & bränsle</h1>
          </div>
          {(status === 'idle' || status === 'parsing') && (
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 h-9 px-4 text-sm text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-[#faf8f5] transition"
            >
              <Download className="w-4 h-4" />
              Ladda ned mall (CSV)
            </button>
          )}
        </div>

        {/* Idle / drop zone */}
        {(status === 'idle' || status === 'parsing') && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-slate-900 mb-1">Ladda upp CSV-fil</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Filen matchas mot katalogen på <strong>märke + modell</strong>.
                  Bara de kolumner som finns i CSV:en uppdateras — övriga fält (bilder, texter, betyg etc.) påverkas <strong>inte</strong>.
                  Stöder <code className="bg-slate-100 px-1 rounded text-xs">bilpriser_2026.csv</code>-formatet med <code className="bg-slate-100 px-1 rounded text-xs">Pris_SEK</code>-kolumn.
                </p>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-400 hover:bg-[#faf8f5]'
                }`}
              >
                <FileText className={`w-12 h-12 mb-4 ${dragging ? 'text-blue-400' : 'text-slate-300'}`} />
                <p className="text-sm font-medium text-slate-700 mb-1">
                  {status === 'parsing' ? 'Läser fil...' : 'Dra och släpp CSV här'}
                </p>
                <p className="text-xs text-slate-400">eller klicka för att välja fil (.csv)</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>

              {parseError && (
                <div className="mt-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {parseError}
                </div>
              )}
            </div>

            {/* Format guide */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">CSV-format</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Obligatoriska kolumner</p>
                  <table className="w-full text-xs text-slate-600">
                    <tbody>
                      <tr><td className="py-1 font-mono pr-4 text-slate-800">marke</td><td>Volvo, BMW, Tesla …</td></tr>
                      <tr><td className="py-1 font-mono pr-4 text-slate-800">modell</td><td>XC60, X5, Model 3 …</td></tr>
                    </tbody>
                  </table>

                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4 mb-2">Priskolumner (valfria)</p>
                  <table className="w-full text-xs text-slate-600">
                    <tbody>
                      <tr><td className="py-1 font-mono pr-3 text-slate-800">Pris_SEK</td><td>Nypris – stöder spann: <code className="bg-slate-100 px-0.5 rounded">274 300 – 306 300</code> och text: <code className="bg-slate-100 px-0.5 rounded">från ~460 000</code></td></tr>
                      <tr><td className="py-1 font-mono pr-3 text-slate-800">pris_ny_fran</td><td>Nypris från (kr)</td></tr>
                      <tr><td className="py-1 font-mono pr-3 text-slate-800">pris_ny_till</td><td>Nypris till (kr)</td></tr>
                      <tr><td className="py-1 font-mono pr-3 text-slate-800">pris_begagnat</td><td>Typiskt begpris (kr)</td></tr>
                      <tr><td className="py-1 font-mono pr-3 text-slate-800">manadskostnad_ny</td><td>Mån.kostnad ny (kr)</td></tr>
                      <tr><td className="py-1 font-mono pr-3 text-slate-800">manadskostnad_begagnad</td><td>Mån.kostnad beg. (kr)</td></tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Drivlina & bränsle (valfria)</p>
                  <table className="w-full text-xs text-slate-600">
                    <tbody>
                      <tr><td className="py-1 font-mono pr-4 text-slate-800">drivlina</td><td>Fyrhjulsdrift; Framhjulsdrift …</td></tr>
                      <tr><td className="py-1 font-mono pr-4 text-slate-800">drivmedel</td><td>Bensin, Diesel, El, Laddhybrid …</td></tr>
                    </tbody>
                  </table>
                  <div className="mt-3 bg-[#faf8f5] rounded-lg p-3 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">Bränsle separeras med komma eller semikolon:</p>
                    <pre className="text-[11px] text-slate-500 whitespace-pre-wrap">{`"Bensin, Diesel, Laddhybrid"
"Bensin; Mildhybrid bensin; Laddhybrid"`}</pre>
                  </div>
                  <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <p className="text-[11px] text-amber-700 font-medium mb-1">Viktigt: enbart angivna kolumner ändras</p>
                    <p className="text-[11px] text-amber-600">Bilder, texter, betyg och övriga fält rörs inte alls av denna import.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {status === 'previewing' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {rows.length} bilar hittade i filen
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Granska listan och klicka på "Starta uppdatering" när du är redo.
                    {rows.some(r => r.uppskattad) && (
                      <span className="ml-2 text-amber-600">~ = uppskattade priser</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="h-9 px-4 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-[#faf8f5] transition"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={runImport}
                    className="h-9 px-5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-700 transition flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Starta uppdatering
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[500px] rounded-lg border border-slate-100">
                <table className="w-full text-xs">
                  <thead className="bg-[#faf8f5] sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">Märke</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">Modell</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">Nypris fr.</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">Nypris till</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">Beg.pris</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">Mån/ny</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">Mån/beg</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">Drivlina</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">Bränsle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#faf8f5]/50'}>
                        <td className="px-3 py-1.5 text-slate-800 font-medium">{row.make}</td>
                        <td className="px-3 py-1.5 text-slate-700">{row.model}</td>
                        <td className={`px-3 py-1.5 font-medium ${row.pris_ny_fran ? 'text-slate-800' : 'text-slate-300'}`}>
                          {row.uppskattad && row.pris_ny_fran ? '~' : ''}{fmtK(row.pris_ny_fran)}
                        </td>
                        <td className={`px-3 py-1.5 ${row.pris_ny_till ? 'text-slate-600' : 'text-slate-300'}`}>
                          {row.uppskattad && row.pris_ny_till ? '~' : ''}{fmtK(row.pris_ny_till)}
                        </td>
                        <td className={`px-3 py-1.5 font-medium ${row.pris_begagnat ? 'text-slate-800' : 'text-slate-300'}`}>
                          {fmtK(row.pris_begagnat)}
                        </td>
                        <td className={`px-3 py-1.5 font-medium ${row.manadskostnad_ny ? 'text-slate-800' : 'text-slate-300'}`}>
                          {fmtK(row.manadskostnad_ny)}
                        </td>
                        <td className={`px-3 py-1.5 font-medium ${row.manadskostnad_begagnad ? 'text-slate-800' : 'text-slate-300'}`}>
                          {fmtK(row.manadskostnad_begagnad)}
                        </td>
                        <td className="px-3 py-1.5 text-slate-500 max-w-[140px] truncate" title={row.drivlina ?? undefined}>
                          {row.drivlina ?? '–'}
                        </td>
                        <td className="px-3 py-1.5 max-w-[180px] truncate" title={row.drivmedel ?? undefined}>
                          {row.fuel_types ? (
                            <span className="text-emerald-700 font-medium">{row.fuel_types.join(', ')}</span>
                          ) : (
                            <span className="text-slate-300">–</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <details className="mt-3">
                <summary className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 select-none">
                  Visa rådata för rad 1 (felsök)
                </summary>
                <pre className="mt-2 text-[10px] bg-[#faf8f5] border border-slate-100 rounded p-3 overflow-x-auto text-slate-500 max-h-48">
                  {JSON.stringify(rows[0], null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        {/* Importing */}
        {status === 'importing' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
            <RefreshCw className="w-10 h-10 text-slate-400 animate-spin mx-auto mb-4" />
            <h2 className="text-base font-semibold text-slate-900 mb-2">Uppdaterar katalogen…</h2>
            <p className="text-sm text-slate-500 mb-6">{progress}% klart</p>
            <div className="w-full bg-slate-100 rounded-full h-2 max-w-sm mx-auto">
              <div
                className="bg-slate-800 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Done */}
        {status === 'done' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-slate-900">Uppdatering klar</h2>
                <button
                  onClick={reset}
                  className="h-9 px-4 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-[#faf8f5] transition flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Ladda upp ny fil
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{updated}</p>
                  <p className="text-xs text-green-600">Uppdaterade</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
                  <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-amber-700">{notFound}</p>
                  <p className="text-xs text-amber-600">Hittades ej</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center">
                  <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-700">{errors}</p>
                  <p className="text-xs text-red-600">Fel</p>
                </div>
              </div>

              {(notFound > 0 || errors > 0) && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Bilar som inte uppdaterades
                  </p>
                  <div className="rounded-lg border border-slate-100 overflow-auto max-h-64">
                    <table className="w-full text-xs">
                      <thead className="bg-[#faf8f5] sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-slate-600">Märke</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-600">Modell</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-600">Status</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-600">Detalj</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results
                          .filter(r => r.status !== 'updated')
                          .map((r, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#faf8f5]/50'}>
                              <td className="px-3 py-1.5 text-slate-800">{r.make}</td>
                              <td className="px-3 py-1.5 text-slate-700">{r.model}</td>
                              <td className="px-3 py-1.5">
                                {r.status === 'not_found'
                                  ? <span className="text-amber-600 font-medium">Hittades ej</span>
                                  : <span className="text-red-600 font-medium">Fel</span>}
                              </td>
                              <td className="px-3 py-1.5 text-slate-400 font-mono">
                                {r.error ?? 'Ingen matchande rad i katalogen'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
