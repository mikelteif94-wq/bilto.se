import { Zap, Check, ChevronRight, SlidersHorizontal, Car } from 'lucide-react';
import { calcCarMonthlyRange } from '../lib/utils';

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

export default function ElCarCard({
  name, imageUrl, rating, expertComment, rangeKm,
  carPrice, usedPrice, isCompared, topBadge,
  onNegotiate, onDetail, onCompare,
}: ElCarCardProps) {
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;

  return (
    <div
      className={`group relative flex flex-col rounded-2xl transition-all duration-300 ${
        isCompared
          ? 'ring-2 ring-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]'
          : 'ring-1 ring-white/10 hover:ring-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
      }`}
      style={{ background: 'linear-gradient(155deg, #0f172a 0%, #0c1a2e 55%, #051020 100%)', touchAction: 'pan-y' }}
    >
      <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent opacity-70" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 rounded-full bg-[#0e6efe]/10 blur-3xl" />
      </div>

      {/* Clickable card area */}
      <div className="cursor-pointer" onClick={() => onDetail?.()}>
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-t-2xl bg-[#080f1c]">
          {imageUrl ? (
            <img
              src={imageUrl} alt={name} loading="lazy"
              className="w-full h-full object-contain p-4 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
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

        <div className="px-3.5 pt-3 pb-1">
          <div className="flex items-start gap-2 mb-2">
            {rating != null && <RatingRing rating={rating} />}
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] sm:text-[14px] font-extrabold text-white leading-tight truncate group-hover:text-[#7dd3fc] transition-colors duration-200">{name}</h3>
              {expertComment && (
                <p className="hidden sm:block mt-0.5 text-[11px] text-slate-400 leading-snug line-clamp-1">{expertComment}</p>
              )}
            </div>
          </div>

          {range && (
            <div className="mb-2 flex items-baseline gap-1">
              <span className="text-[14px] font-extrabold text-[#38bdf8] tabular-nums whitespace-nowrap">
                {formatSEK(range.low)}–{formatSEK(range.high)}
              </span>
              <span className="text-[10px] text-[#38bdf8]/60 font-semibold">kr/mån</span>
            </div>
          )}

          {rangeKm != null && (
            <div className="mb-2 flex items-center gap-1.5">
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#34d399]" style={{ width: `${Math.min(100, (rangeKm / 700) * 100)}%` }} />
              </div>
              <span className="text-[10px] font-bold text-[#38bdf8] tabular-nums shrink-0">{rangeKm} km</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-3.5 pb-3.5 pt-1 space-y-1.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
          className="w-full h-9 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[11px] font-bold transition-all duration-150 flex items-center justify-center gap-1 shadow-lg shadow-[#0e6efe]/30"
        >
          Få hjälp att köpa <ChevronRight className="w-3 h-3 opacity-80" />
        </button>
        {onCompare && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCompare(); }}
            className={`w-full flex items-center justify-center gap-1.5 h-7 rounded-xl border text-[10px] font-medium transition-all duration-150 active:scale-[0.98] ${
              isCompared
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
            }`}
          >
            {isCompared ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <SlidersHorizontal className="w-3 h-3" />}
            {isCompared ? 'Tillagd i jämförelse' : 'Jämför'}
          </button>
        )}
      </div>
    </div>
  );
}
