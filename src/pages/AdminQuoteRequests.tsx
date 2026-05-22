import { useEffect, useState } from 'react';
import {
  Loader2,
  ChevronRight,
  Car as CarIcon,
  Building2,
  MessageSquareText,
  LayoutDashboard,
  Search,
  Repeat,
  Phone,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PortalLayout from '../components/PortalLayout';
import { useAdminBadges } from '../hooks/useAdminBadges';

interface AdminQuoteRequestsProps {
  onLoggedOut: () => void;
  onOpenQuote: (id: string) => void;
  onNavigateCars: () => void;
  onNavigateDealers: () => void;
  onNavigateOverview: () => void;
}

interface QuoteRequest {
  id: string;
  created_at: string;
  search_option: string;
  car_model: string;
  budget: string;
  regnummer: string;
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  status: string;
  preferred_time: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Ny',
  contacted: 'Kontaktad',
  converted: 'Konverterad',
  lost: 'Förlorad',
  won: 'Vunnen',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-slate-200 text-slate-500',
  won: 'bg-emerald-100 text-emerald-700',
};

const OPTION_LABELS: Record<string, string> = {
  searching: 'Letar efter bil',
  found: 'Hittat bil',
  trade: 'Byta in',
};

const OPTION_ICONS: Record<string, typeof Search> = {
  searching: Search,
  found: CarIcon,
  trade: Repeat,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminQuoteRequests({
  onLoggedOut,
  onOpenQuote,
  onNavigateCars,
  onNavigateDealers,
  onNavigateOverview,
}: AdminQuoteRequestsProps) {
  const badges = useAdminBadges();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    const { data } = await supabase
      .from('quote_requests')
      .select('id, created_at, search_option, car_model, budget, regnummer, firstname, lastname, phone, email, status, preferred_time')
      .order('created_at', { ascending: false });
    setQuotes((data ?? []) as QuoteRequest[]);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  const filtered = filter === 'all' ? quotes : quotes.filter((q) => q.status === filter);
  const counts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <PortalLayout
      navItems={[
        { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Översikt', onClick: onNavigateOverview },
        { icon: <CarIcon className="w-4 h-4" />, label: 'Bilar', onClick: onNavigateCars, badge: badges.newCars },
        { icon: <MessageSquareText className="w-4 h-4" />, label: 'Förfrågningar', active: true },
        { icon: <Building2 className="w-4 h-4" />, label: 'Handlare', onClick: onNavigateDealers, badge: badges.pendingDealers },
      ]}
      identity="Admin"
      identityRole="Bilto"
      onLogout={handleLogout}
      pageTitle="Förfrågningar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Förfrågningar
            {!loading && (
              <span className="ml-2 text-sm sm:text-base font-medium text-slate-400">
                ({filtered.length})
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'Alla', count: quotes.length },
            { key: 'new', label: 'Nya', count: counts.new || 0 },
            { key: 'contacted', label: 'Kontaktade', count: counts.contacted || 0 },
            { key: 'converted', label: 'Konverterade', count: counts.converted || 0 },
            { key: 'won', label: 'Vunna', count: counts.won || 0 },
            { key: 'lost', label: 'Förlorade', count: counts.lost || 0 },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                filter === f.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {f.label}
              <span className={`text-xs ${filter === f.key ? 'text-white/70' : 'text-slate-400'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">Inga förfrågningar att visa.</p>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <ul className="sm:hidden space-y-2">
              {filtered.map((q) => {
                const Icon = OPTION_ICONS[q.search_option] || Search;
                return (
                  <li key={q.id}>
                    <button
                      onClick={() => onOpenQuote(q.id)}
                      className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 active:bg-slate-50 transition"
                    >
                      <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-slate-900">
                            {q.firstname} {q.lastname}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[q.status] || STATUS_COLORS.new}`}>
                            {STATUS_LABELS[q.status] || q.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {OPTION_LABELS[q.search_option] || q.search_option}
                          {q.car_model ? ` · ${q.car_model}` : ''}
                          {q.regnummer ? ` · ${q.regnummer}` : ''}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatDate(q.created_at)} {formatTime(q.created_at)}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3">Typ</th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3">Kund</th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3">Bil / Budget</th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3">Telefon</th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3">Status</th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3">Inkom</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((q) => {
                      const Icon = OPTION_ICONS[q.search_option] || Search;
                      return (
                        <tr
                          key={q.id}
                          onClick={() => onOpenQuote(q.id)}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition group"
                        >
                          <td className="px-4 lg:px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-slate-700">
                              <Icon className="w-4 h-4 text-slate-400" />
                              {OPTION_LABELS[q.search_option] || q.search_option}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 font-medium text-slate-900">
                            {q.firstname} {q.lastname}
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-slate-700">
                            {q.car_model || q.regnummer || '—'}
                            {q.budget && <span className="text-slate-400 ml-1">({q.budget.includes('kr') ? q.budget : `${q.budget} kr`})</span>}
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {q.phone}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[q.status] || STATUS_COLORS.new}`}>
                              {STATUS_LABELS[q.status] || q.status}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-slate-500 whitespace-nowrap">
                            {formatDate(q.created_at)}
                          </td>
                          <td className="px-4 py-4 text-slate-300 group-hover:text-slate-500 transition">
                            <ChevronRight className="w-4 h-4" />
                          </td>
                        </tr>
                      );
                    })}
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
