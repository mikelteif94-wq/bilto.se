import { useEffect, useState } from 'react';
import {
  Star, Plus, Search, Loader2, Clock,
  CheckCircle2, AlertCircle, TrendingDown, TrendingUp,
} from 'lucide-react';
import StaffShell from '../components/StaffShell';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

interface StaffValuationsProps {
  staffUser: StaffUser;
  onLoggedOut: () => void;
  onNewValuation: () => void;
  onOpenValuation: (id: string) => void;
}

interface Valuation {
  id: string;
  valuation_type: string;
  regnummer: string | null;
  miltal: number | null;
  skick: string | null;
  bid_amount: number | null;
  bid_low: number | null;
  bid_high: number | null;
  confidence_score: number | null;
  valid_until: string | null;
  outcome_amount: number | null;
  notes: string | null;
  created_at: string;
  linked_deal_id: string | null;
  deals: { deal_number: string | null } | null;
  staff_users: { fornamn: string; efternamn: string } | null;
}

function fmtKr(v: number | null) {
  if (v == null) return '—';
  return v.toLocaleString('sv-SE') + ' kr';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just nu';
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h sedan`;
  return `${Math.floor(h / 24)} d sedan`;
}

function isExpired(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };

export default function StaffValuations({ staffUser, onLoggedOut, onNewValuation }: StaffValuationsProps) {
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('valuations')
        .select(`
          id, valuation_type, regnummer, miltal, skick,
          bid_amount, bid_low, bid_high, confidence_score,
          valid_until, outcome_amount, notes, created_at, linked_deal_id,
          deals(deal_number),
          staff_users!created_by_staff_user_id(fornamn, efternamn)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      setValuations((data ?? []) as unknown as Valuation[]);
      setLoading(false);
    })();
  }, []);

  const filtered = valuations.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (v.regnummer ?? '').toLowerCase().includes(q) ||
      (v.skick ?? '').toLowerCase().includes(q) ||
      (v.deals?.deal_number ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <StaffShell activePage="valuations" staffUser={staffUser} onLoggedOut={onLoggedOut}>
      <div>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>Värderingar</h1>
            <p className="text-[13px] mt-0.5" style={{ color: '#6E6D68' }}>{valuations.length} totalt</p>
          </div>
          <button
            onClick={onNewValuation}
            className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-[13px] font-medium"
            style={{ background: '#0F6E56', color: '#FFFFFF' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Ny värdering
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#6E6D68' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök regnummer, affärsnummer…"
            className="w-full h-9 pl-8 pr-3 rounded-lg text-[14px] focus:outline-none"
            style={{ border: '1px solid #E5E4E0', background: '#FFFFFF', color: '#1C1C1A' }}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={cardStyle}>
            <Star className="w-8 h-8 mx-auto mb-3" style={{ color: '#E5E4E0' }} />
            <p className="text-[14px] mb-3" style={{ color: '#6E6D68' }}>Inga värderingar ännu.</p>
            <button onClick={onNewValuation} className="text-[13px] font-medium" style={{ color: '#0F6E56' }}>
              Skapa första värderingen
            </button>
          </div>
        ) : (
          <div style={cardStyle}>
            {filtered.map((v, idx) => {
              const expired = isExpired(v.valid_until);
              const hasOutcome = v.outcome_amount != null;
              const accuracy = hasOutcome && v.bid_amount
                ? Math.round(((v.outcome_amount! - v.bid_amount) / v.bid_amount) * 100)
                : null;
              const su = v.staff_users as unknown as { fornamn: string; efternamn: string } | null;

              return (
                <div
                  key={v.id}
                  className="px-5 py-4"
                  style={{ borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Top badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{
                          background: v.valuation_type === 'trade_in' ? '#FAEEDA' : '#E6F1FB',
                          color: v.valuation_type === 'trade_in' ? '#854F0B' : '#0C447C',
                          borderRadius: 100,
                        }}>
                          {v.valuation_type === 'trade_in' ? 'Inbyte' : 'Inköp'}
                        </span>
                        {v.regnummer && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                            {v.regnummer}
                          </span>
                        )}
                        {v.linked_deal_id && v.deals?.deal_number && (
                          <span className="text-[11px]" style={{ color: '#6E6D68' }}>Affär: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{v.deals.deal_number}</span></span>
                        )}
                        {expired && !hasOutcome && (
                          <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: '#791F1F' }}>
                            <AlertCircle className="w-3 h-3" />
                            Utgått
                          </span>
                        )}
                        {hasOutcome && (
                          <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: '#085041' }}>
                            <CheckCircle2 className="w-3 h-3" />
                            Avslutad
                          </span>
                        )}
                      </div>

                      {/* Values row */}
                      <div className="flex flex-wrap gap-5 mt-1">
                        <div>
                          <div className="text-[11px] mb-0.5" style={{ color: '#6E6D68' }}>Bud</div>
                          <div className="text-[16px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(v.bid_amount)}</div>
                          {(v.bid_low != null || v.bid_high != null) && (
                            <div className="text-[11px]" style={{ color: '#6E6D68', fontFamily: 'JetBrains Mono, monospace' }}>
                              {fmtKr(v.bid_low)} – {fmtKr(v.bid_high)}
                            </div>
                          )}
                        </div>
                        {hasOutcome && (
                          <div>
                            <div className="text-[11px] mb-0.5" style={{ color: '#6E6D68' }}>Utfall</div>
                            <div className="text-[16px] font-medium" style={{ color: '#0F6E56', fontFamily: 'JetBrains Mono, monospace' }}>
                              {fmtKr(v.outcome_amount)}
                            </div>
                            {accuracy != null && (
                              <div className="text-[11px] font-medium flex items-center gap-1" style={{ color: Math.abs(accuracy) < 10 ? '#085041' : '#854F0B' }}>
                                {accuracy > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {accuracy > 0 ? '+' : ''}{accuracy}% vs bud
                              </div>
                            )}
                          </div>
                        )}
                        {v.confidence_score != null && (
                          <div>
                            <div className="text-[11px] mb-0.5" style={{ color: '#6E6D68' }}>Konfidens</div>
                            <div className="text-[14px] font-medium" style={{
                              color: v.confidence_score >= 70 ? '#085041' : v.confidence_score >= 40 ? '#854F0B' : '#791F1F',
                              fontFamily: 'JetBrains Mono, monospace',
                            }}>
                              {v.confidence_score}%
                            </div>
                          </div>
                        )}
                        {v.miltal != null && (
                          <div>
                            <div className="text-[11px] mb-0.5" style={{ color: '#6E6D68' }}>Miltal</div>
                            <div className="text-[13px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{v.miltal.toLocaleString('sv-SE')} mil</div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[12px] flex items-center gap-1" style={{ color: '#6E6D68' }}>
                          <Clock className="w-3 h-3" />
                          {timeAgo(v.created_at)}
                        </span>
                        {v.valid_until && !hasOutcome && (
                          <span className="text-[12px]" style={{ color: expired ? '#791F1F' : '#6E6D68' }}>
                            Giltig till: {new Date(v.valid_until).toLocaleDateString('sv-SE')}
                          </span>
                        )}
                        {su && (
                          <span className="text-[12px]" style={{ color: '#6E6D68' }}>{su.fornamn} {su.efternamn}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StaffShell>
  );
}
