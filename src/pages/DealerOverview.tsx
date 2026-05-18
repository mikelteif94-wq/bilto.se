import { useEffect, useState } from 'react';
import {
  Loader2,
  LogOut,
  Settings as SettingsIcon,
  Sparkles,
  Clock,
  ChevronRight,
  LayoutDashboard,
  Car as CarIcon,
  Gavel,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatKr, formatTimeLeftSimple } from '../lib/dealer-utils';

interface DealerOverviewProps {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
  onOpenCar: (id: string) => void;
  onAddCar: () => void;
  onNavigateCars: () => void;
  onNavigateSettings: () => void;
}

interface Stats {
  aktiva: number;
  endingSoon: number;
  myBidsCount: number;
  leadingCount: number;
  outbidCount: number;
  wonCount: number;
}

interface CarLite {
  id: string;
  regnummer: string;
  marke: string;
  modell: string;
  ar: number | null;
  miltal: number;
  auktion_slut: string | null;
  status: string;
  car_images: { id: string }[];
}

interface MyBidRow {
  car_id: string;
  belopp: number;
  max_bid: number | null;
  car: CarLite | null;
  highest: number;
  isLeading: boolean;
}

const formatTimeLeft = formatTimeLeftSimple;

export default function DealerOverview({
  dealerId,
  foretagsnamn,
  onLoggedOut,
  onOpenCar,
  onAddCar,
  onNavigateCars,
  onNavigateSettings,
}: DealerOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [stats, setStats] = useState<Stats>({
    aktiva: 0,
    endingSoon: 0,
    myBidsCount: 0,
    leadingCount: 0,
    outbidCount: 0,
    wonCount: 0,
  });
  const [endingCars, setEndingCars] = useState<CarLite[]>([]);
  const [myBids, setMyBids] = useState<MyBidRow[]>([]);
  const [newCars, setNewCars] = useState<CarLite[]>([]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    void load();
  }, [dealerId]);

  const load = async () => {
    setLoading(true);
    const nowIso = new Date().toISOString();
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const [activeRes, endingRes, myBidsRes, wonRes, recentRes] = await Promise.all([
      supabase
        .from('cars')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'aktiv')
        .neq('sales_type', 'brokerage')
        .eq('hidden_from_dealers', false)
        .gt('auktion_slut', nowIso),
      supabase
        .from('cars')
        .select('id, regnummer, marke, modell, ar, miltal, auktion_slut, status, car_images(id)')
        .eq('status', 'aktiv')
        .neq('sales_type', 'brokerage')
        .eq('hidden_from_dealers', false)
        .gt('auktion_slut', nowIso)
        .lte('auktion_slut', in24h)
        .order('auktion_slut', { ascending: true })
        .limit(8),
      supabase
        .from('bids')
        .select(
          'car_id, belopp, max_bid, cars:car_id(id, regnummer, marke, modell, ar, miltal, auktion_slut, status, car_images(id))',
        )
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: false }),
      supabase
        .from('bids')
        .select('id', { count: 'exact', head: true })
        .eq('dealer_id', dealerId)
        .eq('status', 'vinnande'),
      supabase
        .from('cars')
        .select('id, regnummer, marke, modell, ar, miltal, auktion_slut, status, car_images(id)')
        .eq('status', 'aktiv')
        .neq('sales_type', 'brokerage')
        .eq('hidden_from_dealers', false)
        .gt('auktion_slut', nowIso)
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    setEndingCars((endingRes.data ?? []) as unknown as CarLite[]);
    setNewCars((recentRes.data ?? []) as unknown as CarLite[]);

    const myBidRowsRaw = (myBidsRes.data ?? []) as unknown as Array<{
      car_id: string;
      belopp: number;
      max_bid: number | null;
      cars: CarLite | null;
    }>;

    const byCar = new Map<string, { belopp: number; max_bid: number | null; car: CarLite | null }>();
    for (const r of myBidRowsRaw) {
      const cur = byCar.get(r.car_id);
      if (!cur || r.belopp > cur.belopp) {
        byCar.set(r.car_id, { belopp: r.belopp, max_bid: r.max_bid, car: r.cars });
      }
    }

    const carIds = Array.from(byCar.keys());
    let highestByCar: Record<string, number> = {};
    if (carIds.length > 0) {
      const { data: allBids } = await supabase
        .from('bids')
        .select('car_id, belopp')
        .in('car_id', carIds);
      (allBids ?? []).forEach((b) => {
        const cur = highestByCar[b.car_id] ?? 0;
        if (b.belopp > cur) highestByCar[b.car_id] = b.belopp;
      });
    }

    const rows: MyBidRow[] = Array.from(byCar.entries()).map(([carId, v]) => {
      const highest = highestByCar[carId] ?? v.belopp;
      return {
        car_id: carId,
        belopp: v.belopp,
        max_bid: v.max_bid,
        car: v.car,
        highest,
        isLeading: v.belopp >= highest,
      };
    });

    const activeRows = rows.filter(
      (r) => r.car && r.car.status === 'aktiv' && r.car.auktion_slut && new Date(r.car.auktion_slut).getTime() > Date.now(),
    );

    const leading = activeRows.filter((r) => r.isLeading).length;
    const outbid = activeRows.filter((r) => !r.isLeading).length;

    setMyBids(activeRows.slice(0, 8));
    setStats({
      aktiva: activeRes.count ?? 0,
      endingSoon: endingRes.data?.length ?? 0,
      myBidsCount: activeRows.length,
      leadingCount: leading,
      outbidCount: outbid,
      wonCount: wonRes.count ?? 0,
    });

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
            <span className="hidden xs:inline">Aktiva uppdrag</span>
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden lg:inline text-sm font-medium text-white/90 truncate max-w-[200px]">
            {foretagsnamn}
          </span>
          <button
            onClick={onAddCar}
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white text-[#0e6efe] hover:bg-white/90 text-sm font-semibold transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Få bud på en bil
          </button>
          <button
            onClick={onNavigateSettings}
            className="flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition"
            title="Inställningar"
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Inställningar</span>
          </button>
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
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Översikt</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {foretagsnamn ? `Inloggad som ${foretagsnamn}.` : 'Realtidsbild av dina pågående bud.'}
            </p>
          </div>
          <button
            onClick={onAddCar}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold transition shadow-sm shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            Få bud på en bil
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {stats.outbidCount > 0 && (
              <button
                onClick={onNavigateCars}
                className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left hover:bg-amber-100 transition"
              >
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-amber-900">
                    Du är överbjuden på {stats.outbidCount} {stats.outbidCount === 1 ? 'auktion' : 'auktioner'}
                  </div>
                  <div className="text-xs text-amber-700">Klicka för att se och höja dina bud.</div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600" />
              </button>
            )}

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Stat
                label="Aktiva auktioner"
                value={stats.aktiva}
                icon={<CarIcon className="w-4 h-4" />}
                onClick={onNavigateCars}
              />
              <Stat
                label="Slutar inom 24 h"
                value={stats.endingSoon}
                icon={<Clock className="w-4 h-4" />}
                accent={stats.endingSoon > 0 ? 'amber' : undefined}
              />
              <Stat
                label="Mina bud"
                value={stats.myBidsCount}
                icon={<Gavel className="w-4 h-4" />}
              />
              <Stat
                label="Vunna bud"
                value={stats.wonCount}
                icon={<TrendingUp className="w-4 h-4" />}
              />
            </section>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Mini label="Leder" value={stats.leadingCount} accent={stats.leadingCount > 0 ? 'emerald' : undefined} />
              <Mini label="Överbjuden" value={stats.outbidCount} accent={stats.outbidCount > 0 ? 'red' : undefined} />
              <Mini label="Nya bilar" value={newCars.length} />
              <Mini label="Slutar snart" value={endingCars.length} />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card
                title="Slutar snart"
                action={
                  endingCars.length > 0 ? (
                    <button
                      onClick={onNavigateCars}
                      className="text-xs font-semibold text-[#0e6efe] hover:underline"
                    >
                      Visa alla
                    </button>
                  ) : null
                }
              >
                {endingCars.length === 0 ? (
                  <Empty>Inga auktioner slutar inom 24 timmar.</Empty>
                ) : (
                  endingCars.map((c) => (
                    <Row
                      key={c.id}
                      onClick={() => onOpenCar(c.id)}
                      primary={[c.marke, c.modell].filter(Boolean).join(' ') || c.regnummer}
                      secondary={`${c.regnummer} · ${c.ar || '—'} · ${c.miltal.toLocaleString('sv-SE')} mil`}
                      badge={
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                          <Clock className="w-3 h-3" />
                          {formatTimeLeft(c.auktion_slut, now)}
                        </span>
                      }
                    />
                  ))
                )}
              </Card>

              <Card
                title="Mina bud"
                action={
                  stats.myBidsCount > 0 ? (
                    <button
                      onClick={onNavigateCars}
                      className="text-xs font-semibold text-[#0e6efe] hover:underline"
                    >
                      Visa alla
                    </button>
                  ) : null
                }
              >
                {myBids.length === 0 ? (
                  <Empty>Du har inga aktiva bud just nu.</Empty>
                ) : (
                  myBids.map((b) => (
                    <Row
                      key={b.car_id}
                      onClick={() => onOpenCar(b.car_id)}
                      primary={
                        b.car
                          ? [b.car.marke, b.car.modell].filter(Boolean).join(' ') || b.car.regnummer
                          : '—'
                      }
                      secondary={`${b.car?.regnummer ?? ''} · Ditt bud ${formatKr(b.belopp)} kr`}
                      badge={
                        <span
                          className={`text-xs font-medium ${
                            b.isLeading ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {b.isLeading ? 'Leder' : 'Överbjuden'}
                        </span>
                      }
                    />
                  ))
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

function Mini({ label, value, accent }: { label: string; value: number; accent?: 'emerald' | 'red' }) {
  const color =
    accent === 'emerald' && value > 0
      ? 'text-emerald-700'
      : accent === 'red' && value > 0
      ? 'text-red-600'
      : 'text-slate-900';
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-semibold mt-0.5 ${color}`}>{value}</div>
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

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-sm text-slate-500">{children}</p>;
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
