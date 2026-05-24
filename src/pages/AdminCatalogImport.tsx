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

  const ctaRaw = c.cta;
  const ctaParsed =
    ctaRaw && typeof ctaRaw === 'object' && !Array.isArray(ctaRaw)
      ? (ctaRaw as Record<string, unknown>)
      : null;

  const persona = (c.persona ?? {}) as Record<string, unknown>;

  // begagnat_typisk (bilar_latt) or begagnat_fran (enriched)
  const prisBegagnat = numOrNull(pris.begagnat_typisk ?? pris.begagnat_fran);

  return {
    make,
    model,
    slug: (c.slug as string) ?? null,
    // Pris — svenska kolumnnamn
    pris_ny_fran: numOrNull(pris.ny_fran),
    pris_ny_till: numOrNull(pris.ny_till),
    pris_begagnat: prisBegagnat,
    pris_begagnat_spann_min: numOrNull(pris.begagnat_spann_min ?? begSpann[0]),
    pris_begagnat_spann_max: numOrNull(pris.begagnat_spann_max ?? begSpann[1]),
    pris_billigast: numOrNull(pris.billigast),
    pris_rekommenderat: (pris.rekommenderat as string) ?? null,
    // Manadskostnad — svenska kolumnnamn
    manadskostnad_ny: numOrNull(mk.ny),
    manadskostnad_ny_min: numOrNull(nySpann[0]),
    manadskostnad_ny_max: numOrNull(nySpann[1]),
    manadskostnad_begagnad: numOrNull(mk.begagnad),
    manadskostnad_beg_min: numOrNull(begSpann[0]),
    manadskostnad_beg_max: numOrNull(begSpann[1]),
    // Specifikationer — svenska kolumnnamn (råvärden från JSON, ej normaliserade)
    kaross: karossRaw ?? null,
    drivmedel: drivmedelsRaw ?? null,
    drivlina: (spec.drivlina as string) ?? null,
    drivlina_kort: (spec.drivlina_kort as string) ?? null,
    bagage_liter: numOrNull(spec.bagageutrymme_liter),
    // Betyg — svenska kolumnnamn
    betyg_skala: (c.betyg_skala as string) ?? null,
    betyg_totalt: betygTotalt,
    betyg_korning: numOrNull(betyg.korning),
    betyg_komfort: numOrNull(betyg.komfort),
    betyg_praktiskt: numOrNull(betyg.praktiskt),
    betyg_varde: numOrNull(betyg.varde),
    // Vardeminskning — svenska kolumnnamn
    vardeminskning_betyg: (dep.betyg as string) ?? null,
    vardeminskning_text: (dep.beskrivning as string) ?? null,
    // Generation — svenska kolumnnamn
    generation_namn: (gen.namn ?? c.generation_namn) as string | null ?? null,
    generation_fran_ar: numOrNull(gen.fran_ar ?? c.generation_fran_ar),
    generation_till_ar: numOrNull(gen.till_ar ?? c.generation_till_ar),
    // Listor — svenska kolumnnamn (jsonb)
    passar_for: arrayOrNull(c.passar_for),
    styrkor: arrayOrNull(c.styrkor),
    svagheter: arrayOrNull(c.svagheter),
    cta_sv: ctaParsed,
    // Text/persona — svenska kolumnnamn
    expert_text: expertText ?? null,
    meta_description: (c.meta_description as string) ?? null,
    persona_familjetest: (persona.familjetest ?? c.persona_familjetest) as string | null ?? null,
    persona_kordynamik: (persona.kordynamik ?? c.persona_kordynamik) as string | null ?? null,
    // Befintliga engelska kolumner — uppdateras parallellt för bakåtkompatibilitet
    body_type: karossRaw ? (KAROSS_MAP[karossRaw] ?? 'hatchback') : null,
    fuel_types: drivmedelsRaw ? (DRIVMEDEL_MAP[drivmedelsRaw] ?? ['bensin']) : null,
    rating_overall: betygTotalt,
    price_used_from: prisBegagnat,
    monthly_cost_new: numOrNull(mk.ny),
    monthly_cost_used: numOrNull(mk.begagnad),
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
    const resultList: ImportResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

      const fields: (keyof CarRow)[] = [
        'slug',
        // Svenska pris-kolumner
        'pris_ny_fran', 'pris_ny_till', 'pris_begagnat',
        'pris_begagnat_spann_min', 'pris_begagnat_spann_max',
        'pris_billigast', 'pris_rekommenderat',
        // Svenska månadskostnad-kolumner
        'manadskostnad_ny', 'manadskostnad_ny_min', 'manadskostnad_ny_max',
        'manadskostnad_begagnad', 'manadskostnad_beg_min', 'manadskostnad_beg_max',
        // Svenska spec-kolumner
        'kaross', 'drivmedel', 'drivlina', 'drivlina_kort', 'bagage_liter',
        // Svenska betyg-kolumner
        'betyg_skala', 'betyg_totalt', 'betyg_korning', 'betyg_komfort', 'betyg_praktiskt', 'betyg_varde',
        // Svenska värdeminskning-kolumner
        'vardeminskning_betyg', 'vardeminskning_text',
        // Svenska generation-kolumner
        'generation_namn', 'generation_fran_ar', 'generation_till_ar',
        // Listor
        'passar_for', 'styrkor', 'svagheter', 'cta_sv',
        // Text/persona
        'expert_text', 'meta_description', 'persona_familjetest', 'persona_kordynamik',
        // Befintliga engelska kolumner (bakåtkompatibilitet)
        'body_type', 'fuel_types', 'rating_overall', 'price_used_from',
        'monthly_cost_new', 'monthly_cost_used',
      ];

      for (const f of fields) {
        if (row[f] !== undefined) payload[f] = row[f];
      }

      const { error, count } = await supabase
        .from('car_catalog')
        .update(payload)
        .eq('make', row.make)
        .eq('model', row.model)
        .select('id', { count: 'exact', head: true });

      if (error) {
        resultList.push({ make: row.make, model: row.model, status: 'error', error: error.message });
      } else if ((count ?? 0) === 0) {
        resultList.push({ make: row.make, model: row.model, status: 'not_found' });
      } else {
        resultList.push({ make: row.make, model: row.model, status: 'updated' });
      }

      setProgress(Math.round(((i + 1) / rows.length) * 100));
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
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Mån.kost beg.</th>
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
                        <td className="px-3 py-1.5 text-slate-500">
                          {row.pris_begagnat ? `${(row.pris_begagnat / 1000).toFixed(0)}k` : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-500">
                          {row.manadskostnad_begagnad ? `${(row.manadskostnad_begagnad / 1000).toFixed(1)}k` : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-400 font-mono">{row.slug ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
