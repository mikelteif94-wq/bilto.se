import { useEffect, useState } from 'react';
import {
  Send, CheckCircle2, Eye, MessageSquare, XCircle,
  Clock, ChevronDown, Loader2, Users, Bell, Search,
  Mail,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DealerDispatchPanelProps {
  carId?: string;
  quoteRequestId?: string;
  adminUserId: string;
  adminName: string;
  /** Brief description shown in the dispatch message */
  itemLabel: string;
}

interface Dealer {
  id: string;
  foretagsnamn: string;
  kontaktperson: string;
  mejl: string;
  godkand: boolean;
}

interface Dispatch {
  id: string;
  dealer_id: string;
  response_status: string;
  opened_at: string | null;
  read_at: string | null;
  replied_at: string | null;
  offered_at: string | null;
  deadline_at: string | null;
  message: string;
  created_at: string;
  dealers: { foretagsnamn: string; kontaktperson: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  sent: { label: 'Skickad', icon: <Send className="w-3.5 h-3.5" />, cls: 'bg-slate-100 text-slate-600' },
  opened: { label: 'Öppnad', icon: <Eye className="w-3.5 h-3.5" />, cls: 'bg-blue-100 text-blue-600' },
  read: { label: 'Läst', icon: <Eye className="w-3.5 h-3.5" />, cls: 'bg-blue-100 text-blue-700' },
  replied: { label: 'Svarat', icon: <MessageSquare className="w-3.5 h-3.5" />, cls: 'bg-amber-100 text-amber-700' },
  offered: { label: 'Lämnat offert', icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'bg-green-100 text-green-700' },
  ignored: { label: 'Ignorerat', icon: <XCircle className="w-3.5 h-3.5" />, cls: 'bg-red-100 text-red-600' },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function DealerDispatchPanel({
  carId,
  quoteRequestId,
  adminUserId,
  adminName,
  itemLabel,
}: DealerDispatchPanelProps) {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedDealers, setSelectedDealers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [deadlineHours, setDeadlineHours] = useState(24);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);

  async function load() {
    let dispatchQuery = supabase.from('dealer_dispatches').select(`
        id, dealer_id, response_status, opened_at, read_at, replied_at, offered_at,
        deadline_at, message, created_at,
        dealers(foretagsnamn, kontaktperson)
      `).order('created_at', { ascending: false });
    if (carId) dispatchQuery = dispatchQuery.eq('car_id', carId);
    else if (quoteRequestId) dispatchQuery = dispatchQuery.eq('quote_request_id', quoteRequestId);

    const [{ data: allDealers }, { data: existingDispatches }] = await Promise.all([
      supabase.from('dealers').select('id, foretagsnamn, kontaktperson, mejl, godkand').eq('godkand', true).order('foretagsnamn'),
      dispatchQuery,
    ]);

    setDealers(allDealers ?? []);
    setDispatches(existingDispatches ?? []);

    // Default message
    setMessage(`Nytt lead: ${itemLabel}\n\nVänligen svara inom ${deadlineHours} timmar.`);
    setLoading(false);
  }

  useEffect(() => { load(); }, [carId, quoteRequestId]);

  const alreadyDispatched = new Set(dispatches.map((d) => d.dealer_id));
  const available = dealers.filter(
    (d) => !alreadyDispatched.has(d.id) &&
      (!search || d.foretagsnamn.toLowerCase().includes(search.toLowerCase()) ||
        d.kontaktperson.toLowerCase().includes(search.toLowerCase()))
  );

  async function dispatch() {
    if (selectedDealers.size === 0) return;
    setSending(true);
    const deadline = new Date(Date.now() + deadlineHours * 3600000).toISOString();

    const alreadySentIds = new Set(dispatches.map((d) => d.dealer_id));
    const newDealers = [...selectedDealers].filter((id) => !alreadySentIds.has(id));
    if (newDealers.length === 0) { setSending(false); return; }

    const rows = newDealers.map((dealerId) => ({
      car_id: carId ?? null,
      quote_request_id: quoteRequestId ?? null,
      dealer_id: dealerId,
      response_status: 'sent',
      response_deadline_hours: deadlineHours,
      deadline_at: deadline,
      dispatched_by: adminUserId,
      dispatched_by_name: adminName,
      message,
    }));

    const { data: inserted, error: insertErr } = await supabase.from('dealer_dispatches').insert(rows).select('id');
    if (insertErr) {
      console.error('Dispatch insert error:', insertErr);
      setSending(false);
      return;
    }

    // Send emails to dispatched dealers
    if (inserted && inserted.length > 0) {
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-dealer-dispatch`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dispatch_ids: inserted.map((r: { id: string }) => r.id), is_nudge: false }),
        });
      } catch { /* best effort */ }
    }

    // Log activity
    if (carId) {
      await supabase.from('car_activities').insert({
        car_id: carId,
        type: 'dispatch',
        title: `Skickat till ${selectedDealers.size} handlare`,
        body: `Lead skickat till: ${dealers.filter((d) => selectedDealers.has(d.id)).map((d) => d.foretagsnamn).join(', ')}`,
        created_by: adminUserId,
        created_by_name: adminName,
      });
    }

    setSelectedDealers(new Set());
    setSending(false);
    load();
  }

  async function nudgeDealer(dispatchId: string, dealerName: string) {
    const newDeadline = new Date(Date.now() + deadlineHours * 3600000).toISOString();
    await supabase.from('dealer_dispatches').update({
      response_status: 'sent',
      deadline_at: newDeadline,
    }).eq('id', dispatchId);

    // Send reminder email
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-dealer-dispatch`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dispatch_ids: [dispatchId], is_nudge: true }),
      });
    } catch { /* best effort */ }

    if (carId) {
      await supabase.from('car_activities').insert({
        car_id: carId,
        type: 'nudge',
        title: `Påminnelse skickad till ${dealerName}`,
        body: `Ny deadline: ${new Date(newDeadline).toLocaleString('sv-SE')}`,
        created_by: adminUserId,
        created_by_name: adminName,
      });
    }
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const summary = {
    sent: dispatches.filter((d) => d.response_status === 'sent').length,
    opened: dispatches.filter((d) => ['opened', 'read'].includes(d.response_status)).length,
    replied: dispatches.filter((d) => d.response_status === 'replied').length,
    offered: dispatches.filter((d) => d.response_status === 'offered').length,
    ignored: dispatches.filter((d) => d.response_status === 'ignored').length,
  };

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      {dispatches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary).filter(([, v]) => v > 0).map(([key, count]) => {
            const cfg = STATUS_CONFIG[key];
            return (
              <span key={key} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
                {cfg.icon} {count} {cfg.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Existing dispatches */}
      {dispatches.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              {dispatches.length} handlare kontaktade
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {expanded && (
            <div className="divide-y divide-slate-100">
              {dispatches.map((d) => {
                const dealer = Array.isArray(d.dealers) ? d.dealers[0] : d.dealers;
                const cfg = STATUS_CONFIG[d.response_status] ?? STATUS_CONFIG.sent;
                const isOverdue = d.deadline_at && new Date(d.deadline_at) < new Date() && !['replied', 'offered'].includes(d.response_status);
                return (
                  <div key={d.id} className={`px-4 py-3 flex items-center gap-3 ${isOverdue ? 'bg-red-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800">
                        {dealer?.foretagsnamn ?? '—'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {dealer?.kontaktperson} · {timeAgo(d.created_at)} sedan
                        {isOverdue && <span className="ml-2 text-red-600 font-medium">Förfallen</span>}
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {!['replied', 'offered'].includes(d.response_status) && (
                      <button
                        onClick={() => nudgeDealer(d.id, dealer?.foretagsnamn ?? '')}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition"
                        title="Skicka påminnelse"
                      >
                        <Bell className="w-3 h-3" />
                        Påminn
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Send to new dealers */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Send className="w-4 h-4 text-slate-400" />
            Skicka till handlare
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Dealer search + selection */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök handlare..."
              className="w-full pl-8 pr-3 h-8 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            {available.length === 0 && (
              <p className="text-xs text-slate-400 py-2 text-center">
                {dealers.length === 0 ? 'Inga godkända handlare' : 'Alla handlare redan kontaktade'}
              </p>
            )}
            {available.map((d) => (
              <label key={d.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDealers.has(d.id)}
                  onChange={() => {
                    const next = new Set(selectedDealers);
                    if (next.has(d.id)) next.delete(d.id); else next.add(d.id);
                    setSelectedDealers(next);
                  }}
                  className="rounded border-slate-300"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{d.foretagsnamn}</div>
                  <div className="text-xs text-slate-400 truncate">{d.kontaktperson}</div>
                </div>
              </label>
            ))}
          </div>

          {available.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedDealers(new Set(available.map((d) => d.id)))}
                className="text-xs text-slate-500 hover:text-slate-800 transition"
              >
                Välj alla ({available.length})
              </button>
              {selectedDealers.size > 0 && (
                <button
                  onClick={() => setSelectedDealers(new Set())}
                  className="text-xs text-red-500 hover:text-red-700 transition"
                >
                  Rensa
                </button>
              )}
            </div>
          )}

          {/* Message */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Meddelande till handlarna..."
          />

          {/* Deadline */}
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500">Svarstid:</span>
            <select
              value={deadlineHours}
              onChange={(e) => setDeadlineHours(Number(e.target.value))}
              className="text-xs border border-slate-200 rounded-lg px-2 h-7 focus:outline-none"
            >
              <option value={6}>6 timmar</option>
              <option value={12}>12 timmar</option>
              <option value={24}>24 timmar</option>
              <option value={48}>48 timmar</option>
              <option value={72}>72 timmar</option>
            </select>
          </div>

          <button
            onClick={dispatch}
            disabled={selectedDealers.size === 0 || sending}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-slate-900 text-white text-sm font-medium disabled:opacity-40 hover:bg-slate-700 transition"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Skickar...' : `Skicka till ${selectedDealers.size || '...'} handlare`}
          </button>
        </div>
      </div>
    </div>
  );
}
