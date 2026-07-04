import { useEffect, useState, useMemo } from 'react';
import {
  Package, Search, AlertTriangle, Clock,
  Loader2, Filter, Zap, TrendingDown, ChevronUp, ChevronDown,
} from 'lucide-react';
import StaffShell from '../components/StaffShell';
import DealWizardModal, { type WizardCar } from '../components/DealWizardModal';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

interface StaffPoolProps {
  staffUser: StaffUser;
  onLoggedOut: () => void;
  onDealCreated: (dealId: string) => void;
}

interface PoolCar extends WizardCar {
  miltal: number | null;
  pool_lagerkostnad_per_dag: number | null;
  pool_dagar_i_lager: number | null;
  pool_prioritet: string | null;
  pool_status: string | null;
  drivmedel: string | null;
}

type SortKey = 'rabatt' | 'lagertid' | 'prioritet' | 'pris';

function fmtKr(v: number | null) {
  if (v == null) return '—';
  return v.toLocaleString('sv-SE') + ' kr';
}

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
const PRIORITY_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  urgent: { label: 'AKUT', bg: '#FEE2E2', text: '#DC2626' },
  high:   { label: 'PRIORITERAD', bg: '#FEF3C7', text: '#D97706' },
  normal: { label: '', bg: '', text: '' },
};

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  available: { label: 'TILLGÄNGLIG', bg: '#D1FAE5', text: '#065F46' },
  reserved:  { label: 'RESERVERAD',  bg: '#DBEAFE', text: '#1D4ED8' },
  sold:      { label: 'SÅLD',        bg: '#F3F4F6', text: '#9CA3AF' },
};

export default function StaffPool({ staffUser, onLoggedOut, onDealCreated }: StaffPoolProps) {
  const [cars, setCars] = useState<PoolCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('prioritet');
  const [filterDealer, setFilterDealer] = useState('');
  const [showLocked, setShowLocked] = useState(false);
  const [wizardCar, setWizardCar] = useState<PoolCar | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('cars')
        .select(`
          id, regnummer, marke, modell, ar, miltal, startbud,
          pool_prisgolv, pool_rabattutrymme_kr, pool_lagerkostnad_per_dag,
          pool_dagar_i_lager, pool_prioritet, pool_status, drivmedel,
          dealer_id, dealers(id, foretagsnamn)
        `)
        .eq('available_for_staff_sales', true)
        .order('created_at', { ascending: false });

      setCars((data ?? []) as unknown as PoolCar[]);
      setLoading(false);
    })();
  }, []);

  const dealers = useMemo(() => {
    const map = new Map<string, string>();
    cars.forEach(c => {
      if (c.dealers) map.set(c.dealers.id, c.dealers.foretagsnamn);
    });
    return Array.from(map.entries());
  }, [cars]);

  const filtered = useMemo(() => {
    let list = [...cars];

    if (!showLocked) {
      list = list.filter(c => c.pool_status === 'available' || !c.pool_status);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.marke.toLowerCase().includes(q) ||
        c.modell.toLowerCase().includes(q) ||
        (c.regnummer ?? '').toLowerCase().includes(q) ||
        (c.dealers?.foretagsnamn ?? '').toLowerCase().includes(q)
      );
    }

    if (filterDealer) {
      list = list.filter(c => c.dealers?.id === filterDealer);
    }

    list.sort((a, b) => {
      if (sortKey === 'rabatt') return (b.pool_rabattutrymme_kr ?? 0) - (a.pool_rabattutrymme_kr ?? 0);
      if (sortKey === 'lagertid') return (b.pool_dagar_i_lager ?? 0) - (a.pool_dagar_i_lager ?? 0);
      if (sortKey === 'prioritet') {
        const pa = PRIORITY_ORDER[a.pool_prioritet ?? 'normal'] ?? 2;
        const pb = PRIORITY_ORDER[b.pool_prioritet ?? 'normal'] ?? 2;
        return pa - pb;
      }
      if (sortKey === 'pris') return (a.startbud ?? 0) - (b.startbud ?? 0);
      return 0;
    });

    return list;
  }, [cars, search, filterDealer, sortKey, showLocked]);

  const lockedCount = cars.filter(c => c.pool_status && c.pool_status !== 'available').length;

  return (
    <StaffShell activePage="pool" staffUser={staffUser} onLoggedOut={onLoggedOut}>
      <div className="max-w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Handlarpoolen</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? '…' : `${filtered.length} bilar från ${dealers.length} anslutna handlare · förhandlingsram synlig endast internt`}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sök märke, modell, reg.nr…"
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <span className="text-xs text-slate-400 px-2 font-semibold">SORTERA:</span>
            {([
              ['rabatt', 'MEST RABATTUTRYMME'],
              ['lagertid', 'LÄNGST TID I LAGER'],
              ['prioritet', 'PRIORITET'],
              ['pris', 'PRIS'],
            ] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition"
                style={{ background: sortKey === key ? '#0A1628' : 'transparent', color: sortKey === key ? 'white' : '#6B7280' }}
              >
                {label}
              </button>
            ))}
          </div>

          {dealers.length > 1 && (
            <select
              value={filterDealer}
              onChange={e => setFilterDealer(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
            >
              <option value="">Alla handlare</option>
              {dealers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={showLocked} onChange={e => setShowLocked(e.target.checked)} className="accent-blue-600" />
            <span className="text-xs font-semibold">Visa låsta{lockedCount > 0 ? ` (${lockedCount})` : ''}</span>
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Inga bilar matchar din sökning.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Table header */}
            <div className="hidden lg:grid grid-cols-[2fr_1.2fr_1fr_1fr_0.8fr_0.7fr_0.7fr_0.9fr_auto] gap-0 px-4 py-2.5 border-b border-slate-100">
              {['BIL', 'HANDLARE', 'UTPRIS', 'GOLV (INTERN)', 'UTRYMME', 'DAGAR', 'PRIO', 'STATUS', ''].map(h => (
                <div key={h} className="text-[10px] font-bold text-slate-400 tracking-wider">{h}</div>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-50">
              {filtered.map(car => {
                const prio = PRIORITY_LABEL[car.pool_prioritet ?? 'normal'];
                const statusKey = car.pool_status ?? 'available';
                const statusStyle = STATUS_LABEL[statusKey] ?? STATUS_LABEL.available;
                const rabatt = car.pool_rabattutrymme_kr ?? 0;
                const lagertid = car.pool_dagar_i_lager;
                const isLocked = statusKey !== 'available';

                return (
                  <div
                    key={car.id}
                    className="px-4 py-3 lg:grid lg:grid-cols-[2fr_1.2fr_1fr_1fr_0.8fr_0.7fr_0.7fr_0.9fr_auto] lg:gap-0 lg:items-center flex flex-wrap gap-2 hover:bg-slate-50/60 transition"
                    style={{ opacity: isLocked ? 0.6 : 1 }}
                  >
                    {/* BIL */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-10 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center overflow-hidden">
                        <Package className="w-5 h-5 text-slate-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{car.marke} {car.modell}</div>
                        <div className="text-xs text-slate-400">
                          {car.regnummer && <span className="font-mono mr-1">{car.regnummer}</span>}
                          {car.ar} · {car.miltal != null ? `${car.miltal.toLocaleString('sv-SE')} mil` : '—'}
                        </div>
                      </div>
                    </div>

                    {/* HANDLARE */}
                    <div className="text-sm text-slate-600 truncate pr-2">{car.dealers?.foretagsnamn ?? '—'}</div>

                    {/* UTPRIS */}
                    <div className="text-sm font-semibold text-slate-900">{fmtKr(car.startbud)}</div>

                    {/* GOLV */}
                    <div className="text-sm text-slate-500">{fmtKr(car.pool_prisgolv)}</div>

                    {/* UTRYMME */}
                    <div>
                      {rabatt > 0 ? (
                        <span className="text-sm font-bold" style={{ color: rabatt > 30000 ? '#00A85A' : '#F59E0B' }}>
                          {fmtKr(rabatt)}
                        </span>
                      ) : <span className="text-sm text-slate-300">—</span>}
                    </div>

                    {/* DAGAR */}
                    <div>
                      {lagertid != null ? (
                        <span className="text-sm font-bold flex items-center gap-1"
                          style={{ color: lagertid > 90 ? '#DC2626' : lagertid > 45 ? '#D97706' : '#6B7280' }}>
                          {lagertid}
                          {lagertid > 90 && <AlertTriangle className="w-3 h-3" />}
                        </span>
                      ) : <span className="text-sm text-slate-300">—</span>}
                    </div>

                    {/* PRIO */}
                    <div>
                      {prio.label ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: prio.bg, color: prio.text }}>
                          {prio.label}
                        </span>
                      ) : null}
                    </div>

                    {/* STATUS */}
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* ACTION */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => !isLocked && setWizardCar(car)}
                        disabled={isLocked}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap"
                        style={{ background: isLocked ? '#F3F4F6' : '#00A85A', color: isLocked ? '#9CA3AF' : 'white' }}
                      >
                        <Zap className="w-3 h-3" />
                        BYGG AFFÄR
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {wizardCar && (
        <DealWizardModal
          car={wizardCar}
          staffUser={staffUser}
          onClose={() => setWizardCar(null)}
          onCreated={(id) => { setWizardCar(null); onDealCreated(id); }}
        />
      )}
    </StaffShell>
  );
}
