import { Star, Car, Check, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompactCarCardProps {
  name: string;
  imageUrl?: string | null;
  rating?: number;
  topBadge?: boolean;
  expertComment?: string;
  fuelLabel?: string;
  estimatedMonthly?: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onNegotiate: () => void;
  onDetail?: () => void;
  index?: number;
  disableMotion?: boolean;
}

export default function CompactCarCard({
  name, imageUrl, rating, topBadge, expertComment,
  fuelLabel, estimatedMonthly, isSelected, onSelect,
  onNegotiate, onDetail, index = 0, disableMotion,
}: CompactCarCardProps) {
  const handleClick = () => {
    if (onSelect) onSelect();
    else if (onDetail) onDetail();
  };

  return (
    <motion.div
      initial={disableMotion ? false : { opacity: 0, y: 16 }}
      animate={disableMotion ? { opacity: 1, y: 0 } : undefined}
      {...(!disableMotion && { whileInView: { opacity: 1, y: 0 }, viewport: { once: true } })}
      transition={{ duration: disableMotion ? 0 : 0.35, delay: disableMotion ? 0 : index * 0.04 }}
      className={`group relative bg-[#f0f7ff] rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-[#0e6efe] shadow-[0_0_0_4px_rgba(14,110,254,0.12)]'
          : 'ring-1 ring-slate-100 hover:ring-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]'
      }`}
      style={{ touchAction: 'pan-y' }}
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] bg-gradient-to-b from-slate-50 to-slate-100 overflow-hidden">
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

        {topBadge && !isSelected && (
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-sm text-[10px] font-bold text-[#0e6efe] shadow-sm">
              <Star className="w-2.5 h-2.5 fill-[#0e6efe] text-[#0e6efe]" />
              Toppval
            </span>
          </div>
        )}

        {/* Selection indicator */}
        {onSelect && (
          <div className={`absolute top-2 left-2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            isSelected
              ? 'bg-[#0e6efe] border-[#0e6efe] shadow-md scale-110'
              : 'bg-white/85 border-slate-300 backdrop-blur-sm'
          }`}>
            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
        )}

        {rating != null && (
          <div className={`absolute top-2 right-2 w-8 h-8 rounded-full shadow-md flex items-center justify-center ${rating >= 9 ? 'bg-emerald-500' : 'bg-[#0e6efe]'}`}>
            <span className="text-[11px] font-bold text-white">{rating}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-3.5 pt-2.5 pb-3">
        <h3 className="text-[13px] font-bold text-slate-900 leading-tight truncate group-hover:text-[#0e6efe] transition-colors duration-200">
          {name}
        </h3>

        {estimatedMonthly ? (
          <p className="mt-0.5 text-[12px] font-semibold text-[#0e6efe]">
            ca {estimatedMonthly.toLocaleString('sv-SE')} kr/mån
          </p>
        ) : null}

        {expertComment && (
          <p className="mt-1 text-[11px] text-slate-400 leading-snug line-clamp-2 min-h-[28px]">
            {expertComment}
          </p>
        )}

        <div className="flex items-center justify-between mt-2">
          {fuelLabel && (
            <p className="text-[10px] text-slate-400 truncate">{fuelLabel}</p>
          )}
          {!onSelect && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDetail ? onDetail() : onNegotiate(); }}
              className="shrink-0 ml-auto h-7 px-3 rounded-lg bg-slate-100 hover:bg-[#0e6efe] text-slate-600 hover:text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-all duration-200"
            >
              Läs mer
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
