import { useEffect, useState, useCallback } from 'react';
import {
  Phone,
  MessageCircle,
  Hammer,
  RefreshCw,
  Send,
  Bell,
  Clock,
  Plus,
  Check,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface CrmActivityPanelProps {
  carId: string;
  adminUserId: string;
  adminName: string;
  onClose?: () => void;
}

type ActivityType = 'note' | 'call' | 'bid' | 'status_change' | 'lead_sent' | 'reminder';

interface Activity {
  id: string;
  car_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

interface Reminder {
  id: string;
  car_id: string;
  remind_at: string;
  title: string;
  done: boolean;
  done_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  call:          { icon: Phone,         color: 'bg-green-100 text-green-700',     label: 'Samtal' },
  note:          { icon: MessageCircle, color: 'bg-blue-100 text-blue-700',       label: 'Notering' },
  bid:           { icon: Hammer,        color: 'bg-emerald-100 text-emerald-700', label: 'Bud' },
  status_change: { icon: RefreshCw,     color: 'bg-slate-100 text-slate-600',     label: 'Status' },
  lead_sent:     { icon: Send,          color: 'bg-orange-100 text-orange-700',   label: 'Lead skickat' },
  reminder:      { icon: Bell,          color: 'bg-amber-100 text-amber-700',     label: 'Påminnelse' },
};

const LOG_TYPES: { type: 'call' | 'note' | 'lead_sent'; emoji: string; label: string }[] = [
  { type: 'call',      emoji: '📞', label: 'Samtal' },
  { type: 'note',      emoji: '📝', label: 'Notering' },
  { type: 'lead_sent', emoji: '🚀', label: 'Lead skickat' },
];

function timeAgoSv(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m sedan`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h sedan`;
  if (hours < 48) return 'igår';
  const days = Math.floor(hours / 24);
  return `${days}d sedan`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'numeric' });
}

function getActivityConfig(type: string) {
  return ACTIVITY_CONFIG[type as ActivityType] ?? ACTIVITY_CONFIG.note;
}

export default function CrmActivityPanel({
  carId,
  adminUserId,
  adminName,
  onClose,
}: CrmActivityPanelProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Log form
  const [logType, setLogType] = useState<'call' | 'note' | 'lead_sent'>('note');
  const [logBody, setLogBody] = useState('');
  const [nextStepDate, setNextStepDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [activitiesRes, remindersRes] = await Promise.all([
      supabase
        .from('car_activities')
        .select('*')
        .eq('car_id', carId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('car_reminders')
        .select('*')
        .eq('car_id', carId)
        .eq('done', false)
        .order('remind_at', { ascending: true }),
    ]);

    if (activitiesRes.error) {
      setError('Kunde inte ladda aktiviteter.');
    } else {
      setActivities((activitiesRes.data ?? []) as Activity[]);
    }
    if (!remindersRes.error) {
      setReminders((remindersRes.data ?? []) as Reminder[]);
    }
    setLoading(false);
  }, [carId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function handleSave() {
    if (saving || !logBody.trim()) return;
    setSaving(true);

    const config = getActivityConfig(logType);
    const titleMap: Record<string, string> = {
      call: 'Samtal loggat',
      note: 'Notering',
      lead_sent: 'Lead skickat',
    };

    await supabase.from('car_activities').insert({
      car_id: carId,
      type: logType,
      title: titleMap[logType] ?? config.label,
      body: logBody.trim(),
      data: {},
      created_by: adminUserId,
      created_by_name: adminName,
    });

    if (nextStepDate) {
      await supabase.from('car_reminders').insert({
        car_id: carId,
        remind_at: new Date(nextStepDate).toISOString(),
        title: titleMap[logType] ?? 'Påminnelse',
        created_by: adminUserId,
        created_by_name: adminName,
      });
    }

    setLogBody('');
    setNextStepDate('');
    setSaving(false);
    void load();
  }

  async function markReminderDone(reminder: Reminder) {
    await supabase
      .from('car_reminders')
      .update({ done: true, done_at: new Date().toISOString() })
      .eq('id', reminder.id);
    void load();
  }

  // Summary data
  const lastActivity = activities[0] ?? null;
  const nextReminder = reminders[0] ?? null;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-900">CRM-aktiviteter</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Stäng"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 shrink-0 flex-wrap">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span className="font-medium text-slate-700">Senast aktivitet:</span>
          {lastActivity ? timeAgoSv(lastActivity.created_at) : '–'}
        </span>
        {nextReminder && (
          <>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              <span className="font-medium text-slate-700">Nästa påminnelse:</span>
              {formatDate(nextReminder.remind_at)}
            </span>
          </>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Log new activity */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          {/* Type buttons */}
          <div className="flex gap-1.5 mb-3">
            {LOG_TYPES.map((lt) => (
              <button
                key={lt.type}
                onClick={() => setLogType(lt.type)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition border ${
                  logType === lt.type
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{lt.emoji}</span>
                {lt.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            rows={3}
            value={logBody}
            onChange={(e) => setLogBody(e.target.value)}
            placeholder={
              logType === 'call'
                ? 'Vad hände under samtalet?'
                : logType === 'lead_sent'
                ? 'Vilket lead skickades?'
                : 'Skriv en notering...'
            }
            className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent resize-none placeholder-slate-400"
          />

          {/* Next step date + save */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Bell className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={nextStepDate}
                onChange={(e) => setNextStepDate(e.target.value)}
                className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent text-slate-700"
                title="Nästa steg (påminnelse)"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !logBody.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold transition shrink-0"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Logga
            </button>
          </div>
        </div>

        {/* Open reminders */}
        {reminders.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Öppna påminnelser ({reminders.length})
            </p>
            <ul className="space-y-2">
              {reminders.map((r) => {
                const overdue = new Date(r.remind_at).getTime() < Date.now();
                return (
                  <li
                    key={r.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${
                      overdue
                        ? 'bg-red-50 border-red-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <Bell
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        overdue ? 'text-red-500' : 'text-amber-600'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${overdue ? 'text-red-800' : 'text-amber-900'}`}>
                        {r.title}
                      </div>
                      <div className={`mt-0.5 ${overdue ? 'text-red-600 font-semibold' : 'text-amber-700'}`}>
                        {new Date(r.remind_at).toLocaleDateString('sv-SE', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {overdue && ' · Förfallen'}
                      </div>
                    </div>
                    <button
                      onClick={() => markReminderDone(r)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold transition shrink-0 ${
                        overdue
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      Klar
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Activity timeline */}
        <div className="px-4 py-3">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
              <MessageCircle className="w-8 h-8 text-slate-200" />
              <p className="text-sm">Inga aktiviteter ännu</p>
              <p className="text-xs">Logga den första ovan</p>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Historik ({activities.length})
              </p>
              {/* Timeline list */}
              <ol className="relative border-l border-slate-100 ml-2 space-y-4">
                {activities.map((activity) => {
                  const cfg = getActivityConfig(activity.type);
                  const Icon = cfg.icon;
                  return (
                    <li key={activity.id} className="pl-5 relative">
                      {/* Icon dot */}
                      <span
                        className={`absolute -left-[18px] top-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}
                        style={{ width: '1.75rem', height: '1.75rem', left: '-0.875rem' }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>

                      {/* Content */}
                      <div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900 leading-snug">
                            {activity.title}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {timeAgoSv(activity.created_at)}
                          </span>
                        </div>

                        {activity.body && (
                          <p className="mt-0.5 text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">
                            {activity.body}
                          </p>
                        )}

                        {activity.created_by_name && (
                          <p className="mt-1 text-[11px] text-slate-400">
                            {activity.created_by_name}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
