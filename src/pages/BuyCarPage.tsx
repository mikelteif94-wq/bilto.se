import { useState, useEffect } from 'react';
import { ChevronLeft, Phone, Check, X, ArrowRight } from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';
import BuyFlowFAQ from '../components/BuyFlowFAQ';
import { validateSwedishPhone } from '../lib/utils';
import { PHONE, PHONE_TEL } from '../config/site';
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
  hideNav?: boolean;
  onBack: () => void;
}

type FormStep = 'track' | 'details' | 'tradeIn' | 'contact' | 'done';

export default function BuyCarPage({
  initialBil = '',
  initialTyp,
  initialReg = '',
  source = '',
  hideNav = false,
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
    leasingType: '',
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
    return skipTrack
      ? ['details', 'tradeIn', 'contact']
      : ['track', 'details', 'tradeIn', 'contact'];
  };

  const stepFlow = step === 'done' ? ['done'] as FormStep[] : buildStepFlow();
  const currentIndex = stepFlow.indexOf(step);
  const totalSteps = stepFlow.length;
  const currentStepNum = currentIndex + 1;

  const titles: Record<FormStep, string> = {
    track: 'Vad behöver du hjälp med?',
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
      setError(`Något gick fel. Försök igen eller ring oss på ${PHONE}.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={hideNav ? 'bg-[#faf8f5] flex flex-col' : 'min-h-screen bg-[#faf8f5] flex flex-col'}>
      {!hideNav && (
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-50 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button onClick={onBack} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
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
              className="inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap"
            >
              Kostnadsfri konsultation
            </button>
          </div>
        </div>
      </header>
      )}

      {step === 'track' && (
        <section className="bg-[#0e6efe] px-4 sm:px-6 pt-[calc(69px+56px)] sm:pt-[calc(80px+64px)] pb-16 sm:pb-24">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">Bilköpshjälpen</p>
            <h1 className="text-[28px] sm:text-[46px] font-bold text-white leading-[1.08] tracking-[-0.02em] max-w-2xl">
              Spara 15&nbsp;000&nbsp;kr eller mer på din nästa bil
            </h1>
            <p className="mt-5 text-white/75 text-[15px] sm:text-[17px] leading-[1.65] max-w-xl">
              Oavsett om du leasar eller köper kontaktar Biltos experter handlarna åt dig, förhandlar bästa priset och hanterar varje steg – du sparar tid och pengar.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#kom-igang"
                onClick={(e) => { e.preventDefault(); document.getElementById('kom-igang')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-[#0e6efe] font-bold text-[15px] hover:bg-slate-100 transition shadow-lg self-start"
              >
                Kom igång
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
              {['Inga bindningar', 'Svar inom 24h', '1 995 kr om affären blir av'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-white/70 text-[13px]">
                  <Check className="w-3.5 h-3.5 text-white/60" strokeWidth={2.5} />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {false && step === 'track' && popularCars.length > 0 && (
        <section className="bg-white px-4 sm:px-6 py-14 sm:py-20">
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-3">EXPERTERNAS VAL</p>
              <h2 className="text-[24px] sm:text-[34px] font-bold text-slate-900 leading-[1.08] tracking-[-0.02em]">
                Bilar vår expert rekommenderar just nu
              </h2>
              <p className="mt-3 text-slate-500 text-[15px] max-w-xl leading-[1.65]">
                Handplockade modeller med bäst balans mellan pris, driftskostnad och tillförlitlighet. Berätta vad du söker – vi förhandlar priset.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularCars.slice(0, 6).map((car, i) => {
                const imageUrl = getCarImage(car.brand_display, car.model_display);
                const fuelLabelStr = car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ');
                const isEl = car.specs.fuel_types.includes('el');
                if (isEl) {
                  return (
                    <ElCarCard
                      key={car.id}
                      name={`${car.brand_display} ${car.model_display}`}
                      make={car.brand_display}
                      imageUrl={imageUrl}
                      rating={car.ratings.overall}
                      topBadge={i === 0}
                      pros={car.pros}
                      fuelLabel={fuelLabelStr}
                      fuelTypes={car.specs.fuel_types}
                      bodyType={car.specs.body_type}
                      drivetrain={car.specs.drivetrain}
                      seats={car.specs.seats}
                      carPrice={car.pricing.new_from_sek ?? undefined}
                      usedPrice={car.pricing.used_from_sek ?? undefined}
                      cardMode="beg"
                      onNegotiate={() => {
                        window.history.pushState({}, '', `/kop-bil/bestall?bil=${encodeURIComponent(`${car.brand_display} ${car.model_display}`)}&typ=found`);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      onDetail={() => {}}
                      onFitQuiz={() => setFitQuizCar(car)}
                    />
                  );
                }
                return (
                  <CompactCarCard
                    key={car.id}
                    name={`${car.brand_display} ${car.model_display}`}
                    make={car.brand_display}
                    imageUrl={imageUrl}
                    rating={car.ratings.overall}
                    topBadge={i === 0}
                    expertComment={car.pros[0]}
                    fuelLabel={fuelLabelStr}
                    fuelTypes={car.specs.fuel_types}
                    carPrice={car.pricing.new_from_sek ?? undefined}
                    usedPrice={car.pricing.used_from_sek ?? undefined}
                    cardMode="beg"
                    onNegotiate={() => {
                      window.history.pushState({}, '', `/kop-bil/bestall?bil=${encodeURIComponent(`${car.brand_display} ${car.model_display}`)}&typ=found`);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    onDetail={() => {}}
                    onFitQuiz={() => setFitQuizCar(car)}
                    index={i}
                  />
                );
              })}
            </div>

            {/* Quiz entry card */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-semibold text-slate-900 leading-snug">Osäker på vilken som passar dig?</p>
                <p className="mt-1 text-[13px] text-slate-500 leading-[1.6] max-w-md">Svara på 5 korta frågor om hur du kör och vad du prioriterar – vi matchar dig med rätt bilar.</p>
              </div>
              <button
                type="button"
                onClick={() => popularCars.length > 0 && setFitQuizCar(popularCars[0])}
                className="shrink-0 h-10 px-5 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[13px] inline-flex items-center gap-2 transition-all whitespace-nowrap"
              >
                Testa bilmatch – tar 60 sekunder
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      <div id="kom-igang" className={`flex-1 flex flex-col items-center px-4 ${hideNav ? 'pt-4 pb-8' : step === 'track' ? 'pt-8 pb-6 sm:pb-8 bg-[#faf8f5]' : 'pt-28 sm:pt-32 pb-6 sm:pb-8'}`}>
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

              <h1 className="text-[22px] sm:text-[28px] font-bold text-slate-900 leading-tight tracking-[-0.02em]">
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
                <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-[24px] sm:text-[28px] font-bold text-slate-900 mb-3">
                  Tack, {contact.namn.split(' ')[0]}!
                </h1>
                <p className="text-[15px] text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Din förfrågan är mottagen. En expert tar vid och hör av sig – du behöver inte göra något mer.
                </p>
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
                <div className="flex items-start gap-3 px-4 py-3 bg-[#faf8f5] rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-[#0e6efe] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900">Förfrågan mottagen</p>
                    <p className="text-[13px] text-slate-500">Vi har all information vi behöver.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 px-4 py-3 bg-[#faf8f5] rounded-xl">
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
                <div className="flex items-start gap-3 px-4 py-3 bg-[#faf8f5] rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-slate-500">3</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900">Vi förhandlar och levererar</p>
                    <p className="text-[13px] text-slate-500">Du kopplar av – vi sköter allt från förhandling till leverans.</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <a
                  href={PHONE_TEL}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 text-[14px] font-medium hover:bg-slate-200 transition"
                >
                  <Phone className="w-4 h-4" />
                  Ring oss direkt: {PHONE}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {step === 'track' && <BuyFlowFAQ variant="buy" />}

      {scrolled && step !== 'done' && (
        <a
          href={PHONE_TEL}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-[#0e6efe] text-white text-[13px] font-semibold shadow-lg hover:bg-[#0a57cc] transition-all"
        >
          <Phone className="w-4 h-4" />
          Ring oss
        </a>
      )}

      {guidanceOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-6">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center">
                  <Phone className="w-4.5 h-4.5 text-[#0e6efe]" strokeWidth={2.2} />
                </div>
                <h3 className="text-[17px] font-semibold text-slate-900">
                  {guidanceDone ? 'Tack – vi hör av oss!' : 'Vi ringer och guidar dig'}
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
                  className="mt-6 w-full h-11 bg-[#0e6efe] hover:bg-[#0b5ce0] text-white font-semibold rounded-xl transition-colors"
                >
                  Klar
                </button>
              </div>
            ) : (
              <div className="px-5 sm:px-6 py-5">
                <p className="text-[14.5px] text-slate-600 leading-[1.55] mb-4">
                  Lämna ditt namn och nummer så ringer vi upp inom kort och hjälper dig välja rätt spår – helt utan förpliktelser.
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
                  className="mt-5 w-full h-11 bg-[#0e6efe] hover:bg-[#0b5ce0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
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
