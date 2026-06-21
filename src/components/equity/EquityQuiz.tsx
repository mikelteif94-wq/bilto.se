import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Car, Wallet, ArrowRight, Info, X, TrendingDown, Sparkles } from 'lucide-react';
import RegInput from '../RegInput';

export interface EquityData {
  hasCurrentCar: boolean;
  regnummer?: string;
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

function formatSEKShort(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

function CustomSlider({ value, min, max, step, onChange, color = '#0e6efe' }: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; color?: string;
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
      className="relative h-12 flex items-center cursor-pointer select-none"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <div className="absolute inset-x-0 h-2.5 rounded-full bg-slate-100">
        <div
          className="absolute left-0 top-0 h-full rounded-xl transition-none"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.25 }}
        />
        <div
          className="absolute left-0 top-0 h-full rounded-xl"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div
        className="absolute w-7 h-7 rounded-full bg-white -translate-x-1/2 shadow-lg flex items-center justify-center"
        style={{ left: `${pct}%`, border: `2.5px solid ${color}` }}
      >
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

function SliderStep({ label, sublabel, value, min, max, step, onChange, formatValue, note, color }: {
  label: string; sublabel?: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; formatValue: (v: number) => string; note?: string; color?: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[16px] font-bold text-slate-900">{label}</p>
        {sublabel && <p className="text-[12.5px] text-slate-500 mt-0.5">{sublabel}</p>}
      </div>

      {/* Big number display */}
      <div className="text-center py-4 px-4 rounded-2xl bg-slate-50 border border-slate-100">
        <motion.span
          key={value}
          initial={{ scale: 0.95, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.12 }}
          className="text-[36px] font-black tabular-nums leading-none"
          style={{ color: color || '#0e6efe' }}
        >
          {formatSEKShort(value)}
        </motion.span>
        <span className="text-[16px] font-semibold text-slate-400 ml-1.5">kr</span>
      </div>

      <div className="px-1">
        <CustomSlider value={value} min={min} max={max} step={step} onChange={onChange} color={color} />
        <div className="flex justify-between mt-1 text-[11px] text-slate-400 font-medium">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      </div>

      {note && (
        <div className="flex items-start gap-2.5 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
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
  const [regnummer, setRegnummer] = useState('');
  const [carValue, setCarValue] = useState(120000);
  const [carDebt, setCarDebt] = useState(0);
  const [cashSavings, setCashSavings] = useState(0);
  const [currentMonthly, setCurrentMonthly] = useState(3500);
  const [desiredMonthly, setDesiredMonthly] = useState(3000);

  const carEquity = hasCurrentCar ? Math.max(0, carValue - carDebt) : 0;
  const equity = Math.max(0, carEquity + cashSavings);

  const canContinue = () => step === 0 ? hasCurrentCar !== null : true;

  const next = () => {
    if (step === 0 && hasCurrentCar === false) { setStep(3); return; }
    if (step < STEP_COUNT - 1) setStep(s => s + 1);
    else finish();
  };

  const back = () => {
    if (step === 3 && hasCurrentCar === false) { setStep(0); return; }
    if (step > 0) setStep(s => s - 1);
  };

  const finish = () => {
    onComplete({
      hasCurrentCar: hasCurrentCar ?? false,
      regnummer: regnummer || undefined,
      carValue: hasCurrentCar ? carValue : 0,
      carDebt: hasCurrentCar ? carDebt : 0,
      cashSavings,
      currentMonthly: hasCurrentCar ? currentMonthly : 0,
      desiredMonthly,
      equity,
    });
  };

  const stepTitles = ['Din bil', 'Bilens värde', 'Kvarvarande skuld', 'Sparpengar', 'Månadskostnad'];
  const visibleStep = step;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-md w-full mx-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#0e6efe]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-900">Din insats</p>
              <p className="text-[11px] text-slate-400">{stepTitles[visibleStep]}</p>
            </div>
          </div>
          <button
            type="button" onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex gap-1.5">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i < visibleStep ? '#0e6efe' : i === visibleStep ? '#93c5fd' : '#e2e8f0',
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-5 min-h-[300px] flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="flex-1"
          >
            {/* Step 0: Har du bil? */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[16px] font-bold text-slate-900">Har du en bil idag?</p>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">Din nuvarande bil kan vara en del av din insats</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: true, label: 'Ja, jag har en bil', icon: Car, desc: 'Inbytesvärdet räknas in', color: '#0e6efe', bg: '#eff6ff' },
                    { val: false, label: 'Nej, inte just nu', icon: Wallet, desc: 'Kontantinsats', color: '#16a34a', bg: '#f0fdf4' },
                  ].map(opt => (
                    <motion.button
                      key={String(opt.val)}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setHasCurrentCar(opt.val)}
                      className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 text-center ${
                        hasCurrentCar === opt.val
                          ? 'border-[#0e6efe] bg-blue-50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: hasCurrentCar === opt.val ? opt.bg : '#f8fafc' }}
                      >
                        <opt.icon className="w-5 h-5" style={{ color: hasCurrentCar === opt.val ? opt.color : '#94a3b8' }} />
                      </div>
                      <span className={`text-[13px] font-bold leading-tight ${hasCurrentCar === opt.val ? 'text-[#0e6efe]' : 'text-slate-700'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-slate-400">{opt.desc}</span>
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence>
                  {hasCurrentCar === true && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 space-y-2">
                        <p className="text-[12px] font-semibold text-slate-600">
                          Registreringsnummer <span className="font-normal text-slate-400">(valfritt)</span>
                        </p>
                        <RegInput value={regnummer} onChange={setRegnummer} size="sm" />
                        <p className="text-[11px] text-slate-400">Vi sparar bilen till din portal</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {step === 1 && (
              <SliderStep
                label="Vad är din bil värd ungefär?"
                sublabel="Kolla på Blocket eller Kvdbil för ett marknadsvärde"
                value={carValue} min={20000} max={700000} step={5000}
                onChange={setCarValue} formatValue={v => formatSEK(v)} color="#0e6efe"
                note="Vet du inte exakt? Uppskatta lite generöst — vi justerar efteråt."
              />
            )}

            {step === 2 && (
              <SliderStep
                label="Hur mycket skuld har du kvar?"
                sublabel="Det som återstår att betala på billånet"
                value={carDebt} min={0} max={Math.max(carValue, 400000)} step={5000}
                onChange={setCarDebt}
                formatValue={v => v === 0 ? 'Ingen skuld' : formatSEK(v)}
                color={carDebt > carValue ? '#dc2626' : '#0e6efe'}
                note={`Ditt nettovärde: ${formatSEK(Math.max(0, carValue - carDebt))} — det tar du med dig till nästa bil.`}
              />
            )}

            {step === 3 && (
              <SliderStep
                label={hasCurrentCar ? 'Extra kontanter till insatsen?' : 'Hur mycket har du sparat?'}
                sublabel={hasCurrentCar ? 'Sparpengar utöver din nuvarande bil — valfritt' : 'Sparpengar du kan använda som kontantinsats'}
                value={cashSavings} min={0} max={500000} step={5000}
                onChange={setCashSavings}
                formatValue={v => v === 0 ? 'Inga extra' : formatSEK(v)}
                color="#16a34a"
                note="Du behöver inte använda alla sparpengar. Vi visar hur lite du faktiskt behöver."
              />
            )}

            {step === 4 && (
              <div className="space-y-5">
                {hasCurrentCar && (
                  <SliderStep
                    label="Vad betalar du idag per månad?"
                    sublabel="Leasing, billån eller annan månadskostnad för bilen"
                    value={currentMonthly} min={500} max={15000} step={100}
                    onChange={setCurrentMonthly}
                    formatValue={v => formatSEK(v) + '/mån'}
                    color="#d97706"
                  />
                )}
                <SliderStep
                  label="Vilken månadskostnad vill du ha?"
                  sublabel="Din budget för nästa bil"
                  value={desiredMonthly} min={500} max={15000} step={100}
                  onChange={setDesiredMonthly}
                  formatValue={v => formatSEK(v) + '/mån'}
                  color="#0e6efe"
                  note={
                    hasCurrentCar && currentMonthly > desiredMonthly
                      ? `Du siktar på att spara ${formatSEK(currentMonthly - desiredMonthly)}/mån — det är ${formatSEK((currentMonthly - desiredMonthly) * 12)}/år!`
                      : undefined
                  }
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Live equity summary */}
        <AnimatePresence>
          {equity > 0 && step >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4 rounded-xl overflow-hidden border border-emerald-200"
            >
              <div className="bg-emerald-500 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5 text-white" />
                  <p className="text-[11.5px] font-bold text-white uppercase tracking-wide">Din totala insats</p>
                </div>
                <p className="text-[15px] font-black text-white tabular-nums">{formatSEK(equity)}</p>
              </div>
              {(carEquity > 0 || cashSavings > 0) && (
                <div className="bg-emerald-50 px-4 py-2 flex items-center gap-4 text-[11px] text-emerald-700">
                  {carEquity > 0 && <span>Bil: {formatSEK(carEquity)}</span>}
                  {cashSavings > 0 && <span>Sparat: {formatSEK(cashSavings)}</span>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-5 flex items-center gap-3">
          {step > 0 && (
            <button
              type="button" onClick={back}
              className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <motion.button
            type="button"
            onClick={next}
            disabled={!canContinue()}
            whileTap={{ scale: 0.97 }}
            className={`flex-1 h-11 rounded-xl text-[14px] font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              canContinue()
                ? 'text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            style={canContinue() ? { backgroundColor: '#0e6efe', boxShadow: '0 4px 14px #0e6efe40' } : {}}
          >
            {step === STEP_COUNT - 1 ? (
              <>Visa matchade bilar <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Fortsätt <ChevronRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
