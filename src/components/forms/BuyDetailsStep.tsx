import { useState, useMemo } from 'react';
import { ChevronDown, Sparkles, Search } from 'lucide-react';
import type { BuyTrack } from './BuyTrackStep';
import FieldError from './FieldError';
import RegInput from '../RegInput';
import FinancingCalc from './FinancingCalc';
import { CAR_BRANDS, POPULAR_BRANDS } from '../../lib/carBrands';
import { findComparisonCarByMakeModel } from '../../lib/comparison/lookup';

const BUYING_STAGES = [
  { value: 'just_started', label: 'Precis börjat kolla' },
  { value: 'comparing', label: 'Jämför alternativ' },
  { value: 'ready_to_buy', label: 'Redo att köpa' },
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

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2004 }, (_, i) => String(currentYear - i));

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
  carPrice: string;
  yearFrom: string;
  yearTo: string;
  maxMiltal: string;
}

interface BuyDetailsStepProps {
  track: BuyTrack;
  initialData: BuyDetailsData;
  initialBil?: string;
  lockedCar?: string;
  onNext: (data: BuyDetailsData) => void;
  onExplore?: () => void;
  onQuiz?: () => void;
}

function parsePriceInput(raw: string): number {
  const clean = raw.replace(/\s/g, '').replace(/,/g, '.');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

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

function KnowDetailsStep({ initialData, onNext }: { initialData: BuyDetailsData; onNext: (data: BuyDetailsData) => void }) {
  const [d, setD] = useState<BuyDetailsData>({ ...initialData });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof BuyDetailsData, value: string) => {
    setD(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'carBrand') next.carModel = '';
      return next;
    });
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const models = d.carBrand ? (CAR_BRANDS[d.carBrand] ?? []) : [];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!d.carBrand) e.carBrand = 'Välj ett märke';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onNext(d);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
          Märke och modell
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={d.carBrand}
              onChange={e => set('carBrand', e.target.value)}
              className={`form-control appearance-none pr-10 ${errors.carBrand ? 'form-control-error' : ''}`}
            >
              <option value="">Välj märke</option>
              {POPULAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            {errors.carBrand && <FieldError message={errors.carBrand} />}
          </div>
          <div className="relative">
            <select
              value={d.carModel}
              onChange={e => set('carModel', e.target.value)}
              disabled={!d.carBrand}
              className="form-control appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{d.carBrand ? 'Välj modell' : 'Välj märke först'}</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
          Max budget (kr)
          <span className="ml-2 text-[13px] font-normal text-slate-400">Frivilligt</span>
        </label>
        <p className="text-[13.5px] text-slate-500 mb-3">Totalpris för bilen.</p>
        <div className="relative sm:max-w-xs">
          <input
            type="text"
            inputMode="numeric"
            value={d.carPrice}
            onChange={e => set('carPrice', e.target.value)}
            placeholder="T.ex. 350 000"
            className="form-control"
          />
        </div>
      </div>

      <div>
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
          Drivmedel
          <span className="ml-2 text-[13px] font-normal text-slate-400">Frivilligt</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {FUEL_TYPES.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => set('fuelType', d.fuelType === f.value ? '' : f.value)}
              className={`px-4 h-9 rounded-full text-[13.5px] font-medium transition-all ${
                d.fuelType === f.value
                  ? 'bg-[#0e6efe] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
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

function ExploreDetailsStep({ initialData, onNext }: { initialData: BuyDetailsData; onNext: (data: BuyDetailsData) => void }) {
  const [d, setD] = useState<BuyDetailsData>({ ...initialData });
  const [mustHaves, setMustHaves] = useState<string[]>([]);

  const set = (key: keyof BuyDetailsData, value: string) => {
    setD(prev => ({ ...prev, [key]: value }));
  };

  const toggleMustHave = (val: string) => {
    setMustHaves(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : prev.length < 3 ? [...prev, val] : prev
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mustHaveText = mustHaves.map(v => MUST_HAVES.find(m => m.value === v)?.label).filter(Boolean).join(', ');
    onNext({
      ...d,
      additionalRequests: [d.additionalRequests, mustHaveText ? `Viktigt: ${mustHaveText}` : ''].filter(Boolean).join('\n'),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      <div>
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
          Vilken typ av bil söker du?
        </label>
        <div className="flex flex-wrap gap-2">
          {CAR_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('targetCar', d.targetCar === t.value ? '' : t.value)}
              className={`px-4 h-9 rounded-full text-[13.5px] font-medium transition-all ${
                d.targetCar === t.value
                  ? 'bg-[#0e6efe] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
          Max budget (kr)
          <span className="ml-2 text-[13px] font-normal text-slate-400">Frivilligt</span>
        </label>
        <p className="text-[13.5px] text-slate-500 mb-3">Totalpris för bilen.</p>
        <div className="sm:max-w-xs">
          <input
            type="text"
            inputMode="numeric"
            value={d.carPrice}
            onChange={e => set('carPrice', e.target.value)}
            placeholder="T.ex. 350 000"
            className="form-control"
          />
        </div>
      </div>

      <div>
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
          Vad är viktigast för dig?
        </label>
        <p className="text-[13.5px] text-slate-500 mb-3">Välj upp till 3 saker.</p>
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
                className={`px-4 h-9 rounded-full text-[13.5px] font-medium transition-all ${
                  selected
                    ? 'bg-[#0e6efe] text-white shadow-sm'
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
          <p className="mt-2 text-[12.5px] text-slate-500">Max 3 valda. Avmarkera ett för att ändra.</p>
        )}
      </div>

      <div className="pt-1 flex justify-end">
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

export default function BuyDetailsStep({ track, initialData, initialBil, lockedCar, onNext, onExplore, onQuiz }: BuyDetailsStepProps) {
  if (track === 'know') return <KnowDetailsStep initialData={initialData} onNext={onNext} />;
  if (track === 'explore') return <ExploreDetailsStep initialData={initialData} onNext={onNext} />;

  const [d, setD] = useState<BuyDetailsData>({
    ...initialData,
    carModel: initialData.carModel || initialBil || '',
    carBrand: initialData.carBrand || '',
    paymentType: initialData.paymentType || '',
    carPrice: initialData.carPrice || '',
    yearFrom: initialData.yearFrom || '',
    yearTo: initialData.yearTo || '',
    maxMiltal: initialData.maxMiltal || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof BuyDetailsData, value: string) => {
    setD(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'carBrand') next.carModel = '';
      if (key === 'paymentType' && value === 'cash') next.desiredMonthlyCost = '';
      return next;
    });
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const models = d.carBrand ? (CAR_BRANDS[d.carBrand] ?? []) : [];
  const carPriceNum = parsePriceInput(d.carPrice);

  const lookupBrand = d.carBrand || (lockedCar ? lockedCar.split(' ')[0] : '');
  const lookupModel = d.carModel || (lockedCar ? lockedCar.split(' ').slice(1).join(' ') : '');
  const priceHint = useMemo(() => {
    if (!lookupBrand || !lookupModel) return null;
    const found = findComparisonCarByMakeModel(lookupBrand, lookupModel);
    if (!found) return null;
    const { used_from_sek, new_from_sek } = found.pricing;
    if (!used_from_sek && !new_from_sek) return null;
    const fmt = (n: number) => Math.round(n / 1000) * 1000;
    return { used: used_from_sek ? fmt(used_from_sek) : null, newFrom: new_from_sek ? fmt(new_from_sek) : null };
  }, [lookupBrand, lookupModel]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!d.buyingStage) e.buyingStage = 'Välj var du är i processen';
    if (!d.paymentType) e.paymentType = 'Välj hur du vill betala';
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

      {/* ── FOUND track ── */}
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

          {!lockedCar && (
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
          )}

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Bilens pris (kr)
              <span className="ml-2 text-[13px] font-normal text-slate-400">Frivilligt</span>
            </label>
            <p className="text-sm text-slate-500 mb-3">
              Används för att visa ett finansieringsexempel.
            </p>
            <div className="w-full sm:max-w-xs">
              <input
                type="text"
                inputMode="numeric"
                value={d.carPrice}
                onChange={e => set('carPrice', e.target.value)}
                placeholder="T.ex. 350 000"
                className="form-control"
              />
            </div>
            {priceHint && (
              <div className="mt-3 flex flex-wrap gap-2">
                {priceHint.used && (
                  <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-slate-100 text-[12.5px] text-slate-600">
                    <span className="font-medium text-slate-800">Beg.</span> från ~{priceHint.used.toLocaleString('sv-SE')} kr
                  </span>
                )}
                {priceHint.newFrom && (
                  <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-slate-100 text-[12.5px] text-slate-600">
                    <span className="font-medium text-slate-800">Ny</span> från ~{priceHint.newFrom.toLocaleString('sv-SE')} kr
                  </span>
                )}
              </div>
            )}
            {carPriceNum >= 50000 && <FinancingCalc carPrice={carPriceNum} />}
          </div>
        </>
      )}

      {/* ── SEARCHING – locked car (came from a specific car card) ── */}
      {track === 'searching' && lockedCar && (
        <>
          <div className="pb-6 sm:pb-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Max miltal
            </label>
            <p className="text-sm text-slate-500 mb-3">
              Hur många mil får bilen max ha gått?
            </p>
            <div className="w-full sm:max-w-xs relative">
              <input
                type="text"
                inputMode="numeric"
                value={d.maxMiltal}
                onChange={e => set('maxMiltal', e.target.value)}
                placeholder="T.ex. 5 000"
                className="form-control pr-14"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 pointer-events-none">mil</span>
            </div>
          </div>

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
              Årsmodell
            </label>
            <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Från</p>
                <div className="relative">
                  <select
                    value={d.yearFrom}
                    onChange={e => set('yearFrom', e.target.value)}
                    className="form-control appearance-none pr-7 text-[13px] sm:text-[14px]"
                  >
                    <option value="">Välj år</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Till</p>
                <div className="relative">
                  <select
                    value={d.yearTo}
                    onChange={e => set('yearTo', e.target.value)}
                    className="form-control appearance-none pr-7 text-[13px] sm:text-[14px]"
                  >
                    <option value="">Välj år</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Max budget (kr)
              <span className="ml-2 text-[13px] font-normal text-slate-400">Frivilligt</span>
            </label>
            <p className="text-sm text-slate-500 mb-3">Totalpris för bilen.</p>
            <div className="w-full sm:max-w-xs">
              <input
                type="text"
                inputMode="numeric"
                value={d.carPrice}
                onChange={e => set('carPrice', e.target.value)}
                placeholder="T.ex. 350 000"
                className="form-control"
              />
            </div>
            {priceHint && (
              <div className="mt-3 flex flex-wrap gap-2">
                {priceHint.used && (
                  <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-slate-100 text-[12.5px] text-slate-600">
                    <span className="font-medium text-slate-800">Beg.</span> från ~{priceHint.used.toLocaleString('sv-SE')} kr
                  </span>
                )}
                {priceHint.newFrom && (
                  <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-slate-100 text-[12.5px] text-slate-600">
                    <span className="font-medium text-slate-800">Ny</span> från ~{priceHint.newFrom.toLocaleString('sv-SE')} kr
                  </span>
                )}
              </div>
            )}
            {carPriceNum >= 50000 && <FinancingCalc carPrice={carPriceNum} />}
          </div>
        </>
      )}

      {/* ── SEARCHING – open (no locked car) ── */}
      {track === 'searching' && !lockedCar && (
        <>
          {(onExplore || onQuiz) && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[13px] font-semibold text-slate-700 mb-3">Inte redo att fylla i? Du kan också:</p>
              <div className="flex flex-col gap-2">
                {onExplore && (
                  <button
                    type="button"
                    onClick={onExplore}
                    className="flex items-center gap-3 px-4 h-11 rounded-xl bg-white border border-slate-200 hover:border-[#0e6efe] hover:bg-[#0e6efe]/5 transition-all text-left group"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0e6efe]/10 group-hover:bg-[#0e6efe]/20 flex items-center justify-center shrink-0 transition-colors">
                      <Search className="w-3.5 h-3.5 text-[#0e6efe]" strokeWidth={2.2} />
                    </div>
                    <span className="text-[13.5px] font-medium text-slate-800">Utforska och jämför bilar</span>
                  </button>
                )}
                {onQuiz && (
                  <button
                    type="button"
                    onClick={onQuiz}
                    className="flex items-center gap-3 px-4 h-11 rounded-xl bg-white border border-slate-200 hover:border-[#0e6efe] hover:bg-[#0e6efe]/5 transition-all text-left group"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#0e6efe]/10 group-hover:bg-[#0e6efe]/20 flex items-center justify-center shrink-0 transition-colors">
                      <Sparkles className="w-3.5 h-3.5 text-[#0e6efe]" strokeWidth={2.2} />
                    </div>
                    <span className="text-[13.5px] font-medium text-slate-800">Testa bilmatch — hitta r&auml;tt modell</span>
                  </button>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] text-slate-400 font-medium">eller fortsätt nedan</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </div>
          )}

          <div className="pb-6 sm:pb-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Vilket märke och modell?
            </label>
            <p className="text-sm text-slate-500 mb-3">
              Välj märke och modell, eller använd bilmatch om du är osäker.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
            <div className="flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => { set('carBrand', 'Vet ej'); set('carModel', 'Vet ej'); }}
                className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-medium transition-all border ${
                  d.carBrand === 'Vet ej'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                }`}
              >
                Vet ej
              </button>
              {onQuiz && (
                <button
                  type="button"
                  onClick={onQuiz}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-medium bg-[#0e6efe]/10 text-[#0e6efe] hover:bg-[#0e6efe]/20 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Hitta med bilmatch
                </button>
              )}
            </div>
          </div>

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Max miltal
            </label>
            <p className="text-sm text-slate-500 mb-3">
              Hur många mil får bilen max ha gått?
            </p>
            <div className="w-full sm:max-w-xs relative">
              <input
                type="text"
                inputMode="numeric"
                value={d.maxMiltal}
                onChange={e => set('maxMiltal', e.target.value)}
                placeholder="T.ex. 5 000"
                className="form-control pr-14"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 pointer-events-none">mil</span>
            </div>
          </div>

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
              Årsmodell
            </label>
            <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Från</p>
                <div className="relative">
                  <select
                    value={d.yearFrom}
                    onChange={e => set('yearFrom', e.target.value)}
                    className="form-control appearance-none pr-7 text-[13px] sm:text-[14px]"
                  >
                    <option value="">Välj år</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Till</p>
                <div className="relative">
                  <select
                    value={d.yearTo}
                    onChange={e => set('yearTo', e.target.value)}
                    className="form-control appearance-none pr-7 text-[13px] sm:text-[14px]"
                  >
                    <option value="">Välj år</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Max budget (kr)
              <span className="ml-2 text-[13px] font-normal text-slate-400">Frivilligt</span>
            </label>
            <p className="text-sm text-slate-500 mb-3">Totalpris för bilen.</p>
            <div className="w-full sm:max-w-xs">
              <input
                type="text"
                inputMode="numeric"
                value={d.carPrice}
                onChange={e => set('carPrice', e.target.value)}
                placeholder="T.ex. 350 000"
                className="form-control"
              />
            </div>
            {priceHint && (
              <div className="mt-3 flex flex-wrap gap-2">
                {priceHint.used && (
                  <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-slate-100 text-[12.5px] text-slate-600">
                    <span className="font-medium text-slate-800">Beg.</span> från ~{priceHint.used.toLocaleString('sv-SE')} kr
                  </span>
                )}
                {priceHint.newFrom && (
                  <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-slate-100 text-[12.5px] text-slate-600">
                    <span className="font-medium text-slate-800">Ny</span> från ~{priceHint.newFrom.toLocaleString('sv-SE')} kr
                  </span>
                )}
              </div>
            )}
            {carPriceNum >= 50000 && <FinancingCalc carPrice={carPriceNum} />}
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

      {/* ── TRADE track ── */}
      {track === 'trade' && (
        <>
          <div className="pb-6 sm:pb-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Regnummer på din nuvarande bil
            </label>
            <p className="text-sm text-slate-500 mb-3">Bilen du vill byta in.</p>
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
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">Miltal</label>
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
            {lockedCar ? (
              <div className="flex items-center h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-[14px]">
                {lockedCar}
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          <div className="py-6 sm:py-7">
            <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
              Budget för nästa bil (kr)
              <span className="ml-2 text-[13px] font-normal text-slate-400">Frivilligt</span>
            </label>
            <p className="text-sm text-slate-500 mb-3">
              Totalpris eller finansiering — vi hjälper dig hitta rätt upplägg.
            </p>
            <div className="w-full sm:max-w-xs">
              <input
                type="text"
                inputMode="numeric"
                value={d.carPrice}
                onChange={e => set('carPrice', e.target.value)}
                placeholder="T.ex. 350 000"
                className="form-control"
              />
            </div>
            {priceHint && (
              <div className="mt-3 flex flex-wrap gap-2">
                {priceHint.used && (
                  <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-slate-100 text-[12.5px] text-slate-600">
                    <span className="font-medium text-slate-800">Beg.</span> från ~{priceHint.used.toLocaleString('sv-SE')} kr
                  </span>
                )}
                {priceHint.newFrom && (
                  <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-slate-100 text-[12.5px] text-slate-600">
                    <span className="font-medium text-slate-800">Ny</span> från ~{priceHint.newFrom.toLocaleString('sv-SE')} kr
                  </span>
                )}
              </div>
            )}
            {carPriceNum >= 50000 && <FinancingCalc carPrice={carPriceNum} />}
          </div>
        </>
      )}

      {/* ── Var i processen ── */}
      <div className="py-6 sm:py-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
          Var i processen är du?
        </label>
        <p className="text-sm text-slate-500 mb-4">
          Välj det alternativ som bäst beskriver dig.
        </p>
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
          {BUYING_STAGES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => set('buyingStage', s.value)}
              className={`w-full sm:w-auto px-4 sm:px-5 h-10 rounded-full text-[14px] font-medium transition-all text-left sm:text-center ${
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

      {/* ── Betalningssätt ── */}
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

      {/* ── Övriga önskemål ── */}
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
