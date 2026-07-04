import { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Mail, ShieldCheck } from 'lucide-react';
import ErrorBanner from '../components/ErrorBanner';
import { SiteFooter } from '../components/SiteFooter';

interface CustomerLoginProps {
  onBack: () => void;
  initialEmail?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export default function CustomerLogin({ onBack, initialEmail = '' }: CustomerLoginProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Fyll i din e-postadress.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Ogiltig e-postadress.');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-magic-link`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ANON_KEY}`,
          Apikey: ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmed }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setError(json.error ?? 'Något gick fel. Försök igen.');
        return;
      }
      setSent(true);
    } catch {
      setError('Kunde inte kontakta servern. Kontrollera din internetanslutning.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col">
      {/* Navbar */}
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-4 lg:px-8">
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
        {/* Mobile: stacked card layout / Desktop: side-by-side */}
        <div className="bg-[#0e6efe] pt-[69px] lg:pt-0">

          {/* Desktop two-col section */}
          <section className="hidden lg:block">
            <div className="relative max-w-[1280px] mx-auto px-6 pt-20 pb-28 grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
              <div>
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-[14px] text-white/80 hover:text-white transition mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Tillbaka
                </button>
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/80 uppercase tracking-[0.18em] mb-4">
                  <Mail className="w-3.5 h-3.5" />
                  Kundportal
                </span>
                <h1 className="text-white text-[56px] font-semibold leading-[1.05] tracking-tight">
                  Följ ditt<br />ärende.
                </h1>
                <p className="mt-6 text-white/90 text-[17px] leading-[1.6] max-w-lg">
                  Se bud från handlare, följ din bil och hantera dina erbjudanden – allt utan lösenord.
                </p>
                <div className="mt-8 space-y-3">
                  {[
                    'Ingen registrering krävs',
                    'Säker engångslänk direkt i din mejl',
                    'Fungerar på alla enheter',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-white/85 text-[14px]">
                      <ShieldCheck className="w-4 h-4 text-white/60 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xl shadow-slate-900/20 overflow-hidden">
                {sent ? (
                  <SentConfirmation email={email.trim()} onResend={() => setSent(false)} />
                ) : (
                  <LoginForm
                    email={email}
                    setEmail={setEmail}
                    loading={loading}
                    error={error}
                    setError={setError}
                    onSubmit={handleSubmit}
                  />
                )}
              </div>
            </div>
          </section>

          {/* Mobile layout */}
          <section className="lg:hidden px-4 pt-6 pb-10">
            {/* Back link */}
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-[13px] text-white/80 hover:text-white transition mb-5"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka
            </button>

            {/* Heading block */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] mb-2">
                <Mail className="w-3 h-3" />
                Kundportal
              </span>
              <h1 className="text-white text-[28px] font-bold leading-[1.1] tracking-tight">
                Följ ditt ärende
              </h1>
              <p className="mt-2 text-white/85 text-[14px] leading-relaxed">
                Se bud, följ din bil och hantera erbjudanden – utan lösenord.
              </p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {sent ? (
                <SentConfirmation email={email.trim()} onResend={() => setSent(false)} />
              ) : (
                <LoginForm
                  email={email}
                  setEmail={setEmail}
                  loading={loading}
                  error={error}
                  setError={setError}
                  onSubmit={handleSubmit}
                />
              )}
            </div>

            {/* Trust badges below card */}
            <div className="mt-5 space-y-2">
              {[
                'Ingen registrering krävs',
                'Säker engångslänk direkt i din mejl',
                'Fungerar på alla enheter',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-white/75 text-[12px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-white/50 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function LoginForm({
  email, setEmail, loading, error, setError, onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  error: string | null;
  setError: (v: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <>
      <div className="px-6 pt-7 pb-2">
        <div className="w-11 h-11 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mb-4">
          <Mail className="w-5 h-5 text-[#0e6efe]" />
        </div>
        <h2 className="text-[18px] font-bold text-slate-900 mb-1">Logga in på din portal</h2>
        <p className="text-[13px] text-slate-500 leading-relaxed">
          Ange din e-post så skickar vi en säker engångslänk.
        </p>
      </div>
      <form onSubmit={onSubmit} noValidate className="px-6 pt-4 pb-7 space-y-4">
        <label className="block">
          <span className="block text-[12px] font-semibold text-slate-700 mb-1.5">
            E-postadress
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            required
            autoComplete="email"
            autoFocus
            placeholder="din@mejl.se"
            className="form-control"
          />
        </label>
        <ErrorBanner message={error} />
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 h-11 bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-300 text-white font-semibold text-[14px] rounded-xl transition shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Skicka länk
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </>
  );
}

function SentConfirmation({ email, onResend }: { email: string; onResend: () => void }) {
  return (
    <div className="px-6 py-9 text-center space-y-4">
      <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
        <Mail className="w-7 h-7 text-emerald-600" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-[18px] font-bold text-slate-900">Kolla din mejl</h2>
        <p className="text-[13px] text-slate-500 leading-relaxed">
          Vi har skickat en säker inloggningslänk till
        </p>
        <p className="text-[14px] font-semibold text-slate-900 break-all">{email}</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left">
        <p className="text-[12px] text-amber-800 leading-relaxed">
          Hamnar mejlet inte i inkorgen? Kolla skräpposten eller spam-mappen.
        </p>
      </div>
      <div className="pt-1 space-y-1.5">
        <p className="text-[12px] text-slate-400">Fick du inget mejl?</p>
        <button
          type="button"
          onClick={onResend}
          className="text-[13px] font-semibold text-[#0e6efe] hover:underline"
        >
          Skicka ny länk
        </button>
      </div>
    </div>
  );
}
