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
  User,
  Quote,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';

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
    avatar: '/Man_in_car_showroom_portrait.png',
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
    body: 'Via ett kort formulär — märke, budget, körprofil eller bara ett behov. Det tar två minuter.',
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
    body: 'Vår expert söker i hela marknaden, kontrollerar historik och förhandlar pris, ränta och tillval — du behöver aldrig prata med en handlare.',
    icon: TrendingDown,
  },
  {
    n: '04',
    title: 'Du godkänner och kör',
    body: 'Du får ett tydligt erbjudande med allt nerskrivet. Tackar du ja levereras bilen — hem om du vill.',
    icon: Handshake,
  },
];

const FAQS = [
  {
    q: 'Vad kostar tjänsten?',
    a: 'Det är helt kostnadsfritt för privatpersoner. Vi tar aldrig betalt av dig. Vi finansieras av ett blygsamt arvode från handlaren när en affär görs — det påverkar inte priset du betalar.',
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
    a: 'Ingenting. Det finns inga förpliktelser. Du tackar enkelt nej — och om du vill fortsöka justerar vi kriterierna.',
  },
  {
    q: 'Kan ni hjälpa till med inbytesbil?',
    a: 'Ja. Vi hanterar hela bytesaffären — värderar din bil, inhämtar konkurrerande bud från handlare och säkerställer att inbytesvärdet är marknadsmässigt.',
  },
];

export default function KopBilConcierge({ onBack, onNavigateBuy, onNavigateHowItWorks }: KopBilConciergProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Köp bil med hjälp av en expert | Bilto';
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.6);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Sälj bil') { onBack(); return; }
    if (item === 'Köp bil') { onNavigateBuy(); return; }
    if (item === 'Så funkar det') { onNavigateHowItWorks(); return; }
    onBack();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Köp bil"
        onSelect={handleMenuSelect}
      />

      {/* Nav */}
      <header
        className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${
          scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]'
        }`}
      >
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
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button
              type="button"
              onClick={onBack}
              className="text-[15px] text-white/80 hover:text-white transition font-medium"
            >
              Sälj bil
            </button>
            <button
              type="button"
              onClick={onNavigateBuy}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 border border-white/40 text-white text-[14px] font-semibold hover:bg-white/30 transition backdrop-blur-sm"
            >
              Köp bil med hjälp
            </button>
          </nav>
          <div className="flex items-center ml-auto">
            <a
              href="/gratis-konsultation"
              className="inline-flex items-center bg-white text-[#0e6efe] text-[12px] lg:text-[14px] font-semibold px-4 lg:px-5 h-10 rounded-full hover:bg-slate-100 transition whitespace-nowrap"
            >
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-[#0e6efe] pt-28 pb-0 overflow-hidden">
        <div className="absolute -left-60 -top-40 w-[800px] h-[800px] rounded-full bg-[#1a7cff] opacity-50 pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-[500px] h-[500px] rounded-full bg-[#0a57cc] opacity-40 pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 items-end">
            {/* Left copy */}
            <div className="pb-14 lg:pb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-[13px] font-semibold mb-8">
                <ShieldCheck className="w-4 h-4" />
                Vi jobbar alltid för dig — aldrig för handlaren
              </div>
              <h1 className="text-white text-[40px] sm:text-[56px] lg:text-[64px] font-bold leading-[1.0] tracking-tight">
                Din personliga<br />
                <span className="text-white/85">bilköpare</span>
              </h1>
              <p className="mt-6 text-white/85 text-[17px] sm:text-[20px] leading-[1.6] max-w-[480px]">
                Berätta vad du söker. Vi hittar rätt bil, granskar historiken och förhandlar priset — du slipper göra ett enda samtal till en handlare.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  'Söker i hela marknaden, inte bara ett lager',
                  'Förhandlar pris, ränta och tillval',
                  'Granskar historik och skick före köp',
                  'Gratis — utan förpliktelse',
                ].map((point) => (
                  <li key={point} className="flex items-center gap-3 text-white text-[15px] font-medium">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateBuy()}
                  className="h-14 px-8 rounded-full bg-white text-[#0e6efe] font-bold text-[16px] hover:bg-slate-50 transition shadow-lg inline-flex items-center gap-2 group justify-center"
                >
                  Kom igång gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
                </button>
                <a
                  href="tel:+46855550200"
                  className="h-14 px-7 rounded-full border-2 border-white/30 text-white font-semibold text-[15px] hover:border-white/60 transition inline-flex items-center gap-2 justify-center"
                >
                  <Phone className="w-4 h-4" />
                  Ring oss: 08-5555 0200
                </a>
              </div>
              <p className="mt-4 text-white/60 text-[13px]">Vi hör av oss inom en arbetsdag.</p>
            </div>

            {/* Right: expert cards teaser */}
            <div className="hidden lg:flex flex-col gap-4 pb-10 justify-end">
              {EXPERTS.map((e) => (
                <div
                  key={e.name}
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4"
                >
                  <img
                    src={e.avatar}
                    alt={e.name}
                    className="w-14 h-14 rounded-full object-cover object-top shrink-0 border-2 border-white/30"
                  />
                  <div className="min-w-0">
                    <p className="text-white font-bold text-[15px] leading-tight">{e.name}</p>
                    <p className="text-white/70 text-[13px]">{e.title} · {e.years}</p>
                    <p className="text-white/60 text-[12px] mt-0.5">{e.spec}</p>
                  </div>
                  <div className="ml-auto shrink-0 flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <p className="text-emerald-200 text-[13px] font-medium">En expert är tillgänglig nu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative h-16 mt-0">
          <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none" fill="white">
            <path d="M0,32 C360,80 1080,-16 1440,32 L1440,64 L0,64 Z" />
          </svg>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-white py-10 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: '5 000+', label: 'Bilar förmedlade' },
              { value: '~15 000 kr', label: 'Genomsnittlig besparing' },
              { value: '10+ år', label: 'Erfarenhet i branschen' },
              { value: '100%', label: 'På kundens sida' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-[26px] sm:text-[30px] font-bold text-[#0e6efe] tabular-nums tracking-tight leading-none">
                  {s.value}
                </p>
                <p className="text-[12px] sm:text-[13px] text-slate-500 font-medium mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Processen
            </span>
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.05] text-slate-900 tracking-tight">
              Fyra steg — du gör nästan ingenting
            </h2>
          </div>

          <div className="relative">
            {/* Connecting line desktop */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-slate-200" />

            <div className="grid lg:grid-cols-4 gap-8 lg:gap-6">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.n} className="relative text-center flex flex-col items-center">
                    <div className="relative z-10 w-20 h-20 rounded-2xl bg-[#0e6efe] flex items-center justify-center mb-5 shadow-lg shadow-[#0e6efe]/25">
                      <Icon className="w-8 h-8 text-white" strokeWidth={1.8} />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-[#0e6efe] text-[#0e6efe] text-[10px] font-bold flex items-center justify-center">
                        {step.n}
                      </span>
                    </div>
                    <h3 className="text-[16px] sm:text-[17px] font-bold text-slate-900 mb-2 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-[13.5px] text-slate-500 leading-relaxed max-w-[200px]">
                      {step.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-14 text-center">
            <button
              type="button"
              onClick={() => onNavigateBuy()}
              className="h-14 px-10 rounded-full bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[16px] transition shadow-sm inline-flex items-center gap-2 group"
            >
              Skicka en förfrågan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
            <p className="mt-3 text-[13px] text-slate-400">Gratis och utan förpliktelse.</p>
          </div>
        </div>
      </section>

      {/* Testimonial / case */}
      <section className="bg-[#f5f8fc] py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Kundcase
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-900 leading-tight tracking-tight">
              Vad en Bilto-expert faktiskt gör åt dig
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                quote: 'Jag hade hittat en Volvo XC40 men kände mig osäker. Bilto fick 15 000 kr i ersättning för en felaktig annons, förhandlade ner räntan 2 % och fick dubbdäck och 2 års garanti på köpet.',
                name: 'Josefin L.',
                car: 'Volvo XC40, 2022',
                saves: [
                  { label: 'Ränta', val: '−2 %' },
                  { label: 'Ersättning', val: '15 000 kr' },
                  { label: 'Inbyte', val: '+7 000 kr' },
                ],
              },
              {
                quote: 'Jag visste inte ens vilket märke jag ville ha. Experten ställde rätt frågor, föreslog tre alternativ och hittade en BMW i perfekt skick till 40 000 kr under vad jag trodde jag måste betala.',
                name: 'Daniel K.',
                car: 'BMW 320i, 2021',
                saves: [
                  { label: 'Besparing', val: '40 000 kr' },
                  { label: 'Tid sparat', val: '3 veckor' },
                  { label: 'Fordon granskade', val: '12 st' },
                ],
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-200 p-7 sm:p-8 shadow-sm">
                <Quote className="w-8 h-8 text-[#0e6efe]/20 mb-4" />
                <p className="text-[15px] sm:text-[16px] text-slate-700 leading-[1.65] mb-6 italic">
                  "{t.quote}"
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {t.saves.map((s) => (
                    <div key={s.label} className="bg-[#0e6efe]/5 rounded-xl px-3 py-3 text-center">
                      <p className="text-[15px] font-bold text-[#0e6efe] leading-tight">{s.val}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-800">{t.name}</p>
                    <p className="text-[12px] text-slate-500">{t.car}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the experts */}
      <section className="bg-white py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Teamet
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-900 leading-tight tracking-tight">
              Erfarna förhandlare — på din sida
            </h2>
            <p className="text-slate-500 mt-4 text-[15px] sm:text-[17px] max-w-xl mx-auto leading-relaxed">
              Vårt team har jobbat som toppsäljare hos Sveriges största bilhandlare i sammanlagt över 40 år. Nu jobbar vi uteslutande för köparen.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {EXPERTS.map((e) => (
              <div key={e.name} className="flex flex-col items-center text-center bg-[#f5f8fc] rounded-2xl p-8 border border-slate-200">
                <div className="relative mb-5">
                  <img
                    src={e.avatar}
                    alt={e.name}
                    className="w-24 h-24 rounded-full object-cover object-top border-4 border-white shadow-md"
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <p className="text-[18px] font-bold text-slate-900">{e.name}</p>
                <p className="text-[13px] text-[#0e6efe] font-semibold mt-1">{e.title}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{e.years} · {e.spec}</p>
                <div className="flex gap-0.5 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-slate-100 text-slate-600 text-[14px] font-medium">
              <Users className="w-4 h-4" />
              +3 ytterligare experter i teamet
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="bg-[#0e6efe] py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] sm:text-[44px] font-bold text-white leading-tight tracking-tight">
              Vad ingår i tjänsten?
            </h2>
            <p className="text-white/75 mt-4 text-[15px] sm:text-[17px] max-w-xl mx-auto">
              Allt du behöver från idé till nyckel — utan att du behöver göra jobbet.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Sökning i hela marknaden', desc: 'Vi letar på alla plattformar — inte bara ett handlares lager.' },
              { title: 'Prisförhandling', desc: 'Vi vet vad handlaren betalt för bilen och var marginalen finns.' },
              { title: 'Historikkontroll', desc: 'Ägarhistorik, skador, miltal och service — granskat innan erbjudande.' },
              { title: 'Ränteförhandling', desc: 'Vi jämför finansiering och pressar räntan mot flera aktörer.' },
              { title: 'Inbytesvärdering', desc: 'Om du byter in en bil hämtar vi konkurrerande bud.' },
              { title: 'Leverans hem', desc: 'Vi kan koordinera hemleverans utan att du behöver besöka handlaren.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-white font-semibold text-[15px] leading-snug">{item.title}</p>
                  <p className="text-white/65 text-[13px] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => onNavigateBuy()}
              className="h-14 px-10 rounded-full bg-white text-[#0e6efe] font-bold text-[16px] hover:bg-slate-50 transition shadow-lg inline-flex items-center gap-2 group"
            >
              Kom igång nu
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Vanliga frågor
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-900 leading-tight tracking-tight">
              Allt du behöver veta
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="border border-slate-200 rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[15px] font-semibold text-slate-900 leading-snug">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-[14.5px] text-slate-600 leading-[1.65]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#f5f8fc] py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[32px] sm:text-[52px] font-bold text-slate-900 leading-[1.05] tracking-tight">
            Redo att köpa bil — utan stressen?
          </h2>
          <p className="text-slate-600 mt-5 text-[16px] sm:text-[18px] leading-[1.6] max-w-xl mx-auto">
            Det tar två minuter att berätta vad du söker. Resten är upp till oss.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => onNavigateBuy()}
              className="h-14 px-10 rounded-full bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[16px] transition shadow-sm inline-flex items-center justify-center gap-2 group"
            >
              Skicka en förfrågan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
            <a
              href="tel:+46855550200"
              className="h-14 px-8 rounded-full border-2 border-slate-300 text-slate-700 font-semibold text-[15px] hover:border-slate-400 transition inline-flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Ring oss direkt
            </a>
          </div>
          <p className="mt-5 text-[13px] text-slate-400">Gratis · Utan förpliktelse · Vi hör av oss inom en arbetsdag</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
