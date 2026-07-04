import { useState } from 'react';
import { ArrowLeft, Loader2, Plus, Car, FileText } from 'lucide-react';
import StaffShell from '../components/StaffShell';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

interface StaffNewDealProps {
  staffUser: StaffUser;
  onLoggedOut: () => void;
  onBack: () => void;
  onCreated: (dealId: string) => void;
  initialCarId?: string;
}

interface PoolCar {
  id: string;
  marke: string;
  modell: string;
  ar: number;
  regnummer: string | null;
  startbud: number | null;
  dealer_id: string | null;
  dealers: { id: string; foretagsnamn: string } | null;
}

interface CustomerRow {
  id: string;
  namn: string;
  telefon: string | null;
  mejl: string | null;
}

export default function StaffNewDeal({ staffUser, onLoggedOut, onBack, onCreated, initialCarId }: StaffNewDealProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 – choose car from pool
  const [carSearch, setCarSearch] = useState('');
  const [poolCars, setPoolCars] = useState<PoolCar[]>([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const [selectedCar, setSelectedCar] = useState<PoolCar | null>(null);

  // Step 2 – customer
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerRow[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [newCustomer, setNewCustomer] = useState({ namn: '', telefon: '', mejl: '' });
  const [useNewCustomer, setUseNewCustomer] = useState(false);

  // Step 3 – notes
  const [notes, setNotes] = useState('');
  const [distanceSale, setDistanceSale] = useState(true);

  const searchCars = async () => {
    setCarsLoading(true);
    const q = carSearch.trim();
    let query = supabase
      .from('cars')
      .select('id, marke, modell, ar, regnummer, startbud, dealer_id, dealers(id, foretagsnamn)')
      .eq('available_for_staff_sales', true)
      .eq('pool_status', 'available');

    if (q) {
      query = query.or(`marke.ilike.%${q}%,modell.ilike.%${q}%,regnummer.ilike.%${q}%`);
    }
    const { data } = await query.limit(20);
    setPoolCars((data ?? []) as unknown as PoolCar[]);
    setCarsLoading(false);
  };

  const searchCustomers = async () => {
    if (!customerSearch.trim()) return;
    const { data } = await supabase
      .from('customers')
      .select('id, namn, telefon, mejl')
      .or(`namn.ilike.%${customerSearch}%,telefon.ilike.%${customerSearch}%,mejl.ilike.%${customerSearch}%`)
      .limit(10);
    setCustomerResults(data ?? []);
  };

  const handleCreate = async () => {
    if (!selectedCar) { setError('Välj en bil.'); return; }
    setSaving(true);
    setError(null);

    let customerId: string | null = null;

    if (useNewCustomer && newCustomer.namn) {
      const { data: cust, error: custErr } = await supabase
        .from('customers')
        .insert({ namn: newCustomer.namn, telefon: newCustomer.telefon, mejl: newCustomer.mejl })
        .select('id')
        .single();
      if (custErr) { setError('Kunde inte skapa kund.'); setSaving(false); return; }
      customerId = cust.id;
    } else if (selectedCustomer) {
      customerId = selectedCustomer.id;
    }

    const { data: deal, error: dealErr } = await supabase
      .from('deals')
      .insert({
        assigned_staff_user_id: staffUser.id,
        created_by_staff_user_id: staffUser.id,
        customer_id: customerId,
        car_id: selectedCar.id,
        dealer_id: selectedCar.dealer_id,
        notes: notes || null,
        distance_sale: distanceSale,
        status: 'draft',
      })
      .select('id')
      .single();

    if (dealErr) { setError('Kunde inte skapa affär.'); setSaving(false); return; }

    // Initial line for car
    await supabase.from('deal_lines').insert({
      deal_id: deal.id,
      line_type: 'car',
      description: `${selectedCar.marke} ${selectedCar.modell} ${selectedCar.ar}${selectedCar.regnummer ? ` (${selectedCar.regnummer})` : ''}`,
      list_price: selectedCar.startbud ?? 0,
      negotiated_price: selectedCar.startbud ?? 0,
      kickback_amount: 0,
      sort_order: 0,
    });

    // Log creation
    await supabase.from('deal_events').insert({
      deal_id: deal.id,
      event_type: 'created',
      actor_type: 'staff',
      actor_id: staffUser.user_id,
      actor_name: `${staffUser.fornamn} ${staffUser.efternamn}`,
      payload_json: { car: `${selectedCar.marke} ${selectedCar.modell}` },
    });

    setSaving(false);
    onCreated(deal.id);
  };

  return (
    <StaffShell activePage="deals" staffUser={staffUser} onLoggedOut={onLoggedOut}>
      <div className="max-w-2xl">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-5 transition">
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Ny affär</h1>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step === s ? '#0A1628' : step > s ? '#00A85A' : '#F3F4F6',
                  color: step === s || step > s ? 'white' : '#9CA3AF',
                }}
              >
                {s}
              </div>
              <span className="text-xs font-semibold" style={{ color: step === s ? '#0A1628' : '#9CA3AF' }}>
                {s === 1 ? 'Välj bil' : s === 2 ? 'Kund' : 'Slutför'}
              </span>
              {s < 3 && <div className="w-8 h-0.5 bg-slate-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          {/* STEP 1: Choose car */}
          {step === 1 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-500" />
                Välj bil från nätverkslagret
              </h2>

              <div className="flex gap-2 mb-4">
                <input
                  value={carSearch}
                  onChange={e => setCarSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchCars()}
                  placeholder="Sök märke, modell, regnummer…"
                  className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={searchCars}
                  disabled={carsLoading}
                  className="px-4 h-10 rounded-xl text-sm font-bold"
                  style={{ background: '#0A1628', color: 'white' }}
                >
                  {carsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sök'}
                </button>
              </div>

              {initialCarId && !selectedCar && poolCars.length === 0 && (
                <div className="text-xs text-slate-400 mb-3">Tryck Sök för att ladda bilar, eller välj nedan.</div>
              )}

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {poolCars.map(car => (
                  <button
                    key={car.id}
                    onClick={() => setSelectedCar(car)}
                    className="w-full text-left px-4 py-3.5 rounded-xl border-2 transition"
                    style={{
                      borderColor: selectedCar?.id === car.id ? '#00A85A' : '#E5E7EB',
                      background: selectedCar?.id === car.id ? '#F0FDF4' : 'white',
                    }}
                  >
                    <div className="font-semibold text-slate-900 text-sm">
                      {car.marke} {car.modell} {car.ar}
                      {car.regnummer && <span className="ml-2 text-xs font-mono text-slate-400">{car.regnummer}</span>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {car.dealers?.foretagsnamn ?? '—'}
                      {car.startbud != null && ` · ${car.startbud.toLocaleString('sv-SE')} kr`}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedCar}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold transition"
                  style={{ background: selectedCar ? '#00A85A' : '#E5E7EB', color: selectedCar ? 'white' : '#9CA3AF' }}
                >
                  Nästa
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Customer */}
          {step === 2 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-4">Kund</h2>

              <div className="flex gap-2 mb-1">
                <button
                  onClick={() => setUseNewCustomer(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition"
                  style={{ background: !useNewCustomer ? '#0A1628' : '#F3F4F6', color: !useNewCustomer ? 'white' : '#6B7280' }}
                >
                  Befintlig kund
                </button>
                <button
                  onClick={() => setUseNewCustomer(true)}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition"
                  style={{ background: useNewCustomer ? '#0A1628' : '#F3F4F6', color: useNewCustomer ? 'white' : '#6B7280' }}
                >
                  Ny kund
                </button>
              </div>

              {!useNewCustomer ? (
                <div className="mt-4">
                  <div className="flex gap-2 mb-3">
                    <input
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchCustomers()}
                      placeholder="Sök namn, telefon, e-post…"
                      className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={searchCustomers}
                      className="px-4 h-10 rounded-xl text-sm font-bold"
                      style={{ background: '#0A1628', color: 'white' }}
                    >
                      Sök
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {customerResults.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className="w-full text-left px-4 py-3 rounded-xl border-2 transition"
                        style={{
                          borderColor: selectedCustomer?.id === c.id ? '#00A85A' : '#E5E7EB',
                          background: selectedCustomer?.id === c.id ? '#F0FDF4' : 'white',
                        }}
                      >
                        <div className="font-semibold text-slate-900 text-sm">{c.namn}</div>
                        <div className="text-xs text-slate-400">{c.telefon} · {c.mejl}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Kund kan läggas till senare. Hoppa över om okänd.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <input
                    value={newCustomer.namn}
                    onChange={e => setNewCustomer({ ...newCustomer, namn: e.target.value })}
                    placeholder="Kundens namn"
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <input
                    value={newCustomer.telefon}
                    onChange={e => setNewCustomer({ ...newCustomer, telefon: e.target.value })}
                    placeholder="Telefon"
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <input
                    value={newCustomer.mejl}
                    onChange={e => setNewCustomer({ ...newCustomer, mejl: e.target.value })}
                    placeholder="E-post"
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="text-sm font-semibold text-slate-500 hover:text-slate-900">
                  Tillbaka
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#00A85A', color: 'white' }}
                >
                  Nästa
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm */}
          {step === 3 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Sammanfattning
              </h2>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 mb-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bil</span>
                  <span className="font-semibold">{selectedCar ? `${selectedCar.marke} ${selectedCar.modell} ${selectedCar.ar}` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Handlare</span>
                  <span className="font-semibold">{selectedCar?.dealers?.foretagsnamn ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kund</span>
                  <span className="font-semibold">
                    {useNewCustomer ? newCustomer.namn || '(ny kund)' : selectedCustomer?.namn ?? '(ingen vald)'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Anteckningar (valfritt)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Inledande noteringar om affären…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer mb-5">
                <div
                  className="w-11 h-6 rounded-full relative transition"
                  style={{ background: distanceSale ? '#00A85A' : '#D1D5DB' }}
                  onClick={() => setDistanceSale(!distanceSale)}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                    style={{ left: distanceSale ? '22px' : '2px' }}
                  />
                </div>
                <span className="text-sm text-slate-700">Distansförsäljning (ångerrätt 14 dagar)</span>
              </label>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-sm font-semibold text-slate-500 hover:text-slate-900">
                  Tillbaka
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !selectedCar}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition"
                  style={{ background: '#00A85A', color: 'white', opacity: saving || !selectedCar ? 0.7 : 1 }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Skapa affär
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StaffShell>
  );
}
