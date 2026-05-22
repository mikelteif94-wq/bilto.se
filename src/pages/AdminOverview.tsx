import { useEffect, useState } from 'react';
import {
  Loader2,
  Car as CarIcon,
  Building2,
  ChevronRight,
  Gavel,
  Users,
  RefreshCw,
  ArrowRight,
  MessageSquareText,
  Clock,
} from 'lucide-react';
import { useAdminNav, type AdminPage } from '../hooks/useAdminNav';
import { supabase } from '../lib/supabase';
import PortalLayout from '../components/PortalLayout';

interface AdminOverviewProps {
  onLoggedOut: () => void;
  onOpenCar: (id: string) => void;
  onNavigate: (page: AdminPage) => void;
}

interface Stats {
  activeCars: number;
  newCars: number;
  bidsToday: number;
  newQuoteRequests: number;
  totalDealers: number;
  pendingDealers: number;
  endingSoon: number;
}

interface RecentItem {
  id: string;
  label: string;
  sub: string;
  kind: 'car' | 'quote';
  created_at: string;
  status: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h sedan`;
  return `${Math.floor(h / 24)} d sedan`;
}

function fmtTimeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'slutar nu';
  const h = Math.floor(ms / 3600000);
  if (h >= 24) return `${Math.floor(h / 24)} d ${h % 24} h`;
  return `${h} h`;
}

export default function AdminOverview({ onLoggedOut, onOpenCar, onNavigate }: AdminOverviewProps) {
  const navItems = useAdminNav({ activePage: 'overview', onNavigate });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    activeCars: 0, newCars: 0, bidsToday: 0,
    newQuoteRequests: 0, totalDealers: 0, pendingDealers: 0, endingSoon: 0,
  });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [endingSoon, setEndingSoon] = useState<{ id: string; label: string; auktion_slut: string }[]>([]);

  const load = async () => {
    setLoading(true);
    const nowIso = new Date().toISOString();
    const in24h = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

    const [active, ny, bids, quotes, dealersTotal, dealersPending, ending, recentCars, recentQuotes] = await Promise.all([
      supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'aktiv'),
      supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'ny'),
      supabase.from('bids').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay.toISOString()),
      supabase.from('quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('dealers').select('id', { count: 'exact', head: true }).eq('godkand', true),
      supabase.from('dealers').select('id', { count: 'exact', head: true }).eq('godkand', false),
      supabase.from('cars').select('id, regnummer, marke, modell, auktion_slut')
        .eq('status', 'aktiv').gt('auktion_slut', nowIso).lte('auktion_slut', in24h)
        .order('auktion_slut', { ascending: true }).limit(5),
      supabase.from('cars').select('id, regnummer, marke, modell, status, created_at')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('quote_requests').select('id, firstname, lastname, car_model, search_option, created_at, status')
        .order('created_at', { ascending: false }).limit(5),
    ]);

    setStats({
      activeCars: active.count ?? 0,
      newCars: ny.count ?? 0,
      bidsToday: bids.count ?? 0,
      newQuoteRequests: quotes.count ?? 0,
      totalDealers: dealersTotal.count ?? 0,
      pendingDealers: dealersPending.count ?? 0,
      endingSoon: ending.count ?? 0,
    });

    setEndingSoon((ending.data ?? []).map((c: any) => ({
      id: c.id,
      label: [c.marke, c.modell].filter(Boolean).join(' ') || c.regnummer,
      auktion_slut: c.auktion_slut,
    })));

    // Merge recent items sorted by created_at
    const cars = (recentCars.data ?? []).map((c: any) => ({
      id: c.id,
      label: [c.marke, c.modell].filter(Boolean).join(' ') || c.regnummer,
      sub: c.regnummer,
      kind: 'car' as const,
      created_at: c.created_at,
      status: c.status,
    }));
    const qs = (recentQuotes.data ?? []).map((q: any) => {
      const optLabel: Record<string, string> = { found: 'Hittat bil', searching: 'Letar bil', trade: 'Inbyte' };
      return {
        id: q.id,
        label: [q.firstname, q.lastname].filter(Boolean).join(' ') || '—',
        sub: optLabel[q.search_option] ?? q.search_option,
        kind: 'quote' as const,
        created_at: q.created_at,
        status: q.status,
      };
    });
    const merged = [...cars, ...qs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);
    setRecent(merged);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); onLoggedOut(); };

  const today = new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

  const kpis = [
    {
      label: 'Aktiva auktioner',
      value: stats.activeCars,
      sub: stats.newCars > 0 ? `+${stats.newCars} nya idag` : 'inga nya',
      icon: <CarIcon className="w-5 h-5" />,
      iconCls: 'bg-blue-50 text-blue-600',
      onClick: () => onNavigate('leads'),
    },
    {
      label: 'Bud idag',
      value: stats.bidsToday,
      sub: 'sedan midnatt',
      icon: <Gavel className="w-5 h-5" />,
      iconCls: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Nya förfrågningar',
      value: stats.newQuoteRequests,
      sub: 'väntar på svar',
      icon: <MessageSquareText className="w-5 h-5" />,
      iconCls: 'bg-sky-50 text-sky-600',
      onClick: () => onNavigate('leads'),
    },
    {
      label: 'Handlare',
      value: stats.totalDealers,
      sub: stats.pendingDealers > 0 ? `${stats.pendingDealers} väntar godkännande` : 'alla godkända',
      icon: <Building2 className="w-5 h-5" />,
      iconCls: 'bg-slate-100 text-slate-600',
      onClick: () => onNavigate('handlare'),
    },
  ];

  return (
    <PortalLayout
      navItems={navItems}
      identity="Admin"
      identityRole="Bilto"
      onLogout={handleLogout}
      pageTitle="Översikt"
      headerAction={
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Uppdatera</span>
        </button>
      }
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-7">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">Översikt</h1>
          <p className="text-sm text-slate-400 mt-0.5 capitalize">{today}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map((k) => {
                const Tag = k.onClick ? 'button' : 'div';
                return (
                  <Tag
                    key={k.label}
                    onClick={k.onClick}
                    className={`text-left bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm ${k.onClick ? 'hover:shadow-md hover:border-slate-300 cursor-pointer transition' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.iconCls}`}>
                        {k.icon}
                      </div>
                      {k.onClick && <ArrowRight className="w-3.5 h-3.5 text-slate-300" />}
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums leading-none">{k.value}</div>
                    <div className="text-xs text-slate-400 mt-1.5">{k.label}</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">{k.sub}</div>
                  </Tag>
                );
              })}
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Recent activity */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Senaste aktivitet</span>
                  <button
                    onClick={() => onNavigate('leads')}
                    className="text-xs font-semibold text-[#0e6efe] hover:underline flex items-center gap-1"
                  >
                    Visa alla <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-50">
                  {recent.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-300">Ingen aktivitet ännu</div>
                  ) : (
                    recent.map((item) => (
                      <button
                        key={`${item.kind}-${item.id}`}
                        onClick={() => item.kind === 'car' ? onOpenCar(item.id) : onNavigate('leads')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.kind === 'car' ? 'bg-blue-50 text-blue-500' : 'bg-sky-50 text-sky-500'}`}>
                          {item.kind === 'car'
                            ? <CarIcon className="w-3.5 h-3.5" />
                            : <MessageSquareText className="w-3.5 h-3.5" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{item.label}</div>
                          <div className="text-xs text-slate-400 truncate">{item.sub}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[11px] text-slate-400">{timeAgo(item.created_at)}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Ending soon + quick nav */}
              <div className="space-y-5">

                {/* Ending soon */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Slutar snart
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-50">
                    {endingSoon.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-300">Inga auktioner slutar inom 24 h</div>
                    ) : endingSoon.map((c) => {
                      const ms = new Date(c.auktion_slut).getTime() - Date.now();
                      const urgent = ms < 3 * 3600000;
                      return (
                        <button
                          key={c.id}
                          onClick={() => onOpenCar(c.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition group"
                        >
                          <div className={`w-2 h-6 rounded-full shrink-0 ${urgent ? 'bg-red-400' : 'bg-amber-300'}`} />
                          <span className="flex-1 text-sm font-medium text-slate-800 truncate">{c.label}</span>
                          <span className={`text-xs font-bold tabular-nums shrink-0 ${urgent ? 'text-red-600' : 'text-amber-600'}`}>
                            {fmtTimeLeft(c.auktion_slut)}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Simple nav shortcuts */}
                <div>
                  <div className="mb-2.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Genvägar</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-50">
                    {[
                      {
                        icon: <Users className="w-4 h-4" />,
                        iconCls: 'bg-blue-50 text-blue-600',
                        label: 'Alla leads',
                        sub: 'Sälj, köp och inbyte',
                        onClick: () => onNavigate('leads'),
                      },
                      {
                        icon: <Building2 className="w-4 h-4" />,
                        iconCls: 'bg-slate-100 text-slate-600',
                        label: 'Handlare',
                        sub: `${stats.totalDealers} aktiva${stats.pendingDealers > 0 ? ` · ${stats.pendingDealers} väntar` : ''}`,
                        onClick: () => onNavigate('handlare'),
                        badge: stats.pendingDealers,
                      },
                    ].map((s) => (
                      <button
                        key={s.label}
                        onClick={s.onClick}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.iconCls}`}>
                          {s.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{s.label}</div>
                          <div className="text-xs text-slate-400">{s.sub}</div>
                        </div>
                        {s.badge != null && s.badge > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold shrink-0">
                            {s.badge}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
