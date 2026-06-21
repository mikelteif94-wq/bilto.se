import { useState, useEffect, lazy, Suspense } from 'react';
import { useRef } from 'react';
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
  MessageCircle as _MessageCircle,
  X,
  XCircle,
  Car as CarIcon,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import SeoCarsSection from '../components/SeoCarsSection';
import ReviewsSection from '../components/ReviewsSection';
import CompactCarCard from '../components/CompactCarCard';
import ElCarCard from '../components/ElCarCard';
import { CarDetailSheet } from '../components/quiz/CarDetailSheet';
import type { ComparisonCar } from '../lib/comparison';
import { useCarImages } from '../hooks/useCarImages';
import { useCatalogCars } from '../hooks/useCatalogCars';
import RegInput from '../components/RegInput';
import { setPageMeta } from '../lib/pageMeta';

const BuyDrawer = lazy(() => import('../components/BuyDrawer'));
const CarFitQuiz = lazy(() => import('../components/CarFitQuiz').then(m => ({ default: m.CarFitQuiz })));

interface HowItWorksProps {
  onBackHome: () => void;
  onQuickLead?: (regnummer: string, telefon: string) => void;
  onSell?: (regnummer: string) => void;
  showSeo?: boolean;
  pageTitle?: string;
}

type Mode = 'direct';

interface Step {
  icon: typeof Search;
  title: string;
  text: string;
}

const DIRECT_STEPS: Step[] = [
  {
    icon: Phone,
    title: 'Du får en personlig rådgivare',
    text: 'Oavsett om du säljer, byter eller köper bil — en rådgivare hjälper dig genom hela processen.',
  },
  {
    icon: Gavel,
    title: 'Vi hittar bästa budet',
    text: 'Vi jämför erbjudanden från bilhandlare åt dig — oavsett om du ska sälja din bil, byta in den eller köpa en ny. Bästa erbjudandet vinner!',
  },
  {
    icon: Handshake,
    title: 'Vi hämtar eller lämnar bilen',
    text: 'När du tackar ja ordnar vi upphämtning av din sålda bil eller leverans av din nya — gäller vid försäljning, inbyte och köp. Ingen krångel.',
  },
];

const DIRECT_STEP_IMAGES = [
  '/ChatGPT_Image_20_maj_2026_02_01_19.png',
  '/e66827b0-71c5-48a7-8d91-5123f7db4a0d.png',
  '/55e96830-06e0-436b-8559-63a5b9cf41af.png',
];

const FAQ = [
  {
    q: 'Vad kostar det att använda Bilto?',
    a: 'Det kostar 1 995 kr i fast administrativ avgift — det är allt du betalar, inga dolda avgifter och inget provision. Avgiften gäller dig som privatperson och täcker vår förhandling, granskning och all administration kring affären. Handlare och företag omfattas inte av denna tjänst.',
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

function CalendarWidget() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();
  const [selected, setSelected] = useState<number | null>(todayDate);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-[9px] font-medium text-slate-400 pb-1">{d}</div>
        ))}
        {cells.map((day, i) => (
          <button
            key={i}
            onClick={() => day && setSelected(day)}
            disabled={!day}
            className={`h-5 w-full text-[10px] font-medium rounded-full transition-colors ${
              !day ? '' :
              day === selected
                ? 'bg-[#0e6efe] text-white'
                : day === todayDate
                ? 'ring-1 ring-[#0e6efe] text-[#0e6efe] hover:bg-[#0e6efe]/10'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {day || ''}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HowItWorks({ onBackHome, onSell, showSeo = false, pageTitle }: HowItWorksProps) {
  useEffect(() => {
    if (showSeo) {
      setPageMeta({
        title: 'Sälj din bil snabbt och enkelt | Bilto',
        description: 'Sälj din bil via Bilto – gratis värdering, fri upphämtning i hela Sverige och pengarna på kontot direkt. Certifierade handlare konkurrerar om din bil.',
        canonical: 'https://bilto.se/salj-din-bil',
      });
    } else if (pageTitle) {
      document.title = pageTitle;
    } else {
      setPageMeta({
        title: 'Bilto – Sälj din bil snabbt och enkelt | Gratis värdering',
        description: 'Bilto hjälper dig sälja eller köpa bil till bästa pris. Gratis värdering, fri upphämtning i hela Sverige och pengarna på kontot direkt.',
        canonical: 'https://bilto.se/',
      });
    }
  }, [showSeo, pageTitle]);

  // Preload likely next pages after idle so clicks feel instant
  useEffect(() => {
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => {
          import('../pages/BuyCarPage');
          import('../pages/FreeConsultationPage');
          import('../pages/KopBilConcierge');
        })
      : window.setTimeout(() => {
          import('../pages/BuyCarPage');
          import('../pages/FreeConsultationPage');
          import('../pages/KopBilConcierge');
        }, 2000);
    return () => {
      if (window.requestIdleCallback) window.cancelIdleCallback(id as number);
      else window.clearTimeout(id as number);
    };
  }, []);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [regnummer, setRegnummer] = useState('');
  const [formError, setFormError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroTab, setHeroTab] = useState<'salj' | 'hitta'>('salj');
  const [carQuery, setCarQuery] = useState('');
  const [carSuggestions, setCarSuggestions] = useState<{ make: string; model: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [carSearchLoading, setCarSearchLoading] = useState(false);
  const carSearchRef = useRef<HTMLDivElement>(null);
  const carSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [carsModalOpen, setCarsModalOpen] = useState(false);
  const [detailCar, setDetailCar] = useState<ComparisonCar | null>(null);
  const [fitQuizCar, setFitQuizCar] = useState<ComparisonCar | null>(null);
  const [buyDrawerCar, setBuyDrawerCar] = useState<string | null>(null);
  const [buyDrawerEquity, setBuyDrawerEquity] = useState<string>('');

  const openDrawer = (carLabel: string, equitySummary?: string) => {
    setBuyDrawerEquity(equitySummary ?? '');
    setBuyDrawerCar(carLabel);
  };

  const { cars: dbCars } = useCatalogCars();
  const { getCarImage } = useCarImages(dbCars);
  const [allCars, setAllCars] = useState<ComparisonCar[]>([]);

  useEffect(() => {
    import('../lib/comparison').then(m => setAllCars(m.getAllComparisonCars()));
  }, []);
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

  useEffect(() => {
    if (heroTab !== 'hitta') { setShowSuggestions(false); return; }
    if (carQuery.trim()) { setShowSuggestions(true); return; }
    supabase.from('car_catalog').select('make, model').limit(8).then(({ data }) => {
      setCarSuggestions(data || []);
      setShowSuggestions(true);
    });
  }, [heroTab]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (carSearchRef.current && !carSearchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCarFocus = async () => {
    if (carQuery.trim()) { setShowSuggestions(true); return; }
    const { data } = await supabase
      .from('car_catalog')
      .select('make, model')
      .limit(8);
    setCarSuggestions(data || []);
    setShowSuggestions(true);
  };

  const handleCarQueryChange = (q: string) => {
    setCarQuery(q);
    if (carSearchTimer.current) clearTimeout(carSearchTimer.current);
    if (!q.trim()) { setCarSuggestions([]); setShowSuggestions(false); return; }
    setCarSearchLoading(true);
    carSearchTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('car_catalog')
        .select('make, model')
        .or(`make.ilike.%${q.trim()}%,model.ilike.%${q.trim()}%`)
        .limit(8);
      setCarSuggestions(data || []);
      setShowSuggestions(true);
      setCarSearchLoading(false);
    }, 250);
  };

  const handleCarSelect = (make: string, model: string) => {
    const bil = `${make} ${model}`.trim();
    setCarQuery(bil);
    setShowSuggestions(false);
    const params = new URLSearchParams({ bil });
    window.history.pushState({}, '', `/kop-bil/bestall?${params}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleCarSearch = () => {
    if (!carQuery.trim()) return;
    const params = new URLSearchParams({ bil: carQuery.trim() });
    window.history.pushState({}, '', `/kop-bil/bestall?${params}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };


  const handleMenuSelect = (item: MobileMenuItem) => {
    if (item === 'Köp bil' || item === 'Köp bil med hjälp') {
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
    if (onSell) {
      onSell(reg);
    } else {
      openDrawer(reg);
    }
  };

  const steps = DIRECT_STEPS;
  const activeBudgetPill = null;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Sälj bil"
        onSelect={handleMenuSelect}
      />
      <header className={`fixed top-4 left-1/2 -translate-x-1/2 w-[min(900px,calc(100%-32px))] z-40 h-[72px] rounded-full transition-colors duration-300 bg-[#0e6efe] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.18)] ring-1 ring-white/10`}>
        <div className="h-full flex items-center justify-between px-4 lg:px-5">
          {/* Logo */}
          <button onClick={onBackHome} className="shrink-0 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-[52px] lg:h-[68px] w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </button>

          {/* Nav links – desktop */}
          <nav className="hidden lg:flex items-center gap-7">
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/kop-bil');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-[14px] text-white/75 font-medium transition-colors hover:text-white"
            >
              Bilköpshjälpen
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="text-[14px] text-white/75 font-medium transition-colors hover:text-white"
            >
              Sälj bil
            </button>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <a
              href="/gratis-konsultation"
              onMouseEnter={() => { import('../pages/FreeConsultationPage'); import('../pages/KopBilConcierge'); }}
              className="inline-flex items-center bg-white text-[#0e6efe] text-[13px] font-semibold px-4 h-9 rounded-full hover:bg-blue-50 transition whitespace-nowrap shadow-sm"
            >
              Kostnadsfri konsultation
            </a>
            <button
              type="button"
              aria-label="Meny"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-white"
            >
              <Menu className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-[100svh] flex flex-col overflow-hidden">
        <img
          src="/files_2615643-2026-06-21T06-29-18-662Z-b858d9c8-9893-488f-8103-98fee9292c16 copy.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-[50%_65%]"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/30 to-transparent pointer-events-none" />

        <div className="relative flex-1 flex flex-col items-center justify-start pt-28 sm:pt-32 pb-10 px-5 sm:px-8">
          <div className="w-full max-w-md">
            <h1 className="text-white text-[clamp(22px,6.5vw,50px)] font-bold leading-[1.08] tracking-tight text-center drop-shadow-lg mb-2 whitespace-nowrap">
              Din bilaffär börjar här
            </h1>
            <p className="text-white/80 text-center text-[14px] sm:text-[15px] mb-6 sm:mb-7 drop-shadow">
              Sälj, köp eller byt bil — enkelt, tryggt och helt gratis
            </p>

            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Tab strip */}
              <div className="flex border-b border-slate-100">
                {(['salj', 'hitta'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setHeroTab(t)}
                    className={`flex-1 py-4 text-center text-[14px] font-bold tracking-[0.02em] relative transition-colors ${
                      heroTab === t ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t === 'salj' ? 'Sälj bil' : 'Hitta bil'}
                    <span className={`absolute bottom-0 inset-x-0 h-[2.5px] rounded-t-full transition-all duration-200 ${heroTab === t ? 'bg-[#0e6efe]' : 'bg-transparent'}`} />
                  </button>
                ))}
              </div>

              <div className="px-5 pb-5 pt-4">
                {heroTab === 'salj' ? (
                  <>
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
                        className="h-12 w-full rounded-2xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white font-bold text-[16px] transition-all inline-flex items-center justify-center gap-2 shadow-[0_4px_18px_-4px_rgba(14,110,254,0.6)]"
                      >
                        Värdera bilen
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                    <div className="mt-3 flex items-center justify-center gap-3">
                      <span className="text-[13px] text-slate-500">eller byt in din bil</span>
                      <button
                        type="button"
                        onClick={() => {
                          window.history.pushState({}, '', '/kop-bil/bestall?typ=trade');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                        className="px-4 py-1.5 rounded-xl border-2 border-slate-800 text-slate-800 text-[13px] font-bold hover:bg-slate-800 hover:text-white active:scale-[0.98] transition-all whitespace-nowrap"
                      >
                        Byta bil
                      </button>
                    </div>
                  </>
                ) : (
                  <div ref={carSearchRef} className="relative space-y-3">
                    <div className="relative">
                      <div className="flex items-center h-12 rounded-2xl bg-slate-50 border-2 border-slate-200 overflow-visible focus-within:border-[#0e6efe] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(14,110,254,0.08)] transition-all duration-200">
                        <span className="flex items-center justify-center w-11 shrink-0">
                          {carSearchLoading
                            ? <div className="w-4 h-4 border-2 border-slate-300 border-t-[#0e6efe] rounded-full animate-spin" />
                            : <Search className="w-4 h-4 text-slate-400" />
                          }
                        </span>
                        <input
                          type="text"
                          value={carQuery}
                          onChange={(e) => handleCarQueryChange(e.target.value)}
                          onFocus={handleCarFocus}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleCarSearch(); }}
                          placeholder="Sök märke eller modell..."
                          className="flex-1 min-w-0 w-0 h-full text-[14px] text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-400 font-medium"
                        />
                        {carQuery && (
                          <button
                            type="button"
                            onClick={() => { setCarQuery(''); setCarSuggestions([]); setShowSuggestions(false); }}
                            className="mr-1 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition shrink-0"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCarSearch}
                          className="h-9 mx-1.5 px-4 flex items-center justify-center bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.97] rounded-xl shrink-0 text-white font-bold text-[12px] tracking-wide transition-all shadow-[0_3px_12px_-3px_rgba(14,110,254,0.5)]"
                        >
                          Sök
                        </button>
                      </div>
                      {showSuggestions && carSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-[0_8px_32px_-8px_rgba(15,23,42,0.18)] border border-slate-100 overflow-hidden z-50">
                          {carSuggestions.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleCarSelect(s.make, s.model)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#0e6efe]/[0.04] transition-colors border-b border-slate-50 last:border-0 group"
                            >
                              <span className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition-colors">
                                <CarIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#0e6efe] transition-colors" />
                              </span>
                              <span className="text-[13px] text-slate-900 font-semibold">{s.make}</span>
                              <span className="text-[13px] text-slate-500">{s.model}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.1em] mb-2">Populärt just nu</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Tesla Model Y', make: 'Tesla', model: 'Model Y' },
                          { label: 'Volvo XC60', make: 'Volvo', model: 'XC60' },
                          { label: 'BMW 3-serie', make: 'BMW', model: '3-serie' },
                          { label: 'Kia EV6', make: 'Kia', model: 'EV6' },
                        ].map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => handleCarSelect(s.make, s.model)}
                            className="inline-flex items-center gap-1 text-[12px] text-slate-600 hover:text-[#0e6efe] bg-white hover:bg-blue-50 border border-slate-200 hover:border-[#0e6efe]/40 rounded-full px-3 py-1.5 font-medium transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                          >
                            <TrendingUp className="w-3 h-3 opacity-50" />
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.history.pushState({}, '', '/kop-bil/bestall');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-500 hover:text-slate-700 text-[12px] font-semibold transition-all inline-flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#0e6efe]" />
                      Vet inte vad du vill ha? Vi hjälper dig
                    </button>
                  </div>
                )}
              </div>

            </div>

            <div className="flex items-center justify-center gap-1.5 mt-5">
              <ShieldCheck className="w-4 h-4 text-white/70 shrink-0" />
              <p className="text-white/70 text-[13px] drop-shadow text-center">Certifierade handlare · Fri upphämtning · Pengarna direkt</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Så enkelt är det ──────────────────────────────── */}
      <section id="sa-fungerar-det" className="bg-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-3">Hur det fungerar</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold leading-[1.08] text-slate-900 tracking-[-0.02em]">
              Så enkelt är det
            </h2>
          </div>

          <DirectStepsMobile steps={steps} images={DIRECT_STEP_IMAGES} />

          <ol className="hidden sm:grid sm:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => {
              const img = DIRECT_STEP_IMAGES[i];
              return (
                <li key={step.title} className="group">
                  {img && (
                    <div className="rounded-2xl overflow-hidden aspect-[16/10] mb-6 shadow-sm">
                      <img
                        src={img}
                        alt={step.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="flex items-baseline gap-2.5 mb-2">
                    <span className="text-[13px] font-bold text-[#0e6efe] tabular-nums">0{i + 1}</span>
                    <h3 className="text-[19px] sm:text-[21px] font-semibold text-slate-900 leading-tight tracking-[-0.01em]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-slate-500 text-[15px] leading-[1.65]">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── Köpa / byta bil ───────────────────────────────── */}
      <section className="bg-slate-50 px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-3">Köp &amp; byte</p>
              <h2 className="text-[28px] sm:text-[38px] font-semibold text-slate-900 tracking-[-0.02em] leading-[1.08]">
                Ska du köpa eller byta bil?
              </h2>
              <p className="text-[15px] text-slate-500 mt-4 leading-[1.65]">
                Din personliga bilmäklare hjälper dig hela vägen — oavsett om du letar efter en ny bil, redan hittat en eller vill byta in din nuvarande.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'En personlig bilmäklare på din sida',
                  'Vi granskar pris, villkor och avtal',
                  'Betala bara om affären blir av',
                  'Fungerar vid köp, byte och leasing',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#0e6efe] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                    <span className="text-[14px] text-slate-700 leading-[1.55]">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => {
                    window.history.pushState({}, '', '/kop-bil');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="h-11 px-6 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[14px] inline-flex items-center gap-2 transition-all"
                >
                  Läs mer om hur det fungerar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="/BSM_car_sale_key_woman_handover_101122.jpg"
                alt="Personlig mäklare hjälper bilsäljare"
                className="w-full h-[260px] sm:h-[400px] md:h-[500px] object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              <div className="hidden sm:block absolute left-6 bottom-6 bg-white rounded-xl p-4 shadow-lg max-w-xs">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-9 h-9 rounded-full bg-[#0e6efe]/10 text-[#0e6efe] flex items-center justify-center">
                    <Handshake className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="text-[14px] font-semibold text-slate-900">Vi förhandlar åt dig</div>
                </div>
                <p className="text-[13px] text-slate-500 leading-[1.55]">
                  Oavsett om du köper, byter eller leasar — vi ser till att du får bästa villkor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Populära bilar ────────────────────────────────── */}
      <section id="experternas-val" className="bg-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-3">Bilkatalogen</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-slate-900 leading-[1.08] tracking-[-0.02em]">
              Vad våra kunder bytt till nyligen
            </h2>
            <p className="mt-3 text-slate-500 text-[15px] max-w-xl leading-[1.65]">
              Hitta din nästa bil bland de mest eftertraktade modellerna. Vi hjälper dig hela vägen — från val till affär.
            </p>
          </div>

          {(() => {
            const carsToShow = popularCars;
            const visibleCars = showAllCars ? carsToShow : carsToShow.slice(0, 6);
            const hasMore = carsToShow.length > 6;
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleCars.map((car, i) => {
                    const imageUrl = getCarImage(car.brand_display, car.model_display);
                    const fuelLabelStr = car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ');
                    const isEl = car.specs.fuel_types.includes('el');
                    if (isEl) {
                      return (
                        <ElCarCard
                          key={car.id}
                          name={`${car.brand_display} ${car.model_display}`}
                          imageUrl={imageUrl}
                          rating={car.ratings.overall}
                          topBadge={i === 0}
                          pros={car.pros}
                          fuelLabel={fuelLabelStr}
                          bodyType={car.specs.body_type}
                          drivetrain={car.specs.drivetrain}
                          seats={car.specs.seats}
                          carPrice={car.pricing.new_from_sek ?? undefined}
                          usedPrice={car.pricing.used_from_sek ?? undefined}
                          onNegotiate={() => openDrawer(`${car.brand_display} ${car.model_display}`)}
                          onDetail={() => setDetailCar(car)}
                          onFitQuiz={() => setFitQuizCar(car)}
                        />
                      );
                    }
                    return (
                      <CompactCarCard
                        key={car.id}
                        name={`${car.brand_display} ${car.model_display}`}
                        imageUrl={imageUrl}
                        rating={car.ratings.overall}
                        topBadge={i === 0 && activeBudgetPill === null}
                        expertComment={car.pros[0]}
                        fuelLabel={fuelLabelStr}
                        carPrice={car.pricing.new_from_sek ?? undefined}
                        usedPrice={car.pricing.used_from_sek ?? undefined}
                        onNegotiate={() => openDrawer(`${car.brand_display} ${car.model_display}`)}
                        onDetail={() => setDetailCar(car)}
                        onFitQuiz={() => setFitQuizCar(car)}
                        index={i}
                      />
                    );
                  })}
                </div>
                {hasMore && !showAllCars && (
                  <div className="mt-8 text-center">
                    <button
                      type="button"
                      onClick={() => { window.history.pushState({}, '', '/utforska'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                      className="h-11 px-7 rounded-full border border-slate-200 hover:border-[#0e6efe] text-slate-600 hover:text-[#0e6efe] font-semibold text-[14px] inline-flex items-center gap-2 transition-all"
                    >
                      Se fler bilar
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            );
          })()}

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => { window.history.pushState({}, '', '/utforska'); window.dispatchEvent(new PopStateEvent('popstate')); }}
              className="h-11 px-7 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[14px] inline-flex items-center gap-2 transition-all"
            >
              Utforska alla bilar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Din personliga rådgivare ──────────────────────── */}
      <section className="bg-slate-50 px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-3">Personlig service</p>
              <h2 className="text-[28px] sm:text-[38px] font-bold text-slate-900 tracking-[-0.02em] leading-[1.08]">
                Din personliga rådgivare
              </h2>
              <p className="text-slate-500 mt-4 text-[15px] leading-[1.65]">
                En dedikerad rådgivare jämför bud från utvalda bilhandlare och presenterar det bästa erbjudandet — du slipper samtal och förhandlingar.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Samma kontaktperson hela vägen',
                  'Du slipper samtal från olika bilhandlare',
                  'Vi sköter kontakten och förhandlingen åt dig',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-slate-700">
                    <Check className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-square max-w-[480px] mx-auto w-full">
              <img
                src="/13ccde8b-copy-copy.png"
                alt="Personlig rådgivare framför kund-bil"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <div className="hidden md:block absolute right-5 bottom-5 max-w-[240px] bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center">
                    <Phone className="w-4 h-4" strokeWidth={2.25} />
                  </div>
                  <div className="text-[13px] font-semibold text-slate-900">Alltid tillgänglig</div>
                </div>
                <p className="text-[13px] text-slate-500 leading-[1.5]">
                  En rådgivare finns här för att guida dig genom hela processen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Upphämtning i hela Sverige ────────────────────── */}
      <section className="bg-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="rounded-[28px] overflow-hidden bg-[#efe7dc] order-2 md:order-1">
              <img
                src="/ee2543a0-987e-446d-9c5e-edb20859e84d.png"
                alt="Karta över Sverige med upphämtningsorter"
                className="w-full h-auto block"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="order-1 md:order-2">
              <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-3">Täcker hela Sverige</p>
              <h2 className="text-[28px] sm:text-[38px] font-bold leading-[1.08] text-slate-900 tracking-[-0.02em]">
                Vi hämtar bilen oavsett var du bor
              </h2>
              <p className="text-slate-500 mt-4 text-[15px] leading-[1.65]">
                När du accepterar ett bud bokar vi upphämtning på en plats som passar dig. Bilen hämtas tryggt och smidigt — utan stress eller onödiga resor.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Vi hämtar där det passar dig',
                  'Trygg upphämtning utan krångel',
                  'Ingen upphämtningsavgift',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-slate-700">
                    <Check className="w-4 h-4 text-[#0e6efe] shrink-0 mt-0.5" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trygghetsbadges ───────────────────────────────── */}
      <section className="bg-slate-50 px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 sm:mb-14 max-w-2xl">
            <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-3">Trygghet</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-slate-900 tracking-[-0.02em] leading-[1.08]">
              Din partner för en trygg och smart bilaffär
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden ring-1 ring-slate-200">
            {[
              {
                icon: ShieldCheck,
                title: 'Granskade handlare',
                text: 'Endast auktoriserade bilhandlare med dokumenterad historik deltar. Vi granskar företag, omdömen och tidigare affärer innan någon får lägga ett bud.',
              },
              {
                icon: Clock,
                title: 'Snabb utbetalning',
                text: 'Pengarna landar på ditt konto innan du lämnar över bilen. Vid förmedling betalas slutpriset ut inom 1–3 bankdagar. Inga dolda kostnader.',
              },
              {
                icon: Check,
                title: 'Ingen förpliktelse',
                text: 'Du är aldrig bunden att sälja. Tacka nej till budet om du inte är nöjd — det kostar dig ingenting att avstå.',
              },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white p-7 sm:p-9 flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mb-5 shrink-0">
                    <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900 mb-2 tracking-[-0.01em]">{b.title}</h3>
                  <p className="text-slate-500 leading-[1.65] text-[14px]">{b.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA-band ──────────────────────────────────────── */}
      <section className="bg-white px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[24px] sm:rounded-[40px] bg-[#0e6efe] px-6 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14 overflow-hidden">
            <div className="absolute -right-20 -top-20 w-[360px] h-[360px] rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -left-12 -bottom-16 w-[280px] h-[280px] rounded-full bg-white/5 pointer-events-none" />

            <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold tracking-tight leading-[1.06] text-white">
                  Vill du ha hjälp att få bästa affären?
                </h2>
                <ul className="mt-6 space-y-3">
                  {[
                    'En personlig bilexpert sköter förhandlingen',
                    'Vi jämför bud från handlare åt dig',
                    'Du får konkreta råd och sparar pengar',
                  ].map((text) => (
                    <li key={text} className="flex items-center gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-white/20">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                      <span className="text-[15px] text-white/90 font-medium">{text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/gratis-konsultation"
                    className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-white text-[#0e6efe] text-[15px] font-bold transition-all hover:bg-slate-100 active:scale-[0.98] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)]"
                  >
                    Kostnadsfri konsultation
                  </a>
                  <a
                    href="tel:+46855550200"
                    className="inline-flex items-center justify-center h-12 px-7 rounded-full border-2 border-white/40 text-white text-[15px] font-semibold transition-all hover:bg-white/10 active:scale-[0.98]"
                  >
                    <Phone className="w-4 h-4 mr-2 shrink-0" strokeWidth={2.5} />
                    Ring 08-5555 0200
                  </a>
                </div>
              </div>

              <div className="relative h-[260px] sm:h-[320px] lg:h-[360px]">
                <div className="absolute left-0 top-0 w-[72%] h-full rounded-[18px] sm:rounded-[24px] overflow-hidden">
                  <img
                    src="/858c5bbb-bilto-hoodie.png"
                    alt="Bilexpert"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 right-0 bg-white rounded-2xl shadow-xl p-2.5 w-[148px] sm:w-[168px]">
                  <p className="text-[10px] font-bold text-slate-900 text-center mb-1.5">Välj en tid</p>
                  <CalendarWidget />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Josefin testimonial ───────────────────────────── */}
      <section className="bg-slate-50 px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-12 gap-8 sm:gap-12 items-center">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-4">Kundberättelse</p>
              <h2 className="text-[24px] sm:text-[34px] font-semibold leading-[1.12] text-slate-900 tracking-[-0.02em]">
                "Jag visste ingenting om bilar — Bilto skötte allt och jag fick mer än jag vågat hoppas på."
              </h2>
              <p className="text-[13px] text-slate-400 mt-5 font-medium">
                Josefin L. — Volvo XC40, 2022
              </p>
            </div>
            <div className="md:col-span-7">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src="/manrope_(1920_x_1080_px)_(1280_x_720_px)_(1200_x_1400_px)_(2000_x_2000_px)_(1).png"
                  alt="Josefin framför sin Volvo XC40"
                  className="w-full h-[280px] sm:h-[440px] md:h-[520px] object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ReviewsSection variant="muted" />

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="bg-[#0e6efe] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">Vanliga frågor</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-white tracking-[-0.02em] leading-[1.08]">
              Fler frågor? Vi har svaren.
            </h2>
          </div>
          <div className="divide-y divide-white/15 border-y border-white/15">
            {FAQ.map((item, idx) => {
              const open = openFaq === idx;
              return (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => setOpenFaq(open ? null : idx)}
                  className="w-full text-left py-5 flex items-start gap-4 group"
                >
                  <div className="flex-1">
                    <h3 className="text-[16px] font-semibold text-white leading-snug">{item.q}</h3>
                    {open && (
                      <p className="mt-3 text-[14px] text-white/75 leading-[1.65]">{item.a}</p>
                    )}
                  </div>
                  {open
                    ? <ChevronDown className="w-5 h-5 text-white/60 mt-0.5 shrink-0 rotate-180 transition-transform" />
                    : <ChevronDown className="w-5 h-5 text-white/40 mt-0.5 shrink-0 transition-transform" />
                  }
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
              <h2 className="text-[28px] sm:text-[38px] font-semibold text-slate-900 tracking-[-0.02em] leading-[1.08] mb-4">
                Vilka bilar köper Bilto?
              </h2>
              <p className="text-slate-600 text-[15px] leading-[1.6]">
                Bilto hjälper till att förmedla och sälja de flesta typer av bilar – oavsett märke, modell eller skick.
                Vi arbetar både med privatpersoner och ett nätverk av seriösa bilhandlare över hela Sverige, vilket gör
                att vi kan hitta köpare för många olika typer av fordon.
              </p>

              <h3 className="mt-6 text-[16px] font-semibold text-slate-900">Vi hjälper bland annat till med:</h3>
              <ul className="mt-2 space-y-1 text-slate-600 text-[14px] leading-[1.6] list-disc pl-5">
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
              <p className="mt-1 text-slate-600 text-[15px] leading-[1.6]">
                Vissa bilar är extra eftertraktade på marknaden och får ofta många intressenter:
              </p>
              <ul className="mt-2 space-y-1 text-slate-600 text-[14px] leading-[1.6] list-disc pl-5">
                <li>Nyare bilar</li>
                <li>Svensksålda bilar</li>
                <li>Bilar med servicehistorik</li>
                <li>Automatlåda</li>
                <li>El- och hybridbilar</li>
                <li>Populära märken som Volvo, BMW, Audi, Volkswagen, Tesla och Toyota</li>
              </ul>

              <h3 className="mt-6 text-[16px] font-semibold text-slate-900">Kan ni hjälpa till med äldre eller skadade bilar?</h3>
              <p className="mt-1 text-slate-600 text-[15px] leading-[1.6]">
                Ja. Även äldre bilar, bilar med kosmetiska skador eller högre miltal kan vara intressanta för våra köpare och handlare.
                Det viktigaste är att informationen om bilen är korrekt när du skickar in din förfrågan.
              </p>

              <h3 className="mt-6 text-[16px] font-semibold text-slate-900">Hur vet jag om min bil är intressant?</h3>
              <p className="mt-1 text-slate-600 text-[15px] leading-[1.6]">
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
          className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center justify-center gap-2.5 h-14 rounded-full bg-[#0e6efe] hover:bg-[#0047B3] text-white font-semibold text-[15px] shadow-[0_10px_30px_rgba(14,110,254,0.4)] transition animate-[slideUp_0.3s_ease-out]"
        >
          <img src="/Man_in_car_showroom_portrait.png" alt="Expert" className="w-8 h-8 rounded-full object-cover border-2 border-white/40 shrink-0" />
          <span>Ring expert &middot; bud direkt</span>
        </a>
      )}

      <Suspense fallback={null}>
        <BuyDrawer
          car={buyDrawerCar}
          initialAdditionalRequests={buyDrawerEquity || undefined}
          onClose={() => { setBuyDrawerCar(null); setBuyDrawerEquity(''); }}
        />
      </Suspense>

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
          onNegotiate={() => { if (fitQuizCar) { openDrawer(`${fitQuizCar.brand_display} ${fitQuizCar.model_display}`); setFitQuizCar(null); } }}
        />
      </Suspense>
    </div>
  );
}

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
      {/* Horizontal scroll carousel — peek left/right */}
      <div
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-5 pb-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        onScroll={handleScroll}
      >
        {steps.map((step, i) => (
          <div
            key={i}
            className="snap-center shrink-0 w-[82vw] max-w-[340px]"
          >
            {/* Image with step badge */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-md">
              <img
                src={images[i]}
                alt={step.title}
                className="w-full h-full object-cover"
              />
              {/* Step number badge */}
              <div className="absolute bottom-3 left-3 w-9 h-9 rounded-xl bg-[#0e6efe] flex items-center justify-center shadow-lg">
                <span className="text-white text-[14px] font-bold tabular-nums">{i + 1}</span>
              </div>
            </div>
            {/* Text below image */}
            <div className="px-1 pt-4 pb-2">
              <h3 className="text-[16px] font-bold text-slate-900 leading-tight tracking-tight mb-1.5">
                {step.title}
              </h3>
              <p className="text-[14px] text-slate-600 leading-[1.6]">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
