import { useState } from 'react';
import { Star, Car, Check, ChevronRight, SlidersHorizontal, Sparkles, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { calcCarMonthlyRange } from '../lib/utils';
import { CalcPanel } from './CalcPanel';

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


export default function CompactCarCard({
  name, imageUrl, rating, topBadge, expertComment,
  fuelLabel, carPrice, usedPrice, monthlySaving, equityFreed,
  isSelected, isCompared,
  onSelect, onCompare, onNegotiate, onDetail, onFitQuiz,
}: CompactCarCardProps) {
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;
  const [toolsOpen, setToolsOpen] = useState(false);
  const [panel, setPanel] = useState<null | 'calc' | 'fit'>(null);

  const handleCardClick = () => {
    if (onSelect) { onSelect(); return; }
    if (onDetail) { onDetail(); return; }
  };

  const toggleTools = (e: React.MouseEvent) => {
    e.stopPropagation();
    setToolsOpen(v => !v);
    if (toolsOpen) setPanel(null);
  };

  const openPanel = (p: 'calc' | 'fit', e: React.MouseEvent) => {
    e.stopPropagation();
    setPanel(prev => prev === p ? null : p);
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl transition-all duration-300 ${
        isSelected
          ? 'ring-2 ring-[#0e6efe] shadow-[0_0_0_4px_rgba(14,110,254,0.10)]'
          : isCompared
          ? 'ring-2 ring-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]'
          : 'ring-1 ring-slate-100 hover:ring-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.11)]'
      }`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Clickable card area (image + info) */}
      <div
        className="cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] sm:aspect-[16/9] bg-white overflow-hidden rounded-t-2xl">
          {imageUrl ? (
            <img
              src={imageUrl} alt={name} loading="lazy"
              className="w-full h-full object-contain p-3 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Car className="w-10 h-10 text-slate-200" /></div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />

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

        {/* Static text info */}
        <div className="px-3.5 pt-3 pb-2">
          <h3 className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 leading-snug truncate group-hover:text-[#0e6efe] transition-colors duration-200">
            {name}
          </h3>
          {fuelLabel && <p className="mt-0.5 text-[10px] text-slate-400 truncate">{fuelLabel}</p>}
          {expertComment && (
            <p className="hidden sm:block mt-0.5 text-[11px] text-slate-400 leading-snug line-clamp-1">{expertComment}</p>
          )}
          {range && (
            <div className="mt-2 flex items-baseline gap-1 min-w-0">
              <span className="text-[15px] font-extrabold text-[#0e6efe] tabular-nums leading-none whitespace-nowrap">
                {formatSEK(range.low)}–{formatSEK(range.high)}
              </span>
              <span className="text-[10px] font-semibold text-[#0e6efe]/60 shrink-0">kr/mån</span>
            </div>
          )}
          {monthlySaving != null && monthlySaving > 0 && (
            <p className="mt-1 text-[10.5px] font-semibold text-emerald-600">Du sparar {formatSEK(monthlySaving)} kr/mån</p>
          )}
          {equityFreed != null && equityFreed > 0 && (
            <p className="mt-1 text-[10.5px] font-semibold text-emerald-600">+{formatSEK(equityFreed)} kr frigörs vid byte</p>
          )}
        </div>
      </div>

      {/* Action area — not part of card click */}
      {!onSelect && (
        <div className="px-3.5 pb-3.5 space-y-1.5">
          {/* Primary CTA */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
            className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[12.5px] font-bold transition-all duration-150 shadow-sm shadow-[#0e6efe]/20"
          >
            Få hjälp att köpa <ChevronRight className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Tools toggle — dropdown trigger */}
          {(carPrice || onFitQuiz) && (
            <button
              type="button"
              onClick={toggleTools}
              className={`w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border text-[11px] font-medium transition-all duration-150 active:scale-[0.98] ${
                toolsOpen
                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                  : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300'
              }`}
            >
              {toolsOpen
                ? <><ChevronUp className="w-3 h-3" />Stäng</>
                : <><ChevronDown className="w-3 h-3" />Kalkyl &amp; passar bilen mig?</>
              }
            </button>
          )}

          {/* Expandable tools panel */}
          <AnimatePresence initial={false}>
            {toolsOpen && (
              <motion.div
                key="tools"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pt-1 space-y-1.5">
                  {/* Two tool CTA buttons */}
                  <div className="flex gap-2">
                    {carPrice && (
                      <button
                        type="button"
                        onClick={(e) => openPanel('calc', e)}
                        className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-[11.5px] font-semibold transition-all duration-150 active:scale-[0.98] ${
                          panel === 'calc'
                            ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-[#0e6efe] hover:text-[#0e6efe]'
                        }`}
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        Kalkyl
                      </button>
                    )}
                    {onFitQuiz && (
                      <button
                        type="button"
                        onClick={(e) => openPanel('fit', e)}
                        className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-[11.5px] font-semibold transition-all duration-150 active:scale-[0.98] ${
                          panel === 'fit'
                            ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-[#0e6efe] hover:text-[#0e6efe]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Passar bilen mig?
                      </button>
                    )}
                  </div>

                  {/* Panel content */}
                  <AnimatePresence initial={false}>
                    {panel === 'calc' && carPrice && (
                      <motion.div
                        key="calc"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <CalcPanel carPrice={carPrice} usedPrice={usedPrice} />
                      </motion.div>
                    )}
                    {panel === 'fit' && onFitQuiz && (
                      <motion.div
                        key="fit"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                          <p className="text-[12px] font-semibold text-slate-800 mb-1">Passar {name} dig?</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                            Svara på några korta frågor — vi jämför bilen mot dina behov, familj, pendling och budget.
                          </p>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onFitQuiz(); }}
                            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[12px] font-bold transition-all duration-150 shadow-sm shadow-[#0e6efe]/20"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Starta matchning
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Compare */}
                  {onCompare && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onCompare(); }}
                      className={`w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border text-[11px] font-medium transition-all duration-150 active:scale-[0.98] ${
                        isCompared
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
                      }`}
                    >
                      {isCompared ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <SlidersHorizontal className="w-3 h-3" />}
                      {isCompared ? 'Tillagd i jämförelse' : 'Lägg till i jämförelse'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
