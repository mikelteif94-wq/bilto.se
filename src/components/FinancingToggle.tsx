import { useState } from 'react';
import { Calculator, ChevronDown, X } from 'lucide-react';
import { calcCarMonthly } from '../lib/utils';

interface FinancingToggleProps {
  carPrice: number;
  usedPrice?: number;
  dark?: boolean;
}

const RATE = 0.0649;
const MONTHS = 36;
const DOWN_PCT = 0.20;
const FEE_PCT = 0.01;
const MIN_PRICE = 50_000;
const MAX_PRICE = 1_200_000;

function fmt(n: number) {
  return Math.round(n).toLocaleString('sv-SE');
}

export default function FinancingToggle({ carPrice, usedPrice, dark = false }: FinancingToggleProps) {
  const [open, setOpen] = useState(false);
  const baseDefault = usedPrice ? Math.round((carPrice + usedPrice) / 2) : carPrice;
  const [price, setPrice] = useState(Math.min(Math.max(baseDefault, MIN_PRICE), MAX_PRICE));
  const [residualPct, setResidualPct] = useState<0.50 | 0.55>(0.55);

  const monthly = calcCarMonthly(price, residualPct);
  const sliderPct = ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  const text = dark ? 'text-white' : 'text-slate-900';
  const subText = dark ? 'text-slate-400' : 'text-slate-500';
  const borderColor = dark ? 'border-white/10' : 'border-slate-200';
  const bgCard = dark ? 'bg-white/5' : 'bg-slate-50';
  const btnBase = dark
    ? 'border-white/10 text-slate-400 hover:border-[#0e6efe]/50 hover:text-[#0e6efe]'
    : 'border-slate-200 text-slate-500 hover:border-[#0e6efe]/50 hover:text-[#0e6efe]';
  const btnActive = 'bg-[#0e6efe] border-[#0e6efe] text-white';

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors duration-150 ${
          open
            ? 'text-emerald-600'
            : dark
            ? 'text-emerald-400 hover:text-emerald-300'
            : 'text-emerald-600 hover:text-emerald-700'
        }`}
      >
        <Calculator className="w-3.5 h-3.5 shrink-0" />
        Beräkna månadskostnad
        {open
          ? <X className="w-3 h-3 ml-0.5" />
          : <ChevronDown className="w-3 h-3 ml-0.5" />
        }
      </button>

      {open && (
        <div className={`mt-2.5 rounded-xl border ${borderColor} ${bgCard} p-4 space-y-4`}>
          {/* Result */}
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${subText}`}>
                Uppskattad månadskostnad
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-[24px] font-extrabold text-[#0e6efe] tabular-nums leading-none">
                  {fmt(monthly)}
                </span>
                <span className={`text-[12px] font-semibold text-[#0e6efe]/70`}>kr/mån</span>
              </div>
              <p className={`mt-0.5 text-[10px] ${subText}`}>
                {RATE * 100}% ränta · {MONTHS} mån · {DOWN_PCT * 100}% kontantinsats · {residualPct === 0.55 ? 55 : 50}% restvärde
              </p>
            </div>
          </div>

          {/* Price slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-[11px] font-semibold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>Bilpris</label>
              <span className={`text-[12px] font-bold tabular-nums ${text}`}>{fmt(price)} kr</span>
            </div>
            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={5_000}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer financing-slider"
              style={{
                background: `linear-gradient(to right, #0e6efe ${sliderPct}%, ${dark ? '#334155' : '#e2e8f0'} ${sliderPct}%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className={`text-[9px] ${subText}`}>50 000 kr</span>
              <span className={`text-[9px] ${subText}`}>1 200 000 kr</span>
            </div>
          </div>

          {/* Restvärde */}
          <div>
            <p className={`text-[11px] font-semibold mb-1.5 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>Restvärde</p>
            <div className="flex gap-2">
              {([0.55, 0.50] as const).map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setResidualPct(pct)}
                  className={`flex-1 h-8 rounded-lg text-[12px] font-bold border transition-all duration-150 active:scale-[0.98] ${
                    residualPct === pct ? btnActive : btnBase
                  }`}
                >
                  {pct === 0.55 ? '55% Standard' : '50%'}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className={`pt-3 border-t ${borderColor} grid grid-cols-3 gap-2 text-center`}>
            {[
              { label: 'Kontantinsats', value: `${fmt(price * DOWN_PCT)} kr` },
              { label: 'Lånesumma', value: `${fmt(price * (1 - DOWN_PCT) + price * FEE_PCT)} kr` },
              { label: 'Restvärde', value: `${fmt(price * residualPct)} kr` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className={`text-[9px] mb-0.5 ${subText}`}>{label}</p>
                <p className={`text-[10px] font-bold tabular-nums ${text}`}>{value}</p>
              </div>
            ))}
          </div>

          <p className={`text-[9px] ${subText} leading-relaxed`}>
            Kalkylen är en uppskattning. Faktisk månadskostnad beror på kreditgivare och individuella villkor.
          </p>
        </div>
      )}
    </div>
  );
}
