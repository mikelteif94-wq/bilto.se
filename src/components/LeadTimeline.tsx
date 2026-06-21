import { useEffect, useState, useCallback } from 'react';
import {
  Phone, MessageCircle, Gavel, RefreshCw, Send, Bell, Clock,
  Plus, Check, Loader2, AlertCircle, X, Eye, MessageSquare,
  Zap, User, ShieldCheck, ArrowRightCircle, FileText, Repeat,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeadType = 'car' | 'quote';

interface Activity {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  source: string | null;
  actor_type: string | null;
  created_by_name: string | null;
  created_at: string;
}

interface Reminder {
  id: string;
  remind_at: string;
  title: string;
  done: boolean;
  done_at: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface LeadTimelineProps {
  leadType: LeadType;
  leadId: string;
  adminUserId: string;
  adminName: string;
  /** When true renders inline (no panel chrome) */
  inline?: boolean;
  onClose?: () => void;
}

// ─── Activity config ──────────────────────────────────────────────────────────

const ACTIVITY_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    color: string;
    dot: string;
    label: string;
  }
> = {
  call:              { icon: Phone,            color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400',  label: 'Samtal' },
  note:              { icon: MessageCircle,    color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-400',     label: 'Notering' },
  bid:               { icon: Gavel,            color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400',    label: 'Bud' },
  bid_placed:        { icon: Gavel,            color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500',    label: 'Bud inkom' },
  status_change:     { icon: RefreshCw,        color: 'bg-slate-100 text-slate-600',     dot: 'bg-slate-400',    label: 'Status' },
  lead_sent:         { icon: Send,             color: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-400',   label: 'Lead skickat' },
  dispatch:          { icon: Send,             color: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-500',   label: 'Dispatch' },
  auto_dispatch:     { icon: Zap,              color: 'bg-violet-100 text-violet-700',   dot: 'bg-violet-500',   label: 'Auto-dispatch' },
  dispatch_opened:   { icon: Eye,              color: 'bg-sky-100 text-sky-700',         dot: 'bg-sky-400',      label: 'Öppnad' },
  dispatch_replied:  { icon: MessageSquare,    color: 'bg-teal-100 text-teal-700',       dot: 'bg-teal-500',     label: 'Svar' },
  nudge:             { icon: Bell,             color: 'bg-amber-100 text-amber-600',     dot: 'bg-amber-400',    label: 'Påminnelse' },
  reminder:          { icon: Bell,             color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400',    label: 'Påminnelse' },
  portal_viewed:     { icon: Eye,              color: 'bg-sky-100 text-sky-600',         dot: 'bg-sky-400',      label: 'Portal' },
  customer_decision: { icon: ShieldCheck,      color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500',  label: 'Kundval' },
  valuation_request: { icon: FileText,         color: 'bg-slate-100 text-slate-600',     dot: 'bg-slate-400',    label: 'Värdering' },
  valuation_response:{ icon: FileText,         color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400',  label: 'Värderingssvar' },
  convert:           { icon: ArrowRightCircle, color: 'bg-teal-100 text-teal-700',       dot: 'bg-teal-500',     label: 'Konverterat' },
  trade_in:          { icon: Repeat,           color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-400',   label: 'Inbyte' },
  system:            { icon: Zap,              color: 'bg-slate-100 text-slate-500',     dot: 'bg-slate-300',    label: 'System' },
};

const FALLBACK = { icon: MessageCircle, color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-300', label: 'Händelse' };

function getCfg(type: string) {
  return ACTIVITY_CONFIG[type] ?? FALLBACK;
}

// ─── Log type options for new entries ─────────────────────────────────────────

const LOG_TYPES: { type: 'call' | 'note' | 'lead_sent'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'call',      label: 'Samtal',    icon: Phone },
  { type: 'note',      label: 'Notering',  icon: MessageCircle },
  { type: 'lead_sent', label: 'Lead',      icon: Send },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgoSv(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just nu';
  if (mins < 60) return `${mins}m sedan`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h sedan`;
  if (hours < 48) return 'Igår';
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d sedan`;
  return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function fullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('sv-SE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function actorBadge(entry: Activity): string | null {
  if (entry.actor_type === 'system') return 'System';
  if (entry.actor_type === 'dealer') return 'Handlare';
  if (entry.actor_type === 'customer') return 'Kund';
  if (entry.created_by_name) return entry.created_by_name;
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadTimeline({
  leadType,
  leadId,
  adminUserId,
  adminName,
  inline = false,
  onClose,
}: LeadTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [logType, setLogType] = useState<'call' | 'note' | 'lead_sent'>('note');
  const [logBody, setLogBody] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

  const activityTable = leadType === 'car' ? 'car_activities' : 'quote_request_activities';
  const reminderTable = leadType === 'car' ? 'car_reminders' : 'quote_request_reminders';
  const idField = leadType === 'car' ? 'car_id' : 'quote_request_id';

  const load = useCallback(async () => {
    setError(null);
    const [activitiesRes, remindersRes] = await Promise.all([
      supabase
        .from(activityTable)
        .select('id, type, title, body, data, source, actor_type, created_by_name, created_at')
        .eq(idField, leadId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from(reminderTable)
        .select('id, remind_at, title, done, done_at, created_by_name, created_at')
        .eq(idField, leadId)
        .eq('done', false)
        .order('remind_at', { ascending: true }),
    ]);

    if (activitiesRes.error) setError('Kunde inte ladda aktiviteter.');
    else setActivities((activitiesRes.data ?? []) as Activity[]);

    if (!remindersRes.error) setReminders((remindersRes.data ?? []) as Reminder[]);
    setLoading(false);
  }, [leadId, activityTable, reminderTable, idField]);

  useEffect(() => {
    setLoading(true);
    void load();

    const channel = supabase
      .channel(`timeline:${activityTable}:${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: activityTable,
          filter: `${idField}=eq.${leadId}`,
        },
        () => { void load(); }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [load, activityTable, idField, leadId]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  async function handleSave() {
    if (saving || !logBody.trim()) return;
    setSaving(true);

    const titleMap: Record<string, string> = {
      call: 'Samtal loggat',
      note: 'Notering',
      lead_sent: 'Lead skickat',
    };

    await supabase.from(activityTable).insert({
      [idField]: leadId,
      type: logType,
      title: titleMap[logType],
      body: logBody.trim(),
      data: {},
      source: 'admin',
      actor_type: 'admin',
      created_by: adminUserId,
      created_by_name: adminName,
    });

    if (reminderDate) {
      await supabase.from(reminderTable).insert({
        [idField]: leadId,
        remind_at: new Date(reminderDate).toISOString(),
        title: titleMap[logType],
        created_by: adminUserId,
        created_by_name: adminName,
      });
    }

    setLogBody('');
    setReminderDate('');
    setSaving(false);
    setShowLogForm(false);
    void load();
  }

  async function markReminderDone(id: string) {
    await supabase
      .from(reminderTable)
      .update({ done: true, done_at: new Date().toISOString() })
      .eq('id', id);
    void load();
  }

  const lastActivity = activities[0] ?? null;
  const nextReminder = reminders[0] ?? null;
  const hasData = !loading && (activities.length > 0 || reminders.length > 0);

  // Group activities by calendar date
  const grouped: { label: string; items: Activity[] }[] = [];
  for (const a of activities) {
    const dayLabel = new Date(a.created_at).toLocaleDateString('sv-SE', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
    const last = grouped[grouped.length - 1];
    if (last && last.label === dayLabel) {
      last.items.push(a);
    } else {
      grouped.push({ label: dayLabel, items: [a] });
    }
  }

  const content = (
    <div className={`flex flex-col ${inline ? 'min-h-0' : 'h-full'} bg-white`}>
      {/* Header */}
      {!inline && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">Tidslinje</span>
            {activities.length > 0 && (
              <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-xl">
                {activities.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLogForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Logga
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats strip */}
      <div className="flex items-center gap-4 px-5 py-2 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 shrink-0 flex-wrap">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span className="font-medium text-slate-600">Senast:</span>
          {lastActivity ? timeAgoSv(lastActivity.created_at) : '—'}
        </span>
        <span className="flex items-center gap-1.5">
          <Gavel className="w-3 h-3" />
          <span className="font-medium text-slate-600">Händelser:</span>
          {activities.length}
        </span>
        {nextReminder && (
          <span className="flex items-center gap-1.5 text-amber-600">
            <Bell className="w-3 h-3" />
            <span className="font-medium">Påminnelse:</span>
            {new Date(nextReminder.remind_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Log form — inline if !inline mode, else toggled */}
        {(inline || showLogForm) && (
          <div className="px-5 pt-4 pb-4 border-b border-slate-100 bg-white">
            {inline && (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Ny aktivitet</p>
            )}
            <div className="flex gap-1.5 mb-3">
              {LOG_TYPES.map((lt) => {
                const Icon = lt.icon;
                return (
                  <button
                    key={lt.type}
                    onClick={() => setLogType(lt.type)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      logType === lt.type
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {lt.label}
                  </button>
                );
              })}
            </div>
            <textarea
              rows={3}
              value={logBody}
              onChange={(e) => setLogBody(e.target.value)}
              placeholder={
                logType === 'call' ? 'Vad hände under samtalet?'
                : logType === 'lead_sent' ? 'Vilket lead skickades?'
                : 'Skriv en notering...'
              }
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/20 focus:border-[#0e6efe] resize-none placeholder-slate-300 transition"
            />
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex items-center gap-1.5 flex-1 min-w-0 border border-slate-200 rounded-lg px-2.5 h-8">
                <Bell className="w-3 h-3 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="flex-1 min-w-0 text-xs text-slate-600 bg-transparent focus:outline-none"
                  title="Skapa påminnelse"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !logBody.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold transition"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Logga
              </button>
            </div>
          </div>
        )}

        {/* Open reminders */}
        {reminders.length > 0 && (
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Öppna påminnelser ({reminders.length})
            </p>
            <ul className="space-y-2">
              {reminders.map((r) => {
                const overdue = new Date(r.remind_at).getTime() < Date.now();
                return (
                  <li key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${
                    overdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                  }`}>
                    <Bell className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${overdue ? 'text-red-500' : 'text-amber-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold truncate ${overdue ? 'text-red-800' : 'text-amber-900'}`}>
                        {r.title}
                      </div>
                      <div className={`mt-0.5 ${overdue ? 'text-red-600 font-semibold' : 'text-amber-700'}`}>
                        {new Date(r.remind_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {overdue && ' · Förfallen'}
                      </div>
                    </div>
                    <button
                      onClick={() => markReminderDone(r.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
                        overdue ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5" />
                      Klar
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Timeline */}
        <div className="px-5 py-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
          ) : !hasData ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-300">
              <Clock className="w-10 h-10" />
              <p className="text-sm font-medium text-slate-400">Ingen historik ännu</p>
              <p className="text-xs text-slate-300">Aktiviteter loggas automatiskt</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.label}>
                  {/* Day label */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  {/* Events */}
                  <ol className="space-y-1">
                    {group.items.map((activity, idx) => {
                      const cfg = getCfg(activity.type);
                      const Icon = cfg.icon;
                      const isExpanded = expanded.has(activity.id);
                      const hasDetail = !!activity.body || (activity.data && Object.keys(activity.data).length > 0);
                      const isLast = idx === group.items.length - 1;
                      const badge = actorBadge(activity);

                      return (
                        <li key={activity.id} className="relative flex gap-3.5">
                          {/* Vertical connector */}
                          <div className="flex flex-col items-center shrink-0 w-6">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${cfg.color}`}>
                              <Icon className="w-3 h-3" strokeWidth={2.5} />
                            </div>
                            {!isLast && (
                              <div className="w-px flex-1 bg-slate-100 mt-1 mb-1" />
                            )}
                          </div>

                          {/* Content */}
                          <div className={`flex-1 min-w-0 pb-3 ${isLast ? '' : ''}`}>
                            <button
                              type="button"
                              onClick={() => hasDetail && toggleExpand(activity.id)}
                              className={`w-full text-left group rounded-xl px-3 py-2.5 transition-colors ${
                                hasDetail ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className="text-[13px] font-semibold text-slate-800 leading-snug">
                                    {activity.title}
                                  </span>
                                  {badge && (
                                    <span className="ml-2 text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-xl">
                                      {badge}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[11px] text-slate-400" title={fullDate(activity.created_at)}>
                                    {new Date(activity.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {hasDetail && (
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  )}
                                </div>
                              </div>

                              {isExpanded && activity.body && (
                                <p className="mt-1.5 text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">
                                  {activity.body}
                                </p>
                              )}

                              {isExpanded && activity.data && Object.keys(activity.data).length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {Object.entries(activity.data)
                                    .filter(([, v]) => v !== null && v !== undefined && v !== '')
                                    .slice(0, 6)
                                    .map(([k, v]) => (
                                      <span key={k} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-xl font-medium">
                                        {k}: {String(v)}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (inline) {
    return <div className="rounded-xl border border-slate-200 overflow-hidden">{content}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden ring-1 ring-slate-200">
      {content}
    </div>
  );
}
