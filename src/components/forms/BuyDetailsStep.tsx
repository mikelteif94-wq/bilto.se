import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { BuyTrack } from './BuyTrackStep';
import FieldError from './FieldError';
import RegInput from '../RegInput';
import { CAR_BRANDS, POPULAR_BRANDS } from '../../lib/carBrands';

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

const PAYMENT_TYPES = [
  { value: 'cash', label: 'Kontant' },
  { value: 'finance', label: 'Finansiering' },
];

export interface BuyDetailsData {
  linkOrSeller: string;
  carModel: string;
  carBrand: string;
  paymentType: string;
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
    carBrand: initialData.carBrand || '',
    paymentType: initialData.paymentType || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof BuyDetailsData, value: string) => {
    setD(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'carBrand') {
        next.carModel = '';
      }
      if (key === 'paymentType' && value === 'cash') {
        next.desiredMonthlyCost = '';
      }
      return next;
    });
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const models = d.carBrand ? (CAR_BRANDS[d.carBrand] ?? []) : [];

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!d.buyingStage) e.buyingStage = 'Välj var du är i processen';

    if (!d.paymentType) {
      e.paymentType = 'Välj hur du vill betala';
    }

    if (d.paymentType === 'finance') {
      if (!d.desiredMonthlyCost.trim()) {
        e.desiredMonthlyCost = 'Fyll i önskad månadskostnad';
      } else if (!/^\d+([.,]\d+)?$/.test(d.desiredMonthlyCost.trim().replace(/\s/g, ''))) {
        e.desiredMonthlyCost = 'Månadskostnad måste vara en siffra';
      }
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
              Vilket märke och modell?
            </label>
            <p className="text-sm text-slate-500 mb-3">
              Välj märke och modell, eller lämna tomt om du är öppen.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <select
                  value={d.carBrand}
                  onChange={e => set('carBrand', e.target.value)}
                  className="form-control appearance-none pr-10"
                >
                  <option value="">Välj märke</option>
                  {POPULAR_BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={d.carModel}
                  onChange={e => set('carModel', e.target.value)}
                  disabled={!d.carBrand}
                  className="form-control appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{d.carBrand ? 'Välj modell' : 'Välj märke först'}</option>
                  {models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
              Budget
            </label>
            <div className="w-full sm:max-w-xs relative">
              <select
                value={d.budget}
                onChange={e => set('budget', e.target.value)}
                className="form-control appearance-none pr-10"
              >
                <option value="">Välj budget</option>
                {BUDGETS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
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
              Välj märke och modell, eller skriv fritt.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <select
                  value={d.carBrand}
                  onChange={e => set('carBrand', e.target.value)}
                  className="form-control appearance-none pr-10"
                >
                  <option value="">Välj märke</option>
                  {POPULAR_BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={d.carModel}
                  onChange={e => set('carModel', e.target.value)}
                  disabled={!d.carBrand}
                  className="form-control appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{d.carBrand ? 'Välj modell' : 'Välj märke först'}</option>
                  {models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <input
              type="text"
              value={d.targetCar}
              onChange={e => set('targetCar', e.target.value)}
              placeholder="Eller skriv fritt, t.ex. SUV med bra bagageutrymme"
              className="form-control mt-3"
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

      {/* Betalningssätt */}
      <div className="py-6 sm:py-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
          Hur vill du betala?
        </label>
        <p className="text-sm text-slate-500 mb-4">
          Välj betalningssätt — det hjälper oss hitta rätt upplägg.
        </p>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_TYPES.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => set('paymentType', p.value)}
              className={`px-4 sm:px-5 h-10 rounded-full text-[14px] font-medium transition-all ${
                d.paymentType === p.value
                  ? 'bg-[#0e6efe] text-white ring-1 ring-inset ring-[#0e6efe] shadow-sm'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <FieldError message={errors.paymentType} />
      </div>

      {/* Önskad månadskostnad — only for finance */}
      {d.paymentType === 'finance' && (
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
      )}

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
