import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Phone,
  Search,
  ShieldCheck,
  Star,
  TrendingDown,
  Users,
  Handshake,
  Menu,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { setPageMeta } from '../lib/pageMeta';
import BuyFlowFAQ from '../components/BuyFlowFAQ';

interface KopBilConciergProps {
  onBack: () => void;
  onNavigateBuy: (bil?: string) => void;
  onNavigateHowItWorks: () => void;
}

const EXPERTS = [
  {
    name: 'Marcus Holm',
    title: 'Seniorförhandlare',
    years: '12 år i branschen',
    avatar: '/daniel-portrait.jpg',
    spec: 'Premium & tyska märken',
  },
  {
    name: 'Sofia Lindgren',
    title: 'Bilrådgivare',
    years: '8 år i branschen',
    avatar: '/BSM_car_sale_key_woman_handover_101122.jpg',
    spec: 'Familjebil & inbyte',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Du berättar vad du söker',
    body: 'Via ett kort formulär – märke, budget, körprofil eller bara ett behov. Tar två minuter.',
    icon: Search,
  },
  {
    n: '02',
    title: 'En expert tar vid',
    body: 'Vi ringer dig inom en arbetsdag, ställer rätt frågor och lägger upp ett sökkoncept anpassat för dig.',
    icon: Phone,
  },
  {
    n: '03',
    title: 'Vi hittar och förhandlar',
    body: 'Vår expert söker i hela marknaden, kontrollerar historik och förhandlar pris, ränta och tillval.',
    icon: TrendingDown,
  },
  {
    n: '04',
    title: 'Du godkänner och kör',
    body: 'Du får ett tydligt erbjudande med allt nerskrivet. Tackar du ja levereras bilen – hem om du vill.',
    icon: Handshake,
  },
];

const FAQS = [
  {
    q: 'Vad kostar tjänsten?',
    a: 'Det är helt kostnadsfritt för privatpersoner. Vi tar aldrig betalt av dig. Vi finansieras av ett blygsamt arvode från handlaren när en affär görs – det påverkar inte priset du betalar.',
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
    a: 'Ingenting. Det finns inga förpliktelser. Du tackar enkelt nej – och om du vill fortsöka justerar vi kriterierna.',
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

export default function KopBilConcierge({ onBack, onNavigateBuy, onNavigateHowItWorks }: KopBilConciergProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Köp bil med hjälp av en expert – Bilto Concierge',
      description: 'Låt Biltos experter hjälpa dig hitta, förhandla och köpa rätt bil. Vi sköter kontakten med handlare åt dig – gratis och utan krångel.',
      canonical: 'https://bilto.se/kop-bil-hjalp',
    });
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
            <button type="button" onClick={onNavigateBuy} className="text-[15px] text-white/80 hover:text-white transition font-medium">Bilköpshjälpen</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/guider'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 hover:text-white transition font-medium">Guider</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/priser'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 hover:text-white transition font-medium">Priser</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/vanliga-fragor'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 hover:text-white transition font-medium">Vanliga frågor</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/bilspara'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/90 hover:text-white transition flex items-center gap-1.5">
              Bilspara
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>
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
        {/* Background image */}
        <img
          src="/files_2615643-2026-06-21T06-29-18-662Z-b858d9c8-9893-488f-8103-98fee9292c16 copy.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-[50%_65%]"
          fetchPriority="high"
          decoding="async"
        />
        {/* Gradient overlay – strong at top so nav/text readable, fades to transparent */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-transparent pointer-events-none" />

        {/* Content – sits below the fixed nav pill (nav is 64px + 12px top = 76px) */}
        <div className="relative flex-1 flex flex-col items-center justify-start pt-28 sm:pt-32 pb-10 px-5 sm:px-8">
          <div className="w-full max-w-md">
            {/* Headline */}
            <h1 className="text-white text-[36px] sm:text-[48px] font-bold leading-[1.08] tracking-tight text-center drop-shadow-lg mb-2">
              Köp bil –<br />med en expert på din sida
            </h1>
            <p className="text-white/80 text-center text-[14px] sm:text-[15px] mb-6 sm:mb-7 drop-shadow">
              Helt gratis · Söker hela marknaden · Noll bindning
            </p>

            {/* Card */}
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-2">
                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-4">Köp bil med expert</p>
                <ul className="space-y-3 mb-5">
                  {[
                    'Söker i hela marknaden, inte bara ett lager',
                    'Förhandlar pris, ränta och tillval åt dig',
                    'Granskar historik och skick före köp',
                    'Koordinerar hemleverans om du vill',
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-3 text-slate-700 text-[14px] sm:text-[15px]">
                      <div className="w-5 h-5 rounded-full bg-[#0e6efe]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#0e6efe]" strokeWidth={3} />
                      </div>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-6 pb-6 space-y-3">
                <button
                  type="button"
                  onClick={() => onNavigateBuy()}
                  className="w-full h-13 sm:h-14 rounded-xl bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[16px] transition shadow-md inline-flex items-center justify-center gap-2 group"
                >
                  Få prishjälp
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
                </button>
                <p className="text-center text-white/60 text-[12px]">Fast pris 1&nbsp;995 kr – endast om affären blir av</p>
                <a
                  href="tel:+46855550200"
                  className="w-full h-11 rounded-xl border border-slate-200 text-slate-600 font-medium text-[14px] hover:bg-[#faf8f5] transition inline-flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  Ring oss: 08-5555 0200
                </a>
              </div>

            </div>

            <div className="flex items-center justify-center gap-1.5 mt-5">
              <ShieldCheck className="w-4 h-4 text-white/70 shrink-0" />
              <p className="text-white/70 text-[13px] drop-shadow">Vi jobbar alltid för dig – aldrig för handlaren</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-14">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Processen
            </span>
            <h2 className="text-[28px] sm:text-[44px] font-bold leading-[1.1] text-slate-900 tracking-tight">
              Fyra steg – du behöver bara sitta still
            </h2>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-slate-200" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.n} className="relative flex lg:flex-col items-start lg:items-center gap-4 lg:gap-0 lg:text-center">
                    <div className="relative z-10 w-16 h-16 lg:w-20 lg:h-20 rounded-xl bg-[#0e6efe] flex items-center justify-center shrink-0 lg:mb-5 shadow-lg shadow-[#0e6efe]/20">
                      <Icon className="w-7 h-7 lg:w-8 lg:h-8 text-white" strokeWidth={1.8} />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-[#0e6efe] text-[#0e6efe] text-[10px] font-bold flex items-center justify-center">
                        {step.n}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 mb-1.5 leading-snug">
                        {step.title}
                      </h3>
                      <p className="text-[13px] sm:text-[13.5px] text-slate-500 leading-relaxed lg:max-w-[190px]">
                        {step.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-12 sm:mt-14 text-center">
            <button
              type="button"
              onClick={() => onNavigateBuy()}
              className="h-13 sm:h-14 px-8 sm:px-10 rounded-xl bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[15px] sm:text-[16px] transition shadow-sm inline-flex items-center gap-2 group"
            >
              Skicka en förfrågan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
            <p className="mt-3 text-[13px] text-slate-400">Gratis och utan förpliktelse.</p>
          </div>
        </div>
      </section>

      {/* ── What's included ── */}
      <section className="bg-[#0e6efe] py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-[26px] sm:text-[42px] font-bold text-white leading-tight tracking-tight">
              Vad ingår i tjänsten?
            </h2>
            <p className="text-white/70 mt-3 sm:mt-4 text-[15px] sm:text-[17px] max-w-xl mx-auto leading-relaxed">
              Allt från idé till nyckel – vi gör jobbet åt dig.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {INCLUDED.map((item) => (
              <div key={item.title} className="flex items-start gap-4 bg-white/10 rounded-xl p-5 border border-white/15">
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

          <div className="mt-10 sm:mt-12 text-center">
            <button
              type="button"
              onClick={() => onNavigateBuy()}
              className="h-13 sm:h-14 px-8 sm:px-10 rounded-xl bg-white text-[#0e6efe] font-bold text-[15px] sm:text-[16px] hover:bg-[#faf8f5] transition shadow-lg inline-flex items-center gap-2 group"
            >
              Få prishjälp
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="bg-[#faf8f5] border-y border-slate-200 py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Teamet
            </span>
            <h2 className="text-[26px] sm:text-[40px] font-bold text-slate-900 leading-tight tracking-tight">
              Erfarna förhandlare – på din sida
            </h2>
            <p className="text-slate-500 mt-3 sm:mt-4 text-[14px] sm:text-[16px] max-w-xl mx-auto leading-relaxed">
              Vårt team har jobbat som toppsäljare hos Sveriges största bilhandlare i sammanlagt över 40 år. Nu jobbar vi uteslutande för köparen.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {EXPERTS.map((e) => (
              <div key={e.name} className="flex items-center gap-5 bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm">
                <div className="relative shrink-0">
                  <img
                    src={e.avatar}
                    alt={e.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover object-top border-4 border-white shadow-md"
                  />
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div>
                  <p className="text-[16px] sm:text-[17px] font-bold text-slate-900">{e.name}</p>
                  <p className="text-[13px] text-[#0e6efe] font-semibold mt-0.5">{e.title}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">{e.years} · {e.spec}</p>
                  <div className="flex gap-0.5 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-[13px] sm:text-[14px] font-medium shadow-sm">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              +3 ytterligare experter i teamet
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Vanliga frågor
            </span>
            <h2 className="text-[26px] sm:text-[40px] font-bold text-slate-900 leading-tight tracking-tight">
              Allt du behöver veta
            </h2>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[14px] sm:text-[15px] font-semibold text-slate-900 leading-snug">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 sm:px-6 pb-5 border-t border-slate-100 pt-3">
                    <p className="text-[13.5px] sm:text-[14.5px] text-slate-600 leading-[1.7]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-slate-50 border-t border-slate-200 py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[28px] sm:text-[48px] font-bold text-slate-900 leading-[1.1] tracking-tight">
            Trött på bilköps-kaos?<br className="hidden sm:block" /> Vi sköter det.
          </h2>
          <p className="text-slate-500 mt-4 sm:mt-5 text-[15px] sm:text-[17px] leading-[1.65] max-w-lg mx-auto">
            Berätta vad du söker – resten tar vi hand om.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => onNavigateBuy()}
              className="h-13 sm:h-14 px-8 sm:px-10 rounded-xl bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[15px] sm:text-[16px] transition shadow-sm inline-flex items-center justify-center gap-2 group"
            >
              Skicka en förfrågan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
            <a
              href="tel:+46855550200"
              className="h-13 sm:h-14 px-6 sm:px-8 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold text-[14px] sm:text-[15px] hover:border-slate-400 hover:bg-white transition inline-flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 shrink-0" />
              Ring oss direkt
            </a>
          </div>
          <p className="mt-5 text-[12px] sm:text-[13px] text-slate-400">
            Gratis · Utan bindning · Vi hör av oss inom en arbetsdag
          </p>
        </div>
      </section>

      <BuyFlowFAQ variant="concierge" />
      <SiteFooter />
    </div>
  );
}
