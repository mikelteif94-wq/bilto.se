import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Car, Wallet, TrendingDown, ArrowRight, Info, X } from 'lucide-react';

export interface EquityData {
  hasCurrentCar: boolean;
  carValue: number;
  carDebt: number;
  cashSavings: number;
  currentMonthly: number;
  desiredMonthly: number;
  equity: number;
}

interface EquityQuizProps {
  onComplete: (data: EquityData) => void;
  onClose: () => void;
}

const STEP_COUNT = 5;

function formatSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n) + ' kr';
}

function CustomSlider({
  value, min, max, step, onChange,
}: {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pct = ((value - min) / (max - min)) * 100;

  const valueFromX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    return Math.round(raw / step) * step;
  }, [min, max, step, value]);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    onChange(valueFromX(e.clientX));
    const onMove = (ev: MouseEvent) => { if (dragging.current) onChange(valueFromX(ev.clientX)); };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    dragging.current = true;
    onChange(valueFromX(e.touches[0].clientX));
    const onMove = (ev: TouchEvent) => {
      ev.preventDefault();
      if (dragging.current) onChange(valueFromX(ev.touches[0].clientX));
    };
    const onEnd = () => { dragging.current = false; window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  return (
    <div
      ref={trackRef}
      className="relative h-10 flex items-center cursor-pointer select-none"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Track */}
      <div className="absolute inset-x-0 h-2 rounded-full bg-slate-200">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[#0e6efe]"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Thumb */}
      <div
        className="absolute w-6 h-6 rounded-full bg-white border-2 border-[#0e6efe] shadow-md -translate-x-1/2 transition-shadow active:shadow-lg"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

function SliderStep({
  label, sublabel, value, min, max, step, onChange, formatValue, note,
}: {
  label: string; sublabel?: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; formatValue: (v: number) => string; note?: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[15px] font-semibold text-slate-800">{label}</p>
        {sublabel && <p className="text-[13px] text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
      <div className="text-center py-3">
        <span className="text-[32px] font-bold text-slate-900 tabular-nums">{formatValue(value)}</span>
      </div>
      <div className="relative px-1">
        <CustomSlider value={value} min={min} max={max} step={step} onChange={onChange} />
        <div className="flex justify-between mt-1 text-[11px] text-slate-400">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      </div>
      {note && (
        <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-[#0e6efe] shrink-0 mt-0.5" />
          <p className="text-[12px] text-slate-600 leading-relaxed">{note}</p>
        </div>
      )}
    </div>
  );
}

export function EquityQuiz({ onComplete, onClose }: EquityQuizProps) {
  const [step, setStep] = useState(0);
  const [hasCurrentCar, setHasCurrentCar] = useState<boolean | null>(null);
  const [carValue, setCarValue] = useState(100000);
  const [carDebt, setCarDebt] = useState(0);
  const [cashSavings, setCashSavings] = useState(0);
  const [currentMonthly, setCurrentMonthly] = useState(3000);
  const [desiredMonthly, setDesiredMonthly] = useState(3000);

  const equity = Math.max(0, (hasCurrentCar ? carValue - carDebt : 0) + cashSavings);

  const canContinue = () => {
    if (step === 0) return hasCurrentCar !== null;
    return true;
  };

  const next = () => {
    if (step === 0 && hasCurrentCar === false) {
      // Skip car value + debt steps
      setStep(3);
      return;
    }
    if (step < STEP_COUNT - 1) setStep(s => s + 1);
    else finish();
  };

  const back = () => {
    if (step === 3 && hasCurrentCar === false) {
      setStep(0);
      return;
    }
    if (step > 0) setStep(s => s - 1);
  };

  const finish = () => {
    onComplete({
      hasCurrentCar: hasCurrentCar ?? false,
      carValue: hasCurrentCar ? carValue : 0,
      carDebt: hasCurrentCar ? carDebt : 0,
      cashSavings,
      currentMonthly: hasCurrentCar ? currentMonthly : 0,
      desiredMonthly,
      equity,
    });
  };

  const effectiveStep = step;

  return (
    <div className="relative bg-white rounded-2xl shadow-2xl ring-1 ring-slate-100 overflow-hidden max-w-md w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0e6efe]/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[#0e6efe]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-800">Din insats</p>
            <p className="text-[11px] text-slate-400">Beräkna vad du kan spara</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === effectiveStep
                    ? 'w-5 h-2 bg-[#0e6efe]'
                    : i < effectiveStep
                    ? 'w-2 h-2 bg-[#0e6efe]/40'
                    : 'w-2 h-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="px-5 py-6 min-h-[320px] flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {/* Step 0: Har du bil? */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[15px] font-semibold text-slate-800">Har du en bil idag?</p>
                  <p className="text-[13px] text-slate-400 mt-0.5">Din nuvarande bil kan vara en del av din insats</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: true, label: 'Ja, jag har en bil', icon: Car, desc: 'Inbytesvärde räknas in' },
                    { val: false, label: 'Nej, inte just nu', icon: Wallet, desc: 'Kontantinsats' },
                  ].map(opt => (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => setHasCurrentCar(opt.val)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                        hasCurrentCar === opt.val
                          ? 'border-[#0e6efe] bg-blue-50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <opt.icon className={`w-6 h-6 ${hasCurrentCar === opt.val ? 'text-[#0e6efe]' : 'text-slate-400'}`} />
                      <span className={`text-[13px] font-semibold leading-tight ${hasCurrentCar === opt.val ? 'text-[#0e6efe]' : 'text-slate-700'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-slate-400">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Bilens värde */}
            {step === 1 && (
              <SliderStep
                label="Vad är din bil värd ungefär?"
                sublabel="Ange marknadsvärdet — du kan slå upp det på Blocket eller Kvdbil"
                value={carValue}
                min={20000}
                max={600000}
                step={5000}
                onChange={setCarValue}
                formatValue={v => formatSEK(v)}
                note="Vet du inte exakt? Uppskatta lite generöst — vi justerar efteråt."
              />
            )}

            {/* Step 2: Kvarvarande skuld */}
            {step === 2 && (
              <SliderStep
                label="Hur mycket skuld har du kvar på bilen?"
                sublabel="Det som är kvar att betala till banken eller leasingbolaget"
                value={carDebt}
                min={0}
                max={Math.max(carValue, 300000)}
                step={5000}
                onChange={setCarDebt}
                formatValue={v => v === 0 ? 'Ingen skuld' : formatSEK(v)}
                note={`Ditt nuvarande nettovärde (equity): ${formatSEK(Math.max(0, carValue - carDebt))}. Det är det du kan ta med dig till nästa bil.`}
              />
            )}

            {/* Step 3: Kontantbesparing */}
            {step === 3 && (
              <SliderStep
                label="Har du extra kontanter till insatsen?"
                sublabel="Pengar utöver din nuvarande bil — helt valfritt"
                value={cashSavings}
                min={0}
                max={500000}
                step={5000}
                onChange={setCashSavings}
                formatValue={v => v === 0 ? 'Inga extra pengar' : formatSEK(v)}
                note="Du behöver inte använda alla dina sparpengar. Vi visar dig hur lite du faktiskt behöver."
              />
            )}

            {/* Step 4: Önskad månadskostad */}
            {step === 4 && (
              <div className="space-y-5">
                {hasCurrentCar && (
                  <SliderStep
                    label="Vad betalar du idag per månad?"
                    sublabel="Leasing, billån eller annan månadskostnad"
                    value={currentMonthly}
                    min={500}
                    max={15000}
                    step={100}
                    onChange={setCurrentMonthly}
                    formatValue={v => formatSEK(v) + '/mån'}
                  />
                )}
                <div className="pt-2">
                  <SliderStep
                    label="Vilken månadskostnad vill du ha?"
                    sublabel="Din budget för nästa bil"
                    value={desiredMonthly}
                    min={500}
                    max={15000}
                    step={100}
                    onChange={setDesiredMonthly}
                    formatValue={v => formatSEK(v) + '/mån'}
                    note={
                      hasCurrentCar && currentMonthly > desiredMonthly
                        ? `Du siktar på att spara ${formatSEK(currentMonthly - desiredMonthly)} per månad — det är ${formatSEK((currentMonthly - desiredMonthly) * 12)} per år!`
                        : undefined
                    }
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Equity summary bar (visible from step 1+) */}
        {equity > 0 && step >= 1 && (
          <div className="mt-4 flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3 ring-1 ring-emerald-100">
            <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-emerald-700 font-semibold">Din totala insats</p>
              <p className="text-[11px] text-emerald-600">{formatSEK(equity)}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="w-10 h-11 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!canContinue()}
            className={`flex-1 h-11 rounded-xl text-[14px] font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              canContinue()
                ? 'bg-[#0e6efe] hover:bg-[#0a57cc] text-white active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {step === STEP_COUNT - 1 ? (
              <>Visa matchade bilar <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Fortsätt <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
