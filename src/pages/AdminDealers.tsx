import { useEffect, useState } from 'react';
import { Loader2, ChevronRight } from 'lucide-react';
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    year: '2-digit',
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


  return (
    <PortalLayout
      navItems={navItems}
      identity="Admin"
      identityRole="Bilto"
      onLogout={handleLogout}
      pageTitle="Handlare"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="flex items-baseline justify-between mb-4 sm:mb-6">
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : dealers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">Inga handlare har ansökt än.</p>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <ul className="sm:hidden space-y-2">
              {dealers.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => onOpenDealer(d.id)}
                    className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 active:bg-slate-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-900 truncate">
                          {d.foretagsnamn || '—'}
                        </span>
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${
                            d.godkand
                              ? 'bg-green-600 text-white ring-green-600'
                              : 'bg-amber-100 text-amber-700 ring-amber-200'
                          }`}
                        >
                          {d.godkand ? 'Godkänd' : 'Väntar'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {d.kontaktperson || '—'} · {formatDate(d.created_at)}
                      </div>
                      {d.orgnr && (
                        <div className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                          {d.orgnr}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
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
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        Företag
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        Orgnr
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        Kontaktperson
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        Status
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        Ansökt
                      </th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealers.map((d) => (
                      <tr
                        key={d.id}
                        onClick={() => onOpenDealer(d.id)}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition group"
                      >
                        <td className="px-4 lg:px-6 py-4 font-semibold text-slate-900">
                          {d.foretagsnamn || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-slate-600 font-mono">
                          {d.orgnr || '—'}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-slate-900">
                          {d.kontaktperson || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <span
                            className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${
                              d.godkand
                                ? 'bg-green-600 text-white ring-green-600'
                                : 'bg-amber-50 text-amber-700 ring-amber-200'
                            }`}
                          >
                            {d.godkand ? 'Godkänd' : 'Väntar'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-slate-500 whitespace-nowrap">
                          {formatDate(d.created_at)}
                        </td>
                        <td className="px-4 py-4 text-slate-300 group-hover:text-slate-500 transition">
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
