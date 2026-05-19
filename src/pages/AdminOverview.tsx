import { useEffect, useState } from 'react';
import {
  LogOut,
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
  Circle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminUserLabel from '../components/AdminUserLabel';

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

const STATUS_META: Record<string, { label: string; dot: string }> = {
  ny: { label: 'Ny', dot: 'bg-sky-400' },
  aktiv: { label: 'Aktiv', dot: 'bg-emerald-400' },
  auktion_avslutad: { label: 'Avslutad', dot: 'bg-slate-400' },
  sald: { label: 'Såld', dot: 'bg-teal-500' },
  avbruten: { label: 'Avbruten', dot: 'bg-red-400' },
  godkand: { label: 'Godkänd', dot: 'bg-emerald-500' },
  paused: { label: 'Pausad', dot: 'bg-amber-400' },
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

  type AlertItem = { key: string; icon: React.ReactNode; color: string; title: string; sub: string; action: (() => void) | undefined };
  const alerts: AlertItem[] = [
    stats.newQuotes > 0 && onNavigateQuotes ? {
      key: 'quotes',
      icon: <MessageSquareText className="w-4 h-4" />,
      color: 'blue',
      title: `${stats.newQuotes} ny${stats.newQuotes === 1 ? '' : 'a'} förfrågning${stats.newQuotes === 1 ? '' : 'ar'} att hantera`,
      sub: 'Öppna förfrågningar och matcha mot handlare',
      action: onNavigateQuotes,
    } : null,
    stats.pendingDealers > 0 ? {
      key: 'dealers',
      icon: <Building2 className="w-4 h-4" />,
      color: 'amber',
      title: `${stats.pendingDealers} handlaransökning${stats.pendingDealers === 1 ? '' : 'ar'} väntar på godkännande`,
      sub: 'Granska och aktivera nya handlare',
      action: onNavigateDealers,
    } : null,
    stats.endingSoon > 0 ? {
      key: 'ending',
      icon: <Clock className="w-4 h-4" />,
      color: 'red',
      title: `${stats.endingSoon} auktion${stats.endingSoon === 1 ? '' : 'er'} slutar inom 24 h`,
      sub: 'Se till att bud är på plats',
      action: onNavigateCars,
    } : null,
  ].filter(Boolean) as AlertItem[];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <header className="bg-[#0e6efe] h-14 sm:h-16 flex items-center px-3 sm:px-5 lg:px-8 sticky top-0 z-20 gap-2">
        <a href="/" className="flex items-center shrink-0">
          <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 sm:h-28 w-auto object-contain" />
        </a>
        <nav className="flex items-center gap-0.5 ml-1 sm:ml-4">
          {[
            { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Översikt', active: true, onClick: undefined },
            { icon: <CarIcon className="w-4 h-4" />, label: 'Bilar', active: false, onClick: onNavigateCars },
            onNavigateLeads ? { icon: <TrendingUp className="w-4 h-4" />, label: 'Leads', active: false, onClick: onNavigateLeads } : null,
            onNavigateQuotes ? { icon: <MessageSquareText className="w-4 h-4" />, label: 'Förfrågningar', active: false, onClick: onNavigateQuotes } : null,
            { icon: <Building2 className="w-4 h-4" />, label: 'Handlare', active: false, onClick: onNavigateDealers },
            onNavigateQuiz ? { icon: <ClipboardList className="w-4 h-4" />, label: 'Quiz', active: false, onClick: onNavigateQuiz } : null,
          ].filter(Boolean).map((item) => item && (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-medium transition ${
                item.active ? 'text-white bg-white/20' : 'text-white/75 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
              {item.label === 'Förfrågningar' && stats.newQuotes > 0 && (
                <span className="hidden sm:inline-flex h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold items-center justify-center">
                  {stats.newQuotes}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <AdminUserLabel />
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logga ut</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6">

        {/* Page title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Översikt</h1>
            <p className="text-sm text-slate-500 mt-1">Realtidsbild av plattformens aktivitet.</p>
          </div>
          <button
            onClick={load}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            Uppdatera
          </button>
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
                  const colorMap = {
                    blue: 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100',
                    amber: 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100',
                    red: 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100',
                  };
                  const iconMap = {
                    blue: 'text-blue-600',
                    amber: 'text-amber-600',
                    red: 'text-red-600',
                  };
                  return (
                    <button
                      key={a.key}
                      onClick={a.action}
                      className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 text-left transition ${colorMap[a.color as keyof typeof colorMap]}`}
                    >
                      <span className={`shrink-0 ${iconMap[a.color as keyof typeof iconMap]}`}>{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{a.title}</div>
                        <div className="text-xs opacity-75 mt-0.5">{a.sub}</div>
                      </div>
                      <ArrowUpRight className={`w-4 h-4 shrink-0 ${iconMap[a.color as keyof typeof iconMap]}`} />
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
                iconBg="bg-[#0e6efe]/10 text-[#0e6efe]"
                onClick={onNavigateCars}
                trend={stats.carsNew > 0 ? `+${stats.carsNew} nya` : undefined}
                trendColor="emerald"
              />
              <KpiCard
                label="Bud idag"
                value={stats.bidsToday}
                icon={<Gavel className="w-4 h-4" />}
                iconBg="bg-emerald-50 text-emerald-600"
              />
              <KpiCard
                label="Förfrågningar"
                value={stats.newQuotes}
                icon={<MessageSquareText className="w-4 h-4" />}
                iconBg="bg-sky-50 text-sky-600"
                onClick={onNavigateQuotes}
                highlight={stats.newQuotes > 0}
              />
              <KpiCard
                label="Handlare"
                value={stats.totalDealers}
                icon={<Building2 className="w-4 h-4" />}
                iconBg="bg-slate-100 text-slate-600"
                onClick={onNavigateDealers}
                trend={stats.pendingDealers > 0 ? `${stats.pendingDealers} väntar` : undefined}
                trendColor="amber"
              />
            </div>

            {/* Secondary stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Totalt bilar', value: stats.carsTotal, icon: <Circle className="w-2.5 h-2.5 fill-slate-400 text-slate-400" /> },
                { label: 'Nya inkomna', value: stats.carsNew, icon: <Circle className="w-2.5 h-2.5 fill-sky-400 text-sky-400" /> },
                { label: 'Dolda för handlare', value: stats.carsHidden, icon: <Circle className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> },
                { label: 'Slutar inom 24 h', value: stats.endingSoon, icon: <Circle className="w-2.5 h-2.5 fill-red-400 text-red-400" /> },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="shrink-0 mt-0.5">{s.icon}</span>
                  <div>
                    <div className="text-[11px] text-slate-500 leading-none">{s.label}</div>
                    <div className="text-lg font-semibold text-slate-900 mt-0.5">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Ending soon — urgency column */}
              <div className="lg:col-span-1">
                <SectionHeader title="Slutar snart" action={<NavLink label="Visa alla" onClick={onNavigateCars} />} />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {ending.length === 0 ? (
                    <EmptyState icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} text="Inga auktioner slutar inom 24 h" />
                  ) : (
                    ending.map((c) => {
                      const ms = new Date(c.auktion_slut).getTime() - now;
                      const urgent = ms < 3 * 3600000;
                      return (
                        <button
                          key={c.id}
                          onClick={() => onOpenCar(c.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition group"
                        >
                          <div className={`w-1.5 h-8 rounded-full shrink-0 ${urgent ? 'bg-red-400' : 'bg-amber-300'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {[c.marke, c.modell].filter(Boolean).join(' ') || c.regnummer}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{c.regnummer}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs font-semibold ${urgent ? 'text-red-600' : 'text-amber-700'}`}>
                              {fmtTimeLeft(c.auktion_slut, now)}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:text-slate-400 transition" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Recent cars — main feed */}
              <div className="lg:col-span-2">
                <SectionHeader title="Senast inkomna bilar" action={<NavLink label="Visa alla" onClick={onNavigateCars} />} />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {recent.length === 0 ? (
                    <EmptyState icon={<CarIcon className="w-5 h-5 text-slate-300" />} text="Inga bilar ännu" />
                  ) : (
                    recent.map((c) => {
                      const meta = STATUS_META[c.status] ?? { label: c.status, dot: 'bg-slate-400' };
                      return (
                        <button
                          key={c.id}
                          onClick={() => onOpenCar(c.id)}
                          className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-slate-50 transition group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <CarIcon className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {[c.marke, c.modell].filter(Boolean).join(' ') || 'Okänd bil'}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-500">{c.regnummer}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs text-slate-400">{fmtDate(c.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            <span className="text-xs text-slate-500">{c.hidden_from_dealers ? 'Dold' : meta.label}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:text-slate-400 transition" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Bottom row: reminders + quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Reminders */}
              <div>
                <SectionHeader
                  title={
                    <span className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-500" />
                      Påminnelser
                    </span>
                  }
                />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
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
                            <div className="text-xs text-slate-500 mt-0.5">{r.cars?.regnummer}</div>
                          </div>
                          <span className={`text-xs font-medium shrink-0 ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
                            {fmtDateTime(r.remind_at)}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:text-slate-400 transition" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div>
                <SectionHeader title="Snabbåtgärder" />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {[
                    { icon: <CarIcon className="w-4 h-4" />, label: 'Alla bilar', sub: `${stats.carsTotal} totalt`, onClick: onNavigateCars, iconBg: 'bg-[#0e6efe]/10 text-[#0e6efe]' },
                    onNavigateLeads ? { icon: <TrendingUp className="w-4 h-4" />, label: 'Lead Command Center', sub: 'Pipeline-översikt', onClick: onNavigateLeads, iconBg: 'bg-emerald-50 text-emerald-600' } : null,
                    onNavigateQuotes ? { icon: <MessageSquareText className="w-4 h-4" />, label: 'Förfrågningar', sub: stats.newQuotes > 0 ? `${stats.newQuotes} ej hanterade` : 'Inga nya', onClick: onNavigateQuotes, iconBg: 'bg-sky-50 text-sky-600' } : null,
                    { icon: <Building2 className="w-4 h-4" />, label: 'Handlare', sub: `${stats.totalDealers} aktiva${stats.pendingDealers > 0 ? ` · ${stats.pendingDealers} väntar` : ''}`, onClick: onNavigateDealers, iconBg: 'bg-slate-100 text-slate-600' },
                    { icon: <Gavel className="w-4 h-4" />, label: 'Aktiva auktioner', sub: `${stats.carsActive} pågår`, onClick: onNavigateCars, iconBg: 'bg-emerald-50 text-emerald-600' },
                    onNavigateQuiz ? { icon: <ClipboardList className="w-4 h-4" />, label: 'Quiz-svar', sub: 'Kundinsikter', onClick: onNavigateQuiz, iconBg: 'bg-slate-100 text-slate-600' } : null,
                    { icon: <Users className="w-4 h-4" />, label: 'Nya bilar att aktivera', sub: `${stats.carsNew} ny${stats.carsNew === 1 ? '' : 'a'}`, onClick: onNavigateCars, iconBg: 'bg-sky-50 text-sky-600' },
                  ].filter(Boolean).map((item) => item && (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition group"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.sub}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:text-slate-400 transition" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function KpiCard({
  label, value, icon, iconBg, onClick, trend, trendColor, highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  onClick?: () => void;
  trend?: string;
  trendColor?: 'emerald' | 'amber' | 'red';
  highlight?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  const trendColors = { emerald: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600' };
  return (
    <Tag
      onClick={onClick}
      className={`text-left bg-white border rounded-xl p-4 sm:p-5 transition ${
        onClick ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : ''
      } ${highlight ? 'border-sky-300 ring-1 ring-sky-200' : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {onClick && <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-none tabular-nums">
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1.5">{label}</div>
      {trend && (
        <div className={`text-[11px] font-semibold mt-1 ${trendColors[trendColor ?? 'emerald']}`}>
          {trend}
        </div>
      )}
    </Tag>
  );
}

function SectionHeader({ title, action }: { title: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
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
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      {icon}
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
