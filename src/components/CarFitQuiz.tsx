import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Check, Zap, Users, User, Package,
  Wallet, CreditCard, RefreshCcw, TrendingUp, Receipt,
  MapPin, Navigation, Gauge, Shield, Armchair, Maximize,
  Wrench, TrendingDown, Home, Building2, ParkingCircle,
  BatteryCharging, Car, AlertCircle, Coffee, Star,
} from 'lucide-react';
import type { ComparisonCar } from '../lib/comparison/types';
import { PRIORITY_TRAITS } from './quiz/QuizTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Answers {
  daily_use?: 'solo' | 'family' | 'cargo' | 'sporadic';
  annual_mileage?: 'low' | 'medium' | 'high';
  financing_type?: 'cash' | 'loan' | 'leasing';
  monthly_income?: 'under25k' | '25k40k' | '40k60k' | 'over60k';
  monthly_expenses?: 'none' | 'under3k' | '3k8k' | 'over8k';
  charging?: 'home' | 'work' | 'public' | 'none';
  fuel_pref?: 'ev' | 'hybrid' | 'petrol' | 'diesel';
  priorities?: string[];
}

interface AffordabilityResult {
  label: 'comfortable' | 'possible' | 'tight' | 'difficult';
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  monthly_financing: number;
  monthly_fuel: number;
  monthly_insurance: number;
  monthly_service: number;
  total_monthly: number;
  available_budget: number;
}

interface ScoreResult {
  score: number;
  title: string;
  description: string;
  positives: string[];
  negatives: string[];
  color: string;
  affordability?: AffordabilityResult;
}

// ─── Steps ────────────────────────────────────────────────────────────────────

type StepId = 'daily_use' | 'annual_mileage' | 'financing_type'
  | 'monthly_income' | 'monthly_expenses' | 'charging' | 'fuel_pref' | 'priorities';

interface Option { id: string; label: string; description?: string; icon: typeof Car }
interface Step { id: StepId; question: string; subtitle?: string; multi: boolean; maxSelect?: number; options: Option[] }

const STEPS: Record<string, Step> = {
  daily_use: {
    id: 'daily_use',
    question: 'Hur ser din vardag med bilen ut?',
    multi: false,
    options: [
      { id: 'solo', label: 'Mest ensam', description: 'Pendling & ärenden', icon: User },
      { id: 'family', label: 'Med familjen', description: 'Barn & aktiviteter', icon: Users },
      { id: 'cargo', label: 'Mycket last', description: 'Sport, djur & utrustning', icon: Package },
      { id: 'sporadic', label: 'Lite & sporadiskt', description: 'Helg & tillfällen', icon: Coffee },
    ],
  },
  annual_mileage: {
    id: 'annual_mileage',
    question: 'Hur mycket kör du ungefär per år?',
    multi: false,
    options: [
      { id: 'low', label: 'Under 1 000 mil', description: 'Mestadels stad', icon: MapPin },
      { id: 'medium', label: '1 000 – 2 000 mil', description: 'Blandad körning', icon: Navigation },
      { id: 'high', label: 'Över 2 000 mil', description: 'Pendlar & reser mycket', icon: Gauge },
    ],
  },
  financing_type: {
    id: 'financing_type',
    question: 'Hur planerar du att köpa bilen?',
    subtitle: 'Väljer du rätt finansiering sparar du tusenlappar',
    multi: false,
    options: [
      { id: 'loan', label: 'Billån', description: 'Lånefinansiering, du äger bilen', icon: CreditCard },
      { id: 'leasing', label: 'Privatleasing', description: 'Fast månadskostnad, byt bil enkelt', icon: RefreshCcw },
      { id: 'cash', label: 'Kontant', description: 'Du betalar hela beloppet direkt', icon: Wallet },
    ],
  },
  monthly_income: {
    id: 'monthly_income',
    question: 'Vad är hushållets nettoinkomst per månad?',
    subtitle: 'Vi räknar ut om bilen passar din ekonomi',
    multi: false,
    options: [
      { id: 'under25k', label: 'Under 25 000 kr', description: 'Netto efter skatt', icon: TrendingUp },
      { id: '25k40k', label: '25 000 – 40 000 kr', description: 'Netto efter skatt', icon: TrendingUp },
      { id: '40k60k', label: '40 000 – 60 000 kr', description: 'Netto efter skatt', icon: TrendingUp },
      { id: 'over60k', label: 'Över 60 000 kr', description: 'Netto efter skatt', icon: TrendingUp },
    ],
  },
  monthly_expenses: {
    id: 'monthly_expenses',
    question: 'Har du andra lån eller amorteringar?',
    subtitle: 'Exkl. hyra/bolån som de flesta har',
    multi: false,
    options: [
      { id: 'none', label: 'Inga andra lån', description: 'Ingen avbetalning just nu', icon: Check },
      { id: 'under3k', label: 'Under 3 000 kr/mån', description: 'Konsumtionslån, student etc.', icon: Receipt },
      { id: '3k8k', label: '3 000 – 8 000 kr/mån', description: 'Flera lån eller amorteringar', icon: Receipt },
      { id: 'over8k', label: 'Över 8 000 kr/mån', description: 'Stora åtaganden', icon: Receipt },
    ],
  },
  charging: {
    id: 'charging',
    question: 'Kan du ladda bilen enkelt?',
    multi: false,
    options: [
      { id: 'home', label: 'Hemma (garage / carport)', description: 'Bäst för elbil — laddar under natten', icon: Home },
      { id: 'work', label: 'På jobbet', description: 'Laddning under arbetstid', icon: Building2 },
      { id: 'public', label: 'Bara publika laddare', description: 'Snabbladdning vid behov', icon: ParkingCircle },
      { id: 'none', label: 'Inte möjligt just nu', description: 'Kan vara ett hinder för elbil', icon: X },
    ],
  },
  fuel_pref: {
    id: 'fuel_pref',
    question: 'Vilken drivlina passar dig bäst?',
    multi: false,
    options: [
      { id: 'hybrid', label: 'Hybrid / Laddhybrid', description: 'Flexibel & bränslesnål', icon: BatteryCharging },
      { id: 'petrol', label: 'Bensin', description: 'Beprövat & bekvämt', icon: Car },
      { id: 'diesel', label: 'Diesel', description: 'Ekonomisk vid längre körning', icon: Car },
      { id: 'ev', label: 'Elbil passar mig', description: 'Om laddning är löst', icon: Zap },
    ],
  },
  priorities: {
    id: 'priorities',
    question: 'Vad är viktigast för dig i bilen?',
    subtitle: 'Välj upp till 3 saker',
    multi: true,
    maxSelect: 3,
    options: [
      { id: 'economy', label: 'Låga driftskostnader', description: undefined, icon: TrendingDown },
      { id: 'safety', label: 'Säkerhet & trygghet', description: undefined, icon: Shield },
      { id: 'comfort', label: 'Komfort & kvalitet', description: undefined, icon: Armchair },
      { id: 'performance', label: 'Prestanda & kördynamik', description: undefined, icon: Gauge },
      { id: 'space', label: 'Utrymme & praktik', description: undefined, icon: Maximize },
      { id: 'reliability', label: 'Driftsäkerhet', description: undefined, icon: Wrench },
    ],
  },
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreCarFit(car: ComparisonCar, a: Answers, isEv: boolean): ScoreResult {
  let score = 40;
  const positives: string[] = [];
  const negatives: string[] = [];
  const carName = `${car.brand_display} ${car.model_display}`.toLowerCase();
  const fuels = car.specs.fuel_types;
  const isHybrid = fuels.includes('hybrid') || fuels.includes('laddhybrid');
  const isDiesel = fuels.includes('diesel');

  // ── EV-specific scoring ──
  if (isEv) {
    if (a.charging === 'home') { score += 20; positives.push('Hemmaladdning är optimalt för elbil'); }
    else if (a.charging === 'work') { score += 14; positives.push('Laddning på jobbet fungerar bra'); }
    else if (a.charging === 'public') { score += 4; negatives.push('Enbart publika laddare begränsar flexibiliteten'); }
    else if (a.charging === 'none') { score -= 18; negatives.push('Utan laddmöjlighet är elbil opraktiskt'); }
  } else {
    // ── Fuel preference match ──
    if (a.fuel_pref) {
      const match = (a.fuel_pref === 'hybrid' && isHybrid) ||
        (a.fuel_pref === 'diesel' && isDiesel) ||
        (a.fuel_pref === 'petrol' && fuels.includes('bensin')) ||
        (a.fuel_pref === 'ev' && fuels.includes('el'));
      if (match) { score += 16; positives.push('Drivlinan matchar ditt förstahandsval'); }
      else { score -= 6; negatives.push('Drivlinan är inte din föredragna'); }
    }
  }

  // ── Daily use ──
  if (a.daily_use) {
    const familyCues = ['xc', 'x3', 'x5', 'q5', 'q7', 'gle', 'tiguan', 'kodiaq', 'sorento', 'id.4', 'id.5', 'enyaq', 'ioniq', 'model y', 'model x'];
    const soloCues = ['golf', 'polo', '1-serie', 'a3', 'a-klass', 'model 3', 'id.3', 'born', 'yaris', 'corolla'];
    const cargoCues = ['v90', 'v60', 'xc90', 'x5', 'q7', 'gle', 'kodiaq', 'superb', 'passat'];
    if (a.daily_use === 'family' && (familyCues.some(k => carName.includes(k)) || car.specs.seats >= 5)) { score += 14; positives.push('Passar utmärkt för familjebruk'); }
    else if (a.daily_use === 'solo' && soloCues.some(k => carName.includes(k))) { score += 14; positives.push('Idealisk pendel- och vardagsbil'); }
    else if (a.daily_use === 'cargo' && (cargoCues.some(k => carName.includes(k)) || (car.specs.trunk_liters && car.specs.trunk_liters > 500))) { score += 14; positives.push('Rejält lastutrymme för dina behov'); }
    else { score += 6; }
  }

  // ── Mileage ──
  if (a.annual_mileage) {
    if (!isEv && a.annual_mileage === 'high' && isDiesel) { score += 12; positives.push('Diesel lönar sig vid högt miltal'); }
    else if (!isEv && a.annual_mileage === 'low' && isDiesel) { score -= 8; negatives.push('Diesel rekommenderas ej vid lågt miltal'); }
    else if (isEv && a.annual_mileage !== 'high') { score += 10; positives.push('Elbilar är kostnadseffektiva för ditt miltal'); }
    else { score += 5; }
  }

  // ── Priorities ──
  if (a.priorities && a.priorities.length > 0) {
    for (const prio of a.priorities) {
      const trait = PRIORITY_TRAITS[prio as keyof typeof PRIORITY_TRAITS];
      if (!trait) continue;
      const brandMatch = trait.brands.some(b => car.brand_display.toLowerCase().includes(b.toLowerCase()));
      const prosMatch = car.pros.some(p => {
        const pl = p.toLowerCase();
        if (prio === 'economy') return pl.includes('driftskostnad') || pl.includes('förbrukning');
        if (prio === 'safety') return pl.includes('säkerhet');
        if (prio === 'comfort') return pl.includes('komfort') || pl.includes('tyst');
        if (prio === 'performance') return pl.includes('prestanda') || pl.includes('sportig');
        if (prio === 'space') return pl.includes('utrymme') || pl.includes('rymlig');
        if (prio === 'reliability') return pl.includes('pålitlig') || pl.includes('tillförlitlig');
        return false;
      });
      if (brandMatch || prosMatch) {
        score += 5;
        const labels: Record<string, string> = {
          economy: 'Känd för låga driftskostnader',
          safety: 'Högt säkerhetsbetyg i klassen',
          comfort: 'Komfort är ett styrkeområde',
          performance: 'Sportig och engagerande körning',
          space: 'Bra utrymme och praktikalitet',
          reliability: 'Stark driftsäkerhet',
        };
        if (labels[prio] && positives.length < 3) positives.push(labels[prio]);
      }
    }
  }

  score = Math.max(10, Math.min(100, Math.round(score)));

  let title: string;
  let description: string;
  let color: string;

  if (score >= 82) {
    title = 'Utmärkt matchning';
    color = '#16a34a';
    description = `${car.brand_display} ${car.model_display} passar din profil riktigt bra.`;
  } else if (score >= 65) {
    title = 'Bra matchning';
    color = '#0e6efe';
    description = `${car.brand_display} ${car.model_display} fyller de flesta av dina behov.`;
  } else if (score >= 50) {
    title = 'Okej matchning';
    color = '#d97706';
    description = `${car.brand_display} ${car.model_display} fungerar, men andra alternativ kan passa bättre.`;
  } else {
    title = 'Svag matchning';
    color = '#dc2626';
    description = `${car.brand_display} ${car.model_display} är troligen inte det optimala valet för dig.`;
  }

  // ── Affordability ──
  let affordability: AffordabilityResult | undefined;
  if (a.monthly_income && a.monthly_expenses && a.financing_type && a.annual_mileage) {
    const price = car.pricing.used_from_sek || car.pricing.new_from_sek || 300000;

    // Financing
    let monthly_financing = 0;
    if (a.financing_type === 'loan') {
      const loanAmount = price * 0.8;
      const r = 0.079 / 12;
      const n = 60;
      monthly_financing = Math.round(loanAmount * r / (1 - Math.pow(1 + r, -n)));
    } else if (a.financing_type === 'leasing') {
      monthly_financing = Math.round(price * 0.0088);
    }

    // Fuel
    const milsMap: Record<string, number> = { low: 800, medium: 1500, high: 2500 };
    const mils = milsMap[a.annual_mileage] ?? 1500;
    let krPerMil = 14;
    if (fuels.includes('el')) krPerMil = 3;
    else if (fuels.includes('laddhybrid')) krPerMil = 6;
    else if (fuels.includes('hybrid')) krPerMil = 8;
    else if (fuels.includes('diesel')) krPerMil = 10;
    const monthly_fuel = Math.round((mils * krPerMil) / 12);

    // Insurance
    let monthly_insurance = 900;
    if (price < 200000) monthly_insurance = 600;
    else if (price < 400000) monthly_insurance = 900;
    else if (price < 650000) monthly_insurance = 1200;
    else monthly_insurance = 1500;

    const monthly_service = fuels.includes('el') ? 125 : 250;
    const total_monthly = monthly_financing + monthly_fuel + monthly_insurance + monthly_service;

    // Affordability check
    const incomeMap: Record<string, number> = { under25k: 22000, '25k40k': 32000, '40k60k': 50000, over60k: 70000 };
    const expMap: Record<string, number> = { none: 0, under3k: 1500, '3k8k': 5000, over8k: 9000 };
    const income = incomeMap[a.monthly_income] ?? 35000;
    const existingExp = expMap[a.monthly_expenses] ?? 0;
    const available_budget = Math.round(income * 0.20 - existingExp);

    let label: AffordabilityResult['label'];
    let afTitle: string;
    let afSubtitle: string;
    let afColor: string;
    let afBg: string;

    const ratio = total_monthly / Math.max(available_budget, 1);
    if (ratio <= 0.85) {
      label = 'comfortable'; afColor = '#16a34a'; afBg = '#f0fdf4';
      afTitle = 'Ekonomin ser bra ut';
      afSubtitle = `Bilen passar väl inom din budget med ca ${Math.max(0, available_budget - total_monthly).toLocaleString('sv-SE')} kr/mån kvar`;
    } else if (ratio <= 1.1) {
      label = 'possible'; afColor = '#0e6efe'; afBg = '#eff6ff';
      afTitle = 'Ekonomin är möjlig';
      afSubtitle = 'Kräver prioritering men är genomförbart';
    } else if (ratio <= 1.4) {
      label = 'tight'; afColor = '#d97706'; afBg = '#fffbeb';
      afTitle = 'Ekonomin är tight';
      afSubtitle = 'Bilen kan kräva att du drar ner på annat';
    } else {
      label = 'difficult'; afColor = '#dc2626'; afBg = '#fef2f2';
      afTitle = 'Ekonomin är ansträngd';
      afSubtitle = 'Vi rekommenderar ett billigare alternativ';
    }

    affordability = {
      label, title: afTitle, subtitle: afSubtitle, color: afColor, bgColor: afBg,
      monthly_financing, monthly_fuel, monthly_insurance, monthly_service, total_monthly, available_budget,
    };
  }

  return { score, title, description, positives: positives.slice(0, 3), negatives: negatives.slice(0, 2), color, affordability };
}

// ─── Option card ──────────────────────────────────────────────────────────────

function OptionCard({ option, selected, onClick, accent }: {
  option: Option; selected: boolean; onClick: () => void; accent: string;
}) {
  const Icon = option.icon;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-150 ${
        selected ? 'bg-blue-50 border-[#0e6efe] shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
        selected ? 'bg-[#0e6efe]' : 'bg-slate-100'
      }`}>
        <Icon className={`w-4.5 h-4.5 ${selected ? 'text-white' : 'text-slate-500'}`} style={{ width: 18, height: 18 }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13.5px] font-semibold leading-tight ${selected ? 'text-[#0e6efe]' : 'text-slate-800'}`}>
          {option.label}
        </p>
        {option.description && (
          <p className="text-[11.5px] text-slate-400 mt-0.5">{option.description}</p>
        )}
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
        selected ? 'bg-[#0e6efe] border-[#0e6efe]' : 'border-slate-300'
      }`}>
        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>
    </motion.button>
  );
}

// ─── Score arc ────────────────────────────────────────────────────────────────

function ScoreArc({ score, color }: { score: number; color: string }) {
  const [displayed, setDisplayed] = useState(0);
  const r = 44;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / 1000, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(ease * score));
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const pct = displayed / 100;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 108 108" className="w-full h-full -rotate-90">
        <circle cx="54" cy="54" r={r} fill="none" stroke="#f1f5f9" strokeWidth="9" />
        <motion.circle
          cx="54" cy="54" r={r} fill="none"
          stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-black tabular-nums leading-none" style={{ color }}>{displayed}</span>
        <span className="text-[10px] font-bold text-slate-400 mt-0.5">av 100</span>
      </div>
    </div>
  );
}

// ─── Affordability bar ────────────────────────────────────────────────────────

function AffordBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = Math.min(100, (value / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[11.5px] text-slate-500">{label}</p>
        <p className="text-[12px] font-semibold text-slate-700 tabular-nums">{value.toLocaleString('sv-SE')} kr</p>
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CarFitQuizProps {
  car: ComparisonCar;
  open: boolean;
  onClose: () => void;
  dark?: boolean;
  onNegotiate?: () => void;
}

export function CarFitQuiz({ car, open, onClose, onNegotiate }: CarFitQuizProps) {
  const isEv = !!car?.specs?.fuel_types?.includes('el') &&
    !car?.specs?.fuel_types?.includes('bensin') &&
    !car?.specs?.fuel_types?.includes('diesel');

  const stepOrder = useMemo<StepId[]>(() => {
    if (isEv) return ['daily_use', 'annual_mileage', 'financing_type', 'monthly_income', 'monthly_expenses', 'charging', 'priorities'];
    return ['daily_use', 'annual_mileage', 'financing_type', 'monthly_income', 'monthly_expenses', 'fuel_pref', 'priorities'];
  }, [isEv]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!open) { setStep(0); setAnswers({}); setResult(null); setDirection(1); }
  }, [open]);

  const totalSteps = stepOrder.length;
  const currentStepId = stepOrder[step];
  const currentStep = STEPS[currentStepId];

  function getValues(): string[] {
    const id = currentStepId;
    if (id === 'daily_use') return answers.daily_use ? [answers.daily_use] : [];
    if (id === 'annual_mileage') return answers.annual_mileage ? [answers.annual_mileage] : [];
    if (id === 'financing_type') return answers.financing_type ? [answers.financing_type] : [];
    if (id === 'monthly_income') return answers.monthly_income ? [answers.monthly_income] : [];
    if (id === 'monthly_expenses') return answers.monthly_expenses ? [answers.monthly_expenses] : [];
    if (id === 'charging') return answers.charging ? [answers.charging] : [];
    if (id === 'fuel_pref') return answers.fuel_pref ? [answers.fuel_pref] : [];
    if (id === 'priorities') return answers.priorities || [];
    return [];
  }

  function canAdvance() { return getValues().length > 0; }

  function toggleOption(optId: string) {
    const id = currentStepId;
    if (!currentStep.multi) {
      const update: Answers = { ...answers };
      if (id === 'daily_use') update.daily_use = optId as Answers['daily_use'];
      else if (id === 'annual_mileage') update.annual_mileage = optId as Answers['annual_mileage'];
      else if (id === 'financing_type') update.financing_type = optId as Answers['financing_type'];
      else if (id === 'monthly_income') update.monthly_income = optId as Answers['monthly_income'];
      else if (id === 'monthly_expenses') update.monthly_expenses = optId as Answers['monthly_expenses'];
      else if (id === 'charging') update.charging = optId as Answers['charging'];
      else if (id === 'fuel_pref') update.fuel_pref = optId as Answers['fuel_pref'];
      setAnswers(update);
      setTimeout(() => advance(update), 220);
    } else {
      let current: string[] = answers.priorities || [];
      if (current.includes(optId)) {
        current = current.filter(v => v !== optId);
      } else {
        if (currentStep.maxSelect && current.length >= currentStep.maxSelect) return;
        current = [...current, optId];
      }
      setAnswers({ ...answers, priorities: current });
    }
  }

  function advance(latestAnswers?: Answers) {
    const a = latestAnswers || answers;
    if (step < totalSteps - 1) { setDirection(1); setStep(s => s + 1); }
    else { setResult(scoreCarFit(car, a, isEv)); }
  }

  function back() {
    if (step === 0) { onClose(); return; }
    setDirection(-1);
    setStep(s => s - 1);
  }

  if (!car) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 360 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8 z-50 w-full sm:w-[440px] flex flex-col bg-[#faf9f7] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: 'calc(100dvh - 40px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle (mobile only) */}
            <div className="flex-shrink-0 flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 px-5 pt-3 pb-4 bg-white border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#0e6efe]/10 flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 text-[#0e6efe]" />
                  </div>
                  <div>
                    <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">Passar bilen mig?</p>
                    <p className="text-[13px] font-bold text-slate-900 leading-tight">{car.brand_display} {car.model_display}</p>
                  </div>
                </div>
                <button
                  type="button" onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {!result && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    {stepOrder.map((_, i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i < step ? '#0e6efe' : i === step ? '#93c5fd' : '#e2e8f0' }}
                      />
                    ))}
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-1.5">Fråga {step + 1} av {totalSteps}</p>
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {!result ? (
                <div className="px-5 pt-4 pb-4">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: direction * 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction * -20 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                      <p className="text-[16px] font-bold text-slate-900 mb-0.5">{currentStep.question}</p>
                      {currentStep.subtitle && (
                        <p className="text-[12px] text-slate-500 mb-4">{currentStep.subtitle}</p>
                      )}
                      <div className={`space-y-2 ${!currentStep.subtitle ? 'mt-4' : ''}`}>
                        {currentStep.options.map(opt => (
                          <OptionCard
                            key={opt.id}
                            option={opt}
                            selected={getValues().includes(opt.id)}
                            onClick={() => toggleOption(opt.id)}
                            accent="#0e6efe"
                          />
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                /* ── RESULT ── */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="px-5 pt-5 pb-4"
                >
                  {/* Score */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-5"
                  >
                    <ScoreArc score={result.score} color={result.color} />
                    <p className="text-[18px] font-black mt-3" style={{ color: result.color }}>{result.title}</p>
                    <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{result.description}</p>
                  </motion.div>

                  {/* Positives / Negatives */}
                  {(result.positives.length > 0 || result.negatives.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="space-y-1.5 mb-5"
                    >
                      {result.positives.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                          <p className="text-[12px] font-medium text-emerald-700 leading-snug">{p}</p>
                        </div>
                      ))}
                      {result.negatives.map((n, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[12px] font-medium text-amber-700 leading-snug">{n}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Affordability card */}
                  {result.affordability && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="rounded-2xl overflow-hidden border border-slate-200 mb-5"
                    >
                      {/* Affordability header */}
                      <div
                        className="px-4 py-3 flex items-center gap-3"
                        style={{ backgroundColor: result.affordability.bgColor }}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: result.affordability.color + '20' }}>
                          <TrendingUp className="w-4 h-4" style={{ color: result.affordability.color }} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold" style={{ color: result.affordability.color }}>{result.affordability.title}</p>
                          <p className="text-[11px] text-slate-500 leading-snug">{result.affordability.subtitle}</p>
                        </div>
                      </div>

                      {/* Cost breakdown */}
                      <div className="bg-white px-4 py-3 space-y-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kostnad / månad</p>
                          <p className="text-[15px] font-black text-slate-900 tabular-nums">
                            {result.affordability.total_monthly.toLocaleString('sv-SE')} <span className="text-[11px] font-medium text-slate-400">kr</span>
                          </p>
                        </div>
                        {result.affordability.monthly_financing > 0 && (
                          <AffordBar
                            label="Finansiering"
                            value={result.affordability.monthly_financing}
                            total={result.affordability.total_monthly}
                            color={result.affordability.color}
                          />
                        )}
                        <AffordBar label="Drivmedel" value={result.affordability.monthly_fuel} total={result.affordability.total_monthly} color={result.affordability.color} />
                        <AffordBar label="Försäkring (est.)" value={result.affordability.monthly_insurance} total={result.affordability.total_monthly} color={result.affordability.color} />
                        <AffordBar label="Service & underhåll" value={result.affordability.monthly_service} total={result.affordability.total_monthly} color={result.affordability.color} />

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <p className="text-[11px] text-slate-400">Din budget för bil (ca)</p>
                          <p className="text-[12px] font-semibold text-slate-600 tabular-nums">
                            {Math.max(0, result.affordability.available_budget).toLocaleString('sv-SE')} kr/mån
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="flex-shrink-0 px-5 pt-3 pb-6 bg-white border-t border-slate-100">
              {!result ? (
                <div className="flex gap-2.5">
                  <button
                    type="button" onClick={back}
                    className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {currentStep.multi && (
                    <motion.button
                      type="button"
                      onClick={() => advance()}
                      disabled={!canAdvance()}
                      whileTap={{ scale: 0.97 }}
                      className={`flex-1 h-11 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-1.5 transition-all duration-200 ${
                        canAdvance() ? 'text-white shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      style={canAdvance() ? { backgroundColor: '#0e6efe', boxShadow: '0 4px 14px #0e6efe40' } : {}}
                    >
                      {step === totalSteps - 1 ? 'Se mitt resultat' : 'Nästa'}
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {onNegotiate && (
                    <motion.button
                      type="button"
                      onClick={() => { onClose(); onNegotiate(); }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="w-full h-12 rounded-2xl font-bold text-[14px] text-white flex items-center justify-center gap-2 shadow-lg"
                      style={{ backgroundColor: '#0e6efe', boxShadow: '0 4px 18px #0e6efe40' }}
                    >
                      Få hjälp att köpa denna bil
                      <ChevronRight className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                    </motion.button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setStep(0); setAnswers({}); setResult(null); }}
                    className="w-full h-10 rounded-xl text-[13px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Gör om quizet
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
