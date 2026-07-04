import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Loader2, Check,
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
      { value: 'ok',       label: 'OK – inga fel',              avdrag: 0     },
      { value: 'minor',    label: 'Mindre fel (lampor, etc.)',   avdrag: 3000  },
      { value: 'major',    label: 'Större fel (service krävs)',  avdrag: 10000 },
      { value: 'critical', label: 'Kritiska fel (ej körbar)',    avdrag: 25000 },
    ],
  },
  {
    key: 'besiktning',
    label: 'Besiktningsstatus',
    icon: <Shield className="w-4 h-4" />,
    options: [
      { value: 'godkand',       label: 'Godkänd',        avdrag: 0    },
      { value: 'anm',           label: 'Anmärkning',     avdrag: 2000 },
      { value: 'ej_godkand',    label: 'Underkänd',      avdrag: 6000 },
      { value: 'ej_besiktigad', label: 'Ej besiktigad',  avdrag: 3000 },
    ],
  },
  {
    key: 'hjul',
    label: 'Däck och fälgar',
    icon: <Car className="w-4 h-4" />,
    options: [
      { value: 'bra',    label: 'Bra – båda set inkl.',   avdrag: 0     },
      { value: 'ok',     label: 'OK – ett set, slitna',   avdrag: 4000  },
      { value: 'saknas', label: 'Saknas extrasäsong',     avdrag: 8000  },
      { value: 'daliga', label: 'Dåliga – behöver bytas', avdrag: 12000 },
    ],
  },
  {
    key: 'lack',
    label: 'Lack och kaross',
    icon: <Car className="w-4 h-4" />,
    options: [
      { value: 'felfri',    label: 'Felfri',                avdrag: 0     },
      { value: 'smarre',    label: 'Mindre rispor/bucklor', avdrag: 3000  },
      { value: 'storre',    label: 'Större skador',         avdrag: 8000  },
      { value: 'allvarliga',label: 'Allvarliga skador',     avdrag: 18000 },
    ],
  },
  {
    key: 'glas',
    label: 'Glas och rutor',
    icon: <Snowflake className="w-4 h-4" />,
    options: [
      { value: 'ok',       label: 'OK – inga sprickor',           avdrag: 0    },
      { value: 'repor',    label: 'Repor/stenskott (reparerbart)', avdrag: 1500 },
      { value: 'sprucken', label: 'Sprucken ruta (byte)',         avdrag: 5000 },
    ],
  },
  {
    key: 'agare',
    label: 'Antal ägare',
    icon: <Shield className="w-4 h-4" />,
    options: [
      { value: '1',  label: '1 ägare',  avdrag: 0    },
      { value: '2',  label: '2 ägare',  avdrag: 2000 },
      { value: '3',  label: '3 ägare',  avdrag: 4000 },
      { value: '4+', label: '4+ ägare', avdrag: 8000 },
    ],
  },
];

function fmtKr(v: number) {
  return v.toLocaleString('sv-SE') + ' kr';
}

const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };
const inputStyle = { border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A', borderRadius: 8 };

export default function StaffNewValuation({
  staffUser, onLoggedOut, onCreated, onCancel, linkedDealId,
}: StaffNewValuationProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [valuationType, setValuationType] = useState<'trade_in' | 'purchase'>('trade_in');
  const [regnummer, setRegnummer] = useState('');
  const [miltal, setMiltal] = useState('');
  const [ar, setAr] = useState('');
  const [marke, setMarke] = useState('');
  const [modell, setModell] = useState('');

  const [conditions, setConditions] = useState<Record<string, string>>({
    teknik: 'ok', besiktning: 'godkand', hjul: 'bra', lack: 'felfri', glas: 'ok', agare: '1',
  });

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
        bid_amount: bidAmount, bid_low: bidLow, bid_high: bidHigh,
        confidence_score: Math.round(confidenceScore),
        valid_until: validUntil.toISOString(),
        notes: bidNotes || null,
        linked_deal_id: linkedDealId ?? null,
        created_by_staff_user_id: staffUser.id,
      })
      .select('id').maybeSingle();

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
        <div className="flex items-center gap-2 mb-5">
          <button onClick={onCancel} className="transition" style={{ color: '#6E6D68' }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>Ny värdering</h1>
            <p className="text-[13px]" style={{ color: '#6E6D68' }}>Steg {step} av 3</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full transition" style={{ background: s <= step ? '#0F6E56' : '#E5E4E0' }} />
          ))}
        </div>

        {/* Step 1 – Vehicle */}
        {step === 1 && (
          <div className="p-6 space-y-4" style={cardStyle}>
            <h2 className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>Fordonsinformation</h2>

            <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: '#F7F6F3', border: '1px solid #E5E4E0' }}>
              {(['trade_in', 'purchase'] as const).map(t => (
                <button key={t} onClick={() => setValuationType(t)}
                  className="flex-1 h-8 rounded-md text-[13px] transition"
                  style={{
                    background: valuationType === t ? '#FFFFFF' : 'transparent',
                    color: valuationType === t ? '#1C1C1A' : '#6E6D68',
                    fontWeight: valuationType === t ? 500 : 400,
                    border: valuationType === t ? '1px solid #E5E4E0' : 'none',
                  }}>
                  {t === 'trade_in' ? 'Inbyte' : 'Inköp'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'regnummer', label: 'Regnummer', value: regnummer, setter: (v: string) => setRegnummer(v.toUpperCase()), mono: true },
                { key: 'miltal', label: 'Miltal', value: miltal, setter: setMiltal, type: 'number' },
                { key: 'marke', label: 'Märke', value: marke, setter: setMarke },
                { key: 'modell', label: 'Modell', value: modell, setter: setModell },
                { key: 'ar', label: 'Årsmodell', value: ar, setter: setAr, type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>{f.label}</label>
                  <input
                    value={f.value}
                    onChange={e => f.setter(e.target.value)}
                    type={f.type ?? 'text'}
                    className="w-full h-9 px-3 text-[13px] focus:outline-none"
                    style={{ ...inputStyle, fontFamily: f.mono ? 'JetBrains Mono, monospace' : undefined }}
                  />
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)} className="w-full h-9 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2"
              style={{ background: '#0F6E56', color: '#FFFFFF' }}>
              Nästa – Skick
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Step 2 – Condition */}
        {step === 2 && (
          <div className="space-y-3">
            {CONDITION_FIELDS.map(field => {
              const selected = conditions[field.key];
              return (
                <div key={field.key} className="p-5" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-3" style={{ color: '#6E6D68' }}>
                    {field.icon}
                    <h3 className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{field.label}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {field.options.map(opt => {
                      const isSelected = selected === opt.value;
                      return (
                        <button key={opt.value}
                          onClick={() => setConditions(c => ({ ...c, [field.key]: opt.value }))}
                          className="text-left px-3 py-2.5 rounded-lg transition"
                          style={{
                            border: isSelected ? '1px solid #0F6E56' : '1px solid #E5E4E0',
                            background: isSelected ? '#EEF7F4' : '#FFFFFF',
                          }}>
                          <div className="text-[12px] font-medium" style={{ color: isSelected ? '#0F6E56' : '#1C1C1A' }}>{opt.label}</div>
                          {opt.avdrag > 0 && (
                            <div className="text-[11px] mt-0.5" style={{ color: isSelected ? '#085041' : '#6E6D68', fontFamily: 'JetBrains Mono, monospace' }}>
                              −{fmtKr(opt.avdrag)}
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
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#FAEEDA', border: '1px solid #F5D99A' }}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#854F0B' }} />
                <p className="text-[13px]" style={{ color: '#854F0B' }}>
                  Totala avdrag: <span className="font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>−{fmtKr(totalAvdrag)}</span>
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 h-9 rounded-lg text-[13px]" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>
                Tillbaka
              </button>
              <button onClick={() => setStep(3)} className="flex-1 h-9 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2"
                style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                Nästa – Bud
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 – Bid */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-6 space-y-4" style={cardStyle}>
              <h2 className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>Budberäkning</h2>

              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>Marknadspris (kr) *</label>
                <input
                  value={basePrice}
                  onChange={e => setBasePrice(e.target.value)}
                  placeholder="t.ex. 150000"
                  type="number"
                  className="w-full h-9 px-3 text-[13px] focus:outline-none"
                  style={inputStyle}
                />
                <p className="text-[11px] mt-1" style={{ color: '#6E6D68' }}>Riktpris / marknadsvärde före avdrag</p>
              </div>

              {basePriceNum > 0 && (
                <div className="rounded-lg p-4 space-y-2" style={{ background: '#F7F6F3', border: '1px solid #E5E4E0' }}>
                  {[
                    ['Marknadspris', fmtKr(basePriceNum), false],
                    totalAvdrag > 0 ? ['Avdrag (skick)', `−${fmtKr(totalAvdrag)}`, true] : null,
                  ].filter(Boolean).map(row => (
                    <div key={String((row as string[])[0])} className="flex justify-between">
                      <span className="text-[12px]" style={{ color: '#6E6D68' }}>{(row as string[])[0]}</span>
                      <span className="text-[12px] font-medium" style={{ color: (row as unknown[])[2] ? '#791F1F' : '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{(row as string[])[1]}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #E5E4E0' }}>
                    <span className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>Rekommenderat bud</span>
                    <span className="text-[16px] font-medium" style={{ color: '#0F6E56', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(bidAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px]" style={{ color: '#6E6D68' }}>Spann</span>
                    <span className="text-[11px]" style={{ color: '#6E6D68', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(bidLow)} – {fmtKr(bidHigh)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px]" style={{ color: '#6E6D68' }}>Konfidenspoäng</span>
                    <span className="text-[11px] font-medium" style={{
                      color: confidenceScore >= 70 ? '#085041' : confidenceScore >= 40 ? '#854F0B' : '#791F1F',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>{Math.round(confidenceScore)}%</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>Giltig (dagar)</label>
                <select value={validDays} onChange={e => setValidDays(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle}>
                  <option value="3">3 dagar</option>
                  <option value="7">7 dagar</option>
                  <option value="14">14 dagar</option>
                  <option value="30">30 dagar</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>Anteckningar</label>
                <textarea value={bidNotes} onChange={e => setBidNotes(e.target.value)}
                  rows={3} placeholder="Extra noteringar om fordonet…"
                  className="w-full px-3 py-2 text-[13px] resize-none focus:outline-none" style={inputStyle} />
              </div>

              {error && (
                <p className="text-[12px] px-3 py-2 rounded-lg" style={{ background: '#FCEBEB', color: '#791F1F' }}>{error}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 h-9 rounded-lg text-[13px]" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>
                Tillbaka
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2"
                style={{ background: '#0F6E56', color: '#FFFFFF', opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Spara värdering
              </button>
            </div>
          </div>
        )}
      </div>
    </StaffShell>
  );
}
