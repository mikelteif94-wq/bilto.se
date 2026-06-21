import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown, Wallet, ArrowRight, Car, Loader2,
  ChevronRight, RotateCcw, GitCompareArrows, Check, Plus,
  Phone, CreditCard,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calcCarMonthly } from '@/lib/utils';
import {
  BRAND_CATEGORIES, BODY_TYPE_KEYWORDS, FUEL_TYPE_KEYWORDS,
} from '@/components/quiz/QuizTypes';
import { findComparisonCarByMakeModel } from '@/lib/comparison';
import type { EquityData } from './EquityQuiz';
import CompareDrawer from '@/components/CompareDrawer';
import type { ComparisonCar } from '@/lib/comparison/types';
import { useCarImages } from '@/hooks/useCarImages';
import SaveToPortalBanner from '@/components/SaveToPortalBanner';

interface EquityResultsProps {
  equity: EquityData;
  onReset: () => void;
  onNegotiate: (carLabel: string, equitySummary: string) => void;
}

interface MatchedCar {
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url: string | null;
  matchScore: number;
  matchReasons: string[];
  carPrice: number;
  rating?: number;
  fuelLabel?: string;
  compData?: ComparisonCar;
  estimatedMonthly: number;
  extraNeeded: number;
  equityFreed: number;
  depositRequired: number;
}

function formatSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

function detectBodyType(model: string): string | null {
  const m = model.toLowerCase();
  for (const [type, kws] of Object.entries(BODY_TYPE_KEYWORDS)) {
    if (kws.some(k => m.includes(k))) return type;
  }
  return null;
}

function detectFuelType(model: string, make: string): string | null {
  const m = model.toLowerCase(), mk = make.toLowerCase();
  if (FUEL_TYPE_KEYWORDS.electric.some(k => m.includes(k) || mk.includes(k))) return 'electric';
  if (FUEL_TYPE_KEYWORDS.hybrid.some(k => m.includes(k))) return 'hybrid';
  if (FUEL_TYPE_KEYWORDS.diesel.some(k => m.includes(k))) return 'diesel';
  return 'petrol';
}

function getBrandCategory(make: string): 'premium' | 'mainstream' | 'value' {
  const u = make.toUpperCase();
  if (BRAND_CATEGORIES.premium.some(b => u.includes(b.toUpperCase()))) return 'premium';
  if (BRAND_CATEGORIES.value.some(b => u.includes(b.toUpperCase()))) return 'value';
  return 'mainstream';
}

function scoreMatch(car: { make: string; model: string }, desiredMonthly: number): { score: number; reasons: string[] } {
  let score = 40;
  const reasons: string[] = [];
  const m = car.model.toLowerCase();
  const cat = getBrandCategory(car.make);
  const bodyType = detectBodyType(car.model);
  const fuelType = detectFuelType(car.model, car.make);

  if (desiredMonthly < 3500) {
    if (cat === 'value') { score += 20; reasons.push('Prisvärt märke'); }
    if (['hybrid', 'electric'].includes(fuelType || '')) { score += 15; reasons.push('Låga driftskostnader'); }
  } else if (desiredMonthly > 7000) {
    if (cat === 'premium') { score += 20; reasons.push('Premiummärke'); }
  } else {
    if (cat === 'mainstream') { score += 15; reasons.push('Pålitligt märke'); }
  }

  if (bodyType === 'suv') { score += 10; reasons.push('Populär SUV'); }
  if (bodyType === 'kombi') { score += 8; reasons.push('Praktisk kombi'); }
  if (fuelType === 'electric' && desiredMonthly < 5000) { score += 10; reasons.push('Låga driftkostnader'); }

  const reliableKw = ['toyota', 'volvo', 'skoda', 'kia', 'mazda'];
  if (reliableKw.some(k => m.includes(k) || car.make.toLowerCase().includes(k))) {
    score += 5; reasons.push('Känd för pålitlighet');
  }

  const luxuryKw = ['amg', 'rs ', 'porsche', '911', 'cayenne', 'maserati'];
  if (desiredMonthly < 5000 && luxuryKw.some(k => m.includes(k))) score -= 20;

  return { score: Math.min(100, score), reasons: reasons.slice(0, 3) };
}

const DEPOSIT_RATE = 0.20;
const MAX_EXTRA_FACTOR = 2.0;
const MAX_EXTRA_ABS = 200_000;

function calcCarMetrics(carPrice: number, equity: EquityData) {
  const depositRequired = Math.round(carPrice * DEPOSIT_RATE);
  const extraNeeded = Math.max(0, depositRequired - equity.equity);
  const equityFreed = Math.max(0, equity.equity - depositRequired);
  const estimatedMonthly = calcCarMonthly(carPrice, 0.55);
  return { depositRequired, extraNeeded, equityFreed, estimatedMonthly };
}

export function EquityResults({ equity, onReset, onNegotiate }: EquityResultsProps) {
  const [cars, setCars] = useState<MatchedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const { getCarImage } = useCarImages();

  const FUEL_LABELS: Record<string, string> = {
    bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid', laddhybrid: 'Laddhybrid', el: 'El',
  };

  const hasEquity = equity.equity > 0;
  const monthlySavingPossible = equity.currentMonthly > 0;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('car_catalog')
          .select('make, model, image_url, cleaned_image_url')
          .not('image_url', 'is', null);
        if (error) throw error;

        const catalog = (data || []) as { make: string; model: string; image_url: string | null; cleaned_image_url: string | null }[];

        const scored = catalog
          .map(car => {
            const compData = findComparisonCarByMakeModel(car.make, car.model) || undefined;
            const carPrice = compData?.pricing.used_from_sek || compData?.pricing.new_from_sek;

            if (!carPrice) return null;

            const { score, reasons } = scoreMatch(car, equity.desiredMonthly);
            const { depositRequired, extraNeeded, equityFreed, estimatedMonthly } = calcCarMetrics(carPrice, equity);

            // Monthly cost must be within ±30% of desired
            const monthlyRatio = estimatedMonthly / equity.desiredMonthly;
            if (monthlyRatio > 1.3 || monthlyRatio < 0.5) return null;

            // No equity: only show cars with very low deposit
            if (!hasEquity && depositRequired > 30_000) return null;

            // Has equity: extra needed must be reasonable
            if (hasEquity && extraNeeded > Math.min(equity.equity * MAX_EXTRA_FACTOR, MAX_EXTRA_ABS)) return null;

            if (score < 45) return null;

            const fuelLabel = compData?.specs.fuel_types
              ? compData.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')
              : undefined;

            return {
              ...car,
              matchScore: score,
              matchReasons: reasons,
              carPrice,
              rating: compData?.ratings.overall,
              fuelLabel,
              compData,
              estimatedMonthly,
              extraNeeded,
              equityFreed,
              depositRequired,
            } as MatchedCar;
          })
          .filter((c): c is MatchedCar => c !== null)
          .sort((a, b) => {
            // Sort by extra needed ascending, then by match score
            const aDelta = a.extraNeeded - b.extraNeeded;
            if (Math.abs(aDelta) > 5000) return aDelta;
            return b.matchScore - a.matchScore;
          })
          .slice(0, 6);

        setCars(scored);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [equity]);

  const toggleCompare = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const selectedCars = Array.from(selectedIds)
    .map(id => cars.find(c => `${c.make}-${c.model}` === id)?.compData)
    .filter((c): c is ComparisonCar => !!c);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  // Zero equity path — no car, no savings
  if (!hasEquity) {
    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="bg-slate-900 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">Din insats</p>
            <p className="text-[18px] font-bold text-white">Ingen insats just nu</p>
          </div>
        </div>

        {/* Privatlån card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm"
        >
          <div className="bg-gradient-to-r from-[#0e6efe] to-[#2a7fff] px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <CreditCard className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-[14px] leading-snug">Behöver du privatlån?</p>
              <p className="text-white/75 text-[12px] mt-0.5">Vi hjälper dig hitta rätt finansiering</p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Utan kontantinsats finns det fortfarande vägar framåt. Med ett privatlån kan du finansiera hela köpet — och vi förhandlar räntan och villkoren åt dig.
            </p>

            <div className="space-y-2">
              {[
                'Vi jämför räntor från flera banker åt dig',
                'Ingen bindning — du bestämmer om du vill gå vidare',
                'Vi förhandlar pris och ränta samtidigt',
              ].map((point) => (
                <div key={point} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-[12.5px] text-slate-600">{point}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNegotiate('Privatlån', '[Privatlån] Kunden har ingen insats och vill ha hjälp med finansiering')}
              className="w-full h-11 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[14px] font-bold transition-all flex items-center justify-center gap-2"
            >
              Ja, jag vill ha hjälp
              <ChevronRight className="w-4 h-4" />
            </button>
            <a
              href="tel:+46855550200"
              className="w-full h-10 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              Ring oss: 08-5555 0200
            </a>
          </div>
        </motion.div>

        <button
          type="button"
          onClick={onReset}
          className="w-full text-[13px] text-slate-400 hover:text-slate-600 transition-colors text-center flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Räkna om
        </button>
      </div>
    );
  }

  // Only show savings when customer has a current monthly cost AND equity
  const bestSaving = monthlySavingPossible && hasEquity
    ? cars.reduce((best, c) => Math.max(best, Math.max(0, equity.currentMonthly - c.estimatedMonthly)), 0)
    : 0;

  return (
    <div className="space-y-5">
      {/* Equity summary card */}
      <div className="bg-slate-900 rounded-xl px-5 py-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">Din insats</p>
            <p className="text-[20px] font-bold text-white tabular-nums">
              {hasEquity ? `${formatSEK(equity.equity)} kr` : 'Ingen insats'}
            </p>
          </div>
        </div>
        {equity.currentMonthly > 0 && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">Nuv. månadskostnad</p>
              <p className="text-[20px] font-bold text-white tabular-nums">{formatSEK(equity.currentMonthly)} kr/mån</p>
            </div>
          </div>
        )}
        {bestSaving > 200 && (
          <div className="w-full flex items-center gap-2 bg-emerald-500/15 rounded-xl px-3 py-2.5">
            <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[13px] text-emerald-300 font-semibold">
              Du kan sänka din månadskostnad med upp till{' '}
              <span className="text-white">{formatSEK(bestSaving)} kr/mån</span>
            </p>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-bold text-slate-800">
            {cars.length} bilar matchar din situation
          </p>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Önskad månadskostnad: {formatSEK(equity.desiredMonthly)} kr/mån
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-[#0e6efe] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Räkna om
        </button>
      </div>

      {/* Car grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cars.map((car, i) => {
          const id = `${car.make}-${car.model}`;
          const isCompared = selectedIds.has(id);
          const imgUrl = car.cleaned_image_url || car.image_url || getCarImage(car.make, car.model);
          const monthlySaving = equity.currentMonthly > 0
            ? Math.max(0, equity.currentMonthly - car.estimatedMonthly)
            : 0;

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`group relative bg-white rounded-xl ring-1 overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md ${
                isCompared ? 'ring-emerald-400 ring-2' : 'ring-slate-100 hover:ring-slate-200'
              }`}
            >
              {/* Image */}
              <div className="relative aspect-[16/9] bg-slate-50 overflow-hidden">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={`${car.make} ${car.model}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-8 h-8 text-slate-200" />
                  </div>
                )}

                {i === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/95 text-[10px] font-bold text-[#0e6efe] shadow-sm">
                    Bästa match
                  </div>
                )}

                {/* Only show saving badge if there is a real saving vs current monthly */}
                {monthlySaving > 200 && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm">
                    -{formatSEK(monthlySaving)} kr/mån
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="px-3.5 pt-3 pb-3">
                <h3 className="text-[13px] font-bold text-slate-900 truncate">
                  {car.make} {car.model}
                </h3>

                {car.rating != null && (() => {
                  const pct = ((Math.max(5, Math.min(10, car.rating)) - 5) / 5) * 100;
                  const color = car.rating >= 9 ? '#10b981' : car.rating >= 7.5 ? '#0e6efe' : '#64748b';
                  return (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color }}>
                        {Number.isInteger(car.rating) ? car.rating : car.rating.toFixed(1)}
                        <span className="font-normal text-slate-400">/10</span>
                      </span>
                    </div>
                  );
                })()}

                {/* Financial delta */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-500">Månadskostnad</span>
                    <span className="text-[13px] font-bold text-[#0e6efe]">
                      {formatSEK(car.estimatedMonthly)} kr/mån
                    </span>
                  </div>

                  {car.extraNeeded > 0 ? (
                    <div className="flex items-center justify-between bg-amber-50 rounded-lg px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <Plus className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="text-[12px] text-amber-700 font-medium">Saknas till insats</span>
                      </div>
                      <span className="text-[12px] font-bold text-amber-700">
                        {formatSEK(car.extraNeeded)} kr
                      </span>
                    </div>
                  ) : car.equityFreed > 0 ? (
                    <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <TrendingDown className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="text-[12px] text-emerald-700 font-medium">Pengar tillbaka</span>
                      </div>
                      <span className="text-[12px] font-bold text-emerald-700">
                        +{formatSEK(car.equityFreed)} kr
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-500">Kontantinsats (20%)</span>
                      <span className="text-[12px] font-semibold text-slate-700">
                        {formatSEK(car.depositRequired)} kr
                      </span>
                    </div>
                  )}
                </div>

                {/* Contextual sentence — the key UX */}
                <p className="mt-2 text-[11px] text-slate-500 leading-snug">
                  {car.extraNeeded > 0
                    ? `Med din insats på ${formatSEK(equity.equity)} kr behöver du lägga till ${formatSEK(car.extraNeeded)} kr — totalt ${formatSEK(car.depositRequired)} kr i kontantinsats.`
                    : car.equityFreed > 0
                    ? `Din insats täcker hela kontantinsatsen och du får ${formatSEK(car.equityFreed)} kr tillbaka.`
                    : `Din insats täcker exakt kontantinsatsen för denna bil.`
                  }
                </p>

                {car.matchReasons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {car.matchReasons.map(r => (
                      <span key={r} className="px-2 py-0.5 rounded-full bg-slate-50 text-[10px] text-slate-500 font-medium ring-1 ring-slate-100">
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const parts = [
                        `[Insatskalkyl] Insats: ${formatSEK(equity.equity)} kr`,
                        equity.currentMonthly > 0 ? `Nuv. månadskostnad: ${formatSEK(equity.currentMonthly)} kr/mån` : null,
                        `Önskad månadskostnad: ${formatSEK(equity.desiredMonthly)} kr/mån`,
                        car.extraNeeded > 0 ? `Saknas till insats: ${formatSEK(car.extraNeeded)} kr` : null,
                        car.equityFreed > 0 ? `Pengar tillbaka: ${formatSEK(car.equityFreed)} kr` : null,
                        equity.hasCurrentCar ? `Bilens värde: ${formatSEK(equity.carValue)} kr` : null,
                        equity.carDebt > 0 ? `Billån: ${formatSEK(equity.carDebt)} kr` : null,
                        equity.cashSavings > 0 ? `Sparpengar: ${formatSEK(equity.cashSavings)} kr` : null,
                      ].filter(Boolean).join(' | ');
                      onNegotiate(`${car.make} ${car.model}`, parts);
                    }}
                    className="flex-1 h-9 rounded-lg bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                  >
                    Få hjälp att köpa
                    <ChevronRight className="w-3 h-3 opacity-80" />
                  </button>
                  {car.compData && (
                    <button
                      type="button"
                      onClick={() => toggleCompare(id)}
                      title={isCompared ? 'Ta bort från jämförelse' : 'Jämför'}
                      className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-150 active:scale-[0.98] ${
                        isCompared
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white border-slate-200 hover:border-[#0e6efe] text-slate-500 hover:text-[#0e6efe]'
                      }`}
                    >
                      {isCompared
                        ? <Check className="w-4 h-4" strokeWidth={2.5} />
                        : <GitCompareArrows className="w-4 h-4" />
                      }
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {cars.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-slate-700 mb-1">Inga matchningar hittades</p>
          <p className="text-[12px] text-slate-400">
            {hasEquity
              ? 'Prova att justera din önskade månadskostnad'
              : 'Du behöver en insats för att matcha fler bilar'}
          </p>
          <button
            type="button"
            onClick={onReset}
            className="mt-4 h-9 px-5 rounded-xl bg-[#0e6efe] text-white text-[13px] font-semibold"
          >
            Räkna om
          </button>
        </div>
      )}

      <SaveToPortalBanner
        quizAnswers={equity as unknown as Record<string, unknown>}
        source="equity-calculator"
        carLabel={cars[0] ? `${cars[0].make} ${cars[0].model}` : undefined}
      />

      {/* How it works */}
      <div className="bg-blue-50 rounded-xl px-5 py-4 space-y-3">
        <p className="text-[13px] font-bold text-slate-800">Hur fungerar insatsen?</p>
        <div className="space-y-2 text-[12px] text-slate-600 leading-relaxed">
          {equity.hasCurrentCar && (
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-[#0e6efe] shrink-0 mt-0.5" />
              <p>
                Din nuvarande bil är värd ca {formatSEK(equity.carValue)} kr.{' '}
                {equity.carDebt > 0
                  ? `Med ${formatSEK(equity.carDebt)} kr kvar i skuld har du ${formatSEK(Math.max(0, equity.carValue - equity.carDebt))} kr i nettovärde.`
                  : 'Utan skuld är hela värdet din insats.'
                }
              </p>
            </div>
          )}
          <div className="flex items-start gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-[#0e6efe] shrink-0 mt-0.5" />
            <p>
              Kontantinsatsen är 20% av bilens pris. Vi visar exakt hur mycket mer du behöver — eller
              hur mycket du får tillbaka — baserat på din insats.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-[#0e6efe] shrink-0 mt-0.5" />
            <p>
              Väljer du en <strong>billigare bil</strong> frigörs kapital tillbaka och din månadskostnad
              sjunker dessutom.
            </p>
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && !compareOpen && (
        <div className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
          <div className="mx-3 mb-3">
            <div className="max-w-md mx-auto bg-slate-900 rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-semibold">{selectedIds.size} bil{selectedIds.size > 1 ? 'ar' : ''} valda</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                className="h-9 px-4 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[13px] font-bold transition-colors"
              >
                Jämför
              </button>
            </div>
          </div>
        </div>
      )}

      <CompareDrawer
        cars={selectedCars}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        onRemove={(id) => {
          const car = selectedCars.find(c => c.id === id);
          if (!car) return;
          const key = `${car.brand_display}-${car.model_display}`;
          setSelectedIds(prev => { const n = new Set(prev); n.delete(key); return n; });
        }}
        onNegotiate={(car) => {
          setCompareOpen(false);
          onNegotiate(`${car.brand_display} ${car.model_display}`);
        }}
        getImageUrl={(car) => getCarImage(car.brand_display, car.model_display) || undefined}
      />
    </div>
  );
}
