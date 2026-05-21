import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Zap, Users, Briefcase, Compass, MapPin, Route, Globe, TrendingDown, Shield, Armchair, Timer, Maximize, MonitorSmartphone, TrendingUp, Wrench, AlertCircle } from 'lucide-react';
import type { ComparisonCar } from '../lib/comparison/types';
import { BRAND_CATEGORIES, PRIORITY_TRAITS } from './quiz/QuizTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Answers {
  daily_use?: 'solo' | 'family' | 'cargo' | 'sporadic';
  annual_mileage?: 'low' | 'medium' | 'high';
  priorities?: string[];
  fuel_ok?: string[];        // which fuel types work for them
  needs_space?: 'yes' | 'no' | 'sometimes';
}

interface ScoreResult {
  score: number;
  title: string;
  description: string;
  positives: string[];
  negatives: string[];
  color: string;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreCarFit(car: ComparisonCar, a: Answers): ScoreResult {
  let score = 45;
  const positives: string[] = [];
  const negatives: string[] = [];

  const carName = `${car.brand_display} ${car.model_display}`.toLowerCase();
  const fuels = car.specs.fuel_types;
  const isElectric = fuels.includes('el');
  const isHybrid = fuels.includes('hybrid') || fuels.includes('laddhybrid');
  const isDiesel = fuels.includes('diesel');

  // Fuel match (+20)
  if (a.fuel_ok && a.fuel_ok.length > 0) {
    const fuelMap: Record<string, string[]> = {
      electric: ['el'],
      hybrid: ['hybrid', 'laddhybrid'],
      petrol: ['bensin'],
      diesel: ['diesel'],
    };
    const wanted = a.fuel_ok.flatMap(f => fuelMap[f] || []);
    const matches = wanted.filter(f => fuels.includes(f as typeof fuels[number]));
    if (matches.length > 0) {
      score += 20;
      if (isElectric) positives.push('Elbil passar din drivlina-preferens');
      else if (isHybrid) positives.push('Hybrid/PHEV matchar ditt val');
      else positives.push('Drivlinan matchar dina önskemål');
    } else {
      score -= 10;
      if (isElectric && !a.fuel_ok.includes('electric'))
        negatives.push('Elbil kräver laddmöjlighet hemma eller på jobbet');
      else if (isDiesel && !a.fuel_ok.includes('diesel'))
        negatives.push('Diesel passar bäst för längre körsträckor');
      else
        negatives.push('Drivlinan skiljer sig från ditt förstahandsval');
    }
  }

  // Daily use (+15)
  if (a.daily_use) {
    const familyCars = ['xc', 'x3', 'x5', 'q5', 'q7', 'gle', 'tiguan', 'kodiaq', 'sorento', 'tucson', 'id.4', 'id.5', 'enyaq', 'ioniq 5', 'ev9'];
    const soloCars = ['golf', 'polo', '1-serie', 'a3', 'a-klass', 'model 3', 'id.3', 'cupra born', 'yaris'];
    const cargoCars = ['v90', 'v60', 'xc90', 'x5', 'q7', 'gle', 'kodiaq', 'superb', 'passat'];

    if (a.daily_use === 'family' && (familyCars.some(k => carName.includes(k)) || car.specs.seats >= 5)) {
      score += 15;
      positives.push('Passar bra för familjebruk');
    } else if (a.daily_use === 'solo' && soloCars.some(k => carName.includes(k))) {
      score += 15;
      positives.push('Bra som pendel- och vardagsbil');
    } else if (a.daily_use === 'cargo' && (cargoCars.some(k => carName.includes(k)) || (car.specs.trunk_liters && car.specs.trunk_liters > 500))) {
      score += 15;
      positives.push('Rejält lastutrymme för dina behov');
    } else if (a.daily_use === 'family' && car.specs.seats < 5) {
      score -= 5;
      negatives.push('Kan vara tight för barnfamilj');
    } else {
      score += 5;
    }
  }

  // Mileage synergy (+15)
  if (a.annual_mileage) {
    if (a.annual_mileage === 'high' && isDiesel) {
      score += 15;
      positives.push('Diesel är kostnadseffektivt vid högt miltal');
    } else if (a.annual_mileage === 'high' && isElectric) {
      score += 10;
      positives.push('Elbil ger låga driftkostnader även vid högt miltal');
    } else if (a.annual_mileage === 'low' && isElectric) {
      score += 15;
      positives.push('Elbil passar perfekt för kortare körning');
    } else if (a.annual_mileage === 'low' && isDiesel) {
      score -= 10;
      negatives.push('Diesel lönar sig bäst vid högt miltal');
    } else {
      score += 8;
    }
  }

  // Priorities (+5 each, max 3 counted)
  if (a.priorities && a.priorities.length > 0) {
    let priorityHits = 0;
    for (const prio of a.priorities) {
      const trait = PRIORITY_TRAITS[prio as keyof typeof PRIORITY_TRAITS];
      if (!trait) continue;
      const brandMatch = trait.brands.some(b => car.brand_display.toLowerCase().includes(b.toLowerCase()));
      const keywordMatch = trait.keywords.some(k => carName.includes(k));
      const prosMatch = car.pros.some(p => {
        if (prio === 'economy') return p.toLowerCase().includes('driftskostnad') || p.toLowerCase().includes('förbrukning') || p.toLowerCase().includes('bränslesnål');
        if (prio === 'safety') return p.toLowerCase().includes('säkerhet') || p.toLowerCase().includes('säker');
        if (prio === 'comfort') return p.toLowerCase().includes('komfort') || p.toLowerCase().includes('bekväm') || p.toLowerCase().includes('tyst');
        if (prio === 'performance') return p.toLowerCase().includes('prestanda') || p.toLowerCase().includes('snabb') || p.toLowerCase().includes('sportig');
        if (prio === 'space') return p.toLowerCase().includes('utrymme') || p.toLowerCase().includes('rymlig') || p.toLowerCase().includes('praktisk');
        if (prio === 'reliability') return p.toLowerCase().includes('pålitlig') || p.toLowerCase().includes('tillförlitlig') || p.toLowerCase().includes('hållbar');
        if (prio === 'resale') return p.toLowerCase().includes('andrahand') || p.toLowerCase().includes('värde');
        if (prio === 'tech') return p.toLowerCase().includes('teknik') || p.toLowerCase().includes('infotainment') || p.toLowerCase().includes('google');
        return false;
      });

      if (brandMatch || keywordMatch || prosMatch) {
        score += 5;
        priorityHits++;
        if (priorityHits <= 2) {
          const labels: Record<string, string> = {
            economy: 'Känd för låga driftskostnader',
            safety: 'Hög säkerhetsbetyg i klassen',
            comfort: 'Komfort är ett styrkeområde',
            performance: 'Prestanda matchar ditt intresse',
            space: 'Bra utrymme för dina behov',
            tech: 'Modern teknik som standard',
            resale: 'Starkt andrahandsvärde historiskt',
            reliability: 'Stark driftsäkerhet och pålitlighet',
          };
          if (labels[prio]) positives.push(labels[prio]);
        }
      }
    }
  }

  // Space/practicality (+10)
  if (a.needs_space) {
    const practicalityScore = car.ratings.practicality;
    if (a.needs_space === 'yes') {
      if (practicalityScore >= 8) {
        score += 10;
        positives.push('Rymlig och praktisk för din livsstil');
      } else if (practicalityScore < 7) {
        score -= 5;
        negatives.push('Kan vara lite trång för stora behov');
      } else {
        score += 5;
      }
    } else if (a.needs_space === 'no') {
      score += 5;
    } else {
      score += 8;
    }
  }

  score = Math.max(10, Math.min(100, Math.round(score)));

  // Derive title + description
  let title: string;
  let description: string;
  let color: string;

  if (score >= 85) {
    title = 'Utmärkt matchning!';
    color = '#10b981'; // emerald
    description = `${car.brand_display} ${car.model_display} passar din profil mycket väl. Den kombinerar det du letar efter och lever upp till dina viktigaste krav.`;
  } else if (score >= 70) {
    title = 'Bra matchning';
    color = '#0e6efe'; // blue
    description = `${car.brand_display} ${car.model_display} matchar de flesta av dina behov. Det finns några kompromisser, men bilen är ett solitt val för din situation.`;
  } else if (score >= 55) {
    title = 'Okej matchning';
    color = '#f59e0b'; // amber
    description = `${car.brand_display} ${car.model_display} fyller delar av dina krav, men det finns alternativ som kan passa bättre. Värt att utforska vidare.`;
  } else {
    title = 'Svag matchning';
    color = '#ef4444'; // red
    description = `${car.brand_display} ${car.model_display} verkar inte vara det optimala valet utifrån dina svar. Vi rekommenderar att du tittar på liknande alternativ.`;
  }

  return { score, title, description, positives: positives.slice(0, 3), negatives: negatives.slice(0, 2), color };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const OPTION_ICONS: Record<string, React.FC<{ className?: string }>> = {
  solo: Briefcase, family: Users, cargo: Briefcase, sporadic: Compass,
  low: MapPin, medium: Route, high: Globe,
  economy: TrendingDown, safety: Shield, comfort: Armchair,
  performance: Timer, space: Maximize, tech: MonitorSmartphone,
  resale: TrendingUp, reliability: Wrench,
  electric: Zap, hybrid: Zap, petrol: Briefcase, diesel: Briefcase,
  yes: Check, no: X, sometimes: Route,
};

function QuizOption({ id, label, description, selected, onClick, dark }: {
  id: string; label: string; description?: string;
  selected: boolean; onClick: () => void; dark: boolean;
}) {
  const Icon = OPTION_ICONS[id];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all duration-150 ${
        selected
          ? dark
            ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-white'
            : 'bg-[#0e6efe]/10 border-[#0e6efe] text-[#0e6efe]'
          : dark
            ? 'bg-white/5 border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/8'
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          selected
            ? dark ? 'bg-[#38bdf8]/20' : 'bg-[#0e6efe]/10'
            : dark ? 'bg-white/8' : 'bg-slate-100'
        }`}>
          <Icon className={`w-4 h-4 ${selected ? (dark ? 'text-[#38bdf8]' : 'text-[#0e6efe]') : (dark ? 'text-slate-400' : 'text-slate-500')}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold leading-tight ${selected ? (dark ? 'text-white' : 'text-[#0e6efe]') : (dark ? 'text-slate-200' : 'text-slate-800')}`}>{label}</p>
        {description && <p className={`text-[11px] mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{description}</p>}
      </div>
      {selected && <Check className={`w-4 h-4 shrink-0 ${dark ? 'text-[#38bdf8]' : 'text-[#0e6efe]'}`} strokeWidth={2.5} />}
    </motion.button>
  );
}

// Animated score circle
function ScoreCircle({ score, color }: { score: number; color: string }) {
  const [displayed, setDisplayed] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (displayed / 100) * circumference;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
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
        <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <motion.circle
          cx="64" cy="64" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - strokeDash }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Glow */}
        <circle cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"
          strokeDasharray={`${strokeDash * 0.2} ${circumference}`} opacity="0.3"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-white tabular-nums leading-none">{displayed}</span>
        <span className="text-[12px] font-bold text-slate-400 mt-0.5">av 100</span>
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

const STEPS = [
  {
    id: 'daily_use' as const,
    question: 'Hur ser din vardag ut med bilen?',
    multi: false,
    options: [
      { id: 'solo', label: 'Mest ensam', description: 'Pendling, ärenden' },
      { id: 'family', label: 'Med familjen', description: 'Barn, aktiviteter' },
      { id: 'cargo', label: 'Mycket last', description: 'Fritid, utrustning' },
      { id: 'sporadic', label: 'Lite och sporadiskt', description: 'Helgkörning' },
    ],
  },
  {
    id: 'annual_mileage' as const,
    question: 'Hur mycket kör du per år?',
    multi: false,
    options: [
      { id: 'low', label: 'Under 1 000 mil', description: 'Mest stadskörning' },
      { id: 'medium', label: '1 000 – 2 000 mil', description: 'Blandad körning' },
      { id: 'high', label: 'Över 2 000 mil', description: 'Pendlar långt' },
    ],
  },
  {
    id: 'fuel_ok' as const,
    question: 'Vilken drivlina funkar för dig?',
    multi: true,
    options: [
      { id: 'electric', label: 'Elbil', description: 'Har laddmöjlighet hemma' },
      { id: 'hybrid', label: 'Hybrid / PHEV', description: 'Flexibelt alternativ' },
      { id: 'petrol', label: 'Bensin', description: 'Traditionellt' },
      { id: 'diesel', label: 'Diesel', description: 'Bra för långkörning' },
    ],
  },
  {
    id: 'priorities' as const,
    question: 'Vad är viktigast för dig?',
    subtitle: 'Välj upp till 3',
    multi: true,
    maxSelect: 3,
    options: [
      { id: 'economy', label: 'Låga driftskostnader', description: undefined },
      { id: 'safety', label: 'Säkerhet', description: undefined },
      { id: 'comfort', label: 'Komfort', description: undefined },
      { id: 'performance', label: 'Prestanda', description: undefined },
      { id: 'space', label: 'Utrymme', description: undefined },
      { id: 'reliability', label: 'Pålitlighet', description: undefined },
    ],
  },
  {
    id: 'needs_space' as const,
    question: 'Behöver du generöst bagageutrymme?',
    multi: false,
    options: [
      { id: 'yes', label: 'Ja, viktigt', description: 'Sport, barn, husdjur' },
      { id: 'sometimes', label: 'Ibland', description: 'Flexibelt behov' },
      { id: 'no', label: 'Spelar ingen roll', description: 'Inte en prioritet' },
    ],
  },
];

export function CarFitQuiz({ car, open, onClose, dark = false, onNegotiate }: CarFitQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [direction, setDirection] = useState(1);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setAnswers({});
      setResult(null);
      setDirection(1);
    }
  }, [open]);

  const totalSteps = STEPS.length;
  const currentStep = STEPS[step];
  const progress = ((step) / totalSteps) * 100;

  function getStepValue(id: typeof STEPS[number]['id']) {
    if (id === 'fuel_ok') return answers.fuel_ok || [];
    if (id === 'priorities') return answers.priorities || [];
    if (id === 'daily_use') return answers.daily_use ? [answers.daily_use] : [];
    if (id === 'annual_mileage') return answers.annual_mileage ? [answers.annual_mileage] : [];
    if (id === 'needs_space') return answers.needs_space ? [answers.needs_space] : [];
    return [];
  }

  function isSelected(stepId: typeof STEPS[number]['id'], optId: string) {
    return getStepValue(stepId).includes(optId);
  }

  function canAdvance() {
    const vals = getStepValue(currentStep.id);
    return vals.length > 0;
  }

  function toggleOption(optId: string) {
    const id = currentStep.id;
    if (!currentStep.multi) {
      const update: Answers = { ...answers };
      if (id === 'daily_use') update.daily_use = optId as Answers['daily_use'];
      else if (id === 'annual_mileage') update.annual_mileage = optId as Answers['annual_mileage'];
      else if (id === 'needs_space') update.needs_space = optId as Answers['needs_space'];
      setAnswers(update);
      // Auto-advance for single-select
      setTimeout(() => advance(update), 220);
    } else {
      const maxSel = (currentStep as { maxSelect?: number }).maxSelect;
      let current: string[] = (id === 'fuel_ok' ? answers.fuel_ok : answers.priorities) || [];
      if (current.includes(optId)) {
        current = current.filter(v => v !== optId);
      } else {
        if (maxSel && current.length >= maxSel) return;
        current = [...current, optId];
      }
      const update: Answers = { ...answers, [id]: current };
      setAnswers(update);
    }
  }

  function advance(latestAnswers?: Answers) {
    const a = latestAnswers || answers;
    if (step < totalSteps - 1) {
      setDirection(1);
      setStep(s => s + 1);
    } else {
      const res = scoreCarFit(car, a);
      setResult(res);
    }
  }

  function back() {
    if (step === 0) { onClose(); return; }
    setDirection(-1);
    setStep(s => s - 1);
  }

  const accent = dark ? '#38bdf8' : '#0e6efe';
  const bg = dark
    ? 'linear-gradient(165deg, #0f172a 0%, #0c1a2e 60%, #051020 100%)'
    : '#ffffff';
  const borderColor = dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8 z-50 w-full sm:w-[420px] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: bg, border: `1px solid ${borderColor}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${accent}20` }}>
                  <AlertCircle className="w-3.5 h-3.5" style={{ color: accent }} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: dark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}>
                    Är bilen rätt för mig?
                  </p>
                  <p className={`text-[13px] font-bold leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                    {car.brand_display} {car.model_display}
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${dark ? 'bg-white/8 hover:bg-white/15 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-5">
              {!result ? (
                <>
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className={`h-1 rounded-full overflow-hidden ${dark ? 'bg-white/8' : 'bg-slate-100'}`}>
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
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <p className={`text-[15px] font-bold mb-0.5 ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {currentStep.question}
                      </p>
                      {(currentStep as { subtitle?: string }).subtitle && (
                        <p className={`text-[12px] mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {(currentStep as { subtitle?: string }).subtitle}
                        </p>
                      )}
                      <div className={`space-y-2 ${!(currentStep as { subtitle?: string }).subtitle ? 'mt-3' : ''}`}>
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

                  {/* Navigation */}
                  <div className="flex gap-2.5 mt-4">
                    <button
                      type="button"
                      onClick={back}
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
                            : dark
                              ? 'bg-white/8 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
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
                /* Result */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Score circle */}
                  <div className="mt-2 mb-5">
                    <ScoreCircle score={result.score} color={result.color} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      className="text-center mt-3"
                    >
                      <p className="text-[18px] font-black text-white">{result.title}</p>
                      <p className={`text-[12px] mt-1.5 leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {result.description}
                      </p>
                    </motion.div>
                  </div>

                  {/* Positives + negatives */}
                  {(result.positives.length > 0 || result.negatives.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.4 }}
                      className="space-y-1.5 mb-5"
                    >
                      {result.positives.map((p, i) => (
                        <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl ${dark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                          <p className={`text-[12px] font-medium leading-snug ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>{p}</p>
                        </div>
                      ))}
                      {result.negatives.map((n, i) => (
                        <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl ${dark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className={`text-[12px] font-medium leading-snug ${dark ? 'text-amber-300' : 'text-amber-700'}`}>{n}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* CTAs */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
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
                      className={`w-full h-10 rounded-xl text-[13px] font-medium transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
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
