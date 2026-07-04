import { useEffect, useState, useMemo } from 'react';
import {
  Package, Search, ArrowUpDown, AlertTriangle, Clock,
  ChevronRight, Loader2, Filter, Zap, TrendingDown,
} from 'lucide-react';
import StaffShell from '../components/StaffShell';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

interface StaffPoolProps {
  staffUser: StaffUser;
  onLoggedOut: () => void;
  onCreateDeal: (carId: string) => void;
}

interface PoolCar {
  id: string;
  regnummer: string | null;
  marke: string;
  modell: string;
  ar: number;
  miltal: number | null;
  startbud: number | null;
  pool_prisgolv: number | null;
  pool_rabattutrymme_kr: number | null;
  pool_lagerkostnad_per_dag: number | null;
  pool_dagar_i_lager: number | null;
  pool_prioritet: string | null;
  pool_status: string | null;
  drivmedel: string | null;
  dealer_id: string | null;
  dealers: { id: string; foretagsnamn: string } | null;
}

type SortKey = 'rabatt' | 'lagertid' | 'prioritet' | 'pris';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function fmtKr(v: number | null) {
  if (v == null) return '—';
  return v.toLocaleString('sv-SE') + ' kr';
}

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
const PRIORITY_LABEL: Record<string, string> = { urgent: 'Bråttom', high: 'Hög', normal: 'Normal' };
const PRIORITY_COLOR: Record<string, { bg: string; text: string }> = {
  urgent: { bg: '#FEE2E2', text: '#DC2626' },
  high: { bg: '#FEF3C7', text: '#D97706' },
  normal: { bg: '#F3F4F6', text: '#6B7280' },
};

export default function StaffPool({ staffUser, onLoggedOut, onCreateDeal }: StaffPoolProps) {
  const [cars, setCars] = useState<PoolCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('prioritet');
  const [filterDealer, setFilterDealer] = useState('');

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
        .eq('pool_status', 'available')
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
      if (sortKey === 'rabatt') {
        return (b.pool_rabattutrymme_kr ?? 0) - (a.pool_rabattutrymme_kr ?? 0);
      }
      if (sortKey === 'lagertid') {
        return (b.pool_dagar_i_lager ?? 0) - (a.pool_dagar_i_lager ?? 0);
      }
      if (sortKey === 'prioritet') {
        const pa = PRIORITY_ORDER[a.pool_prioritet ?? 'normal'] ?? 2;
        const pb = PRIORITY_ORDER[b.pool_prioritet ?? 'normal'] ?? 2;
        return pa - pb;
      }
      if (sortKey === 'pris') {
        return (a.startbud ?? 0) - (b.startbud ?? 0);
      }
      return 0;
    });

    return list;
  }, [cars, search, filterDealer, sortKey]);

  return (
    <StaffShell activePage="pool" staffUser={staffUser} onLoggedOut={onLoggedOut}>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-500" />
              Nätverkslager
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? '…' : `${filtered.length} av ${cars.length} bilar tillgängliga`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Sök märke, modell, reg, handlare…"
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterDealer}
                onChange={e => setFilterDealer(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
              >
                <option value="">Alla handlare</option>
                {dealers.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                className="h-9 pl-3 pr-8 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
              >
                <option value="prioritet">Prioritet</option>
                <option value="rabatt">Mest rabattutrymme</option>
                <option value="lagertid">Längst lagertid</option>
                <option value="pris">Lägst pris</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Inga bilar matchar din sökning.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(car => {
              const prio = car.pool_prioritet ?? 'normal';
              const prioStyle = PRIORITY_COLOR[prio] ?? PRIORITY_COLOR.normal;
              const rabatt = car.pool_rabattutrymme_kr ?? 0;
              const utpris = car.startbud;
              const golv = car.pool_prisgolv;
              const lagertid = car.pool_dagar_i_lager;

              return (
                <div
                  key={car.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-5 hover:border-blue-200 hover:shadow-sm transition"
                >
                  {/* Car info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-base font-bold text-slate-900">
                        {car.marke} {car.modell} {car.ar}
                      </span>
                      {car.regnummer && (
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                          {car.regnummer}
                        </span>
                      )}
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: prioStyle.bg, color: prioStyle.text }}
                      >
                        {PRIORITY_LABEL[prio]}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {car.dealers?.foretagsnamn ?? '—'} · {car.miltal != null ? `${car.miltal.toLocaleString('sv-SE')} mil` : '—'} · {car.drivmedel ?? '—'}
                    </div>

                    {/* Price row */}
                    <div className="mt-3 flex flex-wrap gap-4">
                      <div>
                        <div className="text-[11px] text-slate-400">Utpris</div>
                        <div className="text-sm font-bold text-slate-900">{fmtKr(utpris)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Prisgolv</div>
                        <div className="text-sm font-semibold text-slate-700">{fmtKr(golv)}</div>
                      </div>
                      {rabatt > 0 && (
                        <div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            Rabattutrymme
                          </div>
                          <div className="text-sm font-bold" style={{ color: '#00A85A' }}>
                            {fmtKr(rabatt)}
                          </div>
                        </div>
                      )}
                      {lagertid != null && (
                        <div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Dagar i lager
                          </div>
                          <div
                            className="text-sm font-bold"
                            style={{ color: lagertid > 60 ? '#DC2626' : lagertid > 30 ? '#D97706' : '#6B7280' }}
                          >
                            {lagertid} d{lagertid > 60 && <AlertTriangle className="w-3.5 h-3.5 inline ml-1" />}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onCreateDeal(car.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition"
                      style={{ background: '#00A85A', color: 'white' }}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Skapa affär
                    </button>
                    <button
                      onClick={() => navigate(`/handlare/bilar/${car.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      Visa detaljer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StaffShell>
  );
}
