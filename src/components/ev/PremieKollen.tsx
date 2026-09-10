import { useState } from 'react';
import { MapPin, CheckCircle, XCircle, AlertCircle, Zap, Clock, ShieldCheck } from 'lucide-react';
import { checkElbilspremie, ELBILSPREMIE, type PremieResult } from '../../lib/elbilspremie';

export default function PremieKollen({ onContinue }: { onContinue?: () => void }) {
  const [postnummer, setPostnummer] = useState('');
  const [income, setIncome] = useState('');
  const [hasEv, setHasEv] = useState(false);
  const [result, setResult] = useState<PremieResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = () => {
    setLoading(true);
    setTimeout(() => {
      const incomeNum = parseInt(income.replace(/\s/g, '')) || 0;
      const res = checkElbilspremie(postnummer, incomeNum, hasEv);
      setResult(res);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-600" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-900 leading-tight">Premiekollen</h3>
            <p className="text-[12px] text-slate-500">Se om du kan få 46 800–64 800 kr</p>
          </div>
        </div>

        {!result && (
          <div className="space-y-3">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Postnummer</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.8} />
                <input
                  type="text"
                  inputMode="numeric"
                  value={postnummer}
                  onChange={(e) => setPostnummer(e.target.value.replace(/[^0-9\s]/g, ''))}
                  placeholder="t.ex. 981 91"
                  maxLength={7}
                  className="w-full h-12 pl-10 pr-4 text-[15px] bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Hushållets månadsinkomst (kr)</label>
              <input
                type="text"
                inputMode="numeric"
                value={income}
                onChange={(e) => setIncome(e.target.value.replace(/[^0-9\s]/g, ''))}
                placeholder="t.ex. 25 000"
                className="w-full h-12 px-4 text-[15px] bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
              />
              <p className="mt-1 text-[12px] text-slate-400">Hela hushållets inkomst före skatt</p>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Har någon i hushållet ägt eller leasat elbil/laddhybrid de senaste 12 månaderna?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHasEv(true)}
                  className={`flex-1 h-11 rounded-xl border text-[14px] font-medium transition ${hasEv ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  Ja
                </button>
                <button
                  type="button"
                  onClick={() => setHasEv(false)}
                  className={`flex-1 h-11 rounded-xl border text-[14px] font-medium transition ${!hasEv ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  Nej
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheck}
              disabled={!postnummer || !income || loading}
              className="w-full h-13 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-[15px] transition active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Kontrollerar...
                </span>
              ) : 'Kolla min premie'}
            </button>
            <p className="text-center text-[12px] text-slate-400">Kostnadsfri och utan bindning</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {result.eligible === 'yes' && (
              <>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
                  <div className="flex justify-center mb-2">
                    <CheckCircle className="w-8 h-8 text-emerald-600" strokeWidth={2} />
                  </div>
                  <p className="text-[13px] font-medium text-emerald-700 mb-1">Du kan ha rätt till</p>
                  <p className="text-[36px] font-black text-emerald-700 tracking-tight">
                    {result.amount.toLocaleString('sv-SE')} kr
                  </p>
                  <p className="text-[13px] text-emerald-600 mt-1">
                    {result.hasStartTillaegg ? 'Inkl. starttillägg för låg inkomst' : 'Grundbelopp'}
                  </p>
                </div>

                <div className="space-y-2">
                  {result.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-[13px] text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2} />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
                    <div className="text-[12px] text-amber-800 space-y-1.5">
                      <p className="font-semibold">Viktigt att veta innan du bestämmer dig:</p>
                      <p>Stödet försvinner om du säljer bilen inom {ELBILSPREMIE.ownershipMonths} månader. Du måste stå som ägare eller leasetagare hela perioden.</p>
                      <p>Budgeten är begränsad — ca {ELBILSPREMIE.budgetHouseholds.toLocaleString('sv-SE')} hushåll kan få stödet. Det beviljas i turordning tills pengarna tar slut.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[12px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.8} />
                  <p>Slutgiltigt beslut fattas av Naturvårdsverket. Vi hjälper dig med hela ansökningsprocessen.</p>
                </div>

                <button
                  type="button"
                  onClick={onContinue}
                  className="w-full h-13 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition active:scale-[0.99]"
                >
                  Gå vidare till bilkalkylatorn
                </button>
              </>
            )}

            {result.eligible === 'no' && (
              <>
                <div className="rounded-xl bg-red-50 border border-red-200 p-5 text-center">
                  <div className="flex justify-center mb-2">
                    <XCircle className="w-8 h-8 text-red-500" strokeWidth={2} />
                  </div>
                  <p className="text-[15px] font-semibold text-red-700">Du kvalar inte in för premien</p>
                </div>
                <div className="space-y-2">
                  {result.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-[13px] text-slate-600">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" strokeWidth={2} />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    Även utan premien kan ett byte till elbil löna sig. Kör vidare till bilkalkylatorn för att se vad du skulle spara.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onContinue}
                  className="w-full h-13 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition active:scale-[0.99]"
                >
                  Se vad jag kan spara ändå
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setResult(null)}
              className="w-full text-[13px] text-slate-400 hover:text-slate-600 transition py-2"
            >
              Gör om kontrollen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
