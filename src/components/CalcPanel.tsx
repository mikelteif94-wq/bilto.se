import { useState, useRef, useCallback } from 'react';
import { HelpCircle, X } from 'lucide-react';

function useCustomSlider(min: number, max: number, step: number, onChange: (v: number) => void) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const valueFromX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return min;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    return Math.round(raw / step) * step;
  }, [min, max, step]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    onChange(valueFromX(e.clientX));
    const onMove = (ev: MouseEvent) => { if (dragging.current) onChange(valueFromX(ev.clientX)); };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [onChange, valueFromX]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
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
  }, [onChange, valueFromX]);

  return { trackRef, onMouseDown, onTouchStart };
}
import { calcCarMonthly } from '../lib/utils';

const RATE = 0.0649;
const MONTHS = 36;
const DOWN_PCT = 0.20;
const FEE_PCT = 0.01;
export const MIN_PRICE = 50_000;
export const MAX_PRICE = 1_200_000;

function fmt(n: number) {
  return Math.round(n).toLocaleString('sv-SE');
}

function InfoTooltip({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute bottom-full right-0 mb-2 w-60 z-30 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
      <p className="text-[11px] font-bold text-white mb-1.5">Hur räknar vi?</p>
      <p className="text-[10px] text-slate-400 leading-relaxed">
        Spannet baseras på snittpriset mellan begagnad och ny, vid 55% resp. 50% restvärde:<br />
        <span className="text-slate-200">20% kontantinsats · 1% uppläggning · 6,49% ränta · 36 månader</span>
      </p>
      <div className="mt-2 pt-2 border-t border-slate-700">
        <p className="text-[9px] text-slate-500">Uppskattning. Slutlig ränta och villkor sätts av finansiär.</p>
      </div>
    </div>
  );
}

interface CalcPanelProps {
  carPrice: number;
  usedPrice?: number;
  /** Use dark variant for dark-background cards (ElCarCard) */
  dark?: boolean;
}

export function CalcPanel({ carPrice, usedPrice, dark = false }: CalcPanelProps) {
  const baseDefault = usedPrice ? Math.round((carPrice + usedPrice) / 2) : carPrice;
  const [price, setPrice] = useState(Math.min(Math.max(baseDefault, MIN_PRICE), MAX_PRICE));
  const [residualPct, setResidualPct] = useState<0.50 | 0.55>(0.55);
  const [showInfo, setShowInfo] = useState(false);
  const monthly = calcCarMonthly(price, residualPct);
  const sliderPct = ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const slider = useCustomSlider(MIN_PRICE, MAX_PRICE, 5_000, setPrice);

  const bg = dark ? 'bg-white/5 border-white/10' : 'bg-[#faf8f5] border-slate-100';
  const labelColor = dark ? 'text-slate-400' : 'text-slate-400';
  const valueColor = dark ? 'text-white' : 'text-slate-900';
  const subColor = dark ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className={`rounded-xl border ${bg} p-4 space-y-3`} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={`text-[9.5px] font-semibold uppercase tracking-wide ${labelColor} mb-0.5`}>Uppskattad månadskostnad</p>
          <div className="flex items-baseline gap-1">
            <span className="text-[24px] font-extrabold text-[#0e6efe] tabular-nums leading-none">{fmt(monthly)}</span>
            <span className="text-[12px] font-semibold text-[#0e6efe]/60">kr/mån</span>
          </div>
          <p className={`mt-0.5 text-[9px] ${subColor}`}>
            {RATE * 100}% ränta · {MONTHS} mån · {DOWN_PCT * 100}% ins. · {residualPct === 0.55 ? 55 : 50}% restvärde
          </p>
        </div>
        <div className="relative pb-0.5">
          <button type="button" onClick={() => setShowInfo(v => !v)} className={`${dark ? 'text-slate-600 hover:text-slate-300' : 'text-slate-300 hover:text-slate-500'} transition-colors`}>
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {showInfo && <InfoTooltip onClose={() => setShowInfo(false)} />}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={`text-[10.5px] font-semibold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>Bilpris</label>
          <span className={`text-[11px] font-bold tabular-nums ${valueColor}`}>{fmt(price)} kr</span>
        </div>
        <div
          ref={slider.trackRef}
          className="relative h-8 flex items-center cursor-pointer select-none"
          onMouseDown={slider.onMouseDown}
          onTouchStart={slider.onTouchStart}
        >
          <div className={`absolute inset-x-0 h-1.5 rounded-full ${dark ? 'bg-white/10' : 'bg-slate-200'}`}>
            <div className="absolute left-0 top-0 h-full rounded-xl bg-[#0e6efe]" style={{ width: `${sliderPct}%` }} />
          </div>
          <div
            className="absolute w-5 h-5 rounded-full bg-white border-2 border-[#0e6efe] shadow-md -translate-x-1/2"
            style={{ left: `${sliderPct}%` }}
          />
        </div>
        <div className="flex justify-between -mt-1">
          <span className={`text-[9px] ${subColor}`}>50 000 kr</span>
          <span className={`text-[9px] ${subColor}`}>1 200 000 kr</span>
        </div>
      </div>

      <div className="flex gap-2">
        {([0.55, 0.50] as const).map(pct => (
          <button
            key={pct} type="button" onClick={() => setResidualPct(pct)}
            className={`flex-1 h-7 rounded-lg text-[11px] font-bold border transition-all duration-150 active:scale-[0.98] ${
              residualPct === pct
                ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                : dark
                ? 'border-white/15 text-slate-400 hover:border-[#0e6efe]/50 hover:text-[#0e6efe]'
                : 'border-slate-200 text-slate-500 hover:border-[#0e6efe]/50 hover:text-[#0e6efe]'
            }`}
          >
            {pct === 0.55 ? '55% Standard' : '50%'}
          </button>
        ))}
      </div>

      <div className={`pt-2.5 border-t ${dark ? 'border-white/10' : 'border-slate-100'} grid grid-cols-3 gap-1.5 text-center`}>
        {[
          { label: 'Kontantinsats', value: `${fmt(price * DOWN_PCT)} kr` },
          { label: 'Lånesumma', value: `${fmt(price * (1 - DOWN_PCT) + price * FEE_PCT)} kr` },
          { label: 'Restvärde', value: `${fmt(price * residualPct)} kr` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className={`text-[8.5px] ${labelColor} mb-0.5`}>{label}</p>
            <p className={`text-[9.5px] font-bold tabular-nums ${valueColor}`}>{value}</p>
          </div>
        ))}
      </div>
      <p className={`text-[8.5px] ${subColor} leading-relaxed`}>Uppskattning. Faktisk kostnad beror på kreditgivare och individuella villkor.</p>
    </div>
  );
}
