import { useState } from 'react';
import { Car, Fuel, TrendingDown, Leaf, ArrowRight } from 'lucide-react';
import { estimateCarValue } from '../../lib/elbilspremie';

export default function BilKalkylatorn({ onContinue }: { onContinue?: () => void }) {
  const [regnummer, setRegnummer] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel'>('petrol');
  const [result, setResult] = useState<ReturnType<typeof estimateCarValue> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = () => {
    setLoading(true);
    setTimeout(() => {
      const annualMileage = parseInt(mileage.replace(/\s/g, '')) || 15000;
      const res = estimateCarValue(regnummer, annualMileage, fuelType);
      setResult(res);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-lg bg-bilto-50 flex items-center justify-center">
            <Car className="w-5 h-5 text-bilto-600" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-900 leading-tight">Bilkalkylatorn</h3>
            <p className="text-[12px] text-slate-500">Vad sparar du på att byta till elbil?</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-3">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Registreringsnummer</label>
              <input
                type="text"
                value={regnummer}
                onChange={(e) => setRegnummer(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="ABC123"
                maxLength={6}
                className="w-full h-12 px-4 text-[15px] bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 tracking-widest font-bold italic focus:outline-none focus:border-bilto-500 focus:ring-2 focus:ring-bilto-500/15 transition"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Körsträcka per år (mil)</label>
              <input
                type="text"
                inputMode="numeric"
                value={mileage}
                onChange={(e) => setMileage(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="t.ex. 1500"
                className="w-full h-12 px-4 text-[15px] bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-bilto-500 focus:ring-2 focus:ring-bilto-500/15 transition"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Bränsle idag</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFuelType('petrol')}
                  className={`flex-1 h-11 rounded-xl border text-[14px] font-medium transition ${fuelType === 'petrol' ? 'border-bilto-500 bg-bilto-50 text-bilto-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  Bensin
                </button>
                <button
                  type="button"
                  onClick={() => setFuelType('diesel')}
                  className={`flex-1 h-11 rounded-xl border text-[14px] font-medium transition ${fuelType === 'diesel' ? 'border-bilto-500 bg-bilto-50 text-bilto-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  Diesel
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculate}
              disabled={!regnummer || !mileage || loading}
              className="w-full h-13 py-3.5 rounded-xl bg-bilto-600 hover:bg-bilto-700 disabled:bg-slate-300 text-white font-semibold text-[15px] transition active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Räknar...
                </span>
              ) : 'Räkna ut besparing'}
            </button>
            <p className="text-center text-[12px] text-slate-400">Konservativa uppskattningar — hellre försiktigt än optimistiskt</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Car className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Värde idag</span>
                </div>
                <p className="text-[22px] font-black text-slate-900 tracking-tight">
                  {result.estimatedValue.toLocaleString('sv-SE')}
                </p>
                <p className="text-[11px] text-slate-400">Uppskattat marknadsvärde</p>
              </div>

              <div className="rounded-xl bg-bilto-50 border border-bilto-200 p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="w-3.5 h-3.5 text-bilto-600" strokeWidth={2} />
                  <span className="text-[11px] font-medium text-bilto-700 uppercase tracking-wide">Sparar/år</span>
                </div>
                <p className="text-[22px] font-black text-bilto-700 tracking-tight">
                  {result.annualSavings > 0 ? result.annualSavings.toLocaleString('sv-SE') : '0'}
                </p>
                <p className="text-[11px] text-bilto-600">kr per år</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-slate-400" strokeWidth={1.8} />
                  <span className="text-[13px] text-slate-600">Idag ({fuelType === 'diesel' ? 'diesel' : 'bensin'})</span>
                </div>
                <span className="text-[15px] font-bold text-slate-900">{result.monthlyCostCurrent.toLocaleString('sv-SE')} kr/mån</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-bilto-500" strokeWidth={1.8} />
                  <span className="text-[13px] text-slate-600">Med elbil</span>
                </div>
                <span className="text-[15px] font-bold text-bilto-700">{result.monthlyCostEv.toLocaleString('sv-SE')} kr/mån</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-bilto-500" strokeWidth={1.8} />
                  <span className="text-[13px] text-slate-600">CO₂-minskning/år</span>
                </div>
                <span className="text-[15px] font-bold text-slate-900">{result.co2Reduction.toLocaleString('sv-SE')} kg</span>
              </div>
            </div>

            {result.annualSavings <= 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-[13px] text-amber-800 leading-relaxed">
                  Utifrån dessa uppgifter lönar sig inte ett byte just nu. Det kan bero på kort körsträcka eller hög inbytesvärde. Vi ger dig gärna en mer exakt bedömning.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onContinue}
              className="w-full h-13 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              Gå vidare till laddanalysen
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => setResult(null)}
              className="w-full text-[13px] text-slate-400 hover:text-slate-600 transition py-2"
            >
              Ändra uppgifter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
