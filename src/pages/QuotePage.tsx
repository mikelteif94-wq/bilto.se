import { useEffect, useState, lazy, Suspense } from 'react';
import {
  Menu, User, Check, Phone, Handshake, ShieldCheck, Megaphone, Search, Sparkles, Gavel,
  ArrowRight, TrendingDown, Lock,
} from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import ReviewsSection from '../components/ReviewsSection';
import CompactCarCard from '../components/CompactCarCard';
import { CarDetailSheet } from '../components/quiz/CarDetailSheet';
import { SiteFooter } from '../components/SiteFooter';
import { getAllComparisonCars, type ComparisonCar } from '../lib/comparison';
import { useCarImages } from '../hooks/useCarImages';

const CarFitQuiz = lazy(() =>
  import('../components/CarFitQuiz').then(m => ({ default: m.CarFitQuiz }))
);

interface QuotePageProps {
  onBackHome: () => void;
  onNavigateCalculator: () => void;
  onNavigateHowItWorks: () => void;
}

export default function QuotePage({
  onBackHome,
  onNavigateCalculator,
  onNavigateHowItWorks,
}: QuotePageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [detailCar, setDetailCar] = useState<ComparisonCar | null>(null);
  const [fitQuizCar, setFitQuizCar] = useState<ComparisonCar | null>(null);
  const { getCarImage } = useCarImages();
  const allCars = getAllComparisonCars();
  const TRADE_IN_IDS = ['volvo_xc60', 'bmw_x3', 'tesla_model_y'];
  const tradeInCars = TRADE_IN_IDS
    .map(id => allCars.find(c => c.id === id))
    .filter(Boolean);

  const navigateToBuy = (carLabel?: string) => {
    const params = new URLSearchParams();
    if (carLabel) params.set('bil', carLabel);
    params.set('source', 'Förhandlingssida');
    window.history.pushState({}, '', `/kop-bil?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  useEffect(() => {
    document.title = 'Vi hjälper dig köpa & byta bil | Bilto';
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
    if (item === 'Vi förhandlar åt dig') return;
    if (item === 'Så funkar det') {
      onNavigateHowItWorks();
      return;
    }
    onBackHome();
  };

  const navItems = ['Sälj bil', 'Köp bil'];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Vi förhandlar åt dig"
        onSelect={handleMenuSelect}
      />
      <header
        className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${
          scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]/40 backdrop-blur-md'
        }`}
      >
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white"
          >
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 -ml-1 lg:-ml-3 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === 'Vi förhandlar åt dig') return;
                  onBackHome();
                }}
                className={`text-[15px] transition ${
                  item === 'Vi förhandlar åt dig'
                    ? 'text-white font-semibold'
                    : item === 'Köp bil'
                    ? 'inline-flex items-center h-8 px-4 rounded-xl bg-[#0e6efe] text-white text-[13px] font-semibold hover:bg-[#0a57cc] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
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

      {/* Mobile hero */}
      <section className="lg:hidden pt-16 relative bg-[#0e6efe] overflow-hidden">
        <div className="absolute -right-20 top-80 w-[240px] h-[240px] rounded-full bg-[#3d8cff] opacity-40" />

        <div className="relative px-6 pt-4 pb-10">
          <div className="flex items-center justify-center mb-3">
            <img
              src="/files_10012721-2026-05-15T15-21-45-058Z-module-1-img.74fe1fb9_(1).svg"
              alt=""
              loading="eager"
              fetchPriority="high"
              className="w-[220px] h-auto object-contain"
            />
          </div>

          <h1 className="text-center text-white text-[28px] font-semibold leading-[1.15] tracking-tight px-2">
            Hitta rätt bil – vi hjälper dig få rätt affär
          </h1>

          <ul className="mt-6 space-y-3.5 text-[16px] font-medium text-white flex flex-col items-center">
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
              Jämför bilar och hitta rätt modell
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
              Vi hjälper med pris, villkor och granskning
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
              Helt gratis och opartiskt
            </li>
          </ul>

          <div className="mt-6 bg-white rounded-xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] p-5">
            <button
              type="button"
              onClick={() => navigateToBuy()}
              className="w-full h-12 rounded-lg bg-[#0047B3] hover:bg-[#003a94] text-white font-semibold text-[15px] transition inline-flex items-center justify-center gap-2 group"
            >
              Kom igång
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>
            <p className="mt-3 text-[12px] text-slate-400 text-center">Vi ringer dig inom en timme.</p>
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 backdrop-blur-sm text-white text-[13px] font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Gratis och opartiskt
            </span>
            <h1 className="text-white text-[58px] font-bold leading-[1.02] tracking-tight">
              Din bilaffär börjar här
            </h1>
            <p className="mt-5 text-white/85 text-[19px] leading-[1.6] max-w-lg">
              Vi hjälper dig köpa, byta eller hitta rätt bil – enkelt, tryggt och helt utan kostnad.
            </p>
          </div>
          <div className="justify-self-end w-full max-w-[440px]">
            <div className="bg-white rounded-xl shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] overflow-hidden">
              {/* Tab strip */}
              <div className="flex border-b border-slate-100">
                {([
                  { key: 'hitta', label: 'Hitta bil' },
                  { key: 'salj', label: 'Sälj bil' },
                ] as const).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      if (t.key === 'salj') {
                        window.history.pushState({}, '', '/');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                    className={`flex-1 py-4 text-center text-[14px] font-bold tracking-[0.02em] relative transition-colors ${
                      t.key === 'hitta' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t.label}
                    <span className={`absolute bottom-0 inset-x-0 h-[2.5px] rounded-t-full ${t.key === 'hitta' ? 'bg-[#0e6efe]' : 'bg-transparent'}`} />
                  </button>
                ))}
              </div>
              <div className="px-5 py-5 flex flex-col gap-2.5">
                {[
                  {
                    icon: Search,
                    label: 'Jag letar efter bil',
                    sub: 'Utforska, jämför eller testa bilmatch',
                    action: () => navigateToBuy(),
                  },
                  {
                    icon: Handshake,
                    label: 'Jag har hittat en bil',
                    sub: 'Låt oss förhandla och granska åt dig',
                    action: () => navigateToBuy(),
                  },
                  {
                    icon: ArrowRight,
                    label: 'Jag vill byta bil',
                    sub: 'Vi hittar och förhandlar nästa bil åt dig',
                    action: () => navigateToBuy(),
                  },
                ].map(({ icon: Icon, label, sub, action }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    className="group w-full flex items-center gap-4 p-3.5 rounded-xl border border-slate-100 hover:border-[#0e6efe]/40 hover:bg-[#0e6efe]/[0.03] transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#faf8f5] group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4.5 h-4.5 text-slate-500 group-hover:text-[#0e6efe] transition-colors" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-slate-900 leading-snug">{label}</p>
                      <p className="text-[12px] text-slate-400 mt-0.5 leading-snug">{sub}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0e6efe] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trade-in car cards */}
      <section className="bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-12 sm:py-20">
          <div className="mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0e6efe]/10 text-[#0e6efe] text-[12px] font-semibold mb-4">
              Vad behöver du hjälp med?
            </span>
            <h3 className="text-[24px] sm:text-[34px] font-semibold leading-[1.1] tracking-tight text-slate-900">
              Vi möter dig där du är i din bilresa.
            </h3>
            <p className="mt-3 text-slate-600 text-[15px] sm:text-[16px] leading-[1.6] max-w-lg">
              Oavsett om du redan hittat en bil, letar aktivt eller vill byta – vi granskar historik, jämför priser och hjälper dig igenom hela affären. Helt gratis och opartiskt.
            </p>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {[
              {
                icon: Search,
                accent: 'text-[#0e6efe]',
                accentBg: 'bg-[#0e6efe]/8',
                title: 'Vi hittar rätt bil åt dig',
                body: 'Berätta vad du söker – märke, budget eller bara ett behov. Vi söker i hela marknaden och presenterar de bästa alternativen.',
                stat: null,
                statLabel: null,
              },
              {
                icon: TrendingDown,
                accent: 'text-emerald-600',
                accentBg: 'bg-emerald-50',
                title: 'Vi förhandlar priset',
                body: 'Vår expert tar dialogen med handlaren, pressar priset och förhandlar fram bästa ränta, tillval och villkor.',
                stat: '~15 000 kr',
                statLabel: 'genomsnittlig besparing',
              },
              {
                icon: Lock,
                accent: 'text-slate-700',
                accentBg: 'bg-slate-100',
                title: 'Trygg och utan press',
                body: 'Du bestämmer. Vi granskar historik och skick innan affär. Ingen bindning, inga dolda avgifter – du tackar ja eller nej.',
                stat: '100%',
                statLabel: 'utan förpliktelse',
              },
            ].map(({ icon: Icon, accent, accentBg, title, body, stat, statLabel }) => (
              <div key={title} className="flex items-start gap-5 sm:gap-8 px-6 py-6 sm:py-7">
                <div className={`shrink-0 w-11 h-11 rounded-xl ${accentBg} flex items-center justify-center mt-0.5`}>
                  <Icon className={`w-5 h-5 ${accent}`} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[16px] sm:text-[17px] font-semibold text-slate-900 leading-snug mb-1">{title}</h4>
                  <p className="text-[14px] sm:text-[14.5px] text-slate-500 leading-relaxed">{body}</p>
                </div>
                {stat && (
                  <div className="shrink-0 text-right pl-4 hidden sm:block">
                    <p className={`text-[22px] font-bold leading-none ${accent}`}>{stat}</p>
                    <p className="text-[11px] text-slate-400 mt-1 whitespace-nowrap">{statLabel}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center sm:text-left">
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/kop-bil');
                window.dispatchEvent(new PopStateEvent('popstate'));
                setTimeout(() => {
                  document.getElementById('experternas-val')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="h-12 px-8 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[15px] inline-flex items-center gap-2 group transition shadow-sm"
            >
              Utforska alla bilar
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </section>

      {/* Johan testimonial */}
      <section className="bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 sm:py-12">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5 order-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-3 block">
                Kundcase
              </span>
              <h2 className="text-[22px] sm:text-[34px] font-semibold leading-[1.15] sm:leading-[1.1] text-slate-900 tracking-[-0.02em]">
                "Bilto löste allt från start till mål – jag behövde inte göra någonting själv."
              </h2>
              <p className="text-slate-600 mt-4 text-[14px] sm:text-[15px] leading-[1.65] max-w-md">
                Johan ville köpa en Toyota RAV4 men hade varken tid eller lust att jaga annonser och förhandla. Bilto tog hand om hela affären – hittade rätt bil, förhandlade priset och såg till att allt gick smidigt. Johan sparade både pengar och en massa tid.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Sparad tid', value: 'Flera dagar' },
                  { label: 'Prisförhandling', value: '12 000 kr' },
                  { label: 'Smidig affär', value: 'Start–mål' },
                  { label: 'Nöjd kund', value: '100 %' },
                ].map(({ label, value }) => (
                  <div key={label} className="px-4 py-3 bg-[#0e6efe]/5 border border-[#0e6efe]/15 rounded-xl">
                    <p className="text-[10px] font-bold text-[#0e6efe] uppercase tracking-[0.12em] mb-0.5">{label}</p>
                    <p className="text-[16px] font-bold text-slate-900 leading-tight">{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-slate-500 mt-5">
                Johan K. – Toyota RAV4, 2023
              </p>
            </div>
            <div className="md:col-span-7 order-2">
              <div className="relative rounded-xl overflow-hidden bg-[#0e6efe] h-[420px] sm:h-[460px] md:h-[520px]">
                <img
                  src="/manrope_(1920_x_1080_px)_(1280_x_720_px)_(Instagram_Post_(45))_copy_copy_copy_copy_copy.jpg"
                  alt="Johan framför sin Toyota RAV4"
                  className="absolute inset-0 w-full h-full object-cover object-top scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e6efe]/30 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-[#0e6efe] py-12 sm:py-20 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-[22px] sm:text-[40px] font-semibold leading-[1.15] sm:leading-[1.08] text-white tracking-[-0.02em]">
              Erfarna förhandlare – på din sida
            </h2>
            <p className="text-white/80 mt-3 sm:mt-4 text-[14px] sm:text-[17px] leading-[1.55] max-w-lg mx-auto">
              Vårt team har jobbat som toppsäljare hos Sveriges största bilhandlare. Nu jobbar vi för dig istället.
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 sm:gap-12 flex-wrap">
            {[
              { value: '5 000+', label: 'Bilar sålda' },
              { value: '10+', label: 'År i branschen' },
              { value: '100%', label: 'På kundens sida' },
            ].map((stat, i, arr) => (
              <div key={stat.label} className="flex items-center gap-6 sm:gap-12">
                <div className="text-center">
                  <div className="text-[24px] sm:text-[32px] font-bold text-white tabular-nums tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[11px] sm:text-[13px] text-white/70 font-medium mt-0.5">
                    {stat.label}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px h-8 sm:h-10 bg-white/25" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16 sm:py-24 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 sm:mb-16 flex items-end justify-between flex-wrap gap-6">
            <div className="max-w-xl">
              <span className="text-[12px] font-medium text-slate-500 mb-3 block">
                &mdash; Så funkar det
              </span>
              <h2 className="text-[34px] sm:text-[48px] font-semibold leading-[1.02] text-slate-900 tracking-[-0.02em]">
                Tre steg till en trygg bilaffär
              </h2>
            </div>
            <img
              src="/info-content.a96a55cf.svg"
              alt=""
              aria-hidden="true"
              className="hidden md:block w-[200px] lg:w-[260px] h-auto opacity-90"
            />
          </div>
          <ol className="relative lg:grid lg:grid-cols-3 lg:gap-10">
            {[
              {
                icon: Phone,
                title: 'Vi tar ett samtal',
                text: 'Vi ringer dig och samlar all info kring hur du vill att din nya bil ska vara – märke, budget, utrustning och önskemål.',
              },
              {
                icon: Megaphone,
                title: 'Vi förhandlar med säljaren',
                text: 'Vi kontaktar säljaren, pressar priset och granskar bilen åt dig. Du slipper förhandla själv.',
              },
              {
                icon: Handshake,
                title: 'Affären är klar',
                text: 'Du kan tuta och köra med gott samvete – vi har sett till att du gjort en riktigt bra deal.',
              },
            ].map((step, i, arr) => {
              const Icon = step.icon;
              const isLast = i === arr.length - 1;
              return (
                <li
                  key={step.title}
                  className="relative pl-12 sm:pl-14 pb-10 sm:pb-12 last:pb-0 lg:pl-0 lg:pb-0 lg:pt-[54px]"
                >
                  {!isLast && (
                    <span
                      aria-hidden
                      className="absolute left-[17px] sm:left-[21px] top-9 sm:top-[46px] bottom-0 w-px bg-slate-200 lg:left-[44px] lg:right-0 lg:top-[21px] lg:bottom-auto lg:w-auto lg:h-px"
                    />
                  )}
                  <div className="absolute left-0 top-0 flex items-center justify-center w-9 h-9 sm:w-[42px] sm:h-[42px] rounded-full bg-[#0e6efe] shadow-[0_8px_18px_-6px_rgba(14,110,254,0.5)] ring-4 ring-[#0e6efe]/10">
                    <Icon className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] text-white" strokeWidth={2.4} />
                  </div>
                  <div className="mb-2">
                    <h3 className="text-[20px] sm:text-[24px] font-semibold text-slate-900 leading-tight tracking-[-0.01em]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-[15px] sm:text-[16px] leading-[1.65] max-w-xl">
                    {step.text}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* What you get */}
      <section className="bg-[#f5f8fc] py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-14 max-w-2xl mx-auto px-2">
            <span className="text-[12px] font-medium text-slate-500 mb-3 block">
              &mdash; Vad ingår
            </span>
            <h2 className="text-[24px] sm:text-[44px] font-semibold leading-[1.15] sm:leading-[1.04] text-slate-900 tracking-[-0.02em]">
              En personlig bilförhandlare i fickan
            </h2>
            <p className="text-slate-600 mt-4 text-[15px] sm:text-[17px] leading-[1.6]">
              Tjänsten är gjord för dig som inte vill spendera dagar på att jaga bilar, ringa annonser eller känna dig pressad i en handlares showroom.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Search,
                title: 'Vi letar bilen åt dig',
                text: 'Vi kontrollerar hela marknaden – inte bara en handlares lager – och hittar bilar som matchar dina önskemål och budget.',
                svg: '/certified-pre-own.75373bb7.svg',
              },
              {
                icon: ShieldCheck,
                title: 'Vi kollar att den håller',
                text: 'Vi kontrollerar servicehistorik, eventuella skador och tidigare ägare. Inga otrevliga överraskningar efter köpet.',
                svg: '/infographic_antal_agare.svg',
                imgClass: 'w-full h-full object-contain group-hover:scale-105 transition-transform duration-300',
              },
              {
                icon: Phone,
                title: 'Vi förhandlar priset',
                text: 'Vi vet hur handlare räknar och vågar säga nej. Det betyder att du sparar mer än vad tjänsten kostar.',
                svg: '/info-content.a96a55cf.svg',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-7 hover:border-[#0e6efe]/40 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-full h-[120px] sm:h-[160px] flex items-center justify-center mb-4 sm:mb-5 overflow-hidden rounded-xl bg-[#faf8f5] group-hover:bg-[#0e6efe]/5 transition-colors duration-300">
                    <img
                      src={item.svg}
                      alt=""
                      aria-hidden="true"
                      className={item.imgClass || "w-auto h-[90px] sm:h-[130px] object-contain group-hover:scale-105 transition-transform duration-300"}
                    />
                  </div>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0e6efe]/10 text-[#0e6efe] flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-[17px] sm:text-[18px] font-semibold text-slate-900 mb-2 leading-tight tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-[14px] sm:text-[14.5px] text-slate-600 leading-[1.6]">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vehicle inspection infographic */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-white py-12 sm:py-28 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-16 max-w-3xl mx-auto px-2">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 sm:mb-4 block">
              Grundlig genomgång
            </span>
            <h2 className="text-[24px] sm:text-[48px] font-semibold leading-[1.15] sm:leading-[1.04] text-slate-900 tracking-[-0.02em]">
              Vi granskar varje detalj – så slipper du oroa dig
            </h2>
            <p className="text-slate-600 mt-4 sm:mt-6 text-[15px] sm:text-[18px] leading-[1.6] max-w-2xl mx-auto">
              Innan vi rekommenderar en bil till dig går vi igenom fem kritiska datapunkter. Inget lämnas åt slumpen.
            </p>
          </div>

          {/* Mobile: image first, then 2-col grid of points */}
          <div className="lg:hidden">
            <div className="flex items-center justify-center mb-6">
              <img
                src="/infographic_antal_agare.svg"
                alt="Infografik: antal ägare och bilhistorik"
                className="w-full max-w-[340px] h-auto"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Olycksrisk', desc: 'Vi genomför certifierade kontroller och historikutdrag för att säkerställa att bilen inte har dolda skador.' },
                { label: 'Antal ägare', desc: 'Färre ägare betyder bättre omhändertagen bil. Vi utreder ägarhistoriken.' },
                { label: 'Bilens skick', desc: 'Från lack och inredning till maskinellt och elektronik – vi bedömer det faktiska skicket, inte bara foton i annonsen.' },
                { label: 'Körsträcka', desc: 'Vi verifierar miltal mot servicehistorik för att upptäcka eventuella felaktigheter.' },
                { label: 'Bilalternativ', desc: 'Vi jämför att din bil ligger rätt till i marknaden så att du inte betalar för mycket.' },
              ].map((point) => (
                <div key={point.label}>
                  <h4 className="text-[14px] font-semibold text-slate-900 mb-1">{point.label}</h4>
                  <p className="text-[12px] text-slate-500 leading-[1.5]">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: original 5-col layout */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-1 space-y-8">
              {[
                { label: 'Olycksrisk', desc: 'Vi genomför certifierade kontroller och historikutdrag för att säkerställa att bilen inte har dolda skador.' },
                { label: 'Antal ägare', desc: 'Färre ägare betyder bättre omhändertagen bil. Vi utreder ägarhistoriken.' },
              ].map((point) => (
                <div key={point.label} className="text-right">
                  <h4 className="text-[18px] font-semibold text-slate-900 mb-1">{point.label}</h4>
                  <p className="text-[14px] text-slate-500 leading-[1.5]">{point.desc}</p>
                </div>
              ))}
            </div>

            <div className="lg:col-span-3 flex items-center justify-center">
              <img
                src="/infographic_antal_agare.svg"
                alt="Infografik: antal ägare och bilhistorik"
                className="w-full max-w-[700px] h-auto"
              />
            </div>

            <div className="lg:col-span-1 space-y-8">
              {[
                { label: 'Bilens skick', desc: 'Från lack och inredning till maskinellt och elektronik – vi bedömer det faktiska skicket, inte bara foton i annonsen.' },
                { label: 'Körsträcka', desc: 'Vi verifierar miltal mot servicehistorik för att upptäcka eventuella felaktigheter.' },
                { label: 'Bilalternativ', desc: 'Vi jämför att din bil ligger rätt till i marknaden så att du inte betalar för mycket.' },
              ].map((point) => (
                <div key={point.label}>
                  <h4 className="text-[18px] font-semibold text-slate-900 mb-1">{point.label}</h4>
                  <p className="text-[14px] text-slate-500 leading-[1.5]">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 sm:mt-16 text-center">
            <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-5 sm:px-7 py-3 sm:py-4 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
              <span className="text-[13px] sm:text-[15px] text-slate-700 font-medium">
                Alla bilar vi rekommenderar har klarat vår 5-punktskontroll
              </span>
            </div>
          </div>
        </div>
      </section>

      <ReviewsSection variant="muted" />

      {/* Final CTA */}
      <section className="bg-white py-16 sm:py-24 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-[28px] sm:text-[44px] font-semibold text-slate-900 leading-[1.08] tracking-tight">
            Redo att låta oss förhandla åt dig?
          </h3>
          <p className="text-slate-600 mt-4 text-[15px] sm:text-[17px] leading-[1.6] mb-8">
            Det tar två minuter att skicka in. Vi hör av oss inom 24 timmar.
          </p>
          <button
            type="button"
            onClick={() => navigateToBuy()}
            className="h-14 px-10 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-[16px] rounded-xl transition shadow-sm inline-flex items-center justify-center gap-2"
          >
            Kom igång
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <SiteFooter />

      {detailCar && (
        <CarDetailSheet
          car={{
            make: detailCar.brand_display,
            model: detailCar.model_display,
            image_url: getCarImage(detailCar.brand_display, detailCar.model_display) || null,
            matchScore: detailCar.ratings.overall * 10,
            matchReasons: detailCar.pros.slice(0, 3),
            bodyType: detailCar.specs.body_type,
            fuelType: detailCar.specs.fuel_types[0],
            rating: detailCar.ratings.overall,
            usedPrice: detailCar.pricing.used_from_sek,
          }}
          onClose={() => setDetailCar(null)}
          onSelect={() => {
            const car = detailCar;
            setDetailCar(null);
            navigateToBuy(`${car.brand_display} ${car.model_display}`);
          }}
          onFitQuiz={() => {
            const car = detailCar;
            setDetailCar(null);
            setFitQuizCar(car);
          }}
        />
      )}

      <Suspense fallback={null}>
        <CarFitQuiz
          car={fitQuizCar!}
          open={!!fitQuizCar}
          onClose={() => setFitQuizCar(null)}
          onNegotiate={() => {
            if (fitQuizCar) {
              setFitQuizCar(null);
              navigateToBuy(`${fitQuizCar.brand_display} ${fitQuizCar.model_display}`);
            }
          }}
        />
      </Suspense>
    </div>
  );
}
