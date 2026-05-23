import { useState } from 'react';
import { Zap, Check, ChevronRight, SlidersHorizontal, Car, HelpCircle, X, Sparkles, Calculator, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { calcCarMonthlyRange, calcCarMonthly } from '../lib/utils';

interface ElCarCardProps {
  name: string;
  imageUrl?: string | null;
  rating?: number;
  expertComment?: string;
  rangeKm?: number;
  carPrice?: number;
  usedPrice?: number;
  fuelLabel?: string;
  isCompared?: boolean;
  topBadge?: boolean;
  onNegotiate: () => void;
  onDetail?: () => void;
  onCompare?: () => void;
  onFitQuiz?: () => void;
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

function RatingRing({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(10, rating));
  const radius = 16;
  const circ = 2 * Math.PI * radius;
  const fill = ((clamped - 5) / 5) * circ;
  const color = clamped >= 9 ? '#34d399' : clamped >= 7.5 ? '#38bdf8' : '#94a3b8';
  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
        <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3.5" />
        <circle cx="20" cy="20" r={radius} fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-extrabold text-white leading-none">
          {Number.isInteger(clamped) ? clamped : clamped.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function InfoTooltip({ onClose, dark }: { onClose: () => void; dark?: boolean }) {
  return (
    <div
      className={`absolute bottom-full right-0 mb-2 w-64 z-30 rounded-xl shadow-2xl p-3.5 ${
        dark ? 'bg-[#0c1a2e] border border-white/15' : 'bg-slate-900 border border-slate-700'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
      <p className="text-[11px] font-bold text-white mb-1.5">Hur räknar vi?</p>
      <p className="text-[10px] text-slate-400 leading-relaxed">
        Spannet baseras på snittpriset mellan begagnad och ny, vid 55% resp. 50% restvärde:<br />
        <span className="text-slate-300">20% kontantinsats · 1% uppläggning · 6,49% ränta · 36 månader</span>
      </p>
      <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5">
        Lägre siffra = 55% restvärde &nbsp;·&nbsp; Högre siffra = 50% restvärde
      </p>
      <div className="mt-2 pt-2 border-t border-white/10">
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
    <div className="mt-2.5 rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Uppskattad månadskostnad</p>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-extrabold text-[#38bdf8] tabular-nums leading-none">{fmt(monthly)}</span>
            <span className="text-[11px] font-semibold text-[#38bdf8]/60">kr/mån</span>
          </div>
          <p className="mt-0.5 text-[9px] text-slate-400">
            {RATE * 100}% ränta · {MONTHS} mån · {DOWN_PCT * 100}% ins. · {residualPct === 0.55 ? 55 : 50}% restvärde
          </p>
        </div>
        <div className="relative pb-0.5">
          <button type="button" onClick={() => setShowInfo(v => !v)} className="text-slate-600 hover:text-slate-300 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {showInfo && <InfoTooltip dark onClose={() => setShowInfo(false)} />}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10.5px] font-semibold text-slate-300">Bilpris</label>
          <span className="text-[11px] font-bold tabular-nums text-white">{fmt(price)} kr</span>
        </div>
        <input
          type="range" min={MIN_PRICE} max={MAX_PRICE} step={5_000} value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer financing-slider"
          style={{ background: `linear-gradient(to right, #38bdf8 ${sliderPct}%, #334155 ${sliderPct}%)` }}
        />
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-slate-500">50 000 kr</span>
          <span className="text-[9px] text-slate-500">1 200 000 kr</span>
        </div>
      </div>

      <div className="flex gap-2">
        {([0.55, 0.50] as const).map(pct => (
          <button
            key={pct} type="button" onClick={() => setResidualPct(pct)}
            className={`flex-1 h-7 rounded-lg text-[11px] font-bold border transition-all duration-150 active:scale-[0.98] ${
              residualPct === pct
                ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                : 'border-white/10 text-slate-400 hover:border-[#0e6efe]/50 hover:text-[#0e6efe]'
            }`}
          >
            {pct === 0.55 ? '55% Standard' : '50%'}
          </button>
        ))}
      </div>

      <div className="pt-2.5 border-t border-white/10 grid grid-cols-3 gap-1.5 text-center">
        {[
          { label: 'Kontantinsats', value: `${fmt(price * DOWN_PCT)} kr` },
          { label: 'Lånesumma', value: `${fmt(price * (1 - DOWN_PCT) + price * FEE_PCT)} kr` },
          { label: 'Restvärde', value: `${fmt(price * residualPct)} kr` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[8.5px] text-slate-500 mb-0.5">{label}</p>
            <p className="text-[9.5px] font-bold tabular-nums text-slate-200">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-[8.5px] text-slate-500 leading-relaxed">Uppskattning. Faktisk kostnad beror på kreditgivare och individuella villkor.</p>
    </div>
  );
}

export default function ElCarCard({
  name, imageUrl, rating, expertComment, rangeKm,
  carPrice, usedPrice, isCompared, topBadge,
  onNegotiate, onDetail, onCompare, onFitQuiz,
}: ElCarCardProps) {
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;
  const [expanded, setExpanded] = useState<null | 'calc' | 'fit'>(null);

  const togglePanel = (panel: 'calc' | 'fit', e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => prev === panel ? null : panel);
  };

  return (
    <div
      onClick={() => { if (onDetail) onDetail(); }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ${
        isCompared
          ? 'ring-2 ring-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]'
          : 'ring-1 ring-white/10 hover:ring-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
      }`}
      style={{ background: 'linear-gradient(155deg, #0f172a 0%, #0c1a2e 55%, #051020 100%)', touchAction: 'pan-y' }}
    >
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent opacity-70" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 rounded-full bg-[#0e6efe]/10 blur-3xl" />
      </div>

      {/* Image */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] overflow-hidden bg-[#0c1525]">
        {imageUrl ? (
          <img
            src={imageUrl} alt={name} loading="lazy"
            className="w-full h-full object-contain p-3 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Car className="w-12 h-12 text-slate-600" /></div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#38bdf8]/20 backdrop-blur-sm border border-[#38bdf8]/40 text-[10px] font-extrabold text-[#7dd3fc] shadow-sm uppercase tracking-wide">
            <Zap className="w-2.5 h-2.5 fill-[#7dd3fc]" />Elbil
          </span>
        </div>
        {topBadge && !isCompared && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] font-extrabold text-amber-300 backdrop-blur-sm">★ Toppval</span>
          </div>
        )}
        {isCompared && (
          <div className="absolute top-2.5 right-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center shadow-md">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0f172a] to-transparent" />
      </div>

      {/* Content */}
      <div className="px-3.5 pt-3 pb-1 flex-1 flex flex-col">
        <div className="flex items-start gap-2 mb-2">
          {rating != null && <RatingRing rating={rating} />}
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] sm:text-[14px] font-extrabold text-white leading-tight truncate group-hover:text-[#7dd3fc] transition-colors duration-200">{name}</h3>
            {expertComment && (
              <p className="hidden sm:block mt-0.5 text-[11px] text-slate-400 leading-snug line-clamp-1">{expertComment}</p>
            )}
          </div>
        </div>

        {/* Price summary */}
        {range && (
          <div className="mb-2 flex items-baseline gap-1">
            <span className="text-[14px] font-extrabold text-[#38bdf8] tabular-nums whitespace-nowrap">
              {formatSEK(range.low)}–{formatSEK(range.high)}
            </span>
            <span className="text-[10px] text-[#38bdf8]/60 font-semibold">kr/mån</span>
          </div>
        )}

        {/* Range bar */}
        {rangeKm != null && (
          <div className="mb-2 flex items-center gap-1.5">
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#34d399]" style={{ width: `${Math.min(100, (rangeKm / 700) * 100)}%` }} />
            </div>
            <span className="text-[10px] font-bold text-[#38bdf8] tabular-nums shrink-0">{rangeKm} km</span>
          </div>
        )}

        {/* Expandable panels */}
        <AnimatePresence initial={false}>
          {expanded === 'calc' && carPrice && (
            <motion.div
              key="calc"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <CalcPanel carPrice={carPrice} usedPrice={usedPrice} />
            </motion.div>
          )}
          {expanded === 'fit' && onFitQuiz && (
            <motion.div
              key="fit"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mt-2.5 rounded-xl border border-white/10 bg-white/5 p-3.5">
                <p className="text-[12.5px] font-semibold text-white mb-1">Passar {name} dig?</p>
                <p className="text-[11.5px] text-slate-400 leading-relaxed mb-3">
                  Svara på några korta frågor så jämför vi bilen mot dina behov — familj, pendling, budget och körstil.
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFitQuiz(); }}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[12.5px] font-bold transition-all duration-150 shadow-lg shadow-[#0e6efe]/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Starta matchning
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action row */}
      <div className="px-3.5 pb-3.5 pt-1 flex flex-col gap-1.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
            className="flex-1 h-9 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[11px] font-bold transition-all duration-150 flex items-center justify-center gap-1 shadow-lg shadow-[#0e6efe]/30"
          >
            Få hjälp att köpa<ChevronRight className="w-3 h-3 opacity-80" />
          </button>
          {onCompare && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCompare(); }}
              title={isCompared ? 'Ta bort från jämförelse' : 'Jämför'}
              className={`hidden sm:flex h-9 w-9 rounded-xl border items-center justify-center shrink-0 transition-all duration-150 active:scale-[0.98] ${
                isCompared ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-[#38bdf8] hover:text-[#38bdf8]'
              }`}
            >
              {isCompared ? <Check className="w-4 h-4" strokeWidth={2.5} /> : <SlidersHorizontal className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Secondary expand row */}
        <div className="flex gap-1.5">
          {carPrice && (
            <button
              type="button"
              onClick={(e) => togglePanel('calc', e)}
              className={`flex-1 h-7 rounded-xl border flex items-center justify-center gap-1 text-[10px] font-semibold transition-all duration-150 active:scale-[0.98] ${
                expanded === 'calc'
                  ? 'bg-[#38bdf8]/15 border-[#38bdf8]/40 text-[#7dd3fc]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-[#38bdf8]/40 hover:text-[#7dd3fc]'
              }`}
            >
              <Calculator className="w-2.5 h-2.5" />
              Kalkyl
              <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${expanded === 'calc' ? 'rotate-180' : ''}`} />
            </button>
          )}
          {onFitQuiz && (
            <button
              type="button"
              onClick={(e) => togglePanel('fit', e)}
              className={`flex-1 h-7 rounded-xl border flex items-center justify-center gap-1 text-[10px] font-semibold transition-all duration-150 active:scale-[0.98] ${
                expanded === 'fit'
                  ? 'bg-[#38bdf8]/15 border-[#38bdf8]/40 text-[#7dd3fc]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-[#38bdf8]/40 hover:text-[#7dd3fc]'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              Passar mig?
              <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${expanded === 'fit' ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
