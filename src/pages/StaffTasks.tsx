import { useEffect, useState, useMemo } from 'react';
import {
  CheckSquare, Search, Filter, Loader2, CheckCircle2,
  Clock, AlertCircle, Circle, ChevronDown,
} from 'lucide-react';
import StaffShell from '../components/StaffShell';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

interface StaffTasksProps {
  staffUser: StaffUser;
  onLoggedOut: () => void;
  onOpenDeal: (id: string) => void;
}

interface Task {
  id: string;
  deal_id: string | null;
  task_type: string;
  description: string;
  status: 'pending' | 'done' | 'skipped';
  due_at: string | null;
  created_at: string;
  deals: { deal_number: string | null } | null;
  assigned_staff: { fornamn: string; efternamn: string } | null;
}

interface StaffMember {
  id: string;
  fornamn: string;
  efternamn: string;
}

type FilterStatus = 'all' | 'pending' | 'done';

const TASK_TYPE_LABELS: Record<string, string> = {
  dealer_approval: 'Handlargodkännande',
  customer_contact: 'Kundkontakt',
  document_collection: 'Dokumentinsamling',
  vehicle_inspection: 'Fordonsinspekt.',
  delivery_coordination: 'Leveranskoord.',
  follow_up: 'Uppföljning',
  other: 'Övrigt',
};

function timeUntil(iso: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return { label: 'Försenad', overdue: true };
  const h = Math.floor(diff / 3600000);
  if (h < 24) return { label: `Om ${h} h`, overdue: false };
  return { label: `Om ${Math.floor(h / 24)} d`, overdue: false };
}

const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };
const inputStyle = { border: '1px solid #E5E4E0', background: '#FFFFFF', color: '#1C1C1A', borderRadius: 8 };

export default function StaffTasks({ staffUser, onLoggedOut, onOpenDeal }: StaffTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [tasksRes, staffRes] = await Promise.all([
        supabase
          .from('deal_tasks')
          .select(`
            id, deal_id, task_type, description, status, due_at, created_at,
            deals(deal_number),
            assigned_staff:assigned_to_staff_user_id(fornamn, efternamn)
          `)
          .order('due_at', { ascending: true, nullsFirst: false })
          .limit(200),
        supabase.from('staff_users').select('id, fornamn, efternamn').eq('is_active', true),
      ]);

      setTasks((tasksRes.data ?? []) as unknown as Task[]);
      setStaffMembers((staffRes.data ?? []) as StaffMember[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterStaff && (t.assigned_staff as unknown as { id?: string } | null)?.id !== filterStaff) return false;
      if (filterType && t.task_type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          (t.deals?.deal_number ?? '').toLowerCase().includes(q) ||
          (TASK_TYPE_LABELS[t.task_type] ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tasks, filterStatus, filterStaff, filterType, search]);

  const overdueCount = tasks.filter(t => t.status === 'pending' && t.due_at && new Date(t.due_at) < new Date()).length;

  async function toggleTask(task: Task) {
    setTogglingId(task.id);
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    await supabase.from('deal_tasks').update({ status: newStatus }).eq('id', task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    setTogglingId(null);
  }

  const taskTypes = [...new Set(tasks.map(t => t.task_type))];

  return (
    <StaffShell activePage="tasks" staffUser={staffUser} onLoggedOut={onLoggedOut}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>Ekonomi & uppgifter</h1>
            <p className="text-[13px] mt-0.5 flex items-center gap-2" style={{ color: '#6E6D68' }}>
              {tasks.filter(t => t.status === 'pending').length} öppna
              {overdueCount > 0 && (
                <span className="flex items-center gap-1 font-medium" style={{ color: '#791F1F' }}>
                  <AlertCircle className="w-3 h-3" />
                  {overdueCount} försenade
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 mb-4 space-y-3" style={cardStyle}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#6E6D68' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Sök uppgift, affärsnummer…"
                className="w-full h-9 pl-8 pr-3 text-[14px] focus:outline-none"
                style={inputStyle}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-[13px] transition"
              style={{ border: '1px solid #E5E4E0', color: '#6E6D68', background: '#FFFFFF' }}
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
              <ChevronDown className={`w-3 h-3 transition ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Status tabs */}
          <div className="flex gap-0.5 p-1 rounded-lg w-fit" style={{ background: '#F7F6F3', border: '1px solid #E5E4E0' }}>
            {(['pending', 'all', 'done'] as FilterStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 h-7 rounded-md text-[12px] transition"
                style={{
                  background: filterStatus === s ? '#0F6E56' : 'transparent',
                  color: filterStatus === s ? '#FFFFFF' : '#6E6D68',
                  fontWeight: filterStatus === s ? 500 : 400,
                }}
              >
                {s === 'pending' ? 'Öppna' : s === 'done' ? 'Klara' : 'Alla'}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid #E5E4E0' }}>
              {staffMembers.length > 0 && (
                <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
                  className="h-8 px-3 rounded-lg text-[12px] focus:outline-none" style={{ ...inputStyle, borderRadius: 8 }}>
                  <option value="">Alla säljare</option>
                  {staffMembers.map(s => <option key={s.id} value={s.id}>{s.fornamn} {s.efternamn}</option>)}
                </select>
              )}
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="h-8 px-3 rounded-lg text-[12px] focus:outline-none" style={{ ...inputStyle, borderRadius: 8 }}>
                <option value="">Alla typer</option>
                {taskTypes.map(t => <option key={t} value={t}>{TASK_TYPE_LABELS[t] ?? t}</option>)}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={cardStyle}>
            <CheckSquare className="w-8 h-8 mx-auto mb-3" style={{ color: '#E5E4E0' }} />
            <p className="text-[14px]" style={{ color: '#6E6D68' }}>Inga uppgifter matchar.</p>
          </div>
        ) : (
          <div style={cardStyle}>
            {filtered.map((task, idx) => {
              const due = timeUntil(task.due_at);
              const isDone = task.status === 'done';
              const as = task.assigned_staff as unknown as { fornamn: string; efternamn: string } | null;

              return (
                <div
                  key={task.id}
                  className="px-5 py-4 flex items-start gap-3"
                  style={{
                    borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined,
                    background: !isDone && due?.overdue ? '#FFFBF0' : isDone ? '#F7F6F3' : '#FFFFFF',
                  }}
                >
                  <button onClick={() => toggleTask(task)} disabled={togglingId === task.id} className="mt-0.5 shrink-0">
                    {togglingId === task.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#6E6D68' }} />
                    ) : isDone ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: '#0F6E56' }} />
                    ) : (
                      <Circle className="w-4 h-4" style={{ color: '#E5E4E0' }} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium" style={{ color: isDone ? '#6E6D68' : '#1C1C1A', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {task.description}
                        </p>
                        <div className="flex items-center flex-wrap gap-2 mt-1">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#F7F6F3', color: '#6E6D68', borderRadius: 100 }}>
                            {TASK_TYPE_LABELS[task.task_type] ?? task.task_type}
                          </span>
                          {task.deals?.deal_number && (
                            <button
                              onClick={() => task.deal_id && onOpenDeal(task.deal_id)}
                              className="text-[11px] font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#0C447C' }}
                            >
                              {task.deals.deal_number}
                            </button>
                          )}
                          {as && (
                            <span className="text-[11px]" style={{ color: '#6E6D68' }}>{as.fornamn} {as.efternamn}</span>
                          )}
                        </div>
                      </div>
                      {due && !isDone && (
                        <span className="text-[11px] font-medium shrink-0 flex items-center gap-1"
                          style={{ color: due.overdue ? '#791F1F' : '#6E6D68' }}>
                          {due.overdue && <AlertCircle className="w-3 h-3" />}
                          <Clock className="w-3 h-3" />
                          {due.label}
                        </span>
                      )}
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
