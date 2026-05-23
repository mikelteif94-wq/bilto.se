import { useState } from 'react';
import { Star, Car, Check, ChevronRight, SlidersHorizontal, HelpCircle, X, Sparkles, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { calcCarMonthlyRange, calcCarMonthly } from '../lib/utils';

interface CompactCarCardProps {
  name: string;
  imageUrl?: string | null;
  rating?: number;
  topBadge?: boolean;
  expertComment?: string;
  fuelLabel?: string;
  carPrice?: number;
  usedPrice?: number;
  monthlySaving?: number;
  equityFreed?: number;
  isSelected?: boolean;
  isCompared?: boolean;
  onSelect?: () => void;
  onCompare?: () => void;
  onNegotiate: () => void;
  onDetail?: () => void;
  onFitQuiz?: () => void;
  index?: number;
  disableMotion?: boolean;
}

const RATE = 0.0649;
const MONTHS = 36;
const DOWN_PCT = 0.20;
const FEE_PCT = 0.01;
const MIN_PRICE = 50_000;
const MAX_PRICE = 1_200_000;

function fmt(n: number) {
  return Math.round(n).toLocaleString('sv-SE');
}

function formatSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

function ScoreBadge({ value }: { value: number }) {
  const color = value >= 9 ? '#059669' : value >= 7.5 ? '#0e6efe' : '#d97706';
  return (
    <div
      className="absolute top-2.5 right-2.5 flex items-center justify-center w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-md"
      style={{ border: `2px solid ${color}` }}
    >
      <span className="text-[11px] font-extrabold leading-none" style={{ color }}>
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </span>
    </div>
  );
}

function InfoTooltip({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute bottom-full right-0 mb-2 w-60 z-30 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
      <p className="text-[11px] font-bold text-white mb-1.5">Hur räknar vi?</p>
      <p className="text-[10px] text-slate-400 leading-relaxed">
        Spannet baseras på snittpriset mellan begagnad och ny, vid 55% resp. 50% restvärde:<br />
        <span className="text-slate-200">20% kontantinsats · 1% uppläggning · 6,49% ränta · 36 månader</span>
      </p>
      <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5">
        Lägre siffra = 55% restvärde &nbsp;·&nbsp; Högre siffra = 50% restvärde
      </p>
      <div className="mt-2 pt-2 border-t border-slate-700">
        <p className="text-[9px] text-slate-500">Uppskattning. Slutlig ränta och villkor sätts av finansiär.</p>
      </div>
    </div>
  );
}

function CalcPanel({ carPrice, usedPrice }: { carPrice: number; usedPrice?: number }) {
  const baseDefault = usedPrice ? Math.round((carPrice + usedPrice) / 2) : carPrice;
  const [price, setPrice] = useState(Math.min(Math.max(baseDefault, MIN_PRICE), MAX_PRICE));
  const [residualPct, setResidualPct] = useState<0.50 | 0.55>(0.55);
  const [showInfo, setShowInfo] = useState(false);
  const monthly = calcCarMonthly(price, residualPct);
  const sliderPct = ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Uppskattad månadskostnad</p>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-extrabold text-[#0e6efe] tabular-nums leading-none">{fmt(monthly)}</span>
            <span className="text-[11px] font-semibold text-[#0e6efe]/60">kr/mån</span>
          </div>
          <p className="mt-0.5 text-[9px] text-slate-400">
            {RATE * 100}% ränta · {MONTHS} mån · {DOWN_PCT * 100}% ins. · {residualPct === 0.55 ? 55 : 50}% restvärde
          </p>
        </div>
        <div className="relative pb-0.5">
          <button type="button" onClick={() => setShowInfo(v => !v)} className="text-slate-300 hover:text-slate-500 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {showInfo && <InfoTooltip onClose={() => setShowInfo(false)} />}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10.5px] font-semibold text-slate-700">Bilpris</label>
          <span className="text-[11px] font-bold tabular-nums text-slate-900">{fmt(price)} kr</span>
        </div>
        <input
          type="range" min={MIN_PRICE} max={MAX_PRICE} step={5_000} value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer financing-slider"
          style={{ background: `linear-gradient(to right, #0e6efe ${sliderPct}%, #e2e8f0 ${sliderPct}%)` }}
        />
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-slate-400">50 000 kr</span>
          <span className="text-[9px] text-slate-400">1 200 000 kr</span>
        </div>
      </div>

      <div className="flex gap-2">
        {([0.55, 0.50] as const).map(pct => (
          <button
            key={pct} type="button" onClick={() => setResidualPct(pct)}
            className={`flex-1 h-7 rounded-lg text-[11px] font-bold border transition-all duration-150 active:scale-[0.98] ${
              residualPct === pct
                ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                : 'border-slate-200 text-slate-500 hover:border-[#0e6efe]/50 hover:text-[#0e6efe]'
            }`}
          >
            {pct === 0.55 ? '55% Standard' : '50%'}
          </button>
        ))}
      </div>

      <div className="pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-center">
        {[
          { label: 'Kontantinsats', value: `${fmt(price * DOWN_PCT)} kr` },
          { label: 'Lånesumma', value: `${fmt(price * (1 - DOWN_PCT) + price * FEE_PCT)} kr` },
          { label: 'Restvärde', value: `${fmt(price * residualPct)} kr` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[8.5px] text-slate-400 mb-0.5">{label}</p>
            <p className="text-[9.5px] font-bold tabular-nums text-slate-800">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-[8.5px] text-slate-400 leading-relaxed">Uppskattning. Faktisk kostnad beror på kreditgivare och individuella villkor.</p>
    </div>
  );
}

export default function CompactCarCard({
  name, imageUrl, rating, topBadge, expertComment,
  fuelLabel, carPrice, usedPrice, monthlySaving, equityFreed,
  isSelected, isCompared,
  onSelect, onCompare, onNegotiate, onDetail, onFitQuiz,
}: CompactCarCardProps) {
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;
  const [cardExpanded, setCardExpanded] = useState(false);
  const [panel, setPanel] = useState<null | 'calc' | 'fit'>(null);

  const handleCardClick = () => {
    if (onSelect) { onSelect(); return; }
    setCardExpanded(v => !v);
    if (cardExpanded) setPanel(null);
  };

  const openPanel = (p: 'calc' | 'fit', e: React.MouseEvent) => {
    e.stopPropagation();
    setPanel(prev => prev === p ? null : p);
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl transition-all duration-300 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-[#0e6efe] shadow-[0_0_0_4px_rgba(14,110,254,0.10)]'
          : isCompared
          ? 'ring-2 ring-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]'
          : cardExpanded
          ? 'ring-2 ring-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
          : 'ring-1 ring-slate-100 hover:ring-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.11)]'
      }`}
      style={{ touchAction: 'pan-y' }}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] sm:aspect-[16/9] bg-white overflow-hidden rounded-t-2xl">
        {imageUrl ? (
          <img
            src={imageUrl} alt={name} loading="lazy"
            className="w-full h-full object-contain p-3 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Car className="w-10 h-10 text-slate-200" /></div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />

        {topBadge && !isSelected && !isCompared && (
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/95 backdrop-blur-sm text-[10px] font-bold text-[#0e6efe] shadow-sm">
              <Star className="w-2.5 h-2.5 fill-[#0e6efe] text-[#0e6efe]" />Toppval
            </span>
          </div>
        )}
        {onSelect && (
          <div className={`absolute top-2.5 left-2.5 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            isSelected ? 'bg-[#0e6efe] border-[#0e6efe] shadow-md scale-110' : 'bg-white/85 border-slate-300 backdrop-blur-sm'
          }`}>
            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
        )}
        {(monthlySaving != null && monthlySaving > 0) && (
          <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-sm">
            -{formatSEK(monthlySaving)} kr/mån
          </div>
        )}
        {(equityFreed != null && equityFreed > 0 && !(monthlySaving && monthlySaving > 0)) && (
          <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-sm">
            +{formatSEK(equityFreed)} kr tillbaka
          </div>
        )}
        {rating != null && !(monthlySaving && monthlySaving > 0) && !(equityFreed && equityFreed > 0) && (
          <ScoreBadge value={rating} />
        )}
      </div>

      {/* Static content — always visible */}
      <div className="px-3.5 pt-3 pb-3">
        <h3 className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 leading-snug truncate group-hover:text-[#0e6efe] transition-colors duration-200">
          {name}
        </h3>
        {fuelLabel && <p className="mt-0.5 text-[10px] text-slate-400 truncate">{fuelLabel}</p>}
        {expertComment && (
          <p className="hidden sm:block mt-0.5 text-[11px] text-slate-400 leading-snug line-clamp-1">{expertComment}</p>
        )}

        {range && (
          <div className="mt-2 flex items-baseline gap-1 min-w-0">
            <span className="text-[15px] font-extrabold text-[#0e6efe] tabular-nums leading-none whitespace-nowrap">
              {formatSEK(range.low)}–{formatSEK(range.high)}
            </span>
            <span className="text-[10px] font-semibold text-[#0e6efe]/60 shrink-0">kr/mån</span>
          </div>
        )}

        {monthlySaving != null && monthlySaving > 0 && (
          <p className="mt-1 text-[10.5px] font-semibold text-emerald-600">Du sparar {formatSEK(monthlySaving)} kr/mån</p>
        )}
        {equityFreed != null && equityFreed > 0 && (
          <p className="mt-1 text-[10.5px] font-semibold text-emerald-600">+{formatSEK(equityFreed)} kr frigörs vid byte</p>
        )}

        {/* Expanded section — shown on card click */}
        <AnimatePresence initial={false}>
          {cardExpanded && !onSelect && (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pt-3 space-y-2">
                {/* Two secondary CTAs */}
                <div className="flex gap-2">
                  {carPrice && (
                    <button
                      type="button"
                      onClick={(e) => openPanel('calc', e)}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-[11.5px] font-semibold transition-all duration-150 active:scale-[0.98] ${
                        panel === 'calc'
                          ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-[#0e6efe] hover:text-[#0e6efe]'
                      }`}
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      Räkna månadskostnad
                    </button>
                  )}
                  {onFitQuiz && (
                    <button
                      type="button"
                      onClick={(e) => openPanel('fit', e)}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-[11.5px] font-semibold transition-all duration-150 active:scale-[0.98] ${
                        panel === 'fit'
                          ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-[#0e6efe] hover:text-[#0e6efe]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Passar bilen mig?
                    </button>
                  )}
                </div>

                {/* Panel content */}
                <AnimatePresence initial={false}>
                  {panel === 'calc' && carPrice && (
                    <motion.div
                      key="calc"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <CalcPanel carPrice={carPrice} usedPrice={usedPrice} />
                    </motion.div>
                  )}
                  {panel === 'fit' && onFitQuiz && (
                    <motion.div
                      key="fit"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                        <p className="text-[12px] font-semibold text-slate-800 mb-1">Passar {name} dig?</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          Svara på några korta frågor — vi jämför bilen mot dina behov, familj, pendling och budget.
                        </p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onFitQuiz(); }}
                          className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[12px] font-bold transition-all duration-150 shadow-sm shadow-[#0e6efe]/20"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Starta matchning
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Compare */}
                {onCompare && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onCompare(); }}
                    className={`w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border text-[11px] font-medium transition-all duration-150 active:scale-[0.98] ${
                      isCompared
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
                    }`}
                  >
                    {isCompared ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <SlidersHorizontal className="w-3 h-3" />}
                    {isCompared ? 'Tillagd i jämförelse' : 'Lägg till i jämförelse'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Primary CTA — always visible unless onSelect mode */}
      {!onSelect && (
        <div className="px-3.5 pb-3.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
            className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[12.5px] font-bold transition-all duration-150 shadow-sm shadow-[#0e6efe]/20"
          >
            Få hjälp att köpa <ChevronRight className="w-3.5 h-3.5 opacity-80" />
          </button>
          {/* Subtle expand indicator */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCardExpanded(v => !v); if (cardExpanded) setPanel(null); }}
            className="w-full flex items-center justify-center gap-1 mt-1.5 h-6 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            {cardExpanded
              ? <><ChevronUp className="w-3 h-3" />Stäng</>
              : <><ChevronDown className="w-3 h-3" />Kalkyl & matchning</>
            }
          </button>
        </div>
      )}
    </div>
  );
}
