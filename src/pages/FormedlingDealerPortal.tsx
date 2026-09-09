import { useState } from 'react';
import { Check, Clock, TrendingUp } from 'lucide-react';
import {
  VEHICLES, DEALERS, DEALER_OPPORTUNITIES, DEALER_ASSIGNMENTS,
  formatSEK,
} from '../lib/formedling-data';

type Tab = 'opportunities' | 'offer-form' | 'assignments';

export default function FormedlingDealerPortal() {
  const [tab, setTab] = useState<Tab>('opportunities');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [salePrice, setSalePrice] = useState('');
  const [commission, setCommission] = useState('');
  const [saleTimeWeeks, setSaleTimeWeeks] = useState('1–2 veckor');
  const [offerSent, setOfferSent] = useState(false);
  const [assignmentStatuses, setAssignmentStatuses] = useState<Record<string, string>>({});

  const dealer = DEALERS[0];

  const selectedVehicle = selectedVehicleId ? VEHICLES.find(v => v.id === selectedVehicleId) : null;
  const liveNet = (parseInt(salePrice) || 0) - (parseInt(commission) || 0);

  function openOfferForm(vehicleId: string) {
    setSelectedVehicleId(vehicleId);
    setTab('offer-form');
    setOfferSent(false);
    setSalePrice('');
    setCommission('');
    setSaleTimeWeeks('1–2 veckor');
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col">
      <header className="h-14 border-b border-slate-200 flex items-center px-5 sticky top-0 bg-[#faf8f5] z-30">
        <a href="/formedling" className="text-[18px] font-bold text-slate-900 mr-2">Bilto</a>
        <span className="text-[12px] text-slate-400">Förmedlare</span>
        <div className="ml-auto">
          <a href="/formedling" className="text-[13px] text-slate-500 hover:text-slate-900 transition">
            Till ägarsidan
          </a>
        </div>
      </header>

      <main className="flex-1 px-5 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Förmedlarens historik */}
          <div className="card-base p-5 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[14px] font-bold text-slate-600">
                {dealer.initials}
              </div>
              <div>
                <p className="text-[16px] font-semibold text-slate-900">{dealer.name}</p>
                <p className="text-[13px] text-slate-500">{dealer.city}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Uppdrag" value={String(dealer.completedSales)} />
              <Stat label="Uppnått pris" value={`${dealer.avgAchievedPct} %`} />
              <Stat label="Median säljtid" value={`${dealer.medianDaysToSale} dagar`} />
            </div>
          </div>

          {/* Flikar */}
          {tab !== 'offer-form' && (
            <div className="flex gap-2 mb-6">
              <TabButton active={tab === 'opportunities'} onClick={() => setTab('opportunities')}>
                Nya förfrågningar
              </TabButton>
              <TabButton active={tab === 'assignments'} onClick={() => setTab('assignments')}>
                Mina uppdrag
              </TabButton>
            </div>
          )}

          {/* Nya förfrågningar */}
          {tab === 'opportunities' && (
            <div className="space-y-3">
              {DEALER_OPPORTUNITIES.map(opp => {
                const v = VEHICLES.find(x => x.id === opp.vehicleId);
                if (!v) return null;
                return (
                  <div key={opp.vehicleId} className="card-base p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-md bg-slate-100 overflow-hidden shrink-0">
                      <img src={v.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-slate-900">{v.make} {v.model}</p>
                      <p className="text-[13px] text-slate-500">
                        {v.year} · {v.mileage.toLocaleString('sv-SE')} mil · {v.city}
                      </p>
                      <p className="text-[12px] text-slate-400 mt-1 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> {opp.hoursAgo} h sedan · {opp.existingBids} bud
                      </p>
                    </div>
                    <button
                      onClick={() => openOfferForm(v.id)}
                      className="btn-primary h-10 px-4 text-[13px] shrink-0"
                    >
                      Lämna erbjudande
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Offer form */}
          {tab === 'offer-form' && selectedVehicle && (
            <div>
              <button onClick={() => setTab('opportunities')} className="text-[14px] text-slate-500 hover:text-slate-900 transition mb-4">
                Tillbaka
              </button>

              {offerSent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-bilto-50 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-bilto-500" strokeWidth={2} />
                  </div>
                  <h1 className="text-[24px] font-bold text-slate-900 mb-2">Erbjudande skickat</h1>
                  <p className="text-slate-500 text-[16px] mb-8">Ägaren kan nu jämföra ditt erbjudande med andra.</p>
                  <button onClick={() => setTab('opportunities')} className="btn-primary h-12 px-8 text-[15px]">
                    Tillbaka till förfrågningar
                  </button>
                </div>
              ) : (
                <div>
                  <div className="card-base p-4 mb-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-md bg-slate-100 overflow-hidden shrink-0">
                      <img src={selectedVehicle.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[16px] font-semibold text-slate-900">{selectedVehicle.make} {selectedVehicle.model}</p>
                      <p className="text-[13px] text-slate-500">{selectedVehicle.year} · {selectedVehicle.mileage.toLocaleString('sv-SE')} mil · {selectedVehicle.city}</p>
                    </div>
                  </div>

                  <h1 className="text-[22px] font-bold text-slate-900 mb-6">Lämna erbjudande</h1>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-2">Förväntat försäljningspris (kr)</label>
                      <input
                        type="text"
                        value={salePrice}
                        onChange={e => setSalePrice(e.target.value.replace(/[^0-9]/g, ''))}
                        className="form-control"
                        placeholder="t.ex. 379000"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-2">Min avgift (kr)</label>
                      <input
                        type="text"
                        value={commission}
                        onChange={e => setCommission(e.target.value.replace(/[^0-9]/g, ''))}
                        className="form-control"
                        placeholder="t.ex. 14900"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-700 mb-2">Förväntad säljtid</label>
                      <select value={saleTimeWeeks} onChange={e => setSaleTimeWeeks(e.target.value)} className="form-control">
                        <option>1–2 veckor</option>
                        <option>2–3 veckor</option>
                        <option>3–4 veckor</option>
                        <option>4+ veckor</option>
                      </select>
                    </div>
                  </div>

                  {/* Live netto */}
                  <div className="mt-6 rounded-md bg-bilto-50 border border-bilto-100 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-bold text-bilto-700 uppercase tracking-wider">Ägaren får</p>
                      <p className="text-[28px] font-bold text-slate-900 mt-1">{formatSEK(liveNet)}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-bilto-500" />
                  </div>

                  <button
                    onClick={() => setOfferSent(true)}
                    disabled={!salePrice || !commission}
                    className="btn-primary w-full h-12 mt-6 text-[15px] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Skicka erbjudande
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mina uppdrag */}
          {tab === 'assignments' && (
            <div className="space-y-4">
              {DEALER_ASSIGNMENTS.map(a => {
                const v = VEHICLES.find(x => x.id === a.vehicleId);
                if (!v) return null;
                const currentStatus = assignmentStatuses[a.vehicleId] ?? a.status;
                return (
                  <div key={a.vehicleId} className="card-base p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-md bg-slate-100 overflow-hidden shrink-0">
                        <img src={v.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[16px] font-semibold text-slate-900">{v.make} {v.model}</p>
                        <p className="text-[13px] text-slate-500">{v.year} · {v.mileage.toLocaleString('sv-SE')} mil · {v.city}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4 py-3 border-y border-slate-100">
                      <div>
                        <p className="text-[11px] text-slate-400 mb-1">Överenskommet pris</p>
                        <p className="text-[14px] font-semibold text-slate-900">{formatSEK(a.agreedPrice)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 mb-1">Min avgift</p>
                        <p className="text-[14px] font-semibold text-slate-900">{formatSEK(a.commission)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400 mb-1">Dagar</p>
                        <p className="text-[14px] font-semibold text-slate-900">{a.daysInProgress}</p>
                      </div>
                    </div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-2">Uppdatera status</label>
                    <select
                      value={currentStatus}
                      onChange={e => setAssignmentStatuses(prev => ({ ...prev, [a.vehicleId]: e.target.value }))}
                      className="form-control"
                    >
                      <option>Bilen annonseras</option>
                      <option>Köpare hittad</option>
                      <option>Såld</option>
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 py-8 px-5 text-center">
        <p className="text-[13px] text-slate-400">Detta är en demo med påhittad data. Inga riktiga uppdrag.</p>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-slate-400">{label}</p>
      <p className="text-[20px] font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-md text-[14px] font-semibold transition ${active ? 'bg-bilto-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
    >
      {children}
    </button>
  );
}
