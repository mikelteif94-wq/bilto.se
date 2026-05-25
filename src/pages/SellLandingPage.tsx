import { useState, useEffect, useRef } from 'react';
import {
  Menu, User, ArrowRight, Search, Gavel, Phone, Handshake, Check, ShieldCheck, Clock,
  ChevronDown, Plus, MessageCircle, X, XCircle,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import ReviewsSection from '../components/ReviewsSection';
import SeoCarsSection from '../components/SeoCarsSection';
import RegInput from '../components/RegInput';

interface SellLandingPageProps {
  onBackHome: () => void;
  onSell?: (regnummer: string) => void;
  showSeo?: boolean;
  pageTitle?: string;
}

interface Step {
  icon: typeof Search;
  title: string;
  text: string;
}

const DIRECT_STEPS: Step[] = [
  {
    icon: Search,
    title: 'Värdera bilen',
    text: 'Fyll i registreringsnummer och berätta om bilens skick. Vi hämtar grundinfo automatiskt.',
  },
  {
    icon: Gavel,
    title: 'Få budet',
    text: 'Granskade bilhandlare lämnar anbud. Din personliga rådgivare presenterar det bästa erbjudandet.',
  },
  {
    icon: Handshake,
    title: 'Acceptera och sälj',
    text: 'Tacka ja när du är nöjd. Vi sköter kontraktet och bokar upphämtning — utan krångel.',
  },
];

const DIRECT_STEP_IMAGES = [
  '/ChatGPT_Image_20_maj_2026_02_01_19.png',
  '/d158d2d6-7209-4239-986d-842219ae491d.jpg',
  '/BSM_car_sale_key_woman_handover_101122.jpg',
];

const FAQ = [
  {
    q: 'Vad kostar det att sälja bilen via Bilto?',
    a: 'Det är helt gratis för privatpersoner att sälja via Bilto. Vi tar en provision från handlaren när affären genomförs — du betalar ingenting.',
  },
  {
    q: 'Hur snabbt kan jag sälja min bil?',
    a: 'I regel inom 24–72 timmar. Så fort din bil är registrerad och handlare har bjudit presenterar vi det bästa budet för dig.',
  },
  {
    q: 'Behöver jag ha bilen på något specifikt ställe?',
    a: 'Nej. Vi bokar upphämtning på en plats som passar dig — hemma, jobbet eller annan adress i hela Sverige.',
  },
  {
    q: 'Kan jag sälja även om bilen har lån?',
    a: 'Ja. Vi hjälper till med inlösen av lån i samband med affären. Eventuell mellanskillnad betalas ut eller dras av beroende på situation.',
  },
  {
    q: 'Vilka bilar köper Bilto?',
    a: 'Vi hjälper till att sälja de flesta personbilar, SUV:ar, kombibilar, elbilar och hybridbilar. Kontakta oss om du är osäker på just din bil.',
  },
  {
    q: 'Hur fungerar betalningen?',
    a: 'Pengarna landar på ditt konto innan bilen lämnas över. Ingen förskottsbetalning krävs från din sida.',
  },
];

function DirectStepsMobile({ steps, images }: { steps: Step[]; images: string[] }) {
  const [active, setActive] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const cardWidth = el.scrollWidth / steps.length;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActive(Math.min(Math.max(idx, 0), steps.length - 1));
  };

  return (
    <div className="sm:hidden mb-10 -mx-5">
      <div
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-5 pb-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        onScroll={handleScroll}
      >
        {steps.map((step, i) => (
          <div key={i} className="snap-center shrink-0 w-[82vw] max-w-[340px]">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-md">
              <img src={images[i]} alt={step.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 w-9 h-9 rounded-xl bg-[#0e6efe] flex items-center justify-center shadow-lg">
                <span className="text-white text-[14px] font-bold tabular-nums">{i + 1}</span>
              </div>
            </div>
            <div className="px-1 pt-4 pb-2">
              <h3 className="text-[18px] font-bold text-slate-900 leading-tight tracking-tight mb-1.5">{step.title}</h3>
              <p className="text-[14px] text-slate-600 leading-[1.6]">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`transition-all duration-300 rounded-full ${i === active ? 'w-6 h-2 bg-[#0e6efe]' : 'w-2 h-2 bg-slate-300'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function SellLandingPage({ onBackHome, onSell, showSeo = false, pageTitle }: SellLandingPageProps) {
  useEffect(() => {
    document.title = pageTitle ?? 'Sälj din bil | Bilto';
  }, [pageTitle]);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [regnummer, setRegnummer] = useState('');
  const [formError, setFormError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reg = regnummer.trim().toUpperCase().replace(/\s/g, '');
    if (!reg) { setFormError('Ange registreringsnummer'); return; }
    if (!/^[A-Z]{3}[0-9]{2}[A-Z0-9]$/.test(reg)) {
      setFormError('Registreringsnummer måste vara 3 bokstäver följt av 3 tecken (t.ex. ABC123)');
      return;
    }
    setFormError('');
    if (onSell) onSell(reg);
  };

  const handleMenuSelect = (item: MobileMenuItem) => {
    if (item === 'Sälj bil') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (item === 'Köp bil') {
      window.history.pushState({}, '', '/kop-bil');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onBackHome();
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Sälj bil"
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
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
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
            {['Sälj bil', 'Köp bil'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === 'Sälj bil') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
                  window.history.pushState({}, '', '/kop-bil');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className={`text-[15px] transition ${item === 'Sälj bil' ? 'text-white font-semibold' : 'text-white/80 hover:text-white'}`}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center ml-auto">
            <a
              href="/logga-in"
              className="inline-flex items-center gap-2 bg-white text-[#0e6efe] text-[14px] font-semibold px-5 h-10 rounded-full hover:bg-slate-100 transition whitespace-nowrap"
            >
              <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
              Mina erbjudanden
            </a>
          </div>
        </div>
      </header>

      {/* Mobile hero */}
      <section className="lg:hidden pt-16 relative bg-[#0e6efe] overflow-hidden">
        <img
          src="/manrope_(1920_x_1080_px)_(Instagram_Post_(34))_(2).png"
          alt=""
          aria-hidden="true"
          className="absolute -left-24 -top-6 w-[280px] h-[280px] object-contain pointer-events-none select-none opacity-30"
        />
        <div className="absolute -right-20 top-80 w-[240px] h-[240px] rounded-full bg-[#3d8cff] opacity-50" />
        <div className="relative px-6 pt-4 pb-10">
          <div className="flex items-center justify-center mb-3">
            <img
              src="/module-4-img.ce21cba7.svg"
              alt=""
              loading="eager"
              fetchPriority="high"
              className="w-full h-auto max-h-[150px] object-contain"
            />
          </div>
          <h1 className="text-center text-white text-[30px] font-semibold leading-[1.1] tracking-tight">
            Sälj din bil enkelt och tryggt
          </h1>
          <p className="mt-4 text-center text-white/85 text-[15px] leading-[1.6] px-2">
            Vi sköter hela affären — du väljer bara om du vill sälja.
          </p>
          <div className="mt-6 bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.4)] overflow-hidden">
            <div className="px-4 pb-5 pt-5">
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
                  className="h-11 w-full rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white font-bold text-[14px] tracking-wide transition-all inline-flex items-center justify-center gap-2 shadow-[0_4px_18px_-4px_rgba(14,110,254,0.6)]"
                >
                  Värdera bilen gratis
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <p className="mt-3 text-center text-[11px] text-slate-400">Gratis &middot; Ingen förpliktelse &middot; Svar inom 24h</p>
            </div>
          </div>
        </div>
      </section>

      {/* Desktop hero */}
      <section className="hidden lg:block relative bg-[#0e6efe] pt-28 pb-32 overflow-hidden">
        <div className="absolute -left-40 top-20 w-[620px] h-[620px] rounded-full bg-[#3d8cff] opacity-60" />
        <div className="absolute right-10 -bottom-40 w-[560px] h-[560px] rounded-full bg-[#3d8cff] opacity-50" />
        <img
          src="/manrope_(1920_x_1080_px)_(Instagram_Post_(34))_(2).png"
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 top-0 w-[780px] h-[780px] object-contain pointer-events-none select-none opacity-40"
        />
        <div className="relative max-w-[1280px] mx-auto px-6 grid grid-cols-[1.1fr_0.9fr] gap-14 items-center">
          <div>
            <h1 className="text-white text-[56px] font-semibold leading-[1.05] tracking-tight">
              Sälj din bil enkelt och tryggt
            </h1>
            <ul className="mt-8 space-y-4 text-[19px] font-medium text-white">
              <li className="flex items-center gap-3">
                <Check className="w-7 h-7 text-white shrink-0" strokeWidth={3} />
                Gratis värdering på under 60 sekunder
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-7 h-7 text-white shrink-0" strokeWidth={3} />
                Anbud från granskade bilhandlare
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-7 h-7 text-white shrink-0" strokeWidth={3} />
                Vi hämtar bilen — du slipper krångel
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] overflow-hidden max-w-[440px] w-full justify-self-end">
            <div className="px-5 py-6">
              <p className="text-[13px] font-semibold text-slate-500 mb-3">Ange registreringsnummer</p>
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
                  className="h-11 w-full rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white font-bold text-[14px] transition-all inline-flex items-center justify-center gap-2 shadow-[0_4px_18px_-4px_rgba(14,110,254,0.6)]"
                >
                  Värdera bilen gratis
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <p className="mt-3 text-center text-[11px] text-slate-400">Gratis &middot; Ingen förpliktelse &middot; Svar inom 24h</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="sa-fungerar-det" className="bg-[#f5f8fc] py-16 sm:py-24 sm:overflow-hidden px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-16">
            <h2 className="text-[28px] sm:text-[38px] font-semibold leading-[1.08] text-slate-900 tracking-[-0.02em]">
              Så enkelt är det
            </h2>
          </div>
          <DirectStepsMobile steps={DIRECT_STEPS} images={DIRECT_STEP_IMAGES} />
          <ol className="hidden sm:grid lg:gap-10 sm:grid-cols-3 gap-8">
            {DIRECT_STEPS.map((step, i) => {
              const Icon = step.icon;
              const img = DIRECT_STEP_IMAGES[i];
              return (
                <li key={step.title} className="group">
                  {img && (
                    <div className="rounded-2xl overflow-hidden aspect-[16/10] mb-5 shadow-md">
                      <img src={img} alt={step.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                    </div>
                  )}
                  <div className="flex items-baseline gap-2.5 mb-2">
                    <span className="text-[13px] font-bold text-[#0e6efe] tabular-nums">0{i + 1}</span>
                    <h3 className="text-[16px] font-semibold text-slate-900 leading-tight tracking-[-0.01em]">{step.title}</h3>
                  </div>
                  <p className="text-slate-600 text-[15px] leading-[1.6]">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Personal advisor */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-14 sm:py-20">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
                Personlig rådgivare
              </span>
              <h2 className="text-[28px] sm:text-[38px] font-semibold leading-[1.08] text-slate-900 tracking-[-0.02em]">
                Din personliga rådgivare
              </h2>
              <p className="text-slate-600 mt-4 text-[15px] leading-[1.6]">
                En dedikerad rådgivare jämför bud från utvalda bilhandlare och presenterar det bästa erbjudandet — du slipper samtal och förhandlingar.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Samma kontaktperson hela vägen',
                  'Du slipper samtal från olika bilhandlare',
                  'Vi sköter kontakten och förhandlingen åt dig',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-slate-700">
                    <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-7">
              <div className="relative rounded-2xl overflow-hidden aspect-square max-w-[520px] mx-auto">
                <img src="/13ccde8b-copy-copy.png" alt="Personlig rådgivare" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="hidden md:block absolute md:right-5 md:bottom-5 md:max-w-sm bg-white rounded-xl p-5 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center">
                      <Phone className="w-4 h-4" strokeWidth={2.25} />
                    </div>
                    <div className="text-[13px] font-semibold text-slate-900">En rådgivare återkommer till dig</div>
                  </div>
                  <p className="text-[14px] text-slate-600 leading-[1.55]">Vi svarar alltid — en rådgivare finns här för att guida dig genom hela processen.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pickup all of Sweden */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-14 sm:py-20">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="rounded-[32px] overflow-hidden bg-[#efe7dc] order-2 md:order-1">
              <img
                src="/ee2543a0-987e-446d-9c5e-edb20859e84d.png"
                alt="Karta över Sverige med upphämtningsorter"
                className="w-full h-auto block"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="order-1 md:order-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
                Hämtning i hela Sverige
              </span>
              <h2 className="text-[28px] sm:text-[38px] font-semibold leading-[1.08] text-slate-900 tracking-[-0.02em]">
                Vi gör det enkelt att sälja bilen, oavsett var du bor
              </h2>
              <p className="text-slate-600 mt-4 text-[15px] leading-[1.6]">
                När du accepterar ett bud bokar vi upphämtning på en plats som passar dig. Du slipper stress, krångel och onödiga resor – bilen hämtas tryggt och smidigt.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Vi hämtar där det passar dig',
                  'Trygg upphämtning utan krångel',
                  'Ingen upphämtningsavgift',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-slate-800">
                    <Check className="w-4 h-4 text-[#0e6efe] shrink-0 mt-0.5" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Bilto */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
          <div className="mb-12 sm:mb-16 max-w-2xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
              Varför Bilto
            </span>
            <h2 className="text-[28px] sm:text-[38px] font-semibold text-slate-900 tracking-[-0.02em] leading-[1.08]">
              Din partner för en trygg och smart bilaffär.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden ring-1 ring-slate-200">
            {[
              {
                icon: ShieldCheck,
                title: 'Granskade handlare',
                text: 'Endast auktoriserade bilhandlare med dokumenterad historik deltar. Vi granskar företag, omdömen och tidigare affärer innan någon får lägga ett bud på din bil — så du alltid vet att köparen är seriös.',
              },
              {
                icon: Clock,
                title: 'Snabb utbetalning',
                text: 'Pengarna landar på ditt konto innan du lämnar över bilen. Vid förmedling betalas slutpriset ut inom 1–3 bankdagar. Inga dolda kostnader – bara en transparent affär.',
              },
              {
                icon: Check,
                title: 'Ingen förpliktelse',
                text: 'Du är aldrig bunden att sälja. Tacka nej till budet om du inte är nöjd – det kostar dig ingenting att avstå. Du bestämmer alltid själv om affären ska gå vidare.',
              },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white p-8 sm:p-10 flex flex-col">
                  <Icon className="w-7 h-7 text-[#0e6efe] mb-6" strokeWidth={1.75} />
                  <h3 className="text-[16px] font-semibold text-slate-900 mb-3 tracking-[-0.01em]">{b.title}</h3>
                  <p className="text-slate-600 leading-[1.6] text-[15px]">{b.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA with expert */}
      <section className="bg-white px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[28px] sm:rounded-[56px] bg-[#0e6efe] px-5 py-8 sm:px-14 sm:py-12 lg:px-20 lg:py-14">
            <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="text-white">
                <h2 className="text-[28px] sm:text-[38px] font-semibold tracking-[-0.02em] leading-[1.08] text-white">
                  Ring våra bilexperter
                </h2>
                <p className="mt-4 text-[15px] text-white leading-[1.6] max-w-md">
                  Har du frågor om din bilaffär? Ring oss direkt så hjälper vår bilexpert dig. Kostnadsfritt och helt utan förpliktelse.
                </p>
                <a
                  href="tel:+46855550200"
                  className="mt-6 sm:mt-8 inline-flex items-center gap-2.5 bg-white hover:bg-slate-100 text-[#0e6efe] font-semibold text-[15px] px-7 h-[52px] rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5"
                >
                  <Phone className="w-5 h-5 text-[#0e6efe]" strokeWidth={2.5} />
                  Ring 08-5555 0200
                </a>
              </div>
              <div className="relative">
                <div className="relative aspect-[5/4] rounded-[28px] sm:rounded-[36px] overflow-hidden">
                  <img src="/858c5bbb-bilto-hoodie.png" alt="Bilexpert" className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0e6efe] ring-[6px] ring-white text-white flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
                </div>
                <div className="hidden sm:block absolute bottom-4 right-4 sm:-bottom-6 sm:-right-4 bg-white rounded-2xl shadow-xl p-4 w-[230px]">
                  <div className="flex items-center gap-3">
                    <span className="relative shrink-0">
                      <span className="absolute -inset-1 rounded-full bg-[#0e6efe]/25 opacity-75 animate-ping" />
                      <img
                        src="https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop"
                        alt="Din expert"
                        className="relative w-11 h-11 rounded-full object-cover ring-2 ring-white shadow"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.12em]">Ring våra bilexperter</p>
                      <p className="mt-0.5 text-[14px] font-semibold text-slate-900 leading-tight">Vi finns här för att guida dig</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 md:border-t md:border-slate-100 pt-3">
                    <span className="relative flex w-2.5 h-2.5">
                      <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[12px] text-slate-600">Expert tillgänglig nu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-5 order-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
                Kundcase
              </span>
              <h2 className="text-[28px] sm:text-[38px] font-semibold leading-[1.08] text-slate-900 tracking-[-0.02em]">
                "Bilto fick 32 000 kr mer för min bil än vad jag trodde var möjligt."
              </h2>
              <p className="text-slate-600 mt-4 text-[15px] leading-[1.6] max-w-md">
                Marcus hade en BMW 3-serie som han ville sälja snabbt. Bilto ordnade bud från fem handlare på 48 timmar och förhandlade upp det bästa erbjudandet ytterligare 8 000 kr. Bilen hämtades hemma hos honom.
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { label: 'Bud inom', value: '48h' },
                  { label: 'Extra förhandlat', value: '+8 000 kr' },
                  { label: 'Handlare tävlade', value: '5 st' },
                  { label: 'Upphämtning', value: 'hemma' },
                ].map((item) => (
                  <div key={item.label} className="bg-[#0e6efe] rounded-xl px-4 py-3">
                    <p className="text-[11px] font-semibold text-white/70 uppercase tracking-[0.1em]">{item.label}</p>
                    <p className="text-[17px] font-bold text-white mt-0.5">{item.value}</p>
                  </div>
                ))}
              </dl>
              <p className="text-[13px] text-slate-500 mt-6">Marcus L. — BMW 3-serie, 2021</p>
            </div>
            <div className="md:col-span-7 order-2">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src="/manrope_(1920_x_1080_px)_(1280_x_720_px)_(1200_x_1400_px)_(2000_x_2000_px)_(1).png"
                  alt="Nöjd kund"
                  className="w-full h-[380px] sm:h-[580px] md:h-[680px] object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ReviewsSection variant="muted" />

      {/* FAQ */}
      <section className="bg-slate-50 py-14 sm:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
              Vanliga frågor
            </span>
            <h2 className="text-[28px] sm:text-[38px] font-semibold text-slate-900 tracking-[-0.02em] leading-[1.08]">
              Fler frågor? Vi har svaren.
            </h2>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white rounded-md px-2">
            {FAQ.map((item, idx) => {
              const open = openFaq === idx;
              return (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => setOpenFaq(open ? null : idx)}
                  className="w-full text-left py-5 px-4 flex items-start gap-4 group"
                >
                  <div className="flex-1">
                    <h3 className="text-[16px] font-semibold text-slate-900">{item.q}</h3>
                    {open && <p className="mt-3 text-[15px] text-slate-600 leading-[1.6]">{item.a}</p>}
                  </div>
                  {open
                    ? <ChevronDown className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                    : <Plus className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  }
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {showSeo && <SeoCarsSection />}

      <SiteFooter />

      {scrolled && (
        <a
          href="tel:+46855550200"
          className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center justify-center gap-2 h-14 rounded-full bg-[#0e6efe] hover:bg-[#0047B3] text-white font-semibold text-[15px] shadow-[0_10px_30px_rgba(14,110,254,0.4)] transition animate-[slideUp_0.3s_ease-out]"
        >
          <Phone className="w-5 h-5" fill="currentColor" />
          <span>Ring expert &middot; bud direkt</span>
        </a>
      )}
    </div>
  );
}
