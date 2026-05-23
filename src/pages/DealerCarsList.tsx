import { useEffect, useState } from 'react';
import {
  Loader2, ChevronRight, Image as ImageIcon, Clock,
  Settings as SettingsIcon, Sparkles, LayoutDashboard, Car as CarIcon,
  Zap, CheckCircle2, X, Package,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import ErrorBanner from '../components/ErrorBanner';
import { SKICK_LABELS, formatKr, formatTimeLeftSimple } from '../lib/dealer-utils';
import PortalLayout from '../components/PortalLayout';
import { QualityBadgeList } from '../components/QualityBadges';

interface DealerCarsListProps {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
  onOpenCar: (id: string) => void;
  onAddCar: () => void;
  onNavigateOverview?: () => void;
  onNavigateSettings?: () => void;
  onNavigateInventory?: () => void;
}

type Car = Database['public']['Tables']['cars']['Row'];

interface CarRow extends Car {
  car_images: { id: string }[];
  quality_badges: string[] | null;
}

interface QuickBidState {
  carId: string;
  value: string;
  submitting: boolean;
  error: string | null;
  success: boolean;
}

const formatTimeLeft = formatTimeLeftSimple;

export default function DealerCarsList({
  dealerId,
  foretagsnamn,
  onLoggedOut,
  onOpenCar,
  onAddCar,
  onNavigateOverview,
  onNavigateSettings,
  onNavigateInventory,
}: DealerCarsListProps) {
  const [cars, setCars] = useState<CarRow[]>([]);
  const [bidsByCar, setBidsByCar] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [quickBid, setQuickBid] = useState<QuickBidState | null>(null);
  const [avgResponse, setAvgResponse] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    void loadData();
  }, [dealerId]);

  const loadData = async () => {
    setLoading(true);
    const nowIso = new Date().toISOString();

    const [{ data: carData, error: carErr }, { data: dealerData }] = await Promise.all([
      supabase
        .from('cars')
        .select('*, car_images(id), quality_badges')
        .eq('status', 'aktiv')
        .eq('hidden_from_dealers', false)
        .gt('auktion_slut', nowIso)
        .order('auktion_slut', { ascending: true }),
      supabase
        .from('dealers')
        .select('avg_response_minutes, tier, bilto_score')
        .eq('id', dealerId)
        .maybeSingle(),
    ]);

    if (carErr) {
      setError('Kunde inte hämta bilar.');
      setLoading(false);
      return;
    }

    if (dealerData?.avg_response_minutes) {
      setAvgResponse(dealerData.avg_response_minutes);
    }

    const rows = (carData ?? []) as CarRow[];
    setCars(rows);

    if (rows.length > 0) {
      const { data: bidData } = await supabase
        .from('bids')
        .select('car_id, belopp')
        .eq('dealer_id', dealerId)
        .in('car_id', rows.map((r) => r.id));

      const map: Record<string, number> = {};
      (bidData ?? []).forEach((b) => {
        const cur = map[b.car_id] ?? 0;
        if (b.belopp > cur) map[b.car_id] = b.belopp;
      });
      setBidsByCar(map);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  const openQuickBid = (carId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentBid = bidsByCar[carId] ?? 0;
    setQuickBid({
      carId,
      value: currentBid > 0 ? String(currentBid + 1000) : '',
      submitting: false,
      error: null,
      success: false,
    });
  };

  const submitQuickBid = async (car: CarRow) => {
    if (!quickBid) return;
    const amount = parseInt(quickBid.value.replace(/\s/g, ''), 10);
    if (!amount || amount <= 0) {
      setQuickBid((q) => q ? { ...q, error: 'Ogiltigt belopp' } : null);
      return;
    }
    const currentBid = bidsByCar[car.id] ?? 0;
    if (amount <= currentBid) {
      setQuickBid((q) => q ? { ...q, error: `Måste vara över ${formatKr(currentBid)} kr` } : null);
      return;
    }
    if (car.startbud != null && amount < car.startbud) {
      setQuickBid((q) => q ? { ...q, error: `Minst ${formatKr(car.startbud!)} kr (startbud)` } : null);
      return;
    }
    setQuickBid((q) => q ? { ...q, submitting: true, error: null } : null);
    const { error: insErr } = await supabase.from('bids').insert({
      car_id: car.id,
      dealer_id: dealerId,
      belopp: amount,
    });
    if (insErr) {
      setQuickBid((q) => q ? { ...q, submitting: false, error: 'Kunde inte spara budet' } : null);
      return;
    }
    setBidsByCar((prev) => ({ ...prev, [car.id]: amount }));
    setQuickBid((q) => q ? { ...q, submitting: false, success: true } : null);
    setTimeout(() => setQuickBid(null), 1800);
  };

  const responseLabel = avgResponse != null
    ? avgResponse < 60
      ? { text: `Svarstid: ${avgResponse}m`, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      : avgResponse < 240
      ? { text: `Svarstid: ${Math.round(avgResponse / 60)}h`, cls: 'bg-amber-50 text-amber-700 border-amber-200' }
      : { text: `Svarstid: ${Math.round(avgResponse / 60)}h`, cls: 'bg-red-50 text-red-700 border-red-200' }
    : null;

  const navItems = [
    ...(onNavigateOverview ? [{ icon: <LayoutDashboard className="w-[18px] h-[18px]" />, label: 'Översikt', onClick: onNavigateOverview }] : []),
    { icon: <CarIcon className="w-[18px] h-[18px]" />, label: 'Aktiva uppdrag', active: true },
    ...(onNavigateInventory ? [{ icon: <Package className="w-[18px] h-[18px]" />, label: 'Lager', onClick: onNavigateInventory }] : []),
    ...(onNavigateSettings ? [{ icon: <SettingsIcon className="w-[18px] h-[18px]" />, label: 'Inställningar', onClick: onNavigateSettings }] : []),
  ];

  const headerAction = (
    <button
      onClick={onAddCar}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-sm font-semibold transition shadow-sm"
    >
      <Sparkles className="w-4 h-4" />
      <span className="hidden sm:inline">Få bud på en bil</span>
    </button>
  );

  return (
    <PortalLayout
      navItems={navItems}
      identity={foretagsnamn}
      identityRole="Handlare"
      onLogout={handleLogout}
      headerAction={headerAction}
      pageTitle="Aktiva uppdrag"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Aktiva uppdrag
              {!loading && (
                <span className="ml-2 text-base font-medium text-slate-400">
                  ({cars.length})
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Bilar du kan lägga bud på just nu.
            </p>
          </div>
          {/* Response time pill */}
          {responseLabel && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${responseLabel.cls}`}>
              <Clock className="w-3 h-3" />
              {responseLabel.text}
              <span className="text-[10px] font-normal opacity-70 hidden sm:inline">— din genomsnittliga svarstid</span>
            </div>
          )}
        </div>

        {/* Speed tip banner — shown when dealer has no bids */}
        {!loading && cars.length > 0 && Object.keys(bidsByCar).length === 0 && (
          <div className="flex items-center gap-3 bg-[#0e6efe]/5 border border-[#0e6efe]/20 rounded-xl px-4 py-3">
            <Zap className="w-4 h-4 text-[#0e6efe] shrink-0" />
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-[#0e6efe]">Snabb start:</span>{' '}
              Klicka på blixtsymbolen i listan för att lägga snabbud direkt — utan att öppna bilen.
            </p>
          </div>
        )}

        <ErrorBanner message={error} className="mb-6" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : cars.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-slate-500">Inga aktiva auktioner just nu.</p>
          </div>
        ) : (
          <>
            {/* ── Mobile cards ── */}
            <div className="md:hidden space-y-3">
              {cars.map((car) => {
                const bilder = car.car_images?.length ?? 0;
                const myBid = bidsByCar[car.id];
                const timeLeft = formatTimeLeft(car.auktion_slut, now);
                const ending = car.auktion_slut ? new Date(car.auktion_slut).getTime() - now : null;
                const warn = ending !== null && ending > 0 && ending < 2 * 60 * 60 * 1000;
                const isQuickBidOpen = quickBid?.carId === car.id;

                return (
                  <div key={car.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => !isQuickBidOpen && onOpenCar(car.id)}
                      className="w-full text-left p-4 active:bg-slate-50 transition"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-mono font-bold text-slate-900 tracking-wider text-base">{car.regnummer}</h3>
                          {(car.marke || car.modell) && (
                            <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">
                              {[car.marke, car.modell].filter(Boolean).join(' ')}
                            </p>
                          )}
                          {car.quality_badges && car.quality_badges.length > 0 && (
                            <div className="mt-1">
                              <QualityBadgeList badges={car.quality_badges} size="sm" />
                            </div>
                          )}
                          <p className="text-xs text-slate-500 mt-0.5">
                            {car.ar || '—'} · {car.miltal.toLocaleString('sv-SE')} mil · {SKICK_LABELS[car.skick] ?? car.skick}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                          {bilder} bilder
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${
                          timeLeft === 'Slut' ? 'bg-slate-100 text-slate-600 ring-slate-200'
                          : warn ? 'bg-red-50 text-red-700 ring-red-200'
                          : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {timeLeft}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm">
                          {myBid
                            ? <span className="font-semibold text-slate-900">Ditt bud: {formatKr(myBid)} kr</span>
                            : <span className="text-slate-400">Inget bud</span>
                          }
                        </span>
                      </div>
                    </button>

                    {/* Quick bid row on mobile */}
                    <div className="border-t border-slate-100 px-4 py-2">
                      {isQuickBidOpen ? (
                        <QuickBidForm
                          quickBid={quickBid!}
                          onChange={(v) => setQuickBid((q) => q ? { ...q, value: v, error: null } : null)}
                          onSubmit={() => submitQuickBid(car)}
                          onClose={() => setQuickBid(null)}
                        />
                      ) : (
                        <button
                          onClick={(e) => openQuickBid(car.id, e)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#0e6efe] hover:text-[#0a57cc] py-1 transition"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Snabbud
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden md:block bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <Th>Regnummer</Th>
                      <Th>År</Th>
                      <Th>Miltal</Th>
                      <Th>Skick</Th>
                      <Th>Bilder</Th>
                      <Th>Ditt högsta bud</Th>
                      <Th>Tid kvar</Th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#0e6efe] whitespace-nowrap">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" />Snabbud</span>
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {cars.map((car) => {
                      const bilder = car.car_images?.length ?? 0;
                      const myBid = bidsByCar[car.id];
                      const timeLeft = formatTimeLeft(car.auktion_slut, now);
                      const ending = car.auktion_slut ? new Date(car.auktion_slut).getTime() - now : null;
                      const warn = ending !== null && ending > 0 && ending < 2 * 60 * 60 * 1000;
                      const isQuickBidOpen = quickBid?.carId === car.id;

                      return (
                        <tr
                          key={car.id}
                          onClick={() => !isQuickBidOpen && onOpenCar(car.id)}
                          className={`border-b border-slate-100 last:border-0 transition group ${isQuickBidOpen ? 'bg-blue-50/40' : 'hover:bg-slate-50 cursor-pointer'}`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-mono font-bold text-slate-900 tracking-wider">{car.regnummer}</div>
                            {(car.marke || car.modell) && (
                              <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">
                                {[car.marke, car.modell].filter(Boolean).join(' ')}
                              </div>
                            )}
                            {car.quality_badges && car.quality_badges.length > 0 && (
                              <div className="mt-1">
                                <QualityBadgeList badges={car.quality_badges} size="sm" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{car.ar || '—'}</td>
                          <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{car.miltal.toLocaleString('sv-SE')} mil</td>
                          <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{SKICK_LABELS[car.skick] ?? car.skick}</td>
                          <td className="px-6 py-4 text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                              {bilder}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {myBid
                              ? <span className="font-semibold text-slate-900">{formatKr(myBid)} kr</span>
                              : <span className="text-slate-400">Inget bud</span>
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${
                              timeLeft === 'Slut' ? 'bg-slate-100 text-slate-600 ring-slate-200'
                              : warn ? 'bg-red-50 text-red-700 ring-red-200'
                              : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {timeLeft}
                            </span>
                          </td>
                          {/* Quick bid cell */}
                          <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {isQuickBidOpen ? (
                              <QuickBidForm
                                quickBid={quickBid!}
                                onChange={(v) => setQuickBid((q) => q ? { ...q, value: v, error: null } : null)}
                                onSubmit={() => submitQuickBid(car)}
                                onClose={() => setQuickBid(null)}
                                compact
                              />
                            ) : (
                              <button
                                onClick={(e) => openQuickBid(car.id, e)}
                                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[#0e6efe]/30 bg-[#0e6efe]/5 text-[#0e6efe] text-xs font-semibold hover:bg-[#0e6efe]/10 transition"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                Bud
                              </button>
                            )}
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

/* ── Quick Bid Form ── */
function QuickBidForm({
  quickBid, onChange, onSubmit, onClose, compact = false,
}: {
  quickBid: QuickBidState;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  compact?: boolean;
}) {
  if (quickBid.success) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold py-1">
        <CheckCircle2 className="w-4 h-4" />
        Bud sparat!
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap'}`}>
      <div className="relative">
        <input
          autoFocus
          type="text"
          value={quickBid.value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); if (e.key === 'Escape') onClose(); }}
          placeholder="Belopp"
          className={`${compact ? 'w-28' : 'w-32'} h-8 pl-3 pr-7 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 ${
            quickBid.error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
          }`}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">kr</span>
      </div>
      <button
        onClick={onSubmit}
        disabled={quickBid.submitting}
        className="h-8 px-3 rounded-lg bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1"
      >
        {quickBid.submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
        {quickBid.submitting ? '' : 'Lägg'}
      </button>
      <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition">
        <X className="w-3.5 h-3.5" />
      </button>
      {quickBid.error && (
        <p className="text-xs text-red-600 w-full mt-0.5">{quickBid.error}</p>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-semibold text-slate-600 px-6 py-3 whitespace-nowrap">
      {children}
    </th>
  );
}
