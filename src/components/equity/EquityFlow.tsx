import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingDown, ChevronRight, Sparkles, ArrowRight, BadgeDollarSign } from 'lucide-react';
import { EquityQuiz, type EquityData } from './EquityQuiz';
import { EquityResults } from './EquityResults';

type FlowState = 'teaser' | 'quiz' | 'results';

interface EquityFlowProps {
  onNegotiate: (carLabel: string, equitySummary: string) => void;
  compact?: boolean;
  isEv?: boolean;
}

function TeaserCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
      {/* Header strip */}
      <div className="bg-gradient-to-r from-[#0e6efe] to-[#2a7fff] px-5 pt-5 pb-10">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p className="text-white font-black text-[17px] leading-snug">
              Beräkna vad din insats ger dig
            </p>
            <p className="text-white/75 text-[12.5px] mt-1 leading-relaxed">
              Se hur mycket du kan sänka månadskostnaden — och hur lite du faktiskt behöver betala
            </p>
          </div>
        </div>
      </div>

      {/* Floating benefit cards */}
      <div className="px-4 -mt-6 mb-4">
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 divide-y divide-slate-50">
          {[
            { icon: TrendingDown, color: '#16a34a', bg: '#f0fdf4', label: 'Sänk månadskostnaden', sub: 'Många sparar 1 500–3 000 kr/mån' },
            { icon: Wallet, color: '#0e6efe', bg: '#eff6ff', label: 'Frigör kapital', sub: 'Pengar du kan använda till annat' },
            { icon: BadgeDollarSign, color: '#d97706', bg: '#fffbeb', label: 'Hitta rätt bil för din ekonomi', sub: 'Personliga bilrekommendationer' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: b.bg }}>
                <b.icon className="w-4 h-4" style={{ color: b.color }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800 leading-tight">{b.label}</p>
                <p className="text-[11px] text-slate-400">{b.sub}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-5">
        <motion.button
          type="button"
          onClick={onStart}
          whileTap={{ scale: 0.97 }}
          className="w-full h-12 rounded-2xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[14px] font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          style={{ boxShadow: '0 4px 18px #0e6efe40' }}
        >
          Beräkna min insats
          <ChevronRight className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
        </motion.button>
        <p className="text-center text-[11px] text-slate-400 mt-2.5">Tar 2 minuter · Helt gratis</p>
      </div>
    </div>
  );
}

export function EquityFlow({ onNegotiate: _onNegotiate, compact, isEv }: EquityFlowProps) {
  const [state, setState] = useState<FlowState>('teaser');
  const [equityData, setEquityData] = useState<EquityData | null>(null);

  const handleQuizComplete = (data: EquityData) => {
    setEquityData(data);
    setState('results');
  };

  if (compact && state === 'teaser') {
    return (
      <motion.button
        type="button"
        onClick={() => setState('quiz')}
        whileTap={{ scale: 0.97 }}
        className="w-full flex items-center gap-3 bg-white hover:bg-blue-50 border-2 border-[#0e6efe] rounded-2xl px-4 py-3.5 transition-all duration-200 group text-left shadow-sm"
        style={{ boxShadow: '0 4px 14px #0e6efe18' }}
      >
        <div className="w-9 h-9 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-[#0e6efe]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[#0e6efe]">Beräkna vad din insats ger dig</p>
          <p className="text-[11px] text-[#0e6efe]/60">
            {isEv ? 'Sänk kostnaden · Byt till elbil' : 'Sänk månadskostnaden · Frigör kapital'}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-[#0e6efe]/50 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state === 'teaser' && (
        <motion.div key="teaser" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <TeaserCard onStart={() => setState('quiz')} />
        </motion.div>
      )}

      {state === 'quiz' && (
        <motion.div
          key="quiz"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          <EquityQuiz
            onComplete={handleQuizComplete}
            onClose={() => setState('teaser')}
          />
        </motion.div>
      )}

      {state === 'results' && equityData && (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          <EquityResults
            equity={equityData}
            onReset={() => setState('quiz')}
            onNegotiate={(carLabel, equitySummary) => _onNegotiate(carLabel, equitySummary ?? '')}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
