import { useEffect, useState } from 'react';
import {
  Loader2,
  Phone,
  StickyNote,
  Bell,
  Send,
  Flame,
  HelpCircle,
  Clock,
  Frown,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Check,
  CircleUser as UserCircle2,
  X,
  Gavel,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Activity = Database['public']['Tables']['car_activities']['Row'];
type Reminder = Database['public']['Tables']['car_reminders']['Row'];
type Dealer = Database['public']['Tables']['dealers']['Row'];
type ValuationRequest = Database['public']['Tables']['valuation_requests']['Row'];
type AdminUser = Database['public']['Tables']['admin_users']['Row'];

interface CrmPanelProps {
  carId: string;
  customerName: string;
  adminUserId: string | null;
  adminName: string;
  carStatus: string;
  carNotes: string;
  onCarUpdated?: (changes: { status?: string; notes?: string }) => void;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ny', label: 'Ny' },
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'sald', label: 'Såld' },
  { value: 'avslutad', label: 'Avslutad' },
];

const CRM_STATUSES: {
  value: string;
  label: string;
  icon: typeof Flame;
  activeCls: string;
  iconCls: string;
}[] = [
  { value: 'het', label: 'Het kund', icon: Flame, activeCls: 'bg-red-600 text-white ring-red-600 shadow-sm shadow-red-200', iconCls: 'text-red-600' },
  { value: 'ringa_upp', label: 'Ska ringa upp', icon: Phone, activeCls: 'bg-blue-600 text-white ring-blue-600 shadow-sm shadow-blue-200', iconCls: 'text-blue-600' },
  { value: 'fundera', label: 'Vill fundera', icon: HelpCircle, activeCls: 'bg-amber-500 text-white ring-amber-500 shadow-sm shadow-amber-200', iconCls: 'text-amber-500' },
  { value: 'aterkomma', label: 'Ska återkomma', icon: Clock, activeCls: 'bg-slate-700 text-white ring-slate-700 shadow-sm shadow-slate-200', iconCls: 'text-slate-600' },
  { value: 'missnoejd_bud', label: 'Missnöjd med bud', icon: Frown, activeCls: 'bg-orange-600 text-white ring-orange-600 shadow-sm shadow-orange-200', iconCls: 'text-orange-600' },
  { value: 'hitta_bil_forst', label: 'Vill hitta bil först', icon: Search, activeCls: 'bg-teal-600 text-white ring-teal-600 shadow-sm shadow-teal-200', iconCls: 'text-teal-600' },
  { value: 'sald', label: 'Såld', icon: CheckCircle2, activeCls: 'bg-green-600 text-white ring-green-600 shadow-sm shadow-green-200', iconCls: 'text-green-600' },
  { value: 'forlorad', label: 'Förlorad', icon: XCircle, activeCls: 'bg-slate-900 text-white ring-slate-900 shadow-sm shadow-slate-300', iconCls: 'text-slate-500' },
];

const ACTIVITY_META: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  note: { label: 'Anteckning', icon: StickyNote, color: 'text-slate-500' },
  call: { label: 'Samtal', icon: Phone, color: 'text-blue-600' },
  bid: { label: 'Bud', icon: Gavel, color: 'text-green-600' },
  status_change: { label: 'Status ändrad', icon: Check, color: 'text-slate-500' },
  lead_sent: { label: 'Skickat till handlare', icon: Send, color: 'text-blue-600' },
  reminder: { label: 'Påminnelse', icon: Bell, color: 'text-amber-600' },
  valuation_request: { label: 'Värderingsförfrågan', icon: Sparkles, color: 'text-amber-600' },
  valuation_response: { label: 'Värdering svar', icon: Sparkles, color: 'text-green-600' },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatRelative(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(mins / 60);
  const days = Math.round(hours / 24);
  const future = ms >= 0;
  if (mins < 60) return future ? `om ${mins} min` : `${mins} min sedan`;
  if (hours < 48) return future ? `om ${hours} h` : `${hours} h sedan`;
  return future ? `om ${days} dagar` : `${days} dagar sedan`;
}

function parseInt0(s: string): number {
  return parseInt(s.replace(/\s/g, ''), 10) || 0;
}

export default function CrmPanel({ carId, customerName, adminUserId, adminName, carStatus, carNotes, onCarUpdated }: CrmPanelProps) {
  const [status, setStatus] = useState(carStatus);
  const [notes, setNotes] = useState(carNotes);
  const [savingMgmt, setSavingMgmt] = useState(false);
  const [savedMgmt, setSavedMgmt] = useState(false);

  useEffect(() => { setStatus(carStatus); }, [carStatus]);
  useEffect(() => { setNotes(carNotes); }, [carNotes]);

  const dirtyMgmt = status !== carStatus || (notes ?? '') !== (carNotes ?? '');

  const saveManagement = async () => {
    if (savingMgmt || !dirtyMgmt) return;
    setSavingMgmt(true);
    setSavedMgmt(false);
    const wasAktiv = carStatus === 'aktiv';
    const becomingAktiv = status === 'aktiv' && !wasAktiv;

    const updates: { status: string; notes: string; auktion_slut?: string } = { status, notes };
    if (becomingAktiv) {
      updates.auktion_slut = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    }

    await supabase.from('cars').update(updates).eq('id', carId);

    if (status !== carStatus) {
      await supabase.from('car_activities').insert({
        car_id: carId,
        type: 'status_change',
        title: `Hantering: ${STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status}`,
        body: carStatus ? `Tidigare: ${STATUS_OPTIONS.find((o) => o.value === carStatus)?.label ?? carStatus}` : '',
        data: { scope: 'car_status', from: carStatus, to: status },
        created_by: adminUserId,
        created_by_name: adminName,
      });
    }

    onCarUpdated?.({ status, notes });

    if (becomingAktiv) {
      void fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-dealers-new-car`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ car_id: carId }),
        },
      ).catch(() => undefined);
    }

    setSavingMgmt(false);
    setSavedMgmt(true);
    setTimeout(() => setSavedMgmt(false), 2500);
    void load();
  };

  const [crmStatus, setCrmStatus] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState<string>('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [valuations, setValuations] = useState<ValuationRequest[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Activity form
  const [activityType, setActivityType] = useState<'note' | 'call' | 'bid'>('note');
  const [noteBody, setNoteBody] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bidExpectedSale, setBidExpectedSale] = useState('');
  const [bidSource, setBidSource] = useState('');
  const [bidKommentar, setBidKommentar] = useState('');
  const [callOutcome, setCallOutcome] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Reminder form
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [submittingReminder, setSubmittingReminder] = useState(false);

  // Dealer picker
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [dealerPickerOpen, setDealerPickerOpen] = useState(false);
  const [selectedDealerIds, setSelectedDealerIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  // Lost reason modal
  const [lostReasonOpen, setLostReasonOpen] = useState(false);
  const [pendingLostReason, setPendingLostReason] = useState('');

  // Valuation request
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [valuationOpen, setValuationOpen] = useState(false);
  const [valuationToUserId, setValuationToUserId] = useState<string>('');
  const [valuationMessage, setValuationMessage] = useState('');
  const [submittingValuation, setSubmittingValuation] = useState(false);

  // Valuation response
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseValue, setResponseValue] = useState('');
  const [responseExpectedSale, setResponseExpectedSale] = useState('');
  const [responseComment, setResponseComment] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    void load(true);
  }, [carId]);

  useEffect(() => {
    void loadAdminsAndDealers();
  }, []);

  const loadAdminsAndDealers = async () => {
    const [adminsRes, dealersRes] = await Promise.all([
      supabase.from('admin_users').select('*').order('name'),
      supabase.from('dealers').select('*').eq('godkand', true).order('foretagsnamn'),
    ]);
    setAdmins((adminsRes.data ?? []) as AdminUser[]);
    setDealers((dealersRes.data ?? []) as Dealer[]);
  };

  const load = async (withSpinner = false) => {
    if (withSpinner) setInitialLoading(true);
    const [carRes, activitiesRes, remindersRes, valRes] = await Promise.all([
      supabase.from('cars').select('crm_status, crm_lost_reason').eq('id', carId).maybeSingle(),
      supabase
        .from('car_activities')
        .select('*')
        .eq('car_id', carId)
        .order('created_at', { ascending: false }),
      supabase
        .from('car_reminders')
        .select('*')
        .eq('car_id', carId)
        .order('remind_at', { ascending: true }),
      supabase
        .from('valuation_requests')
        .select('*')
        .eq('car_id', carId)
        .order('created_at', { ascending: false }),
    ]);

    if (carRes.data) {
      setCrmStatus(carRes.data.crm_status);
      setLostReason(carRes.data.crm_lost_reason ?? '');
    }
    setActivities((activitiesRes.data ?? []) as Activity[]);
    setReminders((remindersRes.data ?? []) as Reminder[]);
    setValuations((valRes.data ?? []) as ValuationRequest[]);
    if (withSpinner) setInitialLoading(false);
  };

  const applyCrmStatus = async (next: string, reason?: string) => {
    const prev = crmStatus;
    setCrmStatus(next);
    if (next === 'forlorad') setLostReason(reason ?? '');

    await supabase
      .from('cars')
      .update({
        crm_status: next || null,
        crm_status_updated_at: new Date().toISOString(),
        crm_lost_reason: next === 'forlorad' ? reason ?? null : null,
      })
      .eq('id', carId);

    await supabase.from('car_activities').insert({
      car_id: carId,
      type: 'status_change',
      title: next
        ? `Status: ${CRM_STATUSES.find((s) => s.value === next)?.label ?? next}`
        : 'Status rensad',
      body: [
        prev ? `Tidigare: ${CRM_STATUSES.find((s) => s.value === prev)?.label ?? prev}` : '',
        next === 'forlorad' && reason ? `Anledning: ${reason}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      data: { from: prev, to: next, reason: next === 'forlorad' ? reason : undefined },
      created_by: adminUserId,
      created_by_name: adminName,
    });

    void load();
  };

  const onStatusClick = (value: string) => {
    if (value === 'forlorad') {
      setPendingLostReason(lostReason || '');
      setLostReasonOpen(true);
      return;
    }
    void applyCrmStatus(value);
  };

  const confirmLostReason = async () => {
    const reason = pendingLostReason.trim();
    if (!reason) return;
    setLostReasonOpen(false);
    await applyCrmStatus('forlorad', reason);
  };

  const submitActivity = async () => {
    if (submittingActivity) return;
    setSubmittingActivity(true);

    let payload: Database['public']['Tables']['car_activities']['Insert'] | null = null;

    if (activityType === 'note') {
      if (!noteBody.trim()) {
        setSubmittingActivity(false);
        return;
      }
      payload = {
        car_id: carId,
        type: 'note',
        title: 'Anteckning',
        body: noteBody.trim(),
        data: {},
        created_by: adminUserId,
        created_by_name: adminName,
      };
    } else if (activityType === 'call') {
      payload = {
        car_id: carId,
        type: 'call',
        title: callOutcome.trim() || 'Ringde kunden',
        body: noteBody.trim(),
        data: {},
        created_by: adminUserId,
        created_by_name: adminName,
      };
    } else if (activityType === 'bid') {
      const amount = parseInt0(bidAmount);
      const expected = parseInt0(bidExpectedSale);
      if (!amount) {
        setSubmittingActivity(false);
        return;
      }
      payload = {
        car_id: carId,
        type: 'bid',
        title: `Bud ${amount.toLocaleString('sv-SE')} kr${bidSource ? ` · ${bidSource}` : ''}`,
        body: bidKommentar.trim(),
        data: { amount, expected_sale: expected || null, source: bidSource.trim() },
        created_by: adminUserId,
        created_by_name: adminName,
      };
    }

    if (!payload) {
      setSubmittingActivity(false);
      return;
    }

    await supabase.from('car_activities').insert(payload);

    setNoteBody('');
    setBidAmount('');
    setBidExpectedSale('');
    setBidSource('');
    setBidKommentar('');
    setCallOutcome('');
    setSubmittingActivity(false);
    void load();
  };

  const submitReminder = async () => {
    if (submittingReminder || !reminderDate || !reminderTitle.trim()) return;
    setSubmittingReminder(true);
    await supabase.from('car_reminders').insert({
      car_id: carId,
      remind_at: new Date(reminderDate).toISOString(),
      title: reminderTitle.trim(),
      created_by: adminUserId,
      created_by_name: adminName,
    });
    setReminderDate('');
    setReminderTitle('');
    setSubmittingReminder(false);
    void load();
  };

  const toggleReminderDone = async (reminder: Reminder) => {
    await supabase
      .from('car_reminders')
      .update({
        done: !reminder.done,
        done_at: !reminder.done ? new Date().toISOString() : null,
      })
      .eq('id', reminder.id);
    void load();
  };

  const deleteReminder = async (id: string) => {
    await supabase.from('car_reminders').delete().eq('id', id);
    void load();
  };

  const deleteActivity = async (id: string) => {
    await supabase.from('car_activities').delete().eq('id', id);
    void load();
  };

  const openDealerPicker = () => {
    setSelectedDealerIds(new Set(dealers.map((d) => d.id)));
    setDealerPickerOpen(true);
  };

  const toggleDealer = (id: string) => {
    const next = new Set(selectedDealerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDealerIds(next);
  };

  const handleSendToDealers = async () => {
    if (sending || selectedDealerIds.size === 0) return;
    setSending(true);
    setSendResult(null);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-dealers-new-car`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            car_id: carId,
            dealer_ids: Array.from(selectedDealerIds),
          }),
        },
      );
      const json = await resp.json().catch(() => ({}));
      if (json?.skipped) {
        setSendResult('Bilen måste ha status "Aktiv" för att mejlas ut.');
      } else if (json?.ok) {
        const names = dealers
          .filter((d) => selectedDealerIds.has(d.id))
          .map((d) => d.foretagsnamn)
          .slice(0, 5)
          .join(', ');
        setSendResult(
          `Skickat till ${json.sent ?? 0} handlare${json.failed ? ` (${json.failed} misslyckades)` : ''}.`,
        );
        await supabase.from('car_activities').insert({
          car_id: carId,
          type: 'lead_sent',
          title: `Leads skickade till ${json.sent ?? 0} handlare`,
          body: names,
          data: {
            sent: json.sent,
            failed: json.failed,
            total: json.total,
            dealer_ids: Array.from(selectedDealerIds),
          },
          created_by: adminUserId,
          created_by_name: adminName,
        });
        setDealerPickerOpen(false);
        void load();
      } else {
        setSendResult('Kunde inte skicka. Försök igen.');
      }
    } catch {
      setSendResult('Kunde inte skicka. Försök igen.');
    } finally {
      setSending(false);
      setTimeout(() => setSendResult(null), 6000);
    }
  };

  const submitValuationRequest = async () => {
    if (submittingValuation || !valuationToUserId) return;
    setSubmittingValuation(true);
    const toAdmin = admins.find((a) => a.id === valuationToUserId);
    const toName = toAdmin?.name ?? '';

    const { data: inserted } = await supabase
      .from('valuation_requests')
      .insert({
        car_id: carId,
        from_user_id: adminUserId,
        from_user_name: adminName,
        to_user_id: valuationToUserId,
        to_user_name: toName,
        message: valuationMessage.trim(),
        status: 'open',
      })
      .select('id')
      .maybeSingle();

    if (inserted?.id) {
      void fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-valuation-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ valuation_request_id: inserted.id }),
        },
      ).catch(() => undefined);
    }

    await supabase.from('car_activities').insert({
      car_id: carId,
      type: 'valuation_request',
      title: `Värderingsförfrågan till ${toName}`,
      body: valuationMessage.trim(),
      data: { to_user_id: valuationToUserId, to_user_name: toName },
      created_by: adminUserId,
      created_by_name: adminName,
    });

    setValuationMessage('');
    setValuationToUserId('');
    setValuationOpen(false);
    setSubmittingValuation(false);
    void load();
  };

  const startResponse = (v: ValuationRequest) => {
    setRespondingId(v.id);
    setResponseValue(v.response_value ? String(v.response_value) : '');
    setResponseExpectedSale(v.response_expected_sale ? String(v.response_expected_sale) : '');
    setResponseComment(v.response_comment ?? '');
  };

  const submitValuationResponse = async () => {
    if (submittingResponse || !respondingId) return;
    const value = parseInt0(responseValue);
    const expected = parseInt0(responseExpectedSale);
    if (!value) return;
    setSubmittingResponse(true);

    await supabase
      .from('valuation_requests')
      .update({
        status: 'answered',
        response_value: value,
        response_expected_sale: expected || null,
        response_comment: responseComment.trim(),
        responded_at: new Date().toISOString(),
      })
      .eq('id', respondingId);

    await supabase.from('car_activities').insert({
      car_id: carId,
      type: 'valuation_response',
      title: `Värdering: ${value.toLocaleString('sv-SE')} kr${expected ? ` · utpris ${expected.toLocaleString('sv-SE')} kr` : ''}`,
      body: responseComment.trim(),
      data: { value, expected_sale: expected || null, valuation_request_id: respondingId },
      created_by: adminUserId,
      created_by_name: adminName,
    });

    setRespondingId(null);
    setResponseValue('');
    setResponseExpectedSale('');
    setResponseComment('');
    setSubmittingResponse(false);
    void load();
  };

  const cancelValuationRequest = async (id: string) => {
    await supabase
      .from('valuation_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);
    void load();
  };

  if (initialLoading) {
    return (
      <div className="bg-white rounded-md border border-slate-200 p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const openReminders = reminders.filter((r) => !r.done);
  const openValuations = valuations.filter((v) => v.status === 'open');
  const otherAdmins = admins.filter((a) => a.id !== adminUserId);

  return (
    <div className="space-y-6">
      {/* Hantering: operativ status + interna anteckningar */}
      <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Hantering</h2>

        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-2 mb-5">
          {STATUS_OPTIONS.map((o) => {
            const active = status === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setStatus(o.value)}
                className={`px-4 h-9 rounded-full text-sm font-semibold ring-1 transition ${
                  active
                    ? 'bg-slate-900 text-white ring-slate-900'
                    : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Interna anteckningar
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Anteckningar syns bara för admin..."
          className="form-control"
        />

        <button
          onClick={saveManagement}
          disabled={savingMgmt || !dirtyMgmt}
          className="mt-4 w-full sm:w-auto h-11 px-6 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-full transition inline-flex items-center justify-center gap-2"
        >
          {savingMgmt && <Loader2 className="w-4 h-4 animate-spin" />}
          {savedMgmt && !savingMgmt && <Check className="w-4 h-4" />}
          {savingMgmt ? 'Sparar...' : savedMgmt ? 'Sparat' : 'Spara ändringar'}
        </button>
      </div>

      {/* CRM-status pipeline */}
      <div className="bg-white rounded-md border border-slate-200 p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">CRM-status</h2>
          {crmStatus && (
            <button
              onClick={() => void applyCrmStatus('')}
              className="text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Rensa
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CRM_STATUSES.map((s) => {
            const Icon = s.icon;
            const active = crmStatus === s.value;
            return (
              <button
                key={s.value}
                onClick={() => onStatusClick(s.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ring-1 transition text-left ${
                  active
                    ? s.activeCls + ' ring-2'
                    : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? '' : s.iconCls}`} />
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
        {crmStatus === 'forlorad' && lostReason && (
          <div className="mt-4 flex items-start gap-2 text-sm bg-slate-50 border border-slate-200 rounded-lg p-3">
            <XCircle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Anledning
              </div>
              <div className="text-slate-900">{lostReason}</div>
            </div>
          </div>
        )}
      </div>

      {/* Öppna värderingsförfrågningar */}
      {openValuations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-amber-900">Öppna värderingsförfrågningar</h2>
          </div>
          <ul className="space-y-3">
            {openValuations.map((v) => {
              const forMe = v.to_user_id === adminUserId;
              const isResponding = respondingId === v.id;
              return (
                <li key={v.id} className="bg-white rounded-lg border border-amber-200 p-4">
                  <div className="flex items-center gap-2 text-sm flex-wrap mb-2">
                    <span className="font-semibold text-slate-900">{v.from_user_name || 'Admin'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-900">{v.to_user_name || 'Admin'}</span>
                    <span className="text-xs text-slate-400">· {formatDateTime(v.created_at)}</span>
                  </div>
                  {v.message && (
                    <p className="text-sm text-slate-700 whitespace-pre-wrap mb-3">{v.message}</p>
                  )}
                  {forMe && !isResponding && (
                    <button
                      onClick={() => startResponse(v)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Svara med värdering
                    </button>
                  )}
                  {!forMe && !isResponding && (
                    <button
                      onClick={() => cancelValuationRequest(v.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition"
                    >
                      Avbryt förfrågan
                    </button>
                  )}
                  {isResponding && (
                    <div className="mt-2 space-y-2 bg-slate-50 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Värdering (inpris)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={responseValue}
                            onChange={(e) => setResponseValue(e.target.value.replace(/[^\d]/g, ''))}
                            placeholder="kr"
                            className="form-control"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Förväntat utpris
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={responseExpectedSale}
                            onChange={(e) => setResponseExpectedSale(e.target.value.replace(/[^\d]/g, ''))}
                            placeholder="kr"
                            className="form-control"
                          />
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        value={responseComment}
                        onChange={(e) => setResponseComment(e.target.value)}
                        placeholder="Kommentar..."
                        className="form-control"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={submitValuationResponse}
                          disabled={submittingResponse || !responseValue}
                          className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold transition"
                        >
                          {submittingResponse && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Skicka svar
                        </button>
                        <button
                          onClick={() => setRespondingId(null)}
                          className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition"
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Påminnelser */}
      <div className="bg-white rounded-md border border-slate-200 p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Påminnelser
            {openReminders.length > 0 && (
              <span className="ml-2 text-sm font-medium text-amber-600">
                ({openReminders.length} öppna)
              </span>
            )}
          </h2>
        </div>

        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 mb-4">
          <input
            type="datetime-local"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
            className="form-control"
          />
          <input
            type="text"
            placeholder="Vad ska påminnas om?"
            value={reminderTitle}
            onChange={(e) => setReminderTitle(e.target.value)}
            className="form-control"
          />
          <button
            onClick={submitReminder}
            disabled={submittingReminder || !reminderDate || !reminderTitle.trim()}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Lägg till
          </button>
        </div>

        {reminders.length === 0 ? (
          <p className="text-sm text-slate-400">Inga påminnelser ännu.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {reminders.map((r) => {
              const overdue = !r.done && new Date(r.remind_at).getTime() < Date.now();
              return (
                <li key={r.id} className="py-3 flex items-start gap-3">
                  <button
                    onClick={() => toggleReminderDone(r)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
                      r.done
                        ? 'bg-green-500 border-green-500'
                        : 'border-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {r.done && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${r.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {r.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(r.remind_at)}</span>
                      <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                        · {formatRelative(r.remind_at)}
                      </span>
                      {r.created_by_name && <span>· av {r.created_by_name}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReminder(r.id)}
                    className="text-slate-400 hover:text-red-600 transition p-1"
                    aria-label="Ta bort"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Logga aktivitet */}
      <div className="bg-white rounded-md border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Logga aktivitet</h2>

        <div className="flex gap-2 mb-4 border-b border-slate-200">
          {([
            { v: 'note', label: 'Anteckning', icon: StickyNote },
            { v: 'call', label: 'Samtal', icon: Phone },
            { v: 'bid', label: 'Bud', icon: Gavel },
          ] as const).map((t) => {
            const Icon = t.icon;
            const active = activityType === t.v;
            return (
              <button
                key={t.v}
                onClick={() => setActivityType(t.v)}
                className={`inline-flex items-center gap-2 px-3 pb-2 -mb-px text-sm font-medium border-b-2 transition ${
                  active
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {activityType === 'note' && (
          <textarea
            rows={3}
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder={`Skriv en anteckning om ${customerName || 'kunden'}...`}
            className="form-control"
          />
        )}

        {activityType === 'call' && (
          <div className="space-y-2">
            <input
              type="text"
              value={callOutcome}
              onChange={(e) => setCallOutcome(e.target.value)}
              placeholder="Kort utfall (t.ex. 'Svarade ej' eller 'Vill fundera')"
              className="form-control"
            />
            <textarea
              rows={2}
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Anteckning från samtalet..."
              className="form-control"
            />
          </div>
        )}

        {activityType === 'bid' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Bud (inpris)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="kr"
                  className="form-control"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Förväntat utpris
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={bidExpectedSale}
                  onChange={(e) => setBidExpectedSale(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="kr"
                  className="form-control"
                />
              </div>
            </div>
            <input
              type="text"
              value={bidSource}
              onChange={(e) => setBidSource(e.target.value)}
              placeholder="Från (handlare/namn)"
              className="form-control"
            />
            <textarea
              rows={2}
              value={bidKommentar}
              onChange={(e) => setBidKommentar(e.target.value)}
              placeholder="Kommentar (villkor, skick osv.)..."
              className="form-control"
            />
          </div>
        )}

        <button
          onClick={submitActivity}
          disabled={submittingActivity}
          className="mt-3 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold transition"
        >
          {submittingActivity && <Loader2 className="w-4 h-4 animate-spin" />}
          <Plus className="w-4 h-4" />
          Logga
        </button>
      </div>

      {/* Tidslinje */}
      <div className="bg-white rounded-md border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Historik
          {activities.length > 0 && (
            <span className="ml-2 text-sm font-medium text-slate-400">
              ({activities.length})
            </span>
          )}
        </h2>
        {activities.length === 0 ? (
          <p className="text-sm text-slate-400">Inga aktiviteter ännu. Logga den första ovan.</p>
        ) : (
          <ol className="relative border-l border-slate-200 ml-2 space-y-5">
            {activities.map((a) => {
              const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.note;
              const Icon = meta.icon;
              const data = a.data as {
                amount?: number;
                expected_sale?: number | null;
                value?: number;
                source?: string;
              };
              return (
                <li key={a.id} className="pl-6 relative group">
                  <span
                    className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center ${meta.color}`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                  </span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">{a.title}</span>
                    {a.type === 'bid' && data?.expected_sale ? (
                      <span className="text-xs font-medium text-slate-500">
                        utpris {data.expected_sale.toLocaleString('sv-SE')} kr
                      </span>
                    ) : null}
                    <span className="text-xs text-slate-400">{formatDateTime(a.created_at)}</span>
                    <button
                      onClick={() => deleteActivity(a.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-600 transition"
                      aria-label="Ta bort"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {a.body && (
                    <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{a.body}</p>
                  )}
                  {a.created_by_name && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
                      <UserCircle2 className="w-3 h-3" />
                      {a.created_by_name}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Modal: Dealer picker */}
      {dealerPickerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !sending && setDealerPickerOpen(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Välj handlare</h3>
              <button
                onClick={() => !sending && setDealerPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
                aria-label="Stäng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600">
                {selectedDealerIds.size} av {dealers.length} valda
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDealerIds(new Set(dealers.map((d) => d.id)))}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Välj alla
                </button>
                <button
                  onClick={() => setSelectedDealerIds(new Set())}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Avmarkera alla
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {dealers.length === 0 ? (
                <p className="text-sm text-slate-400 p-5 text-center">
                  Inga godkända handlare ännu.
                </p>
              ) : (
                <ul>
                  {dealers.map((d) => {
                    const checked = selectedDealerIds.has(d.id);
                    return (
                      <li key={d.id}>
                        <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDealer(d.id)}
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {d.foretagsnamn}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {d.kontaktperson} · {d.mejl}
                            </div>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setDealerPickerOpen(false)}
                disabled={sending}
                className="px-4 h-10 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
              >
                Avbryt
              </button>
              <button
                onClick={handleSendToDealers}
                disabled={sending || selectedDealerIds.size === 0}
                className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-[#0e6efe] hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold transition"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Skicka till {selectedDealerIds.size}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lost reason */}
      {lostReasonOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setLostReasonOpen(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Markera som förlorad</h3>
              <button
                onClick={() => setLostReasonOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
                aria-label="Stäng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Anledning
              </label>
              <textarea
                rows={4}
                value={pendingLostReason}
                onChange={(e) => setPendingLostReason(e.target.value)}
                autoFocus
                placeholder="Varför gick affären förlorad? (t.ex. 'Kunden fick högre bud hos konkurrent', 'Säljer själv')"
                className="form-control"
              />
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setLostReasonOpen(false)}
                className="px-4 h-10 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
              >
                Avbryt
              </button>
              <button
                onClick={confirmLostReason}
                disabled={!pendingLostReason.trim()}
                className="px-5 h-10 rounded-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold transition"
              >
                Markera förlorad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Valuation request */}
      {valuationOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !submittingValuation && setValuationOpen(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Be kollega värdera</h3>
              <button
                onClick={() => setValuationOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
                aria-label="Stäng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Till
                </label>
                {otherAdmins.length === 0 ? (
                  <p className="text-sm text-slate-400">Ingen annan admin finns att fråga.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {otherAdmins.map((a) => {
                      const active = valuationToUserId === a.id;
                      return (
                        <button
                          key={a.id}
                          onClick={() => setValuationToUserId(a.id)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ring-1 transition ${
                            active
                              ? 'bg-amber-500 text-white ring-amber-500'
                              : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <UserCircle2 className="w-4 h-4" />
                          {a.name || a.email}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Meddelande (valfritt)
                </label>
                <textarea
                  rows={4}
                  value={valuationMessage}
                  onChange={(e) => setValuationMessage(e.target.value)}
                  placeholder="T.ex. 'Osäker på skicket — kan du titta och ge en uppskattning?'"
                  className="form-control"
                />
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setValuationOpen(false)}
                disabled={submittingValuation}
                className="px-4 h-10 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
              >
                Avbryt
              </button>
              <button
                onClick={submitValuationRequest}
                disabled={submittingValuation || !valuationToUserId}
                className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white text-sm font-semibold transition"
              >
                {submittingValuation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Skicka förfrågan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
