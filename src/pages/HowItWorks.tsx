import { useState, useEffect } from 'react';
import {
  Menu,
  User,
  ArrowRight,
  Search,
  Gavel,
  Phone,
  Handshake,
  Camera,
  Check,
  ShieldCheck,
  Clock,
  ChevronDown,
  Plus,
  MessageCircle,
  X,
  XCircle,
} from 'lucide-react';
import { SiteFooter } from './BrokerageLanding';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import SeoCarsSection from '../components/SeoCarsSection';
import ReviewsSection from '../components/ReviewsSection';
import CompactCarCard from '../components/CompactCarCard';
import BuyDrawer from '../components/BuyDrawer';
import { CarDetailSheet } from '../components/quiz/CarDetailSheet';
import { getAllComparisonCars, type ComparisonCar } from '../lib/comparison';
import { useCarImages } from '../hooks/useCarImages';
import RegInput from '../components/RegInput';

interface HowItWorksProps {
  onBackHome: () => void;
  onStartBrokerage: (regnummer?: string, miltal?: number) => void;
  onOpenCalculator?: () => void;
  onQuickLead?: (regnummer: string, telefon: string) => void;
  showSeo?: boolean;
  pageTitle?: string;
}

type Mode = 'brokerage' | 'direct';

interface Step {
  icon: typeof Search;
  title: string;
  text: string;
}

const BROKERAGE_STEPS: Step[] = [
  {
    icon: Search,
    title: 'Vi kollar marknaden tillsammans',
    text: 'Vi går igenom bilen och marknaden ihop. Känns det bra kommer vi överens om upplägget — utan press.',
  },
  {
    icon: Camera,
    title: 'Vi fixar proffsiga bilder',
    text: 'Vi tar och redigerar professionella annonsbilder åt dig och bygger en skarp annons som lyfter bilens bästa sidor.',
  },
  {
    icon: ShieldCheck,
    title: 'Vi sköter samtalen åt dig',
    text: 'Vi tar alla samtal, förhandlar med köparna och sållar bort oseriösa spekulanter — du slipper allt strul.',
  },
  {
    icon: Phone,
    title: 'Vi presenterar buden',
    text: 'Vi ringer dig när det finns ett skarpt bud att ta ställning till. Ingen avgift om bilen inte säljs.',
  },
];

const DIRECT_STEPS: Step[] = [
  {
    icon: Phone,
    title: 'Du får en personlig rådgivare',
    text: 'Oavsett om du säljer, byter eller köper bil — en rådgivare hjälper dig genom hela processen.',
  },
  {
    icon: Gavel,
    title: 'Vi hittar bästa budet',
    text: 'Vi jämför erbjudanden från bilhandlare åt dig — oavsett om du ska sälja din bil, byta in den eller köpa en ny.',
  },
  {
    icon: Handshake,
    title: 'Vi hämtar eller lämnar bilen',
    text: 'När du tackar ja ordnar vi upphämtning av din sålda bil eller leverans av din nya — gäller vid försäljning, inbyte och köp.',
  },
];

const FAQ = [
  {
    q: 'Vad kostar det att använda Bilto?',
    a: 'Det kostar 1 995 kr i administrativ avgift — det är allt. Avgiften täcker vår förhandling, granskning och all administration kring affären.',
  },
  {
    q: 'Hur hjälper Bilto mig att köpa bil?',
    a: 'Du berättar vilken bil du är intresserad av och vi tar över därifrån. Vi kontaktar säljaren, granskar annonsens riktighet, förhandlar pris, ränta och tillbehör, och ser till att du inte betalar mer än du behöver.',
  },
  {
    q: 'Hur stor besparing kan jag räkna med?',
    a: 'Det varierar, men våra kunder sparar i snitt 15 000–40 000 kr per bilaffär när man räknar ihop prisnedförhandling, inbytesvärde, ränta och tillbehör som förhandlas in. Vår avgift på 1 995 kr betalar sig alltså mångfalt.',
  },
  {
    q: 'Kan ni hjälpa mig även om jag inte hittat en bil ännu?',
    a: 'Absolut. Vi kan hjälpa dig hitta rätt bil via vår bilmatch, smarta sökning eller helt enkelt genom att du berättar vad du söker. Sen sköter vi resten.',
  },
  {
    q: 'Vad händer om säljaren inte går med på förhandlingen?',
    a: 'Då berättar vi det rakt ut och ger dig vår rekommendation — är bilen rätt prissatt eller inte. Du bestämmer alltid om du vill gå vidare.',
  },
  {
    q: 'När betalar jag avgiften?',
    a: 'Avgiften på 1 995 kr betalas när vi påbörjar förhandlingen åt dig. Om affären inte går igenom på grund av att säljaren avböjer kontaktar du oss så löser vi det.',
  },
];

export default function HowItWorks({ onBackHome, onStartBrokerage, showSeo = false, pageTitle }: HowItWorksProps) {
  useEffect(() => {
    if (pageTitle) document.title = pageTitle;
  }, [pageTitle]);
  const [mode] = useState<Mode>('direct');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [regnummer, setRegnummer] = useState('');
  const [formError, setFormError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [carsModalOpen, setCarsModalOpen] = useState(false);
  const [detailCar, setDetailCar] = useState<ComparisonCar | null>(null);
  const [buyDrawerCar, setBuyDrawerCar] = useState<string | null>(null);

  const openDrawer = (carLabel: string) => setBuyDrawerCar(carLabel);

  const { getCarImage } = useCarImages();
  const allCars = getAllComparisonCars();
  const TRADE_IN_IDS = ['volvo_xc60', 'bmw_x3', 'tesla_model_y'];
  const tradeInCars = TRADE_IN_IDS
    .map(id => allCars.find(c => c.id === id))
    .filter(Boolean);

  const POPULAR_IDS = ['tesla_model_y', 'volvo_xc60', 'kia_ev6', 'toyota_rav4', 'volvo_xc40', 'vw_golf'];
  const popularCars = POPULAR_IDS
    .map(id => allCars.find(c => c.id === id))
    .filter((c): c is ComparisonCar => !!c);

  const FUEL_LABELS: Record<string, string> = {
    bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid', laddhybrid: 'Laddhybrid', el: 'El',
  };

  const BUDGET_PILLS = [
    { label: 'Under 3 000 kr/mån', max: 3000 },
    { label: 'Under 5 000 kr/mån', max: 5000 },
    { label: 'Under 8 000 kr/mån', max: 8000 },
    { label: 'Öppen budget', max: 0 },
  ];
  const [activeBudgetPill, setActiveBudgetPill] = useState<number | null>(null);
  const [showAllCars, setShowAllCars] = useState(false);

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
    if (item === 'Så funkar det') return;
    if (item === 'Köp bil') {
      window.history.pushState({}, '', '/kop-bil');
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
    onStartBrokerage(reg, 0);
  };

  const steps = mode === 'brokerage' ? BROKERAGE_STEPS : DIRECT_STEPS;
  const navItems = ['Sälj bil', 'Köp bil'];

  return (
    <div className="min-h-screen bg-white text-slate-900">
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
            />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === 'Sälj bil') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
                  if (item === 'Köp bil') {
                    window.history.pushState({}, '', '/kop-bil');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                    return;
                  }
                  onBackHome();
                }}
                className={`text-[15px] transition ${
                  item === 'Sälj bil'
                    ? 'text-white font-semibold'
                    : 'text-white/80 hover:text-white'
                }`}
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
            Din bilaffär börjar här
          </h1>

          <ul className="mt-6 space-y-3.5 text-[17px] font-medium text-white w-fit mx-auto text-left">
            <li className="flex items-center gap-3">
              <Check className="w-6 h-6 text-white shrink-0" strokeWidth={3} />
              Sälj din bil och få bästa budet
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-6 h-6 text-white shrink-0" strokeWidth={3} />
              Köp bil och vi förhandlar priset åt dig
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-6 h-6 text-white shrink-0" strokeWidth={3} />
              Byt bil och vi sköter allt från start till mål
            </li>
          </ul>

          <div className="mt-6 bg-white rounded-2xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] overflow-hidden">
            {/* Tab strip */}
            <div className="flex border-b border-slate-100">
              <div className="flex-1 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#0e6efe] relative">
                Sälj din bil
                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#0e6efe] rounded-t-full" />
              </div>
              <div className="w-px bg-slate-100 my-2" />
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/kop-bil');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="flex-1 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 hover:text-slate-600 transition-colors"
              >
                Köp bil
              </button>
            </div>

            <div className="p-4">
              <form onSubmit={handleHeroSubmit} className="flex flex-col gap-2">
                <RegInput size="sm" value={regnummer} onChange={(v) => { setRegnummer(v); setFormError(''); }} />
                {formError && (
                  <div role="alert" className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-medium px-2.5 py-1.5">
                    <XCircle className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                    <span className="leading-snug">{formError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  className="h-10 w-full rounded-lg bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white font-bold text-[13px] tracking-wide transition-all inline-flex items-center justify-center gap-1.5 shadow-[0_4px_14px_-4px_rgba(14,110,254,0.55)]"
                >
                  Värdera bilen gratis
                  <ArrowRight className="w-3.5 h-3.5 opacity-80" />
                </button>
              </form>

              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400 font-medium">eller</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/kop-bil');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white hover:border-[#0e6efe] hover:text-[#0e6efe] active:scale-[0.98] text-slate-700 font-bold text-[13px] tracking-wide transition-all inline-flex items-center justify-center gap-1.5"
              >
                Hitta din nästa bil
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>
        </div>
      </section>

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
              Din bilaffär börjar här
            </h1>

            <ul className="mt-8 space-y-4 text-[19px] font-medium text-white">
              <li className="flex items-center gap-3">
                <Check className="w-7 h-7 text-white shrink-0" strokeWidth={3} />
                Sälj din bil och få bästa budet
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-7 h-7 text-white shrink-0" strokeWidth={3} />
                Köp bil och vi förhandlar priset åt dig
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-7 h-7 text-white shrink-0" strokeWidth={3} />
                Byt bil och vi sköter allt från start till mål
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] p-6 max-w-[440px] w-full justify-self-end">
            <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Sälj din bil</p>
            <form onSubmit={handleHeroSubmit} className="flex flex-col gap-2.5">
              <RegInput value={regnummer} onChange={(v) => { setRegnummer(v); setFormError(''); }} />
              {formError && (
                <div role="alert" className="flex items-start gap-2 rounded-lg bg-[#0e6efe] text-white text-[13px] font-semibold px-3 py-2 shadow-sm">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-[1px]" strokeWidth={2.5} />
                  <span className="leading-snug">{formError}</span>
                </div>
              )}
              <button
                type="submit"
                className="mt-1 h-12 w-full rounded-lg bg-[#0047B3] hover:bg-[#003a94] text-white font-semibold text-[15px] transition inline-flex items-center justify-center gap-2 group"
              >
                Värdera bilen gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Köp eller byt bil</p>
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/kop-bil');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="w-full h-12 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-[15px] transition inline-flex items-center justify-center gap-2 group"
              >
                Hitta din nästa bil
                <ArrowRight className="w-4 h-4 text-[#0e6efe] group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f8fc] py-16 sm:py-24 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 sm:mb-16 flex items-end justify-between flex-wrap gap-6">
            <div className="max-w-xl">
              <h2 className="text-[34px] sm:text-[48px] font-semibold leading-[1.02] text-slate-900 tracking-[-0.02em]">
                {mode === 'direct'
                  ? 'Så enkelt är det'
                  : 'Fyra steg till såld bil'}
              </h2>
            </div>
          </div>

          <ol className={`relative lg:grid lg:gap-10 ${steps.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === steps.length - 1;
              return (
                <li key={step.title} className="relative pl-12 sm:pl-14 pb-10 sm:pb-12 last:pb-0 lg:pl-0 lg:pb-0 lg:pt-[54px]">
                  {!isLast && (
                    <span aria-hidden className="absolute left-[17px] sm:left-[21px] top-9 sm:top-[46px] bottom-0 w-px bg-slate-200 lg:left-[44px] lg:right-0 lg:top-[21px] lg:bottom-auto lg:w-auto lg:h-px" />
                  )}
                  <div className="absolute left-0 top-0 flex items-center justify-center w-9 h-9 sm:w-[42px] sm:h-[42px] rounded-full bg-[#0e6efe] shadow-[0_8px_18px_-6px_rgba(14,110,254,0.5)] ring-4 ring-[#0e6efe]/10">
                    <Icon className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] text-white" strokeWidth={2.4} />
                  </div>
                  <div className="flex items-baseline gap-3 mb-2">
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

      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
          <div className="grid md:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="md:col-span-6 order-1 md:order-1">
              <span className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-4 block">
                Din personliga bilmäklare
              </span>
              <h2 className="text-[32px] sm:text-[44px] font-semibold text-slate-900 tracking-[-0.02em] leading-[1.08]">
                Ska du köpa eller byta bil? Din personliga bilmäklare hjälper dig hela vägen.
              </h2>
              <p className="text-[17px] text-slate-600 mt-5 leading-[1.6] max-w-lg">
                Oavsett om du letar efter en ny bil, redan hittat en eller vill byta in din nuvarande hjälper vi dig genom hela affären — från pris och villkor till avtal och trygghet.
              </p>
              <ul className="mt-8 space-y-3.5">
                {[
                  'En personlig bilmäklare på din sida',
                  'Vi granskar pris, villkor och avtal',
                  'Betala bara om affären blir av',
                  'Fungerar vid köp, byte och leasing',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#0e6efe] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                    <span className="text-[15.5px] text-slate-700 leading-[1.55]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <button
                  type="button"
                  onClick={() => {
                    window.history.pushState({}, '', '/kop-bil');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="h-12 px-7 rounded-lg bg-[#0047B3] hover:bg-[#003a94] text-white font-semibold text-[15px] transition inline-flex items-center justify-center gap-2 group"
                >
                  Läs mer om hur det fungerar
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            </div>
            <div className="md:col-span-6 order-2 md:order-2">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src="/BSM_car_sale_key_woman_handover_101122.jpg"
                  alt="Personlig mäklare hjälper bilsäljare"
                  className="w-full h-[220px] sm:h-[380px] md:h-[540px] object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                <div className="hidden sm:block absolute left-4 bottom-4 right-4 sm:left-6 sm:bottom-6 sm:right-auto bg-white rounded-xl p-4 sm:p-5 shadow-lg sm:max-w-xs">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-9 h-9 rounded-full bg-[#0e6efe]/10 text-[#0e6efe] flex items-center justify-center">
                      <Handshake className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="text-[14px] font-semibold text-slate-900">
                      Vi förhandlar åt dig
                    </div>
                  </div>
                  <p className="text-[13.5px] text-slate-600 leading-[1.55]">
                    Oavsett om du köper, byter eller leasar — vi ser till att du får bästa villkor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular cars + budget browser */}
      <section className="bg-white py-14 sm:py-20 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-[24px] sm:text-[36px] font-semibold text-slate-900 leading-[1.1] tracking-tight">
              Experternas val
            </h2>
            <p className="mt-3 text-slate-500 text-[14px] sm:text-[16px] max-w-lg mx-auto leading-relaxed">
              Hitta din nästa bil bland de mest eftertraktade modellerna. Vi förhandlar priset åt dig.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            {BUDGET_PILLS.map((pill) => {
              const isActive = activeBudgetPill === pill.max;
              return (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => { setActiveBudgetPill(isActive ? null : pill.max); setShowAllCars(false); }}
                  className={`px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0047B3] text-white shadow-md shadow-[#0047B3]/20'
                      : 'bg-[#0e6efe] text-white hover:bg-[#0056d6]'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {(() => {
            let carsToShow = popularCars;
            if (activeBudgetPill !== null) {
              carsToShow = allCars
                .filter(car => {
                  if (!car.pricing.new_from_sek) return false;
                  if (!getCarImage(car.brand_display, car.model_display)) return false;
                  const monthly = Math.round(car.pricing.new_from_sek / 60);
                  return activeBudgetPill === 0 ? true : monthly <= activeBudgetPill;
                })
                .sort((a, b) => (a.pricing.new_from_sek || 0) - (b.pricing.new_from_sek || 0))
                .slice(0, 12);
            }
            const visibleCars = showAllCars ? carsToShow : carsToShow.slice(0, 6);
            const hasMore = carsToShow.length > 6;
            return (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {visibleCars.map((car, i) => {
                    const imageUrl = getCarImage(car.brand_display, car.model_display);
                    const fuelLabelStr = car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ');
                    return (
                      <CompactCarCard
                        key={car.id}
                        name={`${car.brand_display} ${car.model_display}`}
                        imageUrl={imageUrl}
                        rating={car.ratings.overall}
                        topBadge={i === 0 && activeBudgetPill === null}
                        expertComment={car.pros[0]}
                        fuelLabel={fuelLabelStr}
                        onNegotiate={() => openDrawer(`${car.brand_display} ${car.model_display}`)}
                        onSearch={() => openDrawer(`${car.brand_display} ${car.model_display}`)}
                        onDetail={() => setDetailCar(car)}
                        index={i}
                      />
                    );
                  })}
                </div>
                {hasMore && !showAllCars && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllCars(true)}
                      className="h-11 px-7 rounded-full border border-slate-300 hover:border-[#0e6efe] text-slate-700 hover:text-[#0e6efe] font-semibold text-[14px] inline-flex items-center gap-2 transition-all duration-200"
                    >
                      Se fler bilar
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            );
          })()}

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/kop-bil');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="h-12 px-8 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[15px] inline-flex items-center gap-2 group transition shadow-sm"
            >
              Utforska alla bilar
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-14 sm:py-20">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
                Personlig rådgivare
              </span>
              <h2 className="text-[30px] sm:text-[38px] font-semibold leading-[1.1] text-slate-900 tracking-tight">
                Din personliga rådgivare
              </h2>
              <p className="text-slate-600 mt-5 text-[16px] leading-[1.65]">
                En dedikerad rådgivare jämför bud från utvalda bilhandlare och
                presenterar det bästa erbjudandet — du slipper samtal och
                förhandlingar.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Samma kontaktperson hela vägen',
                  'Du slipper samtal från olika bilhandlare',
                  'Vi sköter kontakten och förhandlingen åt dig',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-slate-700">
                    <Check className="w-5 h-5 mt-0.5 text-emerald-600 shrink-0" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-7">
              <div className="relative rounded-2xl overflow-hidden aspect-square max-w-[520px] mx-auto">
                <img
                  src="/13ccde8b-copy-copy.png"
                  alt="Personlig rådgivare framför kund-bil"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="hidden md:block absolute md:left-auto md:right-5 md:bottom-5 md:max-w-sm bg-white rounded-xl p-5 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center">
                      <Phone className="w-4 h-4" strokeWidth={2.25} />
                    </div>
                    <div className="text-[13px] font-semibold text-slate-900">
                      En rådgivare återkommer till dig
                    </div>
                  </div>
                  <p className="text-[14px] text-slate-600 leading-[1.55]">
                    Vi svarar alltid — en rådgivare finns här för att guida dig genom hela processen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                style={{ imageRendering: 'auto' }}
              />
            </div>
            <div className="order-1 md:order-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
                Hämtning i hela Sverige
              </span>
              <h2 className="text-[30px] sm:text-[40px] font-semibold leading-[1.1] text-slate-900 tracking-tight">
                Vi gör det enkelt att sälja bilen, oavsett var du bor
              </h2>
              <p className="text-slate-600 mt-5 text-[16px] leading-[1.7]">
                När du accepterar ett bud bokar vi upphämtning på en plats som
                passar dig. Du slipper stress, krångel och onödiga resor – bilen
                hämtas tryggt och smidigt.
              </p>
              <ul className="mt-8 space-y-3">
                <li className="flex items-start gap-3 text-[15px] text-slate-800">
                  <Check className="w-5 h-5 text-[#0e6efe] shrink-0 mt-0.5" strokeWidth={2.5} />
                  Vi hämtar där det passar dig
                </li>
                <li className="flex items-start gap-3 text-[15px] text-slate-800">
                  <Check className="w-5 h-5 text-[#0e6efe] shrink-0 mt-0.5" strokeWidth={2.5} />
                  Trygg upphämtning utan krångel
                </li>
                <li className="flex items-start gap-3 text-[15px] text-slate-800">
                  <Check className="w-5 h-5 text-[#0e6efe] shrink-0 mt-0.5" strokeWidth={2.5} />
                  Ingen upphämtningsavgift
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
          <div className="mb-12 sm:mb-16 max-w-2xl">
            <span className="text-[12px] font-medium text-slate-500 mb-3 block">
              — Varför Bilto
            </span>
            <h2 className="text-[32px] sm:text-[48px] font-semibold text-slate-900 tracking-[-0.02em] leading-[1.05]">
              Din partner för en trygg och smart bilaffär.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden ring-1 ring-slate-200">
            {[
              {
                icon: ShieldCheck,
                title: 'Granskade handlare',
                text:
                  'Endast auktoriserade bilhandlare med dokumenterad historik deltar. Vi granskar företag, omdömen och tidigare affärer innan någon får lägga ett bud på din bil — så du alltid vet att köparen är seriös.',
              },
              {
                icon: Clock,
                title: 'Snabb utbetalning',
                text:
                  'Pengarna landar på ditt konto innan du lämnar över bilen, beroende på vilken bank du har. Vid förmedling betalas slutpriset ut inom 1–3 bankdagar. Inga dolda kostnader – bara en transparent affär.',
              },
              {
                icon: Check,
                title: 'Ingen förpliktelse',
                text:
                  'Du är aldrig bunden att sälja. Tacka nej till budet om du inte är nöjd – det kostar dig ingenting att avstå. Du bestämmer alltid själv om affären ska gå vidare.',
              },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white p-8 sm:p-10 flex flex-col">
                  <Icon className="w-7 h-7 text-[#0e6efe] mb-6" strokeWidth={1.75} />
                  <h3 className="text-[20px] sm:text-[22px] font-semibold text-slate-900 mb-3 tracking-[-0.01em]">
                    {b.title}
                  </h3>
                  <p className="text-slate-600 leading-[1.65] text-[15px]">
                    {b.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[28px] sm:rounded-[56px] bg-[#0e6efe] px-5 py-8 sm:px-14 sm:py-12 lg:px-20 lg:py-14">
            <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="text-white">
                <h2 className="text-[26px] sm:text-[40px] lg:text-[44px] font-semibold tracking-tight leading-[1.1] text-white">
                  Ring våra bilexperter
                </h2>
                <p className="mt-4 text-[14.5px] sm:text-[16px] text-white leading-[1.6] max-w-md">
                  Har du frågor om din bilaffär? Ring oss direkt så hjälper vår
                  bilexpert dig. Kostnadsfritt och helt utan förpliktelse.
                </p>

                <a
                  href="tel:+46855550200"
                  className="mt-6 sm:mt-8 inline-flex items-center gap-2.5 bg-white hover:bg-slate-100 text-[#0e6efe] font-semibold text-[14px] sm:text-[15px] px-6 sm:px-7 h-[48px] sm:h-[52px] rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5"
                >
                  <Phone className="w-5 h-5 text-[#0e6efe]" strokeWidth={2.5} />
                  Ring 08-5555 0200
                </a>
              </div>

              <div className="relative">
                <div className="relative aspect-[5/4] rounded-[28px] sm:rounded-[36px] overflow-hidden">
                  <img
                    src="/858c5bbb-bilto-hoodie.png"
                    alt="Bilexpert"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
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
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.12em]">
                        Ring våra bilexperter
                      </p>
                      <p className="mt-0.5 text-[14px] font-semibold text-slate-900 leading-tight">
                        Vi finns här för att guida dig
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 md:border-t md:border-slate-100 pt-3">
                    <span className="relative flex w-2.5 h-2.5">
                      <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[12px] text-slate-600">
                      Expert tillgänglig nu
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Josefin testimonial */}
      <section className="bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-5 order-2 md:order-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
                Kundcase
              </span>
              <h2 className="text-[24px] sm:text-[38px] font-semibold leading-[1.15] sm:leading-[1.08] text-slate-900 tracking-[-0.02em]">
                "Jag visste ingenting om bilar — Bilto skötte allt och jag fick mer än jag vågat hoppas på."
              </h2>
              <p className="text-slate-600 mt-5 text-[15px] sm:text-[16px] leading-[1.65] max-w-md">
                Josefin hade hittat en Volvo XC40 men kände sig osäker. Annonsen visade elstolar som inte fanns — Bilto fick 15 000 kr i ersättning för det, förhandlade ner räntan 2 %, fick med dubbdäck och 2 års garanti, och pressade upp inbytesvärdet med 7 000 kr.
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { label: 'Ränta', value: '−2 %' },
                  { label: 'Inbyte', value: '+7 000 kr' },
                  { label: 'Felaktig annons', value: '15 000 kr' },
                  { label: 'Dubbdäck + garanti', value: 'ingår' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.1em]">{item.label}</p>
                    <p className="text-[17px] font-bold text-slate-900 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </dl>
              <p className="text-[13px] text-slate-500 mt-6">
                Josefin L. — Volvo XC40, 2022
              </p>
            </div>
            <div className="md:col-span-7 order-1 md:order-2">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src="/manrope_(1920_x_1080_px)_(1280_x_720_px)_(1200_x_1400_px)_(2000_x_2000_px)_(1).png"
                  alt="Josefin framför sin Volvo XC40"
                  className="w-full h-[380px] sm:h-[580px] md:h-[680px] object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ReviewsSection variant="muted" />

      <section className="bg-slate-50 py-14 sm:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
              Vanliga frågor
            </span>
            <h2 className="text-[32px] sm:text-[40px] font-semibold text-slate-900 tracking-tight leading-[1.08]">
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
                    <h3 className="text-[16px] lg:text-[17px] font-bold text-slate-900">
                      {item.q}
                    </h3>
                    {open && (
                      <p className="mt-3 text-[15px] text-slate-600 leading-[1.65]">
                        {item.a}
                      </p>
                    )}
                  </div>
                  {open ? (
                    <ChevronDown className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>


      {showSeo && <SeoCarsSection />}

      <SiteFooter />


      {carsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setCarsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCarsModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Stäng"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 sm:p-10">
              <h2 className="text-[24px] sm:text-[28px] font-semibold text-slate-900 tracking-tight mb-4">
                Vilka bilar köper Bilto?
              </h2>
              <p className="text-slate-600 text-[15px] leading-[1.65]">
                Bilto hjälper till att förmedla och sälja de flesta typer av bilar – oavsett märke, modell eller skick.
                Vi arbetar både med privatpersoner och ett nätverk av seriösa bilhandlare över hela Sverige, vilket gör
                att vi kan hitta köpare för många olika typer av fordon.
              </p>

              <h3 className="mt-6 text-[16px] font-semibold text-slate-900">Vi hjälper bland annat till med:</h3>
              <ul className="mt-2 space-y-1 text-slate-600 text-[15px] leading-[1.65] list-disc pl-5">
                <li>Personbilar</li>
                <li>Kombibilar</li>
                <li>SUV:ar</li>
                <li>Elbilar och hybridbilar</li>
                <li>Transportbilar och lätta företagsbilar</li>
                <li>Fyrhjulsdrivna bilar</li>
                <li>Sport- och premiumbilar</li>
                <li>Äldre bilar med högre miltal</li>
              </ul>

              <h3 className="mt-6 text-[16px] font-semibold text-slate-900">Bilar vi oftast kan sälja snabbt</h3>
              <p className="mt-1 text-slate-600 text-[15px] leading-[1.65]">
                Vissa bilar är extra eftertraktade på marknaden och får ofta många intressenter:
              </p>
              <ul className="mt-2 space-y-1 text-slate-600 text-[15px] leading-[1.65] list-disc pl-5">
                <li>Nyare bilar</li>
                <li>Svensksålda bilar</li>
                <li>Bilar med servicehistorik</li>
                <li>Automatlåda</li>
                <li>El- och hybridbilar</li>
                <li>Populära märken som Volvo, BMW, Audi, Volkswagen, Tesla och Toyota</li>
              </ul>

              <h3 className="mt-6 text-[16px] font-semibold text-slate-900">Kan ni hjälpa till med äldre eller skadade bilar?</h3>
              <p className="mt-1 text-slate-600 text-[15px] leading-[1.65]">
                Ja. Även äldre bilar, bilar med kosmetiska skador eller högre miltal kan vara intressanta för våra köpare och handlare.
                Det viktigaste är att informationen om bilen är korrekt när du skickar in din förfrågan.
              </p>

              <h3 className="mt-6 text-[16px] font-semibold text-slate-900">Hur vet jag om min bil är intressant?</h3>
              <p className="mt-1 text-slate-600 text-[15px] leading-[1.65]">
                Det kostar inget att skicka in bilen till Bilto för en första bedömning. När vi fått in information och
                bilder gör vi en värdering och ser vilka köpare eller handlare som kan vara intresserade. Du väljer
                alltid själv om du vill gå vidare med försäljningen eller inte.
              </p>
            </div>
          </div>
        </div>
      )}

      {scrolled && (
        <a
          href="tel:+46855550200"
          className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center justify-center gap-2 h-14 rounded-full bg-[#0e6efe] hover:bg-[#0047B3] text-white font-semibold text-[15px] shadow-[0_10px_30px_rgba(14,110,254,0.4)] transition animate-[slideUp_0.3s_ease-out]"
        >
          <Phone className="w-5 h-5" fill="currentColor" />
          <span>Ring expert &middot; bud direkt</span>
        </a>
      )}

      <BuyDrawer
        car={buyDrawerCar}
        onClose={() => setBuyDrawerCar(null)}
      />

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
            openDrawer(`${car.brand_display} ${car.model_display}`);
          }}
        />
      )}
    </div>
  );
}
