import { useEffect, useState, useMemo } from 'react';
import { Loader2, ChevronRight, Search } from 'lucide-react';
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
type StatusTab = 'vantar' | 'godkanda' | 'nekade';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
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
  const [activeTab, setActiveTab] = useState<StatusTab>('vantar');
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

  const counts = useMemo(() => ({
    vantar: dealers.filter(d => !d.godkand && !d.rejected).length,
    godkanda: dealers.filter(d => d.godkand).length,
    nekade: dealers.filter(d => d.rejected && !d.godkand).length,
  }), [dealers]);

  const filtered = useMemo(() => {
    let list = [...dealers];

    if (activeTab === 'vantar') {
      list = list.filter(d => !d.godkand && !d.rejected);
    } else if (activeTab === 'godkanda') {
      list = list.filter(d => d.godkand);
    } else {
      list = list.filter(d => d.rejected && !d.godkand);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(d =>
        (d.foretagsnamn ?? '').toLowerCase().includes(q) ||
        (d.mejl ?? '').toLowerCase().includes(q) ||
        (d.kontaktperson ?? '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [dealers, activeTab, search]);

  const TABS: { key: StatusTab; label: string; countColor: string }[] = [
    { key: 'vantar', label: 'Väntar', countColor: 'bg-amber-500 text-white' },
    { key: 'godkanda', label: 'Godkända', countColor: 'bg-green-500 text-white' },
    { key: 'nekade', label: 'Nekade', countColor: 'bg-red-500 text-white' },
  ];

  return (
    <PortalLayout
      navItems={navItems}
      identity="Admin"
      identityRole="Bilto"
      onLogout={handleLogout}
      pageTitle="Handlare"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-5">Handlare</h1>

        <ErrorBanner message={error} className="mb-6" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          {/* Status tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {TABS.map(({ key, label, countColor }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative h-8 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
                {counts[key] > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-xl ${
                    activeTab === key ? countColor : 'bg-slate-300 text-slate-600'
                  }`}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sök handlare…"
              className="h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 outline-none w-52"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400 text-sm">
              {search ? 'Inga handlare matchar sökningen.' : 'Inga handlare här.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Mobile list */}
            <ul className="sm:hidden divide-y divide-slate-100">
              {filtered.map(d => (
                <li key={d.id}>
                  <button
                    onClick={() => onOpenDealer(d.id)}
                    className="w-full text-left px-4 py-4 hover:bg-slate-50 transition flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{d.foretagsnamn || '–'}</p>
                      <p className="text-sm text-slate-500 truncate mt-0.5">
                        {[d.fornamn, d.efternamn].filter(Boolean).join(' ') || d.kontaktperson || d.mejl || '–'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(d.created_at)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left font-semibold text-slate-500 px-5 py-3">Företag</th>
                    <th className="text-left font-semibold text-slate-500 px-5 py-3">Kontaktperson</th>
                    <th className="text-left font-semibold text-slate-500 px-5 py-3">E-post</th>
                    <th className="text-left font-semibold text-slate-500 px-5 py-3 whitespace-nowrap">Ansökt</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr
                      key={d.id}
                      onClick={() => onOpenDealer(d.id)}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition group"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {d.foretagsnamn || '–'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {[d.fornamn, d.efternamn].filter(Boolean).join(' ') || d.kontaktperson || '–'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{d.mejl || '–'}</td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDate(d.created_at)}</td>
                      <td className="px-4 py-3.5 text-slate-300 group-hover:text-slate-500 transition">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
