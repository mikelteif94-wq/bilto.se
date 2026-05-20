import { useEffect, useState } from 'react';
import { Loader2, ChevronRight, Image as ImageIcon, Clock, Settings as SettingsIcon, Sparkles, LayoutDashboard, Car as CarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import ErrorBanner from '../components/ErrorBanner';
import { SKICK_LABELS, formatKr, formatTimeLeftSimple } from '../lib/dealer-utils';
import PortalLayout from '../components/PortalLayout';

interface DealerCarsListProps {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
  onOpenCar: (id: string) => void;
  onAddCar: () => void;
  onNavigateOverview?: () => void;
  onNavigateSettings?: () => void;
}

type Car = Database['public']['Tables']['cars']['Row'];

interface CarRow extends Car {
  car_images: { id: string }[];
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
}: DealerCarsListProps) {
  const [cars, setCars] = useState<CarRow[]>([]);
  const [bidsByCar, setBidsByCar] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();
      const { data: carData, error: carErr } = await supabase
        .from('cars')
        .select('*, car_images(id)')
        .eq('status', 'aktiv')
        .eq('hidden_from_dealers', false)
        .gt('auktion_slut', nowIso)
        .order('auktion_slut', { ascending: true });

      if (carErr) {
        setError('Kunde inte hämta bilar.');
        setLoading(false);
        return;
      }

      const rows = (carData ?? []) as CarRow[];
      setCars(rows);

      if (rows.length > 0) {
        const { data: bidData } = await supabase
          .from('bids')
          .select('car_id, belopp')
          .eq('dealer_id', dealerId)
          .in(
            'car_id',
            rows.map((r) => r.id),
          );

        const map: Record<string, number> = {};
        (bidData ?? []).forEach((b) => {
          const cur = map[b.car_id] ?? 0;
          if (b.belopp > cur) map[b.car_id] = b.belopp;
        });
        setBidsByCar(map);
      }

      setLoading(false);
    })();
  }, [dealerId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  const sortedCars = cars;

  const navItems = [
    ...(onNavigateOverview ? [{ icon: <LayoutDashboard className="w-[18px] h-[18px]" />, label: 'Översikt', onClick: onNavigateOverview }] : []),
    { icon: <CarIcon className="w-[18px] h-[18px]" />, label: 'Aktiva uppdrag', active: true },
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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Aktiva uppdrag
            {!loading && (
              <span className="ml-2 text-base font-medium text-slate-400">
                ({sortedCars.length})
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bilar du kan lägga bud på just nu.
          </p>
        </div>

        <ErrorBanner message={error} className="mb-6" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : sortedCars.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-slate-500">Inga aktiva auktioner just nu.</p>
          </div>
        ) : (
          <>
          <div className="md:hidden space-y-3">
            {sortedCars.map((car) => {
              const bilder = car.car_images?.length ?? 0;
              const myBid = bidsByCar[car.id];
              const timeLeft = formatTimeLeft(car.auktion_slut, now);
              const ending = car.auktion_slut
                ? new Date(car.auktion_slut).getTime() - now
                : null;
              const warn =
                ending !== null && ending > 0 && ending < 2 * 60 * 60 * 1000;
              return (
                <button
                  key={car.id}
                  onClick={() => onOpenCar(car.id)}
                  className="w-full text-left bg-white rounded-lg border border-slate-200 p-4 shadow-sm active:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-mono font-bold text-slate-900 tracking-wider text-base">
                        {car.regnummer}
                      </h3>
                      {(car.marke || car.modell) && (
                        <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">
                          {[car.marke, car.modell].filter(Boolean).join(' ')}
                        </p>
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
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${
                        timeLeft === 'Slut'
                          ? 'bg-slate-100 text-slate-600 ring-slate-200'
                          : warn
                          ? 'bg-red-50 text-red-700 ring-red-200'
                          : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {timeLeft}
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    {myBid ? (
                      <span className="font-semibold text-slate-900">
                        Ditt bud: {formatKr(myBid)} kr
                      </span>
                    ) : (
                      <span className="text-slate-400">Inget bud</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
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
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCars.map((car) => {
                    const bilder = car.car_images?.length ?? 0;
                    const myBid = bidsByCar[car.id];
                    const timeLeft = formatTimeLeft(car.auktion_slut, now);
                    const ending = car.auktion_slut
                      ? new Date(car.auktion_slut).getTime() - now
                      : null;
                    const warn =
                      ending !== null && ending > 0 && ending < 2 * 60 * 60 * 1000;
                    return (
                      <tr
                        key={car.id}
                        onClick={() => onOpenCar(car.id)}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-slate-900 tracking-wider">
                            {car.regnummer}
                          </div>
                          {(car.marke || car.modell) && (
                            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">
                              {[car.marke, car.modell].filter(Boolean).join(' ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{car.ar || '—'}</td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                          {car.miltal.toLocaleString('sv-SE')} mil
                        </td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                          {SKICK_LABELS[car.skick] ?? car.skick}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                            {bilder}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {myBid ? (
                            <span className="font-semibold text-slate-900">
                              {formatKr(myBid)} kr
                            </span>
                          ) : (
                            <span className="text-slate-400">Inget bud</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${
                              timeLeft === 'Slut'
                                ? 'bg-slate-100 text-slate-600 ring-slate-200'
                                : warn
                                ? 'bg-red-50 text-red-700 ring-red-200'
                                : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {timeLeft}
                          </span>
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-semibold text-slate-600 px-6 py-3 whitespace-nowrap">
      {children}
    </th>
  );
}
