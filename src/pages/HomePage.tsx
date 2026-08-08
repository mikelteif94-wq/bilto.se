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

        <div className="relative flex-1 flex flex-col items-center justify-center pt-28 sm:pt-32 pb-10 px-5 sm:px-8">
          <div className="w-full max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span className="text-[12px] font-medium text-white/90">Nytt: AI-bilköpshjälp på gång</span>
            </div>

            <h1 className="text-white text-[28px] sm:text-[42px] lg:text-[52px] font-bold leading-[1.08] tracking-tight text-center drop-shadow-lg mb-4">
              Spara 15 000 kr eller mer på din nästa bil – utan att besöka en enda handlare
            </h1>
            <p className="text-white/80 text-center text-[15px] sm:text-[18px] mb-8 drop-shadow leading-relaxed max-w-xl mx-auto">
              Oavsett om du leasar eller köper kontaktar Biltos experter handlaren åt dig, förhandlar bästa pris och sköter varje steg – du sparar tid och pengar.
            </p>

            {/* Search card */}
            <div className="bg-white rounded-xl shadow-2xl p-5 sm:p-6 max-w-xl mx-auto">
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

            <div className="flex items-center justify-center gap-1.5 mt-5">
              <ShieldCheck className="w-4 h-4 text-white/70 shrink-0" />
              <p className="text-white/70 text-[13px] drop-shadow">Vi jobbar alltid för dig – aldrig för handlaren</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative w-full bg-black/30 backdrop-blur-sm border-t border-white/10">
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
      <section className="bg-[#faf8f5] py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 sm:mb-4 block">
              Varför våra kunder sparar 15 000 kr
            </span>
            <h2 className="text-[24px] sm:text-[48px] font-semibold leading-[1.15] sm:leading-[1.04] text-slate-900 tracking-[-0.02em]">
              Handlaren har en orättvis fördel. Tills nu.
            </h2>
            <p className="text-slate-600 mt-4 sm:mt-6 text-[15px] sm:text-[18px] leading-[1.6] max-w-2xl mx-auto">
              Ett vanligt handlarbesök tar fyra timmar och kostar de flesta köpare 10 000–20 000 kr mer än det borde. Så här ändrar Bilto på det.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Usual way */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
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
            <div className="rounded-xl border-2 border-[#0e6efe] bg-white p-6 sm:p-8 shadow-lg">
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

      {/* ── Vad ingår ── */}
      <section className="bg-[#0e6efe] py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-12">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">Ingår i tjänsten</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-white leading-[1.08] tracking-[-0.02em]">
              Allt från idé till nyckel
            </h2>
            <p className="text-white/70 mt-3 text-[15px] leading-[1.65] max-w-xl">
              Vi gör jobbet åt dig – hela vägen.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-xl overflow-hidden ring-1 ring-white/10">
            {INCLUDED.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex flex-col bg-white/[0.07] p-6 sm:p-7">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mb-4">
                    <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <p className="text-white font-semibold text-[14px] sm:text-[15px] leading-snug">{item.title}</p>
                  <p className="text-white/60 text-[13px] mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 sm:mt-12">
            <button
              type="button"
              onClick={() => openBuyDrawer()}
              className="h-12 px-8 sm:px-10 rounded-xl bg-white text-[#0e6efe] font-bold text-[15px] hover:bg-[#faf8f5] transition shadow-lg inline-flex items-center gap-2 group"
            >
              Få prishjälp
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Savings breakdown ── */}
      <section className="bg-[#faf8f5] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-14 max-w-2xl">
            <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-3">Vad vi förhandlar fram</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-slate-900 tracking-[-0.02em] leading-[1.08]">
              Spara 15 000 kr eller mer på din nästa bil
            </h2>
            <p className="mt-3 text-slate-500 text-[15px] leading-[1.65] max-w-lg">
              Oavsett om du leasar eller köper förhandlar Biltos experter pris, ränta och tillval åt dig.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="bg-white divide-y divide-slate-100">
              {SAVINGS_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-4 px-6 sm:px-8 py-4 sm:py-5">
                  <div className="w-8 h-8 rounded-lg bg-[#0e6efe]/[0.08] flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-[#0e6efe]" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900 leading-snug">{item.label}</p>
                    <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                  <span className="text-[13px] sm:text-[14px] font-bold text-[#0e6efe] shrink-0 tabular-nums">{item.amount}</span>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 px-6 sm:px-8 py-4 sm:py-5 bg-slate-50">
                <p className="text-[13px] sm:text-[14px] font-semibold text-slate-700">Typisk total besparing per affär</p>
                <span className="text-[20px] sm:text-[18px] font-bold text-slate-900 tabular-nums">13 000–22 000 kr</span>
              </div>
              <div className="bg-slate-50 border-t border-slate-100 px-6 sm:px-8 py-3">
                <p className="text-[11px] text-slate-400 leading-snug">Baserat på genomsnitt från genomförda affärer. Besparingen varierar beroende på bil och handlare. Biltos avgift är 4 995 kr och betalas endast om affären blir av.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="bg-white py-16 sm:py-24 px-4 sm:px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 sm:mb-4 block">Priser i korthet</span>
            <h2 className="text-[24px] sm:text-[48px] font-semibold leading-[1.15] sm:leading-[1.04] text-slate-900 tracking-[-0.02em]">
              Från gör-det-själv till allt-fixat-åt-dig
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl p-6 sm:p-7 flex flex-col transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-white border-2 border-[#0e6efe] shadow-xl lg:-translate-y-2'
                    : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#0e6efe] text-white text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
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
      <ReviewsSection variant="muted" />

      {/* ── Founder / About ── */}
      <section className="bg-white py-16 sm:py-24 px-4 sm:px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 sm:mb-4 block">
                Byggt av branschinsidare
              </span>
              <h2 className="text-[24px] sm:text-[36px] font-semibold tracking-[-0.02em] text-slate-900 leading-[1.1] mb-4">
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
                  className="w-14 h-14 rounded-xl object-cover object-top shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-slate-900 leading-snug">Alexander</p>
                  <p className="text-[13px] text-slate-500 mt-0.5">VD och medgrundare</p>
                </div>
              </div>
            </div>
            <div className="relative h-[320px] sm:h-[400px]">
              <img
                src="/BSM_car_sale_key_woman_handover_101122.jpg"
                alt="Bilexpert hjälper kund"
                className="absolute inset-0 w-full h-full object-cover rounded-xl shadow-lg"
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
      <section className="bg-[#0e6efe] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">Vanliga frågor</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-white tracking-[-0.02em] leading-[1.08]">
              Vanliga frågor – vi svarar rakt på sak
            </h2>
          </div>
          <div className="divide-y divide-white/15 border-y border-white/15">
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
                    <h3 className="text-[16px] font-semibold text-white leading-snug">{faq.q}</h3>
                    {open && (
                      <p className="mt-3 text-[14px] text-white/75 leading-[1.65]">{faq.a}</p>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180 text-white/60' : 'text-white/40'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-white px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-xl bg-[#0e6efe] px-6 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14 overflow-hidden">
            <div className="absolute -right-20 -top-20 w-[360px] h-[360px] rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -left-12 -bottom-16 w-[280px] h-[280px] rounded-full bg-white/5 pointer-events-none" />
            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold tracking-[-0.02em] leading-[1.06] text-white mb-4">
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
