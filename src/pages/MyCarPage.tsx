import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Clock,
  Eye,
  Gavel,
  ImagePlus,
  Loader2,
  Lock,
  PhoneCall,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  MessageSquare,
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
import DealerProposalCard from '../components/DealerProposalCard';
import type { Database } from '../lib/database.types';

type DealerProposal = Database['public']['Tables']['dealer_proposals']['Row'];

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

interface CarResponse {
  id: string;
  regnummer: string;
  marke: string;
  modell: string;
  ar: number;
  miltal: number;
  skick: string;
  status: AuctionStatus | string;
  sales_type: string;
  auktion_slut: string | null;
  kund_beslut: string;
  kund_beslut_at: string | null;
  created_at: string;
  condition_report: ConditionReport | null;
  image_count: number;
  images: string[];
  customer: { namn: string; mejl: string } | null;
  winning_bid: { belopp: number; foretagsnamn: string } | null;
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
    Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
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
  const [proposals, setProposals] = useState<DealerProposal[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    void fetchCar();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
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
        // Load dealer proposals for this car (anon read via RLS)
        void loadProposals(json.car?.id);
      }
    } catch {
      setError('Kunde inte kontakta servern.');
    } finally {
      setLoading(false);
    }
  };

  const loadProposals = async (carId: string | undefined) => {
    if (!carId) return;
    const { data } = await supabase
      .from('dealer_proposals')
      .select('*')
      .eq('car_id', carId)
      .in('status', ['sent', 'viewed'])
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setProposals(data as DealerProposal[]);
      // Mark as viewed
      for (const p of data) {
        if (p.status === 'sent') {
          void supabase
            .from('dealer_proposals')
            .update({ status: 'viewed', viewed_at: new Date().toISOString() })
            .eq('id', p.id);
        }
      }
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

        {!isLoggedIn && (car.status === 'ny' || car.status === 'aktiv' || car.status === 'auktion_avslutad') && car.customer?.mejl && (
          <CreateAccountCard mejl={car.customer.mejl} />
        )}

        {car.images.length > 0 && (
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
            <img
              src={car.images[0]}
              alt="Din bil"
              className="w-full h-52 sm:h-80 object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            {car.images.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-2">
                {car.images.slice(1, 6).map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="w-full h-16 sm:h-20 object-cover rounded-lg"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
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

        {car.status === 'auktion_avslutad' &&
          car.winning_bid && (
            <DecisionCard
              car={car}
              submitting={submitting}
              onDecide={submitDecision}
              error={error}
            />
          )}

        {proposals.length > 0 && (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <MessageSquare className="w-5 h-5 text-[#0e6efe]" />
              <h2 className="text-lg font-semibold text-slate-900">
                {proposals.length === 1 ? '1 handlarförslag' : `${proposals.length} handlarförslag`}
              </h2>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Handlare har skickat dig personliga erbjudanden — jämför och välj det som passar bäst.
            </p>
            <div className="grid gap-5">
              {proposals.map((p) => (
                <DealerProposalCard key={p.id} proposal={p} />
              ))}
            </div>
          </div>
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
  if (car.status === 'ny') {
    return (
      <Banner
        icon={<Clock className="w-5 h-5" />}
        tone="slate"
        title="Vi förbereder din bil för budgivning"
        text="En personlig bilmäklare ringer dig inom kort för att finjustera värderingen. Du behöver inte göra något just nu."
      />
    );
  }
  if (car.status === 'aktiv') {
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
  const [report, setReport] = useState<ConditionReport>({
    ...EMPTY_CONDITION_REPORT,
    ...car.condition_report,
    mekaniskt: car.condition_report?.mekaniskt ?? {},
    kosmetiskt: car.condition_report?.kosmetiskt ?? {},
    inredning: car.condition_report?.inredning ?? {},
    historik: { ...EMPTY_CONDITION_REPORT.historik, ...car.condition_report?.historik },
    kommentarer: { ...EMPTY_CONDITION_REPORT.kommentarer, ...car.condition_report?.kommentarer },
  });
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

function CreateAccountCard({ mejl }: { mejl: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) {
      setErr('Lösenordet måste vara minst 6 tecken.');
      return;
    }
    if (password !== confirm) {
      setErr('Lösenorden matchar inte.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.signUp({
      email: mejl,
      password,
      options: { data: {} },
    });
    setSaving(false);
    if (error && error.message?.toLowerCase().includes('already registered')) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: mejl, password });
      if (signInErr) {
        setErr('Det finns redan ett konto med det lösenordet. Prova att logga in på /logga-in.');
        return;
      }
      setDone(true);
      return;
    }
    if (error) {
      setErr(error.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-emerald-600" strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-900">Kontot är skapat</p>
          <p className="text-[13px] text-emerald-700 mt-0.5 leading-relaxed">
            Du kan nu följa budgivningen live. Logga in på <a href="/logga-in" className="underline font-medium">Mina sidor</a> nästa gång.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#0e6efe]/20 rounded-2xl p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
          <Gavel className="w-5 h-5 text-[#0e6efe]" strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-[13px] font-bold text-slate-900">Skapa ditt konto för att följa buden</p>
          <p className="text-[12.5px] text-slate-500 mt-0.5 leading-relaxed">
            Välj ett lösenord och logga in för att se buden i realtid.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        {[
          { icon: Eye, text: 'Se alla bud live' },
          { icon: Lock, text: 'Dina uppgifter skyddas' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <Icon className="w-3.5 h-3.5 text-[#0e6efe] shrink-0" strokeWidth={2} />
            {text}
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 mb-1">Konto</label>
          <input
            type="text"
            value={mejl}
            disabled
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 mb-1">Välj lösenord</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Minst 6 tecken"
            autoComplete="new-password"
            className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/40 focus:border-[#0e6efe] transition"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 mb-1">Bekräfta lösenord</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Upprepa lösenordet"
            autoComplete="new-password"
            className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/40 focus:border-[#0e6efe] transition"
          />
        </div>
        {err && <p className="text-[12px] text-red-600">{err}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full h-11 bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:opacity-60 text-white font-semibold text-[14px] rounded-full transition flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Skapa konto och se buden
        </button>
      </form>
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
