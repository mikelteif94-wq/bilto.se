import { useEffect, useState } from 'react';
import { Loader2, Check, Info } from 'lucide-react';
import DealerPortalShell from '../components/DealerPortalShell';
import { supabase } from '../lib/supabase';

interface Props {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

interface ProvisionRule {
  id: string;
  deal_type: string;
  base_commission_pct: number;
  kickback_pct: number;
  reservation_fee_pct: number;
  min_commission: number;
  max_commission: number | null;
  active: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  kop: 'Köp',
  inkop: 'Inköp',
  byte: 'Byte',
};

const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };

const DEFAULT_RULES: Omit<ProvisionRule, 'id'>[] = [
  { deal_type: 'kop',   base_commission_pct: 3.0, kickback_pct: 0.5, reservation_fee_pct: 1.0, min_commission: 2000, max_commission: null, active: true },
  { deal_type: 'inkop', base_commission_pct: 2.0, kickback_pct: 0.3, reservation_fee_pct: 0.5, min_commission: 1500, max_commission: null, active: true },
  { deal_type: 'byte',  base_commission_pct: 4.0, kickback_pct: 0.8, reservation_fee_pct: 1.0, min_commission: 3000, max_commission: null, active: true },
];

function fmtPct(v: number) {
  return v.toFixed(1) + ' %';
}

function fmtKr(v: number) {
  return v.toLocaleString('sv-SE') + ' kr';
}

export default function DealerProvisioner({ dealerId, foretagsnamn, onLoggedOut }: Props) {
  const [rules, setRules] = useState<ProvisionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ProvisionRule>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('dealer_provision_rules')
        .select('*')
        .eq('dealer_id', dealerId)
        .order('deal_type');

      if (data && data.length > 0) {
        setRules(data as ProvisionRule[]);
      } else {
        // Show defaults as read-only placeholders
        setRules(DEFAULT_RULES.map((r, i) => ({ ...r, id: `default-${i}` })));
      }
      setLoading(false);
    })();
  }, [dealerId]);

  function startEdit(rule: ProvisionRule) {
    setEditingId(rule.id);
    setEditValues({
      base_commission_pct: rule.base_commission_pct,
      kickback_pct: rule.kickback_pct,
      reservation_fee_pct: rule.reservation_fee_pct,
      min_commission: rule.min_commission,
      max_commission: rule.max_commission,
    });
  }

  async function saveRule(rule: ProvisionRule) {
    setSaving(rule.id);
    const isDefault = rule.id.startsWith('default-');
    const payload = {
      dealer_id: dealerId,
      deal_type: rule.deal_type,
      ...editValues,
    };

    if (isDefault) {
      const { data, error } = await supabase
        .from('dealer_provision_rules')
        .insert(payload)
        .select()
        .maybeSingle();
      if (!error && data) {
        setRules(prev => prev.map(r => r.id === rule.id ? data as ProvisionRule : r));
      }
    } else {
      await supabase
        .from('dealer_provision_rules')
        .update(payload)
        .eq('id', rule.id);
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, ...editValues } : r));
    }

    setSaving(null);
    setEditingId(null);
    setSaved(rule.id);
    setTimeout(() => setSaved(null), 2000);
  }

  const isDefault = rules.some(r => r.id.startsWith('default-'));

  return (
    <DealerPortalShell activePage="provisioner" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      <div>
        <div className="mb-5">
          <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>Provisioner</h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#6E6D68' }}>Provisionssatser per affärstyp</p>
        </div>

        {isDefault && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg mb-5 text-[13px]" style={{ background: '#E6F1FB', color: '#0C447C' }}>
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Standardvärden visas. Klicka Redigera på en rad för att spara egna satser.</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map(rule => {
              const isEditing = editingId === rule.id;
              const wasSaved = saved === rule.id;
              return (
                <div key={rule.id} style={cardStyle}>
                  <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid #E5E4E0' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-[15px] font-medium" style={{ color: '#1C1C1A' }}>
                        {TYPE_LABELS[rule.deal_type] ?? rule.deal_type}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: rule.active ? '#E1F5EE' : '#F7F6F3', color: rule.active ? '#085041' : '#6E6D68', borderRadius: 100 }}>
                        {rule.active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {wasSaved && (
                        <span className="flex items-center gap-1 text-[12px]" style={{ color: '#0F6E56' }}>
                          <Check className="w-3.5 h-3.5" /> Sparat
                        </span>
                      )}
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => setEditingId(null)}
                            className="h-8 px-3 rounded-lg text-[12px]"
                            style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>
                            Avbryt
                          </button>
                          <button
                            onClick={() => saveRule(rule)}
                            disabled={!!saving}
                            className="h-8 px-3 rounded-lg text-[12px] font-medium flex items-center gap-1.5"
                            style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                            {saving === rule.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            Spara
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(rule)}
                          className="h-8 px-3 rounded-lg text-[12px]"
                          style={{ border: '1px solid #E5E4E0', color: '#1C1C1A' }}>
                          Redigera
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-4">
                    {/* Base commission */}
                    <div>
                      <p className="text-[11px] mb-1.5" style={{ color: '#6E6D68' }}>Grundprovision</p>
                      {isEditing ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={editValues.base_commission_pct ?? ''}
                            onChange={e => setEditValues(v => ({ ...v, base_commission_pct: parseFloat(e.target.value) || 0 }))}
                            className="w-full h-8 px-2 pr-7 text-[13px] focus:outline-none rounded-lg text-right"
                            style={{ border: '1px solid #0F6E56', background: '#F7F6F3', color: '#1C1C1A' }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: '#6E6D68' }}>%</span>
                        </div>
                      ) : (
                        <p className="text-[16px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>
                          {fmtPct(rule.base_commission_pct)}
                        </p>
                      )}
                    </div>

                    {/* Kickback */}
                    <div>
                      <p className="text-[11px] mb-1.5" style={{ color: '#6E6D68' }}>Kickback</p>
                      {isEditing ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={editValues.kickback_pct ?? ''}
                            onChange={e => setEditValues(v => ({ ...v, kickback_pct: parseFloat(e.target.value) || 0 }))}
                            className="w-full h-8 px-2 pr-7 text-[13px] focus:outline-none rounded-lg text-right"
                            style={{ border: '1px solid #0F6E56', background: '#F7F6F3', color: '#1C1C1A' }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: '#6E6D68' }}>%</span>
                        </div>
                      ) : (
                        <p className="text-[16px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>
                          {fmtPct(rule.kickback_pct)}
                        </p>
                      )}
                    </div>

                    {/* Minimum */}
                    <div>
                      <p className="text-[11px] mb-1.5" style={{ color: '#6E6D68' }}>Minimibelopp</p>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.min_commission ?? ''}
                          onChange={e => setEditValues(v => ({ ...v, min_commission: parseInt(e.target.value) || 0 }))}
                          className="w-full h-8 px-2 text-[13px] focus:outline-none rounded-lg text-right"
                          style={{ border: '1px solid #0F6E56', background: '#F7F6F3', color: '#1C1C1A' }}
                        />
                      ) : (
                        <p className="text-[16px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>
                          {fmtKr(rule.min_commission)}
                        </p>
                      )}
                    </div>

                    {/* Max */}
                    <div>
                      <p className="text-[11px] mb-1.5" style={{ color: '#6E6D68' }}>Takbelopp (valfritt)</p>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.max_commission ?? ''}
                          placeholder="Inget tak"
                          onChange={e => setEditValues(v => ({ ...v, max_commission: parseInt(e.target.value) || null }))}
                          className="w-full h-8 px-2 text-[13px] focus:outline-none rounded-lg text-right"
                          style={{ border: '1px solid #0F6E56', background: '#F7F6F3', color: '#1C1C1A' }}
                        />
                      ) : (
                        <p className="text-[16px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>
                          {rule.max_commission != null ? fmtKr(rule.max_commission) : '—'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Example calculation */}
                  <div className="px-5 py-3 text-[12px]" style={{ borderTop: '1px solid #E5E4E0', color: '#6E6D68', background: '#F7F6F3', borderRadius: '0 0 12px 12px' }}>
                    Exempel: Bilpris 200 000 kr → provision{' '}
                    <span style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>
                      {Math.max(rule.min_commission, Math.round(200000 * (rule.base_commission_pct / 100))).toLocaleString('sv-SE')} kr
                    </span>
                    {' '}+ kickback{' '}
                    <span style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>
                      {Math.round(200000 * (rule.kickback_pct / 100)).toLocaleString('sv-SE')} kr
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 px-4 py-3 rounded-lg text-[12px]" style={{ background: '#F7F6F3', color: '#6E6D68' }}>
          Provisionssatser gäller för nya affärer från och med sparad tidpunkt. Befintliga avräkningar påverkas inte.
        </div>
      </div>
    </DealerPortalShell>
  );
}
