import { Zap, Star, Check, ChevronRight, SlidersHorizontal } from 'lucide-react';
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

export default function ElCarCard({
  name, imageUrl, rating, expertComment, rangeKm,
  carPrice, usedPrice, fuelLabel, isCompared, topBadge,
  onNegotiate, onDetail, onCompare,
}: ElCarCardProps) {
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;

  return (
    <div
      className={`group relative bg-white rounded-2xl transition-all duration-300 ${
        isCompared
          ? 'ring-2 ring-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]'
          : 'ring-1 ring-slate-100 hover:ring-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.11)]'
      }`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Clickable card area */}
      <div className="cursor-pointer" onClick={() => onDetail?.()}>
        <div className="relative aspect-[4/3] sm:aspect-[16/9] bg-white overflow-hidden rounded-t-2xl" style={{ minHeight: 150 }}>
          {imageUrl ? (
            <img
              src={imageUrl} alt={name}
              className="w-full h-full object-contain p-3 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              onError={(e) => { e.currentTarget.src = '/car-placeholder.svg'; e.currentTarget.className = 'w-full h-full object-contain p-6 opacity-50'; }}
            />
          ) : (
            <img src="/car-placeholder.svg" alt={name} className="w-full h-full object-contain p-6 opacity-50" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />

          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/95 backdrop-blur-sm text-[10px] font-bold text-sky-500 shadow-sm border border-sky-100">
              <Zap className="w-2.5 h-2.5 fill-sky-500" />Elbil
            </span>
          </div>

          {topBadge && !isCompared && (
            <div className="absolute top-2.5 right-2.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/95 backdrop-blur-sm text-[10px] font-bold text-[#0e6efe] shadow-sm">
                <Star className="w-2.5 h-2.5 fill-[#0e6efe] text-[#0e6efe]" />Toppval
              </span>
            </div>
          )}
          {isCompared && (
            <div className="absolute top-2.5 right-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            </div>
          )}
          {rating != null && !isCompared && !topBadge && (
            <ScoreBadge value={rating} />
          )}
        </div>

        <div className="px-3.5 pt-3 pb-2">
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
          {rangeKm != null && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-400"
                  style={{ width: `${Math.min(100, (rangeKm / 700) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-sky-500 tabular-nums shrink-0">{rangeKm} km</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-3.5 pb-3.5 space-y-1.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
          className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[12.5px] font-bold transition-all duration-150 shadow-sm shadow-[#0e6efe]/20"
        >
          Få hjälp att köpa <ChevronRight className="w-3.5 h-3.5 opacity-80" />
        </button>
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
            {isCompared ? 'Tillagd i jämförelse' : 'Jämför'}
          </button>
        )}
      </div>
    </div>
  );
}
