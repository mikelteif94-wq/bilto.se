import { useState, useEffect } from 'react';
import {
  ArrowRight, Check, Zap, ArrowLeftRight, Wrench, CalendarDays,
  ChevronRight, Menu, ArrowLeft, Star, Shield, TrendingDown, Leaf,
  Plug, Car, Phone,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';

interface BytTillElPageProps {
  onBack: () => void;
  onNavigateBuy?: (bil?: string) => void;
  onNavigateElCars?: () => void;
  onNavigateConsultation?: () => void;
  onNavigateHowItWorks?: () => void;
}

const BENEFITS = [
  {
    icon: TrendingDown,
    title: 'Lägre månadskostnad',
    desc: 'Rätt elbil med smart finansiering kan kosta dig mindre varje månad än din nuvarande bil.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Leaf,
    title: 'Noll i utsläpp',
    desc: 'Kör fossilfritt och slipp trängselskatt, parkeringsavgifter och höga drivmedelskostnader.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: Wrench,
    title: 'Lägre servicekostnader',
    desc: 'Elbilar har färre rörliga delar – inga oljebyten, koppling eller avgassystem att byta.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Plug,
    title: 'Laddbox ingår',
    desc: 'Vi hjälper dig installera rätt laddbox hemma – ingår som en del av din övergång.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Boka gratis rådgivning',
    desc: 'En bilexpert ringer upp och går igenom dina behov, körsträcka och ekonomi.',
    icon: CalendarDays,
  },
  {
    n: '2',
    title: 'Vi hittar din elbil',
    desc: 'Vi söker, förhandlar och presenterar matchande alternativ – du väljer.',
    icon: Car,
  },
  {
    n: '3',
    title: 'Inbytet sköter vi',
    desc: 'Har du en bil att byta in? Vi värderar och hanterar hela inbytet åt dig.',
    icon: ArrowLeftRight,
  },
  {
    n: '4',
    title: 'Laddbox på plats',
    desc: 'Vi koordinerar installation av laddbox hemma hos dig om du vill ha det.',
    icon: Plug,
  },
];

const POPULAR_EVS = [
  { make: 'Volvo', model: 'EX30', range: '480 km', price: '3 990 kr/mån', img: '/getImage_polestar2.webp' },
  { make: 'Tesla', model: 'Model 3', range: '513 km', price: '4 490 kr/mån', img: '/getImage_ioniq5.webp' },
  { make: 'Hyundai', model: 'IONIQ 5', range: '507 km', price: '4 290 kr/mån', img: '/getImage_ioniq5.webp' },
  { make: 'Polestar', model: '2', range: '635 km', price: '4 790 kr/mån', img: '/getImage_polestar2.webp' },
];

const REVIEWS = [
  {
    name: 'Erik Svensson',
    from: 'Bytte från Volvo V60',
    text: 'Bilto skötte allt – inbytet, förhandlingen och laddboxen. Jag behövde inte göra ett enda telefonsamtal.',
    stars: 5,
    img: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    name: 'Maria Johansson',
    from: 'Bytte från BMW X3',
    text: 'Visste inte var jag skulle börja. Fick konkret råd om rätt modell och finansiering. Betalar faktiskt 600 kr/mån mindre nu.',
    stars: 5,
    img: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    name: 'Lars Nilsson',
    from: 'Bytte från Audi A4',
    text: 'Snabb och smidig process. Fick ett bra inbytespris och laddboxen installerad innan leverans. Toppenklass.',
    stars: 5,
    img: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
];

const FAQ = [
  {
    q: 'Klarar jag mig med en elbil i vardagen?',
    a: 'De flesta som kör under 400 km per dag klarar sig utmärkt. Vi går igenom din körsträcka och hjälper dig hitta rätt räckvidd för ditt behov.',
  },
  {
    q: 'Vad händer med min nuvarande bil?',
    a: 'Vi värderar din bil och hanterar hela inbytet – du behöver inte annonsera eller träffa privatköpare.',
  },
  {
    q: 'Kostar laddboxen extra?',
    a: 'Vi hjälper dig välja och installera rätt laddbox. Kostnaden varierar beroende på modell och installation, men vi guidar dig till bästa pris.',
  },
  {
    q: 'Hur snabbt kan jag byta?',
    a: 'Från rådgivning till nyckel i hand tar det vanligtvis 2–4 veckor beroende på val av bil.',
  },
  {
    q: 'Är det verkligen kostnadsfritt?',
    a: 'Rådgivningen är helt gratis och utan bindning. Vi tar provision från handlaren när du väljer att köpa – inte från dig.',
  },
];

export default function BytTillElPage({
  onBack,
  onNavigateBuy,
  onNavigateElCars,
  onNavigateConsultation,
  onNavigateHowItWorks,
}: BytTillElPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = 'Byt till Elbil – Vi sköter hela övergången | Bilto';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Byt till elbil smidigt med Bilto. Vi hittar din elbil, sköter inbytet och installerar laddbox. Gratis rådgivning utan bindning.');
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Sälj bil') { onBack(); return; }
    if (item === 'Köp bil') { onNavigateBuy?.(); return; }
    if (item === 'Så funkar det') { onNavigateHowItWorks?.(); return; }
    onBack();
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active={null as unknown as 'Sälj bil'}
        onSelect={handleMenuSelect}
      />

      {/* Sticky nav */}
      <header className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 transition-all duration-300 ${scrolled ? 'bg-[#0e6efe] shadow-blue-500/20' : 'bg-[#0e6efe]'}`}>
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
            <button type="button" onClick={onBack} className="text-[15px] text-white/80 hover:text-white transition font-medium">
              Sälj bil
            </button>
            <button type="button" onClick={() => onNavigateElCars?.()} className="text-[15px] text-white/80 hover:text-white transition font-medium">
              Köp bil
            </button>
            <button
              type="button"
              onClick={() => onNavigateHowItWorks?.()}
              className="text-[15px] text-white/80 hover:text-white transition font-medium"
            >
              Så funkar det
            </button>
            <span className="text-[15px] text-white font-semibold border-b-2 border-white/50 pb-0.5">
              Byt till El
            </span>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateConsultation?.()}
              className="hidden sm:flex items-center gap-1.5 h-9 px-4 bg-white text-[#0e6efe] text-[13px] font-bold rounded-xl hover:bg-blue-50 transition-all shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              Boka rådgivning
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Tillbaka</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0e6efe] pt-32 lg:pt-40 pb-24 px-4">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-48 opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-xl mb-6 tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              Vi sköter hela övergången
            </div>
            <h1 className="text-[34px] sm:text-5xl lg:text-[58px] font-black text-white leading-[1.08] tracking-tight mb-5">
              Byt till elbil –{' '}
              <span className="text-yellow-300">vi fixar allt</span>
            </h1>
            <p className="text-blue-100 text-[17px] sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              Inbyte, förhandling och laddbox. En kontakt, en process – och du kör fossilfritt.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              type="button"
              onClick={() => onNavigateConsultation?.()}
              className="group w-full sm:w-auto flex items-center justify-center gap-2.5 h-14 px-8 bg-white text-[#0e6efe] text-[16px] font-black rounded-2xl shadow-xl shadow-black/20 hover:bg-blue-50 active:scale-[0.98] transition-all duration-150"
            >
              <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
              Boka gratis rådgivning
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateElCars?.()}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 h-14 px-8 bg-white/10 border border-white/20 backdrop-blur-sm text-white text-[15px] font-semibold rounded-2xl hover:bg-white/20 active:scale-[0.98] transition-all duration-150"
            >
              Utforska elbilar
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-2"
          >
            {[
              'Gratis & utan bindning',
              'Inbyte ingår',
              'Laddbox-hjälp',
              'Vi förhandlar priset',
            ].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-[13px] text-blue-100/80">
                <Check className="w-3.5 h-3.5 text-yellow-300 shrink-0" strokeWidth={2.5} />
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none">
          <svg viewBox="0 0 1440 48" fill="none" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0 48 L0 24 Q360 0 720 24 Q1080 48 1440 24 L1440 48 Z" fill="#faf8f5" />
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-6 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {[
            { value: '60%', label: 'Lägre drivmedelskostnad' },
            { value: '0 kr', label: 'Trängselskatt i storstäder' },
            { value: '4–6 v', label: 'Från rådgivning till leverans' },
            { value: '100%', label: 'Nöjdhetsgaranti' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center text-center pt-4 md:pt-0 first:pt-0">
              <span className="text-[28px] font-black text-[#0e6efe] leading-none">{s.value}</span>
              <span className="text-[12px] text-slate-500 mt-1 font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-[11px] font-bold tracking-[0.18em] uppercase text-[#0e6efe] mb-3">Varför byta</span>
            <h2 className="text-[28px] sm:text-4xl font-black text-slate-900 leading-tight">
              Rätt elbil ger mer – inte bara för miljön
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-[15px]">
              Ekonomin, körupplevelsen och underhållet talar för sig självt.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl ${b.bg} flex items-center justify-center mb-4`}>
                  <b.icon className={`w-5 h-5 ${b.color}`} strokeWidth={2} />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-4 border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-[11px] font-bold tracking-[0.18em] uppercase text-[#0e6efe] mb-3">Så funkar det</span>
            <h2 className="text-[28px] sm:text-4xl font-black text-slate-900 leading-tight">
              Fyra steg – vi tar hand om resten
            </h2>
          </div>

          <div className="relative">
            {/* Connector line desktop */}
            <div className="hidden lg:block absolute top-[42px] left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-[2px] bg-gradient-to-r from-[#0e6efe]/20 via-[#0e6efe]/60 to-[#0e6efe]/20 pointer-events-none" />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="relative mb-5">
                    <div className="w-[84px] h-[84px] rounded-2xl bg-[#0e6efe]/8 flex items-center justify-center">
                      <s.icon className="w-8 h-8 text-[#0e6efe]" strokeWidth={1.8} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-xl bg-[#0e6efe] flex items-center justify-center shadow-md shadow-blue-300/40">
                      <span className="text-[11px] font-black text-white">{s.n}</span>
                    </div>
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => onNavigateConsultation?.()}
              className="group inline-flex items-center gap-2.5 h-13 px-8 py-3.5 bg-[#0e6efe] text-white text-[15px] font-bold rounded-2xl shadow-lg shadow-blue-300/30 hover:bg-blue-600 active:scale-[0.98] transition-all duration-150"
            >
              <Zap className="w-4.5 h-4.5 text-yellow-300" style={{ width: 18, height: 18 }} />
              Kom igång – boka rådgivning
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <p className="text-[12px] text-slate-400 mt-3">Gratis · Ingen bindning · Vi ringer dig</p>
          </div>
        </div>
      </section>

      {/* ── POPULAR EVS ───────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-[11px] font-bold tracking-[0.18em] uppercase text-[#0e6efe] mb-3">Populära val</span>
            <h2 className="text-[28px] sm:text-4xl font-black text-slate-900 leading-tight">
              Bilar vi förhandlar åt dig just nu
            </h2>
            <p className="text-slate-500 mt-3 text-[15px]">Priser är exempel för leasing. Vi hittar bästa erbjudandet för dig.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {POPULAR_EVS.map((car, i) => (
              <motion.div
                key={`${car.make}-${car.model}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                onClick={() => onNavigateElCars?.()}
              >
                <div className="aspect-[4/3] bg-slate-50 overflow-hidden">
                  <img
                    src={car.img}
                    alt={`${car.make} ${car.model}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-[#0e6efe]" />
                    <span className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-wide">Elbil</span>
                  </div>
                  <p className="text-[16px] font-black text-slate-900 leading-tight">{car.make} {car.model}</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">Räckvidd {car.range}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[14px] font-bold text-slate-800">{car.price}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0e6efe] transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => onNavigateElCars?.()}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#0e6efe] hover:text-blue-700 transition-colors"
            >
              Se alla elbilar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── TRADE-IN HIGHLIGHT ─────────────────────────────────────────── */}
      <section className="bg-white py-20 px-4 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-[11px] font-bold tracking-[0.18em] uppercase text-[#0e6efe] mb-4">Inbyte</span>
              <h2 className="text-[28px] sm:text-[36px] font-black text-slate-900 leading-tight mb-5">
                Har du en bil att byta in?
              </h2>
              <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
                Vi värderar din befintliga bil och hanterar hela försäljningen åt dig. Du slipper lägga ut annonser, träffa
                privatköpare eller förhandla på egen hand.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Kostnadsfri värdering av din bil',
                  'Vi säljer din bil till certifierade handlare',
                  'Du får marknadspris – inte ett lågt inbytesbud',
                  'Inbytet klart före leverans av ny bil',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
                    </div>
                    <span className="text-[14px] text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onNavigateConsultation?.()}
                className="group inline-flex items-center gap-2.5 h-12 px-7 bg-[#0e6efe] text-white text-[14px] font-bold rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-600 active:scale-[0.98] transition-all"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Boka inbytesrådgivning
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl shadow-slate-200">
                <img
                  src="/BSM_car_sale_key_woman_handover_101122.jpg"
                  alt="Inbyte av bil"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-[340px] object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl border border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-emerald-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Genomsnittlig besparing</p>
                    <p className="text-[18px] font-black text-slate-900">8 400 kr</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LADDBOX ───────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-gradient-to-br from-[#0e6efe] to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
              <Plug className="w-12 h-12 text-yellow-300 mb-5" strokeWidth={1.8} />
              <h3 className="text-[24px] font-black leading-tight mb-3">Laddbox installerad<br />innan du kör hem</h3>
              <p className="text-blue-100 text-[14px] leading-relaxed mb-6">
                Vi koordinerar hela processen – val av modell, elektriker och installation. Allt klart när du hämtar din nya elbil.
              </p>
              <div className="space-y-3">
                {[
                  'Rätt laddbox för din garagetyp',
                  'Godkänd elektriker, vi bokar',
                  'Smart laddning med app-styrning',
                  'Möjlighet till solcellsintegration',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-yellow-300 shrink-0" strokeWidth={2.5} />
                    <span className="text-[13px] text-blue-100">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="inline-block text-[11px] font-bold tracking-[0.18em] uppercase text-[#0e6efe] mb-4">Laddbox</span>
              <h2 className="text-[28px] sm:text-[36px] font-black text-slate-900 leading-tight mb-5">
                Vi löser laddningen
              </h2>
              <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
                Rädslan för laddning är det vanligaste skälet till att man skjuter upp elbilsbytet. Vi tar bort det hindret helt
                – du behöver inte kontakta en enda elektriker.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Laddtid hemma', value: '~6–8 h', sub: 'Över natten' },
                  { label: 'Snabbladdning', value: '~30 min', sub: 'Till 80%' },
                  { label: 'Kostnad att ladda', value: '~3 kr/mil', sub: 'Hemma' },
                  { label: 'Räcker för vardagen', value: '98%', sub: 'Av användare' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                    <p className="text-[11px] text-slate-400 font-medium">{stat.label}</p>
                    <p className="text-[20px] font-black text-slate-900 leading-none my-1">{stat.value}</p>
                    <p className="text-[11px] text-slate-400">{stat.sub}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onNavigateConsultation?.()}
                className="group inline-flex items-center gap-2.5 h-12 px-7 bg-[#0e6efe] text-white text-[14px] font-bold rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-600 active:scale-[0.98] transition-all"
              >
                <Plug className="w-4 h-4" />
                Fråga om laddbox
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ───────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-4 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-[11px] font-bold tracking-[0.18em] uppercase text-[#0e6efe] mb-3">Kundberättelser</span>
            <h2 className="text-[28px] sm:text-4xl font-black text-slate-900">
              De bytte – så upplevde de det
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-[#faf8f5] rounded-2xl p-6 border border-slate-100"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-[14px] text-slate-700 leading-relaxed mb-5 italic">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={r.img}
                    alt={r.name}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">{r.name}</p>
                    <p className="text-[11px] text-slate-400">{r.from}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-[11px] font-bold tracking-[0.18em] uppercase text-[#0e6efe] mb-3">Vanliga frågor</span>
            <h2 className="text-[28px] sm:text-4xl font-black text-slate-900">Allt du undrar om elbilsbytet</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <span className="text-[15px] font-semibold text-slate-900">{item.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-90' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-[14px] text-slate-600 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-[#0e6efe] rounded-3xl overflow-hidden px-8 py-14 text-center shadow-2xl shadow-blue-300/20">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-[0.07] pointer-events-none"
              style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />

            <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold px-4 py-2 rounded-xl mb-6 tracking-wide uppercase">
              <Shield className="w-3.5 h-3.5 text-yellow-300" />
              100% gratis och utan bindning
            </div>

            <h2 className="text-[30px] sm:text-[40px] font-black text-white leading-tight mb-4">
              Redo att byta till elbil?
            </h2>
            <p className="text-blue-100 text-[16px] max-w-xl mx-auto leading-relaxed mb-10">
              Boka en gratis konsultation – en expert ringer dig och vi lägger upp en plan som passar just din situation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => onNavigateConsultation?.()}
                className="group w-full sm:w-auto flex items-center justify-center gap-2.5 h-14 px-10 bg-white text-[#0e6efe] text-[16px] font-black rounded-2xl shadow-xl shadow-black/20 hover:bg-blue-50 active:scale-[0.98] transition-all duration-150"
              >
                <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
                Boka gratis rådgivning
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {['Gratis', 'Inga förpliktelser', 'Vi ringer dig'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-[13px] text-blue-100/80">
                  <Check className="w-3.5 h-3.5 text-yellow-300" strokeWidth={2.5} />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
