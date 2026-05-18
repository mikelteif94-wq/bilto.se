import { ComparisonCar } from './types';
import { ALL_COMPARISON_CARS } from './data/all-cars';

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  if (a.includes(b) || b.includes(a)) {
    return 0.9;
  }

  const aWords = a.split(' ');
  const bWords = b.split(' ');
  let matches = 0;
  for (const aw of aWords) {
    if (bWords.some(bw => bw === aw || bw.includes(aw) || aw.includes(bw))) {
      matches++;
    }
  }
  return matches / Math.max(aWords.length, bWords.length);
}

export function findComparisonCarByMakeModel(
  make: string,
  model: string
): ComparisonCar | null {
  const searchMake = normalize(make);
  const searchModel = normalize(model);
  const searchFull = `${searchMake} ${searchModel}`;

  let bestMatch: ComparisonCar | null = null;
  let bestScore = 0;

  for (const car of ALL_COMPARISON_CARS) {
    if (!car.is_active) continue;

    const carMake = normalize(car.brand_display);
    const carModel = normalize(car.model_display);
    const carFull = `${carMake} ${carModel}`;

    if (carMake === searchMake && carModel === searchModel) {
      return car;
    }

    let score = 0;

    if (carMake === searchMake) {
      score += 0.4;
      score += similarity(carModel, searchModel) * 0.6;
    } else {
      score = similarity(carFull, searchFull) * 0.7;
    }

    if (score > bestScore && score >= 0.55) {
      bestScore = score;
      bestMatch = car;
    }
  }

  return bestMatch;
}

export function getAllComparisonCars(): ComparisonCar[] {
  return ALL_COMPARISON_CARS.filter(c => c.is_active);
}
