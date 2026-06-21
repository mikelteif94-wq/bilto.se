import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Check, Zap, Users, Briefcase, Compass,
  MapPin, Route, Globe, TrendingDown, Shield, Armchair, Timer, Maximize,
  MonitorSmartphone, Wrench, AlertCircle, Home, Building2, ParkingCircle,
  BatteryCharging, Car, Banknote, CreditCard, RefreshCcw, CalendarClock,
} from 'lucide-react';
import type { ComparisonCar } from '../lib/comparison/types';
import { PRIORITY_TRAITS } from './quiz/QuizTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Answers {
  daily_use?: 'solo' | 'family' | 'cargo' | 'sporadic';
  annual_mileage?: 'low' | 'medium' | 'high';
  monthly_budget?: 'under4k' | '4k6k' | '6k9k' | 'over9k';
  priorities?: string[];
  financing_type?: 'cash' | 'loan' | 'leasing';
  own_period?: '1-2' | '3-4' | '5plus';
  // EV-specific
  charging?: 'home' | 'work' | 'public' | 'none';
  long_trips?: 'often' | 'sometimes' | 'rarely';
  // Non-EV
  fuel_ok?: string[];
  needs_space?: 'yes' | 'no' | 'sometimes';
}

interface TcoResult {
  monthly_financing: number;
  monthly_fuel: number;
  monthly_insurance: number;
  monthly_service: number;
  total_monthly: number;
  total_ownership: number;
  ownership_months: number;
}

interface ScoreResult {
  score: number;
  title: string;
  description: string;
  positives: string[];
  negatives: string[];
  color: string;
  tco?: TcoResult;
}

// ─── Step definitions ─────────────────────────────────────────────────────────

type StepId = 'daily_use' | 'annual_mileage' | 'monthly_budget' | 'priorities'
  | 'charging' | 'long_trips' | 'fuel_ok' | 'needs_space'
  | 'financing_type' | 'own_period';

interface Step {
  id: StepId;
  question: string;
  subtitle?: string;
  multi: boolean;
  maxSelect?: number;
  options: { id: string; label: string; description?: string }[];
}

const STEP_DAILY_USE: Step = {
  id: 'daily_use',
  question: 'Hur ser din vardag med bilen ut?',
  multi: false,
  options: [
    { id: 'solo', label: 'Mest ensam', description: 'Pendling och ärenden' },
    { id: 'family', label: 'Med familjen', description: 'Barn och aktiviteter' },
    { id: 'cargo', label: 'Mycket last', description: 'Fritid och utrustning' },
    { id: 'sporadic', label: 'Lite och sporadiskt', description: 'Mest helgkörning' },
  ],
};

const STEP_MILEAGE: Step = {
  id: 'annual_mileage',
  question: 'Hur mycket kör du ungefär per år?',
  multi: false,
  options: [
    { id: 'low', label: 'Under 1 000 mil', description: 'Mest stadskörning' },
    { id: 'medium', label: '1 000 – 2 000 mil', description: 'Blandad körning' },
    { id: 'high', label: 'Över 2 000 mil', description: 'Pendlar eller reser mycket' },
  ],
};

const STEP_BUDGET: Step = {
  id: 'monthly_budget',
  question: 'Vad är din ungefärliga månadsbudget?',
  subtitle: 'Inkl. lånekostnad, drivmedel och försäkring',
  multi: false,
  options: [
    { id: 'under4k', label: 'Under 4 000 kr/mån', description: 'Budget-alternativ' },
    { id: '4k6k', label: '4 000 – 6 000 kr/mån', description: 'Mellansegment' },
    { id: '6k9k', label: '6 000 – 9 000 kr/mån', description: 'Premium' },
    { id: 'over9k', label: 'Över 9 000 kr/mån', description: 'Lyxsegment' },
  ],
};

const STEP_PRIORITIES: Step = {
  id: 'priorities',
  question: 'Vad är viktigast för dig i bilen?',
  subtitle: 'Välj upp till 3',
  multi: true,
  maxSelect: 3,
  options: [
    { id: 'economy', label: 'Låga driftskostnader' },
    { id: 'safety', label: 'Säkerhet' },
    { id: 'comfort', label: 'Komfort' },
    { id: 'performance', label: 'Prestanda' },
    { id: 'space', label: 'Utrymme och praktikalitet' },
    { id: 'reliability', label: 'Pålitlighet' },
  ],
};

const STEP_CHARGING: Step = {
  id: 'charging',
  question: 'Kan du ladda bilen bekvämt?',
  multi: false,
  options: [
    { id: 'home', label: 'Ja, hemma (garage/carport)', description: 'Bästa alternativet för elbil' },
    { id: 'work', label: 'Ja, på jobbet', description: 'Laddning under arbetstid' },
    { id: 'public', label: 'Bara publika laddare', description: 'Snabbladdning när det behövs' },
    { id: 'none', label: 'Nej, inte just nu', description: 'Kan vara ett hinder' },
  ],
};

const STEP_LONG_TRIPS: Step = {
  id: 'long_trips',
  question: 'Hur ofta kör du längre sträckor (>15 mil)?',
  multi: false,
  options: [
    { id: 'rarely', label: 'Sällan – mestadels stad och pendling', description: undefined },
    { id: 'sometimes', label: 'Ibland – ett par gånger i månaden', description: undefined },
    { id: 'often', label: 'Ofta – veckovis eller mer', description: undefined },
  ],
};

const STEP_FUEL: Step = {
  id: 'fuel_ok',
  question: 'Vilka drivlinor är okej för dig?',
  subtitle: 'Välj alla som passar',
  multi: true,
  options: [
    { id: 'hybrid', label: 'Hybrid / PHEV', description: 'Flexibelt, bra räckvidd' },
    { id: 'petrol', label: 'Bensin', description: 'Traditionellt val' },
    { id: 'diesel', label: 'Diesel', description: 'Ekonomiskt vid långkörning' },
    { id: 'electric', label: 'Elbil (kan tänka mig)', description: 'Om laddning löses' },
  ],
};

const STEP_SPACE: Step = {
  id: 'needs_space',
  question: 'Hur viktigt är bagageutrymme?',
  multi: false,
  options: [
    { id: 'yes', label: 'Mycket viktigt', description: 'Sport, barnvagn, husdjur' },
    { id: 'sometimes', label: 'Bra att ha', description: 'Flexibelt behov' },
    { id: 'no', label: 'Spelar mindre roll', description: 'Pendling i fokus' },
  ],
};

const STEP_FINANCING: Step = {
  id: 'financing_type',
  question: 'Hur planerar du att finansiera bilen?',
  subtitle: 'Påverkar din totala månadskostnad',
  multi: false,
  options: [
    { id: 'loan', label: 'Billån', description: 'Lånefinansiering via bank eller återförsäljare' },
    { id: 'leasing', label: 'Privatleasing', description: 'Fast månadsavgift, byt bil efter kontraktet' },
    { id: 'cash', label: 'Kontant', description: 'Betalar hela beloppet direkt' },
  ],
};

const STEP_OWNERSHIP: Step = {
  id: 'own_period',
  question: 'Hur länge planerar du behålla bilen?',
  subtitle: 'Hjälper oss räkna på total ägandekostnad',
  multi: false,
  options: [
    { id: '1-2', label: '1–2 år', description: 'Kortare ägande, byt ofta' },
    { id: '3-4', label: '3–4 år', description: 'Mellanlång period' },
    { id: '5plus', label: '5 år eller mer', description: 'Långsiktigt ägande' },
  ],
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreCarFit(car: ComparisonCar, a: Answers, isEv: boolean): ScoreResult {
  let score = 42;
  const positives: string[] = [];
  const negatives: string[] = [];

  const carName = `${car.brand_display} ${car.model_display}`.toLowerCase();
  const fuels = car.specs.fuel_types;
  const isHybrid = fuels.includes('hybrid') || fuels.includes('laddhybrid');
  const isDiesel = fuels.includes('diesel');

  // ── EV-specific scoring ──
  if (isEv) {
    if (a.charging === 'home') {
      score += 20;
      positives.push('Hemmaladdning är det optimala för elbil');
    } else if (a.charging === 'work') {
      score += 15;
      positives.push('Laddning på jobbet fungerar bra');
    } else if (a.charging === 'public') {
      score += 5;
      negatives.push('Enbart publika laddare kan begränsa flexibiliteten');
    } else if (a.charging === 'none') {
      score -= 20;
      negatives.push('Utan laddmöjlighet är elbil opraktiskt i vardagen');
    }

    if (a.long_trips === 'rarely') {
      score += 15;
      positives.push('Korta och medellånga resor passar elbil perfekt');
    } else if (a.long_trips === 'sometimes') {
      score += 8;
      positives.push('Bra räckvidd täcker de flesta körningar');
    } else if (a.long_trips === 'often') {
      score -= 5;
      negatives.push('Frekventa långresor kräver planering av laddningsstopp');
    }
  } else {
    // ── Non-EV fuel match ──
    if (a.fuel_ok && a.fuel_ok.length > 0) {
      const fuelMap: Record<string, string[]> = {
        electric: ['el'], hybrid: ['hybrid', 'laddhybrid'], petrol: ['bensin'], diesel: ['diesel'],
      };
      const wanted = a.fuel_ok.flatMap(f => fuelMap[f] || []);
      const matches = wanted.filter(f => fuels.includes(f as typeof fuels[number]));
      if (matches.length > 0) {
        score += 18;
        if (isHybrid) positives.push('Hybrid/PHEV matchar ditt val perfekt');
        else if (isDiesel) positives.push('Diesel passar ditt körprofil');
        else positives.push('Drivlinan matchar dina önskemål');
      } else {
        score -= 8;
        negatives.push('Drivlinan matchar inte ditt förstahandsval');
      }
    }
  }

  // ── Daily use ──
  if (a.daily_use) {
    const familyCues = ['xc', 'x3', 'x5', 'q5', 'q7', 'gle', 'tiguan', 'kodiaq', 'sorento', 'id.4', 'id.5', 'enyaq', 'ioniq', 'model y', 'model x'];
    const soloCues = ['golf', 'polo', '1-serie', 'a3', 'a-klass', 'model 3', 'id.3', 'born', 'yaris'];
    const cargoCues = ['v90', 'v60', 'xc90', 'x5', 'q7', 'gle', 'kodiaq', 'superb', 'passat'];

    if (a.daily_use === 'family' && (familyCues.some(k => carName.includes(k)) || car.specs.seats >= 5)) {
      score += 15;
      positives.push('Passar utmärkt för familjebruk');
    } else if (a.daily_use === 'solo' && soloCues.some(k => carName.includes(k))) {
      score += 15;
      positives.push('Bra som pendel- och vardagsbil');
    } else if (a.daily_use === 'cargo' && (cargoCues.some(k => carName.includes(k)) || (car.specs.trunk_liters && car.specs.trunk_liters > 500))) {
      score += 15;
      positives.push('Rejält lastutrymme för dina behov');
    } else {
      score += 6;
    }
  }

  // ── Mileage ──
  if (a.annual_mileage) {
    if (!isEv) {
      if (a.annual_mileage === 'high' && isDiesel) {
        score += 12;
        positives.push('Diesel lönar sig vid högt miltal');
      } else if (a.annual_mileage === 'low' && isDiesel) {
        score -= 8;
        negatives.push('Diesel rekommenderas ej vid lågt miltal');
      } else {
        score += 6;
      }
    } else {
      if (a.annual_mileage === 'low' || a.annual_mileage === 'medium') {
        score += 8;
      }
    }
  }

  // ── Budget vs estimated monthly ──
  if (a.monthly_budget) {
    const newPrice = car.pricing.new_from_sek;
    const usedPrice = car.pricing.used_from_sek;
    if (newPrice || usedPrice) {
      const base = newPrice && usedPrice ? Math.round((newPrice + usedPrice) / 2) : (newPrice || usedPrice)!;
      // Rough monthly estimate: base * 0.25 / 36 + running costs
      const roughMonthly = Math.round((base * 0.8 * 0.006) + (isEv ? 800 : 1500));
      const budgetRanges: Record<string, [number, number]> = {
        under4k: [0, 4000], '4k6k': [4000, 6000], '6k9k': [6000, 9000], over9k: [9000, 99999],
      };
      const [bMin, bMax] = budgetRanges[a.monthly_budget];
      if (roughMonthly >= bMin && roughMonthly < bMax) {
        score += 10;
        positives.push('Månadskosnaden passar din budget');
      } else if (roughMonthly < bMin) {
        score += 8;
        positives.push('Bilen kan passa inom din budget');
      } else {
        score -= 5;
        negatives.push('Bilen kan bli dyrare än din budget');
      }
    }
  }

  // ── Priorities ──
  if (a.priorities && a.priorities.length > 0) {
    let hits = 0;
    for (const prio of a.priorities) {
      const trait = PRIORITY_TRAITS[prio as keyof typeof PRIORITY_TRAITS];
      if (!trait) continue;
      const brandMatch = trait.brands.some(b => car.brand_display.toLowerCase().includes(b.toLowerCase()));
      const keywordMatch = trait.keywords.some(k => carName.includes(k));
      const prosMatch = car.pros.some(p => {
        const pl = p.toLowerCase();
        if (prio === 'economy') return pl.includes('driftskostnad') || pl.includes('förbrukning') || pl.includes('bränslesnål');
        if (prio === 'safety') return pl.includes('säkerhet') || pl.includes('säker');
        if (prio === 'comfort') return pl.includes('komfort') || pl.includes('bekväm') || pl.includes('tyst');
        if (prio === 'performance') return pl.includes('prestanda') || pl.includes('snabb') || pl.includes('sportig');
        if (prio === 'space') return pl.includes('utrymme') || pl.includes('rymlig') || pl.includes('praktisk');
        if (prio === 'reliability') return pl.includes('pålitlig') || pl.includes('tillförlitlig') || pl.includes('hållbar');
        return false;
      });
      if (brandMatch || keywordMatch || prosMatch) {
        score += 5;
        hits++;
        if (hits <= 2) {
          const labels: Record<string, string> = {
            economy: 'Känd för låga driftskostnader',
            safety: 'Högt säkerhetsbetyg i klassen',
            comfort: 'Komfort är ett styrkeområde',
            performance: 'Prestanda matchar ditt intresse',
            space: 'Bra utrymme och praktikalitet',
            reliability: 'Stark driftsäkerhet och pålitlighet',
          };
          if (labels[prio]) positives.push(labels[prio]);
        }
      }
    }
  }

  // ── Space ──
  if (a.needs_space) {
    if (a.needs_space === 'yes') {
      if (car.ratings.practicality >= 8) { score += 10; positives.push('Rymlig och praktisk för din livsstil'); }
      else if (car.ratings.practicality < 7) { score -= 5; negatives.push('Bagageutrymmet kan vara begränsat'); }
      else score += 5;
    } else {
      score += 5;
    }
  }

  score = Math.max(10, Math.min(100, Math.round(score)));

  let title: string;
  let description: string;
  let color: string;

  if (score >= 85) {
    title = 'Utmärkt matchning!';
    color = '#10b981';
    description = `${car.brand_display} ${car.model_display} passar din profil riktigt väl och lever upp till dina viktigaste krav.`;
  } else if (score >= 70) {
    title = 'Bra matchning';
    color = '#0e6efe';
    description = `${car.brand_display} ${car.model_display} matchar de flesta av dina behov – ett solitt val för din situation.`;
  } else if (score >= 55) {
    title = 'Okej matchning';
    color = '#f59e0b';
    description = `${car.brand_display} ${car.model_display} fyller delar av dina krav, men det finns troligen alternativ som passar bättre.`;
  } else {
    title = 'Svag matchning';
    color = '#ef4444';
    description = `${car.brand_display} ${car.model_display} verkar inte vara det optimala valet utifrån dina svar. Vi hjälper dig hitta något bättre.`;
  }

  // ── TCO calculation ──
  let tco: TcoResult | undefined;
  if (a.financing_type && a.own_period && a.annual_mileage) {
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

    // Fuel/energy (kr/mil, mils per year)
    const milageMap: Record<string, number> = { low: 800, medium: 1500, high: 2500 };
    const milsPerYear = milageMap[a.annual_mileage] ?? 1500;
    const fuels = car.specs.fuel_types;
    let krPerMil = 15;
    if (fuels.includes('el')) krPerMil = 3;
    else if (fuels.includes('laddhybrid')) krPerMil = 6;
    else if (fuels.includes('hybrid')) krPerMil = 8;
    else if (fuels.includes('diesel')) krPerMil = 11;
    const monthly_fuel = Math.round((milsPerYear * krPerMil) / 12);

    // Insurance
    let monthly_insurance = 900;
    if (price < 200000) monthly_insurance = 600;
    else if (price < 400000) monthly_insurance = 900;
    else if (price < 650000) monthly_insurance = 1200;
    else monthly_insurance = 1500;

    // Service
    const monthly_service = fuels.includes('el') ? 125 : 250;

    const total_monthly = monthly_financing + monthly_fuel + monthly_insurance + monthly_service;

    const ownershipMonthsMap: Record<string, number> = { '1-2': 18, '3-4': 42, '5plus': 72 };
    const ownership_months = ownershipMonthsMap[a.own_period] ?? 42;
    const total_ownership = total_monthly * ownership_months + (a.financing_type === 'cash' ? price : 0);

    tco = { monthly_financing, monthly_fuel, monthly_insurance, monthly_service, total_monthly, total_ownership, ownership_months };
  }

  return { score, title, description, positives: positives.slice(0, 3), negatives: negatives.slice(0, 2), color, tco };
}

// ─── Icons map ────────────────────────────────────────────────────────────────

const OPTION_ICONS: Record<string, React.FC<{ className?: string }>> = {
  solo: Briefcase, family: Users, cargo: Briefcase, sporadic: Compass,
  low: MapPin, medium: Route, high: Globe,
  under4k: Banknote, '4k6k': Banknote, '6k9k': Banknote, over9k: Banknote,
  economy: TrendingDown, safety: Shield, comfort: Armchair,
  performance: Timer, space: Maximize, tech: MonitorSmartphone, reliability: Wrench,
  home: Home, work: Building2, public: ParkingCircle, none: X,
  rarely: MapPin, sometimes: Route, often: Globe,
  hybrid: BatteryCharging, petrol: Car, diesel: Car, electric: Zap,
  yes: Check, no: X, sometimes_space: Route,
  // TCO options
  loan: CreditCard, leasing: RefreshCcw, cash: Banknote,
  '1-2': Timer, '3-4': CalendarClock, '5plus': Home,
};

// ─── Option button ────────────────────────────────────────────────────────────

function QuizOption({ id, label, description, selected, onClick, dark }: {
  id: string; label: string; description?: string;
  selected: boolean; onClick: () => void; dark: boolean;
}) {
  const Icon = OPTION_ICONS[id] || OPTION_ICONS['sometimes_space'];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all duration-150 ${
        selected
          ? dark
            ? 'bg-[#38bdf8]/15 border-[#38bdf8]'
            : 'bg-[#0e6efe]/10 border-[#0e6efe]'
          : dark
            ? 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/8'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          selected
            ? dark ? 'bg-[#38bdf8]/20' : 'bg-[#0e6efe]/10'
            : dark ? 'bg-white/8' : 'bg-slate-100'
        }`}>
          <Icon className={`w-4 h-4 ${
            selected ? (dark ? 'text-[#38bdf8]' : 'text-[#0e6efe]') : (dark ? 'text-slate-400' : 'text-slate-500')
          }`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold leading-tight ${
          selected ? (dark ? 'text-[#7dd3fc]' : 'text-[#0e6efe]') : (dark ? 'text-slate-200' : 'text-slate-800')
        }`}>{label}</p>
        {description && (
          <p className={`text-[11px] mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{description}</p>
        )}
      </div>
      {selected && <Check className={`w-4 h-4 shrink-0 ${dark ? 'text-[#38bdf8]' : 'text-[#0e6efe]'}`} strokeWidth={2.5} />}
    </motion.button>
  );
}

// ─── TCO row ──────────────────────────────────────────────────────────────────

function TcoRow({ label, value, dark }: { label: string; value: number; dark: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <p className={`text-[12px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p className={`text-[12px] font-semibold tabular-nums ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
        {value.toLocaleString('sv-SE')} kr
      </p>
    </div>
  );
}

// ─── Animated score circle ────────────────────────────────────────────────────

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const [displayed, setDisplayed] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (displayed / 100) * circumference;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / 1200, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(ease * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="8" />
        <motion.circle
          cx="64" cy="64" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - strokeDash }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tabular-nums leading-none" style={{ color: color }}>{displayed}</span>
        <span className="text-[12px] font-bold text-slate-500 mt-0.5">av 100</span>
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

export function CarFitQuiz({ car, open, onClose, dark = false, onNegotiate }: CarFitQuizProps) {
  const isEv = !!car?.specs?.fuel_types?.includes('el') && !car?.specs?.fuel_types?.includes('bensin') && !car?.specs?.fuel_types?.includes('diesel');

  // Build step list based on car type
  const steps = useMemo<Step[]>(() => {
    if (isEv) {
      return [STEP_DAILY_USE, STEP_MILEAGE, STEP_CHARGING, STEP_LONG_TRIPS, STEP_BUDGET, STEP_FINANCING, STEP_OWNERSHIP, STEP_PRIORITIES];
    }
    return [STEP_DAILY_USE, STEP_MILEAGE, STEP_FUEL, STEP_BUDGET, STEP_FINANCING, STEP_OWNERSHIP, STEP_PRIORITIES, STEP_SPACE];
  }, [isEv]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!open) { setStep(0); setAnswers({}); setResult(null); setDirection(1); }
  }, [open]);

  const totalSteps = steps.length;
  const currentStep = steps[step];
  const progress = (step / totalSteps) * 100;

  function getValues(id: StepId): string[] {
    if (id === 'fuel_ok') return answers.fuel_ok || [];
    if (id === 'priorities') return answers.priorities || [];
    if (id === 'daily_use') return answers.daily_use ? [answers.daily_use] : [];
    if (id === 'annual_mileage') return answers.annual_mileage ? [answers.annual_mileage] : [];
    if (id === 'monthly_budget') return answers.monthly_budget ? [answers.monthly_budget] : [];
    if (id === 'charging') return answers.charging ? [answers.charging] : [];
    if (id === 'long_trips') return answers.long_trips ? [answers.long_trips] : [];
    if (id === 'needs_space') return answers.needs_space ? [answers.needs_space] : [];
    if (id === 'financing_type') return answers.financing_type ? [answers.financing_type] : [];
    if (id === 'own_period') return answers.own_period ? [answers.own_period] : [];
    return [];
  }

  function isSelected(id: StepId, optId: string) { return getValues(id).includes(optId); }
  function canAdvance() { return getValues(currentStep.id).length > 0; }

  function toggleOption(optId: string) {
    const id = currentStep.id;
    if (!currentStep.multi) {
      const update: Answers = { ...answers };
      if (id === 'daily_use') update.daily_use = optId as Answers['daily_use'];
      else if (id === 'annual_mileage') update.annual_mileage = optId as Answers['annual_mileage'];
      else if (id === 'monthly_budget') update.monthly_budget = optId as Answers['monthly_budget'];
      else if (id === 'charging') update.charging = optId as Answers['charging'];
      else if (id === 'long_trips') update.long_trips = optId as Answers['long_trips'];
      else if (id === 'needs_space') update.needs_space = optId as Answers['needs_space'];
      else if (id === 'financing_type') update.financing_type = optId as Answers['financing_type'];
      else if (id === 'own_period') update.own_period = optId as Answers['own_period'];
      setAnswers(update);
      setTimeout(() => advance(update), 200);
    } else {
      const maxSel = currentStep.maxSelect;
      let current: string[] = (id === 'fuel_ok' ? answers.fuel_ok : answers.priorities) || [];
      if (current.includes(optId)) {
        current = current.filter(v => v !== optId);
      } else {
        if (maxSel && current.length >= maxSel) return;
        current = [...current, optId];
      }
      setAnswers({ ...answers, [id]: current });
    }
  }

  function advance(latestAnswers?: Answers) {
    const a = latestAnswers || answers;
    if (step < totalSteps - 1) {
      setDirection(1);
      setStep(s => s + 1);
    } else {
      setResult(scoreCarFit(car, a, isEv));
    }
  }

  function back() {
    if (step === 0) { onClose(); return; }
    setDirection(-1);
    setStep(s => s - 1);
  }

  if (!car) return null;

  const accent = dark ? '#38bdf8' : '#0e6efe';
  const bg = dark ? 'linear-gradient(165deg, #0f172a 0%, #0c1a2e 60%, #051020 100%)' : '#ffffff';
  const borderColor = dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8 z-50 w-full sm:w-[430px] rounded-t-2xl sm:rounded-xl overflow-hidden shadow-2xl"
            style={{ background: bg, border: `1px solid ${borderColor}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${accent}22` }}>
                  <AlertCircle className="w-3.5 h-3.5" style={{ color: accent }} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: dark ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>
                    Är bilen rätt för mig?
                  </p>
                  <p className={`text-[13px] font-bold leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                    {car.brand_display} {car.model_display}
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${dark ? 'bg-white/8 hover:bg-white/15 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pb-6">
              {!result ? (
                <>
                  {/* Progress */}
                  <div className="mb-4">
                    <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/8' : 'bg-slate-100'}`}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: accent }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <p className={`text-[10px] font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Fråga {step + 1} av {totalSteps}
                      </p>
                      <p className={`text-[10px] font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {Math.round(progress)}%
                      </p>
                    </div>
                  </div>

                  {/* Question */}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: direction * 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction * -24 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <p className={`text-[15px] font-bold mb-0.5 ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {currentStep.question}
                      </p>
                      {currentStep.subtitle && (
                        <p className={`text-[12px] mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {currentStep.subtitle}
                        </p>
                      )}
                      <div className={`space-y-2 ${!currentStep.subtitle ? 'mt-3' : ''}`}>
                        {currentStep.options.map(opt => (
                          <QuizOption
                            key={opt.id}
                            id={opt.id}
                            label={opt.label}
                            description={opt.description}
                            selected={isSelected(currentStep.id, opt.id)}
                            onClick={() => toggleOption(opt.id)}
                            dark={dark}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Nav */}
                  <div className="flex gap-2.5 mt-4">
                    <button
                      type="button" onClick={back}
                      className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 transition-all ${dark ? 'border-white/10 text-slate-400 hover:border-white/25 hover:text-white' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
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
                          canAdvance()
                            ? 'text-white shadow-md'
                            : dark ? 'bg-white/8 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        style={canAdvance() ? { backgroundColor: accent, boxShadow: `0 4px 14px ${accent}40` } : {}}
                      >
                        {step === totalSteps - 1 ? 'Se mitt resultat' : 'Nästa'}
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </>
              ) : (
                /* ─── Result ─── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mt-2 mb-5">
                    <ScoreCircle score={result.score} color={result.color} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-center mt-3"
                    >
                      <p className="text-[18px] font-black" style={{ color: result.color }}>{result.title}</p>
                      <p className={`text-[12px] mt-1.5 leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {result.description}
                      </p>
                    </motion.div>
                  </div>

                  {(result.positives.length > 0 || result.negatives.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 }}
                      className="space-y-1.5 mb-5"
                    >
                      {result.positives.map((p, i) => (
                        <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl ${dark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                          <p className={`text-[12px] font-medium leading-snug ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>{p}</p>
                        </div>
                      ))}
                      {result.negatives.map((n, i) => (
                        <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl ${dark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className={`text-[12px] font-medium leading-snug ${dark ? 'text-amber-300' : 'text-amber-700'}`}>{n}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {result.tco && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.75 }}
                      className={`mb-5 rounded-2xl border p-4 ${dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Beräknad ekonomi / mån
                        </p>
                        <p className={`text-[18px] font-black tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>
                          {result.tco.total_monthly.toLocaleString('sv-SE')} kr
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        {result.tco.monthly_financing > 0 && (
                          <TcoRow label="Finansiering" value={result.tco.monthly_financing} dark={dark} />
                        )}
                        <TcoRow label="Drivmedel" value={result.tco.monthly_fuel} dark={dark} />
                        <TcoRow label="Försäkring" value={result.tco.monthly_insurance} dark={dark} />
                        <TcoRow label="Service & underhåll" value={result.tco.monthly_service} dark={dark} />
                      </div>
                      <div className={`mt-3 pt-3 border-t flex items-center justify-between ${dark ? 'border-white/10' : 'border-slate-200'}`}>
                        <p className={`text-[11px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Total {Math.round(result.tco.ownership_months / 12)} år (ca)
                        </p>
                        <p className={`text-[13px] font-bold tabular-nums ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {Math.round(result.tco.total_monthly * result.tco.ownership_months / 1000) * 1000 > 0
                            ? `~${(Math.round(result.tco.total_monthly * result.tco.ownership_months / 10000) * 10).toLocaleString('sv-SE')} tkr`
                            : '–'}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.85 }}
                    className="flex flex-col gap-2"
                  >
                    {onNegotiate && (
                      <button
                        type="button"
                        onClick={() => { onClose(); onNegotiate(); }}
                        className="w-full h-11 rounded-xl font-semibold text-[14px] text-white flex items-center justify-center gap-1.5 transition-all"
                        style={{ backgroundColor: accent, boxShadow: `0 4px 16px ${accent}40` }}
                      >
                        Få hjälp att köpa denna bil
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setStep(0); setAnswers({}); setResult(null); }}
                      className={`w-full h-10 rounded-xl text-[13px] font-medium transition-all ${dark ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                      Gör om quizet
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
