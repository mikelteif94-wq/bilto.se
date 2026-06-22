import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Loader2, Mail, CheckCircle, Sparkles } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface SignupGateProps {
  /** Short headline shown above the form */
  headline: string;
  /** Subtext explaining what the user will unlock */
  subtext: string;
  /** Bullet points shown as teaser */
  bullets?: string[];
  /** Called once magic link is sent (so parent can show a success state) */
  onSent?: (email: string) => void;
}

export function SignupGate({ headline, subtext, bullets, onSent }: SignupGateProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Fyll i din e-postadress.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError('Ogiltig e-postadress.'); return; }
    setLoading(true);
    setError(null);
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
      if (!resp.ok) { setError(json.error ?? 'Något gick fel. Försök igen.'); return; }
      setSentEmail(trimmed);
      setSent(true);
      onSent?.(trimmed);
    } catch {
      setError('Kunde inte kontakta servern. Kontrollera din internetanslutning.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl bg-[#faf8f5] border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <Mail className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[18px] font-bold text-slate-900">Kolla din mejl</h3>
            <p className="text-[14px] text-slate-500 mt-1 leading-relaxed">
              Vi skickade en säker länk till
            </p>
            <p className="text-[15px] font-semibold text-slate-900 break-all mt-0.5">{sentEmail}</p>
          </div>
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left">
            <p className="text-[13px] text-amber-800 leading-relaxed">
              Hamnar mejlet inte i inkorgen? Kolla skräpposten.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-[13px] text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skicka ny länk
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-slate-200 bg-[#faf8f5] shadow-sm"
    >
      {/* Top banner */}
      <div className="bg-gradient-to-r from-[#0e6efe] to-[#2a7fff] px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-[14px] leading-snug">{headline}</p>
          <p className="text-white/75 text-[12px] mt-0.5">{subtext}</p>
        </div>
      </div>

      {/* Blurred preview + lock */}
      <div className="relative px-5 pt-5 pb-1">
        {/* Fake blurred result rows */}
        <div className="space-y-2 mb-4" aria-hidden>
          {[70, 55, 45].map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className={`h-3 rounded-xl bg-slate-100`} style={{ width: `${w}%` }} />
                <div className="h-2.5 rounded-full bg-slate-100 w-1/3" />
              </div>
              <div className="w-14 h-6 rounded-xl bg-slate-100 shrink-0" />
            </div>
          ))}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#faf8f5]/70 backdrop-blur-[2px] rounded-b-none">
          <div className="w-10 h-10 rounded-xl bg-slate-900/8 border border-slate-200 flex items-center justify-center mb-2">
            <Lock className="w-4.5 h-4.5 text-slate-500" />
          </div>
          <p className="text-[13px] font-semibold text-slate-600">Resultaten visas i din portal</p>
        </div>
      </div>

      {/* Bullets */}
      {bullets && bullets.length > 0 && (
        <div className="px-5 pb-4 space-y-1.5">
          {bullets.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-[12.5px] text-slate-600">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              {b}
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="px-5 pb-5 space-y-3">
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
            E-postadress
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="din@mejl.se"
            autoComplete="email"
            className="w-full h-11 px-4 rounded-xl border border-slate-300 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/20 focus:border-[#0e6efe] transition bg-[#faf8f5]"
          />
          {error && (
            <p className="mt-1.5 text-[12px] text-red-600 font-medium">{error}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-300 text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Skicka mig länken
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-slate-400">
          Ingen registrering – en säker länk direkt i din mejl
        </p>
      </form>
    </motion.div>
  );
}
