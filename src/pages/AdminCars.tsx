import { useEffect, useState } from 'react';
import {
  Loader2,
  ChevronRight,
  Car as CarIcon,
  Building2,
  Sparkles,
  Bell,
  EyeOff,
  LayoutDashboard,
  MessageSquareText,
  Upload,
  Plus,
  BookOpen,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import ErrorBanner from '../components/ErrorBanner';
import PortalLayout from '../components/PortalLayout';

interface AdminCarsProps {
  onLoggedOut: () => void;
  onOpenCar: (id: string) => void;
  onNavigateDealers: () => void;
  onAddCar: () => void;
  onNavigateOverview?: () => void;
  onNavigateQuotes?: () => void;
  onNavigateBulkUpload?: () => void;
  onNavigateCatalog?: () => void;
}

type Car = Database['public']['Tables']['cars']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type ValuationRequest = Database['public']['Tables']['valuation_requests']['Row'];
type Reminder = Database['public']['Tables']['car_reminders']['Row'];

interface CarRow extends Car {
  customers: Customer | null;
}

const STATUS_STYLES: Record<string, string> = {
  ny: 'bg-slate-900 text-white ring-slate-700',
  aktiv: 'bg-emerald-500 text-white ring-emerald-500',
  sald: 'bg-blue-600 text-white ring-blue-600',
  avslutad: 'bg-transparent text-slate-400 ring-slate-200',
  auktion_avslutad: 'bg-amber-100 text-amber-800 ring-amber-200',
  inga_bud: 'bg-rose-100 text-rose-700 ring-rose-200',
  avbruten: 'bg-red-100 text-red-700 ring-red-200',
  godkand: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  paused: 'bg-slate-100 text-slate-500 ring-slate-200',
};

const STATUS_LABELS: Record<string, string> = {
  ny: 'Ny',
  aktiv: 'Aktiv',
  sald: 'Såld',
  avslutad: 'Avslutad',
  auktion_avslutad: 'Auktion avslutad',
  inga_bud: 'Inga bud',
  avbruten: 'Avbruten',
  godkand: 'Godkänd',
  paused: 'Pausad',
};

const CRM_STATUS_LABELS: Record<string, string> = {
  het: 'Het',
  ringa_upp: 'Ring',
  fundera: 'Funderar',
  aterkomma: 'Återkomma',
  missnoejd_bud: 'Missnöjd',
  hitta_bil_forst: 'Söker bil',
  sald: 'Såld',
  forlorad: 'Förlorad',
};

const CRM_STATUS_COLORS: Record<string, string> = {
  het: 'bg-red-100 text-red-700',
  ringa_upp: 'bg-blue-100 text-blue-700',
  fundera: 'bg-amber-100 text-amber-700',
  aterkomma: 'bg-slate-100 text-slate-700',
  missnoejd_bud: 'bg-orange-100 text-orange-700',
  hitta_bil_forst: 'bg-teal-100 text-teal-700',
  sald: 'bg-green-100 text-green-700',
  forlorad: 'bg-slate-200 text-slate-500',
};

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function formatInkom(iso: string): { label: string; cls: string } {
  const d = daysAgo(iso);
  if (d <= 14) return { label: d === 0 ? 'Idag' : d === 1 ? '1 dag sen' : `${d} dagar sen`, cls: 'text-emerald-600 font-semibold' };
  if (d <= 40) return { label: `${d} dagar sen`, cls: 'text-amber-600 font-semibold' };
  return { label: `${d} dagar sen`, cls: 'text-red-600 font-semibold' };
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('sv-SE', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function AdminCars({
  onLoggedOut,
  onOpenCar,
  onNavigateDealers,
  onAddCar,
  onNavigateOverview,
  onNavigateQuotes,
  onNavigateBulkUpload,
  onNavigateCatalog,
}: AdminCarsProps) {
  const [cars, setCars] = useState<CarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [valuations, setValuations] = useState<(ValuationRequest & { cars: { id: string; regnummer: string; marke: string; modell: string } | null })[]>([]);
  const [reminders, setReminders] = useState<(Reminder & { cars: { id: string; regnummer: string; marke: string; modell: string } | null })[]>([]);

  useEffect(() => {
    void init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const [carsRes, valRes, remRes] = await Promise.all([
      supabase
        .from('cars')
        .select('*, customers(*)')
        .order('created_at', { ascending: false }),
      user
        ? supabase
            .from('valuation_requests')
            .select('*, cars(id, regnummer, marke, modell)')
            .eq('to_user_id', user.id)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase
        .from('car_reminders')
        .select('*, cars(id, regnummer, marke, modell)')
        .eq('done', false)
        .lte('remind_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
        .order('remind_at', { ascending: true })
        .limit(10),
    ]);

    if (carsRes.error) {
      setError('Kunde inte hämta bilar.');
    } else {
      setCars((carsRes.data ?? []) as CarRow[]);
    }
    setValuations((valRes.data ?? []) as typeof valuations);
    setReminders((remRes.data ?? []) as typeof reminders);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  const navItems = [
    ...(onNavigateOverview ? [{ icon: <LayoutDashboard className="w-[18px] h-[18px]" />, label: 'Översikt', onClick: onNavigateOverview }] : []),
    { icon: <CarIcon className="w-[18px] h-[18px]" />, label: 'Bilar', active: true },
    ...(onNavigateQuotes ? [{ icon: <MessageSquareText className="w-[18px] h-[18px]" />, label: 'Förfrågningar', onClick: onNavigateQuotes }] : []),
    { icon: <Building2 className="w-[18px] h-[18px]" />, label: 'Handlare', onClick: onNavigateDealers },
  ];

  return (
    <PortalLayout
      navItems={navItems}
      identity="Admin"
      identityRole="Bilto"
      onLogout={handleLogout}
      pageTitle="Bilar"
      headerAction={
        <button
          onClick={onAddCar}
          className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[13px] font-semibold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Ny bil
        </button>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {valuations.length > 0 && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h2 className="text-base sm:text-lg font-bold text-amber-900">
                Dina värderingsförfrågningar ({valuations.length})
              </h2>
            </div>
            <ul className="space-y-2">
              {valuations.map((v) => (
                <li key={v.id}>
                  <button
                    onClick={() => v.cars && onOpenCar(v.cars.id)}
                    className="w-full flex items-center gap-3 bg-white hover:bg-slate-50 border border-amber-200 rounded-lg p-3 text-left transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {v.cars
                          ? `${[v.cars.marke, v.cars.modell].filter(Boolean).join(' ')} · ${v.cars.regnummer}`
                          : 'Bil borttagen'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        Från {v.from_user_name} · {formatDateTime(v.created_at)}
                        {v.message ? ` · ${v.message}` : ''}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {reminders.length > 0 && (
          <div className="mb-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-amber-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Påminnelser idag ({reminders.length})
              </h2>
            </div>
            <ul className="space-y-2">
              {reminders.map((r) => {
                const overdue = new Date(r.remind_at).getTime() < Date.now();
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => r.cars && onOpenCar(r.cars.id)}
                      className="w-full flex items-center gap-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-3 text-left transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {r.title}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {r.cars
                            ? `${r.cars.regnummer} · `
                            : ''}
                          <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                            {formatDateTime(r.remind_at)}
                          </span>
                          {r.created_by_name ? ` · av ${r.created_by_name}` : ''}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Alla bilar
            {!loading && (
              <span className="ml-2 text-sm sm:text-base font-medium text-slate-400">
                ({cars.length})
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2">
            {onNavigateCatalog && (
              <button
                onClick={onNavigateCatalog}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-sm transition"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Bilkatalog</span>
              </button>
            )}
            {onNavigateBulkUpload && (
              <button
                onClick={onNavigateBulkUpload}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-sm transition"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Bulk-bilder</span>
              </button>
            )}
          </div>
        </div>

        <ErrorBanner message={error} className="mb-6" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : cars.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">Inga bilar har kommit in än.</p>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <ul className="sm:hidden space-y-2">
              {cars.map((car) => {
                const mm = [car.marke, car.modell].filter(Boolean).join(' ').trim();
                return (
                  <li key={car.id}>
                    <button
                      onClick={() => onOpenCar(car.id)}
                      className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 active:bg-slate-50 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap mb-1">
                          <span className="font-mono font-semibold text-slate-900 tracking-wider">
                            {car.regnummer}
                          </span>
                          <span
                            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${
                              STATUS_STYLES[car.status] ?? STATUS_STYLES.ny
                            }`}
                          >
                            {STATUS_LABELS[car.status] ?? car.status}
                          </span>
                          {car.crm_status && (
                            <span
                              className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                CRM_STATUS_COLORS[car.crm_status] ?? 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {CRM_STATUS_LABELS[car.crm_status] ?? car.crm_status}
                            </span>
                          )}
                          {car.hidden_from_dealers && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                              <EyeOff className="w-3 h-3" />
                              Dold
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {mm || '—'} {car.ar ? `· ${car.ar}` : ''}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1 flex-wrap">
                          <span>{car.miltal.toLocaleString('sv-SE')} mil · {car.customers?.namn || '—'} ·</span>
                          <span className={formatInkom(car.created_at).cls + ' text-xs'}>
                            {formatInkom(car.created_at).label}
                          </span>
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
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        Regnummer
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        Märke / Modell
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        År
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        Miltal
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        Status
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        CRM
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        Kund
                      </th>
                      <th className="text-left font-semibold text-slate-600 px-4 lg:px-6 py-3 whitespace-nowrap">
                        Inkom
                      </th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cars.map((car) => {
                      const mm = [car.marke, car.modell].filter(Boolean).join(' ').trim();
                      return (
                        <tr
                          key={car.id}
                          onClick={() => onOpenCar(car.id)}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition group"
                        >
                          <td className="px-4 lg:px-6 py-4 font-mono font-semibold text-slate-900 tracking-wider">
                            <span className="inline-flex items-center gap-1.5">
                              {car.regnummer}
                              {car.hidden_from_dealers && (
                                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-slate-900">
                            {mm || <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-slate-600">{car.ar || '—'}</td>
                          <td className="px-4 lg:px-6 py-4 text-slate-600 whitespace-nowrap">
                            {car.miltal.toLocaleString('sv-SE')} mil
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <span
                              className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${
                                STATUS_STYLES[car.status] ?? STATUS_STYLES.ny
                              }`}
                            >
                              {STATUS_LABELS[car.status] ?? car.status}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            {car.crm_status ? (
                              <span
                                className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                                  CRM_STATUS_COLORS[car.crm_status] ?? 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {CRM_STATUS_LABELS[car.crm_status] ?? car.crm_status}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-slate-900">
                            {car.customers?.namn || <span className="text-slate-400">—</span>}
                          </td>
                          <td className={`px-4 lg:px-6 py-4 whitespace-nowrap text-xs ${formatInkom(car.created_at).cls}`}>
                            {formatInkom(car.created_at).label}
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
