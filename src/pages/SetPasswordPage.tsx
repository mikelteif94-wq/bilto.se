import { useEffect, useState } from 'react';
import { Loader2, Lock, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ErrorBanner from '../components/ErrorBanner';

interface SetPasswordPageProps {
  onDone: () => void;
}

export default function SetPasswordPage({ onDone }: SetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setHasSession(true);
      }
      setChecking(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setHasSession(!!session);
        setChecking(false);
      }
    });
    unsub = () => listener.subscription.unsubscribe();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken.');
      return;
    }
    if (password !== confirm) {
      setError('Lösenorden matchar inte.');
      return;
    }
    setLoading(true);
    const { error: updErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updErr) {
      setError(
        updErr.message?.includes('same as the old')
          ? 'Det nya lösenordet måste skilja sig från det gamla.'
          : 'Kunde inte spara lösenordet. Länken kan ha gått ut – be om en ny.'
      );
      return;
    }
    setDone(true);
    setTimeout(() => {
      window.history.replaceState({}, '', '/handlare/oversikt');
      onDone();
    }, 1200);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Länken är ogiltig eller har gått ut
          </h1>
          <p className="text-slate-600 mb-6">
            Be om en ny länk genom att klicka på "Glömt lösenord" på inloggningssidan.
          </p>
          <a
            href="/handlare/logga-in"
            className="inline-flex items-center justify-center h-11 px-5 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold rounded-full transition text-sm"
          >
            Till inloggning
          </a>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-emerald-600" strokeWidth={2.4} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Lösenord sparat</h1>
          <p className="text-slate-600">Skickar dig vidare till din översikt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-2">
            Välkommen till Bilto
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Välj ditt lösenord
          </h1>
          <p className="text-slate-600 text-sm">
            Sätt ett lösenord för att aktivera ditt handlarkonto.
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nytt lösenord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 8 tecken"
                autoComplete="new-password"
                className="w-full h-11 pl-10 pr-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Bekräfta lösenord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Skriv lösenordet igen"
                autoComplete="new-password"
                className="w-full h-11 pl-10 pr-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:bg-slate-300 text-white font-semibold rounded-full transition text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Spara lösenord
          </button>
        </form>
      </div>
    </div>
  );
}
