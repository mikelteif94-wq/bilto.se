import { useEffect, useState } from 'react';
import { Phone, ArrowRight, Repeat, Loader as Loader2, ChevronDown } from 'lucide-react';
import { useVehicleLookup, type VehicleData } from '../../lib/useVehicleLookup';

interface TrackChoiceStepProps {
  regnummer: string;
  miltal: number;
  onChoose: (track: 'auction') => void;
  onGuidance: () => void;
  onNavigateTrade?: (miltal: number) => void;
  onVehicleFound?: (data: VehicleData) => void;
}

const MILTAL_OPTIONS = [
  { value: 0,     label: 'Välj miltal' },
  { value: 500,   label: '0–999 mil' },
  { value: 1500,  label: '1 000–1 999 mil' },
  { value: 2500,  label: '2 000–2 999 mil' },
  { value: 4000,  label: '3 000–4 999 mil' },
  { value: 6000,  label: '5 000–6 999 mil' },
  { value: 8000,  label: '7 000–8 999 mil' },
  { value: 10000, label: '9 000–10 999 mil' },
  { value: 13000, label: '11 000–14 999 mil' },
  { value: 17500, label: '15 000–19 999 mil' },
  { value: 22500, label: '20 000–24 999 mil' },
  { value: 30000, label: '25 000+ mil' },
];

function closestMiltalOption(val: number): number {
  if (!val || val <= 0) return 0;
  let best = MILTAL_OPTIONS[1].value;
  let bestDiff = Infinity;
  for (const o of MILTAL_OPTIONS) {
    if (o.value === 0) continue;
    const diff = Math.abs(o.value - val);
    if (diff < bestDiff) { bestDiff = diff; best = o.value; }
  }
  return best;
}

export default function TrackChoiceStep({ regnummer, miltal, onChoose, onGuidance, onNavigateTrade, onVehicleFound }: TrackChoiceStepProps) {
  const lookup = useVehicleLookup(regnummer);
  const [tradeMiltal, setTradeMiltal] = useState<number>(0);

  useEffect(() => {
    if (lookup.status === 'found') {
      if (onVehicleFound) onVehicleFound(lookup.data);
      const fromLookup = lookup.data.miltal != null && lookup.data.miltal > 0 ? lookup.data.miltal : miltal;
      setTradeMiltal(closestMiltalOption(fromLookup));
    } else if (miltal > 0) {
      setTradeMiltal(closestMiltalOption(miltal));
    }
  }, [lookup.status, miltal]);

  const carInfo = lookup.status === 'found' ? lookup.data : null;
  const carLabel = carInfo
    ? [[carInfo.marke, carInfo.modell, carInfo.variant].filter(Boolean).join(' '), carInfo.ar ? String(carInfo.ar) : ''].filter(Boolean).join(' ')
    : '';

  return (
    <div className="space-y-4">
      {/* Current car pill */}
      <div>
        <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Din bil</p>
        <div className="inline-flex items-center h-10 px-4 bg-[#0e6efe]/10 text-[#0e6efe] font-semibold text-[14px] rounded-lg gap-2 flex-wrap">
          <span className="tracking-widest">{regnummer}</span>
          {lookup.status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin opacity-60" />}
          {carLabel && (
            <>
              <span className="text-[#0e6efe]/40">&middot;</span>
              <span className="font-medium">{carLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Byta bil card — expanded with miltal selector */}
      {onNavigateTrade && (
        <div className="rounded-2xl border border-[#0e6efe] bg-[#0e6efe]/[0.03] overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 rounded-full bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
                <Repeat className="w-5 h-5 text-[#0e6efe]" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] sm:text-[18px] font-semibold text-slate-900 tracking-tight">
                  Jag vill byta bil
                </h3>
                <p className="text-[14px] text-slate-500 leading-[1.55] mt-1">
                  Vi hj&auml;lper dig hitta n&auml;sta bil och f&ouml;rhandlar b&aring;de f&ouml;rs&auml;ljning och k&ouml;p.
                </p>
              </div>
            </div>

            {/* Miltal selector */}
            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                Miltal p&aring; din nuvarande bil
              </label>
              <div className="relative">
                <select
                  value={tradeMiltal}
                  onChange={e => setTradeMiltal(Number(e.target.value))}
                  className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-300 bg-white text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] appearance-none"
                >
                  {MILTAL_OPTIONS.map(o => (
                    <option key={o.value} value={o.value} disabled={o.value === 0}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="button"
              disabled={tradeMiltal === 0}
              onClick={() => onNavigateTrade(tradeMiltal)}
              className="w-full h-12 rounded-xl bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              G&aring; vidare
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onChoose('auction')}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-full border border-slate-300 text-[15px] font-semibold text-slate-700 hover:border-[#0e6efe] hover:text-[#0e6efe] transition-colors"
      >
        Jag vill s&auml;lja direkt
      </button>

      <div className="pt-1">
        <button
          type="button"
          onClick={onGuidance}
          className="w-full flex items-center justify-center gap-2 text-[14px] text-slate-600 hover:text-[#0e6efe] transition-colors py-2"
        >
          <Phone className="w-4 h-4" strokeWidth={2} />
          <span>Os&auml;ker? <span className="font-semibold underline underline-offset-2">Vi ringer och guidar dig</span></span>
        </button>
      </div>
    </div>
  );
}
