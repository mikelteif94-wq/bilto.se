import { useEffect, useState } from 'react';
import { ArrowRight, Copy, Check, Loader2, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CustomerOfferCard from '../components/CustomerOfferCard';

function formatStatus(status: string, salesType: string): string {
  const map: Record<string, string> = {
    ny: 'Inskickad – väntar på granskning',
    aktiv: salesType === 'brokerage' ? 'Förmedlas just nu' : 'Auktion pågår',
    auktion_avslutad: 'Auktion avslutad',
    inga_bud: 'Inga bud kom in',
    sald: 'Såld',
    avslutad: 'Avslutad',
    avbruten: 'Avbruten',
    godkand: 'Bud godkänt',
    paused: 'Pausad',
  };
  return map[status] ?? status;
}

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

      // Fetch offers for this customer
      const { data: offerRows } = await supabase
        .from('car_offers' as never)
        .select('*')
        .in('status', ['sent', 'viewed'])
        .order('sent_at', { ascending: false });
      const offerList = (offerRows ?? []) as unknown as OfferRow[];
      setOffers(offerList);

      // Mark offers as viewed
      if (offerList.length > 0) {
        const unviewed = offerList.filter((o) => o.status === 'sent');
        if (unviewed.length > 0) {
          const ids = unviewed.map((o) => o.id);
          supabase
            .from('car_offers' as never)
            .update({ status: 'viewed', viewed_at: new Date().toISOString() } as never)
            .in('id', ids)
            .then(() => {});
        }
      }

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#0e6efe] h-16 flex items-center px-5 lg:px-8 sticky top-0 z-10">
        <a href="/" className="flex items-center">
          <img
            src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
            alt="Bilto"
            className="h-20 lg:h-32 w-auto object-contain"
          />
        </a>
        <div className="ml-auto">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-white text-[14px] font-medium hover:text-white/80"
          >
            <LogOut className="w-4 h-4" /> Logga ut
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-10">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">
          Min portal
        </h1>
        <p className="text-slate-600 mb-8">
          Har ser du erbjudanden, bilar och bud.
        </p>

        {/* Offers section */}
        {offers.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Dina erbjudanden</h2>
            <div className="space-y-5">
              {offers.map((offer) => (
                <CustomerOfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : cars.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <p className="text-slate-600 mb-4">
              Du har inga inlämnade bilar ännu.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-[#0e6efe] font-semibold hover:underline"
            >
              Sälj din bil <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="space-y-5">
            {cars.map((car) => {
              const bids = bidsByCar[car.id] ?? [];
              const topBid = bids[0];
              return (
                <div
                  key={car.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {car.regnummer}
                      </div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {[car.marke, car.modell].filter(Boolean).join(' ') || 'Din bil'}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {car.miltal.toLocaleString('sv-SE')} mil
                      </p>
                      <span className="inline-flex items-center mt-2 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                        {formatStatus(car.status, car.sales_type)}
                      </span>
                    </div>
                    {car.access_token && (
                      <button
                        onClick={() => onOpenCar(car.access_token!)}
                        className="inline-flex items-center gap-1 text-[#0e6efe] text-sm font-semibold hover:underline"
                      >
                        Öppna <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {car.access_token && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 mb-4 flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                          Din personliga länk
                        </div>
                        <div className="text-xs text-slate-700 truncate font-mono">
                          {`${window.location.origin}/min-bil/${car.access_token}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyLink(car.id, car.access_token!)}
                        className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#0e6efe] hover:bg-slate-100 px-2 py-1.5 rounded-md transition"
                      >
                        {copiedId === car.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Kopierad
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Kopiera
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {bids.length === 0 ? (
                    <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-3">
                      Inga bud har kommit in ännu.
                    </p>
                  ) : (
                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-baseline justify-between mb-3">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Högsta bud
                        </span>
                        <span className="text-2xl font-bold text-[#0e6efe]">
                          {topBid.belopp.toLocaleString('sv-SE')} kr
                        </span>
                      </div>
                      <div className="space-y-2">
                        {bids.slice(0, 5).map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between text-sm py-2 border-b border-slate-50 last:border-0"
                          >
                            <span className="text-slate-700">
                              {b.foretagsnamn ?? 'Handlare'}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {b.belopp.toLocaleString('sv-SE')} kr
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
