import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Loader2, AlertCircle, Repeat, Check } from 'lucide-react';
import FieldError from './FieldError';
import { CAR_BRANDS, POPULAR_BRANDS } from '../../lib/carBrands';
import RegInput from '../RegInput';
import { useVehicleLookup } from '../../lib/useVehicleLookup';

const SKICK_OPTIONS = [
  { value: 'mycket_bra', label: 'Mycket bra', desc: 'Inga synliga defekter' },
  { value: 'bra',        label: 'Bra',        desc: 'Mindre brister, välskött' },
  { value: 'okej',       label: 'Okej',       desc: 'Normalt slitage för åldern' },
  { value: 'slitet',     label: 'Slitet',     desc: 'Tydligt slitage, behöver service' },
  { value: 'skadat',     label: 'Skadat',     desc: 'Skador som påverkar funktion/utseende' },
] as const;

const MILTAL_INTERVALS: { value: string; label: string; mid: number }[] = (() => {
  const out: { value: string; label: string; mid: number }[] = [];
  for (let start = 0; start < 20000; start += 500) {
    const end = start + 499;
    out.push({ value: `${start}-${end}`, label: `${start} – ${end} mil`, mid: Math.round((start + end) / 2) });
  }
  out.push({ value: '20000+', label: '20 000+ mil', mid: 20000 });
  return out;
})();

function intervalForMiltal(mil: number): string {
  if (mil >= 20000) return '20000+';
  if (mil <= 0) return '';
  const start = Math.floor(mil / 500) * 500;
  return `${start}-${start + 499}`;
}

interface CarConditionStepProps {
  regnummer: string;
  initialMarke?: string;
  initialModell?: string;
  initialAr?: number | null;
  initialMiltal: number;
  initialSkick: string;
  initialSkickKommentar?: string;
  initialMejl?: string;
  showTradeIn?: boolean;
  onNext: (
    miltal: number,
    skick: string,
    regnummer: string | undefined,
    mejl: string,
    skickKommentar: string,
    marke: string,
    modell: string,
    ar: number,
    wantsTradeIn?: boolean,
  ) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS: number[] = (() => {
  const years: number[] = [];
  for (let y = CURRENT_YEAR; y >= 1980; y--) years.push(y);
  return years;
})();

export default function CarConditionStep({
  regnummer,
  initialMarke = '',
  initialModell = '',
  initialAr = null,
  initialMiltal,
  initialSkick,
  initialSkickKommentar = '',
  initialMejl = '',
  showTradeIn = false,
  onNext,
}: CarConditionStepProps) {
  const [reg, setReg] = useState(regnummer.trim().toUpperCase().replace(/\s/g, ''));
  const [marke, setMarke] = useState(initialMarke);
  const [modell, setModell] = useState(initialModell);
  const [ar, setAr] = useState<string>(initialAr ? String(initialAr) : '');
  const [miltalInterval, setMiltalInterval] = useState(intervalForMiltal(initialMiltal));
  const [mejl, setMejl] = useState(initialMejl);
  const [skick, setSkick] = useState(initialSkick);
  const [skickKommentar, setSkickKommentar] = useState(initialSkickKommentar);
  const [wantsTradeIn, setWantsTradeIn] = useState(false);
  const [errors, setErrors] = useState<{ reg?: string; marke?: string; modell?: string; ar?: string; miltal?: string; mejl?: string; skick?: string }>({});
  const [autoFilled, setAutoFilled] = useState(false);
  const editableReg = !regnummer;

  const lookup = useVehicleLookup(reg);

  useEffect(() => {
    if (lookup.status !== 'found') return;
    const { data } = lookup;
    if (data.marke) setMarke(data.marke);
    if (data.modell) setModell(data.modell);
    if (data.ar) setAr(String(data.ar));
    if (data.miltal && data.miltal > 0) setMiltalInterval(intervalForMiltal(data.miltal));
    setAutoFilled(true);
    setErrors((prev) => ({ ...prev, marke: undefined, modell: undefined, ar: undefined }));
  }, [lookup.status]);

  const modelOptions = useMemo(() => CAR_BRANDS[marke] ?? [], [marke]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    const regClean = reg.trim().toUpperCase().replace(/\s/g, '');
    if (editableReg && !/^[A-Z0-9]{6}$/.test(regClean)) {
      newErrors.reg = 'Ange ett giltigt regnummer';
    }

    const chosen = MILTAL_INTERVALS.find((i) => i.value === miltalInterval);
    if (!chosen) {
      newErrors.miltal = 'Välj ett miltalsintervall';
    }

    if (!marke) newErrors.marke = 'Välj märke';
    if (!modell) newErrors.modell = 'Välj modell';

    const arNum = parseInt(ar, 10);
    if (!ar || Number.isNaN(arNum) || arNum < 1980 || arNum > CURRENT_YEAR) {
      newErrors.ar = 'Välj årsmodell';
    }

    if (!mejl.trim()) {
      newErrors.mejl = 'Ange e-postadress';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mejl.trim())) {
      newErrors.mejl = 'Ogiltig e-postadress';
    }

    if (!skick) newErrors.skick = 'Välj ett skick';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext(chosen!.mid, skick, regClean, mejl.trim(), skickKommentar.trim(), marke, modell, arNum, showTradeIn ? wantsTradeIn : undefined);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="divide-y divide-slate-200">
      {/* Regnummer */}
      <div className="pb-6 sm:pb-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
          Registreringsnummer
        </label>
        {editableReg ? (
          <div className="w-full sm:max-w-xs">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <RegInput
                  value={reg}
                  onChange={(v) => {
                    setReg(v);
                    setAutoFilled(false);
                    setErrors((prev) => ({ ...prev, reg: undefined }));
                  }}
                  error={!!errors.reg}
                />
              </div>
              {lookup.status === 'loading' && (
                <Loader2 className="w-5 h-5 text-[#0e6efe] animate-spin shrink-0" />
              )}
            </div>
            {lookup.status === 'found' && autoFilled && (
              <div className="mt-2 flex items-center gap-1.5 text-emerald-600 text-[13px] font-medium">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Fordonsuppgifter hämtade automatiskt
              </div>
            )}
            {lookup.status === 'not_found' && (
              <div className="mt-2 flex items-center gap-1.5 text-amber-600 text-[13px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Bilen hittades inte — fyll i uppgifterna manuellt
              </div>
            )}
            {lookup.status === 'error' && (
              <div className="mt-2 flex items-center gap-1.5 text-slate-500 text-[13px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Kunde inte hämta uppgifter — fyll i manuellt
              </div>
            )}
            <FieldError message={errors.reg} />
          </div>
        ) : (
          <div className="inline-flex items-center h-10 px-4 bg-[#0e6efe]/10 text-[#0e6efe] font-bold tracking-widest text-[15px] rounded-md">
            {regnummer}
          </div>
        )}
      </div>

      {/* Märke och modell */}
      <div className="py-6 sm:py-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
          Vilken bil är det?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:max-w-md">
          <div>
            <span className="block text-[13px] font-semibold text-slate-600 mb-1.5">Märke</span>
            <select
              value={marke}
              disabled={lookup.status === 'loading'}
              onChange={(e) => {
                setMarke(e.target.value);
                setModell('');
                setErrors((prev) => ({ ...prev, marke: undefined, modell: undefined }));
              }}
              className={`form-control ${errors.marke ? 'form-control-error' : ''} disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
            >
              <option value="">Välj märke</option>
              {POPULAR_BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <FieldError message={errors.marke} />
          </div>
          <div>
            <span className="block text-[13px] font-semibold text-slate-600 mb-1.5">Modell</span>
            <input
              type="text"
              list={marke ? `models-${marke}` : undefined}
              value={modell}
              onChange={(e) => {
                setModell(e.target.value);
                setErrors((prev) => ({ ...prev, modell: undefined }));
              }}
              disabled={!marke || lookup.status === 'loading'}
              placeholder={marke ? 'T.ex. 530, XC60, A4...' : 'Välj märke först'}
              autoComplete="off"
              className={`form-control ${errors.modell ? 'form-control-error' : ''} disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
            />
            {marke && (
              <datalist id={`models-${marke}`}>
                {modelOptions.map((m) => <option key={m} value={m} />)}
              </datalist>
            )}
            {marke && !errors.modell && (
              <p className="mt-1.5 text-[12px] text-slate-500">
                Hittar du inte din modell? Skriv den själv.
              </p>
            )}
            <FieldError message={errors.modell} />
          </div>
        </div>
      </div>

      {/* Miltal */}
      <div className="py-6 sm:py-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
          Hur många mil har bilen gått?
        </label>
        <div className="w-full sm:max-w-xs">
          <select
            value={miltalInterval}
            onChange={(e) => {
              setMiltalInterval(e.target.value);
              setErrors((prev) => ({ ...prev, miltal: undefined }));
            }}
            className={`form-control ${errors.miltal ? 'form-control-error' : ''}`}
          >
            <option value="">Välj miltal</option>
            {MILTAL_INTERVALS.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </div>
        <FieldError message={errors.miltal} />
      </div>

      {/* Årsmodell */}
      <div className="py-6 sm:py-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
          Vilken årsmodell är bilen?
        </label>
        <div className="w-full sm:max-w-xs">
          <select
            value={ar}
            disabled={lookup.status === 'loading'}
            onChange={(e) => {
              setAr(e.target.value);
              setErrors((prev) => ({ ...prev, ar: undefined }));
            }}
            className={`form-control ${errors.ar ? 'form-control-error' : ''} disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
          >
            <option value="">Välj årsmodell</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <FieldError message={errors.ar} />
      </div>

      {/* Byta bil — checkbox */}
      {showTradeIn && (
        <div className="py-6 sm:py-7">
          <button
            type="button"
            onClick={() => setWantsTradeIn(v => !v)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-150 text-left ${
              wantsTradeIn
                ? 'border-[#0e6efe] bg-[#0e6efe]/[0.04]'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              wantsTradeIn ? 'bg-[#0e6efe]' : 'bg-slate-100'
            }`}>
              <Repeat className={`w-5 h-5 ${wantsTradeIn ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[15px] font-semibold ${wantsTradeIn ? 'text-slate-900' : 'text-slate-700'}`}>
                Jag vill också byta bil
              </p>
              <p className="text-[12.5px] text-slate-500 mt-0.5">
                Vi hjälper dig hitta nästa bil och förhandlar köp
              </p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              wantsTradeIn ? 'bg-[#0e6efe] border-[#0e6efe]' : 'border-slate-300'
            }`}>
              {wantsTradeIn && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </div>
          </button>
        </div>
      )}

      {/* E-post */}
      <div className="py-6 sm:py-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
          E-postadress
        </label>
        <div className="w-full sm:max-w-xs">
          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            value={mejl}
            onChange={(e) => {
              setMejl(e.target.value);
              setErrors((prev) => ({ ...prev, mejl: undefined }));
            }}
            placeholder="din@mejl.se"
            className={`form-control ${errors.mejl ? 'form-control-error' : ''}`}
          />
        </div>
        <FieldError message={errors.mejl} />
      </div>

      {/* Skick */}
      <div className="py-6 sm:py-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
          Vilket skick är bilen i?
        </label>
        <p className="text-sm text-slate-500 mb-4">
          Välj det alternativ som bäst beskriver bilen.
        </p>
        <div className="flex flex-wrap gap-2">
          {SKICK_OPTIONS.map((option) => {
            const selected = skick === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSkick(option.value);
                  setErrors((prev) => ({ ...prev, skick: undefined }));
                }}
                className={`px-4 sm:px-5 h-10 rounded-full text-[14px] font-medium transition-all ${
                  selected
                    ? 'bg-[#0e6efe] text-white ring-1 ring-inset ring-[#0e6efe] shadow-sm'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {skick && (
          <p className="text-sm text-slate-500 mt-3">
            {SKICK_OPTIONS.find((o) => o.value === skick)?.desc}
          </p>
        )}
        <FieldError message={errors.skick} />
      </div>

      {/* Kommentar om skicket (frivilligt) */}
      <div className="py-6 sm:py-7">
        <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-1">
          Vill du beskriva skicket närmare?
        </label>
        <p className="text-sm text-slate-500 mb-3">
          Frivilligt — berätta t.ex. om servicehistorik, skador eller något unikt.
        </p>
        <textarea
          value={skickKommentar}
          onChange={(e) => setSkickKommentar(e.target.value)}
          placeholder="Lägg till information om skicket, utrustning eller prisförväntningar"
          rows={4}
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
