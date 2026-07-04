import { useState } from 'react';
import { Loader2, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StaffLoginProps {
  onLoggedIn: () => void;
  onBack: () => void;
}

export default function StaffLogin({ onLoggedIn, onBack }: StaffLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('Felaktigt e-post eller lösenord.');
      setLoading(false);
      return;
    }

    const { data: staffData } = await supabase
      .from('staff_users')
      .select('id, is_active')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .eq('is_active', true)
      .maybeSingle();

    if (!staffData) {
      await supabase.auth.signOut();
      setError('Kontot har inte åtkomst till bytesavdelningen. Kontakta din administratör.');
      setLoading(false);
      return;
    }

    sessionStorage.setItem('bilto_portal', 'staff');
    onLoggedIn();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0A1628' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="text-2xl font-bold text-white mb-1"
            style={{ fontFamily: '"Anton","Impact",sans-serif' }}
          >
            Bytesavdelningen
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Internt säljsystem
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-8 space-y-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              E-post
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-xl text-sm font-medium text-white focus:outline-none transition"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              placeholder="ditt@mejl.se"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Lösenord
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-xl text-sm font-medium text-white focus:outline-none transition"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.2)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition"
            style={{ background: '#00A85A', color: 'white', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Logga in
          </button>
        </form>

        <button
          onClick={onBack}
          className="mt-6 w-full text-center text-xs transition"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          Tillbaka till startsidan
        </button>
      </div>
    </div>
  );
}
