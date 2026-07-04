import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Plus, Car, FileText, Search, ChevronDown, ChevronUp } from 'lucide-react';
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

const inputStyle = { border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A', borderRadius: 8 };

export default function StaffNewDeal({ staffUser, onLoggedOut, onBack, onCreated, initialCarId }: StaffNewDealProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 – car
  const [carSearch, setCarSearch] = useState('');
  const [poolCars, setPoolCars] = useState<PoolCar[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<PoolCar | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualCar, setManualCar] = useState({ marke: '', modell: '', ar: new Date().getFullYear(), regnummer: '', pris: '' });

  // Step 2 – customer
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerRow[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [newCustomer, setNewCustomer] = useState({ namn: '', telefon: '', mejl: '' });
  const [useNewCustomer, setUseNewCustomer] = useState(false);

  // Step 3 – notes
  const [notes, setNotes] = useState('');
  const [distanceSale, setDistanceSale] = useState(true);

  // Load pool cars automatically on mount
  useEffect(() => {
    (async () => {
      setCarsLoading(true);
      const { data } = await supabase
        .from('cars')
        .select('id, marke, modell, ar, regnummer, startbud, dealer_id, dealers(id, foretagsnamn)')
        .eq('available_for_staff_sales', true)
        .eq('pool_status', 'available')
        .order('created_at', { ascending: false })
        .limit(30);
      setPoolCars((data ?? []) as unknown as PoolCar[]);
      setCarsLoading(false);
    })();
  }, []);

  const searchCars = async () => {
    setCarsLoading(true);
    const q = carSearch.trim();
    let query = supabase
      .from('cars')
      .select('id, marke, modell, ar, regnummer, startbud, dealer_id, dealers(id, foretagsnamn)')
      .eq('available_for_staff_sales', true);
    if (q) {
      query = query.or(`marke.ilike.%${q}%,modell.ilike.%${q}%,regnummer.ilike.%${q}%`);
    } else {
      query = query.eq('pool_status', 'available');
    }
    const { data } = await query.limit(30);
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

  const canProceedFromStep1 = selectedCar != null || (manualMode && manualCar.marke.trim() !== '' && manualCar.modell.trim() !== '');

  const handleCreate = async () => {
    if (!canProceedFromStep1) { setError('Fyll i bilinfo.'); return; }
    setSaving(true);
    setError(null);

    // If manual car: create car record first
    let carId: string | null = selectedCar?.id ?? null;
    let dealerId: string | null = selectedCar?.dealer_id ?? null;

    if (manualMode && !selectedCar) {
      const pris = parseInt(manualCar.pris) || null;
      const { data: newCar, error: carErr } = await supabase
        .from('cars')
        .insert({
          marke: manualCar.marke,
          modell: manualCar.modell,
          ar: manualCar.ar,
          regnummer: manualCar.regnummer || null,
          startbud: pris,
          available_for_staff_sales: false,
        })
        .select('id')
        .single();
      if (carErr || !newCar) { setError('Kunde inte spara bilinfo.'); setSaving(false); return; }
      carId = newCar.id;
    }

    let customerId: string | null = null;
    if (useNewCustomer && newCustomer.namn) {
      const { data: cust, error: custErr } = await supabase
        .from('customers')
        .insert({ namn: newCustomer.namn, telefon: newCustomer.telefon || null, mejl: newCustomer.mejl || null })
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
        car_id: carId,
        dealer_id: dealerId,
        notes: notes || null,
        distance_sale: distanceSale,
        status: 'draft',
      })
      .select('id')
      .single();

    if (dealErr || !deal) { setError('Kunde inte skapa affär. Kontrollera att databasen är konfigurerad.'); setSaving(false); return; }

    const carLabel = selectedCar
      ? `${selectedCar.marke} ${selectedCar.modell} ${selectedCar.ar}${selectedCar.regnummer ? ` (${selectedCar.regnummer})` : ''}`
      : `${manualCar.marke} ${manualCar.modell} ${manualCar.ar}${manualCar.regnummer ? ` (${manualCar.regnummer})` : ''}`;
    const carPrice = selectedCar?.startbud ?? (parseInt(manualCar.pris) || 0);

    await supabase.from('deal_lines').insert({
      deal_id: deal.id,
      line_type: 'car',
      description: carLabel,
      list_price: carPrice,
      negotiated_price: carPrice,
      kickback_amount: 0,
      sort_order: 0,
    });

    await supabase.from('deal_events').insert({
      deal_id: deal.id,
      event_type: 'created',
      actor_type: 'staff',
      actor_id: staffUser.user_id,
      actor_name: `${staffUser.fornamn} ${staffUser.efternamn}`,
      payload_json: { car: carLabel },
    });

    setSaving(false);
    onCreated(deal.id);
  };

  const filteredCars = carSearch
    ? poolCars
    : poolCars;

  return (
    <StaffShell activePage="deals" staffUser={staffUser} onLoggedOut={onLoggedOut}>
      <div className="max-w-2xl">
        <button onClick={onBack} className="flex items-center gap-1.5 mb-5 text-[13px] transition" style={{ color: '#6E6D68' }}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Tillbaka
        </button>

        <h1 className="text-[20px] font-medium mb-5" style={{ color: '#1C1C1A' }}>Ny affär</h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium"
                style={{
                  background: step === s ? '#0F6E56' : step > s ? '#E1F5EE' : '#F7F6F3',
                  color: step === s ? 'white' : step > s ? '#085041' : '#6E6D68',
                  border: step === s ? 'none' : '1px solid #E5E4E0',
                }}>
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
          {/* ── STEP 1: Car ── */}
          {step === 1 && (
            <div>
              <h2 className="text-[14px] font-medium mb-1 flex items-center gap-2" style={{ color: '#1C1C1A' }}>
                <Car className="w-4 h-4" style={{ color: '#6E6D68' }} />
                Välj bil
              </h2>
              <p className="text-[12px] mb-4" style={{ color: '#6E6D68' }}>
                Välj från nätverkslagret eller ange bilinfo manuellt.
              </p>

              {/* Toggle: pool / manual */}
              <div className="flex gap-0.5 p-1 rounded-lg mb-4 w-fit" style={{ background: '#F7F6F3', border: '1px solid #E5E4E0' }}>
                <button
                  onClick={() => { setManualMode(false); setSelectedCar(null); }}
                  className="px-4 h-7 rounded-md text-[12px] transition"
                  style={{ background: !manualMode ? '#FFFFFF' : 'transparent', color: !manualMode ? '#1C1C1A' : '#6E6D68', fontWeight: !manualMode ? 500 : 400, border: !manualMode ? '1px solid #E5E4E0' : 'none' }}>
                  Från lager
                </button>
                <button
                  onClick={() => { setManualMode(true); setSelectedCar(null); }}
                  className="px-4 h-7 rounded-md text-[12px] transition"
                  style={{ background: manualMode ? '#FFFFFF' : 'transparent', color: manualMode ? '#1C1C1A' : '#6E6D68', fontWeight: manualMode ? 500 : 400, border: manualMode ? '1px solid #E5E4E0' : 'none' }}>
                  Ange manuellt
                </button>
              </div>

              {!manualMode ? (
                <>
                  {/* Search */}
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#6E6D68' }} />
                      <input
                        value={carSearch}
                        onChange={e => setCarSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && searchCars()}
                        placeholder="Sök märke, modell, regnummer…"
                        className="w-full h-9 pl-8 pr-3 rounded-lg text-[14px] focus:outline-none"
                        style={{ border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A' }}
                      />
                    </div>
                    <button onClick={searchCars} disabled={carsLoading} className="px-4 h-9 rounded-lg text-[13px] font-medium" style={{ background: '#0F6E56', color: 'white' }}>
                      {carsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sök'}
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {carsLoading && poolCars.length === 0 && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#6E6D68' }} />
                      </div>
                    )}
                    {!carsLoading && filteredCars.length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-[13px] mb-2" style={{ color: '#6E6D68' }}>Inga bilar i lagret.</p>
                        <button onClick={() => setManualMode(true)} className="text-[13px] font-medium" style={{ color: '#0F6E56' }}>
                          Ange bilinfo manuellt
                        </button>
                      </div>
                    )}
                    {filteredCars.map(car => (
                      <button key={car.id} onClick={() => setSelectedCar(prev => prev?.id === car.id ? null : car)}
                        className="w-full text-left px-4 py-3 rounded-lg transition"
                        style={{
                          border: selectedCar?.id === car.id ? '1px solid #0F6E56' : '1px solid #E5E4E0',
                          background: selectedCar?.id === car.id ? '#EEF7F4' : '#FFFFFF',
                        }}>
                        <div className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>
                          {car.marke} {car.modell} {car.ar}
                          {car.regnummer && (
                            <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                              {car.regnummer}
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] mt-0.5" style={{ color: '#6E6D68' }}>
                          {car.dealers?.foretagsnamn ?? 'Okänd handlare'}
                          {car.startbud != null && <span> · <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{car.startbud.toLocaleString('sv-SE')} kr</span></span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                /* Manual car entry */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-medium mb-1 block" style={{ color: '#6E6D68' }}>Märke *</label>
                      <input value={manualCar.marke} onChange={e => setManualCar(v => ({ ...v, marke: e.target.value }))}
                        placeholder="Volvo"
                        className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium mb-1 block" style={{ color: '#6E6D68' }}>Modell *</label>
                      <input value={manualCar.modell} onChange={e => setManualCar(v => ({ ...v, modell: e.target.value }))}
                        placeholder="XC60"
                        className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium mb-1 block" style={{ color: '#6E6D68' }}>År *</label>
                      <input type="number" value={manualCar.ar} onChange={e => setManualCar(v => ({ ...v, ar: parseInt(e.target.value) || v.ar }))}
                        className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium mb-1 block" style={{ color: '#6E6D68' }}>Regnummer</label>
                      <input value={manualCar.regnummer} onChange={e => setManualCar(v => ({ ...v, regnummer: e.target.value.toUpperCase() }))}
                        placeholder="ABC123"
                        className="w-full h-9 px-3 text-[13px] focus:outline-none" style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium mb-1 block" style={{ color: '#6E6D68' }}>Pris (kr)</label>
                    <input type="number" value={manualCar.pris} onChange={e => setManualCar(v => ({ ...v, pris: e.target.value }))}
                      placeholder="0"
                      className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-5">
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedFromStep1}
                  className="px-5 h-9 rounded-lg text-[13px] font-medium transition"
                  style={{ background: canProceedFromStep1 ? '#0F6E56' : '#F7F6F3', color: canProceedFromStep1 ? 'white' : '#9CA3AF' }}>
                  Nästa
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Customer ── */}
          {step === 2 && (
            <div>
              <h2 className="text-[14px] font-medium mb-4" style={{ color: '#1C1C1A' }}>Kund</h2>

              <div className="flex gap-0.5 p-1 rounded-lg mb-4 w-fit" style={{ background: '#F7F6F3', border: '1px solid #E5E4E0' }}>
                <button onClick={() => setUseNewCustomer(false)}
                  className="px-4 h-7 rounded-md text-[12px] transition"
                  style={{ background: !useNewCustomer ? '#FFFFFF' : 'transparent', color: !useNewCustomer ? '#1C1C1A' : '#6E6D68', fontWeight: !useNewCustomer ? 500 : 400, border: !useNewCustomer ? '1px solid #E5E4E0' : 'none' }}>
                  Befintlig kund
                </button>
                <button onClick={() => setUseNewCustomer(true)}
                  className="px-4 h-7 rounded-md text-[12px] transition"
                  style={{ background: useNewCustomer ? '#FFFFFF' : 'transparent', color: useNewCustomer ? '#1C1C1A' : '#6E6D68', fontWeight: useNewCustomer ? 500 : 400, border: useNewCustomer ? '1px solid #E5E4E0' : 'none' }}>
                  Ny kund
                </button>
              </div>

              {!useNewCustomer ? (
                <div>
                  <div className="flex gap-2 mb-3">
                    <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchCustomers()}
                      placeholder="Sök namn, telefon, e-post…"
                      className="flex-1 h-9 px-3 rounded-lg text-[14px] focus:outline-none"
                      style={{ border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A' }} />
                    <button onClick={searchCustomers} className="px-4 h-9 rounded-lg text-[13px] font-medium" style={{ background: '#0F6E56', color: 'white' }}>Sök</button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {customerResults.map(c => (
                      <button key={c.id} onClick={() => setSelectedCustomer(prev => prev?.id === c.id ? null : c)}
                        className="w-full text-left px-4 py-3 rounded-lg transition"
                        style={{ border: selectedCustomer?.id === c.id ? '1px solid #0F6E56' : '1px solid #E5E4E0', background: selectedCustomer?.id === c.id ? '#EEF7F4' : '#FFFFFF' }}>
                        <div className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>{c.namn}</div>
                        <div className="text-[12px]" style={{ color: '#6E6D68' }}>{[c.telefon, c.mejl].filter(Boolean).join(' · ')}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[12px] mt-2" style={{ color: '#6E6D68' }}>Kund kan läggas till senare.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {([
                    { placeholder: 'Kundens namn *', key: 'namn' },
                    { placeholder: 'Telefon', key: 'telefon' },
                    { placeholder: 'E-post', key: 'mejl' },
                  ] as { placeholder: string; key: keyof typeof newCustomer }[]).map(f => (
                    <input key={f.key} value={newCustomer[f.key]}
                      onChange={e => setNewCustomer(v => ({ ...v, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full h-9 px-3 text-[13px] focus:outline-none"
                      style={inputStyle} />
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

          {/* ── STEP 3: Confirm ── */}
          {step === 3 && (
            <div>
              <h2 className="text-[14px] font-medium mb-4 flex items-center gap-2" style={{ color: '#1C1C1A' }}>
                <FileText className="w-4 h-4" style={{ color: '#6E6D68' }} />
                Sammanfattning
              </h2>

              <div className="rounded-lg p-4 space-y-2 mb-5" style={{ background: '#F7F6F3', border: '1px solid #E5E4E0' }}>
                {([
                  ['Bil', selectedCar
                    ? `${selectedCar.marke} ${selectedCar.modell} ${selectedCar.ar}`
                    : `${manualCar.marke} ${manualCar.modell} ${manualCar.ar}`],
                  ['Regnummer', selectedCar?.regnummer ?? manualCar.regnummer ?? '—'],
                  ['Handlare', selectedCar?.dealers?.foretagsnamn ?? '—'],
                  ['Kund', useNewCustomer ? (newCustomer.namn || '(ny kund)') : (selectedCustomer?.namn ?? '(ingen vald – läggs till senare)')],
                ] as [string, string][]).map(([label, val]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-[12px] shrink-0" style={{ color: '#6E6D68' }}>{label}</span>
                    <span className="text-[13px] font-medium text-right" style={{ color: '#1C1C1A' }}>{val}</span>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-[12px] font-medium mb-1.5 block" style={{ color: '#6E6D68' }}>Anteckningar (valfritt)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Inledande noteringar om affären…"
                  className="w-full px-3 py-2 text-[13px] focus:outline-none resize-none"
                  style={{ border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A', borderRadius: 8 }} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer mb-5" onClick={() => setDistanceSale(v => !v)}>
                <div className="w-10 h-5 rounded-full relative transition shrink-0" style={{ background: distanceSale ? '#0F6E56' : '#E5E4E0' }}>
                  <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: distanceSale ? '22px' : '2px' }} />
                </div>
                <span className="text-[13px]" style={{ color: '#1C1C1A' }}>Distansförsäljning (ångerrätt 14 dagar)</span>
              </label>

              {error && (
                <div className="text-[13px] rounded-lg px-4 py-3 mb-4" style={{ background: '#FCEBEB', color: '#791F1F' }}>{error}</div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-[13px]" style={{ color: '#6E6D68' }}>Tillbaka</button>
                <button onClick={handleCreate} disabled={saving}
                  className="flex items-center gap-2 px-5 h-9 rounded-lg text-[13px] font-medium transition"
                  style={{ background: '#0F6E56', color: 'white', opacity: saving ? 0.7 : 1 }}>
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
