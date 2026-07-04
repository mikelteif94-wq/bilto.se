import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Loader2, ExternalLink, AlertCircle, CheckCircle2, XCircle, Clock, Send, ChevronDown, ChevronUp, Plus, RotateCcw, TrendingDown, CreditCard as Edit2, Check, X } from 'lucide-react';
import StaffShell, { navigate } from '../components/StaffShell';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

interface Props {
  staffUser: StaffUser;
  valuationId: string;
  onLoggedOut: () => void;
  onBack: () => void;
}

interface Valuation {
  id: string;
  valuation_type: string;
  regnummer: string | null;
  marke: string | null;
  modell: string | null;
  ar: number | null;
  miltal: number | null;
  skick: string | null;
  bid_amount: number | null;
  bid_low: number | null;
  bid_high: number | null;
  confidence_score: number | null;
  valid_until: string | null;
  outcome_amount: number | null;
  notes: string | null;
  status: string;
  bid_token: string | null;
  customer_id: string | null;
  created_by_staff_user_id: string | null;
  miltal_confirmed: boolean;
  restskuld: boolean;
  restskuld_belopp: number | null;
  restskuld_typ: string | null;
  customer_desired_price: number | null;
  sent_at: string | null;
  response_at: string | null;
  lost_reason: string | null;
  lost_competitor: string | null;
  lost_competitor_amount: number | null;
  created_at: string;
  updated_at: string;
  linked_deal_id: string | null;
  customers: { id: string; namn: string; telefon: string | null; mejl: string | null } | null;
  deals: { deal_number: string | null; status: string } | null;
}

interface BidHistoryRow {
  id: string;
  bid_amount: number;
  est_sale_price: number | null;
  comment: string;
  created_at: string;
  staff_user_id: string | null;
}

interface LogEntry {
  id: string;
  event_type: string;
  actor_name: string | null;
  payload_json: Record<string, unknown>;
  created_at: string;
}

interface PoolStats { count: number; avgDays: number }

const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };
const inputStyle = { border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A', borderRadius: 8 };

const STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast',
  sent: 'Skickad',
  accepted: 'Accepterad',
  rejected: 'Avböjd',
  expired: 'Utgången',
  lost: 'Förlorad',
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  draft:    { bg: '#F7F6F3', text: '#6E6D68' },
  sent:     { bg: '#E6F1FB', text: '#0C447C' },
  accepted: { bg: '#E1F5EE', text: '#085041' },
  rejected: { bg: '#FCEBEB', text: '#791F1F' },
  expired:  { bg: '#FAEEDA', text: '#854F0B' },
  lost:     { bg: '#F7F6F3', text: '#6E6D68' },
};

const LOST_REASONS = [
  'Pris – konkurrent',
  'Pris – vårt bud',
  'Ångrade sig',
  'Hittade ingen bil',
  'Finansiering nekad',
  'Övrigt',
];

function fmtKr(v: number | null | undefined) {
  if (v == null) return '—';
  return v.toLocaleString('sv-SE') + ' kr';
}

function timeLeft(iso: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}min kvar` : `${m}min kvar`;
}

function isExpired(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function StaffValuationDetail({ staffUser, valuationId, onLoggedOut, onBack }: Props) {
  const [val, setVal] = useState<Valuation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bidHistory, setBidHistory] = useState<BidHistoryRow[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmText, setConfirmText] = useState<string | null>(null);

  // Bid save modal
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidInput, setBidInput] = useState('');
  const [estSaleInput, setEstSaleInput] = useState('');
  const [bidComment, setBidComment] = useState('');
  const [bidSaving, setBidSaving] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  // Desired price edit
  const [editingDesired, setEditingDesired] = useState(false);
  const [desiredInput, setDesiredInput] = useState('');

  // Send confirmation
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [bidValidityHours] = useState(48);

  // Lost modal
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [lostCompetitor, setLostCompetitor] = useState('');
  const [lostCompetitorAmt, setLostCompetitorAmt] = useState('');
  const [lostWrittenBid, setLostWrittenBid] = useState(false);
  const [lostSaving, setLostSaving] = useState(false);

  // Log comment
  const [logComment, setLogComment] = useState('');
  const [logSaving, setLogSaving] = useState(false);

  const [showHistory, setShowHistory] = useState(false);

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from('valuations')
      .select(`
        id, valuation_type, regnummer, marke, modell, ar, miltal, skick,
        bid_amount, bid_low, bid_high, confidence_score,
        valid_until, outcome_amount, notes, created_at, linked_deal_id,
        status, bid_token, customer_id, created_by_staff_user_id,
        miltal_confirmed, restskuld, restskuld_belopp, restskuld_typ,
        customer_desired_price, sent_at, response_at,
        lost_reason, lost_competitor, lost_competitor_amount,
        updated_at,
        customers(id, namn, telefon, mejl),
        deals(deal_number, status)
      `)
      .eq('id', valuationId)
      .maybeSingle();

    if (error || !data) { setNotFound(true); setLoading(false); return; }

    const v = data as unknown as Valuation;
    // Handle missing columns (if migration not yet applied)
    if (!v.status) v.status = v.bid_amount ? 'draft' : 'draft';
    if (!v.updated_at) v.updated_at = v.created_at;

    setVal(v);
    setDesiredInput(v.customer_desired_price?.toString() ?? '');

    // Pool stats for same make/model
    if (v.marke && v.modell) {
      const { data: poolData } = await supabase
        .from('cars')
        .select('pool_added_at, created_at')
        .eq('available_for_staff_sales', true)
        .ilike('marke', v.marke)
        .ilike('modell', v.modell);
      if (poolData && poolData.length > 0) {
        const now = Date.now();
        const days = poolData.map(c => {
          const addedAt = c.pool_added_at ?? c.created_at;
          return Math.floor((now - new Date(addedAt).getTime()) / 86400000);
        });
        setPoolStats({ count: poolData.length, avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length) });
      } else {
        setPoolStats(null);
      }
    }

    // Bid history
    const { data: histData } = await supabase
      .from('bid_history')
      .select('id, bid_amount, est_sale_price, comment, created_at, staff_user_id')
      .eq('valuation_id', valuationId)
      .order('created_at', { ascending: false });
    setBidHistory((histData ?? []) as BidHistoryRow[]);

    // Log entries from linked deal
    if (v.linked_deal_id) {
      const { data: logData } = await supabase
        .from('deal_events')
        .select('id, event_type, actor_name, payload_json, created_at')
        .eq('deal_id', v.linked_deal_id)
        .order('created_at', { ascending: false })
        .limit(50);
      setLogEntries((logData ?? []) as LogEntry[]);
    }

    setLoading(false);
  }, [valuationId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function saveBid() {
    if (!val) return;
    const amount = parseInt(bidInput.replace(/\D/g, ''), 10);
    if (!amount || amount <= 0) { setBidError('Ange ett giltigt belopp.'); return; }

    // Rule: if bid > last valid bid within 30 days → block
    const lastValid = bidHistory.find(h => {
      const age = Date.now() - new Date(h.created_at).getTime();
      return age < 30 * 86400000;
    });
    if (lastValid && amount > lastValid.bid_amount) {
      setBidError('Grundbudet: värderingen får inte vara högre än senaste giltiga bud inom 30 dagar.');
      return;
    }

    setBidSaving(true);
    setBidError(null);
    try {
      const estSale = parseInt(estSaleInput.replace(/\D/g, ''), 10) || null;
      const validUntil = new Date(Date.now() + bidValidityHours * 3600000).toISOString();

      await supabase.from('bid_history').insert({
        valuation_id: valuationId,
        staff_user_id: staffUser.id,
        bid_amount: amount,
        est_sale_price: estSale,
        comment: bidComment,
      });

      await supabase.from('valuations').update({
        bid_amount: amount,
        valid_until: validUntil,
        updated_at: new Date().toISOString(),
      }).eq('id', valuationId);

      setShowBidModal(false);
      setBidInput('');
      setEstSaleInput('');
      setBidComment('');
      await fetchAll();
    } catch {
      setBidError('Något gick fel. Försök igen.');
    } finally {
      setBidSaving(false);
    }
  }

  async function sendBid() {
    if (!val) return;
    setSaving(true);
    try {
      const token = generateToken();
      await supabase.from('valuations').update({
        status: 'sent',
        bid_token: token,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', valuationId);
      setConfirmText(`Skickat till ${val.customers?.namn ?? 'kunden'} ${new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`);
      setShowSendConfirm(false);
      await fetchAll();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  async function saveDesiredPrice() {
    const p = parseInt(desiredInput.replace(/\D/g, ''), 10) || null;
    await supabase.from('valuations').update({ customer_desired_price: p, updated_at: new Date().toISOString() }).eq('id', valuationId);
    setEditingDesired(false);
    await fetchAll();
  }

  async function markLost() {
    if (!lostReason) return;
    setLostSaving(true);
    try {
      await supabase.from('valuations').update({
        status: 'lost',
        lost_reason: lostReason,
        lost_competitor: lostCompetitor || null,
        lost_competitor_amount: lostCompetitorAmt ? parseInt(lostCompetitorAmt, 10) : null,
        updated_at: new Date().toISOString(),
      }).eq('id', valuationId);
      setShowLostModal(false);
      setConfirmText('Markerad som förlorad.');
      await fetchAll();
    } finally { setLostSaving(false); }
  }

  async function resume() {
    await supabase.from('valuations').update({
      status: 'sent',
      updated_at: new Date().toISOString(),
    }).eq('id', valuationId);
    await fetchAll();
  }

  async function addLogComment() {
    if (!logComment.trim() || !val?.linked_deal_id) return;
    setLogSaving(true);
    await supabase.from('deal_events').insert({
      deal_id: val.linked_deal_id,
      event_type: 'comment',
      actor_type: 'staff',
      actor_name: `${staffUser.fornamn} ${staffUser.efternamn}`,
      payload_json: { comment: logComment.trim() },
    });
    setLogComment('');
    await fetchAll();
    setLogSaving(false);
  }

  async function createDeal(asByte: boolean) {
    navigate(`/staff/affarer/ny?valuationId=${val?.id}&type=${asByte ? 'byte' : 'inkop'}`);
  }

  if (loading) {
    return (
      <StaffShell activePage="valuations" staffUser={staffUser} onLoggedOut={onLoggedOut}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
        </div>
      </StaffShell>
    );
  }

  if (notFound || !val) {
    return (
      <StaffShell activePage="valuations" staffUser={staffUser} onLoggedOut={onLoggedOut}>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertCircle className="w-8 h-8" style={{ color: '#6E6D68' }} />
          <p className="text-[14px]" style={{ color: '#6E6D68' }}>Värderingen hittades inte.</p>
          <button onClick={onBack} className="text-[13px] font-medium" style={{ color: '#0F6E56' }}>Tillbaka</button>
        </div>
      </StaffShell>
    );
  }

  const statusStyle = STATUS_STYLE[val.status] ?? STATUS_STYLE.draft;
  const timeLeftStr = timeLeft(val.valid_until);
  const expired = isExpired(val.valid_until);
  const hasBid = (val.bid_amount ?? 0) > 0;
  const bidSent = val.status === 'sent';
  const bidAccepted = val.status === 'accepted';
  const isLost = val.status === 'lost';

  const margin = hasBid && val.bid_low
    ? val.bid_amount! - val.bid_low
    : null;

  return (
    <StaffShell activePage="valuations" staffUser={staffUser} onLoggedOut={onLoggedOut}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-1.5 rounded-lg transition hover:bg-[#F7F6F3]" style={{ color: '#6E6D68' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {val.regnummer && (
              <span className="text-[12px] font-medium px-2 py-0.5 rounded" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>{val.regnummer}</span>
            )}
            <span className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>
              {val.marke && val.modell ? `${val.marke} ${val.modell}${val.ar ? ` ${val.ar}` : ''}` : 'Okänd bil'}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: 100 }}>
              {STATUS_LABELS[val.status] ?? val.status}
            </span>
            {bidSent && timeLeftStr && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: expired ? '#FCEBEB' : '#FAEEDA', color: expired ? '#791F1F' : '#854F0B', borderRadius: 100 }}>
                <Clock className="w-3 h-3" />
                {expired ? 'Utgången' : timeLeftStr}
              </span>
            )}
          </div>
          {val.customers && (
            <p className="text-[13px] mt-0.5" style={{ color: '#6E6D68' }}>{val.customers.namn} · {val.customers.telefon ?? '—'}</p>
          )}
        </div>
      </div>

      {/* Confirm banner */}
      {confirmText && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-4" style={{ background: '#E1F5EE', color: '#085041' }}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="text-[13px]">{confirmText}</span>
          <button onClick={() => setConfirmText(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Customer response banner */}
      {val.status === 'accepted' && val.response_at && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-4" style={{ background: '#E1F5EE', color: '#085041' }}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="text-[13px] font-medium">Kunden accepterade budet {new Date(val.response_at).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}
      {val.status === 'rejected' && val.response_at && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-4" style={{ background: '#FCEBEB', color: '#791F1F' }}>
          <XCircle className="w-4 h-4 shrink-0" />
          <span className="text-[13px] font-medium">Kunden tackade nej {new Date(val.response_at).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}

      {/* Bid amount badges */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-[180px] px-5 py-4 rounded-xl" style={{ background: '#E6F1FB', border: '1px solid #B8D4F5' }}>
          <p className="text-[11px] font-medium mb-1" style={{ color: '#0C447C' }}>Vårt bud</p>
          <div className="text-[28px] font-medium" style={{ color: '#0C447C', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(val.bid_amount)}</div>
          {val.bid_low && val.bid_high && (
            <p className="text-[11px] mt-0.5" style={{ color: '#0C447C' }}>Intervall: {fmtKr(val.bid_low)} – {fmtKr(val.bid_high)}</p>
          )}
        </div>
        <div className="flex-1 min-w-[180px] px-5 py-4 rounded-xl" style={{ background: '#F7F6F3', border: '1px solid #E5E4E0' }}>
          <p className="text-[11px] font-medium mb-1" style={{ color: '#6E6D68' }}>Kundens önskade pris</p>
          {editingDesired ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                value={desiredInput}
                onChange={e => setDesiredInput(e.target.value)}
                className="w-32 h-8 px-2 text-[13px] focus:outline-none rounded-lg"
                style={inputStyle}
                autoFocus
              />
              <button onClick={saveDesiredPrice} className="p-1.5 rounded-lg" style={{ background: '#0F6E56', color: '#FFF' }}><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditingDesired(false)} className="p-1.5 rounded-lg" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-[28px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(val.customer_desired_price)}</div>
              <button onClick={() => setEditingDesired(true)} className="p-1 rounded-lg ml-1" style={{ color: '#6E6D68' }}><Edit2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
        {margin != null && (
          <div className="flex-1 min-w-[140px] px-5 py-4 rounded-xl" style={{ background: '#EAF3DE', border: '1px solid #C5E0A0' }}>
            <p className="text-[11px] font-medium mb-1" style={{ color: '#27500A' }}>Marginal</p>
            <div className="text-[28px] font-medium" style={{ color: '#27500A', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(margin)}</div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {val.marke && (
          <a href={`https://www.blocket.se/bilar?q=${encodeURIComponent(`${val.marke} ${val.modell ?? ''}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium"
            style={{ border: '1px solid #E5E4E0', color: '#1C1C1A', background: '#FFFFFF' }}>
            Blocket <ExternalLink className="w-3 h-3" />
          </a>
        )}
        <button
          onClick={async () => {
            await supabase.from('deal_events').insert({
              deal_id: val.linked_deal_id,
              event_type: 'task',
              actor_type: 'staff',
              actor_name: `${staffUser.fornamn} ${staffUser.efternamn}`,
              payload_json: { note: 'Servicehistorik begärd' },
            });
            setConfirmText('Uppgift skapad: begär servicehistorik.');
          }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium"
          style={{ border: '1px solid #E5E4E0', color: '#1C1C1A', background: '#FFFFFF' }}>
          Begär servicehistorik
        </button>
      </div>

      {/* Context row */}
      {poolStats && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-[12px]" style={{ background: '#F7F6F3', color: '#6E6D68' }}>
          <TrendingDown className="w-3.5 h-3.5" />
          Likadana i poolen: <span className="font-medium" style={{ color: '#1C1C1A' }}>{poolStats.count} st</span> · Snittlagertid: <span className="font-medium" style={{ color: '#1C1C1A' }}>{poolStats.avgDays} dagar</span>
        </div>
      )}

      {/* Main 2-col layout */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Left: car data */}
        <div className="lg:col-span-3 space-y-4">
          {/* Car details */}
          <div className="p-5" style={cardStyle}>
            <h3 className="text-[13px] font-medium mb-3" style={{ color: '#1C1C1A' }}>Bildata</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {[
                ['Regnummer', val.regnummer],
                ['Märke', val.marke],
                ['Modell', val.modell],
                ['År', val.ar],
                ['Miltal', val.miltal ? val.miltal.toLocaleString('sv-SE') + ' mil' : null],
                ['Skick', val.skick],
                ['Typ', val.valuation_type === 'inkop' ? 'Inköp' : 'Inbyte'],
                ['Kund', val.customers?.namn],
                ['Telefon', val.customers?.telefon],
              ].map(([label, value]) => value != null && (
                <div key={label as string} className="flex flex-col py-1">
                  <span className="text-[11px]" style={{ color: '#6E6D68' }}>{label}</span>
                  <span className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{value as string}</span>
                </div>
              ))}
            </div>
            {val.restskuld && (
              <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: '#FAEEDA', color: '#854F0B' }}>
                <p className="text-[12px] font-medium">Restskuld: {fmtKr(val.restskuld_belopp)}{val.restskuld_typ ? ` · ${val.restskuld_typ}` : ''}</p>
              </div>
            )}
            {val.notes && (
              <div className="mt-3">
                <p className="text-[11px] mb-1" style={{ color: '#6E6D68' }}>Anteckningar</p>
                <p className="text-[13px]" style={{ color: '#1C1C1A' }}>{val.notes}</p>
              </div>
            )}
          </div>

          {/* Bid history */}
          <div style={cardStyle}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-5 py-3.5"
            >
              <span className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>Budhistorik ({bidHistory.length})</span>
              {showHistory ? <ChevronUp className="w-4 h-4" style={{ color: '#6E6D68' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#6E6D68' }} />}
            </button>
            {showHistory && (
              <div style={{ borderTop: '1px solid #E5E4E0' }}>
                {bidHistory.length === 0 ? (
                  <p className="px-5 py-4 text-[13px]" style={{ color: '#6E6D68' }}>Inga bud sparade ännu.</p>
                ) : (
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E5E4E0' }}>
                        {['Skapad', 'Bud', 'Est. pris', 'Kommentar'].map(h => (
                          <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: '#6E6D68' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bidHistory.map(h => (
                        <tr key={h.id} style={{ borderBottom: '1px solid #F7F6F3' }}>
                          <td className="px-4 py-2.5" style={{ color: '#6E6D68' }}>
                            {new Date(h.created_at).toLocaleDateString('sv-SE')}
                          </td>
                          <td className="px-4 py-2.5 font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>
                            {fmtKr(h.bid_amount)}
                          </td>
                          <td className="px-4 py-2.5" style={{ color: '#6E6D68', fontFamily: 'JetBrains Mono, monospace' }}>
                            {fmtKr(h.est_sale_price)}
                          </td>
                          <td className="px-4 py-2.5" style={{ color: '#6E6D68' }}>{h.comment || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {/* UTKAST */}
            {val.status === 'draft' && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setBidInput(val.bid_amount?.toString() ?? ''); setShowBidModal(true); }}
                  className="h-10 rounded-lg text-[13px] font-medium"
                  style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                  Spara bud
                </button>
                {hasBid && (
                  <button
                    onClick={() => setShowSendConfirm(true)}
                    className="h-10 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2"
                    style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                    <Send className="w-3.5 h-3.5" />
                    Skicka bud till kund
                  </button>
                )}
              </div>
            )}

            {/* SENT */}
            {bidSent && (
              <div className="px-4 py-3 rounded-lg flex items-center gap-2" style={{ background: '#E6F1FB' }}>
                <Clock className="w-4 h-4" style={{ color: '#0C447C' }} />
                <div>
                  <p className="text-[13px] font-medium" style={{ color: '#0C447C' }}>
                    Skickat till {val.customers?.namn ?? 'kunden'} · {val.sent_at ? new Date(val.sent_at).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                  {timeLeftStr && <p className="text-[11px]" style={{ color: '#0C447C' }}>{timeLeftStr}</p>}
                  {expired && <p className="text-[11px]" style={{ color: '#791F1F' }}>Budet har gått ut</p>}
                </div>
              </div>
            )}

            {/* ACCEPTED */}
            {bidAccepted && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => createDeal(false)}
                  className="h-10 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2"
                  style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                  <Plus className="w-3.5 h-3.5" />
                  Skapa affär av värderingen
                </button>
                <button
                  onClick={() => createDeal(true)}
                  className="h-10 rounded-lg text-[13px] font-medium"
                  style={{ border: '1px solid #E5E4E0', color: '#1C1C1A', background: '#FFFFFF' }}>
                  Gör om till bytesaffär
                </button>
              </div>
            )}

            {/* LOST with resume if valid_until not expired */}
            {isLost && val.valid_until && !expired && (
              <button
                onClick={resume}
                className="h-10 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2"
                style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                <RotateCcw className="w-3.5 h-3.5" />
                Återuppta
              </button>
            )}

            {/* Mark lost (available unless already lost) */}
            {val.status !== 'lost' && val.status !== 'handed_over' && (
              <button
                onClick={() => setShowLostModal(true)}
                className="h-9 rounded-lg text-[13px] w-full"
                style={{ border: '1px solid #E5E4E0', color: '#6E6D68', background: '#FFFFFF' }}>
                Markera som förlorad
              </button>
            )}

            {/* Linked deal */}
            {val.linked_deal_id && val.deals && (
              <button
                onClick={() => navigate(`/staff/affarer/${val.linked_deal_id}`)}
                className="h-9 rounded-lg text-[13px] flex items-center justify-center gap-2 w-full"
                style={{ border: '1px solid #E5E4E0', color: '#0C447C', background: '#FFFFFF' }}>
                Visa länkad affär {val.deals.deal_number ?? ''}
              </button>
            )}
          </div>
        </div>

        {/* Right: log */}
        <div className="lg:col-span-2">
          <div style={{ ...cardStyle, height: 'fit-content' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #E5E4E0' }}>
              <h3 className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>Logg</h3>
            </div>
            {val.linked_deal_id && (
              <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid #E5E4E0' }}>
                <textarea
                  value={logComment}
                  onChange={e => setLogComment(e.target.value)}
                  placeholder="Skriv kommentar..."
                  rows={2}
                  className="w-full px-3 py-2 text-[13px] focus:outline-none rounded-lg resize-none"
                  style={inputStyle}
                />
                <button
                  onClick={addLogComment}
                  disabled={!logComment.trim() || logSaving}
                  className="mt-1.5 px-3 h-7 rounded-lg text-[12px] font-medium"
                  style={{ background: logComment.trim() ? '#0F6E56' : '#F7F6F3', color: logComment.trim() ? '#FFF' : '#6E6D68' }}>
                  {logSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Lägg till'}
                </button>
              </div>
            )}
            <div className="divide-y" style={{ borderColor: '#F7F6F3' }}>
              {/* Creation entry */}
              <div className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#6E6D68' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px]" style={{ color: '#6E6D68' }}>
                      {new Date(val.created_at).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[13px] mt-0.5" style={{ color: '#1C1C1A' }}>Värdering skapad</p>
                  </div>
                </div>
              </div>
              {logEntries.map(entry => (
                <div key={entry.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: entry.event_type === 'comment' ? '#0F6E56' : '#6E6D68' }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px]" style={{ color: '#6E6D68' }}>
                        {new Date(entry.created_at).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        {entry.actor_name && ` · ${entry.actor_name}`}
                      </p>
                      <p className="text-[13px] mt-0.5" style={{ color: '#1C1C1A' }}>
                        {entry.event_type === 'comment'
                          ? (entry.payload_json.comment as string)
                          : entry.event_type}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {logEntries.length === 0 && !val.linked_deal_id && (
                <p className="px-4 py-4 text-[12px]" style={{ color: '#6E6D68' }}>Ingen logg tillgänglig. Koppla en affär för att se logg.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BID SAVE MODAL ─────────────────────────────────────────────────── */}
      {showBidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h2 className="text-[16px] font-medium mb-4" style={{ color: '#1C1C1A' }}>Spara bud</h2>

            {/* Last bid */}
            {bidHistory.length > 0 && (
              <div className="mb-4 px-3 py-2.5 rounded-lg" style={{ background: '#F7F6F3' }}>
                <p className="text-[11px] mb-1" style={{ color: '#6E6D68' }}>Budhistorik</p>
                <table className="w-full text-[12px]">
                  <thead><tr>{['Skapad','Av','Miltal','Bud','Est. pris','Kommentar'].map(h => (
                    <th key={h} className="text-left pb-1 font-medium" style={{ color: '#6E6D68' }}>{h}</th>
                  ))}</tr></thead>
                  <tbody>{bidHistory.slice(0, 3).map(h => (
                    <tr key={h.id}><td className="pb-0.5 pr-4" style={{ color: '#6E6D68' }}>{new Date(h.created_at).toLocaleDateString('sv-SE')}</td>
                    <td className="pb-0.5 pr-4" style={{ color: '#6E6D68' }}>—</td>
                    <td className="pb-0.5 pr-4" style={{ color: '#6E6D68' }}>{val.miltal?.toLocaleString('sv-SE')}</td>
                    <td className="pb-0.5 pr-4 font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(h.bid_amount)}</td>
                    <td className="pb-0.5 pr-4" style={{ color: '#6E6D68', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(h.est_sale_price)}</td>
                    <td className="pb-0.5" style={{ color: '#6E6D68' }}>{h.comment || '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>Värdering (vårt bud) *</label>
                <input value={bidInput} onChange={e => setBidInput(e.target.value)} placeholder="t.ex. 187000"
                  className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>Estimerat försäljningspris</label>
                <input value={estSaleInput} onChange={e => setEstSaleInput(e.target.value)} placeholder="t.ex. 225000"
                  className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>Kommentar</label>
                <input value={bidComment} onChange={e => setBidComment(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
              </div>
              {/* Live margin */}
              {bidInput && estSaleInput && (
                <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#F7F6F3', color: '#1C1C1A' }}>
                  Marginal: {fmtKr(parseInt(estSaleInput.replace(/\D/g,''),10) - parseInt(bidInput.replace(/\D/g,''),10))}
                </div>
              )}
              {bidError && (
                <div className="px-3 py-2 rounded-lg" style={{ background: '#FCEBEB', color: '#791F1F' }}>
                  <p className="text-[12px]">{bidError}</p>
                  {bidError.includes('Grundbud') && <p className="text-[11px] mt-0.5" style={{ color: '#791F1F' }}>Spara-knappen är låst.</p>}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowBidModal(false); setBidError(null); }}
                className="flex-1 h-9 rounded-lg text-[13px]" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>
                Avbryt
              </button>
              <button onClick={saveBid} disabled={bidSaving || !!bidError?.includes('Grundbud')}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2"
                style={{ background: bidSaving || !!bidError?.includes('Grundbud') ? '#F7F6F3' : '#0F6E56', color: bidSaving || !!bidError?.includes('Grundbud') ? '#6E6D68' : '#FFFFFF' }}>
                {bidSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Spara bud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEND CONFIRMATION MODAL ─────────────────────────────────────────── */}
      {showSendConfirm && val && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h2 className="text-[16px] font-medium mb-3" style={{ color: '#1C1C1A' }}>Skicka bud till kund</h2>
            <div className="px-4 py-3 rounded-lg mb-4 text-[13px]" style={{ background: '#F7F6F3', color: '#1C1C1A' }}>
              <p className="font-medium mb-1">SMS-förhandsvisning</p>
              <p style={{ color: '#6E6D68' }}>
                Hej {val.customers?.namn?.split(' ')[0] ?? 'kunden'}! Vi kan erbjuda <strong>{fmtKr(val.bid_amount)}</strong> för din {val.marke} {val.modell}. Budet gäller i {bidValidityHours}h. Klicka för att svara: [länk]
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSendConfirm(false)}
                className="flex-1 h-9 rounded-lg text-[13px]" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>
                Avbryt
              </button>
              <button onClick={sendBid} disabled={saving}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2"
                style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" />Skicka</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOST MODAL ──────────────────────────────────────────────────────── */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h2 className="text-[16px] font-medium mb-4" style={{ color: '#1C1C1A' }}>Markera som förlorad</h2>
            <div className="space-y-2 mb-4">
              {LOST_REASONS.map(r => (
                <label key={r} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="lostReason" value={r} checked={lostReason === r} onChange={() => setLostReason(r)} className="accent-[#0F6E56]" />
                  <span className="text-[13px]" style={{ color: '#1C1C1A' }}>{r}</span>
                </label>
              ))}
            </div>
            {lostReason === 'Pris – konkurrent' && (
              <div className="space-y-2 mb-4">
                <input value={lostCompetitor} onChange={e => setLostCompetitor(e.target.value)}
                  placeholder="Aktör (t.ex. Kvdbil)"
                  className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
                <input value={lostCompetitorAmt} onChange={e => setLostCompetitorAmt(e.target.value)}
                  placeholder="Belopp (kr)"
                  className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={lostWrittenBid} onChange={e => setLostWrittenBid(e.target.checked)} className="accent-[#0F6E56]" />
                  <span className="text-[13px]" style={{ color: '#1C1C1A' }}>Skriftligt bud?</span>
                </label>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowLostModal(false)}
                className="flex-1 h-9 rounded-lg text-[13px]" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>
                Avbryt
              </button>
              <button onClick={markLost} disabled={!lostReason || lostSaving}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2"
                style={{ background: lostReason ? '#791F1F' : '#F7F6F3', color: lostReason ? '#FFFFFF' : '#6E6D68' }}>
                {lostSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Markera som förlorad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffShell>
  );
}
