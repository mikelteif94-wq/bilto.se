import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Phone,
  Search,
  ShieldCheck,
  TrendingDown,
  Handshake,
  Menu,
  MessageCircle,
  CalendarCheck,
  BadgeCheck,
  Clock,
  Banknote,
  ThumbsUp,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { setPageMeta } from '../lib/pageMeta';
import BuyFlowFAQ from '../components/BuyFlowFAQ';
import { PHONE, PHONE_TEL } from '../config/site';

interface KopBilConciergProps {
  onBack: () => void;
  onNavigateBuy: (bil?: string) => void;
  onNavigateHowItWorks: () => void;
}

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
    q: 'Kostar det något att använda Biltos köptjänst?',
    a: 'Ja – tjänsten kostar 1 995 kr och betalas bara om affären faktiskt blir av. Inget köp, ingen kostnad. Snittbesparingen vi förhandlar fram är 18 000 kr per affär, så de flesta kunder tjänar mångfalt mer än de betalar.',
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

const WHY_BILTO = [
  {
    icon: Banknote,
    title: 'Vi sparar dig pengar',
    desc: 'Snittbesparing på 18 000 kr per affär. Vi förhandlar pris, ränta och tillval – du betalar 1 995 kr om affären blir av.',
  },
  {
    icon: Clock,
    title: 'Vi sparar dig tid',
    desc: 'Sluta scrolla Blocket och Bytbil. Vår expert gör jobbet åt dig och återkommer med ett klart erbjudande inom 3–7 dagar.',
  },
  {
    icon: BadgeCheck,
    title: 'Oberoende rådgivning',
    desc: 'Vi jobbar uteslutande för dig. Inte för handlaren, inte för säljaren. Vårt arvode beror inte på vilken bil du väljer.',
  },
  {
    icon: ThumbsUp,
    title: 'Inga dåliga affärer',
    desc: 'Vi granskar historik, skick och prissättning noggrant. Du får bara ett erbjudande när vi är nöjda med det.',
  },
];

export default function KopBilConcierge({ onBack, onNavigateBuy, onNavigateHowItWorks }: KopBilConciergProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Köp bil med hjälp av en expert – Bilto',
      description: 'Låt Biltos experter hjälpa dig hitta, förhandla och köpa rätt bil. Vi sköter kontakten med handlare åt dig – 1 995 kr om affären blir av.',
      canonical: 'https://bilto.se/kop-bil',
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-transparent pointer-events-none" />

        <div className="relative flex-1 flex flex-col items-center justify-start pt-28 sm:pt-32 pb-10 px-5 sm:px-8">
          <div className="w-full max-w-md">
            <h1 className="text-white text-[36px] sm:text-[48px] font-bold leading-[1.08] tracking-tight text-center drop-shadow-lg mb-2">
              Köp bil –<br />med en expert på din sida
            </h1>
            <p className="text-white/80 text-center text-[14px] sm:text-[15px] mb-6 sm:mb-7 drop-shadow">
              1 995 kr om affären blir av · Söker hela marknaden · Noll bindning
            </p>

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
                  className="w-full h-12 rounded-xl bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[16px] transition shadow-md inline-flex items-center justify-center gap-2 group"
                >
                  Få prishjälp
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
                </button>
                <p className="text-center text-slate-400 text-[12px]">Fast pris 1&nbsp;995 kr – betalas bara om affären blir av</p>
                <a
                  href={PHONE_TEL}
                  className="w-full h-11 rounded-xl border border-slate-200 text-slate-600 font-medium text-[14px] hover:bg-[#faf8f5] transition inline-flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  Ring oss: {PHONE}
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
          <div className="mb-12 sm:mb-14">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Processen
            </span>
            <h2 className="text-[28px] sm:text-[44px] font-bold leading-[1.1] text-slate-900 tracking-tight">
              Fyra steg – du behöver bara sitta still
            </h2>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-slate-200" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.n} className="relative flex lg:flex-col items-start gap-4 lg:gap-0">
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

          <div className="mt-12 sm:mt-14">
            <button
              type="button"
              onClick={() => onNavigateBuy()}
              className="h-12 px-8 sm:px-10 rounded-xl bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[15px] transition shadow-sm inline-flex items-center gap-2 group"
            >
              Skicka en förfrågan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
            <p className="mt-3 text-[13px] text-slate-400">1 995 kr – betalas bara om affären blir av.</p>
          </div>
        </div>
      </section>

      {/* ── What's included ── */}
      <section className="bg-[#0e6efe] py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-12">
            <h2 className="text-[26px] sm:text-[42px] font-bold text-white leading-tight tracking-tight">
              Vad ingår i tjänsten?
            </h2>
            <p className="text-white/70 mt-3 sm:mt-4 text-[15px] sm:text-[17px] max-w-xl leading-relaxed">
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

          <div className="mt-10 sm:mt-12">
            <button
              type="button"
              onClick={() => onNavigateBuy()}
              className="h-12 px-8 sm:px-10 rounded-xl bg-white text-[#0e6efe] font-bold text-[15px] hover:bg-[#faf8f5] transition shadow-lg inline-flex items-center gap-2 group"
            >
              Få prishjälp
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Varför Bilto ── */}
      <section className="py-16 sm:py-24 px-5 sm:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 sm:mb-14">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Varför Bilto
            </span>
            <h2 className="text-[28px] sm:text-[44px] font-bold text-slate-900 leading-[1.1] tracking-tight">
              Det smartaste sättet att köpa bil
            </h2>
            <p className="text-slate-500 mt-3 sm:mt-4 text-[15px] sm:text-[17px] max-w-xl leading-relaxed">
              Du går aldrig ensam till en bilhandlare. Nu behöver du inte göra det digitalt heller.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
            {WHY_BILTO.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-5 bg-[#faf8f5] rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-[#0e6efe]" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 leading-snug mb-1.5">{item.title}</h3>
                    <p className="text-[13px] sm:text-[14px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 sm:mt-12">
            <button
              type="button"
              onClick={() => onNavigateBuy()}
              className="h-12 px-8 sm:px-10 rounded-xl bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[15px] transition shadow-sm inline-flex items-center gap-2 group"
            >
              Kom igång
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
            <p className="mt-3 text-[13px] text-slate-400">1 995 kr om affären blir av · Ingen bindning</p>
          </div>
        </div>
      </section>

      {/* ── Inte säker? Prata med oss ── */}
      <section className="py-16 sm:py-24 px-5 sm:px-8 bg-[#faf8f5] border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-12">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Osäker?
            </span>
            <h2 className="text-[26px] sm:text-[42px] font-bold text-slate-900 leading-[1.1] tracking-tight">
              Prata med oss – utan förpliktelse
            </h2>
            <p className="text-slate-500 mt-3 sm:mt-4 text-[14px] sm:text-[16px] max-w-lg leading-relaxed">
              Inte redo att skicka en förfrågan? Hör av dig så svarar vi på dina frågor utan säljsnack.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-start gap-4 bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-[#0e6efe] flex items-center justify-center shadow-lg shadow-[#0e6efe]/25">
                <MessageCircle className="w-7 h-7 text-white" strokeWidth={1.8} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-slate-900 mb-1">Chatta med oss</p>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-4">Svar på minuter under kontorstid. Inga robo-svar.</p>
                <button
                  type="button"
                  onClick={() => onNavigateBuy()}
                  className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[#0e6efe] text-white text-[13px] font-semibold hover:bg-[#0b5cd8] transition"
                >
                  Starta chatt
                </button>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-[#0e6efe] flex items-center justify-center shadow-lg shadow-[#0e6efe]/25">
                <CalendarCheck className="w-7 h-7 text-white" strokeWidth={1.8} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-slate-900 mb-1">Boka ett samtal</p>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-4">Välj en tid som passar – vi ringer dig upp och svarar på allt.</p>
                <a
                  href="/gratis-konsultation"
                  className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[#0e6efe] text-white text-[13px] font-semibold hover:bg-[#0b5cd8] transition"
                >
                  Boka tid
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-[#0e6efe] flex items-center justify-center shadow-lg shadow-[#0e6efe]/25">
                <Phone className="w-7 h-7 text-white" strokeWidth={1.8} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-slate-900 mb-1">Ring direkt</p>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-4">Mån–fre 8–18. En riktig person svarar – inte ett callcenter.</p>
                <a
                  href={PHONE_TEL}
                  className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[#0e6efe] text-white text-[13px] font-semibold hover:bg-[#0b5cd8] transition"
                >
                  {PHONE}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 sm:mb-12">
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
      <section className="bg-[#0e6efe] py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[28px] sm:text-[48px] font-bold text-white leading-[1.1] tracking-tight max-w-xl">
            Trött på bilköps-kaos?<br className="hidden sm:block" /> Vi sköter det.
          </h2>
          <p className="text-white/70 mt-4 sm:mt-5 text-[15px] sm:text-[17px] leading-[1.65] max-w-lg">
            Berätta vad du söker – resten tar vi hand om.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => onNavigateBuy()}
              className="h-12 px-8 sm:px-10 rounded-xl bg-white text-[#0e6efe] font-bold text-[15px] hover:bg-[#faf8f5] transition shadow-lg inline-flex items-center justify-center gap-2 group"
            >
              Skicka en förfrågan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
            <a
              href={PHONE_TEL}
              className="h-12 px-6 sm:px-8 rounded-xl border-2 border-white/40 text-white font-semibold text-[14px] hover:border-white hover:bg-white/10 transition inline-flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 shrink-0" />
              Ring oss direkt
            </a>
          </div>
          <p className="mt-5 text-[12px] sm:text-[13px] text-white/50">
            1 995 kr om affären blir av · Ingen bindning · Vi hör av oss inom en arbetsdag
          </p>
        </div>
      </section>

      <BuyFlowFAQ variant="concierge" />
      <SiteFooter />
    </div>
  );
}
