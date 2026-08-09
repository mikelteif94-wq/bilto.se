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
  TrendingDown,
  Link2,
  Loader2,
  Car,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import ReviewsSection from '../components/ReviewsSection';
import { setPageMeta } from '../lib/pageMeta';
import { PHONE, PHONE_TEL, EXPERT_PHOTO } from '../config/site';
import { useVehicleLookup, type VehicleData } from '../lib/useVehicleLookup';

const BuyDrawer = lazy(() => import('../components/BuyDrawer'));

interface HomePageProps {
  onNavigate: (regnummer: string, telefon: string) => void;
  onNavigateBuy?: (bil?: string) => void;
  onNavigateSell?: () => void;
  onNavigateHowItWorks?: () => void;
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

const FAQS = [
  {
    q: 'Vad kostar det att använda Bilto?',
    a: 'Bilköptjänsten kostar 4 995 kr i fast avgift – betalas bara om affären blir av. Säljhjälpen är gratis för dig; vi tar en avgift av handlaren. Inga dolda kostnader, noll provision.',
  },
  {
    q: 'Hur hjälper Bilto mig att köpa bil?',
    a: 'Du berättar vilken bil du är intresserad av – vi tar över därifrån. Vi kontaktar säljaren, verifierar annonsen, förhandlar pris, ränta och tillbehör, och ser till att du inte betalar mer än du måste.',
  },
  {
    q: 'Hur stor besparing kan jag räkna med?',
    a: 'Snittbesparingen är 18 000 kr per affär – räknat på prisnedförhandling, ränta och tillbehör. Siffran bygger på resultat från tidigare kunder och är inte en garanti; din besparing varierar beroende på bil och handlare. Vår avgift på 4 995 kr betalas dessutom bara om affären blir av.',
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
  showSeo = false,
  pageTitle,
}: HomePageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [buyDrawerCar, setBuyDrawerCar] = useState<string | null>(null);
  const [carQuery, setCarQuery] = useState('');
  const [regInput, setRegInput] = useState('');
  const [adLink, setAdLink] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [foundCar, setFoundCar] = useState<VehicleData | null>(null);
  const lookup = useVehicleLookup(regInput);

  useEffect(() => {
    if (pageTitle) {
      document.title = pageTitle;
    } else {
      setPageMeta({
        title: 'Bilköptjänsten – spara 15 000 kr eller mer | Bilto',
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

  useEffect(() => {
    if (lookup.status === 'found') {
      setFoundCar(lookup.data);
      setLookupError(null);
    } else if (lookup.status === 'not_found') {
      setFoundCar(null);
      setLookupError('Inget fordon hittades på det regnumret.');
    } else if (lookup.status === 'error') {
      setFoundCar(null);
      setLookupError('Kunde inte hämta biluppgifter just nu.');
    } else if (lookup.status === 'idle') {
      setFoundCar(null);
      setLookupError(null);
    }
  }, [lookup.status, lookup.data]);

  const handleHeroSubmit = () => {
    const carDesc = foundCar
      ? `${foundCar.marke} ${foundCar.modell} ${foundCar.variant}`.trim()
      : adLink.trim()
        ? adLink.trim()
        : regInput.trim();
    openBuyDrawer(carDesc || undefined);
  };

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Sälj bil') { onNavigateSell?.(); return; }
    if (item === 'Bilköptjänsten') { onNavigateBuy?.(); return; }
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Guider': '/guider',
      'Vanliga frågor': '/vanliga-fragor',
      'Så funkar det': '/sa-funkar-det',
    };
    const route = routes[item];
    if (route) {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Bilköptjänsten"
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
            <button type="button" onClick={() => onNavigateBuy?.()} className="text-[15px] text-white font-semibold transition">Bilköptjänsten</button>
            <button type="button" onClick={() => onNavigateHowItWorks?.()} className="text-[15px] text-white/80 hover:text-white transition font-medium">Så funkar det</button>
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
      <section className="relative overflow-hidden bg-gradient-to-b from-[#e7f3ff] via-[#f2f8ff] to-[#faf8f5] pt-32 sm:pt-40 pb-14 sm:pb-20">
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] rounded-full bg-[#0e6efe]/[0.06] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-[320px] h-[320px] rounded-full bg-[#69a8ff]/[0.08] blur-3xl pointer-events-none" />

        <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-[30px] sm:text-[40px] lg:text-[48px] font-bold leading-[1.1] tracking-[-0.04em] text-slate-700">
              Spara 15 000 kr eller mer på din nästa bil – utan att besöka en bilhall.
            </h1>
            <p className="mt-8 text-[16px] sm:text-[19px] leading-[1.5] tracking-[-0.01em] text-slate-500">
              Oavsett om du leasar eller köper kontaktar Biltos experter handlaren åt dig, förhandlar bästa pris och sköter varje steg – du sparar tid och pengar.{' '}
              <a href="/gratis-konsultation" className="font-medium text-[#0e6efe] hover:text-[#0a57cc] transition">
                Boka ett kostnadsfritt samtal på 15 minuter
              </a>{' '}
              – vi lyssnar och rekommenderar rätt lösning, ingen säljpitch.
            </p>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openBuyDrawer()}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-white text-slate-700 font-semibold text-[14px] shadow-[0_4px_16px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 hover:ring-[#69a8ff] hover:text-[#0e6efe] transition"
            >
              Fråga en bilexpert
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0e6efe]/10 text-[#0e6efe] text-[11px] font-bold">✦</span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">NYTT</span>
            </button>
          </div>

          <div id="home-search" className="relative max-w-2xl mx-auto mt-8 rounded-[24px] border border-[#69a8ff]/70 bg-white/90 p-5 sm:p-7 shadow-[0_18px_50px_rgba(14,110,254,0.14)] text-left">
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-5 h-5 text-[#0e6efe]" />
              <h2 className="text-[18px] sm:text-[20px] font-bold tracking-[-0.02em] text-slate-700">
                Hittat en bil? Låt oss förhandla priset åt dig
              </h2>
            </div>
            <p className="text-[14px] text-slate-500 leading-[1.5] mb-5">
              Skriv in regnumret så hämtar vi bilens uppgifter automatiskt. Eller klistra in länken till annonsen om du inte har regnumret.
            </p>

            {/* Regnummer input */}
            <div className="mb-3">
              <label className="block text-[12px] font-medium text-slate-500 mb-1.5">Regnummer</label>
              <div className="flex items-stretch h-14 rounded-xl border border-slate-300 bg-white overflow-hidden transition focus-within:ring-2 focus-within:ring-[#0e6efe]/20 focus-within:border-[#0e6efe]">
                <span className="flex items-center justify-center w-12 bg-[#0e6efe] text-white font-bold shrink-0 text-[20px]">S</span>
                <input
                  type="text"
                  value={regInput}
                  onChange={(e) => {
                    const cleaned = e.target.value.toUpperCase().replace(/[^A-ZÅÄÖ0-9]/g, '').slice(0, 6);
                    setRegInput(cleaned);
                  }}
                  placeholder="ABC123"
                  maxLength={6}
                  autoComplete="off"
                  className="flex-1 min-w-0 px-4 bg-white text-[18px] font-semibold tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal focus:outline-none"
                />
                {lookup.status === 'loading' && (
                  <span className="flex items-center justify-center w-11 shrink-0">
                    <Loader2 className="w-5 h-5 text-[#0e6efe] animate-spin" />
                  </span>
                )}
                {lookup.status === 'found' && (
                  <span className="flex items-center justify-center w-11 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[12px] text-slate-400 font-medium">eller</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Ad link input */}
            <div className="mb-5">
              <label className="block text-[12px] font-medium text-slate-500 mb-1.5">Länk till annonsen</label>
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="url"
                  value={adLink}
                  onChange={(e) => setAdLink(e.target.value)}
                  placeholder="https://www.blocket.se/..."
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-300 bg-white text-[16px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/20 focus:border-[#0e6efe] transition"
                />
              </div>
            </div>

            {/* Error */}
            {lookupError && (
              <p className="text-[13px] text-red-600 mb-3">{lookupError}</p>
            )}

            {/* Found car preview */}
            {foundCar && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" strokeWidth={2.5} />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-700 truncate">
                    {foundCar.marke} {foundCar.modell} {foundCar.variant}
                  </p>
                  <p className="text-[12px] text-slate-500">
                    {foundCar.ar ?? '—'} · {foundCar.bransle || '—'} · {foundCar.miltal ? `${foundCar.miltal.toLocaleString('sv-SE')} mil` : '—'}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleHeroSubmit}
              disabled={!regInput && !adLink}
              className="w-full h-14 rounded-xl bg-[#0e6efe] text-white font-bold text-[16px] hover:bg-[#0a57cc] transition inline-flex items-center justify-center gap-2 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Låt Bilto förhandla priset
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-3 text-center text-[12px] text-slate-500">Ingen kostnad förrän affären är klar</p>
          </div>

          <div className="mt-10 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-left">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/80 border border-[#69a8ff]/30 px-4 py-5 sm:py-6 text-center shadow-sm transition hover:border-[#69a8ff]/60 hover:shadow-md hover:bg-white">
                <p className="text-[18px] sm:text-[22px] lg:text-[24px] font-bold text-slate-700 tracking-tight tabular-nums leading-tight">{s.value}</p>
                <p className="text-[11px] sm:text-[12px] text-slate-500 mt-1.5 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-slate-400 leading-snug max-w-xl mx-auto">Snittbesparingar bygger på resultat från tidigare kunder och är inte en garanti. Din besparing beror på bil, handlare och marknadsläge.</p>
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
                <p className="text-[11px] text-slate-500 leading-snug">Siffrorna bygger på genomsnitt från genomförda affärer och är inte en garanti för framtida besparing. Din besparing varierar beroende på bil, handlare och marknadsläge. Biltos avgift är 4 995 kr och betalas endast om affären blir av.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <ReviewsSection variant="muted" />

      {/* ── Meet the experts ── */}
      <section className="bg-gradient-to-b from-[#e7f3ff] to-[#f2f8ff] py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Möt experterna
            </span>
            <h2 className="text-[27px] sm:text-[36px] lg:text-[42px] font-bold tracking-[-0.03em] text-slate-700 leading-[1.1]">
              Byggt av branschinsidare – nu på din sida
            </h2>
          </div>

          {/* Large image */}
          <div className="relative rounded-2xl overflow-hidden border border-[#69a8ff]/40 shadow-[0_12px_40px_rgba(14,110,254,0.10)] mb-8 sm:mb-12">
            <img
              src="/BSM_car_sale_key_woman_handover_101122.jpg"
              alt="Bilto-experter med över 4000 sålda och inhandlade bilar"
              className="w-full h-[280px] sm:h-[420px] lg:h-[480px] object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {[
                  { value: '100%', label: 'På kundens sida' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white/90 backdrop-blur-sm px-4 py-3 shadow-lg">
                    <p className="text-[18px] sm:text-[22px] font-bold text-slate-700 leading-none">{stat.value}</p>
                    <p className="text-[11px] sm:text-[12px] text-slate-500 mt-1 leading-snug">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Story text */}
          <div className="max-w-3xl mx-auto">
            <p className="text-[16px] sm:text-[18px] text-slate-600 leading-[1.7] mb-5">
              Vi började inne i bilbranschen. Vi sålde mest av alla – flest bilar, mest försäljning, år efter år. Vi lärde oss varenda trick, varje marginal och varje knapp som handlaren trycker på.
            </p>
            <p className="text-[16px] sm:text-[18px] text-slate-600 leading-[1.7] mb-5">
              Ju mer vi såg, desto tydligare blev det: köparen betalar alltid för mycket. Inte för att handlaren är ond – utan för att informationen är ojämnt fördelad. Handlaren vet allt. Köparen vet nästan inget.
            </p>
            <p className="text-[16px] sm:text-[18px] text-slate-600 leading-[1.7] mb-8">
              Det vi hörde om och om igen var: <em className="text-slate-700">"Jag önskar bara att någon jag litade på kunde göra det här åt mig."</em> Det är Bilto. Vi bytte sida. Nu står vi på kundens sida – med all den bransch­kunskap som tidigare satt hos handlaren.
            </p>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#e4efff]/50 border border-[#69a8ff]/50">
              <img
                src={EXPERT_PHOTO}
                alt="Alexander"
                className="w-14 h-14 rounded-xl object-cover object-top shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-slate-700 leading-snug">Alexander</p>
                <p className="text-[13px] text-slate-500 mt-0.5">Din expert på insidan av bilbranschen</p>
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
