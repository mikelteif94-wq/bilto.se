import { useState } from 'react';
import { Star, Car, ChevronRight, Check, SlidersHorizontal, HelpCircle, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { calcCarMonthlyRange } from '../lib/utils';
import FinancingToggle from './FinancingToggle';

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
      className="absolute top-3 right-3 flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-md"
      style={{ border: `2.5px solid ${color}` }}
    >
      <span className="text-[13px] font-extrabold leading-none" style={{ color }}>{value}</span>
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
  onNegotiate, onDetail, onCompare, isComparing, onFitQuiz, index = 0,
}: DarkCarCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.07)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.13)] transition-all duration-300 cursor-pointer ring-1 ring-slate-100 hover:ring-slate-200"
      style={{ touchAction: 'pan-y' }}
      onClick={onDetail}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-gradient-to-b from-slate-50 to-[#eef3f8] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="w-full h-full object-contain p-3 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-16 h-16 text-slate-200" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#eef3f8]/80 to-transparent pointer-events-none" />

        {topBadge && (
          <div className="absolute top-3.5 left-3.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-[11px] font-bold text-[#0e6efe] shadow-sm">
              <Star className="w-3 h-3 fill-[#0e6efe] text-[#0e6efe]" />Toppval
            </span>
          </div>
        )}
        {rating != null && <ScoreBadge value={rating} />}
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-4">
        <h3 className="text-[16px] font-bold text-slate-900 leading-snug group-hover:text-[#0e6efe] transition-colors duration-200">
          {name}
        </h3>
        {expertComment && (
          <p className="mt-0.5 text-[12px] text-slate-400 leading-relaxed line-clamp-1">{expertComment}</p>
        )}

        {range && (
          <div className="mt-2.5 mb-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Ca månadskostnad</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[18px] font-extrabold text-slate-900 tabular-nums leading-none">
                    {formatSEK(range.low)}–{formatSEK(range.high)}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">kr/mån</span>
                </div>
              </div>
              <div className="relative self-end pb-0.5">
                <button
                  type="button"
                  onClick={() => setShowInfo(s => !s)}
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

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[13.5px] font-bold transition-all duration-200 shadow-sm shadow-[#0e6efe]/20"
        >
          Få hjälp att köpa <ChevronRight className="w-4 h-4 opacity-80" />
        </button>

        <div className="flex gap-2 mt-1.5">
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
              title={isComparing ? 'Ta bort från jämförelse' : 'Jämför'}
              className={`flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl border text-[11px] font-medium transition-all duration-150 active:scale-[0.98] ${
                isComparing
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {isComparing ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <SlidersHorizontal className="w-3.5 h-3.5" />}
              {isComparing ? 'Vald' : 'Jämför'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
