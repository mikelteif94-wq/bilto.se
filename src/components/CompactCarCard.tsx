import { useState } from 'react';
import { Star, Car, Check, ChevronRight, SlidersHorizontal, HelpCircle, X, Sparkles } from 'lucide-react';
import { calcCarMonthlyRange } from '../lib/utils';
import FinancingToggle from './FinancingToggle';

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

export default function CompactCarCard({
  name, imageUrl, rating, topBadge, expertComment,
  fuelLabel, carPrice, usedPrice, monthlySaving, equityFreed,
  isSelected, isCompared,
  onSelect, onCompare, onNegotiate, onDetail, onFitQuiz,
}: CompactCarCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;

  const handleClick = () => {
    if (onSelect) onSelect();
    else if (onDetail) onDetail();
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-[#0e6efe] shadow-[0_0_0_4px_rgba(14,110,254,0.10)]'
          : isCompared
          ? 'ring-2 ring-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]'
          : 'ring-1 ring-slate-100 hover:ring-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.11)]'
      }`}
      style={{ touchAction: 'pan-y' }}
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] sm:aspect-[16/9] bg-gradient-to-b from-slate-50 to-slate-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-10 h-10 text-slate-200" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />

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

      {/* Content */}
      <div className="px-4 pt-3.5 pb-2">
        <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-900 leading-snug truncate group-hover:text-[#0e6efe] transition-colors duration-200">
          {name}
        </h3>
        {expertComment && (
          <p className="hidden sm:block mt-1 text-[11.5px] text-slate-400 leading-relaxed line-clamp-2">{expertComment}</p>
        )}
        {fuelLabel && <p className="mt-0.5 text-[10.5px] text-slate-400 truncate">{fuelLabel}</p>}

        {range && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Ca månadskostnad</p>
            <div className="flex items-center justify-between gap-1 mb-2">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="text-[16px] font-extrabold text-[#0e6efe] tabular-nums leading-none whitespace-nowrap">
                  {formatSEK(range.low)}–{formatSEK(range.high)}
                </span>
                <span className="text-[11px] font-semibold text-[#0e6efe]/60 shrink-0">kr/mån</span>
              </div>
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowInfo(v => !v)}
                  className="text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                {showInfo && <InfoTooltip onClose={() => setShowInfo(false)} />}
              </div>
            </div>
            <FinancingToggle carPrice={carPrice!} usedPrice={usedPrice} />
          </div>
        )}

        {monthlySaving != null && monthlySaving > 0 && (
          <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">Du sparar {formatSEK(monthlySaving)} kr/mån</p>
        )}
        {equityFreed != null && equityFreed > 0 && (
          <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">+{formatSEK(equityFreed)} kr frigörs vid byte</p>
        )}
      </div>

      {/* Action buttons */}
      {!onSelect && (
        <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
            className="w-full flex items-center justify-center gap-1.5 h-11 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[13px] font-bold transition-all duration-150 shadow-sm shadow-[#0e6efe]/20"
          >
            Få hjälp att köpa <ChevronRight className="w-3.5 h-3.5 opacity-80" />
          </button>

          <div className="flex gap-2">
            {onFitQuiz && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onFitQuiz(); }}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl border border-slate-200 hover:border-[#0e6efe]/40 bg-slate-50 hover:bg-[#0e6efe]/5 text-slate-500 hover:text-[#0e6efe] text-[11px] font-medium transition-all duration-150 active:scale-[0.98]"
              >
                <Sparkles className="w-3 h-3" />
                Passar mig?
              </button>
            )}
            {onCompare && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCompare(); }}
                title={isCompared ? 'Ta bort från jämförelse' : 'Jämför'}
                className={`flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl border text-[11px] font-medium transition-all duration-150 active:scale-[0.98] ${
                  isCompared
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {isCompared
                  ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  : <SlidersHorizontal className="w-3.5 h-3.5" />
                }
                {isCompared ? 'Vald' : 'Jämför'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
