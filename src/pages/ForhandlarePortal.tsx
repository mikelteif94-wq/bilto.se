import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Star, MessageSquare, Settings, LogOut, TrendingUp, Calendar, Users, Award, ChevronRight, Loader2, User, MapPin, Globe, Briefcase, CreditCard as Edit3, Check, X, Linkedin, Phone, Mail, Clock, Inbox, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ForhandlareBookingTimeline } from '../components/BookingTimeline';

interface ForhandlareProfil {
  id: string;
  fornamn: string;
  efternamn: string;
  mejl: string;
  telefon: string;
  stad: string;
  erfarenhet_ar: number;
  specialiteter: string[];
  sprak: string[];
  linkedin_url: string;
  bio: string;
  avatar_url: string;
  slug: string;
  rating_avg: number;
  rating_count: number;
  affarer_avslutade: number;
  godkand: boolean;
}

interface Props {
  userId: string;
  onLoggedOut: () => void;
}

type Tab = 'dashboard' | 'bokningar' | 'profil' | 'installningar';

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
}

export default function ForhandlarePortal({ userId, onLoggedOut }: Props) {
  const [profil, setProfil] = useState<ForhandlareProfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('forhandlare')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      setProfil(data as ForhandlareProfil | null);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Award className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-[20px] font-bold text-slate-900 mb-2">Din profil är under granskning</h1>
          <p className="text-slate-500 text-[14px] leading-relaxed mb-6">
            Din ansökan har tagits emot. Vi granskar dina uppgifter och hör av oss inom 48 timmar.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); onLoggedOut(); }}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-[13px] font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            Logga ut
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        <div className="px-6 py-5 border-b border-slate-100">
          <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-24 w-auto object-contain" />
        </div>

        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0e6efe]/20 to-[#0e6efe]/10 flex items-center justify-center text-[#0e6efe] font-bold text-[15px] shrink-0">
              {profil.fornamn.charAt(0)}{profil.efternamn.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-slate-900 truncate">{profil.fornamn} {profil.efternamn}</p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[12px] text-slate-500">{profil.rating_avg.toFixed(1)} · {profil.affarer_avslutade} affärer</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {([
            { id: 'dashboard', icon: LayoutDashboard, label: 'Översikt' },
            { id: 'bokningar', icon: Inbox,           label: 'Bokningar' },
            { id: 'profil',    icon: User,            label: 'Min profil' },
            { id: 'installningar', icon: Settings,    label: 'Inställningar' },
          ] as { id: Tab; icon: typeof LayoutDashboard; label: string }[]).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition text-left ${
                activeTab === id
                  ? 'bg-[#0e6efe]/10 text-[#0e6efe]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100">
          <button
            onClick={async () => { await supabase.auth.signOut(); onLoggedOut(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
            Logga ut
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-16 w-auto object-contain" />
          <div className="flex items-center gap-2 ml-auto">
            {([
              { id: 'dashboard', icon: LayoutDashboard },
              { id: 'bokningar', icon: Inbox },
              { id: 'profil',    icon: User },
              { id: 'installningar', icon: Settings },
            ] as { id: Tab; icon: typeof LayoutDashboard }[]).map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition ${
                  activeTab === id ? 'bg-[#0e6efe]/10 text-[#0e6efe]' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
              </button>
            ))}
            <button
              onClick={async () => { await supabase.auth.signOut(); onLoggedOut(); }}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-8">
          {activeTab === 'dashboard' && <Dashboard profil={profil} onGoToBookings={() => setActiveTab('bokningar')} />}
          {activeTab === 'bokningar' && <BokningarTab profil={profil} />}
          {activeTab === 'profil' && <ProfilTab profil={profil} onSaved={setProfil} />}
          {activeTab === 'installningar' && <InstallningarTab profil={profil} onLoggedOut={onLoggedOut} />}
        </main>
      </div>
    </div>
  );
}

function Dashboard({ profil, onGoToBookings }: { profil: ForhandlareProfil; onGoToBookings: () => void }) {
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from('consultation_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('forhandlare_slug', profil.slug)
        .eq('status', 'pending');
      setPendingCount(count ?? 0);
    })();
  }, [profil.slug]);
  const stats = [
    { icon: TrendingUp, label: 'Avslutade affärer',   value: profil.affarer_avslutade, color: 'text-[#0e6efe]',   bg: 'bg-[#0e6efe]/10' },
    { icon: Star,       label: 'Snittbetyg',           value: profil.rating_avg.toFixed(1), color: 'text-amber-600', bg: 'bg-amber-100' },
    { icon: Users,      label: 'Omdömen',              value: profil.rating_count,       color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { icon: Award,      label: 'Erfarenhet (år)',      value: profil.erfarenhet_ar,      color: 'text-violet-600',  bg: 'bg-violet-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[24px] font-bold text-slate-900">Välkommen, {profil.fornamn}!</h1>
        <p className="text-slate-500 text-[14px] mt-1">Här är en översikt av din aktivitet.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-[26px] font-bold text-slate-900 leading-tight">{s.value}</p>
              <p className="text-[12px] text-slate-500 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Profile preview link */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold text-slate-900">Din publika profil</p>
          <p className="text-[13px] text-slate-500 mt-0.5">Synlig för kunder på bilto.se/f/{profil.slug}</p>
        </div>
        <a
          href={`/f/${profil.slug}`}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#0e6efe]/10 text-[#0e6efe] text-[13px] font-medium hover:bg-[#0e6efe]/20 transition"
        >
          Visa profil
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Snabb-info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h3 className="text-[15px] font-semibold text-slate-900">Din information</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
          <div className="flex items-center gap-2 text-slate-600"><MapPin className="w-4 h-4 text-slate-400" />{profil.stad || '—'}</div>
          <div className="flex items-center gap-2 text-slate-600"><Globe className="w-4 h-4 text-slate-400" />{profil.sprak.join(', ') || '—'}</div>
          <div className="flex items-center gap-2 text-slate-600"><Briefcase className="w-4 h-4 text-slate-400" />{profil.erfarenhet_ar} år erfarenhet</div>
          <div className="flex items-center gap-2 text-slate-600"><Calendar className="w-4 h-4 text-slate-400" />{profil.specialiteter.slice(0, 2).join(', ') || '—'}</div>
        </div>
      </div>

      {/* Recent consultations */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-slate-900">Senaste bokningar</h3>
          {pendingCount !== null && pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3" />
              {pendingCount} väntar
            </span>
          )}
        </div>
        {pendingCount === 0 ? (
          <p className="text-[13px] text-slate-400">Inga bokningar ännu. När en kund bokar dig syns det här.</p>
        ) : pendingCount === null ? (
          <div className="flex items-center gap-2 text-[13px] text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Hämtar bokningar...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <MessageSquare className="w-4 h-4" />
            <span>{pendingCount} bokning{pendingCount > 1 ? 'ar' : ''} väntar på dig</span>
          </div>
        )}
        <button
          onClick={onGoToBookings}
          className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-[#0e6efe] hover:underline"
        >
          Gå till bokningar
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const SYFTE_LABELS: Record<string, string> = {
  kop_bil: 'Köpa bil',
  salj_bil: 'Sälja bil',
  inbyte: 'Inbyte',
  ovrig: 'Annat',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:    { label: 'Väntar',    color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  confirmed:  { label: 'Bekräftad', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  completed:  { label: 'Genomförd', color: 'text-emerald-700',bg: 'bg-emerald-50',border: 'border-emerald-200' },
  cancelled:  { label: 'Avbokad',   color: 'text-slate-500',  bg: 'bg-slate-50',  border: 'border-slate-200' },
};

function BokningarTab({ profil }: { profil: ForhandlareProfil }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('consultation_bookings')
      .select('*')
      .eq('forhandlare_slug', profil.slug)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });
    if (!error && data) setBookings(data as Booking[]);
    setLoading(false);
  }, [profil.slug]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await supabase.from('consultation_bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    setUpdatingId(null);
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-slate-900">Bokningar</h1>
        <p className="text-slate-500 text-[14px] mt-1">Kunder som har bokat samtal med dig.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { id: 'all',       label: 'Alla',       count: bookings.length },
          { id: 'pending',   label: 'Väntar',     count: pendingCount },
          { id: 'confirmed', label: 'Bekräftade', count: confirmedCount },
          { id: 'completed', label: 'Genomförda', count: completedCount },
        ] as { id: typeof filter; label: string; count: number }[]).map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`inline-flex items-center gap-2 px-4 h-9 rounded-lg text-[13px] font-medium transition ${
              filter === id
                ? 'bg-[#0e6efe] text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${filter === id ? 'bg-white/20' : 'bg-slate-100'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-[14px] font-semibold text-slate-700">Inga bokningar här</p>
          <p className="text-[13px] text-slate-400 mt-1">
            {filter === 'all' ? 'När en kund bokar dig syns det här.' : `Inga ${filter === 'pending' ? 'väntande' : filter === 'confirmed' ? 'bekräftade' : 'genomförda'} bokningar.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => {
            const sc = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
            const isUpdating = updatingId === booking.id;
            return (
              <div key={booking.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-bold text-slate-900 truncate">{booking.namn}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.color} ${sc.border} border`}>{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-slate-500 flex-wrap">
                      <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{booking.booking_date}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />kl. {booking.booking_time}</span>
                      <span className="inline-flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{SYFTE_LABELS[booking.syfte] ?? booking.syfte}</span>
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div className="grid sm:grid-cols-2 gap-2 mb-3">
                  <a href={`tel:${booking.telefon}`} className="inline-flex items-center gap-2 text-[13px] text-slate-700 hover:text-[#0e6efe] transition">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />{booking.telefon}
                  </a>
                  {booking.email && (
                    <a href={`mailto:${booking.email}`} className="inline-flex items-center gap-2 text-[13px] text-slate-700 hover:text-[#0e6efe] transition truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />{booking.email}
                    </a>
                  )}
                </div>

                {/* Message */}
                {booking.meddelande && (
                  <div className="bg-[#faf8f5] rounded-lg p-3 mb-4">
                    <p className="text-[12px] text-slate-500 font-medium mb-1">Meddelande från kund</p>
                    <p className="text-[13px] text-slate-700 whitespace-pre-wrap">{booking.meddelande}</p>
                  </div>
                )}

                {/* Timeline — förhandlare can add updates, customer sees them */}
                <div className="border-t border-slate-100 pt-4 mt-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Tidslinje</p>
                  <ForhandlareBookingTimeline bookingId={booking.id} slug={profil.slug} />
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap pt-2">
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(booking.id, 'confirmed')}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[12px] font-medium transition disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Bekräfta
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(booking.id, 'completed')}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium transition disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Markera genomförd
                    </button>
                  )}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button
                      onClick={() => updateStatus(booking.id, 'cancelled')}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[12px] font-medium transition disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Avboka
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const SPECIALTY_OPTIONS = [
  'Lyxbilar','Elbilar','Hybrid','Familjebilar','SUV','Transportbilar',
  'Småbilar','Prisförhandling','Finansiering','Inbyte','TCO','Säkerhet',
];
const LANGUAGE_OPTIONS = ['Svenska','Engelska','Tyska','Norska','Danska','Finska','Spanska','Franska'];

function ProfilTab({ profil, onSaved }: { profil: ForhandlareProfil; onSaved: (p: ForhandlareProfil) => void }) {
  const [form, setForm] = useState({ ...profil });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (field: 'specialiteter' | 'sprak', val: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(val)
        ? prev[field].filter((x) => x !== val)
        : [...prev[field], val],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from('forhandlare')
      .update({
        fornamn:      form.fornamn,
        efternamn:    form.efternamn,
        telefon:      form.telefon,
        stad:         form.stad,
        erfarenhet_ar: form.erfarenhet_ar,
        specialiteter: form.specialiteter,
        sprak:         form.sprak,
        linkedin_url:  form.linkedin_url,
        bio:           form.bio,
        updated_at:    new Date().toISOString(),
      })
      .eq('id', profil.id)
      .select()
      .maybeSingle();
    setSaving(false);
    if (!error && data) { onSaved(data as ForhandlareProfil); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-slate-900">Min profil</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[13px] font-semibold transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" />Sparat</> : <><Edit3 className="w-4 h-4" />Spara ändringar</>}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <h3 className="text-[14px] font-semibold text-slate-700 border-b border-slate-100 pb-3">Personuppgifter</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Förnamn" value={form.fornamn} onChange={(v) => setForm((p) => ({ ...p, fornamn: v }))} />
          <FormField label="Efternamn" value={form.efternamn} onChange={(v) => setForm((p) => ({ ...p, efternamn: v }))} />
          <FormField label="Telefon" value={form.telefon} onChange={(v) => setForm((p) => ({ ...p, telefon: v }))} type="tel" />
          <FormField label="Stad" value={form.stad} onChange={(v) => setForm((p) => ({ ...p, stad: v }))} />
          <FormField label="Erfarenhet (år)" value={String(form.erfarenhet_ar)} onChange={(v) => setForm((p) => ({ ...p, erfarenhet_ar: parseInt(v) || 0 }))} type="number" />
          <FormField label="LinkedIn" value={form.linkedin_url} onChange={(v) => setForm((p) => ({ ...p, linkedin_url: v }))} placeholder="https://linkedin.com/in/..." />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Beskrivning</label>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            className="w-full px-3 py-2.5 text-[14px] bg-[#faf8f5] border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-[14px] font-semibold text-slate-700 border-b border-slate-100 pb-3">Specialiteter</h3>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.map((s) => {
            const sel = form.specialiteter.includes(s);
            return (
              <button key={s} type="button" onClick={() => toggle('specialiteter', s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition ${sel ? 'bg-[#0e6efe] text-white border-[#0e6efe]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                {sel && <Check className="w-3 h-3" strokeWidth={2.5} />}{s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-[14px] font-semibold text-slate-700 border-b border-slate-100 pb-3">Språk</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((l) => {
            const sel = form.sprak.includes(l);
            return (
              <button key={l} type="button" onClick={() => toggle('sprak', l)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition ${sel ? 'bg-[#0e6efe] text-white border-[#0e6efe]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                {sel && <Check className="w-3 h-3" strokeWidth={2.5} />}{l}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InstallningarTab({ profil, onLoggedOut }: { profil: ForhandlareProfil; onLoggedOut: () => void }) {
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-[22px] font-bold text-slate-900">Inställningar</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-[14px] font-semibold text-slate-700">Konto</h3>
        <div className="text-[13px] text-slate-600 space-y-1">
          <p><span className="text-slate-400">E-post:</span> {profil.mejl}</p>
          <p><span className="text-slate-400">Profil-URL:</span> bilto.se/f/{profil.slug}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
        <h3 className="text-[14px] font-semibold text-slate-700 mb-1">Publika länk</h3>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={`https://bilto.se/f/${profil.slug}`}
            className="flex-1 px-3 py-2 text-[13px] bg-[#faf8f5] border border-slate-200 rounded-lg text-slate-600"
          />
          <button
            onClick={() => navigator.clipboard.writeText(`https://bilto.se/f/${profil.slug}`)}
            className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[13px] font-medium transition whitespace-nowrap"
          >
            Kopiera
          </button>
        </div>
        {profil.linkedin_url && (
          <a href={profil.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[13px] text-[#0e6efe] hover:underline">
            <Linkedin className="w-4 h-4" /> LinkedIn-profil
          </a>
        )}
      </div>

      <button
        onClick={async () => { await supabase.auth.signOut(); onLoggedOut(); }}
        className="inline-flex items-center gap-2 text-[13px] text-red-500 hover:text-red-700 font-medium transition"
      >
        <LogOut className="w-4 h-4" />
        Logga ut
      </button>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium text-slate-600 mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 text-[14px] bg-[#faf8f5] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] transition"
      />
    </label>
  );
}
