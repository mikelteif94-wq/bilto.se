import { useEffect, useState } from 'react';
import {
  Plus, Search, Loader2, CheckCircle2,
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

const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
  teamlead:             { bg: '#EEEDFE', text: '#3C3489' },
  salesperson:          { bg: '#E6F1FB', text: '#0C447C' },
  valuator:             { bg: '#FAEEDA', text: '#854F0B' },
  delivery_coordinator: { bg: '#E1F5EE', text: '#085041' },
};

interface CreateForm {
  email: string;
  password: string;
  fornamn: string;
  efternamn: string;
  role: string;
}

const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };
const inputStyle = { border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A', borderRadius: 8 };

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

  useEffect(() => { fetchMembers(); }, []);

  async function fetchMembers() {
    const { data } = await supabase.from('staff_users')
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

      const { error: rpcError } = await supabase.rpc('create_staff_member', {
        p_email: form.email,
        p_fornamn: form.fornamn,
        p_efternamn: form.efternamn,
        p_role: form.role,
        p_user_id: authData.user.id,
      });

      if (rpcError) {
        throw new Error(rpcError.message.includes('create_staff_member')
          ? 'DB-funktion saknas.'
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
      <div>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>Inställningar</h1>
            <p className="text-[13px] mt-0.5" style={{ color: '#6E6D68' }}>
              {members.filter(m => m.is_active).length} aktiva · {members.length} totalt
            </p>
          </div>
          <button
            onClick={() => { setShowCreateModal(true); setCreateError(null); }}
            className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-[13px] font-medium"
            style={{ background: '#0F6E56', color: '#FFFFFF' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Ny medarbetare
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#6E6D68' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök namn, e-post, roll…"
            className="w-full h-9 pl-8 pr-3 rounded-lg text-[14px] focus:outline-none"
            style={{ border: '1px solid #E5E4E0', background: '#FFFFFF', color: '#1C1C1A' }}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
          </div>
        ) : (
          <div style={cardStyle}>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-[13px]" style={{ color: '#6E6D68' }}>Inga medarbetare matchar.</div>
            ) : (
              filtered.map((member, idx) => {
                const roleStyle = ROLE_STYLE[member.role] ?? { bg: '#F7F6F3', text: '#6E6D68' };
                const isSelf = member.id === staffUser.id;
                const initials = (member.fornamn[0] ?? '') + (member.efternamn[0] ?? '');
                return (
                  <div key={member.id} className="px-5 py-4 flex items-center gap-3"
                    style={{ borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined }}>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-medium"
                      style={{ background: member.is_active ? '#EEF7F4' : '#F7F6F3', color: member.is_active ? '#0F6E56' : '#6E6D68' }}
                    >
                      {initials || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>
                          {member.fornamn} {member.efternamn}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: '#E6F1FB', color: '#0C447C' }}>Du</span>
                        )}
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: roleStyle.bg, color: roleStyle.text, borderRadius: 100 }}>
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                        {!member.is_active && (
                          <span className="text-[11px] flex items-center gap-1" style={{ color: '#6E6D68' }}>
                            <XCircle className="w-3 h-3" />
                            Inaktiv
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] truncate" style={{ color: '#6E6D68' }}>{member.email}</p>
                    </div>
                    {!isSelf && (
                      <button
                        onClick={() => toggleActive(member)}
                        disabled={togglingId === member.id}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium transition"
                        style={{
                          border: '1px solid #E5E4E0',
                          color: member.is_active ? '#791F1F' : '#085041',
                          background: '#FFFFFF',
                        }}
                      >
                        {togglingId === member.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : member.is_active ? (
                          <><XCircle className="w-3 h-3" /> Inaktivera</>
                        ) : (
                          <><CheckCircle2 className="w-3 h-3" /> Aktivera</>
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-4 h-4" style={{ color: '#6E6D68' }} />
              <h2 className="text-[16px] font-medium" style={{ color: '#1C1C1A' }}>Ny medarbetare</h2>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[['fornamn', 'Förnamn *'], ['efternamn', 'Efternamn *']].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>{label}</label>
                    <input value={form[key as keyof CreateForm]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>E-post *</label>
                <input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle} />
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>Lösenord *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 8 tecken"
                    className="w-full h-9 px-3 pr-9 text-[13px] focus:outline-none" style={inputStyle} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: '#6E6D68' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#6E6D68' }}>Roll *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full h-9 px-3 text-[13px] focus:outline-none" style={inputStyle}>
                  {Object.entries(ROLE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </div>

              {createError && (
                <p className="text-[12px] px-3 py-2 rounded-lg" style={{ background: '#FCEBEB', color: '#791F1F' }}>{createError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreateModal(false)}
                className="flex-1 h-9 rounded-lg text-[13px]" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>
                Avbryt
              </button>
              <button onClick={createMember} disabled={creating}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2"
                style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Skapa
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffShell>
  );
}
