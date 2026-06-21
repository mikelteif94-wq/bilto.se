import { Star, ChevronRight, Info } from 'lucide-react';
import { calcCarMonthlyRange } from '../lib/utils';

interface DarkCarCardProps {
  name: string;
  imageUrl?: string | null;
  rating?: number;
  topBadge?: boolean;
  matchScore?: number;
  pros?: string[];
  cons?: string[];
  carPrice?: number;
  usedPrice?: number;
  bodyLabel?: string;
  fuelLabel?: string;
  trunkLiters?: number;
  expertComment?: string;
  onNegotiate: () => void;
  onDetail?: () => void;
  onFitQuiz?: () => void;
  index?: number;
}

function formatSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

function ScoreBadge({ value }: { value: number }) {
  const color = value >= 8.5 ? '#059669' : value >= 7 ? '#0e6efe' : '#d97706';
  return (
    <div
      className="absolute top-3 right-3 flex items-center justify-center w-10 h-10 rounded-full bg-white/95 shadow-md"
      style={{ border: `2.5px solid ${color}` }}
    >
      <span className="text-[13px] font-extrabold leading-none" style={{ color }}>{value}</span>
    </div>
  );
}

export default function DarkCarCard({
  name, imageUrl, rating, topBadge, expertComment,
  carPrice, usedPrice,
  onNegotiate, onDetail, index = 0,
}: DarkCarCardProps) {
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;

  return (
    <div
      className="group relative bg-white rounded-xl transition-shadow duration-200 ring-1 ring-slate-100 hover:ring-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Clickable card area */}
      <div className="cursor-pointer" onClick={() => onDetail?.()}>
        <div className="relative aspect-[16/10] bg-white overflow-hidden rounded-t-2xl" style={{ minHeight: 160 }}>
          {imageUrl ? (
            <img
              src={imageUrl} alt={name}
              className="w-full h-full object-contain p-4"
              onError={(e) => { e.currentTarget.src = '/car-placeholder.svg'; e.currentTarget.className = 'w-full h-full object-contain p-6 opacity-50'; }}
            />
          ) : (
            <img src="/car-placeholder.svg" alt={name} className="w-full h-full object-contain p-6 opacity-50" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />
          {topBadge && (
            <div className="absolute top-3.5 left-3.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 text-[11px] font-bold text-[#0e6efe] shadow-sm">
                <Star className="w-3 h-3 fill-[#0e6efe] text-[#0e6efe]" />Toppval
              </span>
            </div>
          )}
          {rating != null && <ScoreBadge value={rating} />}
        </div>

        <div className="px-4 pt-3 pb-3">
          <h3 className="text-[16px] font-bold text-slate-900 leading-snug group-hover:text-[#0e6efe] transition-colors duration-200">{name}</h3>
          {expertComment && (
            <p className="mt-0.5 text-[12px] text-slate-400 leading-relaxed line-clamp-1">{expertComment}</p>
          )}
          {range && (
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-[18px] font-extrabold text-slate-900 tabular-nums leading-none">
                {formatSEK(range.low)}–{formatSEK(range.high)}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">kr/mån</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 space-y-1.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[13.5px] font-bold transition-all duration-200 shadow-sm shadow-[#0e6efe]/20"
        >
          Få hjälp att köpa <ChevronRight className="w-4 h-4 opacity-80" />
        </button>
        {onDetail && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDetail(); }}
            className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 text-[11px] font-medium transition-all duration-150 active:scale-[0.98] hover:border-slate-300 hover:text-slate-700"
          >
            <Info className="w-3.5 h-3.5" />
            Läs mer
          </button>
        )}
      </div>
    </div>
  );
}
