import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const LOAN_RATE = 0.0649 / 12;
const LOAN_MONTHS = 36;
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

const PREMIUM_MAKES = new Set(['bmw', 'mercedes', 'audi', 'porsche', 'lexus', 'jaguar', 'land rover', 'landrover', 'genesis', 'maserati', 'bentley', 'rolls-royce']);

export interface TCOBreakdown {
  financing: number;
  fuel: number;
  insurance: number;
  service: number;
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
  const isHybrid = fuelTypes.includes('hybrid');
  const isDiesel = fuelTypes.includes('diesel');

  // ~1 500 mil/år — 125 mil/mån
  const fuel = isEl ? 450 : isLaddhybrid ? 800 : isHybrid ? 1350 : isDiesel ? 1350 : 1750;

  // Halvårspremie beroende på bilens värde
  const insurance = basePrice < 200_000 ? 600 : basePrice < 350_000 ? 850 : basePrice < 550_000 ? 1250 : 1750;

  // Service + reparation + delar
  const service = isEl ? 250 : isPremium ? 700 : 400;

  return { financing, fuel, insurance, service, total: financing + fuel + insurance + service };
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
