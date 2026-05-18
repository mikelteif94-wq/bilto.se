import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Search, ArrowRight, Car, Menu, User, Check,
  Sparkles, Zap, Truck, Leaf, CarFront,
  Send, Loader2, RotateCcw, Info, Calculator,
  GitCompareArrows, X, ArrowDown, Phone, Handshake,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllComparisonCars } from '../lib/comparison';
import { findComparisonCarByMakeModel } from '../lib/comparison';
import type { ComparisonCar } from '../lib/comparison/types';
import { useCarImages } from '../hooks/useCarImages';
import MobileMenu from '../components/MobileMenu';
import CompactCarCard from '../components/CompactCarCard';
import CompareDrawer from '../components/CompareDrawer';
import { SiteFooter } from './BrokerageLanding';
import { CarDetailSheet } from '../components/quiz/CarDetailSheet';
import QuizFlow from '../components/quiz/QuizFlow';
import { QuizComplete } from '../components/quiz/QuizComplete';
import type { QuizAnswers } from '../components/quiz/QuizTypes';
import {
  BODY_TYPE_KEYWORDS, FUEL_TYPE_KEYWORDS, BRAND_CATEGORIES, PRIORITY_TRAITS,
} from '../components/quiz/QuizTypes';
import { supabase } from '../lib/supabase';

/* ───────────── constants ───────────── */

const FUEL_LABELS: Record<string, string> = {
  bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid', laddhybrid: 'Laddhybrid', el: 'El',
};

const MAX_COMPARE = 4;

function getExpertComment(car: ComparisonCar): string {
  const n = `${car.brand_display} ${car.model_display}`.toLowerCase();
  if (n.includes('tesla model y')) return 'Sveriges mest sålda bil -- snabb, rymlig och billig i drift.';
  if (n.includes('tesla model 3')) return 'Sportig elsedan med lång räckvidd och låga driftskostnader.';
  if (n.includes('volvo xc60')) return 'Klassisk svensk SUV med hög komfort och starka andrahandsvärden.';
  if (n.includes('volvo xc40')) return 'Kompakt premium-SUV som funkar lika bra i stan som på landsväg.';
  if (n.includes('volvo xc90')) return 'Stor och lyxig 7-sitsare -- perfekt för familjen som vill ha allt.';
  if (n.includes('volvo ex30')) return 'Liten, snabb och prisvärd -- Volvos mest tillgängliga elbil.';
  if (n.includes('volvo ex40')) return 'Eldrivna XC40 med bra räckvidd och typisk Volvo-komfort.';
  if (n.includes('volvo v60')) return 'Stilren kombi med bra utrymme och balanserade köregenskaper.';
  if (n.includes('kia ev6')) return 'Snabbladdningskung med sportig design och bra teknik.';
  if (n.includes('kia sportage')) return 'Generös utrustning, stor kupé och finns som hybrid.';
  if (n.includes('kia niro')) return 'Effektiv crossover som finns i alla drivlinor.';
  if (n.includes('hyundai ioniq')) return 'Ultrasnabb laddning och futuristisk design till bra pris.';
  if (n.includes('toyota rav4')) return 'Pålitlig hybrid-SUV med låg förbrukning och bra utrymme.';
  if (n.includes('toyota corolla')) return 'Självladdande hybrid som är snål och enkel att äga.';
  if (n.includes('toyota yaris cross')) return 'Kompakt crossover med bra bränsle-ekonomi och hög sittposition.';
  if (n.includes('toyota c-hr')) return 'Stilfull hybrid-crossover med sportig karaktär.';
  if (n.includes('vw golf')) return 'Tidlös halvkombi med balanserad körning och bra kvalitet.';
  if (n.includes('vw id.4') || n.includes('vw id4')) return 'Rymlig el-SUV med bra komfort och familjevänligt utrymme.';
  if (n.includes('vw id.3') || n.includes('vw id3')) return 'Kompakt elbil med snabb laddning och bra stadskänsla.';
  if (n.includes('vw id.7') || n.includes('vw id7')) return 'Elegant elkombi med lång räckvidd för storbilisterna.';
  if (n.includes('vw tiguan')) return 'Populär familje-SUV med bra kvalitet och mångsidighet.';
  if (n.includes('vw passat')) return 'Rymlig kombi med hög komfort på långresor.';
  if (n.includes('skoda enyaq')) return 'Rymligaste el-SUV:en i sin klass -- bra val för familjen.';
  if (n.includes('skoda octavia')) return 'Enormt bagageutrymme och prisvärd -- den praktiska favoriten.';
  if (n.includes('bmw x3')) return 'Sportig premium-SUV med engagerande köregenskaper.';
  if (n.includes('bmw ix3')) return 'Eldrivna X3 med BMW-känsla och bra vardagsräckvidd.';
  if (n.includes('audi a3')) return 'Premium-halvkombi med stilfull interiör och kvick styrning.';
  if (n.includes('polestar 2')) return 'Svensk-kinesisk elsedan med skarp design och sportig körning.';
  if (n.includes('cupra born')) return 'Sportig elbil med rolig körkänsla och bra pris.';
  if (n.includes('honda civic')) return 'Välbyggd halvkombi med smart hybrid och bra körglädje.';
  if (n.includes('honda cr-v') || n.includes('honda crv')) return 'Rymlig och pålitlig SUV med effektiv hybridmotor.';
  if (car.specs.fuel_types.includes('el')) return `Ren eldrift med ${car.ratings.comfort >= 8 ? 'hög komfort' : 'bra teknik'} och låga löpkostnader.`;
  if (car.specs.fuel_types.includes('hybrid')) return `Effektiv hybrid med ${car.ratings.value >= 8 ? 'bra totalvärde' : 'balanserad prestanda'}.`;
  if (car.pros.length > 0) return car.pros[0];
  return 'Prisvärd och pålitlig -- ett säkert val.';
}

function formatSEK(n: number): string {
  return n.toLocaleString('sv-SE').replace(/\u00a0/g, ' ') + ' kr';
}

const BUDGET_BRACKETS = [
  { label: 'Under 3 000 kr/mån', maxMonthly: 3000, carId: 'skoda_octavia' },
  { label: 'Under 4 000 kr/mån', maxMonthly: 4000, carId: 'kia_niro' },
  { label: 'Under 5 000 kr/mån', maxMonthly: 5000, carId: 'toyota_rav4' },
  { label: 'Under 6 000 kr/mån', maxMonthly: 6000, carId: 'volvo_xc40' },
  { label: 'Under 8 000 kr/mån', maxMonthly: 8000, carId: 'tesla_model_y' },
  { label: 'Öppen budget', maxMonthly: 0, carId: 'bmw_x3' },
] as const;

/* ───────────── curated data ───────────── */

const LOCAL_IMAGES: Record<string, string> = {
  skoda_enyaq: '/getImage.webp',
  tesla_model_3: '/getImage_(1).webp',
  skoda_octavia: '/getImage_(2).webp',
  toyota_corolla: '/getImage_(3).webp',
  hyundai_ioniq5: '/getImage_ioniq5.webp',
  polestar_2: '/getImage_polestar2.webp',
  bmw_ix1: '/getImage_(6).webp',
  mercedes_eqc: '/getImage_(7).webp',
  bmw_2_series: '/getImage_(8).webp',
  skoda_superb: '/getImage_(9).webp',
};

const CURATED_IDS = [
  'tesla_model_y', 'volvo_xc60', 'kia_ev6', 'vw_golf', 'toyota_rav4',
  'volvo_xc40', 'volvo_ex30', 'hyundai_ioniq5', 'toyota_corolla',
  'kia_sportage', 'vw_id4', 'skoda_enyaq', 'bmw_x3',
  'tesla_model_3', 'polestar_2', 'toyota_yaris_cross',
  'volvo_v60', 'honda_crv', 'bmw_ix1', 'mercedes_eqc',
  'bmw_2_series', 'skoda_superb',
];

type CategoryKey = 'alla' | 'popular' | 'el' | 'suv' | 'hybrid' | 'sedan';

const CATEGORY_IDS: Record<CategoryKey, string[] | null> = {
  alla: null,
  popular: ['tesla_model_y', 'volvo_xc60', 'kia_ev6', 'vw_golf', 'toyota_rav4'],
  el: ['tesla_model_y', 'volvo_ex30', 'volvo_ex40', 'kia_ev6', 'hyundai_ioniq5', 'vw_id4', 'polestar_2', 'tesla_model_3', 'skoda_enyaq'],
  suv: ['tesla_model_y', 'volvo_xc60', 'volvo_xc40', 'toyota_rav4', 'kia_sportage', 'bmw_x3', 'hyundai_ioniq5', 'honda_crv'],
  hybrid: ['toyota_rav4', 'toyota_corolla', 'volvo_xc60', 'kia_sportage', 'toyota_yaris_cross', 'kia_niro', 'honda_crv'],
  sedan: ['vw_golf', 'tesla_model_3', 'toyota_corolla', 'audi_a3', 'honda_civic', 'volvo_v60', 'polestar_2'],
};

const CATEGORIES: { key: CategoryKey; label: string; icon: typeof Car }[] = [
  { key: 'alla', label: 'Alla', icon: Car },
  { key: 'popular', label: 'Populärast', icon: Sparkles },
  { key: 'el', label: 'Elbilar', icon: Zap },
  { key: 'suv', label: 'SUV', icon: Truck },
  { key: 'hybrid', label: 'Hybrid', icon: Leaf },
  { key: 'sedan', label: 'Sedan / Kombi', icon: CarFront },
];

function resolveCarImage(carId: string, brand: string, model: string, getCarImage: (b: string, m: string) => string | undefined): string | undefined {
  if (LOCAL_IMAGES[carId]) return LOCAL_IMAGES[carId];
  return getCarImage(brand, model);
}

/* ───────────── search scoring ───────────── */

function searchScoreCar(car: ComparisonCar, query: string): number {
  const q = query.toLowerCase().replace(/[?!.,]/g, '');
  const name = `${car.brand_display} ${car.model_display}`.toLowerCase();
  let score = 0;
  if (name.includes(q)) return 100;
  const tokens = q.split(/[\s,]+/).filter(t => t.length >= 2);

  const bodyAliases: Record<string, string[]> = {
    suv: ['suv', 'jeep', 'crossover', 'terrängbil', 'stadsjeep'],
    kombi: ['kombi', 'stationsvagn', 'herrgårdsvagn', 'lastvagn'],
    sedan: ['sedan', 'saloon', 'limousine'],
    hatchback: ['halvkombi', 'hatchback', 'småbil', 'kompakt', 'liten'],
  };
  const fuelAliases: Record<string, string[]> = {
    el: ['el', 'elbil', 'electric', 'elektrisk', 'batteri', 'räckvidd'],
    hybrid: ['hybrid', 'phev', 'laddhybrid', 'plug'],
    bensin: ['bensin', 'petrol', 'fossilt'],
    diesel: ['diesel'],
  };
  const traitTokens: Record<string, (c: ComparisonCar) => boolean> = {
    familj: c => c.specs.seats >= 5 && (c.specs.trunk_liters || 0) >= 400,
    barn: c => c.specs.seats >= 5 && (c.specs.trunk_liters || 0) >= 400,
    barnfamilj: c => c.specs.seats >= 5 && (c.specs.trunk_liters || 0) >= 400,
    billig: c => c.ratings.value >= 8,
    prisvärd: c => c.ratings.value >= 8,
    budget: c => c.ratings.value >= 8,
    ekonomisk: c => c.ratings.value >= 7,
    lyxig: c => c.segment === 'premium' || c.segment === 'luxury',
    premium: c => c.segment === 'premium' || c.segment === 'luxury',
    exklusiv: c => c.segment === 'premium' || c.segment === 'luxury',
    sportig: c => c.ratings.driving >= 8,
    snabb: c => c.ratings.driving >= 8,
    kul: c => c.ratings.driving >= 7,
    bekväm: c => c.ratings.comfort >= 8,
    komfort: c => c.ratings.comfort >= 8,
    tyst: c => c.ratings.comfort >= 8,
    rymlig: c => c.ratings.practicality >= 8,
    stor: c => c.ratings.practicality >= 8,
    plats: c => c.ratings.practicality >= 7,
    lastförmåga: c => (c.specs.trunk_liters || 0) >= 500,
    bagage: c => (c.specs.trunk_liters || 0) >= 400,
    säker: c => (c.safety.euro_ncap_stars || 0) >= 5,
    säkerhet: c => (c.safety.euro_ncap_stars || 0) >= 5,
    pendl: c => c.ratings.comfort >= 7 && c.ratings.value >= 7,
    stad: c => c.specs.body_type === 'hatchback' || c.specs.body_type === 'suv',
    fyrhjuls: c => c.specs.drivetrain.some(d => d === 'awd'),
    allhjuls: c => c.specs.drivetrain.some(d => d === 'awd'),
    awd: c => c.specs.drivetrain.some(d => d === 'awd'),
    '4wd': c => c.specs.drivetrain.some(d => d === 'awd'),
    sju: c => c.specs.seats >= 7,
    '7': c => c.specs.seats >= 7,
  };

  // Parse price targets from query: "under 400k", "400 000", "400000", "max 350k"
  let priceTarget: number | null = null;
  let priceCap = false;
  const pricePatterns = [
    /(?:under|max|upp till)\s*(\d[\d\s]*)\s*(?:kr|sek|tusen|000)/i,
    /(\d{3,})\s*(?:kr|sek)/i,
    /(\d+)\s*k\b/i,
  ];
  for (const p of pricePatterns) {
    const m = q.match(p);
    if (m) {
      const raw = m[1].replace(/\s/g, '');
      priceTarget = parseInt(raw);
      if (priceTarget < 1000) priceTarget *= 1000;
      priceCap = /under|max|upp till/i.test(q);
      break;
    }
  }

  for (const token of tokens) {
    if (name.includes(token)) { score += 30; continue; }
    if (car.specs.fuel_types.some(f => f.includes(token) || token.includes(f))) { score += 20; continue; }
    if (car.specs.body_type.includes(token) || token.includes(car.specs.body_type)) { score += 20; continue; }

    let matched = false;
    for (const [bt, aliases] of Object.entries(bodyAliases)) {
      if (aliases.some(a => a.includes(token) || token.includes(a)) && car.specs.body_type === bt) { score += 18; matched = true; break; }
    }
    if (matched) continue;

    for (const [ft, aliases] of Object.entries(fuelAliases)) {
      if (aliases.some(a => a.includes(token) || token.includes(a)) && car.specs.fuel_types.includes(ft as never)) { score += 18; matched = true; break; }
    }
    if (matched) continue;

    for (const [trait, check] of Object.entries(traitTokens)) {
      if (token.includes(trait) || trait.includes(token)) { if (check(car)) score += 15; matched = true; break; }
    }
    if (matched) continue;
  }

  // Price-based scoring
  if (priceTarget && car.pricing.new_from_sek) {
    if (priceCap) {
      if (car.pricing.new_from_sek <= priceTarget) score += 15;
      else if (car.pricing.new_from_sek <= priceTarget * 1.1) score += 5;
    } else {
      const diff = Math.abs(car.pricing.new_from_sek - priceTarget);
      if (diff < 50000) score += 15;
      else if (diff < 100000) score += 10;
      else if (diff < 200000) score += 5;
    }
  }
  if (priceTarget && car.pricing.used_from_sek) {
    if (priceCap && car.pricing.used_from_sek <= priceTarget) score += 8;
    else {
      const diff = Math.abs(car.pricing.used_from_sek - priceTarget);
      if (diff < 50000) score += 8;
      else if (diff < 100000) score += 4;
    }
  }

  return Math.min(score, 100);
}

/* ───────────── quiz scoring ───────────── */

interface QuizRecommendation {
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url?: string | null;
  matchScore: number;
  matchReasons: string[];
  bodyType?: string;
  fuelType?: string;
  rating?: number;
  fuelLabel?: string;
  trunkLiters?: number;
}

function detectBodyType(model: string): string | null {
  const modelLower = model.toLowerCase();
  let bestMatch: string | null = null;
  let bestLength = 0;
  for (const [bodyType, keywords] of Object.entries(BODY_TYPE_KEYWORDS)) {
    for (const k of keywords) {
      if (modelLower.includes(k) && k.length > bestLength) { bestMatch = bodyType; bestLength = k.length; }
    }
  }
  return bestMatch;
}

function detectFuelType(model: string, make: string): string | null {
  const modelLower = model.toLowerCase();
  const makeLower = make.toLowerCase();
  if (FUEL_TYPE_KEYWORDS.electric.some(k => modelLower.includes(k) || makeLower.includes(k))) return 'electric';
  if (FUEL_TYPE_KEYWORDS.hybrid.some(k => modelLower.includes(k))) return 'hybrid';
  if (FUEL_TYPE_KEYWORDS.diesel.some(k => modelLower.includes(k))) return 'diesel';
  return 'petrol';
}

function getBrandCategory(make: string): 'premium' | 'mainstream' | 'value' {
  const makeUpper = make.toUpperCase();
  if (BRAND_CATEGORIES.premium.some(b => makeUpper.includes(b.toUpperCase()))) return 'premium';
  if (BRAND_CATEGORIES.value.some(b => makeUpper.includes(b.toUpperCase()))) return 'value';
  return 'mainstream';
}

function scoreCarMatch(car: { make: string; model: string }, answers: QuizAnswers): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const modelLower = car.model.toLowerCase();
  const makeUpper = car.make.toUpperCase();
  const detectedBodyType = detectBodyType(car.model);
  const detectedFuelType = detectFuelType(car.model, car.make);
  const brandCategory = getBrandCategory(car.make);
  const compData = findComparisonCarByMakeModel(car.make, car.model);
  const actualBodyType = detectedBodyType || compData?.specs.body_type || null;

  if (answers.body_type && answers.body_type.length > 0) {
    if (!(actualBodyType && answers.body_type.includes(actualBodyType))) return { score: 0, reasons: [] };
  }
  if (answers.fuel_type && answers.fuel_type.length > 0) {
    const actualFuels = compData?.specs.fuel_types || [];
    const fuelMap: Record<string, string[]> = { electric: ['el'], hybrid: ['hybrid', 'laddhybrid'], petrol: ['bensin'], diesel: ['diesel'] };
    const matchesFuel = answers.fuel_type.some(userFuel => {
      const mapped = fuelMap[userFuel] || [userFuel];
      return mapped.some(f => actualFuels.includes(f as never)) || detectedFuelType === userFuel;
    });
    if (matchesFuel) {
      const fuelNames: Record<string, string> = { electric: 'Elbil', hybrid: 'Hybrid', petrol: 'Bensin', diesel: 'Diesel' };
      const matchedFuel = answers.fuel_type.find(f => {
        const mapped = fuelMap[f] || [f];
        return mapped.some(m => actualFuels.includes(m as never)) || detectedFuelType === f;
      });
      if (matchedFuel) reasons.push(fuelNames[matchedFuel]);
    } else {
      return { score: 0, reasons: [] };
    }
  }

  let totalWeight = 0;
  let weightedScore = 0;

  const BODY_WEIGHT = 25;
  totalWeight += BODY_WEIGHT;
  if (answers.body_type && answers.body_type.length > 0 && actualBodyType && answers.body_type.includes(actualBodyType)) weightedScore += BODY_WEIGHT;

  const FUEL_WEIGHT = 20;
  totalWeight += FUEL_WEIGHT;
  if (answers.fuel_type && answers.fuel_type.length > 0) {
    const actualFuels = compData?.specs.fuel_types || [];
    const fuelMap: Record<string, string[]> = { electric: ['el'], hybrid: ['hybrid', 'laddhybrid'], petrol: ['bensin'], diesel: ['diesel'] };
    if (answers.fuel_type.some(uf => { const m = fuelMap[uf] || [uf]; return m.some(f => actualFuels.includes(f as never)) || detectedFuelType === uf; })) weightedScore += FUEL_WEIGHT;
  }

  const BRAND_WEIGHT = 15;
  totalWeight += BRAND_WEIGHT;
  if (answers.brand_preference && answers.brand_preference !== 'no_preference') {
    if (brandCategory === answers.brand_preference) { weightedScore += BRAND_WEIGHT; const names: Record<string, string> = { premium: 'Premiummärke', mainstream: 'Pålitligt märke', value: 'Prisvärt' }; reasons.push(names[brandCategory]); }
    else if ((answers.brand_preference === 'premium' && brandCategory === 'mainstream') || (answers.brand_preference === 'mainstream' && brandCategory !== 'mainstream')) weightedScore += BRAND_WEIGHT * 0.3;
  } else { weightedScore += BRAND_WEIGHT; }

  const PRIORITY_WEIGHT = 20;
  totalWeight += PRIORITY_WEIGHT;
  if (answers.priorities && answers.priorities.length > 0) {
    let priorityMatches = 0;
    for (const priority of answers.priorities) {
      const trait = PRIORITY_TRAITS[priority as keyof typeof PRIORITY_TRAITS];
      if (!trait) continue;
      let pMatched = false;
      if (trait.brands.some(b => makeUpper.includes(b.toUpperCase()))) pMatched = true;
      if (trait.keywords.some(k => modelLower.includes(k))) pMatched = true;
      if (compData) {
        if (priority === 'safety' && compData.safety.euro_ncap_stars === 5) pMatched = true;
        if (priority === 'comfort' && (compData.ratings.comfort ?? 0) >= 8) pMatched = true;
        if (priority === 'space' && (compData.specs.trunk_liters ?? 0) >= 450) pMatched = true;
        if (priority === 'economy' && compData.specs.fuel_types.some(f => ['el', 'hybrid', 'laddhybrid'].includes(f))) pMatched = true;
      }
      if (pMatched) {
        priorityMatches++;
        const pNames: Record<string, string> = { economy: 'Låga kostnader', safety: 'Hög säkerhet', comfort: 'Hög komfort', performance: 'Bra prestanda', space: 'Rymlig', tech: 'Modern teknik', resale: 'Bra andrahandsvärde', reliability: 'Pålitlig' };
        if (!reasons.includes(pNames[priority])) reasons.push(pNames[priority]);
      }
    }
    weightedScore += PRIORITY_WEIGHT * (priorityMatches / answers.priorities.length);
  } else { weightedScore += PRIORITY_WEIGHT; }

  const USE_WEIGHT = 10;
  totalWeight += USE_WEIGHT;
  if (answers.daily_use === 'family') {
    const familyKw = ['xc', 'x3', 'x5', 'q5', 'q7', 'gle', 'glc', 'v60', 'v90', 'kombi', 'touring', 'avant', 'tiguan', 'kodiaq'];
    if (familyKw.some(k => modelLower.includes(k)) || (compData && (compData.specs.seats ?? 0) >= 5 && (compData.specs.trunk_liters ?? 0) >= 400)) { weightedScore += USE_WEIGHT; reasons.push('Familjevänlig'); }
  } else if (answers.daily_use === 'solo') {
    const soloKw = ['golf', 'a3', 'polo', '1-serie', 'a-klass', 'model 3', 'id.3', 'i20', 'i30', 'corolla', 'yaris'];
    if (soloKw.some(k => modelLower.includes(k)) || actualBodyType === 'hatchback') { weightedScore += USE_WEIGHT; reasons.push('Pendlarval'); }
  } else if (answers.daily_use === 'cargo') {
    const cargoKw = ['v90', 'v60', 'xc90', 'x5', 'q7', 'gle', 'kodiaq', 'superb'];
    if (cargoKw.some(k => modelLower.includes(k)) || (compData && (compData.specs.trunk_liters ?? 0) >= 500)) { weightedScore += USE_WEIGHT; reasons.push('Stort lastutrymme'); }
  } else { weightedScore += USE_WEIGHT; }

  const MILEAGE_WEIGHT = 10;
  totalWeight += MILEAGE_WEIGHT;
  if (answers.annual_mileage === 'high') {
    if (detectedFuelType === 'diesel' || detectedFuelType === 'hybrid') { weightedScore += MILEAGE_WEIGHT; reasons.push('Bra för långpendling'); }
    else if (detectedFuelType === 'electric') weightedScore += MILEAGE_WEIGHT * 0.5;
  } else if (answers.annual_mileage === 'low') {
    if (detectedFuelType === 'electric') { weightedScore += MILEAGE_WEIGHT; reasons.push('Perfekt för stadskörning'); }
    else weightedScore += MILEAGE_WEIGHT * 0.7;
  } else { weightedScore += MILEAGE_WEIGHT; }

  const finalScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 50;
  return { score: Math.min(100, Math.max(0, finalScore)), reasons: reasons.slice(0, 3) };
}

/* ───────────── chat types ───────────── */

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  cars?: ComparisonCar[];
}

type QuizStep = 'idle' | 'active' | 'analyzing' | 'results';

/* ───────────── nav ───────────── */

const NAV_ITEMS = ['Så funkar det', 'Vi förhandlar åt dig', 'Jämför bilar'] as const;

interface CompareCarsPageProps {
  onBackHome: () => void;
}

/* ═════════════ MAIN COMPONENT ═════════════ */

export default function CompareCarsPage({ onBackHome }: CompareCarsPageProps) {
  const allCarsRaw = useMemo(() => getAllComparisonCars(), []);
  const { getCarImage } = useCarImages();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [detailCar, setDetailCar] = useState<ComparisonCar | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('alla');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quiz state
  const [quizStep, setQuizStep] = useState<QuizStep>('idle');
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null);
  const [quizResults, setQuizResults] = useState<QuizRecommendation[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [analysisReady, setAnalysisReady] = useState(false);
  const quizSectionRef = useRef<HTMLDivElement>(null);

  // Bilto Score info
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false);

  // Trade-in calculator
  const [tradeCarValue, setTradeCarValue] = useState('');
  const [tradeLoanAmount, setTradeLoanAmount] = useState('');
  const [tradeInterestRate, setTradeInterestRate] = useState('');
  const [tradeMonthlyPayment, setTradeMonthlyPayment] = useState('');
  const [tradeCalculated, setTradeCalculated] = useState(false);

  // Budget filter state
  const [activeBudget, setActiveBudget] = useState<number | null>(null);
  const [budgetShowCount, setBudgetShowCount] = useState(15);
  const budgetGridRef = useRef<HTMLDivElement>(null);

  const navigateToBuy = useCallback((carLabel: string) => {
    const params = new URLSearchParams();
    params.set('bil', carLabel);
    params.set('source', 'Jämför bilar');
    window.history.pushState({}, '', `/kop-bil?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const navigateToSell = useCallback(() => {
    window.history.pushState({}, '', '/salj');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    document.title = 'Jämför bilar -- Bilto';
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const allCarsMap = useMemo(() => {
    const map = new Map<string, ComparisonCar>();
    allCarsRaw.forEach(c => map.set(c.id, c));
    return map;
  }, [allCarsRaw]);

  const getCuratedList = useCallback((ids: string[]) =>
    ids.map(id => allCarsMap.get(id)).filter((c): c is ComparisonCar => !!c),
  [allCarsMap]);

  const visibleCars = useMemo(() => {
    const ids = CATEGORY_IDS[activeCategory];
    if (ids === null) return getCuratedList(CURATED_IDS);
    return getCuratedList(ids);
  }, [activeCategory, getCuratedList]);

  // Selection helpers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < MAX_COMPARE) { next.add(id); }
      return next;
    });
  }, []);

  const selectedCars = useMemo(
    () => Array.from(selectedIds).map(id => allCarsMap.get(id)).filter((c): c is ComparisonCar => !!c),
    [selectedIds, allCarsMap],
  );

  const getImageForCar = useCallback(
    (car: ComparisonCar) => resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage),
    [getCarImage],
  );

  const budgetFilteredCars = useMemo(() => {
    if (activeBudget === null) return [];
    return allCarsRaw
      .filter(car => {
        if (!car.pricing.new_from_sek) return false;
        if (!resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage)) return false;
        const monthly = Math.round(car.pricing.new_from_sek / 60);
        return activeBudget === 0 ? true : monthly <= activeBudget;
      })
      .sort((a, b) => (a.pricing.new_from_sek || 0) - (b.pricing.new_from_sek || 0));
  }, [activeBudget, allCarsRaw, getCarImage]);

  // Trade-in results
  const tradeEquity = useMemo(() => {
    const cv = parseFloat(tradeCarValue.replace(/\s/g, '')) || 0;
    const la = parseFloat(tradeLoanAmount.replace(/\s/g, '')) || 0;
    return cv - la;
  }, [tradeCarValue, tradeLoanAmount]);

  const tradeResults = useMemo(() => {
    if (!tradeCalculated || tradeEquity <= 0) return [];
    const currentMonthly = parseFloat(tradeMonthlyPayment.replace(/\s/g, '')) || 0;
    const rate = (parseFloat(tradeInterestRate.replace(',', '.')) || 0) / 100;
    const months = 72;

    return allCarsRaw
      .filter(car => {
        if (!car.pricing.new_from_sek) return false;
        if (!resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage)) return false;
        return true;
      })
      .map(car => {
        const principal = Math.max(0, car.pricing.new_from_sek! - tradeEquity);
        let monthly: number;
        if (rate > 0) {
          const mr = rate / 12;
          monthly = principal * (mr / (1 - Math.pow(1 + mr, -months)));
        } else {
          monthly = principal / months;
        }
        return { car, monthly: Math.round(monthly) };
      })
      .filter(r => r.monthly < currentMonthly && r.monthly > 0)
      .sort((a, b) => a.monthly - b.monthly)
      .slice(0, 12);
  }, [tradeCalculated, tradeEquity, tradeMonthlyPayment, tradeInterestRate, allCarsRaw, getCarImage]);

  // Chat
  const handleChatSubmit = () => {
    const q = chatInput.trim();
    if (!q) return;
    const userMsg: ChatMessage = { role: 'user', text: q };
    let scored = allCarsRaw
      .map(car => ({ car, score: searchScoreCar(car, q) }))
      .filter(r => r.score >= 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    let responseText: string;
    let isFuzzy = false;
    if (scored.length === 0) {
      scored = allCarsRaw
        .map(car => ({ car, score: searchScoreCar(car, q) }))
        .filter(r => r.score >= 5)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
      isFuzzy = scored.length > 0;
    }
    if (scored.length === 0) {
      responseText = 'Jag hittade inga bilar som matchar just det. Prova att beskriva vad du letar efter -- t.ex. "familje-SUV", "elbil under 400 000 kr" eller "sportig kombi med fyrhjulsdrift".';
    } else if (isFuzzy) {
      responseText = 'Jag är inte helt säker, men dessa kanske passar det du söker:';
    } else if (scored.length <= 2) {
      responseText = `Här är ${scored.length === 1 ? 'ett förslag' : 'två förslag'} som matchar:`;
    } else {
      responseText = `Jag hittade ${scored.length} bilar som passar. Här är mina bästa förslag:`;
    }
    const assistantMsg: ChatMessage = { role: 'assistant', text: responseText, cars: scored.map(r => r.car) };
    setChatMessages(prev => [...prev, userMsg, assistantMsg]);
    setChatInput('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const openContactForCar = (car: ComparisonCar | null) => {
    navigateToBuy(car ? `${car.brand_display} ${car.model_display}` : '');
  };

  const handleNavSelect = (item: string) => {
    if (item === 'Så funkar det') { window.history.pushState({}, '', '/sa-funkar-det'); window.dispatchEvent(new PopStateEvent('popstate')); }
    else if (item === 'Vi förhandlar åt dig') { window.history.pushState({}, '', '/forhandling'); window.dispatchEvent(new PopStateEvent('popstate')); }
  };

  // Quiz handlers
  const handleQuizComplete = async (answers: QuizAnswers) => {
    setQuizAnswers(answers);
    setQuizStep('analyzing');
    setAnalysisReady(false);
    loadQuizRecommendations(answers);
    setTimeout(() => setAnalysisReady(true), 3500);
  };

  const handleQuizShowResults = () => {
    setQuizStep('results');
    setTimeout(() => quizSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleQuizReset = () => {
    setQuizStep('idle');
    setQuizAnswers(null);
    setQuizResults([]);
    setAnalysisReady(false);
  };

  async function loadQuizRecommendations(answers: QuizAnswers) {
    setQuizLoading(true);
    try {
      const { data, error } = await supabase
        .from('car_catalog')
        .select('make, model, image_url, cleaned_image_url')
        .not('image_url', 'is', null);
      if (error) throw error;
      const catalogCars = (data || []) as { make: string; model: string; image_url: string | null; cleaned_image_url: string | null }[];
      const fuelLabelMap: Record<string, string> = { bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid', laddhybrid: 'Laddhybrid', el: 'El' };
      const scoredCars = catalogCars
        .map(car => {
          const { score, reasons } = scoreCarMatch(car, answers);
          const compData = findComparisonCarByMakeModel(car.make, car.model);
          const bodyType = detectBodyType(car.model) || compData?.specs.body_type || undefined;
          const fuelType = detectFuelType(car.model, car.make) || undefined;
          const fuelLabel = compData?.specs.fuel_types
            ? compData.specs.fuel_types.map(f => fuelLabelMap[f] || f).join(' / ')
            : fuelType === 'electric' ? 'El' : fuelType === 'hybrid' ? 'Hybrid' : fuelType === 'diesel' ? 'Diesel' : 'Bensin';
          return {
            make: car.make, model: car.model,
            image_url: car.image_url, cleaned_image_url: car.cleaned_image_url,
            matchScore: score, matchReasons: reasons,
            bodyType, fuelType, fuelLabel,
            rating: compData?.ratings.overall ?? undefined,
            trunkLiters: compData?.specs.trunk_liters ?? undefined,
          };
        })
        .filter(car => car.matchScore >= 40)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 6);
      setQuizResults(scoredCars);
    } catch (err) {
      console.error('Error loading quiz recommendations:', err);
    } finally {
      setQuizLoading(false);
    }
  }

  const scrollToQuiz = () => {
    quizSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (quizStep === 'idle') setQuizStep('active');
  };

  const BODY_LABELS: Record<string, string> = {
    suv: 'SUV', kombi: 'Kombi', sedan: 'Sedan', hatchback: 'Halvkombi', coupe: 'Coupe', cab: 'Cab', mpv: 'MPV',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]/40 backdrop-blur-md'}`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)} className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white">
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {NAV_ITEMS.map((item) => (
              <button key={item} type="button" onClick={() => handleNavSelect(item)} className={`text-[15px] transition ${item === 'Jämför bilar' ? 'text-white font-semibold' : 'text-white/80 hover:text-white'}`}>
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center ml-auto">
            <a href="/logga-in" className="inline-flex items-center gap-2 bg-white text-[#0e6efe] text-[14px] font-semibold px-5 h-10 rounded-full hover:bg-slate-100 transition whitespace-nowrap">
              <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
              Logga in
            </a>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Jämför bilar"
        onSelect={(item) => {
          setMenuOpen(false);
          if (item === 'Vi förhandlar åt dig') { window.history.pushState({}, '', '/forhandling'); window.dispatchEvent(new PopStateEvent('popstate')); }
          else if (item === 'Så funkar det') { window.history.pushState({}, '', '/sa-funkar-det'); window.dispatchEvent(new PopStateEvent('popstate')); }
          else onBackHome();
        }}
      />

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-12 sm:pb-16 px-5 sm:px-6 bg-[#0e6efe] relative overflow-hidden">
        <div className="absolute -left-32 top-16 w-[500px] h-[500px] rounded-full bg-[#3d8cff] opacity-40" />
        <div className="absolute right-0 -bottom-32 w-[400px] h-[400px] rounded-full bg-[#3d8cff] opacity-30" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-[26px] sm:text-[44px] font-bold leading-[1.1] tracking-tight text-white">
            Jämför bilar sida vid sida
          </h1>
          <p className="mt-3 sm:mt-4 text-white/80 text-[14px] sm:text-[17px] leading-[1.6] max-w-xl mx-auto">
            Markera upp till {MAX_COMPARE} bilar och jämför betyg, specifikationer och priser. Helt gratis och opartiskt.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => document.getElementById('cars-grid')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-12 px-8 rounded-full bg-white hover:bg-slate-50 text-[#0e6efe] font-bold text-[15px] inline-flex items-center gap-2 group transition shadow-lg"
            >
              Utforska bilar
              <ArrowDown className="w-4.5 h-4.5 group-hover:translate-y-0.5 transition" />
            </button>
            <button
              onClick={scrollToQuiz}
              className="h-12 px-6 rounded-full border-2 border-white/40 text-white font-semibold text-[14px] hover:bg-white/10 inline-flex items-center gap-2 transition"
            >
              <Search className="w-4 h-4" />
              Hitta din bilmatch
            </button>
          </div>
        </div>
      </section>

      {/* Browse by budget */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-[22px] sm:text-[32px] font-extrabold text-slate-900 text-center tracking-tight mb-8 sm:mb-10 uppercase">
            Bläddra efter budget
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
            {BUDGET_BRACKETS.map((bracket, i) => {
              const car = allCarsRaw.find(c => c.id === bracket.carId);
              const img = car ? resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage) : undefined;
              const isActive = activeBudget === bracket.maxMonthly;
              return (
                <motion.button
                  key={bracket.label}
                  type="button"
                  initial={isMobile ? false : { opacity: 0, y: 20 }}
                  animate={isMobile ? { opacity: 1, y: 0 } : undefined}
                  {...(!isMobile && { whileInView: { opacity: 1, y: 0 }, viewport: { once: true } })}
                  transition={{ duration: isMobile ? 0 : 0.35, delay: isMobile ? 0 : i * 0.06 }}
                  onClick={() => {
                    if (isActive) {
                      setActiveBudget(null);
                    } else {
                      setActiveBudget(bracket.maxMonthly);
                      setBudgetShowCount(15);
                      setTimeout(() => budgetGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                    }
                  }}
                  className={`flex flex-col rounded-2xl overflow-hidden group transition-all duration-300 ${isActive ? 'ring-2 ring-[#0e6efe] shadow-lg' : 'hover:shadow-lg'}`}
                >
                  <div className="w-full aspect-[4/3] bg-white flex items-end justify-center overflow-hidden relative">
                    {img ? (
                      <img src={img} alt="" loading="lazy" className="w-full h-auto object-contain group-hover:scale-[1.05] transition-transform duration-500" />
                    ) : (
                      <Car className="w-12 h-12 text-slate-300 mb-4" />
                    )}
                  </div>
                  <div className="px-2 py-3 bg-white">
                    <p className={`text-[12px] sm:text-[13px] font-bold text-center leading-tight transition-colors ${isActive ? 'text-[#0e6efe]' : 'text-slate-900 group-hover:text-[#0e6efe]'}`}>
                      {bracket.label}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Budget filtered results */}
          <AnimatePresence>
            {activeBudget !== null && (
              <motion.div
                ref={budgetGridRef}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-8 sm:pt-10">
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-[14px] sm:text-[16px] font-bold text-slate-900">
                      {activeBudget === 0
                        ? 'Alla bilar'
                        : `Bilar under ${activeBudget.toLocaleString('sv-SE')} kr/mån`}
                      <span className="text-slate-400 font-normal ml-2">({budgetFilteredCars.length} st)</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveBudget(null)}
                      className="text-[13px] text-slate-400 hover:text-slate-600 font-medium transition-colors"
                    >
                      Stäng
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {budgetFilteredCars.slice(0, budgetShowCount).map((car, i) => (
                      <motion.div
                        key={car.id}
                        initial={isMobile ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: isMobile ? 0 : i * 0.03, duration: isMobile ? 0 : 0.3 }}
                        onClick={() => setDetailCar(car)}
                        className="flex flex-col rounded-2xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 ring-1 ring-white hover:ring-slate-200"
                      >
                        <div className="w-full aspect-[4/3] bg-white flex items-end justify-center overflow-hidden">
                          <img
                            src={resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage)}
                            alt={`${car.brand_display} ${car.model_display}`}
                            loading="lazy"
                            className="w-full h-auto object-contain group-hover:scale-[1.04] transition-transform duration-500"
                          />
                        </div>
                        <div className="px-3 py-3 bg-white">
                          <h3 className="text-[13px] sm:text-[14px] font-bold text-slate-900 group-hover:text-[#0e6efe] transition-colors truncate">
                            {car.brand_display} {car.model_display}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Ny från {formatSEK(car.pricing.new_from_sek!)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {budgetFilteredCars.length > budgetShowCount && (
                    <div className="text-center mt-6">
                      <button
                        type="button"
                        onClick={() => setBudgetShowCount(prev => prev + 15)}
                        className="h-11 px-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[14px] font-semibold transition-colors"
                      >
                        Visa fler bilar
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Curated grid */}
      <section id="cars-grid" className="py-10 sm:py-16 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-[20px] sm:text-[28px] font-bold text-slate-900">Experternas val</h2>
              <p className="text-[13px] text-slate-400 mt-0.5">Markera bilar för att jämföra dem sida vid sida</p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-1 px-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0e6efe] text-white shadow-md shadow-[#0e6efe]/20'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-sm'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={isMobile ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={isMobile ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: isMobile ? 0 : 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {visibleCars.map((car, i) => {
                const isSelected = selectedIds.has(car.id);
                return (
                  <div key={car.id} className="relative">
                    {/* Selection checkbox */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleSelect(car.id); }}
                      className={`absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                        isSelected
                          ? 'bg-[#0e6efe] text-white scale-110'
                          : 'bg-white/90 backdrop-blur-sm text-slate-400 hover:text-[#0e6efe] hover:bg-white ring-1 ring-slate-200/50'
                      }`}
                      aria-label={isSelected ? 'Ta bort från jämförelse' : 'Lägg till i jämförelse'}
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                      ) : (
                        <GitCompareArrows className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className={`rounded-xl transition-all duration-200 ${isSelected ? 'ring-2 ring-[#0e6efe] ring-offset-2' : ''}`}>
                      <CompactCarCard
                        name={`${car.brand_display} ${car.model_display}`}
                        imageUrl={resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage)}
                        rating={car.ratings.overall}
                        topBadge={i < 3 && activeCategory === 'popular'}
                        expertComment={getExpertComment(car)}
                        fuelLabel={car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')}
                        onNegotiate={() => openContactForCar(car)}
                        onDetail={() => setDetailCar(car)}
                        index={i}
                        disableMotion={isMobile}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Sticky comparison bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && !compareOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]"
          >
            <div className="mx-3 mb-3 sm:mx-6 sm:mb-4">
              <div className="max-w-3xl mx-auto bg-slate-900 rounded-2xl shadow-2xl shadow-black/30 px-4 sm:px-5 py-3.5 flex items-center gap-3">
                {/* Mini thumbnails */}
                <div className="flex items-center -space-x-2 shrink-0">
                  {selectedCars.slice(0, MAX_COMPARE).map(car => {
                    const img = getImageForCar(car);
                    return (
                      <div key={car.id} className="w-10 h-10 rounded-xl bg-slate-700 ring-2 ring-slate-900 overflow-hidden shrink-0">
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-[14px] font-semibold">
                    {selectedIds.size} {selectedIds.size === 1 ? 'bil vald' : 'bilar valda'}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {selectedIds.size < 2 ? `Välj minst 2 för att jämföra` : `Upp till ${MAX_COMPARE} bilar`}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCompareOpen(true)}
                  disabled={selectedIds.size < 2}
                  className="h-11 px-5 sm:px-6 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-700 disabled:text-slate-500 text-white text-[14px] font-semibold inline-flex items-center gap-2 transition shrink-0"
                >
                  <GitCompareArrows className="w-4 h-4" />
                  <span className="hidden sm:inline">Jämför</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Electric cars spotlight */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-[22px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight uppercase">
            Populära elbilar just nu
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8 mt-1">
            <p className="text-slate-500 text-[14px] sm:text-[16px]">
              Lägre driftskostnader, snabbare acceleration och noll utsläpp.
            </p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setScoreInfoOpen(prev => !prev)}
                className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-[#0e6efe] transition-colors whitespace-nowrap"
              >
                <Info className="w-3.5 h-3.5" />
                Vad är Bilto Score?
              </button>
              {scoreInfoOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setScoreInfoOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 bg-white rounded-xl shadow-xl ring-1 ring-slate-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-[13px] font-bold text-slate-900">Bilto Score</h4>
                      <button onClick={() => setScoreInfoOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      Bilto Score (1-10) baseras på vår expertbedömning av fem kategorier:
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {[
                        { label: 'Körupplevelse', desc: 'Styrning, gasrespons och körglädje' },
                        { label: 'Komfort', desc: 'Ljudnivå, fjädring och sittkomfort' },
                        { label: 'Praktiskhet', desc: 'Utrymme, bagagevolym och mångsidighet' },
                        { label: 'Prisvärdhet', desc: 'Pris i relation till vad du får' },
                        { label: 'Säkerhet', desc: 'Krocktester och aktiva säkerhetssystem' },
                      ].map(item => (
                        <li key={item.label} className="flex items-start gap-2 text-[11px]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0e6efe] mt-1 shrink-0" />
                          <span><span className="font-semibold text-slate-800">{item.label}</span>{' '}<span className="text-slate-500">-- {item.desc}</span></span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center gap-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><span className="text-[9px] font-bold text-white">9+</span></div>
                        <span className="text-[11px] text-slate-500">Utmärkt</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#0e6efe] flex items-center justify-center"><span className="text-[9px] font-bold text-white">8</span></div>
                        <span className="text-[11px] text-slate-500">Bra</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {(() => {
              const EV_SHOWCASE = [
                { id: 'tesla_model_y', tagline: 'Sveriges mest sålda' },
                { id: 'volvo_ex30', tagline: 'Kompakt och snabb' },
                { id: 'kia_ev6', tagline: 'Snabbladdningskung' },
                { id: 'hyundai_ioniq5', tagline: 'Ultrasnabb laddning' },
                { id: 'tesla_model_3', tagline: 'Sportig elsedan' },
                { id: 'polestar_2', tagline: 'Svensk sportelbil' },
              ];
              return EV_SHOWCASE.map((ev, i) => {
                const car = allCarsRaw.find(c => c.id === ev.id);
                if (!car) return null;
                const img = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
                return (
                  <motion.div
                    key={car.id}
                    initial={isMobile ? false : { opacity: 0, y: 20 }}
                    animate={isMobile ? { opacity: 1, y: 0 } : undefined}
                    {...(!isMobile && { whileInView: { opacity: 1, y: 0 }, viewport: { once: true } })}
                    transition={{ duration: isMobile ? 0 : 0.35, delay: isMobile ? 0 : i * 0.06 }}
                    onClick={() => setDetailCar(car)}
                    className="flex flex-col rounded-2xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 ring-1 ring-white hover:ring-slate-200"
                  >
                    <div className="relative w-full aspect-[4/3] bg-white flex items-end justify-center overflow-hidden">
                      {img ? (
                        <img src={img} alt={`${car.brand_display} ${car.model_display}`} loading="lazy" className="w-full h-auto object-contain group-hover:scale-[1.04] transition-transform duration-500" />
                      ) : (
                        <Car className="w-12 h-12 text-slate-300 mb-4" />
                      )}
                      {car.ratings.overall != null && (
                        <div className={`absolute top-2 right-2 w-8 h-8 rounded-full shadow-md flex items-center justify-center ${car.ratings.overall >= 9 ? 'bg-emerald-500' : 'bg-[#0e6efe]'}`}>
                          <span className="text-[11px] font-bold text-white">{car.ratings.overall}</span>
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-3 bg-white">
                      <h3 className="text-[13px] sm:text-[14px] font-bold text-slate-900 group-hover:text-[#0e6efe] transition-colors truncate">
                        {car.brand_display} {car.model_display}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {ev.tagline}
                      </p>
                      {car.pricing.new_from_sek && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Ny från <span className="font-bold text-slate-900">{formatSEK(car.pricing.new_from_sek)}</span>
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* AI Smart Search */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-[13px] font-medium text-slate-600 mb-4">
              <Search className="w-4 h-4 text-[#0e6efe]" />
              Smart bilsökning
            </div>
            <h2 className="text-[22px] sm:text-[32px] font-bold text-slate-900 mb-2">
              Hittar du inte rätt bil?
            </h2>
            <p className="text-slate-500 text-[14px] sm:text-[16px] max-w-lg mx-auto leading-relaxed">
              Beskriv vad du söker så hjälper vi dig hitta rätt bil.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl ring-1 ring-slate-200 overflow-hidden">
            {chatMessages.length > 0 && (
              <div className="max-h-[500px] overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-4">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[90%] sm:max-w-[85%]">
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-6 h-6 rounded-full bg-[#0e6efe] flex items-center justify-center">
                              <span className="text-[11px] font-bold text-white leading-none">B</span>
                            </div>
                            <span className="text-[11px] font-medium text-slate-400">Bilto</span>
                          </div>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#0e6efe] text-white rounded-br-md'
                            : 'bg-white text-slate-700 ring-1 ring-slate-200 rounded-bl-md shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                        {msg.cars && msg.cars.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {msg.cars.map((car, ci) => {
                              const isSelected = selectedIds.has(car.id);
                              return (
                                <div key={car.id} className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleSelect(car.id); }}
                                    className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                      isSelected
                                        ? 'bg-[#0e6efe] text-white'
                                        : 'bg-white/90 text-slate-400 ring-1 ring-slate-200/50'
                                    }`}
                                  >
                                    {isSelected ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <GitCompareArrows className="w-3 h-3" />}
                                  </button>
                                  <div className={`rounded-xl transition-all ${isSelected ? 'ring-2 ring-[#0e6efe]' : ''}`}>
                                    <CompactCarCard
                                      name={`${car.brand_display} ${car.model_display}`}
                                      imageUrl={resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage)}
                                      rating={car.ratings.overall}
                                      expertComment={getExpertComment(car)}
                                      fuelLabel={car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')}
                                      onNegotiate={() => openContactForCar(car)}
                                      onDetail={() => setDetailCar(car)}
                                      index={ci}
                                      disableMotion={isMobile}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}

            <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
              {chatMessages.length === 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {['Familje-SUV under 400k', 'Bästa elbilen', 'Sportig kombi', 'Billig första bil'].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setChatInput(suggestion)}
                      className="px-3 py-1.5 rounded-full bg-slate-100 text-[12px] text-slate-600 font-medium hover:bg-slate-200 transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder='T.ex. "elbil för familj" eller "Toyota SUV"...'
                  className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/20 focus:border-[#0e6efe] transition placeholder:text-slate-400"
                />
                <button type="submit" disabled={!chatInput.trim()} className="h-11 w-11 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:opacity-40 text-white flex items-center justify-center transition shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Trade-in Calculator */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-[13px] font-medium text-emerald-700 mb-4">
              <Calculator className="w-4 h-4" />
              Inbyteskalkylator
            </div>
            <h2 className="text-[22px] sm:text-[32px] font-bold text-slate-900 mb-2">
              Få ner din månadskostnad
            </h2>
            <p className="text-slate-500 text-[14px] sm:text-[16px] max-w-lg mx-auto leading-relaxed">
              Fyll i din nuvarande bilsituation så visar vi vilka bilar du kan byta till med lägre månadskostnad.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl ring-1 ring-slate-200 p-5 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Uppskattat bilvärde</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tradeCarValue}
                    onChange={(e) => { setTradeCarValue(e.target.value.replace(/[^\d\s]/g, '')); setTradeCalculated(false); }}
                    placeholder="T.ex. 200 000"
                    className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">kr</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Kvarvarande lån</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tradeLoanAmount}
                    onChange={(e) => { setTradeLoanAmount(e.target.value.replace(/[^\d\s]/g, '')); setTradeCalculated(false); }}
                    placeholder="T.ex. 155 000"
                    className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">kr</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Ränta på nytt lån</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tradeInterestRate}
                    onChange={(e) => { setTradeInterestRate(e.target.value.replace(/[^\d,.\s]/g, '')); setTradeCalculated(false); }}
                    placeholder="T.ex. 6,5"
                    className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Nuvarande månadskostnad</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tradeMonthlyPayment}
                    onChange={(e) => { setTradeMonthlyPayment(e.target.value.replace(/[^\d\s]/g, '')); setTradeCalculated(false); }}
                    placeholder="T.ex. 4 500"
                    className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition placeholder:text-slate-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">kr/mån</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const cv = parseFloat(tradeCarValue.replace(/\s/g, '')) || 0;
                  const mp = parseFloat(tradeMonthlyPayment.replace(/\s/g, '')) || 0;
                  if (cv > 0 && mp > 0) setTradeCalculated(true);
                }}
                disabled={!tradeCarValue || !tradeMonthlyPayment}
                className="h-11 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-[14px] transition-all inline-flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Beräkna
              </button>
              {tradeCalculated && tradeEquity > 0 && (
                <p className="text-[14px] text-slate-600">
                  Ditt beräknade kapital: <span className="font-bold text-emerald-600">{formatSEK(tradeEquity)}</span>
                </p>
              )}
              {tradeCalculated && tradeEquity <= 0 && (
                <p className="text-[13px] text-amber-600 font-medium">
                  Ditt lån överstiger bilvärdet. Ring oss för att hitta en lösning.
                </p>
              )}
            </div>
          </div>

          {tradeCalculated && tradeResults.length > 0 && (
            <div className="mt-8">
              <p className="text-[15px] font-semibold text-slate-900 mb-4">
                {tradeResults.length} {tradeResults.length === 1 ? 'bil' : 'bilar'} med lägre månadskostnad
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {tradeResults.map((r, i) => {
                  const isSelected = selectedIds.has(r.car.id);
                  return (
                    <div key={r.car.id} className="relative">
                      <div className="absolute top-2 left-2 z-10">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500 text-[10px] font-bold text-white shadow-sm">
                          {formatSEK(r.monthly)}/mån
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleSelect(r.car.id); }}
                        className={`absolute top-2 right-9 z-10 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#0e6efe] text-white' : 'bg-white/90 text-slate-400 ring-1 ring-slate-200/50'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <GitCompareArrows className="w-3 h-3" />}
                      </button>
                      <div className={`rounded-xl transition-all ${isSelected ? 'ring-2 ring-[#0e6efe]' : ''}`}>
                        <CompactCarCard
                          name={`${r.car.brand_display} ${r.car.model_display}`}
                          imageUrl={resolveCarImage(r.car.id, r.car.brand_display, r.car.model_display, getCarImage)}
                          rating={r.car.ratings.overall}
                          expertComment={getExpertComment(r.car)}
                          fuelLabel={r.car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')}
                          onNegotiate={() => openContactForCar(r.car)}
                          onDetail={() => setDetailCar(r.car)}
                          index={i}
                          disableMotion={isMobile}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <p className="text-[13px] text-slate-500 mb-3">
                  Vill du veta exakt vad din bil är värd?
                </p>
                <button
                  onClick={() => navigateToBuy('')}
                  className="h-11 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold inline-flex items-center gap-2 transition"
                >
                  <Phone className="w-4 h-4" />
                  Kontakta oss för en exakt värdering
                </button>
              </div>
            </div>
          )}

          {tradeCalculated && tradeEquity > 0 && tradeResults.length === 0 && (
            <div className="mt-8 text-center py-8">
              <p className="text-[15px] text-slate-600 mb-3">
                Vi hittade inga bilar med lägre månadskostnad just nu.
              </p>
              <p className="text-[13px] text-slate-500 mb-4">
                Prata med oss så hjälper vi dig hitta en bättre lösning.
              </p>
              <button
                onClick={() => navigateToBuy('')}
                className="h-11 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold inline-flex items-center gap-2 transition"
              >
                <Phone className="w-4 h-4" />
                Kontakta oss
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Bilmatch Section */}
      <section ref={quizSectionRef} className="py-14 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {quizStep === 'idle' && (
              <motion.div key="quiz-idle" initial={isMobile ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
                <div className="max-w-lg mx-auto">
                  {/* Car image teasers */}
                  <div className="flex items-center justify-center gap-3 mb-8">
                    {['tesla_model_y', 'volvo_xc60', 'kia_ev6'].map((cid, i) => {
                      const car = allCarsRaw.find(c => c.id === cid);
                      if (!car) return null;
                      const img = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
                      return (
                        <motion.div
                          key={cid}
                          initial={isMobile ? false : { opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: isMobile ? 0 : 0.1 + i * 0.12 }}
                          className="w-[100px] sm:w-[130px] aspect-[4/3] rounded-xl bg-white flex items-end justify-center overflow-hidden"
                        >
                          {img && <img src={img} alt="" className="w-full h-auto object-contain" />}
                        </motion.div>
                      );
                    })}
                  </div>

                  <h2 className="text-[24px] sm:text-[36px] font-bold text-slate-900 tracking-tight leading-[1.1]">
                    Hitta din bilmatch
                  </h2>
                  <p className="text-slate-400 text-[14px] mt-2 mb-8">
                    Vi matchar dig med rätt bil baserat på dina behov.
                  </p>

                  <button
                    type="button"
                    onClick={() => setQuizStep('active')}
                    className="w-full max-w-sm mx-auto h-14 sm:h-16 rounded-2xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-bold text-[16px] sm:text-[18px] flex items-center justify-center gap-3 group transition-all duration-200 shadow-xl shadow-[#0e6efe]/25 active:scale-[0.98]"
                  >
                    Hitta din bilmatch
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-[12px] text-slate-400 mt-3">Tar 60 sekunder</p>
                </div>
              </motion.div>
            )}

            {quizStep === 'active' && (
              <motion.div key="quiz-active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-lg mx-auto">
                <QuizFlow onComplete={handleQuizComplete} onBack={handleQuizReset} />
              </motion.div>
            )}

            {quizStep === 'analyzing' && quizAnswers && (
              <motion.div key="quiz-analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-sm mx-auto">
                <QuizComplete answers={quizAnswers} isAnalysisReady={analysisReady} onShowResults={handleQuizShowResults} />
              </motion.div>
            )}

            {quizStep === 'results' && (
              <motion.div key="quiz-results" initial={isMobile ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-6">
                  <h2 className="text-[20px] sm:text-[28px] font-bold text-slate-900">
                    {quizResults.length > 0 ? `Vi hittade ${quizResults.length} bilar som passar dig` : 'Inga exakta matchningar'}
                  </h2>
                  <p className="text-slate-500 text-[14px] mt-1">
                    Baserat på dina svar har vi valt ut bilar som matchar dina önskemål.
                  </p>
                  {quizAnswers && (
                    <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar">
                      {quizAnswers.priorities?.map(p => {
                        const names: Record<string, string> = {
                          economy: 'Låga driftskostnader', safety: 'Säkerhet', comfort: 'Komfort',
                          performance: 'Prestanda', space: 'Utrymme', tech: 'Modern teknik',
                          resale: 'Andrahandsvärde', reliability: 'Pålitlighet',
                        };
                        return <span key={p} className="shrink-0 px-3 py-1.5 rounded-full bg-[#0e6efe]/10 text-[12px] font-medium text-[#0e6efe]">{names[p] || p}</span>;
                      })}
                      {quizAnswers.body_type?.map(bt => (
                        <span key={bt} className="shrink-0 px-3 py-1.5 rounded-full bg-slate-200 text-[12px] font-medium text-slate-700 capitalize">
                          {bt === 'hatchback' ? 'Halvkombi' : bt === 'coupe' ? 'Coupe' : bt.charAt(0).toUpperCase() + bt.slice(1)}
                        </span>
                      ))}
                      {quizAnswers.fuel_type?.map(ft => (
                        <span key={ft} className="shrink-0 px-3 py-1.5 rounded-full bg-slate-200 text-[12px] font-medium text-slate-700">
                          {ft === 'electric' ? 'Elbil' : ft === 'hybrid' ? 'Hybrid' : ft === 'petrol' ? 'Bensin' : 'Diesel'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {quizLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : quizResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {quizResults.map((car, i) => (
                      <CompactCarCard
                        key={`${car.make}-${car.model}`}
                        name={`${car.make} ${car.model}`}
                        imageUrl={car.cleaned_image_url || car.image_url}
                        rating={car.rating}
                        topBadge={i === 0}
                        expertComment={car.matchReasons.join(' · ') || undefined}
                        fuelLabel={car.fuelLabel}
                        onNegotiate={() => navigateToBuy(`${car.make} ${car.model}`)}
                        onDetail={() => {
                          const compData = findComparisonCarByMakeModel(car.make, car.model);
                          if (compData) setDetailCar(compData);
                        }}
                        index={i}
                        disableMotion={isMobile}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
                      <Car className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-[14px] text-slate-500 mb-4">Vi hjälper dig ändå -- kontakta oss så hittar vi rätt bil.</p>
                    <button onClick={() => navigateToBuy('')} className="h-11 px-6 rounded-xl bg-[#0e6efe] text-white font-semibold text-[14px] inline-flex items-center gap-2 transition">
                      Kontakta oss <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleQuizReset}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Gör om bilmatch
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[20px] sm:text-[28px] font-bold text-slate-900 text-center mb-8 sm:mb-10">Så fungerar det</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: '1', title: 'Hitta din bil', desc: 'Jämför våra toppval, använd vår smarta sökning eller testa bilmatch för att hitta rätt.' },
              { step: '2', title: 'Vi granskar och förhandlar', desc: 'Vi kontrollerar historik, skick och marknadspris -- sen förhandlar vi med säljaren åt dig.' },
              { step: '3', title: 'Du bestämmer', desc: 'Du får ett förslag med bästa pris. Ingen affär utan ditt godkännande.' },
            ].map(s => (
              <div key={s.step} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 sm:text-center">
                <div className="w-10 h-10 rounded-full bg-[#0e6efe] text-white text-[14px] font-bold flex items-center justify-center shrink-0 sm:mb-3">{s.step}</div>
                <div>
                  <p className="text-[15px] font-semibold text-slate-900 mb-1">{s.title}</p>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contextual CTAs */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0e6efe]/8 text-[13px] font-medium text-[#0e6efe] mb-4">
              <Sparkles className="w-4 h-4" />
              Vi hjälper dig
            </div>
            <h2 className="text-[22px] sm:text-[32px] font-bold text-slate-900 mb-2">
              Hur kan vi hjälpa dig?
            </h2>
            <p className="text-slate-500 text-[14px] sm:text-[16px] max-w-lg mx-auto leading-relaxed">
              Bilto är med dig hela vägen -- oavsett om du köper, säljer eller bara vill veta mer.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                icon: <Handshake className="w-6 h-6 text-[#0e6efe]" />,
                iconBg: 'bg-[#0e6efe]/10',
                title: 'Vi förhandlar priset',
                desc: 'Hittat en bil du gillar? Vi kontaktar säljaren och förhandlar fram bästa möjliga pris åt dig -- helt gratis.',
                cta: 'Börja här',
                ctaColor: 'bg-[#0e6efe]/10 text-[#0e6efe] hover:bg-[#0e6efe]/20',
                borderAccent: 'group-hover:ring-[#0e6efe]/30',
                onClick: () => navigateToBuy(''),
              },
              {
                icon: <Car className="w-6 h-6 text-emerald-600" />,
                iconBg: 'bg-emerald-50',
                title: 'Sälj din bil',
                desc: 'Vi hjälper dig sälja snabbt och enkelt. Handlare lägger bud direkt -- du väljer det bästa.',
                cta: 'Kom igång',
                ctaColor: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                borderAccent: 'group-hover:ring-emerald-200',
                onClick: () => {
                  window.history.pushState({}, '', '/sa-funkar-det');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                  window.scrollTo({ top: 0, behavior: 'auto' });
                },
              },
              {
                icon: <Phone className="w-6 h-6 text-amber-600" />,
                iconBg: 'bg-amber-50',
                title: 'Prata med en expert',
                desc: 'Osäker på vad du behöver? Boka ett kostnadsfritt samtal med en av våra bilexperter.',
                cta: 'Boka samtal',
                ctaColor: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                borderAccent: 'group-hover:ring-amber-200',
                onClick: () => navigateToBuy(''),
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`group relative bg-white rounded-2xl p-6 sm:p-7 ring-1 ring-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 ${card.borderAccent} transition-all duration-300 flex flex-col`}
              >
                <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center mb-5`}>
                  {card.icon}
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-6 flex-1">
                  {card.desc}
                </p>
                <button
                  onClick={card.onClick}
                  className={`inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-semibold ${card.ctaColor} transition-all duration-200 self-start`}
                >
                  {card.cta}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#0e6efe] py-14 sm:py-20 px-5 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[22px] sm:text-[36px] font-bold text-white leading-[1.1] tracking-tight">
            Hittat en bil du gillar?
          </h2>
          <p className="mt-3 text-white/80 text-[14px] sm:text-[16px] max-w-md mx-auto">
            Vi kontaktar säljaren och förhandlar fram bästa möjliga pris åt dig.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => openContactForCar(null)} className="h-12 px-8 rounded-full bg-white text-[#0e6efe] font-semibold text-[15px] inline-flex items-center gap-2 group hover:bg-slate-50 transition shadow-lg">
              Förhandla <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>
            <button onClick={scrollToQuiz} className="h-12 px-6 rounded-full border-2 border-white/40 text-white font-semibold text-[14px] hover:bg-white/10 inline-flex items-center gap-2 transition">
              <Search className="w-4 h-4" />
              Hitta din bilmatch
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Compare drawer */}
      <CompareDrawer
        cars={selectedCars}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        onRemove={(id) => {
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            if (next.size === 0) setCompareOpen(false);
            return next;
          });
        }}
        onNegotiate={(car) => {
          setCompareOpen(false);
          openContactForCar(car);
        }}
        getImageUrl={getImageForCar}
      />

      {/* Detail sheet */}
      {detailCar && (
        <CarDetailSheet
          car={{
            make: detailCar.brand_display,
            model: detailCar.model_display,
            image_url: resolveCarImage(detailCar.id, detailCar.brand_display, detailCar.model_display, getCarImage) || null,
            matchScore: detailCar.ratings.overall * 10,
            matchReasons: detailCar.pros.slice(0, 3),
            bodyType: BODY_LABELS[detailCar.specs.body_type] || detailCar.specs.body_type,
            fuelType: detailCar.specs.fuel_types[0],
            seats: detailCar.specs.seats,
            cargo: detailCar.specs.trunk_liters ? `${detailCar.specs.trunk_liters}L` : undefined,
            drivetrain: detailCar.specs.drivetrain.map(d => d.toUpperCase()).join('/'),
            rating: detailCar.ratings.overall,
            usedPrice: detailCar.pricing.used_from_sek,
            fuelLabel: detailCar.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / '),
          }}
          onClose={() => setDetailCar(null)}
          onSelect={() => { const car = detailCar; setDetailCar(null); openContactForCar(car); }}
        />
      )}
    </div>
  );
}
