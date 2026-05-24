import { useCallback, useRef, useState } from 'react';
import { ArrowLeft, Upload, CheckCircle, XCircle, AlertCircle, FileJson, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onBack: () => void;
}

type Status = 'idle' | 'parsing' | 'previewing' | 'importing' | 'done';

interface CarRow {
  // Identitet
  make: string;
  model: string;
  slug: string | null;
  // Pris
  pris_ny_fran: number | null;
  pris_ny_till: number | null;
  pris_begagnat: number | null;
  pris_begagnat_spann_min: number | null;
  pris_begagnat_spann_max: number | null;
  pris_billigast: number | null;
  pris_rekommenderat: string | null;
  // Manadskostnad
  manadskostnad_ny: number | null;
  manadskostnad_ny_min: number | null;
  manadskostnad_ny_max: number | null;
  manadskostnad_begagnad: number | null;
  manadskostnad_beg_min: number | null;
  manadskostnad_beg_max: number | null;
  // Specifikationer
  kaross: string | null;
  drivmedel: string | null;
  drivlina: string | null;
  drivlina_kort: string | null;
  bagage_liter: number | null;
  // Betyg
  betyg_skala: string | null;
  betyg_totalt: number | null;
  betyg_korning: number | null;
  betyg_komfort: number | null;
  betyg_praktiskt: number | null;
  betyg_varde: number | null;
  // Vardeminskning
  vardeminskning_betyg: string | null;
  vardeminskning_text: string | null;
  // Generation
  generation_namn: string | null;
  generation_fran_ar: number | null;
  generation_till_ar: number | null;
  // Listor
  passar_for: string[] | null;
  styrkor: string[] | null;
  svagheter: string[] | null;
  cta_sv: Record<string, unknown> | null;
  // Text/persona
  expert_text: string | null;
  meta_description: string | null;
  persona_familjetest: string | null;
  persona_kordynamik: string | null;
  // Engelska kolumner som redan finns i tabellen — uppdateras parallellt
  body_type: string | null;
  fuel_types: string[] | null;
  rating_overall: number | null;
  price_used_from: number | null;
  monthly_cost_new: number | null;
  monthly_cost_used: number | null;
}

interface ImportResult {
  make: string;
  model: string;
  status: 'updated' | 'not_found' | 'error';
  error?: string;
}

const KAROSS_MAP: Record<string, string> = {
  'SUV': 'suv',
  'Sedan': 'sedan',
  'Halvkombi': 'hatchback',
  'Halvkombi/Sedan': 'hatchback',
  'Sedan/Kombi': 'kombi',
  'Kombi': 'kombi',
  'Coupé': 'coupe',
  'Coupé/Cab': 'cab',
  'Pickup': 'pickup',
  'Skåp/MPV': 'mpv',
};

const DRIVMEDEL_MAP: Record<string, string[]> = {
  'Bensin': ['bensin'],
  'Diesel': ['diesel'],
  'El': ['el'],
  'Bensin + el': ['bensin', 'laddhybrid'],
  'Diesel + el': ['diesel', 'laddhybrid'],
  'Hybrid': ['bensin', 'hybrid'],
  'Mildhybrid bensin': ['bensin', 'hybrid'],
  'Mildhybrid diesel': ['diesel', 'hybrid'],
};

function parseCarJson(raw: unknown): CarRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;

  const make = (c.marke ?? c.make) as string | undefined;
  const model = (c.modell ?? c.model) as string | undefined;
  if (!make || !model) return null;

  const spec = (c.specifikationer ?? {}) as Record<string, unknown>;
  const pris = (c.pris ?? {}) as Record<string, unknown>;
  const mk = (c.manadskostnad ?? {}) as Record<string, unknown>;
  const betyg = (c.betyg ?? {}) as Record<string, unknown>;
  const dep = (c.vardeminskning_3ar ?? {}) as Record<string, unknown>;
  const expert = c.experternas_bedomning;

  // kaross/drivmedel: top-level in bilar_latt.json, nested under specifikationer in enriched format
  const karossRaw = (c.kaross ?? spec.kaross) as string | undefined;
  const drivmedelsRaw = (c.drivmedel ?? spec.drivmedel) as string | undefined;

  const nySpann = Array.isArray(mk.ny_spann) ? mk.ny_spann as number[] : [];
  const begSpann = Array.isArray(mk.begagnad_spann) ? mk.begagnad_spann as number[] : [];

  const expertText =
    expert && typeof expert === 'object'
      ? (expert as Record<string, unknown>).text as string | null
      : typeof expert === 'string'
      ? expert
      : null;

  // betyg_totalt: top-level (bilar_latt) or nested betyg.totalt (enriched)
  const betygTotalt = c.betyg_totalt !== undefined ? numOrNull(c.betyg_totalt) : numOrNull(betyg.totalt);

  const gen = (c.generation ?? {}) as Record<string, unknown>;

  // Begagnatpris: toppnivå (berikad JSON) | nästlat under pris
  const prisBegagnat = numOrNull(
    c.pris_begagnat ??
    pris.begagnat_typisk ??
    pris.begagnat_fran ??
    pris.begagnad_fran ??
    pris.used_from ??
    pris.begagnat
  );

  // Månadskostnad begagnad: toppnivå (berikad JSON) | nästlat under manadskostnad
  const manKostBeg = numOrNull(
    c.manadskostnad_begagnad ??
    mk.begagnad ??
    mk.begagnad_typisk ??
    mk.used ??
    mk.beg
  );

  const manKostNy = numOrNull(c.manadskostnad_ny ?? mk.ny);

  const prisNyFran = numOrNull(c.pris_ny_fran ?? pris.ny_fran);
  const prisNyTill = numOrNull(c.pris_ny_till ?? pris.ny_till);

  // cta: kan vara array eller objekt — spara som jsonb
  const ctaRawTop = c.cta;
  const ctaParsed =
    ctaRawTop !== null && ctaRawTop !== undefined &&
    typeof ctaRawTop === 'object'
      ? (ctaRawTop as Record<string, unknown> | unknown[])
      : null;

  // persona: berikad JSON har "persona_insikt" med familjetest/kordynamik
  const personaInsikt = (c.persona_insikt ?? c.persona ?? {}) as Record<string, unknown>;
  const personaFamilj = (c.persona_familjetest ?? personaInsikt.familjetest ?? null) as string | null;
  const personaKor = (c.persona_kordynamik ?? personaInsikt.kordynamik ?? null) as string | null;

  // begagnat_spann: array [min, max] nästlat under pris
  const begSpannPris = Array.isArray(pris.begagnat_spann) ? pris.begagnat_spann as number[] : [];

  return {
    make,
    model,
    slug: (c.slug as string) ?? null,
    // Pris: toppnivå i berikad JSON (c.pris_*) | nästlat under pris-objekt
    pris_ny_fran: prisNyFran,
    pris_ny_till: prisNyTill,
    pris_begagnat: prisBegagnat,
    pris_begagnat_spann_min: numOrNull(c.pris_begagnat_spann_min ?? pris.begagnat_spann_min ?? begSpannPris[0] ?? begSpann[0]),
    pris_begagnat_spann_max: numOrNull(c.pris_begagnat_spann_max ?? pris.begagnat_spann_max ?? begSpannPris[1] ?? begSpann[1]),
    pris_billigast: numOrNull(
      c.pris_billigast ??
      (pris.begagnat_billigast && typeof pris.begagnat_billigast === 'object'
        ? (pris.begagnat_billigast as Record<string, unknown>).pris
        : null) ??
      pris.billigast
    ),
    pris_rekommenderat: (c.pris_rekommenderat ?? pris.rekommenderat) as string | null ?? null,
    // Manadskostnad: toppnivå (c.manadskostnad_*) | nästlat under manadskostnad-objekt
    manadskostnad_ny: manKostNy,
    manadskostnad_ny_min: numOrNull(c.manadskostnad_ny_min ?? nySpann[0]),
    manadskostnad_ny_max: numOrNull(c.manadskostnad_ny_max ?? nySpann[1]),
    manadskostnad_begagnad: manKostBeg,
    manadskostnad_beg_min: numOrNull(c.manadskostnad_beg_min ?? (Array.isArray(mk.begagnad_spann) ? (mk.begagnad_spann as number[])[0] : null) ?? begSpann[0]),
    manadskostnad_beg_max: numOrNull(c.manadskostnad_beg_max ?? (Array.isArray(mk.begagnad_spann) ? (mk.begagnad_spann as number[])[1] : null) ?? begSpann[1]),
    // Specifikationer: toppnivå (berikad) | nästlat under specifikationer
    kaross: (c.kaross ?? spec.kaross) as string | null ?? null,
    drivmedel: (c.drivmedel ?? spec.drivmedel) as string | null ?? null,
    drivlina: (c.drivlina ?? spec.drivlina) as string | null ?? null,
    drivlina_kort: (c.drivlina_kort ?? spec.drivlina_kort) as string | null ?? null,
    bagage_liter: numOrNull(c.bagage_liter ?? spec.bagageutrymme_liter),
    // Betyg: toppnivå (berikad) | nästlat under betyg
    betyg_skala: String(c.betyg_skala ?? betyg.skala ?? '') || null,
    betyg_totalt: betygTotalt,
    betyg_korning: numOrNull(c.betyg_korning ?? betyg.korning),
    betyg_komfort: numOrNull(c.betyg_komfort ?? betyg.komfort),
    betyg_praktiskt: numOrNull(c.betyg_praktiskt ?? betyg.praktiskt),
    betyg_varde: numOrNull(c.betyg_varde ?? betyg.varde),
    // Vardeminskning
    vardeminskning_betyg: (c.vardeminskning_betyg ?? dep.betyg) as string | null ?? null,
    vardeminskning_text: (c.vardeminskning_text ?? dep.beskrivning) as string | null ?? null,
    // Generation: toppnivå (berikad) | nästlat under generation
    generation_namn: (c.generation_namn ?? gen.namn) as string | null ?? null,
    generation_fran_ar: numOrNull(c.generation_fran_ar ?? gen.fran_ar),
    generation_till_ar: numOrNull(c.generation_till_ar ?? gen.till_ar),
    // Listor
    passar_for: arrayOrNull(c.passar_for),
    styrkor: arrayOrNull(c.styrkor),
    svagheter: arrayOrNull(c.svagheter),
    cta_sv: ctaParsed as Record<string, unknown> | null,
    // Text/persona
    expert_text: (c.expert_text ?? expertText) as string | null ?? null,
    meta_description: (c.meta_description) as string | null ?? null,
    persona_familjetest: personaFamilj,
    persona_kordynamik: personaKor,
    // Befintliga engelska kolumner — uppdateras parallellt för bakåtkompatibilitet
    body_type: karossRaw ? (KAROSS_MAP[karossRaw] ?? karossRaw) : null,
    fuel_types: drivmedelsRaw ? (DRIVMEDEL_MAP[drivmedelsRaw] ?? [drivmedelsRaw.toLowerCase()]) : null,
    rating_overall: betygTotalt,
    price_used_from: prisBegagnat,
    monthly_cost_new: manKostNy,
    monthly_cost_used: manKostBeg,
  };
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function arrayOrNull(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.length === 0) return null;
  return v.map(String);
}

export default function AdminCatalogImport({ onBack }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [rows, setRows] = useState<CarRow[]>([]);
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
        const json = JSON.parse(e.target?.result as string);
        const arr = Array.isArray(json) ? json : [json];
        const parsed = arr.map(parseCarJson).filter(Boolean) as CarRow[];
        if (parsed.length === 0) {
          setParseError('Ingen giltig bildata hittades i filen.');
          setStatus('idle');
          return;
        }
        setRows(parsed);
        setStatus('previewing');
      } catch {
        setParseError('Kunde inte läsa JSON-filen. Kontrollera att formatet är korrekt.');
        setStatus('idle');
      }
    };
    reader.readAsText(file);
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

    // Get current admin session token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setResults([{ make: '—', model: '—', status: 'error', error: 'Inte inloggad som admin. Logga in och försök igen.' }]);
      setStatus('done');
      return;
    }

    // Build payload rows — strip null values to keep request lean
    const FIELDS: (keyof CarRow)[] = [
      'slug',
      'pris_ny_fran', 'pris_ny_till', 'pris_begagnat',
      'pris_begagnat_spann_min', 'pris_begagnat_spann_max',
      'pris_billigast', 'pris_rekommenderat',
      'manadskostnad_ny', 'manadskostnad_ny_min', 'manadskostnad_ny_max',
      'manadskostnad_begagnad', 'manadskostnad_beg_min', 'manadskostnad_beg_max',
      'kaross', 'drivmedel', 'drivlina', 'drivlina_kort', 'bagage_liter',
      'betyg_skala', 'betyg_totalt', 'betyg_korning', 'betyg_komfort', 'betyg_praktiskt', 'betyg_varde',
      'vardeminskning_betyg', 'vardeminskning_text',
      'generation_namn', 'generation_fran_ar', 'generation_till_ar',
      'passar_for', 'styrkor', 'svagheter', 'cta_sv',
      'expert_text', 'meta_description', 'persona_familjetest', 'persona_kordynamik',
      'body_type', 'fuel_types', 'rating_overall', 'price_used_from',
      'monthly_cost_new', 'monthly_cost_used',
    ];

    // Send in batches of 50 to avoid huge payloads
    const BATCH = 50;
    const resultList: ImportResult[] = [];
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/catalog-import`;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH).map(row => {
        const payload: Record<string, unknown> = { make: row.make, model: row.model };
        for (const f of FIELDS) {
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
          // Mark whole batch as error
          for (const r of batch) {
            resultList.push({ make: String(r.make), model: String(r.model), status: 'error', error: text });
          }
        } else {
          const { results } = await res.json() as { results: ImportResult[] };
          resultList.push(...results);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </button>
          <span className="text-slate-300">/</span>
          <h1 className="text-lg font-semibold text-slate-900">Importera bilkatalog via JSON</h1>
        </div>

        {/* Idle / drop zone */}
        {(status === 'idle' || status === 'parsing') && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Ladda upp JSON-fil</h2>
              <p className="text-sm text-slate-500">
                Filen ska innehålla en array av bilobjekt i formatet från <code className="bg-slate-100 px-1 rounded text-xs">bilar_berikad.json</code>.
                Varje bil matchas mot katalogen på <strong>make + model</strong> och uppdateras med ny data.
              </p>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <FileJson className={`w-12 h-12 mb-4 ${dragging ? 'text-blue-400' : 'text-slate-300'}`} />
              <p className="text-sm font-medium text-slate-700 mb-1">
                {status === 'parsing' ? 'Läser fil...' : 'Dra och släpp JSON-fil här'}
              </p>
              <p className="text-xs text-slate-400">eller klicka för att välja fil</p>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
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

            {/* Format guide */}
            <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Förväntat format</p>
              <pre className="text-xs text-slate-500 overflow-x-auto whitespace-pre-wrap">{`[
  {
    "marke": "Volvo",
    "modell": "XC60",
    "slug": "volvo-xc60",
    "pris": { "begagnat_fran": 320000, "ny_fran": 550000, ... },
    "manadskostnad": { "ny": 12000, "ny_spann": [10000, 13000], ... },
    "specifikationer": { "kaross": "SUV", "drivmedel": "El", ... },
    "betyg": { "totalt": 4.2, "korning": 4.0, ... },
    "vardeminskning_3ar": { "betyg": "B", "beskrivning": "..." },
    "styrkor": ["..."], "svagheter": ["..."], "passar_for": ["..."],
    "meta_description": "...",
    "experternas_bedomning": { "text": "..." }
  }
]`}</pre>
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
                    Granska listan nedan och klicka på "Starta import" när du är redo.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="h-9 px-4 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={runImport}
                    className="h-9 px-5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-700 transition flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Starta import
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-96 rounded-lg border border-slate-100">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Märke</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Modell</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Kaross</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Drivmedel</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Betyg</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Beg.pris</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Mån/beg</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Ny pris</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Mån/ny</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Slug</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-3 py-1.5 text-slate-800">{row.make}</td>
                        <td className="px-3 py-1.5 text-slate-700">{row.model}</td>
                        <td className="px-3 py-1.5 text-slate-500">{row.kaross ?? '—'}</td>
                        <td className="px-3 py-1.5 text-slate-500">{row.drivmedel ?? '—'}</td>
                        <td className="px-3 py-1.5 text-slate-500">{row.betyg_totalt ?? '—'}</td>
                        <td className={`px-3 py-1.5 font-medium ${row.pris_begagnat ? 'text-slate-800' : 'text-red-400'}`}>
                          {row.pris_begagnat ? `${(row.pris_begagnat / 1000).toFixed(0)}k` : '—'}
                        </td>
                        <td className={`px-3 py-1.5 font-medium ${row.manadskostnad_begagnad ? 'text-slate-800' : 'text-red-400'}`}>
                          {row.manadskostnad_begagnad ? `${(row.manadskostnad_begagnad / 1000).toFixed(1)}k` : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-500">
                          {row.pris_ny_fran ? `${(row.pris_ny_fran / 1000).toFixed(0)}k` : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-500">
                          {row.manadskostnad_ny ? `${(row.manadskostnad_ny / 1000).toFixed(1)}k` : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-400 font-mono">{row.slug ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Debug: first row raw pris/manadskostnad keys */}
              {rows.length > 0 && (
                <details className="mt-3">
                  <summary className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600">
                    Visa rådata (rad 1) — felsök om priser saknas
                  </summary>
                  <pre className="mt-2 text-[10px] bg-slate-50 border border-slate-100 rounded p-3 overflow-x-auto text-slate-500 max-h-48">
                    {JSON.stringify(rows[0], null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Importing */}
        {status === 'importing' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
            <RefreshCw className="w-10 h-10 text-slate-400 animate-spin mx-auto mb-4" />
            <h2 className="text-base font-semibold text-slate-900 mb-2">Importerar...</h2>
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
                <h2 className="text-base font-semibold text-slate-900">Import klar</h2>
                <button
                  onClick={reset}
                  className="h-9 px-4 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Importera ny fil
                </button>
              </div>

              {/* Summary */}
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

              {/* Result list */}
              {(notFound > 0 || errors > 0) && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Bilar som inte uppdaterades
                  </p>
                  <div className="rounded-lg border border-slate-100 overflow-auto max-h-64">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
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
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="px-3 py-1.5 text-slate-800">{r.make}</td>
                              <td className="px-3 py-1.5 text-slate-700">{r.model}</td>
                              <td className="px-3 py-1.5">
                                {r.status === 'not_found' ? (
                                  <span className="text-amber-600 font-medium">Hittades ej</span>
                                ) : (
                                  <span className="text-red-600 font-medium">Fel</span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-slate-400 font-mono">{r.error ?? 'Ingen matchande rad i katalogen'}</td>
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
