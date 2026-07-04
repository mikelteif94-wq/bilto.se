import { useEffect, useState } from 'react';
import {
  Star, Plus, Search, Loader2, ArrowRight, Clock,
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
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h sedan`;
  return `${Math.floor(h / 24)} d sedan`;
}

function isExpired(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

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
      <div className="max-w-5xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500" />
              Värderingar
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{valuations.length} värderingar totalt</p>
          </div>
          <button
            onClick={onNewValuation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: '#F59E0B', color: 'white' }}
          >
            <Plus className="w-4 h-4" />
            Ny värdering
          </button>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök regnummer, affärsnummer…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Star className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-400">Inga värderingar ännu.</p>
            <button onClick={onNewValuation} className="mt-3 text-sm font-semibold text-amber-600 hover:underline">
              Skapa första värderingen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(v => {
              const expired = isExpired(v.valid_until);
              const hasOutcome = v.outcome_amount != null;
              const accuracy = hasOutcome && v.bid_amount
                ? Math.round(((v.outcome_amount! - v.bid_amount) / v.bid_amount) * 100)
                : null;

              return (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5"
                  style={{ borderColor: expired && !hasOutcome ? '#FECACA' : '#E5E7EB' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: v.valuation_type === 'trade_in' ? '#FEF3C7' : '#EFF6FF',
                            color: v.valuation_type === 'trade_in' ? '#D97706' : '#3B82F6',
                          }}
                        >
                          {v.valuation_type === 'trade_in' ? 'Inbyte' : 'Inköp'}
                        </span>
                        {v.regnummer && (
                          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {v.regnummer}
                          </span>
                        )}
                        {v.linked_deal_id && v.deals?.deal_number && (
                          <span className="text-xs text-slate-400">Affär: {v.deals.deal_number}</span>
                        )}
                        {expired && !hasOutcome && (
                          <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Utgått
                          </span>
                        )}
                        {hasOutcome && (
                          <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Avslutad
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 mt-2">
                        <div>
                          <div className="text-[11px] text-slate-400">Bud</div>
                          <div className="text-base font-bold text-slate-900">{fmtKr(v.bid_amount)}</div>
                          {(v.bid_low != null || v.bid_high != null) && (
                            <div className="text-xs text-slate-400">
                              {fmtKr(v.bid_low)} – {fmtKr(v.bid_high)}
                            </div>
                          )}
                        </div>
                        {hasOutcome && (
                          <div>
                            <div className="text-[11px] text-slate-400">Utfall</div>
                            <div className="text-base font-bold" style={{ color: '#00A85A' }}>
                              {fmtKr(v.outcome_amount)}
                            </div>
                            {accuracy != null && (
                              <div
                                className="text-xs font-semibold flex items-center gap-1"
                                style={{ color: Math.abs(accuracy) < 10 ? '#00A85A' : '#D97706' }}
                              >
                                {accuracy > 0
                                  ? <TrendingUp className="w-3 h-3" />
                                  : <TrendingDown className="w-3 h-3" />}
                                {accuracy > 0 ? '+' : ''}{accuracy}% vs bud
                              </div>
                            )}
                          </div>
                        )}
                        {v.confidence_score != null && (
                          <div>
                            <div className="text-[11px] text-slate-400">Konfidens</div>
                            <div className="text-sm font-bold" style={{ color: v.confidence_score >= 70 ? '#00A85A' : v.confidence_score >= 40 ? '#D97706' : '#DC2626' }}>
                              {v.confidence_score}%
                            </div>
                          </div>
                        )}
                        {v.miltal != null && (
                          <div>
                            <div className="text-[11px] text-slate-400">Miltal</div>
                            <div className="text-sm font-semibold text-slate-700">{v.miltal.toLocaleString('sv-SE')} mil</div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(v.created_at)}
                        </span>
                        {v.valid_until && !hasOutcome && (
                          <span style={{ color: expired ? '#DC2626' : '#6B7280' }}>
                            Giltig till: {new Date(v.valid_until).toLocaleDateString('sv-SE')}
                          </span>
                        )}
                        {v.staff_users && (
                          <span>
                            {(v.staff_users as unknown as { fornamn: string; efternamn: string }).fornamn}{' '}
                            {(v.staff_users as unknown as { fornamn: string; efternamn: string }).efternamn}
                          </span>
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
