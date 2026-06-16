import { useState, useEffect } from 'react';
import { Car, Loader as Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { type QuizAnswers, BRAND_CATEGORIES, BODY_TYPE_KEYWORDS, FUEL_TYPE_KEYWORDS, PRIORITY_TRAITS } from './QuizTypes';
import { findComparisonCarByMakeModel } from '@/lib/comparison';
import DarkCarCard from '@/components/DarkCarCard';

interface QuizResultsProps {
  answers: QuizAnswers;
  onBack?: () => void;
  onSelectCar?: (car: RecommendedCar) => void;
}

export interface RecommendedCar {
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url?: string | null;
  matchScore: number;
  matchReasons: string[];
  avgPrice?: number;
  priceRange?: { min: number; max: number };
  listingsCount?: number;
  bodyType?: string;
  fuelType?: string;
  fuelLabel?: string;
  rating?: number;
  trunkLiters?: number;
}

interface CatalogCar {
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url: string | null;
}

function detectBodyType(model: string): string | null {
  const modelLower = model.toLowerCase();
  for (const [bodyType, keywords] of Object.entries(BODY_TYPE_KEYWORDS)) {
    if (keywords.some(k => modelLower.includes(k))) return bodyType;
  }
  return null;
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

function scoreCarMatch(car: CatalogCar, answers: QuizAnswers): { score: number; reasons: string[] } {
  let score = 40;
  const reasons: string[] = [];
  const modelLower = car.model.toLowerCase();
  const makeUpper = car.make.toUpperCase();

  const detectedBodyType = detectBodyType(car.model);
  const detectedFuelType = detectFuelType(car.model, car.make);
  const brandCategory = getBrandCategory(car.make);

  if (answers.body_type && answers.body_type.length > 0) {
    if (detectedBodyType && answers.body_type.includes(detectedBodyType)) {
      score += 25;
      const bodyNames: Record<string, string> = { suv: 'SUV', kombi: 'Kombi', sedan: 'Sedan', hatchback: 'Halvkombi', coupe: 'Coupe' };
      reasons.push(`${bodyNames[detectedBodyType] || detectedBodyType} som du söker`);
    }
  }

  if (answers.fuel_type && answers.fuel_type.length > 0) {
    if (detectedFuelType && answers.fuel_type.includes(detectedFuelType)) {
      score += 20;
      const fuelNames: Record<string, string> = { electric: 'Elbil', hybrid: 'Hybrid', petrol: 'Bensin', diesel: 'Diesel' };
      reasons.push(`${fuelNames[detectedFuelType]} enligt önskemål`);
    }
  }

  if (answers.brand_preference && answers.brand_preference !== 'no_preference') {
    if (brandCategory === answers.brand_preference) {
      score += 15;
      const names: Record<string, string> = { premium: 'Premiummärke', mainstream: 'Pålitligt märke', value: 'Prisvärt märke' };
      reasons.push(names[brandCategory]);
    }
  }

  if (answers.priorities && answers.priorities.length > 0) {
    let priorityMatches = 0;
    for (const priority of answers.priorities) {
      const trait = PRIORITY_TRAITS[priority as keyof typeof PRIORITY_TRAITS];
      if (!trait) continue;
      if (trait.brands.some(b => makeUpper.includes(b.toUpperCase())) && priorityMatches < 3) {
        score += 5;
        priorityMatches++;
        const pNames: Record<string, string> = {
          economy: 'Låga driftskostnader', safety: 'Känd för säkerhet', comfort: 'Hög komfort',
          performance: 'Bra prestanda', space: 'Rymlig', tech: 'Modern teknik',
          resale: 'Bra andrahandsvärde', reliability: 'Pålitlig',
        };
        if (!reasons.includes(pNames[priority])) reasons.push(pNames[priority]);
      }
      if (trait.keywords.some(k => modelLower.includes(k)) && priorityMatches < 3) {
        score += 5;
        priorityMatches++;
      }
    }
  }

  if (answers.daily_use === 'family') {
    const familyKw = ['xc', 'x3', 'x5', 'q5', 'q7', 'gle', 'glc', 'v60', 'v90', 'kombi', 'touring', 'avant', 'tiguan', 'kodiaq'];
    if (familyKw.some(k => modelLower.includes(k))) { score += 10; reasons.push('Passar familjen'); }
  } else if (answers.daily_use === 'solo') {
    const soloKw = ['golf', 'a3', 'polo', '1-serie', 'a-klass', 'model 3', 'id.3'];
    if (soloKw.some(k => modelLower.includes(k))) { score += 10; reasons.push('Perfekt för pendling'); }
  } else if (answers.daily_use === 'cargo') {
    const cargoKw = ['v90', 'v60', 'xc90', 'x5', 'q7', 'gle', 'kodiaq', 'superb'];
    if (cargoKw.some(k => modelLower.includes(k))) { score += 10; reasons.push('Stort lastutrymme'); }
  }

  if (answers.annual_mileage === 'high' && detectedFuelType === 'diesel') {
    score += 5; reasons.push('Bra för långpendling');
  } else if (answers.annual_mileage === 'low' && detectedFuelType === 'electric') {
    score += 5; reasons.push('Perfekt för stadskörning');
  }

  return { score: Math.min(100, score), reasons: reasons.slice(0, 4) };
}

export function QuizResults({ answers, onBack, onSelectCar }: QuizResultsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedCar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigateToBuy = (carLabel: string) => {
    const params = new URLSearchParams();
    if (carLabel) params.set('bil', carLabel);
    params.set('source', 'Quiz resultat');
    window.history.pushState({}, '', `/kop-bil?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  useEffect(() => {
    async function loadRecommendations() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('car_catalog')
          .select('make, model, image_url, cleaned_image_url')
          .not('image_url', 'is', null);

        if (error) throw error;

        const catalogCars = (data || []) as unknown as CatalogCar[];
        const fuelLabels: Record<string, string> = {
          bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid',
          laddhybrid: 'Laddhybrid', el: 'El',
        };

        const scoredCars = catalogCars
          .map(car => {
            const { score, reasons } = scoreCarMatch(car, answers);
            const compData = findComparisonCarByMakeModel(car.make, car.model);
            const bodyType = detectBodyType(car.model) || compData?.specs.body_type || undefined;
            const fuelType = detectFuelType(car.model, car.make) || undefined;
            const fuelLabel = compData?.specs.fuel_types
              ? compData.specs.fuel_types.map(f => fuelLabels[f] || f).join(' / ')
              : fuelType === 'electric' ? 'El' : fuelType === 'hybrid' ? 'Hybrid' : fuelType === 'diesel' ? 'Diesel' : 'Bensin';

            return {
              make: car.make,
              model: car.model,
              image_url: car.image_url,
              cleaned_image_url: car.cleaned_image_url,
              matchScore: score,
              matchReasons: reasons,
              bodyType,
              fuelType,
              fuelLabel,
              rating: compData?.ratings.overall ?? undefined,
              trunkLiters: compData?.specs.trunk_liters ?? undefined,
            };
          })
          .filter(car => car.matchScore >= 50)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 4);

        setRecommendations(scoredCars);
      } catch (err) {
        console.error('Error loading recommendations:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecommendations();
  }, [answers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const bodyLabelMap: Record<string, string> = { suv: 'SUV', kombi: 'Kombi', sedan: 'Sedan', hatchback: 'Halvkombi', coupe: 'Coupe' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">
          Vi hittade {recommendations.length} bilar som passar dig
        </h2>
        <p className="text-slate-400 text-[14px]">
          Baserat på dina svar har vi valt ut bilar som matchar dina önskemål.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {recommendations.map((car, index) => (
          <DarkCarCard
            key={`${car.make}-${car.model}`}
            name={`${car.make} ${car.model}`}
            imageUrl={car.cleaned_image_url || car.image_url}
            rating={car.rating}
            matchScore={car.matchScore}
            topBadge={index === 0}
            pros={car.matchReasons.slice(0, 1)}
            bodyLabel={car.bodyType ? (bodyLabelMap[car.bodyType] || car.bodyType) : undefined}
            fuelLabel={car.fuelLabel}
            trunkLiters={car.trunkLiters}
            onNegotiate={() => navigateToBuy(`${car.make} ${car.model}`)}
            onDetail={() => onSelectCar?.(car)}
            index={index}
          />
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Car className="w-7 h-7 text-slate-500" />
          </div>
          <h3 className="text-[18px] font-bold text-white mb-2">Inga exakta matchningar hittades</h3>
          <p className="text-slate-400 text-[14px] mb-6">Prova att justera dina preferenser för att se fler bilar.</p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-8 py-3 rounded-xl bg-[#0e6efe] text-white font-semibold text-[14px]"
            >
              Gör om quizen
            </button>
          )}
        </div>
      )}

    </div>
  );
}
