import { useState, useEffect } from 'react';
import { ChevronLeft, Phone, Check, X, User, Star, ShieldCheck } from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';
import { validateSwedishPhone } from '../lib/utils';
import BuyTrackStep, { type BuyTrack } from '../components/forms/BuyTrackStep';
import BuyDetailsStep, { type BuyDetailsData } from '../components/forms/BuyDetailsStep';
import BuyTradeInStep, { type BuyTradeInData } from '../components/forms/BuyTradeInStep';
import BuyContactStep, { type BuyContactData } from '../components/forms/BuyContactStep';
import { supabase } from '../lib/supabase';

interface BuyCarPageProps {
  initialBil?: string;
  initialTyp?: BuyTrack;
  initialReg?: string;
  source?: string;
  onBack: () => void;
}

type FormStep = 'track' | 'details' | 'tradeIn' | 'contact' | 'done';

export default function BuyCarPage({
  initialBil = '',
  initialTyp,
  initialReg = '',
  source = '',
  onBack,
}: BuyCarPageProps) {
  const skipTrack = !!initialTyp;
  const [track, setTrack] = useState<BuyTrack>(initialTyp || 'found');
  const [step, setStep] = useState<FormStep>(skipTrack ? 'details' : 'track');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [details, setDetails] = useState<BuyDetailsData>({
    linkOrSeller: '',
    carModel: initialBil,
    carBrand: '',
    paymentType: '',
    buyingStage: '',
    fuelType: '',
    regnummer: initialReg,
    miltal: '',
    targetCar: '',
    desiredMonthlyCost: '',
    additionalRequests: '',
    carPrice: '',
    yearFrom: '',
    yearTo: '',
    maxMiltal: '',
    hasQuote: null,
  });

  const [tradeIn, setTradeIn] = useState<BuyTradeInData>({
    hasTradeIn: initialTyp === 'trade' && !!initialReg ? true : null,
    tradeInReg: initialTyp === 'trade' ? initialReg : '',
    hasLoan: null,
    loanAmount: '',
    interestRate: '',
  });

  const [contact, setContact] = useState<BuyContactData>({
    namn: '',
    telefon: '',
    mejl: '',
    preferredTime: '',
    dealReadiness: '',
  });

  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [guidanceName, setGuidanceName] = useState('');
  const [guidancePhone, setGuidancePhone] = useState('');
  const [guidanceEmail, setGuidanceEmail] = useState('');
  const [guidanceSubmitting, setGuidanceSubmitting] = useState(false);
  const [guidanceDone, setGuidanceDone] = useState(false);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.5);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const submitGuidance = async () => {
    const namn = guidanceName.trim();
    const telefon = guidancePhone.trim();
    const emailVal = guidanceEmail.trim();
    if (namn.length < 2) { setGuidanceError('Fyll i ditt namn.'); return; }
    const phoneErr = validateSwedishPhone(telefon);
    if (phoneErr) { setGuidanceError(phoneErr); return; }
    setGuidanceError(null);
    setGuidanceSubmitting(true);
    const { error: insertError } = await supabase.from('leads').insert({
      regnummer: '',
      telefon,
      email: emailVal,
      miltal: 0,
      guidance_requested: true,
    } as never);
    setGuidanceSubmitting(false);
    if (insertError) { setGuidanceError('Något gick fel. Försök igen.'); return; }
    try {
      const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-lead`;
      await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefon, namn, email: emailVal, regnummer: '', miltal: 0, source: 'Köp-rådgivning', guidance_requested: true }),
      });
    } catch { /* best effort */ }
    setGuidanceDone(true);
  };

  const buildStepFlow = (): FormStep[] => {
    if (track === 'trade') {
      return skipTrack
        ? ['details', 'tradeIn', 'contact']
        : ['track', 'details', 'tradeIn', 'contact'];
    }
    if (track === 'know' || track === 'explore') {
      return ['track', 'details', 'tradeIn', 'contact'];
    }
    return skipTrack
      ? ['details', 'tradeIn', 'contact']
      : ['track', 'details', 'tradeIn', 'contact'];
  };

  const stepFlow = step === 'done' ? ['done'] as FormStep[] : buildStepFlow();
  const currentIndex = stepFlow.indexOf(step);
  const totalSteps = stepFlow.length;
  const currentStepNum = currentIndex + 1;

  const titles: Record<FormStep, string> = {
    track: 'Hur kan vi hjälpa dig?',
    details: track === 'found'
      ? 'Berätta om bilen'
      : track === 'know'
      ? 'Vilken bil söker du?'
      : track === 'explore'
      ? 'Vad är viktigt för dig?'
      : track === 'searching'
      ? 'Berätta vad du söker'
      : 'Berätta om ditt byte',
    tradeIn: 'Inbytesbil',
    contact: 'Dina uppgifter',
    done: 'Tack!',
  };

  const handleBack = () => {
    setError(null);
    if (step === 'done') return;
    const prev = stepFlow[currentIndex - 1];
    if (!prev) { onBack(); return; }
    setStep(prev);
  };

  const goNext = () => {
    const next = stepFlow[currentIndex + 1];
    if (next) setStep(next);
  };

  const handleSubmit = async (contactData: BuyContactData) => {
    setContact(contactData);
    setSubmitting(true);
    setError(null);

    try {
      const carModelFull = [details.carBrand, details.carModel].filter(Boolean).join(' ').trim();
      const dbTrack = (track === 'know' || track === 'explore') ? 'searching' : track;
      const { data: insertedRow, error: dbError } = await supabase.from('quote_requests').insert({
        search_option: dbTrack,
        regnummer: track === 'trade' ? details.regnummer : '',
        miltal: details.miltal ? parseInt(details.miltal) : 0,
        buying_stage: details.buyingStage,
        budget: details.carPrice,
        payment_type: details.paymentType || '',
        car_model: carModelFull || details.targetCar,
        fuel_type: details.fuelType === 'no_pref' ? '' : details.fuelType,
        link_or_seller: details.linkOrSeller,
        target_car: details.targetCar,
        additional_requests: [
          details.additionalRequests,
          details.hasQuote === true ? '[Har fått offert]' : details.hasQuote === false ? '[Har inte fått offert]' : '',
          source ? `[Källa: ${source}]` : '',
        ].filter(Boolean).join('\n'),
        desired_monthly_cost: details.paymentType === 'cash' ? '' : details.desiredMonthlyCost,
        monthly_payment: details.paymentType === 'cash' ? '' : details.desiredMonthlyCost,
        has_trade_in: track === 'trade' ? true : (tradeIn.hasTradeIn ?? false),
        trade_in_reg: track === 'trade' ? details.regnummer : (tradeIn.hasTradeIn ? tradeIn.tradeInReg : ''),
        current_loan: tradeIn.hasLoan ? tradeIn.loanAmount : '',
        current_interest_rate: tradeIn.hasLoan ? tradeIn.interestRate : '',
        firstname: contactData.namn.split(' ')[0] || '',
        lastname: contactData.namn.split(' ').slice(1).join(' ') || '',
        email: contactData.mejl,
        phone: contactData.telefon,
        preferred_time: contactData.preferredTime,
        deal_readiness: contactData.dealReadiness || '',
        status: 'new',
      }).select('id').maybeSingle();

      if (dbError) {
        setError('Kunde inte spara din förfrågan. Försök igen eller ring oss.');
        setSubmitting(false);
        return;
      }

      const qrId = (insertedRow as { id?: string } | null)?.id ?? null;
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-quote-request`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quote_request_id: qrId }),
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
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-14 lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
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
                window.history.pushState({}, '', '/gratis-konsultation');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-flex items-center bg-white text-[#0e6efe] text-[12px] lg:text-[14px] font-semibold px-4 lg:px-5 h-10 rounded-full hover:bg-slate-100 transition whitespace-nowrap"
            >
              Kostnadsfri konsultation
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

          {step === 'track' && (
            <BuyTrackStep
              initialBil={initialBil}
              onChoose={(t) => {
                setTrack(t);
                setStep('details');
                setError(null);
              }}
              onGuidance={() => {
                setGuidanceOpen(true);
                setGuidanceDone(false);
                setGuidanceError(null);
              }}
            />
          )}

          {step === 'details' && (
            <BuyDetailsStep
              track={track}
              initialData={details}
              initialBil={initialBil}
              onNext={(data) => {
                setDetails(data);
                if (track === 'trade' && data.regnummer) {
                  setTradeIn(prev => ({ ...prev, tradeInReg: data.regnummer, hasTradeIn: true }));
                }
                goNext();
                setError(null);
              }}
            />
          )}

          {step === 'tradeIn' && (
            <BuyTradeInStep
              initialData={tradeIn}
              onNext={(data) => {
                setTradeIn(data);
                goNext();
                setError(null);
              }}
            />
          )}

          {step === 'contact' && (
            <BuyContactStep
              initialData={contact}
              onNext={handleSubmit}
              submitting={submitting}
            />
          )}

          {step === 'done' && (
            <div className="pt-12 sm:pt-16 pb-10">
              {/* Success badge */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-[24px] sm:text-[28px] font-bold text-slate-900 mb-3">
                  Tack, {contact.namn.split(' ')[0]}!
                </h1>
                <p className="text-[15px] text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Din förfrågan är mottagen. En expert tar vid och hör av sig — du behöver inte göra ett dugg mer.
                </p>
              </div>

              {/* Expert handoff card */}
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
                    <p className="text-[12px] text-[#0e6efe] font-medium">Seniorförhandlare · 12 år</p>
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

              {/* Email notice */}
              <div className="max-w-sm mx-auto bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-7 flex items-start gap-2.5 text-left">
                <span className="text-amber-500 text-[16px] shrink-0 mt-px">✉</span>
                <p className="text-[13px] text-amber-800 leading-relaxed">
                  Vi har skickat en bekräftelse till din mejl. Hamnar den inte i inkorgen? Kolla skräpposten.
                </p>
              </div>

              {/* Steps */}
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
                    <p className="text-[14px] font-semibold text-slate-900">Vi förhandlar och levererar</p>
                    <p className="text-[13px] text-slate-500">Du lutar dig tillbaka — vi sköter resten.</p>
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

      {scrolled && step !== 'done' && (
        <a
          href="tel:+46855550200"
          className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center justify-center gap-2.5 h-14 rounded-full bg-[#0e6efe] hover:bg-[#0047B3] text-white font-semibold text-[15px] shadow-[0_10px_30px_rgba(14,110,254,0.4)] transition animate-[slideUp_0.3s_ease-out]"
        >
          <img src="/Man_in_car_showroom_portrait.png" alt="Expert" className="w-8 h-8 rounded-full object-cover border-2 border-white/40 shrink-0" />
          <span>Ring expert &middot; bud direkt</span>
        </a>
      )}

      {guidanceOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-6">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#0e6efe]/10 flex items-center justify-center">
                  <Phone className="w-4.5 h-4.5 text-[#0e6efe]" strokeWidth={2.2} />
                </div>
                <h3 className="text-[17px] font-semibold text-slate-900">
                  {guidanceDone ? 'Tack — vi hör av oss!' : 'Vi ringer och guidar dig'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGuidanceOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                aria-label="Stäng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {guidanceDone ? (
              <div className="px-5 sm:px-6 py-6">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#0e6efe] shrink-0 mt-0.5" />
                  <p className="text-[14.5px] text-slate-600 leading-[1.55]">
                    En av våra rådgivare ringer upp dig inom kort och hjälper dig välja det bästa sättet att köpa din bil. Helt kostnadsfritt och utan bindning.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGuidanceOpen(false)}
                  className="mt-6 w-full h-11 bg-[#0e6efe] hover:bg-[#0b5ce0] text-white font-semibold rounded-lg transition-colors"
                >
                  Klar
                </button>
              </div>
            ) : (
              <div className="px-5 sm:px-6 py-5">
                <p className="text-[14.5px] text-slate-600 leading-[1.55] mb-4">
                  Lämna ditt namn och nummer så ringer vi upp inom kort och hjälper dig välja rätt spår — helt utan förpliktelser.
                </p>

                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Namn
                </label>
                <input
                  type="text"
                  value={guidanceName}
                  onChange={(e) => setGuidanceName(e.target.value)}
                  placeholder="För- och efternamn"
                  className="form-control mb-3"
                />

                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Telefonnummer
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={guidancePhone}
                  onChange={(e) => setGuidancePhone(e.target.value)}
                  placeholder="070-123 45 67"
                  className="form-control mb-3"
                />

                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  E-postadress <span className="font-normal text-slate-400">(valfritt)</span>
                </label>
                <input
                  type="email"
                  value={guidanceEmail}
                  onChange={(e) => setGuidanceEmail(e.target.value)}
                  placeholder="din@email.se"
                  autoComplete="email"
                  className="form-control"
                />

                <ErrorBanner message={guidanceError} className="mt-3 text-[13px] py-2" />

                <button
                  type="button"
                  disabled={guidanceSubmitting}
                  onClick={submitGuidance}
                  className="mt-5 w-full h-11 bg-[#0e6efe] hover:bg-[#0b5ce0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {guidanceSubmitting ? 'Skickar...' : 'Ring upp mig'}
                </button>
                <p className="mt-3 text-[12px] text-slate-500 text-center">
                  Vi ringer normalt inom 1 arbetsdag. Helt kostnadsfritt.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
