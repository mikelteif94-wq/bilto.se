import { useEffect, useState } from 'react';
import {
  Users, Plus, Search, Loader2, CheckCircle2,
  XCircle, Shield, Eye, EyeOff,
} from 'lucide-react';
import StaffShell from '../components/StaffShell';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

interface StaffUsersProps {
  staffUser: StaffUser;
  onLoggedOut: () => void;
}

interface StaffMember {
  id: string;
  email: string;
  fornamn: string;
  efternamn: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  teamlead: 'Teamledare',
  salesperson: 'Säljare',
  valuator: 'Värderare',
  delivery_coordinator: 'Leveranskoord.',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  teamlead: { bg: '#EDE9FE', text: '#6D28D9' },
  salesperson: { bg: '#DBEAFE', text: '#1D4ED8' },
  valuator: { bg: '#FEF3C7', text: '#D97706' },
  delivery_coordinator: { bg: '#D1FAE5', text: '#065F46' },
};

interface CreateForm {
  email: string;
  password: string;
  fornamn: string;
  efternamn: string;
  role: string;
}

export default function StaffUsers({ staffUser, onLoggedOut }: StaffUsersProps) {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateForm>({
    email: '', password: '', fornamn: '', efternamn: '', role: 'salesperson',
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    const { data } = await supabase
      .from('staff_users')
      .select('id, email, fornamn, efternamn, role, is_active, created_at')
      .order('created_at', { ascending: false });
    setMembers((data ?? []) as StaffMember[]);
    setLoading(false);
  }

  async function createMember() {
    if (!form.email || !form.password || !form.fornamn || !form.efternamn) {
      setCreateError('Fyll i alla obligatoriska fält.');
      return;
    }
    if (form.password.length < 8) {
      setCreateError('Lösenordet måste vara minst 8 tecken.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      // Create auth user via a separate client so the admin session is unaffected
      const { createClient } = await import('@supabase/supabase-js');
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL as string,
        import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        { auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: false } }
      );

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: form.email.toLowerCase(),
        password: form.password,
      });

      if (authError) throw new Error('Kunde inte skapa konto: ' + authError.message);
      if (!authData.user) throw new Error('Kunde inte skapa konto: inget svar.');

      // Insert staff record via SECURITY DEFINER RPC (bypasses RLS, verifies teamlead)
      const { error: rpcError } = await supabase.rpc('create_staff_member', {
        p_email: form.email,
        p_fornamn: form.fornamn,
        p_efternamn: form.efternamn,
        p_role: form.role,
        p_user_id: authData.user.id,
      });

      if (rpcError) {
        throw new Error(rpcError.message.includes('create_staff_member')
          ? 'DB-funktion saknas. Kör SQL i Supabase-dashboarden — se instruktioner nedan.'
          : rpcError.message);
      }

      setShowCreateModal(false);
      setForm({ email: '', password: '', fornamn: '', efternamn: '', role: 'salesperson' });
      fetchMembers();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Något gick fel.');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(member: StaffMember) {
    setTogglingId(member.id);
    await supabase.from('staff_users').update({ is_active: !member.is_active }).eq('id', member.id);
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_active: !m.is_active } : m));
    setTogglingId(null);
  }

  const filtered = members.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${m.fornamn} ${m.efternamn}`.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (ROLE_LABELS[m.role] ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <StaffShell activePage="users" staffUser={staffUser} onLoggedOut={onLoggedOut}>
      <div className="max-w-4xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              Teamhantering
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {members.filter(m => m.is_active).length} aktiva · {members.length} totalt
            </p>
          </div>
          <button
            onClick={() => { setShowCreateModal(true); setCreateError(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: '#00A85A', color: 'white' }}
          >
            <Plus className="w-4 h-4" />
            Ny medarbetare
          </button>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök namn, e-post, roll…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-50">
              {filtered.map(member => {
                const roleStyle = ROLE_COLORS[member.role] ?? { bg: '#F3F4F6', text: '#6B7280' };
                const isSelf = member.id === staffUser.id;
                return (
                  <div key={member.id} className="px-5 py-4 flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                      style={{ background: member.is_active ? '#EFF6FF' : '#F3F4F6', color: member.is_active ? '#3B82F6' : '#9CA3AF' }}
                    >
                      {member.fornamn[0]}{member.efternamn[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">
                          {member.fornamn} {member.efternamn}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Du</span>
                        )}
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: roleStyle.bg, color: roleStyle.text }}
                        >
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                        {!member.is_active && (
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Inaktiv
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{member.email}</p>
                    </div>
                    {!isSelf && (
                      <button
                        onClick={() => toggleActive(member)}
                        disabled={togglingId === member.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition hover:bg-slate-50"
                        style={{
                          borderColor: member.is_active ? '#FECACA' : '#D1FAE5',
                          color: member.is_active ? '#DC2626' : '#00A85A',
                        }}
                      >
                        {togglingId === member.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : member.is_active ? (
                          <><XCircle className="w-3.5 h-3.5" /> Inaktivera</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Aktivera</>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">Inga medarbetare matchar.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-slate-900">Ny medarbetare</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Förnamn *</label>
                  <input
                    value={form.fornamn}
                    onChange={e => setForm(f => ({ ...f, fornamn: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Efternamn *</label>
                  <input
                    value={form.efternamn}
                    onChange={e => setForm(f => ({ ...f, efternamn: e.target.value }))}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">E-post *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lösenord *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full h-9 px-3 pr-9 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="Min 8 tecken"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Roll *</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
                >
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              {createError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Avbryt
              </button>
              <button
                onClick={createMember}
                disabled={creating}
                className="flex-1 h-10 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2"
                style={{ background: '#00A85A' }}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Skapa
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffShell>
  );
}
