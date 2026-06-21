import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  Loader2,
  Clock,
  Image as ImageIcon,
  Check,
  Lock,
  X,
  AlertTriangle,
  AlertOctagon,
  Receipt,
  Wrench,
  ListChecks,
  Shield,
  Eye,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import ErrorBanner from '../components/ErrorBanner';
import { SKICK_LABELS, formatKr, formatTimeLeftDetailed } from '../lib/dealer-utils';
import PortalLayout from '../components/PortalLayout';

interface DealerCarDetailProps {
  dealerId: string;
  foretagsnamn: string;
  carId: string;
  onBack: () => void;
  onLoggedOut: () => void;
}

type Car = Database['public']['Tables']['cars']['Row'];
type CarImage = Database['public']['Tables']['car_images']['Row'];
type Bid = Database['public']['Tables']['bids']['Row'];

interface CarDetail extends Car {
  car_images: CarImage[];
}

const formatTimeLeft = formatTimeLeftDetailed;

export default function DealerCarDetail({
  dealerId,
  foretagsnamn,
  carId,
  onBack,
  onLoggedOut,
}: DealerCarDetailProps) {
  const [car, setCar] = useState<CarDetail | null>(null);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const [reservation, setReservation] = useState<{ id: string; dealer_id: string; expires_at: string } | null>(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [countdown, setCountdown] = useState('');

  const [bidInput, setBidInput] = useState('');
  const [kommentar, setKommentar] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastBid, setLastBid] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!reservation) {
      setCountdown('');
      return;
    }
    const tick = () => {
      const diffMs = new Date(reservation.expires_at).getTime() - Date.now();
      if (diffMs <= 0) {
        setCountdown('00:00');
        return;
      }
      const totalSec = Math.floor(diffMs / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      setCountdown(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [reservation]);

  useEffect(() => {
    void load();
  }, [carId]);

  const load = async () => {
    setLoading(true);
    const [{ data: carData, error: carErr }, { data: bidData }] = await Promise.all([
      supabase.from('cars').select('*, car_images(*)').eq('id', carId).maybeSingle(),
      supabase
        .from('bids')
        .select('*')
        .eq('car_id', carId)
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: false }),
    ]);

    if (carErr || !carData) {
      setError('Bilen kunde inte hämtas.');
    } else {
      setCar(carData as CarDetail);

      // Check for an active reservation on this car
      const { data: existingRes } = await supabase
        .from('lead_reservations')
        .select('id, dealer_id, expires_at')
        .eq('car_id', carId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      setReservation(existingRes);

      // Auto-create a reservation for this dealer if none exists and auction is open
      const auctionIsOpen =
        carData.status !== 'avslutad' &&
        (carData.auktion_slut == null || new Date(carData.auktion_slut).getTime() > Date.now());

      if (!existingRes && auctionIsOpen) {
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const { data: newRes } = await supabase
          .from('lead_reservations')
          .insert({ dealer_id: dealerId, car_id: carId, expires_at: expiresAt })
          .select('id, dealer_id, expires_at')
          .maybeSingle();
        setReservation(newRes);
      }
    }
    setMyBids((bidData ?? []) as Bid[]);
    setLoading(false);
  };

  const extendReservation = async () => {
    if (!reservation || reservation.dealer_id !== dealerId) return;
    setReservationLoading(true);
    const newExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { data: updated } = await supabase
      .from('lead_reservations')
      .update({ expires_at: newExpiresAt, extended: true })
      .eq('id', reservation.id)
      .select('id, dealer_id, expires_at')
      .maybeSingle();
    if (updated) setReservation(updated);
    setReservationLoading(false);
  };

  const highestOwnBid = useMemo(
    () => myBids.reduce((max, b) => (b.belopp > max ? b.belopp : max), 0),
    [myBids],
  );

  const timeInfo = useMemo(
    () => formatTimeLeft(car?.auktion_slut ?? null, now),
    [car?.auktion_slut, now],
  );

  const auctionClosed =
    timeInfo.ended || (car?.status === 'avslutad');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const cleaned = bidInput.replace(/\s/g, '').replace(/,/g, '.');
    const amount = Math.floor(Number(cleaned));
    if (!cleaned || !Number.isFinite(amount) || amount <= 0) {
      setSubmitError('Ange ett giltigt belopp i kronor.');
      return;
    }
    if (auctionClosed) {
      setSubmitError('Auktionen är avslutad.');
      return;
    }
    if (car?.startbud != null && amount < car.startbud) {
      setSubmitError(
        `Budet måste vara minst startbudet ${formatKr(car.startbud)} kr.`,
      );
      return;
    }
    if (highestOwnBid > 0 && amount <= highestOwnBid) {
      setSubmitError(
        `Budet måste vara högre än ditt nuvarande bud på ${formatKr(highestOwnBid)} kr.`,
      );
      return;
    }

    setSubmitting(true);
    const { error: insErr } = await supabase.from('bids').insert({
      car_id: carId,
      dealer_id: dealerId,
      belopp: amount,
      kommentar: kommentar.trim(),
    });

    if (insErr) {
      setSubmitError(
        insErr.message.includes('row-level security')
          ? 'Du saknar behörighet att lägga bud just nu.'
          : 'Kunde inte spara budet. Försök igen.',
      );
      setSubmitting(false);
      return;
    }

    setLastBid(amount);
    setBidInput('');
    setKommentar('');
    setSubmitting(false);
    await extendReservation();
    await load();
  };

  const breadcrumbEl = (
    <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-900 transition font-medium">
      <ChevronLeft className="w-4 h-4" />
      Tillbaka till uppdrag
    </button>
  );

  if (loading) {
    return (
      <PortalLayout navItems={[]} identity={foretagsnamn} identityRole="Handlare" onLogout={handleLogout} breadcrumb={breadcrumbEl}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </PortalLayout>
    );
  }

  if (error || !car) {
    return (
      <PortalLayout navItems={[]} identity={foretagsnamn} identityRole="Handlare" onLogout={handleLogout} breadcrumb={breadcrumbEl}>
        <div className="flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-700 mb-6">{error ?? 'Bilen hittades inte.'}</p>
            <button onClick={onBack} className="text-slate-600 hover:text-slate-900 font-medium">Tillbaka</button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const images = car.car_images ?? [];
  const heroImage = images[0]?.storage_url;
  const mm = [car.marke, car.modell].filter(Boolean).join(' ').trim();

  return (
    <PortalLayout
      navItems={[]}
      identity={foretagsnamn}
      identityRole="Handlare"
      onLogout={handleLogout}
      breadcrumb={breadcrumbEl}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid lg:grid-cols-3 gap-6 lg:gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {car.regnummer}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
              {mm || 'Okänd bil'}
            </h1>
            <p className="text-slate-500 mt-1">
              {car.ar ?? '–'} • {car.miltal.toLocaleString('sv-SE')} mil •{' '}
              {SKICK_LABELS[car.skick] ?? car.skick}
            </p>
          </div>

          {heroImage ? (
            <button
              type="button"
              onClick={() => setLightboxIdx(0)}
              className="w-full aspect-[16/10] bg-slate-200 rounded-md overflow-hidden group"
            >
              <img
                src={heroImage}
                alt={mm}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
              />
            </button>
          ) : (
            <div className="w-full aspect-[16/10] bg-slate-100 rounded-md flex items-center justify-center text-slate-400">
              <ImageIcon className="w-10 h-10" />
            </div>
          )}

          {images.length > 1 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightboxIdx(idx)}
                  className="aspect-square bg-slate-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-slate-300 transition"
                >
                  <img
                    src={img.storage_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
              Bilinformation
            </h2>
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <Info label="Regnummer" value={car.regnummer} mono />
              <Info label="Märke" value={car.marke} />
              <Info label="Modell" value={car.modell} />
              <Info label="Årsmodell" value={car.ar?.toString()} />
              <Info
                label="Miltal"
                value={`${car.miltal.toLocaleString('sv-SE')} mil`}
              />
              <Info label="Skick" value={SKICK_LABELS[car.skick] ?? car.skick} />
              <Info label="Antal bilder" value={String(images.length)} />
            </dl>
            {car.notes && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Noteringar
                </p>
                <p className="text-slate-800 whitespace-pre-wrap">{car.notes}</p>
              </div>
            )}
          </div>

          {(car as Record<string, unknown>).momsbil && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3">
              <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold text-emerald-800">Momsbil – moms avdragsgill</span>
            </div>
          )}

          {(() => {
            const cr = (car as Record<string, unknown>).condition_report as Record<string, unknown> | null;
            if (!cr) return null;
            const STATUS_ICON: Record<string, React.ReactNode> = {
              ok: <Check className="w-3.5 h-3.5 text-emerald-500" />,
              anmark: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
              allvarligt: <AlertOctagon className="w-3.5 h-3.5 text-red-500" />,
            };
            const STATUS_LABEL: Record<string, string> = { ok: 'OK', anmark: 'Anmärkning', allvarligt: 'Allvarligt' };
            const sections: { key: string; title: string; icon: React.ReactNode; items: { key: string; label: string }[] }[] = [
              { key: 'mekaniskt', title: 'Mekaniskt', icon: <Wrench className="w-4 h-4" />, items: [
                { key: 'motor', label: 'Motor' }, { key: 'vaxellada', label: 'Växellåda' }, { key: 'bromsar', label: 'Bromsar' },
                { key: 'koppling', label: 'Koppling' }, { key: 'kamrem', label: 'Kamrem / -kedja' }, { key: 'varningslampor', label: 'Varningslampor' },
              ]},
              { key: 'kosmetiskt', title: 'Kosmetiskt', icon: <ImageIcon className="w-4 h-4" />, items: [
                { key: 'lack', label: 'Lack' }, { key: 'repor', label: 'Repor' }, { key: 'bucklor', label: 'Bucklor' },
                { key: 'rost', label: 'Rost' }, { key: 'stenskott', label: 'Stenskott' }, { key: 'falgar', label: 'Fälgar / däck' },
              ]},
              { key: 'inredning', title: 'Inredning', icon: <ListChecks className="w-4 h-4" />, items: [
                { key: 'sate', label: 'Säten' }, { key: 'klädsel', label: 'Klädsel' }, { key: 'ratt', label: 'Ratt' },
                { key: 'infotainment', label: 'Infotainment' }, { key: 'ac', label: 'AC / klimat' }, { key: 'lukt', label: 'Lukt' },
              ]},
            ];
            const historik = cr.historik as Record<string, unknown> | undefined;
            const kommentarer = cr.kommentarer as Record<string, string> | undefined;
            const hasAny = sections.some(s => {
              const data = cr[s.key] as Record<string, string> | undefined;
              return data && Object.keys(data).length > 0;
            }) || (historik && Object.values(historik).some(v => v !== '' && v !== null));
            if (!hasAny) return null;
            return (
              <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
                  Skickrapport
                </h2>
                <div className="space-y-5">
                  {sections.map(s => {
                    const data = cr[s.key] as Record<string, string> | undefined;
                    if (!data || Object.keys(data).length === 0) return null;
                    const comment = kommentarer?.[s.key];
                    return (
                      <div key={s.key}>
                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          {s.icon} {s.title}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {s.items.map(item => {
                            const val = data[item.key];
                            if (!val) return null;
                            return (
                              <div key={item.key} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                                {STATUS_ICON[val] ?? null}
                                <span>{item.label}</span>
                                <span className={`ml-auto text-xs font-medium ${val === 'ok' ? 'text-emerald-600' : val === 'anmark' ? 'text-amber-600' : 'text-red-600'}`}>
                                  {STATUS_LABEL[val] ?? val}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {comment && (
                          <p className="mt-2 text-xs text-slate-500 italic">{comment}</p>
                        )}
                      </div>
                    );
                  })}
                  {historik && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Historik
                      </div>
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        {historik.servicehistorik && (
                          <><dt className="text-slate-500">Servicehistorik</dt><dd className="text-slate-900 font-medium">{historik.servicehistorik === 'ja' ? 'Ja' : 'Nej'}</dd></>
                        )}
                        {historik.antal_nycklar != null && (
                          <><dt className="text-slate-500">Antal nycklar</dt><dd className="text-slate-900 font-medium">{String(historik.antal_nycklar)}</dd></>
                        )}
                        {historik.tidigare_skador && (
                          <><dt className="text-slate-500">Tidigare skador</dt><dd className="text-slate-900 font-medium">{historik.tidigare_skador === 'ja' ? 'Ja' : 'Nej'}</dd></>
                        )}
                        {historik.antal_agare != null && (
                          <><dt className="text-slate-500">Antal ägare</dt><dd className="text-slate-900 font-medium">{String(historik.antal_agare)}</dd></>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {(() => {
            const utrustning = (car as Record<string, unknown>).utrustning as string[] | null;
            if (!utrustning || utrustning.length === 0) return null;
            return (
              <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">
                  Utrustning
                </h2>
                <div className="flex flex-wrap gap-2">
                  {utrustning.map((item, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-medium text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {(car as Record<string, unknown>).skick_kommentar && (
            <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">
                Skickkommentar
              </h2>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {String((car as Record<string, unknown>).skick_kommentar)}
              </p>
            </div>
          )}

          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-md p-5 flex items-start gap-3 text-sm text-slate-600">
            <Lock className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
            <p>
              Säljarens kontaktuppgifter visas först när auktionen är avslutad och
              du har vunnit budgivningen.
            </p>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Tid kvar
            </p>
            <div
              className={`inline-flex items-center gap-2 text-2xl font-bold tabular-nums ${
                timeInfo.ended
                  ? 'text-slate-500'
                  : timeInfo.warn
                  ? 'text-red-600'
                  : 'text-slate-900'
              }`}
            >
              <Clock className="w-5 h-5" />
              {timeInfo.label}
            </div>
            {car.auktion_slut && !timeInfo.ended && (
              <p className="text-xs text-slate-400 mt-2">
                Slutar{' '}
                {new Date(car.auktion_slut).toLocaleString('sv-SE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}
          </div>

          {car.startbud != null && (
            <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Startbud
              </p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {formatKr(car.startbud)} kr
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Lägsta nivå för budgivning enligt säljaren.
              </p>
            </div>
          )}

          <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Ditt nuvarande bud
            </p>
            {highestOwnBid > 0 ? (
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatKr(highestOwnBid)} kr
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {myBids.length} bud lagda
                </p>
              </div>
            ) : (
              <p className="text-slate-400">Du har inte lagt något bud ännu.</p>
            )}
          </div>

          {/* Reservation banners */}
          {reservation && reservation.dealer_id === dealerId && (() => {
            const diffMs = Math.max(0, new Date(reservation.expires_at).getTime() - Date.now());
            const totalSec = Math.floor(diffMs / 1000);
            const isLow = totalSec < 5 * 60;
            const progressPct = Math.min(100, Math.max(0, (diffMs / (30 * 60 * 1000)) * 100));
            return (
              <div className={`bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-2 ${isLow ? 'border-amber-300 bg-amber-50' : ''}`}>
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 shrink-0 ${isLow ? 'text-amber-600' : 'text-emerald-600'}`} />
                  <span className={`text-sm font-semibold ${isLow ? 'text-amber-800' : 'text-emerald-800'}`}>
                    Du har prioritet på detta lead
                  </span>
                </div>
                <p className={`text-xs tabular-nums font-medium ${isLow ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {countdown || '00:00'} kvar
                </p>
                <div className="h-1.5 rounded-full bg-emerald-200 overflow-hidden">
                  <div
                    className={`h-full rounded-xl transition-all duration-1000 ${isLow ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {reservation && reservation.dealer_id !== dealerId && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 shrink-0 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">
                  En annan handlare tittar just nu på denna bil
                </span>
              </div>
              <p className="text-xs text-amber-700">
                Du kan fortfarande lägga bud – budet är slutet
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmitBid}
            className="bg-white rounded-md border border-slate-200 p-6 shadow-sm space-y-4"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900">Lägg bud</h2>
              <p className="text-xs text-slate-500 mt-1">
                Sluten budgivning – andra handlares bud visas inte.
              </p>
            </div>

            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">
                Budbelopp
              </span>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={bidInput}
                  onChange={(e) => setBidInput(e.target.value)}
                  placeholder="0"
                  disabled={auctionClosed || submitting}
                  className="w-full pl-4 pr-12 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-lg font-semibold focus:outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 transition"
                />
                <span className="absolute inset-y-0 right-4 flex items-center text-slate-400 font-medium">
                  kr
                </span>
              </div>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">
                Kommentar <span className="text-slate-400 font-normal">(valfritt)</span>
              </span>
              <textarea
                value={kommentar}
                onChange={(e) => setKommentar(e.target.value)}
                rows={3}
                disabled={auctionClosed || submitting}
                placeholder="T.ex. förutsatt att servicehistoriken stämmer…"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 transition resize-none"
              />
            </label>

            <ErrorBanner message={submitError} />

            {lastBid !== null && !submitError && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Ditt bud på <strong>{formatKr(lastBid)} kr</strong> är registrerat.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={auctionClosed || submitting}
              className="w-full h-11 inline-flex items-center justify-center gap-2 bg-black hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-[14px] rounded-xl px-5 transition"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {auctionClosed
                ? 'Auktionen är avslutad'
                : submitting
                ? 'Skickar bud…'
                : 'Lägg bud'}
            </button>
          </form>
        </aside>
      </div>

      {lightboxIdx !== null && images[lightboxIdx] && (
        <div
          onClick={() => setLightboxIdx(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
        >
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={images[lightboxIdx].storage_url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </PortalLayout>
  );
}

function Info({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </dt>
      <dd className={`text-slate-900 mt-0.5 ${mono ? 'font-mono' : ''}`}>
        {value || '–'}
      </dd>
    </div>
  );
}
