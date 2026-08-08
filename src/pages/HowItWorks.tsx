import { useState, useEffect, lazy, Suspense } from 'react';
import { useRef } from 'react';
import {
  Menu,
  ArrowRight,
  Gavel,
  Phone,
  Handshake,
  Check,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronRight,
  X,
  XCircle,
  Car as CarIcon,
  Search,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import ReviewsSection from '../components/ReviewsSection';
import RegInput from '../components/RegInput';
import { PHONE, PHONE_TEL, EXPERT_PHOTO } from '../config/site';
import { setPageMeta } from '../lib/pageMeta';

const BuyDrawer = lazy(() => import('../components/BuyDrawer'));

interface HowItWorksProps {
  onBackHome: () => void;
  onQuickLead?: (regnummer: string, telefon: string) => void;
  onSell?: (regnummer: string) => void;
  showSeo?: boolean;
  pageTitle?: string;
  seoSlug?: 'home' | 'sa-funkar-det' | 'salj-bil';
}

const STEPS = [
  {
    icon: Search,
    title: 'Skriv in regnumret',
    text: 'Vi värderar din bil gratis mot marknadsdata – opartiskt och utan bindning.',
  },
  {
    icon: Gavel,
    title: 'Vi tar in bud från handlare',
    text: 'Granskade bilhandlare konkurrerar om din bil. Vi förhandlar och presenterar det bästa budet.',
  },
  {
    icon: Handshake,
    title: 'Du väljer – vi sköter resten',
    text: 'Tackar du ja hämtar vi bilen gratis och pengarna landar på ditt konto. Noll krångel.',
  },
];

const STEP_IMAGES = [
  '/ChatGPT_Image_20_maj_2026_02_01_19.png',
  '/e66827b0-71c5-48a7-8d91-5123f7db4a0d.png',
  '/55e96830-06e0-436b-8559-63a5b9cf41af.png',
];

const FAQ = [
  {
    q: 'Vad kostar det att sälja via Bilto?',
    a: 'Det är helt gratis för dig. Vi tar en avgift av handlaren som köper din bil. Inga dolda kostnader, noll provision.',
  },
  {
    q: 'Hur snabbt får jag ett bud?',
    a: 'De flesta får det första budet inom 24 timmar. Inom 3–5 dagar har du oftast flera bud att välja mellan.',
  },
  {
    q: 'Måste jag acceptera ett bud?',
    a: 'Aldrig. Du är helt fri att tacka nej. Det kostar ingenting att avstå – du bestämmer själv om du vill sälja.',
  },
  {
    q: 'Vem hämtar bilen?',
    a: 'Vi ordnar upphämtning på en plats som passar dig – var som helst i Sverige. Det är gratis och ingår i tjänsten.',
  },
  {
    q: 'När får jag pengarna?',
    a: 'Pengarna landar på ditt konto innan du lämnar över bilen. Vid förmedling betalas slutpriset ut inom 1–3 bankdagar.',
  },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, title: 'Granskade handlare', text: 'Endast auktoriserade bilhandlare med dokumenterad historik deltar.' },
  { icon: Clock, title: 'Snabb utbetalning', text: 'Pengarna landar på ditt konto innan du lämnar över bilen.' },
  { icon: Check, title: 'Noll förpliktelse', text: 'Du är aldrig bunden att sälja. Tacka nej kostnadsfritt.' },
];

export default function HowItWorks({ onBackHome, onSell, showSeo = false, pageTitle, seoSlug }: HowItWorksProps) {
  useEffect(() => {
    if (seoSlug === 'sa-funkar-det') {
      setPageMeta({
        title: 'Så funkar Bilto – sälj din bil med expert',
        description: 'Se hur Bilto hjälper dig sälja bilen till bästa pris. Gratis värdering – ingen bindning.',
        canonical: 'https://bilto.se/sa-funkar-det',
      });
    } else if (seoSlug === 'salj-bil' || showSeo) {
      setPageMeta({
        title: 'Sälj din bil snabbt – handlare konkurrerar om priset | Bilto',
        description: 'Sälj bilen via Bilto och få bud från granskade bilhandlare. Gratis värdering, fri upphämtning och pengarna direkt på kontot.',
        canonical: seoSlug === 'salj-bil' ? 'https://bilto.se/salj-bil' : 'https://bilto.se/salj-din-bil',
      });
    } else if (pageTitle) {
      document.title = pageTitle;
    } else {
      setPageMeta({
        title: 'Sälj din bil till bästa pris – granskade handlare bjuder | Bilto',
        description: 'Gratis värdering av din bil – certifierade handlare konkurrerar om att ge dig bästa pris. Betala ingenting, sälj tryggt.',
        canonical: 'https://bilto.se/',
      });
    }
  }, [showSeo, pageTitle, seoSlug]);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [regnummer, setRegnummer] = useState('');
  const [formError, setFormError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [buyDrawerCar, setBuyDrawerCar] = useState<string | null>(null);
  const [buyDrawerTrack, setBuyDrawerTrack] = useState<'found' | 'searching' | 'trade' | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => {
      const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMenuSelect = (item: MobileMenuItem) => {
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Köp bil': '/kop-bil',
      'Köp bil med hjälp': '/kop-bil',
      'Bilköpshjälpen': '/kop-bil',
      'Guider': '/guider',
      'Priser': '/priser',
      'Vanliga frågor': '/vanliga-fragor',
    };
    const route = routes[item];
    if (route) {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onBackHome();
  };

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reg = regnummer.trim().toUpperCase().replace(/\s/g, '');
    if (!reg) {
      setFormError('Ange registreringsnummer');
      return;
    }
    if (!/^[A-Z]{3}[0-9]{2}[A-Z0-9]$/.test(reg)) {
      setFormError('Registreringsnummer måste vara 3 bokstäver följt av 3 tecken (t.ex. ABC123)');
      return;
    }
    setFormError('');
    if (onSell) {
      onSell(reg);
    } else {
      setBuyDrawerCar(reg);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Sälj bil"
        onSelect={handleMenuSelect}
      />

      {/* ── Nav ── */}
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white"
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={() => { window.history.pushState({}, '', '/salj-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white font-semibold transition hover:text-white/80">Säljhjälpen</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/kop-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 font-medium transition hover:text-white">Bilköpshjälpen</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/om-oss'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 font-medium transition hover:text-white">Om oss</button>
          </nav>
          <div className="flex items-center ml-auto">
            <a
              href="/gratis-konsultation"
              className="inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap"
            >
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f5ff] via-[#f7f9ff] to-white pt-28 sm:pt-36 pb-16 sm:pb-24">
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-[#0e6efe]/[0.05] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-[#69a8ff]/[0.06] blur-3xl pointer-events-none" />

        <div className="relative mx-auto w-full max-w-3xl px-5 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0e6efe]/10 px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#0e6efe]" />
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-wider">Gratis värdering – ingen bindning</span>
          </div>
          <h1 className="text-[32px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.06] tracking-[-0.04em] text-slate-800">
            Sälj din bil till bästa pris.
          </h1>
          <p className="mt-5 text-[16px] sm:text-[19px] leading-[1.5] text-slate-500 max-w-xl mx-auto">
            Vi värderar, förhandlar och granskar åt dig. Du bestämmer.
          </p>

          {/* Reg input card */}
          <div className="relative max-w-xl mx-auto mt-10 rounded-[24px] border border-slate-200 bg-white p-5 sm:p-7 shadow-[0_20px_60px_rgba(14,110,254,0.10)] text-left">
            <form onSubmit={handleHeroSubmit} className="flex flex-col gap-2.5">
              <RegInput size="sm" value={regnummer} onChange={(v) => { setRegnummer(v); setFormError(''); }} />
              {formError && (
                <div role="alert" className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-medium px-2.5 py-1.5">
                  <XCircle className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                  <span className="leading-snug">{formError}</span>
                </div>
              )}
              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white font-bold text-[16px] transition-all inline-flex items-center justify-center gap-2 shadow-[0_4px_18px_-4px_rgba(14,110,254,0.5)]"
              >
                Värdera bilen
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <p className="mt-3 text-center text-[12px] text-slate-500">Ingen kostnad förrän affären är klar</p>
          </div>

          {/* Stats bar */}
          <div className="mt-10 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 rounded-2xl overflow-hidden ring-1 ring-slate-200 text-left">
            {[
              { value: '0 kr', label: 'Kostar för dig som säljare' },
              { value: '24h', label: 'Till första budet' },
              { value: 'Hela Sverige', label: 'Fri upphämtning' },
              { value: '4.9 / 5', label: 'Kundbetyg på Google' },
            ].map((s) => (
              <div key={s.label} className="bg-white px-4 py-5 sm:py-6 text-center transition hover:bg-slate-50">
                <p className="text-[20px] sm:text-[24px] font-bold text-slate-800 tracking-tight tabular-nums">{s.value}</p>
                <p className="text-[11px] sm:text-[12px] text-slate-500 mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Så enkelt är det ── */}
      <section className="bg-gradient-to-b from-white to-[#f7f9ff] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Hur det fungerar
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-800">
              Så enkelt säljer du din bil
            </h2>
          </div>

          <ol className="hidden sm:grid sm:grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((step, i) => {
              const img = STEP_IMAGES[i];
              const Icon = step.icon;
              return (
                <li key={step.title} className="group">
                  {img && (
                    <div className="rounded-2xl overflow-hidden aspect-[16/10] mb-6 shadow-sm ring-1 ring-slate-200">
                      <img
                        src={img}
                        alt={step.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                        width="480"
                        height="300"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
                    </div>
                    <span className="text-[13px] font-bold text-[#0e6efe] tabular-nums">0{i + 1}</span>
                  </div>
                  <h3 className="text-[19px] sm:text-[22px] font-bold text-slate-800 leading-tight tracking-[-0.01em] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 text-[15px] leading-[1.65]">{step.text}</p>
                </li>
              );
            })}
          </ol>

          {/* Mobile steps */}
          <div className="sm:hidden space-y-8">
            {STEPS.map((step, i) => {
              const img = STEP_IMAGES[i];
              const Icon = step.icon;
              return (
                <div key={step.title}>
                  {img && (
                    <div className="rounded-2xl overflow-hidden aspect-[16/10] mb-4 shadow-sm ring-1 ring-slate-200">
                      <img src={img} alt={step.title} className="w-full h-full object-cover" loading="lazy" decoding="async" width="300" height="188" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
                    </div>
                    <span className="text-[13px] font-bold text-[#0e6efe] tabular-nums">0{i + 1}</span>
                  </div>
                  <h3 className="text-[18px] font-bold text-slate-800 leading-tight mb-1.5">{step.title}</h3>
                  <p className="text-slate-500 text-[14px] leading-[1.6]">{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trygghet ── */}
      <section className="bg-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Trygghet
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-800 tracking-[-0.03em] leading-[1.08]">
              Din partner för en trygg bilaffär
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {TRUST_BADGES.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 flex flex-col transition hover:shadow-[0_8px_30px_rgba(14,110,254,0.06)] hover:border-slate-300">
                  <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mb-5 shrink-0">
                    <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-800 mb-2 tracking-[-0.01em]">{b.title}</h3>
                  <p className="text-slate-500 leading-[1.65] text-[14px]">{b.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ReviewsSection variant="muted" />

      {/* ── FAQ ── */}
      <section className="bg-gradient-to-b from-[#f7f9ff] to-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 sm:mb-14 text-center">
            <p className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">Vanliga frågor</p>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-800 tracking-[-0.03em] leading-[1.08]">
              Vanliga frågor – vi svarar rakt på sak
            </h2>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200 rounded-2xl overflow-hidden bg-white">
            {FAQ.map((item, idx) => {
              const open = openFaq === idx;
              return (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => setOpenFaq(open ? null : idx)}
                  className="w-full text-left py-5 px-5 sm:px-6 flex items-start gap-4 group transition hover:bg-slate-50"
                >
                  <div className="flex-1">
                    <h3 className="text-[15px] sm:text-[17px] font-semibold text-slate-800 leading-snug">{item.q}</h3>
                    {open && (
                      <p className="mt-3 text-[14px] sm:text-[15px] text-slate-500 leading-[1.5]">{item.a}</p>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180 text-[#0e6efe]' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-[#f7f9ff] px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[24px] border border-[#0e6efe]/30 bg-white px-6 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14 overflow-hidden shadow-[0_20px_60px_rgba(14,110,254,0.08)] text-center">
            <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold tracking-[-0.03em] leading-[1.06] text-slate-800 mb-4">
              Så här ska bilsälj fungera.
            </h2>
            <p className="text-slate-500 text-[16px] sm:text-[19px] leading-[1.5] mb-8 max-w-lg mx-auto">
              Börja med en gratis värdering. Vi berättar exakt vad din bil är värd – utan bindning.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#0e6efe] text-white text-[15px] font-bold transition hover:bg-[#0a57cc] active:scale-[0.98] shadow-lg shadow-[#0e6efe]/25"
              >
                Värdera min bil gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <a
                href={PHONE_TEL}
                className="inline-flex items-center justify-center h-12 px-7 rounded-xl border-2 border-slate-200 text-slate-700 text-[15px] font-semibold transition hover:border-slate-900 hover:bg-slate-900 hover:text-white active:scale-[0.98]"
              >
                <Phone className="w-4 h-4 mr-2 shrink-0" strokeWidth={2.5} />
                Ring {PHONE}
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      {scrolled && (
        <a
          href={PHONE_TEL}
          className="md:hidden fixed bottom-4 left-3 right-3 z-40 flex items-center gap-3 px-4 h-[58px] rounded bg-[#0e6efe] active:bg-[#0047B3] text-white font-semibold text-[15px] shadow-[0_8px_24px_rgba(14,110,254,0.45)] transition-all duration-200 overflow-hidden"
        >
          <div className="relative shrink-0">
            <img src={EXPERT_PHOTO} alt="Expert" className="w-9 h-9 rounded object-cover object-top border-2 border-white/30" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[15px] font-bold tracking-[-0.01em] truncate">Ring expert nu</span>
            <span className="text-[11px] text-white/70 font-normal">Gratis &middot; svar direkt</span>
          </div>
          <div className="ml-auto shrink-0 flex items-center gap-1.5 bg-white/15 rounded px-3 py-1.5">
            <Phone className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="text-[13px] font-semibold">Ring</span>
          </div>
        </a>
      )}

      <Suspense fallback={null}>
        <BuyDrawer
          car={buyDrawerCar}
          initialTrack={buyDrawerTrack}
          onClose={() => { setBuyDrawerCar(null); setBuyDrawerTrack(undefined); }}
        />
      </Suspense>
    </div>
  );
}
