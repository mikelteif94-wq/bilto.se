import { useState } from 'react';
import type { BuyTrack } from './BuyTrackStep';
import FieldError from './FieldError';
import RegInput from '../RegInput';

const BUYING_STAGES = [
  { value: 'just_started', label: 'Precis börjat kolla' },
  { value: 'comparing', label: 'Jämför alternativ' },
  { value: 'ready_to_buy', label: 'Redo att köpa' },
];

const BUDGETS = [
  { value: '0-150000', label: '0 – 150 000 kr' },
  { value: '150000-250000', label: '150 000 – 250 000 kr' },
  { value: '250000-400000', label: '250 000 – 400 000 kr' },
  { value: '400000-600000', label: '400 000 – 600 000 kr' },
  { value: '600000+', label: '600 000 kr+' },
];

const FUEL_TYPES = [
  { value: 'petrol', label: 'Bensin' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybrid', label: 'Hybrid / Laddhybrid' },
  { value: 'electric', label: 'El' },
  { value: 'no_pref', label: 'Spelar ingen roll' },
];

export interface BuyDetailsData {
  linkOrSeller: string;
  carModel: string;
  buyingStage: string;
  budget: string;
  fuelType: string;
  regnummer: string;
  miltal: string;
  targetCar: string;
  desiredMonthlyCost: string;
  additionalRequests: string;
}

interface BuyDetailsStepProps {
  track: BuyTrack;
  initialData: BuyDetailsData;
  initialBil?: string;
  onNext: (data: BuyDetailsData) => void;
}

export default function BuyDetailsStep({ track, initialData, initialBil, onNext }: BuyDetailsStepProps) {
  const [d, setD] = useState<BuyDetailsData>({
    ...initialData,
    carModel: initialData.carModel || initialBil || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof BuyDetailsData, value: string) => {
    setD(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!d.buyingStage) e.buyingStage = 'Välj var du är i processen';
    if (!d.desiredMonthlyCost.trim()) {
      e.desiredMonthlyCost = 'Fyll i önskad månadskostnad';
    } else if (!/^\d+([.,]\d+)?$/.test(d.desiredMonthlyCost.trim().replace(/\s/g, ''))) {
      e.desiredMonthlyCost = 'Månadskostnad måste vara en siffra';
    }

    if (track === 'found' && !d.linkOrSeller.trim()) {
      e.linkOrSeller = 'Fyll i länk eller säljarens namn';
    }
    if (track === 'trade' && !d.regnummer.trim()) {
      e.regnummer = 'Fyll i regnummer';
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
      {track === 'found' && (
        <>
          <div className="pb-6 sm:pb-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Länk till annonsen eller säljarens namn
            </label>
            <p className="text-sm text-slate-500 mb-3">
              Klistra in Blocket-länken, eller skriv handlarens namn.
            </p>
            <input
              type="text"
              value={d.linkOrSeller}
              onChange={e => set('linkOrSeller', e.target.value)}
              placeholder="https://... eller handlarens namn"
              className={`form-control ${errors.linkOrSeller ? 'form-control-error' : ''}`}
            />
            <FieldError message={errors.linkOrSeller} />
          </div>

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
              Vilken bil?
            </label>
            <input
              type="text"
              value={d.carModel}
              onChange={e => set('carModel', e.target.value)}
              placeholder="T.ex. BMW X3 2022"
              className="form-control"
            />
          </div>
        </>
      )}

      {track === 'searching' && (
        <>
          <div className="pb-6 sm:pb-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Vilken bil eller typ letar du efter?
            </label>
            <p className="text-sm text-slate-500 mb-3">
              Skriv t.ex. "Volvo XC60", "SUV" eller "kombi med bra bagageutrymme".
            </p>
            <input
              type="text"
              value={d.carModel}
              onChange={e => set('carModel', e.target.value)}
              placeholder="T.ex. Volvo XC60, SUV, kombi..."
              className="form-control"
            />
          </div>

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
              Budget
            </label>
            <div className="w-full sm:max-w-xs">
              <select
                value={d.budget}
                onChange={e => set('budget', e.target.value)}
                className="form-control"
              >
                <option value="">Välj budget</option>
                {BUDGETS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
              Drivmedel
            </label>
            <div className="flex flex-wrap gap-2">
              {FUEL_TYPES.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => set('fuelType', d.fuelType === f.value ? '' : f.value)}
                  className={`px-4 sm:px-5 h-10 rounded-full text-[14px] font-medium transition-all ${
                    d.fuelType === f.value
                      ? 'bg-[#0e6efe] text-white ring-1 ring-inset ring-[#0e6efe] shadow-sm'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {track === 'trade' && (
        <>
          <div className="pb-6 sm:pb-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Regnummer på din nuvarande bil
            </label>
            <p className="text-sm text-slate-500 mb-3">
              Bilen du vill byta in.
            </p>
            <div className="w-full sm:max-w-xs">
              <RegInput
                value={d.regnummer}
                onChange={v => set('regnummer', v)}
                error={!!errors.regnummer}
              />
              <FieldError message={errors.regnummer} />
            </div>
          </div>

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
              Miltal
            </label>
            <div className="w-full sm:max-w-xs">
              <input
                type="text"
                inputMode="numeric"
                value={d.miltal}
                onChange={e => set('miltal', e.target.value)}
                placeholder="T.ex. 4500"
                className="form-control"
              />
            </div>
          </div>

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Vilken bil vill du ha istället?
            </label>
            <p className="text-sm text-slate-500 mb-3">
              Skriv fritt — vi hjälper dig hitta rätt.
            </p>
            <input
              type="text"
              value={d.targetCar}
              onChange={e => set('targetCar', e.target.value)}
              placeholder="T.ex. Volvo XC40 El"
              className="form-control"
            />
          </div>
        </>
      )}

      {/* Var i processen */}
      <div className="py-6 sm:py-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
          Var i processen är du?
        </label>
        <p className="text-sm text-slate-500 mb-4">
          Välj det alternativ som bäst beskriver dig.
        </p>
        <div className="flex flex-wrap gap-2">
          {BUYING_STAGES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => set('buyingStage', s.value)}
              className={`px-4 sm:px-5 h-10 rounded-full text-[14px] font-medium transition-all ${
                d.buyingStage === s.value
                  ? 'bg-[#0e6efe] text-white ring-1 ring-inset ring-[#0e6efe] shadow-sm'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <FieldError message={errors.buyingStage} />
      </div>

      {/* Önskad månadskostnad */}
      <div className="py-6 sm:py-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
          Önskad månadskostnad (kr)
        </label>
        <div className="w-full sm:max-w-xs">
          <input
            type="text"
            inputMode="numeric"
            value={d.desiredMonthlyCost}
            onChange={e => set('desiredMonthlyCost', e.target.value)}
            placeholder="T.ex. 4 500"
            className={`form-control ${errors.desiredMonthlyCost ? 'form-control-error' : ''}`}
          />
        </div>
        <FieldError message={errors.desiredMonthlyCost} />
      </div>

      {/* Övriga önskemål */}
      <div className="py-6 sm:py-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
          Övriga önskemål
        </label>
        <p className="text-sm text-slate-500 mb-3">
          Frivilligt — berätta t.ex. om tillval, färg, garanti eller annat som är viktigt.
        </p>
        <textarea
          value={d.additionalRequests}
          onChange={e => set('additionalRequests', e.target.value)}
          placeholder="Tillval, färg, garanti..."
          rows={3}
          maxLength={1000}
          className="form-control"
        />
      </div>

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
