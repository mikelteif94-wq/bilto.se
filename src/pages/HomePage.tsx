import { useState, useEffect, Suspense, lazy } from 'react';
import {
  Menu,
  ArrowRight,
  Check,
  Phone,
  ShieldCheck,
  Clock,
  Banknote,
  ChevronDown,
  X,
  Search,
  Handshake,
  Car,
  Star,
  Quote,
  Sparkles,
  TrendingDown,
  FileCheck,
  Users,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import ReviewsSection from '../components/ReviewsSection';
import { setPageMeta } from '../lib/pageMeta';
import { PHONE, PHONE_TEL, EXPERT_PHOTO } from '../config/site';

const BuyDrawer = lazy(() => import('../components/BuyDrawer'));

interface HomePageProps {
  onNavigate: (regnummer: string, telefon: string) => void;
  onNavigateBuy?: (bil?: string) => void;
  onNavigateSell?: () => void;
  onNavigateHowItWorks?: () => void;
  onNavigatePricing?: () => void;
  showSeo?: boolean;
  pageTitle?: string;
}

const USP_WAY = [
  { icon: Search, title: 'Söker hela marknaden', desc: 'Vi letar på alla plattformar – inte bara ett handlares lager.' },
  { icon: Handshake, title: 'Förhandlar åt dig', desc: 'Vi vet vad handlaren betalat och var marginalen finns.' },
  { icon: FileCheck, title: 'Granskar historik', desc: 'Ägarhistorik, skador, miltal och service – kontrollerat före köp.' },
  { icon: Banknote, title: 'Pressar räntan', desc: 'Vi jämför finansiering och pressar räntan mot flera aktörer.' },
];

const USUAL_WAY = [
  { title: 'Vem ringer vem', desc: 'Du fyller i ett formulär. Fem handlare bombarderar din telefon i en vecka.' },
  { title: 'Siffrorna', desc: 'Handlaren har alla siffror – inköpspris, rabatter, marginaler. Du ser prislappen och hoppas.' },
  { title: 'Förhandlingen', desc: 'Du sitter i showroom i fyra timmar under press, utan någon som står på din sida.' },
  { title: 'Det finstilta', desc: 'Tilläggtjänster och dolda avgifter på tusentals kronor göms i avtalet.' },
];

const OUR_WAY = [
  { title: 'Vem ringer vem', desc: 'Vi kontaktar handlaren. Ditt nummer når aldrig dem.' },
  { title: 'Siffrorna', desc: 'Vi vet vad handlaren betalat och var marginalen finns. Samma siffror som handlaren ser.' },
  { title: 'Förhandlingen', desc: 'En erfaren expert förhandlar innan du ens besöker handlaren. Du går in med ett låst pris – eller går inte alls.' },
  { title: 'Det finstilta', desc: 'Varje rad i avtalet granskas. Dolda avgifter tas bort innan du skriver på.' },
];

const PRICING_PLANS = [
  {
    name: 'Gratis värdering',
    price: '0 kr',
    period: 'alltid',
    desc: 'Marknadsdata, bilmatch, värdering av din bil.',
    features: ['Värdera din bil gratis', 'Sök bland bilar', 'Bilmatch-quiz'],
    cta: 'Börja gratis',
    highlight: false,
    action: 'sell' as const,
  },
  {
    name: 'Bilköpshjälpen',
    price: '4 995 kr',
    period: 'per affär',
    desc: 'En expert söker, förhandlar och granskar åt dig – betalas bara om affären blir av.',
    features: ['Söker hela marknaden', 'Förhandlar pris, ränta och tillval', 'Granskar historik och skick', 'Koordinerar hemleverans'],
    cta: 'Skicka förfrågan',
    highlight: true,
    action: 'buy' as const,
  },
  {
    name: 'Säljhjälpen',
    price: '0 kr',
    period: 'vi tar en avgift av handlaren',
    desc: 'Granskade handlare konkurrerar om din bil. Du väljer bästa bud.',
    features: ['Gratis värdering', 'Handlare bjuder mot varandra', 'Fri upphämtning', 'Pengar på kontot'],
    cta: 'Värdera min bil',
    highlight: false,
    action: 'sell' as const,
  },
];

const SAVINGS_ITEMS = [
  { label: 'Prisförhandling på bilen', amount: '8 000–12 000 kr', desc: 'Vi vet vad handlaren betalat och utnyttjar marginalen.' },
  { label: 'Ränterabatt på finansiering', amount: '3 000–6 000 kr', desc: 'Vi jämför och pressar räntan mot flera finansaktörer.' },
  { label: 'Däck & tillval', amount: '2 000–4 000 kr', desc: 'Vinterdäck, golvmattor och service tas med i paketet.' },
];

const FAQS = [
  {
    q: 'Vad kostar det att använda Bilto?',
    a: 'Bilköpshjälpen kostar 4 995 kr i fast avgift – betalas bara om affären blir av. Säljhjälpen är gratis för dig; vi tar en avgift av handlaren. Inga dolda kostnader, noll provision.',
  },
  {
    q: 'Hur hjälper Bilto mig att köpa bil?',
    a: 'Du berättar vilken bil du är intresserad av – vi tar över därifrån. Vi kontaktar säljaren, verifierar annonsen, förhandlar pris, ränta och tillbehör, och ser till att du inte betalar mer än du måste.',
  },
  {
    q: 'Hur stor besparing kan jag räkna med?',
    a: 'Snittbesparingen är 18 000 kr per affär – räknat på prisnedförhandling, ränta och tillbehör. Vår avgift på 4 995 kr betalas dessutom bara om affären blir av.',
  },
  {
    q: 'Kommer handlare att bombardera min telefon?',
    a: 'Aldrig. Ditt nummer stannar hos dig. Vi hanterar alla mejl, samtal och meddelanden åt dig. Noll spam.',
  },
  {
    q: 'Hur lång tid tar det?',
    a: 'De flesta kunder har ett klart erbjudande inom 3–7 dagar. Har du redan hittat en specifik bil kan det gå snabbare, ibland inom 24 timmar.',
  },
  {
    q: 'Vad händer om jag inte köper en bil?',
    a: 'Ingenting. Det finns inga förpliktelser. Du tackar enkelt nej – och betalar inget om ingen affär görs.',
  },
];

const STATS = [
  { value: '18 000 kr', label: 'Snittbesparing per affär' },
  { value: '3–7 dagar', label: 'Till klart erbjudande' },
  { value: '4 995 kr', label: 'Fast avgift – bara om affären blir av' },
  { value: '4.9 / 5', label: 'Kundbetyg på Google' },
];

const PRESS_LOGOS = ['Dagens Industri', 'Aftonbladet', 'SVT Nyheter', 'TV4', 'Breakit'];

export default function HomePage({
  onNavigate,
  onNavigateBuy,
  onNavigateSell,
  onNavigateHowItWorks,
  onNavigatePricing,
  showSeo = false,
  pageTitle,
}: HomePageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [buyDrawerCar, setBuyDrawerCar] = useState<string | null>(null);
  const [carQuery, setCarQuery] = useState('');
  const [zipCode, setZipCode] = useState('');

  useEffect(() => {
    if (pageTitle) {
      document.title = pageTitle;
    } else {
      setPageMeta({
        title: 'Köp bil med expert – spara 15 000 kr eller mer | Bilto',
        description: 'Biltos experter hjälper dig hitta, förhandla och köpa rätt bil. Vi sköter kontakten med handlare åt dig – 4 995 kr om affären blir av.',
        canonical: 'https://bilto.se/',
      });
    }
  }, [pageTitle]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openBuyDrawer = (car?: string) => setBuyDrawerCar(car ?? '');
  const closeBuyDrawer = () => setBuyDrawerCar(null);

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Sälj bil') { onNavigateSell?.(); return; }
    if (item === 'Köp bil') { onNavigateBuy?.(); return; }
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Guider': '/guider',
      'Priser': '/priser',
      'Vanliga frågor': '/vanliga-fragor',
      'Så funkar det': '/sa-funkar-det',
    };
    const route = routes[item];
    if (route) {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handlePlanCta = (action: 'buy' | 'sell') => {
    if (action === 'buy') openBuyDrawer();
    else onNavigateSell?.();
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Köp bil"
        onSelect={handleMenuSelect}
      />

      {/* ── NAV ── */}
      <header
        className={`fixed top-0 inset-x-0 z-40 h-14 lg:h-16 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-10">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className={`lg:hidden -ml-2 w-11 h-11 flex items-center justify-center ${scrolled ? 'text-slate-900' : 'text-white'}`}
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <a href="/" className="shrink-0 lg:mr-10 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              fetchPriority="high"
              decoding="async"
              className="h-16 lg:h-20 w-auto object-contain"
              style={{ filter: scrolled ? 'none' : 'brightness(0) invert(1)' }}
            />
          </a>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button
              type="button"
              onClick={() => onNavigateBuy?.()}
              className={`text-[15px] font-semibold transition ${scrolled ? 'text-slate-900' : 'text-white'}`}
            >
              Köp bil
            </button>
            <button
              type="button"
              onClick={() => onNavigateSell?.()}
              className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}
            >
              Sälj bil
            </button>
            <button
              type="button"
              onClick={() => onNavigateHowItWorks?.()}
              className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}
            >
              Så funkar det
            </button>
            <button
              type="button"
              onClick={() => onNavigatePricing?.()}
              className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}
            >
              Priser
            </button>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="/gratis-konsultation"
              className={`inline-flex items-center px-4 lg:px-5 py-2.5 rounded-xl text-[12px] lg:text-[13px] font-semibold transition whitespace-nowrap ${
                scrolled
                  ? 'bg-[#0e6efe] text-white hover:bg-[#0a57cc]'
                  : 'bg-white text-slate-900 hover:bg-white/90'
              }`}
            >
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-[#0a0f1a]">
        <img
          src="/files_2615643-2026-06-21T06-29-18-662Z-b858d9c8-9893-488f-8103-98fee9292c16 copy.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-[50%_65%] opacity-40"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/60 via-[#0a0f1a]/30 to-[#0a0f1a]" />

        <div className="relative z-10 flex flex-col items-center text-center px-5 pt-24 pb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="text-[12px] font-medium text-white/90">Nytt: AI-bilköpshjälp på gång</span>
          </div>

          <h1
            className="font-black leading-[1.05] tracking-[-0.03em] text-white mb-5"
            style={{ fontSize: 'clamp(1.75rem, 5vw, 3.75rem)' }}
          >
            Spara 15 000 kr eller mer på din nästa bil – utan att besöka en enda handlare.
          </h1>

          <p className="text-white/70 text-[16px] sm:text-[19px] max-w-xl leading-relaxed mb-10">
            Oavsett om du leasar eller köper kontaktar Biltos experter handlaren åt dig, förhandlar bästa pris och sköter varje steg – du sparar tid och pengar.
          </p>

          {/* Search card */}
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.5)] p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={carQuery}
                    onChange={(e) => setCarQuery(e.target.value)}
                    placeholder="Sök bilmodell (t.ex. Volvo XC60)"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6efe] focus:border-transparent"
                  />
                </div>
                <div className="sm:w-32 relative">
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Postnr"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6efe] focus:border-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openBuyDrawer(carQuery || undefined)}
                  className="h-12 px-6 rounded-xl bg-[#0e6efe] text-white font-semibold text-[14px] hover:bg-[#0a57cc] transition whitespace-nowrap inline-flex items-center justify-center gap-2"
                >
                  Hitta bästa pris
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-[12px] text-slate-400 text-center">
                Få tillgång till målskillnad, inköpspris och OTD-uppskattning
              </p>
            </div>
          </div>

          {/* Trust line */}
          <div className="flex items-center gap-2 mt-6">
            <ShieldCheck className="w-4 h-4 text-white/60" />
            <p className="text-white/60 text-[13px]">Vi jobbar alltid för dig – aldrig för handlaren</p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 w-full bg-white/5 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10">
            {STATS.map((s) => (
              <div key={s.label} className="px-4 py-5 text-center">
                <p className="text-[20px] sm:text-[24px] font-bold text-white tracking-tight">{s.value}</p>
                <p className="text-[11px] sm:text-[12px] text-white/50 mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Press logos ── */}
      <section className="bg-white py-8 px-5 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-5">Omnämnda i</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {PRESS_LOGOS.map((logo) => (
              <span key={logo} className="text-[16px] sm:text-[18px] font-bold text-slate-300 tracking-tight">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why our buyers save ── */}
      <section className="bg-[#faf8f5] py-16 sm:py-24 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Varför våra kunder sparar 15 000 kr
            </span>
            <h2 className="text-[26px] sm:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-slate-900">
              Handlaren har en orättvis fördel. Tills nu.
            </h2>
            <p className="mt-4 text-[15px] sm:text-[17px] text-slate-600 leading-relaxed">
              Ett vanligt handlarbesök tar fyra timmar och kostar de flesta köpare 10 000–20 000 kr mer än det borde. Så här ändrar Bilto på det.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Usual way */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
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

            {/* Our way */}
            <div className="rounded-2xl border-2 border-[#0e6efe] bg-white p-6 sm:p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#0e6efe]" strokeWidth={2.5} />
                </div>
                <h3 className="text-[18px] font-bold text-[#0e6efe]">Vårt sätt</h3>
              </div>
              <div className="space-y-5">
                {OUR_WAY.map((item) => (
                  <div key={item.title}>
                    <p className="text-[14px] font-semibold text-slate-900 mb-1">{item.title}</p>
                    <p className="text-[14px] text-slate-600 leading-[1.6]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── USP grid ── */}
      <section className="bg-white py-16 sm:py-24 px-5 sm:px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-[24px] sm:text-[36px] font-bold tracking-[-0.02em] text-slate-900">
              Allt från idé till nyckel
            </h2>
            <p className="mt-3 text-[15px] sm:text-[17px] text-slate-600">Vi gör jobbet åt dig – hela vägen.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 rounded-xl overflow-hidden ring-1 ring-slate-200">
            {USP_WAY.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white p-6 sm:p-7 flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mb-4 shrink-0">
                    <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-1.5">{item.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-[1.6]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Savings breakdown ── */}
      <section className="bg-[#0e6efe] py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 sm:mb-12">
            <p className="text-[12px] font-semibold text-white/60 uppercase tracking-widest mb-3">Vad vi förhandlar fram</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-white leading-[1.1] tracking-[-0.02em]">
              Spara 15 000 kr eller mer på din nästa bil
            </h2>
            <p className="mt-3 text-white/70 text-[15px] leading-relaxed max-w-lg">
              Oavsett om du leasar eller köper förhandlar Biltos experter pris, ränta och tillval åt dig.
            </p>
          </div>
          <div className="space-y-px bg-white/10 rounded-xl overflow-hidden ring-1 ring-white/10">
            {SAVINGS_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-4 bg-white/[0.07] px-6 sm:px-8 py-5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-white leading-snug">{item.label}</p>
                  <p className="text-[12px] sm:text-[13px] text-white/60 mt-0.5 leading-snug">{item.desc}</p>
                </div>
                <span className="text-[14px] font-bold text-white shrink-0 tabular-nums">{item.amount}</span>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 px-6 sm:px-8 py-5 bg-white/[0.04]">
              <p className="text-[14px] font-semibold text-white/90">Typisk total besparing per affär</p>
              <span className="text-[20px] font-bold text-white tabular-nums">13 000–22 000 kr</span>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-white/40 leading-snug max-w-lg">
            Baserat på genomsnitt från genomförda affärer. Besparingen varierar beroende på bil och handlare. Biltos avgift är 4 995 kr och betalas endast om affären blir av.
          </p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="bg-[#faf8f5] py-16 sm:py-24 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">Priser i korthet</span>
            <h2 className="text-[26px] sm:text-[42px] font-bold tracking-[-0.02em] text-slate-900 leading-[1.1]">
              Från gör-det-själv till allt-fixat-åt-dig
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 sm:p-7 flex flex-col transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-white border-2 border-[#0e6efe] shadow-xl lg:-translate-y-2'
                    : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#0e6efe] text-white text-[11px] font-bold uppercase tracking-wider">
    Mest populärt
                  </span>
                )}
                <h3 className="text-[16px] font-bold text-slate-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-[28px] font-bold text-slate-900 tracking-tight">{plan.price}</span>
                  <span className="text-[13px] text-slate-400">{plan.period}</span>
                </div>
                <p className="text-[13px] text-slate-500 leading-[1.6] mb-5">{plan.desc}</p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                      <Check className="w-4 h-4 text-[#0e6efe] shrink-0 mt-0.5" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handlePlanCta(plan.action)}
                  className={`w-full h-11 rounded-xl font-semibold text-[14px] transition whitespace-nowrap ${
                    plan.highlight
                      ? 'bg-[#0e6efe] text-white hover:bg-[#0a57cc]'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center mt-8">
            <button
              type="button"
              onClick={() => onNavigatePricing?.()}
              className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#0e6efe] hover:underline"
            >
              Se fullständig prisjämförelse
              <ArrowRight className="w-4 h-4" />
            </button>
          </p>
        </div>
      </section>

      {/* ── Reviews ── */}
      <ReviewsSection variant="light" />

      {/* ── Founder / About ── */}
      <section className="bg-white py-16 sm:py-24 px-5 sm:px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
                Byggt av branschinsidare
              </span>
              <h2 className="text-[26px] sm:text-[36px] font-bold tracking-[-0.02em] text-slate-900 leading-[1.1] mb-4">
                Experter på din sida – inte handlarens
              </h2>
              <p className="text-[15px] text-slate-600 leading-[1.7] mb-4">
                Vi har tillbringat år inne i bilbranschen och sett hur köpare systematiskt betalar för mycket. Nu står vi på din sida.
              </p>
              <p className="text-[15px] text-slate-600 leading-[1.7] mb-6">
                Det vi hörde om och om igen: "Jag önskar bara att någon jag litade på kunde göra det här åt mig." Det är Bilto. Expertvänner på insidan, backade av data och ett team av människor som sett varje trick.
              </p>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={EXPERT_PHOTO}
                  alt="Alexander"
                  className="w-12 h-12 rounded-xl object-cover object-top shrink-0"
                />
                <div>
                  <p className="text-[14px] font-bold text-slate-900">Alexander</p>
                  <p className="text-[12px] text-slate-500">VD och medgrundare</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="/BSM_car_sale_key_woman_handover_101122.jpg"
                alt="Bilexpert hjälper kund"
                className="w-full h-[320px] sm:h-[400px] object-cover rounded-2xl shadow-lg"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-xl p-4 w-[170px]">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avgift</p>
                <p className="text-[22px] font-bold text-slate-900 leading-none">4 995 kr</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">Betalas bara om affären blir av</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#faf8f5] py-16 sm:py-24 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">Vanliga frågor</span>
            <h2 className="text-[26px] sm:text-[38px] font-bold tracking-[-0.02em] text-slate-900">
              Vanliga frågor – vi svarar rakt på sak
            </h2>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full text-left py-5 flex items-start gap-4 group"
                >
                  <div className="flex-1">
                    <h3 className="text-[16px] font-semibold text-slate-900 leading-snug">{faq.q}</h3>
                    {open && (
                      <p className="mt-3 text-[14px] text-slate-600 leading-[1.65]">{faq.a}</p>
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
      <section className="bg-white px-5 sm:px-6 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl bg-[#0e6efe] px-6 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-16 overflow-hidden">
            <div className="absolute -right-20 -top-20 w-[360px] h-[360px] rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -left-12 -bottom-16 w-[280px] h-[280px] rounded-full bg-white/5 pointer-events-none" />
            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-[28px] sm:text-[42px] font-bold tracking-[-0.02em] leading-[1.06] text-white mb-4">
                Så här ska bilköp fungera.
              </h2>
              <p className="text-white/80 text-[16px] leading-relaxed mb-8 max-w-lg mx-auto">
                Börja med ett kostnadsfritt samtal på 15 minuter. Vi berättar exakt vad som passar dig – även om svaret är "du behöver oss inte än".
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/gratis-konsultation"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-white text-[#0e6efe] text-[15px] font-bold transition hover:bg-slate-100 active:scale-[0.98] shadow-lg"
                >
                  Starta kostnadsfri konsultation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
                <a
                  href={PHONE_TEL}
                  className="inline-flex items-center justify-center h-12 px-7 rounded-xl border-2 border-white/40 text-white text-[15px] font-semibold transition hover:bg-white/10 active:scale-[0.98]"
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

      {/* ── Scrolled mobile CTA ── */}
      {scrolled && (
        <a
          href={PHONE_TEL}
          className="md:hidden fixed bottom-4 left-3 right-3 z-40 flex items-center gap-3 px-4 h-[58px] rounded-xl text-white font-semibold text-[15px] shadow-[0_8px_24px_rgba(14,110,254,0.45)] transition-all duration-200 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#1a7fff 0%,#0e6efe 50%,#0a57cc 100%)' }}
        >
          <div className="relative shrink-0">
            <img src={EXPERT_PHOTO} alt="Expert" className="w-9 h-9 rounded object-cover object-top border-2 border-white/30" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[15px] font-bold tracking-[-0.01em] truncate">Ring expert nu</span>
            <span className="text-[11px] text-white/70 font-normal">Gratis · svar direkt</span>
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
          onBack={() => onNavigateSell?.()}
          onClose={closeBuyDrawer}
        />
      </Suspense>
    </div>
  );
}
