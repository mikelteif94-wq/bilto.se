import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuizAnswers, MONTHLY_BUDGET_OPTIONS, CASH_BUDGET_OPTIONS } from './QuizTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuizFlowProps {
  onComplete: (answers: QuizAnswers) => void;
  onBack?: () => void;
  preselectedCar?: string;
}

const SUGGESTION_CHIPS = [
  { label: 'Familj med hund', text: 'Vi är en familj med hund och behöver stor bagageutrymme' },
  { label: 'Elbil till pendling', text: 'Elbil för daglig pendling, bra räckvidd' },
  { label: 'Sportig men praktisk', text: 'Sportig kombi eller SUV, kul att köra' },
  { label: 'Billig och pålitlig', text: 'Billig och pålitlig bil, låga driftskostnader' },
  { label: 'Liten stadsbil', text: 'Liten kompakt stadsbil, smidig att parkera' },
  { label: 'Premium SUV', text: 'Premium SUV, rymlig och bekväm' },
];

export default function QuizFlow({ onComplete, onBack }: QuizFlowProps) {
  const [step, setStep] = useState<'text' | 'budget'>('text');
  const [freeText, setFreeText] = useState('');
  const [budgetType, setBudgetType] = useState<'monthly' | 'cash'>('monthly');
  const [budgetMax, setBudgetMax] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (step === 'text') textareaRef.current?.focus();
  }, [step]);

  const handleChip = (text: string) => {
    setFreeText(text);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleTextNext = () => {
    if (!freeText.trim()) return;
    setStep('budget');
  };

  const handleComplete = () => {
    const answers: QuizAnswers = {
      freeText: freeText.trim(),
      budget_type: budgetType,
      budget_max: budgetMax || undefined,
    };
    onComplete(answers);
  };

  if (step === 'budget') {
    const options = budgetType === 'monthly' ? MONTHLY_BUDGET_OPTIONS : CASH_BUDGET_OPTIONS;
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => setStep('text')}
          className="self-start text-[13px] text-white/70 hover:text-white flex items-center gap-1 transition-colors"
        >
          ← Tillbaka
        </button>

        <div>
          <h2 className="text-[22px] sm:text-[26px] font-bold text-white leading-tight mb-1">
            Vad är din budget?
          </h2>
          <p className="text-white/70 text-[14px]">Frivilligt — vi hittar rätt oavsett</p>
        </div>

        <div className="inline-flex rounded-full bg-white/10 p-1 self-start">
          <button
            type="button"
            onClick={() => setBudgetType('monthly')}
            className={cn(
              'px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200',
              budgetType === 'monthly' ? 'bg-white text-[#0e6efe] shadow-sm' : 'text-white/80 hover:text-white'
            )}
          >
            Per månad
          </button>
          <button
            type="button"
            onClick={() => setBudgetType('cash')}
            className={cn(
              'px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200',
              budgetType === 'cash' ? 'bg-white text-[#0e6efe] shadow-sm' : 'text-white/80 hover:text-white'
            )}
          >
            Kontant
          </button>
        </div>

        <Select
          value={budgetMax.toString()}
          onValueChange={(v) => setBudgetMax(parseInt(v))}
        >
          <SelectTrigger className="w-full h-12 rounded-xl border-white/20 bg-white/10 text-white text-[14px] placeholder:text-white/50">
            <SelectValue placeholder="Välj max budget" />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={handleComplete}
          className="w-full h-14 rounded-2xl bg-white text-[#0e6efe] font-bold text-[16px] flex items-center justify-center gap-2 group hover:bg-slate-50 transition-all shadow-xl active:scale-[0.98]"
        >
          Hitta min bilmatch
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="self-start text-[13px] text-white/70 hover:text-white flex items-center gap-1 transition-colors"
        >
          ← Tillbaka
        </button>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-white/80" strokeWidth={2} />
          <span className="text-[13px] font-semibold text-white/70 uppercase tracking-wider">Bilmatch</span>
        </div>
        <h2 className="text-[22px] sm:text-[28px] font-bold text-white leading-tight">
          Beskriv din drömtil med egna ord
        </h2>
        <p className="text-white/70 text-[14px] mt-1">
          Skriv vad som är viktigt — storlek, användning, budget, hund, familj, pendling...
        </p>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleTextNext(); }}
          placeholder="T.ex. &quot;Vi är en familj med två barn och en stor hund. Behöver mycket bagageutrymme, gärna elbil eller hybrid. Budget runt 4 000 kr/mån.&quot;"
          rows={4}
          className="w-full rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-[15px] px-4 py-3.5 resize-none focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
        />
        {freeText && (
          <span className="absolute bottom-3 right-3 text-[11px] text-white/30 select-none">⌘↵ för att gå vidare</span>
        )}
      </div>

      <div>
        <p className="text-[12px] text-white/50 mb-2 font-medium">Snabbval:</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTION_CHIPS.map(chip => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleChip(chip.text)}
              className={cn(
                'px-3 py-1.5 rounded-full border text-[12.5px] font-medium transition-all',
                freeText === chip.text
                  ? 'bg-white text-[#0e6efe] border-white'
                  : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:border-white/40'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleTextNext}
        disabled={!freeText.trim()}
        className={cn(
          'w-full h-14 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 group transition-all shadow-xl active:scale-[0.98]',
          freeText.trim()
            ? 'bg-white text-[#0e6efe] hover:bg-slate-50'
            : 'bg-white/20 text-white/50 cursor-not-allowed'
        )}
      >
        Nästa
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
