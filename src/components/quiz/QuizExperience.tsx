import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, X } from 'lucide-react';
import { QUIZ_QUESTIONS, QuizAnswers, QuizOption } from './QuizTypes';
import { cn } from '@/lib/utils';

interface QuizExperienceProps {
  onComplete: (answers: QuizAnswers) => void;
  onSkip: () => void;
  isAnalyzing?: boolean;
  analysisReady?: boolean;
}

export function QuizExperience({ onComplete, onSkip, isAnalyzing, analysisReady }: QuizExperienceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;
  const isMultiSelect = question.multiSelect || false;

  const getCurrentAnswer = (): string | string[] | undefined => {
    return (answers as Record<string, unknown>)[question.id] as string | string[] | undefined;
  };

  const isOptionSelected = (optionId: string): boolean => {
    const currentAnswer = getCurrentAnswer();
    if (Array.isArray(currentAnswer)) return currentAnswer.includes(optionId);
    return currentAnswer === optionId;
  };

  const handleAnswer = (option: QuizOption) => {
    const key = question.id;
    if (isMultiSelect) {
      const currentValue = ((answers as Record<string, unknown>)[key] as string[]) || [];
      const maxItems = key === 'priorities' ? 3 : undefined;
      let newValue: string[];
      if (currentValue.includes(option.id)) {
        newValue = currentValue.filter(id => id !== option.id);
      } else {
        if (maxItems && currentValue.length >= maxItems) return;
        newValue = [...currentValue, option.id];
      }
      setAnswers({ ...answers, [key]: newValue });
    } else {
      const newAnswers = { ...answers, [key]: option.id };
      setAnswers(newAnswers);
      if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
        setTimeout(() => setCurrentQuestion(currentQuestion + 1), 200);
      } else {
        setTimeout(() => onComplete(newAnswers as QuizAnswers), 200);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  const canProceed = (): boolean => {
    const currentAnswer = getCurrentAnswer();
    if (isMultiSelect) return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    return !!currentAnswer;
  };

  if (question.options.length === 0) {
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentQuestion === 0}
              className="inline-flex items-center gap-1.5 text-[14px] text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka
            </button>

            <div className="flex items-center gap-2">
              {isAnalyzing && (
                <>
                  <Loader2 className="h-3.5 w-3.5 text-[#0e6efe] animate-spin" />
                  <span className="text-[12px] text-[#0e6efe] font-medium">Analyserar...</span>
                </>
              )}
              {analysisReady && (
                <span className="text-[12px] text-emerald-600 font-medium">Klar</span>
              )}
            </div>

            <button
              type="button"
              onClick={onSkip}
              className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Hoppa over
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-2">
            <span>Fråga {currentQuestion + 1} av {QUIZ_QUESTIONS.length}</span>
          </div>
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0e6efe] rounded-xl transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Question content */}
      <main className="flex-1 flex flex-col justify-center px-4 pb-8 pt-6">
        <div className="max-w-lg mx-auto w-full">
          <div className="bg-[#faf8f5] rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-[18px] sm:text-[22px] font-bold text-slate-900 leading-tight mb-2">
              {question.question}
            </h2>
            <p className="text-[13px] text-slate-400 mb-4 sm:mb-5">
              {isMultiSelect
                ? `Välj upp till ${question.id === 'priorities' ? '3' : 'flera'} alternativ`
                : 'Välj det alternativ som passar dig bäst'}
            </p>

            <div className={cn(
              'grid gap-2',
              question.id === 'body_type' ? 'grid-cols-2' : 'grid-cols-1'
            )}>
              {question.options.map((option) => {
                const selected = isOptionSelected(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleAnswer(option)}
                    className={cn(
                      'relative w-full flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl border-2 transition-all duration-150 text-left',
                      question.id === 'body_type' ? 'flex-col items-center justify-center py-3.5 sm:py-4 text-center' : '',
                      selected
                        ? 'border-[#0e6efe] bg-[#faf8f5] shadow-sm'
                        : 'border-slate-200 bg-[#faf8f5] hover:border-slate-300'
                    )}
                  >
                    {isMultiSelect && (
                      <span className={cn(
                        'absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                        selected
                          ? 'border-[#0e6efe] bg-[#0e6efe] text-white'
                          : 'border-slate-300'
                      )}>
                        {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                      </span>
                    )}

                    <span className={cn(
                      'font-medium text-[13px] sm:text-[14px] leading-snug',
                      selected ? 'text-slate-900' : 'text-slate-700'
                    )}>
                      {option.label}
                    </span>

                    {option.description && (
                      <span className="text-[11px] sm:text-[12px] text-slate-400 mt-0.5">{option.description}</span>
                    )}

                    {!isMultiSelect && selected && (
                      <ArrowRight className="w-4 h-4 text-[#0e6efe] ml-auto shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next button for multi-select */}
            {isMultiSelect && (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={cn(
                  'w-full mt-6 py-3.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all',
                  canProceed()
                    ? 'bg-[#0047B3] text-white hover:bg-[#003a94]'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                )}
              >
                {currentQuestion === QUIZ_QUESTIONS.length - 1 ? 'Visa resultat' : 'Nästa'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
