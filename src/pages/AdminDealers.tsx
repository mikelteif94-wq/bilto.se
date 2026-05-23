import { useEffect, useState, useMemo } from 'react';
import { Loader2, ChevronRight, Star, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import ErrorBanner from '../components/ErrorBanner';
import PortalLayout from '../components/PortalLayout';
import { useAdminNav, type AdminPage } from '../hooks/useAdminNav';

interface AdminDealersProps {
  onLoggedOut: () => void;
  onOpenDealer: (id: string) => void;
  onNavigate: (page: AdminPage) => void;
}

type Dealer = Database['public']['Tables']['dealers']['Row'];

type SortKey = 'bilto_score' | 'foretagsnamn' | 'created_at';
type TierFilter = 'alla' | 'guld' | 'silver' | 'brons' | 'ny' | 'ej_godkanda';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatMinutes(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${(minutes / 60).toFixed(1)} h`;
}

function formatWinRate(d: Dealer): string {
  const total = (d.win_count ?? 0) + (d.lost_count ?? 0);
  if (total === 0) return '—';
  const rate = (d.win_count ?? 0) / total;
  return `${Math.round(rate * 100)}%`;
}

// Tier badge
function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;

  const styles: Record<string, string> = {
    guld: 'bg-amber-100 text-amber-800 border-amber-300',
    silver: 'bg-slate-200 text-slate-700 border-slate-300',
    brons: 'bg-orange-100 text-orange-700 border-orange-300',
    ny: 'bg-blue-50 text-blue-600 border-blue-200',
  };

  const cls = styles[tier] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-wide uppercase ${cls}`}
    >
      {tier === 'guld' && <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />}
      {tier.toUpperCase()}
    </span>
  );
}

// Score bar
function ScoreBar({ score }: { score: number | null }) {
  const val = score ?? 0;
  let color = 'bg-slate-300';
  if (val >= 70) color = 'bg-green-500';
  else if (val >= 45) color = 'bg-blue-500';
  else if (val >= 20) color = 'bg-orange-400';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[48px]">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${val}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-700 tabular-nums w-7 text-right shrink-0">
        {val}
      </span>
    </div>
  );
}

// Approval status badge
function StatusBadge({ godkand }: { godkand: boolean | null }) {
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${
        godkand
          ? 'bg-green-600 text-white ring-green-600'
          : 'bg-amber-50 text-amber-700 ring-amber-200'
      }`}
    >
      {godkand ? 'Godkänd' : 'Väntar'}
    </span>
  );
}

export default function AdminDealers({
  onLoggedOut,
  onOpenDealer,
  onNavigate,
}: AdminDealersProps) {
  const navItems = useAdminNav({ activePage: 'handlare', onNavigate });
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting & filtering state
  const [sortKey, setSortKey] = useState<SortKey>('bilto_score');
  const [tierFilter, setTierFilter] = useState<TierFilter>('alla');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('dealers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError('Kunde inte hämta handlare.');
      } else {
        setDealers((data ?? []) as Dealer[]);
      }
      setLoading(false);
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  // Tier counts for summary pill
  const tierCounts = useMemo(() => {
    const counts = { guld: 0, silver: 0, brons: 0, ny: 0 };
    for (const d of dealers) {
      if (d.godkand && d.tier && d.tier in counts) {
        counts[d.tier as keyof typeof counts]++;
      }
    }
    return counts;
  }, [dealers]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...dealers];

    // Tier filter
    if (tierFilter === 'ej_godkanda') {
      list = list.filter((d) => !d.godkand);
    } else if (tierFilter !== 'alla') {
      list = list.filter((d) => d.tier === tierFilter);
    }

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((d) =>
        (d.foretagsnamn ?? '').toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortKey === 'bilto_score') {
        return (b.bilto_score ?? 0) - (a.bilto_score ?? 0);
      }
      if (sortKey === 'foretagsnamn') {
        return (a.foretagsnamn ?? '').localeCompare(b.foretagsnamn ?? '', 'sv');
      }
      if (sortKey === 'created_at') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

    return list;
  }, [dealers, sortKey, tierFilter, search]);

  const TIER_FILTER_LABELS: { key: TierFilter; label: string }[] = [
    { key: 'alla', label: 'Alla' },
    { key: 'guld', label: 'Guld' },
    { key: 'silver', label: 'Silver' },
    { key: 'brons', label: 'Brons' },
    { key: 'ny', label: 'Ny' },
    { key: 'ej_godkanda', label: 'Ej godkända' },
  ];

  return (
    <PortalLayout
      navItems={navItems}
      identity="Admin"
      identityRole="Bilto"
      onLogout={handleLogout}
      pageTitle="Handlare"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {/* Page header */}
        <div className="flex items-baseline justify-between mb-4 sm:mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Alla handlare
            {!loading && (
              <span className="ml-2 text-sm sm:text-base font-medium text-slate-400">
                ({dealers.length})
              </span>
            )}
          </h1>
        </div>

        <ErrorBanner message={error} className="mb-6" />

        {/* Tier summary pill */}
        {!loading && dealers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span className="text-amber-700 font-semibold">{tierCounts.guld} guld</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600">{tierCounts.silver} silver</span>
              <span className="text-slate-300">·</span>
              <span className="text-orange-600">{tierCounts.brons} brons</span>
              <span className="text-slate-300">·</span>
              <span className="text-blue-600">{tierCounts.ny} nya</span>
            </div>
          </div>
        )}

        {/* Sorting & filtering controls */}
        {!loading && dealers.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-5">
            {/* Tier filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {TIER_FILTER_LABELS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTierFilter(key)}
                  className={`h-8 px-3 rounded-full text-xs font-semibold border transition ${
                    tierFilter === key
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 sm:ml-auto">
              {/* Sort select */}
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-8 px-2 pr-7 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:border-slate-400 outline-none cursor-pointer"
              >
                <option value="bilto_score">Sortera: Bilto Score</option>
                <option value="foretagsnamn">Sortera: Namn</option>
                <option value="created_at">Sortera: Ansökt</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sök företag…"
                  className="h-8 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-400 outline-none w-40"
                />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">
              {dealers.length === 0 ? 'Inga handlare har ansökt än.' : 'Inga handlare matchar filtret.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="sm:hidden space-y-2">
              {filtered.map((d, idx) => (
                <li key={d.id}>
                  <button
                    onClick={() => onOpenDealer(d.id)}
                    className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 active:bg-slate-50 transition"
                  >
                    {/* Top row: rank + name + tier badge + chevron */}
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-400 mt-0.5 w-5 shrink-0 tabular-nums">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900 truncate">
                            {d.foretagsnamn || '—'}
                          </span>
                          {d.tier && <TierBadge tier={d.tier} />}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    </div>

                    {/* Score bar */}
                    <div className="mb-2 ml-7">
                      <ScoreBar score={d.bilto_score} />
                    </div>

                    {/* 3 stat pills */}
                    <div className="flex gap-2 ml-7 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
                        <span className="font-medium text-slate-700">Svarstid</span>
                        {formatMinutes(d.avg_response_minutes)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
                        <span className="font-medium text-slate-700">Win%</span>
                        {formatWinRate(d)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">
                        <span className="font-medium text-slate-700">Aktivitet</span>
                        {d.activity_score ?? '—'}/25
                      </span>
                    </div>

                    {/* Date + status */}
                    <div className="flex items-center gap-2 mt-2 ml-7">
                      <StatusBadge godkand={d.godkand} />
                      <span className="text-xs text-slate-400">{formatDate(d.created_at)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left font-semibold text-slate-500 px-4 lg:px-5 py-3 w-10 whitespace-nowrap">
                        #
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-5 py-3 whitespace-nowrap">
                        Företag
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-5 py-3 whitespace-nowrap min-w-[160px]">
                        Score
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-5 py-3 whitespace-nowrap">
                        Svarstid
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-5 py-3 whitespace-nowrap">
                        Win%
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-5 py-3 whitespace-nowrap">
                        Aktiva 30d
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-5 py-3 whitespace-nowrap">
                        Betalning
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-5 py-3 whitespace-nowrap">
                        Status
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-5 py-3 whitespace-nowrap">
                        Ansökt
                      </th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d, idx) => (
                      <tr
                        key={d.id}
                        onClick={() => onOpenDealer(d.id)}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition group"
                      >
                        {/* Rank */}
                        <td className="px-4 lg:px-5 py-3.5 text-xs font-bold text-slate-400 tabular-nums">
                          {idx + 1}
                        </td>

                        {/* Company + tier badge */}
                        <td className="px-4 lg:px-5 py-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900">
                              {d.foretagsnamn || <span className="text-slate-400">—</span>}
                            </span>
                            {d.tier && <TierBadge tier={d.tier} />}
                          </div>
                        </td>

                        {/* Score bar + number */}
                        <td className="px-4 lg:px-5 py-3.5 min-w-[160px]">
                          <ScoreBar score={d.bilto_score} />
                        </td>

                        {/* Svarstid */}
                        <td className="px-4 lg:px-5 py-3.5 text-slate-600 tabular-nums whitespace-nowrap">
                          {formatMinutes(d.avg_response_minutes)}
                        </td>

                        {/* Win% */}
                        <td className="px-4 lg:px-5 py-3.5 text-slate-600 tabular-nums">
                          {formatWinRate(d)}
                        </td>

                        {/* Aktiva 30d — activity_score proxy */}
                        <td className="px-4 lg:px-5 py-3.5 text-slate-600 tabular-nums">
                          {d.activity_score != null ? (
                            <span>{d.activity_score}<span className="text-slate-400">/25</span></span>
                          ) : '—'}
                        </td>

                        {/* Betalning */}
                        <td className="px-4 lg:px-5 py-3.5 text-slate-600 tabular-nums">
                          {d.payment_score != null ? (
                            <span>{d.payment_score}<span className="text-slate-400">/25</span></span>
                          ) : '—'}
                        </td>

                        {/* Godkänd */}
                        <td className="px-4 lg:px-5 py-3.5">
                          <StatusBadge godkand={d.godkand} />
                        </td>

                        {/* Ansökt */}
                        <td className="px-4 lg:px-5 py-3.5 text-slate-500 whitespace-nowrap">
                          {formatDate(d.created_at)}
                        </td>

                        {/* Arrow */}
                        <td className="px-4 py-3.5 text-slate-300 group-hover:text-slate-500 transition">
                          <ChevronRight className="w-4 h-4" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
