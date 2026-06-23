import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const LOAN_RATE = 0.0799 / 12; // ~8% APR, typiskt billån Sverige 2025-2026
const LOAN_MONTHS = 60;        // 5 år – vanligast för begagnat
const LOAN_DOWN_PCT = 0.20;
const LOAN_FEE_PCT = 0.01;

export function calcCarMonthly(carPrice: number, residualPct: 0.50 | 0.55 = 0.55): number {
  const kontantinsats = carPrice * LOAN_DOWN_PCT;
  const avgift = carPrice * LOAN_FEE_PCT;
  const loan = carPrice - kontantinsats + avgift;
  const residualAmount = carPrice * residualPct;
  const r = LOAN_RATE;
  const n = LOAN_MONTHS;
  return ((loan - residualAmount / Math.pow(1 + r, n)) * r) / (1 - Math.pow(1 + r, -n));
}

// Uses midpoint between used and new price so the estimate reflects typical buyer reality.
export function calcCarMonthlyRange(
  carPrice: number,
  usedPrice?: number,
): { low: number; high: number; basePrice: number } {
  const basePrice = usedPrice ? Math.round((carPrice + usedPrice) / 2) : carPrice;
  return {
    low: Math.round(calcCarMonthly(basePrice, 0.55)),
    high: Math.round(calcCarMonthly(basePrice, 0.50)),
    basePrice,
  };
}

const PREMIUM_MAKES = new Set(['bmw', 'mercedes', 'audi', 'porsche', 'lexus', 'jaguar', 'land rover', 'landrover', 'genesis', 'maserati', 'bentley', 'rolls-royce', 'volvo']);

export interface TCOBreakdown {
  financing: number;
  fuel: number;
  insurance: number;
  service: number;
  tax: number;
  total: number;
}

export function calcMonthlyTCO({
  carPrice,
  usedPrice,
  fuelTypes = [],
  make,
}: {
  carPrice: number;
  usedPrice?: number;
  fuelTypes?: string[];
  make?: string;
}): TCOBreakdown {
  const range = calcCarMonthlyRange(carPrice, usedPrice);
  const financing = range.low;
  const basePrice = range.basePrice;
  const isPremium = make ? PREMIUM_MAKES.has(make.toLowerCase()) : basePrice > 450_000;

  const isEl = fuelTypes.includes('el');
  const isLaddhybrid = fuelTypes.includes('laddhybrid');
  const isMildhybrid = fuelTypes.includes('mildhybrid');
  const isHybrid = fuelTypes.includes('hybrid');
  const isDiesel = fuelTypes.includes('diesel');

  // Bränsle/el vid 1 500 mil/år (15 000 km/år = 1 250 km/mån)
  // El: ~20 kWh/100 km × 1 250 km × 0,70 kr/kWh = 175 kr/mån (hemmaladdning ~0,70 kr/kWh inkl. nätavgift)
  // Laddhybrid: 60 % el + 40 % bensin (0,7 l/mil): 105 + 945 = ~1 050 kr/mån
  // Mildhybrid: likt bensin men ~10 % bättre → 0,72 l/mil: 1 350 kr/mån
  // Hybrid: 15 % bättre bensin → 0,68 l/mil: ~1 275 kr/mån
  // Diesel: 0,58 l/mil × 19,50 kr: ~1 130 kr/mån
  // Bensin: 0,80 l/mil × 18,00 kr: ~1 800 kr/mån
  const fuel = isEl
    ? 175
    : isLaddhybrid
    ? 1050
    : isHybrid
    ? 1275
    : isMildhybrid
    ? 1350
    : isDiesel
    ? 1130
    : 1800;

  // Helförsäkring – halvårspremie delat på 6, baserat på bilens värde
  const insurance =
    basePrice < 200_000 ? 450
    : basePrice < 350_000 ? 625
    : basePrice < 550_000 ? 900
    : 1250;

  // Service & reparation per mån (inkl. däck, delar, verkstad)
  // El: ingen olja, regenerativ bromsning – ~200 kr/mån
  // Premium: märkesverkstad, dyrare delar – ~750 kr/mån
  // Diesel: lite mer underhåll än bensin – ~500 kr/mån
  // Standard: ~380 kr/mån
  const service = isEl ? 200 : isPremium ? 750 : isDiesel ? 500 : 380;

  // Fordonsskatt (fordonsskatt.se) – månadsvis
  // El: grundavgift 360 kr/år → 30 kr/mån
  // Laddhybrid/mildhybrid: ~2 400 kr/år → 200 kr/mån
  // Hybrid: ~2 800 kr/år → 233 kr/mån
  // Diesel med lågt CO2: +500 kr/år premium → räkna upp
  // Bensin medel (130-160 g CO2): ~2 400 kr/år → 200 kr/mån
  // Stor bensin/SUV (>180 g): ~4 800 kr/år → 400 kr/mån
  const tax = isEl
    ? 30
    : isLaddhybrid || isMildhybrid
    ? 200
    : isHybrid
    ? 233
    : isDiesel
    ? 275
    : basePrice >= 500_000
    ? 400  // stor/sportbil med högt CO2
    : 200;

  return { financing, fuel, insurance, service, tax, total: financing + fuel + insurance + service + tax };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates a Swedish phone number.
 * Accepts: 07X XXX XX XX, +46 7X XXX XX XX, 0046 7X XXX XX XX
 * Also accepts Swedish landlines: 08-XXX XX XX etc.
 * Returns error message string or null if valid.
 */
export function validateSwedishPhone(raw: string): string | null {
  if (!raw.trim()) return 'Telefonnummer är obligatoriskt';

  const digits = raw.replace(/[\s\-().]/g, '');

  // Normalize: strip leading 0046 or +46, replace with 0
  let normalized = digits;
  if (normalized.startsWith('+46')) {
    normalized = '0' + normalized.slice(3);
  } else if (normalized.startsWith('0046')) {
    normalized = '0' + normalized.slice(4);
  }

  // Must be only digits now
  if (!/^\d+$/.test(normalized)) {
    return 'Ange ett giltigt svenskt telefonnummer';
  }

  // Swedish numbers are 9–10 digits starting with 0
  if (!normalized.startsWith('0')) {
    return 'Ange ett giltigt svenskt telefonnummer (+46 eller 07X…)';
  }

  if (normalized.length < 9 || normalized.length > 10) {
    return 'Telefonnumret måste ha 9–10 siffror (t.ex. 070-123 45 67)';
  }

  return null;
}
