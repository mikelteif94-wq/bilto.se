import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown, Wallet, ArrowRight, Car, Loader2,
  ChevronRight, RotateCcw, GitCompareArrows, Check, Plus,
  Phone, CreditCard, Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calcCarMonthly } from '@/lib/utils';
import { PHONE_TEL } from '@/config/site';
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

function fmt(n: number) {
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
  if (reliableKw.some(k => car.make.toLowerCase().includes(k))) { score += 5; reasons.push('Känd för pålitlighet'); }
  const luxuryKw = ['amg', 'rs ', 'porsche', '911', 'cayenne', 'maserati'];
  if (desiredMonthly < 5000 && luxuryKw.some(k => car.model.toLowerCase().includes(k))) score -= 20;

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

// Deposit coverage bar
function DepositBar({ equity, depositRequired, equityFreed, extraNeeded }: {
  equity: number; depositRequired: number; equityFreed: number; extraNeeded: number;
}) {
  const coverPct = Math.min(100, (equity / depositRequired) * 100);
  const hasShortfall = extraNeeded > 0;
  const hasSurplus = equityFreed > 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500">Insats täcker kontantinsats ({fmt(depositRequired)} kr)</span>
        <span className={`font-semibold ${hasSurplus ? 'text-emerald-600' : hasShortfall ? 'text-amber-600' : 'text-slate-600'}`}>
          {hasSurplus ? '100%+' : `${Math.round(coverPct)}%`}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-xl"
          style={{ backgroundColor: hasSurplus ? '#16a34a' : hasShortfall ? '#d97706' : '#0e6efe' }}
          initial={{ width: 0 }}
          animate={{ width: `${coverPct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
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
  const carEquityNet = equity.hasCurrentCar ? Math.max(0, equity.carValue - equity.carDebt) : 0;

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
            const monthlyRatio = estimatedMonthly / equity.desiredMonthly;
            if (monthlyRatio > 1.3 || monthlyRatio < 0.5) return null;
            if (!hasEquity && depositRequired > 30_000) return null;
            if (hasEquity && extraNeeded > Math.min(equity.equity * MAX_EXTRA_FACTOR, MAX_EXTRA_ABS)) return null;
            if (score < 45) return null;
            const fuelLabel = compData?.specs.fuel_types
              ? compData.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ')
              : undefined;
            return {
              ...car, matchScore: score, matchReasons: reasons, carPrice,
              rating: compData?.ratings.overall, fuelLabel, compData,
              estimatedMonthly, extraNeeded, equityFreed, depositRequired,
            } as MatchedCar;
          })
          .filter((c): c is MatchedCar => c !== null)
          .sort((a, b) => {
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
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#0e6efe]" />
        <p className="text-[13px] text-slate-400">Analyserar din ekonomi...</p>
      </div>
    );
  }

  // ── Zero equity path ──
  if (!hasEquity) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-[#0e6efe] to-[#2a7fff] px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-[14px] leading-tight">Behöver du privatlån?</p>
              <p className="text-white/75 text-[12px] mt-0.5">Vi hjälper dig hitta rätt finansiering</p>
            </div>
          </div>
          <div className="bg-white px-5 py-4 space-y-3">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Utan kontantinsats finns det fortfarande vägar framåt. Med ett privatlån kan du finansiera hela köpet – vi förhandlar räntan åt dig.
            </p>
            <div className="space-y-2">
              {['Vi jämför räntor från flera banker åt dig', 'Ingen bindning – du bestämmer om du vill gå vidare', 'Vi förhandlar pris och ränta samtidigt'].map(p => (
                <div key={p} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-[12.5px] text-slate-600">{p}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onNegotiate('Privatlån', '[Privatlån] Kunden har ingen insats och vill ha hjälp med finansiering')}
              className="w-full h-11 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[14px] font-bold transition-all flex items-center justify-center gap-2"
              style={{ boxShadow: '0 4px 14px #0e6efe40' }}
            >
              Ja, jag vill ha hjälp <ChevronRight className="w-4 h-4" />
            </button>
            <a
              href={PHONE_TEL}
              className="w-full h-10 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-[#faf8f5] transition flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />Ring oss
            </a>
          </div>
        </div>
        <button type="button" onClick={onReset} className="w-full text-[13px] text-slate-400 hover:text-slate-600 transition-colors text-center flex items-center justify-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />Räkna om
        </button>
      </div>
    );
  }

  const bestSaving = equity.currentMonthly > 0
    ? cars.reduce((best, c) => Math.max(best, Math.max(0, equity.currentMonthly - c.estimatedMonthly)), 0)
    : 0;

  return (
    <div className="space-y-5">
      {/* Equity summary card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden border border-slate-200"
      >
        {/* Top section - main number */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-4">
          <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">Din totala insats</p>
          <p className="text-[30px] font-black text-white tabular-nums leading-none">
            {fmt(equity.equity)} <span className="text-[18px] font-semibold opacity-75">kr</span>
          </p>
          {bestSaving > 200 && (
            <div className="mt-2 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-white/80" />
              <p className="text-[12px] text-white/85 font-medium">
                Potential att sänka med upp till <strong className="text-white">{fmt(bestSaving)} kr/mån</strong>
              </p>
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className="bg-white px-5 py-3 divide-y divide-slate-50">
          {equity.hasCurrentCar && (
            <div className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-[12.5px] font-semibold text-slate-700">Bilens nettovärde</p>
                {equity.carDebt > 0 && (
                  <p className="text-[11px] text-slate-400">{fmt(equity.carValue)} kr − {fmt(equity.carDebt)} kr skuld</p>
                )}
              </div>
              <p className="text-[14px] font-bold text-slate-800 tabular-nums">{fmt(carEquityNet)} kr</p>
            </div>
          )}
          {equity.cashSavings > 0 && (
            <div className="flex items-center justify-between py-2.5">
              <p className="text-[12.5px] font-semibold text-slate-700">Sparpengar</p>
              <p className="text-[14px] font-bold text-slate-800 tabular-nums">{fmt(equity.cashSavings)} kr</p>
            </div>
          )}
          {equity.currentMonthly > 0 && (
            <div className="flex items-center justify-between py-2.5">
              <p className="text-[12.5px] text-slate-500">Nuv. månadskostnad</p>
              <p className="text-[13px] font-semibold text-slate-600 tabular-nums">{fmt(equity.currentMonthly)} kr/mån</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-bold text-slate-900">
            {cars.length} bilar matchar din situation
          </p>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Budget: {fmt(equity.desiredMonthly)} kr/mån
          </p>
        </div>
        <button type="button" onClick={onReset} className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-[#0e6efe] transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />Räkna om
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
          const ratingColor = car.rating != null
            ? car.rating >= 8 ? '#16a34a' : car.rating >= 6 ? '#d97706' : '#dc2626'
            : '#94a3b8';

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-200 border-2 ${
                isCompared ? 'border-emerald-400 shadow-md' : 'border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Image */}
              <div className="relative aspect-[16/9] bg-[#faf8f5] overflow-hidden">
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
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0e6efe] shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                    <span className="text-[10px] font-bold text-white">Bästa match</span>
                  </div>
                )}

                {monthlySaving > 200 && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                    -{fmt(monthlySaving)} kr/mån
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="px-4 pt-3 pb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-[13.5px] font-bold text-slate-900 leading-tight">{car.make} {car.model}</h3>
                    {car.fuelLabel && <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">{car.fuelLabel}</p>}
                  </div>
                  {car.rating != null && (
                    <div
                      className="shrink-0 w-8 h-8 rounded-xl border-2 flex items-center justify-center"
                      style={{ borderColor: ratingColor, backgroundColor: ratingColor + '15' }}
                    >
                      <span className="text-[10px] font-black tabular-nums" style={{ color: ratingColor }}>
                        {Number.isInteger(car.rating) ? car.rating : car.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Monthly + delta */}
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <span className="text-[12px] text-slate-500">Månadskostnad (TCO est.)</span>
                    <p className="text-[10px] text-slate-400">inkl. drivmedel &amp; försäkring</p>
                  </div>
                  <span className="text-[14px] font-black text-[#0e6efe] tabular-nums">{fmt(car.estimatedMonthly)} kr</span>
                </div>

                {/* Deposit coverage */}
                <DepositBar
                  equity={equity.equity}
                  depositRequired={car.depositRequired}
                  equityFreed={car.equityFreed}
                  extraNeeded={car.extraNeeded}
                />

                {/* Delta badge */}
                <div className="mt-2.5">
                  {car.extraNeeded > 0 ? (
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Plus className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="text-[11.5px] text-amber-700 font-medium">Saknas till insats</span>
                      </div>
                      <span className="text-[12px] font-bold text-amber-700">{fmt(car.extraNeeded)} kr</span>
                    </div>
                  ) : car.equityFreed > 0 ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <TrendingDown className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="text-[11.5px] text-emerald-700 font-medium">Pengar tillbaka</span>
                      </div>
                      <span className="text-[12px] font-bold text-emerald-700">+{fmt(car.equityFreed)} kr</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                      <span className="text-[11.5px] text-blue-700 font-medium">Insatsen täcker exakt</span>
                      <span className="text-[12px] font-bold text-blue-700">{fmt(car.depositRequired)} kr</span>
                    </div>
                  )}
                </div>

                {car.matchReasons.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {car.matchReasons.map(r => (
                      <span key={r} className="px-2 py-0.5 rounded-xl bg-[#faf8f5] border border-slate-100 text-[10px] text-slate-500 font-medium">
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTAs */}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const parts = [
                        `[Insatskalkyl] Insats: ${fmt(equity.equity)} kr`,
                        equity.currentMonthly > 0 ? `Nuv. månadskostnad: ${fmt(equity.currentMonthly)} kr/mån` : null,
                        `Önskad månadskostnad: ${fmt(equity.desiredMonthly)} kr/mån`,
                        car.extraNeeded > 0 ? `Saknas till insats: ${fmt(car.extraNeeded)} kr` : null,
                        car.equityFreed > 0 ? `Pengar tillbaka: ${fmt(car.equityFreed)} kr` : null,
                        equity.hasCurrentCar ? `Bilens värde: ${fmt(equity.carValue)} kr` : null,
                        equity.carDebt > 0 ? `Billån: ${fmt(equity.carDebt)} kr` : null,
                        equity.cashSavings > 0 ? `Sparpengar: ${fmt(equity.cashSavings)} kr` : null,
                      ].filter(Boolean).join(' | ');
                      onNegotiate(`${car.make} ${car.model}`, parts);
                    }}
                    className="flex-1 h-9 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[12px] font-bold transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
                  >
                    Få prishjälp <ChevronRight className="w-3 h-3" />
                  </button>
                  {car.compData && (
                    <button
                      type="button"
                      onClick={() => toggleCompare(id)}
                      title={isCompared ? 'Ta bort från jämförelse' : 'Jämför'}
                      className={`h-9 w-9 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all duration-150 active:scale-[0.98] ${
                        isCompared ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 hover:border-[#0e6efe] text-slate-400 hover:text-[#0e6efe]'
                      }`}
                    >
                      {isCompared ? <Check className="w-4 h-4" strokeWidth={2.5} /> : <GitCompareArrows className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {cars.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Car className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-[14px] font-bold text-slate-700 mb-1">Inga matchningar hittades</p>
          <p className="text-[12px] text-slate-400 mb-4">
            {hasEquity ? 'Prova att justera din önskade månadskostnad' : 'Du behöver en insats för att matcha fler bilar'}
          </p>
          <button type="button" onClick={onReset} className="h-9 px-5 rounded-xl bg-[#0e6efe] text-white text-[13px] font-semibold">
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
      <div className="rounded-2xl border border-blue-100 bg-[#faf8f5] px-5 py-4 space-y-3">
        <p className="text-[13px] font-bold text-slate-800">Hur fungerar insatsen?</p>
        <div className="space-y-2 text-[12px] text-slate-600 leading-relaxed">
          {equity.hasCurrentCar && (
            <div className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-[#0e6efe] shrink-0 mt-0.5" />
              <p>
                Din bil är värd ca {fmt(equity.carValue)} kr.{' '}
                {equity.carDebt > 0
                  ? `Med ${fmt(equity.carDebt)} kr i skuld har du ${fmt(Math.max(0, equity.carValue - equity.carDebt))} kr i nettovärde.`
                  : 'Utan skuld är hela värdet din insats.'}
              </p>
            </div>
          )}
          <div className="flex items-start gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-[#0e6efe] shrink-0 mt-0.5" />
            <p>Kontantinsatsen är 20% av bilens pris. Vi visar exakt hur mycket mer du behöver – eller hur mycket du får tillbaka.</p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-[#0e6efe] shrink-0 mt-0.5" />
            <p>Väljer du en <strong>billigare bil</strong> frigörs kapital och din månadskostnad sjunker.</p>
          </div>
        </div>
      </div>

      {/* Compare bar */}
      {selectedIds.size > 0 && !compareOpen && (
        <div className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
          <div className="mx-3 mb-3">
            <div className="max-w-md mx-auto bg-slate-900 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-semibold">{selectedIds.size} bil{selectedIds.size > 1 ? 'ar' : ''} valda</p>
              </div>
              <button type="button" onClick={() => setSelectedIds(new Set())} className="text-slate-400 hover:text-white transition-colors p-1">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <button type="button" onClick={() => setCompareOpen(true)} className="h-9 px-4 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[13px] font-bold transition-colors">
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
