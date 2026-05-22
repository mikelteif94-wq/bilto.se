import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Clock, Loader2, Lock, Menu, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import ErrorBanner from '../components/ErrorBanner';

interface DealerLoginProps {
  onLoggedIn: () => void;
  onNavigateRegister: () => void;
  onBack: () => void;
}

export default function DealerLogin({
  onLoggedIn,
  onNavigateRegister,
  onBack,
}: DealerLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.4 : 300;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems: MobileMenuItem[] = ['Sälj bil', 'Köp bil'];

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Köp bil') {
      window.history.pushState({}, '', '/kop-bil');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onBack();
  };

  const handleReset = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Fyll i din mejl först.');
      return;
    }
    setResetting(true);
    const { error: rErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/handlare/installningar`,
    });
    setResetting(false);
    if (rErr) {
      setError('Kunde inte skicka länk just nu. Försök igen.');
      return;
    }
    setResetSent(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(false);
    setLoading(true);

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (authError || !authData.user) {
      setError('Fel mejl eller lösenord.');
      setLoading(false);
      return;
    }

    const { data: dealer, error: dealerError } = await supabase
      .from('dealers')
      .select('id, godkand')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (dealerError) {
      setError('Kunde inte hämta handlarprofil.');
      setLoading(false);
      return;
    }

    if (!dealer) {
      await supabase.auth.signOut();
      setError('Ingen handlarprofil hittades för det här kontot.');
      setLoading(false);
      return;
    }

    if (!dealer.godkand) {
      await supabase.auth.signOut();
      setPending(true);
      setLoading(false);
      return;
    }

    setLoading(false);
    sessionStorage.setItem('bilto_portal', 'dealer');
    onLoggedIn();
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelect={handleMenuSelect}
      />

      <header className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]/40 backdrop-blur-md'}`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white"
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={onBack} className="shrink-0 lg:mr-10 ml-2 lg:ml-0 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
            />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleMenuSelect(item)}
                className="text-[15px] text-white/90 hover:text-white transition"
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center ml-auto">
            <button
              onClick={onNavigateRegister}
              className="flex items-center gap-2 text-[15px] text-white hover:text-white/80 transition"
            >
              Bli handlare
              <User className="w-[20px] h-[20px] hidden lg:block" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative bg-[#0e6efe] overflow-hidden pt-24">
          <div className="absolute -left-32 -top-10 w-[480px] h-[480px] rounded-full bg-[#3d8cff] opacity-60" />
          <div className="absolute right-10 -bottom-40 w-[520px] h-[520px] rounded-full bg-[#3d8cff] opacity-50" />
          <div className="absolute left-1/2 -translate-x-1/2 top-40 w-[360px] h-[360px] rounded-full bg-[#66a5ff] opacity-40" />

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
                <Building2 className="w-3.5 h-3.5" />
                Handlarportal
              </span>
              <h1 className="text-white text-[40px] sm:text-[56px] lg:text-[64px] font-semibold leading-[1.05] tracking-tight">
                Välkommen<br />tillbaka.
              </h1>
              <p className="mt-6 text-white/90 text-[17px] leading-[1.6] max-w-lg">
                Logga in för att se nya leads, lägga bud och följa pågående affärer.
              </p>
            </div>

            <div className="relative">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/20 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-7 py-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#0e6efe]" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-semibold text-slate-900 leading-tight">
                      Logga in
                    </h2>
                    <p className="text-[12.5px] text-slate-500">
                      Använd mejl och lösenord.
                    </p>
                  </div>
                </div>

                <div className="p-7 sm:p-9">
                  {pending ? (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5">
                        <Clock className="w-7 h-7" />
                      </div>
                      <h3 className="text-[20px] font-semibold text-slate-900 mb-2 tracking-tight">
                        Kontot väntar på godkännande
                      </h3>
                      <p className="text-[14.5px] text-slate-600 leading-[1.6] mb-7">
                        Vi granskar din ansökan och hör av oss inom 24 timmar så snart kontot är aktiverat.
                        Behöver du hjälp? Mejla support@bilto.se så återkopplar vi.
                      </p>
                      <button
                        onClick={() => setPending(false)}
                        className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#0e6efe] hover:text-[#0a57cc]"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Tillbaka till inloggning
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                      <label className="block">
                        <span className="block text-[13px] font-medium text-slate-700 mb-1.5">
                          Mejl
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

                      {resetSent && (
                        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-[12.5px] text-green-800">
                          Vi har skickat en länk för att återställa lösenordet till {email.trim()}.
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
                          <>
                            Logga in
                            <ArrowRight className="w-4 h-4" />
                          </>
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

                {!pending && (
                  <div className="border-t border-slate-100 bg-slate-50 px-7 py-4 text-center">
                    <p className="text-[13px] text-slate-600">
                      Har du inget konto?{' '}
                      <button
                        onClick={onNavigateRegister}
                        className="font-semibold text-[#0e6efe] hover:text-[#0a57cc] hover:underline"
                      >
                        Ansök som handlare
                      </button>
                    </p>
                  </div>
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
