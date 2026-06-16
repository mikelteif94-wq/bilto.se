import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader as Loader2, ArrowRight, Shield, Zap, TrendingDown, Car } from 'lucide-react';
import type { QuizAnswers } from './QuizTypes';

interface QuizCompleteProps {
  answers: QuizAnswers;
  isAnalysisReady: boolean;
  onShowResults: () => void;
}

const STEPS = [
  { text: 'Analyserar preferenser', icon: Search },
  { text: 'Jämför mot marknaden', icon: TrendingDown },
  { text: 'Hittar basta alternativen', icon: Car },
  { text: 'Beräknar prismarginaler', icon: Zap },
];

export function QuizComplete({ answers, isAnalysisReady, onShowResults }: QuizCompleteProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (isAnalysisReady) {
      setActiveStep(STEPS.length);
      return;
    }
    if (activeStep < STEPS.length - 1) {
      const timer = setTimeout(() => setActiveStep(prev => prev + 1), 1200);
      return () => clearTimeout(timer);
    }
  }, [isAnalysisReady, activeStep]);

  const getFocusItems = () => {
    const items: string[] = [];
    if (answers.daily_use === 'family') items.push('Familjevänlighet');
    if (answers.daily_use === 'cargo') items.push('Lastkapacitet');
    if (answers.daily_use === 'solo') items.push('Daglig pendling');
    if (answers.priorities?.includes('safety')) items.push('Säkerhet');
    if (answers.priorities?.includes('economy')) items.push('Låga driftskostnader');
    if (answers.priorities?.includes('comfort')) items.push('Komfort');
    if (answers.fuel_type?.includes('electric')) items.push('Elbilsalternativ');
    if (answers.fuel_type?.includes('hybrid')) items.push('Hybridalternativ');
    if (answers.brand_preference === 'premium') items.push('Premiummärken');
    return items.slice(0, 3);
  };

  const focusItems = getFocusItems();

  return (
    <div className="flex flex-col items-center py-8 px-2">
      <div className="max-w-sm w-full space-y-8">
        {/* Animated icon */}
        <div className="flex justify-center">
          <motion.div
            className="relative w-20 h-20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="absolute inset-0 rounded-full bg-[#0e6efe]/10 animate-pulse" />
            <div className="absolute inset-1 rounded-full bg-[#0e6efe]/10 border border-[#0e6efe]/20 flex items-center justify-center">
              {isAnalysisReady ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Search className="h-8 w-8 text-[#0e6efe]" strokeWidth={2} />
                </motion.div>
              ) : (
                <Loader2 className="h-8 w-8 text-[#0e6efe] animate-spin" />
              )}
            </div>
          </motion.div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <AnimatePresence mode="wait">
            <motion.h2
              key={isAnalysisReady ? 'ready' : 'loading'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-[22px] font-bold text-slate-900"
            >
              {isAnalysisReady ? 'Din analys är klar' : STEPS[Math.min(activeStep, STEPS.length - 1)].text + '...'}
            </motion.h2>
          </AnimatePresence>
          {isAnalysisReady && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-[14px] text-slate-500">
              Vi har matchat bilar baserat på dina önskemål.
            </motion.p>
          )}
        </div>

        {/* Progress steps */}
        <div className="space-y-2.5">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isComplete = idx < activeStep || isAnalysisReady;
            const isActive = idx === activeStep && !isAnalysisReady;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  isComplete ? 'bg-emerald-50 border border-emerald-200' :
                  isActive ? 'bg-slate-50 border border-slate-200' :
                  'bg-slate-50/50 border border-slate-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isComplete ? 'bg-emerald-100 text-emerald-600' :
                  isActive ? 'bg-[#0e6efe]/10 text-[#0e6efe]' :
                  'bg-slate-100 text-slate-300'
                }`}>
                  {isComplete ? (
                    <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <motion.polyline points="20 6 9 17 4 12" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
                    </motion.svg>
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-[13px] font-medium ${
                  isComplete ? 'text-emerald-700' : isActive ? 'text-slate-800' : 'text-slate-400'
                }`}>
                  {step.text}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Focus preview */}
        {isAnalysisReady && focusItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Fokusområden</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {focusItems.map((item, idx) => (
                <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[12px] font-medium text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.button
          type="button"
          onClick={onShowResults}
          disabled={!isAnalysisReady}
          whileHover={isAnalysisReady ? { scale: 1.02 } : {}}
          whileTap={isAnalysisReady ? { scale: 0.98 } : {}}
          className={`w-full py-4 rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2.5 ${
            isAnalysisReady
              ? 'bg-[#0e6efe] text-white shadow-lg shadow-[#0e6efe]/20'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isAnalysisReady ? (
            <>
              Se dina rekommendationer
              <ArrowRight className="h-4.5 w-4.5" />
            </>
          ) : (
            <span>Förbereder...</span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
