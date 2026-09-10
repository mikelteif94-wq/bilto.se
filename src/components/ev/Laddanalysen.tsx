import { useState } from 'react';
import { Home, Building2, KeyRound, Car, MapPin, CheckCircle, XCircle, AlertCircle, Zap, ArrowRight } from 'lucide-react';
import { analyzeCharging, type LaddanalysResult } from '../../lib/elbilspremie';

export default function Laddanalysen({ onContinue }: { onContinue?: () => void }) {
  const [address, setAddress] = useState('');
  const [housingType, setHousingType] = useState<'villa' | 'bostadsratt' | 'hyresratt' | 'gatuparkering' | ''>('');
  const [result, setResult] = useState<LaddanalysResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      const res = analyzeCharging(address, housingType as 'villa' | 'bostadsratt' | 'hyresratt' | 'gatuparkering');
      setResult(res);
      setLoading(false);
    }, 700);
  };

  const housingOptions = [
    { value: 'villa' as const, label: 'Villa', icon: Home },
    { value: 'bostadsratt' as const, label: 'Bostadsrätt', icon: Building2 },
    { value: 'hyresratt' as const, label: 'Hyresrätt', icon: KeyRound },
    { value: 'gatuparkering' as const, label: 'Gatuparkering', icon: Car },
  ];

  return (
    <div className="bg-white rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
            <Zap className="w-5 h-5 text-cyan-600" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-900 leading-tight">Laddanalysen</h3>
            <p className="text-[12px] text-slate-500">Kan du ladda hemma? Vi tar reda på det.</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-3">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Adress</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.8} />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="t.ex. Storgatan 12, Kiruna"
                  className="w-full h-12 pl-10 pr-4 text-[15px] bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Boendeform</label>
              <div className="grid grid-cols-2 gap-2">
                {housingOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setHousingType(value)}
                    className={`flex items-center gap-2 h-11 px-3 rounded-xl border text-[13px] font-medium transition ${housingType === value ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!address || !housingType || loading}
              className="w-full h-13 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white font-semibold text-[15px] transition active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Analyserar...
                </span>
              ) : 'Analysera min laddning'}
            </button>
            <p className="text-center text-[12px] text-slate-400">Den vanligaste anledningen till att folk inte byter — vi ger dig ett svar</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-5 text-center ${
              result.canChargeHome === 'yes' ? 'bg-emerald-50 border-emerald-200' :
              result.canChargeHome === 'maybe' ? 'bg-amber-50 border-amber-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex justify-center mb-2">
                {result.canChargeHome === 'yes' && <CheckCircle className="w-8 h-8 text-emerald-600" strokeWidth={2} />}
                {result.canChargeHome === 'maybe' && <AlertCircle className="w-8 h-8 text-amber-600" strokeWidth={2} />}
                {result.canChargeHome === 'no' && <XCircle className="w-8 h-8 text-red-500" strokeWidth={2} />}
              </div>
              <p className="text-[18px] font-bold text-slate-900">
                {result.canChargeHome === 'yes' && 'Du kan ladda hemma'}
                {result.canChargeHome === 'maybe' && 'Kanske — det beror på din BRF'}
                {result.canChargeHome === 'no' && 'Hemladdning inte möjlig'}
              </p>
            </div>

            <p className="text-[14px] text-slate-600 leading-relaxed">{result.description}</p>

            {result.estimatedCost && (
              <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-600">Uppskattad kostnad laddbox</span>
                  <span className="text-[15px] font-bold text-slate-900">{result.estimatedCost.toLocaleString('sv-SE')} kr</span>
                </div>
                {result.afterGreenDeduction && (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-emerald-600">Efter grönt avdrag (50 %)</span>
                    <span className="text-[15px] font-bold text-emerald-700">{result.afterGreenDeduction.toLocaleString('sv-SE')} kr</span>
                  </div>
                )}
                <p className="text-[12px] text-slate-400 pt-1">
                  Grönt avdrag: 50 % skattereduktion på arbete och material, max 50 000 kr/person/år. Dras direkt på fakturan.
                </p>
              </div>
            )}

            {result.brfInfo && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-[13px] text-blue-800 leading-relaxed">{result.brfInfo}</p>
              </div>
            )}

            {result.publicCostPerMil && (
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-slate-600">Kostnad publik laddning</span>
                  <span className="text-[15px] font-bold text-slate-900">~{result.publicCostPerMil} kr/mil</span>
                </div>
                <p className="text-[12px] text-slate-400">{result.nearestPublicCharging}</p>
              </div>
            )}

            <button
              type="button"
              onClick={onContinue}
              className="w-full h-13 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              Jag vill ha hjälp med hela bytet
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => setResult(null)}
              className="w-full text-[13px] text-slate-400 hover:text-slate-600 transition py-2"
            >
              Gör om analysen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
