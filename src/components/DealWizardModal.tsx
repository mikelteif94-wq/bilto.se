import { useState, useEffect, useMemo } from 'react';
import { X, Search, Loader2, Check } from 'lucide-react';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

export interface WizardCar {
  id: string;
  marke: string;
  modell: string;
  ar: number;
  regnummer: string | null;
  startbud: number | null;
  pool_prisgolv: number | null;
  pool_rabattutrymme_kr: number | null;
  dealer_id: string | null;
  dealers: { id: string; foretagsnamn: string } | null;
}

interface Customer {
  id: string;
  namn: string;
  telefon: string | null;
  mejl: string | null;
}

interface Valuation {
  id: string;
  regnummer: string | null;
  marke: string | null;
  modell: string | null;
  bid_recommended: number;
}

const PROVISION_RATE = 0.04;

const ADDONS = [
  { id: 'financing',    label: 'Billån via Marginalen',     type: 'Finansiering', price: 8500,  kickback: 5950 },
  { id: 'insurance_12', label: 'Helförsäkring lf (12 mån)', type: 'Försäkring',   price: 1800,  kickback: 900  },
  { id: 'warranty_24',  label: 'Fordonsgaranti 24 mån',     type: 'Garanti',      price: 6900,  kickback: 3450 },
  { id: 'winter',       label: 'Vinterhjulet komplett',     type: 'Hjul',         price: 12000, kickback: 0    },
];

interface Props {
  car: WizardCar;
  staffUser: StaffUser;
  onClose: () => void;
  onCreated: (dealId: string) => void;
}

function fmtKr(v: number) {
  return v.toLocaleString('sv-SE') + ' kr';
}

const STEPS = ['Kund', 'Affärskort', 'Godkännande', 'Betalning', 'Överlämning'];

const inputStyle = {
  border: '1px solid #E5E4E0',
  background: '#F7F6F3',
  color: '#1C1C1A',
  borderRadius: 8,
};

export default function DealWizardModal({ car, staffUser, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Step 1 – customer
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ namn: '', telefon: '', mejl: '' });

  // Step 2 – deal sheet
  const utpris = car.startbud ?? 0;
  const prisgolv = car.pool_prisgolv ?? Math.round(utpris * 0.93);
  const maxRabatt = Math.max(0, utpris - prisgolv);
  const [rabatt, setRabatt] = useState(0);
  const [checkedAddons, setCheckedAddons] = useState<Set<string>>(new Set());
  const [tradeInMode, setTradeInMode] = useState<'none' | 'valuation'>('none');
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [selectedValuation, setSelectedValuation] = useState<Valuation | null>(null);
  const [manualTradeIn, setManualTradeIn] = useState('');
  const [notes, setNotes] = useState('');

  // Calc
  const kundensPris = utpris - rabatt;
  const addonsTotal = useMemo(() => {
    let s = 0;
    checkedAddons.forEach(id => { s += ADDONS.find(a => a.id === id)?.price ?? 0; });
    return s;
  }, [checkedAddons]);
  const kickbackTotal = useMemo(() => {
    let s = 0;
    checkedAddons.forEach(id => { s += ADDONS.find(a => a.id === id)?.kickback ?? 0; });
    return s;
  }, [checkedAddons]);
  const tradeInBud = tradeInMode === 'valuation' && selectedValuation
    ? selectedValuation.bid_recommended
    : tradeInMode === 'valuation' && manualTradeIn
    ? parseInt(manualTradeIn.replace(/\D/g, '')) || 0
    : 0;
  const attBetala = kundensPris + addonsTotal - tradeInBud;
  const provision = Math.round(kundensPris * PROVISION_RATE);
  const intjaning = provision + kickbackTotal;

  useEffect(() => {
    if (!selectedCustomer) return;
    supabase
      .from('valuations')
      .select('id, regnummer, marke, modell, bid_recommended')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setValuations((data ?? []) as Valuation[]));
  }, [selectedCustomer]);

  async function searchCustomers() {
    if (!customerSearch.trim()) return;
    setCustomerLoading(true);
    const { data } = await supabase
      .from('customers')
      .select('id, namn, telefon, mejl')
      .or(`namn.ilike.%${customerSearch}%,telefon.ilike.%${customerSearch}%,mejl.ilike.%${customerSearch}%`)
      .limit(8);
    setCustomerResults((data ?? []) as Customer[]);
    setCustomerLoading(false);
  }

  async function handleCreate() {
    setSaving(true);
    setSaveError(null);

    let customerId: string | null = null;
    if (newCustomerMode && newCustomer.namn) {
      const { data: c, error: cErr } = await supabase
        .from('customers')
        .insert({ namn: newCustomer.namn, telefon: newCustomer.telefon || null, mejl: newCustomer.mejl || null })
        .select('id').single();
      if (cErr) { setSaveError('Kunde inte skapa kund.'); setSaving(false); return; }
      customerId = c.id;
    } else if (selectedCustomer) {
      customerId = selectedCustomer.id;
    }

    const { data: deal, error: dErr } = await supabase
      .from('deals')
      .insert({
        assigned_staff_user_id: staffUser.id,
        customer_id: customerId,
        car_id: car.id,
        dealer_id: car.dealer_id,
        notes: notes || null,
        distance_sale: false,
        status: 'sent_for_approval',
      })
      .select('id').single();
    if (dErr) { setSaveError('Kunde inte skapa affär: ' + dErr.message); setSaving(false); return; }

    const lines = [
      { deal_id: deal.id, line_type: 'car', description: `${car.marke} ${car.modell} ${car.ar}${car.regnummer ? ` (${car.regnummer})` : ''}`, list_price: utpris, negotiated_price: kundensPris, kickback_amount: 0, sort_order: 0 },
    ];
    if (tradeInBud > 0) {
      lines.push({ deal_id: deal.id, line_type: 'trade_in', description: selectedValuation ? `Inbyte ${selectedValuation.regnummer ?? ''}` : 'Inbyte', list_price: tradeInBud, negotiated_price: tradeInBud, kickback_amount: 0, sort_order: 1 });
    }
    ADDONS.forEach((a, i) => {
      if (checkedAddons.has(a.id)) {
        lines.push({ deal_id: deal.id, line_type: 'addon', description: a.label, list_price: a.price, negotiated_price: a.price, kickback_amount: a.kickback, sort_order: 10 + i });
      }
    });
    await supabase.from('deal_lines').insert(lines);

    await supabase.from('deal_events').insert({
      deal_id: deal.id, event_type: 'created', actor_type: 'staff',
      actor_id: staffUser.user_id, actor_name: `${staffUser.fornamn} ${staffUser.efternamn}`,
      payload_json: { car: `${car.marke} ${car.modell}`, sent_for_approval: true },
    });

    setSaving(false);
    onCreated(deal.id);
  }

  const step1Ok = newCustomerMode ? !!newCustomer.namn : !!selectedCustomer;

  const calcPanel = (
    <div className="w-64 shrink-0 rounded-xl p-4" style={{ background: '#1C1C1A', border: '1px solid #2E2E2A' }}>
      <div className="text-[11px] font-medium mb-3" style={{ color: '#6E6D68', letterSpacing: '0.05em' }}>Kalkyl (intern)</div>
      <div className="space-y-1.5">
        {([
          ['Utpris', fmtKr(utpris)],
          ['Prisgolv', fmtKr(prisgolv)],
          ['Utrymme', fmtKr(maxRabatt)],
        ] as [string, string][]).map(([label, val]) => (
          <div key={label} className="flex justify-between items-baseline">
            <span className="text-[12px]" style={{ color: '#6E6D68' }}>{label}</span>
            <span className="text-[12px]" style={{ color: '#A3A29E', fontFamily: 'JetBrains Mono, monospace' }}>{val}</span>
          </div>
        ))}

        <div className="my-2" style={{ borderTop: '1px solid #2E2E2A' }} />

        <div className="flex justify-between items-baseline">
          <span className="text-[12px]" style={{ color: '#6E6D68' }}>Kundens pris</span>
          <span className="text-[13px] font-medium" style={{ color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(kundensPris)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[12px]" style={{ color: '#6E6D68' }}>Rabatt</span>
          <span className="text-[12px]" style={{ color: rabatt > 0 ? '#854F0B' : '#6E6D68', fontFamily: 'JetBrains Mono, monospace' }}>
            {rabatt > 0 ? `−${fmtKr(rabatt)}` : fmtKr(0)}
          </span>
        </div>
        {tradeInBud > 0 && (
          <div className="flex justify-between items-baseline">
            <span className="text-[12px]" style={{ color: '#6E6D68' }}>Inbyte</span>
            <span className="text-[12px]" style={{ color: '#085041', fontFamily: 'JetBrains Mono, monospace' }}>−{fmtKr(tradeInBud)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline">
          <span className="text-[12px]" style={{ color: '#6E6D68' }}>Tillägg</span>
          <span className="text-[12px]" style={{ color: addonsTotal > 0 ? '#FFFFFF' : '#6E6D68', fontFamily: 'JetBrains Mono, monospace' }}>
            {addonsTotal > 0 ? `+${fmtKr(addonsTotal)}` : fmtKr(0)}
          </span>
        </div>
        <div className="flex justify-between items-baseline pt-2" style={{ borderTop: '1px solid #2E2E2A' }}>
          <span className="text-[13px] font-medium" style={{ color: '#FFFFFF' }}>Att betala</span>
          <span className="text-[14px] font-medium" style={{ color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(attBetala)}</span>
        </div>

        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #2E2E2A' }}>
          <div className="text-[11px] font-medium mb-1.5" style={{ color: '#6E6D68', letterSpacing: '0.05em' }}>Intjäning</div>
          <div className="flex justify-between items-baseline">
            <span className="text-[12px]" style={{ color: '#6E6D68' }}>Provision (4%)</span>
            <span className="text-[12px]" style={{ color: '#A3A29E', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(provision)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[12px]" style={{ color: '#6E6D68' }}>Kickback</span>
            <span className="text-[12px]" style={{ color: '#A3A29E', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(kickbackTotal)}</span>
          </div>
          <div className="flex justify-between items-baseline pt-1.5" style={{ borderTop: '1px solid #2E2E2A' }}>
            <span className="text-[13px] font-medium" style={{ color: '#FFFFFF' }}>Intjäning</span>
            <span className="text-[14px] font-medium" style={{ color: '#0F6E56', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(intjaning)}</span>
          </div>
        </div>

        {selectedCustomer && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #2E2E2A' }}>
            <div className="text-[11px] font-medium mb-1" style={{ color: '#6E6D68', letterSpacing: '0.05em' }}>Kund</div>
            <div className="text-[13px] font-medium" style={{ color: '#FFFFFF' }}>{selectedCustomer.namn}</div>
            {selectedCustomer.telefon && <div className="text-[12px]" style={{ color: '#6E6D68' }}>{selectedCustomer.telefon}</div>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

        {/* Header */}
        <div className="px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #E5E4E0' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium" style={{ color: '#6E6D68' }}>Bygg affär</span>
              <span style={{ color: '#E5E4E0' }}>·</span>
              <span className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{car.marke} {car.modell} {car.ar}</span>
              {car.regnummer && (
                <span className="text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                  {car.regnummer}
                </span>
              )}
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center transition hover:bg-[#F7F6F3]">
              <X className="w-4 h-4" style={{ color: '#6E6D68' }} />
            </button>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: active ? '#0F6E56' : done ? '#E1F5EE' : '#F7F6F3',
                        border: active ? 'none' : done ? '1px solid #E1F5EE' : '1px solid #E5E4E0',
                      }}
                    >
                      {done
                        ? <Check className="w-2.5 h-2.5" style={{ color: '#085041' }} />
                        : <span className="text-[10px] font-medium" style={{ color: active ? '#FFFFFF' : '#6E6D68' }}>{n}</span>
                      }
                    </div>
                    <span className="text-[12px] hidden sm:block" style={{ color: active ? '#1C1C1A' : '#6E6D68', fontWeight: active ? 500 : 400 }}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-6 h-px" style={{ background: '#E5E4E0' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          <div className="flex-1 overflow-y-auto p-5">

            {/* STEP 1: KUND */}
            {step === 1 && (
              <div>
                <div className="text-[13px] font-medium mb-4" style={{ color: '#1C1C1A' }}>Identifiera kund</div>

                {/* Toggle */}
                <div className="flex gap-0.5 p-1 rounded-lg mb-4 w-fit" style={{ background: '#F7F6F3', border: '1px solid #E5E4E0' }}>
                  {(['Befintlig kund', 'Ny kund'] as const).map((label, i) => {
                    const isNew = i === 1;
                    const active = newCustomerMode === isNew;
                    return (
                      <button key={label} onClick={() => setNewCustomerMode(isNew)}
                        className="px-4 h-7 rounded-md text-[12px] transition"
                        style={{ background: active ? '#FFFFFF' : 'transparent', color: active ? '#1C1C1A' : '#6E6D68', fontWeight: active ? 500 : 400, border: active ? '1px solid #E5E4E0' : 'none' }}>
                        {label}
                      </button>
                    );
                  })}
                </div>

                {!newCustomerMode ? (
                  <div>
                    <div className="flex gap-2 mb-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#6E6D68' }} />
                        <input
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && searchCustomers()}
                          placeholder="Sök namn, telefon, e-post…"
                          className="w-full h-9 pl-8 pr-3 text-[14px] focus:outline-none"
                          style={{ ...inputStyle, borderRadius: 8 }}
                        />
                      </div>
                      <button
                        onClick={searchCustomers}
                        disabled={customerLoading}
                        className="px-4 h-9 rounded-lg text-[13px] font-medium"
                        style={{ background: '#0F6E56', color: '#FFFFFF' }}
                      >
                        {customerLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sök'}
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {customerResults.map(c => (
                        <label
                          key={c.id}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition"
                          style={{
                            border: selectedCustomer?.id === c.id ? '1px solid #0F6E56' : '1px solid #E5E4E0',
                            background: selectedCustomer?.id === c.id ? '#EEF7F4' : '#FFFFFF',
                          }}
                        >
                          <input
                            type="radio"
                            name="customer"
                            checked={selectedCustomer?.id === c.id}
                            onChange={() => setSelectedCustomer(c)}
                            style={{ accentColor: '#0F6E56' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>{c.namn}</div>
                            <div className="text-[12px]" style={{ color: '#6E6D68' }}>{c.telefon ?? c.mejl ?? '—'}</div>
                          </div>
                        </label>
                      ))}
                      {customerResults.length === 0 && customerSearch && !customerLoading && (
                        <p className="text-[13px] text-center py-4" style={{ color: '#6E6D68' }}>Inga träffar — prova ny kund.</p>
                      )}
                    </div>
                    <p className="text-[12px] mt-3" style={{ color: '#6E6D68' }}>BankID-identifiering genomförs vid signering.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {[
                      { key: 'namn', placeholder: 'Namn *' },
                      { key: 'telefon', placeholder: 'Telefon' },
                      { key: 'mejl', placeholder: 'E-post' },
                    ].map(({ key, placeholder }) => (
                      <input
                        key={key}
                        value={newCustomer[key as keyof typeof newCustomer]}
                        onChange={e => setNewCustomer(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full h-9 px-3 text-[14px] focus:outline-none"
                        style={inputStyle}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: AFFÄRSKORT */}
            {step === 2 && (
              <div className="space-y-5">
                {/* Price slider */}
                <div className="rounded-lg p-4" style={{ background: '#F7F6F3', border: '1px solid #E5E4E0' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>Pris och rabatt</span>
                    <span className="text-[12px]" style={{ color: '#6E6D68' }}>Utrymme: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(maxRabatt)}</span></span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxRabatt}
                    step={500}
                    value={rabatt}
                    onChange={e => setRabatt(Number(e.target.value))}
                    className="w-full mb-3"
                    style={{ accentColor: '#0F6E56' }}
                  />
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[12px]" style={{ color: '#6E6D68' }}>Golv <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(prisgolv)}</span></div>
                      {rabatt > 0 && <div className="text-[12px] mt-0.5" style={{ color: '#854F0B' }}>Rabatt: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(rabatt)}</span></div>}
                    </div>
                    <div className="text-right">
                      <div className="text-[22px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(kundensPris)}</div>
                      <div className="text-[12px]" style={{ color: '#6E6D68' }}>Utpris <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(utpris)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Trade-in */}
                <div>
                  <div className="text-[13px] font-medium mb-2" style={{ color: '#1C1C1A' }}>Inbyte</div>
                  <div className="space-y-1.5">
                    {[{ id: 'none-opt', label: 'Inget inbyte', sub: null }].concat(
                      valuations.map(v => ({ id: v.id, label: `${v.marke ?? ''} ${v.modell ?? ''} ${v.regnummer ? `(${v.regnummer})` : ''}`.trim(), sub: `Rekommenderat bud: ${fmtKr(v.bid_recommended)}` }))
                    ).map(opt => {
                      const isNone = opt.id === 'none-opt';
                      const v = !isNone ? valuations.find(vv => vv.id === opt.id) : null;
                      const active = isNone ? tradeInMode === 'none' : (tradeInMode === 'valuation' && selectedValuation?.id === opt.id);
                      return (
                        <label key={opt.id} className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition"
                          style={{ border: active ? '1px solid #0F6E56' : '1px solid #E5E4E0', background: active ? '#EEF7F4' : '#FFFFFF' }}>
                          <input type="radio" name="tradein"
                            checked={active}
                            onChange={() => { if (isNone) { setTradeInMode('none'); setSelectedValuation(null); } else { setTradeInMode('valuation'); setSelectedValuation(v!); } }}
                            style={{ accentColor: '#0F6E56' }} />
                          <div>
                            <div className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{opt.label}</div>
                            {opt.sub && <div className="text-[12px]" style={{ color: '#6E6D68' }}>{opt.sub}</div>}
                          </div>
                        </label>
                      );
                    })}
                    <label className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition"
                      style={{ border: (tradeInMode === 'valuation' && !selectedValuation) ? '1px solid #0F6E56' : '1px solid #E5E4E0', background: (tradeInMode === 'valuation' && !selectedValuation) ? '#EEF7F4' : '#FFFFFF' }}>
                      <input type="radio" name="tradein"
                        checked={tradeInMode === 'valuation' && !selectedValuation}
                        onChange={() => { setTradeInMode('valuation'); setSelectedValuation(null); }}
                        style={{ accentColor: '#0F6E56' }} />
                      <div className="flex-1">
                        <div className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>Manuellt inbytespris</div>
                        {tradeInMode === 'valuation' && !selectedValuation && (
                          <input
                            value={manualTradeIn}
                            onChange={e => setManualTradeIn(e.target.value)}
                            placeholder="t.ex. 85000"
                            className="mt-1.5 w-full h-8 px-3 text-[13px] focus:outline-none"
                            style={inputStyle}
                            onClick={e => e.stopPropagation()}
                          />
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Add-ons */}
                <div>
                  <div className="text-[13px] font-medium mb-2" style={{ color: '#1C1C1A' }}>Tillägg med kickback</div>
                  <div className="space-y-1.5">
                    {ADDONS.map(a => {
                      const checked = checkedAddons.has(a.id);
                      return (
                        <label key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition"
                          style={{ border: checked ? '1px solid #0F6E56' : '1px solid #E5E4E0', background: checked ? '#EEF7F4' : '#FFFFFF' }}
                          onClick={() => setCheckedAddons(prev => {
                            const next = new Set(prev);
                            if (next.has(a.id)) next.delete(a.id); else next.add(a.id);
                            return next;
                          })}>
                          <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                            style={{ background: checked ? '#0F6E56' : '#FFFFFF', border: checked ? 'none' : '1px solid #E5E4E0' }}>
                            {checked && <Check className="w-2.5 h-2.5" style={{ color: '#FFFFFF' }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{a.label}</div>
                            <div className="text-[12px]" style={{ color: '#6E6D68' }}>
                              {a.type} · <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(a.price)}</span>
                              {a.kickback > 0 && <span> · kickback <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(a.kickback)}</span></span>}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <div className="text-[13px] font-medium mb-2" style={{ color: '#1C1C1A' }}>Anteckningar</div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Noteringar om affären…"
                    className="w-full px-3 py-2 text-[13px] focus:outline-none resize-none"
                    style={{ ...inputStyle, borderRadius: 8 }}
                  />
                </div>

                {saveError && (
                  <div className="text-[13px] rounded-lg px-4 py-3" style={{ background: '#FCEBEB', color: '#791F1F' }}>{saveError}</div>
                )}
              </div>
            )}
          </div>

          {/* Calc panel */}
          <div className="p-4 shrink-0 hidden sm:block">
            {calcPanel}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 shrink-0 flex items-center justify-between" style={{ borderTop: '1px solid #E5E4E0' }}>
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="text-[13px] transition"
            style={{ color: '#6E6D68' }}
          >
            {step === 1 ? 'Avbryt' : 'Föregående'}
          </button>
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              disabled={!step1Ok}
              className="px-5 h-9 rounded-lg text-[13px] font-medium transition"
              style={{ background: step1Ok ? '#0F6E56' : '#F7F6F3', color: step1Ok ? '#FFFFFF' : '#6E6D68' }}
            >
              Nästa
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-2 px-5 h-9 rounded-lg text-[13px] font-medium transition"
              style={{ background: '#0F6E56', color: '#FFFFFF', opacity: saving ? 0.7 : 1 }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Skicka till handlare
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
