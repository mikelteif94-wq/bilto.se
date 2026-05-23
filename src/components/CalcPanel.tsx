import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
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

  const bg = dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100';
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
        <input
          type="range" min={MIN_PRICE} max={MAX_PRICE} step={5_000} value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer financing-slider touch-none"
          style={{ background: `linear-gradient(to right, #0e6efe ${sliderPct}%, ${dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'} ${sliderPct}%)` }}
        />
        <div className="flex justify-between mt-0.5">
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
