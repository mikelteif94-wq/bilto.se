import { useState, useEffect, useMemo } from 'react';
import { X, Search, Loader2, ChevronRight, Check, Plus, Minus } from 'lucide-react';
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
  { id: 'financing',    label: 'Billån via Marginalen',   type: 'FINANSIERING', price: 8500,  kickback: 5950 },
  { id: 'insurance_12', label: 'Helförsäkring lf (12 mån)', type: 'FÖRSÄKRING',  price: 1800,  kickback: 900  },
  { id: 'warranty_24',  label: 'Fordonsgaranti 24 mån',   type: 'GARANTI',     price: 6900,  kickback: 3450 },
  { id: 'winter',       label: 'Vinterhjulet komplett',   type: 'HJUL',        price: 12000, kickback: 0    },
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

const STEPS = ['KUND', 'AFFÄRSKORT', 'HANDLARGODKÄNNANDE', 'RESERVATIONSAVGIFT', 'ÖVERLÄMNING'];

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

  const calcPanel = (
    <div className="w-72 shrink-0 bg-slate-900 rounded-2xl p-5 text-white">
      <div className="text-[11px] font-bold text-slate-400 tracking-widest mb-4">KALKYL (INTERN)</div>
      <div className="space-y-2 text-sm">
        {[
          ['Utpris', fmtKr(utpris), false],
          ['Prisgolv (intern)', fmtKr(prisgolv), false],
          ['Förhandlingsutrymme', fmtKr(maxRabatt), false],
        ].map(([label, val]) => (
          <div key={String(label)} className="flex justify-between">
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
            <span className="font-medium">{val}</span>
          </div>
        ))}
        <div className="border-t my-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <div className="flex justify-between">
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Kundens pris</span>
          <span className="font-bold">{fmtKr(kundensPris)}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Rabatt till kund</span>
          <span className="font-medium" style={{ color: rabatt > 0 ? '#F59E0B' : 'rgba(255,255,255,0.5)' }}>{rabatt > 0 ? '−' : ''}{fmtKr(rabatt)}</span>
        </div>
        {tradeInBud > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Inbyte</span>
            <span className="font-medium" style={{ color: '#00A85A' }}>−{fmtKr(tradeInBud)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Tillägg</span>
          <span className="font-medium" style={{ color: addonsTotal > 0 ? 'white' : 'rgba(255,255,255,0.5)' }}>
            {addonsTotal > 0 ? `+${fmtKr(addonsTotal)}` : fmtKr(0)}
          </span>
        </div>
        <div className="flex justify-between border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <span className="font-semibold">Att betala (kund)</span>
          <span className="font-bold text-base">{fmtKr(attBetala)}</span>
        </div>
        <div className="border-t mt-2 pt-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <div className="flex justify-between">
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Provision (bytesavd)</span>
          <span className="font-medium">{fmtKr(provision)}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Kickback (plattform + säljare)</span>
          <span className="font-medium">{fmtKr(kickbackTotal)}</span>
        </div>
        <div className="flex justify-between border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <span className="font-semibold">Intjäning</span>
          <span className="font-bold text-base" style={{ color: '#00A85A' }}>{fmtKr(intjaning)}</span>
        </div>
      </div>
      {selectedCustomer && (
        <>
          <div className="border-t mt-4 pt-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="text-[11px] font-bold text-slate-400 tracking-widest mb-2">KUND</div>
            <div className="text-sm font-semibold">{selectedCustomer.namn}</div>
            {selectedCustomer.telefon && <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedCustomer.telefon}</div>}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              BYGG AFFÄR · {car.marke} {car.modell} {car.ar}
              {car.regnummer && <span className="ml-2 font-mono normal-case text-slate-300">{car.regnummer}</span>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          {/* Step tabs */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition"
                    style={{
                      background: active ? '#0A1628' : done ? '#00A85A' : '#F3F4F6',
                      color: active || done ? 'white' : '#9CA3AF',
                    }}
                  >
                    {done ? <Check className="w-3 h-3" /> : <span>{n}</span>}
                    <span>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-200" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-6">

            {/* STEP 1: KUND */}
            {step === 1 && (
              <div>
                <div className="text-xs font-bold tracking-widest text-slate-400 mb-4">STEG 1 · IDENTIFIERA KUND</div>

                <div className="flex gap-2 mb-1">
                  <button
                    onClick={() => setNewCustomerMode(false)}
                    className="px-4 py-1.5 rounded-full text-xs font-bold transition"
                    style={{ background: !newCustomerMode ? '#0A1628' : '#F3F4F6', color: !newCustomerMode ? 'white' : '#6B7280' }}
                  >
                    Befintlig kund
                  </button>
                  <button
                    onClick={() => setNewCustomerMode(true)}
                    className="px-4 py-1.5 rounded-full text-xs font-bold transition"
                    style={{ background: newCustomerMode ? '#0A1628' : '#F3F4F6', color: newCustomerMode ? 'white' : '#6B7280' }}
                  >
                    Ny kund
                  </button>
                </div>

                {!newCustomerMode ? (
                  <div className="mt-4">
                    <div className="flex gap-2 mb-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && searchCustomers()}
                          placeholder="Sök namn, telefon, e-post…"
                          className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                        />
                      </div>
                      <button
                        onClick={searchCustomers}
                        disabled={customerLoading}
                        className="px-4 h-10 rounded-xl text-sm font-bold"
                        style={{ background: '#0A1628', color: 'white' }}
                      >
                        {customerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sök'}
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {customerResults.map(c => (
                        <label
                          key={c.id}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition"
                          style={{ borderColor: selectedCustomer?.id === c.id ? '#00A85A' : '#E5E7EB', background: selectedCustomer?.id === c.id ? '#F0FDF4' : 'white' }}
                        >
                          <input
                            type="radio"
                            name="customer"
                            checked={selectedCustomer?.id === c.id}
                            onChange={() => setSelectedCustomer(c)}
                            className="accent-green-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 text-sm">{c.namn}</div>
                            <div className="text-xs text-slate-400">
                              {c.telefon ?? c.mejl ?? '—'}
                            </div>
                          </div>
                        </label>
                      ))}
                      {customerResults.length === 0 && customerSearch && !customerLoading && (
                        <p className="text-xs text-slate-400 text-center py-4">Inga träffar — prova ny kund.</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">BankID-identifiering och kreditunderlag genomförs vid signering (steg 4).</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <input value={newCustomer.namn} onChange={e => setNewCustomer(p => ({ ...p, namn: e.target.value }))} placeholder="Namn *" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400" />
                    <input value={newCustomer.telefon} onChange={e => setNewCustomer(p => ({ ...p, telefon: e.target.value }))} placeholder="Telefon" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400" />
                    <input value={newCustomer.mejl} onChange={e => setNewCustomer(p => ({ ...p, mejl: e.target.value }))} placeholder="E-post" className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: AFFÄRSKORT */}
            {step === 2 && (
              <div className="space-y-5">
                {/* Price slider */}
                <div className="bg-slate-50 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-900">Pris & rabatt</span>
                    <span className="text-xs text-slate-400">Utrymme: {fmtKr(maxRabatt)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxRabatt}
                    step={500}
                    value={rabatt}
                    onChange={e => setRabatt(Number(e.target.value))}
                    className="w-full h-2 accent-blue-600 mb-3"
                    style={{ accentColor: '#0A1628' }}
                  />
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">Golv {fmtKr(prisgolv)}</div>
                      {rabatt > 0 && <div className="text-xs" style={{ color: '#F59E0B' }}>Rabatt till kund: {fmtKr(rabatt)}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">{fmtKr(kundensPris)}</div>
                      <div className="text-xs text-slate-400">Utpris {fmtKr(utpris)}</div>
                    </div>
                  </div>
                </div>

                {/* Trade-in */}
                <div>
                  <div className="text-sm font-bold text-slate-900 mb-2">Inbyte (loggad värdering)</div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition"
                      style={{ borderColor: tradeInMode === 'none' ? '#00A85A' : '#E5E7EB', background: tradeInMode === 'none' ? '#F0FDF4' : 'white' }}>
                      <input type="radio" name="tradein" checked={tradeInMode === 'none'} onChange={() => setTradeInMode('none')} className="accent-green-600" />
                      <span className="text-sm font-semibold text-slate-700">Inget inbyte</span>
                    </label>
                    {valuations.map(v => (
                      <label key={v.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition"
                        style={{ borderColor: (tradeInMode === 'valuation' && selectedValuation?.id === v.id) ? '#00A85A' : '#E5E7EB', background: (tradeInMode === 'valuation' && selectedValuation?.id === v.id) ? '#F0FDF4' : 'white' }}>
                        <input type="radio" name="tradein" checked={tradeInMode === 'valuation' && selectedValuation?.id === v.id} onChange={() => { setTradeInMode('valuation'); setSelectedValuation(v); }} className="accent-green-600" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-700">{v.marke} {v.modell} {v.regnummer && `(${v.regnummer})`}</div>
                          <div className="text-xs text-slate-400">Rekommenderat bud: {fmtKr(v.bid_recommended)}</div>
                        </div>
                      </label>
                    ))}
                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition"
                      style={{ borderColor: (tradeInMode === 'valuation' && !selectedValuation) ? '#00A85A' : '#E5E7EB', background: (tradeInMode === 'valuation' && !selectedValuation) ? '#F0FDF4' : 'white' }}>
                      <input type="radio" name="tradein" checked={tradeInMode === 'valuation' && !selectedValuation} onChange={() => { setTradeInMode('valuation'); setSelectedValuation(null); }} className="accent-green-600" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-700">Manuellt inbytespris</div>
                        {tradeInMode === 'valuation' && !selectedValuation && (
                          <input
                            value={manualTradeIn}
                            onChange={e => setManualTradeIn(e.target.value)}
                            placeholder="t.ex. 85000"
                            className="mt-1 w-full h-8 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                            onClick={e => e.stopPropagation()}
                          />
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Add-ons */}
                <div>
                  <div className="text-sm font-bold text-slate-900 mb-2">Tillägg (kickback)</div>
                  <div className="space-y-2">
                    {ADDONS.map(a => {
                      const checked = checkedAddons.has(a.id);
                      return (
                        <label key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition"
                          style={{ borderColor: checked ? '#00A85A' : '#E5E7EB', background: checked ? '#F0FDF4' : 'white' }}>
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition"
                            style={{ borderColor: checked ? '#00A85A' : '#D1D5DB', background: checked ? '#00A85A' : 'white' }}
                            onClick={() => setCheckedAddons(prev => {
                              const next = new Set(prev);
                              if (next.has(a.id)) next.delete(a.id); else next.add(a.id);
                              return next;
                            })}
                          >
                            {checked && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-700">{a.label}</div>
                            <div className="text-xs text-slate-400">{a.type} · {fmtKr(a.price)}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <div className="text-sm font-bold text-slate-900 mb-2">Anteckningar</div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Inledande noteringar om affären…"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 resize-none"
                  />
                </div>

                {saveError && (
                  <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{saveError}</div>
                )}
              </div>
            )}
          </div>

          {/* Calc panel */}
          <div className="p-4 shrink-0">
            {calcPanel}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            {step === 1 ? 'Avbryt' : 'Föregående'}
          </button>
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              disabled={!newCustomerMode && !selectedCustomer}
              className="px-6 py-2.5 rounded-xl text-sm font-bold transition"
              style={{ background: (newCustomerMode && newCustomer.namn) || selectedCustomer ? '#00A85A' : '#E5E7EB', color: (newCustomerMode && newCustomer.namn) || selectedCustomer ? 'white' : '#9CA3AF' }}
            >
              NÄSTA
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition"
              style={{ background: '#00A85A', color: 'white', opacity: saving ? 0.7 : 1 }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              SKICKA TILL HANDLARE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
