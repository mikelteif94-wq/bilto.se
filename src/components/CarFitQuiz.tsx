import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Check, Zap, Users, User, Package,
  Wallet, CreditCard, RefreshCcw, TrendingUp, Receipt,
  MapPin, Navigation, Gauge, Shield, Armchair, Maximize,
  Wrench, TrendingDown, Home, Building2, ParkingCircle,
  BatteryCharging, Car, AlertCircle, Coffee, Star,
  ArrowRight, Route, Wifi, Clock,
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
  ev_daily_range?: 'under5' | '5to10' | '10to15' | 'over15';
  ev_road_trips?: 'rarely' | 'sometimes' | 'often';
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
  | 'monthly_income' | 'monthly_expenses' | 'charging' | 'ev_daily_range'
  | 'ev_road_trips' | 'fuel_pref' | 'priorities';

interface Option { id: string; label: string; description?: string; icon: typeof Car; highlight?: boolean }
interface Step { id: StepId; question: string; subtitle?: string; multi: boolean; maxSelect?: number; options: Option[] }

const STEPS: Record<string, Step> = {
  daily_use: {
    id: 'daily_use',
    question: 'Hur ser din vardag med bilen ut?',
    subtitle: 'Välj det alternativ som stämmer bäst',
    multi: false,
    options: [
      { id: 'solo', label: 'Pendling & ärenden', description: 'Jobbet, stan, vardagsärenden', icon: User },
      { id: 'family', label: 'Familjeliv med barn', description: 'Skola, aktiviteter, längre resor', icon: Users },
      { id: 'cargo', label: 'Hobby & utrustning', description: 'Sport, husdjur, mycket last', icon: Package },
      { id: 'sporadic', label: 'Sällan & sporadiskt', description: 'Helger och tillfällen', icon: Coffee },
    ],
  },
  annual_mileage: {
    id: 'annual_mileage',
    question: 'Hur många mil kör du per år?',
    subtitle: 'Påverkar driftkostnad och rätt drivlina',
    multi: false,
    options: [
      { id: 'low', label: 'Under 1 000 mil', description: 'Korta sträckor, mestadels stad', icon: MapPin },
      { id: 'medium', label: '1 000 – 2 000 mil', description: 'Blandad körning, typisk pendling', icon: Navigation },
      { id: 'high', label: 'Över 2 000 mil', description: 'Mycket motorväg, långa resor', icon: Gauge, highlight: true },
    ],
  },
  financing_type: {
    id: 'financing_type',
    question: 'Hur vill du betala för bilen?',
    subtitle: 'Rätt val kan spara dig tusenlappar varje månad',
    multi: false,
    options: [
      { id: 'loan', label: 'Billån', description: 'Du äger bilen – flexibelt & populärt', icon: CreditCard },
      { id: 'leasing', label: 'Privatleasing', description: 'Fast kostnad, ny bil vart tredje år', icon: RefreshCcw },
      { id: 'cash', label: 'Kontant betalning', description: 'Inga räntor, full äganderätt direkt', icon: Wallet },
    ],
  },
  monthly_income: {
    id: 'monthly_income',
    question: 'Vad är hushållets nettoinkomst?',
    subtitle: 'Vi beräknar om bilen är rätt för din ekonomi',
    multi: false,
    options: [
      { id: 'under25k', label: 'Under 25 000 kr/mån', description: 'Netto efter skatt', icon: TrendingUp },
      { id: '25k40k', label: '25 000 – 40 000 kr/mån', description: 'Netto efter skatt', icon: TrendingUp },
      { id: '40k60k', label: '40 000 – 60 000 kr/mån', description: 'Netto efter skatt', icon: TrendingUp },
      { id: 'over60k', label: 'Över 60 000 kr/mån', description: 'Netto efter skatt', icon: TrendingUp, highlight: true },
    ],
  },
  monthly_expenses: {
    id: 'monthly_expenses',
    question: 'Har du andra lån just nu?',
    subtitle: 'Exkl. hyra och bolån – konsumtions- & avbetalningslån',
    multi: false,
    options: [
      { id: 'none', label: 'Inga andra lån', description: 'Rent blad ekonomiskt', icon: Check, highlight: true },
      { id: 'under3k', label: 'Under 3 000 kr/mån', description: 'Studielån, kortkredit etc.', icon: Receipt },
      { id: '3k8k', label: '3 000 – 8 000 kr/mån', description: 'Flera lån eller avbetalningar', icon: Receipt },
      { id: 'over8k', label: 'Över 8 000 kr/mån', description: 'Stora åtaganden', icon: AlertCircle },
    ],
  },
  charging: {
    id: 'charging',
    question: 'Var kan du ladda bilen?',
    subtitle: 'Avgörande för om elbil funkar i din vardag',
    multi: false,
    options: [
      { id: 'home', label: 'Hemma – garage eller carport', description: 'Idealiskt för elbil, laddar på natten', icon: Home, highlight: true },
      { id: 'work', label: 'På jobbet', description: 'Laddning under arbetstid', icon: Building2 },
      { id: 'public', label: 'Publika laddare', description: 'Fungerar, men kräver planering', icon: ParkingCircle },
      { id: 'none', label: 'Inte möjligt idag', description: 'Elbil blir opraktiskt utan laddning', icon: X },
    ],
  },
  ev_daily_range: {
    id: 'ev_daily_range',
    question: 'Hur långt kör du en typisk dag?',
    subtitle: 'Hjälper oss bedöma om räckvidden passar dig',
    multi: false,
    options: [
      { id: 'under5', label: 'Under 5 mil', description: 'Korta pendlingar, stadsärenden', icon: MapPin, highlight: true },
      { id: '5to10', label: '5 – 10 mil', description: 'Längre pendling eller kombinerad körning', icon: Navigation },
      { id: '10to15', label: '10 – 15 mil', description: 'Lång dagspendling', icon: Route },
      { id: 'over15', label: 'Över 15 mil per dag', description: 'Mycket körning – räckvidd är viktigt', icon: Gauge },
    ],
  },
  ev_road_trips: {
    id: 'ev_road_trips',
    question: 'Hur ofta kör du längre sträckor?',
    subtitle: 'T.ex. semesterresor, besök, mil eller mer',
    multi: false,
    options: [
      { id: 'rarely', label: 'Sällan eller aldrig', description: 'Bilen används mest lokalt', icon: Home, highlight: true },
      { id: 'sometimes', label: 'Ibland – ett par gånger per år', description: 'Då räcker snabbladdningsstopp', icon: Clock },
      { id: 'often', label: 'Ofta – varje månad eller mer', description: 'Snabbladdning och bra räckvidd krävs', icon: Wifi },
    ],
  },
  fuel_pref: {
    id: 'fuel_pref',
    question: 'Vilken drivlina passar dig?',
    subtitle: 'Baserat på din körprofil finns ett bästa alternativ',
    multi: false,
    options: [
      { id: 'hybrid', label: 'Hybrid / Laddhybrid', description: 'Bränslesnål och flexibel – bäst för många', icon: BatteryCharging, highlight: true },
      { id: 'ev', label: 'Elbil', description: 'Lägsta driftskostnad om laddning är löst', icon: Zap },
      { id: 'petrol', label: 'Bensin', description: 'Beprövat, enkelt, inga kompromisser', icon: Car },
      { id: 'diesel', label: 'Diesel', description: 'Ekonomisk vid högt miltal och motorväg', icon: Gauge },
    ],
  },
  priorities: {
    id: 'priorities',
    question: 'Vad värderar du mest i en bil?',
    subtitle: 'Välj 1–3 saker som är viktigast för dig',
    multi: true,
    maxSelect: 3,
    options: [
      { id: 'economy', label: 'Låga driftskostnader', description: 'Snål & billig att äga', icon: TrendingDown },
      { id: 'safety', label: 'Säkerhet', description: 'Trygghet för hela familjen', icon: Shield },
      { id: 'comfort', label: 'Komfort & stillhet', description: 'Mjuk körning, bra NVH', icon: Armchair },
      { id: 'space', label: 'Utrymme & praktikalitet', description: 'Bagageutrymme, säten', icon: Maximize },
      { id: 'reliability', label: 'Driftsäkerhet', description: 'Inga problem, håller länge', icon: Wrench },
      { id: 'performance', label: 'Prestanda', description: 'Motorstyrka, körglädje', icon: Gauge },
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

  if (isEv) {
    if (a.charging === 'home') { score += 18; positives.push('Hemmaladdning är optimalt för elbil'); }
    else if (a.charging === 'work') { score += 12; positives.push('Laddning på jobbet fungerar bra'); }
    else if (a.charging === 'public') { score += 2; negatives.push('Enbart publika laddare begränsar flexibiliteten'); }
    else if (a.charging === 'none') { score -= 20; negatives.push('Utan laddmöjlighet är elbil opraktiskt'); }

    // EV daily range vs car range
    const rangeKm = car.ev_specs?.range_wltp_km ?? 0;
    const winterKm = car.ev_specs?.range_winter_km ?? rangeKm * 0.7;
    if (a.ev_daily_range) {
      const dailyKmMap: Record<string, number> = { under5: 50, '5to10': 75, '10to15': 125, over15: 175 };
      const dailyKm = dailyKmMap[a.ev_daily_range] ?? 75;
      if (rangeKm > 0) {
        if (winterKm >= dailyKm * 2.5) {
          score += 12; positives.push(`Räckvidden räcker mer än väl för din dagskörning`);
        } else if (winterKm >= dailyKm * 1.5) {
          score += 8; positives.push('Räckvidden täcker din dagskörning bra');
        } else if (winterKm >= dailyKm) {
          score += 2;
        } else {
          score -= 10; negatives.push('Räckvidden kan vara knapp för din dagliga körsträcka');
        }
      } else if (a.ev_daily_range === 'under5' || a.ev_daily_range === '5to10') {
        score += 8; positives.push('Kort dagskörning passar elbil perfekt');
      }
    }

    // EV road trips vs fast charging
    if (a.ev_road_trips) {
      const fastChargeKw = car.ev_specs?.charge_kw_max ?? 0;
      if (a.ev_road_trips === 'rarely') {
        score += 8; positives.push('Du gör sällan långa resor – ideal för elbil');
      } else if (a.ev_road_trips === 'sometimes') {
        if (fastChargeKw >= 100) { score += 6; positives.push(`Snabbladdning upp till ${fastChargeKw} kW – långa resor funkar fint`); }
        else { score += 2; }
      } else if (a.ev_road_trips === 'often') {
        if (fastChargeKw >= 150) { score += 4; positives.push(`${fastChargeKw} kW snabbladdning hanterar frekventa långresor`); }
        else if (fastChargeKw >= 100) { score += 0; }
        else { score -= 8; negatives.push('Låg snabbladdningshastighet kan göra frekventa långresor opraktiska'); }
      }
    }
  } else {
    if (a.fuel_pref) {
      const match = (a.fuel_pref === 'hybrid' && isHybrid) ||
        (a.fuel_pref === 'diesel' && isDiesel) ||
        (a.fuel_pref === 'petrol' && fuels.includes('bensin')) ||
        (a.fuel_pref === 'ev' && fuels.includes('el'));
      if (match) { score += 16; positives.push('Drivlinan matchar ditt förstahandsval'); }
      else { score -= 6; negatives.push('Drivlinan är inte din föredragna'); }
    }
  }

  if (a.daily_use) {
    const familyCues = ['xc', 'x3', 'x5', 'q5', 'q7', 'gle', 'tiguan', 'kodiaq', 'sorento', 'id.4', 'id.5', 'enyaq', 'ioniq', 'model y', 'model x'];
    const soloCues = ['golf', 'polo', '1-serie', 'a3', 'a-klass', 'model 3', 'id.3', 'born', 'yaris', 'corolla'];
    const cargoCues = ['v90', 'v60', 'xc90', 'x5', 'q7', 'gle', 'kodiaq', 'superb', 'passat'];
    if (a.daily_use === 'family' && (familyCues.some(k => carName.includes(k)) || car.specs.seats >= 5)) { score += 14; positives.push('Passar utmärkt för familjebruk'); }
    else if (a.daily_use === 'solo' && soloCues.some(k => carName.includes(k))) { score += 14; positives.push('Idealisk pendel- och vardagsbil'); }
    else if (a.daily_use === 'cargo' && (cargoCues.some(k => carName.includes(k)) || (car.specs.trunk_liters && car.specs.trunk_liters > 500))) { score += 14; positives.push('Rejält lastutrymme för dina behov'); }
    else { score += 6; }
  }

  if (a.annual_mileage) {
    if (!isEv && a.annual_mileage === 'high' && isDiesel) { score += 12; positives.push('Diesel lönar sig vid högt miltal'); }
    else if (!isEv && a.annual_mileage === 'low' && isDiesel) { score -= 8; negatives.push('Diesel rekommenderas ej vid lågt miltal'); }
    else if (isEv && a.annual_mileage !== 'high') { score += 10; positives.push('Elbilar är kostnadseffektiva för ditt miltal'); }
    else { score += 5; }
  }

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
          reliability: 'Stark driftsäkerhet och pålitlighet',
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

  let affordability: AffordabilityResult | undefined;
  if (a.financing_type !== 'cash' && a.monthly_income && a.monthly_expenses && a.financing_type && a.annual_mileage) {
    const price = car.pricing.used_from_sek || car.pricing.new_from_sek || 300000;

    let monthly_financing = 0;
    if (a.financing_type === 'loan') {
      const loanAmount = price * 0.8;
      const r = 0.079 / 12;
      const n = 60;
      monthly_financing = Math.round(loanAmount * r / (1 - Math.pow(1 + r, -n)));
    } else if (a.financing_type === 'leasing') {
      monthly_financing = Math.round(price * 0.0088);
    }

    const milsMap: Record<string, number> = { low: 800, medium: 1500, high: 2500 };
    const mils = milsMap[a.annual_mileage] ?? 1500;
    let krPerMil = 14;
    if (fuels.includes('el')) krPerMil = 3;
    else if (fuels.includes('laddhybrid')) krPerMil = 6;
    else if (fuels.includes('hybrid')) krPerMil = 8;
    else if (fuels.includes('diesel')) krPerMil = 10;
    const monthly_fuel = Math.round((mils * krPerMil) / 12);

    let monthly_insurance = 900;
    if (price < 200000) monthly_insurance = 600;
    else if (price < 400000) monthly_insurance = 900;
    else if (price < 650000) monthly_insurance = 1200;
    else monthly_insurance = 1500;

    const monthly_service = fuels.includes('el') ? 125 : 250;
    const total_monthly = monthly_financing + monthly_fuel + monthly_insurance + monthly_service;

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
      afTitle = 'Bilen passar din ekonomi';
      afSubtitle = `Ca ${Math.max(0, available_budget - total_monthly).toLocaleString('sv-SE')} kr/mån kvar i bilbudget`;
    } else if (ratio <= 1.1) {
      label = 'possible'; afColor = '#0e6efe'; afBg = '#eff6ff';
      afTitle = 'Möjlig med lite anpassning';
      afSubtitle = 'Genomförbart – kräver viss prioritering';
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

function OptionCard({ option, selected, onClick, multi }: {
  option: Option; selected: boolean; onClick: () => void; multi?: boolean;
}) {
  const Icon = option.icon;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-150 ${
        selected
          ? 'bg-blue-50 border-[#0e6efe] shadow-sm'
          : 'bg-white border-slate-150 hover:border-slate-300'
      }`}
      style={{ borderColor: selected ? '#0e6efe' : '#e8edf2' }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
        selected ? 'bg-[#0e6efe]' : 'bg-[#faf8f5]'
      }`}>
        <Icon
          className={`w-5 h-5 transition-colors ${selected ? 'text-white' : 'text-slate-400'}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13.5px] font-semibold leading-tight ${selected ? 'text-[#0e6efe]' : 'text-slate-800'}`}>
          {option.label}
        </p>
        {option.description && (
          <p className="text-[11.5px] text-slate-400 mt-0.5 leading-tight">{option.description}</p>
        )}
      </div>
      <div className={`shrink-0 flex items-center justify-center transition-all ${
        multi
          ? `w-5 h-5 rounded-md border-2 ${selected ? 'bg-[#0e6efe] border-[#0e6efe]' : 'border-slate-300'}`
          : `w-5 h-5 rounded-full border-2 ${selected ? 'bg-[#0e6efe] border-[#0e6efe]' : 'border-slate-300'}`
      }`}>
        {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>
    </motion.button>
  );
}

// ─── Score arc ────────────────────────────────────────────────────────────────

function ScoreArc({ score, color }: { score: number; color: string }) {
  const [displayed, setDisplayed] = useState(0);
  const r = 48;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / 1200, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(ease * score));
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const pct = displayed / 100;

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 116 116" className="w-full h-full -rotate-90">
        <circle cx="58" cy="58" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <motion.circle
          cx="58" cy="58" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] font-black tabular-nums leading-none" style={{ color }}>{displayed}</span>
        <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">av 100</span>
      </div>
    </div>
  );
}

// ─── Affordability bar ────────────────────────────────────────────────────────

function AffordBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = Math.min(100, (value / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] text-slate-500 truncate">{label}</p>
          <p className="text-[12px] font-semibold text-slate-700 tabular-nums ml-2 shrink-0">{value.toLocaleString('sv-SE')} kr</p>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-xl"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Result insight chip ──────────────────────────────────────────────────────

function InsightChip({ text, positive }: { text: string; positive: boolean }) {
  return (
    <div className={`flex items-start gap-2 px-3.5 py-2.5 rounded-xl border ${
      positive
        ? 'bg-emerald-50 border-emerald-100'
        : 'bg-amber-50 border-amber-100'
    }`}>
      {positive
        ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" strokeWidth={2.5} />
        : <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-px" />
      }
      <p className={`text-[12px] font-medium leading-snug ${positive ? 'text-emerald-700' : 'text-amber-700'}`}>{text}</p>
    </div>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────

function ResultScreen({ result, car, onNegotiate, onRedo, onClose }: {
  result: ScoreResult;
  car: ComparisonCar;
  onNegotiate?: () => void;
  onRedo: () => void;
  onClose: () => void;
}) {
  const af = result.affordability;
  const cantAfford = af && (af.label === 'tight' || af.label === 'difficult');

  const matchBg = cantAfford ? '#fef2f2'
    : result.score >= 82 ? '#f0fdf4'
    : result.score >= 65 ? '#eff6ff'
    : result.score >= 50 ? '#fffbeb'
    : '#fef2f2';

  const effectiveColor = cantAfford ? '#dc2626' : result.color;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex-1 min-h-0 flex flex-col"
    >
      {/* Scrollable result body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-4 space-y-4">

        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: matchBg }}
        >
          <div className="px-5 pt-5 pb-4 flex items-center gap-5">
            <ScoreArc score={result.score} color={effectiveColor} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bilmatch</p>
              <p className="text-[20px] font-black leading-tight" style={{ color: effectiveColor }}>
                {result.title}
              </p>
              <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed">{result.description}</p>
            </div>
          </div>
        </motion.div>

        {/* Insights */}
        {(result.positives.length > 0 || result.negatives.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="space-y-2"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Analys</p>
            {result.positives.map((p, i) => <InsightChip key={i} text={p} positive />)}
            {result.negatives.map((n, i) => <InsightChip key={i} text={n} positive={false} />)}
          </motion.div>
        )}

        {/* Affordability card */}
        {af && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="rounded-2xl overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div
              className="px-4 py-3.5 flex items-center gap-3 border-b border-slate-100"
              style={{ backgroundColor: af.bgColor }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: af.color + '20' }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: af.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold leading-tight" style={{ color: af.color }}>{af.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{af.subtitle}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[18px] font-black tabular-nums" style={{ color: af.color }}>
                  {af.total_monthly.toLocaleString('sv-SE')}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">kr/mån</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-white px-4 py-3.5 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kostnad per månad (uppskattning)</p>
              {af.monthly_financing > 0 && (
                <AffordBar label="Finansiering" value={af.monthly_financing} total={af.total_monthly} color={af.color} />
              )}
              <AffordBar label="Drivmedel" value={af.monthly_fuel} total={af.total_monthly} color={af.color} />
              <AffordBar label="Försäkring" value={af.monthly_insurance} total={af.total_monthly} color={af.color} />
              <AffordBar label="Service & underhåll" value={af.monthly_service} total={af.total_monthly} color={af.color} />

              <div className="pt-2.5 mt-1 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Din bilbudget (ca 20% av inkomst)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Minus befintliga lån</p>
                </div>
                <p className="text-[14px] font-bold tabular-nums" style={{ color: Math.max(0, af.available_budget) > af.total_monthly ? '#16a34a' : '#dc2626' }}>
                  {Math.max(0, af.available_budget).toLocaleString('sv-SE')} kr
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA strip */}
        {onNegotiate && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl bg-gradient-to-r from-[#0e6efe] to-[#2a7fff] p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white leading-tight">Bilto hjälper dig köpa</p>
              <p className="text-[11px] text-white/70 mt-0.5">Förhandling, juridik & trygghet inkluderat</p>
            </div>
            <button
              type="button"
              onClick={() => { onClose(); onNegotiate(); }}
              className="shrink-0 bg-white/20 hover:bg-white/30 text-white rounded-xl px-3 py-2 text-[12px] font-bold transition-all flex items-center gap-1"
            >
              Kom igång <ArrowRight className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="flex-shrink-0 px-5 pt-3 pb-6 bg-white border-t border-slate-100">
        {onNegotiate && (
          <motion.button
            type="button"
            onClick={() => { onClose(); onNegotiate(); }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full h-12 rounded-2xl font-bold text-[14px] text-white flex items-center justify-center gap-2 mb-2"
            style={{ backgroundColor: '#0e6efe', boxShadow: '0 4px 18px #0e6efe40' }}
          >
            Få hjälp att köpa denna bil
            <ChevronRight className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </motion.button>
        )}
        <button
          type="button"
          onClick={onRedo}
          className="w-full h-10 rounded-xl text-[13px] font-medium text-slate-400 hover:text-slate-600 hover:bg-[#faf8f5] transition-all"
        >
          Gör om quizet
        </button>
      </div>
    </motion.div>
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

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [direction, setDirection] = useState(1);

  const stepOrder = useMemo<StepId[]>(() => {
    const cashSelected = answers.financing_type === 'cash';
    if (isEv) {
      if (cashSelected) return ['daily_use', 'annual_mileage', 'financing_type', 'charging', 'ev_daily_range', 'ev_road_trips', 'priorities'];
      return ['daily_use', 'annual_mileage', 'financing_type', 'monthly_income', 'monthly_expenses', 'charging', 'ev_daily_range', 'ev_road_trips', 'priorities'];
    }
    if (cashSelected) return ['daily_use', 'annual_mileage', 'financing_type', 'fuel_pref', 'priorities'];
    return ['daily_use', 'annual_mileage', 'financing_type', 'monthly_income', 'monthly_expenses', 'fuel_pref', 'priorities'];
  }, [isEv, answers.financing_type]);

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
    if (id === 'ev_daily_range') return answers.ev_daily_range ? [answers.ev_daily_range] : [];
    if (id === 'ev_road_trips') return answers.ev_road_trips ? [answers.ev_road_trips] : [];
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
      else if (id === 'ev_daily_range') update.ev_daily_range = optId as Answers['ev_daily_range'];
      else if (id === 'ev_road_trips') update.ev_road_trips = optId as Answers['ev_road_trips'];
      else if (id === 'fuel_pref') update.fuel_pref = optId as Answers['fuel_pref'];
      setAnswers(update);
      setTimeout(() => advance(update), 200);
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

  // Step label map
  const stepLabels: Record<StepId, string> = {
    daily_use: 'Vardagsanvändning',
    annual_mileage: 'Körsträcka',
    financing_type: 'Finansiering',
    monthly_income: 'Inkomst',
    monthly_expenses: 'Befintliga lån',
    charging: 'Laddningsmöjlighet',
    ev_daily_range: 'Daglig körsträcka',
    ev_road_trips: 'Långresor',
    fuel_pref: 'Drivlina',
    priorities: 'Prioriteringar',
  };

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
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8 z-50 w-full sm:w-[460px] flex flex-col bg-[#f8f9fb] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden touch-pan-y"
            style={{ maxHeight: 'calc(100dvh - 40px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle (mobile only) */}
            <div className="flex-shrink-0 flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 px-5 pt-3 pb-4 bg-white border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center">
                    <Star className="w-4 h-4 text-[#0e6efe]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passar bilen mig?</p>
                    <p className="text-[13.5px] font-bold text-slate-900 leading-tight">{car.brand_display} {car.model_display}</p>
                  </div>
                </div>
                <button
                  type="button" onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {!result && (
                <div>
                  {/* Segmented progress */}
                  <div className="flex gap-1">
                    {stepOrder.map((_, i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: i < step ? '#0e6efe' : i === step ? '#93c5fd' : '#e2e8f0',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[11px] font-semibold text-[#0e6efe]">{stepLabels[currentStepId]}</p>
                    <p className="text-[11px] text-slate-400">{step + 1} / {totalSteps}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 flex flex-col">
              {result ? (
                <ResultScreen
                  result={result}
                  car={car}
                  onNegotiate={onNegotiate}
                  onRedo={() => { setStep(0); setAnswers({}); setResult(null); }}
                  onClose={onClose}
                />
              ) : (
              <>
                {/* Scrollable question area */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 pt-5 pb-4" style={{ touchAction: 'pan-y' }}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: direction * 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction * -24 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <p className="text-[17px] font-black text-slate-900 leading-snug mb-1">{currentStep.question}</p>
                      {currentStep.subtitle && (
                        <p className="text-[12px] text-slate-400 mb-4 leading-relaxed">{currentStep.subtitle}</p>
                      )}
                      <div className={`space-y-2 ${!currentStep.subtitle ? 'mt-4' : ''}`}>
                        {currentStep.options.map(opt => (
                          <OptionCard
                            key={opt.id}
                            option={opt}
                            selected={getValues().includes(opt.id)}
                            onClick={() => toggleOption(opt.id)}
                            multi={currentStep.multi}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Sticky footer */}
                <div className="flex-shrink-0 px-5 pt-3 pb-6 bg-white border-t border-slate-100">
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
                        className={`flex-1 h-11 rounded-xl font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all duration-200 ${
                          canAdvance() ? 'text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        style={canAdvance() ? { backgroundColor: '#0e6efe', boxShadow: '0 4px 14px #0e6efe40' } : {}}
                      >
                        {step === totalSteps - 1 ? 'Se mitt resultat' : 'Nästa'}
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </>
            )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
