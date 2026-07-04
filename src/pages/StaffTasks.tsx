import { useEffect, useState, useMemo } from 'react';
import {
  CheckSquare, Search, Filter, Loader2, Plus, CheckCircle2,
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
  created_by_staff: { fornamn: string; efternamn: string } | null;
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
            assigned_staff:assigned_to_staff_user_id(fornamn, efternamn),
            created_by_staff:created_by_staff_user_id(fornamn, efternamn)
          `)
          .order('due_at', { ascending: true, nullsFirst: false })
          .limit(200),
        supabase
          .from('staff_users')
          .select('id, fornamn, efternamn')
          .eq('is_active', true),
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
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-blue-500" />
              Uppgifter
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
              {tasks.filter(t => t.status === 'pending').length} öppna
              {overdueCount > 0 && (
                <span className="flex items-center gap-1 text-red-500 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {overdueCount} försenade
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Sök uppgift, affärsnummer…"
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className={`w-3.5 h-3.5 transition ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Status tabs */}
          <div className="flex gap-1">
            {(['pending', 'all', 'done'] as FilterStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 py-1 rounded-lg text-xs font-bold transition"
                style={{
                  background: filterStatus === s ? '#0A1628' : 'transparent',
                  color: filterStatus === s ? 'white' : '#6B7280',
                }}
              >
                {s === 'pending' ? 'Öppna' : s === 'done' ? 'Klara' : 'Alla'}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-100">
              {staffMembers.length > 0 && (
                <select
                  value={filterStaff}
                  onChange={e => setFilterStaff(e.target.value)}
                  className="h-8 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                >
                  <option value="">Alla säljare</option>
                  {staffMembers.map(s => (
                    <option key={s.id} value={s.id}>{s.fornamn} {s.efternamn}</option>
                  ))}
                </select>
              )}
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="h-8 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="">Alla typer</option>
                {taskTypes.map(t => (
                  <option key={t} value={t}>{TASK_TYPE_LABELS[t] ?? t}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-400">Inga uppgifter matchar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => {
              const due = timeUntil(task.due_at);
              const isDone = task.status === 'done';

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-start gap-4 transition"
                  style={{
                    borderColor: !isDone && due?.overdue ? '#FECACA' : '#E5E7EB',
                    background: isDone ? '#F9FAFB' : 'white',
                  }}
                >
                  {/* Toggle checkbox */}
                  <button
                    onClick={() => toggleTask(task)}
                    disabled={togglingId === task.id}
                    className="mt-0.5 shrink-0 transition"
                  >
                    {togglingId === task.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-blue-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold text-slate-900 leading-snug"
                          style={{ textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.5 : 1 }}
                        >
                          {task.description}
                        </p>
                        <div className="flex items-center flex-wrap gap-2 mt-1">
                          <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
                            {TASK_TYPE_LABELS[task.task_type] ?? task.task_type}
                          </span>
                          {task.deals?.deal_number && (
                            <button
                              onClick={() => task.deal_id && onOpenDeal(task.deal_id)}
                              className="text-[11px] text-blue-500 font-mono hover:underline"
                            >
                              {task.deals.deal_number}
                            </button>
                          )}
                          {task.assigned_staff && (
                            <span className="text-[11px] text-slate-400">
                              {(task.assigned_staff as unknown as { fornamn: string; efternamn: string }).fornamn}{' '}
                              {(task.assigned_staff as unknown as { fornamn: string; efternamn: string }).efternamn}
                            </span>
                          )}
                        </div>
                      </div>
                      {due && !isDone && (
                        <span
                          className="text-[11px] font-bold shrink-0 flex items-center gap-1"
                          style={{ color: due.overdue ? '#DC2626' : '#6B7280' }}
                        >
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
