import { Star, Car, Check, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface CompactCarCardProps {
  name: string;
  imageUrl?: string | null;
  rating?: number;
  topBadge?: boolean;
  expertComment?: string;
  fuelLabel?: string;
  estimatedMonthly?: number;
  monthlySaving?: number;
  equityFreed?: number;
  isSelected?: boolean;
  isCompared?: boolean;
  onSelect?: () => void;
  onCompare?: () => void;
  onNegotiate: () => void;
  onDetail?: () => void;
  index?: number;
  disableMotion?: boolean;
}

function RatingBar({ rating }: { rating: number }) {
  const clamped = Math.max(5, Math.min(10, rating));
  const pct = ((clamped - 5) / 5) * 100;
  const color = clamped >= 9 ? '#10b981' : clamped >= 7.5 ? '#0e6efe' : '#64748b';

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-[11px] font-bold tabular-nums shrink-0"
        style={{ color }}
      >
        {Number.isInteger(clamped) ? clamped : clamped.toFixed(1)}
        <span className="font-normal text-slate-400">/10</span>
      </span>
    </div>
  );
}

function formatSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

export default function CompactCarCard({
  name, imageUrl, rating, topBadge, expertComment,
  fuelLabel, estimatedMonthly, monthlySaving, equityFreed,
  isSelected, isCompared,
  onSelect, onCompare, onNegotiate, onDetail,
}: CompactCarCardProps) {

  const handleClick = () => {
    if (onSelect) onSelect();
    else if (onDetail) onDetail();
  };

  return (
    <div
      className={`group relative bg-[#f0f7ff] rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-[#0e6efe] shadow-[0_0_0_4px_rgba(14,110,254,0.12)]'
          : isCompared
          ? 'ring-2 ring-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'
          : 'ring-1 ring-slate-100 hover:ring-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]'
      }`}
      style={{ touchAction: 'pan-y' }}
      onClick={handleClick}
    >
      {/* Image — 4:3 on mobile, 16:9 on sm+ for better density */}
      <div className="relative aspect-[4/3] sm:aspect-[16/9] bg-gradient-to-b from-slate-50 to-slate-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-10 h-10 text-slate-200" />
          </div>
        )}

        {topBadge && !isSelected && !isCompared && (
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-sm text-[10px] font-bold text-[#0e6efe] shadow-sm">
              <Star className="w-2.5 h-2.5 fill-[#0e6efe] text-[#0e6efe]" />
              Toppval
            </span>
          </div>
        )}

        {onSelect && (
          <div className={`absolute top-2 left-2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            isSelected
              ? 'bg-[#0e6efe] border-[#0e6efe] shadow-md scale-110'
              : 'bg-white/85 border-slate-300 backdrop-blur-sm'
          }`}>
            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
        )}

        {monthlySaving != null && monthlySaving > 0 && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm">
            -{formatSEK(monthlySaving)} kr/mån
          </div>
        )}
        {equityFreed != null && equityFreed > 0 && !(monthlySaving && monthlySaving > 0) && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm">
            +{formatSEK(equityFreed)} kr tillbaka
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-3 pt-2.5 pb-2">
        <h3 className="text-[12px] sm:text-[13px] font-bold text-slate-900 leading-tight truncate group-hover:text-[#0e6efe] transition-colors duration-200">
          {name}
        </h3>

        {rating != null && <RatingBar rating={rating} />}

        {/* Monthly cost — prominently shown when provided */}
        {estimatedMonthly ? (
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-[13px] sm:text-[14px] font-extrabold text-[#0e6efe] tabular-nums leading-none">
              {estimatedMonthly.toLocaleString('sv-SE')}
            </span>
            <span className="text-[10px] font-semibold text-[#0e6efe]/70">kr/mån</span>
          </div>
        ) : null}

        {monthlySaving != null && monthlySaving > 0 && (
          <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">
            Du sparar {formatSEK(monthlySaving)} kr/mån
          </p>
        )}

        {equityFreed != null && equityFreed > 0 && (
          <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">
            +{formatSEK(equityFreed)} kr frigörs vid byte
          </p>
        )}

        {/* Expert comment — hidden on mobile to save space */}
        {expertComment && (
          <p className="hidden sm:block mt-1 text-[11px] text-slate-400 leading-snug line-clamp-2 min-h-[28px]">
            {expertComment}
          </p>
        )}

        {fuelLabel && (
          <p className="mt-1 text-[10px] text-slate-400 truncate">{fuelLabel}</p>
        )}
      </div>

      {/* Action buttons */}
      {!onSelect && (
        <div className="px-3 pb-3 flex gap-2 mt-0.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
            className="flex-1 h-8 sm:h-9 rounded-lg bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[11px] font-bold transition-all duration-150 flex items-center justify-center gap-1"
          >
            Få hjälp att köpa
            <ChevronRight className="w-3 h-3 opacity-80" />
          </button>
          {/* Compare button — hidden on mobile */}
          {onCompare && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCompare(); }}
              title={isCompared ? 'Ta bort från jämförelse' : 'Jämför'}
              className={`hidden sm:flex h-9 w-9 rounded-lg border items-center justify-center shrink-0 transition-all duration-150 active:scale-[0.98] ${
                isCompared
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white border-slate-200 hover:border-[#0e6efe] text-slate-500 hover:text-[#0e6efe]'
              }`}
            >
              {isCompared
                ? <Check className="w-4 h-4" strokeWidth={2.5} />
                : <SlidersHorizontal className="w-4 h-4" />
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}
