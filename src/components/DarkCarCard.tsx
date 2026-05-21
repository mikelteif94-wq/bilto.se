import { useState } from 'react';
import { Star, Car, ArrowRight, Check, Scale, HelpCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
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
  onCompare?: () => void;
  isComparing?: boolean;
  index?: number;
}

function formatSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
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
        <motion.circle cx="24" cy="24" r={radius} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
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

export default function DarkCarCard({
  name, imageUrl, rating, topBadge, expertComment,
  carPrice, usedPrice,
  onNegotiate, onDetail, onCompare, isComparing, index = 0,
}: DarkCarCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-400 cursor-pointer ring-1 ring-slate-100 hover:ring-slate-200"
      style={{ touchAction: 'pan-y' }}
      onClick={onDetail}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-gradient-to-b from-slate-50 to-slate-100 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Car className="w-16 h-16 text-slate-200" /></div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
        {topBadge && (
          <div className="absolute top-3.5 left-3.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-[11px] font-bold text-[#0e6efe] shadow-sm">
              <Star className="w-3 h-3 fill-[#0e6efe] text-[#0e6efe]" />Toppval
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
        <h3 className="text-[17px] font-bold text-slate-900 leading-snug group-hover:text-[#0e6efe] transition-colors duration-200">{name}</h3>
        {expertComment && (
          <p className="mt-1.5 text-[12px] text-slate-400 leading-relaxed line-clamp-2">{expertComment}</p>
        )}

        {/* Monthly range */}
        {range && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">Ca månadskostnad</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[15px] font-bold text-slate-800 tabular-nums whitespace-nowrap">
                    {formatSEK(range.low)}–{formatSEK(range.high)}
                  </span>
                  <span className="text-[11px] text-slate-500">kr/mån</span>
                </div>
              </div>
              <div className="relative self-end pb-0.5">
                <button type="button" onClick={() => setShowInfo(s => !s)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                {showInfo && <InfoTooltip onClose={() => setShowInfo(false)} />}
              </div>
            </div>
          </div>
        )}

        <div className="h-px bg-slate-100 mt-4 mb-3.5" />

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[14px] font-semibold transition-all duration-200"
        >
          Förhandla<ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {onCompare && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCompare(); }}
            className={`w-full flex items-center justify-center gap-1.5 py-2 mt-2 rounded-xl text-[12px] font-medium transition-all duration-200 ${
              isComparing ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
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
