import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Check,
  X,
  MessageSquare,
  Calendar,
  MapPin,
  Briefcase,
  Globe,
  Linkedin,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  RefreshCw,
  UserCheck,
  Clock,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AdminPage } from '../hooks/useAdminNav';

interface Application {
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
  status: 'pending' | 'interview' | 'approved' | 'rejected';
  admin_notes: string;
  created_at: string;
}

type StatusFilter = 'all' | 'pending' | 'interview' | 'approved' | 'rejected';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:   { label: 'Inväntar',    color: 'bg-amber-100 text-amber-700',   icon: Clock },
  interview: { label: 'Intervju',    color: 'bg-blue-100 text-blue-700',     icon: MessageSquare },
  approved:  { label: 'Godkänd',     color: 'bg-emerald-100 text-emerald-700', icon: Check },
  rejected:  { label: 'Avvisad',     color: 'bg-red-100 text-red-700',       icon: X },
};

interface Props {
  onNavigate: (page: AdminPage) => void;
  onBack: () => void;
}

export default function AdminForhandlareApplications({ onBack }: Props) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const q = supabase
      .from('forhandlare_applications')
      .select('*')
      .order('created_at', { ascending: false });
    const { data, error } = await q;
    if (!error && data) {
      setApplications(data as Application[]);
      const n: Record<string, string> = {};
      (data as Application[]).forEach((a) => { n[a.id] = a.admin_notes ?? ''; });
      setNotes(n);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: Application['status']) => {
    setSaving(id);
    await supabase
      .from('forhandlare_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setSaving(null);

    if (status === 'approved') {
      const app = applications.find((a) => a.id === id);
      if (app) await createForhandlareProfil(app);
    }
  };

  const saveNotes = async (id: string) => {
    setSaving(id + '_notes');
    await supabase
      .from('forhandlare_applications')
      .update({ admin_notes: notes[id] ?? '', updated_at: new Date().toISOString() })
      .eq('id', id);
    setSaving(null);
  };

  const createForhandlareProfil = async (app: Application) => {
    const slug = `${app.fornamn}-${app.efternamn}`
      .toLowerCase()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    await supabase.from('forhandlare').upsert({
      fornamn: app.fornamn,
      efternamn: app.efternamn,
      mejl: app.mejl,
      telefon: app.telefon,
      stad: app.stad,
      erfarenhet_ar: app.erfarenhet_ar,
      specialiteter: app.specialiteter,
      sprak: app.sprak,
      linkedin_url: app.linkedin_url,
      bio: app.bio,
      slug,
      godkand: true,
    }, { onConflict: 'slug' });
  };

  const filtered = applications.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.fornamn.toLowerCase().includes(q) ||
        a.efternamn.toLowerCase().includes(q) ||
        a.mejl.toLowerCase().includes(q) ||
        a.stad.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-slate-900 leading-tight">Förhandlaransökningar</h1>
          <p className="text-[12px] text-slate-500">{counts.pending} inväntar granskning</p>
        </div>
        <button
          onClick={load}
          className="ml-auto w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stat chips */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'interview', 'approved', 'rejected'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium border transition ${
                statusFilter === s
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s === 'all' ? 'Alla' : STATUS_LABELS[s].label}
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${statusFilter === s ? 'bg-white/20' : 'bg-slate-100'}`}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Sök på namn, e-post eller stad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe]"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Filter className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-[15px]">Inga ansökningar matchade filtret.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => {
              const expanded = expandedId === app.id;
              const status = STATUS_LABELS[app.status];
              const StatusIcon = status.icon;
              const isSaving = saving === app.id;
              return (
                <div key={app.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Row */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : app.id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0e6efe]/20 to-[#0e6efe]/10 flex items-center justify-center text-[#0e6efe] font-bold text-[15px] shrink-0">
                      {app.fornamn.charAt(0)}{app.efternamn.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-slate-900 leading-tight">{app.fornamn} {app.efternamn}</p>
                      <p className="text-[12px] text-slate-500 truncate">{app.mejl} · {app.stad}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium shrink-0 ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <span className="text-[12px] text-slate-400 shrink-0 hidden sm:block">
                      {new Date(app.created_at).toLocaleDateString('sv-SE')}
                    </span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>

                  {/* Expanded detail */}
                  {expanded && (
                    <div className="border-t border-slate-100 px-5 py-5 space-y-5">
                      {/* Meta */}
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <InfoChip icon={MapPin} label="Stad" value={app.stad || '—'} />
                        <InfoChip icon={Briefcase} label="Erfarenhet" value={`${app.erfarenhet_ar} år`} />
                        <InfoChip icon={Globe} label="Språk" value={app.sprak.join(', ') || '—'} />
                        <InfoChip icon={Calendar} label="Ansökt" value={new Date(app.created_at).toLocaleDateString('sv-SE')} />
                      </div>

                      {/* Specialiteter */}
                      {app.specialiteter.length > 0 && (
                        <div>
                          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Specialiteter</p>
                          <div className="flex flex-wrap gap-1.5">
                            {app.specialiteter.map((s) => (
                              <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[12px] rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bio */}
                      {app.bio && (
                        <div>
                          <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Beskrivning</p>
                          <p className="text-[14px] text-slate-700 leading-relaxed">{app.bio}</p>
                        </div>
                      )}

                      {/* LinkedIn */}
                      {app.linkedin_url && (
                        <a
                          href={app.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[13px] text-[#0e6efe] hover:underline"
                        >
                          <Linkedin className="w-4 h-4" />
                          LinkedIn-profil
                        </a>
                      )}

                      {/* Admin notes */}
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Admin-anteckningar
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            rows={2}
                            value={notes[app.id] ?? ''}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                            placeholder="Lägg till interna anteckningar..."
                            className="flex-1 px-3 py-2.5 text-[13px] bg-[#faf8f5] border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe]"
                          />
                          <button
                            onClick={() => saveNotes(app.id)}
                            disabled={saving === app.id + '_notes'}
                            className="h-full px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[13px] font-medium transition disabled:opacity-50"
                          >
                            {saving === app.id + '_notes' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Spara'}
                          </button>
                        </div>
                      </div>

                      {/* Status actions */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {app.status !== 'interview' && (
                          <ActionBtn
                            label="Kalla till intervju"
                            icon={MessageSquare}
                            color="bg-blue-600 hover:bg-blue-700"
                            loading={isSaving}
                            onClick={() => updateStatus(app.id, 'interview')}
                          />
                        )}
                        {app.status !== 'approved' && (
                          <ActionBtn
                            label="Godkänn"
                            icon={UserCheck}
                            color="bg-emerald-600 hover:bg-emerald-700"
                            loading={isSaving}
                            onClick={() => updateStatus(app.id, 'approved')}
                          />
                        )}
                        {app.status !== 'rejected' && (
                          <ActionBtn
                            label="Avvisa"
                            icon={AlertCircle}
                            color="bg-red-500 hover:bg-red-600"
                            loading={isSaving}
                            onClick={() => updateStatus(app.id, 'rejected')}
                          />
                        )}
                        {app.status !== 'pending' && (
                          <ActionBtn
                            label="Återställ"
                            icon={RefreshCw}
                            color="bg-slate-500 hover:bg-slate-600"
                            loading={isSaving}
                            onClick={() => updateStatus(app.id, 'pending')}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoChip({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2.5">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] text-slate-400 font-medium">{label}</p>
        <p className="text-[13px] text-slate-800 font-semibold">{value}</p>
      </div>
    </div>
  );
}

function ActionBtn({
  label, icon: Icon, color, loading, onClick,
}: {
  label: string;
  icon: typeof Check;
  color: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-white text-[13px] font-medium transition disabled:opacity-50 ${color}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}
