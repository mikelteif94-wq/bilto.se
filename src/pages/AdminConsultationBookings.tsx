import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Phone, Mail, User, ChevronDown, Check, Search, RefreshCw, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdminNav } from '../hooks/useAdminNav';
import PortalLayout from '../components/PortalLayout';
import { CustomerBookingTimeline } from '../components/BookingTimeline';

interface AdminConsultationBookingsProps {
  onNavigate: (page: import('../hooks/useAdminNav').AdminPage) => void;
}

const SYFTE_LABELS: Record<string, string> = {
  kop_bil: 'Köpa bil',
  salj_bil: 'Sälja bil',
  inbyte: 'Inbyte',
  finansiering: 'Finansiering',
  ovrig: 'Annat',
};

const STATUS_OPTIONS = ['pending', 'contacted', 'done', 'cancelled'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Väntar',
  contacted: 'Kontaktad',
  done: 'Genomförd',
  cancelled: 'Avbokad',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  contacted: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

interface Booking {
  id: string;
  created_at: string;
  booking_date: string;
  booking_time: string;
  syfte: string;
  namn: string;
  telefon: string;
  email: string;
  meddelande: string;
  status: string;
  admin_notes: string;
}

export default function AdminConsultationBookings({ onNavigate }: AdminConsultationBookingsProps) {
  const navItems = useAdminNav({ activePage: 'bokningar', onNavigate });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('consultation_bookings')
      .select('*')
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });
    setBookings(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await supabase.from('consultation_bookings').update({ status }).eq('id', id);
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
    setUpdating(null);
  };

  const filtered = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return b.namn.toLowerCase().includes(q) || b.telefon.includes(q) || b.email.toLowerCase().includes(q);
    }
    return true;
  });

  const dayNames = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter(b => b.booking_date >= today && b.status === 'pending').length;

  return (
    <PortalLayout navItems={navItems} title="Bokningar">
      <div className="space-y-5">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Totalt', value: bookings.length, color: 'text-slate-900' },
            { label: 'Kommande', value: upcoming, color: 'text-amber-600' },
            { label: 'Genomförda', value: bookings.filter(b => b.status === 'done').length, color: 'text-green-600' },
            { label: 'Avbokade', value: bookings.filter(b => b.status === 'cancelled').length, color: 'text-slate-400' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-4 py-3">
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sök namn, telefon, e-post..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0e6efe] transition"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', ...STATUS_OPTIONS].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  statusFilter === s
                    ? 'bg-[#0e6efe] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'Alla' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Uppdatera
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-400 text-sm">
            Laddar bokningar...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-400 text-sm">
            Inga bokningar hittades.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-50">
              {filtered.map(b => (
                <div key={b.id} className="p-3 sm:p-5 hover:bg-[#faf8f5]/50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    {/* Date/time badge – inline on mobile */}
                    <div className="flex items-center gap-3 sm:block shrink-0">
                      <div className="bg-[#0e6efe]/8 rounded-xl px-3 py-2 text-center min-w-[80px]">
                        <p className="text-[10px] font-semibold text-[#0e6efe] uppercase tracking-wide leading-none">
                          {formatDate(b.booking_date)}
                        </p>
                        <p className="text-[15px] font-bold text-[#0e6efe] mt-0.5 leading-none">kl. {b.booking_time}</p>
                      </div>
                      {/* Status changer – shown next to date on mobile */}
                      <div className="relative sm:hidden flex-1">
                        <select
                          value={b.status}
                          onChange={e => updateStatus(b.id, e.target.value)}
                          disabled={updating === b.id}
                          className="w-full appearance-none text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 pr-7 bg-white outline-none cursor-pointer hover:border-slate-300 transition disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-semibold text-slate-900 text-sm">{b.namn}</span>
                        <span className="text-xs px-2 py-0.5 rounded-xl bg-slate-100 text-slate-600">
                          {SYFTE_LABELS[b.syfte] ?? b.syfte}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-xl font-medium ${STATUS_COLORS[b.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {STATUS_LABELS[b.status] ?? b.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {b.telefon}
                        </span>
                        {b.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {b.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3" /> Bokad {new Date(b.created_at).toLocaleDateString('sv-SE')}
                        </span>
                      </div>
                      {b.meddelande && (
                        <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 whitespace-pre-line">
                          {b.meddelande}
                        </div>
                      )}

                      {/* Timeline — admin can see updates posted by förhandlare */}
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <MessageSquare className="w-3 h-3" />
                          Tidslinje
                        </p>
                        <CustomerBookingTimeline bookingId={b.id} />
                      </div>
                    </div>

                    {/* Status changer – desktop only */}
                    <div className="relative shrink-0 hidden sm:block">
                      <select
                        value={b.status}
                        onChange={e => updateStatus(b.id, e.target.value)}
                        disabled={updating === b.id}
                        className="appearance-none text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 pr-7 bg-white outline-none cursor-pointer hover:border-slate-300 transition disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
