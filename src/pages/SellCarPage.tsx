import { useState } from 'react';
import { ChevronLeft, Phone, Check, X, ShieldCheck, Gavel, BadgeCheck, Clock3 } from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';
import { validateSwedishPhone } from '../lib/utils';
import CarConditionStep from '../components/forms/CarConditionStep';
import CarEquipmentStep from '../components/forms/CarEquipmentStep';
import CustomerForm from '../components/forms/CustomerForm';
import ImageUploadForm from '../components/forms/ImageUploadForm';
import ConfirmationForm from '../components/forms/ConfirmationForm';
import type { TradeInData } from '../components/forms/CarConditionStep';
import { supabase } from '../lib/supabase';

interface SellCarPageProps {
  initialRegnummer?: string;
  initialTelefon?: string;
  initialMiltal?: number;
  onBack: () => void;
  onNavigateTrade?: (regnummer: string, miltal: number) => void;
}

export type FormStep = 'condition' | 'equipment' | 'images' | 'contact' | 'confirm';

export interface CustomerData {
  namn: string;
  telefon: string;
  mejl: string;
  losenord?: string;
}

export interface CarData {
  regnummer: string;
  marke: string;
  modell: string;
  ar: number | null;
  miltal: number;
  skick: string;
  skickKommentar: string;
  utrustning: string[];
}

export interface ImageFile {
  file: File;
  preview: string;
  ordning: number;
}

export default function SellCarPage({
  initialRegnummer = '',
  initialTelefon = '',
  initialMiltal = 0,
  onBack,
  onNavigateTrade,
}: SellCarPageProps) {
  const [salesType] = useState<'auction'>('auction');
  const [step, setStep] = useState<FormStep>('condition');
  const [car, setCar] = useState<CarData>({
    regnummer: initialRegnummer,
    marke: '',
    modell: '',
    ar: null,
    miltal: initialMiltal,
    skick: '',
    skickKommentar: '',
    utrustning: [],
  });
  const [customer, setCustomer] = useState<CustomerData>({
    namn: '',
    telefon: initialTelefon,
    mejl: '',
  });
  const [images, setImages] = useState<ImageFile[]>([]);
  const [tradeDetails, setTradeDetails] = useState<TradeInData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [guidanceName, setGuidanceName] = useState('');
  const [guidancePhone, setGuidancePhone] = useState(initialTelefon);
  const [guidanceEmail, setGuidanceEmail] = useState('');
  const [guidanceSubmitting, setGuidanceSubmitting] = useState(false);
  const [guidanceDone, setGuidanceDone] = useState(false);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);

  const submitGuidance = async () => {
    const namn = guidanceName.trim();
    const telefon = guidancePhone.trim();
    const emailVal = guidanceEmail.trim();
    if (namn.length < 2) {
      setGuidanceError('Fyll i ditt namn.');
      return;
    }
    const phoneErr = validateSwedishPhone(telefon);
    if (phoneErr) {
      setGuidanceError(phoneErr);
      return;
    }
    setGuidanceError(null);
    setGuidanceSubmitting(true);
    const { error: insertError } = await supabase.from('leads').insert({
      regnummer: car.regnummer || '',
      telefon,
      email: emailVal,
      miltal: car.miltal || 0,
      guidance_requested: true,
    } as never);
    setGuidanceSubmitting(false);
    if (insertError) {
      setGuidanceError('Något gick fel. Försök igen.');
      return;
    }
    try {
      const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-lead`;
      await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefon, namn, email: emailVal, regnummer: car.regnummer || '', miltal: car.miltal || 0, source: 'Telefonrådgivning', guidance_requested: true }),
      });
    } catch { /* best effort */ }
    setGuidanceDone(true);
  };

  const stepFlow: FormStep[] = ['condition', 'equipment', 'images', 'contact', 'confirm'];

  const currentIndex = stepFlow.indexOf(step);
  const totalSteps = stepFlow.length;
  const currentStepNum = currentIndex + 1;

  const titles: Record<FormStep, string> = {
    condition: 'Om din bil',
    equipment: 'Utrustning och tillval',
    images: 'Bilder av bilen',
    contact: 'Dina uppgifter',
    confirm: 'Bekräfta',
  };

  const handleBack = () => {
    setError(null);
    const prev = stepFlow[currentIndex - 1];
    if (!prev) {
      onBack();
      return;
    }
    setStep(prev);
  };

  const goNext = () => {
    const next = stepFlow[currentIndex + 1];
    if (next) setStep(next);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col">
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button onClick={onBack} className="shrink-0 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </button>
          <div className="flex items-center ml-auto">
            <a
              href="/gratis-konsultation"
              className="inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap"
            >
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-28 sm:pt-36 pb-10 lg:pb-16">
        <div className="mb-10 lg:mb-14 max-w-4xl">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-[#0e6efe] mb-4">Sälj tryggt. Sälj smart.</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.04em] leading-[1.05] text-slate-900 max-w-3xl">Få bilen såld till rätt pris.</h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">Vi hjälper dig genom hela försäljningen och låter granskade handlare tävla om din bil.</p>
        </div>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8 xl:gap-14 items-start">
          <main className="w-full max-w-2xl">
            <div className="rounded-[24px] bg-white border border-slate-200/80 shadow-[0_18px_50px_rgba(14,110,254,0.08)] p-5 sm:p-8 lg:p-10">
          <div className="mb-6 sm:mb-8">
            {step !== 'confirm' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-slate-500 hover:text-[#0e6efe] transition mb-4 sm:mb-5 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Tillbaka
              </button>
            )}

            {step !== 'confirm' && (
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
            )}

            {step !== 'confirm' && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0e6efe] mb-2">Steg {currentStepNum} av {totalSteps}</p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-slate-900 leading-tight">
                  {titles[step]}
                </h2>
              </div>
            )}
          </div>

          <ErrorBanner message={error} className="mb-6" />

          {step === 'condition' && (
            <CarConditionStep
              regnummer={car.regnummer}
              initialMarke={car.marke}
              initialModell={car.modell}
              initialAr={car.ar}
              initialMiltal={car.miltal}
              initialSkick={car.skick}
              initialSkickKommentar={car.skickKommentar}
              showTradeIn={!!onNavigateTrade}
              onNext={(miltal, skick, regnummer, skickKommentar, marke, modell, ar, tradeIn) => {
                const updatedReg = regnummer || car.regnummer;
                setCar((c) => ({
                  ...c,
                  miltal,
                  skick,
                  skickKommentar,
                  marke,
                  modell,
                  ar,
                  regnummer: updatedReg,
                }));
                setTradeDetails(tradeIn ?? null);
                setError(null);
                goNext();
              }}
            />
          )}

          {step === 'equipment' && (
            <CarEquipmentStep
              initialUtrustning={car.utrustning}
              onNext={(utrustning) => {
                setCar((c) => ({ ...c, utrustning }));
                goNext();
                setError(null);
              }}
            />
          )}

          {step === 'images' && (
            <ImageUploadForm
              initialImages={images}
              onNext={(imgs) => {
                setImages(imgs);
                goNext();
                setError(null);
              }}
            />
          )}

          {step === 'contact' && (
            <CustomerForm
              initialData={customer}
              requirePassword={false}
              onNext={(data) => {
                setCustomer(data);
                goNext();
                setError(null);
              }}
            />
          )}

          {step === 'confirm' && (
            <ConfirmationForm
              customer={customer}
              car={car}
              images={images}
              salesType={salesType}
              tradeDetails={tradeDetails ?? undefined}
              onSubmit={async () => {}}
              loading={false}
              onError={setError}
              onGoHome={onBack}
            />
          )}
            </div>
          </main>
          <aside className="hidden lg:block lg:pt-4">
            <div className="sticky top-28 space-y-4">
              <div className="rounded-[20px] bg-white border border-slate-200/80 shadow-[0_8px_30px_rgba(14,110,254,0.06)] p-6 xl:p-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0e6efe] mb-5">Så fungerar det</p>
                <div className="space-y-5">
                  <div className="flex gap-3"><ShieldCheck className="w-5 h-5 text-[#0e6efe] shrink-0" /><div><p className="font-semibold text-sm text-slate-900">Tryggt hela vägen</p><p className="text-xs text-slate-500 mt-1 leading-relaxed">Inga dolda kostnader eller krav på att acceptera ett bud.</p></div></div>
                  <div className="flex gap-3"><Gavel className="w-5 h-5 text-[#0e6efe] shrink-0" /><div><p className="font-semibold text-sm text-slate-900">Handlare tävlar</p><p className="text-xs text-slate-500 mt-1 leading-relaxed">Vi skickar bilen till vårt nätverk av granskade handlare.</p></div></div>
                  <div className="flex gap-3"><BadgeCheck className="w-5 h-5 text-[#0e6efe] shrink-0" /><div><p className="font-semibold text-sm text-slate-900">Kostnadsfritt</p><p className="text-xs text-slate-500 mt-1 leading-relaxed">Du bestämmer själv om du vill gå vidare med affären.</p></div></div>
                </div>
              </div>
              <div className="rounded-[20px] bg-[#e7f3ff] border border-[#69a8ff]/30 p-5">
                <div className="flex items-center gap-2 text-[#0e6efe] mb-2"><Clock3 className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-[0.12em]">Snabb hjälp</span></div>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">En expert kan ringa dig och guida dig genom nästa steg.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

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
                    En expert ringer upp och guidar dig till bästa sättet att sälja din bil. Kostnadsfritt och utan bindning.
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
                  Lämna ditt namn och nummer – vi ringer upp och visar dig bästa vägen att sälja din bil.
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
                  Vi ringer inom 4 timmar under kontorstid. Kostnadsfritt, utan bindning.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
