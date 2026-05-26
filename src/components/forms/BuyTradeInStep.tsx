import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import FieldError from './FieldError';
import RegInput from '../RegInput';
import { useVehicleLookup } from '../../lib/useVehicleLookup';

export interface BuyTradeInData {
  hasTradeIn: boolean | null;
  tradeInReg: string;
  hasLoan: boolean | null;
  loanAmount: string;
  interestRate: string;
}

interface BuyTradeInStepProps {
  initialData: BuyTradeInData;
  onNext: (data: BuyTradeInData) => void;
}

function TradeInCarInfo({ regnummer }: { regnummer: string }) {
  const lookup = useVehicleLookup(regnummer);

  if (lookup.status === 'loading') {
    return (
      <div className="mt-3 flex items-center gap-2 text-[13px] text-slate-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Hämtar biluppgifter...</span>
      </div>
    );
  }

  if (lookup.status === 'found') {
    const { marke, modell, ar, miltal } = lookup.data;
    const label = [marke, modell, ar ? String(ar) : ''].filter(Boolean).join(' ');
    return (
      <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-[#0e6efe]/[0.07] border border-[#0e6efe]/20 rounded-lg flex-wrap">
        <span className="text-[13px] font-bold text-[#0e6efe] tracking-widest">{regnummer.toUpperCase()}</span>
        {label && (
          <>
            <span className="text-[#0e6efe]/30">&middot;</span>
            <span className="text-[13px] font-semibold text-slate-800">{label}</span>
          </>
        )}
        {miltal != null && miltal > 0 && (
          <>
            <span className="text-[#0e6efe]/30">&middot;</span>
            <span className="text-[13px] text-slate-500">{miltal.toLocaleString('sv-SE')} mil</span>
          </>
        )}
      </div>
    );
  }

  if (lookup.status === 'not_found') {
    return (
      <p className="mt-2 text-[13px] text-amber-600">Bilen hittades inte i registret.</p>
    );
  }

  return null;
}

export default function BuyTradeInStep({ initialData, onNext }: BuyTradeInStepProps) {
  const [d, setD] = useState<BuyTradeInData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (d.hasTradeIn === null) e.hasTradeIn = 'Svara på om du har en inbytesbil';
    if (d.hasTradeIn) {
      if (!d.tradeInReg.trim()) e.tradeInReg = 'Fyll i regnummer för inbytesbilen';
      if (d.hasLoan === null) e.hasLoan = 'Svara på om bilen har befintligt lån';
      if (d.hasLoan) {
        if (!d.loanAmount.trim()) e.loanAmount = 'Fyll i lånebelopp';
        if (!d.interestRate.trim()) e.interestRate = 'Fyll i nuvarande ränta';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onNext(d);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="divide-y divide-slate-200">
      {/* Har du inbytesbil? */}
      <div className="pb-6 sm:pb-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
          Har du en bil att byta in?
        </label>
        <p className="text-sm text-slate-500 mb-4">
          Vi värderar och sköter inbytet åt dig.
        </p>
        <div className="flex gap-3 sm:max-w-xs">
          {([true, false] as const).map(val => (
            <button
              key={String(val)}
              type="button"
              onClick={() => {
                setD(prev => ({
                  ...prev,
                  hasTradeIn: val,
                  ...(val === false ? { tradeInReg: '', hasLoan: null, loanAmount: '', interestRate: '' } : {}),
                }));
                setErrors(prev => { const n = { ...prev }; delete n.hasTradeIn; return n; });
              }}
              className={`flex-1 h-12 rounded-full text-[15px] font-semibold transition-all ${
                d.hasTradeIn === val
                  ? 'bg-[#0e6efe] text-white ring-1 ring-inset ring-[#0e6efe] shadow-sm'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              {val ? 'Ja' : 'Nej'}
            </button>
          ))}
        </div>
        <FieldError message={errors.hasTradeIn} />
      </div>

      {d.hasTradeIn && (
        <>
          {/* Regnummer */}
          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
              Regnummer på inbytesbilen
            </label>
            <div className="w-full sm:max-w-xs">
              <RegInput
                value={d.tradeInReg}
                onChange={v => {
                  setD(prev => ({ ...prev, tradeInReg: v }));
                  setErrors(prev => { const n = { ...prev }; delete n.tradeInReg; return n; });
                }}
                error={!!errors.tradeInReg}
              />
              <FieldError message={errors.tradeInReg} />
              <TradeInCarInfo regnummer={d.tradeInReg} />
            </div>
          </div>

          {/* Befintligt lån? */}
          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Har bilen befintligt lån?
            </label>
            <p className="text-sm text-slate-500 mb-4">
              Vi hjälper dig lösa befintligt lån vid inbytet.
            </p>
            <div className="flex gap-3 sm:max-w-xs">
              {([true, false] as const).map(val => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => {
                    setD(prev => ({
                      ...prev,
                      hasLoan: val,
                      ...(val === false ? { loanAmount: '', interestRate: '' } : {}),
                    }));
                    setErrors(prev => { const n = { ...prev }; delete n.hasLoan; return n; });
                  }}
                  className={`flex-1 h-12 rounded-full text-[15px] font-semibold transition-all ${
                    d.hasLoan === val
                      ? 'bg-[#0e6efe] text-white ring-1 ring-inset ring-[#0e6efe] shadow-sm'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {val ? 'Ja' : 'Nej'}
                </button>
              ))}
            </div>
            <FieldError message={errors.hasLoan} />
          </div>

          {d.hasLoan && (
            <>
              <div className="py-6 sm:py-7">
                <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
                  Lånebelopp (kr)
                </label>
                <div className="w-full sm:max-w-xs">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={d.loanAmount}
                    onChange={e => {
                      setD(prev => ({ ...prev, loanAmount: e.target.value }));
                      setErrors(prev => { const n = { ...prev }; delete n.loanAmount; return n; });
                    }}
                    placeholder="T.ex. 150 000"
                    className={`form-control ${errors.loanAmount ? 'form-control-error' : ''}`}
                  />
                </div>
                <FieldError message={errors.loanAmount} />
              </div>

              <div className="py-6 sm:py-7">
                <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
                  Nuvarande ränta (%)
                </label>
                <div className="w-full sm:max-w-xs">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={d.interestRate}
                    onChange={e => {
                      setD(prev => ({ ...prev, interestRate: e.target.value }));
                      setErrors(prev => { const n = { ...prev }; delete n.interestRate; return n; });
                    }}
                    placeholder="T.ex. 6,5"
                    className={`form-control ${errors.interestRate ? 'form-control-error' : ''}`}
                  />
                </div>
                <FieldError message={errors.interestRate} />
              </div>
            </>
          )}
        </>
      )}

      <div className="pt-6 sm:pt-7 flex justify-end">
        <button
          type="submit"
          className="w-full sm:w-auto sm:min-w-[200px] h-12 px-8 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-[15px] rounded-full transition shadow-sm"
        >
          Nästa
        </button>
      </div>
    </form>
  );
}
