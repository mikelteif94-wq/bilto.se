import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Copy,
  Check,
  Loader2,
  Car as CarIcon,
  Gift,
  Clock,
  CheckCircle2,
  ChevronRight,
  Phone,
  Gavel,
  TrendingUp,
  Trophy,
  LayoutDashboard,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import CustomerOfferCard from '../components/CustomerOfferCard';
import PortalLayout from '../components/PortalLayout';

const STATUS_META: Record<string, { label: string; step: number; color: string; bg: string; topColor: string }> = {
  ny:               { label: 'Granskas',        step: 1, color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200',       topColor: 'bg-sky-400' },
  aktiv:            { label: 'Auktion pågår',   step: 2, color: 'text-[#0e6efe]',   bg: 'bg-blue-50 border-blue-200',     topColor: 'bg-[#0e6efe]' },
  paused:           { label: 'Pausad',           step: 2, color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   topColor: 'bg-amber-400' },
  auktion_avslutad: { label: 'Bud inkomna',      step: 3, color: 'text-slate-700',   bg: 'bg-slate-100 border-slate-200',  topColor: 'bg-slate-400' },
  inga_bud:         { label: 'Inga bud',         step: 3, color: 'text-slate-600',   bg: 'bg-slate-100 border-slate-200',  topColor: 'bg-slate-300' },
  godkand:          { label: 'Bud godkänt',      step: 4, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', topColor: 'bg-emerald-500' },
  sald:             { label: 'Såld',             step: 4, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', topColor: 'bg-emerald-500' },
  avslutad:         { label: 'Avslutad',         step: 4, color: 'text-slate-600',   bg: 'bg-slate-100 border-slate-200',  topColor: 'bg-slate-300' },
  avbruten:         { label: 'Avbruten',         step: 0, color: 'text-red-700',     bg: 'bg-red-50 border-red-200',       topColor: 'bg-red-400' },
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

export default function CustomerDashboard({ userId, onLoggedOut, onOpenCar }: CustomerDashboardProps) {
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

      // Always attempt to link customer rows on load (idempotent — only affects unlinked rows)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-customer-account`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
      }

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

      const { data: customerRows } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userId) as unknown as { data: { id: string }[] | null };

      if (!customerRows || customerRows.length === 0) {
        setCars([]);
        setLoading(false);
        return;
      }

      const customerIds = customerRows.map((c) => c.id);

      const { data: carRows } = await supabase
        .from('cars')
        .select('id, regnummer, marke, modell, miltal, status, created_at, access_token, sales_type')
        .in('customer_id', customerIds)
        .order('created_at', { ascending: false });

      const list = (carRows ?? []) as CarRow[];
      setCars(list);

      if (list.length) {
        const ids = list.map((c) => c.id);
        const { data: bids } = await supabase
          .from('bids')
          .select('id, car_id, belopp, created_at, dealers(foretagsnamn)')
          .in('car_id', ids)
          .order('belopp', { ascending: false });

        const grouped: Record<string, BidRow[]> = {};
        for (const b of (bids ?? []) as (Omit<BidRow, 'foretagsnamn'> & { dealers: { foretagsnamn: string } | null })[]) {
          (grouped[b.car_id] = grouped[b.car_id] ?? []).push({
            id: b.id,
            car_id: b.car_id,
            belopp: b.belopp,
            created_at: b.created_at,
            foretagsnamn: b.dealers?.foretagsnamn ?? null,
          });
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

  // KPI data
  const totalBids = Object.values(bidsByCar).reduce((sum, bids) => sum + bids.length, 0);
  const activeCars = cars.filter((c) => c.status === 'aktiv').length;
  const topBidOverall = Math.max(0, ...Object.values(bidsByCar).map((bids) => bids[0]?.belopp ?? 0));
  const soldCars = cars.filter((c) => c.status === 'sald' || c.status === 'godkand').length;

  const navItems = [
    { icon: <LayoutDashboard className="w-[18px] h-[18px]" />, label: 'Min portal', active: true, onClick: undefined },
  ];

  return (
    <PortalLayout
      navItems={navItems}
      identity="Min portal"
      identityRole="Kund"
      onLogout={handleLogout}
      pageTitle="Min portal"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Min portal</h1>
          <p className="text-sm text-slate-400 mt-0.5">Dina bilar, bud och erbjudanden i realtid.</p>
        </div>

        {loading ? (
          <div className="py-32 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-slate-300" />
          </div>
        ) : (
          <>
            {/* KPI strip */}
            {cars.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KpiCard
                  label="Inskickade bilar"
                  value={cars.length}
                  icon={<CarIcon className="w-4 h-4" />}
                  topColor="bg-[#0e6efe]"
                  iconCls="bg-[#0e6efe]/10 text-[#0e6efe]"
                />
                <KpiCard
                  label="Aktiva auktioner"
                  value={activeCars}
                  icon={<Gavel className="w-4 h-4" />}
                  topColor={activeCars > 0 ? 'bg-amber-400' : 'bg-slate-200'}
                  iconCls={activeCars > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}
                  highlight={activeCars > 0}
                />
                <KpiCard
                  label="Totalt antal bud"
                  value={totalBids}
                  icon={<TrendingUp className="w-4 h-4" />}
                  topColor={totalBids > 0 ? 'bg-emerald-500' : 'bg-slate-200'}
                  iconCls={totalBids > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}
                />
                <KpiCard
                  label="Sålda bilar"
                  value={soldCars}
                  icon={<Trophy className="w-4 h-4" />}
                  topColor="bg-emerald-500"
                  iconCls="bg-emerald-50 text-emerald-600"
                />
              </div>
            )}

            {/* Offers section */}
            {offers.length > 0 && (
              <div>
                <SectionLabel
                  text="Dina erbjudanden"
                  icon={<Gift className="w-3.5 h-3.5 text-[#0e6efe]" />}
                  badge={offers.length}
                />
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <CustomerOfferCard key={offer.id} offer={offer} />
                  ))}
                </div>
              </div>
            )}

            {/* Cars */}
            {cars.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
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
              <div>
                <SectionLabel
                  text="Mina bilar"
                  icon={<CarIcon className="w-3.5 h-3.5 text-slate-400" />}
                />
                <div className="space-y-4">
                  {cars.map((car) => {
                    const bids = bidsByCar[car.id] ?? [];
                    const topBid = bids[0];
                    const meta = STATUS_META[car.status] ?? { label: car.status, step: 1, color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', topColor: 'bg-slate-300' };
                    const activeStep = meta.step;

                    return (
                      <div key={car.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Color top bar */}
                        <div className={`h-0.5 w-full ${meta.topColor}`} />

                        {/* Card header */}
                        <div className="px-5 sm:px-6 pt-5 pb-4 flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                {car.regnummer}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.bg} ${meta.color}`}>
                                {meta.label}
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
                              className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              Öppna <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Progress tracker */}
                        {car.status !== 'avbruten' && (
                          <div className="px-5 sm:px-6 pb-5">
                            <div className="flex items-center">
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
                                      <span className={`text-[9px] sm:text-[10px] font-medium leading-tight text-center px-0.5 truncate w-full ${
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

                        {/* Highest bid highlight — if bids exist */}
                        {topBid && (
                          <div className="mx-5 sm:mx-6 mb-4 bg-[#0e6efe]/5 border border-[#0e6efe]/20 rounded-xl px-4 py-3.5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
                                <Trophy className="w-4 h-4 text-[#0e6efe]" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Högsta bud</p>
                                <p className="text-sm font-semibold text-slate-700">{topBid.foretagsnamn ?? 'Handlare'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-[#0e6efe] tabular-nums leading-none">
                                {topBid.belopp.toLocaleString('sv-SE')}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">kr</p>
                            </div>
                          </div>
                        )}

                        {/* Bids list */}
                        <div className={`border-t border-slate-100 ${bids.length > 1 ? '' : ''}`}>
                          {bids.length === 0 ? (
                            <div className="flex items-center gap-3 px-5 sm:px-6 py-4">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                {car.status === 'ny' ? (
                                  <Clock className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <p className="text-sm text-slate-500">
                                {car.status === 'ny'
                                  ? 'Vi granskar din bil — du får besked snart.'
                                  : 'Inga bud har kommit in ännu.'}
                              </p>
                            </div>
                          ) : bids.length > 1 ? (
                            <div className="px-5 sm:px-6 py-4">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                                Alla bud ({bids.length})
                              </p>
                              <div className="space-y-1.5">
                                {bids.slice(0, 5).map((b, idx) => (
                                  <div
                                    key={b.id}
                                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
                                  >
                                    <div className="flex items-center gap-2">
                                      {idx === 0 && (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                          Bäst
                                        </span>
                                      )}
                                      <span className="text-sm text-slate-700">
                                        {b.foretagsnamn ?? 'Handlare'}
                                      </span>
                                    </div>
                                    <span className={`text-sm font-bold tabular-nums ${idx === 0 ? 'text-[#0e6efe]' : 'text-slate-600'}`}>
                                      {b.belopp.toLocaleString('sv-SE')} kr
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        {/* Share link + open button footer */}
                        {car.access_token && (
                          <div className="border-t border-slate-100 px-5 sm:px-6 py-3 flex items-center gap-3 bg-slate-50/60">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Din personliga länk</span>
                              <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                                {`${window.location.origin}/min-bil/${car.access_token}`}
                              </p>
                            </div>
                            <button
                              onClick={() => handleCopyLink(car.id, car.access_token!)}
                              className="shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                            >
                              {copiedId === car.id ? (
                                <><Check className="w-3 h-3 text-emerald-600" /><span className="text-emerald-600">Kopierad</span></>
                              ) : (
                                <><Copy className="w-3 h-3" /> Kopiera</>
                              )}
                            </button>
                            <button
                              onClick={() => onOpenCar(car.access_token!)}
                              className="shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-[#0e6efe] text-white text-xs font-semibold hover:bg-[#0a57cc] transition"
                            >
                              Öppna <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Best bid summary across all cars — if there are bids */}
            {topBidOverall > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <span className="w-8 h-8 rounded-lg bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 text-[#0e6efe]" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Bästa bud totalt</p>
                      <p className="text-lg font-bold text-slate-900 tabular-nums">{topBidOverall.toLocaleString('sv-SE')} kr</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-4">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Gavel className="w-4 h-4 text-emerald-600" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Totalt antal bud</p>
                      <p className="text-lg font-bold text-slate-900 tabular-nums">{totalBids}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-4">
                    <span className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                      <CarIcon className="w-4 h-4 text-sky-500" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Bilar i systemet</p>
                      <p className="text-lg font-bold text-slate-900 tabular-nums">{cars.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Help */}
            <div className="bg-white border border-slate-200 rounded-xl px-5 sm:px-6 py-5 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-[#0e6efe]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 mb-0.5">Frågor om din bil?</h3>
                <p className="text-sm text-slate-500">
                  Din rådgivare hjälper dig direkt.{' '}
                  <a href="tel:+46855550200" className="font-semibold text-[#0e6efe] hover:underline">08-5555 0200</a>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}

function KpiCard({
  label, value, icon, topColor, iconCls, highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  topColor: string;
  iconCls: string;
  highlight?: boolean;
}) {
  return (
    <div className={`relative bg-white border rounded-xl overflow-hidden shadow-sm ${highlight ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}>
      <div className={`h-0.5 w-full ${topColor}`} />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconCls}`}>{icon}</div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-none tabular-nums">{value}</div>
        <div className="text-xs text-slate-500 mt-1.5 leading-snug">{label}</div>
      </div>
    </div>
  );
}

function SectionLabel({ text, icon, badge }: { text: string; icon?: React.ReactNode; badge?: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon}
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{text}</span>
      {badge != null && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#0e6efe] text-white text-[10px] font-bold">
          {badge}
        </span>
      )}
    </div>
  );
}
