import { useState } from 'react';
import { ChevronLeft, ArrowRight, Check, Car, Fuel, Zap, Users, Briefcase, Mountain, MapPin, Phone, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateSwedishPhone } from '../lib/utils';

interface BilmatchPageProps {
  onBack: () => void;
}

type Step = 'body' | 'fuel' | 'budget' | 'contact' | 'done';

const BODY_TYPES = [
  { id: 'suv', label: 'SUV', icon: Mountain },
  { id: 'sedan', label: 'Sedan', icon: Car },
  { id: 'kombi', label: 'Kombi', icon: Briefcase },
  { id: 'halvkombi', label: 'Halvkombi', icon: Car },
  { id: 'minivan', label: 'Minivan / MPV', icon: Users },
  { id: 'cab', label: 'Cab / Coupé', icon: Car },
];

const FUEL_TYPES = [
  { id: 'el', label: 'Elbil', icon: Zap },
  { id: 'hybrid', label: 'Hybrid / PHEV', icon: Zap },
  { id: 'bensin', label: 'Bensin', icon: Fuel },
  { id: 'diesel', label: 'Diesel', icon: Fuel },
  { id: 'spelar_ingen_roll', label: 'Spelar ingen roll', icon: Car },
];

const BUDGETS = [
  { id: '0-150000', label: 'Under 150 000 kr' },
  { id: '150000-250000', label: '150 000 – 250 000 kr' },
  { id: '250000-400000', label: '250 000 – 400 000 kr' },
  { id: '400000-600000', label: '400 000 – 600 000 kr' },
  { id: '600000+', label: 'Över 600 000 kr' },
];

export default function BilmatchPage({ onBack }: BilmatchPageProps) {
  const [step, setStep] = useState<Step>('body');
  const [bodyType, setBodyType] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [budget, setBudget] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const stepIndex = ['body', 'fuel', 'budget', 'contact'].indexOf(step);
  const totalSteps = 4;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateSwedishPhone(phone)) {
      setError('Ange ett giltigt telefonnummer (07X XXX XX XX)');
      return;
    }
    if (!name.trim()) {
      setError('Ange ditt namn');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await supabase.from('leads').insert({
        name: name.trim(),
        phone,
        source: 'bilmatch',
        notes: `Karosseri: ${bodyType} | Drivmedel: ${fuelType} | Budget: ${budget}`,
      });
    } finally {
      setSubmitting(false);
      setStep('done');
    }
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#0e6efe] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-white" strokeWidth={3} />
        </div>
        <h1 className="text-white text-[28px] font-bold leading-tight mb-3">Vi hittar din bil!</h1>
        <p className="text-white/80 text-[15px] max-w-xs leading-relaxed mb-8">
          En av våra bilmatchare kontaktar dig inom kort med alternativ som passar dig perfekt.
        </p>
        <button
          onClick={onBack}
          className="h-11 px-7 rounded-full bg-white text-[#0e6efe] font-bold text-[14px] hover:bg-white/90 transition"
        >
          Tillbaka till startsidan
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 h-14 flex items-center gap-3">
        <button
          onClick={step === 'body' ? onBack : () => {
            const steps: Step[] = ['body', 'fuel', 'budget', 'contact'];
            setStep(steps[Math.max(0, steps.indexOf(step) - 1)]);
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition -ml-1"
          aria-label="Tillbaka"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bilmatch</p>
        </div>
        <span className="text-[12px] font-medium text-slate-400">{Math.min(stepIndex + 1, totalSteps)}/{totalSteps}</span>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-[#0e6efe] transition-all duration-500"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 py-8">

        {/* Step: Body type */}
        {step === 'body' && (
          <div className="flex flex-col flex-1">
            <h1 className="text-[24px] font-bold text-slate-900 leading-tight mb-1">Vilken typ av bil letar du efter?</h1>
            <p className="text-slate-500 text-[14px] mb-6">Välj den karosstyp som passar dig bäst.</p>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {BODY_TYPES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setBodyType(id); setStep('fuel'); }}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 h-24 transition-all ${
                    bodyType === id
                      ? 'border-[#0e6efe] bg-[#0e6efe]/5 text-[#0e6efe]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[13px] font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Fuel type */}
        {step === 'fuel' && (
          <div className="flex flex-col flex-1">
            <h1 className="text-[24px] font-bold text-slate-900 leading-tight mb-1">Vilket drivmedel föredrar du?</h1>
            <p className="text-slate-500 text-[14px] mb-6">Vi hittar rätt bil oavsett vad du väljer.</p>
            <div className="flex flex-col gap-2.5">
              {FUEL_TYPES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setFuelType(id); setStep('budget'); }}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 h-14 transition-all ${
                    fuelType === id
                      ? 'border-[#0e6efe] bg-[#0e6efe]/5 text-[#0e6efe]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span className="text-[14px] font-semibold">{label}</span>
                  {fuelType === id && <Check className="w-4 h-4 ml-auto" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Budget */}
        {step === 'budget' && (
          <div className="flex flex-col flex-1">
            <h1 className="text-[24px] font-bold text-slate-900 leading-tight mb-1">Vad är din budget?</h1>
            <p className="text-slate-500 text-[14px] mb-6">Ungefärligt pris på bilen du söker.</p>
            <div className="flex flex-col gap-2.5">
              {BUDGETS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setBudget(id); setStep('contact'); }}
                  className={`flex items-center justify-between rounded-xl border-2 px-4 h-14 transition-all ${
                    budget === id
                      ? 'border-[#0e6efe] bg-[#0e6efe]/5 text-[#0e6efe]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[14px] font-semibold">{label}</span>
                  {budget === id && <Check className="w-4 h-4" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Contact */}
        {step === 'contact' && (
          <div className="flex flex-col flex-1">
            <h1 className="text-[24px] font-bold text-slate-900 leading-tight mb-1">Perfekt — nästan klart!</h1>
            <p className="text-slate-500 text-[14px] mb-6">Fyll i dina uppgifter så kontaktar vi dig med träffar.</p>

            <div className="bg-slate-100 rounded-xl p-4 mb-6 space-y-1.5">
              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span><span className="font-semibold text-slate-800">Karosseri:</span> {BODY_TYPES.find(b => b.id === bodyType)?.label}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                <Fuel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span><span className="font-semibold text-slate-800">Drivmedel:</span> {FUEL_TYPES.find(f => f.id === fuelType)?.label}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span><span className="font-semibold text-slate-800">Budget:</span> {BUDGETS.find(b => b.id === budget)?.label}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex items-center h-12 rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#0e6efe] focus-within:ring-2 focus-within:ring-[#0e6efe]/20 transition">
                <span className="flex items-center justify-center w-11 shrink-0">
                  <User className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Ditt namn"
                  autoComplete="name"
                  className="flex-1 min-w-0 w-0 pr-3 h-full text-[14px] text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center h-12 rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#0e6efe] focus-within:ring-2 focus-within:ring-[#0e6efe]/20 transition">
                <span className="flex items-center justify-center w-11 shrink-0">
                  <Phone className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(''); }}
                  placeholder="Telefonnummer"
                  autoComplete="tel"
                  className="flex-1 min-w-0 w-0 pr-3 h-full text-[14px] text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
                />
              </div>
              {error && (
                <p className="text-red-600 text-[12px] font-medium">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="mt-1 h-12 w-full rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] disabled:bg-slate-300 text-white font-bold text-[15px] tracking-wide transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_-4px_rgba(14,110,254,0.5)]"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Hitta min bil <ArrowRight className="w-4 h-4 opacity-80" /></>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
