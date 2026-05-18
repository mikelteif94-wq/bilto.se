import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Copy,
  Check,
  Loader2,
  LogOut,
  Car as CarIcon,
  Gift,
  Clock,
  CheckCircle2,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import CustomerOfferCard from '../components/CustomerOfferCard';

const STATUS_META: Record<string, { label: string; step: number; color: string; bg: string }> = {
  ny: { label: 'Inskickad — granskas', step: 1, color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  aktiv: { label: 'Auktion pågår', step: 2, color: 'text-[#0e6efe]', bg: 'bg-blue-50 border-blue-200' },
  paused: { label: 'Pausad', step: 2, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  auktion_avslutad: { label: 'Auktion avslutad', step: 3, color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' },
  inga_bud: { label: 'Inga bud kom in', step: 3, color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
  godkand: { label: 'Bud godkänt', step: 4, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  sald: { label: 'Såld', step: 4, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  avslutad: { label: 'Avslutad', step: 4, color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
  avbruten: { label: 'Avbruten', step: 0, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const STEPS = ['Inskickad', 'Auktion', 'Bud inkomna', 'Avslutad'];

interface CustomerDashboardProps {
  userId: string;
  onLoggedOut: () => void;
  onOpenCar: (token: string) => void;
}

interface CarRow {
  id: string;
  regnummer: string;
  marke: string | null;
  modell: string | null;
  miltal: number;
  status: string;
  created_at: string;
  access_token: string | null;
  sales_type: string;
}

interface BidRow {
  id: string;
  car_id: string;
  belopp: number;
  foretagsnamn: string | null;
  created_at: string;
}

interface OfferRow {
  id: string;
  status: string;
  car_description: string;
  original_price: number;
  negotiated_price: number;
  original_interest_rate: number | null;
  negotiated_interest_rate: number | null;
  original_monthly_cost: number | null;
  negotiated_monthly_cost: number | null;
  winter_tires_included: boolean;
  winter_tires_value: number;
  warranty_included: boolean;
  warranty_years: number;
  warranty_value: number;
  home_delivery_included: boolean;
  home_delivery_value: number;
  other_savings_description: string;
  other_savings_value: number;
  total_savings: number;
  total_deal_price: number;
  deal_rating: string;
  admin_comment: string;
  sent_at: string | null;
}

export default function CustomerDashboard({
  userId,
  onLoggedOut,
  onOpenCar,
}: CustomerDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState<CarRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [bidsByCar, setBidsByCar] = useState<Record<string, BidRow[]>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = async (carId: string, token: string) => {
    const url = `${window.location.origin}/min-bil/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(carId);
      setTimeout(() => setCopiedId((c) => (c === carId ? null : c)), 2000);
    } catch {
      window.prompt('Kopiera din länk:', url);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: offerRows } = await supabase
        .from('car_offers' as never)
        .select('*')
        .in('status', ['sent', 'viewed'])
        .order('sent_at', { ascending: false });
      const offerList = (offerRows ?? []) as unknown as OfferRow[];
      setOffers(offerList);

      if (offerList.length > 0) {
        const unviewed = offerList.filter((o) => o.status === 'sent');
        if (unviewed.length > 0) {
          supabase
            .from('car_offers' as never)
            .update({ status: 'viewed', viewed_at: new Date().toISOString() } as never)
            .in('id', unviewed.map((o) => o.id))
            .then(() => {});
        }
      }

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle() as unknown as { data: { id: string } | null };

      if (!customer) {
        setCars([]);
        setLoading(false);
        return;
      }

      const { data: carRows } = await supabase
        .from('cars')
        .select('id, regnummer, marke, modell, miltal, status, created_at, access_token, sales_type')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      const list = (carRows ?? []) as CarRow[];
      setCars(list);

      if (list.length) {
        const ids = list.map((c) => c.id);
        const { data: bids } = await supabase
          .from('bids')
          .select('id, car_id, belopp, created_at')
          .in('car_id', ids)
          .order('belopp', { ascending: false });

        const grouped: Record<string, BidRow[]> = {};
        for (const b of (bids ?? []) as Omit<BidRow, 'foretagsnamn'>[]) {
          (grouped[b.car_id] = grouped[b.car_id] ?? []).push({ ...b, foretagsnamn: null });
        }
        setBidsByCar(grouped);
      }
      setLoading(false);
    })();
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col">
      {/* Header */}
      <header className="bg-[#0e6efe] h-16 flex items-center px-5 lg:px-8 sticky top-0 z-20">
        <a href="/" className="flex items-center">
          <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" />
        </a>
        <div className="ml-auto">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            Logga ut
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Min portal</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Här ser du dina erbjudanden, bilar och bud i realtid.
          </p>
        </div>

        {/* Offers section — most important, shown first */}
        {offers.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#0e6efe]/10 flex items-center justify-center">
                <Gift className="w-4 h-4 text-[#0e6efe]" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Dina erbjudanden
                <span className="ml-2 inline-flex h-5 min-w-[20px] px-1.5 rounded-full bg-[#0e6efe] text-white text-[11px] font-bold items-center justify-center">
                  {offers.length}
                </span>
              </h2>
            </div>
            <div className="space-y-5">
              {offers.map((offer) => (
                <CustomerOfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : cars.length === 0 ? (
          /* Empty state */
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <CarIcon className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Inga bilar ännu</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
              Skicka in din bil så tar vi hand om resten — granskning, auktion och bud.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-sm transition"
            >
              Sälj din bil <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          /* Cars list */
          <section className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Mina bilar</h2>
            {cars.map((car) => {
              const bids = bidsByCar[car.id] ?? [];
              const topBid = bids[0];
              const meta = STATUS_META[car.status] ?? { label: car.status, step: 1, color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' };
              const isBrokerage = car.sales_type === 'brokerage';
              const activeStep = isBrokerage && car.status === 'aktiv' ? 2 : meta.step;

              return (
                <div key={car.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  {/* Car header */}
                  <div className="px-5 sm:px-6 pt-5 pb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {car.regnummer}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.bg} ${meta.color}`}>
                          {isBrokerage && car.status === 'aktiv' ? 'Förmedlas just nu' : meta.label}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">
                        {[car.marke, car.modell].filter(Boolean).join(' ') || 'Din bil'}
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {car.miltal.toLocaleString('sv-SE')} mil
                      </p>
                    </div>
                    {car.access_token && (
                      <button
                        onClick={() => onOpenCar(car.access_token!)}
                        className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-[#0e6efe] hover:underline"
                      >
                        Detaljer <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Progress tracker */}
                  {car.status !== 'avbruten' && (
                    <div className="px-4 sm:px-6 pb-5">
                      <div className="flex items-center gap-0">
                        {STEPS.map((step, i) => {
                          const stepNum = i + 1;
                          const done = activeStep > stepNum;
                          const active = activeStep === stepNum;
                          return (
                            <div key={step} className="flex items-center flex-1 last:flex-none min-w-0">
                              <div className="flex flex-col items-center gap-1 min-w-0 w-full">
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                                  done ? 'bg-emerald-500 text-white'
                                  : active ? 'bg-[#0e6efe] text-white ring-4 ring-[#0e6efe]/20'
                                  : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : stepNum}
                                </div>
                                <span className={`text-[9px] sm:text-[11px] font-medium leading-tight text-center px-0.5 truncate w-full ${
                                  active ? 'text-[#0e6efe]' : done ? 'text-emerald-600' : 'text-slate-400'
                                }`}>
                                  {step}
                                </span>
                              </div>
                              {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-1 mb-5 shrink-0 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Share link */}
                  {car.access_token && (
                    <div className="mx-5 sm:mx-6 mb-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          Din personliga länk
                        </div>
                        <div className="text-xs text-slate-600 truncate font-mono">
                          {`${window.location.origin}/min-bil/${car.access_token}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyLink(car.id, car.access_token!)}
                        className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0e6efe] hover:bg-[#0e6efe]/5 px-2.5 py-1.5 rounded-lg transition"
                      >
                        {copiedId === car.id ? (
                          <><Check className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-600">Kopierad</span></>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Kopiera</>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Bids */}
                  <div className="border-t border-slate-100">
                    {bids.length === 0 ? (
                      <div className="flex items-center gap-3 px-5 sm:px-6 py-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500">
                          {car.status === 'ny'
                            ? 'Vi granskar din bil — du får besked snart.'
                            : 'Inga bud har kommit in ännu.'}
                        </p>
                      </div>
                    ) : (
                      <div className="px-5 sm:px-6 py-4">
                        <div className="flex items-baseline justify-between mb-3">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Bud ({bids.length})
                          </span>
                          <span className="text-2xl font-bold text-[#0e6efe] tabular-nums">
                            {topBid.belopp.toLocaleString('sv-SE')} kr
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {bids.slice(0, 5).map((b, idx) => (
                            <div
                              key={b.id}
                              className={`flex items-center justify-between py-2 px-3 rounded-lg ${idx === 0 ? 'bg-[#0e6efe]/5' : 'bg-slate-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                {idx === 0 && (
                                  <span className="text-[10px] font-bold text-[#0e6efe] bg-[#0e6efe]/10 px-1.5 py-0.5 rounded-full">
                                    Bäst
                                  </span>
                                )}
                                <span className="text-sm text-slate-700">
                                  {b.foretagsnamn ?? 'Handlare'}
                                </span>
                              </div>
                              <span className={`text-sm font-bold tabular-nums ${idx === 0 ? 'text-[#0e6efe]' : 'text-slate-700'}`}>
                                {b.belopp.toLocaleString('sv-SE')} kr
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Help section */}
        <section className="bg-white border border-slate-200 rounded-2xl px-5 sm:px-6 py-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-[#0e6efe]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-0.5">Frågor om din bil?</h3>
            <p className="text-sm text-slate-500">
              Din rådgivare på Bilto hjälper dig gärna. Vi svarar snabbt — vanligtvis inom en timme.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
