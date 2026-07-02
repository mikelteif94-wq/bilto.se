import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { calcCarMonthly } from '../lib/utils';
import {
  Search, ArrowRight, Car, Menu, User, Check,
  Sparkles, Zap, Truck, Leaf, CarFront,
  Send, Loader2, RotateCcw, Info,
  GitCompareArrows, X, ArrowDown, Phone, Handshake,
  ShieldCheck, Megaphone, CheckCircle, ArrowLeftRight, ChevronDown, Bell,
} from 'lucide-react';
import TcoCompareBar, { type TcoCompareCar } from '../components/TcoCompareBar';
import ReviewsSection from '../components/ReviewsSection';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllComparisonCars } from '../lib/comparison';
import { findComparisonCarByMakeModel } from '../lib/comparison';
import type { ComparisonCar } from '../lib/comparison/types';
import { useCarImages } from '../hooks/useCarImages';
import { useCatalogCars, type CatalogCarFull } from '../hooks/useCatalogCars';
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
import SaveToPortalBanner from '../components/SaveToPortalBanner';
import SearchAlertModal from '../components/SearchAlertModal';
import {
  BODY_TYPE_KEYWORDS, FUEL_TYPE_KEYWORDS, BRAND_CATEGORIES, PRIORITY_TRAITS,
} from '../components/quiz/QuizTypes';
import { supabase } from '../lib/supabase';
import { useVehicleLookup } from '../lib/useVehicleLookup';

/* ───────────── constants ───────────── */

const FUEL_LABELS: Record<string, string> = {
  bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid', laddhybrid: 'Laddhybrid', el: 'El',
};

const MAX_COMPARE = 4;

const EVERYDAY_BRANDS = new Set([
  'volvo', 'tesla', 'kia', 'toyota', 'volkswagen', 'vw', 'hyundai', 'skoda',
  'polestar', 'ford', 'renault', 'peugeot', 'seat', 'cupra', 'honda', 'mazda',
  'subaru', 'mg', 'opel', 'nissan', 'suzuki', 'mitsubishi', 'dacia',
]);

const EXCLUDED_FROM_TOP = new Set([
  'bmw 7-serie', 'bmw m3', 'bmw m4', 'bmw m5', 'bmw m2', 'bmw m240i', 'bmw m3 touring', 'bmw m8',
  'porsche cayenne', 'porsche macan', 'porsche 911', 'porsche panamera', 'porsche taycan',
  'maserati', 'ferrari', 'lamborghini', 'rolls-royce', 'bentley', 'aston martin',
  'mercedes amg gle 63', 'mercedes amg gt', 'mercedes s-klass', 'mercedes sl',
  'audi rs6', 'audi rs3', 'audi r8', 'land rover range rover', 'land rover defender',
]);

function expertPriority(car: CatalogCarFull): number {
  const key = `${car.make} ${car.model}`.toLowerCase();
  const make = car.make.toLowerCase();
  if (EXCLUDED_FROM_TOP.has(key) || make === 'porsche' || make === 'maserati') return 2;
  if (EVERYDAY_BRANDS.has(make)) return 0;
  return 1;
}

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
  { label: 'Under 3 000 kr/mån', minMonthly: 0, maxMonthly: 3000, carId: 'skoda_octavia' },
  { label: '3 000–5 000 kr/mån', minMonthly: 3001, maxMonthly: 5000, carId: 'kia_niro' },
  { label: '5 000–8 000 kr/mån', minMonthly: 5001, maxMonthly: 8000, carId: 'toyota_rav4' },
  { label: '8 000–12 000 kr/mån', minMonthly: 8001, maxMonthly: 12000, carId: 'volvo_xc60' },
  { label: 'Över 12 000 kr/mån', minMonthly: 12001, maxMonthly: 0, carId: 'bmw_x3' },
  { label: 'Öppen budget', minMonthly: 0, maxMonthly: 0, carId: 'tesla_model_y' },
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

type CategoryKey = 'alla' | 'popular' | 'el' | 'suv' | 'hybrid' | 'sedan';

const POPULAR_MODELS: Array<[string, string]> = [
  ['Volvo', 'XC60'], ['Volvo', 'XC40'], ['Volvo', 'V60'], ['Volvo', 'XC90'], ['Volvo', 'EX30'], ['Volvo', 'EX40'],
  ['Toyota', 'RAV4'], ['Toyota', 'Yaris'], ['Toyota', 'C-HR'], ['Toyota', 'Corolla Hybrid'], ['Toyota', 'Yaris Cross'],
  ['Volkswagen', 'Golf'], ['Volkswagen', 'Tiguan'], ['Volkswagen', 'ID.4'], ['Volkswagen', 'ID.3'], ['Volkswagen', 'Passat Variant'],
  ['Tesla', 'Model 3'], ['Tesla', 'Model Y'],
  ['Kia', 'Sportage'], ['Kia', 'EV6'], ['Kia', 'Niro'], ['Kia', 'Ceed'],
  ['Hyundai', 'IONIQ 5'], ['Hyundai', 'Tucson'], ['Hyundai', 'i30'],
  ['Polestar', '2'], ['Polestar', '3'],
  ['BMW', '3-serie'], ['BMW', 'X3'], ['BMW', 'i4'],
  ['Skoda', 'Octavia'], ['Skoda', 'Karoq'], ['Skoda', 'Kodiaq'],
  ['Ford', 'Puma'], ['Ford', 'Kuga'], ['Ford', 'Mustang Mach-E'],
  ['Dacia', 'Sandero'], ['Dacia', 'Duster'],
  ['MG', '4'], ['MG', 'ZS EV'],
  ['Renault', 'Clio'], ['Renault', 'Captur'], ['Renault', '5 E-Tech'],
  ['Audi', 'A4 Avant'], ['Audi', 'Q5'], ['Audi', 'Q4 e-tron'],
  ['Mercedes-Benz', 'GLC'], ['Mercedes-Benz', 'C-Klass'],
  ['Peugeot', '3008'], ['Peugeot', '208'],
];

const POPULAR_SET = new Set(POPULAR_MODELS.map(([m, mo]) => `${m.toLowerCase()}|${mo.toLowerCase()}`));

const CATEGORY_FILTERS: Record<CategoryKey, (car: CatalogCarFull) => boolean> = {
  alla: () => true,
  popular: car => POPULAR_SET.has(`${car.make.toLowerCase()}|${car.model.toLowerCase()}`),
  el: car => !!(car.fuel_types?.includes('el')),
  suv: car => car.body_type === 'suv',
  hybrid: car => !!(car.fuel_types?.some(f => f === 'hybrid' || f === 'laddhybrid')),
  sedan: car => car.body_type === 'sedan' || car.body_type === 'hatchback' || car.body_type === 'kombi',
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
  { keys: ['familj', 'barnfamilj', 'syskon', 'familje', 'barnens'], check: c => c.specs.seats >= 5 && (c.specs.trunk_liters || 0) >= 420 && c.ratings.practicality >= 7, weight: 22 },
  { keys: ['barn', 'barnstol', 'barnsäte', 'barnen'], check: c => c.specs.seats >= 5 && (c.specs.trunk_liters || 0) >= 380, weight: 18 },
  { keys: ['barnvagn', 'baby', 'bebis', 'nyfödda', 'nyfödd', 'spädbarn'], check: c => (c.specs.trunk_liters || 0) >= 500 && (c.specs.body_type === 'suv' || c.specs.body_type === 'kombi' || c.specs.body_type === 'mpv'), weight: 28 },
  { keys: ['hund', 'hundar', 'husdjur', 'djur', 'katt'], check: c => (c.specs.trunk_liters || 0) >= 450 && (c.specs.body_type === 'suv' || c.specs.body_type === 'kombi'), weight: 22 },
  { keys: ['stor bagage', 'stort bagageutrymme', 'bagageutrymme', 'bagage', 'lastförmåga', 'lastbar'], check: c => (c.specs.trunk_liters || 0) >= 450, weight: 18 },
  { keys: ['billig', 'prisvärd', 'budget', 'förmånlig', 'billigt', 'prisvä'], check: c => (c.pricing.new_from_sek != null && c.pricing.new_from_sek <= 400_000) || (c.pricing.used_from_sek != null && c.pricing.used_from_sek <= 250_000), weight: 22 },
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
  { keys: ['tonåring', 'tonår', 'ungdom', 'student', 'körkort'], check: c => c.ratings.value >= 8 && (c.pricing.new_from_sek == null || c.pricing.new_from_sek <= 400_000), weight: 20 },
  { keys: ['pålitlig', 'tillförlitlig', 'driftsäker', 'robust'], check: c => c.ratings.value >= 7 && (c.safety.euro_ncap_stars || 0) >= 4, weight: 14 },
  { keys: ['lång räckvidd', 'räckvidd', 'lång trip', 'långkörning'], check: c => c.specs.fuel_types.includes('el') && c.ratings.comfort >= 7, weight: 16 },
  { keys: ['miljövänlig', 'grön', 'klimat', 'utsläpp', 'co2'], check: c => c.specs.fuel_types.some(f => f === 'el' || f === 'hybrid' || f === 'laddhybrid'), weight: 16 },
  { keys: ['bäst', 'bästa', 'topp', 'rekommendera', 'populär'], check: c => c.ratings.overall >= 8, weight: 12 },
  { keys: ['liten', 'litet', 'smidig', 'enkel'], check: c => c.specs.body_type === 'hatchback' || (c.pricing.new_from_sek != null && c.pricing.new_from_sek <= 350_000), weight: 16 },
  { keys: ['camping', 'tält', 'friluft', 'outdoor', 'äventyr', 'natur', 'terräng'], check: c => c.specs.drivetrain.some(d => d === 'awd') || ((c.specs.trunk_liters || 0) >= 500 && c.specs.body_type === 'suv'), weight: 18 },
  { keys: ['vinter', 'snö', 'halka', 'norrland', 'fjäll'], check: c => c.specs.drivetrain.some(d => d === 'awd'), weight: 20 },
  { keys: ['motorväg', 'lång resa', 'semest', 'roadtrip', 'europa'], check: c => c.ratings.comfort >= 8, weight: 14 },
  { keys: ['tjänstebil', 'företag', 'förmånsbil', 'affärsresa'], check: c => (c.segment === 'premium' || c.segment === 'luxury') && c.ratings.comfort >= 7, weight: 16 },
  { keys: ['vardag', 'vardagsbil', 'praktisk', 'allround'], check: c => c.ratings.practicality >= 8 && c.ratings.value >= 7, weight: 18 },
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

// Detect brand mention in query – returns brand_id fragments matched
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

  // Brand matching – if a brand is specified, only that brand gets brand points
  let matchedBrand = false;
  if (requestedBrand) {
    if (brandLower.includes(requestedBrand) || requestedBrand.includes(brandLower)) {
      score += 35;
      matchedBrand = true;
    } else {
      // Brand was requested but doesn't match – heavy penalty so off-brand cars rank last
      score -= 50;
    }
  } else {
    // No brand requested – small generic name-token match
    const tokens = q.split(/[\s,\-+]+/).filter(t => t.length >= 2);
    for (const token of tokens) {
      if (name.includes(token)) score += 12;
    }
  }

  // Body type compound matching – must match if body type words are present
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

  // Trait matching – scan the full query for known trait keywords
  const isBudgetSearch = ['billig', 'prisvärd', 'budget', 'förmånlig', 'billigt', 'prisvä'].some(k => q.includes(k));
  for (const { keys, check, weight } of TRAIT_MAP) {
    if (keys.some(k => q.includes(k))) {
      if (check(car)) score += weight;
      else if (isBudgetSearch && keys.includes('billig')) score -= 15;
    }
  }

  // Penalize expensive cars for budget queries
  if (isBudgetSearch) {
    const p = car.pricing.new_from_sek;
    if (p != null) {
      if (p > 700_000) score -= 25;
      else if (p > 500_000) score -= 15;
      else if (p > 400_000) score -= 8;
    }
  }

  // Anti-sport penalty for family/practical queries
  const isFamilySearch = ['familj', 'barn', 'barnvagn', 'baby', 'bebis', 'nyfödda', 'barnstol', 'barnfamilj', 'praktisk', 'syskon'].some(k => q.includes(k));
  if (isFamilySearch) {
    if (car.ratings.driving >= 9 && car.ratings.practicality <= 7) score -= 30;
    else if (car.ratings.driving >= 8 && car.ratings.practicality <= 5) score -= 20;
    if (car.segment === 'performance' || car.segment === 'sport') score -= 20;
    if (car.specs.body_type === 'suv' || car.specs.body_type === 'kombi' || car.specs.body_type === 'mpv') score += 8;
  }

  // Anti-practical penalty for sport/performance queries
  const isSportSearch = ['sportig', 'sport', 'snabb', 'prestanda', 'racing', 'kraft', 'perf'].some(k => q.includes(k));
  if (isSportSearch && car.ratings.driving <= 5) score -= 15;

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

  // Quality bonus for tiebreaking – not added to score directly, used in sort
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

function parseFuelLabel(label?: string): string[] {
  if (!label) return ['bensin'];
  const l = label.toLowerCase();
  const types: string[] = [];
  if (l.includes('laddhybrid')) types.push('laddhybrid');
  else if (l.includes('hybrid')) types.push('hybrid');
  if (l.includes('el')) types.push('el');
  if (l.includes('diesel')) types.push('diesel');
  if (l.includes('bensin')) types.push('bensin');
  return types.length > 0 ? types : ['bensin'];
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

const NAV_ITEMS = ['Sälj bil', 'Bilköpshjälpen'] as const;

interface CompareCarsPageProps {
  onBackHome: () => void;
  pageSlug?: 'kop-bil' | 'salj-bil-hjalp';
  heroTitle?: string;
  heroSubtitle?: string;
  defaultCategory?: CategoryKey;
  ctaOptions?: Array<{ label: string; sub: string; track: 'found' | 'searching' | 'trade' }>;
  defaultFuelTypes?: string[];
}


/* ═════════════ MAIN COMPONENT ═════════════ */

export default function CompareCarsPage({ onBackHome, pageSlug = 'kop-bil', heroTitle, heroSubtitle, defaultCategory, ctaOptions, defaultFuelTypes }: CompareCarsPageProps) {
  const allCarsRaw = useMemo(() => getAllComparisonCars(), []);
  const isEvPage = !!(defaultFuelTypes?.includes('el') && defaultFuelTypes.length === 1);
  const { cars: dbCars, loading: carsLoading } = useCatalogCars();
  const { getCarImage } = useCarImages(dbCars);
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
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(defaultCategory ?? 'alla');
  const [showAllCars, setShowAllCars] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);

  // TCO compare state (up to 2 cars)
  const [tcoCompare, setTcoCompare] = useState<TcoCompareCar[]>([]);

  const toggleTcoCompare = useCallback((car: TcoCompareCar) => {
    setTcoCompare(prev => {
      if (prev.some(c => c.id === car.id)) return prev.filter(c => c.id !== car.id);
      if (prev.length >= 2) return prev;
      return [...prev, car];
    });
  }, []);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSearching, setChatSearching] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

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
  const [buyDrawerInitialReg, setBuyDrawerInitialReg] = useState<string>('');
  const [quizPreselectedCar, setQuizPreselectedCar] = useState<string | undefined>(undefined);

  const [buyDrawerFuelTypes, setBuyDrawerFuelTypes] = useState<string[] | undefined>(undefined);

  const openBuyDrawer = (car: string, track?: 'found' | 'searching' | 'trade', skipIntent?: boolean, equitySummary?: string, fuelTypes?: string[], tradeReg?: string) => {
    setBuyDrawerTrack(track);
    setBuyDrawerSkipIntent(!!skipIntent);
    setBuyDrawerEquity(equitySummary ?? '');
    setBuyDrawerFuelTypes(fuelTypes);
    setBuyDrawerInitialReg(tradeReg ?? '');
    setBuyDrawerCar(car);
  };

  // Bilto Score info
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false);

  // Bilbyte hero section
  const [bilbyteReg, setBilbyteReg] = useState('');
  const [bilbyteRegError, setBilbyteRegError] = useState(false);

  // Budget filter state
  const [activeBudget, setActiveBudget] = useState<string | null>(null);
  const [budgetShowCount, setBudgetShowCount] = useState(6);
  const budgetGridRef = useRef<HTMLDivElement>(null);
  const [expertShowCount, setExpertShowCount] = useState(6);
  const [expertCardMode, setExpertCardMode] = useState<'ny' | 'beg'>('beg');
  const [alertModalOpen, setAlertModalOpen] = useState(false);


  const navigateToSell = useCallback(() => {
    window.history.pushState({}, '', '/salj');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    document.title = 'Köp bil – Jämför, hitta & förhandla | Bilto';
    let current = window.scrollY > 20;
    setScrolled(current);
    const onScroll = () => {
      const next = window.scrollY > 20;
      if (next !== current) { current = next; setScrolled(next); }
    };
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

  const [carSearchQuery, setCarSearchQuery] = useState('');

  // All cars from DB, filtered by category and sorted by rating desc
  const allCategoryCars = useMemo((): CatalogCarFull[] => {
    const q = carSearchQuery.trim().toLowerCase();
    const filtered = q
      ? dbCars.filter(c => `${c.make} ${c.model}`.toLowerCase().includes(q))
      : dbCars.filter(CATEGORY_FILTERS[activeCategory]);

    return filtered.slice().sort((a, b) => {
      if (q) return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`, 'sv');
      if (activeCategory === 'alla') {
        const pDiff = expertPriority(a) - expertPriority(b);
        if (pDiff !== 0) return pDiff;
      }
      const rA = a.rating_overall ?? findComparisonCarByMakeModel(a.make, a.model)?.ratings.overall ?? 0;
      const rB = b.rating_overall ?? findComparisonCarByMakeModel(b.make, b.model)?.ratings.overall ?? 0;
      const rDiff = rB - rA;
      if (rDiff !== 0) return rDiff;
      return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`, 'sv');
    });
  }, [dbCars, activeCategory, carSearchQuery]);

  const visibleCars = useMemo((): CatalogCarFull[] => {
    if (carSearchQuery.trim()) return allCategoryCars;
    const base = showAllCars ? allCategoryCars : allCategoryCars.slice(0, expertShowCount);
    // For default "alla" view, diversify body types so the first rows aren't all SUVs
    if (activeCategory === 'alla' && !showAllCars) {
      const BODY_ORDER = ['hatchback', 'sedan', 'kombi', 'suv', 'mpv', 'coupe', 'cab'];
      const compCar = (c: CatalogCarFull) => findComparisonCarByMakeModel(c.make, c.model);
      const bodyOf = (c: CatalogCarFull): string => compCar(c)?.specs.body_type ?? c.body_type ?? 'suv';
      // Split into slots: pick 1 of each body type in BODY_ORDER first, fill rest from remaining
      const used = new Set<string>();
      const slots: CatalogCarFull[] = [];
      for (const bt of BODY_ORDER) {
        const pick = allCategoryCars.find(c => !used.has(c.id) && bodyOf(c) === bt);
        if (pick) { slots.push(pick); used.add(pick.id); }
      }
      // Fill remaining slots from sorted list
      for (const c of allCategoryCars) {
        if (!used.has(c.id)) slots.push(c);
      }
      return slots.slice(0, expertShowCount);
    }
    return base;
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
    const bracket = BUDGET_BRACKETS.find(b => b.label === activeBudget);
    if (!bracket) return [];
    return allCarsRaw
      .filter(car => {
        if (isEvPage && !car.specs.fuel_types.includes('el')) return false;
        if (!car.pricing.new_from_sek) return false;
        const monthly = calcCarMonthly(car.pricing.new_from_sek, 0.55);
        if (bracket.minMonthly === 0 && bracket.maxMonthly === 0) return true; // Öppen budget = alla
        if (bracket.maxMonthly === 0) return monthly >= bracket.minMonthly; // Över X
        if (bracket.minMonthly === 0) return monthly <= bracket.maxMonthly; // Under X
        return monthly >= bracket.minMonthly && monthly <= bracket.maxMonthly;
      })
      .sort((a, b) => (a.pricing.new_from_sek || 0) - (b.pricing.new_from_sek || 0));
  }, [activeBudget, allCarsRaw, isEvPage]);

  // Chat
  const handleChatSubmit = (overrideInput?: string) => {
    const q = (overrideInput ?? chatInput).trim();
    if (!q || chatSearching) return;

    const userMsg: ChatMessage = { role: 'user', text: q };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatSearching(true);

    // Scroll user message into view immediately
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 40);

    // Simulate AI processing delay for better UX feel
    setTimeout(() => {
      const allScored = allCarsRaw
        .map(car => {
          const result = searchScoreCar(car, q);
          return { car, ...result };
        })
        .sort((a, b) => (b.score + b.qualityBonus * 0.3) - (a.score + a.qualityBonus * 0.3));

      let candidates = allScored.filter(r => r.score >= 15);

      const brandCount: Record<string, number> = {};
      const diverse = candidates.filter(r => {
        const b = r.car.brand_display;
        brandCount[b] = (brandCount[b] || 0) + 1;
        return brandCount[b] <= 2;
      });
      candidates = diverse.slice(0, 6);

      let isFuzzy = false;
      if (candidates.length === 0) {
        candidates = allScored.filter(r => r.score >= 5).slice(0, 4);
        isFuzzy = candidates.length > 0;
      }

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
      setChatMessages(prev => [...prev, assistantMsg]);
      setChatSearching(false);

      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);
    }, 700);
  };

  const openContactForCar = (car: ComparisonCar | null) => {
    const name = car ? `${car.brand_display} ${car.model_display}` : '';
    openBuyDrawer(name || '', undefined, false, undefined, car?.specs.fuel_types);
  };

  const handleNavSelect = (item: string) => {
    if (item === 'Sälj bil') {
      onBackHome();
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
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Navbar */}
      <header className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]/40 backdrop-blur-md'}`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)} className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white">
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <span className="text-[15px] text-white font-bold underline underline-offset-4 decoration-white/50">
              Bilköpshjälpen
            </span>
            <button key="salj-bil" type="button" onClick={() => handleNavSelect('Sälj bil')}
              className="text-[15px] text-white/70 hover:text-white transition font-medium"
            >
              Sälj bil
            </button>
          </nav>
          <div className="flex items-center ml-auto">
            <a href="/gratis-konsultation" className="inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Bilköpshjälpen"
        onSelect={() => { setMenuOpen(false); }}
      />

      {/* Hero */}
      <section className="relative min-h-[100svh] flex flex-col overflow-hidden">
        <img
          src="/hero/ChatGPT_Image_24_juni_2026_23_35_19.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-[center_95%] sm:object-bottom pointer-events-none select-none"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/30 to-transparent pointer-events-none" />

        {/* Hero content */}
        <div className="relative flex-1 flex flex-col items-center justify-start pt-28 sm:pt-36 pb-10 px-5 sm:px-8">
          <div className="w-full max-w-md sm:max-w-lg">
            <h1 className="text-white text-[clamp(26px,4vw,52px)] font-bold leading-[1.15] tracking-tight text-center drop-shadow-lg mb-4 sm:mb-5">
              {heroTitle ?? 'Hitta drömbilen – spara tid och pengar'}
            </h1>
            <p className="text-white/80 text-center text-[15px] sm:text-[17px] leading-relaxed mb-8 sm:mb-10 drop-shadow">
              {heroSubtitle ?? 'Gratis hjälp • Vi förhandlar • Utan förpliktelser'}
            </p>

            <p className="text-white/60 text-[11px] font-semibold uppercase tracking-widest mb-3 text-center">
              Välj hur du vill ha hjälp
            </p>
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden text-left">
              {(ctaOptions ?? [
                {
                  icon: CheckCircle,
                  label: 'Jag har hittat en bil',
                  sub: 'Låt oss förhandla och granska åt dig',
                  track: 'found' as const,
                },
                {
                  icon: Search,
                  label: 'Jag letar efter bil',
                  sub: 'Utforska, jämför eller testa bilmatch',
                  track: 'searching' as const,
                },
                {
                  icon: ArrowLeftRight,
                  label: 'Jag vill byta bil',
                  sub: 'Vi hittar och förhandlar nästa bil åt dig',
                  track: 'trade' as const,
                },
              ]).map(({ label, sub, track }, i, arr) => {
                const icons = { found: CheckCircle, searching: Search, trade: ArrowLeftRight };
                const Icon = icons[track];
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => openBuyDrawer('', track, false, '', defaultFuelTypes)}
                    className={`group w-full flex items-center gap-4 px-5 py-[18px] hover:bg-[#0e6efe]/[0.04] active:bg-[#0e6efe]/[0.07] transition-all text-left ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {track === 'trade' ? (
                        <img src="/hero/files_2615643-2026-06-21T12-42-37-274Z-module-4-img.ce21cba7.svg" alt="" className="w-10 h-10 object-contain" />
                      ) : track === 'searching' ? (
                        <img src="/benefit3.d9e1ec2e_(1).svg" alt="" className="w-10 h-10 object-contain" />
                      ) : track === 'found' ? (
                        <img src="/benefit2.e5b8ac47_(1).svg" alt="" className="w-10 h-10 object-contain" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 group-hover:bg-[#0e6efe]/20 flex items-center justify-center transition-colors">
                          <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-slate-900 group-hover:text-[#0e6efe] leading-snug transition-colors">{label}</p>
                      <p className="text-[12px] text-slate-400 mt-0.5 leading-snug">{sub}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0e6efe] group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                );
              })}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-[11px] text-slate-400">Gratis &amp; utan förpliktelser</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by budget */}
      <section className="py-10 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-7 sm:mb-10">
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
              const isActive = activeBudget === bracket.label;
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
                      setActiveBudget(bracket.label);
                      setBudgetShowCount(6);
                      setTimeout(() => budgetGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
                    }
                  }}
                  className={`flex flex-col rounded-xl overflow-hidden group transition-all duration-300 shrink-0 snap-start w-[140px] sm:w-auto ${
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

        {/* Budget filtered results – full-width stripe */}
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
                          {activeBudget === 'Öppen budget' ? 'Alla bilar' : `Bilar: ${activeBudget}`}
                        </h3>
                        <span className="px-2 py-0.5 rounded-xl bg-[#0e6efe] text-white text-[11px] font-bold">
                          {budgetFilteredCars.length} st
                        </span>
                      </div>
                      {activeBudget !== null && (
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
                    <button
                      type="button"
                      onClick={() => setAlertModalOpen(true)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0e6efe] hover:text-[#0a57cc] transition-colors self-start sm:self-auto"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      Bevaka sökning
                    </button>
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {budgetFilteredCars.slice(0, budgetShowCount).map((car, i) => {
                      const imgUrl = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
                      const tcoId = car.id;
                      const tcoItem: TcoCompareCar = {
                        id: tcoId, name: `${car.brand_display} ${car.model_display}`,
                        imageUrl: imgUrl, carPrice: car.pricing.new_from_sek ?? undefined,
                        usedPrice: car.pricing.used_from_sek ?? undefined, fuelTypes: car.specs.fuel_types,
                      };
                      if (car.specs.fuel_types.includes('el')) {
                        return (
                          <ElCarCard
                            key={car.id}
                            name={`${car.brand_display} ${car.model_display}`}
                            make={car.brand_display}
                            imageUrl={imgUrl}
                            rating={car.ratings.overall}
                            pros={car.pros}
                            bodyType={car.specs.body_type}
                            drivetrain={car.specs.drivetrain}
                            seats={car.specs.seats}
                            fuelTypes={car.specs.fuel_types}
                            carPrice={car.pricing.new_from_sek ?? undefined}
                            usedPrice={car.pricing.used_from_sek ?? undefined}
                            isCompared={selectedIds.has(car.id)}
                            onNegotiate={() => openContactForCar(car)}
                            onDetail={() => setDetailCar(car)}
                            onCompare={() => toggleSelect(car.id)}
                            onFitQuiz={() => setFitQuizCar(car)}
                            onTcoCompare={() => toggleTcoCompare(tcoItem)}
                            isTcoCompared={tcoCompare.some(c => c.id === tcoId)}
                          />
                        );
                      }
                      return (
                        <CompactCarCard
                          key={car.id}
                          name={`${car.brand_display} ${car.model_display}`}
                          make={car.brand_display}
                          imageUrl={imgUrl}
                          rating={car.ratings.overall}
                          fuelLabel={car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')}
                          fuelTypes={car.specs.fuel_types}
                          bodyType={car.specs.body_type}
                          drivetrain={car.specs.drivetrain}
                          seats={car.specs.seats}
                          pros={car.pros}
                          carPrice={car.pricing.new_from_sek ?? undefined}
                          usedPrice={car.pricing.used_from_sek ?? undefined}
                          onNegotiate={() => openContactForCar(car)}
                          onDetail={() => setDetailCar(car)}
                          onCompare={() => toggleSelect(car.id)}
                          onFitQuiz={() => setFitQuizCar(car)}
                          isCompared={selectedIds.has(car.id)}
                          onTcoCompare={() => toggleTcoCompare(tcoItem)}
                          isTcoCompared={tcoCompare.some(c => c.id === tcoId)}
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
                        className="inline-flex items-center gap-2 h-11 px-8 rounded-xl bg-white ring-1 ring-slate-200 hover:ring-[#0e6efe] text-slate-700 hover:text-[#0e6efe] text-[13px] font-semibold transition-all duration-200 shadow-sm"
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


      {/* Bilmatch Section */}
      <section id="quiz-section" ref={quizSectionRef} className="py-0 sm:py-20 lg:py-28 sm:px-6 bg-[#faf8f5] sm:bg-gradient-to-b sm:from-slate-50 sm:to-white sm:border-t sm:border-slate-100">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {quizStep === 'idle' && (
              <motion.div key="quiz-idle" initial={isMobile ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ touchAction: 'pan-y' }}>
                {/* Mobile card */}
                <div className="block sm:hidden px-4 py-6">
                  <div className="rounded-xl bg-[#0e6efe] overflow-hidden">
                    {/* Content area */}
                    <div className="px-5 pt-7 pb-5">
                      <h2 className="text-[30px] font-extrabold text-white tracking-tight leading-[1.1] mb-5">
                        {isEvPage ? 'Hitta din\nelbilsmatch' : 'Hitta din\nbilmatch'}
                      </h2>
                      <ul className="flex flex-col gap-2.5 mb-6">
                        {(isEvPage ? [
                          'Personlig rekommendation på 60 sek',
                          'Jämför räckvidd och kostnad sida vid sida',
                          'Vi hjälper dig byta till bästa pris',
                        ] : [
                          'Personlig rekommendation på 60 sek',
                          'Jämför matchade bilar sida vid sida',
                          'Vi hjälper dig köpa till bästa pris',
                        ]).map(item => (
                          <li key={item} className="flex items-center gap-2.5 text-[14px] text-white/90">
                            <div className="w-[18px] h-[18px] rounded-full bg-white/25 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </div>
                            {item}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => setQuizStep('active')}
                        className="w-full h-[52px] rounded-xl bg-white text-[#0e6efe] font-bold text-[15px] flex items-center justify-center gap-2 group transition-all duration-200 active:scale-[0.98] shadow-lg shadow-black/10"
                      >
                        {isEvPage ? 'Hitta din elbilsmatch' : 'Hitta din bilmatch'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <p className="text-[11px] text-white/50 text-center mt-2.5">Tar 60 sekunder · Helt gratis</p>
                    </div>

                  </div>

                  {/* EquityFlow below card */}
                  <div className="mt-3">
                    <EquityFlow
                      compact
                      isEv={isEvPage}
                      onNegotiate={(carLabel, equitySummary) => openBuyDrawer(carLabel, undefined, false, equitySummary)}
                    />
                  </div>
                </div>

                {/* Desktop layout – unchanged */}
                <div className="hidden sm:flex flex-col lg:flex-row lg:items-center lg:gap-16">
                  <div className="flex flex-col items-center lg:items-start lg:flex-1 w-full">
                    <h2 className="text-[36px] sm:text-[42px] lg:text-[52px] font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-3 text-center lg:text-left">
                      Hitta din{' '}
                      <span className="text-[#0e6efe]">{isEvPage ? 'elbilsmatch' : 'bilmatch'}</span>
                    </h2>
                    <p className="text-slate-500 text-[15px] sm:text-[16px] lg:text-[17px] leading-relaxed mb-6 max-w-sm sm:max-w-md mx-auto lg:mx-0 text-center lg:text-left">
                      {isEvPage
                        ? 'Svara på 5 korta frågor om hur du kör, din räckviddsoro och budget – vi matchar dig med den elbil som passar dig bäst.'
                        : 'Svara på 5 korta frågor om hur du kör, vad du prioriterar och din budget – vi matchar dig med de bilar som passar dig bäst.'}
                    </p>
                    <ul className="flex flex-col gap-3 mb-7 w-full max-w-sm mx-auto lg:mx-0">
                      {(isEvPage ? [
                        'Personlig elbilsrekommendation på under 60 sekunder',
                        'Jämför räckvidd, laddtid och månadskostnad sida vid sida',
                        'Låt oss hjälpa dig byta till elbil till bästa pris',
                      ] : [
                        'Personlig rekommendation på under 60 sekunder',
                        'Jämför matchade bilar sida vid sida',
                        'Låt oss hjälpa dig köpa till bästa pris',
                      ]).map(item => (
                        <li key={item} className="flex items-center gap-3 text-[14px] sm:text-[15px] text-slate-700">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="w-full max-w-sm mx-auto lg:mx-0 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setQuizStep('active')}
                        className="w-full h-[54px] rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-bold text-[16px] flex items-center justify-center gap-2.5 group transition-all duration-200 shadow-lg shadow-[#0e6efe]/30 hover:shadow-xl hover:shadow-[#0e6efe]/35 hover:-translate-y-0.5 active:scale-[0.98]"
                      >
                        {isEvPage ? 'Hitta din elbilsmatch' : 'Hitta din bilmatch'}
                        <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <p className="text-[12px] text-slate-400 text-center">Tar 60 sekunder · Helt gratis</p>
                    </div>
                    <div className="w-full max-w-sm mx-auto lg:mx-0 mt-4 pt-4 border-t border-slate-100">
                      <EquityFlow
                        compact
                        isEv={isEvPage}
                        onNegotiate={(carLabel, equitySummary) => openBuyDrawer(carLabel, undefined, false, equitySummary)}
                      />
                    </div>
                  </div>
                  {/* Right: car image grid – desktop only */}
                  <div className="hidden lg:grid grid-cols-2 gap-4 w-[420px] shrink-0">
                    {(isEvPage
                      ? ['tesla_model_y', 'kia_ev6', 'hyundai_ioniq5', 'polestar_2']
                      : ['tesla_model_y', 'volvo_xc60', 'kia_ev6', 'hyundai_ioniq5']
                    ).map((cid, i) => {
                      const car = allCarsRaw.find(c => c.id === cid);
                      if (!car) return null;
                      const img = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
                      return (
                        <motion.div
                          key={cid}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.1 }}
                          className="aspect-[4/3] rounded-xl bg-white border border-slate-100 shadow-sm flex items-end justify-center overflow-hidden p-2"
                        >
                          {img && <img src={img} alt={`${car.brand_display} ${car.model_display}`} className="w-full h-auto object-contain" />}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
            {quizStep === 'active' && (
              <motion.div key="quiz-active-top" initial={isMobile ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ touchAction: 'pan-y' }} className="max-w-lg mx-auto px-4 sm:px-0 py-6 sm:py-0">
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
                        return <span key={p} className="shrink-0 px-3 py-1.5 rounded-xl bg-[#0e6efe]/10 text-[12px] font-medium text-[#0e6efe]">{names[p] || p}</span>;
                      })}
                      {quizAnswers.body_type?.map(bt => (
                        <span key={bt} className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-200 text-[12px] font-medium text-slate-700 capitalize">
                          {bt === 'hatchback' ? 'Halvkombi' : bt === 'coupe' ? 'Coupe' : bt.charAt(0).toUpperCase() + bt.slice(1)}
                        </span>
                      ))}
                      {quizAnswers.fuel_type?.map(ft => (
                        <span key={ft} className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-200 text-[12px] font-medium text-slate-700">
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
                        ? 'Max 3 bilar valda – avmarkera för att byta'
                        : `${selectedQuizCars.size} av 3 bil${selectedQuizCars.size > 1 ? 'ar' : ''} vald${selectedQuizCars.size > 1 ? 'a' : ''}`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                                make={car.make}
                                imageUrl={car.image_url || car.cleaned_image_url}
                                rating={car.rating}
                                topBadge={i === 0 && !isMobile}
                                pros={compData?.pros}
                                bodyType={compData?.specs.body_type}
                                drivetrain={compData?.specs.drivetrain}
                                seats={compData?.specs.seats}
                                fuelTypes={compData?.specs.fuel_types ?? ['el']}
                                carPrice={car.carPrice}
                                usedPrice={car.usedPrice}
                                isSelected={isSelected}
                                onSelect={() => toggleQuizCarSelection(key)}
                                onNegotiate={() => openBuyDrawer(`${car.make} ${car.model}`, undefined, false, undefined, compData?.specs.fuel_types)}
                                onDetail={() => { if (compData) setDetailCar(compData); }}
                              />
                            ) : (
                              <CompactCarCard
                                name={`${car.make} ${car.model}`}
                                make={car.make}
                                imageUrl={car.image_url || car.cleaned_image_url}
                                rating={car.rating}
                                topBadge={i === 0 && !isMobile}
                                expertComment={car.matchReasons.join(' · ') || undefined}
                                fuelLabel={car.fuelLabel}
                                fuelTypes={compData?.specs.fuel_types ?? parseFuelLabel(car.fuelLabel)}
                                bodyType={compData?.specs.body_type}
                                drivetrain={compData?.specs.drivetrain}
                                seats={compData?.specs.seats}
                                pros={compData?.pros}
                                carPrice={car.carPrice}
                                usedPrice={car.usedPrice}
                                isSelected={isSelected}
                                onSelect={() => toggleQuizCarSelection(key)}
                                onNegotiate={() => openBuyDrawer(`${car.make} ${car.model}`, undefined, false, undefined, compData?.specs.fuel_types)}
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
                          className="mt-6 rounded-xl bg-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shadow-xl"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white mb-1">
                              {selectedQuizCars.size === 1 ? '1 bil vald' : `${selectedQuizCars.size} bilar valda`}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {quizResults
                                .filter(c => selectedQuizCars.has(`${c.make}-${c.model}`))
                                .map(c => (
                                  <span key={`${c.make}-${c.model}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-[11px] font-medium text-white/90">
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
                              Gå vidare – vi ringer dig
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
                      <Car className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-[14px] text-slate-500 mb-4">Vi hjälper dig ändå – kontakta oss så hittar vi rätt bil.</p>
                    <button onClick={() => setBuyDrawerCar('')} className="h-11 px-6 rounded-xl bg-[#0e6efe] text-white font-semibold text-[14px] inline-flex items-center gap-2 transition">
                      Kontakta oss <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {quizAnswers && (
                  <div className="mt-6">
                    <SaveToPortalBanner
                      quizAnswers={quizAnswers as unknown as Record<string, unknown>}
                      source="bilmatch-quiz"
                      carLabel={quizResults[0] ? `${quizResults[0].make} ${quizResults[0].model}` : undefined}
                    />
                  </div>
                )}
                <div className="mt-4 flex items-center justify-center">
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
          <h2 className="text-[20px] sm:text-[28px] font-bold text-slate-900 text-center mb-8 sm:mb-10">Din väg till rätt bil</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: '1', title: 'Välj och jämför', desc: 'Jämför toppval, använd vår smarta sökning eller testa bilmatch för att hitta exakt rätt modell.', icon: Search },
              { step: '2', title: 'Vi pressar priset', desc: 'Vi kontaktar säljaren, förhandlar priset och granskar bilen åt dig. Du slipper förhandla själv.', icon: Megaphone },
              { step: '3', title: 'Bilen är din', desc: 'Du kan tuta och köra med gott samvete – vi har sett till att du gjort en riktigt bra affär.', icon: Handshake },
            ].map(s => {
              const StepIcon = s.icon;
              return (
              <div key={s.step} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 sm:text-center">
                <div className="w-10 h-10 rounded-xl bg-[#0e6efe] text-white flex items-center justify-center shrink-0 sm:mb-3">
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
        className="py-8 sm:py-14 px-4 sm:px-6 bg-[#faf8f5]"
      >
        <div className="max-w-6xl mx-auto">

          {/* Header row */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-[20px] sm:text-[28px] font-bold text-slate-900 tracking-tight">
              {carSearchQuery
                ? `Resultat för "${carSearchQuery}"`
                : activeCategory === 'el' ? 'Elbilar' : 'Experternas val'}
            </h2>
            <div className="flex items-center gap-3">
              {(carSearchQuery || activeCategory !== 'alla') && (
                <span className="text-[12px] font-medium text-slate-400">
                  {visibleCars.length} bilar
                </span>
              )}
            </div>
          </div>

          {/* Full-width search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
            <input
              type="text"
              value={carSearchQuery}
              onChange={e => { setCarSearchQuery(e.target.value); setActiveCategory('alla'); setShowAllCars(false); }}
              placeholder="Sök märke eller modell…"
              className="w-full h-12 pl-11 pr-10 rounded-xl bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-[#0e6efe] outline-none text-[14px] text-slate-800 placeholder:text-slate-400 shadow-sm transition-all"
            />
            {carSearchQuery && (
              <button
                type="button"
                onClick={() => setCarSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-5 scrollbar-hide -mx-1 px-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key && !carSearchQuery;
              return (
                <button
                  key={cat.key}
                  onClick={() => { setActiveCategory(cat.key); setShowAllCars(false); setCarSearchQuery(''); setExpertShowCount(6); }}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0e6efe] text-white shadow-md shadow-[#0e6efe]/25'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200/80 hover:text-slate-900 hover:ring-slate-300 hover:shadow-sm'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
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
              className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {visibleCars.map((car, i) => {
                const imgUrl = car.image_url || car.cleaned_image_url || getCarImage(car.make, car.model);
                const isEl = car.fuel_types?.includes('el') ?? false;
                const fuelLabel = car.fuel_types?.length
                  ? car.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')
                  : undefined;
                const compCar = findComparisonCarByMakeModel(car.make, car.model);
                const rating = car.rating_overall ?? compCar?.ratings.overall ?? undefined;
                const tcoItem: TcoCompareCar = {
                  id: car.id, name: `${car.make} ${car.model}`,
                  imageUrl: imgUrl, carPrice: car.price_new_from ?? undefined,
                  usedPrice: car.price_used_from ?? undefined, fuelTypes: car.fuel_types ?? [],
                };
                if (isEl) {
                  return (
                    <ElCarCard
                      key={car.id}
                      name={`${car.make} ${car.model}`}
                      make={car.make}
                      imageUrl={imgUrl}
                      rating={rating}
                      topBadge={i < 3}
                      expertComment={car.expert_comment ?? undefined}
                      carPrice={car.price_new_from ?? undefined}
                      usedPrice={car.price_used_from ?? undefined}
                      fuelLabel={fuelLabel}
                      fuelTypes={car.fuel_types ?? []}
                      bodyType={compCar?.specs.body_type}
                      drivetrain={compCar?.specs.drivetrain}
                      seats={compCar?.specs.seats}
                      pros={compCar?.pros}
                      isCompared={!!(compCar && selectedIds.has(compCar.id))}
                      cardMode={expertCardMode}
                      onNegotiate={() => openBuyDrawer(`${car.make} ${car.model}`, undefined, false, undefined, car.fuel_types ?? undefined)}
                      onDetail={() => { if (compCar) setDetailCar(compCar); }}
                      onCompare={compCar ? () => toggleSelect(compCar.id) : () => {}}
                      onFitQuiz={() => { if (compCar) setFitQuizCar(compCar); }}
                      onTcoCompare={() => toggleTcoCompare(tcoItem)}
                      isTcoCompared={tcoCompare.some(c => c.id === car.id)}
                    />
                  );
                }
                return (
                  <CompactCarCard
                    key={car.id}
                    name={`${car.make} ${car.model}`}
                    make={car.make}
                    imageUrl={imgUrl}
                    rating={rating}
                    topBadge={i < 3 && activeCategory === 'popular'}
                    expertComment={car.expert_comment ?? undefined}
                    fuelLabel={fuelLabel}
                    fuelTypes={car.fuel_types ?? []}
                    bodyType={compCar?.specs.body_type}
                    drivetrain={compCar?.specs.drivetrain}
                    seats={compCar?.specs.seats}
                    pros={compCar?.pros}
                    carPrice={car.price_new_from ?? undefined}
                    usedPrice={car.price_used_from ?? undefined}
                    cardMode={expertCardMode}
                    onNegotiate={() => openBuyDrawer(`${car.make} ${car.model}`, undefined, false, undefined, car.fuel_types ?? undefined)}
                    onDetail={() => { if (compCar) setDetailCar(compCar); }}
                    onCompare={compCar ? () => toggleSelect(compCar.id) : () => {}}
                    onFitQuiz={() => { if (compCar) setFitQuizCar(compCar); }}
                    isCompared={!!(compCar && selectedIds.has(compCar.id))}
                    onTcoCompare={() => toggleTcoCompare(tcoItem)}
                    isTcoCompared={tcoCompare.some(c => c.id === car.id)}
                    index={i}
                    disableMotion={isMobile}
                  />
                );
              })}

            </motion.div>
          </AnimatePresence>

          {/* "Hittar du inte bilen?" – always visible banner below grid */}
          <button
            type="button"
            onClick={() => openBuyDrawer(carSearchQuery.trim() || '', 'found')}
            className={`group w-full mt-4 flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 text-left ${
              activeCategory === 'el'
                ? 'bg-white/5 border-white/15 hover:border-[#38bdf8]/50 hover:bg-[#38bdf8]/5'
                : 'bg-white border-slate-200 hover:border-[#0e6efe] hover:bg-[#0e6efe]/[0.03]'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${activeCategory === 'el' ? 'bg-white/10 group-hover:bg-[#38bdf8]/15' : 'bg-slate-100 group-hover:bg-[#0e6efe]/10'}`}>
              <Search className={`w-5 h-5 transition-colors ${activeCategory === 'el' ? 'text-slate-500 group-hover:text-[#38bdf8]' : 'text-slate-400 group-hover:text-[#0e6efe]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[14px] font-bold transition-colors ${activeCategory === 'el' ? 'text-slate-300 group-hover:text-[#7dd3fc]' : 'text-slate-700 group-hover:text-[#0e6efe]'}`}>
                {carSearchQuery.trim() ? `Hitta en ${carSearchQuery.trim()}` : 'Hittar du inte bilen?'}
              </p>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Vi hjälper dig hitta och köpa
              </p>
            </div>
            <ArrowRight className={`w-4 h-4 shrink-0 transition-all group-hover:translate-x-1 ${activeCategory === 'el' ? 'text-slate-500 group-hover:text-[#38bdf8]' : 'text-slate-400 group-hover:text-[#0e6efe]'}`} />
          </button>

          {!carSearchQuery && !showAllCars && allCategoryCars.length > expertShowCount && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => {
                  const next = expertShowCount + 6;
                  if (next >= allCategoryCars.length) setShowAllCars(true);
                  else setExpertShowCount(next);
                }}
                className={`inline-flex items-center gap-2 px-7 py-3 rounded-xl text-[14px] font-semibold ring-1 transition-all duration-200 ${
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
              <div className="max-w-3xl mx-auto bg-slate-900 rounded-xl shadow-2xl shadow-black/30 px-4 sm:px-5 py-3 flex items-center gap-3">
                {/* Per-car thumbnails with individual remove */}
                <div className="flex items-center gap-2 shrink-0">
                  {selectedCars.slice(0, MAX_COMPARE).map(car => {
                    const img = getImageForCar(car);
                    return (
                      <div key={car.id} className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-700 overflow-hidden">
                          {img ? (
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => toggleSelect(car.id)}
                          aria-label={`Ta bort ${car.brand_display} ${car.model_display}`}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-600 hover:bg-red-500 flex items-center justify-center transition-colors"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    );
                  })}
                  {/* Empty slots hint */}
                  {selectedIds.size < 2 && Array.from({ length: 2 - selectedIds.size }).map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center shrink-0">
                      <span className="text-slate-600 text-[18px] font-light leading-none">+</span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-[13px] font-semibold leading-tight">
                    {selectedIds.size < 2
                      ? `Välj ${2 - selectedIds.size} bil till`
                      : `${selectedIds.size} bilar valda`}
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {selectedIds.size < 2 ? 'Tryck "Jämför" på ett kort' : 'Klicka X för att ta bort'}
                  </p>
                </div>

                <button
                  onClick={() => setCompareOpen(true)}
                  disabled={selectedIds.size < 2}
                  className="h-11 px-4 sm:px-6 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-700 disabled:text-slate-500 text-white text-[13px] font-semibold inline-flex items-center gap-2 transition shrink-0"
                >
                  <GitCompareArrows className="w-4 h-4" />
                  <span>Jämför</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bilbyte Section */}
      <section className="relative overflow-hidden bg-slate-900">
        <img
          src="/9e88d67e-f888-4b7f-b55b-60dea75193a3.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
          aria-hidden="true"
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-24">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold text-white/60 uppercase tracking-[0.18em] mb-4 sm:mb-5">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Byta bil
            </span>
            <h2 className="text-[30px] sm:text-[52px] font-bold text-white leading-[1.05] tracking-tight mb-3 sm:mb-4">
              Bilbyte?<br className="sm:hidden" /> Bilto.
            </h2>
            <p className="text-white/70 text-[14px] sm:text-[17px] leading-relaxed mb-6 sm:mb-8 max-w-md">
              Ange registreringsnumret på din nuvarande bil. Vi hjälper dig förhandla bästa möjliga värde och hitta din nästa.
            </p>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-6 max-w-md">
              <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-3">
                Din nuvarande bil
              </p>
              <div className="mb-1">
                <RegInput value={bilbyteReg} onChange={(v) => { setBilbyteReg(v); if (v) setBilbyteRegError(false); }} error={bilbyteRegError} />
                {bilbyteRegError && (
                  <p className="mt-2 text-[12.5px] text-red-300 font-medium">Ange registreringsnumret på din nuvarande bil först.</p>
                )}
                <BilbyteVehicleInfo regnummer={bilbyteReg} />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!bilbyteReg.trim()) {
                    setBilbyteRegError(true);
                    return;
                  }
                  openBuyDrawer('', 'trade', false, undefined, undefined, bilbyteReg.trim().toUpperCase());
                }}
                className="mt-4 w-full h-12 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-bold text-[15px] flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                Starta bilbyte
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 sm:mt-6 flex flex-col xs:flex-row flex-wrap gap-2 sm:gap-3">
              <button
                type="button"
                onClick={scrollToQuiz}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[13px] font-medium transition"
              >
                <Car className="w-3.5 h-3.5" />
                Hitta nästa bil – bilmatch
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('cars-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[13px] font-medium transition"
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
                          <span><span className="font-semibold text-slate-800">{item.label}</span>{' '}<span className="text-slate-500">– {item.desc}</span></span>
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
                    className="flex flex-col rounded-xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 ring-1 ring-white hover:ring-slate-200"
                  >
                    <div className="relative w-full aspect-[4/3] bg-white flex items-end justify-center overflow-hidden">
                      {img ? (
                        <img src={img} alt={`${car.brand_display} ${car.model_display}`} loading="lazy" className="w-full h-auto object-contain group-hover:scale-[1.04] transition-transform duration-500" />
                      ) : (
                        <Car className="w-12 h-12 text-slate-300 mb-4" />
                      )}
                      {car.ratings.overall != null && (
                        <div className={`absolute top-2 right-2 w-8 h-8 rounded-xl shadow-md flex items-center justify-center ${car.ratings.overall >= 9 ? 'bg-emerald-500' : 'bg-[#0e6efe]'}`}>
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
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* AI Smart Search */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-[#0e1c2f]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-[13px] font-medium text-white mb-4">
              <Sparkles className="w-4 h-4 text-[#5b9bfe]" />
              AI-bilsökning
            </div>
            <h2 className="text-[22px] sm:text-[32px] font-bold text-white mb-2">
              Hittar du inte rätt bil?
            </h2>
            <p className="text-slate-300 text-[14px] sm:text-[16px] max-w-lg mx-auto leading-relaxed">
              Beskriv vad du söker – "barnvagn och stor bagage", "elbil för pendling" eller "sportig kombi under 500k".
            </p>
          </div>

          <div className="bg-slate-900 rounded-2xl ring-1 ring-white/10 overflow-hidden">
            {/* Chat messages */}
            <div
              ref={chatScrollRef}
              className="overflow-y-auto overscroll-contain"
              style={{
                WebkitOverflowScrolling: 'touch',
                maxHeight: (chatMessages.length > 0 || chatSearching) ? '520px' : '0px',
                transition: 'max-height 0.3s ease',
              }}
            >
              <div className="p-4 sm:p-6 space-y-5">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[92%] sm:max-w-[88%]">
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-[#0e6efe] flex items-center justify-center shrink-0">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-[11px] font-semibold text-[#5b9bfe] tracking-wide uppercase">Bilto AI</span>
                        </div>
                      )}
                      <div className={`px-4 py-2.5 rounded-xl text-[14px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#0e6efe] text-white rounded-br-sm'
                          : 'bg-slate-800 text-slate-200 ring-1 ring-white/10 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      {msg.cars && msg.cars.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.cars.map((car, ci) => {
                            const imgUrl = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
                            return (
                              <motion.div
                                key={car.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: ci * 0.09, ease: 'easeOut' }}
                              >
                                {car.specs.fuel_types.includes('el') ? (
                                  <ElCarCard
                                    name={`${car.brand_display} ${car.model_display}`}
                                    make={car.brand_display}
                                    imageUrl={imgUrl}
                                    rating={car.ratings.overall}
                                    fuelTypes={car.specs.fuel_types}
                                    pros={car.pros}
                                    bodyType={car.specs.body_type}
                                    drivetrain={car.specs.drivetrain}
                                    seats={car.specs.seats}
                                    carPrice={car.pricing.new_from_sek ?? undefined}
                                    usedPrice={car.pricing.used_from_sek ?? undefined}
                                    isCompared={selectedIds.has(car.id)}
                                    onNegotiate={() => openContactForCar(car)}
                                    onDetail={() => setDetailCar(car)}
                                    onCompare={() => toggleSelect(car.id)}
                                  />
                                ) : (
                                  <CompactCarCard
                                    name={`${car.brand_display} ${car.model_display}`}
                                    make={car.brand_display}
                                    imageUrl={imgUrl}
                                    rating={car.ratings.overall}
                                    fuelLabel={car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')}
                                    fuelTypes={car.specs.fuel_types}
                                    bodyType={car.specs.body_type}
                                    drivetrain={car.specs.drivetrain}
                                    seats={car.specs.seats}
                                    pros={car.pros}
                                    onNegotiate={() => openContactForCar(car)}
                                    onDetail={() => setDetailCar(car)}
                                    onCompare={() => toggleSelect(car.id)}
                                    isCompared={selectedIds.has(car.id)}
                                    index={ci}
                                  />
                                )}
                              </motion.div>
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
                              className="px-3 py-1.5 rounded-xl bg-slate-700 text-[12px] text-slate-200 font-medium hover:bg-[#0e6efe] hover:text-white transition-all active:scale-95"
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                  {chatSearching && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-start"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-[#0e6efe] flex items-center justify-center shrink-0">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-[11px] font-semibold text-[#5b9bfe] tracking-wide uppercase">Bilto AI</span>
                        </div>
                        <div className="px-4 py-3.5 rounded-xl bg-slate-800 ring-1 ring-white/10 rounded-bl-sm inline-flex items-center gap-1.5">
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full bg-slate-400"
                              animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                              transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-900">
              {chatMessages.length === 0 && !chatSearching && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {[
                    { label: 'Familje-SUV', query: 'Familje-SUV under 500k' },
                    { label: 'Bästa elbilen', query: 'Bästa elbilen' },
                    { label: 'Sportig kombi', query: 'Sportig kombi' },
                    { label: 'Bil med barnvagn', query: 'Bil med barnvagn' },
                    { label: 'Bil för hund', query: 'Bil för hund' },
                    { label: 'SUV med AWD', query: 'SUV med AWD' },
                  ].map(({ label, query }) => (
                    <button
                      key={label}
                      onClick={() => handleChatSubmit(query)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-[13px] text-white font-medium hover:bg-[#0e6efe] transition-all border border-white/15 active:scale-95"
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
                  disabled={chatSearching}
                  className="flex-1 h-11 px-4 rounded-xl border border-orange-300 bg-white text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-700/40 focus:border-orange-700 transition placeholder:text-slate-400 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatSearching}
                  className="h-11 w-11 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:opacity-40 text-white flex items-center justify-center transition shrink-0 active:scale-95"
                >
                  {chatSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Johan testimonial */}
      <section className="bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 sm:py-12">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5 order-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-3 block">
                Kundcase
              </span>
              <h2 className="text-[22px] sm:text-[34px] font-semibold leading-[1.15] sm:leading-[1.1] text-slate-900 tracking-[-0.02em]">
                "Bilto löste allt från start till mål – jag behövde inte göra någonting själv."
              </h2>
              <p className="text-slate-600 mt-4 text-[14px] sm:text-[15px] leading-[1.65] max-w-md">
                Johan ville köpa en Toyota RAV4 men hade varken tid eller lust att jaga annonser och förhandla. Bilto tog hand om hela affären – hittade rätt bil, förhandlade priset och såg till att allt gick smidigt. Johan sparade både pengar och en massa tid.
              </p>
              <p className="text-[13px] text-slate-500 mt-5">
                Johan K. – Toyota RAV4, 2023
              </p>
            </div>
            <div className="md:col-span-7 order-2">
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src="/manrope_(1920_x_1080_px)_(1280_x_720_px)_(Instagram_Post_(45))_copy_copy_copy_copy_copy.jpg"
                  alt="Johan framför sin Toyota RAV4"
                  className="w-full h-[300px] sm:h-[460px] md:h-[520px] object-cover"
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
          <div className="text-left mb-10 sm:mb-14 max-w-2xl">
            <span className="text-[12px] font-medium text-slate-500 mb-3 block">
              &mdash; Vad ingår
            </span>
            <h2 className="text-[26px] sm:text-[44px] font-semibold leading-[1.15] sm:leading-[1.04] text-slate-900 tracking-[-0.02em]">
              En personlig bilförhandlare i fickan
            </h2>
            <p className="text-slate-600 mt-4 text-[15px] sm:text-[17px] leading-[1.6]">
              Tjänsten är gjord för dig som inte vill spendera dagar på att jaga bilar, ringa annonser eller känna dig pressad i en handlares showroom.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                icon: Search,
                title: 'Vi letar bilen åt dig',
                text: 'Vi kontrollerar hela marknaden – inte bara en handlares lager – och hittar bilar som matchar dina önskemål och budget.',
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
                  className="group rounded-xl border border-slate-200 bg-white p-5 sm:p-7 hover:border-[#0e6efe]/40 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-full h-[140px] sm:h-[160px] flex items-center justify-center mb-5 overflow-hidden rounded-xl bg-[#faf8f5] group-hover:bg-[#0e6efe]/5 transition-colors duration-300">
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
              Vi granskar varje detalj – så slipper du oroa dig
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
                { label: 'Bilens skick', desc: 'Från lack och inredning till maskinellt och elektronik – vi bedömer det faktiska skicket, inte bara foton i annonsen.' },
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
          <div className="mt-12 sm:mt-16 flex justify-start">
            <div className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl px-4 sm:px-7 py-3 sm:py-4 shadow-sm max-w-xs sm:max-w-none">
              <ShieldCheck className="w-5 h-5 text-[#0e6efe] shrink-0 mt-0.5" strokeWidth={2} />
              <span className="text-[13px] sm:text-[15px] text-slate-700 font-medium leading-snug">
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
          src="/b858d9c8-9893-488f-8103-98fee9292c16.png"
          alt="Bilaffär med Bilto"
          className="w-full h-[340px] sm:h-[480px] object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 w-full">
            <p className="text-[11px] font-bold text-white/60 uppercase tracking-[0.18em] mb-3">Bilto – din bilexpert</p>
            <h2 className="text-[32px] sm:text-[52px] font-bold text-white leading-[1.05] tracking-tight mb-4 max-w-xl">
              Vi gör din bilaffär trygg och enkel.
            </h2>
            <p className="text-white/70 text-[15px] sm:text-[17px] leading-relaxed mb-8 max-w-md">
              Ingen bindning. Inga dolda avgifter. Du tackar ja eller nej.
            </p>
            <button
              type="button"
              onClick={() => openBuyDrawer('', 'searching')}
              className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-bold text-[15px] transition active:scale-[0.98] shadow-lg"
            >
              Kom igång gratis
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Buy drawer */}
      <BuyDrawer car={buyDrawerCar} initialTrack={buyDrawerTrack} skipIntent={buyDrawerSkipIntent} initialAdditionalRequests={buyDrawerEquity || undefined} fuelTypes={buyDrawerFuelTypes} initialReg={buyDrawerInitialReg} onClose={() => { setBuyDrawerCar(null); setBuyDrawerEquity(''); setBuyDrawerFuelTypes(undefined); setBuyDrawerInitialReg(''); }} />

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

      {/* TCO compare bar */}
      <TcoCompareBar
        cars={tcoCompare}
        onRemove={(id) => setTcoCompare(prev => prev.filter(c => c.id !== id))}
        onGetHelp={(name) => openBuyDrawer(name, 'found')}
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
          onFitQuiz={() => { const car = detailCar; setDetailCar(null); setFitQuizCar(car); }}
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

      {/* Search alert modal */}
      <SearchAlertModal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        filters={{ budget: activeBudget, category: activeCategory }}
        filterLabel={[
          activeBudget ? `Budget: ${activeBudget}` : null,
          activeCategory && activeCategory !== 'alla' ? `Kategori: ${activeCategory}` : null,
        ].filter(Boolean).join(' · ') || 'Alla bilar'}
      />
    </div>
  );
}

function BilbyteVehicleInfo({ regnummer }: { regnummer: string }) {
  const lookup = useVehicleLookup(regnummer);

  if (!regnummer.trim()) return null;

  if (lookup.status === 'loading') {
    return (
      <div className="mt-2 flex items-center gap-2 text-[13px] text-white/60">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Hämtar biluppgifter...</span>
      </div>
    );
  }

  if (lookup.status === 'found') {
    const { marke, modell, ar, miltal } = lookup.data;
    const label = [marke, modell, ar ? String(ar) : ''].filter(Boolean).join(' ');
    return (
      <div className="mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 bg-white/15 border border-white/25 rounded-lg">
        <span className="text-[13px] font-bold text-white tracking-widest">{regnummer.toUpperCase()}</span>
        {label && (
          <>
            <span className="text-white/30">&middot;</span>
            <span className="text-[13px] font-semibold text-white">{label}</span>
          </>
        )}
        {miltal != null && miltal > 0 && (
          <>
            <span className="text-white/30">&middot;</span>
            <span className="text-[13px] text-white/70">{miltal.toLocaleString('sv-SE')} mil</span>
          </>
        )}
      </div>
    );
  }

  if (lookup.status === 'not_found') {
    return <p className="mt-2 text-[13px] text-amber-300">Bilen hittades inte i registret.</p>;
  }

  return null;
}
