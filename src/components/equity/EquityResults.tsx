import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown, Wallet, ArrowRight, Car, Loader2,
  ChevronRight, RotateCcw, GitCompareArrows, Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  BRAND_CATEGORIES, BODY_TYPE_KEYWORDS, FUEL_TYPE_KEYWORDS, PRIORITY_TRAITS,
} from '@/components/quiz/QuizTypes';
import { findComparisonCarByMakeModel } from '@/lib/comparison';
import type { EquityData } from './EquityQuiz';
import CompareDrawer from '@/components/CompareDrawer';
import type { ComparisonCar } from '@/lib/comparison/types';
import { useCarImages } from '@/hooks/useCarImages';

interface EquityResultsProps {
  equity: EquityData;
  onReset: () => void;
  onNegotiate: (carLabel: string) => void;
}

interface MatchedCar {
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url: string | null;
  matchScore: number;
  matchReasons: string[];
  estimatedMonthly?: number;
  rating?: number;
  fuelLabel?: string;
  compData?: ComparisonCar;
  // equity calcs
  monthlySaving: number;
  equityFreed: number;
  depositNeeded: number;
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

  // Lean toward economy if low budget
  if (desiredMonthly < 3500) {
    if (cat === 'value') { score += 20; reasons.push('Prisvärt märke'); }
    if (['hybrid', 'electric'].includes(fuelType || '')) { score += 15; reasons.push('Låga driftskostnader'); }
  } else if (desiredMonthly > 7000) {
    if (cat === 'premium') { score += 20; reasons.push('Premiummärke'); }
  } else {
    if (cat === 'mainstream') { score += 15; reasons.push('Pålitligt märke'); }
  }

  // Popular body types
  if (bodyType === 'suv') { score += 10; reasons.push('Populär SUV'); }
  if (bodyType === 'kombi') { score += 8; reasons.push('Praktisk kombi'); }

  // EV bonus for low monthly (lower running costs)
  if (fuelType === 'electric' && desiredMonthly < 5000) { score += 10; reasons.push('Låga driftkostnader'); }

  // Known reliable/value brands get a boost
  const reliableKw = ['toyota', 'volvo', 'skoda', 'kia', 'mazda'];
  if (reliableKw.some(k => m.includes(k) || car.make.toLowerCase().includes(k))) {
    score += 5; reasons.push('Känd för pålitlighet');
  }

  // Avoid sports/luxury keywords when budget is tight
  const luxuryKw = ['amg', 'rs ', 'porsche', '911', 'cayenne', 'maserati'];
  if (desiredMonthly < 5000 && luxuryKw.some(k => m.includes(k))) score -= 20;

  return { score: Math.min(100, score), reasons: reasons.slice(0, 3) };
}

// DEPOSIT = roughly 20% of car price
const DEPOSIT_RATE = 0.20;

function calcEquityMetrics(estimatedMonthly: number, equity: EquityData) {
  const monthlySaving = equity.currentMonthly > 0
    ? Math.max(0, equity.currentMonthly - estimatedMonthly)
    : Math.max(0, equity.desiredMonthly - estimatedMonthly);

  // Rough car price from monthly: monthly / 0.009 => car price
  const approxCarPrice = estimatedMonthly / 0.009;
  const depositNeeded = Math.round(approxCarPrice * DEPOSIT_RATE);
  const equityFreed = Math.max(0, equity.equity - depositNeeded);

  return { monthlySaving, depositNeeded, equityFreed };
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
            const { score, reasons } = scoreMatch(car, equity.desiredMonthly);
            const compData = findComparisonCarByMakeModel(car.make, car.model) || undefined;
            const basePrice = compData?.pricing.used_from_sek || compData?.pricing.new_from_sek;
            const estimatedMonthly = basePrice ? Math.round((basePrice * 0.009) / 100) * 100 : undefined;
            const fuelLabel = compData?.specs.fuel_types
              ? compData.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')
              : undefined;

            // only include cars where monthly cost is within ±50% of desired
            if (estimatedMonthly) {
              const ratio = estimatedMonthly / equity.desiredMonthly;
              if (ratio > 1.6 || ratio < 0.3) return null;
            }

            const metrics = estimatedMonthly
              ? calcEquityMetrics(estimatedMonthly, equity)
              : { monthlySaving: 0, depositNeeded: 0, equityFreed: 0 };

            return {
              ...car,
              matchScore: score,
              matchReasons: reasons,
              estimatedMonthly,
              rating: compData?.ratings.overall,
              fuelLabel,
              compData,
              ...metrics,
            };
          })
          .filter((c): c is MatchedCar => c !== null && c.matchScore >= 45)
          .sort((a, b) => b.matchScore - a.matchScore)
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

  const bestSaving = cars.reduce((best, c) => Math.max(best, c.monthlySaving), 0);

  return (
    <div className="space-y-5">
      {/* Equity summary card */}
      <div className="bg-slate-900 rounded-2xl px-5 py-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">Din insats</p>
            <p className="text-[20px] font-bold text-white tabular-nums">{formatSEK(equity.equity)} kr</p>
          </div>
        </div>
        {equity.currentMonthly > 0 && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">Nuvarande kostnad</p>
              <p className="text-[20px] font-bold text-white tabular-nums">{formatSEK(equity.currentMonthly)} kr/mån</p>
            </div>
          </div>
        )}
        {bestSaving > 0 && (
          <div className="w-full flex items-center gap-2 bg-emerald-500/15 rounded-xl px-3 py-2.5">
            <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[13px] text-emerald-300 font-semibold">
              Du kan spara upp till <span className="text-white">{formatSEK(bestSaving)} kr/mån</span> med rätt bilval
            </p>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-bold text-slate-800">
            {cars.length} bilar matchar din budget
          </p>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Baserat på {formatSEK(equity.desiredMonthly)} kr/mån önskad kostnad
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
          const imgUrl = car.cleaned_image_url || car.image_url
            || getCarImage(car.make, car.model);

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

                {/* Saving badge */}
                {car.monthlySaving > 0 && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm">
                    -{formatSEK(car.monthlySaving)} kr/mån
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="px-3.5 pt-3 pb-3">
                <h3 className="text-[13px] font-bold text-slate-900 truncate">
                  {car.make} {car.model}
                </h3>

                {/* Rating bar */}
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

                {/* Monthly + equity freed */}
                <div className="mt-2 space-y-1">
                  {car.estimatedMonthly && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-500">Uppskattad kostnad</span>
                      <span className="text-[13px] font-bold text-[#0e6efe]">
                        {formatSEK(car.estimatedMonthly)} kr/mån
                      </span>
                    </div>
                  )}
                  {car.equityFreed > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-500">Pengar tillbaka</span>
                      <span className="text-[12px] font-semibold text-emerald-600">
                        +{formatSEK(car.equityFreed)} kr
                      </span>
                    </div>
                  )}
                  {car.equityFreed <= 0 && car.depositNeeded > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-500">Insats behövs</span>
                      <span className="text-[12px] font-semibold text-slate-600">
                        {formatSEK(car.depositNeeded)} kr
                      </span>
                    </div>
                  )}
                </div>

                {/* Match reasons */}
                {car.matchReasons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {car.matchReasons.map(r => (
                      <span key={r} className="px-2 py-0.5 rounded-full bg-slate-50 text-[10px] text-slate-500 font-medium ring-1 ring-slate-100">
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onNegotiate(`${car.make} ${car.model}`)}
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
          <p className="text-[12px] text-slate-400">Prova att justera din önskade månadskostnad</p>
          <button
            type="button"
            onClick={onReset}
            className="mt-4 h-9 px-5 rounded-xl bg-[#0e6efe] text-white text-[13px] font-semibold"
          >
            Räkna om
          </button>
        </div>
      )}

      {/* Equity explanation */}
      <div className="bg-blue-50 rounded-2xl px-5 py-4 space-y-3">
        <p className="text-[13px] font-bold text-slate-800">Hur fungerar din insats?</p>
        <div className="space-y-2 text-[12px] text-slate-600 leading-relaxed">
          {equity.hasCurrentCar && equity.equityFreed !== undefined && (
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-[#0e6efe] shrink-0 mt-0.5" />
              <p>
                Din nuvarande bil är värd ungefär {formatSEK(equity.carValue)} kr. Med{' '}
                {equity.carDebt > 0 ? `${formatSEK(equity.carDebt)} kr kvar i skuld` : 'ingen skuld'} har du{' '}
                <strong>{formatSEK(Math.max(0, equity.carValue - equity.carDebt))} kr</strong> i nettovärde att använda.
              </p>
            </div>
          )}
          <div className="flex items-start gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-[#0e6efe] shrink-0 mt-0.5" />
            <p>
              Du behöver inte använda hela insatsen. En del av pengarna kan stanna kvar hos dig — vi visar
              hur lite du faktiskt behöver lägga ner.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-[#0e6efe] shrink-0 mt-0.5" />
            <p>
              Väljer du en <strong>billigare bil</strong> frigörs kapital tillbaka till ditt konto — och
              din månadskostnad sjunker dessutom.
            </p>
          </div>
        </div>
      </div>

      {/* Floating compare bar */}
      {selectedIds.size > 0 && !compareOpen && (
        <div className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
          <div className="mx-3 mb-3">
            <div className="max-w-md mx-auto bg-slate-900 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
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
