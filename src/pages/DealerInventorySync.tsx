import { useState, useEffect, useRef } from 'react';
import {
  Package, Upload, RefreshCw, Search, Plus, Trash2, ChevronLeft,
  CheckCircle2, XCircle, AlertCircle, Loader2, Download, Target,
  Car, Fuel, Gauge, FileText, Zap, ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import PortalLayout from '../components/PortalLayout';
import { supabase } from '../lib/supabase';

interface DealerInventorySyncProps {
  dealerId: string;
  foretagsnamn: string;
  onBack: () => void;
  onLoggedOut: () => void;
  onNavigateOverview: () => void;
  onNavigateCars: () => void;
  onNavigateSettings: () => void;
}

interface InventoryRow {
  id: string;
  regnummer: string | null;
  marke: string;
  modell: string;
  ar: number;
  miltal: number | null;
  pris: number | null;
  drivmedel: string | null;
  vaxellada: string | null;
  farg: string | null;
  karosseri: string | null;
  status: string;
  source: string;
  external_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface MatchedLead {
  id: string;
  firstname: string | null;
  lastname: string | null;
  car_model: string | null;
  budget: string | null;
  fuel_type: string | null;
  created_at: string;
  match_score: number;
  matched_inv_id: string;
}

interface CsvRow {
  marke: string;
  modell: string;
  ar: string;
  miltal: string;
  pris: string;
  regnummer: string;
  drivmedel: string;
  vaxellada: string;
  farg: string;
  karosseri: string;
  notes: string;
  external_id: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  tillganglig: { label: 'Tillganglig', cls: 'bg-emerald-100 text-emerald-700' },
  reserverad:  { label: 'Reserverad',  cls: 'bg-amber-100 text-amber-700' },
  såld:        { label: 'Såld',        cls: 'bg-slate-100 text-slate-500' },
  inbytt:      { label: 'Inbytt',      cls: 'bg-blue-100 text-blue-700' },
};

const SOURCE_ICON: Record<string, string> = {
  manual:     'Manuell',
  csv_import: 'CSV',
  api:        'API',
};

const CSV_TEMPLATE_HEADERS = 'marke,modell,ar,miltal,pris,regnummer,drivmedel,vaxellada,farg,karosseri,notes,external_id';
const CSV_TEMPLATE_EXAMPLE = 'Volvo,XC60,2021,4500,349000,ABC123,diesel,automat,Svart,SUV,,INV-001';

type Tab = 'lager' | 'import' | 'matchning';

export default function DealerInventorySync({
  dealerId,
  foretagsnamn,
  onBack,
  onLoggedOut,
  onNavigateOverview,
  onNavigateCars,
  onNavigateSettings,
}: DealerInventorySyncProps) {
  const [tab, setTab] = useState<Tab>('lager');
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  // CSV import state
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvDone, setCsvDone] = useState<{ ok: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lead matching state
  const [matchedLeads, setMatchedLeads] = useState<MatchedLead[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchRan, setMatchRan] = useState(false);

  // Add single car form
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<Partial<CsvRow>>({});
  const [addSaving, setAddSaving] = useState(false);

  const navItems = [
    { icon: <Gauge className="w-4 h-4" />, label: 'Oversikt', onClick: onNavigateOverview },
    { icon: <Car className="w-4 h-4" />, label: 'Leads', onClick: onNavigateCars },
    { icon: <Package className="w-4 h-4" />, label: 'Lager', active: true },
  ];

  useEffect(() => { loadInventory(); }, []);

  async function loadInventory() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('dealer_inventory')
      .select('*')
      .eq('dealer_id', dealerId)
      .order('updated_at', { ascending: false });
    if (err) setError('Kunde inte ladda lager.');
    else setInventory(data ?? []);
    setLoading(false);
  }

  // ── CSV parsing ─────────────────────────────────────────────────────────────

  function parseCSV(text: string): { rows: CsvRow[]; errors: string[] } {
    const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return { rows: [], errors: ['CSV-filen är tom eller saknar rubrikrad.'] };

    const rawHeader = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/"/g, ''));
    const requiredCols = ['marke', 'modell', 'ar'];
    const missing = requiredCols.filter((c) => !rawHeader.includes(c));
    if (missing.length > 0) {
      return { rows: [], errors: [`Saknade kolumner: ${missing.join(', ')}. Obligatoriska: marke, modell, ar`] };
    }

    const errors: string[] = [];
    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = splitCsvLine(lines[i]);
      const row: Record<string, string> = {};
      rawHeader.forEach((h, idx) => { row[h] = (vals[idx] ?? '').trim().replace(/"/g, ''); });

      if (!row.marke || !row.modell || !row.ar) {
        errors.push(`Rad ${i + 1}: marke, modell och ar krävs.`);
        continue;
      }
      const yearNum = Number(row.ar);
      if (isNaN(yearNum) || yearNum < 1950 || yearNum > new Date().getFullYear() + 2) {
        errors.push(`Rad ${i + 1}: Ogiltigt ar "${row.ar}".`);
        continue;
      }
      rows.push({
        marke: row.marke || '',
        modell: row.modell || '',
        ar: row.ar || '',
        miltal: row.miltal || '',
        pris: row.pris || '',
        regnummer: row.regnummer || '',
        drivmedel: row.drivmedel || '',
        vaxellada: row.vaxellada || '',
        farg: row.farg || row['färg'] || '',
        karosseri: row.karosseri || '',
        notes: row.notes || row['anteckningar'] || '',
        external_id: row.external_id || row['ext_id'] || row['id'] || '',
      });
    }

    return { rows, errors };
  }

  function splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
      else { cur += ch; }
    }
    result.push(cur);
    return result;
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvDone(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows, errors } = parseCSV(text);
      setCsvRows(rows);
      setCsvErrors(errors);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  async function importCSV() {
    if (csvRows.length === 0 || csvImporting) return;
    setCsvImporting(true);
    let ok = 0;
    let skipped = 0;

    for (const row of csvRows) {
      const payload: Record<string, unknown> = {
        dealer_id: dealerId,
        marke: row.marke,
        modell: row.modell,
        ar: Number(row.ar),
        source: 'csv_import',
        status: 'tillganglig',
      };
      if (row.miltal) payload.miltal = Number(row.miltal.replace(/\D/g, '')) || null;
      if (row.pris)   payload.pris   = Number(row.pris.replace(/\D/g, ''))   || null;
      if (row.regnummer) payload.regnummer = row.regnummer.toUpperCase();
      if (row.drivmedel) payload.drivmedel = row.drivmedel.toLowerCase();
      if (row.vaxellada) payload.vaxellada = row.vaxellada.toLowerCase();
      if (row.farg) payload.farg = row.farg;
      if (row.karosseri) payload.karosseri = row.karosseri.toLowerCase();
      if (row.notes) payload.notes = row.notes;
      if (row.external_id) payload.external_id = row.external_id;

      const { error: insertErr } = await supabase
        .from('dealer_inventory')
        .upsert(payload, {
          onConflict: row.external_id ? 'dealer_id,external_id' : undefined,
          ignoreDuplicates: false,
        });

      if (insertErr) skipped++;
      else ok++;
    }

    setCsvDone({ ok, skipped });
    setCsvImporting(false);
    setCsvRows([]);
    await loadInventory();
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE_HEADERS + '\n' + CSV_TEMPLATE_EXAMPLE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bilto_lagermall.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Lead matching ────────────────────────────────────────────────────────────

  async function runLeadMatching() {
    setMatchLoading(true);
    setMatchedLeads([]);

    // Get recent open buy leads
    const { data: leads } = await supabase
      .from('quote_requests')
      .select('id, firstname, lastname, car_model, budget, fuel_type, created_at')
      .in('status', ['new', 'contacted'])
      .not('car_model', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!leads || leads.length === 0) {
      setMatchLoading(false);
      setMatchRan(true);
      return;
    }

    const results: MatchedLead[] = [];

    for (const lead of leads) {
      const { data: matches } = await supabase.rpc('match_inventory_to_lead', {
        p_dealer_id: dealerId,
        p_lead_id: lead.id,
      });
      if (matches && matches.length > 0 && matches[0].match_score >= 30) {
        results.push({
          ...lead,
          match_score: matches[0].match_score,
          matched_inv_id: matches[0].inventory_id,
        });
      }
    }

    results.sort((a, b) => b.match_score - a.match_score);
    setMatchedLeads(results);
    setMatchRan(true);
    setMatchLoading(false);
  }

  // ── Add single row ───────────────────────────────────────────────────────────

  async function saveAddForm() {
    if (!addForm.marke || !addForm.modell || !addForm.ar) return;
    setAddSaving(true);
    const payload: Record<string, unknown> = {
      dealer_id: dealerId,
      marke: addForm.marke,
      modell: addForm.modell,
      ar: Number(addForm.ar),
      source: 'manual',
      status: 'tillganglig',
    };
    if (addForm.miltal)    payload.miltal    = Number(addForm.miltal) || null;
    if (addForm.pris)      payload.pris      = Number(addForm.pris)   || null;
    if (addForm.regnummer) payload.regnummer = addForm.regnummer.toUpperCase();
    if (addForm.drivmedel) payload.drivmedel = addForm.drivmedel;
    if (addForm.vaxellada) payload.vaxellada = addForm.vaxellada;
    if (addForm.farg)      payload.farg      = addForm.farg;
    if (addForm.karosseri) payload.karosseri = addForm.karosseri;
    if (addForm.notes)     payload.notes     = addForm.notes;
    if (addForm.external_id) payload.external_id = addForm.external_id;

    const { error: err } = await supabase.from('dealer_inventory').insert(payload);
    if (err) {
      setError('Kunde inte spara bilen.');
    } else {
      setAddOpen(false);
      setAddForm({});
      await loadInventory();
    }
    setAddSaving(false);
  }

  async function deleteRow(id: string) {
    if (!confirm('Ta bort denna bil från lagret?')) return;
    await supabase.from('dealer_inventory').delete().eq('id', id);
    setInventory((prev) => prev.filter((r) => r.id !== id));
  }

  async function updateStatus(id: string, newStatus: string) {
    await supabase.from('dealer_inventory').update({ status: newStatus }).eq('id', id);
    setInventory((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
  }

  const filtered = inventory.filter((r) => {
    const q = search.toLowerCase();
    const matchQ = !q || r.marke.toLowerCase().includes(q) || r.modell.toLowerCase().includes(q)
      || (r.regnummer ?? '').toLowerCase().includes(q);
    const matchS = !statusFilter || r.status === statusFilter;
    return matchQ && matchS;
  });

  const counts = {
    tillganglig: inventory.filter((r) => r.status === 'tillganglig').length,
    reserverad:  inventory.filter((r) => r.status === 'reserverad').length,
    såld:        inventory.filter((r) => r.status === 'såld').length,
  };

  return (
    <PortalLayout
      navItems={navItems}
      identity={foretagsnamn}
      identityRole="Handlare"
      onLogout={onLoggedOut}
      pageTitle="Lagerhantering"
      headerAction={
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 h-8 px-3 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white text-xs font-semibold rounded-xl transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Lägg till bil
        </button>
      }
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Back link */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-900 font-medium transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Tillbaka
        </button>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Tillgangliga', val: counts.tillganglig, cls: 'text-emerald-600' },
            { label: 'Reserverade',  val: counts.reserverad,  cls: 'text-amber-600' },
            { label: 'Sålda',        val: counts.såld,         cls: 'text-slate-500' },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className={`text-2xl font-bold ${c.cls}`}>{c.val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden">
          {(['lager', 'import', 'matchning'] as Tab[]).map((t) => {
            const labels: Record<Tab, string> = { lager: 'Lager', import: 'CSV-import', matchning: 'Leadmatchning' };
            const icons: Record<Tab, React.ReactNode> = {
              lager: <Package className="w-4 h-4" />,
              import: <Upload className="w-4 h-4" />,
              matchning: <Target className="w-4 h-4" />,
            };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                  tab === t
                    ? 'border-[#0e6efe] text-[#0e6efe]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {icons[t]}
                {labels[t]}
              </button>
            );
          })}
        </div>

        {/* ── TAB: LAGER ── */}
        {tab === 'lager' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Sök märke, modell, reg..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 h-10 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#0e6efe] bg-white"
              >
                <option value="">Alla statusar</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <button
                onClick={loadInventory}
                className="h-10 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-[#faf8f5] flex items-center gap-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Uppdatera
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <XCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium mb-1">Inget lager</p>
                <p className="text-sm text-slate-400">
                  {inventory.length === 0
                    ? 'Lägg till bilar manuellt eller importera via CSV.'
                    : 'Inga bilar matchar filtret.'}
                </p>
                {inventory.length === 0 && (
                  <button
                    onClick={() => setTab('import')}
                    className="mt-4 inline-flex items-center gap-2 text-[#0e6efe] text-sm font-medium hover:underline"
                  >
                    <Upload className="w-4 h-4" />
                    Importera via CSV
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bil</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ar / Mil</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pris</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Drivmedel</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Kalla</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((row) => {
                        const st = STATUS_LABELS[row.status] ?? { label: row.status, cls: 'bg-slate-100 text-slate-500' };
                        return (
                          <tr key={row.id} className="hover:bg-[#faf8f5] transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900">{row.marke} {row.modell}</p>
                              {row.regnummer && (
                                <span className="text-xs font-mono text-slate-400">{row.regnummer}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {row.ar}
                              {row.miltal != null && (
                                <span className="text-slate-400 ml-1">· {row.miltal.toLocaleString('sv')} mil</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {row.pris != null ? row.pris.toLocaleString('sv') + ' kr' : '–'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 capitalize">
                              {row.drivmedel ?? '–'}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={row.status}
                                onChange={(e) => updateStatus(row.id, e.target.value)}
                                className={`text-xs font-medium px-2 py-1 rounded-xl border-0 outline-none cursor-pointer ${st.cls}`}
                              >
                                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-slate-400">{SOURCE_ICON[row.source] ?? row.source}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => deleteRow(row.id)}
                                className="p-1.5 text-slate-300 hover:text-red-500 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {filtered.map((row) => {
                    const st = STATUS_LABELS[row.status] ?? { label: row.status, cls: 'bg-slate-100 text-slate-500' };
                    return (
                      <div key={row.id} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-900">{row.marke} {row.modell}</p>
                            <p className="text-xs text-slate-400">
                              {row.ar}{row.miltal != null ? ` · ${row.miltal.toLocaleString('sv')} mil` : ''}
                              {row.regnummer ? ` · ${row.regnummer}` : ''}
                            </p>
                          </div>
                          <button onClick={() => deleteRow(row.id)} className="p-1 text-slate-300 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-xl ${st.cls}`}>{st.label}</span>
                          {row.pris != null && (
                            <span className="text-xs text-slate-600 font-medium">{row.pris.toLocaleString('sv')} kr</span>
                          )}
                          {row.drivmedel && (
                            <span className="text-xs text-slate-400 capitalize">{row.drivmedel}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-400 text-right">{filtered.length} av {inventory.length} bilar</p>
              </>
            )}
          </div>
        )}

        {/* ── TAB: CSV IMPORT ── */}
        {tab === 'import' && (
          <div className="space-y-4">
            {/* Template download */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900">CSV-mall</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Ladda ned mallen, fyll i dina bilar och ladda upp filen nedan.
                  Obligatoriska kolumner: <code className="font-mono bg-blue-100 px-1 rounded">marke, modell, ar</code>
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Mall
              </button>
            </div>

            {/* File upload zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#0e6efe] rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Klicka eller dra en CSV-fil hit</p>
              <p className="text-xs text-slate-400 mt-1">Stöder .csv med UTF-8 kodning</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Errors */}
            {csvErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {csvErrors.length} fel hittades
                </div>
                <ul className="text-xs text-red-600 space-y-0.5 ml-6">
                  {csvErrors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
                  {csvErrors.length > 8 && <li>...och {csvErrors.length - 8} till</li>}
                </ul>
              </div>
            )}

            {/* Preview */}
            {csvRows.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    {csvRows.length} bilar redo att importeras
                  </p>
                  <button
                    onClick={() => { setCsvRows([]); setCsvErrors([]); }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Rensa
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#faf8f5] border-b border-slate-100">
                        {['Marke', 'Modell', 'Ar', 'Miltal', 'Pris', 'Regnummer', 'Drivmedel'].map((h) => (
                          <th key={h} className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {csvRows.slice(0, 10).map((r, i) => (
                        <tr key={i} className="hover:bg-[#faf8f5]">
                          <td className="px-3 py-2 font-medium">{r.marke}</td>
                          <td className="px-3 py-2">{r.modell}</td>
                          <td className="px-3 py-2">{r.ar}</td>
                          <td className="px-3 py-2 text-slate-500">{r.miltal || '–'}</td>
                          <td className="px-3 py-2 text-slate-500">{r.pris || '–'}</td>
                          <td className="px-3 py-2 text-slate-500 font-mono">{r.regnummer || '–'}</td>
                          <td className="px-3 py-2 text-slate-500 capitalize">{r.drivmedel || '–'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvRows.length > 10 && (
                  <p className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
                    Visar 10 av {csvRows.length} rader
                  </p>
                )}
                <div className="px-4 py-3 border-t border-slate-100">
                  <button
                    onClick={importCSV}
                    disabled={csvImporting}
                    className="h-10 px-6 bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2"
                  >
                    {csvImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {csvImporting ? 'Importerar...' : `Importera ${csvRows.length} bilar`}
                  </button>
                </div>
              </div>
            )}

            {/* Done state */}
            {csvDone && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Import klar!</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {csvDone.ok} bilar importerades{csvDone.skipped > 0 ? `, ${csvDone.skipped} hoppades over (dubletter)` : ''}.
                  </p>
                  <button
                    onClick={() => setTab('lager')}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium hover:underline"
                  >
                    Visa lager <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* API info banner */}
            <div className="bg-[#faf8f5] border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-700">API-integration</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Har du ett DMS eller lagersystem? Kontakta Bilto för att sätta upp en automatisk API-synkronisering.
                Vi stöder direktintegrationer mot Keyloop, Autofutura och generiska REST-flöden.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Kontakta oss: <span className="font-medium text-slate-600">support@bilto.se</span>
              </p>
            </div>
          </div>
        )}

        {/* ── TAB: LEADMATCHNING ── */}
        {tab === 'matchning' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start gap-3 mb-4">
                <Target className="w-6 h-6 text-[#0e6efe] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Automatisk leadmatchning</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Vi matchar ditt lager mot aktiva köpförfrågningar och hittar leads där du redan har rätt bil.
                    Score baseras på märke, modell, arsmodell, budget och drivmedel.
                  </p>
                </div>
              </div>
              <button
                onClick={runLeadMatching}
                disabled={matchLoading || inventory.filter((r) => r.status === 'tillganglig').length === 0}
                className="h-10 px-6 bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2"
              >
                {matchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                {matchLoading ? 'Matchar...' : 'Kör matchning'}
              </button>
              {inventory.filter((r) => r.status === 'tillganglig').length === 0 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Inget tillgangligt lager. Lägg till bilar först.
                </p>
              )}
            </div>

            {matchRan && !matchLoading && (
              matchedLeads.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                  <Target className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Inga matchande leads hittades</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Det finns inga aktiva köpförfrågningar som matchar ditt lager just nu.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">
                    {matchedLeads.length} matchande leads hittades
                  </p>
                  {matchedLeads.map((lead) => {
                    const inv = inventory.find((r) => r.id === lead.matched_inv_id);
                    const scoreColor =
                      lead.match_score >= 70 ? 'bg-emerald-500' :
                      lead.match_score >= 50 ? 'bg-amber-500' : 'bg-slate-400';
                    return (
                      <div
                        key={lead.id + lead.matched_inv_id}
                        className="bg-white rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center justify-center w-10 h-5 rounded-xl text-white text-xs font-bold ${scoreColor}`}>
                                {lead.match_score}
                              </span>
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {lead.car_model ?? 'Okand bil'}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500">
                              {lead.firstname ?? ''} {lead.lastname ?? ''} · Budget: {lead.budget ?? '–'}
                            </p>
                            {lead.fuel_type && (
                              <p className="text-xs text-slate-400 mt-0.5">Drivmedel: {lead.fuel_type}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium text-slate-700">
                              {inv ? `${inv.marke} ${inv.modell} ${inv.ar}` : 'Din bil'}
                            </p>
                            {inv?.pris && (
                              <p className="text-xs text-slate-400">{inv.pris.toLocaleString('sv')} kr</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-xl transition-all ${scoreColor}`}
                            style={{ width: `${lead.match_score}%` }}
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xs text-slate-400">
                            Mottagen {new Date(lead.created_at).toLocaleDateString('sv')}
                          </p>
                          <button
                            onClick={() => onNavigateCars()}
                            className="text-xs text-[#0e6efe] font-medium hover:underline flex items-center gap-1"
                          >
                            Se lead <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ── Add single car modal ── */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Lägg till bil</h3>
              <button onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
              {[
                { key: 'marke',      label: 'Marke *',       type: 'text' },
                { key: 'modell',     label: 'Modell *',      type: 'text' },
                { key: 'ar',         label: 'Arsmodell *',   type: 'number' },
                { key: 'miltal',     label: 'Miltal (mil)',  type: 'number' },
                { key: 'pris',       label: 'Pris (kr)',     type: 'number' },
                { key: 'regnummer',  label: 'Regnummer',     type: 'text' },
                { key: 'drivmedel',  label: 'Drivmedel',     type: 'text' },
                { key: 'vaxellada',  label: 'Vaxellada',     type: 'text' },
                { key: 'farg',       label: 'Farg',          type: 'text' },
                { key: 'karosseri',  label: 'Karosseri',     type: 'text' },
              ].map(({ key, label, type }) => (
                <label key={key} className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">{label}</span>
                  <input
                    type={type}
                    value={(addForm as Record<string, string>)[key] ?? ''}
                    onChange={(e) => setAddForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20"
                  />
                </label>
              ))}
              <label className="block col-span-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Anteckningar</span>
                <textarea
                  rows={2}
                  value={addForm.notes ?? ''}
                  onChange={(e) => setAddForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20"
                />
              </label>
              <label className="block col-span-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Eget lager-ID</span>
                <input
                  type="text"
                  placeholder="T.ex. INV-001"
                  value={addForm.external_id ?? ''}
                  onChange={(e) => setAddForm((p) => ({ ...p, external_id: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20"
                />
              </label>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setAddOpen(false)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Avbryt
              </button>
              <button
                onClick={saveAddForm}
                disabled={!addForm.marke || !addForm.modell || !addForm.ar || addSaving}
                className="flex-1 h-10 rounded-xl bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Spara
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
