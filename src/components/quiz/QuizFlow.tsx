import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { QuizAnswers, QUIZ_QUESTIONS, QuizOption, MONTHLY_BUDGET_OPTIONS, CASH_BUDGET_OPTIONS } from './QuizTypes';

interface QuizFlowProps {
  onComplete: (answers: QuizAnswers) => void;
  onBack?: () => void;
}

export default function QuizFlow({ onComplete, onBack }: QuizFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;
  const isLastStep = currentStep === QUIZ_QUESTIONS.length - 1;
  const isBudgetQuestion = currentQuestion.id === 'budget';

  const getCurrentAnswer = (): string | string[] | undefined => {
    const value = (answers as Record<string, unknown>)[currentQuestion.id];
    return value as string | string[] | undefined;
  };

  const handleOptionSelect = (optionId: string) => {
    const key = currentQuestion.id;
    if (currentQuestion.multiSelect) {
      const currentValue = ((answers as Record<string, unknown>)[key] as string[]) || [];
      const maxItems = key === 'priorities' ? 3 : undefined;
      let newValue: string[];
      if (currentValue.includes(optionId)) {
        newValue = currentValue.filter(id => id !== optionId);
      } else {
        if (maxItems && currentValue.length >= maxItems) return;
        newValue = [...currentValue, optionId];
      }
      setAnswers({ ...answers, [key]: newValue });
    } else {
      const updatedAnswers = { ...answers, [key]: optionId };
      setAnswers(updatedAnswers);
      if (isLastStep) {
        setTimeout(() => onComplete(updatedAnswers), 200);
      } else {
        setTimeout(() => setCurrentStep(currentStep + 1), 200);
      }
    }
  };

  const handleNext = () => {
    if (isLastStep) onComplete(answers);
    else setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const isOptionSelected = (optionId: string): boolean => {
    const currentAnswer = getCurrentAnswer();
    if (Array.isArray(currentAnswer)) return currentAnswer.includes(optionId);
    return currentAnswer === optionId;
  };

  const canProceed = (): boolean => {
    if (isBudgetQuestion) return true;
    const currentAnswer = getCurrentAnswer();
    if (currentQuestion.multiSelect) return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    return !!currentAnswer;
  };

  return (
    <div className="flex flex-col min-h-0 w-full">
      {currentStep > 0 && (
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-[14px] text-slate-500 hover:text-slate-800 transition-colors mb-4 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>
      )}

      {/* Step counter */}
      <p className="text-[14px] text-slate-500 mb-2">
        Fråga {currentStep + 1} av {QUIZ_QUESTIONS.length}
      </p>

      {/* Progress bar */}
      <div className="relative h-1 bg-slate-200 rounded-full overflow-hidden mb-8">
        <div
          className="absolute inset-y-0 left-0 bg-[#0047B3] rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div key={currentStep}>
        <h2 className="text-[22px] sm:text-[26px] font-bold text-slate-900 leading-tight mb-2">
          {currentQuestion.question}
        </h2>
        <p className="text-[14px] text-slate-500 mb-6">
          Välj det alternativ som passar dig bäst
        </p>

        {/* Options */}
        {isBudgetQuestion ? (
          <BudgetSelector answers={answers} setAnswers={setAnswers} />
        ) : (
          <div className={cn(
            'grid gap-3',
            currentQuestion.id === 'body_type' ? 'grid-cols-2' : 'grid-cols-1'
          )}>
            {currentQuestion.options.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                questionId={currentQuestion.id}
                isSelected={isOptionSelected(option.id)}
                isMultiSelect={currentQuestion.multiSelect || false}
                onClick={() => handleOptionSelect(option.id)}
              />
            ))}
          </div>
        )}

        {/* Next button for multi-select and budget */}
        {(currentQuestion.multiSelect || isBudgetQuestion) && (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() && !isBudgetQuestion}
            className={cn(
              'w-full mt-8 py-3.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all',
              canProceed() || isBudgetQuestion
                ? 'bg-[#0047B3] text-white hover:bg-[#003a94] active:scale-[0.98]'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            )}
          >
            {isLastStep ? 'Visa resultat' : 'Nästa'}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function BudgetSelector({ answers, setAnswers }: { answers: QuizAnswers; setAnswers: (a: QuizAnswers) => void }) {
  const budgetType = answers.budget_type || 'monthly';
  const options = budgetType === 'monthly' ? MONTHLY_BUDGET_OPTIONS : CASH_BUDGET_OPTIONS;

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-full bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setAnswers({ ...answers, budget_type: 'monthly', budget_min: undefined, budget_max: undefined })}
          className={cn(
            'px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200',
            budgetType === 'monthly'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          Månadsbetalning
        </button>
        <button
          type="button"
          onClick={() => setAnswers({ ...answers, budget_type: 'cash', budget_min: undefined, budget_max: undefined })}
          className={cn(
            'px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200',
            budgetType === 'cash'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          Kontant
        </button>
      </div>

      <div className="flex gap-4">
        <div className="space-y-1.5 flex-1">
          <label className="text-[12px] font-medium text-slate-500">Från</label>
          <Select
            value={answers.budget_min?.toString() || '0'}
            onValueChange={(val) => setAnswers({ ...answers, budget_min: parseInt(val) })}
          >
            <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 bg-white text-[14px] text-slate-900">
              <SelectValue placeholder="Alla" />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex-1">
          <label className="text-[12px] font-medium text-slate-500">Till</label>
          <Select
            value={answers.budget_max?.toString() || '0'}
            onValueChange={(val) => setAnswers({ ...answers, budget_max: parseInt(val) })}
          >
            <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 bg-white text-[14px] text-slate-900">
              <SelectValue placeholder="Alla" />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function OptionCard({ option, questionId, isSelected, isMultiSelect, onClick }: {
  option: QuizOption;
  questionId: string;
  isSelected: boolean;
  isMultiSelect: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all duration-150 text-left',
        questionId === 'body_type' ? 'flex-col items-center justify-center py-5 text-center' : '',
        isSelected
          ? 'border-[#0e6efe] bg-white shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      )}
    >
      {isMultiSelect && (
        <span className={cn(
          'absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
          isSelected
            ? 'border-[#0e6efe] bg-[#0e6efe] text-white'
            : 'border-slate-300'
        )}>
          {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
        </span>
      )}

      <span className={cn(
        'font-medium text-[15px] leading-snug transition-colors',
        isSelected ? 'text-slate-900' : 'text-slate-700'
      )}>
        {option.label}
      </span>

      {!isMultiSelect && isSelected && (
        <ArrowRight className="w-4 h-4 text-[#0047B3] ml-auto shrink-0" />
      )}
    </button>
  );
}
