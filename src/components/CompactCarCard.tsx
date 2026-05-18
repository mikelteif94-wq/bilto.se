import { Star, Car, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompactCarCardProps {
  name: string;
  imageUrl?: string | null;
  rating?: number;
  topBadge?: boolean;
  expertComment?: string;
  fuelLabel?: string;
  monthlyCost?: number;
  negotiateLabel?: string;
  onNegotiate: () => void;
  onDetail?: () => void;
  index?: number;
  disableMotion?: boolean;
}

export default function CompactCarCard({
  name, imageUrl, rating, topBadge, expertComment,
  fuelLabel, monthlyCost, negotiateLabel,
  onNegotiate, onDetail, index = 0, disableMotion,
}: CompactCarCardProps) {
  return (
    <motion.div
      initial={disableMotion ? false : { opacity: 0, y: 16 }}
      animate={disableMotion ? { opacity: 1, y: 0 } : undefined}
      {...(!disableMotion && { whileInView: { opacity: 1, y: 0 }, viewport: { once: true } })}
      transition={{ duration: disableMotion ? 0 : 0.35, delay: disableMotion ? 0 : index * 0.04 }}
      className="group relative bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 cursor-pointer ring-1 ring-slate-100 hover:ring-slate-200"
      onClick={onDetail}
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

        {topBadge && (
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-sm text-[10px] font-bold text-[#0e6efe] shadow-sm">
              <Star className="w-2.5 h-2.5 fill-[#0e6efe] text-[#0e6efe]" />
              Toppval
            </span>
          </div>
        )}

        {rating != null && (
          <div className={`absolute top-2 right-2 w-8 h-8 rounded-full shadow-md flex items-center justify-center ${rating >= 9 ? 'bg-emerald-500' : 'bg-[#0e6efe]'}`}>
            <span className="text-[11px] font-bold text-white">{rating}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-3.5 pt-2.5 pb-3.5">
        <h3 className="text-[14px] font-bold text-slate-900 leading-tight truncate group-hover:text-[#0e6efe] transition-colors duration-200">
          {name}
        </h3>

        {expertComment && (
          <p className="mt-1 text-[11px] text-slate-400 leading-snug line-clamp-2 min-h-[30px]">
            {expertComment}
          </p>
        )}

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex flex-col gap-0.5 min-w-0">
            {fuelLabel && (
              <p className="text-[11px] text-slate-400 truncate">{fuelLabel}</p>
            )}
            {monthlyCost && (
              <p className="text-[11px] text-slate-500 font-medium">~{monthlyCost.toLocaleString('sv-SE')} kr/mån</p>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
            className="shrink-0 ml-2 h-8 px-3.5 rounded-lg bg-[#0e6efe] hover:bg-[#0047B3] text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-all duration-200"
          >
            {negotiateLabel || 'Hitta pris'}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
