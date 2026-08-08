import { useEffect, useState, Suspense, lazy } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Phone,
  ShieldCheck,
  Menu,
  Banknote,
  Clock,
  Search,
  Handshake,
  FileCheck,
  X,
  Sparkles,
  TrendingDown,
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

const INCLUDED = [
  { icon: Search, title: 'Sökning i hela marknaden', desc: 'Vi letar på alla plattformar – inte bara ett handlares lager.' },
  { icon: Handshake, title: 'Prisförhandling', desc: 'Vi vet vad handlaren betalt för bilen och var marginalen finns.' },
  { icon: FileCheck, title: 'Historikkontroll', desc: 'Ägarhistorik, skador, miltal och service – granskat innan erbjudande.' },
  { icon: Banknote, title: 'Ränteförhandling', desc: 'Vi jämför finansiering och pressar räntan mot flera aktörer.' },
];

const SAVINGS_ITEMS = [
  { label: 'Prisförhandling på bilen', amount: '8 000–12 000 kr', desc: 'Vi vet vad handlaren betalat och var marginalen finns – och utnyttjar det.' },
  { label: 'Ränterabatt på finansiering', amount: '3 000–6 000 kr', desc: 'Vi jämför och förhandlar räntan mot flera finansaktörer och pressar den nedåt.' },
  { label: 'Däck & tillval', amount: '2 000–4 000 kr', desc: 'Vinterdäck, golvmattor och service tas med i paketet – utan extrakostnad.' },
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
    const onScroll = () => {
      const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600;
      setScrolled(window.scrollY > threshold);
    };
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
          <button
            type="button"
            onClick={() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="shrink-0 flex items-center"
          >
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </button>
          <nav className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={() => onNavigateSell?.()} className="text-[15px] text-white/80 hover:text-white transition font-medium">Sälj bil</button>
            <button type="button" onClick={() => onNavigateBuy?.()} className="text-[15px] text-white font-semibold transition">Köp bil</button>
            <button type="button" onClick={() => onNavigateHowItWorks?.()} className="text-[15px] text-white/80 hover:text-white transition font-medium">Så funkar det</button>
            <button type="button" onClick={() => onNavigatePricing?.()} className="text-[15px] text-white/80 hover:text-white transition font-medium">Priser</button>
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

      {/* ── Hero (CarEdge-inspired light design) ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#e7f3ff] via-[#f2f8ff] to-[#faf8f5] pt-32 sm:pt-40 pb-16 sm:pb-24">
        {/* Decorative blurred shapes */}
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-[#0e6efe]/[0.06] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-[320px] h-[320px] rounded-full bg-[#69a8ff]/[0.08] blur-3xl pointer-events-none" />

        <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-8">
          <div className="max-w-4xl mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0e6efe]/[0.08] border border-[#69a8ff]/40 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#0e6efe]" />
              <span className="text-[12px] font-medium text-[#0e6efe]">Nytt: AI-bilköpshjälp på gång</span>
            </div>

            <h1 className="text-[42px] sm:text-[64px] lg:text-[76px] font-bold leading-[0.98] tracking-[-0.055em] text-slate-700">
              Spara 15 000 kr eller mer<br />
              <span className="text-slate-700">på din nästa bil.</span>
            </h1>
            <p className="mt-8 max-w-4xl text-[16px] sm:text-[19px] leading-[1.5] tracking-[-0.01em] text-slate-500">
              Oavsett om du leasar eller köper kontaktar Biltos experter handlaren åt dig, förhandlar bästa pris och sköter varje steg – du sparar tid och pengar.{' '}
              <a href="/gratis-konsultation" className="font-medium text-[#0e6efe] hover:text-[#0a57cc] transition">
                Boka ett kostnadsfritt samtal på 15 minuter
              </a>{' '}
              – vi lyssnar och rekommenderar rätt lösning, ingen säljpitch.
            </p>
          </div>

          {/* Search card */}
          <div className="relative max-w-4xl rounded-[28px] border border-[#69a8ff] bg-[#e4efff]/80 px-5 pb-7 pt-11 sm:px-10 sm:pb-10 sm:pt-12 shadow-[0_20px_60px_rgba(14,110,254,0.12)]">
            <div className="absolute -top-4 left-5 sm:left-10 inline-flex items-center gap-2 rounded-full bg-[#237cf5] px-3.5 py-2 text-[13px] sm:text-[15px] font-bold leading-none text-white shadow-md">
              <Search className="w-4 h-4" strokeWidth={2.5} />
              Hitta rätt bil
            </div>

            <h2 className="text-[27px] sm:text-[36px] font-bold leading-tight tracking-[-0.04em] text-slate-700">
              Sök och förhandla – vi sköter resten
            </h2>
            <p className="mt-3 max-w-3xl text-[16px] sm:text-[19px] leading-[1.5] text-slate-500">
              Skriv in en bilmodell du är intresserad av. Vår expert kontaktar handlaren, förhandlar priset och granskar historiken åt dig.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={carQuery}
                  onChange={(e) => setCarQuery(e.target.value)}
                  placeholder="Sök bilmodell (t.ex. Volvo XC60)"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-[#69a8ff]/60 bg-white text-[15px] sm:text-[17px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6efe] focus:border-transparent transition"
                />
              </div>
              <button
                type="button"
                onClick={() => openBuyDrawer(carQuery || undefined)}
                className="h-14 px-7 rounded-2xl bg-[#0e6efe] text-white font-bold text-[15px] sm:text-[17px] hover:bg-[#0a57cc] transition whitespace-nowrap inline-flex items-center justify-center gap-2 shadow-lg shadow-[#0e6efe]/25"
              >
                Hitta bästa pris
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-4 text-[13px] sm:text-[14px] text-slate-500 leading-snug">
              Få tillgång till målskillnad, inköpspris och OTD-uppskattning
            </p>

            <div className="mt-5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0e6efe] shrink-0" />
              <p className="text-[13px] sm:text-[14px] text-slate-500">Vi jobbar alltid för dig – aldrig för handlaren</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-10 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#69a8ff]/30 rounded-2xl overflow-hidden ring-1 ring-[#69a8ff]/30">
            {STATS.map((s) => (
              <div key={s.label} className="bg-[#e4efff]/50 px-4 py-5 sm:py-6 text-center transition hover:bg-[#e4efff]/80">
                <p className="text-[20px] sm:text-[24px] font-bold text-slate-700 tracking-tight tabular-nums">{s.value}</p>
                <p className="text-[11px] sm:text-[12px] text-slate-500 mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Press logos ── */}
      <section className="bg-gradient-to-b from-[#faf8f5] to-[#f2f8ff] py-8 px-5">
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

      {/* ── Why our buyers save ── */}
      <section className="bg-gradient-to-b from-[#f2f8ff] via-[#e7f3ff] to-[#f2f8ff] py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 sm:mb-4 block">
              Varför våra kunder sparar 15 000 kr
            </span>
            <h2 className="text-[27px] sm:text-[36px] font-bold leading-[1.1] tracking-[-0.03em] text-slate-700">
              Handlaren har en orättvis fördel. Tills nu.
            </h2>
            <p className="text-slate-500 mt-4 sm:mt-5 text-[16px] sm:text-[19px] leading-[1.5] max-w-2xl mx-auto">
              Ett vanligt handlarbesök tar fyra timmar och kostar de flesta köpare 10 000–20 000 kr mer än det borde. Så här ändrar Bilto på det.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Usual way */}
            <div className="rounded-2xl border border-[#69a8ff]/40 bg-[#e4efff]/30 p-6 sm:p-8">
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

            {/* Our way */}
            <div className="rounded-2xl border-2 border-[#0e6efe] bg-[#e4efff]/50 p-6 sm:p-8 shadow-[0_8px_30px_rgba(14,110,254,0.08)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#0e6efe]" strokeWidth={2.5} />
                </div>
                <h3 className="text-[18px] font-bold text-[#0e6efe]">Vårt sätt</h3>
              </div>
              <div className="space-y-5">
                {OUR_WAY.map((item) => (
                  <div key={item.title}>
                    <p className="text-[14px] font-semibold text-slate-700 mb-1">{item.title}</p>
                    <p className="text-[14px] text-slate-600 leading-[1.6]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vad ingår ── */}
      <section className="bg-gradient-to-b from-[#f2f8ff] to-[#e7f3ff] py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-12">
            <p className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">Ingår i tjänsten</p>
            <h2 className="text-[27px] sm:text-[36px] font-bold text-slate-700 leading-[1.1] tracking-[-0.03em]">
              Allt från idé till nyckel
            </h2>
            <p className="text-slate-500 mt-3 text-[16px] sm:text-[19px] leading-[1.5] max-w-xl">
              Vi gör jobbet åt dig – hela vägen.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INCLUDED.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex flex-col rounded-2xl border border-[#69a8ff]/50 bg-[#e4efff]/50 p-6 sm:p-7 transition hover:border-[#69a8ff] hover:bg-[#e4efff]/70 hover:shadow-[0_8px_30px_rgba(14,110,254,0.08)]">
                  <div className="w-8 h-8 rounded-lg bg-[#0e6efe]/10 flex items-center justify-center shrink-0 mb-4">
                    <Icon className="w-4 h-4 text-[#0e6efe]" strokeWidth={2} />
                  </div>
                  <p className="text-slate-700 font-semibold text-[14px] sm:text-[15px] leading-snug">{item.title}</p>
                  <p className="text-slate-500 text-[13px] mt-1.5 leading-[1.5]">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 sm:mt-12">
            <button
              type="button"
              onClick={() => openBuyDrawer()}
              className="h-12 px-8 sm:px-10 rounded-xl bg-[#0e6efe] text-white font-bold text-[15px] hover:bg-[#0a57cc] transition shadow-lg shadow-[#0e6efe]/25 inline-flex items-center gap-2 group"
            >
              Få prishjälp
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Savings breakdown ── */}
      <section className="bg-gradient-to-b from-[#e7f3ff] to-[#f2f8ff] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-14 max-w-2xl">
            <p className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">Vad vi förhandlar fram</p>
            <h2 className="text-[27px] sm:text-[36px] font-bold text-slate-700 tracking-[-0.03em] leading-[1.1]">
              Spara 15 000 kr eller mer på din nästa bil
            </h2>
            <p className="mt-3 text-slate-500 text-[16px] sm:text-[19px] leading-[1.5] max-w-lg">
              Oavsett om du leasar eller köper förhandlar Biltos experter pris, ränta och tillval åt dig.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[#69a8ff] shadow-[0_8px_30px_rgba(14,110,254,0.08)]">
            <div className="bg-[#e4efff]/40 divide-y divide-[#69a8ff]/20">
              {SAVINGS_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-4 px-6 sm:px-8 py-4 sm:py-5">
                  <div className="w-8 h-8 rounded-lg bg-[#0e6efe]/[0.1] flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-[#0e6efe]" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-700 leading-snug">{item.label}</p>
                    <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                  <span className="text-[13px] sm:text-[14px] font-bold text-[#0e6efe] shrink-0 tabular-nums">{item.amount}</span>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 px-6 sm:px-8 py-4 sm:py-5 bg-[#e4efff]/60">
                <p className="text-[13px] sm:text-[14px] font-semibold text-slate-700">Typisk total besparing per affär</p>
                <span className="text-[18px] sm:text-[20px] font-bold text-slate-700 tabular-nums">13 000–22 000 kr</span>
              </div>
              <div className="bg-[#e4efff]/60 border-t border-[#69a8ff]/20 px-6 sm:px-8 py-3">
                <p className="text-[11px] text-slate-500 leading-snug">Baserat på genomsnitt från genomförda affärer. Besparingen varierar beroende på bil och handlare. Biltos avgift är 4 995 kr och betalas endast om affären blir av.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="bg-gradient-to-b from-[#f2f8ff] to-[#e7f3ff] py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 sm:mb-4 block">Priser i korthet</span>
            <h2 className="text-[27px] sm:text-[36px] font-bold leading-[1.1] tracking-[-0.03em] text-slate-700">
              Från gör-det-själv till allt-fixat-åt-dig
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 sm:p-7 flex flex-col transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-[#e4efff]/60 border-2 border-[#0e6efe] shadow-[0_8px_30px_rgba(14,110,254,0.12)] lg:-translate-y-2'
                    : 'bg-[#e4efff]/40 border border-[#69a8ff]/50 hover:border-[#69a8ff] hover:shadow-[0_8px_30px_rgba(14,110,254,0.08)]'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#0e6efe] text-white text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                    Mest populärt
                  </span>
                )}
                <h3 className="text-[16px] font-bold text-slate-700 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-[28px] font-bold text-slate-700 tracking-tight">{plan.price}</span>
                  <span className="text-[13px] text-slate-500">{plan.period}</span>
                </div>
                <p className="text-[13px] text-slate-500 leading-[1.6] mb-5">{plan.desc}</p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] text-slate-600">
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
                      ? 'bg-[#0e6efe] text-white hover:bg-[#0a57cc] shadow-lg shadow-[#0e6efe]/25'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-[#69a8ff]/50'
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
      <ReviewsSection variant="muted" />

      {/* ── Founder / About ── */}
      <section className="bg-gradient-to-b from-[#e7f3ff] to-[#f2f8ff] py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 sm:mb-4 block">
                Byggt av branschinsidare
              </span>
              <h2 className="text-[27px] sm:text-[36px] font-bold tracking-[-0.03em] text-slate-700 leading-[1.1] mb-4">
                Experter på din sida – inte handlarens
              </h2>
              <p className="text-[15px] text-slate-600 leading-[1.7] mb-4">
                Vi har tillbringat år inne i bilbranschen och sett hur köpare systematiskt betalar för mycket. Nu står vi på din sida.
              </p>
              <p className="text-[15px] text-slate-600 leading-[1.7] mb-6">
                Det vi hörde om och om igen: "Jag önskar bara att någon jag litade på kunde göra det här åt mig." Det är Bilto. Expertvänner på insidan, backade av data och ett team av människor som sett varje trick.
              </p>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#e4efff]/50 border border-[#69a8ff]/50">
                <img
                  src={EXPERT_PHOTO}
                  alt="Alexander"
                  className="w-14 h-14 rounded-xl object-cover object-top shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-slate-700 leading-snug">Alexander</p>
                  <p className="text-[13px] text-slate-500 mt-0.5">VD och medgrundare</p>
                </div>
              </div>
            </div>
            <div className="relative h-[320px] sm:h-[400px]">
              <img
                src="/BSM_car_sale_key_woman_handover_101122.jpg"
                alt="Bilexpert hjälper kund"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl border border-[#69a8ff]/40 shadow-lg"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute bottom-4 right-4 bg-[#e4efff] rounded-xl border border-[#69a8ff] shadow-xl p-4 w-[170px]">
                <p className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-widest mb-1">Avgift</p>
                <p className="text-[22px] font-bold text-slate-700 leading-none">4 995 kr</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">Betalas bara om affären blir av</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-gradient-to-b from-[#f2f8ff] to-[#e7f3ff] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <p className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">Vanliga frågor</p>
            <h2 className="text-[27px] sm:text-[36px] font-bold text-slate-700 tracking-[-0.03em] leading-[1.1]">
              Vanliga frågor – vi svarar rakt på sak
            </h2>
          </div>
          <div className="divide-y divide-[#69a8ff]/30 border-y border-[#69a8ff]/30 rounded-2xl overflow-hidden bg-[#e4efff]/30">
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full text-left py-5 px-5 sm:px-6 flex items-start gap-4 group transition hover:bg-[#e4efff]/50"
                >
                  <div className="flex-1">
                    <h3 className="text-[15px] sm:text-[17px] font-semibold text-slate-700 leading-snug">{faq.q}</h3>
                    {open && (
                      <p className="mt-3 text-[14px] sm:text-[15px] text-slate-500 leading-[1.5]">{faq.a}</p>
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
      <section className="bg-gradient-to-b from-[#e7f3ff] to-[#f2f8ff] px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[28px] border border-[#69a8ff] bg-[#e4efff]/80 px-6 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14 overflow-hidden shadow-[0_20px_60px_rgba(14,110,254,0.12)]">
            <div className="absolute -right-20 -top-20 w-[360px] h-[360px] rounded-full bg-white/40 pointer-events-none" />
            <div className="absolute -left-12 -bottom-16 w-[280px] h-[280px] rounded-full bg-white/30 pointer-events-none" />
            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-[27px] sm:text-[36px] lg:text-[42px] font-bold tracking-[-0.03em] leading-[1.1] text-slate-700 mb-4">
                Så här ska bilköp fungera.
              </h2>
              <p className="text-slate-500 text-[16px] sm:text-[19px] leading-[1.5] mb-8 max-w-lg mx-auto">
                Börja med ett kostnadsfritt samtal på 15 minuter. Vi berättar exakt vad som passar dig – även om svaret är "du behöver oss inte än".
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/gratis-konsultation"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#0e6efe] text-white text-[15px] font-bold transition hover:bg-[#0a57cc] active:scale-[0.98] shadow-lg shadow-[#0e6efe]/25"
                >
                  Starta kostnadsfri konsultation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
                <a
                  href={PHONE_TEL}
                  className="inline-flex items-center justify-center h-12 px-7 rounded-xl border-2 border-[#69a8ff] text-[#0e6efe] text-[15px] font-semibold transition hover:bg-[#0e6efe] hover:text-white active:scale-[0.98]"
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
          className="md:hidden fixed bottom-4 left-3 right-3 z-40 flex items-center gap-3 px-4 h-[58px] rounded bg-[#0e6efe] active:bg-[#0047B3] text-white font-semibold text-[15px] shadow-[0_8px_24px_rgba(14,110,254,0.45)] transition-all duration-200 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#1a7fff 0%,#0e6efe 50%,#0a57cc 100%)' }}
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
          onBack={() => onNavigateSell?.()}
          onClose={closeBuyDrawer}
        />
      </Suspense>
    </div>
  );
}
