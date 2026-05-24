import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  Car,
  Check,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pencil,
  X,
  Save,
  SlidersHorizontal,
  Zap,
  Fuel,
  Star,
  Upload,
  FileUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminCarCatalogProps {
  onBack: () => void;
  onImport?: () => void;
}

interface CatalogEntry {
  id: string;
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url: string | null;
  fuel_types: string[] | null;
  body_type: string | null;
  segment: string | null;
  rating_overall: number | null;
  expert_comment: string | null;
  seats: number | null;
  is_active: boolean;
  updated_at: string | null;
}

type SortKey = 'make' | 'enriched' | 'active';

interface CsvRow {
  make: string;
  model: string;
  bagage_liter?: number;
  drivetrain_options?: string;
}

interface CsvResult {
  updated: number;
  skipped: number;
  errors: string[];
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
    const out: CsvRow = { make: row['make'] ?? '', model: row['model'] ?? '' };
    if (row['bagage_liter']) {
      const n = parseInt(row['bagage_liter']);
      if (!isNaN(n)) out.bagage_liter = n;
    }
    if (row['drivetrain_options']) out.drivetrain_options = row['drivetrain_options'];
    return out;
  }).filter(r => r.make && r.model);
}

const FUEL_OPTIONS = [
  { value: 'bensin', label: 'Bensin' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'laddhybrid', label: 'Laddhybrid' },
  { value: 'el', label: 'El' },
];

const BODY_OPTIONS = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'kombi', label: 'Kombi' },
  { value: 'suv', label: 'SUV' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'coupe', label: 'Coupé' },
  { value: 'cab', label: 'Cab/Cabriolet' },
  { value: 'mpv', label: 'MPV/Van' },
  { value: 'pickup', label: 'Pickup' },
];

const SEGMENT_OPTIONS = [
  { value: 'budget', label: 'Budget' },
  { value: 'compact', label: 'Kompakt' },
  { value: 'midsize', label: 'Mellanklass' },
  { value: 'fullsize', label: 'Stor' },
  { value: 'premium', label: 'Premium' },
  { value: 'luxury', label: 'Lyx' },
  { value: 'sports', label: 'Sport' },
];

const FUEL_COLORS: Record<string, string> = {
  bensin: 'bg-orange-100 text-orange-700',
  diesel: 'bg-slate-100 text-slate-600',
  hybrid: 'bg-teal-100 text-teal-700',
  laddhybrid: 'bg-blue-100 text-blue-700',
  el: 'bg-emerald-100 text-emerald-700',
};

const FUEL_LABELS: Record<string, string> = {
  bensin: 'Bensin',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
  laddhybrid: 'Laddhybrid',
  el: 'El',
};

function isEnriched(entry: CatalogEntry): boolean {
  return !!(entry.fuel_types?.length || entry.body_type || entry.rating_overall != null);
}

// Check if two entries might be duplicates (same make, similar model name)
function isPossibleDuplicate(a: CatalogEntry, b: CatalogEntry): boolean {
  if (a.make !== b.make) return false;
  const normalise = (s: string) =>
    s.toLowerCase().replace(/[-\s]/g, '').replace(/serie$/, '');
  return normalise(a.model) === normalise(b.model);
}

interface EditState {
  fuel_types: string[];
  body_type: string;
  segment: string;
  rating_overall: string;
  expert_comment: string;
  seats: string;
  image_url: string;
}

function emptyEdit(entry: CatalogEntry): EditState {
  return {
    fuel_types: entry.fuel_types ?? [],
    body_type: entry.body_type ?? '',
    segment: entry.segment ?? '',
    rating_overall: entry.rating_overall != null ? String(entry.rating_overall) : '',
    expert_comment: entry.expert_comment ?? '',
    seats: entry.seats != null ? String(entry.seats) : '',
    image_url: entry.cleaned_image_url ?? entry.image_url ?? '',
  };
}

const inputCls =
  'w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/10 transition placeholder:text-slate-400';

export default function AdminCarCatalog({ onBack, onImport }: AdminCarCatalogProps) {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMake, setFilterMake] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enriched' | 'missing'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('make');
  const [sortAsc, setSortAsc] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<CsvResult | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('car_catalog')
      .select('id, make, model, image_url, cleaned_image_url, fuel_types, body_type, segment, rating_overall, expert_comment, seats, is_active, updated_at')
      .order('make', { ascending: true })
      .order('model', { ascending: true });
    setEntries((data as CatalogEntry[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const makes = useMemo(() => {
    const set = new Set(entries.map(e => e.make));
    return ['', ...Array.from(set).sort()];
  }, [entries]);

  const duplicateIds = useMemo(() => {
    const dupes = new Set<string>();
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        if (isPossibleDuplicate(entries[i], entries[j])) {
          dupes.add(entries[i].id);
          dupes.add(entries[j].id);
        }
      }
    }
    return dupes;
  }, [entries]);

  const filtered = useMemo(() => {
    let list = [...entries];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(e => `${e.make} ${e.model}`.toLowerCase().includes(q));
    if (filterMake) list = list.filter(e => e.make === filterMake);
    if (filterStatus === 'enriched') list = list.filter(isEnriched);
    if (filterStatus === 'missing') list = list.filter(e => !isEnriched(e));

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'make') cmp = `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`, 'sv');
      else if (sortBy === 'enriched') cmp = (isEnriched(b) ? 1 : 0) - (isEnriched(a) ? 1 : 0);
      else if (sortBy === 'active') cmp = (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [entries, search, filterMake, filterStatus, sortBy, sortAsc]);

  const stats = useMemo(() => ({
    total: entries.length,
    enriched: entries.filter(isEnriched).length,
    missing: entries.filter(e => !isEnriched(e)).length,
    inactive: entries.filter(e => !e.is_active).length,
    duplicates: duplicateIds.size,
  }), [entries, duplicateIds]);

  const openEdit = (entry: CatalogEntry) => {
    setEditId(entry.id);
    setEditState(emptyEdit(entry));
  };

  const closeEdit = () => {
    setEditId(null);
    setEditState(null);
  };

  const toggleFuel = (fuel: string) => {
    if (!editState) return;
    const cur = editState.fuel_types;
    setEditState({
      ...editState,
      fuel_types: cur.includes(fuel) ? cur.filter(f => f !== fuel) : [...cur, fuel],
    });
  };

  const handleSave = async () => {
    if (!editId || !editState) return;
    setSaving(true);
    const payload = {
      fuel_types: editState.fuel_types.length > 0 ? editState.fuel_types : null,
      body_type: editState.body_type || null,
      segment: editState.segment || null,
      rating_overall: editState.rating_overall ? parseFloat(editState.rating_overall) : null,
      expert_comment: editState.expert_comment || null,
      seats: editState.seats ? parseInt(editState.seats) : null,
      cleaned_image_url: editState.image_url.trim() || null,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('car_catalog').update(payload).eq('id', editId);
    setEntries(prev => prev.map(e => e.id === editId ? { ...e, ...payload } : e));
    setSavedId(editId);
    setTimeout(() => setSavedId(null), 2000);
    setSaving(false);
    closeEdit();
  };

  const toggleActive = async (entry: CatalogEntry) => {
    const newVal = !entry.is_active;
    await supabase.from('car_catalog').update({ is_active: newVal }).eq('id', entry.id);
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, is_active: newVal } : e));
  };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(v => !v);
    else { setSortBy(key); setSortAsc(true); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortBy === k ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null;

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCsvUploading(true);
    setCsvResult(null);

    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      setCsvResult({ updated: 0, skipped: 0, errors: ['Inga rader hittades. Kontrollera CSV-format.'] });
      setCsvUploading(false);
      return;
    }

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (row.bagage_liter != null) payload.bagage_liter = row.bagage_liter;
      if (row.drivetrain_options) payload.drivetrain_options = row.drivetrain_options;

      if (Object.keys(payload).length <= 1) { skipped++; continue; }

      const { error, count } = await supabase
        .from('car_catalog')
        .update(payload)
        .eq('make', row.make)
        .eq('model', row.model)
        .select('id', { count: 'exact', head: true });

      if (error) {
        errors.push(`${row.make} ${row.model}: ${error.message}`);
      } else if (count === 0) {
        errors.push(`${row.make} ${row.model}: hittades ej i katalogen`);
        skipped++;
      } else {
        updated++;
      }
    }

    setCsvResult({ updated, skipped, errors });
    setCsvUploading(false);
    if (updated > 0) load();
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </button>
          <span className="text-slate-300 select-none">/</span>
          <span className="text-sm font-semibold text-slate-900">Bilkatalog</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs font-bold text-slate-500">{stats.total}</span>
          <div className="flex-1" />
          {/* CSV upload */}
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvUpload}
            className="hidden"
          />
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={csvUploading}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-[#0e6efe] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition disabled:opacity-50"
            title="Ladda upp CSV med kolumner: make,model,bagage_liter,drivetrain_options"
          >
            {csvUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
            Ladda upp CSV
          </button>
          {onImport && (
            <button
              onClick={onImport}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Importera JSON
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* CSV result banner */}
        {csvResult && (
          <div className={`mb-4 rounded-xl border px-4 py-3 flex items-start gap-3 ${
            csvResult.errors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
          }`}>
            {csvResult.errors.length === 0
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              : <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            }
            <div className="flex-1 text-sm">
              <p className={`font-semibold ${csvResult.errors.length === 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
                {csvResult.updated} bilar uppdaterade
                {csvResult.skipped > 0 && `, ${csvResult.skipped} hoppades över`}
              </p>
              {csvResult.errors.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-amber-700">
                  {csvResult.errors.slice(0, 10).map((e, i) => <li key={i}>• {e}</li>)}
                  {csvResult.errors.length > 10 && <li>...och {csvResult.errors.length - 10} till</li>}
                </ul>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Förväntat CSV-format: <code className="font-mono bg-white/60 px-1 rounded">make,model,bagage_liter,drivetrain_options</code>
              </p>
            </div>
            <button onClick={() => setCsvResult(null)} className="shrink-0 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Totalt', value: stats.total, color: 'text-slate-900' },
            { label: 'Enricherade', value: stats.enriched, color: 'text-emerald-600', sub: `${Math.round(stats.enriched / Math.max(1, stats.total) * 100)}%` },
            { label: 'Saknar data', value: stats.missing, color: stats.missing > 0 ? 'text-amber-600' : 'text-slate-400' },
            { label: 'Möjliga dubbletter', value: stats.duplicates, color: stats.duplicates > 0 ? 'text-rose-600' : 'text-slate-400' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-400 mb-0.5">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>
                {s.value}
                {s.sub && <span className="text-xs font-normal text-slate-400 ml-1">{s.sub}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sök märke eller modell…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/10 transition"
            />
          </div>
          <select value={filterMake} onChange={e => setFilterMake(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none">
            <option value="">Alla märken</option>
            {makes.filter(Boolean).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="flex gap-1">
            {(['all', 'enriched', 'missing'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`h-9 px-3 rounded-lg text-xs font-semibold transition ${filterStatus === f ? 'bg-[#0e6efe] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {f === 'all' ? 'Alla' : f === 'enriched' ? 'Enricherade' : 'Saknar data'}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <button onClick={() => toggleSort('make')} className="flex items-center gap-0.5 hover:text-slate-900 px-1.5 py-1 rounded">
              Namn <SortIcon k="make" />
            </button>
            <button onClick={() => toggleSort('enriched')} className="flex items-center gap-0.5 hover:text-slate-900 px-1.5 py-1 rounded">
              Status <SortIcon k="enriched" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left w-8"></th>
                  <th className="px-4 py-3 text-left">Bil</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Bränsle</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Kaross</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Betyg</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Kommentar</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Åtgärd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(entry => {
                  const isDupe = duplicateIds.has(entry.id);
                  const enriched = isEnriched(entry);
                  const isEditing = editId === entry.id;
                  const wasSaved = savedId === entry.id;
                  const img = entry.cleaned_image_url || entry.image_url;

                  return (
                    <React.Fragment key={entry.id}>
                    <tr
                      className={`transition-colors ${!entry.is_active ? 'opacity-50' : ''} ${isEditing ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
                    >
                      {/* Image thumb */}
                      <td className="px-4 py-3">
                        <div className="w-10 h-7 rounded overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                          {img ? (
                            <img src={img} alt={`${entry.make} ${entry.model}`} className="w-full h-full object-cover" />
                          ) : (
                            <Car className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                      </td>

                      {/* Make / model */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900">{entry.make} {entry.model}</span>
                          {isDupe && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                              <AlertTriangle className="w-2.5 h-2.5" /> Möjlig dubblett
                            </span>
                          )}
                          {!enriched && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                              Saknar data
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fuel */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {isEditing && editState ? (
                          <div className="flex flex-wrap gap-1">
                            {FUEL_OPTIONS.map(f => (
                              <button
                                key={f.value}
                                type="button"
                                onClick={() => toggleFuel(f.value)}
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition ${
                                  editState.fuel_types.includes(f.value)
                                    ? 'bg-[#0e6efe] text-white border-[#0e6efe]'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {entry.fuel_types?.map(f => (
                              <span key={f} className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${FUEL_COLORS[f] ?? 'bg-slate-100 text-slate-600'}`}>
                                {FUEL_LABELS[f] ?? f}
                              </span>
                            ))}
                            {!entry.fuel_types?.length && <span className="text-slate-300 text-xs">—</span>}
                          </div>
                        )}
                      </td>

                      {/* Body type */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        {isEditing && editState ? (
                          <select
                            value={editState.body_type}
                            onChange={e => setEditState({ ...editState, body_type: e.target.value })}
                            className="h-8 px-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#0e6efe]"
                          >
                            <option value="">Välj typ</option>
                            {BODY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <span className="text-xs text-slate-600 capitalize">{entry.body_type ?? <span className="text-slate-300">—</span>}</span>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {isEditing && editState ? (
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={editState.rating_overall}
                            onChange={e => setEditState({ ...editState, rating_overall: e.target.value })}
                            placeholder="t.ex. 7.5"
                            className="w-20 h-8 px-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#0e6efe]"
                          />
                        ) : (
                          <span className={`text-xs font-bold ${entry.rating_overall != null ? 'text-slate-900' : 'text-slate-300'}`}>
                            {entry.rating_overall != null ? `${entry.rating_overall}/10` : '—'}
                          </span>
                        )}
                      </td>

                      {/* Expert comment */}
                      <td className="px-4 py-3 hidden lg:table-cell max-w-[200px]">
                        {isEditing && editState ? (
                          <input
                            type="text"
                            value={editState.expert_comment}
                            onChange={e => setEditState({ ...editState, expert_comment: e.target.value })}
                            placeholder="Kort kommentar…"
                            className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#0e6efe]"
                          />
                        ) : (
                          <span className="text-xs text-slate-500 line-clamp-1">{entry.expert_comment ?? <span className="text-slate-300">—</span>}</span>
                        )}
                      </td>

                      {/* Active status */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive(entry)}
                          title={entry.is_active ? 'Klicka för att dölja' : 'Klicka för att visa'}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition ${
                            entry.is_active
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {entry.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {entry.is_active ? 'Aktiv' : 'Dold'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            {/* Seats inline */}
                            <input
                              type="number"
                              min="1"
                              max="9"
                              value={editState?.seats ?? ''}
                              onChange={e => editState && setEditState({ ...editState, seats: e.target.value })}
                              placeholder="Säten"
                              title="Antal säten"
                              className="w-16 h-8 px-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#0e6efe]"
                            />
                            {/* Segment inline */}
                            <select
                              value={editState?.segment ?? ''}
                              onChange={e => editState && setEditState({ ...editState, segment: e.target.value })}
                              className="h-8 px-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#0e6efe]"
                            >
                              <option value="">Segment</option>
                              {SEGMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-[#0e6efe] text-white text-xs font-semibold hover:bg-[#0b5cd8] transition disabled:opacity-50"
                            >
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              Spara
                            </button>
                            <button onClick={closeEdit} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                              <X className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openEdit(entry)}
                            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition ${
                              wasSaved
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-[#0e6efe] hover:text-[#0e6efe]'
                            }`}
                          >
                            {wasSaved ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                            {wasSaved ? 'Sparat' : 'Enrichera'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isEditing && editState && (
                      <tr className="bg-blue-50/40 border-b border-blue-100">
                        <td colSpan={8} className="px-4 pb-3 pt-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-7 rounded overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              {editState.image_url ? (
                                <img src={editState.image_url} alt="preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : (
                                <Car className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <input
                              type="url"
                              value={editState.image_url}
                              onChange={e => setEditState({ ...editState, image_url: e.target.value })}
                              placeholder="Bild-URL (https://…)"
                              className="flex-1 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/10 transition placeholder:text-slate-400"
                            />
                            {editState.image_url && (
                              <button
                                type="button"
                                onClick={() => setEditState({ ...editState, image_url: '' })}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition text-slate-400"
                                title="Rensa bild"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && !loading && (
              <div className="text-center py-12 text-slate-400 text-sm">Inga bilar matchar sökningen.</div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5" />
            Bränsle — välj en eller flera bränsltyper för bilen
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" />
            Betyg 0–10 visas som stjärnfält för kunden i söket
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Möjliga dubbletter = samma märke, liknande modellnamn — dölj den du vill ta bort
          </div>
        </div>
      </main>
    </div>
  );
}
