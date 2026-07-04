import { useEffect, useState } from 'react';
import {
  ClipboardCheck, Clock, CheckCircle2, XCircle,
  ChevronRight, Loader2, AlertCircle, MessageSquare,
  Car, Building2,
} from 'lucide-react';
import DealerShell from '../components/DealerShell';
import { supabase } from '../lib/supabase';

interface DealerApprovalsProps {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

interface Approval {
  id: string;
  deal_id: string;
  status: string;
  sla_deadline_at: string | null;
  notes: string | null;
  created_at: string;
  deals: {
    id: string;
    deal_number: string | null;
    status: string;
    distance_sale: boolean;
    customers: { namn: string } | null;
    cars: { marke: string; modell: string; ar: number; regnummer: string | null } | null;
    deal_lines: { negotiated_price: number | null; line_type: string }[];
    staff_users: { fornamn: string; efternamn: string } | null;
  } | null;
}

type ActionStatus = 'approved' | 'rejected' | null;

function timeLeft(iso: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return { label: 'SLA utgått', overdue: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return { label: `${h}h ${m}m kvar`, overdue: false };
  return { label: `${m} min kvar`, overdue: h === 0 && m < 30 };
}

function fmtKr(v: number | null) {
  if (v == null) return '—';
  return v.toLocaleString('sv-SE') + ' kr';
}

export default function DealerApprovals({ dealerId, foretagsnamn, onLoggedOut }: DealerApprovalsProps) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'decided'>('pending');
  const [actioning, setActioning] = useState<string | null>(null);
  const [counterModal, setCounterModal] = useState<Approval | null>(null);
  const [counterNote, setCounterNote] = useState('');
  const [counterAmount, setCounterAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, [dealerId]);

  async function fetchApprovals() {
    const { data } = await supabase
      .from('deal_approvals')
      .select(`
        id, deal_id, status, sla_deadline_at, notes, created_at,
        deals(
          id, deal_number, status, distance_sale,
          customers(namn),
          cars(marke, modell, ar, regnummer),
          deal_lines(negotiated_price, line_type),
          staff_users!assigned_staff_user_id(fornamn, efternamn)
        )
      `)
      .eq('dealer_id', dealerId)
      .order('created_at', { ascending: false });

    setApprovals((data ?? []) as unknown as Approval[]);
    setLoading(false);
  }

  async function decide(approvalId: string, dealId: string, decision: 'approved' | 'rejected') {
    setActioning(approvalId);
    await supabase
      .from('deal_approvals')
      .update({ status: decision, decided_at: new Date().toISOString() })
      .eq('id', approvalId);

    await supabase
      .from('deals')
      .update({ status: decision })
      .eq('id', dealId);

    await supabase.from('deal_events').insert({
      deal_id: dealId,
      event_type: decision === 'approved' ? 'approved' : 'rejected',
      description: decision === 'approved' ? 'Godkänd av handlare' : 'Avvisad av handlare',
    });

    setApprovals(prev => prev.map(a =>
      a.id === approvalId ? { ...a, status: decision } : a
    ));
    setActioning(null);
  }

  async function submitCounter() {
    if (!counterModal) return;
    setSubmitting(true);
    const note = counterAmount
      ? `Motbud: ${parseInt(counterAmount.replace(/\D/g, ''), 10).toLocaleString('sv-SE')} kr${counterNote ? ' – ' + counterNote : ''}`
      : counterNote;

    await supabase
      .from('deal_approvals')
      .update({ status: 'counter_offered', notes: note, decided_at: new Date().toISOString() })
      .eq('id', counterModal.id);

    await supabase.from('deal_events').insert({
      deal_id: counterModal.deal_id,
      event_type: 'note_added',
      description: `Handlare lämnade motbud: ${note}`,
    });

    setApprovals(prev => prev.map(a =>
      a.id === counterModal.id ? { ...a, status: 'counter_offered', notes: note } : a
    ));
    setCounterModal(null);
    setCounterNote('');
    setCounterAmount('');
    setSubmitting(false);
  }

  const pending = approvals.filter(a => a.status === 'pending');
  const decided = approvals.filter(a => a.status !== 'pending');
  const shown = tab === 'pending' ? pending : decided;

  return (
    <DealerShell activePage="godkannanden" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-blue-500" />
            Affärsgodkännanden
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {pending.length > 0
              ? `${pending.length} väntar på ditt svar`
              : 'Inga väntande godkännanden'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5 w-fit">
          <button
            onClick={() => setTab('pending')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition"
            style={{ background: tab === 'pending' ? '#0A1628' : 'transparent', color: tab === 'pending' ? 'white' : '#6B7280' }}
          >
            Väntar svar
            {pending.length > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: tab === 'pending' ? 'rgba(255,255,255,0.2)' : '#FEF3C7', color: tab === 'pending' ? 'white' : '#D97706' }}
              >
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('decided')}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition"
            style={{ background: tab === 'decided' ? '#0A1628' : 'transparent', color: tab === 'decided' ? 'white' : '#6B7280' }}
          >
            Hanterade
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-400">
              {tab === 'pending' ? 'Inga väntande godkännanden.' : 'Inga hanterade godkännanden ännu.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map(approval => {
              const deal = approval.deals;
              const car = deal?.cars;
              const sla = timeLeft(approval.sla_deadline_at);
              const totalNegotiated = deal?.deal_lines?.reduce((s, l) => s + (l.negotiated_price ?? 0), 0) ?? 0;
              const isPending = approval.status === 'pending';

              return (
                <div
                  key={approval.id}
                  className="bg-white rounded-2xl border p-6"
                  style={{ borderColor: isPending && sla?.overdue ? '#FECACA' : '#E5E7EB' }}
                >
                  {/* Deal header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono text-slate-400">{deal?.deal_number ?? '—'}</span>
                        {deal?.distance_sale && (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                            Distansköp
                          </span>
                        )}
                        {approval.status !== 'pending' && (
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: approval.status === 'approved' ? '#D1FAE5' : approval.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                              color: approval.status === 'approved' ? '#065F46' : approval.status === 'rejected' ? '#DC2626' : '#D97706',
                            }}
                          >
                            {approval.status === 'approved' ? 'Godkänd' : approval.status === 'rejected' ? 'Avvisad' : 'Motbud skickat'}
                          </span>
                        )}
                      </div>
                      <div className="text-base font-bold text-slate-900">
                        {car ? `${car.marke} ${car.modell} ${car.ar}` : 'Okänd bil'}
                        {car?.regnummer && (
                          <span className="ml-2 text-xs font-mono text-slate-400">{car.regnummer}</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-3">
                        {deal?.customers?.namn && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {deal.customers.namn}
                          </span>
                        )}
                        {deal?.staff_users && (
                          <span>
                            Säljare: {(deal.staff_users as unknown as { fornamn: string; efternamn: string }).fornamn}{' '}
                            {(deal.staff_users as unknown as { fornamn: string; efternamn: string }).efternamn}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-slate-400">Affärsvärde</div>
                      <div className="text-lg font-bold text-slate-900">{fmtKr(totalNegotiated || null)}</div>
                    </div>
                  </div>

                  {/* SLA indicator */}
                  {isPending && sla && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-sm font-semibold"
                      style={{
                        background: sla.overdue ? '#FEE2E2' : '#FEF3C7',
                        color: sla.overdue ? '#DC2626' : '#D97706',
                      }}
                    >
                      {sla.overdue ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
                      {sla.label}
                    </div>
                  )}

                  {/* Counter offer note */}
                  {approval.notes && (
                    <div className="bg-slate-50 rounded-xl px-3 py-2 mb-4 text-sm text-slate-600">
                      <span className="font-semibold">Notering: </span>{approval.notes}
                    </div>
                  )}

                  {/* Action buttons */}
                  {isPending && (
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => decide(approval.id, approval.deal_id, 'approved')}
                        disabled={actioning === approval.id}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition"
                        style={{ background: '#00A85A' }}
                      >
                        {actioning === approval.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Godkänn
                      </button>
                      <button
                        onClick={() => decide(approval.id, approval.deal_id, 'rejected')}
                        disabled={actioning === approval.id}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition hover:bg-red-50"
                        style={{ borderColor: '#FECACA', color: '#DC2626' }}
                      >
                        <XCircle className="w-4 h-4" />
                        Avslå
                      </button>
                      <button
                        onClick={() => { setCounterModal(approval); setCounterNote(''); setCounterAmount(''); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Lämna motbud
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Counter offer modal */}
      {counterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-2 mb-5">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">Lämna motbud</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Motbudspris (kr)</label>
                <input
                  type="number"
                  value={counterAmount}
                  onChange={e => setCounterAmount(e.target.value)}
                  placeholder="t.ex. 185000"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Meddelande</label>
                <textarea
                  value={counterNote}
                  onChange={e => setCounterNote(e.target.value)}
                  rows={3}
                  placeholder="Förklara ditt motbud…"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCounterModal(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Avbryt
              </button>
              <button
                onClick={submitCounter}
                disabled={submitting || (!counterAmount && !counterNote)}
                className="flex-1 h-10 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2"
                style={{ background: '#D97706' }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                Skicka motbud
              </button>
            </div>
          </div>
        </div>
      )}
    </DealerShell>
  );
}
