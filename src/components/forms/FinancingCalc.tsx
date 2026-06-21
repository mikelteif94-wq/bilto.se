import { useState } from 'react';

interface FinancingCalcProps {
  carPrice?: number;
}

const RATE = 0.0649 / 12;
const MONTHS = 36;
const DOWN_PAYMENT_PCT = 0.20;
const FEE_PCT = 0.01;
const MIN_PRICE = 50_000;
const MAX_PRICE = 1_200_000;

function calcMonthly(carPrice: number, residualPct: number): number {
  const kontantinsats = carPrice * DOWN_PAYMENT_PCT;
  const avgift = carPrice * FEE_PCT;
  const loan = carPrice - kontantinsats + avgift;
  const residualAmount = carPrice * residualPct;
  const r = RATE;
  const n = MONTHS;
  return ((loan - residualAmount / Math.pow(1 + r, n)) * r) / (1 - Math.pow(1 + r, -n));
}

function formatSEK(n: number): string {
  return Math.round(n).toLocaleString('sv-SE');
}

export default function FinancingCalc({ carPrice }: FinancingCalcProps) {
  const defaultPrice = carPrice && carPrice >= MIN_PRICE ? Math.min(carPrice, MAX_PRICE) : 470_000;
  const [price, setPrice] = useState(defaultPrice);
  const [residualPct, setResidualPct] = useState<0.50 | 0.55>(0.55);

  const monthly = calcMonthly(price, residualPct);
  const sliderPct = ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-[15px] font-bold text-slate-800">Beräkna månadskostnad</h3>
        <p className="mt-0.5 text-[12px] text-slate-500 leading-relaxed">
          Ange bilpris – månadskostnaden beräknas automatiskt med finansiering, kontantinsats och restvärde.
        </p>
      </div>

      {/* Result display */}
      <div className="mb-5 rounded-xl bg-[#0e6efe]/6 border border-[#0e6efe]/15 px-4 py-3.5">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Uppskattad månadskostnad
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[28px] font-extrabold text-[#0e6efe] tabular-nums leading-none">
            {formatSEK(monthly)}
          </span>
          <span className="text-[14px] font-semibold text-[#0e6efe]/70">kr/mån</span>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">
          6,49% ränta · 36 månader · 20% kontantinsats · {residualPct === 0.55 ? '55' : '50'}% restvärde
        </p>
      </div>

      {/* Price slider */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[12px] font-semibold text-slate-700">Bilpris</label>
          <span className="text-[13px] font-bold text-slate-800 tabular-nums">{formatSEK(price)} kr</span>
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
            background: `linear-gradient(to right, #0e6efe ${sliderPct}%, #e2e8f0 ${sliderPct}%)`,
          }}
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-slate-400">50 000 kr</span>
          <span className="text-[10px] text-slate-400">1 200 000 kr</span>
        </div>
      </div>

      {/* Restvärde selector */}
      <div>
        <p className="text-[12px] font-semibold text-slate-700 mb-2">Restvärde</p>
        <div className="flex gap-2">
          {([0.50, 0.55] as const).map((pctVal) => (
            <button
              key={pctVal}
              type="button"
              onClick={() => setResidualPct(pctVal)}
              className={`flex-1 h-9 rounded-xl text-[13px] font-bold border transition-all duration-150 active:scale-[0.98] ${
                residualPct === pctVal
                  ? 'bg-[#0e6efe] border-[#0e6efe] text-white shadow-sm shadow-[#0e6efe]/25'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#0e6efe]/40 hover:text-[#0e6efe]'
              }`}
            >
              {pctVal === 0.50 ? '50%' : '55%'}
            </button>
          ))}
        </div>
      </div>

      {/* Details row */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-3 gap-2">
        {[
          { label: 'Kontantinsats', value: `${formatSEK(price * DOWN_PAYMENT_PCT)} kr` },
          { label: 'Lånesumma', value: `${formatSEK(price * (1 - DOWN_PAYMENT_PCT) + price * FEE_PCT)} kr` },
          { label: 'Restvärde', value: `${formatSEK(price * residualPct)} kr` },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
            <p className="text-[11px] font-bold text-slate-700 tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
