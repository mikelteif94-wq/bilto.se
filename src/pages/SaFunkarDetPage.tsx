import { useState } from 'react';
import {
  Menu, ArrowRight, Car, TrendingUp, Handshake, Shield,
  Clock, Star, CheckCircle, User, Phone,
} from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import RegInput from '../components/RegInput';
import { validateSwedishPhone } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface SaFunkarDetPageProps {
  onBackHome: () => void;
  onSell?: (regnummer: string, telefon: string) => void;
}

const STEPS = [
  {
    num: '01',
    icon: Car,
    title: 'Berätta om din bil',
    text: 'Ange registreringsnummer och telefonnummer. Vi hämtar bilens uppgifter automatiskt — det tar under en minut.',
    perks: ['Ingen registrering krävs', 'Fungerar för alla bilmärken', 'Gratis och utan bindning'],
  },
  {
    num: '02',
    icon: TrendingUp,
    title: 'Handlare tävlar om din bil',
    text: 'Utvalda och granskade bilhandlare lämnar sina bästa bud i en sluten auktion. Du ser alla bud i realtid.',
    perks: ['Upp till 500+ certifierade handlare', 'Bud inom 48 timmar', 'Full transparens'],
  },
  {
    num: '03',
    icon: Handshake,
    title: 'Du väljer — vi sköter resten',
    text: 'Välj det bästa budet. Vi ordnar allt från pappersarbete till upphämtning av bilen. Pengarna på kontot direkt.',
    perks: ['Inga dolda avgifter', 'Vi hämtar bilen hemma hos dig', 'Säker betalning'],
  },
];

const GUARANTEES = [
  { icon: Shield, title: 'Kvalitetsgranskade handlare', text: 'Varje handlare kontrolleras noggrant innan de kommer in i vårt nätverk.' },
  { icon: Clock, title: 'Svar inom 24–48 timmar', text: 'Vi vet att din tid är värdefull. Snabb process utan onödig väntan.' },
  { icon: Star, title: 'Genomsnittlig besparing ~15 000 kr', text: 'Jämförelse mot marknadens snittpris visar att våra kunder tjänar mer.' },
  { icon: CheckCircle, title: '100% kostnadsfritt för säljare', text: 'Ingen kostnad för dig som säljer. Vi tar betalt av handlaren.' },
];

export default function SaFunkarDetPage({ onBackHome, onSell }: SaFunkarDetPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [regnummer, setRegnummer] = useState('');
  const [telefon, setTelefon] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scrolled] = useState(false);

  const navItems: MobileMenuItem[] = ['Sälj bil', 'Köp bil', 'Om oss'];

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Köp bil': '/kop-bil',
      'Om oss': '/om-oss',
    };
    if (item === 'Sälj bil') { onBackHome(); return; }
    const r = routes[item];
    if (r) { window.history.pushState({}, '', r); window.dispatchEvent(new PopStateEvent('popstate')); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const regTrim = regnummer.trim().toUpperCase().replace(/\s/g, '');
    const telTrim = telefon.trim();
    if (!regTrim) { setError('Ange ett registreringsnummer'); return; }
    if (!/^[A-Z]{3}[0-9]{2}[A-Z0-9]$/.test(regTrim)) {
      setError('Registreringsnummer måste vara 3 bokstäver + 3 tecken (t.ex. ABC123)');
      return;
    }
    const phoneErr = validateSwedishPhone(telTrim);
    if (phoneErr) { setError(phoneErr); return; }
    setError('');
    setSubmitting(true);
    await supabase.from('leads').insert({ regnummer: regTrim, telefon: telTrim });
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-lead`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefon: telTrim, regnummer: regTrim, source: 'Sa funkar det-sidan' }),
      });
    } catch { /* best effort */ }
    setSubmitting(false);
    onSell?.(regTrim, telTrim);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white antialiased">
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onSelect={handleMenuSelect} />

      {/* Header */}
      <header className={`fixed top-0 inset-x-0 z-30 h-16 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-10">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white"
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              fetchPriority="high"
              decoding="async"
              className="h-20 lg:h-24 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={() => { window.history.pushState({}, '', '/kop-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] font-medium text-white/70 hover:text-white transition">
              Köp bil
            </button>
            <button type="button" onClick={onBackHome} className="text-[15px] font-medium text-white/70 hover:text-white transition">
              Sälj bil
            </button>
            <span className="text-[15px] font-semibold text-white">Så funkar det</span>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => { window.history.pushState({}, '', '/logga-in'); window.dispatchEvent(new PopStateEvent('popstate')); }}
              className="hidden lg:inline-flex items-center gap-2 text-[14px] font-medium text-white/70 hover:text-white transition"
            >
              <User className="w-4 h-4" strokeWidth={2} />
              Logga in
            </button>
            <a
              href="/gratis-konsultation"
              className="inline-flex items-center px-4 py-2 rounded-full text-[12px] lg:text-[13px] font-semibold transition whitespace-nowrap bg-white text-slate-900 hover:bg-white/90"
            >
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 sm:pt-40 pb-20 sm:pb-28 px-5 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/8 text-[12px] font-medium text-white/70 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Enkel, trygg och lönsam bilförsäljning
          </div>
          <h1 className="text-[42px] sm:text-[64px] lg:text-[80px] font-black leading-[0.95] tracking-[-0.03em] text-white mb-7 max-w-3xl">
            Sälj bilen.<br />Så enkelt är det.
          </h1>
          <p className="text-white/50 text-[17px] sm:text-[20px] leading-relaxed max-w-lg mb-12">
            Tre steg. Hundratals bud. Det bästa priset — utan krångel.
          </p>

          {/* Quick form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-5 max-w-xl shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
            <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Värdera din bil gratis</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <RegInput value={regnummer} onChange={(v) => { setRegnummer(v); setError(''); }} disabled={submitting} />
              </div>
              <div className="flex items-center flex-1 h-13 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-slate-400 focus-within:bg-white transition-all">
                <span className="flex items-center justify-center w-11 shrink-0">
                  <Phone className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => { setTelefon(e.target.value); setError(''); }}
                  placeholder="Telefon"
                  autoComplete="tel"
                  disabled={submitting}
                  className="flex-1 min-w-0 w-0 h-full text-[15px] text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="h-13 px-6 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white font-semibold text-[15px] transition whitespace-nowrap"
              >
                {submitting
                  ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Skickar…</span>
                  : 'Kom igång'
                }
              </button>
            </div>
            {error && (
              <p className="mt-2 text-[13px] text-red-600 font-medium">{error}</p>
            )}
            <p className="mt-2 text-slate-400 text-[12px]">Gratis och utan bindning · Svar inom 24h</p>
          </form>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Processen</p>
          <h2 className="text-[32px] sm:text-[48px] font-black text-slate-900 tracking-[-0.025em] leading-[1.05] mb-14 max-w-lg">
            Tre steg till bästa bud.
          </h2>

          <div className="space-y-5">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="group grid md:grid-cols-[80px_1fr_1fr] gap-6 sm:gap-8 items-start bg-slate-50 hover:bg-slate-900 rounded-2xl p-7 sm:p-8 transition-all duration-300">
                  <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-3">
                    <span className="text-[12px] font-bold text-slate-300 group-hover:text-white/30 tabular-nums tracking-wider transition-colors">{step.num}</span>
                    <div className="w-11 h-11 rounded-xl bg-white group-hover:bg-white/10 flex items-center justify-center shadow-sm transition-colors shrink-0">
                      <Icon className="w-5 h-5 text-slate-700 group-hover:text-white transition-colors" strokeWidth={1.8} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[20px] sm:text-[22px] font-bold text-slate-900 group-hover:text-white mb-3 transition-colors">{step.title}</h3>
                    <p className="text-slate-500 group-hover:text-white/60 text-[15px] leading-relaxed transition-colors">{step.text}</p>
                  </div>
                  <ul className="space-y-2 md:pt-8">
                    {step.perks.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-[13px] sm:text-[14px] text-slate-500 group-hover:text-white/70 font-medium transition-colors">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 group-hover:text-emerald-400 shrink-0 transition-colors" strokeWidth={2.5} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-10">
            <button
              onClick={onBackHome}
              className="inline-flex items-center gap-2.5 h-12 px-8 rounded-full bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition group"
            >
              Värdera min bil
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="bg-[#0a0f1a] py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          <p className="text-[12px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-4">Våra garantier</p>
          <h2 className="text-[32px] sm:text-[48px] font-black text-white tracking-[-0.025em] leading-[1.05] mb-14 max-w-xl">
            Byggt för att ge dig mer.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GUARANTEES.map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.title} className="rounded-2xl border border-white/8 bg-white/4 hover:bg-white/8 p-7 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[17px] font-bold text-white mb-2">{g.title}</h3>
                  <p className="text-white/45 text-[14px] leading-relaxed">{g.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-5">Redo?</p>
          <h2 className="text-[36px] sm:text-[52px] font-black text-slate-900 tracking-[-0.025em] leading-[1.0] mb-6">
            Kom igång på<br />under en minut.
          </h2>
          <p className="text-[16px] sm:text-[18px] text-slate-500 leading-relaxed mb-10 max-w-md mx-auto">
            Ange regnummer och telefon — vi tar hand om resten. Gratis och utan bindning.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onBackHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-10 rounded-full bg-slate-900 hover:bg-slate-700 text-white font-bold text-[16px] transition group"
            >
              Värdera min bil gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
            <a
              href="/gratis-konsultation"
              className="w-full sm:w-auto inline-flex items-center justify-center py-4 px-10 rounded-full border-2 border-slate-200 text-slate-700 font-semibold text-[16px] hover:border-slate-400 transition"
            >
              Boka konsultation
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
