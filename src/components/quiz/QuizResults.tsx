import { useState, useEffect, useMemo } from 'react';
import { Check, ArrowRight, Phone, Loader2, RotateCcw, User, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { QuizAnswers, FREE_TEXT_SIGNALS, BRAND_CATEGORIES } from './QuizTypes';
import { getAllComparisonCars } from '@/lib/comparison';
import { ComparisonCar } from '@/lib/comparison/types';

export interface RecommendedCar {
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url?: string | null;
  matchScore: number;
  matchReasons: string[];
  whyForYou: string;
  bodyType?: string;
  fuelLabel?: string;
  rating?: number;
  trunkLiters?: number;
  usedPrice?: number;
  newPrice?: number;
  id: string;
}

interface QuizResultsProps {
  answers: QuizAnswers;
  onBack?: () => void;
  onReset?: () => void;
}

// Parse free text into signals
function parseFreeText(text: string): Partial<QuizAnswers> & { extraTags: string[] } {
  const result: Partial<QuizAnswers> = {};
  const extraTags: string[] = [];
  if (!text) return { extraTags };

  for (const { patterns, signals } of FREE_TEXT_SIGNALS) {
    if (patterns.some(p => p.test(text))) {
      if (signals.body_type) {
        result.body_type = [...new Set([...(result.body_type || []), ...signals.body_type])];
      }
      if (signals.fuel_type) {
        result.fuel_type = [...new Set([...(result.fuel_type || []), ...signals.fuel_type])];
      }
      if (signals.priorities) {
        result.priorities = [...new Set([...(result.priorities || []), ...signals.priorities])];
      }
      if (signals.daily_use && !result.daily_use) result.daily_use = signals.daily_use;
      if (signals.annual_mileage && !result.annual_mileage) result.annual_mileage = signals.annual_mileage;
      if (signals.brand_preference && !result.brand_preference) result.brand_preference = signals.brand_preference;
      if (signals.extraTags) extraTags.push(...signals.extraTags);
    }
  }
  return { ...result, extraTags };
}

function getBrandCategory(make: string): 'premium' | 'mainstream' | 'value' {
  const upper = make.toUpperCase();
  if (BRAND_CATEGORIES.premium.some(b => upper.includes(b.toUpperCase()))) return 'premium';
  if (BRAND_CATEGORIES.value.some(b => upper.includes(b.toUpperCase()))) return 'value';
  return 'mainstream';
}

const FUEL_MAP: Record<string, string> = { el: 'El', bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid', laddhybrid: 'Laddhybrid' };
const FUEL_QUIZ_MAP: Record<string, string> = { el: 'electric', bensin: 'petrol', diesel: 'diesel', hybrid: 'hybrid', laddhybrid: 'hybrid' };

function scoreComparisonCar(
  car: ComparisonCar,
  answers: QuizAnswers,
  parsed: ReturnType<typeof parseFreeText>
): { score: number; reasons: string[]; whyForYou: string } {
  let score = 30;
  const reasons: string[] = [];

  const bodyTypes = parsed.body_type || answers.body_type || [];
  const fuelTypes = parsed.fuel_type || answers.fuel_type || [];
  const priorities = [...new Set([...(parsed.priorities || []), ...(answers.priorities || [])])];
  const brandPref = parsed.brand_preference || answers.brand_preference;
  const dailyUse = parsed.daily_use || answers.daily_use;
  const extraTags = parsed.extraTags || [];
  const brandCat = getBrandCategory(car.brand_display);

  // Body type match — strong signal
  if (bodyTypes.length > 0) {
    if (bodyTypes.includes(car.specs.body_type)) {
      score += 30;
      const labels: Record<string, string> = { suv: 'SUV', kombi: 'Kombi', sedan: 'Sedan', hatchback: 'Halvkombi', coupe: 'Coupé' };
      reasons.push(labels[car.specs.body_type] || car.specs.body_type);
    } else {
      // Penalize mismatch to enforce diversity
      score -= 15;
    }
  }

  // Fuel type match
  if (fuelTypes.length > 0) {
    const carFuelMapped = car.specs.fuel_types.map(f => FUEL_QUIZ_MAP[f] || f);
    const matched = fuelTypes.some(ft => carFuelMapped.includes(ft));
    if (matched) {
      score += 20;
      const fuelLabel = car.specs.fuel_types.map(f => FUEL_MAP[f] || f).join('/');
      reasons.push(fuelLabel);
    } else {
      score -= 10;
    }
  }

  // Brand preference
  if (brandPref && brandPref !== 'no_preference') {
    if (brandCat === brandPref) {
      score += 12;
      if (brandPref === 'premium') reasons.push('Premiummärke');
      else if (brandPref === 'value') reasons.push('Prisvärt märke');
    } else if (brandCat !== brandPref) {
      score -= 8;
    }
  }

  // Budget fit (use used price as reference)
  if (answers.budget_max && answers.budget_max > 0 && answers.budget_type === 'cash') {
    const price = car.pricing.used_from_sek || car.pricing.new_from_sek || 0;
    if (price > 0 && price <= answers.budget_max) {
      score += 10;
      reasons.push(`Passar budget`);
    } else if (price > answers.budget_max * 1.3) {
      score -= 15;
    }
  }

  // Priorities
  const PRIORITY_RATINGS: Record<string, { ratingKey: keyof typeof car.ratings; label: string }> = {
    safety: { ratingKey: 'overall', label: 'Hög säkerhetsbetyg' },
    comfort: { ratingKey: 'comfort', label: 'Hög komfort' },
    performance: { ratingKey: 'driving', label: 'Körglädje' },
    economy: { ratingKey: 'value', label: 'Låga driftskostnader' },
    space: { ratingKey: 'practicality', label: 'Rymlig' },
  };

  for (const p of priorities) {
    const mapping = PRIORITY_RATINGS[p];
    if (mapping && car.ratings[mapping.ratingKey] >= 8) {
      score += 8;
      if (!reasons.includes(mapping.label)) reasons.push(mapping.label);
    }
  }

  // Extra tags
  if (extraTags.includes('baggage') || extraTags.includes('space')) {
    if (car.specs.trunk_liters && car.specs.trunk_liters >= 500) {
      score += 15;
      reasons.push(`${car.specs.trunk_liters}L bagageutrymme`);
    } else if (car.specs.trunk_liters && car.specs.trunk_liters < 350) {
      score -= 10;
    }
  }

  if (extraTags.includes('family')) {
    if (car.specs.seats >= 5 && ['suv', 'kombi'].includes(car.specs.body_type)) {
      score += 10;
      if (!reasons.some(r => r.includes('Familj'))) reasons.push('Passar familjen');
    }
  }

  if (extraTags.includes('compact')) {
    if (['hatchback', 'sedan'].includes(car.specs.body_type)) score += 10;
    else score -= 8;
  }

  if (extraTags.includes('economy')) {
    const economyBrands = ['Toyota', 'Dacia', 'Kia', 'Hyundai', 'Skoda'];
    if (economyBrands.includes(car.brand_display)) score += 8;
  }

  // Overall quality bonus (avoid low-rated cars)
  if (car.ratings.overall >= 8.5) score += 5;
  else if (car.ratings.overall < 7) score -= 5;

  // Build whyForYou explanation
  const textLower = (answers.freeText || '').toLowerCase();
  const whyParts: string[] = [];
  if (car.pros.length > 0) whyParts.push(car.pros[0]);
  if (reasons[0] && !car.pros[0]?.includes(reasons[0])) whyParts.push(reasons[0]);
  if (car.ratings.overall >= 8.5) whyParts.push(`Toppbetyg ${car.ratings.overall}/10`);
  if (car.specs.trunk_liters && (textLower.includes('hund') || textLower.includes('bagag'))) {
    whyParts.push(`${car.specs.trunk_liters}L bagageutrymme`);
  }
  const whyForYou = whyParts.slice(0, 2).join(' · ') || car.pros[0] || '';

  return { score: Math.min(100, score), reasons: reasons.slice(0, 3), whyForYou };
}

function deduplicateBrands(cars: RecommendedCar[], maxPerBrand = 1): RecommendedCar[] {
  const seen = new Map<string, number>();
  const result: RecommendedCar[] = [];
  for (const car of cars) {
    const count = seen.get(car.make) || 0;
    if (count < maxPerBrand) {
      result.push(car);
      seen.set(car.make, count + 1);
    }
  }
  return result;
}

export function QuizResults({ answers, onBack, onReset }: QuizResultsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedCar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [step, setStep] = useState<'results' | 'contact' | 'done'>('results');
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parsed = useMemo(() => parseFreeText(answers.freeText || ''), [answers.freeText]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const allCars = getAllComparisonCars();
        const { data: catalogData } = await supabase
          .from('car_catalog')
          .select('make, model, image_url, cleaned_image_url');
        const catalog = (catalogData || []) as { make: string; model: string; image_url: string | null; cleaned_image_url: string | null }[];

        const catalogMap = new Map<string, { image_url: string | null; cleaned_image_url: string | null }>();
        for (const c of catalog) {
          catalogMap.set(`${c.make.toLowerCase()}|${c.model.toLowerCase()}`, c);
        }

        const scored = allCars
          .map(car => {
            const { score, reasons, whyForYou } = scoreComparisonCar(car, answers, parsed);
            const key = `${car.brand_display.toLowerCase()}|${car.model_display.toLowerCase()}`;
            const imgs = catalogMap.get(key);
            const fuelLabel = car.specs.fuel_types.map(f => FUEL_MAP[f] || f).join(' / ');
            return {
              id: car.id,
              make: car.brand_display,
              model: car.model_display,
              image_url: imgs?.image_url || null,
              cleaned_image_url: imgs?.cleaned_image_url || null,
              matchScore: score,
              matchReasons: reasons,
              whyForYou,
              bodyType: car.specs.body_type,
              fuelLabel,
              rating: car.ratings.overall,
              trunkLiters: car.specs.trunk_liters,
              usedPrice: car.pricing.used_from_sek,
              newPrice: car.pricing.new_from_sek,
            };
          })
          .sort((a, b) => b.matchScore - a.matchScore);

        // Deduplicate brands, then take top 6
        const deduped = deduplicateBrands(scored, 1).slice(0, 6);
        setRecommendations(deduped);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [answers, parsed]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const selectedCars = recommendations.filter(c => selectedIds.includes(c.id));

  const handleSubmit = async () => {
    if (!contact.name.trim() || !contact.phone.trim()) {
      setSubmitError('Fyll i namn och telefonnummer.');
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const carLabels = selectedCars.map(c => `${c.make} ${c.model}`).join(', ');
      await supabase.from('quote_requests').insert({
        search_option: 'searching',
        firstname: contact.name.split(' ')[0] || '',
        lastname: contact.name.split(' ').slice(1).join(' ') || '',
        phone: contact.phone,
        email: contact.email,
        car_model: carLabels,
        additional_requests: answers.freeText || '',
        budget: answers.budget_max ? String(answers.budget_max) : '',
        payment_type: answers.budget_type || '',
        status: 'new',
      });
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-quote-request`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: contact.phone, email: contact.email }),
        });
      } catch { /* best effort */ }
      setStep('done');
    } catch {
      setSubmitError('Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  const BODY_LABELS: Record<string, string> = { suv: 'SUV', kombi: 'Kombi', sedan: 'Sedan', hatchback: 'Halvkombi', coupe: 'Coupé', mpv: 'MPV', cab: 'Cab' };

  if (step === 'done') {
    return (
      <div className="text-center py-8 px-2">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
        </div>
        <h2 className="text-[22px] sm:text-[26px] font-bold text-white mb-3">Tack, {contact.name.split(' ')[0]}!</h2>
        <p className="text-white/80 text-[15px] leading-relaxed max-w-sm mx-auto mb-6">
          Vi ringer dig inom kort och går igenom dina valda bilar och hittar bästa möjliga deal.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {selectedCars.map(c => (
            <span key={c.id} className="px-3 py-1.5 rounded-full bg-white/20 text-white text-[13px] font-medium">
              {c.make} {c.model}
            </span>
          ))}
        </div>
        {onReset && (
          <button type="button" onClick={onReset} className="text-[13px] text-white/60 hover:text-white/90 transition-colors flex items-center gap-1.5 mx-auto">
            <RotateCcw className="w-3.5 h-3.5" />
            Gör om bilmatch
          </button>
        )}
      </div>
    );
  }

  if (step === 'contact') {
    return (
      <div className="flex flex-col gap-5">
        <button type="button" onClick={() => setStep('results')} className="self-start text-[13px] text-white/70 hover:text-white flex items-center gap-1 transition-colors">
          ← Tillbaka
        </button>
        <div>
          <h2 className="text-[22px] sm:text-[26px] font-bold text-white leading-tight mb-1">Dina uppgifter</h2>
          <p className="text-white/70 text-[14px]">Vi kontaktar dig och förhandlar fram bästa priset.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-1">
          {selectedCars.map(c => (
            <span key={c.id} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/20 text-white text-[13px] font-medium">
              <Check className="w-3 h-3" strokeWidth={3} />
              {c.make} {c.model}
            </span>
          ))}
        </div>

        <div className="space-y-3">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={contact.name}
              onChange={e => setContact(p => ({ ...p, name: e.target.value }))}
              placeholder="Ditt namn"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-[14px] focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="tel"
              inputMode="tel"
              value={contact.phone}
              onChange={e => setContact(p => ({ ...p, phone: e.target.value }))}
              placeholder="Telefonnummer"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-[14px] focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="email"
              inputMode="email"
              value={contact.email}
              onChange={e => setContact(p => ({ ...p, email: e.target.value }))}
              placeholder="E-post (frivilligt)"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-[14px] focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
            />
          </div>
        </div>

        {submitError && (
          <p className="text-red-300 text-[13px] font-medium">{submitError}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 rounded-2xl bg-white text-[#0e6efe] font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-xl disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
            Skicka förfrågan
            <ArrowRight className="w-5 h-5" />
          </>}
        </button>
        <p className="text-[12px] text-white/50 text-center">Vi ringer normalt inom en arbetsdag. Kostnadsfritt.</p>
      </div>
    );
  }

  // Results step
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
        <p className="text-white/70 text-[14px]">Analyserar dina önskemål...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        {onBack && (
          <button type="button" onClick={onBack} className="text-[13px] text-white/70 hover:text-white flex items-center gap-1 transition-colors mb-4">
            ← Ändra svar
          </button>
        )}
        <h2 className="text-[20px] sm:text-[26px] font-bold text-white leading-tight">
          {recommendations.length > 0 ? 'Dina bästa matchningar' : 'Inga exakta matchningar'}
        </h2>
        <p className="text-white/70 text-[14px] mt-1">
          Välj 2–3 bilar du vill att vi förhandlar åt dig
        </p>
        {selectedIds.length > 0 && (
          <p className="text-white/60 text-[13px] mt-1">
            {selectedIds.length} av 3 valda
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.map((car) => {
          const isSelected = selectedIds.includes(car.id);
          const imgUrl = car.cleaned_image_url || car.image_url;
          return (
            <button
              key={car.id}
              type="button"
              onClick={() => toggleSelect(car.id)}
              className={`relative rounded-2xl border-2 transition-all duration-200 text-left overflow-hidden group ${
                isSelected
                  ? 'border-white bg-white/20 shadow-lg shadow-white/10'
                  : 'border-white/20 bg-white/10 hover:border-white/40 hover:bg-white/15'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-[#0e6efe]" strokeWidth={3} />
                </div>
              )}

              {/* Car image */}
              <div className="h-[120px] bg-white/5 flex items-end justify-center overflow-hidden px-2">
                {imgUrl ? (
                  <img src={imgUrl} alt={`${car.make} ${car.model}`} className="h-full w-full object-contain" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center self-center">
                    <span className="text-white/30 text-[11px]">Ingen bild</span>
                  </div>
                )}
              </div>

              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="font-bold text-white text-[14px] leading-snug">{car.make}</p>
                    <p className="text-white/70 text-[13px]">{car.model}</p>
                  </div>
                  {car.rating && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-bold">
                      {car.rating}/10
                    </span>
                  )}
                </div>

                <p className="text-white/80 text-[12.5px] leading-snug mb-2">{car.whyForYou}</p>

                <div className="flex flex-wrap gap-1.5">
                  {car.bodyType && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[11px]">
                      {BODY_LABELS[car.bodyType] || car.bodyType}
                    </span>
                  )}
                  {car.fuelLabel && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[11px]">
                      {car.fuelLabel}
                    </span>
                  )}
                  {car.usedPrice && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[11px]">
                      Beg. ~{Math.round(car.usedPrice / 1000) * 1000 > 0 ? (car.usedPrice / 1000).toFixed(0) + 'k' : '–'} kr
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-10">
          <p className="text-white/70 text-[14px] mb-4">Inga bilar matchade exakt — kontakta oss så hittar vi rätt.</p>
          <button
            type="button"
            onClick={() => {}}
            className="h-11 px-6 rounded-xl bg-white text-[#0e6efe] font-semibold text-[14px] transition"
          >
            Kontakta oss
          </button>
        </div>
      )}

      {recommendations.length > 0 && (
        <button
          type="button"
          disabled={selectedIds.length === 0}
          onClick={() => setStep('contact')}
          className={`w-full h-14 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98] ${
            selectedIds.length > 0
              ? 'bg-white text-[#0e6efe] hover:bg-slate-50'
              : 'bg-white/20 text-white/50 cursor-not-allowed'
          }`}
        >
          {selectedIds.length === 0
            ? 'Välj minst en bil'
            : `Gå vidare med ${selectedIds.length} bil${selectedIds.length > 1 ? 'ar' : ''}`}
          {selectedIds.length > 0 && <ArrowRight className="w-5 h-5" />}
        </button>
      )}

      {onReset && (
        <button type="button" onClick={onReset} className="flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white/80 transition-colors mx-auto">
          <RotateCcw className="w-3 h-3" />
          Gör om
        </button>
      )}
    </div>
  );
}
