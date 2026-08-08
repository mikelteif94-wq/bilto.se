import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Phone,
  ShieldCheck,
  Handshake,
  Menu,
  Banknote,
  Clock,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { setPageMeta } from '../lib/pageMeta';
import { PHONE, PHONE_TEL, EXPERT_PHOTO } from '../config/site';
import CompactCarCard from '../components/CompactCarCard';
import ElCarCard from '../components/ElCarCard';
import ReviewsSection from '../components/ReviewsSection';
import type { ComparisonCar } from '../lib/comparison';
import { useCarImages } from '../hooks/useCarImages';
import { useCatalogCars } from '../hooks/useCatalogCars';

const BuyDrawer = lazy(() => import('../components/BuyDrawer'));

interface KopBilConciergProps {
  onBack: () => void;
  onNavigateBuy: (bil?: string) => void;
  onNavigateHowItWorks: () => void;
}

const FAQS = [
  {
    q: 'Kostar det något att använda Biltos köptjänst?',
    a: 'Ja – tjänsten kostar 4 995 kr och betalas bara om affären faktiskt blir av. Inget köp, ingen kostnad. Snittbesparingen vi förhandlar fram är 18 000 kr per affär, så de flesta kunder tjänar mångfalt mer än de betalar.',
  },
  {
    q: 'Kan ni hjälpa mig om jag redan hittat en bil?',
    a: 'Absolut. Det är faktiskt ett av de vanligaste fallen. Du skickar länken, vi granskar historik, kontrollerar att priset är rimligt och förhandlar sedan med säljaren åt dig.',
  },
  {
    q: 'Hur lång tid tar det?',
    a: 'De flesta kunder har ett klart erbjudande inom 3–7 dagar. Om du redan hittat en specifik bil kan det gå snabbare, ibland inom 24 timmar.',
  },
  {
    q: 'Vad händer om ingen bil passar mig?',
    a: 'Ingenting. Det finns inga förpliktelser. Du tackar enkelt nej – och om du vill fortsöka justerar vi kriterierna. Du betalar inget om ingen affär görs.',
  },
  {
    q: 'Kan ni hjälpa till med inbytesbil?',
    a: 'Ja. Vi hanterar hela bytesaffären – värderar din bil, inhämtar konkurrerande bud från handlare och säkerställer att inbytesvärdet är marknadsmässigt.',
  },
];

const INCLUDED = [
  { title: 'Sökning i hela marknaden', desc: 'Vi letar på alla plattformar – inte bara ett handlares lager.' },
  { title: 'Prisförhandling', desc: 'Vi vet vad handlaren betalt för bilen och var marginalen finns.' },
  { title: 'Historikkontroll', desc: 'Ägarhistorik, skador, miltal och service – granskat innan erbjudande.' },
  { title: 'Ränteförhandling', desc: 'Vi jämför finansiering och pressar räntan mot flera aktörer.' },
  { title: 'Inbytesvärdering', desc: 'Om du byter in en bil hämtar vi konkurrerande bud.' },
  { title: 'Leverans hem', desc: 'Vi kan koordinera hemleverans utan att du behöver besöka handlaren.' },
];

const SAVINGS_ITEMS = [
  { label: 'Prisförhandling på bilen', amount: '8 000–12 000 kr', desc: 'Vi vet vad handlaren betalat och var marginalen finns – och utnyttjar det.' },
  { label: 'Ränterabatt på finansiering', amount: '3 000–6 000 kr', desc: 'Vi jämför och förhandlar räntan mot flera finansaktörer och pressar den nedåt.' },
  { label: 'Däck & tillval', amount: '2 000–4 000 kr', desc: 'Vinterdäck, golvmattor och service tas med i paketet – utan extrakostnad.' },
];

function SavingsInfoBox() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-10 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="bg-[#0e6efe] px-6 sm:px-8 py-6 sm:py-7">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Banknote className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <p className="text-[11px] font-semibold text-white/70 uppercase tracking-[0.15em]">Vad vi förhandlar fram</p>
        </div>
        <h3 className="text-[22px] sm:text-[28px] font-bold text-white leading-snug tracking-[-0.02em]">
          Spara 15 000 kr eller mer på din nästa bil
        </h3>
        <p className="mt-2 text-white/75 text-[14px] sm:text-[15px] leading-[1.65] max-w-lg">
          Oavsett om du leasar eller köper förhandlar Biltos experter pris, ränta och tillval åt dig – du sparar tid och pengar.
        </p>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/90 hover:text-white underline underline-offset-2 transition"
        >
          {open ? 'Dölj beräkning' : 'Läs mer – hur räknar vi?'}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
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
      )}
    </div>
  );
}

export default function KopBilConcierge({ onBack, onNavigateBuy, onNavigateHowItWorks }: KopBilConciergProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [buyDrawerCar, setBuyDrawerCar] = useState<string | null>(null);

  const openBuyDrawer = (car?: string) => setBuyDrawerCar(car ?? '');
  const [allCars, setAllCars] = useState<ComparisonCar[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const { cars: dbCars } = useCatalogCars();
  const { getCarImage } = useCarImages(dbCars);

  const POPULAR_IDS = ['tesla_model_y', 'volvo_xc60', 'kia_ev6', 'toyota_rav4', 'volvo_xc40', 'vw_golf'];
  const popularCars = POPULAR_IDS
    .map(id => allCars.find(c => c.id === id))
    .filter((c): c is ComparisonCar => !!c)
    .slice(0, 6);

  const FUEL_LABELS: Record<string, string> = {
    bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid', laddhybrid: 'Laddhybrid', el: 'El',
  };

  useEffect(() => {
    import('../lib/comparison').then(m => setAllCars(m.getAllComparisonCars()));
  }, []);

  useEffect(() => {
    setPageMeta({
      title: 'Köp bil med hjälp av en expert – Bilto',
      description: 'Låt Biltos experter hjälpa dig hitta, förhandla och köpa rätt bil. Vi sköter kontakten med handlare åt dig – 4 995 kr om affären blir av.',
      canonical: 'https://bilto.se/kop-bil',
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
    if (item === 'Sälj bil') { onBack(); return; }
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Köp bil': '/kop-bil',
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
    onBack();
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Köp bil"
        onSelect={handleMenuSelect}
      />

      {/* Nav */}
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
          <button onClick={onBack} className="shrink-0 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </button>
          <nav className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={onBack} className="text-[15px] text-white/80 hover:text-white transition font-medium">Sälj bil</button>
            <button type="button" onClick={onNavigateBuy} className="text-[15px] text-white font-semibold transition">Köp bil</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/om-oss'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 hover:text-white transition font-medium">Om oss</button>
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#faf8f5] pointer-events-none" />

        <div className="relative flex-1 flex flex-col items-center justify-center pt-28 sm:pt-32 pb-10 px-5 sm:px-8">
          <div className="w-full max-w-5xl">
            {/* Headline */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-white text-[30px] sm:text-[48px] lg:text-[56px] font-bold leading-[1.05] tracking-tight drop-shadow-lg mb-4 max-w-3xl mx-auto">
                Vi förhandlar din nästa bil. Du hämtar nycklarna.
              </h1>
              <p className="text-white/80 text-[15px] sm:text-[18px] leading-[1.6] drop-shadow max-w-2xl mx-auto">
                Två sätt att köpa bil utan handlarbesök. Osäker på vad som passar? Boka ett kostnadsfritt samtal på 15 minuter med någon i vårt team – vi lyssnar och rekommenderar rätt lösning, ingen säljpitch. Köp eller leasing, ny eller begagnad, alla märken.
              </p>
            </div>

            {/* Two-column: Concierge card + pricing card */}
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto items-stretch">
              {/* Concierge card */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-gradient-to-br from-[#0e6efe] to-[#0a57cc] px-6 py-6">
                  <span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em] block mb-1">Fullservice · Personlig</span>
                  <h2 className="text-[22px] sm:text-[26px] font-bold text-white leading-tight tracking-[-0.02em]">
                    Bilto Bilköpshjälp
                  </h2>
                </div>
                <div className="px-6 py-5 flex-1 flex flex-col">
                  <p className="text-slate-600 text-[14px] sm:text-[15px] leading-[1.6] mb-5">
                    En personlig expert från vårt team sköter allt, från början till slut. Du skriver på pappren och hämtar nycklarna.
                  </p>

                  <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
                    <img
                      src={EXPERT_PHOTO}
                      alt="Alexander från Bilto"
                      className="w-14 h-14 rounded-xl object-cover object-top shrink-0 ring-2 ring-[#0e6efe]/20"
                    />
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-slate-900 leading-snug">Alexander</p>
                      <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">År på handlarens sida. Nu på din.</p>
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0e6efe]">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0e6efe]/10 text-[10px] font-bold">+7</span>
                        års branschvana
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    {[
                      'En personlig mänsklig expert tilldelad dig',
                      'Vi koordinerar research, förhandling, papper och leverans',
                      'Hanterar handlarens samtal, mejl och det finstilta',
                      'Personligt: vi slutar inte förrän du sitter i bilen',
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-3 text-slate-700 text-[13px] sm:text-[14px] leading-snug">
                        <div className="w-5 h-5 rounded-full bg-[#0e6efe]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-[#0e6efe]" strokeWidth={3} />
                        </div>
                        {point}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => openBuyDrawer()}
                    className="w-full h-12 rounded-xl bg-[#0e6efe] text-white font-bold text-[15px] hover:bg-[#0a57cc] transition inline-flex items-center justify-center gap-2 shadow-md"
                  >
                    Kom igång med Bilköpshjälpen
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="/om-oss"
                    className="mt-3 w-full h-11 rounded-xl border border-slate-200 text-slate-600 font-medium text-[14px] hover:bg-[#faf8f5] transition inline-flex items-center justify-center gap-2"
                  >
                    Lär känna teamet
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Pricing card */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-6 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-[32px] sm:text-[36px] font-bold text-slate-900 tracking-tight leading-none">4 995 kr</span>
                    <span className="text-[14px] font-semibold text-slate-400">fast, per bil</span>
                  </div>
                  <p className="text-slate-500 text-[13px] leading-[1.6]">
                    En avgift täcker hela sökningen. Alla märken, alla modeller – jämför hur många du vill.
                  </p>
                </div>

                <div className="px-6 py-5 flex-1 flex flex-col">
                  <ul className="space-y-3 mb-6 flex-1">
                    {[
                      'Betalas bara om affären blir av – noll bindning',
                      'Snittbesparing 15 000 kr+ per genomförd affär',
                      'Inga dolda avgifter eller provision från handlare',
                      'Vi jobbar alltid för dig – aldrig för handlaren',
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-3 text-slate-700 text-[13px] sm:text-[14px] leading-snug">
                        <div className="w-5 h-5 rounded-full bg-[#0e6efe]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-[#0e6efe]" strokeWidth={3} />
                        </div>
                        {point}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => openBuyDrawer()}
                    className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold text-[15px] hover:bg-slate-800 transition inline-flex items-center justify-center gap-2 shadow-md"
                  >
                    Kom igång med Bilköpshjälpen
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="mt-3 text-center text-slate-400 text-[12px]">Fast pris · Noll bindning · Betalas vid köp</p>
                  <a
                    href={PHONE_TEL}
                    className="mt-3 w-full h-11 rounded-xl border border-slate-200 text-slate-600 font-medium text-[14px] hover:bg-[#faf8f5] transition inline-flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    Ring oss: {PHONE}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-6">
              <ShieldCheck className="w-4 h-4 text-white/70 shrink-0" />
              <p className="text-white/70 text-[13px] drop-shadow">Vi jobbar alltid för dig – aldrig för handlaren</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Grundlig genomgång ── */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-white py-12 sm:py-20 px-4 sm:px-6 overflow-hidden">
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

          {/* Mobile */}
          <div className="lg:hidden">
            <div className="flex items-center justify-center mb-6">
              <img
                src="/infographic_antal_agare.svg"
                alt="Infografik: antal ägare och bilhistorik"
                className="w-full max-w-[340px] h-auto"
                loading="lazy"
                decoding="async"
                width="340"
                height="340"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Olycksrisk', desc: 'Vi genomför certifierade kontroller och historikutdrag för att säkerställa att bilen inte har dolda skador.' },
                { label: 'Antal ägare', desc: 'Färre ägare betyder bättre omhändertagen bil. Vi utreder ägarhistoriken.' },
                { label: 'Bilens skick', desc: 'Från lack och inredning till maskinellt och elektronik – vi bedömer det faktiska skicket.' },
                { label: 'Körsträcka', desc: 'Vi verifierar miltal mot servicehistorik för att upptäcka eventuella felaktigheter.' },
                { label: 'Bilalternativ', desc: 'Vi jämför priset mot liknande bilar på marknaden så att du inte betalar för mycket.' },
              ].map((point) => (
                <div key={point.label}>
                  <h4 className="text-[14px] font-semibold text-slate-900 mb-1">{point.label}</h4>
                  <p className="text-[12px] text-slate-500 leading-[1.5]">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop */}
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
                loading="lazy"
                decoding="async"
                width="700"
                height="700"
              />
            </div>

            <div className="lg:col-span-1 space-y-8">
              {[
                { label: 'Bilens skick', desc: 'Från lack och inredning till maskinellt och elektronik – vi bedömer det faktiska skicket.' },
                { label: 'Körsträcka', desc: 'Vi verifierar miltal mot servicehistorik för att upptäcka eventuella felaktigheter.' },
                { label: 'Bilalternativ', desc: 'Vi jämför priset mot liknande bilar på marknaden så att du inte betalar för mycket.' },
              ].map((point) => (
                <div key={point.label}>
                  <h4 className="text-[18px] font-semibold text-slate-900 mb-1">{point.label}</h4>
                  <p className="text-[14px] text-slate-500 leading-[1.5]">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Expertens toppval ── */}
      <section className="bg-[#faf8f5] px-4 sm:px-6 py-16 sm:py-24 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-3">EXPERTERNAS VAL</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-slate-900 leading-[1.08] tracking-[-0.02em]">
              Bilar vår expert rekommenderar just nu
            </h2>
            <p className="mt-3 text-slate-500 text-[15px] max-w-xl leading-[1.65]">
              Handplockade modeller med bäst balans mellan pris, driftskostnad och tillförlitlighet. Berätta vad du söker – vi förhandlar priset.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularCars.map((car, i) => {
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
                    onNegotiate={() => openBuyDrawer(`${car.brand_display} ${car.model_display}`)}
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
                  onNegotiate={() => openBuyDrawer(`${car.brand_display} ${car.model_display}`)}
                  index={i}
                />
              );
            })}
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 rounded-xl overflow-hidden ring-1 ring-white/10">
            {INCLUDED.map((item) => (
              <div key={item.title} className="flex items-start gap-4 bg-white/[0.07] p-6 sm:p-7">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-white font-semibold text-[14px] sm:text-[15px] leading-snug">{item.title}</p>
                  <p className="text-white/60 text-[13px] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
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

      {/* ── Trygghet ── */}
      <section className="bg-[#faf8f5] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-14 max-w-2xl">
            <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-3">Trygghet</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-slate-900 tracking-[-0.02em] leading-[1.08]">
              Din partner för en trygg och lönsam bilaffär
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-px bg-slate-200 rounded-xl overflow-hidden ring-1 ring-slate-200">
            {[
              {
                icon: ShieldCheck,
                title: 'Oberoende rådgivning',
                text: 'Vi jobbar uteslutande för dig – inte för handlaren. Vårt arvode beror inte på vilken bil du väljer.',
              },
              {
                icon: Clock,
                title: 'Sparar dig tid',
                text: 'Sluta scrolla Blocket och Bytbil. Vår expert gör jobbet åt dig och återkommer med ett klart erbjudande inom 3–7 dagar.',
              },
              {
                icon: Banknote,
                title: 'Sparar dig pengar',
                text: 'Snittbesparing på 18 000 kr per affär. Vi förhandlar pris, ränta och tillval – du betalar 4 995 kr om affären blir av.',
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

          <div className="mt-10 flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <img
              src={EXPERT_PHOTO}
              alt="Alexander"
              className="w-14 h-14 rounded-xl object-cover object-top shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-slate-900 leading-snug">Alexander</p>
              <p className="text-[13px] text-slate-500 mt-0.5">VD och medgrundare</p>
              <p className="text-[13px] text-slate-600 mt-1 leading-snug">
                Har du frågor? Jag och mitt team hjälper dig hitta och förhandla rätt bil – helt utan bindning.
              </p>
            </div>
          </div>

          <SavingsInfoBox />
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="bg-white px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[7px] bg-[#0e6efe] px-6 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14 overflow-hidden">
            <div className="absolute -right-20 -top-20 w-[360px] h-[360px] rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -left-12 -bottom-16 w-[280px] h-[280px] rounded-full bg-white/5 pointer-events-none" />

            <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold tracking-[-0.02em] leading-[1.06] text-white">
                  Vill du ha en expert i ditt hörn?
                </h2>
                <ul className="mt-6 space-y-3">
                  {[
                    'En personlig bilexpert sköter hela förhandlingen',
                    'Vi söker i hela marknaden – inte bara ett lager',
                    'Våra kunder sparar ofta mer än vad tjänsten kostar',
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
                  <button
                    type="button"
                    onClick={() => openBuyDrawer()}
                    className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-white text-[#0e6efe] text-[15px] font-bold transition-all hover:bg-slate-100 active:scale-[0.98] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)]"
                  >
                    Skicka en förfrågan
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                  <a
                    href={PHONE_TEL}
                    className="inline-flex items-center justify-center h-12 px-7 rounded-xl border-2 border-white/40 text-white text-[15px] font-semibold transition-all hover:bg-white/10 active:scale-[0.98]"
                  >
                    <Phone className="w-4 h-4 mr-2 shrink-0" strokeWidth={2.5} />
                    Ring {PHONE}
                  </a>
                </div>
              </div>

              <div className="hidden lg:block relative h-[280px]">
                <div className="absolute left-0 top-0 w-[72%] h-full rounded-[18px] overflow-hidden">
                  <img
                    src="/BSM_car_sale_key_woman_handover_101122.jpg"
                    alt="Bilexpert hjälper kund"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                    width="480"
                    height="320"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 right-0 bg-white rounded-xl shadow-xl p-4 w-[160px]">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avgift</p>
                  <p className="text-[22px] font-bold text-slate-900 leading-none">4 995 kr</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">Betalas bara om affären blir av</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ReviewsSection variant="muted" />

      {/* ── FAQ ── */}
      <section className="bg-[#0e6efe] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">Vanliga frågor</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-white tracking-[-0.02em] leading-[1.08]">
              Vanliga frågor – vi svarar rakt på sak.
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
          onBack={onBack}
          onClose={() => setBuyDrawerCar(null)}
        />
      </Suspense>
    </div>
  );
}
