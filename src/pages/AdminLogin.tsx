import { useState } from 'react';
import { ArrowRight, Loader2, Lock, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ErrorBanner from '../components/ErrorBanner';

interface AdminLoginProps {
  onLoggedIn: () => void;
  onBack: () => void;
}

export default function AdminLogin({ onLoggedIn, onBack }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError('Fel e-post eller lösenord.');
      setLoading(false);
      return;
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc('get_is_admin');

    if (adminError || !isAdmin) {
      await supabase.auth.signOut();
      setError('Ditt konto har inte administratörsrättigheter.');
      setLoading(false);
      return;
    }

    onLoggedIn();
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col">
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button onClick={onBack} className="shrink-0 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </button>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative bg-[#0e6efe] overflow-hidden pt-24">
          <div className="relative max-w-[1280px] mx-auto px-6 pt-10 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/80 uppercase tracking-[0.18em] mb-4">
                <Shield className="w-3.5 h-3.5" />
                Adminportalen
              </span>
              <h1 className="text-white text-[32px] sm:text-[48px] lg:text-[64px] font-semibold leading-[1.05] tracking-tight">
                Logga in som<br />administratör.
              </h1>
              <p className="mt-6 text-white/90 text-[17px] leading-[1.6] max-w-lg">
                Hantera bilar, handlare, leads och erbjudanden från ett ställe.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-2xl shadow-slate-900/20 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-7 py-5">
                <h2 className="text-[17px] font-semibold text-slate-900">Logga in</h2>
                <p className="text-[12.5px] text-slate-500">Endast behörig personal har tillgång.</p>
              </div>

              <div className="p-7 sm:p-9">
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <label className="block">
                    <span className="block text-[13px] font-medium text-slate-700 mb-1.5">
                      E-post
                    </span>
                    <input
                      type="text"
                      inputMode="email"
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 h-12 bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-400 text-white font-semibold text-[14.5px] rounded-full transition"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Logga in
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="inline-flex items-center gap-2 text-[12.5px] text-slate-500 pt-1">
                    <Lock className="w-3.5 h-3.5" />
                    Dina uppgifter skickas krypterat.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
