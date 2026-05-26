import { useState, useMemo } from 'react';
import { ChevronDown, HelpCircle, Car, Sparkles } from 'lucide-react';
import { CAR_BRANDS, POPULAR_BRANDS } from '../../lib/carBrands';
import FieldError from './FieldError';
import { useCarImages } from '../../hooks/useCarImages';
import { findComparisonCarByMakeModel } from '../../lib/comparison/lookup';

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

const CAR_TYPES = [
  { value: 'suv', label: 'SUV' },
  { value: 'sedan', label: 'Sedan / Kombi' },
  { value: 'hatchback', label: 'Halvkombi' },
  { value: 'minivan', label: 'Familjebuss' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'cabriolet', label: 'Cabriolet' },
  { value: 'small', label: 'Liten bil' },
];

const MUST_HAVES = [
  { value: 'drag_hook', label: 'Dragkrok' },
  { value: 'large_boot', label: 'Stort bagageutrymme' },
  { value: 'awd', label: 'Fyrhjulsdrift' },
  { value: 'electric', label: 'Elbil' },
  { value: 'hybrid', label: 'Hybrid / Laddhybrid' },
  { value: 'low_running_cost', label: 'Låga driftkostnader' },
  { value: 'safety', label: 'Hög säkerhetsbetyg' },
  { value: 'automatic', label: 'Automat' },
  { value: 'low_mileage', label: 'Lågt miltal' },
];

export interface TradeWishData {
  mode: 'know' | 'help' | null;
  carBrand: string;
  carModel: string;
  carPrice: string;
  fuelType: string;
  paymentType: string;
  targetCar: string;
  additionalRequests: string;
  mustHaves: string[];
}

export const EMPTY_TRADE_WISH: TradeWishData = {
  mode: null,
  carBrand: '',
  carModel: '',
  carPrice: '',
  fuelType: '',
  paymentType: '',
  targetCar: '',
  additionalRequests: '',
  mustHaves: [],
};

interface Props {
  sellCarLabel: string;
  initialData: TradeWishData;
  onNext: (data: TradeWishData) => void;
}

function CarImagePreview({ brand, model }: { brand: string; model: string }) {
  const { getCarImage } = useCarImages();
  const compData = useMemo(() => {
    if (!brand || !model || model === 'Annan') return null;
    return findComparisonCarByMakeModel(brand, model);
  }, [brand, model]);

  const imgUrl = useMemo(() => {
    if (!brand) return undefined;
    return getCarImage(brand, model && model !== 'Annan' ? model : '');
  }, [brand, model, getCarImage]);

  if (!brand || (!compData && !imgUrl)) return null;

  return (
    <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
      {imgUrl ? (
        <img src={imgUrl} alt={`${brand} ${model}`} className="w-24 h-16 object-contain flex-shrink-0" />
      ) : (
        <div className="w-24 h-16 bg-slate-100 rounded-lg flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-slate-900 truncate">
          {brand}{model && model !== 'Annan' ? ` ${model}` : ''}
        </p>
        {compData && compData.specs.fuel_types.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {compData.specs.fuel_types.slice(0, 2).map(f => (
              <span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 capitalize">{f}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TradeWishStep({ sellCarLabel, initialData, onNext }: Props) {
  const [mode, setMode] = useState<'know' | 'help' | null>(initialData.mode);
  const [carBrand, setCarBrand] = useState(initialData.carBrand);
  const [carModel, setCarModel] = useState(initialData.carModel);
  const [carPrice, setCarPrice] = useState(initialData.carPrice);
  const [fuelType, setFuelType] = useState(initialData.fuelType);
  const [paymentType, setPaymentType] = useState(initialData.paymentType);
  const [targetCar, setTargetCar] = useState(initialData.targetCar);
  const [additionalRequests, setAdditionalRequests] = useState(initialData.additionalRequests);
  const [mustHaves, setMustHaves] = useState<string[]>(initialData.mustHaves);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const modelOptions = useMemo(() => (carBrand && carBrand !== 'Annan' ? CAR_BRANDS[carBrand] ?? [] : []), [carBrand]);

  const toggleMustHave = (val: string) => {
    setMustHaves(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : prev.length < 3 ? [...prev, val] : prev
    );
    setErrors(prev => { const n = { ...prev }; delete n.mustHaves; return n; });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!mode) {
      newErrors.mode = 'Välj ett alternativ';
      setErrors(newErrors);
      return;
    }

    if (mode === 'know') {
      if (!carBrand) newErrors.carBrand = 'Välj ett märke';
      if (!paymentType) newErrors.paymentType = 'Välj betalningssätt';
    } else {
      if (!targetCar && mustHaves.length === 0) newErrors.mustHaves = 'Välj minst en biltyp eller ett önskemål';
      if (!paymentType) newErrors.paymentType = 'Välj betalningssätt';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const mustHaveText = mustHaves.map(v => MUST_HAVES.find(m => m.value === v)?.label).filter(Boolean).join(', ');
    onNext({
      mode,
      carBrand,
      carModel,
      carPrice,
      fuelType,
      paymentType,
      targetCar,
      additionalRequests: [additionalRequests, mustHaveText ? `Viktigt: ${mustHaveText}` : ''].filter(Boolean).join('\n'),
      mustHaves,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Sell car summary pill */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="w-8 h-8 rounded-lg bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
          <Car className="w-4 h-4 text-[#0e6efe]" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Du säljer</p>
          <p className="text-[14px] font-bold text-slate-900 truncate">{sellCarLabel}</p>
        </div>
      </div>

      {/* Mode selection */}
      <div>
        <p className="text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">Vet du vilken bil du vill ha?</p>
        <p className="text-[13.5px] text-slate-500 mb-4">Vi hjälper dig hitta nästa bil och förhandlar köp.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setMode('know'); setErrors({}); }}
            className={`group flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all duration-150 text-left ${
              mode === 'know'
                ? 'border-[#0e6efe] bg-[#0e6efe]/[0.04]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              mode === 'know' ? 'bg-[#0e6efe]' : 'bg-slate-100 group-hover:bg-slate-200'
            }`}>
              <Car className={`w-5 h-5 ${mode === 'know' ? 'text-white' : 'text-slate-500'}`} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className={`text-[14px] font-semibold leading-tight ${mode === 'know' ? 'text-slate-900' : 'text-slate-700'}`}>
                Ja, jag vet vilken bil
              </p>
              <p className="text-[12.5px] text-slate-500 mt-1 leading-snug">
                Jag vet märke och modell — hjälp mig hitta och förhandla
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setMode('help'); setErrors({}); }}
            className={`group flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all duration-150 text-left ${
              mode === 'help'
                ? 'border-amber-400 bg-amber-50/60'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              mode === 'help' ? 'bg-amber-400' : 'bg-amber-50 group-hover:bg-amber-100'
            }`}>
              <Sparkles className={`w-5 h-5 ${mode === 'help' ? 'text-white' : 'text-amber-500'}`} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className={`text-[14px] font-semibold leading-tight ${mode === 'help' ? 'text-slate-900' : 'text-slate-700'}`}>
                Nej, behöver hjälp
              </p>
              <p className="text-[12.5px] text-slate-500 mt-1 leading-snug">
                Berätta vad du behöver — vi matchar dig med rätt bil
              </p>
            </div>
          </button>
        </div>
        {errors.mode && (
          <p className="mt-2 text-[13px] text-red-500 font-medium">{errors.mode}</p>
        )}
      </div>

      {/* Know mode — brand/model/price */}
      {mode === 'know' && (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div className="p-4 sm:p-5">
            <p className="text-[14px] font-semibold text-slate-800 mb-3">Märke och modell</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="relative">
                  <select
                    value={carBrand}
                    onChange={e => { setCarBrand(e.target.value); setCarModel(''); setErrors(p => { const n = {...p}; delete n.carBrand; return n; }); }}
                    className={`form-control appearance-none pr-10 ${errors.carBrand ? 'form-control-error' : ''}`}
                  >
                    <option value="">Välj märke</option>
                    {POPULAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <FieldError message={errors.carBrand} />
              </div>
              <div className="relative">
                <select
                  value={carModel}
                  onChange={e => setCarModel(e.target.value)}
                  disabled={!carBrand || carBrand === 'Annan'}
                  className="form-control appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{carBrand && carBrand !== 'Annan' ? 'Välj modell' : 'Välj märke först'}</option>
                  {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <CarImagePreview brand={carBrand} model={carModel} />
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[14px] font-semibold text-slate-800 mb-3">
              Max budget (kr)
              <span className="ml-2 text-[12px] font-normal text-slate-400">Frivilligt</span>
            </p>
            <div className="sm:max-w-xs">
              <input
                type="text"
                inputMode="numeric"
                value={carPrice}
                onChange={e => setCarPrice(e.target.value)}
                placeholder="T.ex. 350 000"
                className="form-control"
              />
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[14px] font-semibold text-slate-800 mb-3">Drivmedel <span className="text-[12px] font-normal text-slate-400">Frivilligt</span></p>
            <div className="flex flex-wrap gap-2">
              {FUEL_TYPES.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFuelType(fuelType === f.value ? '' : f.value)}
                  className={`px-3.5 h-8 rounded-full text-[13px] font-medium transition-all ${
                    fuelType === f.value ? 'bg-[#0e6efe] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[14px] font-semibold text-slate-800 mb-3">Hur vill du betala?</p>
            <div className="flex gap-2">
              {PAYMENT_TYPES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => { setPaymentType(p.value); setErrors(prev => { const n = {...prev}; delete n.paymentType; return n; }); }}
                  className={`flex-1 h-10 rounded-xl text-[14px] font-semibold border-2 transition-all ${
                    paymentType === p.value
                      ? 'bg-[#0e6efe] border-[#0e6efe] text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <FieldError message={errors.paymentType} />
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[14px] font-semibold text-slate-800 mb-3">
              Övriga önskemål <span className="text-[12px] font-normal text-slate-400">Frivilligt</span>
            </p>
            <textarea
              value={additionalRequests}
              onChange={e => setAdditionalRequests(e.target.value)}
              placeholder="T.ex. dragkrok, specifik färg, lågt miltal..."
              rows={3}
              maxLength={1000}
              className="form-control resize-none"
            />
          </div>
        </div>
      )}

      {/* Help mode — type + must-haves */}
      {mode === 'help' && (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-2.5 mb-4">
              <HelpCircle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[13.5px] text-slate-600 leading-snug">
                Berätta lite om vad du behöver — vi tar fram rätt alternativ och sköter förhandlingen.
              </p>
            </div>

            <p className="text-[14px] font-semibold text-slate-800 mb-3">Vilken typ av bil söker du?</p>
            <div className="flex flex-wrap gap-2">
              {CAR_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTargetCar(targetCar === t.value ? '' : t.value)}
                  className={`px-3.5 h-8 rounded-full text-[13px] font-medium transition-all ${
                    targetCar === t.value ? 'bg-[#0e6efe] text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[14px] font-semibold text-slate-800 mb-1">Vad är viktigast för dig?</p>
            <p className="text-[12.5px] text-slate-500 mb-3">Välj upp till 3 saker.</p>
            <div className="flex flex-wrap gap-2">
              {MUST_HAVES.map(m => {
                const selected = mustHaves.includes(m.value);
                const disabled = !selected && mustHaves.length >= 3;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => toggleMustHave(m.value)}
                    disabled={disabled}
                    className={`px-3.5 h-8 rounded-full text-[13px] font-medium transition-all ${
                      selected
                        ? 'bg-amber-400 text-white'
                        : disabled
                        ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            {mustHaves.length >= 3 && (
              <p className="mt-2 text-[12px] text-slate-400">Max 3 valda.</p>
            )}
            <FieldError message={errors.mustHaves} />
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[14px] font-semibold text-slate-800 mb-3">
              Max budget (kr) <span className="text-[12px] font-normal text-slate-400">Frivilligt</span>
            </p>
            <div className="sm:max-w-xs">
              <input
                type="text"
                inputMode="numeric"
                value={carPrice}
                onChange={e => setCarPrice(e.target.value)}
                placeholder="T.ex. 350 000"
                className="form-control"
              />
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[14px] font-semibold text-slate-800 mb-3">Drivmedel <span className="text-[12px] font-normal text-slate-400">Frivilligt</span></p>
            <div className="flex flex-wrap gap-2">
              {FUEL_TYPES.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFuelType(fuelType === f.value ? '' : f.value)}
                  className={`px-3.5 h-8 rounded-full text-[13px] font-medium transition-all ${
                    fuelType === f.value ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[14px] font-semibold text-slate-800 mb-3">Hur vill du betala?</p>
            <div className="flex gap-2">
              {PAYMENT_TYPES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => { setPaymentType(p.value); setErrors(prev => { const n = {...prev}; delete n.paymentType; return n; }); }}
                  className={`flex-1 h-10 rounded-xl text-[14px] font-semibold border-2 transition-all ${
                    paymentType === p.value
                      ? 'bg-amber-400 border-amber-400 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <FieldError message={errors.paymentType} />
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[14px] font-semibold text-slate-800 mb-3">
              Berätta mer <span className="text-[12px] font-normal text-slate-400">Frivilligt</span>
            </p>
            <textarea
              value={additionalRequests}
              onChange={e => setAdditionalRequests(e.target.value)}
              placeholder="T.ex. familj med barn, pendlar 3 mil/dag, behöver dragkrok..."
              rows={3}
              maxLength={1000}
              className="form-control resize-none"
            />
          </div>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          className="w-full h-12 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-[15px] rounded-full transition shadow-sm"
        >
          Nästa
        </button>
      </div>
    </form>
  );
}
