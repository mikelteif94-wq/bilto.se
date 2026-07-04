import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Loader2, Plus, Trash2, Send, CheckCircle2,
  XCircle, Clock, AlertCircle, ChevronDown, ChevronUp,
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
  assigned_staff_user_id: string | null;
  dealers: { id: string; foretagsnamn: string; mejl: string | null; pool_sla_minutes: number } | null;
  customers: { id: string; namn: string; telefon: string | null; mejl: string | null } | null;
  cars: { id: string; marke: string; modell: string; ar: number; regnummer: string | null; startbud: number | null; pool_prisgolv: number | null } | null;
}

interface DealLine {
  id: string;
  line_type: string;
  description: string;
  list_price: number;
  negotiated_price: number;
  kickback_amount: number;
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

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  draft:             { bg: '#F7F6F3', text: '#6E6D68' },
  sent_for_approval: { bg: '#E6F1FB', text: '#0C447C' },
  approved:          { bg: '#E1F5EE', text: '#085041' },
  rejected:          { bg: '#FCEBEB', text: '#791F1F' },
  contract_sent:     { bg: '#EEEDFE', text: '#3C3489' },
  contract_signed:   { bg: '#EEEDFE', text: '#3C3489' },
  deposit_sent:      { bg: '#FAEEDA', text: '#854F0B' },
  deposit_paid:      { bg: '#E1F5EE', text: '#085041' },
  reserved:          { bg: '#E1F5EE', text: '#085041' },
  handed_over:       { bg: '#EAF3DE', text: '#27500A' },
  cancelled:         { bg: '#F7F6F3', text: '#6E6D68' },
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
  draft: 'Skicka till handlare',
  approved: 'Kontrakt skickat',
  contract_sent: 'Kontrakt signerat',
  contract_signed: 'Handpenning skickad',
  deposit_sent: 'Handpenning betald',
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
  if (m < 1) return 'just nu';
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h sedan`;
  return `${Math.floor(h / 24)} d sedan`;
}

const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };
const inputStyle = { border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A', borderRadius: 8 };

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
        assigned_staff_user_id,
        dealers(id, foretagsnamn, mejl, pool_sla_minutes),
        customers(id, namn, telefon, mejl),
        cars(id, marke, modell, ar, regnummer, startbud, pool_prisgolv)
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
        deal_id: dealId, dealer_id: deal.dealers.id,
        decision: 'pending', sla_deadline_at: deadline,
      });
      await supabase.from('deal_tasks').insert({
        deal_id: dealId, task_type: 'dealer_approval',
        assigned_to_staff_user_id: staffUser.id, due_at: deadline,
        note: `Väntar på godkännande från ${deal.dealers.foretagsnamn}. SLA: ${slaMinutes} min.`,
      });
    }

    if (next === 'reserved' && deal.cars) {
      await supabase.from('cars').update({ pool_status: 'reserved', reserved_by_deal_id: dealId }).eq('id', deal.cars.id);
    }

    await supabase.from('deals').update({ status: next }).eq('id', dealId);
    await supabase.from('deal_events').insert({
      deal_id: dealId, event_type: 'status_change',
      actor_type: 'staff', actor_id: staffUser.user_id,
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
      deal_id: dealId, line_type: newLine.line_type,
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
      deal_id: dealId, task_type: newTask.task_type,
      assigned_to_staff_user_id: staffUser.id,
      due_at: newTask.due_at || null, note: newTask.note,
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
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
        </div>
      </StaffShell>
    );
  }

  if (!deal) {
    return (
      <StaffShell activePage="deals" staffUser={staffUser} onLoggedOut={onLoggedOut}>
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <AlertCircle className="w-7 h-7" style={{ color: '#E5E4E0' }} />
          <p className="text-[14px]" style={{ color: '#6E6D68' }}>Affären hittades inte.</p>
        </div>
      </StaffShell>
    );
  }

  const statusIdx = STATUS_FLOW.indexOf(deal.status);
  const nextAction = NEXT_ACTION_LABEL[deal.status];
  const latestApproval = approvals[0];
  const openTasks = tasks.filter(t => t.status !== 'done');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const statusStyle = STATUS_STYLE[deal.status] ?? STATUS_STYLE.draft;

  return (
    <StaffShell activePage="deals" staffUser={staffUser} onLoggedOut={onLoggedOut}>
      <div className="max-w-5xl">
        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-1.5 mb-5 text-[13px] transition" style={{ color: '#6E6D68' }}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Tillbaka
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
              <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>
                {deal.cars ? `${deal.cars.marke} ${deal.cars.modell} ${deal.cars.ar}` : 'Affär'}
              </h1>
              {deal.cars?.regnummer && (
                <span className="text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                  {deal.cars.regnummer}
                </span>
              )}
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: 100 }}>
                {STATUS_LABELS[deal.status] ?? deal.status}
              </span>
            </div>
            <p className="text-[13px]" style={{ color: '#6E6D68' }}>
              {deal.deal_number && <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{deal.deal_number} · </span>}
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
                  className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-[13px] font-medium transition"
                  style={{ background: '#0F6E56', color: '#FFFFFF', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {nextAction}
                </button>
              )}
              <button
                onClick={cancelDeal}
                className="px-4 h-9 rounded-lg text-[13px] font-medium transition"
                style={{ border: '1px solid #FCEBEB', color: '#791F1F', background: '#FFFFFF' }}
              >
                Avbryt affär
              </button>
            </div>
          )}
        </div>

        {/* Status stepper */}
        <div className="mb-5 p-4 overflow-x-auto" style={cardStyle}>
          <div className="flex items-center gap-0">
            {STATUS_FLOW.map((s, idx) => {
              const done = idx < statusIdx;
              const active = idx === statusIdx;
              return (
                <div key={s} className="flex items-center shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: done ? '#E1F5EE' : active ? '#0F6E56' : '#F7F6F3',
                        border: active ? 'none' : done ? '1px solid #C7EBD9' : '1px solid #E5E4E0',
                      }}
                    >
                      {done
                        ? <CheckCircle2 className="w-3 h-3" style={{ color: '#085041' }} />
                        : <span className="text-[10px] font-medium" style={{ color: active ? '#FFFFFF' : '#6E6D68' }}>{idx + 1}</span>
                      }
                    </div>
                    <span className="text-[10px] mt-1 text-center leading-tight" style={{ maxWidth: 60, color: active ? '#1C1C1A' : '#6E6D68', fontWeight: active ? 500 : 400 }}>
                      {STATUS_LABELS[s]}
                    </span>
                  </div>
                  {idx < STATUS_FLOW.length - 1 && (
                    <div className="h-px w-6 mx-1 shrink-0 mb-3" style={{ background: done ? '#C7EBD9' : '#E5E4E0' }} />
                  )}
                </div>
              );
            })}
          </div>

          {deal.status === 'rejected' && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-[13px]" style={{ background: '#FCEBEB', color: '#791F1F' }}>
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              Avvisad av handlare.{latestApproval?.message && ` "${latestApproval.message}"`}
            </div>
          )}
          {deal.status === 'sent_for_approval' && latestApproval && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-[13px]" style={{ background: '#FAEEDA', color: '#854F0B' }}>
              <Clock className="w-3.5 h-3.5 shrink-0" />
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
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">

            {/* Lines */}
            <div style={cardStyle}>
              <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid #E5E4E0' }}>
                <h2 className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>Affärsrader</h2>
                <button
                  onClick={() => setShowAddLine(!showAddLine)}
                  className="flex items-center gap-1.5 text-[12px] font-medium px-3 h-7 rounded-lg"
                  style={{ background: '#EEF7F4', color: '#0F6E56' }}
                >
                  <Plus className="w-3 h-3" />
                  Lägg till
                </button>
              </div>

              {showAddLine && (
                <div className="px-5 py-4" style={{ background: '#F7F6F3', borderBottom: '1px solid #E5E4E0' }}>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {([
                      { label: 'Typ', field: 'line_type', type: 'select' },
                      { label: 'Beskrivning', field: 'description', type: 'text', placeholder: 'T.ex. Fordonsgaranti 3 år' },
                      { label: 'Listpris (kr)', field: 'list_price', type: 'number' },
                      { label: 'Förhandlat pris (kr)', field: 'negotiated_price', type: 'number' },
                      { label: 'Kickback (kr)', field: 'kickback_amount', type: 'number' },
                    ] as { label: string; field: string; type: string; placeholder?: string }[]).map(f => (
                      <div key={f.field}>
                        <label className="text-[12px] font-medium mb-1 block" style={{ color: '#6E6D68' }}>{f.label}</label>
                        {f.type === 'select' ? (
                          <select
                            value={newLine[f.field as keyof typeof newLine]}
                            onChange={e => setNewLine({ ...newLine, [f.field]: e.target.value })}
                            className="w-full h-9 px-3 text-[13px] focus:outline-none"
                            style={inputStyle}
                          >
                            {Object.entries(LINE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        ) : (
                          <input
                            type={f.type}
                            value={newLine[f.field as keyof typeof newLine]}
                            onChange={e => setNewLine({ ...newLine, [f.field]: e.target.value })}
                            placeholder={f.placeholder}
                            className="w-full h-9 px-3 text-[13px] focus:outline-none"
                            style={inputStyle}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={addLine} className="px-4 h-8 rounded-lg text-[13px] font-medium" style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                      Spara rad
                    </button>
                    <button onClick={() => setShowAddLine(false)} className="px-4 h-8 rounded-lg text-[13px]" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>
                      Avbryt
                    </button>
                  </div>
                </div>
              )}

              <div>
                {lines.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[13px]" style={{ color: '#6E6D68' }}>
                    Inga rader ännu.
                  </div>
                ) : (
                  lines.map((line, idx) => {
                    const Icon = LINE_TYPE_ICONS[line.line_type] ?? Tag;
                    const isTradeIn = line.line_type === 'trade_in';
                    return (
                      <div key={line.id} className="px-5 py-3.5 flex items-center gap-3" style={{ borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined }}>
                        <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: isTradeIn ? '#FAEEDA' : '#F7F6F3' }}>
                          <Icon className="w-4 h-4" style={{ color: isTradeIn ? '#854F0B' : '#6E6D68' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>{line.description}</div>
                          <div className="text-[12px]" style={{ color: '#6E6D68' }}>{LINE_TYPE_LABELS[line.line_type]}</div>
                        </div>
                        <div className="text-right shrink-0">
                          {line.list_price !== line.negotiated_price && line.list_price > 0 && (
                            <div className="text-[11px] line-through" style={{ color: '#6E6D68' }}>{fmtKr(line.list_price)}</div>
                          )}
                          <div className="text-[14px] font-medium" style={{ color: isTradeIn ? '#854F0B' : '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>
                            {isTradeIn ? '−' : ''}{fmtKr(line.negotiated_price)}
                          </div>
                          {line.kickback_amount > 0 && (
                            <div className="text-[11px] font-medium" style={{ color: '#085041' }}>
                              +{fmtKr(line.kickback_amount)} kickback
                            </div>
                          )}
                        </div>
                        <button onClick={() => removeLine(line.id)} className="ml-1 transition" style={{ color: '#E5E4E0' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#791F1F')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#E5E4E0')}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {lines.length > 0 && (
                <div className="px-5 py-3.5 space-y-1.5 rounded-b-xl" style={{ borderTop: '1px solid #E5E4E0', background: '#F7F6F3' }}>
                  <div className="flex justify-between text-[12px]" style={{ color: '#6E6D68' }}>
                    <span>Listpris totalt</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(totalList)}</span>
                  </div>
                  {tradeInLine && (
                    <div className="flex justify-between text-[12px]" style={{ color: '#854F0B' }}>
                      <span>Inbyte</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>−{fmtKr(Math.abs(tradeInLine.negotiated_price))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[14px] font-medium pt-1" style={{ borderTop: '1px solid #E5E4E0', color: '#1C1C1A' }}>
                    <span>Att betala</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(toPay > 0 ? toPay : totalNegotiated)}</span>
                  </div>
                  {totalKickback > 0 && (
                    <div className="flex justify-between text-[12px] font-medium" style={{ color: '#085041' }}>
                      <span>Kickback totalt</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>+{fmtKr(totalKickback)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tasks */}
            <div style={cardStyle}>
              <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid #E5E4E0' }}>
                <h2 className="text-[14px] font-medium flex items-center gap-2" style={{ color: '#1C1C1A' }}>
                  <ClipboardList className="w-4 h-4" style={{ color: '#6E6D68' }} />
                  Uppgifter
                  {openTasks.length > 0 && (
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#FAEEDA', color: '#854F0B' }}>
                      {openTasks.length}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setShowAddTask(!showAddTask)}
                  className="flex items-center gap-1.5 text-[12px] font-medium px-3 h-7 rounded-lg"
                  style={{ background: '#EEF7F4', color: '#0F6E56' }}
                >
                  <Plus className="w-3 h-3" />
                  Ny uppgift
                </button>
              </div>

              {showAddTask && (
                <div className="px-5 py-4" style={{ background: '#F7F6F3', borderBottom: '1px solid #E5E4E0' }}>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-medium mb-1 block" style={{ color: '#6E6D68' }}>Typ</label>
                      <select value={newTask.task_type} onChange={e => setNewTask({ ...newTask, task_type: e.target.value })}
                        className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle}>
                        {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-medium mb-1 block" style={{ color: '#6E6D68' }}>Förfaller</label>
                      <input type="datetime-local" value={newTask.due_at} onChange={e => setNewTask({ ...newTask, due_at: e.target.value })}
                        className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[12px] font-medium mb-1 block" style={{ color: '#6E6D68' }}>Instruktion</label>
                      <input value={newTask.note} onChange={e => setNewTask({ ...newTask, note: e.target.value })}
                        placeholder="Vad ska göras?" className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={addTask} className="px-4 h-8 rounded-lg text-[13px] font-medium" style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                      Spara
                    </button>
                    <button onClick={() => setShowAddTask(false)} className="px-4 h-8 rounded-lg text-[13px]" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>
                      Avbryt
                    </button>
                  </div>
                </div>
              )}

              <div>
                {tasks.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[13px]" style={{ color: '#6E6D68' }}>Inga uppgifter ännu.</div>
                ) : (
                  [...openTasks, ...doneTasks].map((task, idx) => (
                    <div key={task.id} className="px-5 py-3.5 flex items-start gap-3" style={{ borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined }}>
                      <button onClick={() => toggleTask(task)} className="mt-0.5 shrink-0">
                        <div className="w-4 h-4 rounded flex items-center justify-center"
                          style={{ background: task.status === 'done' ? '#0F6E56' : '#FFFFFF', border: task.status === 'done' ? 'none' : '1px solid #E5E4E0' }}>
                          {task.status === 'done' && <CheckCircle2 className="w-3 h-3" style={{ color: '#FFFFFF' }} />}
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium mb-0.5" style={{ color: '#6E6D68' }}>{TASK_TYPE_LABELS[task.task_type]}</div>
                        <div className="text-[13px]" style={{ color: '#1C1C1A', textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.5 : 1 }}>
                          {task.note ?? '—'}
                        </div>
                        {task.due_at && (
                          <div className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: '#6E6D68' }}>
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
            <div className="p-5" style={cardStyle}>
              <h2 className="text-[14px] font-medium mb-3" style={{ color: '#1C1C1A' }}>Internanteckning</h2>
              <textarea
                value={internalNote || deal.internal_notes || ''}
                onChange={e => setInternalNote(e.target.value)}
                rows={3}
                placeholder="Anteckningar som inte syns för kund eller handlare…"
                className="w-full px-3 py-2 text-[13px] focus:outline-none resize-none"
                style={inputStyle}
              />
              <button
                onClick={saveInternalNote}
                disabled={savingNote}
                className="mt-2 px-4 h-8 rounded-lg text-[13px] font-medium"
                style={{ background: '#0F6E56', color: '#FFFFFF', opacity: savingNote ? 0.7 : 1 }}
              >
                {savingNote ? 'Sparar…' : 'Spara'}
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {/* Deal info */}
            <div className="p-5" style={cardStyle}>
              <h2 className="text-[13px] font-medium mb-4" style={{ color: '#6E6D68', letterSpacing: '0.03em' }}>Affärsinformation</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-[11px] mb-0.5" style={{ color: '#6E6D68' }}>Handlare</dt>
                  <dd className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>{deal.dealers?.foretagsnamn ?? '—'}</dd>
                  {deal.dealers?.mejl && <dd className="text-[12px]" style={{ color: '#6E6D68' }}>{deal.dealers.mejl}</dd>}
                </div>
                {deal.customers && (
                  <div>
                    <dt className="text-[11px] mb-0.5" style={{ color: '#6E6D68' }}>Kund</dt>
                    <dd className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>{deal.customers.namn}</dd>
                    {deal.customers.telefon && <dd className="text-[12px]" style={{ color: '#6E6D68' }}>{deal.customers.telefon}</dd>}
                    {deal.customers.mejl && <dd className="text-[12px]" style={{ color: '#6E6D68' }}>{deal.customers.mejl}</dd>}
                  </div>
                )}
                {deal.cars && (
                  <div>
                    <dt className="text-[11px] mb-0.5" style={{ color: '#6E6D68' }}>Bil</dt>
                    <dd className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>{deal.cars.marke} {deal.cars.modell} {deal.cars.ar}</dd>
                    {deal.cars.regnummer && (
                      <dd>
                        <span className="text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                          {deal.cars.regnummer}
                        </span>
                      </dd>
                    )}
                    {deal.cars.startbud != null && <dd className="text-[12px]" style={{ color: '#6E6D68' }}>Utpris: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(deal.cars.startbud)}</span></dd>}
                    {deal.cars.pool_prisgolv != null && <dd className="text-[12px]" style={{ color: '#6E6D68' }}>Golv: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(deal.cars.pool_prisgolv)}</span></dd>}
                  </div>
                )}
                <div>
                  <dt className="text-[11px] mb-0.5" style={{ color: '#6E6D68' }}>Ansvarig säljare</dt>
                  <dd className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>{staffUser.fornamn} {staffUser.efternamn}</dd>
                </div>
                <div>
                  <dt className="text-[11px] mb-0.5" style={{ color: '#6E6D68' }}>Skapad</dt>
                  <dd className="text-[13px]" style={{ color: '#6E6D68' }}>{timeAgo(deal.created_at)}</dd>
                </div>
                {deal.distance_sale && (
                  <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: '#E6F1FB', color: '#0C447C' }}>
                    Distansförsäljning — ångerrätt gäller
                  </div>
                )}
              </dl>
            </div>

            {/* Approval history */}
            {approvals.length > 0 && (
              <div className="p-5" style={cardStyle}>
                <h2 className="text-[13px] font-medium mb-3" style={{ color: '#6E6D68', letterSpacing: '0.03em' }}>Godkännandehistorik</h2>
                <div className="space-y-3">
                  {approvals.map(a => (
                    <div key={a.id}>
                      <div className="flex items-center gap-2">
                        {a.decision === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#085041' }} />}
                        {a.decision === 'rejected' && <XCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#791F1F' }} />}
                        {a.decision === 'pending' && <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: '#854F0B' }} />}
                        {a.decision === 'counter_offer' && <RefreshCw className="w-3.5 h-3.5 shrink-0" style={{ color: '#0C447C' }} />}
                        <span className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>
                          {a.decision === 'approved' ? 'Godkänd'
                            : a.decision === 'rejected' ? 'Avvisad'
                            : a.decision === 'counter_offer' ? `Motbud: ${a.counter_offer_amount != null ? fmtKr(a.counter_offer_amount) : '—'}`
                            : 'Väntar'}
                        </span>
                      </div>
                      {a.message && <p className="text-[12px] mt-0.5 pl-5" style={{ color: '#6E6D68' }}>"{a.message}"</p>}
                      <p className="text-[11px] pl-5" style={{ color: '#6E6D68' }}>{timeAgo(a.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event log */}
            <div style={cardStyle}>
              <button
                onClick={() => setShowLog(!showLog)}
                className="w-full px-5 py-3.5 flex items-center justify-between"
              >
                <span className="flex items-center gap-2 text-[14px] font-medium" style={{ color: '#1C1C1A' }}>
                  <History className="w-3.5 h-3.5" style={{ color: '#6E6D68' }} />
                  Händelselogg
                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#F7F6F3', color: '#6E6D68' }}>{events.length}</span>
                </span>
                {showLog ? <ChevronUp className="w-3.5 h-3.5" style={{ color: '#6E6D68' }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#6E6D68' }} />}
              </button>
              {showLog && (
                <div className="max-h-72 overflow-y-auto" style={{ borderTop: '1px solid #E5E4E0' }}>
                  {events.length === 0 ? (
                    <div className="px-5 py-4 text-center text-[12px]" style={{ color: '#6E6D68' }}>Inga händelser ännu.</div>
                  ) : (
                    events.map((ev, idx) => (
                      <div key={ev.id} className="px-5 py-3" style={{ borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined }}>
                        <div className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{ev.event_type.replace(/_/g, ' ')}</div>
                        {ev.actor_name && <div className="text-[12px]" style={{ color: '#6E6D68' }}>{ev.actor_name}</div>}
                        <div className="text-[11px] mt-0.5" style={{ color: '#6E6D68' }}>{timeAgo(ev.created_at)}</div>
                      </div>
                    ))
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
