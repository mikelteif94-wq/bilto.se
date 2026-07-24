import { useState } from 'react';
import { ArrowLeft, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ErrorBanner from '../components/ErrorBanner';

interface Props {
  onLoggedIn: () => void;
  onBack: () => void;
}

export default function ForhandlareLogin({ onLoggedIn, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) { setError('Fyll i e-post och lösenord.'); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (authError) {
      setError('Fel e-postadress eller lösenord. Kontrollera dina uppgifter.');
      return;
    }
    sessionStorage.setItem('bilto_portal', 'forhandlare');
    onLoggedIn();
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full space-y-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-900 transition">
          <ArrowLeft className="w-4 h-4" /> Tillbaka
        </button>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <div className="mb-6">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 w-auto object-contain mb-4" />
            <h1 className="text-[22px] font-bold text-slate-900">Förhandlarportal</h1>
            <p className="text-[13px] text-slate-500 mt-1">Logga in på ditt förhandlarkonto.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">E-post</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="namn@exempel.se"
                  className="w-full h-11 pl-10 pr-4 bg-[#faf8f5] border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Lösenord</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-[#faf8f5] border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] transition"
                />
              </div>
            </div>

            <ErrorBanner message={error} />

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[14px] rounded-xl transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Logga in</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-5 text-[12px] text-slate-400 text-center">
            Inte förhandlare ännu?{' '}
            <a href="/forhandlare/registrera" className="text-[#0e6efe] hover:underline font-medium">Ansök här</a>
          </p>
        </div>
      </div>
    </div>
  );
}
