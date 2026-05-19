import { useEffect, useState } from 'react';
import {
  Loader2,
  Car as CarIcon,
  Building2,
  LayoutDashboard,
  ChevronRight,
  Clock,
  Gavel,
  Bell,
  TrendingUp,
  MessageSquareText,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Users,
  ArrowUpRight,
  RefreshCw,
  Flame,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PortalLayout from '../components/PortalLayout';

interface AdminOverviewProps {
  onLoggedOut: () => void;
  onOpenCar: (id: string) => void;
  onNavigateCars: () => void;
  onNavigateDealers: () => void;
  onNavigateQuotes?: () => void;
  onNavigateQuiz?: () => void;
  onNavigateLeads?: () => void;
}

interface Stats {
  carsTotal: number;
  carsActive: number;
  carsNew: number;
  carsHidden: number;
  endingSoon: number;
  bidsToday: number;
  pendingDealers: number;
  totalDealers: number;
  newQuotes: number;
}

interface RecentCar {
  id: string;
  regnummer: string;
  marke: string | null;
  modell: string | null;
  status: string;
  created_at: string;
  hidden_from_dealers: boolean | null;
}

interface EndingCar {
  id: string;
  regnummer: string;
  marke: string | null;
  modell: string | null;
  auktion_slut: string;
}

interface Reminder {
  id: string;
  title: string;
  remind_at: string;
  cars: { id: string; regnummer: string } | null;
}

function fmtTimeLeft(iso: string, now: number) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return 'slutar nu';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)} d ${h % 24} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: '2-digit', month: 'short' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
}

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  ny: { label: 'Ny', bg: 'bg-sky-50', text: 'text-sky-700' },
  aktiv: { label: 'Aktiv', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  auktion_avslutad: { label: 'Avslutad', bg: 'bg-slate-100', text: 'text-slate-500' },
  sald: { label: 'Såld', bg: 'bg-teal-50', text: 'text-teal-700' },
  avbruten: { label: 'Avbruten', bg: 'bg-red-50', text: 'text-red-600' },
  godkand: { label: 'Godkänd', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  paused: { label: 'Pausad', bg: 'bg-amber-50', text: 'text-amber-700' },
};

export default function AdminOverview({
  onLoggedOut,
  onOpenCar,
  onNavigateCars,
  onNavigateDealers,
  onNavigateQuotes,
  onNavigateQuiz,
  onNavigateLeads,
}: AdminOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    carsTotal: 0,
    carsActive: 0,
    carsNew: 0,
    carsHidden: 0,
    endingSoon: 0,
    bidsToday: 0,
    pendingDealers: 0,
    totalDealers: 0,
    newQuotes: 0,
  });
  const [recent, setRecent] = useState<RecentCar[]>([]);
  const [ending, setEnding] = useState<EndingCar[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    const nowIso = new Date().toISOString();
    const in24h = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      total, active, ny, hidden, endingCount, endingList,
      bidsToday, pending, dealersTotal, recentCars, reminderRows, newQuotes,
    ] = await Promise.all([
      supabase.from('cars').select('id', { count: 'exact', head: true }),
      supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'aktiv'),
      supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'ny'),
      supabase.from('cars').select('id', { count: 'exact', head: true }).eq('hidden_from_dealers', true),
      supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'aktiv').gt('auktion_slut', nowIso).lte('auktion_slut', in24h),
      supabase.from('cars').select('id, regnummer, marke, modell, auktion_slut').eq('status', 'aktiv').gt('auktion_slut', nowIso).lte('auktion_slut', in24h).order('auktion_slut', { ascending: true }).limit(6),
      supabase.from('bids').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay.toISOString()),
      supabase.from('dealers').select('id', { count: 'exact', head: true }).eq('godkand', false),
      supabase.from('dealers').select('id', { count: 'exact', head: true }).eq('godkand', true),
      supabase.from('cars').select('id, regnummer, marke, modell, status, created_at, hidden_from_dealers').order('created_at', { ascending: false }).limit(8),
      supabase.from('car_reminders').select('id, title, remind_at, cars(id, regnummer)').eq('done', false).lte('remind_at', in24h).order('remind_at', { ascending: true }).limit(5),
      supabase.from('quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    ]);

    setStats({
      carsTotal: total.count ?? 0,
      carsActive: active.count ?? 0,
      carsNew: ny.count ?? 0,
      carsHidden: hidden.count ?? 0,
      endingSoon: endingCount.count ?? 0,
      bidsToday: bidsToday.count ?? 0,
      pendingDealers: pending.count ?? 0,
      totalDealers: dealersTotal.count ?? 0,
      newQuotes: newQuotes.count ?? 0,
    });
    setEnding((endingList.data ?? []) as EndingCar[]);
    setRecent((recentCars.data ?? []) as RecentCar[]);
    setReminders((reminderRows.data ?? []) as unknown as Reminder[]);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  type AlertItem = { key: string; icon: React.ReactNode; color: 'blue' | 'amber' | 'red'; title: string; sub: string; action: (() => void) | undefined };
  const alerts: AlertItem[] = [
    stats.newQuotes > 0 && onNavigateQuotes ? {
      key: 'quotes',
      icon: <MessageSquareText className="w-4 h-4" />,
      color: 'blue' as const,
      title: `${stats.newQuotes} ny${stats.newQuotes === 1 ? '' : 'a'} förfrågning${stats.newQuotes === 1 ? '' : 'ar'} att hantera`,
      sub: 'Öppna förfrågningar och matcha mot handlare',
      action: onNavigateQuotes,
    } : null,
    stats.pendingDealers > 0 ? {
      key: 'dealers',
      icon: <Building2 className="w-4 h-4" />,
      color: 'amber' as const,
      title: `${stats.pendingDealers} handlaransökning${stats.pendingDealers === 1 ? '' : 'ar'} väntar på godkännande`,
      sub: 'Granska och aktivera nya handlare',
      action: onNavigateDealers,
    } : null,
    stats.endingSoon > 0 ? {
      key: 'ending',
      icon: <Clock className="w-4 h-4" />,
      color: 'red' as const,
      title: `${stats.endingSoon} auktion${stats.endingSoon === 1 ? '' : 'er'} slutar inom 24 h`,
      sub: 'Se till att bud är på plats',
      action: onNavigateCars,
    } : null,
  ].filter(Boolean) as AlertItem[];

  const adminNavItems = [
    { icon: <LayoutDashboard className="w-[18px] h-[18px]" />, label: 'Översikt', active: true },
    { icon: <CarIcon className="w-[18px] h-[18px]" />, label: 'Bilar', onClick: onNavigateCars },
    ...(onNavigateLeads ? [{ icon: <TrendingUp className="w-[18px] h-[18px]" />, label: 'Leads', onClick: onNavigateLeads }] : []),
    ...(onNavigateQuotes ? [{ icon: <MessageSquareText className="w-[18px] h-[18px]" />, label: 'Förfrågningar', onClick: onNavigateQuotes, badge: stats.newQuotes }] : []),
    { icon: <Building2 className="w-[18px] h-[18px]" />, label: 'Handlare', onClick: onNavigateDealers },
    ...(onNavigateQuiz ? [{ icon: <ClipboardList className="w-[18px] h-[18px]" />, label: 'Quiz', onClick: onNavigateQuiz }] : []),
  ];

  const today = new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <PortalLayout
      navItems={adminNavItems}
      identity="Admin"
      identityRole="Bilto"
      onLogout={handleLogout}
      pageTitle="Översikt"
      headerAction={
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Uppdatera</span>
        </button>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Översikt</h1>
          <p className="text-sm text-slate-400 mt-0.5 capitalize">{today}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-7 h-7 animate-spin text-slate-300" />
          </div>
        ) : (
          <>
            {/* Alert banners */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                {alerts.map((a) => {
                  const styles = {
                    blue: { wrap: 'bg-blue-50 border-blue-200 hover:bg-blue-100', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-900', sub: 'text-blue-700/70', arrow: 'text-blue-500' },
                    amber: { wrap: 'bg-amber-50 border-amber-200 hover:bg-amber-100', icon: 'bg-amber-100 text-amber-600', text: 'text-amber-900', sub: 'text-amber-700/70', arrow: 'text-amber-500' },
                    red: { wrap: 'bg-red-50 border-red-200 hover:bg-red-100', icon: 'bg-red-100 text-red-600', text: 'text-red-900', sub: 'text-red-700/70', arrow: 'text-red-500' },
                  }[a.color];
                  return (
                    <button
                      key={a.key}
                      onClick={a.action}
                      className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3.5 text-left transition ${styles.wrap}`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${styles.icon}`}>
                        {a.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${styles.text}`}>{a.title}</div>
                        <div className={`text-xs mt-0.5 ${styles.sub}`}>{a.sub}</div>
                      </div>
                      <ArrowUpRight className={`w-4 h-4 shrink-0 ${styles.arrow}`} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Primary KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard
                label="Aktiva auktioner"
                value={stats.carsActive}
                icon={<CarIcon className="w-4 h-4" />}
                color="blue"
                onClick={onNavigateCars}
                badge={stats.carsNew > 0 ? `+${stats.carsNew} nya` : undefined}
                badgeColor="emerald"
              />
              <KpiCard
                label="Bud idag"
                value={stats.bidsToday}
                icon={<Gavel className="w-4 h-4" />}
                color="emerald"
              />
              <KpiCard
                label="Förfrågningar"
                value={stats.newQuotes}
                icon={<MessageSquareText className="w-4 h-4" />}
                color="sky"
                onClick={onNavigateQuotes}
                highlight={stats.newQuotes > 0}
              />
              <KpiCard
                label="Godkända handlare"
                value={stats.totalDealers}
                icon={<Building2 className="w-4 h-4" />}
                color="slate"
                onClick={onNavigateDealers}
                badge={stats.pendingDealers > 0 ? `${stats.pendingDealers} väntar` : undefined}
                badgeColor="amber"
              />
            </div>

            {/* Secondary stats — single card with dividers */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {[
                  { label: 'Totalt bilar', value: stats.carsTotal, icon: <CarIcon className="w-3.5 h-3.5" />, iconCls: 'text-slate-400' },
                  { label: 'Nya inkomna', value: stats.carsNew, icon: <Zap className="w-3.5 h-3.5" />, iconCls: 'text-sky-500' },
                  { label: 'Dolda för handlare', value: stats.carsHidden, icon: <AlertTriangle className="w-3.5 h-3.5" />, iconCls: 'text-amber-500' },
                  { label: 'Slutar inom 24 h', value: stats.endingSoon, icon: <Flame className="w-3.5 h-3.5" />, iconCls: 'text-red-500' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3 px-5 py-4">
                    <span className={s.iconCls}>{s.icon}</span>
                    <div>
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">{s.label}</div>
                      <div className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Ending soon */}
              <div>
                <SectionLabel text="Slutar snart" action={<NavLink label="Visa alla" onClick={onNavigateCars} />} />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                  {ending.length === 0 ? (
                    <EmptyState icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} text="Inga auktioner slutar inom 24 h" />
                  ) : (
                    ending.map((c) => {
                      const ms = new Date(c.auktion_slut).getTime() - now;
                      const critical = ms < 3600000;
                      const urgent = ms < 3 * 3600000;
                      return (
                        <button
                          key={c.id}
                          onClick={() => onOpenCar(c.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition group"
                        >
                          <div className="relative shrink-0">
                            <div className={`w-2 h-8 rounded-full ${critical ? 'bg-red-400' : urgent ? 'bg-amber-400' : 'bg-slate-200'}`} />
                            {critical && <div className="absolute inset-0 w-2 rounded-full bg-red-400 animate-pulse" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {[c.marke, c.modell].filter(Boolean).join(' ') || c.regnummer}
                            </div>
                            <div className="text-xs font-mono text-slate-400 mt-0.5">{c.regnummer}</div>
                          </div>
                          <span className={`text-xs font-bold shrink-0 tabular-nums ${critical ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-slate-500'}`}>
                            {fmtTimeLeft(c.auktion_slut, now)}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition shrink-0" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Recent cars */}
              <div className="lg:col-span-2">
                <SectionLabel text="Senast inkomna bilar" action={<NavLink label="Visa alla" onClick={onNavigateCars} />} />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                  {recent.length === 0 ? (
                    <EmptyState icon={<CarIcon className="w-5 h-5 text-slate-300" />} text="Inga bilar ännu" />
                  ) : (
                    recent.map((c) => {
                      const meta = STATUS_META[c.status] ?? { label: c.status, bg: 'bg-slate-100', text: 'text-slate-500' };
                      const label = c.hidden_from_dealers ? 'Dold' : meta.label;
                      const labelBg = c.hidden_from_dealers ? 'bg-amber-50' : meta.bg;
                      const labelTxt = c.hidden_from_dealers ? 'text-amber-700' : meta.text;
                      return (
                        <button
                          key={c.id}
                          onClick={() => onOpenCar(c.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <CarIcon className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {[c.marke, c.modell].filter(Boolean).join(' ') || 'Okänd bil'}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono text-slate-400">{c.regnummer}</span>
                              <span className="text-slate-200">·</span>
                              <span className="text-xs text-slate-400">{fmtDate(c.created_at)}</span>
                            </div>
                          </div>
                          <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${labelBg} ${labelTxt}`}>
                            {label}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition shrink-0" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Bottom row: reminders + quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Reminders */}
              <div>
                <SectionLabel text="Påminnelser" icon={<Bell className="w-3.5 h-3.5 text-amber-500" />} />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                  {reminders.length === 0 ? (
                    <EmptyState icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} text="Inga påminnelser de närmaste 24 h" />
                  ) : (
                    reminders.map((r) => {
                      const overdue = new Date(r.remind_at).getTime() < Date.now();
                      return (
                        <button
                          key={r.id}
                          onClick={() => r.cars && onOpenCar(r.cars.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition group"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${overdue ? 'bg-red-50' : 'bg-amber-50'}`}>
                            <AlertTriangle className={`w-4 h-4 ${overdue ? 'text-red-500' : 'text-amber-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">{r.title}</div>
                            <div className="text-xs font-mono text-slate-400 mt-0.5">{r.cars?.regnummer}</div>
                          </div>
                          <span className={`text-xs font-medium shrink-0 ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
                            {fmtDateTime(r.remind_at)}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition shrink-0" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div>
                <SectionLabel text="Snabbåtgärder" icon={<Zap className="w-3.5 h-3.5 text-slate-400" />} />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                  {[
                    { icon: <CarIcon className="w-4 h-4" />, label: 'Alla bilar', sub: `${stats.carsTotal} totalt`, onClick: onNavigateCars, iconBg: 'bg-[#0e6efe]/10 text-[#0e6efe]', badge: 0 },
                    onNavigateLeads ? { icon: <TrendingUp className="w-4 h-4" />, label: 'Lead Command Center', sub: 'Pipeline-översikt', onClick: onNavigateLeads, iconBg: 'bg-emerald-50 text-emerald-600', badge: 0 } : null,
                    onNavigateQuotes ? { icon: <MessageSquareText className="w-4 h-4" />, label: 'Förfrågningar', sub: stats.newQuotes > 0 ? `${stats.newQuotes} ej hanterade` : 'Inga nya', onClick: onNavigateQuotes, iconBg: 'bg-sky-50 text-sky-600', badge: stats.newQuotes } : null,
                    { icon: <Building2 className="w-4 h-4" />, label: 'Handlare', sub: `${stats.totalDealers} aktiva${stats.pendingDealers > 0 ? ` · ${stats.pendingDealers} väntar` : ''}`, onClick: onNavigateDealers, iconBg: 'bg-slate-100 text-slate-600', badge: stats.pendingDealers },
                    { icon: <Gavel className="w-4 h-4" />, label: 'Aktiva auktioner', sub: `${stats.carsActive} pågår`, onClick: onNavigateCars, iconBg: 'bg-emerald-50 text-emerald-600', badge: 0 },
                    onNavigateQuiz ? { icon: <ClipboardList className="w-4 h-4" />, label: 'Quiz-svar', sub: 'Kundinsikter', onClick: onNavigateQuiz, iconBg: 'bg-slate-100 text-slate-600', badge: 0 } : null,
                    { icon: <Users className="w-4 h-4" />, label: 'Nya bilar att aktivera', sub: `${stats.carsNew} ny${stats.carsNew === 1 ? '' : 'a'}`, onClick: onNavigateCars, iconBg: 'bg-sky-50 text-sky-600', badge: stats.carsNew },
                  ].filter(Boolean).map((item) => item && (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.sub}</div>
                      </div>
                      {item.badge > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#0e6efe] text-white text-[10px] font-bold shrink-0">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}

type KpiColor = 'blue' | 'emerald' | 'sky' | 'slate' | 'amber' | 'red';

const KPI_STYLES: Record<KpiColor, { icon: string; top: string }> = {
  blue:    { icon: 'bg-[#0e6efe]/10 text-[#0e6efe]', top: 'bg-[#0e6efe]' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600',  top: 'bg-emerald-500' },
  sky:     { icon: 'bg-sky-50 text-sky-600',          top: 'bg-sky-500' },
  slate:   { icon: 'bg-slate-100 text-slate-600',     top: 'bg-slate-400' },
  amber:   { icon: 'bg-amber-50 text-amber-600',      top: 'bg-amber-400' },
  red:     { icon: 'bg-red-50 text-red-600',          top: 'bg-red-500' },
};

const BADGE_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  amber:   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  red:     'bg-red-50 text-red-700 ring-1 ring-red-200',
  blue:    'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
};

function KpiCard({
  label, value, icon, color, onClick, badge, badgeColor, highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: KpiColor;
  onClick?: () => void;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
}) {
  const s = KPI_STYLES[color];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`relative text-left bg-white border rounded-xl overflow-hidden transition shadow-sm ${
        onClick ? 'hover:shadow-md cursor-pointer' : ''
      } ${highlight ? 'border-sky-300 ring-1 ring-sky-200' : 'border-slate-200'}`}
    >
      <div className={`h-0.5 w-full ${s.top}`} />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.icon}`}>{icon}</div>
          {onClick && <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />}
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-none tabular-nums">{value}</div>
        <div className="text-xs text-slate-500 mt-1.5 leading-snug">{label}</div>
        {badge && badgeColor && (
          <div className={`inline-flex items-center mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${BADGE_COLORS[badgeColor] ?? BADGE_COLORS.emerald}`}>
            {badge}
          </div>
        )}
      </div>
    </Tag>
  );
}

function SectionLabel({ text, icon, action }: { text: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{text}</span>
      </div>
      {action}
    </div>
  );
}

function NavLink({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="text-xs font-semibold text-[#0e6efe] hover:underline">
      {label}
    </button>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-4 py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}
