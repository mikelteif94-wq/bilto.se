import { useEffect, useState } from 'react';
import {
  Menu,
  ArrowRight,
  Phone,
  ShieldCheck,
  Handshake,
  Gauge,
  Check,
  Sparkles,
  Target,
  Eye,
  Heart,
  ChevronDown,
} from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import ReviewsSection from '../components/ReviewsSection';
import { setPageMeta } from '../lib/pageMeta';
import { PHONE, PHONE_TEL, FOUNDER_PHOTO } from '../config/site';

interface AboutPageProps {
  onBackHome: () => void;
}

const VALUES = [
  {
    icon: Eye,
    title: 'Transparens',
    text: 'Vi visar exakt vad din bil är värd och vad varje handlare erbjuder. Inga dolda påslag, ingen fina svartmagi.',
  },
  {
    icon: Handshake,
    title: 'Rättvisa',
    text: 'Handlaren har alltid haft expertövertaget. Vi lägger en erfaren expert på din sida – så du får det pris din bil faktiskt är värd.',
  },
  {
    icon: Gauge,
    title: 'Effektivitet',
    text: 'Vi sköter värdering, förhandling och upphämtning åt dig. Du slipper timmar av research, samtal och resor.',
  },
];

const STATS = [
  { value: '0 kr', label: 'Kostar för dig som säljare' },
  { value: '24h', label: 'Till första budet' },
  { value: 'Hela Sverige', label: 'Fri upphämtning' },
  { value: '4.9 / 5', label: 'Kundbetyg på Google' },
];

const PROMISES = [
  {
    num: '01',
    title: 'Transparenta bud',
    text: 'Se exakt vad varje handlare erbjuder – utan dolda påslag.',
  },
  {
    num: '02',
    title: 'Tydliga villkor',
    text: 'Inga förvirrande avgifter. Du vet vad affären kostar innan du säger ja.',
  },
  {
    num: '03',
    title: 'Dedikerad rådgivare',
    text: 'En riktig människa finns tillgänglig hela vägen – från värdering till överlämning.',
  },
];

const FAQ = [
  {
    q: 'Vad är Bilto?',
    a: 'Bilto är en tjänst som hjälper privatpersoner sälja sin bil till bästa pris. Vi värderar, förhandlar och granskar åt dig – helt gratis.',
  },
  {
    q: 'Hur tjänar Bilto pengar?',
    a: 'Vi tar en avgift av handlaren som köper din bil, inte av dig. Det betyder att vi alltid jobbar för ditt bästa pris – inte handlarens.',
  },
  {
    q: 'Är Bilto bunden till någon bilhandlare?',
    a: 'Nej. Vi är helt oberoende. Vi låter granskade handlare konkurrera om din bil, och du väljer det bud som passar dig bäst.',
  },
  {
    q: 'Vad händer om jag inte vill sälja?',
    a: 'Du är aldrig bunden. Det kostar ingenting att få en värdering eller ta emot bud – du bestämmer själv om du vill sälja.',
  },
];

export default function AboutPage({ onBackHome }: AboutPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    setPageMeta({
      title: 'Om Bilto – vi förenklar din bilaffär',
      description: 'Bilto grundades för att göra bilaffären transparent och rättvis för privatpersoner. Lär känna teamet och vår vision om en bättre bilmarknad.',
      canonical: 'https://bilto.se/om-oss',
    });
  }, []);

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
    setMenuOpen(false);
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Bilköptjänsten': '/kop-bil',
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

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} active="Om oss" onSelect={handleMenuSelect} />

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
            <button type="button" onClick={() => { window.history.pushState({}, '', '/salj-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 font-medium transition hover:text-white">Säljhjälpen</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/kop-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 font-medium transition hover:text-white">Bilköptjänsten</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/om-oss'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white font-semibold transition hover:text-white/80">Om oss</button>
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

        <div className="relative mx-auto w-full max-w-4xl px-5 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0e6efe]/10 px-4 py-1.5 mb-6">
            <Target className="w-3.5 h-3.5 text-[#0e6efe]" />
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-wider">Vår mission</span>
          </div>
          <h1 className="text-[32px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.06] tracking-[-0.04em] text-slate-800">
            Gör bilaffären transparent.<br className="hidden sm:block" /> Ge kunden makten. Förändra branschen.
          </h1>
          <p className="mt-5 text-[16px] sm:text-[19px] leading-[1.5] text-slate-500 max-w-2xl mx-auto">
            Bilmarknaden har länge präglats av otydliga priser och dolda avgifter. Bilto finns för att ändra på det – en expert på din sida, från värdering till överlämning.
          </p>

          {/* Stats bar */}
          <div className="mt-10 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 rounded-2xl overflow-hidden ring-1 ring-slate-200 text-left">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white px-4 py-5 sm:py-6 text-center transition hover:bg-slate-50">
                <p className="text-[20px] sm:text-[24px] font-bold text-slate-800 tracking-tight tabular-nums">{s.value}</p>
                <p className="text-[11px] sm:text-[12px] text-slate-500 mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why we started ── */}
      <section className="bg-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
                Varför vi startade
              </span>
              <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-800 mb-6">
                Handlaren har alltid haft ett expertövertag. Tills nu.
              </h2>
              <div className="space-y-4 text-slate-500 text-[15px] sm:text-[16px] leading-[1.75]">
                <p>
                  Bilmarknaden har länge präglats av otydliga priser, dolda avgifter och ett informationsövertag på handlarens sida. Vi bestämde oss för att ändra på det.
                </p>
                <p>
                  Bilto är en ny tjänst byggd för transparens – vi ser till att bilaffären är tydlig och rättvis för dig som privatperson, med handlare som granskas noggrant innan de ens tillåts lägga ett bud.
                </p>
                <p>
                  Vi värderar din bil mot marknadsdata, låter granskade handlare buda mot varandra, och förhandlar åt dig. Du jämför, du väljer, du bestämmer.
                </p>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] max-w-[480px] mx-auto w-full ring-1 ring-slate-200 shadow-lg">
              <img
                src="/files_2615643-2026-06-20T00-26-02-459Z-header8.jpg"
                alt="Bilto team"
                className="w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
                width="480"
                height="360"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="bg-gradient-to-b from-white to-[#f7f9ff] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Det vi står för
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-800">
              Tre principer som driver allt vi gör
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {VALUES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col transition hover:shadow-[0_8px_30px_rgba(14,110,254,0.06)] hover:border-slate-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mb-5 shrink-0">
                    <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-800 mb-2 tracking-[-0.01em]">{item.title}</h3>
                  <p className="text-slate-500 leading-[1.65] text-[14px]">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Transparency statement ── */}
      <section className="bg-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-[24px] border-2 border-[#0e6efe] bg-[#f0f5ff]/50 p-8 sm:p-12 lg:p-16 overflow-hidden shadow-[0_8px_30px_rgba(14,110,254,0.08)]">
            <div className="absolute -right-20 -top-20 w-[300px] h-[300px] rounded-full bg-white/40 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
                </div>
                <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em]">
                  Transparensdeklaration
                </span>
              </div>
              <h2 className="text-[24px] sm:text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-slate-800 mb-5">
                Många bilaffärstjänster ser ut att vara på din sida. Det är de inte.
              </h2>
              <p className="text-slate-600 text-[15px] sm:text-[17px] leading-[1.7] mb-4">
                Affärsmodellen att "se ut som den snälla" och sedan utsätta kunden för orättvisa och ineffektiva metoder är det som plågar bilbranschen.
              </p>
              <p className="text-slate-600 text-[15px] sm:text-[17px] leading-[1.7]">
                Bilto gör inte så. Vi tar betalt av handlaren, inte av dig. Det betyder att vi alltid jobbar för ditt bästa pris – inte handlarens. Vi granskar varje villkor, synar varje avgift och förhandlar åt dig. Det är så en bilafför ska fungera.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our promise ── */}
      <section className="bg-gradient-to-b from-[#f7f9ff] to-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Vårt löfte
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-800">
              Vad du alltid kan förvänta dig av oss
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {PROMISES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 transition hover:shadow-[0_8px_30px_rgba(14,110,254,0.06)] hover:border-slate-300"
              >
                <p className="text-[28px] font-bold text-[#0e6efe]/30 tabular-nums mb-3">{item.num}</p>
                <h3 className="text-[16px] font-bold text-slate-800 mb-2 tracking-[-0.01em]">{item.title}</h3>
                <p className="text-slate-500 leading-[1.65] text-[14px]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder ── */}
      <section className="bg-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] max-w-[400px] mx-auto w-full ring-1 ring-slate-200 shadow-lg">
              {FOUNDER_PHOTO ? (
                <img
                  src={FOUNDER_PHOTO}
                  alt="Grundare"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  width="400"
                  height="500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                  <span className="text-[13px] text-slate-400 font-medium">Foto kommer</span>
                </div>
              )}
            </div>
            <div>
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
                Grundaren
              </span>
              <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-800 mb-4">
                Människan bakom Bilto
              </h2>
              <p className="text-slate-500 text-[15px] sm:text-[16px] leading-[1.75] mb-6">
                Bilto grundades med en enkel idé: ge privatpersoner samma expertstöd som handlarna har haft i decennier. Med erfarenhet från bilbranschen och en vilja att förändra status quo skapades en plattform där kunden alltid kommer först.
              </p>
              <ul className="space-y-3">
                {[
                  'Oberoende – vi är inte bundna till någon handlare',
                  'Kundens intresse först, alltid',
                  'Transparens i varje steg av processen',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-slate-700">
                    <Check className="w-4 h-4 mt-0.5 text-[#0e6efe] shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <ReviewsSection variant="muted" />

      {/* ── FAQ ── */}
      <section className="bg-gradient-to-b from-white to-[#f7f9ff] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 sm:mb-14 text-center">
            <p className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">Vanliga frågor</p>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-800 tracking-[-0.03em] leading-[1.08]">
              Vanliga frågor om Bilto
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
            <div className="absolute -right-20 -top-20 w-[360px] h-[360px] rounded-full bg-[#f0f5ff] pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0e6efe]/10 px-4 py-1.5 mb-6">
                <Heart className="w-3.5 h-3.5 text-[#0e6efe]" />
                <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-wider">Börja gratis</span>
              </div>
              <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold tracking-[-0.03em] leading-[1.06] text-slate-800 mb-4">
                Så här ska en bilaffär fungera.
              </h2>
              <p className="text-slate-500 text-[16px] sm:text-[19px] leading-[1.5] mb-8 max-w-lg mx-auto">
                Få en gratis värdering och se vad din bil är värd. Ingen bindning, ingen kostnad.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/salj-bil"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#0e6efe] text-white text-[15px] font-bold transition hover:bg-[#0a57cc] active:scale-[0.98] shadow-lg shadow-[#0e6efe]/25"
                >
                  Värdera min bil gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
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
        </div>
      </section>

      <SiteFooter />

      {scrolled && (
        <a
          href={PHONE_TEL}
          className="md:hidden fixed bottom-4 left-3 right-3 z-40 flex items-center gap-3 px-4 h-[58px] rounded bg-[#0e6efe] active:bg-[#0047B3] text-white font-semibold text-[15px] shadow-[0_8px_24px_rgba(14,110,254,0.45)] transition-all duration-200 overflow-hidden"
        >
          <div className="shrink-0">
            <Phone className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[15px] font-bold tracking-[-0.01em] truncate">Ring oss</span>
            <span className="text-[11px] text-white/70 font-normal">Gratis &middot; svar direkt</span>
          </div>
          <div className="ml-auto shrink-0 flex items-center gap-1.5 bg-white/15 rounded px-3 py-1.5">
            <span className="text-[13px] font-semibold">{PHONE}</span>
          </div>
        </a>
      )}
    </div>
  );
}
