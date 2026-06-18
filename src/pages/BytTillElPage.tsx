import { useState } from 'react';
import {
  ChevronLeft, Phone, Check, X, User, Star, ShieldCheck,
  Zap, Leaf, ArrowRight, AlertCircle, Loader2, CheckCircle2,
} from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';
import { validateSwedishPhone } from '../lib/utils';
import { useVehicleLookup } from '../lib/useVehicleLookup';
import { supabase } from '../lib/supabase';

type ElInterest = 'el' | 'laddhybrid' | 'vet_ej';
type FormStep = 'interest' | 'details' | 'contact' | 'done';

interface BytTillElPageProps {
  onBack: () => void;
}

function VehicleChip({ regnummer }: { regnummer: string }) {
  const lookup = useVehicleLookup(regnummer);
  if (lookup.status === 'loading') {
    return (
      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
        <span className="text-[12px] text-slate-500">Hämtar bilinfo…</span>
      </div>
    );
  }
  if (lookup.status === 'found') {
    const d = lookup.data;
    return (
      <div className="flex items-start gap-2.5 mt-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-bold text-emerald-800">{d.marke} {d.modell} {d.variant}</p>
          <p className="text-[11px] text-emerald-700">{d.ar} · {d.bransle} · {d.farg}</p>
        </div>
      </div>
    );
  }
  if (lookup.status === 'not_found') {
    return (
      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[12px] text-amber-700">Hittade ingen bil på det registreringsnumret.</span>
      </div>
    );
  }
  return null;
}

// ─── Step 1: Interest ─────────────────────────────────────────────────────────
function InterestStep({ onChoose }: { onChoose: (v: ElInterest) => void }) {
  const options: { val: ElInterest; icon: typeof Zap; label: string; desc: string }[] = [
    {
      val: 'el',
      icon: Zap,
      label: 'Elbil',
      desc: 'Jag vill köra 100 % fossilfritt och ha lägsta möjliga driftkostnad.',
    },
    {
      val: 'laddhybrid',
      icon: Leaf,
      label: 'Laddhybrid',
      desc: 'Jag kör varierat — kort vardag och längre resor ibland.',
    },
    {
      val: 'vet_ej',
      icon: ShieldCheck,
      label: 'Vet inte ännu',
      desc: 'Hjälp mig förstå vilket alternativ som passar mig bäst.',
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-[15px] text-slate-600 leading-[1.55]">Välj det som stämmer bäst.</p>
      {options.map(({ val, icon: Icon, label, desc }) => (
        <button
          key={val}
          type="button"
          onClick={() => onChoose(val)}
          className="group w-full text-left rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 hover:border-[#0e6efe] hover:bg-[#0e6efe]/[0.03] transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition-colors">
              <Icon className="w-5 h-5 text-slate-600 group-hover:text-[#0e6efe] transition-colors" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[17px] sm:text-[18px] font-semibold text-slate-900 tracking-tight">{label}</h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0e6efe] shrink-0 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[14.5px] text-slate-600 leading-[1.55] mt-1.5">{desc}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Step 2: Details ──────────────────────────────────────────────────────────
interface DetailsData {
  regnummer: string;
  hasTradeIn: boolean | null;
  hasLoan: boolean | null;
  loanAmount: string;
  additionalRequests: string;
}

function DetailsStep({
  interest,
  initialData,
  onNext,
}: {
  interest: ElInterest;
  initialData: DetailsData;
  onNext: (d: DetailsData) => void;
}) {
  const [d, setD] = useState<DetailsData>(initialData);
  const [error, setError] = useState<string | null>(null);

  const interestLabel = interest === 'el' ? 'elbil' : interest === 'laddhybrid' ? 'laddhybrid' : 'el eller laddhybrid';

  const handleNext = () => {
    if (d.hasTradeIn === null) { setError('Välj om du har en bil att byta in.'); return; }
    setError(null);
    onNext(d);
  };

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-slate-600 leading-[1.55]">
        Du är intresserad av <span className="font-semibold text-slate-900">{interestLabel}</span>. Berätta lite mer.
      </p>

      {/* Trade-in */}
      <div>
        <p className="text-[14px] font-semibold text-slate-900 mb-3">Har du en bil att byta in?</p>
        <div className="grid grid-cols-2 gap-3">
          {[{ val: true, label: 'Ja' }, { val: false, label: 'Nej' }].map(opt => (
            <button
              key={String(opt.val)}
              type="button"
              onClick={() => { setD(prev => ({ ...prev, hasTradeIn: opt.val })); setError(null); }}
              className={`h-12 rounded-xl border-2 font-semibold text-[14px] transition-all ${
                d.hasTradeIn === opt.val
                  ? 'border-[#0e6efe] bg-[#0e6efe]/5 text-[#0e6efe]'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {d.hasTradeIn === true && (
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
            Regnummer på din nuvarande bil
          </label>
          <input
            type="text"
            placeholder="ABC123"
            value={d.regnummer}
            onChange={e => setD(prev => ({ ...prev, regnummer: e.target.value }))}
            className="form-control uppercase"
            maxLength={10}
          />
          <VehicleChip regnummer={d.regnummer} />
        </div>
      )}

      {d.hasTradeIn === true && (
        <div>
          <p className="text-[14px] font-semibold text-slate-900 mb-3">Har du ett billån på den?</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ val: true, label: 'Ja' }, { val: false, label: 'Nej' }].map(opt => (
              <button
                key={String(opt.val)}
                type="button"
                onClick={() => setD(prev => ({ ...prev, hasLoan: opt.val }))}
                className={`h-12 rounded-xl border-2 font-semibold text-[14px] transition-all ${
                  d.hasLoan === opt.val
                    ? 'border-[#0e6efe] bg-[#0e6efe]/5 text-[#0e6efe]'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {d.hasLoan === true && (
            <div className="mt-3">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Ungefärligt lånesaldo (kr)</label>
              <input
                type="number"
                placeholder="80 000"
                value={d.loanAmount}
                onChange={e => setD(prev => ({ ...prev, loanAmount: e.target.value }))}
                className="form-control"
              />
            </div>
          )}
        </div>
      )}

      {/* Önskemål */}
      <div>
        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
          Övriga önskemål <span className="font-normal text-slate-400">(valfritt)</span>
        </label>
        <textarea
          rows={3}
          placeholder="T.ex. budget, märke, räckvidd, laddmöjligheter…"
          value={d.additionalRequests}
          onChange={e => setD(prev => ({ ...prev, additionalRequests: e.target.value }))}
          className="form-control resize-none"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleNext}
        className="w-full h-12 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-[15px] rounded-full transition shadow-sm"
      >
        Fortsätt
      </button>
    </div>
  );
}

// ─── Step 3: Contact ──────────────────────────────────────────────────────────
interface ContactData {
  namn: string;
  telefon: string;
  mejl: string;
  preferredTime: string;
}

function ContactStep({
  initialData,
  onNext,
  submitting,
}: {
  initialData: ContactData;
  onNext: (d: ContactData) => void;
  submitting: boolean;
}) {
  const [d, setD] = useState<ContactData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const TIMES = [
    { value: 'whenever', label: 'När som helst' },
    { value: 'morning', label: 'Förmiddag' },
    { value: 'afternoon', label: 'Eftermiddag' },
  ];

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!d.namn.trim()) e.namn = 'Namn är obligatoriskt';
    const phoneErr = validateSwedishPhone(d.telefon);
    if (phoneErr) e.telefon = phoneErr;
    if (!d.mejl.trim()) {
      e.mejl = 'E-post är obligatorisk';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.mejl)) {
      e.mejl = 'Ogiltig e-postadress';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onNext(d);
  };

  const set = (key: keyof ContactData, value: string) => {
    setD(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Fullständigt namn</label>
        <input
          type="text"
          autoComplete="name"
          value={d.namn}
          onChange={e => set('namn', e.target.value)}
          placeholder="Johan Andersson"
          className={`form-control ${errors.namn ? 'form-control-error' : ''}`}
        />
        {errors.namn && <p className="mt-1 text-[12px] text-red-500">{errors.namn}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Telefonnummer</label>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={d.telefon}
          onChange={e => set('telefon', e.target.value)}
          placeholder="070-123 45 67"
          className={`form-control ${errors.telefon ? 'form-control-error' : ''}`}
        />
        {errors.telefon && <p className="mt-1 text-[12px] text-red-500">{errors.telefon}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">E-postadress</label>
        <input
          type="text"
          inputMode="email"
          autoComplete="email"
          value={d.mejl}
          onChange={e => set('mejl', e.target.value)}
          placeholder="johan@example.com"
          className={`form-control ${errors.mejl ? 'form-control-error' : ''}`}
        />
        {errors.mejl && <p className="mt-1 text-[12px] text-red-500">{errors.mejl}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Bästa tid att ringa</label>
        <div className="flex flex-wrap gap-2">
          {TIMES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('preferredTime', d.preferredTime === t.value ? '' : t.value)}
              className={`px-4 sm:px-5 h-10 rounded-full text-[14px] font-medium transition-all ${
                d.preferredTime === t.value
                  ? 'bg-[#0e6efe] text-white ring-1 ring-inset ring-[#0e6efe] shadow-sm'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-12 bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[15px] rounded-full transition mt-2 shadow-sm"
      >
        {submitting ? 'Skickar…' : 'Boka gratis rådgivning'}
      </button>
      <p className="text-[12px] text-slate-500 text-center">100% kostnadsfritt · Ingen bindning · Vi hör av oss inom en arbetsdag</p>
    </form>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BytTillElPage({ onBack }: BytTillElPageProps) {
  const [step, setStep] = useState<FormStep>('interest');
  const [interest, setInterest] = useState<ElInterest>('vet_ej');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [details, setDetails] = useState<DetailsData>({
    regnummer: '',
    hasTradeIn: null,
    hasLoan: null,
    loanAmount: '',
    additionalRequests: '',
  });

  const [contact, setContact] = useState<ContactData>({
    namn: '',
    telefon: '',
    mejl: '',
    preferredTime: '',
  });

  const stepFlow: FormStep[] = ['interest', 'details', 'contact'];
  const currentIndex = step === 'done' ? stepFlow.length : stepFlow.indexOf(step);
  const totalSteps = stepFlow.length;
  const currentStepNum = currentIndex + 1;

  const titles: Record<FormStep, string> = {
    interest: 'Vad är du intresserad av?',
    details: 'Berätta lite mer',
    contact: 'Dina uppgifter',
    done: 'Tack!',
  };

  const handleBack = () => {
    setError(null);
    if (step === 'interest') { onBack(); return; }
    if (step === 'details') { setStep('interest'); return; }
    if (step === 'contact') { setStep('details'); return; }
  };

  const handleSubmit = async (contactData: ContactData) => {
    setContact(contactData);
    setSubmitting(true);
    setError(null);

    try {
      const nameParts = contactData.namn.trim().split(' ');
      const firstname = nameParts[0] || '';
      const lastname = nameParts.slice(1).join(' ') || '';
      const reg = details.regnummer.trim().toUpperCase();
      const interestLabel = interest === 'el' ? 'Elbil' : interest === 'laddhybrid' ? 'Laddhybrid' : 'El eller laddhybrid';

      const vehicleNote = '';
      const notes = [vehicleNote, `Intresse: ${interestLabel}`].filter(Boolean).join(' · ');

      const { error: leadErr } = await supabase.from('leads').insert({
        regnummer: reg,
        telefon: contactData.telefon.trim(),
        email: contactData.mejl.trim(),
        guidance_requested: true,
      });
      if (leadErr) throw leadErr;

      const { error: quoteErr } = await supabase.from('quote_requests').insert({
        search_option: 'Byt till el',
        regnummer: reg,
        firstname,
        lastname,
        email: contactData.mejl.trim(),
        phone: contactData.telefon.trim(),
        fuel_type: interest,
        has_trade_in: details.hasTradeIn === true,
        trade_in_reg: details.hasTradeIn ? reg : '',
        current_loan: details.hasLoan ? details.loanAmount : '',
        target_car: interestLabel,
        additional_requests: details.additionalRequests,
        preferred_time: contactData.preferredTime,
        notes,
        status: 'new',
      });
      if (quoteErr) throw quoteErr;

      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-quote-request`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
      } catch { /* best effort */ }

      setStep('done');
    } catch {
      setError('Något gick fel. Försök igen eller ring oss på 08-5555 0200.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col">
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button onClick={onBack} className="shrink-0 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              fetchPriority="high"
              decoding="async"
              className="h-20 lg:h-32 w-auto object-contain"
            />
          </button>
          <div className="flex items-center ml-auto">
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/logga-in');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-flex items-center gap-2 bg-white text-[#0e6efe] text-[14px] font-semibold px-5 h-10 rounded-full hover:bg-slate-100 transition whitespace-nowrap"
            >
              <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
              Mina erbjudanden
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 pt-24 sm:pt-28 pb-6 sm:pb-8">
        <div className="w-full max-w-lg">
          {step !== 'done' && (
            <div className="mb-6 sm:mb-8">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-slate-500 hover:text-[#0e6efe] transition mb-4 sm:mb-5 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Tillbaka
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1.5 flex-1">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i < currentStepNum ? 'bg-[#0e6efe]' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap font-medium">
                  {currentStepNum} / {totalSteps}
                </span>
              </div>

              <h1 className="text-[22px] sm:text-2xl font-bold text-slate-900 leading-tight">
                {titles[step]}
              </h1>
            </div>
          )}

          <ErrorBanner message={error} className="mb-6" />

          {step === 'interest' && (
            <InterestStep
              onChoose={(v) => {
                setInterest(v);
                setStep('details');
                setError(null);
              }}
            />
          )}

          {step === 'details' && (
            <DetailsStep
              interest={interest}
              initialData={details}
              onNext={(d) => {
                setDetails(d);
                setStep('contact');
                setError(null);
              }}
            />
          )}

          {step === 'contact' && (
            <ContactStep
              initialData={contact}
              onNext={handleSubmit}
              submitting={submitting}
            />
          )}

          {step === 'done' && (
            <div className="pt-12 sm:pt-16 pb-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-[24px] sm:text-[28px] font-bold text-slate-900 mb-3">
                  Tack, {contact.namn.split(' ')[0]}!
                </h1>
                <p className="text-[15px] text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Din förfrågan är mottagen. En elexpert tar vid och hör av sig — du behöver inte göra ett dugg mer.
                </p>
              </div>

              <div className="max-w-sm mx-auto mb-7 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-[#0e6efe]/5 px-5 py-3 border-b border-slate-100">
                  <p className="text-[12px] font-bold text-[#0e6efe] uppercase tracking-wider">Din tilldelade expert</p>
                </div>
                <div className="p-5 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src="/Man_in_car_showroom_portrait.png"
                      alt="Marcus Holm"
                      className="w-14 h-14 rounded-full object-cover object-top border-2 border-slate-200"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-slate-900">Marcus Holm</p>
                    <p className="text-[12px] text-[#0e6efe] font-medium">Elbilsspecialist · 8 år</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-5 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[12.5px] text-slate-600 leading-relaxed">
                    Marcus jobbar <span className="font-semibold">uteslutande för dig</span> — aldrig för handlaren.
                  </p>
                </div>
              </div>

              <div className="max-w-sm mx-auto bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-7 flex items-start gap-2.5 text-left">
                <span className="text-amber-500 text-[16px] shrink-0 mt-px">✉</span>
                <p className="text-[13px] text-amber-800 leading-relaxed">
                  Vi har skickat en bekräftelse till din mejl. Hamnar den inte i inkorgen? Kolla skräpposten.
                </p>
              </div>

              <div className="max-w-sm mx-auto space-y-3 text-left mb-10">
                <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-[#0e6efe] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900">Förfrågan mottagen</p>
                    <p className="text-[13px] text-slate-500">Vi har all information vi behöver.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-slate-500">2</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900">Experten hör av sig</p>
                    <p className="text-[13px] text-slate-500">
                      {contact.preferredTime === 'morning' ? 'Förmiddag' : contact.preferredTime === 'afternoon' ? 'Eftermiddag' : 'Inom en arbetsdag'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-slate-500">3</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900">Vi hittar din elbil och sköter allt</p>
                    <p className="text-[13px] text-slate-500">Inbyte, laddbox och finansiering — vi tar hand om det.</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <a
                  href="tel:+46855550200"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 text-slate-700 text-[14px] font-medium hover:bg-slate-200 transition"
                >
                  <Phone className="w-4 h-4" />
                  Ring oss direkt: 08-5555 0200
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guidance modal removed — handled by expert card on done screen */}
    </div>
  );
}
