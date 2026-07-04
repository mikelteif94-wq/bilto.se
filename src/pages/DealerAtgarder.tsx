import { useEffect, useState } from 'react';
import { Loader2, Clock, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import DealerPortalShell, { dealerNavigate } from '../components/DealerPortalShell';
import { supabase } from '../lib/supabase';

interface Props {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

interface ApprovalTask {
  id: string;
  deal_id: string;
  decision: string;
  sla_deadline_at: string | null;
  created_at: string;
  deal: {
    deal_number: string | null;
    deal_type: string;
    customers: { namn: string } | null;
    cars: { marke: string; modell: string; ar: number; regnummer: string | null } | null;
    deal_lines: { description: string; negotiated_price: number; line_type: string; list_price: number }[];
    assigned_staff_user_id: string | null;
  } | null;
}

interface DeliveryTask {
  id: string;
  deal_id: string;
  delivery_type: string;
  delivery_date: string | null;
  time_window: string | null;
  address: string | null;
  includes_trade_in: boolean;
  trade_in_regnummer: string | null;
  status: string;
  deal: {
    cars: { regnummer: string | null; marke: string; modell: string } | null;
  } | null;
}

function tickingSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}min sedan`;
  return `${m}min sedan`;
}

function fmtKr(v: number) {
  return v.toLocaleString('sv-SE') + ' kr';
}

const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };
const inputStyle = { border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A', borderRadius: 8 };

export default function DealerAtgarder({ dealerId, foretagsnamn, onLoggedOut }: Props) {
  const [approvals, setApprovals] = useState<ApprovalTask[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [openApproval, setOpenApproval] = useState<ApprovalTask | null>(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [counterAmount, setCounterAmount] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject' | 'counter' | null>(null);

  async function fetchData() {
    const [approvalRes, deliveryRes] = await Promise.all([
      supabase
        .from('deal_approvals')
        .select(`
          id, deal_id, decision, sla_deadline_at, created_at,
          deal:deals(
            deal_number, deal_type,
            customers(namn),
            cars(marke, modell, ar, regnummer),
            deal_lines(description, negotiated_price, list_price, line_type),
            assigned_staff_user_id
          )
        `)
        .eq('decision', 'pending')
        .order('created_at', { ascending: true }),

      supabase
        .from('deliveries')
        .select(`
          id, deal_id, delivery_type, delivery_date, time_window, address,
          includes_trade_in, trade_in_regnummer, status,
          deal:deals(cars(regnummer, marke, modell))
        `)
        .in('deal_id',
          (await supabase.from('deals').select('id').eq('dealer_id', dealerId)).data?.map((d: { id: string }) => d.id) ?? []
        )
        .eq('status', 'booked')
    ]);

    setApprovals((approvalRes.data ?? []) as unknown as ApprovalTask[]);
    setDeliveries((deliveryRes.data ?? []) as unknown as DeliveryTask[]);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [dealerId]);

  async function decide(approval: ApprovalTask, type: 'approve' | 'reject' | 'counter') {
    setDeciding(true);
    try {
      if (type === 'approve') {
        await supabase.from('deal_approvals').update({ decision: 'approved', decided_at: new Date().toISOString(), message: decisionComment || null }).eq('id', approval.id);
        await supabase.from('deals').update({ status: 'approved' }).eq('id', approval.deal_id);
        await supabase.from('deal_events').insert({ deal_id: approval.deal_id, event_type: 'approved', actor_type: 'dealer', actor_name: foretagsnamn, payload_json: { comment: decisionComment } });
      } else if (type === 'reject') {
        if (!decisionComment) return;
        await supabase.from('deal_approvals').update({ decision: 'rejected', decided_at: new Date().toISOString(), message: decisionComment }).eq('id', approval.id);
        await supabase.from('deals').update({ status: 'rejected' }).eq('id', approval.deal_id);
        await supabase.from('deal_events').insert({ deal_id: approval.deal_id, event_type: 'rejected', actor_type: 'dealer', actor_name: foretagsnamn, payload_json: { comment: decisionComment } });
      } else {
        const amt = parseInt(counterAmount.replace(/\D/g, ''), 10);
        if (!amt) return;
        await supabase.from('deal_approvals').update({ decision: 'counter', counter_offer_amount: amt, decided_at: new Date().toISOString(), message: decisionComment || null }).eq('id', approval.id);
        await supabase.from('deals').update({ status: 'counter_offer' }).eq('id', approval.deal_id);
        await supabase.from('deal_events').insert({ deal_id: approval.deal_id, event_type: 'counter_offer', actor_type: 'dealer', actor_name: foretagsnamn, payload_json: { amount: amt, comment: decisionComment } });
      }
      setOpenApproval(null);
      setDecisionComment('');
      setCounterAmount('');
      setDecisionType(null);
      await fetchData();
    } finally { setDeciding(false); }
  }

  async function confirmDelivery(delivery: DeliveryTask) {
    await supabase.from('deliveries').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', delivery.id);
    await fetchData();
  }

  const totalActions = approvals.length + deliveries.length;

  return (
    <DealerPortalShell activePage="atgarder" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut} badgeCount={totalActions}>
      <div>
        <div className="mb-5">
          <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>Åtgärder</h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#6E6D68' }}>
            {totalActions > 0 ? `${totalActions} saker kräver din uppmärksamhet` : 'Allt är hanterat. Bra jobbat.'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
          </div>
        ) : totalActions === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <CheckCircle2 className="w-10 h-10" style={{ color: '#0F6E56' }} />
            <p className="text-[15px] font-medium" style={{ color: '#1C1C1A' }}>Allt är hanterat!</p>
            <p className="text-[13px]" style={{ color: '#6E6D68' }}>Bra jobbat. Inga öppna åtgärder.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Approval tasks */}
            {approvals.map(a => {
              const car = a.deal?.cars;
              const totalPrice = (a.deal?.deal_lines ?? []).reduce((sum, l) => sum + l.negotiated_price, 0);
              const hasUnderGolv = (a.deal?.deal_lines ?? []).some(l => l.line_type === 'discount' && l.negotiated_price < 0);
              return (
                <div key={a.id} style={cardStyle} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {car?.regnummer && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>{car.regnummer}</span>
                        )}
                        <span className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>
                          Affär att godkänna{a.deal?.deal_number ? ` · ${a.deal.deal_number}` : ''}
                        </span>
                      </div>
                      <p className="text-[13px]" style={{ color: '#6E6D68' }}>
                        {car ? `${car.marke} ${car.modell} ${car.ar}` : '—'} till {a.deal?.customers?.namn ?? '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-[12px]" style={{ color: '#854F0B' }}>
                      <Clock className="w-3.5 h-3.5" />
                      {tickingSince(a.created_at)}
                    </div>
                  </div>

                  {/* Deal lines */}
                  {a.deal?.deal_lines && a.deal.deal_lines.length > 0 && (
                    <div className="rounded-lg overflow-hidden mb-4" style={{ border: '1px solid #E5E4E0' }}>
                      {a.deal.deal_lines.map((l, i) => (
                        <div key={i} className="flex justify-between px-4 py-2.5 text-[13px]" style={{ borderTop: i > 0 ? '1px solid #F7F6F3' : undefined }}>
                          <span style={{ color: '#1C1C1A' }}>{l.description}</span>
                          <span style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>
                            {l.negotiated_price < 0 ? '−' : ''}{Math.abs(l.negotiated_price).toLocaleString('sv-SE')} kr
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between px-4 py-3 font-medium text-[14px]" style={{ borderTop: '1px solid #E5E4E0', background: '#F7F6F3' }}>
                        <span style={{ color: '#1C1C1A' }}>Ditt netto</span>
                        <span style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(totalPrice)}</span>
                      </div>
                    </div>
                  )}

                  {hasUnderGolv && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ background: '#FCEBEB', color: '#791F1F' }}>
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[12px]">Rabatt är under prisgolvet – kräver särskilt godkännande</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setOpenApproval(a); setDecisionType('approve'); }}
                      className="flex-1 h-9 rounded-lg text-[13px] font-medium"
                      style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                      Godkänn
                    </button>
                    <button
                      onClick={() => { setOpenApproval(a); setDecisionType('counter'); }}
                      className="flex-1 h-9 rounded-lg text-[13px]"
                      style={{ border: '1px solid #E5E4E0', color: '#1C1C1A', background: '#FFFFFF' }}>
                      Motbud
                    </button>
                    <button
                      onClick={() => { setOpenApproval(a); setDecisionType('reject'); }}
                      className="flex-1 h-9 rounded-lg text-[13px]"
                      style={{ border: '1px solid #FCEBEB', color: '#791F1F', background: '#FFFFFF' }}>
                      Avslå
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Delivery tasks */}
            {deliveries.map(d => (
              <div key={d.id} style={cardStyle} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>
                      {d.delivery_type === 'home' ? 'Hemleverans' : 'Hämtning'} · {d.deal?.deal?.cars?.regnummer ?? '—'}
                    </p>
                    {d.delivery_date && (
                      <p className="text-[13px]" style={{ color: '#6E6D68' }}>
                        {new Date(d.delivery_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}
                        {d.time_window ? ` · ${d.time_window}` : ''}
                        {d.includes_trade_in && d.trade_in_regnummer ? ` · inbyte ${d.trade_in_regnummer} i retur` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => confirmDelivery(d)}
                    className="flex-1 h-9 rounded-lg text-[13px] font-medium"
                    style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                    Bekräfta
                  </button>
                  <button
                    className="flex-1 h-9 rounded-lg text-[13px]"
                    style={{ border: '1px solid #E5E4E0', color: '#6E6D68', background: '#FFFFFF' }}>
                    Föreslå ny tid
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decision modal */}
      {openApproval && decisionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h2 className="text-[16px] font-medium mb-4" style={{ color: '#1C1C1A' }}>
              {decisionType === 'approve' ? 'Godkänn affär' : decisionType === 'reject' ? 'Avslå affär' : 'Skicka motbud'}
            </h2>
            <div className="space-y-3">
              {decisionType === 'counter' && (
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>Motbud (kr) *</label>
                  <input value={counterAmount} onChange={e => setCounterAmount(e.target.value)}
                    placeholder="t.ex. 245000"
                    className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
                </div>
              )}
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>
                  Kommentar{decisionType === 'reject' ? ' *' : ''}
                </label>
                <textarea value={decisionComment} onChange={e => setDecisionComment(e.target.value)}
                  rows={3} placeholder={decisionType === 'reject' ? 'Förklara varför du avslår...' : 'Valfri kommentar...'}
                  className="w-full px-3 py-2 text-[13px] focus:outline-none resize-none" style={{ ...inputStyle, borderRadius: 8 }} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setOpenApproval(null); setDecisionType(null); setDecisionComment(''); setCounterAmount(''); }}
                className="flex-1 h-9 rounded-lg text-[13px]" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>
                Avbryt
              </button>
              <button
                onClick={() => decide(openApproval, decisionType)}
                disabled={deciding || (decisionType === 'reject' && !decisionComment) || (decisionType === 'counter' && !counterAmount)}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2"
                style={{
                  background: decisionType === 'approve' ? '#0F6E56' : decisionType === 'reject' ? '#791F1F' : '#1C1C1A',
                  color: '#FFFFFF',
                  opacity: deciding ? 0.7 : 1,
                }}>
                {deciding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : decisionType === 'approve' ? 'Godkänn' : decisionType === 'reject' ? 'Avslå' : 'Skicka motbud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DealerPortalShell>
  );
}
