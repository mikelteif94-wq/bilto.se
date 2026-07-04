import { useState, useEffect } from 'react';
import { Loader2, LogIn, AlertCircle, UserPlus, ChevronLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StaffLoginProps {
  onLoggedIn: () => void;
  onBack: () => void;
}

const SETUP_KEY = 'bilto-setup-2026';

export default function StaffLogin({ onLoggedIn, onBack }: StaffLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [noStaff, setNoStaff] = useState(false);

  // Setup form state
  const [setupKey, setSetupKey] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupFornamn, setSetupFornamn] = useState('');
  const [setupEfternamn, setSetupEfternamn] = useState('');
  const [setupDone, setSetupDone] = useState(false);

  useEffect(() => {
    supabase
      .from('staff_users')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        if (count === 0) setNoStaff(true);
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
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

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (setupKey !== SETUP_KEY) {
      setError('Fel setup-nyckel.');
      return;
    }
    if (setupPassword.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken.');
      return;
    }

    setLoading(true);

    // Check again that no staff exists
    const { count } = await supabase
      .from('staff_users')
      .select('id', { count: 'exact', head: true });

    if ((count ?? 0) > 0) {
      setError('Det finns redan staff-konton. Logga in istället.');
      setLoading(false);
      return;
    }

    // Create auth user
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: setupEmail.toLowerCase(),
      password: setupPassword,
    });

    if (signUpErr || !signUpData.user) {
      setError('Kunde inte skapa konto: ' + (signUpErr?.message ?? 'okänt fel'));
      setLoading(false);
      return;
    }

    // Insert into staff_users using service-level via RPC bypass
    // We sign in first to get an authenticated session, then insert
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: setupEmail.toLowerCase(),
      password: setupPassword,
    });

    if (loginErr) {
      setError('Konto skapat men kunde inte logga in: ' + loginErr.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Kunde inte hämta användare efter inloggning.');
      setLoading(false);
      return;
    }

    // Insert staff_users row — needs INSERT policy for authenticated users
    const { error: insertErr } = await supabase.from('staff_users').insert({
      user_id: user.id,
      email: setupEmail.toLowerCase(),
      fornamn: setupFornamn,
      efternamn: setupEfternamn,
      role: 'teamlead',
      is_active: true,
    });

    if (insertErr) {
      await supabase.auth.signOut();
      setError('Konto skapat men kunde inte spara i staff-tabellen: ' + insertErr.message + '. Se instruktioner nedan.');
      setLoading(false);
      return;
    }

    setSetupDone(true);
    setLoading(false);
  };

  if (setupDone) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A1628' }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Konto skapat!</h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Ditt teamlead-konto är aktivt. Du kan nu logga in.
          </p>
          <button
            onClick={() => { setMode('login'); setSetupDone(false); }}
            className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition"
            style={{ background: '#00A85A', color: 'white' }}
          >
            <LogIn className="w-4 h-4" />
            Gå till inloggning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A1628' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: '"Anton","Impact",sans-serif' }}>
            Bytesavdelningen
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Internt säljsystem
          </p>
        </div>

        {mode === 'login' ? (
          <>
            <form
              onSubmit={handleLogin}
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
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
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

            {noStaff && (
              <button
                onClick={() => { setMode('setup'); setError(null); }}
                className="mt-4 w-full h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Skapa första adminkonto
              </button>
            )}
          </>
        ) : (
          <form
            onSubmit={handleSetup}
            className="rounded-2xl p-8 space-y-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => { setMode('login'); setError(null); }}>
                <ChevronLeft className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
              </button>
              <span className="text-sm font-semibold text-white">Skapa första teamlead-konto</span>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Setup-nyckel
              </label>
              <input
                type="password"
                value={setupKey}
                onChange={e => setSetupKey(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-xl text-sm font-medium text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="••••••••"
              />
              <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Nyckel: <span className="font-mono text-white/50">bilto-setup-2026</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Förnamn</label>
                <input
                  type="text"
                  value={setupFornamn}
                  onChange={e => setSetupFornamn(e.target.value)}
                  required
                  className="w-full h-11 px-4 rounded-xl text-sm font-medium text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  placeholder="Mikael"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Efternamn</label>
                <input
                  type="text"
                  value={setupEfternamn}
                  onChange={e => setSetupEfternamn(e.target.value)}
                  required
                  className="w-full h-11 px-4 rounded-xl text-sm font-medium text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  placeholder="Bilto"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>E-post</label>
              <input
                type="email"
                value={setupEmail}
                onChange={e => setSetupEmail(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-xl text-sm font-medium text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="mikael@bilto.se"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Lösenord</label>
              <input
                type="password"
                value={setupPassword}
                onChange={e => setSetupPassword(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-xl text-sm font-medium text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="••••••••  (min 8 tecken)"
                autoComplete="new-password"
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Skapa konto
            </button>
          </form>
        )}

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
