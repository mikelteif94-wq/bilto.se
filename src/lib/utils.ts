import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
