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
  Images,
  RefreshCw,
  TrendingUp,
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
  // CSV fields
  kaross: string | null;
  drivmedel: string | null;
  drivlina_kort: string | null;
  styrkor: string[] | null;
  svagheter: string[] | null;
  passar_for: string[] | null;
  expert_text: string | null;
  betyg_totalt: number | null;
  // Price fields
  price_new_from: number | null;
  price_new_to: number | null;
  price_used_min: number | null;
  price_used_max: number | null;
  price_verified: boolean;
  price_source: string | null;
}

type SortKey = 'make' | 'enriched' | 'active';

interface CsvRow {
  make: string;
  model: string;
  kaross?: string;
  drivmedel?: string;
  drivlina?: string;
  sittplatser?: number;
  styrkor?: string[];
  svagheter?: string[];
  passar_for?: string[];
  beskrivning?: string;
  bagage_liter?: number;
  drivetrain_options?: string;
}

interface CsvResult {
  updated: number;
  skipped: number;
  errors: string[];
}

function parseCsv(text: string): CsvRow[] {
  const clean = text.replace(/^\uFEFF/, '').trim();
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        result.push(cur.trim()); cur = '';
      } else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  };

  const rawHeaders = splitLine(lines[0]);
  const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase()
    .replace(/ä/g, 'a').replace(/å/g, 'a').replace(/ö/g, 'o')
    .replace(/\s+/g, '_'));

  const idx = (names: string[]) => {
    for (const n of names) { const i = headers.indexOf(n); if (i >= 0) return i; }
    return -1;
  };
  const get = (cols: string[], row: string[]) => {
    const i = idx(cols);
    return i >= 0 ? row[i]?.replace(/^["']|["']$/g, '').trim() ?? '' : '';
  };
  const list = (val: string) => val ? val.split(';').map(s => s.trim()).filter(Boolean) : [];

  return lines.slice(1).map(line => {
    const cols = splitLine(line);
    const make = get(['marke', 'make'], cols);
    const model = get(['modell', 'model'], cols);
    if (!make || !model) return null;

    const out: CsvRow = { make, model };

    const kaross = get(['kaross'], cols);
    if (kaross) out.kaross = kaross;

    const drivmedel = get(['drivmedel'], cols);
    if (drivmedel) out.drivmedel = drivmedel;

    const drivlina = get(['drivlina'], cols);
    if (drivlina) out.drivlina = drivlina;

    const sittplatserRaw = get(['sittplatser', 'seats'], cols);
    if (sittplatserRaw) { const n = parseInt(sittplatserRaw); if (!isNaN(n)) out.sittplatser = n; }

    const styrkorRaw = get(['styrkor'], cols);
    const styrkorList = list(styrkorRaw);
    if (styrkorList.length) out.styrkor = styrkorList;

    const svagheterRaw = get(['svagheter', 'svaghet'], cols);
    const svagheterList = list(svagheterRaw);
    if (svagheterList.length) out.svagheter = svagheterList;

    const passarRaw = get(['passar_for', 'passar_for', 'passar for'], cols);
    const passarList = list(passarRaw);
    if (passarList.length) out.passar_for = passarList;

    const beskrivning = get(['beskrivning', 'description', 'expert_text'], cols);
    if (beskrivning) out.beskrivning = beskrivning;

    const bagKey = headers.findIndex(h => h.includes('bagage') || h.includes('baggage') || h.includes('trunk'));
    if (bagKey >= 0 && cols[bagKey]) { const n = parseInt(cols[bagKey]); if (!isNaN(n)) out.bagage_liter = n; }

    const dtKey = headers.findIndex(h => h.includes('drivetrain') && h !== 'drivlina');
    if (dtKey >= 0 && cols[dtKey]) out.drivetrain_options = cols[dtKey];

    return out;
  }).filter(Boolean) as CsvRow[];
}

const KAROSS_TO_BODY: Record<string, string> = {
  'SUV': 'suv', 'Sedan': 'sedan', 'Halvkombi': 'hatchback',
  'Halvkombi/Sedan': 'hatchback', 'Sedan/Kombi': 'kombi', 'Kombi': 'kombi',
  'Coupé': 'coupe', 'Coupé/Cab': 'cab', 'Cab': 'cab', 'Cabriolet': 'cab',
  'Pickup': 'pickup', 'Skåp/MPV': 'mpv', 'MPV': 'mpv', 'Minibuss': 'mpv',
};

const FUEL_OPTIONS = [
  { value: 'bensin', label: 'Bensin' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'mildhybrid', label: 'Mildhybrid' },
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
  mildhybrid: 'bg-yellow-100 text-yellow-700',
  hybrid: 'bg-teal-100 text-teal-700',
  laddhybrid: 'bg-blue-100 text-blue-700',
  el: 'bg-emerald-100 text-emerald-700',
};

const FUEL_LABELS: Record<string, string> = {
  bensin: 'Bensin',
  diesel: 'Diesel',
  mildhybrid: 'Mildhybrid',
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
  kaross: string;
  drivlina: string;
  styrkor: string;
  svagheter: string;
  passar_for: string;
  expert_text: string;
  price_new_from: string;
  price_new_to: string;
  price_used_min: string;
  price_used_max: string;
  price_verified: boolean;
  price_source: string;
}

function emptyEdit(entry: CatalogEntry): EditState {
  const toStr = (arr: string[] | null | undefined) => (arr ?? []).join('; ');
  return {
    fuel_types: entry.fuel_types ?? [],
    body_type: entry.body_type ?? '',
    segment: entry.segment ?? '',
    rating_overall: (entry.betyg_totalt ?? entry.rating_overall) != null ? String(entry.betyg_totalt ?? entry.rating_overall) : '',
    expert_comment: entry.expert_comment ?? '',
    seats: entry.seats != null ? String(entry.seats) : '',
    image_url: entry.cleaned_image_url ?? entry.image_url ?? '',
    kaross: entry.kaross ?? '',
    drivlina: entry.drivlina_kort ?? '',
    styrkor: toStr(entry.styrkor),
    svagheter: toStr(entry.svagheter),
    passar_for: toStr(entry.passar_for),
    expert_text: entry.expert_text ?? entry.expert_comment ?? '',
    price_new_from: entry.price_new_from != null ? String(entry.price_new_from) : '',
    price_new_to: entry.price_new_to != null ? String(entry.price_new_to) : '',
    price_used_min: entry.price_used_min != null ? String(entry.price_used_min) : '',
    price_used_max: entry.price_used_max != null ? String(entry.price_used_max) : '',
    price_verified: entry.price_verified ?? false,
    price_source: entry.price_source ?? '',
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

  const [imgSearchId, setImgSearchId] = useState<string | null>(null);
  const [imgSearchResults, setImgSearchResults] = useState<string[]>([]);
  const [imgSearchLoading, setImgSearchLoading] = useState(false);
  const [imgSearchQuery, setImgSearchQuery] = useState('');

  const [imgUploading, setImgUploading] = useState(false);
  const imgUploadInputRef = useRef<HTMLInputElement>(null);

  const [scrapeLoadingId, setScrapeLoadingId] = useState<string | null>(null);
  const [scrapeResultId, setScrapeResultId] = useState<string | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('car_catalog')
      .select('id, make, model, image_url, cleaned_image_url, fuel_types, body_type, segment, rating_overall, expert_comment, seats, is_active, updated_at, kaross, drivmedel, drivlina_kort, styrkor, svagheter, passar_for, expert_text, betyg_totalt, price_new_from, price_new_to, price_used_min, price_used_max, price_verified, price_source')
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
    const splitList = (s: string) => s.split(';').map(x => x.trim()).filter(Boolean);
    const toInt = (s: string) => { const n = parseInt(s.replace(/\s/g, '')); return isNaN(n) ? null : n; };
    const payload = {
      fuel_types: editState.fuel_types.length > 0 ? editState.fuel_types : null,
      body_type: editState.body_type || null,
      segment: editState.segment || null,
      rating_overall: editState.rating_overall ? parseFloat(editState.rating_overall) : null,
      betyg_totalt: editState.rating_overall ? parseFloat(editState.rating_overall) : null,
      expert_comment: editState.expert_comment || null,
      seats: editState.seats ? parseInt(editState.seats) : null,
      cleaned_image_url: editState.image_url.trim() || null,
      kaross: editState.kaross || null,
      drivlina_kort: editState.drivlina || null,
      drivetrain_type: editState.drivlina || null,
      styrkor: splitList(editState.styrkor).length > 0 ? splitList(editState.styrkor) : null,
      svagheter: splitList(editState.svagheter).length > 0 ? splitList(editState.svagheter) : null,
      passar_for: splitList(editState.passar_for).length > 0 ? splitList(editState.passar_for) : null,
      expert_text: editState.expert_text || null,
      price_new_from: toInt(editState.price_new_from),
      price_new_to: toInt(editState.price_new_to),
      price_used_min: toInt(editState.price_used_min),
      price_used_max: toInt(editState.price_used_max),
      price_verified: editState.price_verified,
      price_source: editState.price_source || null,
      price_verified_at: editState.price_verified ? new Date().toISOString() : null,
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

  const searchImages = async (entry: CatalogEntry, customQuery?: string) => {
    const q = customQuery ?? `${entry.make} ${entry.model} car`;
    setImgSearchQuery(q);
    setImgSearchId(entry.id);
    setImgSearchLoading(true);
    setImgSearchResults([]);
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=12&format=json&origin=*`;
      const res = await fetch(url);
      const data = await res.json();
      const titles: string[] = (data.query?.search ?? []).map((r: { title: string }) => r.title);
      const imageUrls: string[] = [];
      for (const title of titles.slice(0, 8)) {
        const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=400&format=json&origin=*`);
        const imgData = await imgRes.json();
        const pages = Object.values(imgData.query?.pages ?? {}) as Array<{ imageinfo?: Array<{ url: string; mime: string }> }>;
        for (const page of pages) {
          const info = page.imageinfo?.[0];
          if (info?.url && (info.mime?.startsWith('image/jpeg') || info.mime?.startsWith('image/png') || info.mime?.startsWith('image/webp'))) {
            imageUrls.push(info.url);
          }
        }
        if (imageUrls.length >= 6) break;
      }
      setImgSearchResults(imageUrls);
    } catch {
      setImgSearchResults([]);
    } finally {
      setImgSearchLoading(false);
    }
  };

  const pickImage = (url: string) => {
    if (!editState) return;
    setEditState({ ...editState, image_url: url });
    setImgSearchId(null);
    setImgSearchResults([]);
  };

  const handleImgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editId || !editState) return;
    e.target.value = '';
    setImgUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${editId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('catalog-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('catalog-images').getPublicUrl(path);
      setEditState({ ...editState, image_url: data.publicUrl });
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setImgUploading(false);
    }
  };

  const handleScrapePrice = async (entry: CatalogEntry) => {
    setScrapeLoadingId(entry.id);
    setScrapeError(null);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-car-prices', {
        body: { catalog_id: entry.id, make: entry.make, model: entry.model, type: 'both' },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.message ?? 'Inga priser hittades');
      const s = data.scraped;
      setEntries(prev => prev.map(e => e.id === entry.id ? {
        ...e,
        price_new_from: s.price_new_from ?? e.price_new_from,
        price_new_to: s.price_new_to ?? e.price_new_to,
        price_used_min: s.price_used_min ?? e.price_used_min,
        price_used_max: s.price_used_max ?? e.price_used_max,
        price_source: s.source ?? e.price_source,
        price_verified: false,
      } : e));
      setScrapeResultId(entry.id);
      setTimeout(() => setScrapeResultId(null), 4000);
      // If edit panel is open for this entry, also refresh edit state
      if (editId === entry.id) {
        setEditState(prev => prev ? {
          ...prev,
          price_new_from: s.price_new_from ? String(s.price_new_from) : prev.price_new_from,
          price_new_to: s.price_new_to ? String(s.price_new_to) : prev.price_new_to,
          price_used_min: s.price_used_min ? String(s.price_used_min) : prev.price_used_min,
          price_used_max: s.price_used_max ? String(s.price_used_max) : prev.price_used_max,
          price_source: s.source ?? prev.price_source,
        } : prev);
      }
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : String(err));
      setTimeout(() => setScrapeError(null), 6000);
    } finally {
      setScrapeLoadingId(null);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCsvUploading(true);
    setCsvResult(null);

    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      const preview = text.slice(0, 200).replace(/\n/g, '↵');
      setCsvResult({ updated: 0, skipped: 0, errors: [
        `Inga rader tolkades. Kontrollera att filen är CSV med komma- eller semikolonseparering och kolumnerna make,model,bagage_liter.`,
        `Filens start: ${preview}`,
      ]});
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
      if (row.kaross) { payload.kaross = row.kaross; payload.body_type = KAROSS_TO_BODY[row.kaross] ?? row.kaross.toLowerCase(); }
      if (row.drivmedel) payload.drivmedel = row.drivmedel;
      if (row.drivlina) { payload.drivlina_kort = row.drivlina; payload.drivetrain_type = row.drivlina; }
      if (row.sittplatser != null) payload.seats = row.sittplatser;
      if (row.styrkor?.length) payload.styrkor = row.styrkor;
      if (row.svagheter?.length) payload.svagheter = row.svagheter;
      if (row.passar_for?.length) payload.passar_for = row.passar_for;
      if (row.beskrivning) payload.expert_text = row.beskrivning;

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
          <span className="ml-1 px-2 py-0.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-500">{stats.total}</span>
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
                Förväntat CSV-format: <code className="font-mono bg-white/60 px-1 rounded">Märke,Modell,Kaross,Beskrivning,Drivmedel,Drivlina,Sittplatser,Styrkor,Svagheter,Passar för</code>
              </p>
            </div>
            <button onClick={() => setCsvResult(null)} className="shrink-0 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats bar */}
        {scrapeError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <p className="text-sm text-rose-700 flex-1">Prissökning misslyckades: {scrapeError}</p>
            <button onClick={() => setScrapeError(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
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
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-[#faf8f5] text-sm focus:outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/10 transition"
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
                <tr className="border-b border-slate-100 bg-[#faf8f5]/50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
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
                      className={`transition-colors ${!entry.is_active ? 'opacity-50' : ''} ${isEditing ? 'bg-blue-50/40' : 'hover:bg-[#faf8f5]/60'}`}
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
                          {entry.price_verified ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Pris ✓
                            </span>
                          ) : (entry.price_new_from || entry.price_used_min) ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                              Pris ej verif.
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                              Saknar pris
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
                                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition ${
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
                              <span key={f} className={`px-1.5 py-0.5 rounded-xl text-[10px] font-semibold ${FUEL_COLORS[f] ?? 'bg-slate-100 text-slate-600'}`}>
                                {FUEL_LABELS[f] ?? f}
                              </span>
                            ))}
                            {!entry.fuel_types?.length && <span className="text-slate-300 text-xs">–</span>}
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
                          <span className="text-xs text-slate-600 capitalize">{entry.body_type ?? <span className="text-slate-300">–</span>}</span>
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
                            {entry.rating_overall != null ? `${entry.rating_overall}/10` : '–'}
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
                          <span className="text-xs text-slate-500 line-clamp-1">{entry.expert_comment ?? <span className="text-slate-300">–</span>}</span>
                        )}
                      </td>

                      {/* Active status */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive(entry)}
                          title={entry.is_active ? 'Klicka för att dölja' : 'Klicka för att visa'}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold transition ${
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { openEdit(entry); searchImages(entry); }}
                              className="inline-flex items-center gap-1 h-8 px-2 rounded-lg text-xs font-semibold border bg-white text-slate-500 border-slate-200 hover:border-[#0e6efe] hover:text-[#0e6efe] transition"
                              title="Sök och matcha bild"
                            >
                              <Images className="w-3.5 h-3.5" />
                            </button>
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
                            <button
                              onClick={() => handleScrapePrice(entry)}
                              disabled={scrapeLoadingId === entry.id}
                              title="Hämta priser automatiskt via Firecrawl"
                              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition disabled:opacity-50 ${
                                scrapeResultId === entry.id
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600'
                              }`}
                            >
                              {scrapeLoadingId === entry.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : scrapeResultId === entry.id
                                  ? <Check className="w-3 h-3" />
                                  : <TrendingUp className="w-3 h-3" />
                              }
                              {scrapeLoadingId === entry.id ? 'Hämtar…' : scrapeResultId === entry.id ? 'Klart' : 'Hämta pris'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {isEditing && editState && (
                      <tr className="bg-blue-50/40 border-b border-blue-100">
                        <td colSpan={8} className="px-4 pb-4 pt-0">
                          {/* Image URL row */}
                          <div className="flex items-center gap-3 mb-3">                            <div className="w-16 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              {editState.image_url ? (
                                <img src={editState.image_url} alt="preview" className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : (
                                <Car className="w-5 h-5 text-slate-300" />
                              )}
                            </div>
                            <input
                              type="url"
                              value={editState.image_url}
                              onChange={e => setEditState({ ...editState, image_url: e.target.value })}
                              placeholder="Klistra in bild-URL (https://…) eller sök nedan"
                              className="flex-1 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/10 transition placeholder:text-slate-400"
                            />
                            {/* File upload */}
                            <input
                              ref={imgUploadInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImgFileUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => imgUploadInputRef.current?.click()}
                              disabled={imgUploading}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-600 transition disabled:opacity-50"
                              title="Ladda upp bild från din dator"
                            >
                              {imgUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              {imgUploading ? 'Laddar…' : 'Ladda upp'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (imgSearchId === entry.id) {
                                  setImgSearchId(null);
                                } else {
                                  searchImages(entry);
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition ${
                                imgSearchId === entry.id
                                  ? 'bg-[#0e6efe] text-white border-[#0e6efe]'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#0e6efe] hover:text-[#0e6efe]'
                              }`}
                              title="Sök bild automatiskt"
                            >
                              <Images className="w-3.5 h-3.5" />
                              {imgSearchId === entry.id ? 'Dölj' : 'Sök bild'}
                            </button>
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

                          {/* Extra fields grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 mt-1">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Kaross</label>
                              <select
                                value={editState?.kaross ?? ''}
                                onChange={e => editState && setEditState({ ...editState, kaross: e.target.value })}
                                className={inputCls}
                              >
                                <option value="">Välj kaross</option>
                                {['SUV','Sedan','Halvkombi','Kombi','Coupé','Cab','Cabriolet','MPV','Pickup'].map(k => (
                                  <option key={k} value={k}>{k}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Drivlina</label>
                              <input
                                type="text"
                                value={editState?.drivlina ?? ''}
                                onChange={e => editState && setEditState({ ...editState, drivlina: e.target.value })}
                                placeholder="T.ex. Tvåhjulsdrift; Fyrhjulsdrift"
                                className={inputCls}
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Styrkor (separera med semikolon)</label>
                              <input
                                type="text"
                                value={editState?.styrkor ?? ''}
                                onChange={e => editState && setEditState({ ...editState, styrkor: e.target.value })}
                                placeholder="T.ex. Hög säkerhet; Bekväm; Bra räckvidd"
                                className={inputCls}
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Svagheter (separera med semikolon)</label>
                              <input
                                type="text"
                                value={editState?.svagheter ?? ''}
                                onChange={e => editState && setEditState({ ...editState, svagheter: e.target.value })}
                                placeholder="T.ex. Dyr service; Begränsat servicenät"
                                className={inputCls}
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Passar för (separera med semikolon)</label>
                              <input
                                type="text"
                                value={editState?.passar_for ?? ''}
                                onChange={e => editState && setEditState({ ...editState, passar_for: e.target.value })}
                                placeholder="T.ex. Familjependlaren; Tjänstebilsföraren"
                                className={inputCls}
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Expertbeskrivning</label>
                              <textarea
                                rows={3}
                                value={editState?.expert_text ?? ''}
                                onChange={e => editState && setEditState({ ...editState, expert_text: e.target.value })}
                                placeholder="Bilens karaktär och expertens sammanfattning…"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/10 transition resize-none placeholder:text-slate-400"
                              />
                            </div>
                          </div>

                          {/* Price fields */}
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 mb-3">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Priser (SEK)</p>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <span className={`text-xs font-semibold ${editState.price_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {editState.price_verified ? 'Verifierat' : 'Ej verifierat'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => editState && setEditState({ ...editState, price_verified: !editState.price_verified })}
                                  className={`relative w-9 h-5 rounded-full transition-colors ${editState.price_verified ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                >
                                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editState.price_verified ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                                </button>
                              </label>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Ny från (kr)</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={editState.price_new_from}
                                  onChange={e => editState && setEditState({ ...editState, price_new_from: e.target.value })}
                                  placeholder="t.ex. 849900"
                                  className={inputCls}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Ny till (kr)</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={editState.price_new_to}
                                  onChange={e => editState && setEditState({ ...editState, price_new_to: e.target.value })}
                                  placeholder="t.ex. 999900"
                                  className={inputCls}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Beg. från (kr)</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={editState.price_used_min}
                                  onChange={e => editState && setEditState({ ...editState, price_used_min: e.target.value })}
                                  placeholder="t.ex. 600000"
                                  className={inputCls}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Beg. till (kr)</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={editState.price_used_max}
                                  onChange={e => editState && setEditState({ ...editState, price_used_max: e.target.value })}
                                  placeholder="t.ex. 750000"
                                  className={inputCls}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Källa (t.ex. kia.com/se, blocket.se median jun-2025)</label>
                              <input
                                type="text"
                                value={editState.price_source}
                                onChange={e => editState && setEditState({ ...editState, price_source: e.target.value })}
                                placeholder="Ange var priset hämtades från"
                                className={inputCls}
                              />
                            </div>
                            {!editState.price_verified && (editState.price_new_from || editState.price_used_min) && (
                              <p className="text-[10px] text-amber-600 mt-2">Priser är sparade men markerade som <strong>ej verifierade</strong> — de visas med riktvärdesvarning för kunden.</p>
                            )}
                          </div>

                          {/* Image search panel */}
                          {imgSearchId === entry.id && (
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="relative flex-1">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                  <input
                                    type="text"
                                    value={imgSearchQuery}
                                    onChange={e => setImgSearchQuery(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') searchImages(entry, imgSearchQuery); }}
                                    placeholder={`Sök t.ex. "${entry.make} ${entry.model} car"`}
                                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 bg-[#faf8f5] text-xs text-slate-900 focus:outline-none focus:border-[#0e6efe] transition"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => searchImages(entry, imgSearchQuery)}
                                  disabled={imgSearchLoading}
                                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition disabled:opacity-50"
                                >
                                  {imgSearchLoading
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <RefreshCw className="w-3.5 h-3.5" />}
                                  Sök
                                </button>
                              </div>
                              {imgSearchLoading && (
                                <div className="flex justify-center py-6">
                                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                </div>
                              )}
                              {!imgSearchLoading && imgSearchResults.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-4">Inga bilder hittades – prova en annan sökning.</p>
                              )}
                              {!imgSearchLoading && imgSearchResults.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                  {imgSearchResults.map((url, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => pickImage(url)}
                                      className="group relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-transparent hover:border-[#0e6efe] transition-all"
                                      title="Använd denna bild"
                                    >
                                      <img
                                        src={url}
                                        alt=""
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={e => { (e.target as HTMLImageElement).closest('button')?.remove(); }}
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                                        <Check className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition drop-shadow-lg" />
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              <p className="mt-2 text-[10px] text-slate-400">Bilder hämtade från Wikimedia Commons. Klicka på en bild för att använda den.</p>
                            </div>
                          )}
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
            Bränsle – välj en eller flera bränsltyper för bilen
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" />
            Betyg 0–10 visas som stjärnfält för kunden i söket
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Möjliga dubbletter = samma märke, liknande modellnamn – dölj den du vill ta bort
          </div>
        </div>
      </main>
    </div>
  );
}
