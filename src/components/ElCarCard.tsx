import { Zap, Star, Check, ChevronRight, Info } from 'lucide-react';
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
  isSelected?: boolean;
  topBadge?: boolean;
  onNegotiate: () => void;
  onDetail?: () => void;
  onSelect?: () => void;
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
      className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-full"
      style={{
        border: `2px solid ${color}`,
        boxShadow: `0 2px 8px ${color}30`,
        backgroundColor: 'rgba(255,255,255,0.95)',
      }}
    >
      <span className="text-[10px] font-extrabold tabular-nums leading-none" style={{ color }}>
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </span>
    </div>
  );
}

export default function ElCarCard({
  name, imageUrl, rating, expertComment,
  carPrice, usedPrice, fuelLabel, bodyType, drivetrain, pros,
  isSelected, topBadge,
  onNegotiate, onDetail,
}: ElCarCardProps) {
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;
  const displayComment = (pros && pros.length > 0) ? pros[0] : expertComment;
  const bodyLabel = bodyType ? BODY_LABELS[bodyType] : null;

  const ringClass = isSelected
    ? 'ring-2 ring-[#0e6efe] shadow-[0_0_0_4px_rgba(14,110,254,0.12)]'
    : 'ring-1 ring-slate-200 shadow-sm hover:shadow-md hover:ring-slate-300';

  return (
    <div
      className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 ${ringClass}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Mobile: horizontal layout */}
      <div className="flex sm:hidden" onClick={() => onDetail?.()}>
        {/* Image */}
        <div className="relative w-[110px] shrink-0 bg-gradient-to-b from-slate-50 to-white self-stretch flex items-center">
          {imageUrl ? (
            <img
              src={imageUrl} alt={name} loading="lazy" decoding="async"
              className="w-full h-full object-contain p-2"
              onError={(e) => { e.currentTarget.src = '/car-placeholder.svg'; e.currentTarget.className = 'w-full h-full object-contain p-3 opacity-30'; }}
            />
          ) : (
            <img src="/car-placeholder.svg" alt={name} loading="lazy" decoding="async" className="w-full h-full object-contain p-3 opacity-30" />
          )}
          {/* Elbil badge */}
          <div className="absolute bottom-1.5 left-1.5">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
              style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', color: '#fff' }}>
              <Zap className="w-2 h-2 fill-white text-white" />
              EL
            </span>
          </div>
          {topBadge && !isSelected && (
            <div className="absolute top-1.5 left-1.5">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#fff' }}>
                <Star className="w-2 h-2 fill-white text-white" />
                Topp
              </span>
            </div>
          )}
          {rating != null && !isSelected && !topBadge && <ScoreBadge value={rating} />}
          {isSelected && (
            <div className="absolute top-1.5 right-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#0e6efe]">
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col p-3 gap-1">
          <h3 className="text-[13px] font-bold text-slate-900 leading-snug truncate">{name}</h3>
          <div className="flex flex-wrap items-center gap-1">
            {fuelLabel && <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{fuelLabel}</span>}
            {bodyLabel && <span className="px-1 py-0.5 rounded text-[8px] font-semibold bg-slate-100 text-slate-500">{bodyLabel}</span>}
            {drivetrain?.includes('awd') && <span className="px-1 py-0.5 rounded text-[8px] font-semibold bg-blue-50 text-blue-600">AWD</span>}
          </div>
          {displayComment && (
            <p className="text-[10px] text-slate-400 leading-snug line-clamp-1 italic">{displayComment}</p>
          )}
          {range && (
            <div className="flex items-baseline gap-0.5">
              <span className="text-[13px] font-extrabold tabular-nums text-[#0e6efe]">
                {formatSEK(range.low)}–{formatSEK(range.high)}
              </span>
              <span className="text-[9px] font-semibold text-[#0e6efe]/60">kr/mån</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-auto pt-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
              className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-white text-[11px] font-bold transition-all active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #1a7fff 0%, #0e6efe 60%, #0a57cc 100%)', boxShadow: '0 2px 8px rgba(14,110,254,0.28)' }}
            >
              Få prishjälp <ChevronRight className="w-3 h-3 opacity-80" />
            </button>
            {onDetail && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDetail(); }}
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center transition-all active:scale-[0.97] hover:border-[#0e6efe]/40 hover:text-[#0e6efe]"
              >
                <Info className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: vertical layout */}
      <div className="hidden sm:block">
        <div className="cursor-pointer" onClick={() => onDetail?.()}>
          <div className="relative aspect-[16/9] bg-gradient-to-b from-slate-50 to-white overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl} alt={name} loading="lazy" decoding="async"
                className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.05]"
                onError={(e) => { e.currentTarget.src = '/car-placeholder.svg'; e.currentTarget.className = 'w-full h-full object-contain p-6 opacity-35'; }}
              />
            ) : (
              <img src="/car-placeholder.svg" alt={name} loading="lazy" decoding="async" className="w-full h-full object-contain p-6 opacity-35" />
            )}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/70 to-transparent pointer-events-none" />
            <div className="absolute top-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', color: '#fff', boxShadow: '0 2px 8px rgba(14,165,233,0.35)' }}>
                <Zap className="w-2.5 h-2.5 fill-white text-white" />
                Elbil
              </span>
            </div>
            {topBadge && !isSelected && (
              <div className="absolute top-2.5 right-2.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#fff', boxShadow: '0 2px 8px rgba(245,158,11,0.35)' }}>
                  <Star className="w-2.5 h-2.5 fill-white text-white" />
                  Toppval
                </span>
              </div>
            )}
            {isSelected && !topBadge && (
              <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md bg-[#0e6efe]">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            )}
            {rating != null && !isSelected && !topBadge && <ScoreBadge value={rating} />}
          </div>

          <div className="px-3.5 pt-3 pb-2">
            <h3 className="text-[14px] font-bold text-slate-900 leading-snug truncate group-hover:text-[#0e6efe] transition-colors">
              {name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {fuelLabel && <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{fuelLabel}</span>}
              {bodyType && BODY_LABELS[bodyType] && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-500">{BODY_LABELS[bodyType]}</span>
              )}
              {drivetrain?.includes('awd') && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-600">AWD</span>
              )}
            </div>
            {displayComment && (
              <p className="mt-1 text-[11px] text-slate-400 leading-snug line-clamp-1 italic">{displayComment}</p>
            )}
            {range && (
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-[16px] font-extrabold tabular-nums text-[#0e6efe]">
                  {formatSEK(range.low)}–{formatSEK(range.high)}
                </span>
                <span className="text-[10px] font-semibold text-[#0e6efe]/60">kr/mån</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-3.5 pb-3.5 space-y-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
            className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl text-white text-[12.5px] font-bold transition-all active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #1a7fff 0%, #0e6efe 60%, #0a57cc 100%)', boxShadow: '0 3px 12px rgba(14,110,254,0.30)' }}
          >
            Få prishjälp <ChevronRight className="w-3.5 h-3.5 opacity-80" />
          </button>
          {onDetail && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDetail(); }}
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 text-[11px] font-semibold transition-all active:scale-[0.97] hover:border-[#0e6efe]/30 hover:text-[#0e6efe] hover:bg-[#0e6efe]/5"
            >
              <Info className="w-3 h-3" />
              Läs mer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
