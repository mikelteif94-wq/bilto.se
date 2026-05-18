import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Clock,
  Gavel,
  ImagePlus,
  Loader2,
  PhoneCall,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  Handshake,
} from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';
import ConditionReportForm, {
  ConditionReport,
  EMPTY_CONDITION_REPORT,
  isConditionReportFilled,
} from '../components/forms/ConditionReportForm';
import CarImageUploader, {
  PendingImage,
} from '../components/forms/CarImageUploader';
import { supabase } from '../lib/supabase';

interface MyCarPageProps {
  token: string;
  onBack: () => void;
}

type AuctionStatus =
  | 'ny'
  | 'aktiv'
  | 'auktion_avslutad'
  | 'inga_bud'
  | 'sald'
  | 'avslutad';

interface BrokerageOffer {
  id: string;
  expected_sale_price: number;
  commission_kr: number;
  estimated_days: number;
  kommentar: string;
  status: string;
  net_to_customer: number;
  foretagsnamn: string;
  created_at: string;
}

interface CarResponse {
  id: string;
  regnummer: string;
  marke: string;
  modell: string;
  ar: number;
  miltal: number;
  skick: string;
  status: AuctionStatus | string;
  sales_type: 'auction' | 'brokerage';
  auktion_slut: string | null;
  kund_beslut: string;
  kund_beslut_at: string | null;
  created_at: string;
  condition_report: ConditionReport | null;
  image_count: number;
  images: string[];
  customer: { namn: string } | null;
  winning_bid: { belopp: number; foretagsnamn: string } | null;
  brokerage_offers: BrokerageOffer[];
}

const SKICK_LABELS: Record<string, string> = {
  mycket_bra: 'Mycket bra',
  bra: 'Bra',
  okej: 'Okej',
  slitet: 'Slitet',
  skadat: 'Skadat',
};

function endpoint(): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  return `${base}/functions/v1/customer-car`;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

function formatKr(v: number): string {
  return v.toLocaleString('sv-SE');
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function MyCarPage({ token, onBack }: MyCarPageProps) {
  const [loading, setLoading] = useState(true);
  const [car, setCar] = useState<CarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchCar();
  }, [token]);

  const fetchCar = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${endpoint()}?token=${encodeURIComponent(token)}`, {
        headers: authHeaders(),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setError(json.error ?? 'Kunde inte hämta din bil.');
        setCar(null);
      } else {
        setCar(json.car);
      }
    } catch {
      setError('Kunde inte kontakta servern.');
    } finally {
      setLoading(false);
    }
  };

  const acceptBrokerageOffer = async (offerId: string) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch(endpoint(), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          token,
          action: 'accept_brokerage_offer',
          offer_id: offerId,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setError(json.error ?? 'Kunde inte acceptera erbjudandet.');
      } else {
        await fetchCar();
      }
    } catch {
      setError('Kunde inte kontakta servern.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitDecision = async (beslut: 'vill_salja' | 'vill_inte_salja') => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch(endpoint(), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ token, beslut }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setError(json.error ?? 'Kunde inte spara beslut.');
      } else {
        await fetchCar();
      }
    } catch {
      setError('Kunde inte kontakta servern.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error && !car) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-md border border-slate-200 p-10 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Länken är ogiltig</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Till startsidan
          </button>
        </div>
      </div>
    );
  }

  if (!car) return null;

  const title =
    [car.marke, car.modell, car.ar].filter(Boolean).join(' ') || 'Din bil';
  const fornamn = car.customer?.namn?.trim().split(' ')[0] ?? '';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0e6efe] h-16 flex items-center px-5 lg:px-8 sticky top-0 z-10">
        <a href="/" className="flex items-center">
          <img
            src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
            alt="Bilto"
            className="h-20 lg:h-32 w-auto object-contain"
          />
        </a>
        <button
          onClick={onBack}
          className="ml-auto flex items-center gap-2 text-white/90 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Startsida</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        <div>
          <p className="text-sm text-slate-500 mb-1">
            Hej {fornamn || 'och välkommen'}
          </p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">{title}</h1>
            <span className="font-mono text-lg font-semibold text-slate-500 tracking-wider">
              {car.regnummer}
            </span>
          </div>
        </div>

        <StatusCard car={car} />

        {car.images.length > 0 && (
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
            <img
              src={car.images[0]}
              alt="Din bil"
              className="w-full h-52 sm:h-80 object-cover"
            />
            {car.images.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-2">
                {car.images.slice(1, 6).map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="w-full h-16 sm:h-20 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-md border border-slate-200 p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Bilens uppgifter
          </h2>
          <dl className="grid sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
            <Row label="Miltal" value={`${formatKr(car.miltal)} mil`} />
            <Row
              label="Skick"
              value={SKICK_LABELS[car.skick] ?? car.skick}
            />
            <Row label="Inkom" value={formatDateTime(car.created_at)} />
            {car.auktion_slut && (
              <Row
                label="Auktion stänger"
                value={formatDateTime(car.auktion_slut)}
              />
            )}
          </dl>
        </div>

        {(car.status === 'ny' || car.status === 'aktiv') && (
          <CompleteListingCard
            car={car}
            token={token}
            onUpdated={fetchCar}
          />
        )}

        {car.sales_type === 'brokerage' && (
          <BrokerageOffersCard
            car={car}
            submitting={submitting}
            onAccept={acceptBrokerageOffer}
            error={error}
          />
        )}

        {car.sales_type !== 'brokerage' &&
          car.status === 'auktion_avslutad' &&
          car.winning_bid && (
            <DecisionCard
              car={car}
              submitting={submitting}
              onDecide={submitDecision}
              error={error}
            />
          )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between sm:block border-b sm:border-0 border-slate-100 pb-2 sm:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900 sm:mt-1">{value}</dd>
    </div>
  );
}

function StatusCard({ car }: { car: CarResponse }) {
  const isBrokerage = car.sales_type === 'brokerage';
  if (car.status === 'ny') {
    return (
      <Banner
        icon={<Clock className="w-5 h-5" />}
        tone="slate"
        title={
          isBrokerage
            ? 'Vi förbereder din förmedling'
            : 'Vi förbereder din bil för budgivning'
        }
        text="En personlig bilmäklare ringer dig inom kort för att finjustera värderingen. Du behöver inte göra något just nu."
      />
    );
  }
  if (car.status === 'aktiv') {
    if (isBrokerage) {
      return (
        <Banner
          icon={<Handshake className="w-5 h-5" />}
          tone="teal"
          title="Vi förmedlar din bil"
          text={
            car.auktion_slut
              ? `Bilto sköter försäljningen åt dig. Vi återkommer senast ${formatDateTime(car.auktion_slut)}.`
              : 'Bilto sköter försäljningen åt dig — vi tar fram bästa pris och hör av oss så fort vi har ett erbjudande.'
          }
        />
      );
    }
    return (
      <Banner
        icon={<Gavel className="w-5 h-5" />}
        tone="teal"
        title="Din bil är ute för budgivning"
        text={
          car.auktion_slut
            ? `Handlare lägger sina bästa bud. Vi återkommer senast ${formatDateTime(car.auktion_slut)} med högsta budet.`
            : 'Handlare lägger sina bästa bud. Vi återkommer inom 48 timmar med högsta budet.'
        }
      />
    );
  }
  if (car.status === 'inga_bud') {
    return (
      <Banner
        icon={<PhoneCall className="w-5 h-5" />}
        tone="amber"
        title="Inga bud den här gången"
        text="Tyvärr kom inga bud in. Din bilmäklare hör av sig för att diskutera nästa steg."
      />
    );
  }
  if (car.status === 'auktion_avslutad' && car.winning_bid) {
    return (
      <Banner
        icon={<Check className="w-5 h-5" />}
        tone="emerald"
        title={`Högsta budet: ${formatKr(car.winning_bid.belopp)} kr`}
        text={`Från ${car.winning_bid.foretagsnamn}. De ringer dig inom 24 timmar om du väljer att sälja.`}
      />
    );
  }
  if (car.status === 'sald') {
    return (
      <Banner
        icon={<Check className="w-5 h-5" />}
        tone="emerald"
        title="Affären är genomförd"
        text="Tack för att du använde oss. Vi hör gärna av oss till dig nästa gång."
      />
    );
  }
  return (
    <Banner
      icon={<Clock className="w-5 h-5" />}
      tone="slate"
      title="Avslutad"
      text="Denna förfrågan är avslutad."
    />
  );
}

type Tone = 'slate' | 'teal' | 'amber' | 'emerald';
const TONES: Record<Tone, { bg: string; border: string; icon: string; title: string }> = {
  slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-500', title: 'text-slate-900' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600', title: 'text-teal-900' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', title: 'text-amber-900' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', title: 'text-emerald-900' },
};

function Banner({
  icon,
  tone,
  title,
  text,
}: {
  icon: React.ReactNode;
  tone: Tone;
  title: string;
  text: string;
}) {
  const t = TONES[tone];
  return (
    <div className={`rounded-md border ${t.bg} ${t.border} p-6 flex gap-4`}>
      <div className={`${t.icon} mt-0.5`}>{icon}</div>
      <div>
        <h2 className={`text-lg font-semibold ${t.title} mb-1`}>{title}</h2>
        <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function BrokerageOffersCard({
  car,
  submitting,
  onAccept,
  error,
}: {
  car: CarResponse;
  submitting: boolean;
  onAccept: (offerId: string) => void;
  error: string | null;
}) {
  const offers = [...car.brokerage_offers].sort(
    (a, b) => b.net_to_customer - a.net_to_customer,
  );
  const accepted = offers.find((o) => o.status === 'accepted');

  if (accepted) {
    return (
      <div className="bg-white rounded-md border border-emerald-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <Check className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Du har accepterat ett förmedlingsuppdrag
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {accepted.foretagsnamn} kontaktar dig inom 24 timmar för att starta försäljningen.
            </p>
          </div>
        </div>
        <dl className="grid sm:grid-cols-3 gap-4 bg-slate-50 rounded-xl p-4 text-sm">
          <div>
            <dt className="text-slate-500">Förväntat slutpris</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">
              {formatKr(accepted.expected_sale_price)} kr
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Arvode</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">
              {formatKr(accepted.commission_kr)} kr
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Till dig (netto)</dt>
            <dd className="font-bold text-emerald-700 mt-0.5">
              {formatKr(accepted.net_to_customer)} kr
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <Banner
        icon={<Clock className="w-5 h-5" />}
        tone="slate"
        title="Inga erbjudanden ännu"
        text="Så snart handlare lämnat sina erbjudanden visas de här. Du får ett sms när första erbjudandet är inne."
      />
    );
  }

  const bestNet = offers[0].net_to_customer;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-md border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="w-5 h-5 text-[#0e6efe]" />
          <h2 className="text-lg font-semibold text-slate-900">
            {offers.length} {offers.length === 1 ? 'erbjudande' : 'erbjudanden'} från handlare
          </h2>
        </div>
        <p className="text-sm text-slate-600">
          Jämför förväntat pris, arvode och tid. Välj det som ger dig mest i plånboken.
        </p>
      </div>

      <ErrorBanner message={error} />

      <div className="grid gap-4">
        {offers.map((o, idx) => {
          const isBest = o.net_to_customer === bestNet;
          return (
            <div
              key={o.id}
              className={`bg-white rounded-md p-6 border relative ${
                isBest ? 'border-[#0e6efe] border-2' : 'border-slate-200'
              }`}
            >
              {isBest && (
                <div className="absolute -top-3 left-6 bg-[#0e6efe] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Högst netto
                </div>
              )}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Handlare {idx + 1}
                  </p>
                  <p className="text-[16px] font-semibold text-slate-900 mt-0.5">
                    {o.foretagsnamn || 'Certifierad handlare'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Till dig
                  </p>
                  <p
                    className={`text-[22px] font-semibold leading-tight ${
                      isBest ? 'text-[#0e6efe]' : 'text-slate-900'
                    }`}
                  >
                    {formatKr(o.net_to_customer)} kr
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 rounded-xl p-4 text-sm mb-5">
                <div>
                  <dt className="text-slate-500 text-xs">Förväntat pris</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {formatKr(o.expected_sale_price)} kr
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Arvode</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    {formatKr(o.commission_kr)} kr
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Tid till sälj</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">
                    ~{o.estimated_days} dagar
                  </dd>
                </div>
              </dl>

              {o.kommentar && (
                <p className="text-sm text-slate-600 italic border-l-2 border-slate-200 pl-3 mb-5">
                  "{o.kommentar}"
                </p>
              )}

              <button
                onClick={() => onAccept(o.id)}
                disabled={submitting || car.status !== 'aktiv'}
                className={`inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full font-semibold text-[14px] transition disabled:opacity-60 disabled:cursor-not-allowed ${
                  isBest
                    ? 'bg-[#0e6efe] hover:bg-[#0a57cc] text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ThumbsUp className="w-4 h-4" />
                )}
                Acceptera detta erbjudande
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 text-center">
        Inget arvode utgår om bilen inte säljs. Du kan alltid vänta och se om fler erbjudanden kommer in.
      </p>
    </div>
  );
}

function DecisionCard({
  car,
  submitting,
  onDecide,
  error,
}: {
  car: CarResponse;
  submitting: boolean;
  onDecide: (beslut: 'vill_salja' | 'vill_inte_salja') => void;
  error: string | null;
}) {
  if (car.kund_beslut === 'vill_salja') {
    return (
      <div className="bg-white rounded-md border border-emerald-200 p-6 text-center">
        <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Du har valt att sälja
        </h2>
        <p className="text-sm text-slate-600">
          {car.winning_bid?.foretagsnamn} ringer dig inom 24 timmar för att slutföra affären.
        </p>
      </div>
    );
  }
  if (car.kund_beslut === 'vill_inte_salja') {
    return (
      <div className="bg-white rounded-md border border-slate-200 p-6 text-center">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Du har tackat nej
        </h2>
        <p className="text-sm text-slate-600">
          Inga problem. Vi hör gärna av oss till dig nästa gång.
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-md border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">
        Vill du sälja till det här budet?
      </h2>
      <p className="text-sm text-slate-600 mb-5">
        Ingen förpliktelse — välj det som passar dig. Du kan också svara din
        bilmäklare när hen ringer.
      </p>
      <ErrorBanner message={error} className="mb-4" />
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          onClick={() => onDecide('vill_salja')}
          disabled={submitting}
          className="flex items-center justify-center gap-2 h-11 rounded-full bg-black text-white font-semibold text-[14px] hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
          Ja, jag vill sälja
        </button>
        <button
          onClick={() => onDecide('vill_inte_salja')}
          disabled={submitting}
          className="flex items-center justify-center gap-2 h-11 rounded-full border border-slate-300 text-slate-700 font-semibold text-[14px] hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          <ThumbsDown className="w-4 h-4" />
          Nej tack
        </button>
      </div>
    </div>
  );
}

function CompleteListingCard({
  car,
  token,
  onUpdated,
}: {
  car: CarResponse;
  token: string;
  onUpdated: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'rapport' | 'bilder'>('rapport');
  const [report, setReport] = useState<ConditionReport>(
    car.condition_report ?? EMPTY_CONDITION_REPORT,
  );
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reportFilled = isConditionReportFilled(car.condition_report);
  const hasImages = car.image_count > 0;
  const enoughImages = car.image_count >= 3;

  const saveReport = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSavedMsg(null);
    try {
      const resp = await fetch(endpoint(), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          token,
          action: 'complete_listing',
          condition_report: report,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setErrorMsg(json.error ?? 'Kunde inte spara skickrapporten.');
      } else {
        setSavedMsg('Skickrapporten är sparad. Tack!');
        await onUpdated();
      }
    } catch {
      setErrorMsg('Kunde inte kontakta servern.');
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async () => {
    if (pendingImages.length === 0) return;
    setSaving(true);
    setErrorMsg(null);
    setSavedMsg(null);
    try {
      const uploaded: { storage_url: string; ordning: number }[] = [];
      for (let i = 0; i < pendingImages.length; i++) {
        const img = pendingImages[i];
        const ext = img.file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${car.id}/${Date.now()}_extra_${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('car-images')
          .upload(path, img.file, {
            cacheControl: '3600',
            contentType: img.file.type || 'image/jpeg',
            upsert: false,
          });
        if (upErr) {
          setErrorMsg(`Bild ${i + 1} kunde inte laddas upp.`);
          setSaving(false);
          return;
        }
        const { data } = supabase.storage.from('car-images').getPublicUrl(path);
        uploaded.push({
          storage_url: data.publicUrl,
          ordning: car.image_count + i,
        });
      }

      const resp = await fetch(endpoint(), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          token,
          action: 'complete_listing',
          images: uploaded,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setErrorMsg(json.error ?? 'Bilderna kunde inte sparas.');
      } else {
        setSavedMsg('Bilderna är tillagda. Tack!');
        pendingImages.forEach((p) => URL.revokeObjectURL(p.preview));
        setPendingImages([]);
        await onUpdated();
      }
    } catch {
      setErrorMsg('Kunde inte kontakta servern.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    const allDone = reportFilled && enoughImages;
    return (
      <div
        className={`bg-white rounded-md border p-5 sm:p-6 ${
          allDone ? 'border-emerald-200' : 'border-[#0e6efe]/30'
        }`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              allDone ? 'bg-emerald-100 text-emerald-600' : 'bg-[#0e6efe]/10 text-[#0e6efe]'
            }`}
          >
            {allDone ? (
              <Check className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {allDone ? 'Allt är klart' : 'Komplettera och få högre bud'}
            </h2>
            <p className="text-sm text-slate-600 mb-3">
              {allDone
                ? 'Du har lämnat skickrapport och bilder. Du kan fortfarande lägga till mer om du vill.'
                : 'Mer detaljer ger handlare bättre underlag — och oftast högre bud. Det tar bara någon minut.'}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <Pill
                label={reportFilled ? 'Skickrapport klar' : 'Skickrapport saknas'}
                done={reportFilled}
              />
              <Pill
                label={
                  enoughImages
                    ? `${car.image_count} bilder`
                    : hasImages
                    ? `${car.image_count} bilder (rekommenderat 3+)`
                    : 'Inga bilder'
                }
                done={enoughImages}
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-sm font-semibold transition"
            >
              {allDone ? 'Lägg till mer' : 'Komplettera nu'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Komplettera din bil
        </h2>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setSavedMsg(null);
            setErrorMsg(null);
          }}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Stäng
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setTab('rapport')}
          className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-semibold transition ${
            tab === 'rapport'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          Skickrapport
        </button>
        <button
          type="button"
          onClick={() => setTab('bilder')}
          className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-semibold transition ${
            tab === 'bilder'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ImagePlus className="w-3.5 h-3.5" />
          Lägg till bilder
        </button>
      </div>

      <ErrorBanner message={errorMsg} className="mb-3" />
      {savedMsg && (
        <div className="mb-3 flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{savedMsg}</span>
        </div>
      )}

      {tab === 'rapport' && (
        <div className="space-y-4">
          <ConditionReportForm value={report} onChange={setReport} />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={saveReport}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] disabled:opacity-60 text-white text-sm font-semibold transition"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Spara skickrapport
            </button>
          </div>
        </div>
      )}

      {tab === 'bilder' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Lägg till fler bilder. Befintliga bilder finns kvar.
          </p>
          <CarImageUploader
            images={pendingImages}
            onChange={setPendingImages}
            maxImages={Math.max(0, 12 - car.image_count)}
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving || pendingImages.length === 0}
              onClick={uploadImages}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Ladda upp bilder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold ${
        done
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-amber-100 text-amber-800'
      }`}
    >
      {done ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {label}
    </span>
  );
}
