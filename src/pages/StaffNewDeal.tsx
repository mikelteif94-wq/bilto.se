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
        <button onClick={onBack} className="flex items-center gap-1.5 mb-5 text-[13px] transition" style={{ color: '#6E6D68' }}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Tillbaka
        </button>

        <h1 className="text-[20px] font-medium mb-5" style={{ color: '#1C1C1A' }}>Ny affär</h1>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium"
                style={{
                  background: step === s ? '#0F6E56' : step > s ? '#E1F5EE' : '#F7F6F3',
                  color: step === s ? 'white' : step > s ? '#085041' : '#6E6D68',
                  border: step === s ? 'none' : '1px solid #E5E4E0',
                }}
              >
                {s}
              </div>
              <span className="text-[12px] hidden sm:block" style={{ color: step === s ? '#1C1C1A' : '#6E6D68', fontWeight: step === s ? 500 : 400 }}>
                {s === 1 ? 'Välj bil' : s === 2 ? 'Kund' : 'Slutför'}
              </span>
              {s < 3 && <div className="w-6 h-px" style={{ background: '#E5E4E0' }} />}
            </div>
          ))}
        </div>

        <div className="rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0' }}>
          {/* STEP 1: Choose car */}
          {step === 1 && (
            <div>
              <h2 className="text-[14px] font-medium mb-4 flex items-center gap-2" style={{ color: '#1C1C1A' }}>
                <Car className="w-4 h-4" style={{ color: '#6E6D68' }} />
                Välj bil från nätverkslagret
              </h2>

              <div className="flex gap-2 mb-4">
                <input
                  value={carSearch}
                  onChange={e => setCarSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchCars()}
                  placeholder="Sök märke, modell, regnummer…"
                  className="flex-1 h-9 px-3 rounded-lg text-[14px] focus:outline-none"
                  style={{ border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A' }}
                />
                <button
                  onClick={searchCars}
                  disabled={carsLoading}
                  className="px-4 h-9 rounded-lg text-[13px] font-medium"
                  style={{ background: '#0F6E56', color: 'white' }}
                >
                  {carsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sök'}
                </button>
              </div>

              {initialCarId && !selectedCar && poolCars.length === 0 && (
                <div className="text-[12px] mb-3" style={{ color: '#6E6D68' }}>Tryck Sök för att ladda bilar.</div>
              )}

              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {poolCars.map(car => (
                  <button
                    key={car.id}
                    onClick={() => setSelectedCar(car)}
                    className="w-full text-left px-4 py-3 rounded-lg transition"
                    style={{
                      border: selectedCar?.id === car.id ? '1px solid #0F6E56' : '1px solid #E5E4E0',
                      background: selectedCar?.id === car.id ? '#EEF7F4' : '#FFFFFF',
                    }}
                  >
                    <div className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>
                      {car.marke} {car.modell} {car.ar}
                      {car.regnummer && (
                        <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                          {car.regnummer}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: '#6E6D68' }}>
                      {car.dealers?.foretagsnamn ?? '—'}
                      {car.startbud != null && <span> · <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{car.startbud.toLocaleString('sv-SE')} kr</span></span>}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end mt-5">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedCar}
                  className="px-5 h-9 rounded-lg text-[13px] font-medium transition"
                  style={{ background: selectedCar ? '#0F6E56' : '#F7F6F3', color: selectedCar ? 'white' : '#6E6D68' }}
                >
                  Nästa
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Customer */}
          {step === 2 && (
            <div>
              <h2 className="text-[14px] font-medium mb-4" style={{ color: '#1C1C1A' }}>Kund</h2>

              <div className="flex gap-0.5 p-1 rounded-lg mb-4 w-fit" style={{ background: '#F7F6F3', border: '1px solid #E5E4E0' }}>
                <button
                  onClick={() => setUseNewCustomer(false)}
                  className="px-4 h-7 rounded-md text-[12px] transition"
                  style={{ background: !useNewCustomer ? '#FFFFFF' : 'transparent', color: !useNewCustomer ? '#1C1C1A' : '#6E6D68', fontWeight: !useNewCustomer ? 500 : 400, border: !useNewCustomer ? '1px solid #E5E4E0' : 'none' }}
                >
                  Befintlig kund
                </button>
                <button
                  onClick={() => setUseNewCustomer(true)}
                  className="px-4 h-7 rounded-md text-[12px] transition"
                  style={{ background: useNewCustomer ? '#FFFFFF' : 'transparent', color: useNewCustomer ? '#1C1C1A' : '#6E6D68', fontWeight: useNewCustomer ? 500 : 400, border: useNewCustomer ? '1px solid #E5E4E0' : 'none' }}
                >
                  Ny kund
                </button>
              </div>

              {!useNewCustomer ? (
                <div>
                  <div className="flex gap-2 mb-3">
                    <input
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchCustomers()}
                      placeholder="Sök namn, telefon, e-post…"
                      className="flex-1 h-9 px-3 rounded-lg text-[14px] focus:outline-none"
                      style={{ border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A' }}
                    />
                    <button onClick={searchCustomers} className="px-4 h-9 rounded-lg text-[13px] font-medium" style={{ background: '#0F6E56', color: 'white' }}>
                      Sök
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {customerResults.map(c => (
                      <button key={c.id} onClick={() => setSelectedCustomer(c)}
                        className="w-full text-left px-4 py-3 rounded-lg transition"
                        style={{ border: selectedCustomer?.id === c.id ? '1px solid #0F6E56' : '1px solid #E5E4E0', background: selectedCustomer?.id === c.id ? '#EEF7F4' : '#FFFFFF' }}>
                        <div className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>{c.namn}</div>
                        <div className="text-[12px]" style={{ color: '#6E6D68' }}>{c.telefon} · {c.mejl}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[12px] mt-2" style={{ color: '#6E6D68' }}>Kund kan läggas till senare.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { placeholder: 'Kundens namn', value: newCustomer.namn, key: 'namn' },
                    { placeholder: 'Telefon', value: newCustomer.telefon, key: 'telefon' },
                    { placeholder: 'E-post', value: newCustomer.mejl, key: 'mejl' },
                  ].map(f => (
                    <input key={f.key} value={f.value}
                      onChange={e => setNewCustomer({ ...newCustomer, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full h-9 px-3 text-[13px] focus:outline-none"
                      style={{ border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A', borderRadius: 8 }} />
                  ))}
                </div>
              )}

              <div className="flex justify-between mt-5">
                <button onClick={() => setStep(1)} className="text-[13px]" style={{ color: '#6E6D68' }}>Tillbaka</button>
                <button onClick={() => setStep(3)} className="px-5 h-9 rounded-lg text-[13px] font-medium" style={{ background: '#0F6E56', color: 'white' }}>
                  Nästa
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm */}
          {step === 3 && (
            <div>
              <h2 className="text-[14px] font-medium mb-4 flex items-center gap-2" style={{ color: '#1C1C1A' }}>
                <FileText className="w-4 h-4" style={{ color: '#6E6D68' }} />
                Sammanfattning
              </h2>

              <div className="rounded-lg p-4 space-y-2 mb-5" style={{ background: '#F7F6F3', border: '1px solid #E5E4E0' }}>
                {[
                  ['Bil', selectedCar ? `${selectedCar.marke} ${selectedCar.modell} ${selectedCar.ar}` : '—'],
                  ['Handlare', selectedCar?.dealers?.foretagsnamn ?? '—'],
                  ['Kund', useNewCustomer ? newCustomer.namn || '(ny kund)' : selectedCustomer?.namn ?? '(ingen vald)'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[12px]" style={{ color: '#6E6D68' }}>{label}</span>
                    <span className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{val}</span>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-[12px] font-medium mb-1.5 block" style={{ color: '#6E6D68' }}>Anteckningar (valfritt)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Inledande noteringar om affären…"
                  className="w-full px-3 py-2 text-[13px] focus:outline-none resize-none"
                  style={{ border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A', borderRadius: 8 }}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer mb-5">
                <div className="w-10 h-5 rounded-full relative transition" style={{ background: distanceSale ? '#0F6E56' : '#E5E4E0' }}
                  onClick={() => setDistanceSale(!distanceSale)}>
                  <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: distanceSale ? '22px' : '2px' }} />
                </div>
                <span className="text-[13px]" style={{ color: '#1C1C1A' }}>Distansförsäljning (ångerrätt 14 dagar)</span>
              </label>

              {error && (
                <div className="text-[13px] rounded-lg px-4 py-3 mb-4" style={{ background: '#FCEBEB', color: '#791F1F' }}>{error}</div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-[13px]" style={{ color: '#6E6D68' }}>Tillbaka</button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !selectedCar}
                  className="flex items-center gap-2 px-5 h-9 rounded-lg text-[13px] font-medium transition"
                  style={{ background: '#0F6E56', color: 'white', opacity: saving || !selectedCar ? 0.7 : 1 }}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
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
