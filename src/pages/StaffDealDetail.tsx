import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Loader2, Plus, Trash2, Send, CheckCircle2,
  XCircle, Clock, FileText, AlertCircle, ChevronDown, ChevronUp,
  Car, Shield, Coins, Snowflake, Truck, Tag, Scale,
  RefreshCw, ClipboardList, History,
} from 'lucide-react';
import StaffShell from '../components/StaffShell';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

interface StaffDealDetailProps {
  dealId: string;
  staffUser: StaffUser;
  onLoggedOut: () => void;
  onBack: () => void;
}

interface Deal {
  id: string;
  deal_number: string | null;
  status: string;
  notes: string | null;
  internal_notes: string | null;
  distance_sale: boolean;
  created_at: string;
  updated_at: string;
  dealers: { id: string; foretagsnamn: string; mejl: string | null; pool_sla_minutes: number } | null;
  customers: { id: string; namn: string; telefon: string | null; mejl: string | null } | null;
  cars: { id: string; marke: string; modell: string; ar: number; regnummer: string | null; startbud: number | null; pool_prisgolv: number | null } | null;
  staff_users: { fornamn: string; efternamn: string } | null;
}

interface DealLine {
  id: string;
  line_type: string;
  description: string;
  list_price: number;
  negotiated_price: number;
  kickback_amount: number;
  kickback_receiver: string;
  sort_order: number;
}

interface DealApproval {
  id: string;
  decision: string;
  counter_offer_amount: number | null;
  decided_at: string | null;
  sla_deadline_at: string | null;
  message: string | null;
  created_at: string;
}

interface DealTask {
  id: string;
  task_type: string;
  status: string;
  due_at: string | null;
  note: string | null;
  created_at: string;
}

interface DealEvent {
  id: string;
  event_type: string;
  actor_type: string;
  actor_name: string | null;
  payload_json: Record<string, unknown>;
  created_at: string;
}

const STATUS_FLOW = [
  'draft', 'sent_for_approval', 'approved',
  'contract_sent', 'contract_signed',
  'deposit_sent', 'deposit_paid',
  'reserved', 'handed_over',
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast',
  sent_for_approval: 'Väntar godkännande',
  approved: 'Godkänd av handlare',
  rejected: 'Avvisad av handlare',
  contract_sent: 'Kontrakt skickat',
  contract_signed: 'Kontrakt signerat',
  deposit_sent: 'Handpenning skickad',
  deposit_paid: 'Handpenning betald',
  reserved: 'Reserverad',
  handed_over: 'Levererad',
  cancelled: 'Avbruten',
};

const NEXT_STATUS: Record<string, string> = {
  draft: 'sent_for_approval',
  approved: 'contract_sent',
  contract_sent: 'contract_signed',
  contract_signed: 'deposit_sent',
  deposit_sent: 'deposit_paid',
  deposit_paid: 'reserved',
  reserved: 'handed_over',
};

const NEXT_ACTION_LABEL: Record<string, string> = {
  draft: 'Skicka till handlare för godkännande',
  approved: 'Markera kontrakt skickat',
  contract_sent: 'Markera kontrakt signerat',
  contract_signed: 'Markera handpenning skickad',
  deposit_sent: 'Markera handpenning betald',
  deposit_paid: 'Reservera bilen',
  reserved: 'Markera som levererad',
};

const LINE_TYPE_ICONS: Record<string, typeof Car> = {
  car: Car,
  trade_in: Scale,
  warranty: Shield,
  financing: Coins,
  winter_tires: Snowflake,
  delivery: Truck,
  addon: Tag,
};

const LINE_TYPE_LABELS: Record<string, string> = {
  car: 'Bil',
  trade_in: 'Inbyte',
  warranty: 'Garanti',
  financing: 'Finansiering',
  winter_tires: 'Vinterdäck',
  delivery: 'Hemleverans',
  addon: 'Tillägg',
};

const TASK_TYPE_LABELS: Record<string, string> = {
  dealer_approval: 'Handlargodkännande',
  send_contract: 'Skicka kontrakt',
  get_photos: 'Hämta bilder',
  fill_protocol: 'Fyll i protokoll',
  confirm_deposit: 'Bekräfta handpenning',
  coordinate_delivery: 'Koordinera leverans',
  other: 'Övrigt',
};

function fmtKr(v: number) {
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

export default function StaffDealDetail({ dealId, staffUser, onLoggedOut, onBack }: StaffDealDetailProps) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [lines, setLines] = useState<DealLine[]>([]);
  const [approvals, setApprovals] = useState<DealApproval[]>([]);
  const [tasks, setTasks] = useState<DealTask[]>([]);
  const [events, setEvents] = useState<DealEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [newLine, setNewLine] = useState({ line_type: 'addon', description: '', list_price: '', negotiated_price: '', kickback_amount: '' });
  const [newTask, setNewTask] = useState({ task_type: 'other', note: '', due_at: '' });
  const [internalNote, setInternalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchAll = useCallback(async () => {
    const [dealRes, linesRes, appRes, tasksRes, eventsRes] = await Promise.all([
      supabase.from('deals').select(`
        id, deal_number, status, notes, internal_notes, distance_sale, created_at, updated_at,
        dealers(id, foretagsnamn, mejl, pool_sla_minutes),
        customers(id, namn, telefon, mejl),
        cars(id, marke, modell, ar, regnummer, startbud, pool_prisgolv),
        staff_users!assigned_staff_user_id(fornamn, efternamn)
      `).eq('id', dealId).maybeSingle(),
      supabase.from('deal_lines').select('*').eq('deal_id', dealId).order('sort_order'),
      supabase.from('deal_approvals').select('*').eq('deal_id', dealId).order('created_at', { ascending: false }),
      supabase.from('deal_tasks').select('*').eq('deal_id', dealId).order('created_at', { ascending: false }),
      supabase.from('deal_events').select('*').eq('deal_id', dealId).order('created_at', { ascending: false }).limit(50),
    ]);

    setDeal(dealRes.data as unknown as Deal);
    setLines(linesRes.data ?? []);
    setApprovals(appRes.data ?? []);
    setTasks(tasksRes.data ?? []);
    setEvents(eventsRes.data ?? []);
    setLoading(false);
  }, [dealId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const advanceStatus = async () => {
    if (!deal) return;
    const next = NEXT_STATUS[deal.status];
    if (!next) return;
    setSaving(true);

    if (next === 'sent_for_approval' && deal.dealers) {
      const slaMinutes = deal.dealers.pool_sla_minutes ?? 120;
      const deadline = new Date(Date.now() + slaMinutes * 60 * 1000).toISOString();
      await supabase.from('deal_approvals').insert({
        deal_id: dealId,
        dealer_id: deal.dealers.id,
        decision: 'pending',
        sla_deadline_at: deadline,
      });

      await supabase.from('deal_tasks').insert({
        deal_id: dealId,
        task_type: 'dealer_approval',
        assigned_to_staff_user_id: staffUser.id,
        due_at: deadline,
        note: `Väntar på godkännande från ${deal.dealers.foretagsnamn}. SLA: ${slaMinutes} min.`,
      });
    }

    if (next === 'reserved' && deal.cars) {
      await supabase.from('cars').update({ pool_status: 'reserved', reserved_by_deal_id: dealId }).eq('id', deal.cars.id);
    }

    await supabase.from('deals').update({ status: next }).eq('id', dealId);
    await supabase.from('deal_events').insert({
      deal_id: dealId,
      event_type: 'status_change',
      actor_type: 'staff',
      actor_id: staffUser.user_id,
      actor_name: `${staffUser.fornamn} ${staffUser.efternamn}`,
      payload_json: { from: deal.status, to: next },
    });

    setSaving(false);
    fetchAll();
  };

  const cancelDeal = async () => {
    if (!confirm('Avbryta affären?')) return;
    await supabase.from('deals').update({ status: 'cancelled' }).eq('id', dealId);
    await supabase.from('deal_events').insert({
      deal_id: dealId, event_type: 'status_change',
      actor_type: 'staff', actor_id: staffUser.user_id,
      actor_name: `${staffUser.fornamn} ${staffUser.efternamn}`,
      payload_json: { from: deal?.status, to: 'cancelled' },
    });
    fetchAll();
  };

  const addLine = async () => {
    if (!newLine.description) return;
    await supabase.from('deal_lines').insert({
      deal_id: dealId,
      line_type: newLine.line_type,
      description: newLine.description,
      list_price: parseInt(newLine.list_price) || 0,
      negotiated_price: parseInt(newLine.negotiated_price) || 0,
      kickback_amount: parseInt(newLine.kickback_amount) || 0,
      sort_order: lines.length,
    });
    await supabase.from('deal_events').insert({
      deal_id: dealId, event_type: 'line_added',
      actor_type: 'staff', actor_id: staffUser.user_id,
      actor_name: `${staffUser.fornamn} ${staffUser.efternamn}`,
      payload_json: { description: newLine.description, line_type: newLine.line_type },
    });
    setNewLine({ line_type: 'addon', description: '', list_price: '', negotiated_price: '', kickback_amount: '' });
    setShowAddLine(false);
    fetchAll();
  };

  const removeLine = async (lineId: string) => {
    await supabase.from('deal_lines').delete().eq('id', lineId);
    await supabase.from('deal_events').insert({
      deal_id: dealId, event_type: 'line_removed',
      actor_type: 'staff', actor_id: staffUser.user_id,
      actor_name: `${staffUser.fornamn} ${staffUser.efternamn}`,
      payload_json: {},
    });
    fetchAll();
  };

  const addTask = async () => {
    if (!newTask.note) return;
    await supabase.from('deal_tasks').insert({
      deal_id: dealId,
      task_type: newTask.task_type,
      assigned_to_staff_user_id: staffUser.id,
      due_at: newTask.due_at || null,
      note: newTask.note,
    });
    await supabase.from('deal_events').insert({
      deal_id: dealId, event_type: 'task_created',
      actor_type: 'staff', actor_id: staffUser.user_id,
      actor_name: `${staffUser.fornamn} ${staffUser.efternamn}`,
      payload_json: { task_type: newTask.task_type },
    });
    setNewTask({ task_type: 'other', note: '', due_at: '' });
    setShowAddTask(false);
    fetchAll();
  };

  const toggleTask = async (task: DealTask) => {
    const next = task.status === 'done' ? 'pending' : 'done';
    await supabase.from('deal_tasks').update({
      status: next,
      completed_at: next === 'done' ? new Date().toISOString() : null,
    }).eq('id', task.id);
    if (next === 'done') {
      await supabase.from('deal_events').insert({
        deal_id: dealId, event_type: 'task_completed',
        actor_type: 'staff', actor_id: staffUser.user_id,
        actor_name: `${staffUser.fornamn} ${staffUser.efternamn}`,
        payload_json: { task_id: task.id, task_type: task.task_type },
      });
    }
    fetchAll();
  };

  const saveInternalNote = async () => {
    if (!internalNote.trim()) return;
    setSavingNote(true);
    await supabase.from('deals').update({ internal_notes: internalNote }).eq('id', dealId);
    await supabase.from('deal_events').insert({
      deal_id: dealId, event_type: 'note_added',
      actor_type: 'staff', actor_id: staffUser.user_id,
      actor_name: `${staffUser.fornamn} ${staffUser.efternamn}`,
      payload_json: {},
    });
    setSavingNote(false);
    fetchAll();
  };

  // Totals
  const totalList = lines.reduce((s, l) => s + l.list_price, 0);
  const totalNegotiated = lines.reduce((s, l) => s + l.negotiated_price, 0);
  const totalKickback = lines.reduce((s, l) => s + l.kickback_amount, 0);
  const carLine = lines.find(l => l.line_type === 'car');
  const tradeInLine = lines.find(l => l.line_type === 'trade_in');
  const toPay = (carLine?.negotiated_price ?? 0) - Math.abs(tradeInLine?.negotiated_price ?? 0);

  if (loading) {
    return (
      <StaffShell activePage="deals" staffUser={staffUser} onLoggedOut={onLoggedOut}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </StaffShell>
    );
  }

  if (!deal) {
    return (
      <StaffShell activePage="deals" staffUser={staffUser} onLoggedOut={onLoggedOut}>
        <div className="text-center py-16 text-slate-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Affären hittades inte.</p>
        </div>
      </StaffShell>
    );
  }

  const statusIdx = STATUS_FLOW.indexOf(deal.status);
  const nextAction = NEXT_ACTION_LABEL[deal.status];
  const latestApproval = approvals[0];
  const openTasks = tasks.filter(t => t.status !== 'done');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <StaffShell activePage="deals" staffUser={staffUser} onLoggedOut={onLoggedOut}>
      <div className="max-w-5xl">
        {/* Back + header */}
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-5 transition">
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till affärer
        </button>

        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">
                {deal.cars ? `${deal.cars.marke} ${deal.cars.modell} ${deal.cars.ar}` : 'Ny affär'}
              </h1>
              <span className="text-sm font-mono text-slate-400">{deal.deal_number ?? '—'}</span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {deal.dealers?.foretagsnamn ?? '—'}
              {deal.customers?.namn && ` · ${deal.customers.namn}`}
            </p>
          </div>
          {deal.status !== 'handed_over' && deal.status !== 'cancelled' && (
            <div className="flex gap-2">
              {nextAction && (
                <button
                  onClick={advanceStatus}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition"
                  style={{ background: '#00A85A', color: 'white', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {nextAction}
                </button>
              )}
              <button
                onClick={cancelDeal}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition"
              >
                Avbryt
              </button>
            </div>
          )}
        </div>

        {/* Status stepper */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
          <div className="flex items-center gap-0 overflow-x-auto pb-1">
            {STATUS_FLOW.map((s, idx) => {
              const done = idx < statusIdx;
              const active = idx === statusIdx;
              const future = idx > statusIdx;
              return (
                <div key={s} className="flex items-center shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition"
                      style={{
                        background: done ? '#00A85A' : active ? '#0A1628' : '#F3F4F6',
                        borderColor: done ? '#00A85A' : active ? '#0A1628' : '#E5E7EB',
                        color: done || active ? 'white' : '#9CA3AF',
                      }}
                    >
                      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span
                      className="text-[10px] mt-1 text-center max-w-[64px] leading-tight"
                      style={{ color: active ? '#0A1628' : future ? '#D1D5DB' : '#6B7280', fontWeight: active ? 700 : 400 }}
                    >
                      {STATUS_LABELS[s]}
                    </span>
                  </div>
                  {idx < STATUS_FLOW.length - 1 && (
                    <div
                      className="h-0.5 w-8 mx-1 shrink-0"
                      style={{ background: done ? '#00A85A' : '#E5E7EB' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {deal.status === 'rejected' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
              <XCircle className="w-4 h-4 shrink-0" />
              Avvisad av handlare. {latestApproval?.message && `"${latestApproval.message}"`}
            </div>
          )}
          {deal.status === 'sent_for_approval' && latestApproval && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
              <Clock className="w-4 h-4 shrink-0" />
              Väntar på {deal.dealers?.foretagsnamn}.
              {latestApproval.sla_deadline_at && (
                <span className="ml-1">
                  SLA: {new Date(latestApproval.sla_deadline_at).toLocaleString('sv-SE', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* LEFT: Affärskort */}
          <div className="lg:col-span-2 space-y-5">

            {/* Lines */}
            <div className="bg-white rounded-2xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Affärsrader</h2>
                <button
                  onClick={() => setShowAddLine(!showAddLine)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: '#F0FDF4', color: '#00A85A' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Lägg till
                </button>
              </div>

              {showAddLine && (
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Typ</label>
                      <select
                        value={newLine.line_type}
                        onChange={e => setNewLine({ ...newLine, line_type: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none"
                      >
                        {Object.entries(LINE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Beskrivning</label>
                      <input
                        value={newLine.description}
                        onChange={e => setNewLine({ ...newLine, description: e.target.value })}
                        placeholder="T.ex. Fordonsgaranti 3 år"
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Listpris (kr)</label>
                      <input
                        type="number"
                        value={newLine.list_price}
                        onChange={e => setNewLine({ ...newLine, list_price: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Förhandlat pris (kr)</label>
                      <input
                        type="number"
                        value={newLine.negotiated_price}
                        onChange={e => setNewLine({ ...newLine, negotiated_price: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Kickback (kr)</label>
                      <input
                        type="number"
                        value={newLine.kickback_amount}
                        onChange={e => setNewLine({ ...newLine, kickback_amount: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={addLine} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#00A85A', color: 'white' }}>
                      Spara rad
                    </button>
                    <button onClick={() => setShowAddLine(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200">
                      Avbryt
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-50">
                {lines.length === 0 ? (
                  <div className="px-5 py-6 text-center text-sm text-slate-400">
                    Inga rader ännu. Lägg till bil, inbyte och tillval.
                  </div>
                ) : (
                  lines.map(line => {
                    const Icon = LINE_TYPE_ICONS[line.line_type] ?? Tag;
                    const isTradeIn = line.line_type === 'trade_in';
                    return (
                      <div key={line.id} className="px-5 py-3.5 flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: isTradeIn ? '#FEF3C7' : '#F0F9FF' }}
                        >
                          <Icon className="w-4 h-4" style={{ color: isTradeIn ? '#D97706' : '#3B82F6' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{line.description}</div>
                          <div className="text-xs text-slate-400">{LINE_TYPE_LABELS[line.line_type]}</div>
                        </div>
                        <div className="text-right shrink-0">
                          {line.list_price !== line.negotiated_price && line.list_price > 0 && (
                            <div className="text-xs line-through text-slate-300">{fmtKr(line.list_price)}</div>
                          )}
                          <div className="text-sm font-bold" style={{ color: isTradeIn ? '#D97706' : '#0A1628' }}>
                            {isTradeIn ? '-' : ''}{fmtKr(line.negotiated_price)}
                          </div>
                          {line.kickback_amount > 0 && (
                            <div className="text-[11px] font-semibold" style={{ color: '#00A85A' }}>
                              +{fmtKr(line.kickback_amount)} kickback
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeLine(line.id)}
                          className="text-slate-300 hover:text-red-400 transition ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {lines.length > 0 && (
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Listpris totalt</span>
                    <span>{fmtKr(totalList)}</span>
                  </div>
                  {tradeInLine && (
                    <div className="flex justify-between text-xs text-amber-700">
                      <span>Inbyte</span>
                      <span>-{fmtKr(Math.abs(tradeInLine.negotiated_price))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Att betala</span>
                    <span>{fmtKr(toPay > 0 ? toPay : totalNegotiated)}</span>
                  </div>
                  {totalKickback > 0 && (
                    <div className="flex justify-between text-xs font-semibold" style={{ color: '#00A85A' }}>
                      <span>Kickback totalt (plattform+handlare+säljare)</span>
                      <span>+{fmtKr(totalKickback)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                  Uppgifter
                  {openTasks.length > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      {openTasks.length} öppna
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setShowAddTask(!showAddTask)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: '#EFF6FF', color: '#3B82F6' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ny uppgift
                </button>
              </div>

              {showAddTask && (
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Typ</label>
                      <select
                        value={newTask.task_type}
                        onChange={e => setNewTask({ ...newTask, task_type: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none"
                      >
                        {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Förfaller</label>
                      <input
                        type="datetime-local"
                        value={newTask.due_at}
                        onChange={e => setNewTask({ ...newTask, due_at: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Instruktion</label>
                      <input
                        value={newTask.note}
                        onChange={e => setNewTask({ ...newTask, note: e.target.value })}
                        placeholder="Vad ska göras?"
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={addTask} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ background: '#3B82F6', color: 'white' }}>
                      Spara
                    </button>
                    <button onClick={() => setShowAddTask(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200">
                      Avbryt
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-50">
                {tasks.length === 0 ? (
                  <div className="px-5 py-5 text-center text-sm text-slate-400">Inga uppgifter ännu.</div>
                ) : (
                  [...openTasks, ...doneTasks].map(task => (
                    <div key={task.id} className="px-5 py-3.5 flex items-start gap-3">
                      <button onClick={() => toggleTask(task)} className="mt-0.5 shrink-0">
                        <div
                          className="w-5 h-5 rounded border-2 flex items-center justify-center transition"
                          style={{
                            borderColor: task.status === 'done' ? '#00A85A' : '#D1D5DB',
                            background: task.status === 'done' ? '#00A85A' : 'white',
                          }}
                        >
                          {task.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-500 mb-0.5">{TASK_TYPE_LABELS[task.task_type]}</div>
                        <div
                          className="text-sm text-slate-700"
                          style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.5 : 1 }}
                        >
                          {task.note ?? '—'}
                        </div>
                        {task.due_at && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(task.due_at).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Internal note */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Internanteckning</h2>
              <textarea
                value={internalNote || deal.internal_notes || ''}
                onChange={e => setInternalNote(e.target.value)}
                rows={3}
                placeholder="Anteckningar som inte syns för kund eller handlare…"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 resize-none"
              />
              <button
                onClick={saveInternalNote}
                disabled={savingNote}
                className="mt-2 px-4 py-2 rounded-lg text-sm font-bold transition"
                style={{ background: '#0A1628', color: 'white', opacity: savingNote ? 0.7 : 1 }}
              >
                {savingNote ? 'Sparar…' : 'Spara'}
              </button>
            </div>
          </div>

          {/* RIGHT: Meta + Log */}
          <div className="space-y-5">
            {/* Deal info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Affärsinformation</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-400">Handlare</dt>
                  <dd className="font-semibold text-slate-900">{deal.dealers?.foretagsnamn ?? '—'}</dd>
                  {deal.dealers?.mejl && <dd className="text-xs text-slate-500">{deal.dealers.mejl}</dd>}
                </div>
                {deal.customers && (
                  <div>
                    <dt className="text-xs text-slate-400">Kund</dt>
                    <dd className="font-semibold text-slate-900">{deal.customers.namn}</dd>
                    {deal.customers.telefon && <dd className="text-xs text-slate-500">{deal.customers.telefon}</dd>}
                    {deal.customers.mejl && <dd className="text-xs text-slate-500">{deal.customers.mejl}</dd>}
                  </div>
                )}
                {deal.cars && (
                  <div>
                    <dt className="text-xs text-slate-400">Bil</dt>
                    <dd className="font-semibold text-slate-900">{deal.cars.marke} {deal.cars.modell} {deal.cars.ar}</dd>
                    {deal.cars.regnummer && <dd className="text-xs font-mono text-slate-500">{deal.cars.regnummer}</dd>}
                    {deal.cars.startbud && <dd className="text-xs text-slate-500">Utpris: {fmtKr(deal.cars.startbud)}</dd>}
                    {deal.cars.pool_prisgolv && <dd className="text-xs text-slate-500">Golv: {fmtKr(deal.cars.pool_prisgolv)}</dd>}
                  </div>
                )}
                <div>
                  <dt className="text-xs text-slate-400">Ansvarig säljare</dt>
                  <dd className="font-semibold text-slate-900">
                    {deal.staff_users ? `${(deal.staff_users as unknown as { fornamn: string; efternamn: string }).fornamn} ${(deal.staff_users as unknown as { fornamn: string; efternamn: string }).efternamn}` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Skapad</dt>
                  <dd className="text-slate-600">{timeAgo(deal.created_at)}</dd>
                </div>
                {deal.distance_sale && (
                  <div className="px-3 py-2 rounded-lg bg-blue-50 text-xs text-blue-700 font-semibold">
                    Distansförsäljning – ångerrätt gäller
                  </div>
                )}
              </dl>
            </div>

            {/* Approval history */}
            {approvals.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Godkännandehistorik</h2>
                <div className="space-y-3">
                  {approvals.map(a => (
                    <div key={a.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        {a.decision === 'approved' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {a.decision === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                        {a.decision === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                        {a.decision === 'counter_offer' && <RefreshCw className="w-4 h-4 text-blue-500" />}
                        <span className="font-semibold capitalize text-slate-800">
                          {a.decision === 'approved' ? 'Godkänd'
                            : a.decision === 'rejected' ? 'Avvisad'
                            : a.decision === 'counter_offer' ? `Motbud: ${a.counter_offer_amount != null ? fmtKr(a.counter_offer_amount) : '—'}`
                            : 'Väntar'}
                        </span>
                      </div>
                      {a.message && <p className="text-xs text-slate-500 mt-1 pl-6">"{a.message}"</p>}
                      <p className="text-[11px] text-slate-400 pl-6">{timeAgo(a.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event log toggle */}
            <div className="bg-white rounded-2xl border border-slate-200">
              <button
                onClick={() => setShowLog(!showLog)}
                className="w-full px-5 py-4 flex items-center justify-between text-sm font-bold text-slate-900"
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Händelselogg ({events.length})
                </span>
                {showLog ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {showLog && (
                <div className="border-t border-slate-100 divide-y divide-slate-50 max-h-80 overflow-y-auto">
                  {events.map(ev => (
                    <div key={ev.id} className="px-5 py-3">
                      <div className="text-xs font-semibold text-slate-700">{ev.event_type.replace(/_/g, ' ')}</div>
                      {ev.actor_name && <div className="text-[11px] text-slate-400">{ev.actor_name}</div>}
                      <div className="text-[11px] text-slate-300 mt-0.5">{timeAgo(ev.created_at)}</div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="px-5 py-4 text-xs text-slate-400 text-center">Inga händelser ännu.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffShell>
  );
}
