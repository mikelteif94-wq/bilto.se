import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, Check, Phone, Search, ArrowLeftRight, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBanner from './ErrorBanner';
import BuyTrackStep, { type BuyTrack } from './forms/BuyTrackStep';
import BuyDetailsStep, { type BuyDetailsData } from './forms/BuyDetailsStep';
import BuyTradeInStep, { type BuyTradeInData } from './forms/BuyTradeInStep';
import BuyContactStep, { type BuyContactData } from './forms/BuyContactStep';
import { supabase } from '../lib/supabase';

interface BuyDrawerProps {
  car: string | null;
  initialTrack?: BuyTrack;
  skipIntent?: boolean;
  initialAdditionalRequests?: string;
  initialDesiredMonthlyCost?: string;
  fuelTypes?: string[];
  initialReg?: string;
  onClose: () => void;
}

type FormStep = 'track' | 'carIntent' | 'details' | 'tradeIn' | 'contact' | 'done';

export default function BuyDrawer({ car, initialTrack, skipIntent, initialAdditionalRequests, initialDesiredMonthlyCost, fuelTypes, initialReg = '', onClose }: BuyDrawerProps) {
  const open = car !== null;
  // When initialTrack is 'searching', car is a pre-filled target (possibly multiple), not a specific single car
  const isSearchingWithPrefill = (initialTrack === 'searching' || skipIntent) && !!car;
  const hasSpecificCar = !!car && !isSearchingWithPrefill;
  const skipTrack = hasSpecificCar || !!initialTrack;

  const [track, setTrack] = useState<BuyTrack>(initialTrack || 'found');
  const [step, setStep] = useState<FormStep>(
    skipIntent ? 'details' : isSearchingWithPrefill ? 'details' : hasSpecificCar ? 'carIntent' : skipTrack ? 'details' : 'track'
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const [details, setDetails] = useState<BuyDetailsData>({
    linkOrSeller: '',
    carModel: car ?? '',
    carBrand: '',
    paymentType: '',
    buyingStage: '',
    fuelType: '',
    regnummer: initialTrack === 'trade' ? initialReg : '',
    miltal: '',
    targetCar: '',
    desiredMonthlyCost: initialDesiredMonthlyCost ?? '',
    additionalRequests: initialAdditionalRequests ?? '',
    carPrice: '',
    yearFrom: '',
    yearTo: '',
    maxMiltal: '',
  });

  const [tradeIn, setTradeIn] = useState<BuyTradeInData>({
    hasTradeIn: initialTrack === 'trade' && !!initialReg ? true : null,
    tradeInReg: initialTrack === 'trade' ? initialReg : '',
    hasLoan: null,
    loanAmount: '',
    interestRate: '',
  });

  const [contact, setContact] = useState<BuyContactData>({
    namn: '',
    telefon: '',
    mejl: '',
    preferredTime: '',
  });

  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [guidanceName, setGuidanceName] = useState('');
  const [guidancePhone, setGuidancePhone] = useState('');
  const [guidanceEmail, setGuidanceEmail] = useState('');
  const [guidanceSubmitting, setGuidanceSubmitting] = useState(false);
  const [guidanceDone, setGuidanceDone] = useState(false);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);

  const preferredTimeLabel = (time: string, format: 'inline' | 'short') => {
    if (time === 'morning') return format === 'inline' ? ' på förmiddagen' : 'Förmiddag';
    if (time === 'afternoon') return format === 'inline' ? ' på eftermiddagen' : 'Eftermiddag';
    return format === 'inline' ? ' inom en arbetsdag' : 'Inom en arbetsdag';
  };

  const trackEvent = (
    event: 'drawer_opened' | 'form_submitted' | 'portal_clicked',
    extra: { track?: string; quote_request_id?: string } = {},
  ) => {
    void supabase.from('conversion_events').insert({
      event,
      session_id: sessionIdRef.current,
      track: extra.track ?? track,
      car: car ?? '',
      quote_request_id: extra.quote_request_id ?? null,
      source: window.location.pathname,
    });
  };

  // Reset form each time drawer opens
  useEffect(() => {
    if (car !== null) {
      sessionIdRef.current = crypto.randomUUID();
      const resolvedTrack = initialTrack || 'found';
      const searchingPrefill = (resolvedTrack === 'searching' || skipIntent) && !!car;
      setTrack(resolvedTrack);
      setStep(skipIntent ? 'details' : searchingPrefill ? 'details' : car ? 'carIntent' : initialTrack ? 'details' : 'track');
      setError(null);
      trackEvent('drawer_opened', { track: resolvedTrack });
      setDetails({
        linkOrSeller: '',
        carModel: searchingPrefill ? '' : car,
        carBrand: '',
        paymentType: '',
        buyingStage: '',
        fuelType: '',
        regnummer: resolvedTrack === 'trade' ? (initialReg || '') : '',
        miltal: '',
        targetCar: car,
        desiredMonthlyCost: initialDesiredMonthlyCost ?? '',
        additionalRequests: [
          searchingPrefill ? `Intresserad av: ${car}` : '',
          initialAdditionalRequests ?? '',
        ].filter(Boolean).join(' | '),
        carPrice: '',
        yearFrom: '',
        yearTo: '',
        maxMiltal: '',
      });
      const resolvedReg = initialReg || '';
      setTradeIn({
        hasTradeIn: resolvedTrack === 'trade' && !!resolvedReg ? true : null,
        tradeInReg: resolvedTrack === 'trade' ? resolvedReg : '',
        hasLoan: null,
        loanAmount: '',
        interestRate: '',
      });
      setContact({ namn: '', telefon: '', mejl: '', preferredTime: '' });
    }
  }, [car]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const buildStepFlow = (): FormStep[] => {
    if (isSearchingWithPrefill) {
      return ['details', 'tradeIn', 'contact'];
    }
    if (hasSpecificCar) {
      if (track === 'trade') return ['carIntent', 'details', 'contact'];
      return ['carIntent', 'details', 'tradeIn', 'contact'];
    }
    if (track === 'trade') return skipTrack ? ['details', 'tradeIn', 'contact'] : ['track', 'details', 'tradeIn', 'contact'];
    return skipTrack ? ['details', 'tradeIn', 'contact'] : ['track', 'details', 'tradeIn', 'contact'];
  };

  const stepFlow = step === 'done' ? ['done'] as FormStep[] : buildStepFlow();
  const currentIndex = stepFlow.indexOf(step);
  const totalSteps = stepFlow.length;
  const currentStepNum = currentIndex + 1;

  const titles: Record<FormStep, string> = {
    track: 'Hur vill du gå vidare?',
    carIntent: car || 'Hur vill du gå vidare?',
    details: skipIntent
      ? (track === 'searching' ? `Hitta en ${car}` : `Förhandla – ${car}`)
      : isSearchingWithPrefill
      ? 'Berätta lite mer om dig'
      : hasSpecificCar
      ? (track === 'searching' ? `Hitta en ${car}` : `Förhandla – ${car}`)
      : track === 'trade' ? 'Berätta om ditt byte'
      : track === 'searching' ? 'Berätta vad du söker'
      : 'Berätta om bilen',
    tradeIn: 'Inbytesbil',
    contact: 'Dina uppgifter',
    done: 'Tack!',
  };

  const handleBack = () => {
    setError(null);
    if (step === 'done') return;
    const prev = stepFlow[currentIndex - 1];
    if (!prev) { onClose(); return; }
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
      const { data: insertedRows, error: dbError } = await supabase.from('quote_requests').insert({
        search_option: track,
        regnummer: track === 'trade' ? details.regnummer : '',
        miltal: details.miltal ? parseInt(details.miltal) : 0,
        buying_stage: details.buyingStage,
        budget: details.carPrice,
        payment_type: details.paymentType || '',
        car_model: carModelFull || details.targetCar,
        fuel_type: details.fuelType === 'no_pref' ? '' : details.fuelType,
        link_or_seller: details.linkOrSeller,
        target_car: details.targetCar || car || '',
        additional_requests: [
          details.additionalRequests,
          details.maxMiltal ? `Max mil: ${details.maxMiltal}` : '',
          details.yearFrom || details.yearTo ? `Årsmodell: ${details.yearFrom || '?'}–${details.yearTo || '?'}` : '',
          car ? `[Källa: Bilkort – ${car}]` : '',
        ].filter(Boolean).join(' | '),
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
        status: 'new',
      }).select('id, access_token').maybeSingle();

      if (dbError) {
        setError('Kunde inte spara din förfrågan. Försök igen.');
        setSubmitting(false);
        return;
      }

      const row = insertedRows as { access_token?: string; id?: string } | null;
      const token = row?.access_token ?? null;
      const qrId = row?.id ?? null;
      setPortalToken(token);
      trackEvent('form_submitted', { quote_request_id: qrId ?? undefined });

      const fnHeaders = {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      };

      // notify-quote-request generates the magic link and sends customer email
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-quote-request`, {
          method: 'POST',
          headers: fnHeaders,
          body: JSON.stringify({ quote_request_id: qrId }),
        });
      } catch { /* best effort */ }

      if (qrId) {
        const leadType = track === 'trade' ? 'trade' : 'buy';
        void fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-and-dispatch`, {
          method: 'POST',
          headers: fnHeaders,
          body: JSON.stringify({ type: leadType, quote_request_id: qrId, triggered_by: 'auto' }),
        }).catch(() => {});
      }

      setStep('done');
    } catch {
      setError('Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitGuidance = async () => {
    const namn = guidanceName.trim();
    const telefon = guidancePhone.trim();
    const emailVal = guidanceEmail.trim();
    if (namn.length < 2) { setGuidanceError('Fyll i ditt namn.'); return; }
    if (telefon.length < 6) { setGuidanceError('Fyll i ett giltigt telefonnummer.'); return; }
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
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-lead`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefon, namn, email: emailVal, regnummer: '', miltal: 0, source: 'Köp-rådgivning', guidance_requested: true }),
      });
    } catch { /* best effort */ }
    setGuidanceDone(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 380 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] flex flex-col bg-[#faf8f5] rounded-t-3xl shadow-2xl overflow-hidden"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="px-5 sm:px-6 pt-2 pb-4 border-b border-slate-100 shrink-0">
              {step !== 'done' && (
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="relative shrink-0">
                    <img
                      src="/Man_in_car_showroom_portrait.png"
                      alt="Bilto-expert"
                      className="w-9 h-9 rounded-xl object-cover object-top border-2 border-white shadow-sm"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800 leading-tight">Bilto-expert tillgänglig</p>
                    <p className="text-[11px] text-slate-400 leading-tight">Vi hör av oss inom en arbetsdag</p>
                  </div>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {car && !hasSpecificCar && step !== 'done' && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center h-7 px-3 bg-[#0e6efe]/10 text-[#0e6efe] font-semibold text-[13px] rounded-xl">
                        {car}
                      </span>
                    </div>
                  )}
                  {step !== 'done' && (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex gap-1 flex-1">
                          {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i < currentStepNum ? 'bg-[#0e6efe]' : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[12px] text-slate-400 whitespace-nowrap font-medium shrink-0">
                          {currentStepNum} / {totalSteps}
                        </span>
                      </div>
                      <h2 className="text-[19px] font-bold text-slate-900 leading-tight">
                        {titles[step]}
                      </h2>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-1">
                  {step !== 'done' && step !== 'track' && step !== 'carIntent' && !(skipTrack && !hasSpecificCar && step === 'details') && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
                      aria-label="Tillbaka"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
                    aria-label="Stäng"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
              <ErrorBanner message={error} className="mb-5" />

              {step === 'track' && (
                <BuyTrackStep
                  initialBil={car ?? ''}
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

              {step === 'carIntent' && car && (
                <div className="py-2 space-y-3">
                  <p className="text-[14.5px] text-slate-500 leading-[1.55]">
                    Välj det som passar dig bäst.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setTrack('found');
                      setStep('details');
                      setError(null);
                    }}
                    className="w-full flex items-start gap-4 p-5 rounded-xl border-2 border-[#0e6efe] bg-[#0e6efe]/5 hover:bg-[#0e6efe]/10 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#0e6efe] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-900">Jag har hittat en {car}</p>
                      <p className="text-[13px] text-slate-500 mt-0.5 leading-snug">
                        Vi förhandlar med säljaren åt dig och pressar priset.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTrack('searching');
                      setStep('details');
                      setError(null);
                    }}
                    className="w-full flex items-start gap-4 p-5 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-[#faf8f5] hover:bg-slate-50 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                      <Search className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-900">Jag letar efter en {car}</p>
                      <p className="text-[13px] text-slate-500 mt-0.5 leading-snug">
                        Vi hittar, kollar och förhandlar åt dig.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTrack('trade');
                      setStep('details');
                      setError(null);
                    }}
                    className="w-full flex items-start gap-4 p-5 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-[#faf8f5] hover:bg-slate-50 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                      <ArrowLeftRight className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-900">Jag vill byta in</p>
                      <p className="text-[13px] text-slate-500 mt-0.5 leading-snug">
                        Vi sköter inbytet och hjälper dig hitta ny bil.
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {step === 'details' && (
                <BuyDetailsStep
                  track={track}
                  initialData={details}
                  initialBil={car ?? ''}
                  lockedCar={hasSpecificCar ? car! : isSearchingWithPrefill ? car! : undefined}
                  knownFuelTypes={fuelTypes}
                  onNext={(data) => {
                    setDetails(data);
                    goNext();
                    setError(null);
                  }}
                  onExplore={() => {
                    onClose();
                    const onBuyPage = window.location.pathname === '/kop-bil';
                    if (onBuyPage) {
                      setTimeout(() => {
                        document.getElementById('cars-grid')?.scrollIntoView({ behavior: 'smooth' });
                      }, 200);
                    } else {
                      window.history.pushState({}, '', '/kop-bil');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                      window.scrollTo({ top: 0, behavior: 'auto' });
                      setTimeout(() => {
                        document.getElementById('cars-grid')?.scrollIntoView({ behavior: 'smooth' });
                      }, 400);
                    }
                  }}
                  onQuiz={() => {
                    onClose();
                    const onBuyPage = window.location.pathname === '/kop-bil';
                    if (onBuyPage) {
                      setTimeout(() => {
                        document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 200);
                    } else {
                      window.history.pushState({}, '', '/kop-bil');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                      setTimeout(() => {
                        document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 400);
                    }
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
                <div className="text-center pt-6 pb-6">
                  <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-[22px] sm:text-[26px] font-bold text-slate-900 mb-2">
                    Tack, {contact.namn.split(' ')[0]}!
                  </h2>
                  <p className="text-[14.5px] text-slate-500 leading-relaxed max-w-sm mx-auto mb-6">
                    Förfrågan är skickad. Vi hör av oss{preferredTimeLabel(contact.preferredTime, 'inline')}.
                  </p>

                  {portalToken ? (
                    <a
                      href={`/min-forfragan/${portalToken}`}
                      onClick={() => trackEvent('portal_clicked')}
                      className="flex items-center justify-center gap-2.5 w-full max-w-sm h-14 bg-[#0e6efe] hover:bg-[#0b5cd8] active:bg-[#0950c0] text-white font-bold text-[16px] rounded-xl transition shadow-lg shadow-[#0e6efe]/25 mb-3 mx-auto"
                    >
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      Följ mitt ärende
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex items-center justify-center gap-2.5 w-full max-w-sm h-14 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[16px] rounded-xl transition shadow-lg shadow-[#0e6efe]/25 mb-3 mx-auto"
                    >
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      Tillbaka till startsidan
                    </button>
                  )}

                  <div className="max-w-sm mx-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5 text-left">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed">
                      Vi har skickat en inloggningslänk till <strong className="text-slate-900">{contact.mejl}</strong> – klicka på den för att öppna din portal direkt. Kolla skräpposten om den inte dyker upp.
                    </p>
                  </div>

                  <div className="max-w-sm mx-auto space-y-2.5 text-left mb-6">
                    {[
                      { label: 'Förfrågan mottagen', sub: 'Vi har all information vi behöver.', done: true },
                      { label: 'Vi hör av oss', sub: preferredTimeLabel(contact.preferredTime, 'short'), done: false },
                      { label: 'Vi förhandlar och levererar', sub: 'Du lutar dig tillbaka – vi sköter resten.', done: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.done ? 'bg-[#0e6efe]' : 'bg-slate-200'}`}>
                          {item.done
                            ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            : <span className="text-[11px] font-bold text-slate-500">{i + 1}</span>
                          }
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-slate-900">{item.label}</p>
                          <p className="text-[13px] text-slate-500">{item.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-[13.5px] text-slate-500 hover:text-slate-700 transition"
                    >
                      Fortsätt bläddra
                    </button>
                    <span className="text-slate-300 text-[13px]">·</span>
                    <a
                      href="tel:+46855550200"
                      className="inline-flex items-center gap-1.5 text-[13.5px] text-slate-500 hover:text-slate-700 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      08-5555 0200
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Guidance mini-modal */}
          {guidanceOpen && (
            <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-slate-900/50 px-4 py-6">
              <div className="w-full max-w-md bg-[#faf8f5] rounded-xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-[#0e6efe]" strokeWidth={2.2} />
                    </div>
                    <h3 className="text-[17px] font-semibold text-slate-900">
                      {guidanceDone ? 'Tack – vi hör av oss!' : 'Vi ringer och guidar dig'}
                    </h3>
                  </div>
                  <button type="button" onClick={() => setGuidanceOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {guidanceDone ? (
                  <div className="px-5 sm:px-6 py-6">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#0e6efe] shrink-0 mt-0.5" />
                      <p className="text-[14.5px] text-slate-600 leading-[1.55]">
                        En av våra rådgivare ringer upp dig inom kort. Helt kostnadsfritt.
                      </p>
                    </div>
                    <button type="button" onClick={() => setGuidanceOpen(false)} className="mt-6 w-full h-11 bg-[#0e6efe] hover:bg-[#0b5ce0] text-white font-semibold rounded-lg transition-colors">
                      Klar
                    </button>
                  </div>
                ) : (
                  <div className="px-5 sm:px-6 py-5">
                    <p className="text-[14.5px] text-slate-600 leading-[1.55] mb-4">
                      Lämna ditt namn och nummer så ringer vi upp inom kort.
                    </p>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Namn</label>
                    <input type="text" value={guidanceName} onChange={e => setGuidanceName(e.target.value)} placeholder="För- och efternamn" className="form-control mb-3" />
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Telefonnummer</label>
                    <input type="tel" inputMode="tel" value={guidancePhone} onChange={e => setGuidancePhone(e.target.value)} placeholder="070-123 45 67" className="form-control mb-3" />
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">E-postadress <span className="font-normal text-slate-400">(valfritt)</span></label>
                    <input type="email" value={guidanceEmail} onChange={e => setGuidanceEmail(e.target.value)} placeholder="din@email.se" autoComplete="email" className="form-control" />
                    <ErrorBanner message={guidanceError} className="mt-3 text-[13px] py-2" />
                    <button type="button" disabled={guidanceSubmitting} onClick={submitGuidance} className="mt-5 w-full h-11 bg-[#0e6efe] hover:bg-[#0b5ce0] disabled:opacity-60 text-white font-semibold rounded-lg transition-colors">
                      {guidanceSubmitting ? 'Skickar...' : 'Ring upp mig'}
                    </button>
                    <p className="mt-3 text-[12px] text-slate-500 text-center">Vi ringer normalt inom 1 arbetsdag. Helt kostnadsfritt.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
