import { Zap, Star, Check, ChevronRight, SlidersHorizontal, Users } from 'lucide-react';
import { calcCarMonthlyRange } from '../lib/utils';

const BODY_LABELS: Record<string, string> = {
  sedan: 'Sedan', kombi: 'Kombi', suv: 'SUV', hatchback: 'Halvkombi',
  coupe: 'Coupé', cab: 'Cab', mpv: 'MPV',
};

interface ElCarCardProps {
  name: string;
  imageUrl?: string | null;
  rating?: number;
  expertComment?: string;
  rangeKm?: number;
  carPrice?: number;
  usedPrice?: number;
  fuelLabel?: string;
  bodyType?: string;
  drivetrain?: string[];
  seats?: number;
  pros?: string[];
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
  const isTop = value >= 9;
  const isMid = value >= 7.5;
  const color = isTop ? '#059669' : isMid ? '#0e6efe' : '#d97706';
  return (
    <div
      className="absolute top-2.5 right-2.5 flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-sm"
      style={{
        border: `2px solid ${color}`,
        boxShadow: `0 2px 8px ${color}30`,
        backgroundColor: 'rgba(255,255,255,0.92)',
      }}
    >
      <span className="text-[11px] font-extrabold tabular-nums leading-none" style={{ color }}>
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </span>
    </div>
  );
}

export default function ElCarCard({
  name, imageUrl, rating, expertComment, rangeKm,
  carPrice, usedPrice, fuelLabel, bodyType, drivetrain, seats, pros,
  isCompared, topBadge,
  onNegotiate, onDetail, onCompare,
}: ElCarCardProps) {
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;
  const displayComment = (pros && pros.length > 0) ? pros[0] : expertComment;

  return (
    <div
      className={`group relative bg-white rounded-2xl transition-all duration-300 ${
        isCompared
          ? 'ring-2 ring-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]'
          : 'ring-1 ring-slate-100/80 shadow-card hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-slate-200'
      }`}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="cursor-pointer" onClick={() => onDetail?.()}>
        <div className="relative aspect-[4/3] sm:aspect-[16/9] bg-gradient-to-b from-slate-50 to-white overflow-hidden rounded-t-2xl" style={{ minHeight: 140 }}>
          {imageUrl ? (
            <img
              src={imageUrl} alt={name} loading="lazy" decoding="async"
              className="w-full h-full object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.05]"
              onError={(e) => { e.currentTarget.src = '/car-placeholder.svg'; e.currentTarget.className = 'w-full h-full object-contain p-6 opacity-35'; }}
            />
          ) : (
            <img src="/car-placeholder.svg" alt={name} loading="lazy" decoding="async" className="w-full h-full object-contain p-6 opacity-35" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/70 to-transparent pointer-events-none" />

          {/* Elbil badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold"
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(14,165,233,0.35)',
              }}>
              <Zap className="w-2.5 h-2.5 fill-white text-white" />
              Elbil
            </span>
          </div>

          {topBadge && !isCompared && (
            <div className="absolute top-2.5 right-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(245,158,11,0.35)',
                }}>
                <Star className="w-2.5 h-2.5 fill-white text-white" />
                Toppval
              </span>
            </div>
          )}
          {isCompared && (
            <div className="absolute top-2.5 right-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            </div>
          )}
          {rating != null && !isCompared && !topBadge && <ScoreBadge value={rating} />}
        </div>

        <div className="px-3.5 pt-3 pb-2">
          <h3 className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 leading-snug truncate transition-colors duration-200 group-hover:text-bilto-600">
            {name}
          </h3>

          {/* Meta row: fuel / body / drivetrain / seats */}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {fuelLabel && (
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{fuelLabel}</span>
            )}
            {bodyType && BODY_LABELS[bodyType] && (
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-500">
                {BODY_LABELS[bodyType]}
              </span>
            )}
            {drivetrain && drivetrain.includes('awd') && (
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-600">
                AWD
              </span>
            )}
            {seats != null && seats > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-500">
                <Users className="w-2.5 h-2.5" />{seats}
              </span>
            )}
          </div>

          {displayComment && (
            <p className="hidden sm:block mt-1 text-[11px] text-slate-400 leading-snug line-clamp-1 italic">{displayComment}</p>
          )}
          {range && (
            <div className="mt-2 flex items-baseline gap-1 min-w-0">
              <span className="text-[16px] font-extrabold tabular-nums leading-none text-bilto-600 whitespace-nowrap">
                {formatSEK(range.low)}–{formatSEK(range.high)}
              </span>
              <span className="text-[10px] font-semibold text-bilto-400 shrink-0">kr/mån</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-3.5 pb-3.5 space-y-1.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
          className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl text-white text-[12.5px] font-bold transition-all duration-200 active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #1a7fff 0%, #0e6efe 60%, #0a57cc 100%)',
            boxShadow: '0 3px 12px rgba(14,110,254,0.30)',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 5px 18px rgba(14,110,254,0.42)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 3px 12px rgba(14,110,254,0.30)')}
        >
          Få hjälp att köpa <ChevronRight className="w-3.5 h-3.5 opacity-80" />
        </button>
        {onCompare && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCompare(); }}
            className={`w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border text-[11px] font-semibold transition-all duration-200 active:scale-[0.97] ${
              isCompared
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-400 hover:border-bilto-200 hover:text-bilto-500 hover:bg-bilto-50'
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
