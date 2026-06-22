import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PortalCallbackPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export default function PortalCallbackPage({ onSuccess, onBack }: PortalCallbackPageProps) {
  const [status, setStatus] = useState<'verifying' | 'linking' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    if (!token || !email) {
      setErrorMsg('Länken är ofullständig eller ogiltig.');
      setStatus('error');
      return;
    }

    void (async () => {
      try {
        // 1. Verify our custom magic link token (single-use, expires in 30 min)
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/verify-magic-link`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ANON_KEY}`,
            Apikey: ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        });
        const json = await resp.json();

        if (!resp.ok) {
          setErrorMsg(json.error ?? 'Länken är ogiltig eller har gått ut.');
          setStatus('error');
          return;
        }

        // 2. Exchange the Supabase action_link into a real session
        setStatus('linking');
        const actionLink: string = json.action_link;
        const actionUrl = new URL(actionLink);
        const tokenHash = actionUrl.searchParams.get('token') ?? '';

        const { error: otpErr } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'magiclink',
        });

        if (otpErr) {
          console.error('[portal-callback] verifyOtp error:', otpErr);
          setErrorMsg('Kunde inte logga in. Begär en ny länk.');
          setStatus('error');
          return;
        }

        // 3. Link customer rows to this auth user – only if customer rows exist for this email.
        //    link-customer-account returns has_cases=true only when rows were found.
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch(`${SUPABASE_URL}/functions/v1/link-customer-account`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }).catch(() => {});
        }

        sessionStorage.setItem('bilto_portal', 'customer');
        // Always go to dashboard – it handles the empty state with CTAs
        onSuccess();
      } catch (err) {
        console.error('[portal-callback]', err);
        setErrorMsg('Något gick fel. Försök igen.');
        setStatus('error');
      }
    })();
  }, []);

  if (status === 'verifying' || status === 'linking') {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mx-auto">
            <Loader2 className="w-7 h-7 text-[#0e6efe] animate-spin" />
          </div>
          <p className="text-[15px] font-semibold text-slate-700">
            {status === 'linking' ? 'Loggar in…' : 'Verifierar länk…'}
          </p>
          <p className="text-[13px] text-slate-400">Det tar bara ett ögonblick.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#faf8f5] border border-slate-200 rounded-xl p-8 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-slate-900 mb-2">Länken fungerar inte</h1>
          <p className="text-[14px] text-slate-600 leading-relaxed">{errorMsg}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold rounded-xl transition text-sm"
        >
          <Mail className="w-4 h-4" />
          Begär ny länk
        </button>
      </div>
    </div>
  );
}
