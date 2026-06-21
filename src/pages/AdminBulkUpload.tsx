import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ImagePlus,
  RefreshCw,
  Link2,
  ChevronDown,
  Save,
  Eye,
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';

interface CatalogEntry {
  id: string;
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url: string | null;
}

/* ── File upload queue ── */
interface QueuedFile {
  file: File;
  preview: string;
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  matchedCatalogId: string | null;
  matchLabel: string;
  errorMsg?: string;
}

/* ── URL matching row ── */
interface UrlRow {
  url: string;
  guessedName: string;
  matchedCatalogId: string | null;
  matchLabel: string;
  status: 'pending' | 'saving' | 'done' | 'error';
  errorMsg?: string;
}

interface AdminBulkUploadProps {
  onBack: () => void;
}

const BRAND_ALIASES: Record<string, string> = {
  vw: 'volkswagen',
  mercedes: 'mercedes benz',
  merc: 'mercedes benz',
  mini: 'mini',
  'land rover': 'land rover',
  'range rover': 'land rover',
};

const COLOR_SUFFIXES = [
  'white', 'black', 'grey', 'gray', 'blue', 'red', 'orange', 'green',
  'yellow', 'silver', 'turquoise', 'dark', 'light',
];

const VARIANT_SUFFIXES = [
  'copy', '2', '3', '4', 'old', 'new',
];

function normalizeStr(s: string): string {
  return s.toLowerCase().replace(/[-_.\s]+/g, ' ').trim();
}

function stripSuffixes(normalized: string): string {
  let result = normalized;
  for (const color of COLOR_SUFFIXES) {
    result = result.replace(new RegExp(`\\b${color}\\b`, 'g'), '').trim();
  }
  for (const v of VARIANT_SUFFIXES) {
    result = result.replace(new RegExp(`\\b${v}\\b`, 'g'), '').trim();
  }
  return result.replace(/\s{2,}/g, ' ').trim();
}

function expandBrand(normalized: string): { brand: string; rest: string } | null {
  if (normalized.startsWith('range rover ')) {
    return { brand: 'land rover', rest: 'range rover ' + normalized.slice('range rover '.length) };
  }
  for (const [alias, canonical] of Object.entries(BRAND_ALIASES)) {
    if (normalized.startsWith(alias + ' ')) {
      return { brand: canonical, rest: normalized.slice(alias.length + 1) };
    }
  }
  return null;
}

function fileNameToSearchTerms(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  let normalized = normalizeStr(base);
  normalized = stripSuffixes(normalized);
  normalized = normalized
    .replace(/\bid(\d)/g, 'id $1')
    .replace(/\betron\b/g, 'e tron')
    .replace(/\betech\b/g, 'e tech')
    .replace(/\bseries\b/g, 'serie')
    .replace(/\bclass\b/g, 'klass')
    .replace(/\bestate\b/g, 'kombi')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return normalized;
}

function normalizeModel(s: string): string {
  return s
    .replace(/\bklass\b/g, 'klass')
    .replace(/\bclass\b/g, 'klass')
    .replace(/\bserie\b/g, 'serie')
    .replace(/\bseries\b/g, 'serie')
    .replace(/\bkombi\b/g, 'kombi')
    .replace(/\bestate\b/g, 'kombi')
    .trim();
}

function matchStringToCatalog(searchRaw: string, catalog: CatalogEntry[]): { id: string; label: string } | null {
  const search = fileNameToSearchTerms(searchRaw);
  if (!search) return null;

  const expanded = expandBrand(search);
  const searchBrand = expanded?.brand ?? null;
  const searchModel = expanded?.rest ?? search;

  let bestMatch: { id: string; label: string; score: number } | null = null;

  for (const entry of catalog) {
    const catMake = normalizeStr(entry.make);
    const catModelRaw = normalizeStr(entry.model);
    const catModel = normalizeModel(catModelRaw);
    const catFull = `${catMake} ${catModel}`;
    const searchModelNorm = normalizeModel(searchModel);

    let score = 0;

    if (searchBrand) {
      if (catMake !== searchBrand) continue;
      if (catModel === searchModelNorm) {
        score = 100;
      } else if (searchModelNorm.startsWith(catModel + ' ') || searchModelNorm.startsWith(catModel)) {
        score = 85;
      } else if (searchModelNorm.includes(catModel)) {
        score = 80;
      } else if (catModel.includes(searchModelNorm)) {
        score = 70;
      } else {
        const modelWords = catModel.split(' ');
        const searchWords = searchModelNorm.split(' ');
        const matchedWords = modelWords.filter(w => searchWords.includes(w));
        if (matchedWords.length > 0) {
          score = 50 + (matchedWords.length / modelWords.length) * 30;
        }
      }
    } else {
      const searchNorm = normalizeModel(search);
      if (searchNorm === catFull) {
        score = 100;
      } else if (searchNorm.includes(catFull)) {
        score = 85;
      } else if (catFull.includes(searchNorm)) {
        score = 75;
      } else if (searchNorm.includes(catMake) && searchNorm.includes(catModel)) {
        score = 70;
      } else {
        const searchWords = searchNorm.split(' ');
        const catWords = catFull.split(' ');
        const matchedWords = catWords.filter(w => searchWords.includes(w));
        if (matchedWords.length >= 2) {
          score = 40 + (matchedWords.length / catWords.length) * 30;
        }
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { id: entry.id, label: `${entry.make} ${entry.model}`, score };
    }
  }

  return bestMatch && bestMatch.score >= 50
    ? { id: bestMatch.id, label: bestMatch.label }
    : null;
}

/** Extract a guessable car name from a URL pathname */
function guessCarNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    // Remove file extension
    const noExt = last.replace(/\.[^.]+$/, '');
    // Replace hyphens/underscores with spaces
    return noExt.replace(/[-_]+/g, ' ').trim();
  } catch {
    // Not a valid URL, try treating the whole string as a filename
    return url.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  }
}

/* ═══════════════════════════════════════════════════════════
   URL Matcher tab
═══════════════════════════════════════════════════════════ */

function UrlMatcherTab({ catalog }: { catalog: CatalogEntry[] }) {
  const [rawInput, setRawInput] = useState('');
  const [rows, setRows] = useState<UrlRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const parseInput = () => {
    const lines = rawInput
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    const parsed: UrlRow[] = lines.map(line => {
      const guessedName = guessCarNameFromUrl(line);
      const match = matchStringToCatalog(guessedName, catalog);
      return {
        url: line,
        guessedName,
        matchedCatalogId: match?.id ?? null,
        matchLabel: match?.label ?? 'Ingen matchning',
        status: 'pending',
      };
    });
    setRows(parsed);
  };

  const updateMatch = (idx: number, catalogId: string) => {
    setRows(prev => {
      const copy = [...prev];
      const entry = catalog.find(c => c.id === catalogId);
      copy[idx] = {
        ...copy[idx],
        matchedCatalogId: catalogId,
        matchLabel: entry ? `${entry.make} ${entry.model}` : 'Ingen matchning',
      };
      return copy;
    });
  };

  const saveAll = async () => {
    setSaving(true);
    const toSave = rows.filter(r => r.matchedCatalogId && r.status === 'pending');
    for (let i = 0; i < toSave.length; i++) {
      const row = toSave[i];
      const globalIdx = rows.indexOf(row);
      setRows(prev => {
        const c = [...prev];
        c[globalIdx] = { ...c[globalIdx], status: 'saving' };
        return c;
      });
      try {
        const { error } = await supabase
          .from('car_catalog')
          .update({ cleaned_image_url: row.url })
          .eq('id', row.matchedCatalogId!);
        if (error) throw error;
        setRows(prev => {
          const c = [...prev];
          c[globalIdx] = { ...c[globalIdx], status: 'done' };
          return c;
        });
      } catch (err) {
        setRows(prev => {
          const c = [...prev];
          c[globalIdx] = {
            ...c[globalIdx],
            status: 'error',
            errorMsg: err instanceof Error ? err.message : 'Fel',
          };
          return c;
        });
      }
    }
    setSaving(false);
  };

  const matchedCount = rows.filter(r => r.matchedCatalogId).length;
  const doneCount = rows.filter(r => r.status === 'done').length;
  const pendingMatchedCount = rows.filter(r => r.matchedCatalogId && r.status === 'pending').length;

  return (
    <div className="space-y-5">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 leading-relaxed">
        <p className="font-semibold mb-1">Hur det fungerar</p>
        <p>Klistra in en URL per rad. Systemet gissar bilnamnet från URL:ens filnamn och matchar automatiskt mot katalogen. Kontrollera matchningarna och klicka "Spara" — URL:erna sparas som <code className="bg-blue-100 px-1 rounded text-xs">cleaned_image_url</code> på rätt bilpost.</p>
      </div>

      {/* Text area */}
      {rows.length === 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Klistra in URL:er (en per rad)
          </label>
          <textarea
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            rows={10}
            placeholder={"https://example.com/images/volvo-xc60.png\nhttps://example.com/images/bmw-3-series.png\nhttps://example.com/images/audi-a4.png"}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-mono text-slate-700 focus:outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/10 resize-none"
          />
          <button
            onClick={parseInput}
            disabled={!rawInput.trim()}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-sm transition disabled:opacity-50"
          >
            <Link2 className="w-4 h-4" />
            Analysera URL:er
          </button>
        </div>
      )}

      {/* Rows */}
      {rows.length > 0 && (
        <>
          {/* Stats + actions */}
          <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
            <span className="text-sm text-slate-500">{rows.length} URL:er</span>
            <span className="text-sm font-semibold text-emerald-700">{matchedCount} matchade</span>
            {rows.length - matchedCount > 0 && (
              <span className="text-sm font-semibold text-amber-700">{rows.length - matchedCount} omatchade</span>
            )}
            {doneCount > 0 && (
              <span className="text-sm font-semibold text-green-700">{doneCount} sparade</span>
            )}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => { setRows([]); setRawInput(''); }}
                className="h-8 px-3 text-xs rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              >
                Börja om
              </button>
              <button
                onClick={saveAll}
                disabled={saving || pendingMatchedCount === 0}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-xs transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Spara {pendingMatchedCount} matchningar
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {rows.map((row, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 bg-white border rounded-xl p-3 transition ${
                  row.status === 'done' ? 'border-emerald-200 bg-emerald-50/40' :
                  row.status === 'error' ? 'border-red-200 bg-red-50/40' :
                  row.status === 'saving' ? 'border-blue-200 bg-blue-50/30' :
                  row.matchedCatalogId ? 'border-slate-200' : 'border-amber-200 bg-amber-50/30'
                }`}
              >
                {/* Preview thumbnail */}
                <button
                  type="button"
                  onClick={() => setPreviewUrl(previewUrl === row.url ? null : row.url)}
                  className="w-14 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden hover:opacity-80 transition"
                  title="Förhandsgranska bild"
                >
                  <img
                    src={row.url}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <Eye className="w-3.5 h-3.5 text-slate-300 absolute" />
                </button>

                <div className="flex-1 min-w-0 space-y-1">
                  {/* URL */}
                  <p className="text-[11px] text-slate-400 font-mono truncate">{row.url}</p>
                  {/* Guessed name */}
                  <p className="text-[11px] text-slate-500">
                    Gissat namn: <span className="font-medium text-slate-700">{row.guessedName}</span>
                  </p>
                  {/* Match selector or label */}
                  {row.status === 'done' ? (
                    <span className="text-xs font-semibold text-emerald-700">{row.matchLabel} — sparat</span>
                  ) : row.matchedCatalogId ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-xs font-semibold text-emerald-700">{row.matchLabel}</span>
                      <button
                        type="button"
                        onClick={() => setRows(prev => {
                          const c = [...prev];
                          c[idx] = { ...c[idx], matchedCatalogId: null, matchLabel: 'Ingen matchning' };
                          return c;
                        })}
                        className="ml-1 text-[10px] text-slate-400 hover:text-red-500 transition"
                      >
                        Ändra
                      </button>
                    </div>
                  ) : (
                    <div className="relative max-w-xs">
                      <select
                        value=""
                        onChange={e => updateMatch(idx, e.target.value)}
                        className="text-xs border border-amber-300 bg-amber-50 text-amber-800 rounded-lg pl-2 pr-7 py-1 appearance-none w-full focus:outline-none focus:border-amber-400"
                      >
                        <option value="" disabled>Välj bil manuellt...</option>
                        {catalog.map(c => (
                          <option key={c.id} value={c.id}>{c.make} {c.model}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500 pointer-events-none" />
                    </div>
                  )}
                  {row.status === 'error' && row.errorMsg && (
                    <p className="text-[11px] text-red-600">{row.errorMsg}</p>
                  )}
                </div>

                <div className="shrink-0">
                  {row.status === 'saving' && <Loader2 className="w-4 h-4 text-[#0e6efe] animate-spin" />}
                  {row.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {row.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
              </div>
            ))}
          </div>

          {/* Inline preview */}
          {previewUrl && (
            <div className="relative bg-slate-900 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="absolute top-2 right-2 z-10 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
              <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-contain p-4" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════ */

export default function AdminBulkUpload({ onBack }: AdminBulkUploadProps) {
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'urls'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('car_catalog')
        .select('id, make, model, image_url, cleaned_image_url')
        .order('make', { ascending: true });
      setCatalog((data ?? []) as CatalogEntry[]);
      setLoadingCatalog(false);
    })();
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newQueue: QueuedFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const match = matchStringToCatalog(file.name, catalog);
      newQueue.push({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        status: 'pending',
        matchedCatalogId: match?.id ?? null,
        matchLabel: match?.label ?? 'Ingen matchning',
      });
    }
    setQueue(prev => [...prev, ...newQueue]);
  }, [catalog]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const removeFile = (idx: number) => {
    setQueue(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[idx].preview);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const updateMatch = (idx: number, catalogId: string) => {
    setQueue(prev => {
      const copy = [...prev];
      const entry = catalog.find(c => c.id === catalogId);
      copy[idx] = {
        ...copy[idx],
        matchedCatalogId: catalogId,
        matchLabel: entry ? `${entry.make} ${entry.model}` : 'Ingen matchning',
      };
      return copy;
    });
  };

  const startUpload = async () => {
    setUploading(true);
    const BATCH_SIZE = 3;
    const items = [...queue];

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (item, batchIdx) => {
        const queueIdx = i + batchIdx;
        if (item.status === 'done' || !item.matchedCatalogId) return;

        setQueue(prev => {
          const copy = [...prev];
          copy[queueIdx] = { ...copy[queueIdx], status: 'uploading' };
          return copy;
        });

        try {
          const compressed = await imageCompression(item.file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/jpeg',
          });

          const ext = 'jpg';
          const path = `${item.matchedCatalogId}/${Date.now()}_${queueIdx}.${ext}`;

          const { error: uploadErr } = await supabase.storage
            .from('catalog-images')
            .upload(path, compressed, {
              cacheControl: '3600',
              contentType: 'image/jpeg',
              upsert: false,
            });

          if (uploadErr) throw uploadErr;

          const { data: urlData } = supabase.storage
            .from('catalog-images')
            .getPublicUrl(path);

          const { error: updateErr } = await supabase
            .from('car_catalog')
            .update({ image_url: urlData.publicUrl })
            .eq('id', item.matchedCatalogId);

          if (updateErr) throw updateErr;

          setQueue(prev => {
            const copy = [...prev];
            copy[queueIdx] = { ...copy[queueIdx], status: 'done' };
            return copy;
          });
        } catch (err) {
          setQueue(prev => {
            const copy = [...prev];
            copy[queueIdx] = {
              ...copy[queueIdx],
              status: 'error',
              errorMsg: err instanceof Error ? err.message : 'Uppladdning misslyckades',
            };
            return copy;
          });
        }
      }));
    }

    setUploading(false);
  };

  const retryFailed = () => {
    setQueue(prev => prev.map(item =>
      item.status === 'error' ? { ...item, status: 'pending', errorMsg: undefined } : item
    ));
  };

  const clearDone = () => {
    setQueue(prev => prev.filter(item => item.status !== 'done'));
  };

  const totalCount = queue.length;
  const doneCount = queue.filter(q => q.status === 'done').length;
  const errorCount = queue.filter(q => q.status === 'error').length;
  const matchedCount = queue.filter(q => q.matchedCatalogId).length;
  const unmatchedCount = queue.filter(q => !q.matchedCatalogId).length;

  if (loadingCatalog) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="bg-[#0e6efe] h-14 sm:h-16 flex items-center px-3 sm:px-5 lg:px-8 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/90 hover:text-white transition font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>
        <h1 className="ml-4 text-white font-bold text-base sm:text-lg">
          Bulk-uppladdning bilder
        </h1>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10">

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-5 h-9 rounded-lg text-sm font-semibold transition ${
              activeTab === 'upload'
                ? 'bg-[#0e6efe] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              Ladda upp filer
            </span>
          </button>
          <button
            onClick={() => setActiveTab('urls')}
            className={`px-5 h-9 rounded-lg text-sm font-semibold transition ${
              activeTab === 'urls'
                ? 'bg-[#0e6efe] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5" />
              Matcha URL:er
            </span>
          </button>
        </div>

        {/* ── Upload tab ── */}
        {activeTab === 'upload' && (
          <>
            {/* Stats bar */}
            {queue.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{totalCount}</span>
                  <span className="text-slate-500">bilder totalt</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-700">{matchedCount}</span>
                  <span className="text-slate-500">matchade</span>
                </div>
                {unmatchedCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-700">{unmatchedCount}</span>
                    <span className="text-slate-500">omatchade</span>
                  </div>
                )}
                {doneCount > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-700">{doneCount}</span>
                    <span className="text-slate-500">klara</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-red-700">{errorCount}</span>
                    <span className="text-slate-500">misslyckade</span>
                  </div>
                )}
              </div>
            )}

            {/* Progress bar */}
            {uploading && totalCount > 0 && (
              <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Laddar upp...</span>
                  <span>{doneCount} / {matchedCount}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0e6efe] transition-all duration-300 rounded-full"
                    style={{ width: `${matchedCount > 0 ? (doneCount / matchedCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative cursor-pointer rounded-xl border-2 border-dashed p-10 sm:p-16 text-center
                transition-all duration-200
                ${dragOver
                  ? 'border-[#0e6efe] bg-[#0e6efe]/5 scale-[1.01]'
                  : 'border-slate-300 bg-white hover:border-[#0e6efe] hover:bg-slate-50'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <div className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition ${dragOver ? 'bg-[#0e6efe]/10' : 'bg-slate-100'}`}>
                  {dragOver ? (
                    <Upload className="w-6 h-6 text-[#0e6efe]" />
                  ) : (
                    <ImagePlus className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {dragOver ? 'Släpp bilderna här' : 'Dra och släpp bilder här'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    eller klicka för att välja filer. Namnge filerna som "Volvo XC60.jpg" för automatisk matchning.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {queue.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={startUpload}
                  disabled={uploading || matchedCount === 0}
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-sm shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Laddar upp...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Ladda upp {matchedCount} matchade
                    </>
                  )}
                </button>
                {errorCount > 0 && (
                  <button
                    onClick={retryFailed}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Försök igen ({errorCount})
                  </button>
                )}
                {doneCount > 0 && (
                  <button
                    onClick={clearDone}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Rensa klara
                  </button>
                )}
              </div>
            )}

            {/* File list */}
            {queue.length > 0 && (
              <div className="mt-8 space-y-2">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">
                  Filer ({queue.length})
                </h2>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {queue.map((item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      className={`
                        flex items-center gap-3 bg-white border rounded-lg p-3 transition
                        ${item.status === 'done' ? 'border-green-200 bg-green-50/50' : ''}
                        ${item.status === 'error' ? 'border-red-200 bg-red-50/50' : ''}
                        ${item.status === 'uploading' ? 'border-blue-200 bg-blue-50/30' : ''}
                        ${item.status === 'pending' ? 'border-slate-200' : ''}
                      `}
                    >
                      <img
                        src={item.preview}
                        alt=""
                        className="w-12 h-12 rounded-md object-cover shrink-0 bg-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.matchedCatalogId ? (
                            <span className="text-xs text-green-700 font-medium">{item.matchLabel}</span>
                          ) : (
                            <select
                              value=""
                              onChange={(e) => updateMatch(idx, e.target.value)}
                              className="text-xs border border-amber-300 bg-amber-50 text-amber-800 rounded px-2 py-0.5 max-w-[200px]"
                            >
                              <option value="" disabled>Välj bil manuellt...</option>
                              {catalog.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.make} {c.model}
                                </option>
                              ))}
                            </select>
                          )}
                          {item.status === 'error' && item.errorMsg && (
                            <span className="text-xs text-red-600">{item.errorMsg}</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {item.status === 'uploading' && (
                          <Loader2 className="w-4 h-4 text-[#0e6efe] animate-spin" />
                        )}
                        {item.status === 'done' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                        {item.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        {item.status === 'pending' && (
                          <button
                            onClick={() => removeFile(idx)}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
                            aria-label="Ta bort"
                          >
                            <X className="w-4 h-4 text-slate-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {queue.length === 0 && (
              <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Hur det fungerar</h3>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                  <li>Namnge dina bildfiler med bilmärke och modell, t.ex. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">Volvo XC60.jpg</code></li>
                  <li>Dra och släpp alla filer i ytan ovan (eller klicka för att välja)</li>
                  <li>Systemet matchar automatiskt filnamnet mot bilar i katalogen</li>
                  <li>För omatchade bilder kan du välja rätt bil manuellt i dropdownen</li>
                  <li>Klicka "Ladda upp" för att starta — bilderna komprimeras automatiskt</li>
                </ol>
                <p className="text-xs text-slate-400 mt-4">
                  {catalog.length} bilar finns i katalogen. Bilderna sparas i Supabase Storage och länkas till rätt post.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── URL matcher tab ── */}
        {activeTab === 'urls' && (
          <UrlMatcherTab catalog={catalog} />
        )}
      </main>
    </div>
  );
}
