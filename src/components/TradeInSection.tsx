import { useState } from 'react';
import RegInput from './RegInput';

const MILEAGE_OPTIONS = [
  { value: '', label: 'Välj...' },
  { value: '1000', label: '0–1 000 mil' },
  { value: '2000', label: '1 000–2 000 mil' },
  { value: '3000', label: '2 000–3 000 mil' },
  { value: '4000', label: '3 000–4 000 mil' },
  { value: '5000', label: '4 000–5 000 mil' },
  { value: '7000', label: '5 000–7 000 mil' },
  { value: '10000', label: '7 000–10 000 mil' },
  { value: '12000', label: '10 000–12 000 mil' },
  { value: '15000', label: '12 000–15 000 mil' },
  { value: '20000', label: '15 000–20 000 mil' },
  { value: '25000', label: '20 000–25 000 mil' },
  { value: '30000', label: 'Över 25 000 mil' },
];

export interface TradeInData {
  hasTradeIn: 'yes' | 'no' | '';
  reg: string;
  mileage: string;
  hasLoan: 'yes' | 'no' | '';
  loanAmount: string;
  loanRate: string;
}

export const EMPTY_TRADE_IN: TradeInData = {
  hasTradeIn: '',
  reg: '',
  mileage: '',
  hasLoan: '',
  loanAmount: '',
  loanRate: '',
};

export function formatTradeInText(data: TradeInData): string {
  if (data.hasTradeIn !== 'yes') return '';
  const parts = ['Inbytesbil:'];
  if (data.reg) parts.push(`Reg: ${data.reg}`);
  const mil = MILEAGE_OPTIONS.find(o => o.value === data.mileage);
  if (mil && data.mileage) parts.push(`Miltal: ${mil.label}`);
  if (data.hasLoan === 'yes') {
    parts.push('Lån: Ja');
    if (data.loanAmount) parts.push(`Skuld: ${data.loanAmount} kr`);
    if (data.loanRate) parts.push(`Ränta: ${data.loanRate}%`);
  } else if (data.hasLoan === 'no') {
    parts.push('Lån: Nej');
  }
  return parts.join('\n');
}

interface Props {
  data: TradeInData;
  onChange: (data: TradeInData) => void;
}

export default function TradeInSection({ data, onChange }: Props) {
  const [rateSliderActive, setRateSliderActive] = useState(!!data.loanRate);

  const update = (key: keyof TradeInData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="border-t border-slate-100 pt-4 mt-1">
      <p className="text-[14px] font-semibold text-slate-900 mb-3">Har du en inbytesbil?</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {[
          { value: 'no' as const, label: 'Nej' },
          { value: 'yes' as const, label: 'Ja' },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => update('hasTradeIn', opt.value)}
            className={`px-4 py-2 rounded-lg text-[14px] font-medium transition border ${
              data.hasTradeIn === opt.value
                ? 'bg-[#0e6efe] text-white border-[#0e6efe]'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {data.hasTradeIn === 'yes' && (
        <div className="flex flex-col gap-4 mt-3">
          {/* Regnummer */}
          <div>
            <label className="block text-[12px] font-medium text-slate-500 mb-1.5">Regnummer (inbytesbil)</label>
            <RegInput value={data.reg} onChange={(v) => update('reg', v)} />
          </div>

          {/* Miltal */}
          <div>
            <label className="block text-[12px] font-medium text-slate-500 mb-1.5">Miltal</label>
            <select
              value={data.mileage}
              onChange={(e) => update('mileage', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/20 focus:border-[#0e6efe] transition appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center]"
            >
              {MILEAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Lån */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[13px] font-semibold text-slate-700 mb-2">Har du lån på bilen?</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'no' as const, label: 'Nej' },
                { value: 'yes' as const, label: 'Ja' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('hasLoan', opt.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition border ${
                    data.hasLoan === opt.value
                      ? 'bg-[#0e6efe] text-white border-[#0e6efe]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {data.hasLoan === 'yes' && (
              <div className="flex flex-col gap-4 mt-3">
                {/* Kvarvarande skuld */}
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1.5">
                    Kvarvarande skuld (kan hoppas över)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.loanAmount}
                    onChange={(e) => update('loanAmount', e.target.value.replace(/[^\d\s]/g, ''))}
                    placeholder="T.ex. 120 000"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/20 focus:border-[#0e6efe] transition"
                  />
                </div>

                {/* Ränta slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-medium text-slate-500">
                      Ränta (kan hoppas över)
                    </label>
                    {rateSliderActive && data.loanRate && (
                      <span className="text-[12px] font-semibold text-[#0e6efe]">{data.loanRate}%</span>
                    )}
                  </div>
                  {!rateSliderActive ? (
                    <button
                      type="button"
                      onClick={() => { setRateSliderActive(true); update('loanRate', '5'); }}
                      className="text-[13px] text-[#0e6efe] font-medium hover:underline"
                    >
                      Ange ränta
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="15"
                        step="0.1"
                        value={data.loanRate || '5'}
                        onChange={(e) => update('loanRate', e.target.value)}
                        className="flex-1 h-2 rounded-full appearance-none bg-slate-200 accent-[#0e6efe] cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0e6efe] [&::-webkit-slider-thumb]:shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => { setRateSliderActive(false); update('loanRate', ''); }}
                        className="text-[11px] text-slate-400 hover:text-slate-600"
                      >
                        Hoppa över
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
