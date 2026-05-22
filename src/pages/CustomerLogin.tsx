import { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Lock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ErrorBanner from '../components/ErrorBanner';
import { SiteFooter } from '../components/SiteFooter';

interface CustomerLoginProps {
  onLoggedIn: () => void;
  onBack: () => void;
  initialEmail?: string;
  initialCreate?: boolean;
}

export default function CustomerLogin({ onLoggedIn, onBack, initialEmail = '', initialCreate = false }: CustomerLoginProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newAccount, setNewAccount] = useState(initialCreate);

  const switchMode = (create: boolean) => {
    setNewAccount(create);
    setError(null);
    setResetSent(false);
    setPassword('');
    setConfirm('');
  };

  const handleReset = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Fyll i din mejl först.');
      return;
    }
    setResetting(true);
    const { error: rErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/valj-losenord`,
    });
    setResetting(false);
    if (rErr) {
      setError('Kunde inte skicka länk just nu. Försök igen.');
      return;
    }
    setResetSent(true);
  };

  const handleSignUp = async (e: React.FormEvent) => {
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
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (signUpErr) {
      setLoading(false);
      if (signUpErr.message?.toLowerCase().includes('already registered') || signUpErr.message?.toLowerCase().includes('user already')) {
        setError('Det finns redan ett konto med den mejladressen. Logga in istället.');
      } else {
        setError('Kunde inte skapa konto. Försök igen.');
      }
      return;
    }
    if (!data.user) {
      setLoading(false);
      setError('Kunde inte skapa konto. Försök igen.');
      return;
    }
    sessionStorage.setItem('bilto_portal', 'customer');
    setLoading(false);
    onLoggedIn();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError || !data.user) {
      setError('Fel mejl eller lösenord.');
      setLoading(false);
      return;
    }
    sessionStorage.setItem('bilto_portal', 'customer');
    setLoading(false);
    onLoggedIn();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button onClick={onBack} className="shrink-0 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
            />
          </button>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative bg-[#0e6efe] overflow-hidden pt-24">
          <div className="relative max-w-[1280px] mx-auto px-6 pt-10 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
            <div>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 text-[14px] text-white/80 hover:text-white transition mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Tillbaka
              </button>
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/80 uppercase tracking-[0.18em] mb-4">
                <User className="w-3.5 h-3.5" />
                Mina bud
              </span>
              <h1 className="text-white text-[32px] sm:text-[48px] lg:text-[64px] font-semibold leading-[1.05] tracking-tight">
                {newAccount ? <>Skapa ditt<br />konto.</> : <>Logga in på<br />ditt konto.</>}
              </h1>
              <p className="mt-6 text-white/90 text-[17px] leading-[1.6] max-w-lg">
                Se bud från handlare, följ din bil och hantera dina erbjudanden.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/20 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-7 py-5">
                <h2 className="text-[17px] font-semibold text-slate-900">
                  {newAccount ? 'Skapa konto' : 'Logga in'}
                </h2>
                <p className="text-[12.5px] text-slate-500">
                  {newAccount
                    ? 'Ange din mejl och välj ett lösenord — du är klar direkt.'
                    : 'Använd mejlen du angav när du lämnade in bilen.'}
                </p>
              </div>

              <div className="p-7 sm:p-9">
                {newAccount ? (
                  <form onSubmit={handleSignUp} noValidate className="space-y-5">
                    <label className="block">
                      <span className="block text-[13px] font-medium text-slate-700 mb-1.5">
                        Din e-postadress
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        autoFocus
                        placeholder="namn@exempel.se"
                        className="form-control"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-[13px] font-medium text-slate-700 mb-1.5">
                        Välj lösenord
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Minst 8 tecken"
                        className="form-control"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-[13px] font-medium text-slate-700 mb-1.5">
                        Bekräfta lösenord
                      </span>
                      <input
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Skriv lösenordet igen"
                        className="form-control"
                      />
                    </label>

                    <ErrorBanner message={error} />

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 h-12 bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-400 text-white font-semibold text-[14.5px] rounded-full transition"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Skapa konto <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <p className="inline-flex items-center gap-2 text-[12.5px] text-slate-500">
                        <Lock className="w-3.5 h-3.5" />
                        Dina uppgifter skickas krypterat.
                      </p>
                      <button
                        type="button"
                        onClick={() => switchMode(false)}
                        className="text-[12.5px] font-semibold text-[#0e6efe] hover:underline"
                      >
                        Har du redan ett konto?
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} noValidate className="space-y-5">
                    <label className="block">
                      <span className="block text-[13px] font-medium text-slate-700 mb-1.5">
                        Mejl
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        autoFocus
                        className="form-control"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-[13px] font-medium text-slate-700 mb-1.5">
                        Lösenord
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="form-control"
                      />
                    </label>

                    <ErrorBanner message={error} />

                    {resetSent && (
                      <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-[12.5px] text-green-800">
                        Vi har skickat en återställningslänk till {email.trim()}.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 h-12 bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-400 text-white font-semibold text-[14.5px] rounded-full transition"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Logga in <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <p className="inline-flex items-center gap-2 text-[12.5px] text-slate-500">
                        <Lock className="w-3.5 h-3.5" />
                        Dina uppgifter skickas krypterat.
                      </p>
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={resetting}
                        className="text-[12.5px] font-semibold text-[#0e6efe] hover:underline disabled:opacity-50"
                      >
                        {resetting ? 'Skickar…' : 'Glömt lösenord?'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-7 py-4 text-center">
                {newAccount ? (
                  <button
                    type="button"
                    onClick={() => switchMode(false)}
                    className="text-[13px] font-semibold text-[#0e6efe] hover:underline"
                  >
                    Har du redan ett konto? Logga in
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchMode(true)}
                    className="text-[13px] font-semibold text-[#0e6efe] hover:underline"
                  >
                    Har du inget konto? Skapa konto
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
