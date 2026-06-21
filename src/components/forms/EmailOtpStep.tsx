import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Mail, RefreshCw } from 'lucide-react';

interface EmailOtpStepProps {
  email: string;
  onVerified: (verifiedEmail: string) => void;
  onChangeEmail: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function headers() {
  return {
    Authorization: `Bearer ${ANON_KEY}`,
    Apikey: ANON_KEY,
    'Content-Type': 'application/json',
  };
}

const RESEND_COOLDOWN = 30; // seconds before resend is allowed

export default function EmailOtpStep({ email, onVerified, onChangeEmail }: EmailOtpStepProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void sendCode();
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (digits.every((d) => d !== '')) {
      void verify(digits.join(''));
    }
  }, [digits]);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendCode = async () => {
    setSending(true);
    setError(null);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setError(json.error ?? 'Kunde inte skicka koden.');
      } else {
        setSent(true);
        startCooldown();
        // Focus first digit
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError('Kunde inte kontakta servern.');
    } finally {
      setSending(false);
    }
  };

  const verify = async (code: string) => {
    setVerifying(true);
    setError(null);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email, code }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setError(json.error ?? 'Fel kod. Försök igen.');
        // Clear digits on error so user can re-enter
        setDigits(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else {
        onVerified(json.verified_email ?? email);
      }
    } catch {
      setError('Kunde inte kontakta servern.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDigitInput = (index: number, value: string) => {
    // Handle paste of full 6-digit code
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      const next = value.split('');
      setDigits(next);
      inputRefs.current[5]?.focus();
      return;
    }

    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#0e6efe]/10 mb-1">
          <Mail className="w-7 h-7 text-[#0e6efe]" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Verifiera din e-post</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Vi har skickat en 6-siffrig kod till<br />
          <span className="font-semibold text-slate-700">{email}</span>
        </p>
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-xs text-[#0e6efe] hover:underline"
        >
          Ändra e-postadress
        </button>
      </div>

      {sending && !sent && (
        <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Skickar kod…
        </div>
      )}

      {sent && (
        <>
          {/* Digit inputs */}
          <div className="flex justify-center gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={d}
                disabled={verifying}
                onChange={(e) => handleDigitInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all
                  ${d ? 'border-[#0e6efe] bg-[#0e6efe]/5 text-slate-900' : 'border-slate-200 bg-white text-slate-900'}
                  focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20
                  disabled:opacity-50`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Verify button (manual fallback if auto-verify fails) */}
          {digits.every((d) => d !== '') && !verifying && (
            <button
              type="button"
              onClick={() => void verify(digits.join(''))}
              className="w-full h-12 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              Verifiera
            </button>
          )}

          {verifying && (
            <div className="flex items-center justify-center gap-2 py-2 text-[#0e6efe] text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifierar…
            </div>
          )}

          {/* Resend */}
          <div className="text-center">
            {cooldown > 0 ? (
              <p className="text-xs text-slate-400">Skicka ny kod om {cooldown}s</p>
            ) : (
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={sending}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0e6efe] transition disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Skicka ny kod
              </button>
            )}
          </div>
        </>
      )}

      {!sent && !sending && error && (
        <>
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center">
            {error}
          </div>
          <button
            type="button"
            onClick={() => void sendCode()}
            className="w-full h-12 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            <ArrowRight className="w-4 h-4" />
            Försök igen
          </button>
        </>
      )}
    </div>
  );
}
