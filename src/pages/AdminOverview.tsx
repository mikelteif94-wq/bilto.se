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
  Sparkles,
  TrendingUp,
  MessageSquareText,
  ClipboardList,
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

export default function AdminOverview({
  onLoggedOut,
  onOpenCar,
  onNavigateCars,
  onNavigateDealers,
  onNavigateQuotes,
  onNavigateQuiz,
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
      total,
      active,
      ny,
      hidden,
      endingCount,
      endingList,
      bidsToday,
      pending,
      dealersTotal,
      recentCars,
      reminderRows,
      newQuotes,
    ] = await Promise.all([
      supabase.from('cars').select('id', { count: 'exact', head: true }),
      supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'aktiv'),
      supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'ny'),
      supabase
        .from('cars')
        .select('id', { count: 'exact', head: true })
        .eq('hidden_from_dealers', true),
      supabase
        .from('cars')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'aktiv')
        .gt('auktion_slut', nowIso)
        .lte('auktion_slut', in24h),
      supabase
        .from('cars')
        .select('id, regnummer, marke, modell, auktion_slut')
        .eq('status', 'aktiv')
        .gt('auktion_slut', nowIso)
        .lte('auktion_slut', in24h)
        .order('auktion_slut', { ascending: true })
        .limit(6),
      supabase
        .from('bids')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString()),
      supabase
        .from('dealers')
        .select('id', { count: 'exact', head: true })
        .eq('godkand', false),
      supabase.from('dealers').select('id', { count: 'exact', head: true }).eq('godkand', true),
      supabase
        .from('cars')
        .select('id, regnummer, marke, modell, status, created_at, hidden_from_dealers')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('car_reminders')
        .select('id, title, remind_at, cars(id, regnummer)')
        .eq('done', false)
        .lte('remind_at', in24h)
        .order('remind_at', { ascending: true })
        .limit(5),
      supabase
        .from('quote_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new'),
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0e6efe] h-14 sm:h-16 flex items-center px-3 sm:px-5 lg:px-8 sticky top-0 z-10 gap-2">
        <a href="/" className="flex items-center shrink-0">
          <img
            src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
            alt="Bilto"
            className="h-20 sm:h-28 w-auto object-contain"
          />
        </a>
        <nav className="flex items-center gap-1 ml-1 sm:ml-4">
          <button className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-medium text-white bg-white/15">
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden xs:inline">Översikt</span>
          </button>
          <button
            onClick={onNavigateCars}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <CarIcon className="w-4 h-4" />
            <span className="hidden xs:inline">Bilar</span>
          </button>
          {onNavigateQuotes && (
            <button
              onClick={onNavigateQuotes}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              <MessageSquareText className="w-4 h-4" />
              <span className="hidden xs:inline">Förfrågningar</span>
            </button>
          )}
          <button
            onClick={onNavigateDealers}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden xs:inline">Handlare</span>
          </button>
          {onNavigateQuiz && (
            <button
              onClick={onNavigateQuiz}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden xs:inline">Quiz</span>
            </button>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <AdminUserLabel />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logga ut</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Översikt</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Realtidsbild av plattformens aktivitet idag.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {stats.newQuotes > 0 && onNavigateQuotes && (
              <button
                onClick={onNavigateQuotes}
                className="w-full flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-left hover:bg-blue-100 transition"
              >
                <MessageSquareText className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-blue-900">
                    {stats.newQuotes} ny{stats.newQuotes === 1 ? '' : 'a'} förfrågning
                    {stats.newQuotes === 1 ? '' : 'ar'} att hantera
                  </div>
                  <div className="text-xs text-blue-700">Klicka för att gå till förfrågningar.</div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-600" />
              </button>
            )}

            {stats.pendingDealers > 0 && (
              <button
                onClick={onNavigateDealers}
                className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left hover:bg-amber-100 transition"
              >
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-amber-900">
                    {stats.pendingDealers} ny{stats.pendingDealers === 1 ? '' : 'a'} handlaransökning
                    {stats.pendingDealers === 1 ? '' : 'ar'} att granska
                  </div>
                  <div className="text-xs text-amber-700">Klicka för att gå till handlare.</div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600" />
              </button>
            )}

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Stat
                label="Aktiva auktioner"
                value={stats.carsActive}
                icon={<CarIcon className="w-4 h-4" />}
                onClick={onNavigateCars}
              />
              <Stat
                label="Slutar inom 24 h"
                value={stats.endingSoon}
                icon={<Clock className="w-4 h-4" />}
                accent={stats.endingSoon > 0 ? 'amber' : undefined}
              />
              <Stat label="Bud idag" value={stats.bidsToday} icon={<Gavel className="w-4 h-4" />} />
              <Stat
                label="Godkända handlare"
                value={stats.totalDealers}
                icon={<Building2 className="w-4 h-4" />}
                onClick={onNavigateDealers}
              />
            </section>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Mini label="Totalt bilar" value={stats.carsTotal} />
              <Mini label="Nya inkomna" value={stats.carsNew} />
              <Mini label="Dolda för handlare" value={stats.carsHidden} />
              <Mini label="Väntar godkännande" value={stats.pendingDealers} />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card
                title="Slutar snart"
                action={
                  <button
                    onClick={onNavigateCars}
                    className="text-xs font-semibold text-[#0e6efe] hover:underline"
                  >
                    Visa alla
                  </button>
                }
              >
                {ending.length === 0 ? (
                  <Empty>Inga auktioner slutar inom 24 timmar.</Empty>
                ) : (
                  ending.map((c) => (
                    <Row
                      key={c.id}
                      onClick={() => onOpenCar(c.id)}
                      primary={[c.marke, c.modell].filter(Boolean).join(' ') || c.regnummer}
                      secondary={c.regnummer}
                      badge={
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                          <Clock className="w-3 h-3" />
                          {fmtTimeLeft(c.auktion_slut, now)}
                        </span>
                      }
                    />
                  ))
                )}
              </Card>

              <Card title="Senast inkomna">
                {recent.length === 0 ? (
                  <Empty>Inga bilar än.</Empty>
                ) : (
                  recent.map((c) => (
                    <Row
                      key={c.id}
                      onClick={() => onOpenCar(c.id)}
                      primary={[c.marke, c.modell].filter(Boolean).join(' ') || c.regnummer}
                      secondary={`${c.regnummer} · ${fmtDate(c.created_at)}`}
                      badge={
                        c.hidden_from_dealers ? (
                          <span className="text-xs font-medium text-slate-500">Dold</span>
                        ) : (
                          <span className="text-xs font-medium text-slate-500">{c.status}</span>
                        )
                      }
                    />
                  ))
                )}
              </Card>

              {reminders.length > 0 && (
                <Card
                  title={
                    <span className="inline-flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-600" />
                      Påminnelser
                    </span>
                  }
                >
                  {reminders.map((r) => (
                    <Row
                      key={r.id}
                      onClick={() => r.cars && onOpenCar(r.cars.id)}
                      primary={r.title}
                      secondary={r.cars?.regnummer ?? ''}
                      badge={
                        <span
                          className={`text-xs font-medium ${
                            new Date(r.remind_at).getTime() < Date.now()
                              ? 'text-red-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {new Date(r.remind_at).toLocaleString('sv-SE', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      }
                    />
                  ))}
                </Card>
              )}

              <Card title="Snabbåtgärder">
                <QuickAction
                  icon={<CarIcon className="w-4 h-4" />}
                  label="Alla bilar"
                  onClick={onNavigateCars}
                />
                {onNavigateQuotes && (
                  <QuickAction
                    icon={<MessageSquareText className="w-4 h-4" />}
                    label="Förfrågningar"
                    onClick={onNavigateQuotes}
                  />
                )}
                <QuickAction
                  icon={<Building2 className="w-4 h-4" />}
                  label="Handlare"
                  onClick={onNavigateDealers}
                />
                <QuickAction
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Aktiva auktioner"
                  onClick={onNavigateCars}
                />
                {onNavigateQuiz && (
                  <QuickAction
                    icon={<ClipboardList className="w-4 h-4" />}
                    label="Quiz-svar"
                    onClick={onNavigateQuiz}
                  />
                )}
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: 'amber';
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`text-left bg-white border border-slate-200 rounded-xl p-4 sm:p-5 ${
        onClick ? 'hover:border-slate-300 hover:shadow-sm transition' : ''
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
        <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
          {icon}
        </span>
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <div
        className={`text-2xl sm:text-3xl font-semibold leading-none ${
          accent === 'amber' && value > 0 ? 'text-amber-700' : 'text-slate-900'
        }`}
      >
        {value}
      </div>
    </Tag>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

function Row({
  primary,
  secondary,
  badge,
  onClick,
}: {
  primary: string;
  secondary: string;
  badge?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition"
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-900 truncate">{primary}</div>
        <div className="text-xs text-slate-500 truncate mt-0.5">{secondary}</div>
      </div>
      {badge}
      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-sm text-slate-500">{children}</p>;
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition"
    >
      <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
        {icon}
      </span>
      <span className="text-sm font-medium text-slate-900 flex-1">{label}</span>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </button>
  );
}
