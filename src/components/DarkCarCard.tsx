import { Star, Car, ArrowRight, Check, Scale } from 'lucide-react';
import { motion } from 'framer-motion';

interface DarkCarCardProps {
  name: string;
  imageUrl?: string | null;
  rating?: number;
  topBadge?: boolean;
  matchScore?: number;
  pros?: string[];
  cons?: string[];
  monthlyCostRange?: string;
  bodyLabel?: string;
  fuelLabel?: string;
  trunkLiters?: number;
  expertComment?: string;
  onNegotiate: () => void;
  onDetail?: () => void;
  onCompare?: () => void;
  isComparing?: boolean;
  index?: number;
}

function estimateMonthlyCost(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('tesla') || n.includes('polestar') || n.includes('bmw') || n.includes('audi') || n.includes('mercedes') || n.includes('porsche') || n.includes('genesis') || n.includes('lexus')) return '5 500\u20138 500';
  if (n.includes('volvo xc90') || n.includes('volvo xc60') || n.includes('bmw x') || n.includes('audi q')) return '5 000\u20137 500';
  if (n.includes('volvo') || n.includes('vw') || n.includes('volkswagen') || n.includes('skoda') || n.includes('toyota rav') || n.includes('kia sportage')) return '3 500\u20135 500';
  if (n.includes('kia') || n.includes('hyundai') || n.includes('dacia') || n.includes('mg') || n.includes('renault') || n.includes('seat') || n.includes('cupra')) return '2 800\u20134 500';
  return '3 500\u20136 000';
}

function RatingCircle({ value }: { value: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 10) * circumference;
  const color = value >= 8.5 ? '#059669' : value >= 7 ? '#0e6efe' : '#d97706';

  return (
    <div className="relative w-[52px] h-[52px] flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
        <motion.circle
          cx="24" cy="24" r={radius}
          fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference - progress }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        />
      </svg>
      <span className="text-[14px] font-bold text-slate-900">{value}</span>
    </div>
  );
}

export default function DarkCarCard({
  name, imageUrl, rating, topBadge, expertComment,
  monthlyCostRange,
  onNegotiate, onDetail, onCompare, isComparing, index = 0,
}: DarkCarCardProps) {
  const costRange = monthlyCostRange || estimateMonthlyCost(name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-400 cursor-pointer ring-1 ring-slate-100 hover:ring-slate-200"
      onClick={onDetail}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-gradient-to-b from-slate-50 to-slate-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-16 h-16 text-slate-200" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />

        {topBadge && (
          <div className="absolute top-3.5 left-3.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-[11px] font-bold text-[#0e6efe] shadow-sm">
              <Star className="w-3 h-3 fill-[#0e6efe] text-[#0e6efe]" />
              Toppval
            </span>
          </div>
        )}

        {rating != null && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full shadow-sm">
            <RatingCircle value={rating} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pt-4 pb-5">
        {/* Name */}
        <h3 className="text-[17px] font-bold text-slate-900 leading-snug group-hover:text-[#0e6efe] transition-colors duration-200">
          {name}
        </h3>

        {/* Expert comment */}
        {expertComment && (
          <p className="mt-1.5 text-[12px] text-slate-400 leading-relaxed line-clamp-2">
            {expertComment}
          </p>
        )}

        {/* Monthly cost */}
        <p className="text-[13px] text-slate-500 mt-4">
          fr. <span className="font-semibold text-slate-800">{costRange}</span> <span className="text-[11px]">kr/mån</span>
        </p>

        {/* Divider + CTA */}
        <div className="h-px bg-slate-100 mt-4 mb-3.5" />

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[14px] font-semibold transition-all duration-200"
        >
          Förhandla
          <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {onCompare && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCompare(); }}
            className={`w-full flex items-center justify-center gap-1.5 py-2 mt-2 rounded-xl text-[12px] font-medium transition-all duration-200 ${
              isComparing
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isComparing ? <Check className="w-3 h-3" /> : <Scale className="w-3 h-3" />}
            {isComparing ? 'Vald' : 'Jämför'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
