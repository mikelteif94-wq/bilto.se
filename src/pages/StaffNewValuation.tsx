import { useState } from 'react';
import {
  Star, ChevronLeft, ChevronRight, Loader2, Check,
  Car, Wrench, Shield, Snowflake, AlertCircle,
} from 'lucide-react';
import StaffShell from '../components/StaffShell';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

interface StaffNewValuationProps {
  staffUser: StaffUser;
  onLoggedOut: () => void;
  onCreated: (id: string) => void;
  onCancel: () => void;
  linkedDealId?: string | null;
}

interface ConditionField {
  key: string;
  label: string;
  icon: React.ReactNode;
  options: { value: string; label: string; avdrag: number }[];
}

const CONDITION_FIELDS: ConditionField[] = [
  {
    key: 'teknik',
    label: 'Tekniskt skick',
    icon: <Wrench className="w-4 h-4" />,
    options: [
      { value: 'ok', label: 'OK – inga fel', avdrag: 0 },
      { value: 'minor', label: 'Mindre fel (lampor, etc.)', avdrag: 3000 },
      { value: 'major', label: 'Större fel (service krävs)', avdrag: 10000 },
      { value: 'critical', label: 'Kritiska fel (ej körbar)', avdrag: 25000 },
    ],
  },
  {
    key: 'besiktning',
    label: 'Besiktningsstatus',
    icon: <Shield className="w-4 h-4" />,
    options: [
      { value: 'godkand', label: 'Godkänd', avdrag: 0 },
      { value: 'anm', label: 'Anmärkning', avdrag: 2000 },
      { value: 'ej_godkand', label: 'Underkänd', avdrag: 6000 },
      { value: 'ej_besiktigad', label: 'Ej besiktigad', avdrag: 3000 },
    ],
  },
  {
    key: 'hjul',
    label: 'Däck & fälgar',
    icon: <Car className="w-4 h-4" />,
    options: [
      { value: 'bra', label: 'Bra – båda set inkl.', avdrag: 0 },
      { value: 'ok', label: 'OK – ett set, slitna', avdrag: 4000 },
      { value: 'saknas', label: 'Saknas extrasäsong', avdrag: 8000 },
      { value: 'daliga', label: 'Dåliga – behöver bytas', avdrag: 12000 },
    ],
  },
  {
    key: 'lack',
    label: 'Lack & kaross',
    icon: <Car className="w-4 h-4" />,
    options: [
      { value: 'felfri', label: 'Felfri', avdrag: 0 },
      { value: 'smarre', label: 'Mindre rispor/bucklor', avdrag: 3000 },
      { value: 'storre', label: 'Större skador', avdrag: 8000 },
      { value: 'allvarliga', label: 'Allvarliga skador', avdrag: 18000 },
    ],
  },
  {
    key: 'glas',
    label: 'Glas & rutor',
    icon: <Snowflake className="w-4 h-4" />,
    options: [
      { value: 'ok', label: 'OK – inga sprickor', avdrag: 0 },
      { value: 'repor', label: 'Repor/stenskott (reparerbart)', avdrag: 1500 },
      { value: 'sprucken', label: 'Sprucken ruta (byte)', avdrag: 5000 },
    ],
  },
  {
    key: 'agare',
    label: 'Antal ägare',
    icon: <Shield className="w-4 h-4" />,
    options: [
      { value: '1', label: '1 ägare', avdrag: 0 },
      { value: '2', label: '2 ägare', avdrag: 2000 },
      { value: '3', label: '3 ägare', avdrag: 4000 },
      { value: '4+', label: '4+ ägare', avdrag: 8000 },
    ],
  },
];

function fmtKr(v: number) {
  return v.toLocaleString('sv-SE') + ' kr';
}

export default function StaffNewValuation({
  staffUser, onLoggedOut, onCreated, onCancel, linkedDealId,
}: StaffNewValuationProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 – vehicle info
  const [valuationType, setValuationType] = useState<'trade_in' | 'purchase'>('trade_in');
  const [regnummer, setRegnummer] = useState('');
  const [miltal, setMiltal] = useState('');
  const [ar, setAr] = useState('');
  const [marke, setMarke] = useState('');
  const [modell, setModell] = useState('');

  // Step 2 – condition protocol
  const [conditions, setConditions] = useState<Record<string, string>>({
    teknik: 'ok', besiktning: 'godkand', hjul: 'bra', lack: 'felfri', glas: 'ok', agare: '1',
  });

  // Step 3 – bid
  const [basePrice, setBasePrice] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [validDays, setValidDays] = useState('7');

  const totalAvdrag = CONDITION_FIELDS.reduce((sum, f) => {
    const option = f.options.find(o => o.value === conditions[f.key]);
    return sum + (option?.avdrag ?? 0);
  }, 0);

  const basePriceNum = parseInt(basePrice.replace(/\D/g, ''), 10) || 0;
  const bidAmount = Math.max(0, basePriceNum - totalAvdrag);
  const bidLow = Math.round(bidAmount * 0.9);
  const bidHigh = Math.round(bidAmount * 1.05);
  const confidenceScore = Math.max(20, Math.min(95, 95 - totalAvdrag / basePriceNum * 100 || 50));

  async function handleSubmit() {
    if (!basePrice) { setError('Ange ett marknadspris.'); return; }
    setSaving(true);
    setError(null);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(validDays, 10));

    const { data, error: insertError } = await supabase
      .from('valuations')
      .insert({
        valuation_type: valuationType,
        regnummer: regnummer || null,
        miltal: miltal ? parseInt(miltal, 10) : null,
        skick: JSON.stringify(conditions),
        bid_amount: bidAmount,
        bid_low: bidLow,
        bid_high: bidHigh,
        confidence_score: Math.round(confidenceScore),
        valid_until: validUntil.toISOString(),
        notes: bidNotes || null,
        linked_deal_id: linkedDealId ?? null,
        created_by_staff_user_id: staffUser.id,
      })
      .select('id')
      .maybeSingle();

    if (insertError || !data) {
      setError(insertError?.message ?? 'Kunde inte spara värderingen.');
      setSaving(false);
      return;
    }

    onCreated(data.id);
  }

  return (
    <StaffShell activePage="valuations" staffUser={staffUser} onLoggedOut={onLoggedOut}>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500" />
              Ny värdering
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Steg {step} av 3</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="flex-1 h-1.5 rounded-full transition"
              style={{ background: s <= step ? '#F59E0B' : '#E5E7EB' }}
            />
          ))}
        </div>

        {/* Step 1 – Vehicle */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Fordonsinformation</h2>

            <div className="flex gap-2">
              {(['trade_in', 'purchase'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setValuationType(t)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold border-2 transition"
                  style={{
                    borderColor: valuationType === t ? '#F59E0B' : '#E5E7EB',
                    background: valuationType === t ? '#FEF3C7' : 'white',
                    color: valuationType === t ? '#D97706' : '#6B7280',
                  }}
                >
                  {t === 'trade_in' ? 'Inbyte' : 'Inköp'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Regnummer</label>
                <input
                  value={regnummer}
                  onChange={e => setRegnummer(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Miltal</label>
                <input
                  value={miltal}
                  onChange={e => setMiltal(e.target.value)}
                  placeholder="t.ex. 8500"
                  type="number"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Märke</label>
                <input
                  value={marke}
                  onChange={e => setMarke(e.target.value)}
                  placeholder="t.ex. Volvo"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Modell</label>
                <input
                  value={modell}
                  onChange={e => setModell(e.target.value)}
                  placeholder="t.ex. XC60"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Årsmodell</label>
                <input
                  value={ar}
                  onChange={e => setAr(e.target.value)}
                  placeholder="t.ex. 2019"
                  type="number"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: '#F59E0B' }}
            >
              Nästa – Skick
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 – Condition protocol */}
        {step === 2 && (
          <div className="space-y-3">
            {CONDITION_FIELDS.map(field => {
              const selected = conditions[field.key];
              return (
                <div key={field.key} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-slate-500">{field.icon}</span>
                    <h3 className="text-sm font-bold text-slate-900">{field.label}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {field.options.map(opt => {
                      const isSelected = selected === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setConditions(c => ({ ...c, [field.key]: opt.value }))}
                          className="text-left px-3 py-2.5 rounded-xl border-2 transition"
                          style={{
                            borderColor: isSelected ? '#F59E0B' : '#E5E7EB',
                            background: isSelected ? '#FEF3C7' : 'white',
                          }}
                        >
                          <div className="text-xs font-semibold" style={{ color: isSelected ? '#D97706' : '#374151' }}>
                            {opt.label}
                          </div>
                          {opt.avdrag > 0 && (
                            <div className="text-[11px] mt-0.5" style={{ color: isSelected ? '#D97706' : '#9CA3AF' }}>
                              -{fmtKr(opt.avdrag)}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {totalAvdrag > 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700">
                  Totala avdrag: <span className="font-bold">-{fmtKr(totalAvdrag)}</span>
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 h-11 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                Tillbaka
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: '#F59E0B' }}
              >
                Nästa – Bud
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 – Bid */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">Budberäkning</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Marknadspris (kr) *
                </label>
                <input
                  value={basePrice}
                  onChange={e => setBasePrice(e.target.value)}
                  placeholder="t.ex. 150000"
                  type="number"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400"
                />
                <p className="text-xs text-slate-400 mt-1">Riktpris / marknadsvärde före avdrag</p>
              </div>

              {basePriceNum > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Marknadspris</span>
                    <span className="font-semibold text-slate-900">{fmtKr(basePriceNum)}</span>
                  </div>
                  {totalAvdrag > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Avdrag (skick)</span>
                      <span className="font-semibold text-red-500">-{fmtKr(totalAvdrag)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between">
                    <span className="text-sm font-bold text-slate-900">Rekommenderat bud</span>
                    <span className="text-lg font-bold" style={{ color: '#00A85A' }}>{fmtKr(bidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Spannet</span>
                    <span>{fmtKr(bidLow)} – {fmtKr(bidHigh)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Konfidenspoäng</span>
                    <span
                      className="font-bold"
                      style={{ color: confidenceScore >= 70 ? '#00A85A' : confidenceScore >= 40 ? '#D97706' : '#DC2626' }}
                    >
                      {Math.round(confidenceScore)}%
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Giltig (dagar)</label>
                <select
                  value={validDays}
                  onChange={e => setValidDays(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
                >
                  <option value="3">3 dagar</option>
                  <option value="7">7 dagar</option>
                  <option value="14">14 dagar</option>
                  <option value="30">30 dagar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Anteckningar</label>
                <textarea
                  value={bidNotes}
                  onChange={e => setBidNotes(e.target.value)}
                  rows={3}
                  placeholder="Extra noteringar om fordonet…"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:border-amber-400"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 h-11 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                Tillbaka
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: '#F59E0B' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Spara värdering
              </button>
            </div>
          </div>
        )}
      </div>
    </StaffShell>
  );
}
