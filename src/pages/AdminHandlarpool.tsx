import { useEffect, useState, useCallback } from 'react';
import {
  Loader2,
  Search,
  Check,
  Eye,
  EyeOff,
  Building2,
  Star,
  Car as CarIcon,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useAdminNav, type AdminPage } from '../hooks/useAdminNav';
import { supabase } from '../lib/supabase';
import PortalLayout from '../components/PortalLayout';

interface AdminHandlarpoolProps {
  onLoggedOut: () => void;
  onNavigate: (page: AdminPage) => void;
}

interface PoolCar {
  id: string;
  regnummer: string | null;
  marke: string;
  modell: string;
  ar: number;
  miltal: number | null;
  pool_utpris: number | null;
  pool_prisgolv: number | null;
  pool_prioritet: string | null;
  pool_status: string | null;
  pool_added_at: string | null;
  available_for_staff_sales: boolean;
  featured_on_frontend: boolean;
  created_at: string;
  dealer: { id: string; foretagsnamn: string } | null;
}

const PRIORITET_COLOR: Record<string, string> = {
  akut: 'bg-red-100 text-red-700',
  prioriterad: 'bg-amber-100 text-amber-700',
  normal: 'bg-slate-100 text-slate-600',
};

const STATUS_COLOR: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700',
  reserved: 'bg-amber-100 text-amber-700',
  sold: 'bg-slate-100 text-slate-500',
  paused: 'bg-slate-100 text-slate-500',
};

const STATUS_LABEL: Record<string, string> = {
  available: 'Tillgänglig',
  reserved: 'Reserverad',
  sold: 'Såld',
  paused: 'Pausad',
};

function fmtKr(n: number) {
  return n.toLocaleString('sv-SE') + ' kr';
}

export default function AdminHandlarpool({ onLoggedOut, onNavigate }: AdminHandlarpoolProps) {
  const navItems = useAdminNav({ activePage: 'handlarpool', onNavigate });
  const [cars, setCars] = useState<PoolCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterDealer, setFilterDealer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFeatured, setFilterFeatured] = useState<'all' | 'featured' | 'not_featured'>('all');
  const [dealers, setDealers] = useState<{ id: string; foretagsnamn: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('cars')
      .select(`
        id, regnummer, marke, modell, ar, miltal,
        pool_utpris, pool_prisgolv, pool_prioritet, pool_status, pool_added_at,
        available_for_staff_sales, featured_on_frontend, created_at,
        dealer:dealer_id(id, foretagsnamn)
      `)
      .eq('available_for_staff_sales', true)
      .order('pool_added_at', { ascending: false, nullsFirst: false });

    if (err) {
      // featured_on_frontend might not exist yet – fallback without it
      const { data: fallback } = await supabase
        .from('cars')
        .select(`
          id, regnummer, marke, modell, ar, miltal,
          pool_utpris, pool_prisgolv, pool_prioritet, pool_status, pool_added_at,
          available_for_staff_sales, created_at,
          dealer:dealer_id(id, foretagsnamn)
        `)
        .eq('available_for_staff_sales', true)
        .order('pool_added_at', { ascending: false, nullsFirst: false });
      const rows = (fallback ?? []) as unknown as PoolCar[];
      setCars(rows.map(c => ({ ...c, featured_on_frontend: false })));
    } else {
      setCars((data ?? []) as unknown as PoolCar[]);
    }

    // Build dealer list for filter
    const { data: dealerData } = await supabase
      .from('dealers')
      .select('id, foretagsnamn')
      .eq('godkand', true)
      .order('foretagsnamn');
    setDealers((dealerData ?? []) as { id: string; foretagsnamn: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleFeatured(car: PoolCar) {
    setToggling(car.id);
    const next = !car.featured_on_frontend;
    const { error: upErr } = await supabase
      .from('cars')
      .update({ featured_on_frontend: next } as never)
      .eq('id', car.id);
    if (upErr) {
      setError('Kunde inte uppdatera. Kontrollera att kolumnen featured_on_frontend finns i databasen.');
    } else {
      setCars(prev => prev.map(c => c.id === car.id ? { ...c, featured_on_frontend: next } : c));
    }
    setToggling(null);
  }

  const filtered = cars.filter(c => {
    if (filterDealer && c.dealer?.id !== filterDealer) return false;
    if (filterStatus && c.pool_status !== filterStatus) return false;
    if (filterFeatured === 'featured' && !c.featured_on_frontend) return false;
    if (filterFeatured === 'not_featured' && c.featured_on_frontend) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.regnummer?.toLowerCase().includes(q) ||
        c.marke?.toLowerCase().includes(q) ||
        c.modell?.toLowerCase().includes(q) ||
        c.dealer?.foretagsnamn?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const featuredCount = cars.filter(c => c.featured_on_frontend).length;

  return (
    <PortalLayout
      navItems={navItems}
      identity=""
      identityRole="Admin"
      onLogout={async () => { await supabase.auth.signOut(); onLoggedOut(); }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Handlarpoolen</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Alla bilar handlare lagt upp i sitt lager. Välj vilka som ska visas på hemsidan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <Star className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">{featuredCount} visas på hemsidan</span>
            </div>
            <button
              onClick={load}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Sök reg, märke, handlare..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-9 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/10"
            />
          </div>

          <select
            value={filterDealer}
            onChange={e => setFilterDealer(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-[#0e6efe] appearance-none cursor-pointer"
          >
            <option value="">Alla handlare</option>
            {dealers.map(d => (
              <option key={d.id} value={d.id}>{d.foretagsnamn}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-[#0e6efe] appearance-none cursor-pointer"
          >
            <option value="">Alla statusar</option>
            <option value="available">Tillgänglig</option>
            <option value="reserved">Reserverad</option>
            <option value="paused">Pausad</option>
            <option value="sold">Såld</option>
          </select>

          <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden text-sm">
            {(['all', 'featured', 'not_featured'] as const).map(v => (
              <button
                key={v}
                onClick={() => setFilterFeatured(v)}
                className={`px-3 h-9 font-medium transition ${
                  filterFeatured === v
                    ? 'bg-[#0e6efe] text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {v === 'all' ? 'Alla' : v === 'featured' ? 'Visas' : 'Visas ej'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Totalt i poolen', value: cars.length, icon: CarIcon, color: 'text-slate-600' },
            { label: 'Visas på hemsidan', value: featuredCount, icon: Eye, color: 'text-[#0e6efe]' },
            { label: 'Tillgängliga', value: cars.filter(c => c.pool_status === 'available' || !c.pool_status).length, icon: Check, color: 'text-emerald-600' },
            { label: 'Aktiva handlare', value: new Set(cars.map(c => c.dealer?.id).filter(Boolean)).size, icon: Building2, color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <s.icon className={`w-5 h-5 shrink-0 ${s.color}`} />
              <div>
                <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-slate-900 leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-xl py-20 flex flex-col items-center gap-2 text-slate-400">
            <Filter className="w-8 h-8" />
            <p className="text-sm font-medium">Inga bilar matchar filtret</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bil</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Handlare</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pris</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Prioritet</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hemsidan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(car => (
                    <tr
                      key={car.id}
                      className={`hover:bg-slate-50/60 transition ${car.featured_on_frontend ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <CarIcon className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{car.marke} {car.modell}</p>
                            <p className="text-[12px] text-slate-400">
                              {car.ar} · {car.miltal ? `${car.miltal.toLocaleString('sv-SE')} mil` : '–'}
                              {car.regnummer && <span className="ml-1 font-mono">{car.regnummer}</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-700 font-medium">{car.dealer?.foretagsnamn ?? '–'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {car.pool_utpris ? (
                          <div>
                            <p className="font-semibold text-slate-900">{fmtKr(car.pool_utpris)}</p>
                            {car.pool_prisgolv && (
                              <p className="text-[11px] text-slate-400">Golv {fmtKr(car.pool_prisgolv)}</p>
                            )}
                          </div>
                        ) : <span className="text-slate-400">–</span>}
                      </td>
                      <td className="px-4 py-3">
                        {car.pool_prioritet ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${PRIORITET_COLOR[car.pool_prioritet] ?? 'bg-slate-100 text-slate-600'}`}>
                            {car.pool_prioritet === 'akut' ? 'Akut' : car.pool_prioritet === 'prioriterad' ? 'Prio' : 'Normal'}
                          </span>
                        ) : <span className="text-slate-400 text-[12px]">–</span>}
                      </td>
                      <td className="px-4 py-3">
                        {car.pool_status ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${STATUS_COLOR[car.pool_status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {STATUS_LABEL[car.pool_status] ?? car.pool_status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-700">Tillgänglig</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleFeatured(car)}
                          disabled={toggling === car.id}
                          title={car.featured_on_frontend ? 'Ta bort från hemsidan' : 'Visa på hemsidan'}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-semibold transition disabled:opacity-50 ${
                            car.featured_on_frontend
                              ? 'bg-[#0e6efe] text-white hover:bg-[#0a57cc] shadow-sm shadow-blue-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {toggling === car.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : car.featured_on_frontend ? (
                            <><Eye className="w-3.5 h-3.5" /> Visas</>
                          ) : (
                            <><EyeOff className="w-3.5 h-3.5" /> Visa</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filtered.map(car => (
                <div key={car.id} className={`p-4 ${car.featured_on_frontend ? 'bg-blue-50/40' : ''}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-bold text-slate-900">{car.marke} {car.modell} {car.ar}</p>
                      <p className="text-[12px] text-slate-500">
                        {car.miltal ? `${car.miltal.toLocaleString('sv-SE')} mil` : '–'}
                        {car.regnummer && <span className="ml-1.5 font-mono">{car.regnummer}</span>}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-0.5">{car.dealer?.foretagsnamn ?? '–'}</p>
                    </div>
                    <button
                      onClick={() => toggleFeatured(car)}
                      disabled={toggling === car.id}
                      className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-semibold transition disabled:opacity-50 ${
                        car.featured_on_frontend
                          ? 'bg-[#0e6efe] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {toggling === car.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : car.featured_on_frontend ? (
                        <><Eye className="w-3.5 h-3.5" /> Visas</>
                      ) : (
                        <><EyeOff className="w-3.5 h-3.5" /> Visa</>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {car.pool_utpris && (
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {fmtKr(car.pool_utpris)}
                      </span>
                    )}
                    {car.pool_prioritet && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${PRIORITET_COLOR[car.pool_prioritet] ?? ''}`}>
                        {car.pool_prioritet === 'akut' ? 'Akut' : car.pool_prioritet === 'prioriterad' ? 'Prioriterad' : 'Normal'}
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${STATUS_COLOR[car.pool_status ?? 'available'] ?? 'bg-emerald-100 text-emerald-700'}`}>
                      {STATUS_LABEL[car.pool_status ?? 'available'] ?? 'Tillgänglig'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-[12px] text-slate-400">
              Visar {filtered.length} av {cars.length} bilar
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
