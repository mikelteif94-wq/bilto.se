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
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
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

            {/* Left column */}
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
              <h1 className="text-white text-[32px] sm:text-[48px] lg:text-[56px] font-semibold leading-[1.05] tracking-tight">
                Följ ditt<br />ärende.
              </h1>
              <p className="mt-6 text-white/90 text-[17px] leading-[1.6] max-w-lg">
                Se bud från handlare, följ din bil och hantera dina erbjudanden — allt utan lösenord.
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

            {/* Right column — card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/20 overflow-hidden">
              {sent ? (
                <SentConfirmation email={email.trim()} onResend={() => setSent(false)} />
              ) : (
                <>
                  <div className="px-7 pt-8 pb-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#0e6efe]/10 flex items-center justify-center mb-5">
                      <Mail className="w-6 h-6 text-[#0e6efe]" />
                    </div>
                    <h2 className="text-[20px] font-bold text-slate-900 mb-1">
                      Följ ditt ärende
                    </h2>
                    <p className="text-[14px] text-slate-500 leading-relaxed">
                      Ange din e-postadress så skickar vi en säker engångslänk till din portal.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="px-7 pt-5 pb-8 space-y-4">
                    <label className="block">
                      <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">
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
                      className="w-full inline-flex items-center justify-center gap-2 h-12 bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-300 text-white font-semibold text-[15px] rounded-full transition shadow-sm"
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
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SentConfirmation({ email, onResend }: { email: string; onResend: () => void }) {
  return (
    <div className="px-7 py-10 text-center space-y-5">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
        <Mail className="w-8 h-8 text-emerald-600" />
      </div>

      <div className="space-y-2">
        <h2 className="text-[19px] font-bold text-slate-900">Kolla din mejl</h2>
        <p className="text-[14px] text-slate-600 leading-relaxed">
          Vi har skickat en säker inloggningslänk till
        </p>
        <p className="text-[15px] font-semibold text-slate-900 break-all">{email}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left">
        <p className="text-[13px] text-amber-800 leading-relaxed">
          Hamnar mejlet inte i inkorgen? Kolla skräpposten eller spam-mappen.
        </p>
      </div>

      <div className="pt-2 space-y-2">
        <p className="text-[12.5px] text-slate-400">Fick du inget mejl?</p>
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
