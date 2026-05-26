import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Car, Check, Fuel, Loader2, Palette, Repeat, Sparkles } from 'lucide-react';
import FieldError from './FieldError';
import { CAR_BRANDS, POPULAR_BRANDS } from '../../lib/carBrands';
import RegInput from '../RegInput';
import { useVehicleLookup, VehicleData } from '../../lib/useVehicleLookup';

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

function fuelLabel(bransle: string): string {
  const map: Record<string, string> = {
    bensin: 'Bensin', diesel: 'Diesel', el: 'El', elhybrid: 'Elhybrid',
    laddhybrid: 'Laddhybrid', gas: 'Gas', etanol: 'Etanol',
  };
  return map[bransle?.toLowerCase()] ?? bransle ?? '';
}

interface VehicleFoundCardProps {
  regnummer: string;
  data: VehicleData;
}

function VehicleFoundCard({ regnummer, data }: VehicleFoundCardProps) {
  const [visible, setVisible] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 30);
    const t2 = setTimeout(() => setRevealed(true), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const chips: { icon: React.ReactNode; label: string }[] = [
    data.bransle ? { icon: <Fuel className="w-3.5 h-3.5" />, label: fuelLabel(data.bransle) } : null,
    data.farg ? { icon: <Palette className="w-3.5 h-3.5" />, label: data.farg } : null,
    data.miltal && data.miltal > 0 ? { icon: null, label: `${data.miltal.toLocaleString('sv-SE')} mil` } : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[];

  return (
    <div
      className={`mt-4 rounded-2xl overflow-hidden border transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      } border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm`}
    >
      {/* Top bar */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2.5 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-white/90 shrink-0" />
        <span className="text-white text-[13px] font-semibold tracking-wide">
          Fordon identifierat
        </span>
        <span className="ml-auto text-white/80 font-mono text-[12px] tracking-widest font-bold">
          {regnummer}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        <div
          className={`transition-all duration-400 delay-100 ${
            revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {/* Car name */}
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-[19px] font-bold text-slate-900 leading-tight">
              {[data.marke, data.modell, data.variant].filter(Boolean).join(' ')}
            </h3>
            {data.ar && (
              <span className="text-[14px] text-slate-500 font-medium">{data.ar}</span>
            )}
          </div>

          {/* Chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border border-slate-200 text-[12px] font-medium text-slate-600 shadow-sm"
                >
                  {chip.icon}
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-medium">
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
          Uppgifter hämtade automatiskt från fordonsregistret
        </div>
      </div>
    </div>
  );
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
  const [foundData, setFoundData] = useState<VehicleData | null>(null);
  const prevReg = useRef('');
  const editableReg = !regnummer;

  const lookup = useVehicleLookup(reg);

  useEffect(() => {
    if (lookup.status !== 'found') {
      if (lookup.status === 'idle' || lookup.status === 'loading') {
        if (reg !== prevReg.current) setFoundData(null);
      }
      return;
    }
    prevReg.current = reg;
    const { data } = lookup;
    setFoundData(data);
    if (data.marke) setMarke(data.marke);
    if (data.modell) setModell(data.modell);
    if (data.ar) setAr(String(data.ar));
    if (data.miltal && data.miltal > 0) setMiltalInterval(intervalForMiltal(data.miltal));
    setErrors((prev) => ({ ...prev, marke: undefined, modell: undefined, ar: undefined }));
  }, [lookup.status, reg]);

  const modelOptions = useMemo(() => CAR_BRANDS[marke] ?? [], [marke]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    const regClean = reg.trim().toUpperCase().replace(/\s/g, '');
    if (editableReg && !/^[A-Z0-9]{6}$/.test(regClean)) {
      newErrors.reg = 'Ange ett giltigt regnummer';
    }

    const chosen = MILTAL_INTERVALS.find((i) => i.value === miltalInterval);
    if (!chosen) newErrors.miltal = 'Välj ett miltalsintervall';
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
                    if (v !== prevReg.current) setFoundData(null);
                    setErrors((prev) => ({ ...prev, reg: undefined }));
                  }}
                  error={!!errors.reg}
                />
              </div>
              {lookup.status === 'loading' && (
                <div className="flex items-center gap-1.5 text-[#0e6efe] text-[13px] shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium">Hämtar...</span>
                </div>
              )}
            </div>

            {/* Vehicle found card */}
            {foundData && lookup.status === 'found' && (
              <VehicleFoundCard regnummer={reg} data={foundData} />
            )}

            {lookup.status === 'not_found' && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[13px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Bilen hittades inte — fyll i uppgifterna manuellt
              </div>
            )}
            {lookup.status === 'error' && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[13px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Kunde inte hämta uppgifter — fyll i manuellt
              </div>
            )}
            <FieldError message={errors.reg} />
          </div>
        ) : (
          <div>
            <div className="inline-flex items-center h-10 px-4 bg-[#0e6efe]/10 text-[#0e6efe] font-bold tracking-widest text-[15px] rounded-md gap-2">
              {regnummer}
              {lookup.status === 'loading' && (
                <Loader2 className="w-4 h-4 animate-spin opacity-60" />
              )}
            </div>
            {foundData && lookup.status === 'found' && (
              <VehicleFoundCard regnummer={reg} data={foundData} />
            )}
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
