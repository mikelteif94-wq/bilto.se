import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { QuizAnswers } from './QuizTypes';

interface QuizCompleteProps {
  answers: QuizAnswers;
  isAnalysisReady: boolean;
  onShowResults: () => void;
}

export function QuizComplete({ answers: _answers, isAnalysisReady, onShowResults }: QuizCompleteProps) {
  useEffect(() => {
    if (isAnalysisReady) {
      const t = setTimeout(onShowResults, 600);
      return () => clearTimeout(t);
    }
  }, [isAnalysisReady, onShowResults]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="relative w-16 h-16 mb-6">
        {/* Outer spinning ring */}
        <svg className="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="4" />
          <circle cx="32" cy="32" r="28" stroke="#0e6efe" strokeWidth="4"
            strokeLinecap="round" strokeDasharray="44 132" />
        </svg>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#0e6efe]" />
        </div>
      </div>

      <motion.p
        key={isAnalysisReady ? 'ready' : 'loading'}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[17px] font-bold text-slate-900"
      >
        {isAnalysisReady ? 'Klar!' : 'Analyserar...'}
      </motion.p>
      <p className="text-[13px] text-slate-400 mt-1.5">
        {isAnalysisReady ? 'Visar dina rekommendationer' : 'Hittar bilar som passar dig'}
      </p>

      {isAnalysisReady && (
        <motion.button
          type="button"
          onClick={onShowResults}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#0e6efe] text-white font-bold text-[15px] shadow-lg shadow-[#0e6efe]/25 active:scale-[0.98] transition-transform"
        >
          Se rekommendationer <ArrowRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}
