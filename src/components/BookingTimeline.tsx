import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Send, Clock, Phone, Search, Handshake, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface BookingUpdate {
  id: string;
  booking_id: string;
  forhandlare_slug: string;
  status: string;
  message: string;
  created_at: string;
}

type IconType = typeof Phone;

interface StepMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: IconType;
}

export const UPDATE_STEPS: { key: string; label: string; icon: IconType }[] = [
  { key: 'kontaktad',  label: 'Kontaktad',   icon: Phone },
  { key: 'soker_bil',  label: 'Söker bil',   icon: Search },
  { key: 'forhandlar', label: 'Förhandlar',  icon: Handshake },
  { key: 'klar',       label: 'Affär klar',  icon: CheckCircle2 },
  { key: 'avbruten',   label: 'Avbruten',    icon: XCircle },
];

export const STEP_META: Record<string, StepMeta> = {
  kontaktad:  { label: 'Kontaktad',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    icon: Phone },
  soker_bil:  { label: 'Söker bil',  color: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200',     icon: Search },
  forhandlar: { label: 'Förhandlar', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: Handshake },
  klar:       { label: 'Affär klar', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  avbruten:   { label: 'Avbruten',   color: 'text-slate-500',   bg: 'bg-slate-100',  border: 'border-slate-200',   icon: XCircle },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just nu';
  if (mins < 60) return `${mins} min sedan`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} tim sedan`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dagar sedan`;
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

/** Hook to load + subscribe to booking updates */
export function useBookingUpdates(bookingId: string | null) {
  const [updates, setUpdates] = useState<BookingUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!bookingId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('booking_updates' as never)
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true }) as unknown as { data: BookingUpdate[] | null };
    setUpdates((data ?? []) as BookingUpdate[]);
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    load();
    if (!bookingId) return;
    const ch = supabase
      .channel(`booking_updates_${bookingId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'booking_updates', filter: `booking_id=eq.${bookingId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [bookingId, load]);

  return { updates, loading, reload: load };
}

/** Read-only timeline shown to the customer */
export function CustomerBookingTimeline({ bookingId }: { bookingId: string }) {
  const { updates, loading } = useBookingUpdates(bookingId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-[13px] text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Hämtar uppdateringar...
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-[13px] text-slate-400">
        <Clock className="w-4 h-4" />
        Din rådgivare har inte lagt någon uppdatering ännu.
      </div>
    );
  }

  return <TimelineList updates={updates} />;
}

/** Timeline with the ability to add updates — shown to the förhandlare */
export function ForhandlareBookingTimeline({ bookingId, slug }: { bookingId: string; slug: string }) {
  const { updates, loading, reload } = useBookingUpdates(bookingId);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState('kontaktad');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const addUpdate = async () => {
    setSending(true);
    const { error } = await supabase.from('booking_updates' as never).insert({
      booking_id: bookingId,
      forhandlare_slug: slug,
      status,
      message: message.trim(),
    } as never);
    if (!error) {
      setMessage('');
      setShowForm(false);
      reload();
    }
    setSending(false);
  };

  return (
    <div className="space-y-4">
      {/* Existing updates */}
      {loading ? (
        <div className="flex items-center gap-2 py-3 text-[13px] text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Laddar...
        </div>
      ) : updates.length === 0 ? (
        <div className="flex items-center gap-2 py-3 text-[13px] text-slate-400">
          <Clock className="w-4 h-4" />
          Inga uppdateringar ännu. Lägg till den första så kunden ser att du jobbar.
        </div>
      ) : (
        <TimelineList updates={updates} />
      )}

      {/* Add update form */}
      {showForm ? (
        <div className="bg-[#faf8f5] rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {UPDATE_STEPS.map(s => {
              const Icon = s.icon;
              const sel = status === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition ${
                    sel
                      ? 'bg-[#0e6efe] text-white border-[#0e6efe]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Meddelande till kund (valfritt)..."
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[14px] text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/20 focus:border-[#0e6efe] resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setMessage(''); }}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-100 transition"
            >
              Avbryt
            </button>
            <button
              onClick={addUpdate}
              disabled={sending}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[13px] font-semibold transition disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Skicka uppdatering
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[13px] font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Lägg till uppdatering
        </button>
      )}
    </div>
  );
}

function TimelineList({ updates }: { updates: BookingUpdate[] }) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-200" />
      <div className="space-y-4">
        {updates.map((u, idx) => {
          const meta = STEP_META[u.status] ?? STEP_META.kontaktad;
          const Icon = meta.icon;
          const isLast = idx === updates.length - 1;
          return (
            <div key={u.id} className="relative">
              {/* Dot — rounded-xl like the progress tracker */}
              <div
                className={`absolute -left-6 top-0 w-6 h-6 rounded-xl flex items-center justify-center shrink-0 ${
                  isLast
                    ? `${meta.bg} ${meta.color} ring-4 ring-[#0e6efe]/15`
                    : `${meta.bg} ${meta.color}`
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="ml-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-semibold border ${meta.bg} ${meta.color} ${meta.border}`}>
                    {meta.label}
                  </span>
                  <span className="text-[11px] text-slate-400">{timeAgo(u.created_at)}</span>
                </div>
                {u.message && (
                  <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed bg-[#faf8f5] rounded-lg px-3 py-2 border border-slate-100">
                    {u.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
