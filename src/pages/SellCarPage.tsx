import { useState } from 'react';
import { ChevronLeft, Phone, Check, X, User } from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';
import { validateSwedishPhone } from '../lib/utils';
import CarConditionStep from '../components/forms/CarConditionStep';
import CarEquipmentStep from '../components/forms/CarEquipmentStep';
import CustomerForm from '../components/forms/CustomerForm';
import ImageUploadForm from '../components/forms/ImageUploadForm';
import ConfirmationForm from '../components/forms/ConfirmationForm';
import TrackChoiceStep from '../components/forms/TrackChoiceStep';
import InspectionGuideStep from '../components/forms/InspectionGuideStep';
import { supabase } from '../lib/supabase';

interface SellCarPageProps {
  initialRegnummer?: string;
  initialTelefon?: string;
  initialMiltal?: number;
  onBack: () => void;
  onNavigateTrade?: (regnummer: string, miltal: number) => void;
}

export type FormStep = 'track' | 'condition' | 'equipment' | 'inspection' | 'images' | 'contact' | 'confirm';

export interface CustomerData {
  namn: string;
  telefon: string;
  mejl: string;
  losenord: string;
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
  const [salesType, setSalesType] = useState<'auction'>('auction');
  const [step, setStep] = useState<FormStep>('track');
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
    losenord: '',
  });
  const [images, setImages] = useState<ImageFile[]>([]);
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

  const stepFlow: FormStep[] = ['track', 'condition', 'equipment', 'inspection', 'images', 'contact', 'confirm'];

  const currentIndex = stepFlow.indexOf(step);
  const totalSteps = stepFlow.length;
  const currentStepNum = currentIndex + 1;

  const titles: Record<FormStep, string> = {
    track: 'Hur vill du sälja din bil?',
    condition: 'Om din bil',
    equipment: 'Utrustning och tillval',
    inspection: 'Vi annonserar och certifierar din bil',
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
    <div className="min-h-screen bg-white flex flex-col">
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button onClick={onBack} className="shrink-0 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
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

          <ErrorBanner message={error} className="mb-6" />

          {step === 'track' && (
            <TrackChoiceStep
              regnummer={car.regnummer}
              miltal={car.miltal}
              onChoose={(t) => {
                setSalesType(t);
                setStep('condition');
                setError(null);
              }}
              onGuidance={() => {
                setGuidanceOpen(true);
                setGuidanceDone(false);
                setGuidanceError(null);
              }}
              onNavigateTrade={onNavigateTrade ? () => onNavigateTrade(car.regnummer || '', car.miltal || 0) : undefined}
            />
          )}

          {step === 'condition' && (
            <CarConditionStep
              regnummer={car.regnummer}
              initialMarke={car.marke}
              initialModell={car.modell}
              initialAr={car.ar}
              initialMiltal={car.miltal}
              initialSkick={car.skick}
              initialSkickKommentar={car.skickKommentar}
              initialMejl={customer.mejl}
              onNext={(miltal, skick, regnummer, mejl, skickKommentar, marke, modell, ar) => {
                setCar((c) => ({
                  ...c,
                  miltal,
                  skick,
                  skickKommentar,
                  marke,
                  modell,
                  ar,
                  regnummer: regnummer || c.regnummer,
                }));
                setCustomer((c) => ({ ...c, mejl }));
                goNext();
                setError(null);
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

          {step === 'inspection' && (
            <InspectionGuideStep
              onNext={() => {
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
              requirePassword={true}
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
              onSubmit={async () => {}}
              loading={false}
              onError={setError}
            />
          )}
        </div>
      </div>

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
                    En av våra rådgivare ringer upp dig inom kort och hjälper dig välja det bästa sättet att sälja din bil. Helt kostnadsfritt och utan bindning.
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
