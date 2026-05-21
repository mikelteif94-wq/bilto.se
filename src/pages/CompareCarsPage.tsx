import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { calcCarMonthly } from '../lib/utils';
import {
  Search, ArrowRight, Car, Menu, User, Check,
  Sparkles, Zap, Truck, Leaf, CarFront,
  Send, Loader2, RotateCcw, Info,
  GitCompareArrows, X, ArrowDown, Phone, Handshake,
  ShieldCheck, Megaphone, CheckCircle, ArrowLeftRight, ChevronDown,
} from 'lucide-react';
import ReviewsSection from '../components/ReviewsSection';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllComparisonCars } from '../lib/comparison';
import { findComparisonCarByMakeModel } from '../lib/comparison';
import type { ComparisonCar } from '../lib/comparison/types';
import { useCarImages, type CatalogCar } from '../hooks/useCarImages';
import MobileMenu from '../components/MobileMenu';
import CompactCarCard from '../components/CompactCarCard';
import ElCarCard from '../components/ElCarCard';
import CompareDrawer from '../components/CompareDrawer';
import BuyDrawer from '../components/BuyDrawer';
import { EquityFlow } from '../components/equity/EquityFlow';
import { SiteFooter } from '../components/SiteFooter';
import RegInput from '../components/RegInput';
import { CarDetailSheet } from '../components/quiz/CarDetailSheet';
import { CarFitQuiz } from '../components/CarFitQuiz';
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
  if (n.includes('tesla model y')) return 'Sveriges mest sålda bil – snabb, rymlig och billig i drift.';
  if (n.includes('tesla model 3')) return 'Sportig elsedan med lång räckvidd och låga driftskostnader.';
  if (n.includes('volvo xc60')) return 'Klassisk svensk SUV med hög komfort och starka andrahandsvärden.';
  if (n.includes('volvo xc40')) return 'Kompakt premium-SUV som funkar lika bra i stan som på landsväg.';
  if (n.includes('volvo xc90')) return 'Stor och lyxig 7-sitsare – perfekt för familjen som vill ha allt.';
  if (n.includes('volvo ex30')) return 'Liten, snabb och prisvärd – Volvos mest tillgängliga elbil.';
  if (n.includes('volvo ex40')) return 'Eldrivna XC40 med bra räckvidd och typisk Volvo-komfort.';
  if (n.includes('volvo v60')) return 'Stilren kombi med bra utrymme och balanserade köregenskaper.';
  if (n.includes('kia ev6')) return 'Snabbladdningskung med sportig design och bra teknik.';
  if (n.includes('kia sportage')) return 'Generös utrustning, stor kupé och finns som hybrid.';
  if (n.includes('kia niro')) return 'Effektiv crossover som finns i alla drivlinor.';
  if (n.includes('hyundai ioniq')) return 'Ultrasnabb laddning och futuristisk design till bra pris.';
  if (n.includes('toyota rav4')) return 'Pålitlig hybrid-SUV med låg förbrukning och bra utrymme.';
  if (n.includes('toyota corolla')) return 'Självladdande hybrid som är snål och enkel att äga.';
  if (n.includes('toyota yaris cross')) return 'Kompakt crossover med bra bränsleekonomi och hög sittposition.';
  if (n.includes('toyota c-hr')) return 'Stilfull hybrid-crossover med sportig karaktär.';
  if (n.includes('vw golf')) return 'Tidlös halvkombi med balanserad körning och bra kvalitet.';
  if (n.includes('vw id.4') || n.includes('vw id4')) return 'Rymlig el-SUV med bra komfort och familjevänligt utrymme.';
  if (n.includes('vw id.3') || n.includes('vw id3')) return 'Kompakt elbil med snabb laddning och bra stadskänsla.';
  if (n.includes('vw id.7') || n.includes('vw id7')) return 'Elegant elkombi med lång räckvidd för storbilisterna.';
  if (n.includes('vw tiguan')) return 'Populär familje-SUV med bra kvalitet och mångsidighet.';
  if (n.includes('vw passat')) return 'Rymlig kombi med hög komfort på långresor.';
  if (n.includes('skoda enyaq')) return 'Rymligaste el-SUV:en i sin klass – bra val för familjen.';
  if (n.includes('skoda octavia')) return 'Enormt bagageutrymme och prisvärd – den praktiska favoriten.';
  if (n.includes('bmw 6-serie gt') || n.includes('bmw 6 serie gt')) return 'Imponerande bagageutrymme och lyxig komfort – utmärkt långfärdsbil.';
  if (n.includes('bmw 2-serie active tourer') || n.includes('bmw 2 serie active tourer')) return 'Praktisk familjebil med laddhybrid och rymlig kupé i BMW-klass.';
  if (n.includes('bmw x3')) return 'Sportig premium-SUV med engagerande köregenskaper.';
  if (n.includes('bmw ix3')) return 'Eldrivna X3 med BMW-känsla och bra vardagsräckvidd.';
  if (n.includes('bmw 3-serie') || n.includes('bmw 3 serie')) return 'Referensbilen för körglädje – sportig, bekväm och tidlös.';
  if (n.includes('bmw 5-serie') || n.includes('bmw 5 serie')) return 'Lyxig businesssedan med toppmodern teknik och stark motorutbud.';
  if (n.includes('audi a3')) return 'Premium-halvkombi med stilfull interiör och kvick styrning.';
  if (n.includes('polestar 2')) return 'Svensk-kinesisk elsedan med skarp design och sportig körning.';
  if (n.includes('cupra born')) return 'Sportig elbil med rolig körkänsla och bra pris.';
  if (n.includes('honda civic')) return 'Välbyggd halvkombi med smart hybrid och bra körglädje.';
  if (n.includes('honda cr-v') || n.includes('honda crv')) return 'Rymlig och pålitlig SUV med effektiv hybridmotor.';
  if (n.includes('mercedes c-klass') || n.includes('mercedes c class')) return 'Elegant och tekniskt avancerad – ett starkt alternativ till BMW 3-serie.';
  if (n.includes('mercedes e-klass') || n.includes('mercedes e class')) return 'Lyxig businesssedan med mjuk gång och toppklassad komfort.';
  if (n.includes('audi a4') || n.includes('audi a5')) return 'Välbalanserad premium med stilfull design och stark motorutbud.';
  if (n.includes('audi q5')) return 'Välbyggd premium-SUV med quattro-driften som säljer sig själv.';
  if (car.specs.fuel_types.includes('el')) return `Ren eldrift med ${car.ratings.comfort >= 8 ? 'hög komfort' : 'bra teknik'} och låga löpkostnader.`;
  if (car.specs.fuel_types.includes('laddhybrid')) return `Laddhybrid med ${car.ratings.value >= 8 ? 'utmärkt totalvärde' : 'bra vardag'} och låg förbrukning vid laddad.`;
  if (car.specs.fuel_types.includes('hybrid')) return `Självladdande hybrid med ${car.ratings.value >= 8 ? 'bra totalvärde' : 'balanserad prestanda'}.`;
  if (car.specs.body_type === 'suv' && car.ratings.practicality >= 8) return 'Rymlig och mångsidig SUV med bra lastutrymme och bekväm körning.';
  if (car.specs.body_type === 'suv') return `${car.ratings.driving >= 8 ? 'Sportig och rolig' : 'Bekväm och praktisk'} SUV för vardagen.`;
  if (car.ratings.comfort >= 9) return 'Exceptionell komfort och lyxig känsla i sin klass.';
  if (car.ratings.driving >= 9) return 'Sportiga köregenskaper i toppklass – riktigt rolig att köra.';
  if (car.ratings.value >= 8) return 'Utmärkt värde för pengarna med bra utrustning och pålitlighet.';
  return `${car.ratings.overall >= 8 ? 'Välbetygsatt' : 'Gedigen'} bil med balanserade egenskaper.`;
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
  volvo_xc90: '/getImage_(11).webp',
  volvo_v60: '/getImage_(15).webp',
  volvo_v40: '/getImage_(17).webp',
  volvo_v40_cross_country: '/getImage_(17).webp',
  volvo_xc70: '/getImage_(18).webp',
  volvo_v60_cross_country: '/getImage_(20).webp',
  volvo_v90_cross_country: '/getImage_(21).webp',
};

const CURATED_IDS = [
  'tesla_model_y', 'volvo_xc60', 'kia_ev6', 'vw_golf', 'toyota_rav4',
  'volvo_xc40', 'volvo_ex30', 'hyundai_ioniq5', 'toyota_corolla',
  'kia_sportage', 'vw_id4', 'skoda_enyaq', 'bmw_x3',
  'tesla_model_3', 'polestar_2', 'toyota_yaris_cross',
  'volvo_v60', 'honda_crv', 'bmw_ix1', 'mercedes_eqc',
  'bmw_2_series', 'skoda_superb',
  // Volvo-utökning
  'volvo_xc90', 'volvo_ex40', 'volvo_ex90',
  'volvo_ec40', 'volvo_xc40_recharge', 'volvo_ex60', 'volvo_es90',
  'volvo_ex30_cross_country', 'volvo_v60_cross_country', 'volvo_v90_cross_country',
  'volvo_s60', 'volvo_s90', 'volvo_v90', 'volvo_v70',
  'volvo_v40', 'volvo_v40_cross_country', 'volvo_xc70',
  // Ford Focus-varianter
  'ford_focus', 'ford_focus_kombi', 'ford_focus_st', 'ford_focus_st_kombi',
  'ford_focus_rs', 'ford_focus_vignale', 'ford_focus_vignale_kombi', 'ford_focus_active',
  'ford_puma', 'ford_kuga', 'ford_mustang_mach_e', 'ford_explorer', 'ford_mustang',
];

type CategoryKey = 'alla' | 'popular' | 'el' | 'suv' | 'hybrid' | 'sedan';

const CATEGORY_IDS: Record<CategoryKey, string[] | null> = {
  alla: null,
  popular: ['tesla_model_y', 'volvo_xc60', 'kia_ev6', 'vw_golf', 'toyota_rav4', 'bmw_x3', 'audi_q5', 'mercedes_c_class', 'volvo_ex60', 'volvo_xc40_recharge', 'volvo_es90'],
  el: ['tesla_model_y', 'volvo_ex30', 'volvo_ex40', 'volvo_ex60', 'volvo_xc40_recharge', 'volvo_ec40', 'kia_ev6', 'hyundai_ioniq5', 'vw_id4', 'polestar_2', 'tesla_model_3', 'skoda_enyaq', 'bmw_ix3', 'bmw_i4', 'audi_q4_etron', 'audi_a6_e_tron', 'mercedes_eqc', 'mercedes_eqa', 'mercedes_eqb'],
  suv: ['tesla_model_y', 'volvo_xc60', 'volvo_xc40', 'volvo_ex60', 'toyota_rav4', 'kia_sportage', 'bmw_x3', 'bmw_x5', 'bmw_x1', 'audi_q5', 'audi_q3', 'audi_q6_etron', 'mercedes_glc', 'mercedes_gle', 'mercedes_gla', 'hyundai_ioniq5', 'honda_crv'],
  hybrid: ['toyota_rav4', 'toyota_corolla', 'volvo_xc60', 'kia_sportage', 'toyota_yaris_cross', 'kia_niro', 'honda_crv', 'bmw_3_series', 'bmw_5_series', 'audi_a3', 'audi_q5', 'mercedes_c_class', 'mercedes_e_class'],
  sedan: ['vw_golf', 'tesla_model_3', 'volvo_es90', 'toyota_corolla', 'audi_a3', 'audi_a4', 'audi_a6', 'bmw_1_series', 'bmw_3_series', 'bmw_5_series', 'mercedes_a_class', 'mercedes_c_class', 'mercedes_e_class', 'honda_civic', 'volvo_v60', 'polestar_2'],
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

const BODY_ALIASES: Record<string, string[]> = {
  suv: ['suv', 'jeep', 'crossover', 'terrängbil', 'stadsjeep', 'offroad', 'fyra'],
  kombi: ['kombi', 'stationsvagn', 'herrgårdsvagn', 'estate', 'touring', 'avant'],
  sedan: ['sedan', 'saloon', 'limousine'],
  hatchback: ['halvkombi', 'hatchback', 'småbil', 'kompakt', 'liten', 'stadsbil', 'stadsbi'],
  mpv: ['mpv', 'minivan', 'familjebuss', 'skåpbil'],
};
const FUEL_ALIASES: Record<string, string[]> = {
  el: ['el', 'elbil', 'electric', 'elektrisk', 'batteri', 'räckvidd', 'ladda', 'ev'],
  hybrid: ['hybrid', 'phev', 'laddhybrid', 'plug', 'mild'],
  bensin: ['bensin', 'petrol', 'fossilt', 'icke-el'],
  diesel: ['diesel', 'olj'],
};
// Maps a query token to a predicate and its score weight
const TRAIT_MAP: Array<{ keys: string[]; check: (c: ComparisonCar) => boolean; weight: number }> = [
  { keys: ['familj', 'barn', 'barnfamilj', 'syskon'], check: c => c.specs.seats >= 5 && (c.specs.trunk_liters || 0) >= 400, weight: 20 },
  { keys: ['hund', 'hundar', 'husdjur', 'djur'], check: c => (c.specs.trunk_liters || 0) >= 450 && (c.specs.body_type === 'suv' || c.specs.body_type === 'kombi'), weight: 22 },
  { keys: ['stor bagage', 'stort bagageutrymme', 'bagageutrymme', 'bagage', 'lastförmåga', 'lastbar'], check: c => (c.specs.trunk_liters || 0) >= 450, weight: 18 },
  { keys: ['billig', 'prisvärd', 'budget', 'förmånlig', 'billigt', 'prisvä'], check: c => c.ratings.value >= 8, weight: 18 },
  { keys: ['ekonomisk', 'snål', 'låg förbrukning', 'driftskostnad', 'drifts'], check: c => c.ratings.value >= 7, weight: 14 },
  { keys: ['lyxig', 'lyx', 'premium', 'exklusiv', 'prestige'], check: c => c.segment === 'premium' || c.segment === 'luxury', weight: 18 },
  { keys: ['sportig', 'sport', 'kul', 'rolig'], check: c => c.ratings.driving >= 8, weight: 18 },
  { keys: ['snabb', 'prestanda', 'perf', 'kraft'], check: c => c.ratings.driving >= 8, weight: 16 },
  { keys: ['bekväm', 'komfort', 'tyst', 'mjuk'], check: c => c.ratings.comfort >= 8, weight: 16 },
  { keys: ['rymlig', 'plats', 'stor', 'utrymme'], check: c => c.ratings.practicality >= 8, weight: 14 },
  { keys: ['säker', 'säkerhet', 'ncap', 'trygg'], check: c => (c.safety.euro_ncap_stars || 0) >= 5, weight: 14 },
  { keys: ['pendl', 'pendling', 'arbetsresa', 'daglig'], check: c => c.ratings.comfort >= 7 && c.ratings.value >= 7, weight: 12 },
  { keys: ['stad', 'stadsk', 'city', 'urban', 'parkera'], check: c => c.specs.body_type === 'hatchback' || c.specs.body_type === 'suv', weight: 14 },
  { keys: ['fyrhjuls', 'allhjuls', 'awd', '4wd', '4x4', 'offroad'], check: c => c.specs.drivetrain.some(d => d === 'awd'), weight: 18 },
  { keys: ['sju', 'sjusitsig', '7-sitsig', '7 sits', '7sits'], check: c => c.specs.seats >= 7, weight: 22 },
  { keys: ['sju sits', 'sjusits', '7sitsig'], check: c => c.specs.seats >= 7, weight: 22 },
  { keys: ['första bil', 'ny bil', 'nybörjar', 'ung', 'unga', 'ung bil'], check: c => c.ratings.value >= 8 && (c.specs.body_type === 'hatchback' || c.specs.body_type === 'suv'), weight: 20 },
  { keys: ['pålitlig', 'tillförlitlig', 'driftsäker', 'robust'], check: c => c.ratings.value >= 7 && (c.safety.euro_ncap_stars || 0) >= 4, weight: 14 },
  { keys: ['lång räckvidd', 'räckvidd', 'lång trip', 'långkörning'], check: c => c.specs.fuel_types.includes('el') && c.ratings.comfort >= 7, weight: 16 },
  { keys: ['miljövänlig', 'grön', 'klimat', 'utsläpp', 'co2'], check: c => c.specs.fuel_types.some(f => f === 'el' || f === 'hybrid' || f === 'laddhybrid'), weight: 16 },
  { keys: ['bäst', 'bästa', 'topp', 'rekommendera', 'populär'], check: c => c.ratings.overall >= 8, weight: 12 },
];

// Detect which body types the query is asking for (may be multiple)
function parseBodyTypes(q: string): string[] {
  const found: string[] = [];
  for (const [bt, aliases] of Object.entries(BODY_ALIASES)) {
    if (aliases.some(a => q.includes(a)) || q.includes(bt)) found.push(bt);
  }
  return found;
}

// Detect which fuel types the query is asking for
function parseFuelTypes(q: string): string[] {
  const found: string[] = [];
  for (const [ft, aliases] of Object.entries(FUEL_ALIASES)) {
    if (aliases.some(a => q.includes(a)) || q.includes(ft)) found.push(ft);
  }
  return found;
}

// Detect brand mention in query — returns brand_id fragments matched
function detectBrandInQuery(q: string): string | null {
  const brands: [string, string][] = [
    ['volvo', 'volvo'], ['tesla', 'tesla'], ['bmw', 'bmw'], ['audi', 'audi'],
    ['mercedes', 'mercedes'], ['toyota', 'toyota'], ['vw', 'volkswagen'], ['volkswagen', 'volkswagen'],
    ['hyundai', 'hyundai'], ['kia', 'kia'], ['skoda', 'skoda'], ['ford', 'ford'],
    ['peugeot', 'peugeot'], ['renault', 'renault'], ['opel', 'opel'], ['seat', 'seat'],
    ['cupra', 'cupra'], ['polestar', 'polestar'], ['honda', 'honda'], ['mazda', 'mazda'],
    ['lexus', 'lexus'], ['porsche', 'porsche'], ['mini', 'mini'], ['subaru', 'subaru'],
    ['nissan', 'nissan'], ['mitsubishi', 'mitsubishi'], ['suzuki', 'suzuki'],
    ['alfa', 'alfa romeo'], ['genesis', 'genesis'], ['mg', 'mg'], ['byd', 'byd'],
    ['landrover', 'land rover'], ['land rover', 'land rover'], ['jeep', 'jeep'],
  ];
  for (const [alias, brand] of brands) {
    if (q.includes(alias)) return brand;
  }
  return null;
}

interface SearchResult {
  score: number;
  qualityBonus: number;
  matchedBody: boolean;
  matchedFuel: boolean;
  matchedBrand: boolean;
}

function searchScoreCar(car: ComparisonCar, query: string): SearchResult {
  const q = query.toLowerCase().replace(/[?!.,]/g, '');
  const name = `${car.brand_display} ${car.model_display}`.toLowerCase();
  const brandLower = car.brand_display.toLowerCase();
  let score = 0;

  const requestedBodyTypes = parseBodyTypes(q);
  const requestedFuelTypes = parseFuelTypes(q);
  const requestedBrand = detectBrandInQuery(q);

  // Exact name match
  if (name.includes(q.replace(/\s+/g, ' ').trim())) return { score: 100, qualityBonus: car.ratings.overall, matchedBody: true, matchedFuel: true, matchedBrand: true };

  // Brand matching — if a brand is specified, only that brand gets brand points
  let matchedBrand = false;
  if (requestedBrand) {
    if (brandLower.includes(requestedBrand) || requestedBrand.includes(brandLower)) {
      score += 35;
      matchedBrand = true;
    } else {
      // Brand was requested but doesn't match — heavy penalty so off-brand cars rank last
      score -= 50;
    }
  } else {
    // No brand requested — small generic name-token match
    const tokens = q.split(/[\s,\-+]+/).filter(t => t.length >= 2);
    for (const token of tokens) {
      if (name.includes(token)) score += 12;
    }
  }

  // Body type compound matching — must match if body type words are present
  let matchedBody = false;
  if (requestedBodyTypes.length > 0) {
    if (requestedBodyTypes.includes(car.specs.body_type)) {
      score += 30;
      matchedBody = true;
    } else {
      score -= 20;
    }
  }

  // Fuel type compound matching
  let matchedFuel = false;
  if (requestedFuelTypes.length > 0) {
    if (requestedFuelTypes.some(ft => car.specs.fuel_types.includes(ft as never))) {
      score += 28;
      matchedFuel = true;
    } else {
      score -= 20;
    }
  }

  // Trait matching — scan the full query for known trait keywords
  for (const { keys, check, weight } of TRAIT_MAP) {
    if (keys.some(k => q.includes(k))) {
      if (check(car)) score += weight;
      // No penalty for not matching traits — they are additive signals
    }
  }

  // Price parsing
  let priceTarget: number | null = null;
  let priceCap = false;
  const pricePatterns = [
    /(?:under|max|upp till|billigare än)\s*(\d[\d\s]*)\s*(?:kr|sek|tusen)?/i,
    /(\d{3,})\s*(?:kr|sek)/i,
    /(\d+)\s*k\b/i,
  ];
  for (const p of pricePatterns) {
    const m = q.match(p);
    if (m) {
      const raw = m[1].replace(/\s/g, '');
      priceTarget = parseInt(raw);
      if (priceTarget < 2000) priceTarget *= 1000;
      priceCap = /under|max|upp till|billigare/i.test(q);
      break;
    }
  }

  if (priceTarget) {
    const newP = car.pricing.new_from_sek;
    const usedP = car.pricing.used_from_sek;
    if (priceCap) {
      if (newP && newP <= priceTarget) score += 18;
      else if (newP && newP <= priceTarget * 1.1) score += 6;
      else if (newP && newP > priceTarget * 1.2) score -= 10;
      if (usedP && usedP <= priceTarget) score += 10;
    } else {
      if (newP) {
        const diff = Math.abs(newP - priceTarget);
        if (diff < 50000) score += 18;
        else if (diff < 100000) score += 10;
        else if (diff < 200000) score += 5;
      }
      if (usedP) {
        const diff = Math.abs(usedP - priceTarget);
        if (diff < 50000) score += 10;
        else if (diff < 100000) score += 5;
      }
    }
  }

  // Quality bonus for tiebreaking — not added to score directly, used in sort
  const qualityBonus = car.ratings.overall * 1.5 + car.ratings.value;

  return { score: Math.max(0, score), qualityBonus, matchedBody, matchedFuel, matchedBrand };
}

function buildResponseText(q: string, count: number, isFuzzy: boolean): string {
  const requestedBrand = detectBrandInQuery(q.toLowerCase());
  const requestedBodyTypes = parseBodyTypes(q.toLowerCase());
  const requestedFuelTypes = parseFuelTypes(q.toLowerCase());

  const fuelLabel: Record<string, string> = { el: 'elbilar', hybrid: 'hybridbilar', bensin: 'bensinbilar', diesel: 'dieselbilar' };
  const bodyLabel: Record<string, string> = { suv: 'SUV', kombi: 'kombis', sedan: 'sedaner', hatchback: 'halvkombis', mpv: 'familjebilar' };

  if (count === 0) {
    const tips: string[] = [];
    if (requestedBrand) tips.push(`Prova utan märkesfilter`);
    if (requestedBodyTypes.length > 0 && requestedFuelTypes.length > 0) tips.push(`Prova bara "${requestedBodyTypes[0]}" eller bara "${requestedFuelTypes[0] === 'el' ? 'elbil' : requestedFuelTypes[0]}"`);
    const tipText = tips.length > 0 ? ` ${tips[0]}, eller beskriv med andra ord.` : ' Prova t.ex. "familje-SUV", "elbil under 400 000 kr" eller "sportig kombi".';
    return `Inga bilar matchade exakt vad du sökte.${tipText}`;
  }

  if (isFuzzy) return 'Jag är inte 100% säker, men dessa liknar det du söker:';

  const parts: string[] = [];
  if (requestedBrand) parts.push(requestedBrand.charAt(0).toUpperCase() + requestedBrand.slice(1));
  if (requestedBodyTypes.length > 0) parts.push(bodyLabel[requestedBodyTypes[0]] || requestedBodyTypes[0]);
  if (requestedFuelTypes.length > 0) parts.push(fuelLabel[requestedFuelTypes[0]] || requestedFuelTypes[0]);

  const q_lower = q.toLowerCase();
  const traitHints: string[] = [];
  if (/sportig|sport/.test(q_lower)) traitHints.push('sportig körning');
  if (/hund|husdjur/.test(q_lower)) traitHints.push('stort lastutrymme');
  if (/familj|barn/.test(q_lower)) traitHints.push('familjepraktisk');
  if (/billig|budget|prisvärd/.test(q_lower)) traitHints.push('prisvärda');
  if (/bästa|bäst|topp/.test(q_lower)) traitHints.push('högst betyg');

  let intro = '';
  if (parts.length > 0) {
    intro = `Här är de bästa ${parts.join('-')} alternativen`;
    if (traitHints.length > 0) intro += ` med ${traitHints[0]}`;
    intro += ':';
  } else if (traitHints.length > 0) {
    intro = `Här är ${count === 1 ? 'ett förslag' : `${count} förslag`} med ${traitHints.join(' och ')}:`;
  } else {
    intro = count <= 2
      ? `Här är ${count === 1 ? 'ett förslag' : 'två förslag'} som matchar:`
      : `Jag hittade ${count} bilar som passar ditt behov:`;
  }
  return intro;
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
  carPrice?: number;
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
  reformulations?: string[];
}

type QuizStep = 'idle' | 'active' | 'analyzing' | 'results';

/* ───────────── nav ───────────── */

const NAV_ITEMS = ['Så funkar det', 'Köp bil'] as const;

interface CompareCarsPageProps {
  onBackHome: () => void;
}

/* ───────────── Monthly cost calculator ───────────── */

const CALC_RATE = 0.0649;
const CALC_TERM = 36;
const CALC_DOWN_PAYMENT_PCT = 0.20;
const RESIDUAL_OPTIONS = [50, 55] as const;
type ResidualPct = typeof RESIDUAL_OPTIONS[number];

function MonthlyCalcSection() {
  const [price, setPrice] = useState(470000);
  const [residualPct, setResidualPct] = useState<ResidualPct>(55);

  const { monthly, downPayment, loanAmount, residualAmount } = useMemo(() => {
    const r = CALC_RATE / 12;
    const n = CALC_TERM;
    const down = Math.round(price * CALC_DOWN_PAYMENT_PCT);
    const loan = price - down;
    const residual = Math.round(price * (residualPct / 100));
    // Annuity with balloon (residual value): PV of residual discounted back, then standard annuity
    const pv = loan - residual / Math.pow(1 + r, n);
    const m = Math.round((pv * r) / (1 - Math.pow(1 + r, -n)));
    return { monthly: m, downPayment: down, loanAmount: loan, residualAmount: residual };
  }, [price, residualPct]);

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-50 border-t border-slate-100">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight mb-2">
            Beräkna månadskostnad
          </h2>
          <p className="text-[13px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            Ange bilpris – månadskostnaden beräknas automatiskt med finansiering, kontantinsats och restvärde.
          </p>
        </div>

        {/* Monthly result display */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(14,110,254,0.1)] ring-1 ring-[#d6e8ff] px-6 pt-6 pb-6 mb-6 text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Uppskattad månadskostnad</p>
          <div className="flex items-end justify-center gap-2 mb-2">
            <span className="text-[52px] sm:text-[60px] font-extrabold text-[#0e6efe] leading-none tabular-nums">
              {monthly.toLocaleString('sv-SE')}
            </span>
            <span className="text-[20px] font-bold text-slate-400 mb-1.5">kr/mån</span>
          </div>
          <p className="text-[12px] text-slate-400">
            6,49% ränta · {CALC_TERM} månader · 20% kontantinsats · {residualPct}% restvärde
          </p>

          {/* Summary pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              { label: 'Kontantinsats', value: downPayment.toLocaleString('sv-SE') + ' kr' },
              { label: 'Lånesumma', value: loanAmount.toLocaleString('sv-SE') + ' kr' },
              { label: 'Restvärde', value: residualAmount.toLocaleString('sv-SE') + ' kr' },
            ].map(p => (
              <div key={p.label} className="px-3 py-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-medium">{p.label}</p>
                <p className="text-[12px] font-bold text-slate-700 tabular-nums">{p.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bilpris slider */}
        <div className="mb-6 text-center">
          <label className="text-[13px] font-semibold text-slate-700 block mb-1">Bilpris</label>
          <span className="text-[22px] font-extrabold text-slate-900 tabular-nums block mb-3">{price.toLocaleString('sv-SE')} kr</span>
          <input
            type="range"
            min={50000}
            max={1200000}
            step={5000}
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full h-2 accent-[#0e6efe] rounded-full cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>50 000 kr</span>
            <span>1 200 000 kr</span>
          </div>
        </div>

        {/* Residual value toggle */}
        <div className="mb-6">
          <label className="text-[13px] font-semibold text-slate-700 block mb-2.5 text-center">Restvärde</label>
          <div className="flex gap-3">
            {RESIDUAL_OPTIONS.map(opt => (
              <label
                key={opt}
                className={`flex items-center gap-2.5 flex-1 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                  residualPct === opt
                    ? 'border-[#0e6efe] bg-[#f0f7ff]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  residualPct === opt ? 'border-[#0e6efe]' : 'border-slate-300'
                }`}>
                  {residualPct === opt && (
                    <div className="w-2 h-2 rounded-full bg-[#0e6efe]" />
                  )}
                </div>
                <input
                  type="radio"
                  className="sr-only"
                  name="residual"
                  value={opt}
                  checked={residualPct === opt}
                  onChange={() => setResidualPct(opt)}
                />
                <div>
                  <span className={`text-[14px] font-bold block ${residualPct === opt ? 'text-[#0e6efe]' : 'text-slate-700'}`}>
                    {opt}%
                  </span>
                  {opt === 55 && (
                    <span className="text-[10px] text-slate-400 font-medium">Standard</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          Kalkylen är en uppskattning. Faktisk månadskostnad beror på kreditgivare och individuella villkor.
        </p>
      </div>
    </section>
  );
}

/* ═════════════ MAIN COMPONENT ═════════════ */

export default function CompareCarsPage({ onBackHome }: CompareCarsPageProps) {
  const allCarsRaw = useMemo(() => getAllComparisonCars(), []);
  const { getCarImage, catalogCars } = useCarImages();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [detailCar, setDetailCar] = useState<ComparisonCar | null>(null);
  const [fitQuizCar, setFitQuizCar] = useState<ComparisonCar | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('alla');
  const [showAllCars, setShowAllCars] = useState(false);

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
  const [selectedQuizCars, setSelectedQuizCars] = useState<Set<string>>(new Set());

  // Buy drawer
  const [buyDrawerCar, setBuyDrawerCar] = useState<string | null>(null);
  const [buyDrawerTrack, setBuyDrawerTrack] = useState<'found' | 'searching' | 'trade' | undefined>(undefined);
  const [buyDrawerSkipIntent, setBuyDrawerSkipIntent] = useState(false);
  const [buyDrawerEquity, setBuyDrawerEquity] = useState<string>('');
  const [quizPreselectedCar, setQuizPreselectedCar] = useState<string | undefined>(undefined);

  const openBuyDrawer = (car: string, track?: 'found' | 'searching' | 'trade', skipIntent?: boolean, equitySummary?: string) => {
    setBuyDrawerTrack(track);
    setBuyDrawerSkipIntent(!!skipIntent);
    setBuyDrawerEquity(equitySummary ?? '');
    setBuyDrawerCar(car);
  };

  // Bilto Score info
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false);

  // Bilbyte hero section
  const [bilbyteReg, setBilbyteReg] = useState('');
  const [bilbyteRegError, setBilbyteRegError] = useState(false);

  // Budget filter state
  const [activeBudget, setActiveBudget] = useState<number | null>(null);
  const [budgetShowCount, setBudgetShowCount] = useState(6);
  const budgetGridRef = useRef<HTMLDivElement>(null);
  const [expertShowCount, setExpertShowCount] = useState(6);


  const navigateToSell = useCallback(() => {
    window.history.pushState({}, '', '/salj');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    document.title = 'Köp bil -- Jämför, hitta & förhandla | Bilto';
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('quiz') === 'start') {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => {
        quizSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setQuizStep('active');
      }, 300);
    }
  }, []);

  const allCarsMap = useMemo(() => {
    const map = new Map<string, ComparisonCar>();
    allCarsRaw.forEach(c => map.set(c.id, c));
    return map;
  }, [allCarsRaw]);

  const getCuratedList = useCallback((ids: string[]) =>
    ids.map(id => allCarsMap.get(id)).filter((c): c is ComparisonCar => !!c),
  [allCarsMap]);

  const [carSearchQuery, setCarSearchQuery] = useState('');

  // Normalized key set of comparison cars to filter duplicates from catalog search
  const comparisonKeySet = useMemo(() => {
    const set = new Set<string>();
    allCarsRaw.forEach(c => set.add(`${c.brand_display} ${c.model_display}`.toLowerCase().replace(/\s+/g, ' ')));
    return set;
  }, [allCarsRaw]);

  // Catalog-only cars that don't exist in comparison data and are active
  const catalogOnlyCars = useMemo((): CatalogCar[] => {
    return catalogCars.filter(c => {
      if (!c.is_active) return false;
      const key = `${c.make} ${c.model}`.toLowerCase().replace(/\s+/g, ' ');
      return !comparisonKeySet.has(key);
    });
  }, [catalogCars, comparisonKeySet]);

  const allCategoryCars = useMemo(() => {
    const q = carSearchQuery.trim().toLowerCase();
    if (q) {
      return allCarsRaw.filter(c =>
        `${c.brand_display} ${c.model_display}`.toLowerCase().includes(q)
      );
    }
    const ids = CATEGORY_IDS[activeCategory];
    if (ids === null) {
      // "Alla" — visa alla aktiva bilar sorterade: kurerade först, sedan resten alfabetiskt
      const curatedSet = new Set(CURATED_IDS);
      const curated = getCuratedList(CURATED_IDS);
      const rest = allCarsRaw
        .filter(c => !curatedSet.has(c.id))
        .sort((a, b) => `${a.brand_display} ${a.model_display}`.localeCompare(`${b.brand_display} ${b.model_display}`, 'sv'));
      return [...curated, ...rest];
    }
    return getCuratedList(ids);
  }, [activeCategory, getCuratedList, carSearchQuery, allCarsRaw]);

  // Catalog-only results that match the search query
  const catalogSearchResults = useMemo((): CatalogCar[] => {
    const q = carSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return catalogOnlyCars.filter(c =>
      `${c.make} ${c.model}`.toLowerCase().includes(q)
    );
  }, [carSearchQuery, catalogOnlyCars]);

  const visibleCars = useMemo(() => {
    if (carSearchQuery.trim()) return allCategoryCars;
    if (activeCategory === 'el') return allCategoryCars;
    return showAllCars ? allCategoryCars : allCategoryCars.slice(0, expertShowCount);
  }, [allCategoryCars, showAllCars, carSearchQuery, expertShowCount, activeCategory]);

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
        const monthly = calcCarMonthly(car.pricing.new_from_sek, 0.55);
        return activeBudget === 0 ? true : monthly <= activeBudget;
      })
      .sort((a, b) => (a.pricing.new_from_sek || 0) - (b.pricing.new_from_sek || 0));
  }, [activeBudget, allCarsRaw, getCarImage]);

  // Chat
  const handleChatSubmit = (overrideInput?: string) => {
    const q = (overrideInput ?? chatInput).trim();
    if (!q) return;
    const userMsg: ChatMessage = { role: 'user', text: q };

    const allScored = allCarsRaw
      .map(car => {
        const result = searchScoreCar(car, q);
        return { car, ...result };
      })
      .sort((a, b) => (b.score + b.qualityBonus * 0.3) - (a.score + a.qualityBonus * 0.3));

    // Primary: score >= 15 (meaningful match)
    let candidates = allScored.filter(r => r.score >= 15);

    // Ensure brand diversity: max 2 per brand
    const brandCount: Record<string, number> = {};
    const diverse = candidates.filter(r => {
      const b = r.car.brand_display;
      brandCount[b] = (brandCount[b] || 0) + 1;
      return brandCount[b] <= 2;
    });
    candidates = diverse.slice(0, 6);

    let isFuzzy = false;
    if (candidates.length === 0) {
      // Fuzzy fallback: best 4 by quality+score
      candidates = allScored.filter(r => r.score >= 5).slice(0, 4);
      isFuzzy = candidates.length > 0;
    }

    // Zero-result reformulation hints
    let reformulationSuggestions: string[] = [];
    if (candidates.length === 0) {
      const qLower = q.toLowerCase();
      const rb = detectBrandInQuery(qLower);
      const rbt = parseBodyTypes(qLower);
      const rft = parseFuelTypes(qLower);
      if (rb && (rbt.length > 0 || rft.length > 0)) {
        if (rbt.length > 0) reformulationSuggestions.push(`Bästa ${rbt[0]}`);
        if (rft.length > 0) reformulationSuggestions.push(`Bästa ${rft[0] === 'el' ? 'elbilen' : rft[0]}`);
        reformulationSuggestions.push(`${rb.charAt(0).toUpperCase() + rb.slice(1)} ${rbt[0] || rft[0] || 'SUV'}`);
      } else {
        reformulationSuggestions = ['Familje-SUV under 400k', 'Bästa elbilen', 'Sportig kombi'];
      }
    }

    const responseText = buildResponseText(q, candidates.length, isFuzzy);
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      text: responseText,
      cars: candidates.map(r => r.car),
      reformulations: reformulationSuggestions,
    };
    setChatMessages(prev => [...prev, userMsg, assistantMsg]);
    setChatInput('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const openContactForCar = (car: ComparisonCar | null) => {
    const name = car ? `${car.brand_display} ${car.model_display}` : '';
    openBuyDrawer(name || '', undefined, false);
  };

  const handleNavSelect = (item: string) => {
    if (item === 'Så funkar det') {
      document.getElementById('sa-funkar-det')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    setSelectedQuizCars(new Set());
  };

  const toggleQuizCarSelection = (key: string) => {
    setSelectedQuizCars(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else if (next.size < 3) {
        next.add(key);
      }
      return next;
    });
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
          const basePrice = compData?.pricing.new_from_sek || compData?.pricing.used_from_sek;
          return {
            make: car.make, model: car.model,
            image_url: car.image_url, cleaned_image_url: car.cleaned_image_url,
            matchScore: score, matchReasons: reasons,
            bodyType, fuelType, fuelLabel,
            rating: compData?.ratings.overall ?? undefined,
            trunkLiters: compData?.specs.trunk_liters ?? undefined,
            carPrice: basePrice ?? undefined,
            usedPrice: compData?.pricing.used_from_sek ?? undefined,
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
              <button key={item} type="button" onClick={() => handleNavSelect(item)} className={`text-[15px] transition ${item === 'Köp bil' ? 'text-white font-semibold' : 'text-white/80 hover:text-white'}`}>
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center ml-auto">
            <a href="/logga-in" className="inline-flex items-center gap-2 bg-white text-[#0e6efe] text-[14px] font-semibold px-5 h-10 rounded-full hover:bg-slate-100 transition whitespace-nowrap">
              <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
              Mina erbjudanden
            </a>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Köp bil"
        onSelect={(item) => {
          setMenuOpen(false);
          if (item === 'Så funkar det') {
            setTimeout(() => document.getElementById('sa-funkar-det')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
          } else onBackHome();
        }}
      />

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-12 sm:pb-16 px-5 sm:px-6 bg-[#0e6efe] relative overflow-hidden">
        <div className="absolute -left-32 top-16 w-[500px] h-[500px] rounded-full bg-[#3d8cff] opacity-40" />
        <div className="absolute right-0 -bottom-32 w-[400px] h-[400px] rounded-full bg-[#3d8cff] opacity-30" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-[26px] sm:text-[44px] font-bold leading-[1.1] tracking-tight text-white">
            Hitta din dr&ouml;mbil och f&ouml;rhandla priset
          </h1>
          <p className="mt-3 sm:mt-4 text-white/80 text-[14px] sm:text-[17px] leading-[1.6] max-w-xl mx-auto">
            J&auml;mf&ouml;r bilar, hitta r&auml;tt modell och l&aring;t oss f&ouml;rhandla fram b&auml;sta priset &aring;t dig. Helt gratis och opartiskt.
          </p>
          <div className="mt-6 flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-3 max-w-2xl mx-auto">
            {/* Hittat bil */}
            <button
              onClick={() => openBuyDrawer('', 'found')}
              className="group flex sm:flex-col items-center sm:items-center gap-2.5 sm:gap-2 bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/50 rounded-xl sm:rounded-2xl px-3 py-2.5 sm:py-5 transition-all duration-200 text-white text-left sm:text-center"
            >
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center shrink-0 transition-colors">
                <CheckCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 sm:flex-none">
                <span className="font-bold text-[13px] sm:text-[15px] block leading-snug">Jag har hittat en bil</span>
                <span className="text-white/70 text-[11px] sm:text-[12px] leading-snug">L&aring;t oss f&ouml;rhandla och granska &aring;t dig</span>
              </div>
            </button>

            {/* Letar bil — now opens the searching form */}
            <button
              onClick={() => openBuyDrawer('', 'searching')}
              className="group flex sm:flex-col items-center sm:items-center gap-2.5 sm:gap-2 bg-white hover:bg-slate-50 rounded-xl sm:rounded-2xl px-3 py-2.5 sm:py-5 transition-all duration-200 text-[#0e6efe] shadow-lg text-left sm:text-center"
            >
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#0e6efe]/10 group-hover:bg-[#0e6efe]/20 flex items-center justify-center shrink-0 transition-colors">
                <Search className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 sm:flex-none">
                <span className="font-bold text-[13px] sm:text-[15px] block leading-snug">Jag letar efter bil</span>
                <span className="text-slate-500 text-[11px] sm:text-[12px] leading-snug">Utforska, j&auml;mf&ouml;r eller testa bilmatch</span>
              </div>
            </button>

            {/* Byta bil */}
            <button
              onClick={() => openBuyDrawer('', 'trade')}
              className="group flex sm:flex-col items-center sm:items-center gap-2.5 sm:gap-2 bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/50 rounded-xl sm:rounded-2xl px-3 py-2.5 sm:py-5 transition-all duration-200 text-white text-left sm:text-center"
            >
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center shrink-0 transition-colors">
                <ArrowLeftRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 sm:flex-none">
                <span className="font-bold text-[13px] sm:text-[15px] block leading-snug">Jag vill byta bil</span>
                <span className="text-white/70 text-[11px] sm:text-[12px] leading-snug">Vi hittar och f&ouml;rhandlar n&auml;sta bil &aring;t dig</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Browse by budget */}
      <section className="py-10 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-7 sm:mb-10">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">
              <Zap className="w-3.5 h-3.5" />
              Hitta rätt nivå
            </span>
            <h2 className="text-[26px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight">
              Sök efter budget
            </h2>
            <p className="text-[13px] sm:text-[14px] text-slate-400 mt-1.5">Baserat på finansiering över 60 månader</p>
          </div>

          {/* Mobile: horizontal carousel / Desktop: 6-col grid */}
          <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide snap-x snap-mandatory -mx-4 sm:mx-0 px-4 sm:px-0">
            {BUDGET_BRACKETS.map((bracket, i) => {
              const car = allCarsRaw.find(c => c.id === bracket.carId);
              const img = car ? resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage) : undefined;
              const isActive = activeBudget === bracket.maxMonthly;
              return (
                <motion.button
                  key={bracket.label}
                  type="button"
                  initial={isMobile ? false : { opacity: 0, y: 20 }}
                  {...(!isMobile && { whileInView: { opacity: 1, y: 0 }, viewport: { once: true } })}
                  transition={{ duration: isMobile ? 0 : 0.35, delay: isMobile ? 0 : i * 0.06 }}
                  onClick={() => {
                    if (isActive) {
                      setActiveBudget(null);
                    } else {
                      setActiveBudget(bracket.maxMonthly);
                      setBudgetShowCount(6);
                      setTimeout(() => budgetGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
                    }
                  }}
                  className={`flex flex-col rounded-2xl overflow-hidden group transition-all duration-300 shrink-0 snap-start w-[140px] sm:w-auto ${
                    isActive
                      ? 'shadow-[0_8px_28px_rgba(14,110,254,0.22)] bg-white'
                      : 'ring-1 ring-slate-100 hover:ring-slate-200 hover:shadow-lg bg-white'
                  }`}
                >
                  {/* Top accent bar */}
                  <div className={`h-1 w-full transition-all duration-300 ${isActive ? 'bg-[#0e6efe]' : 'bg-transparent'}`} />
                  <div className="w-full aspect-[4/3] flex items-end justify-center overflow-hidden relative">
                    {img ? (
                      <img src={img} alt="" loading="lazy" className={`w-full h-auto object-contain transition-transform duration-500 ${isActive ? 'scale-[1.06]' : 'group-hover:scale-[1.05]'}`} />
                    ) : (
                      <Car className="w-12 h-12 text-slate-300 mb-4" />
                    )}
                  </div>
                  <div className="px-2 pt-2 pb-3">
                    <p className={`text-[11px] sm:text-[12px] font-extrabold text-center leading-tight transition-colors ${isActive ? 'text-[#0e6efe]' : 'text-slate-700 group-hover:text-[#0e6efe]'}`}>
                      {bracket.label}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Budget filtered results — full-width stripe */}
        <AnimatePresence>
          {activeBudget !== null && (
            <motion.div
              ref={budgetGridRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden"
            >
              <div className="mt-8 bg-[#f4f8ff] border-y border-[#d6e8ff]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                  {/* Contextual header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[17px] sm:text-[20px] font-extrabold text-slate-900">
                          {activeBudget === 0 ? 'Alla bilar' : `Bilar under ${activeBudget.toLocaleString('sv-SE')} kr/mån`}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-[#0e6efe] text-white text-[11px] font-bold">
                          {budgetFilteredCars.length} st
                        </span>
                      </div>
                      {activeBudget > 0 && (
                        <p className="text-[12px] text-slate-500 mt-1">
                          Månadskostnad beräknad på finansiering 60 månader · Alla bilar passar din budget
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveBudget(null)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 hover:text-slate-700 transition-colors self-start sm:self-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                      Rensa filter
                    </button>
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {budgetFilteredCars.slice(0, budgetShowCount).map((car, i) => {
                      const imgUrl = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
                      if (car.specs.fuel_types.includes('el')) {
                        return (
                          <ElCarCard
                            key={car.id}
                            name={`${car.brand_display} ${car.model_display}`}
                            imageUrl={imgUrl}
                            rating={car.ratings.overall}
                            expertComment={getExpertComment(car)}
                            carPrice={car.pricing.new_from_sek ?? undefined}
                            usedPrice={car.pricing.used_from_sek ?? undefined}
                            isCompared={selectedIds.has(car.id)}
                            onNegotiate={() => openContactForCar(car)}
                            onDetail={() => setDetailCar(car)}
                            onCompare={() => toggleSelect(car.id)}
                            onFitQuiz={() => setFitQuizCar(car)}
                          />
                        );
                      }
                      return (
                        <CompactCarCard
                          key={car.id}
                          name={`${car.brand_display} ${car.model_display}`}
                          imageUrl={imgUrl}
                          rating={car.ratings.overall}
                          fuelLabel={car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')}
                          carPrice={car.pricing.new_from_sek ?? undefined}
                          usedPrice={car.pricing.used_from_sek ?? undefined}
                          onNegotiate={() => openContactForCar(car)}
                          onDetail={() => setDetailCar(car)}
                          onCompare={() => toggleSelect(car.id)}
                          onFitQuiz={() => setFitQuizCar(car)}
                          isCompared={selectedIds.has(car.id)}
                          index={i}
                          disableMotion={isMobile}
                        />
                      );
                    })}
                  </div>

                  {/* Visa fler */}
                  {budgetFilteredCars.length > budgetShowCount && (
                    <div className="text-center mt-6">
                      <button
                        type="button"
                        onClick={() => setBudgetShowCount(prev => prev + 6)}
                        className="inline-flex items-center gap-2 h-11 px-8 rounded-full bg-white ring-1 ring-slate-200 hover:ring-[#0e6efe] text-slate-700 hover:text-[#0e6efe] text-[13px] font-semibold transition-all duration-200 shadow-sm"
                      >
                        Visa fler bilar
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Monthly cost calculator */}
      <MonthlyCalcSection />

      {/* Bilmatch Section */}
      <section id="quiz-section" ref={quizSectionRef} className="py-14 sm:py-20 lg:py-28 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {quizStep === 'idle' && (
              <motion.div key="quiz-idle" initial={isMobile ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ touchAction: 'pan-y' }}>
                <div className="flex flex-col lg:items-center">
                  <div className="text-center lg:flex-1 w-full">
                    <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.18em] mb-4">
                      <Sparkles className="w-3.5 h-3.5" />
                      Bilmatch
                    </span>
                    <h2 className="text-[36px] sm:text-[38px] lg:text-[52px] font-bold text-slate-900 tracking-tight leading-[1.05] mb-4">
                      Hitta din<br />bilmatch
                    </h2>
                    <p className="text-slate-500 text-[16px] sm:text-[16px] lg:text-[18px] leading-relaxed mb-6 max-w-md mx-auto">
                      Svara på 5 korta frågor om hur du kör, vad du prioriterar och din budget — vi matchar dig med de bilar som passar dig bäst.
                    </p>
                    <ul className="hidden lg:flex flex-col gap-3 mb-8 max-w-sm mx-auto items-start">
                      {[
                        'Personlig rekommendation på under 60 sekunder',
                        'Jämför matchade bilar sida vid sida',
                        'Låt oss hjälpa dig köpa till bästa pris',
                      ].map(item => (
                        <li key={item} className="flex items-center gap-3 text-[15px] text-slate-600">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setQuizStep('active')}
                      className="w-full max-w-sm mx-auto h-16 rounded-2xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-bold text-[18px] flex items-center justify-center gap-3 group transition-all duration-200 shadow-xl shadow-[#0e6efe]/25 active:scale-[0.98]"
                    >
                      Hitta din bilmatch
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[14px] text-slate-400 mt-3 text-center">Tar 60 sekunder · Helt gratis</p>

                    {/* Equity quiz CTA */}
                    <div className="mt-4 max-w-sm mx-auto">
                      <EquityFlow
                        compact
                        onNegotiate={(carLabel, equitySummary) => openBuyDrawer(carLabel, undefined, false, equitySummary)}
                      />
                    </div>
                  </div>
                  <div className="hidden lg:grid-cols-2 lg:gap-4 lg:w-[380px] lg:shrink-0">
                    {['tesla_model_y', 'volvo_xc60', 'kia_ev6', 'hyundai_ioniq5'].map((cid, i) => {
                      const car = allCarsRaw.find(c => c.id === cid);
                      if (!car) return null;
                      const img = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
                      return (
                        <motion.div
                          key={cid}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.1 }}
                          className="aspect-[4/3] rounded-2xl bg-white border border-slate-100 shadow-sm flex items-end justify-center overflow-hidden p-2"
                        >
                          {img && <img src={img} alt={`${car.brand_display} ${car.model_display}`} className="w-full h-auto object-contain" />}
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="flex lg:hidden items-center justify-center gap-3 mt-8">
                    {['tesla_model_y', 'volvo_xc60', 'kia_ev6'].map((cid) => {
                      const car = allCarsRaw.find(c => c.id === cid);
                      if (!car) return null;
                      const img = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
                      return (
                        <div key={cid} className="w-[100px] sm:w-[130px] aspect-[4/3] rounded-xl bg-white border border-slate-100 flex items-end justify-center overflow-hidden">
                          {img && <img src={img} alt="" className="w-full h-auto object-contain" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
            {quizStep === 'active' && (
              <motion.div key="quiz-active-top" initial={isMobile ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ touchAction: 'pan-y' }} className="max-w-lg mx-auto">
                <QuizFlow onComplete={handleQuizComplete} onBack={handleQuizReset} preselectedCar={quizPreselectedCar} />
              </motion.div>
            )}
            {quizStep === 'analyzing' && quizAnswers && (
              <motion.div key="quiz-analyzing-top" initial={isMobile ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ touchAction: 'pan-y' }} className="max-w-sm mx-auto">
                <QuizComplete answers={quizAnswers} isAnalysisReady={analysisReady} onShowResults={handleQuizShowResults} />
              </motion.div>
            )}
            {quizStep === 'results' && (
              <motion.div key="quiz-results-top" initial={isMobile ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ touchAction: 'pan-y' }}>
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
                  <>
                    <p className="text-[12px] text-slate-400 mb-3">
                      {selectedQuizCars.size === 0
                        ? 'Välj upp till 3 bilar du är intresserad av'
                        : selectedQuizCars.size === 3
                        ? 'Max 3 bilar valda — avmarkera för att byta'
                        : `${selectedQuizCars.size} av 3 bil${selectedQuizCars.size > 1 ? 'ar' : ''} vald${selectedQuizCars.size > 1 ? 'a' : ''}`}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      {quizResults.map((car, i) => {
                        const key = `${car.make}-${car.model}`;
                        const isSelected = selectedQuizCars.has(key);
                        const atMax = selectedQuizCars.size >= 3 && !isSelected;
                        const compData = findComparisonCarByMakeModel(car.make, car.model);
                        const isElbil = compData?.specs.fuel_types.includes('el') ?? false;
                        return (
                          <div key={key} className={atMax ? 'opacity-50 pointer-events-none' : ''}>
                            {isElbil ? (
                              <ElCarCard
                                name={`${car.make} ${car.model}`}
                                imageUrl={car.cleaned_image_url || car.image_url}
                                rating={car.rating}
                                topBadge={i === 0}
                                expertComment={car.matchReasons.join(' · ') || undefined}
                                carPrice={car.carPrice}
                                usedPrice={car.usedPrice}
                                onNegotiate={() => openBuyDrawer(`${car.make} ${car.model}`, undefined, false)}
                                onDetail={() => { if (compData) setDetailCar(compData); }}
                              />
                            ) : (
                              <CompactCarCard
                                name={`${car.make} ${car.model}`}
                                imageUrl={car.cleaned_image_url || car.image_url}
                                rating={car.rating}
                                topBadge={i === 0}
                                expertComment={car.matchReasons.join(' · ') || undefined}
                                fuelLabel={car.fuelLabel}
                                carPrice={car.carPrice}
                                usedPrice={car.usedPrice}
                                isSelected={isSelected}
                                onSelect={() => toggleQuizCarSelection(key)}
                                onNegotiate={() => openBuyDrawer(`${car.make} ${car.model}`, undefined, false)}
                                onDetail={() => { if (compData) setDetailCar(compData); }}
                                index={i}
                                disableMotion={isMobile}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <AnimatePresence>
                      {selectedQuizCars.size > 0 && (
                        <motion.div
                          key="quiz-action-bar-top"
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 16 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          style={{ touchAction: 'pan-y' }}
                          className="mt-6 rounded-2xl bg-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shadow-xl"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white mb-1">
                              {selectedQuizCars.size === 1 ? '1 bil vald' : `${selectedQuizCars.size} bilar valda`}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {quizResults
                                .filter(c => selectedQuizCars.has(`${c.make}-${c.model}`))
                                .map(c => (
                                  <span key={`${c.make}-${c.model}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-medium text-white/90">
                                    {c.make} {c.model}
                                  </span>
                                ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedQuizCars(new Set())}
                              className="h-10 px-3 rounded-xl text-[12px] font-medium text-white/60 hover:text-white hover:bg-white/10 transition"
                            >
                              Rensa
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const names = quizResults
                                  .filter(c => selectedQuizCars.has(`${c.make}-${c.model}`))
                                  .map(c => `${c.make} ${c.model}`)
                                  .join(', ');
                                openBuyDrawer(names, 'searching');
                              }}
                              className="h-10 px-5 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[13px] font-bold inline-flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#0e6efe]/30"
                            >
                              Gå vidare — vi ringer dig
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
                      <Car className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-[14px] text-slate-500 mb-4">Vi hjälper dig ändå -- kontakta oss så hittar vi rätt bil.</p>
                    <button onClick={() => setBuyDrawerCar('')} className="h-11 px-6 rounded-xl bg-[#0e6efe] text-white font-semibold text-[14px] inline-flex items-center gap-2 transition">
                      Kontakta oss <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="mt-6 flex items-center justify-center">
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
      <section id="sa-funkar-det" className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[20px] sm:text-[28px] font-bold text-slate-900 text-center mb-8 sm:mb-10">Så fungerar det</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: '1', title: 'Hitta din bil', desc: 'Jämför våra toppval, använd vår smarta sökning eller testa bilmatch för att hitta rätt.', icon: Search },
              { step: '2', title: 'Vi förhandlar åt dig', desc: 'Vi kontaktar säljaren, pressar priset och granskar bilen åt dig. Du slipper förhandla själv.', icon: Megaphone },
              { step: '3', title: 'Affären är klar', desc: 'Du kan tuta och köra med gott samvete -- vi har sett till att du gjort en riktigt bra deal.', icon: Handshake },
            ].map(s => {
              const StepIcon = s.icon;
              return (
              <div key={s.step} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 sm:text-center">
                <div className="w-10 h-10 rounded-full bg-[#0e6efe] text-white flex items-center justify-center shrink-0 sm:mb-3">
                  <StepIcon className="w-[18px] h-[18px]" strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-slate-900 mb-1">{s.title}</p>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curated grid */}
      <section
        id="cars-grid"
        className={`py-10 sm:py-16 px-4 sm:px-6 transition-colors duration-500 ${
          activeCategory === 'el'
            ? 'bg-[#070e1a]'
            : 'bg-slate-50'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <h2 className={`text-[20px] sm:text-[28px] font-bold transition-colors duration-300 ${activeCategory === 'el' ? 'text-white' : 'text-slate-900'}`}>
                {activeCategory === 'el' ? 'Elbilar' : 'Experternas val'}
              </h2>
              <p className={`text-[13px] mt-0.5 transition-colors duration-300 ${activeCategory === 'el' ? 'text-slate-400' : 'text-slate-400'}`}>
                {activeCategory === 'el'
                  ? 'Alla bilar kör enbart på el — välj ett kort för att jämföra'
                  : 'Markera bilar för att jämföra dem sida vid sida'}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${activeCategory === 'el' ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                value={carSearchQuery}
                onChange={e => { setCarSearchQuery(e.target.value); setActiveCategory('alla'); setShowAllCars(false); }}
                placeholder="Sök märke eller modell…"
                className={`w-full h-10 pl-9 pr-9 rounded-full ring-1 focus:ring-2 focus:ring-[#0e6efe] outline-none text-[13px] placeholder:text-slate-500 transition-all ${
                  activeCategory === 'el'
                    ? 'bg-white/8 ring-white/15 text-white'
                    : 'bg-white ring-slate-200 text-slate-800 placeholder:text-slate-400'
                }`}
              />
              {carSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCarSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-1 px-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key && !carSearchQuery;
              const isElMode = activeCategory === 'el';
              return (
                <button
                  key={cat.key}
                  onClick={() => { setActiveCategory(cat.key); setShowAllCars(false); setCarSearchQuery(''); setExpertShowCount(6); }}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                    isActive
                      ? cat.key === 'el'
                        ? 'bg-[#38bdf8] text-[#0c1a2e] shadow-md shadow-[#38bdf8]/30'
                        : 'bg-[#0e6efe] text-white shadow-md shadow-[#0e6efe]/20'
                      : isElMode
                        ? 'bg-white/8 text-slate-300 ring-1 ring-white/15 hover:ring-white/30 hover:text-white'
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
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            >
              {visibleCars.map((car, i) => {
                const imgUrl = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
                if (activeCategory === 'el') {
                  return (
                    <ElCarCard
                      key={car.id}
                      name={`${car.brand_display} ${car.model_display}`}
                      imageUrl={imgUrl}
                      rating={car.ratings.overall}
                      topBadge={i < 3}
                      expertComment={getExpertComment(car)}
                      carPrice={car.pricing.new_from_sek ?? undefined}
                      usedPrice={car.pricing.used_from_sek ?? undefined}
                      isCompared={selectedIds.has(car.id)}
                      onNegotiate={() => openContactForCar(car)}
                      onDetail={() => setDetailCar(car)}
                      onCompare={() => toggleSelect(car.id)}
                      onFitQuiz={() => setFitQuizCar(car)}
                    />
                  );
                }
                return (
                  <CompactCarCard
                    key={car.id}
                    name={`${car.brand_display} ${car.model_display}`}
                    imageUrl={imgUrl}
                    rating={car.ratings.overall}
                    topBadge={i < 3 && activeCategory === 'popular'}
                    expertComment={getExpertComment(car)}
                    fuelLabel={car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')}
                    carPrice={car.pricing.new_from_sek ?? undefined}
                    usedPrice={car.pricing.used_from_sek ?? undefined}
                    onNegotiate={() => openContactForCar(car)}
                    onDetail={() => setDetailCar(car)}
                    onCompare={() => toggleSelect(car.id)}
                    onFitQuiz={() => setFitQuizCar(car)}
                    isCompared={selectedIds.has(car.id)}
                    index={i}
                    disableMotion={isMobile}
                  />
                );
              })}

              {/* Catalog-only cars — shown only when searching, uses enrichment data if available */}
              {catalogSearchResults.map((car) => {
                const key = `catalog-${car.make}-${car.model}`;
                const imgUrl = car.image_url || getCarImage(car.make, car.model);
                const fuelLabel = car.fuel_types?.length
                  ? car.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')
                  : undefined;
                if (activeCategory === 'el') {
                  return (
                    <ElCarCard
                      key={key}
                      name={`${car.make} ${car.model}`}
                      imageUrl={imgUrl}
                      rating={car.rating_overall ?? undefined}
                      expertComment={car.expert_comment ?? undefined}
                      onNegotiate={() => openBuyDrawer(`${car.make} ${car.model}`, undefined, false)}
                    />
                  );
                }
                return (
                  <CompactCarCard
                    key={key}
                    name={`${car.make} ${car.model}`}
                    imageUrl={imgUrl}
                    rating={car.rating_overall ?? undefined}
                    expertComment={car.expert_comment ?? undefined}
                    fuelLabel={fuelLabel}
                    onNegotiate={() => openBuyDrawer(`${car.make} ${car.model}`, undefined, false)}
                    disableMotion={isMobile}
                  />
                );
              })}

              {/* "Hittar du inte bilen?" card — always last in grid */}
              <button
                type="button"
                onClick={() => openBuyDrawer(carSearchQuery.trim() || '', 'found')}
                className={`group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed transition-all duration-200 min-h-[180px] text-center ${
                  activeCategory === 'el'
                    ? 'bg-white/5 border-white/15 hover:border-[#38bdf8]/50 hover:bg-[#38bdf8]/5'
                    : 'bg-white border-slate-200 hover:border-[#0e6efe] hover:bg-[#0e6efe]/[0.03]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeCategory === 'el' ? 'bg-white/10 group-hover:bg-[#38bdf8]/15' : 'bg-slate-100 group-hover:bg-[#0e6efe]/10'}`}>
                  <Search className={`w-5 h-5 transition-colors ${activeCategory === 'el' ? 'text-slate-500 group-hover:text-[#38bdf8]' : 'text-slate-400 group-hover:text-[#0e6efe]'}`} />
                </div>
                <div>
                  <p className={`text-[13px] font-bold transition-colors leading-snug ${activeCategory === 'el' ? 'text-slate-300 group-hover:text-[#7dd3fc]' : 'text-slate-700 group-hover:text-[#0e6efe]'}`}>
                    {carSearchQuery.trim() ? `Hitta en ${carSearchQuery.trim()}` : 'Hittar du inte bilen?'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Vi hjälper dig hitta och köpa
                  </p>
                </div>
              </button>
            </motion.div>
          </AnimatePresence>

          {!carSearchQuery && !showAllCars && allCategoryCars.length > expertShowCount && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => {
                  const next = expertShowCount + 6;
                  if (next >= allCategoryCars.length) setShowAllCars(true);
                  else setExpertShowCount(next);
                }}
                className={`inline-flex items-center gap-2 px-7 py-3 rounded-full text-[14px] font-semibold ring-1 transition-all duration-200 ${
                  activeCategory === 'el'
                    ? 'bg-white/8 text-slate-200 ring-white/15 hover:ring-[#38bdf8]/40 hover:text-white'
                    : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-300 hover:shadow-sm'
                }`}
              >
                Visa fler bilar
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
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

      {/* Bilbyte Section */}
      <section className="relative overflow-hidden bg-slate-900">
        <img
          src="/BSM_car_sale_key_woman_handover_101122.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
          aria-hidden="true"
        />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold text-white/60 uppercase tracking-[0.18em] mb-5">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Byta bil
            </span>
            <h2 className="text-[36px] sm:text-[52px] font-bold text-white leading-[1.05] tracking-tight mb-4">
              Bilbyte?<br className="sm:hidden" /> Bilto.
            </h2>
            <p className="text-white/70 text-[15px] sm:text-[17px] leading-relaxed mb-8 max-w-md">
              Ange registreringsnumret på din nuvarande bil. Vi hjälper dig förhandla bästa möjliga värde och hitta din nästa.
            </p>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 sm:p-6 max-w-md">
              <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-3">
                Din nuvarande bil
              </p>
              <div className="mb-1">
                <RegInput value={bilbyteReg} onChange={(v) => { setBilbyteReg(v); if (v) setBilbyteRegError(false); }} error={bilbyteRegError} />
                {bilbyteRegError && (
                  <p className="mt-2 text-[12.5px] text-red-300 font-medium">Ange registreringsnumret på din nuvarande bil först.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!bilbyteReg.trim()) {
                    setBilbyteRegError(true);
                    return;
                  }
                  openBuyDrawer(`inbytesbil ${bilbyteReg}`, 'trade');
                }}
                className="mt-4 w-full h-12 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-bold text-[15px] flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                Starta bilbyte
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToQuiz}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[13px] font-medium transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Hitta nästa bil – bilmatch
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('cars-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[13px] font-medium transition"
              >
                <Search className="w-3.5 h-3.5" />
                Utforska bilar
              </button>
            </div>
          </div>
        </div>
      </section>

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
                    style={{ touchAction: 'pan-y' }}
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
              <div className="max-h-[500px] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                              const imgUrl = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
                              if (car.specs.fuel_types.includes('el')) {
                                return (
                                  <ElCarCard
                                    key={car.id}
                                    name={`${car.brand_display} ${car.model_display}`}
                                    imageUrl={imgUrl}
                                    rating={car.ratings.overall}
                                    expertComment={getExpertComment(car)}
                                    carPrice={car.pricing.new_from_sek ?? undefined}
                                    usedPrice={car.pricing.used_from_sek ?? undefined}
                                    isCompared={selectedIds.has(car.id)}
                                    onNegotiate={() => openContactForCar(car)}
                                    onDetail={() => setDetailCar(car)}
                                    onCompare={() => toggleSelect(car.id)}
                                  />
                                );
                              }
                              return (
                                <CompactCarCard
                                  key={car.id}
                                  name={`${car.brand_display} ${car.model_display}`}
                                  imageUrl={imgUrl}
                                  rating={car.ratings.overall}
                                  expertComment={getExpertComment(car)}
                                  fuelLabel={car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')}
                                  onNegotiate={() => openContactForCar(car)}
                                  onDetail={() => setDetailCar(car)}
                                  onCompare={() => toggleSelect(car.id)}
                                  isCompared={selectedIds.has(car.id)}
                                  index={ci}
                                  disableMotion={isMobile}
                                />
                              );
                            })}
                          </div>
                        )}
                        {msg.role === 'assistant' && msg.reformulations && msg.reformulations.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.reformulations.map(r => (
                              <button
                                key={r}
                                onClick={() => handleChatSubmit(r)}
                                className="px-3 py-1.5 rounded-full bg-slate-100 text-[12px] text-slate-600 font-medium hover:bg-[#0e6efe] hover:text-white transition-all"
                              >
                                {r}
                              </button>
                            ))}
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
                  {[
                    { label: 'Familje-SUV under 400k', query: 'Familje-SUV under 400k' },
                    { label: 'Bästa elbilen', query: 'Bästa elbilen' },
                    { label: 'Sportig kombi', query: 'Sportig kombi' },
                    { label: 'Billig första bil', query: 'Billig första bil' },
                    { label: 'SUV med stor bagage', query: 'SUV med stor bagage' },
                    { label: 'Bil för hund', query: 'Bil för hund' },
                  ].map(({ label, query }) => (
                    <button
                      key={label}
                      onClick={() => handleChatSubmit(query)}
                      className="px-3 py-1.5 rounded-full bg-slate-100 text-[12px] text-slate-600 font-medium hover:bg-[#0e6efe] hover:text-white transition-all"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder='T.ex. "elbil för familj", "Toyota SUV" eller "bil med hund"...'
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

      {/* Josefin testimonial */}
      <section className="bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-5 order-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
                Kundcase
              </span>
              <h2 className="text-[24px] sm:text-[42px] font-semibold leading-[1.15] sm:leading-[1.08] text-slate-900 tracking-[-0.02em]">
                "Jag visste ingenting om bilar — Bilto skötte allt och jag fick mer än jag vågat hoppas på."
              </h2>
              <p className="text-slate-600 mt-5 text-[15px] sm:text-[16px] leading-[1.65] max-w-md">
                Josefin hade hittat en Volvo XC40 men kände sig osäker. Annonsen visade elstolar som inte fanns — Bilto fick 15 000 kr i ersättning för det, förhandlade ner räntan 2 %, fick med dubbdäck och 2 års garanti, och pressade upp inbytesvärdet med 7 000 kr.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {[
                  { label: 'Ränta', value: '−2 %' },
                  { label: 'Inbyte', value: '+7 000 kr' },
                  { label: 'Felaktig annons', value: '15 000 kr' },
                  { label: 'Dubbdäck + garanti', value: 'ingår' },
                ].map(({ label, value }) => (
                  <div key={label} className="px-4 py-3 bg-[#0e6efe]/5 border border-[#0e6efe]/15 rounded-xl">
                    <p className="text-[10px] font-bold text-[#0e6efe] uppercase tracking-[0.12em] mb-0.5">{label}</p>
                    <p className="text-[18px] font-bold text-slate-900 leading-tight">{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-slate-500 mt-6">
                Josefin L. — Volvo XC40, 2022
              </p>
            </div>
            <div className="md:col-span-7 order-2">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src="/manrope_(1920_x_1080_px)_(1280_x_720_px)_(Instagram_Post_(45))_copy_copy_copy_copy_copy.jpg"
                  alt="Josefin framför sin Volvo XC40"
                  className="w-full h-[380px] sm:h-[580px] md:h-[680px] object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why us stats */}
      <section className="bg-[#0e6efe] py-12 sm:py-20 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-[22px] sm:text-[40px] font-semibold leading-[1.15] sm:leading-[1.08] text-white tracking-[-0.02em]">
              Vi hjälper dig köpa rätt bil – på dina villkor
            </h2>
            <p className="text-white/80 mt-3 sm:mt-4 text-[14px] sm:text-[17px] leading-[1.55] max-w-lg mx-auto">
              Vårt team har jobbat som toppsäljare hos Sveriges största bilhandlare. Nu jobbar vi för dig istället.
            </p>
          </div>
          <div className="flex items-center justify-center gap-6 sm:gap-12 flex-wrap">
            {[
              { value: '5 000+', label: 'Bilar sålda' },
              { value: '10+', label: 'År i branschen' },
              { value: '100%', label: 'På kundens sida' },
            ].map((stat, i, arr) => (
              <div key={stat.label} className="flex items-center gap-6 sm:gap-12">
                <div className="text-center">
                  <div className="text-[24px] sm:text-[32px] font-bold text-white tabular-nums tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[11px] sm:text-[13px] text-white/70 font-medium mt-0.5">
                    {stat.label}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px h-8 sm:h-10 bg-white/25" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="bg-[#f5f8fc] py-16 sm:py-24 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
            <span className="text-[12px] font-medium text-slate-500 mb-3 block">
              &mdash; Vad ingår
            </span>
            <h2 className="text-[28px] sm:text-[44px] font-semibold leading-[1.1] sm:leading-[1.04] text-slate-900 tracking-[-0.02em]">
              En personlig bilförhandlare i fickan
            </h2>
            <p className="text-slate-600 mt-5 text-[15px] sm:text-[17px] leading-[1.6]">
              Tjänsten är gjord för dig som inte vill spendera dagar på att jaga bilar, ringa annonser eller känna dig pressad i en handlares showroom.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                icon: Search,
                title: 'Vi letar bilen åt dig',
                text: 'Vi kontrollerar hela marknaden -- inte bara en handlares lager -- och hittar bilar som matchar dina önskemål och budget.',
                svg: '/certified-pre-own.75373bb7.svg',
              },
              {
                icon: ShieldCheck,
                title: 'Vi kollar att den håller',
                text: 'Vi kontrollerar servicehistorik, eventuella skador och tidigare ägare. Inga otrevliga överraskningar efter köpet.',
                svg: '/infographic_antal_agare.svg',
                imgClass: 'w-full h-full object-contain group-hover:scale-105 transition-transform duration-300',
              },
              {
                icon: Phone,
                title: 'Vi förhandlar priset',
                text: 'Vi vet hur handlare räknar och vågar säga nej. Det betyder att du sparar mer än vad tjänsten kostar.',
                svg: '/info-content.a96a55cf.svg',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 hover:border-[#0e6efe]/40 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-full h-[140px] sm:h-[160px] flex items-center justify-center mb-5 overflow-hidden rounded-xl bg-slate-50 group-hover:bg-[#0e6efe]/5 transition-colors duration-300">
                    <img
                      src={item.svg}
                      alt=""
                      aria-hidden="true"
                      className={item.imgClass || "w-auto h-[110px] sm:h-[130px] object-contain group-hover:scale-105 transition-transform duration-300"}
                    />
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-[#0e6efe]/10 text-[#0e6efe] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-[18px] font-semibold text-slate-900 mb-2 leading-tight tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-[14.5px] text-slate-600 leading-[1.6]">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vehicle inspection infographic */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-white py-16 sm:py-28 px-5 sm:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 max-w-3xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 sm:mb-4 block">
              Grundlig genomgång
            </span>
            <h2 className="text-[26px] sm:text-[48px] font-semibold leading-[1.1] sm:leading-[1.04] text-slate-900 tracking-[-0.02em]">
              Vi granskar varje detalj -- så slipper du oroa dig
            </h2>
            <p className="text-slate-600 mt-4 sm:mt-6 text-[15px] sm:text-[18px] leading-[1.6] max-w-2xl mx-auto">
              Innan vi rekommenderar en bil till dig går vi igenom fem kritiska datapunkter. Inget lämnas åt slumpen.
            </p>
          </div>
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-1 space-y-6 sm:space-y-8 order-2 lg:order-1">
              {[
                { label: 'Olycksrisk', desc: 'Vi genomför certifierade kontroller och historikutdrag för att säkerställa att bilen inte har dolda skador.' },
                { label: 'Antal ägare', desc: 'Färre ägare betyder bättre omhändertagen bil. Vi utreder ägarhistoriken.' },
              ].map((point) => (
                <div key={point.label} className="text-right lg:text-right">
                  <h4 className="text-[16px] sm:text-[18px] font-semibold text-slate-900 mb-1">{point.label}</h4>
                  <p className="text-[13px] sm:text-[14px] text-slate-500 leading-[1.5]">{point.desc}</p>
                </div>
              ))}
            </div>
            <div className="lg:col-span-3 order-1 lg:order-2 flex items-center justify-center">
              <img
                src="/infographic_antal_agare.svg"
                alt="Infografik: antal ägare och bilhistorik"
                className="w-full max-w-[600px] sm:max-w-[700px] h-auto"
              />
            </div>
            <div className="lg:col-span-1 space-y-6 sm:space-y-8 order-3">
              {[
                { label: 'Bilens skick', desc: 'Från lack och inredning till maskinellt och elektronik -- vi bedömer det faktiska skicket, inte bara foton i annonsen.' },
                { label: 'Körsträcka', desc: 'Vi verifierar miltal mot servicehistorik för att upptäcka eventuella felaktigheter.' },
                { label: 'Bilalternativ', desc: 'Vi jämför att din bil ligger rätt till i marknaden så att du inte betalar för mycket.' },
              ].map((point) => (
                <div key={point.label}>
                  <h4 className="text-[16px] sm:text-[18px] font-semibold text-slate-900 mb-1">{point.label}</h4>
                  <p className="text-[13px] sm:text-[14px] text-slate-500 leading-[1.5]">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 sm:mt-16 text-center">
            <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-full px-5 sm:px-7 py-3 sm:py-4 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
              <span className="text-[14px] sm:text-[15px] text-slate-700 font-medium">
                Alla bilar vi rekommenderar har klarat vår 5-punktskontroll
              </span>
            </div>
          </div>
        </div>
      </section>

      <ReviewsSection variant="muted" />

      {/* Hero image CTA */}
      <section className="relative overflow-hidden">
        <img
          src="/BSM_car_sale_key_woman_handover_101122.jpg"
          alt="Bilaffär med Bilto"
          className="w-full h-[340px] sm:h-[480px] object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 w-full">
            <p className="text-[11px] font-bold text-white/60 uppercase tracking-[0.18em] mb-3">Bilto — din bilexpert</p>
            <h2 className="text-[32px] sm:text-[52px] font-bold text-white leading-[1.05] tracking-tight mb-4 max-w-xl">
              Vi gör din bilaffär trygg och enkel.
            </h2>
            <p className="text-white/70 text-[15px] sm:text-[17px] leading-relaxed mb-8 max-w-md">
              Ingen bindning. Inga dolda avgifter. Du tackar ja eller nej.
            </p>
            <button
              type="button"
              onClick={() => openBuyDrawer('', 'searching')}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-bold text-[15px] transition active:scale-[0.98] shadow-lg"
            >
              Kom igång gratis
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Buy drawer */}
      <BuyDrawer car={buyDrawerCar} initialTrack={buyDrawerTrack} skipIntent={buyDrawerSkipIntent} initialAdditionalRequests={buyDrawerEquity || undefined} onClose={() => { setBuyDrawerCar(null); setBuyDrawerEquity(''); }} />

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
          quizAnswers={quizAnswers ?? undefined}
          onClose={() => setDetailCar(null)}
          onSelect={() => { const car = detailCar; setDetailCar(null); openContactForCar(car); }}
        />
      )}

      {/* Car fit quiz */}
      <CarFitQuiz
        car={fitQuizCar!}
        open={!!fitQuizCar}
        onClose={() => setFitQuizCar(null)}
        dark={activeCategory === 'el'}
        onNegotiate={() => { if (fitQuizCar) { openContactForCar(fitQuizCar); setFitQuizCar(null); } }}
      />
    </div>
  );
}
