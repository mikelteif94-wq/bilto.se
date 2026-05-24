import { useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Gauge, Armchair, Briefcase, TrendingDown, Shield,
  Fuel, Battery, Car, Check, X as XIcon, Info, Users, ArrowRight,
  BarChart2, AlertTriangle, HelpCircle, X, Wallet,
} from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { type ComparisonCar } from '@/lib/comparison';
import { useCarCatalogLookup } from '@/lib/comparison/useCarCatalogLookup';
import type { QuizAnswers } from './QuizTypes';
import { inferPersona, type Persona } from './persona';
import { calcCarMonthlyRange, calcCarMonthly } from '@/lib/utils';
import { CalcPanel } from '@/components/CalcPanel';

export interface DetailCarData {
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url?: string | null;
  matchScore: number;
  matchReasons: string[];
  bodyType?: string;
  fuelType?: string;
  seats?: number;
  cargo?: string;
  drivetrain?: string;
  rating?: number;
  usedPrice?: number;
  fuelLabel?: string;
}

interface CarDetailSheetProps {
  car: DetailCarData | null;
  open?: boolean;
  onClose: () => void;
  onSelect?: () => void;
  onFitQuiz?: () => void;
  quizAnswers?: QuizAnswers;
}

function formatPriceSEK(price: number): string {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(price) + ' kr';
}

function formatSEK(n: number): string {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

function getWhoItSuitsFor(data: ComparisonCar): string[] {
  const suits: string[] = [];
  if (data.specs.fuel_types.includes('el')) suits.push('Den som vill köra billigast i driftskostnad');
  if (data.specs.trunk_liters && data.specs.trunk_liters >= 500 && data.specs.seats >= 5) suits.push('Barnfamiljen som behöver utrymme');
  if (data.ratings.comfort >= 8) suits.push('Den som värdesätter komfort och tyst kupé');
  if (data.ratings.driving >= 8) suits.push('Den som gillar sportig och engagerande körning');
  if (data.ratings.value >= 8) suits.push('Den som vill ha bra valuta för pengarna');
  if (data.specs.drivetrain.includes('awd')) suits.push('Den som kör mycket på vintern');
  if (data.specs.body_type === 'suv') suits.push('Den som vill ha högt sittläge och bra överblick');
  if (data.specs.fuel_types.includes('hybrid') || data.specs.fuel_types.includes('laddhybrid')) suits.push('Pendlaren som kör korta och långa sträckor');
  return suits.slice(0, 4);
}

function RatingBar({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Star }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-[13px] text-slate-600 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-full bg-[#0047B3] rounded-full"
        />
      </div>
      <span className="text-[13px] font-semibold text-slate-900 w-8 text-right">{value}</span>
    </div>
  );
}

function getFuelIcon(fuelTypes: string[]) {
  if (fuelTypes.includes('el') || fuelTypes.includes('hybrid') || fuelTypes.includes('laddhybrid')) return Battery;
  return Fuel;
}

function getFuelLabel(fuelTypes: string[]): string {
  const labels: Record<string, string> = {
    bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid', laddhybrid: 'Laddhybrid', el: 'El',
  };
  return fuelTypes.map(f => labels[f] || f).join(', ');
}

function getBodyLabel(bodyType: string): string {
  const labels: Record<string, string> = {
    sedan: 'Sedan', kombi: 'Kombi', suv: 'SUV', coupe: 'Coupe',
    hatchback: 'Halvkombi', cab: 'Cabriolet', mpv: 'MPV',
  };
  return labels[bodyType] || bodyType;
}

function MonthlyTooltip({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute bottom-full left-0 mb-2 w-64 z-30 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-3.5"
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
      <p className="text-[11px] font-bold text-white mb-1.5">Hur räknar vi?</p>
      <p className="text-[10px] text-slate-400 leading-relaxed">
        Spannet baseras på snittpriset mellan begagnad och ny, vid 55% respektive 50% restvärde:<br />
        <span className="text-slate-200">20% kontantinsats · 1% uppläggning · 6,49% ränta · 36 månader</span>
      </p>
      <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5">
        Lägre siffra = 55% restvärde &nbsp;·&nbsp; Högre siffra = 50% restvärde
      </p>
      <div className="mt-2 pt-2 border-t border-slate-700">
        <p className="text-[9px] text-slate-500">Uppskattning. Slutlig ränta och villkor sätts av finansiär.</p>
      </div>
    </div>
  );
}

function MonthlyCostBlock({
  carPrice, usedPrice, monthlyUsed, monthlyUsedMin, monthlyUsedMax,
}: {
  carPrice: number;
  usedPrice?: number;
  monthlyUsed?: number;
  monthlyUsedMin?: number;
  monthlyUsedMax?: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Prefer DB values; fall back to calculated
  const hasDbMonthly = !!(monthlyUsed || (monthlyUsedMin && monthlyUsedMax));
  const low = monthlyUsedMin ?? (hasDbMonthly ? monthlyUsed! : calcCarMonthlyRange(carPrice, usedPrice).low);
  const high = monthlyUsedMax ?? (hasDbMonthly ? monthlyUsed! : calcCarMonthlyRange(carPrice, usedPrice).high);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[12px] text-slate-500">Uppskattad månadskostnad</p>
        <div className="relative">
          <button type="button" onClick={() => setShowTooltip(v => !v)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {showTooltip && <MonthlyTooltip onClose={() => setShowTooltip(false)} />}
        </div>
      </div>
      <p className="text-[18px] font-bold text-slate-900 tabular-nums">
        {low === high
          ? `${formatSEK(low)}`
          : `${formatSEK(low)}–${formatSEK(high)}`}{' '}
        <span className="text-[14px] font-semibold text-slate-500">kr/mån</span>
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5">
        Beräknat på snittpris ny/beg · 20% kontantinsats · 6,49% ränta · 36 mån
      </p>
    </div>
  );
}

export function CarDetailSheet({ car, open, onClose, onSelect, onFitQuiz, quizAnswers }: CarDetailSheetProps) {
  const isOpen = open !== undefined ? open : !!car;

  const { data: comparisonData } = useCarCatalogLookup(car?.make ?? '', car?.model ?? '');

  const persona = useMemo(() => {
    if (!quizAnswers) return null;
    return inferPersona(quizAnswers);
  }, [quizAnswers]);

  if (!car) return null;

  const heroImage = comparisonData?.image_url ?? car.cleaned_image_url ?? car.image_url;

  return (
    <Sheet open={isOpen} onClose={onClose}>
      <div className="px-4 sm:px-5 pb-8">
        {/* Hero */}
        <div className="relative mb-5">
          {heroImage && (
            <div className="w-full bg-white rounded-xl overflow-hidden flex items-center justify-center" style={{ height: '180px' }}>
              <img
                src={heroImage}
                alt={`${car.make} ${car.model}`}
                className="max-w-full max-h-full object-contain px-6 py-3"
                style={{ display: 'block' }}
              />
            </div>
          )}
          <div className="mt-3 sm:mt-4">
            <h2 className="text-[20px] sm:text-2xl font-bold text-slate-900 leading-tight">{car.make} {car.model}</h2>
            {comparisonData?.generation && (
              <p className="text-sm text-slate-400 mt-0.5">{comparisonData.generation}</p>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {comparisonData && (
              <Badge className="bg-[#0047B3] text-white border-transparent">
                <Star className="w-3 h-3 mr-1 fill-white" />
                {comparisonData.ratings.overall}/10
              </Badge>
            )}
            {comparisonData?.safety.euro_ncap_stars && (
              <Badge variant="outline" className="gap-1">
                <Shield className="w-3 h-3" />
                {comparisonData.safety.euro_ncap_stars} stjärnor NCAP
              </Badge>
            )}
            {persona && persona.confidence >= 30 && (
              <Badge variant="outline" className="gap-1 text-[#0e6efe] border-[#0e6efe]/30">
                <Users className="w-3 h-3" />
                Anpassad för {persona.label.toLowerCase()}
              </Badge>
            )}
          </div>
        </div>

        {comparisonData ? (
          <ComparisonContent data={comparisonData} persona={persona?.type ?? null} onSelect={onSelect} onFitQuiz={onFitQuiz} carName={`${car.make} ${car.model}`} />
        ) : (
          <BasicContent car={car} onSelect={onSelect} onFitQuiz={onFitQuiz} />
        )}
      </div>
    </Sheet>
  );
}

function getPersonaCTA(persona: Persona | null, brandDisplay: string, modelDisplay: string): { headline: string; sub: string } {
  switch (persona) {
    case 'first_time_buyer':
      return {
        headline: 'Köp tryggt — vi guidar dig hela vägen',
        sub: `Vår rådgivare hjälper dig med ${brandDisplay} ${modelDisplay}, från provkörning till kontrakt`,
      };
    case 'family':
      return {
        headline: `Vi hittar rätt ${brandDisplay} ${modelDisplay} för familjen`,
        sub: 'Förhandlar pris, checkar historik och ser till att bilen håller vad den lovar',
      };
    case 'researcher':
      return {
        headline: 'Vi pressar priset — du har redan gjort research',
        sub: `Låt oss förhandla ${brandDisplay} ${modelDisplay} åt dig och spara 15 000–40 000 kr`,
      };
    case 'enthusiast':
      return {
        headline: 'Du vet vad du vill — vi ser till att du inte betalar för mycket',
        sub: `Vi förhandlar ${brandDisplay} ${modelDisplay} baserat på marknadsdata`,
      };
    case 'pragmatist':
      return {
        headline: `Bästa priset på ${brandDisplay} ${modelDisplay} — utan krångel`,
        sub: 'Fast avgift 1 995 kr. Genomsnittlig besparing 15 000–40 000 kr.',
      };
    default:
      return {
        headline: 'Låt oss hitta bästa priset',
        sub: `Vi förhandlar ${brandDisplay} ${modelDisplay} åt dig — helt gratis att testa`,
      };
  }
}

function PersonaInsightSection({ persona, data }: { persona: Persona; data: ComparisonCar }) {
  const insights: Record<Persona, { title: string; items: string[] } | null> = {
    first_time_buyer: {
      title: 'Det här bör du tänka på som förstagångsköpare',
      items: [
        data.safety.euro_ncap_stars
          ? `Euro NCAP: ${data.safety.euro_ncap_stars} stjärnor — ${data.safety.euro_ncap_stars >= 5 ? 'utmärkt säkerhetsbetyg' : 'kontrollera testyear'}`
          : 'Be alltid om att se besiktningsprotokoll och servicehistorik',
        'Begär ett oberoende besiktningsutlåtande innan köp',
        'Kolla att garantin gäller och vad den täcker',
      ],
    },
    family: {
      title: 'Familjetest',
      items: [
        data.specs.trunk_liters ? `${data.specs.trunk_liters} liter bagageutrymme${data.specs.trunk_liters_max ? ` (max ${data.specs.trunk_liters_max} l med fällda säten)` : ''}` : 'Mät om barnvagnen passar',
        data.specs.seats >= 7 ? '7-sitsig — plats för hela familjen' : `${data.specs.seats} sittplatser`,
        data.specs.drivetrain.includes('awd') ? 'Fyrhjulsdrift — trygg i alla väder' : 'Framhjulsdrift — bra vinterdäck rekommenderas',
      ],
    },
    researcher: {
      title: 'Marknadsjämförelse',
      items: [
        data.pricing.used_from_sek ? `Begagnad från ${formatPriceSEK(data.pricing.used_from_sek)} — förhandla mot detta` : 'Jämför annonserade priser mot marknadssnittet',
        `Expertbetyg ${data.ratings.overall}/10 — ${data.ratings.overall >= 8 ? 'toppklass i sitt segment' : 'bra alternativ i klassen'}`,
        data.ratings.value >= 8 ? 'Högt värdebetyg — priset är rätt för vad du får' : 'Förhandla — det finns utrymme att pressa priset',
      ],
    },
    enthusiast: {
      title: 'Kördynamik & prestanda',
      items: [
        `Körbetyg: ${data.ratings.driving}/10`,
        getDrivetrainLabel(data.specs.drivetrain),
        data.pros[0] ?? 'Se specifikationer nedan',
      ],
    },
    pragmatist: {
      title: 'Total ägandekostnad',
      items: [
        `Värdebetyg: ${data.ratings.value}/10`,
        data.specs.fuel_types.includes('el') ? 'El — låg driftskostnad, ~1–2 kr/mil' : data.specs.fuel_types.includes('hybrid') ? 'Hybrid — sänker bränslekostnaden märkbart' : 'Jämför bränslekostnad mot alternativ',
        data.pricing.used_from_sek ? `Begagnad från ${formatPriceSEK(data.pricing.used_from_sek)}` : 'Se marknadsdata för aktuellt pris',
      ],
    },
  };

  const insight = insights[persona];
  if (!insight) return null;

  const iconMap: Record<Persona, typeof BarChart2> = {
    first_time_buyer: AlertTriangle,
    family: Users,
    researcher: BarChart2,
    enthusiast: Gauge,
    pragmatist: TrendingDown,
  };
  const Icon = iconMap[persona];

  return (
    <section className="p-4 bg-amber-50 rounded-xl border border-amber-100">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">{insight.title}</p>
      </div>
      <div className="space-y-1.5">
        {insight.items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
            <span className="text-[13px] text-slate-700 leading-snug">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('sv-SE');
}

function EqSlider({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pct = ((value - min) / (max - min)) * 100;
  const valueFromX = useCallback((clientX: number) => {
    const t = trackRef.current;
    if (!t) return value;
    const rect = t.getBoundingClientRect();
    return Math.round((min + Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * (max - min)) / step) * step;
  }, [min, max, step, value]);
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true; onChange(valueFromX(e.clientX));
    const mv = (ev: MouseEvent) => { if (dragging.current) onChange(valueFromX(ev.clientX)); };
    const up = () => { dragging.current = false; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  }, [onChange, valueFromX]);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation(); dragging.current = true; onChange(valueFromX(e.touches[0].clientX));
    const mv = (ev: TouchEvent) => { ev.preventDefault(); if (dragging.current) onChange(valueFromX(ev.touches[0].clientX)); };
    const end = () => { dragging.current = false; window.removeEventListener('touchmove', mv); window.removeEventListener('touchend', end); };
    window.addEventListener('touchmove', mv, { passive: false }); window.addEventListener('touchend', end);
  }, [onChange, valueFromX]);
  return (
    <div ref={trackRef} className="relative h-9 flex items-center cursor-pointer select-none" onMouseDown={onMouseDown} onTouchStart={onTouchStart}>
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-slate-200">
        <div className="absolute left-0 top-0 h-full rounded-full bg-[#0e6efe]" style={{ width: `${pct}%` }} />
      </div>
      <div className="absolute w-5 h-5 rounded-full bg-white border-2 border-[#0e6efe] shadow-md -translate-x-1/2" style={{ left: `${pct}%` }} />
    </div>
  );
}

type EquityStep = 'start' | 'car' | 'debt' | 'cash' | 'result';

function CarEquityCalc({ carPrice, usedPrice, carName }: { carPrice: number; usedPrice?: number; carName?: string }) {
  const basePrice = usedPrice ? Math.round((carPrice + usedPrice) / 2) : carPrice;
  const depositNeeded = Math.round(basePrice * 0.20);
  const monthlyBase = Math.round(calcCarMonthly(basePrice, 0.55));

  const [step, setStep] = useState<EquityStep>('start');
  const [hasCar, setHasCar] = useState<boolean | null>(null);
  const [carValue, setCarValue] = useState(150_000);
  const [carDebt, setCarDebt] = useState(0);
  const [cash, setCash] = useState(0);

  const equity = Math.max(0, (hasCar ? carValue - carDebt : 0) + cash);
  const extraNeeded = Math.max(0, depositNeeded - equity);
  const freed = Math.max(0, equity - depositNeeded);
  const loanBase = basePrice - Math.min(equity, depositNeeded) + basePrice * 0.01;
  const r = 0.0649 / 12; const n = 36; const residual = basePrice * 0.55;
  const monthly = Math.round(((loanBase - residual / Math.pow(1 + r, n)) * r) / (1 - Math.pow(1 + r, -n)));
  const monthlySaving = monthlyBase - monthly;

  if (step === 'start') {
    return (
      <section>
        <button
          type="button"
          onClick={() => setStep('car')}
          className="w-full flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0e6efe]/40 rounded-xl px-4 py-3.5 transition-all duration-150 group text-left active:scale-[0.99]"
        >
          <div className="w-9 h-9 rounded-lg bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-[#0e6efe]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-800">Räkna vad din insats ger dig</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Insatskrav: <span className="font-semibold text-slate-600">{fmt(depositNeeded)} kr</span> · ~{fmt(monthlyBase)} kr/mån
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0e6efe] transition-colors shrink-0" />
        </button>
      </section>
    );
  }

  return (
    <section onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#0e6efe]" />
          <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">Din insats för {carName ?? 'denna bil'}</span>
        </div>
        <button type="button" onClick={() => { setStep('start'); setHasCar(null); setCarValue(150_000); setCarDebt(0); setCash(0); }} className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
        {/* Progress bar */}
        <div className="flex h-1">
          {(['car', 'debt', 'cash', 'result'] as EquityStep[]).map((s, i) => {
            const steps: EquityStep[] = ['car', 'debt', 'cash', 'result'];
            const currentIdx = steps.indexOf(step);
            return (
              <div key={s} className={`flex-1 transition-colors duration-300 ${i <= currentIdx ? 'bg-[#0e6efe]' : 'bg-slate-200'} ${i > 0 ? 'ml-0.5' : ''}`} />
            );
          })}
        </div>

        <div className="p-4 space-y-4">
          {/* Step: har du bil? */}
          {step === 'car' && (
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-slate-800">Har du en bil att byta in?</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ val: true, label: 'Ja, byta in', icon: Car }, { val: false, label: 'Nej, enbart kontanter', icon: Wallet }].map(opt => (
                  <button
                    key={String(opt.val)}
                    type="button"
                    onClick={() => { setHasCar(opt.val); setStep(opt.val ? 'debt' : 'cash'); }}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 text-center transition-all duration-150 ${hasCar === opt.val ? 'border-[#0e6efe] bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <opt.icon className={`w-5 h-5 ${hasCar === opt.val ? 'text-[#0e6efe]' : 'text-slate-400'}`} />
                    <span className={`text-[11.5px] font-semibold leading-tight ${hasCar === opt.val ? 'text-[#0e6efe]' : 'text-slate-600'}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: skuld (visas efter att man valt "ja") */}
          {step === 'debt' && (
            <div className="space-y-3">
              <div>
                <p className="text-[13px] font-semibold text-slate-800">Vad är din bil värd?</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Uppskatta på Blocket eller Kvdbil — för en exakt värdering, ring oss</p>
              </div>
              <div className="text-center py-1">
                <span className="text-[28px] font-bold text-slate-900 tabular-nums">{fmt(carValue)} kr</span>
              </div>
              <EqSlider value={carValue} min={20_000} max={600_000} step={5_000} onChange={setCarValue} />
              <div className="flex justify-between text-[10px] text-slate-400 -mt-2">
                <span>20 000 kr</span><span>600 000 kr</span>
              </div>
              <div className="mt-1">
                <p className="text-[12px] font-semibold text-slate-700 mb-1">Kvarvarande skuld på bilen</p>
                <div className="text-center py-1">
                  <span className="text-[22px] font-bold text-slate-900 tabular-nums">
                    {carDebt === 0 ? 'Ingen skuld' : `${fmt(carDebt)} kr`}
                  </span>
                  {carDebt > 0 && <span className="text-[11px] text-emerald-600 font-semibold ml-2">Netto: {fmt(Math.max(0, carValue - carDebt))} kr</span>}
                </div>
                <EqSlider value={carDebt} min={0} max={Math.max(carValue, 300_000)} step={5_000} onChange={setCarDebt} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setStep('car')} className="h-10 px-4 rounded-xl border border-slate-200 text-slate-500 text-[12px] font-semibold hover:border-slate-300 transition-colors">Tillbaka</button>
                <button type="button" onClick={() => setStep('cash')} className="flex-1 h-10 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5">
                  Fortsätt <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step: kontanter */}
          {step === 'cash' && (
            <div className="space-y-3">
              <div>
                <p className="text-[13px] font-semibold text-slate-800">Extra kontanter till insatsen?</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Utöver inbytesbilen — valfritt</p>
              </div>
              <div className="text-center py-1">
                <span className="text-[28px] font-bold text-slate-900 tabular-nums">
                  {cash === 0 ? 'Inga extra' : `${fmt(cash)} kr`}
                </span>
              </div>
              <EqSlider value={cash} min={0} max={500_000} step={5_000} onChange={setCash} />
              <div className="flex justify-between text-[10px] text-slate-400 -mt-2">
                <span>0 kr</span><span>500 000 kr</span>
              </div>
              {hasCar && (
                <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Total insats</span>
                  <span className="text-[13px] font-bold text-slate-900 tabular-nums">{fmt(Math.max(0, carValue - carDebt) + cash)} kr</span>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setStep(hasCar ? 'debt' : 'car')} className="h-10 px-4 rounded-xl border border-slate-200 text-slate-500 text-[12px] font-semibold hover:border-slate-300 transition-colors">Tillbaka</button>
                <button type="button" onClick={() => setStep('result')} className="flex-1 h-10 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5">
                  Se resultat <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {step === 'result' && (
            <div className="space-y-3">
              {/* Status banner */}
              {extraNeeded === 0 ? (
                <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12.5px] font-bold text-emerald-800">Din insats täcker!</p>
                    <p className="text-[11.5px] text-emerald-700 mt-0.5">
                      {freed > 0
                        ? `Du har ${fmt(freed)} kr över efter insatsen — pengarna är dina att behålla.`
                        : `Din insats matchar exakt kontantinsatskravet på ${fmt(depositNeeded)} kr.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-3">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12.5px] font-bold text-amber-800">Saknas {fmt(extraNeeded)} kr</p>
                    <p className="text-[11.5px] text-amber-700 mt-0.5">
                      Din insats är {fmt(equity)} kr — du behöver {fmt(extraNeeded)} kr till för att nå 20% ({fmt(depositNeeded)} kr).
                    </p>
                  </div>
                </div>
              )}

              {/* Key numbers */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Din insats</p>
                  <p className="text-[20px] font-extrabold text-slate-900 tabular-nums leading-none">{fmt(equity)}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">kr</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Månadskostnad</p>
                  <p className={`text-[20px] font-extrabold tabular-nums leading-none ${extraNeeded === 0 ? 'text-[#0e6efe]' : 'text-slate-700'}`}>{fmt(monthly)}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">kr/mån</p>
                </div>
              </div>

              {monthlySaving > 100 && extraNeeded === 0 && (
                <div className="flex items-center gap-2 bg-[#0e6efe]/5 border border-[#0e6efe]/15 rounded-xl px-3 py-2.5">
                  <TrendingDown className="w-3.5 h-3.5 text-[#0e6efe] shrink-0" />
                  <p className="text-[11.5px] text-[#0e6efe] font-semibold">
                    Din insats sänker månadskostnaden med {fmt(monthlySaving)} kr/mån vs 0 kr i insats
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
                {[
                  { label: 'Insatskrav (20%)', value: `${fmt(depositNeeded)} kr` },
                  { label: freed > 0 ? 'Frigjort kapital' : 'Saknas', value: freed > 0 ? `+${fmt(freed)} kr` : extraNeeded > 0 ? `${fmt(extraNeeded)} kr` : '–' },
                  { label: 'Lånesumma', value: `${fmt(loanBase)} kr` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-[8.5px] text-slate-400 mb-0.5 leading-tight">{label}</p>
                    <p className="text-[9.5px] font-bold text-slate-700 tabular-nums">{value}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => { setStep('car'); setHasCar(null); setCarValue(150_000); setCarDebt(0); setCash(0); }}
                className="w-full h-9 rounded-xl border border-slate-200 text-slate-500 text-[12px] font-semibold hover:border-slate-300 hover:text-slate-700 transition-colors"
              >
                Räkna om
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function getDrivetrainLabel(drivetrain: string[]): string {
  const labels: Record<string, string> = { fwd: 'Framhjulsdrift', rwd: 'Bakhjulsdrift', awd: 'Fyrhjulsdrift' };
  return drivetrain.map(d => labels[d] || d).join(', ');
}

function ComparisonContent({ data, persona, onSelect, onFitQuiz, carName }: { data: ComparisonCar; persona: Persona | null; onSelect?: () => void; onFitQuiz?: () => void; carName?: string }) {
  const FuelIcon = getFuelIcon(data.specs.fuel_types);
  const whoSuits = getWhoItSuitsFor(data);
  const cta = getPersonaCTA(persona, data.brand_display, data.model_display);
  const carPrice = data.pricing.new_from_sek ?? null;
  const usedPrice = data.pricing.used_from_sek ?? undefined;
  const [calcOpen, setCalcOpen] = useState(false);
  const monthlyUsed = data.pricing.monthly_used;
  const monthlyUsedMin = data.pricing.monthly_used_min;
  const monthlyUsedMax = data.pricing.monthly_used_max;

  // Persona-driven section order
  const showSafetyFirst = persona === 'first_time_buyer';
  const showFamilyFirst = persona === 'family';
  const showPricingFirst = persona === 'researcher' || persona === 'pragmatist';
  const showDrivingFirst = persona === 'enthusiast';

  const ratingsSection = (
    <section key="ratings">
      <SectionTitle>Betyg</SectionTitle>
      <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Totalt</span>
          <span className="text-xl font-bold text-[#0047B3]">{data.ratings.overall}/10</span>
        </div>
        {showDrivingFirst && <RatingBar label="Körning" value={data.ratings.driving} icon={Gauge} />}
        {(showFamilyFirst || showSafetyFirst) && <RatingBar label="Komfort" value={data.ratings.comfort} icon={Armchair} />}
        {(showFamilyFirst || showSafetyFirst) && <RatingBar label="Praktiskt" value={data.ratings.practicality} icon={Briefcase} />}
        {(showPricingFirst || !persona) && <RatingBar label="Värde" value={data.ratings.value} icon={TrendingDown} />}
        {!showDrivingFirst && <RatingBar label="Körning" value={data.ratings.driving} icon={Gauge} />}
        {!showFamilyFirst && !showSafetyFirst && <RatingBar label="Komfort" value={data.ratings.comfort} icon={Armchair} />}
        {!showFamilyFirst && !showSafetyFirst && <RatingBar label="Praktiskt" value={data.ratings.practicality} icon={Briefcase} />}
        {!showPricingFirst && !!persona && <RatingBar label="Värde" value={data.ratings.value} icon={TrendingDown} />}
      </div>
    </section>
  );


  const specsSection = (
    <section key="specs">
      <SectionTitle>Specifikationer</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        <SpecItem icon={Car} label="Kaross" value={getBodyLabel(data.specs.body_type)} />
        <SpecItem icon={FuelIcon} label="Drivmedel" value={getFuelLabel(data.specs.fuel_types)} />
        <SpecItem icon={Gauge} label="Drivlina" value={getDrivetrainLabel(data.specs.drivetrain)} />
        <SpecItem icon={Briefcase} label="Bagageutrymme" value={data.specs.trunk_liters ? `${data.specs.trunk_liters} liter` : '-'} />
      </div>
      {data.specs.trunk_liters_max && (
        <p className="text-[12px] text-slate-400 mt-2 pl-1">
          Max med fällda baksäten: {data.specs.trunk_liters_max} liter
        </p>
      )}
    </section>
  );

  const prosConsSection = (
    <section key="pros-cons">
      <SectionTitle>Styrkor & svagheter</SectionTitle>
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-2">
          {data.pros.map((pro, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-[13px] text-slate-700">{pro}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 mt-1">
          {data.cons.map((con, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                <XIcon className="w-3 h-3 text-red-500" />
              </div>
              <span className="text-[13px] text-slate-700">{con}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // Ordered sections based on persona
  const orderedSections = (() => {
    if (showSafetyFirst) return [ratingsSection, specsSection, prosConsSection];
    if (showFamilyFirst) return [specsSection, ratingsSection, prosConsSection];
    if (showPricingFirst) return [ratingsSection, specsSection, prosConsSection];
    if (showDrivingFirst) return [ratingsSection, specsSection, prosConsSection];
    return [ratingsSection, specsSection, prosConsSection];
  })();

  const ctaButtons = (carPrice || onFitQuiz || onSelect) && (
    <div className="space-y-2.5">
      {/* Primary CTA */}
      {onSelect && (
        <button
          type="button"
          onClick={onSelect}
          className="w-full flex flex-col items-center gap-0.5 py-3.5 rounded-2xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.99] text-white transition-all duration-200 hover:shadow-lg shadow-md shadow-[#0e6efe]/25"
        >
          <span className="text-[15px] font-bold inline-flex items-center gap-2">
            {cta.headline}
            <ArrowRight className="w-4 h-4" />
          </span>
          <span className="text-[11.5px] text-white/65">{cta.sub}</span>
        </button>
      )}

      {/* Secondary: Kalkyl + Passar mig */}
      {(carPrice || onFitQuiz) && (
        <div className="grid grid-cols-2 gap-2">
          {carPrice && (
            <button
              type="button"
              onClick={() => setCalcOpen(v => !v)}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-14 rounded-2xl border text-[12px] font-semibold transition-all duration-150 active:scale-[0.97] ${
                calcOpen
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <span className="text-[16px] leading-none">{calcOpen ? '✕' : '◎'}</span>
              <span>{calcOpen ? 'Stäng' : 'Räkna kalkyl'}</span>
            </button>
          )}
          {onFitQuiz && (
            <button
              type="button"
              onClick={onFitQuiz}
              className="flex flex-col items-center justify-center gap-0.5 h-14 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 text-[12px] font-semibold transition-all duration-150 active:scale-[0.97]"
            >
              <span className="text-[16px] leading-none">◇</span>
              <span>Passar den mig?</span>
            </button>
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
        {calcOpen && carPrice && (
          <motion.div
            key="calc"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <CalcPanel carPrice={carPrice} usedPrice={usedPrice} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="space-y-7">
      {/* Expert summary + CTAs */}
      <section className="space-y-3">
        <div className="p-4 bg-[#0e6efe]/5 rounded-xl border border-[#0e6efe]/10">
          <p className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-wide mb-3">Experternas bedömning</p>
          {carPrice ? (
            <MonthlyCostBlock carPrice={carPrice} usedPrice={usedPrice} monthlyUsed={monthlyUsed} monthlyUsedMin={monthlyUsedMin} monthlyUsedMax={monthlyUsedMax} />
          ) : (
            <div>
              <p className="text-[12px] text-slate-500">Uppskattad månadskostnad</p>
              <p className="text-[14px] text-slate-400 italic">Pris ej tillgängligt</p>
            </div>
          )}
          {data.meta_description && (
            <p className="text-[13px] text-slate-600 leading-relaxed mt-3">{data.meta_description}</p>
          )}
        </div>

        {/* CTAs sit right here — prominent, early */}
        {ctaButtons}
      </section>

      {/* Persona-specific insight */}
      {persona && <PersonaInsightSection persona={persona} data={data} />}

      {/* Who it suits */}
      {whoSuits.length > 0 && (
        <section>
          <SectionTitle>Vem passar bilen för?</SectionTitle>
          <div className="space-y-2">
            {whoSuits.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0e6efe]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-3 h-3 text-[#0e6efe]" />
                </div>
                <span className="text-[13px] text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {carPrice && (
        <CarEquityCalc carPrice={carPrice} usedPrice={usedPrice} carName={`${data.brand_display} ${data.model_display}`} />
      )}

      {/* Persona-ordered sections */}
      {orderedSections}
    </div>
  );
}

function BasicContent({ car, onSelect, onFitQuiz }: { car: DetailCarData; onSelect?: () => void; onFitQuiz?: () => void }) {
  const [calcOpen, setCalcOpen] = useState(false);
  const carPrice = car.usedPrice ?? null;

  return (
    <div className="space-y-5">
      {/* CTAs at top */}
      <div className="space-y-2.5">
        {onSelect && (
          <button
            type="button"
            onClick={onSelect}
            className="w-full flex flex-col items-center gap-0.5 py-3.5 rounded-2xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.99] text-white transition-all duration-200 hover:shadow-lg shadow-md shadow-[#0e6efe]/25"
          >
            <span className="text-[15px] font-bold inline-flex items-center gap-2">
              Låt oss hitta bästa priset
              <ArrowRight className="w-4 h-4" />
            </span>
            <span className="text-[11.5px] text-white/65">Vi förhandlar {car.make} {car.model} åt dig — helt gratis</span>
          </button>
        )}
        {(carPrice || onFitQuiz) && (
          <div className="grid grid-cols-2 gap-2">
            {carPrice && (
              <button
                type="button"
                onClick={() => setCalcOpen(v => !v)}
                className={`flex flex-col items-center justify-center gap-0.5 h-14 rounded-2xl border text-[12px] font-semibold transition-all duration-150 active:scale-[0.97] ${
                  calcOpen
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-[16px] leading-none">{calcOpen ? '✕' : '◎'}</span>
                <span>{calcOpen ? 'Stäng' : 'Räkna kalkyl'}</span>
              </button>
            )}
            {onFitQuiz && (
              <button
                type="button"
                onClick={onFitQuiz}
                className="flex flex-col items-center justify-center gap-0.5 h-14 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 text-[12px] font-semibold transition-all duration-150 active:scale-[0.97]"
              >
                <span className="text-[16px] leading-none">◇</span>
                <span>Passar den mig?</span>
              </button>
            )}
          </div>
        )}
        <AnimatePresence initial={false}>
          {calcOpen && carPrice && (
            <motion.div
              key="calc"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <CalcPanel carPrice={carPrice} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-start gap-2.5 p-4 bg-slate-50 rounded-xl">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-[13px] text-slate-500">
          Detaljerad data för denna modell är inte tillgänglig ännu. Vi arbetar på att lägga till fler bilmodeller.
        </p>
      </div>

      {carPrice && <CarEquityCalc carPrice={carPrice} carName={`${car.make} ${car.model}`} />}

      {car.matchReasons.length > 0 && (
        <div>
          <SectionTitle>Varför vi rekommenderar den</SectionTitle>
          <div className="space-y-2">
            {car.matchReasons.map((reason, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#0047B3]/10 flex items-center justify-center shrink-0">
                  <Star className="w-3 h-3 text-[#0047B3]" />
                </div>
                <span className="text-[13px] text-slate-700">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-3">{children}</h3>
  );
}

function SpecItem({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl min-w-0">
      <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-[12px] sm:text-[13px] font-medium text-slate-800 leading-snug">{value}</p>
      </div>
    </div>
  );
}
