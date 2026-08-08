import { useState, useEffect, lazy, Suspense } from 'react';
import { useRef } from 'react';
import {
  Menu,
  ArrowRight,
  Search,
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
  Star,
  TrendingUp,
  MapPin,
  BadgeCheck,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import SeoCarsSection from '../components/SeoCarsSection';
import ReviewsSection from '../components/ReviewsSection';
import CompactCarCard from '../components/CompactCarCard';
import { PHONE, PHONE_TEL, EXPERT_PHOTO } from '../config/site';
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
  seoSlug?: 'home' | 'sa-funkar-det' | 'salj-bil';
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
    title: 'Din egen expert från dag ett',
    text: 'En dedikerad rådgivare tar hand om dig hela vägen – oavsett om du säljer, byter eller köper bil.',
  },
  {
    icon: Gavel,
    title: 'Vi pressar fram bästa budet',
    text: 'Vi inhämtar konkurrerande bud från granskade bilhandlare och presenterar bara det bästa. Du jämför, du väljer.',
  },
  {
    icon: Handshake,
    title: 'Vi hämtar eller levererar bilen',
    text: 'Tackar du ja ordnar vi upphämtning av din sålda bil eller leverans av den nya – var som helst i Sverige. Noll krångel.',
  },
];

const DIRECT_STEP_IMAGES = [
  '/ChatGPT_Image_20_maj_2026_02_01_19.png',
  '/e66827b0-71c5-48a7-8d91-5123f7db4a0d.png',
  '/55e96830-06e0-436b-8559-63a5b9cf41af.png',
];

const USUAL_WAY = [
  { title: 'Vem ringer vem', desc: 'Du fyller i ett formulär. Flera handlare bombarderar din telefon i en vecka.' },
  { title: 'Priset', desc: 'Du får ett bud och hoppas det är bra. Ingen visar vad bilen är värd på marknaden.' },
  { title: 'Förhandlingen', desc: 'Du står ensam mot handlaren – utan att veta vad bilen faktiskt är värd.' },
  { title: 'Det finstilta', desc: 'Dolda avgifter och tilläggtjänster på tusentals kronor göms i avtalet.' },
];

const OUR_WAY = [
  { title: 'Vem ringer vem', desc: 'Vi kontaktar handlarna. Ditt numre når aldrig dem. Noll spam.' },
  { title: 'Priset', desc: 'Vi värderar bilen mot marknadsdata och låter handlare buda mot varandra.' },
  { title: 'Förhandlingen', desc: 'En erfaren expert förhandlar åt dig. Du får det bästa budet – du väljer.' },
  { title: 'Det finstilta', desc: 'Vi granskar varje villkor. Inga dolda avgifter, inga överraskningar.' },
];

const SAVINGS_TESTIMONIALS = [
  { name: 'Maria K.', car: 'VW Tiguan 2021', saved: '12 000 kr', text: 'Fick tre bud inom två dagar. Bästa budet var 12 000 kr högre än handlarens första erbjudande.' },
  { name: 'Johan S.', car: 'Audi A6 2020', saved: '18 000 kr', text: 'Bilto värderade bilen och förhandlade. Jag slapp alla samtal från handlare – fantastiskt.' },
  { name: 'Erik L.', car: 'Volvo V60 2019', saved: '8 000 kr', text: 'Snabbt, smidigt och gratis. Pengarna landade på kontot innan jag lämnade över bilen.' },
  { name: 'Sara N.', car: 'BMW X3 2022', saved: '15 000 kr', text: 'Tvekade först men det var helt klart värt det. Bilen hämtades gratis och allt skötte sig självt.' },
  { name: 'Anders H.', car: 'Tesla Model 3', saved: '20 000 kr', text: 'Elbilar är eftertraktade. Fick fem bud och valde det bästa. Helt krångelfritt.' },
  { name: 'Linda M.', car: 'Kia Ceed 2021', saved: '10 000 kr', text: 'Rekommenderar till alla. Värderingen var rättvis och budet kom snabbt.' },
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
    q: 'Hur värderar ni min bil?',
    a: 'Vi använder marknadsdata, jämför liknande bilar och tar hänsyn till skick, miltal och utrustning. Värderingen är opartisk och gratis.',
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
  { icon: BadgeCheck, title: 'Noll förpliktelse', text: 'Du är aldrig bunden att sälja. Tacka nej kostnadsfritt.' },
];

const PRESS_LOGOS = ['Dagens Industri', 'Aftonbladet', 'SVT Nyheter', 'TV4', 'Breakit'];

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
            className={`h-5 w-full text-[10px] font-medium rounded-xl transition-colors ${
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

export default function HowItWorks({ onBackHome, onSell, showSeo = false, pageTitle, seoSlug }: HowItWorksProps) {
  useEffect(() => {
    if (seoSlug === 'sa-funkar-det') {
      setPageMeta({
        title: 'Så funkar Bilto – sälj eller köp bil med expert',
        description: 'Se hur Bilto hjälper dig sälja bilen till bästa pris eller köpa rätt bil med en dedikerad expert. Gratis värdering – ingen bindning.',
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
  const [carSuggestions, setCarSuggestions] = useState<{ make: string; model: string; image_url?: string | null; cleaned_image_url?: string | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [carSearchLoading, setCarSearchLoading] = useState(false);
  const carSearchRef = useRef<HTMLDivElement>(null);
  const carSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [carsModalOpen, setCarsModalOpen] = useState(false);
  const [detailCar, setDetailCar] = useState<ComparisonCar | null>(null);
  const [fitQuizCar, setFitQuizCar] = useState<ComparisonCar | null>(null);
  const [buyDrawerCar, setBuyDrawerCar] = useState<string | null>(null);
  const [buyDrawerEquity, setBuyDrawerEquity] = useState<string>('');
  const [buyDrawerTrack, setBuyDrawerTrack] = useState<'found' | 'searching' | 'trade' | undefined>(undefined);

  const openDrawer = (carLabel: string, equitySummary?: string, track?: 'found' | 'searching' | 'trade') => {
    setBuyDrawerEquity(equitySummary ?? '');
    setBuyDrawerTrack(track);
    setBuyDrawerCar(track === 'trade' && !carLabel ? '' : carLabel);
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
  const [cardMode, setCardMode] = useState<'ny' | 'beg'>('beg');

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
    if (heroTab !== 'hitta') { setShowSuggestions(false); }
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

  const handleCarFocus = () => {
    if (carQuery.trim()) { setShowSuggestions(true); }
  };

  const handleCarQueryChange = (q: string) => {
    setCarQuery(q);
    if (carSearchTimer.current) clearTimeout(carSearchTimer.current);
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) {
      setCarSuggestions([]);
      setShowSuggestions(false);
      setCarSearchLoading(false);
      return;
    }
    setCarSearchLoading(true);
    carSearchTimer.current = setTimeout(async () => {
      const search = `%${trimmed}%`;
      const { data, error } = await supabase
        .from('car_catalog')
        .select('make, model, image_url, cleaned_image_url')
        .or(`make.ilike.${search},model.ilike.${search}`)
        .order('make', { ascending: true });
      if (error) {
        setCarSuggestions([]);
        setShowSuggestions(false);
        setCarSearchLoading(false);
        return;
      }
      const seen = new Set<string>();
      const results = (data || []).filter(({ make, model }) => {
        const key = `${make}|${model}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setCarSuggestions(results);
      setShowSuggestions(results.length > 0);
      setCarSearchLoading(false);
    }, 300);
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
      openDrawer(reg);
    }
  };

  const steps = DIRECT_STEPS;

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
              onMouseEnter={() => { import('../pages/FreeConsultationPage'); import('../pages/KopBilConcierge'); }}
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

        <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0e6efe]/10 px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#0e6efe]" />
              <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-wider">Gratis värdering – ingen bindning</span>
            </div>
            <h1 className="text-[32px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.06] tracking-[-0.04em] text-slate-800">
              {seoSlug === 'salj-bil'
                ? 'Säljhjälpen – vi tar in buden, du väljer det bästa.'
                : 'En bilexpert på din sida – när du säljer, köper eller byter.'}
            </h1>
            <p className="mt-5 text-[16px] sm:text-[19px] leading-[1.5] text-slate-500 max-w-2xl mx-auto">
              Vi värderar, förhandlar och granskar åt dig. Du bestämmer.
            </p>
          </div>

          {/* Hero search card */}
          <div className="relative max-w-2xl mx-auto mt-10 rounded-[24px] border border-slate-200 bg-white p-5 sm:p-7 shadow-[0_20px_60px_rgba(14,110,254,0.10)] text-left">
            <div className="flex border-b border-slate-100 mb-5 -mt-1">
              {(['salj', 'hitta'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setHeroTab(t)}
                  className={`flex-1 pb-3 text-center text-[14px] font-bold tracking-[0.02em] relative transition-colors ${
                    heroTab === t ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t === 'salj' ? 'Sälj bil' : 'Bilköpshjälp'}
                  <span className={`absolute bottom-0 inset-x-0 h-[2.5px] rounded-t-full transition-all duration-200 ${heroTab === t ? 'bg-[#0e6efe]' : 'bg-transparent'}`} />
                </button>
              ))}
            </div>

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
                    className="h-12 w-full rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white font-bold text-[16px] transition-all inline-flex items-center justify-center gap-2 shadow-[0_4px_18px_-4px_rgba(14,110,254,0.5)]"
                  >
                    Värdera bilen
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <span className="text-[13px] text-slate-500">eller byt in din bil</span>
                  <button
                    type="button"
                    onClick={() => openDrawer('', undefined, 'trade')}
                    className="px-4 py-1.5 rounded-xl border-2 border-slate-200 text-slate-700 text-[13px] font-bold hover:border-slate-900 hover:bg-slate-900 hover:text-white active:scale-[0.98] transition-all whitespace-nowrap"
                  >
                    Byta bil
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {[
                  { icon: Handshake, title: 'Jag har hittat en bil', sub: 'Låt oss förhandla och granska åt dig.', params: { typ: 'found' } },
                  { icon: Search, title: 'Jag letar efter bil', sub: 'Utforska, jämför eller testa bilmatch.', params: { typ: 'searching' } },
                  { icon: CarIcon, title: 'Jag vill byta bil', sub: 'Vi hittar och förhandlar nästa bil åt dig.', params: { typ: 'trade' } },
                ].map(({ icon: Icon, title, sub, params }) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => {
                      const p = new URLSearchParams(params);
                      window.history.pushState({}, '', `/kop-bil/bestall?${p}`);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-slate-200 hover:border-[#0e6efe]/40 hover:bg-[#0e6efe]/[0.03] active:scale-[0.99] transition text-left group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition">
                      <Icon className="w-4 h-4 text-slate-500 group-hover:text-[#0e6efe] transition" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-900 leading-snug">{title}</p>
                      <p className="text-[12px] text-slate-400 mt-0.5 leading-snug">{sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0e6efe] shrink-0 transition" />
                  </button>
                ))}
              </div>
            )}
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

      {/* ── Press logos ── */}
      <section className="bg-white py-8 px-5 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.20em] mb-5">Omnämnda i</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {PRESS_LOGOS.map((logo) => (
              <span key={logo} className="text-[16px] sm:text-[18px] font-bold text-slate-300 tracking-tight">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Så enkelt är det ── */}
      <section id="sa-fungerar-det" className="bg-gradient-to-b from-white to-[#f7f9ff] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Hur det fungerar
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-800">
              Så enkelt är det
            </h2>
          </div>

          <DirectStepsMobile steps={steps} images={DIRECT_STEP_IMAGES} />

          <ol className="hidden sm:grid sm:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => {
              const img = DIRECT_STEP_IMAGES[i];
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
        </div>
      </section>

      {/* ─<arg_value>      {/* ── Savings testimonials ── */}
      <section className="bg-[#f7f9ff] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Riktiga kunder. Riktiga besparingar.
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-800">
              Så mycket mer fick våra kunder
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAVINGS_TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col transition hover:shadow-[0_8px_30px_rgba(14,110,254,0.06)] hover:border-slate-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {[0,1,2,3,4].map(i => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[14px] text-slate-600 leading-[1.6] flex-1">"{t.text}"</p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[14px] font-bold text-slate-800">{t.name}</p>
                  <p className="text-[12px] text-slate-400">{t.car}</p>
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[13px] font-bold text-emerald-700">Fick {t.saved} mer</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Usual way vs Our way ── */}
      <section className="bg-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Varför våra kunder får mer
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-800">
              Handlaren har en orättvis fördel. Tills nu.
            </h2>
            <p className="text-slate-500 mt-4 text-[16px] sm:text-[19px] leading-[1.5] max-w-2xl mx-auto">
              Ett vanligt bilförsäljning kostar de flesta säljare tusentals kronor mindre än vad bilen är värd. Så här ändrar Bilto på det.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-200/60 flex items-center justify-center">
                  <X className="w-5 h-5 text-slate-400" strokeWidth={2.5} />
                </div>
                <h3 className="text-[18px] font-bold text-slate-400">Det vanliga sättet</h3>
              </div>
              <div className="space-y-5">
                {USUAL_WAY.map((item) => (
                  <div key={item.title}>
                    <p className="text-[14px] font-semibold text-slate-500 mb-1">{item.title}</p>
                    <p className="text-[14px] text-slate-400 leading-[1.6]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-[#0e6efe] bg-[#f0f5ff]/50 p-6 sm:p-8 shadow-[0_8px_30px_rgba(14,110,254,0.08)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#0e6efe]" strokeWidth={2.5} />
                </div>
                <h3 className="text-[18px] font-bold text-[#0e6efe]">Vårt sätt</h3>
              </div>
              <div className="space-y-5">
                {OUR_WAY.map((item) => (
                  <div key={item.title}>
                    <p className="text-[14px] font-semibold text-slate-800 mb-1">{item.title}</p>
                    <p className="text-[14px] text-slate-600 leading-[1.6]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Köp & byte ── */}
      <section className="bg-gradient-to-b from-[#f7f9ff] to-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
                Köp &amp; byte
              </span>
              <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-800 tracking-[-0.03em] leading-[1.08]">
                Spara pengar på din nästa bil.
              </h2>
              <p className="text-[15px] text-slate-500 mt-4 leading-[1.65]">
                Din personliga bilmäklare hjälper dig hela vägen – oavsett om du letar efter en ny bil, redan hittat en eller vill byta in din nuvarande.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'En dedikerad bilmäklare på din sida',
                  'Vi granskar pris, villkor och avtal åt dig',
                  'Du betalar bara om affären går i lås',
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
                  className="h-11 px-6 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[14px] inline-flex items-center gap-2 transition-all shadow-lg shadow-[#0e6efe]/20"
                >
                  Få prishjälp
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden ring-1 ring-slate-200 shadow-lg">
              <img
                src="/BSM_car_sale_key_woman_handover_101122.jpg"
                alt="Personlig mäklare hjälper bilsäljare"
                className="w-full h-[260px] sm:h-[400px] md:h-[500px] object-cover object-center"
                loading="lazy"
                decoding="async"
                width="960"
                height="640"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              <div className="hidden sm:block absolute left-6 bottom-6 bg-white rounded-xl p-4 shadow-lg max-w-xs">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0e6efe]/10 text-[#0e6efe] flex items-center justify-center">
                    <Handshake className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="text-[14px] font-semibold text-slate-900">Vi förhandlar åt dig</div>
                </div>
                <p className="text-[13px] text-slate-500 leading-[1.55]">
                  Oavsett om du köper, byter eller leasar – vi ser till att du får bästa villkor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Populära bilar ── */}
      <section id="experternas-val" className="bg-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <p className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">EXPERTERNAS VAL</p>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-800 leading-[1.08] tracking-[-0.03em]">
                  Bilar vår expert rekommenderar just nu
                </h2>
                <p className="mt-3 text-slate-500 text-[15px] max-w-xl leading-[1.65]">
                  Handplockade modeller med bäst balans mellan pris, driftskostnad och tillförlitlighet. Berätta vad du söker – vi förhandlar priset.
                </p>
              </div>
            </div>
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
                          make={car.brand_display}
                          imageUrl={imageUrl}
                          rating={car.ratings.overall}
                          topBadge={i === 0}
                          pros={car.pros}
                          fuelLabel={fuelLabelStr}
                          fuelTypes={car.specs.fuel_types}
                          bodyType={car.specs.body_type}
                          drivetrain={car.specs.drivetrain}
                          seats={car.specs.seats}
                          carPrice={car.pricing.new_from_sek ?? undefined}
                          usedPrice={car.pricing.used_from_sek ?? undefined}
                          cardMode={cardMode}
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
                        make={car.brand_display}
                        imageUrl={imageUrl}
                        rating={car.ratings.overall}
                        topBadge={i === 0}
                        expertComment={car.pros[0]}
                        fuelLabel={fuelLabelStr}
                        fuelTypes={car.specs.fuel_types}
                        carPrice={car.pricing.new_from_sek ?? undefined}
                        usedPrice={car.pricing.used_from_sek ?? undefined}
                        cardMode={cardMode}
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
                      onClick={() => setShowAllCars(true)}
                      className="h-11 px-7 rounded-xl border border-slate-200 hover:border-[#0e6efe] text-slate-600 hover:text-[#0e6efe] font-semibold text-[14px] inline-flex items-center gap-2 transition-all"
                    >
                      Se fler bilar
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            );
          })()}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[15px] font-semibold text-slate-900 leading-snug">Osäker på vilken som passar dig?</p>
              <p className="mt-1 text-[13px] text-slate-500 leading-[1.6] max-w-md">Svara på 5 korta frågor om hur du kör och vad du prioriterar – vi matchar dig med rätt bilar.</p>
            </div>
            <button
              type="button"
              onClick={() => popularCars.length > 0 && setFitQuizCar(popularCars[0])}
              className="shrink-0 h-10 px-5 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[13px] inline-flex items-center gap-2 transition-all whitespace-nowrap"
            >
              Testa bilmatch – tar 60 sekunder
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Personlig rådgivare ── */}
      <section className="bg-gradient-to-b from-white to-[#f7f9ff] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
                Personlig service
              </span>
              <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-800 tracking-[-0.03em] leading-[1.08]">
                Din personliga rådgivare
              </h2>
              <p className="text-slate-500 mt-4 text-[15px] leading-[1.65]">
                En dedikerad expert hanterar hela processen – från att inhämta bud till att presentera det bästa erbjudandet. Du slipper telefonsamtal från handlare och onödiga förhandlingar.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Samma kontaktperson hela vägen',
                  'Inga samtal från okända handlare',
                  'Vi förhandlar och sköter all kontakt åt dig',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-slate-700">
                    <Check className="w-4 h-4 mt-0.5 text-[#0e6efe] shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-square max-w-[480px] mx-auto w-full ring-1 ring-slate-200 shadow-lg">
              <img
                src="/13ccde8b-copy-copy.png"
                alt="Personlig rådgivare framför kund-bil"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width="480"
                height="480"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <div className="hidden md:block absolute right-5 bottom-5 max-w-[240px] bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0e6efe]/10 text-[#0e6efe] flex items-center justify-center">
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

      {/* ── Upphämtning ── */}
      <section className="bg-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 md:order-1 flex justify-center">
              <img
                src="/3c4ee06c-25d5-4c3f-ae5b-354bef7f043c.png"
                alt="Karta över Sverige med upphämtningsorter"
                className="max-w-full h-auto block"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="order-1 md:order-2">
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
                Täcker hela Sverige
              </span>
              <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.08] text-slate-800 tracking-[-0.03em]">
                Din bil hämtas – var du än bor
              </h2>
              <p className="text-slate-500 mt-4 text-[15px] leading-[1.65]">
                När du accepterar ett bud bokar vi upphämtning på en plats som passar dig. Gratis, smidigt och utan onödiga resor.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Vi hämtar där det passar dig',
                  'Trygg och smidig upphämtning',
                  'Ingen upphämtningsavgift',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-slate-700">
                    <MapPin className="w-4 h-4 text-[#0e6efe] shrink-0 mt-0.5" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trygghet ── */}
      <section className="bg-gradient-to-b from-[#f7f9ff] to-white px-4 sm:px-6 py-16 sm:py-24">
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
                <div key={b.title} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col transition hover:shadow-[0_8px_30px_rgba(14,110,254,0.06)] hover:border-slate-300">
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

      {/* ── CTA-band ── */}
      <section className="bg-white px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[24px] border border-[#0e6efe]/30 bg-[#f0f5ff] px-6 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14 overflow-hidden shadow-[0_20px_60px_rgba(14,110,254,0.08)]">
            <div className="absolute -right-20 -top-20 w-[360px] h-[360px] rounded-full bg-white/40 pointer-events-none" />
            <div className="absolute -left-12 -bottom-16 w-[280px] h-[280px] rounded-full bg-white/30 pointer-events-none" />
            <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold tracking-[-0.03em] leading-[1.06] text-slate-800">
                  Vill du ha en expert i ditt hörn?
                </h2>
                <ul className="mt-6 space-y-3">
                  {[
                    'En personlig bilexpert sköter hela förhandlingen',
                    'Vi jämför bud från granskade handlare åt dig',
                    'Våra kunder får ofta mer än vad bilen är värd',
                  ].map((text) => (
                    <li key={text} className="flex items-center gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-[#0e6efe]">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                      <span className="text-[15px] text-slate-700 font-medium">{text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/gratis-konsultation"
                    className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#0e6efe] text-white text-[15px] font-bold transition-all hover:bg-[#0a57cc] active:scale-[0.98] shadow-lg shadow-[#0e6efe]/25"
                  >
                    Kostnadsfri konsultation
                  </a>
                  <a
                    href={PHONE_TEL}
                    className="inline-flex items-center justify-center h-12 px-7 rounded-xl border-2 border-[#0e6efe]/30 text-[#0e6efe] text-[15px] font-semibold transition-all hover:bg-[#0e6efe] hover:text-white active:scale-[0.98]"
                  >
                    <Phone className="w-4 h-4 mr-2 shrink-0" strokeWidth={2.5} />
                    Ring {PHONE}
                  </a>
                </div>
              </div>

              <div className="relative h-[260px] sm:h-[320px] lg:h-[360px]">
                <div className="absolute left-0 top-0 w-[72%] h-full rounded-[18px] sm:rounded-[24px] overflow-hidden ring-1 ring-slate-200 shadow-lg">
                  <img
                    src="/858c5bbb-bilto-hoodie.png"
                    alt="Bilexpert"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                    width="720"
                    height="520"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 right-0 bg-white rounded-xl shadow-xl p-2.5 w-[148px] sm:w-[168px] ring-1 ring-slate-200">
                  <p className="text-[10px] font-bold text-slate-900 text-center mb-1.5">Välj en tid</p>
                  <CalendarWidget />
                </div>
              </div>
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
                onClick={() => { setHeroTab('salj'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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

      {showSeo && <SeoCarsSection />}

      <SiteFooter />

      {carsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setCarsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCarsModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
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
              </p>
            </div>
          </div>
        </div>
      )}

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
          initialAdditionalRequests={buyDrawerEquity || undefined}
          onClose={() => { setBuyDrawerCar(null); setBuyDrawerEquity(''); setBuyDrawerTrack(undefined); }}
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
          onNegotiate={() => {
            if (fitQuizCar) {
              const name = encodeURIComponent(`${fitQuizCar.brand_display} ${fitQuizCar.model_display}`);
              setFitQuizCar(null);
              window.history.pushState({}, '', `/kop-bil/bestall?bil=${name}&typ=found`);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
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
      <div
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-5 pb-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        onScroll={handleScroll}
      >
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="snap-center shrink-0 w-[74vw] max-w-[300px]">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] shadow-md ring-1 ring-slate-200">
                <img
                  src={images[i]}
                  alt={step.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width="300"
                  height="188"
                />
                <div className="absolute bottom-3 left-3 w-9 h-9 rounded-xl bg-[#0e6efe] flex items-center justify-center shadow-lg">
                  <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
              </div>
              <div className="px-1 pt-4 pb-2">
                <h3 className="text-[16px] font-bold text-slate-800 leading-tight tracking-tight mb-1.5">
                  {step.title}
                </h3>
                <p className="text-[14px] text-slate-600 leading-[1.6]">{step.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
