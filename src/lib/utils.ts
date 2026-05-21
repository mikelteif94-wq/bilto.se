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
