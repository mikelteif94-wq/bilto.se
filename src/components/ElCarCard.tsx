import { Zap, Check, SlidersHorizontal, Car, ChevronRight, BatteryCharging } from 'lucide-react';

interface ElCarCardProps {
  name: string;
  imageUrl?: string | null;
  rating?: number;
  expertComment?: string;
  rangeKm?: number;
  estimatedMonthly?: number;
  fuelLabel?: string;
  isCompared?: boolean;
  topBadge?: boolean;
  onNegotiate: () => void;
  onDetail?: () => void;
  onCompare?: () => void;
}

function formatSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

function RatingBadge({ rating }: { rating: number }) {
  const isTop = rating >= 9;
  const isGood = rating >= 7.5;
  const bg = isTop ? 'rgba(6,78,59,0.9)' : isGood ? 'rgba(12,35,64,0.9)' : 'rgba(30,41,59,0.9)';
  const border = isTop ? '#34d399' : isGood ? '#38bdf8' : '#94a3b8';
  const color = isTop ? '#34d399' : isGood ? '#38bdf8' : '#94a3b8';
  const glow = isTop ? '0 0 12px rgba(52,211,153,0.5)' : isGood ? '0 0 12px rgba(56,189,248,0.5)' : 'none';
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[13px] tabular-nums shrink-0"
      style={{ background: bg, border: `1.5px solid ${border}`, color, boxShadow: glow }}
    >
      {Number.isInteger(rating) ? rating : rating.toFixed(1)}
    </div>
  );
}

export default function ElCarCard({
  name, imageUrl, rating, expertComment, rangeKm,
  estimatedMonthly, isCompared, topBadge,
  onNegotiate, onDetail, onCompare,
}: ElCarCardProps) {
  return (
    <div
      onClick={() => onDetail?.()}
      className={`group relative flex flex-col overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ${
        isCompared
          ? 'ring-2 ring-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.12),0_20px_60px_rgba(0,0,0,0.6)]'
          : 'ring-1 ring-white/8 hover:ring-[#38bdf8]/35 hover:shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(56,189,248,0.1)]'
      }`}
      style={{ background: 'linear-gradient(160deg,#0d1b2a 0%,#091628 55%,#040d1a 100%)', touchAction: 'pan-y' }}
    >
      {/* Top shimmer */}
      <div
        className="absolute top-0 inset-x-0 h-[1.5px] opacity-50 group-hover:opacity-100 transition-opacity duration-500 z-20"
        style={{ background: 'linear-gradient(90deg,transparent 0%,#38bdf8 45%,#7dd3fc 55%,transparent 100%)' }}
      />

      {/* Hover glow */}
      <div
        className="absolute -top-16 left-1/2 -translate-x-1/2 w-3/4 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse,rgba(56,189,248,0.08) 0%,transparent 70%)' }}
      />

      {/* Image */}
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              style={{ filter: 'brightness(0.85) contrast(1.1) saturate(1.15)' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom,rgba(4,13,26,0.05) 0%,rgba(4,13,26,0) 35%,rgba(4,13,26,0.55) 75%,rgba(4,13,26,0.92) 100%)' }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: '#080f1c' }}>
            <Car className="w-12 h-12 text-slate-700" />
          </div>
        )}

        {/* EV badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[9px] font-extrabold uppercase tracking-widest"
            style={{ background: 'rgba(14,110,254,0.22)', border: '1px solid rgba(56,189,248,0.45)', color: '#7dd3fc', backdropFilter: 'blur(8px)' }}
          >
            <Zap className="w-2.5 h-2.5 fill-[#7dd3fc]" />
            Elbil
          </span>
        </div>

        {/* Top pick */}
        {topBadge && !isCompared && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span
              className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[9px] font-extrabold uppercase tracking-wide"
              style={{ background: 'rgba(251,191,36,0.18)', border: '1px solid rgba(251,191,36,0.5)', color: '#fbbf24', backdropFilter: 'blur(8px)' }}
            >
              ★ Toppval
            </span>
          </div>
        )}

        {/* Compare check */}
        {isCompared && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-400/40">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          </div>
        )}

        {/* Name over image bottom */}
        <div className="absolute bottom-0 inset-x-0 px-3 pb-2.5 z-10 flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] sm:text-[14px] font-extrabold text-white leading-tight truncate group-hover:text-[#7dd3fc] transition-colors duration-200">
              {name}
            </h3>
            {expertComment && (
              <p className="hidden sm:block mt-0.5 text-[10px] leading-snug truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {expertComment}
              </p>
            )}
          </div>
          {rating != null && <RatingBadge rating={rating} />}
        </div>
      </div>

      {/* Stats */}
      <div className="px-3 pt-2.5 pb-1 flex flex-col gap-2">
        {estimatedMonthly != null && (
          <div
            className="flex items-center justify-between rounded-xl px-2.5 py-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-[10px] text-slate-500 font-medium">Ca månadskostnad</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[13px] font-extrabold tabular-nums text-[#38bdf8]">{formatSEK(estimatedMonthly)}</span>
              <span className="text-[9px] font-semibold" style={{ color: 'rgba(56,189,248,0.55)' }}>kr/mån</span>
            </div>
          </div>
        )}

        {rangeKm != null && (
          <div className="flex items-center gap-2">
            <BatteryCharging className="w-3 h-3 text-[#38bdf8] shrink-0 opacity-70" />
            <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, (rangeKm / 700) * 100)}%`, background: 'linear-gradient(90deg,#38bdf8,#34d399)' }}
              />
            </div>
            <span className="text-[10px] font-bold tabular-nums text-[#38bdf8] shrink-0">{rangeKm} km</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 pt-1.5 flex gap-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
          className="flex-1 h-9 rounded-xl text-white text-[11px] font-bold transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-1"
          style={{ background: 'linear-gradient(135deg,#0e6efe 0%,#0c54d4 100%)', boxShadow: '0 4px 20px rgba(14,110,254,0.4)' }}
        >
          Få hjälp att köpa
          <ChevronRight className="w-3 h-3 opacity-80" />
        </button>
        {onCompare && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCompare(); }}
            title={isCompared ? 'Ta bort från jämförelse' : 'Jämför'}
            className={`flex h-9 w-9 rounded-xl items-center justify-center shrink-0 transition-all duration-150 active:scale-[0.97] border ${
              isCompared
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                : 'border-white/10 text-slate-500 hover:border-[#38bdf8]/60 hover:text-[#38bdf8]'
            }`}
            style={isCompared ? {} : { background: 'rgba(255,255,255,0.04)' }}
          >
            {isCompared
              ? <Check className="w-4 h-4" strokeWidth={2.5} />
              : <SlidersHorizontal className="w-4 h-4" />
            }
          </button>
        )}
      </div>
    </div>
  );
}
