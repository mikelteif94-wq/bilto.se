import { useState } from 'react';
import DealerShell from '../components/DealerShell';

interface DealerCostBuilderProps {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

function fmt(n: number) { return n.toLocaleString('sv-SE'); }

function calcMonthly(
  bilpris: number, insats: number, ranta: number, lopitid: number, restvarde: number
): number {
  const lan = bilpris - insats - restvarde;
  if (lan <= 0 || lopitid <= 0) return 0;
  const r = ranta / 100 / 12;
  if (r === 0) return Math.round(lan / lopitid);
  return Math.round(lan * r / (1 - Math.pow(1 + r, -lopitid)));
}

export default function DealerCostBuilder({ dealerId: _dealerId, foretagsnamn, onLoggedOut }: DealerCostBuilderProps) {
  const [bilpris, setBilpris] = useState(350000);
  const [insatsPct, setInsatsPct] = useState(20);
  const [ranta, setRanta] = useState(4.9);
  const [lopitid, setLopitid] = useState(36);
  const [restvaerdePct, setRestvardePct] = useState(35);

  const insats = Math.round(bilpris * insatsPct / 100);
  const restvarde = Math.round(bilpris * restvaerdePct / 100);
  const manadskostnad = calcMonthly(bilpris, insats, ranta, lopitid, restvarde);

  const inputCls = "w-full h-11 px-4 rounded-xl text-[14px] focus:outline-none transition";
  const inputStyle = { background: 'white', border: '1.5px solid #E8ECF3', color: '#1A2233', fontFamily: '"Signika", ui-sans-serif, system-ui' };

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
          {label}
        </label>
        {children}
      </div>
    );
  }

  return (
    <DealerShell activePage="bygg" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      <div className="max-w-2xl mx-auto">
        <h1
          className="text-[28px] sm:text-[34px] mb-2"
          style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#0E1B33', letterSpacing: '-0.01em' }}
        >
          MÅNADSKOSTNADSBYGGAREN
        </h1>
        <p className="text-[14px] mb-8" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
          Bygg din kampanj bakvägen — ange önskad månadskostnad och se vilka villkor som krävs.
        </p>

        <div className="bg-white rounded-2xl p-6 sm:p-8 mb-5" style={{ border: '1px solid #E8ECF3', boxShadow: '0 1px 2px rgb(14 27 51 / .04), 0 10px 30px -12px rgb(14 27 51 / .08)' }}>
          <div className="space-y-5">
            <Field label="Bilpris (kr)">
              <input
                type="number"
                value={bilpris}
                onChange={e => setBilpris(parseInt(e.target.value) || 0)}
                className={inputCls}
                style={inputStyle}
              />
            </Field>

            <Field label={`Kontantinsats — ${insatsPct}% (${fmt(insats)} kr)`}>
              <input
                type="range"
                min={10} max={50} step={5}
                value={insatsPct}
                onChange={e => setInsatsPct(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: '#FFD500' }}
              />
              <div className="flex justify-between text-[11px] mt-1" style={{ color: '#6B7486' }}>
                <span>10%</span><span>50%</span>
              </div>
            </Field>

            <Field label={`Restvärde — ${restvaerdePct}% (${fmt(restvarde)} kr)`}>
              <input
                type="range"
                min={0} max={60} step={5}
                value={restvaerdePct}
                onChange={e => setRestvardePct(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: '#0E1B33' }}
              />
              <div className="flex justify-between text-[11px] mt-1" style={{ color: '#6B7486' }}>
                <span>0%</span><span>60%</span>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Ränta (%)">
                <input
                  type="number" step="0.1"
                  value={ranta}
                  onChange={e => setRanta(parseFloat(e.target.value) || 0)}
                  className={inputCls}
                  style={inputStyle}
                />
              </Field>
              <Field label="Löptid (mån)">
                <select
                  value={lopitid}
                  onChange={e => setLopitid(parseInt(e.target.value))}
                  className={inputCls + ' appearance-none'}
                  style={inputStyle}
                >
                  {[12,24,36,48,60,72].map(m => <option key={m} value={m}>{m} mån</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* Result */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: 'linear-gradient(135deg, #0E1B33 0%, #16264a 100%)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"Signika", ui-sans-serif' }}>
            Beräknad månadskostnad
          </p>
          <p
            className="text-[56px] leading-none font-bold mb-1"
            style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#FFD500', letterSpacing: '-0.01em' }}
          >
            {fmt(manadskostnad)} kr
          </p>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: '"Signika", ui-sans-serif' }}>
            /månad exkl. försäkring
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Insats', value: fmt(insats) + ' kr' },
              { label: 'Restvärde', value: fmt(restvarde) + ' kr' },
              { label: 'Ränta', value: ranta + '%' },
            ].map(k => (
              <div key={k.label}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: '"Signika", ui-sans-serif' }}>{k.label}</p>
                <p className="text-[15px] font-bold text-white" style={{ fontFamily: '"Anton", "Impact", sans-serif' }}>{k.value}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { window.history.pushState({}, '', '/handlare/ny'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="mt-6 w-full h-11 rounded-full font-bold text-[14px] transition"
            style={{ background: '#FFD500', color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}
          >
            Skapa kampanj med dessa villkor
          </button>
        </div>
      </div>
    </DealerShell>
  );
}
