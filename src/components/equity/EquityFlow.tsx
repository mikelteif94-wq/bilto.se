import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingDown, ChevronRight, X, Info } from 'lucide-react';
import { EquityQuiz, type EquityData } from './EquityQuiz';
import { EquityResults } from './EquityResults';

type FlowState = 'teaser' | 'quiz' | 'results';

interface EquityFlowProps {
  onNegotiate: (carLabel: string, equitySummary: string) => void;
  /** If provided, shows as a trigger card inline rather than teaser */
  compact?: boolean;
}

function formatSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

function TeaserCard({ onStart }: { onStart: () => void }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden shadow-xl ring-1 ring-white/5">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/20 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-[#0e6efe]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-white leading-snug">
              Vad kan din insats ge dig?
            </p>
            <p className="text-[12px] text-slate-400 mt-0.5 leading-relaxed">
              Beräkna hur mycket du kan spara — och hur lite du faktiskt behöver lägga ner
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInfo(v => !v)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2 text-[12px] text-slate-400 leading-relaxed bg-white/5 rounded-xl px-4 py-3">
                <p>
                  <strong className="text-slate-300">Insats</strong> (inte "kapital") är pengarna du kan
                  använda när du köper nästa bil — antingen från din nuvarande bils nettovärde,
                  sparpengar, eller båda.
                </p>
                <p>
                  Du behöver <strong className="text-slate-300">inte använda allt</strong>. Ofta räcker
                  20 % av bilens pris. Resten av din insats stannar hos dig.
                </p>
                <p>
                  Väljer du en billigare bil kan du dessutom <strong className="text-slate-300">
                  få pengar tillbaka</strong> och sänka månadskostnaden på köpet.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Benefits */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { icon: TrendingDown, label: 'Sänk månadskostnaden' },
            { icon: Wallet, label: 'Frigör kapital' },
            { icon: ChevronRight, label: 'Hitta rätt bil' },
          ].map(b => (
            <div key={b.label} className="flex flex-col items-center gap-1.5 bg-white/5 rounded-xl px-2 py-3 text-center">
              <b.icon className="w-4 h-4 text-[#0e6efe]" />
              <span className="text-[10px] text-slate-400 leading-tight font-medium">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={onStart}
          className="w-full h-11 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white text-[14px] font-bold transition-all duration-200 flex items-center justify-center gap-2"
        >
          Beräkna min insats
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function EquityFlow({ onNegotiate, compact }: EquityFlowProps) {
  const [state, setState] = useState<FlowState>('teaser');
  const [equityData, setEquityData] = useState<EquityData | null>(null);

  const handleQuizComplete = (data: EquityData) => {
    setEquityData(data);
    setState('results');
  };

  if (compact && state === 'teaser') {
    return (
      <button
        type="button"
        onClick={() => setState('quiz')}
        className="w-full flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl px-4 py-3 transition-all duration-200 group text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-[13px] font-bold text-white">
            Beräkna vad din insats ger dig
          </p>
          <p className="text-[11px] text-white/75">Sänk månadskostnaden · Frigör kapital</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/75 group-hover:text-white transition-colors" />
      </button>
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
        >
          {/* Header with summary */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[14px] font-bold text-slate-800">Din insats: {formatSEK(equityData.equity)} kr</p>
              <p className="text-[12px] text-slate-400">Bilar matchade mot {formatSEK(equityData.desiredMonthly)} kr/mån</p>
            </div>
            <button
              type="button"
              onClick={() => setState('teaser')}
              className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Stäng
            </button>
          </div>
          <EquityResults
            equity={equityData}
            onReset={() => setState('quiz')}
            onNegotiate={onNegotiate}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
