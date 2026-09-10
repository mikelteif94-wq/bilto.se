import { useState, useEffect, useRef } from 'react';
import {
  Menu, XCircle, Zap, Car, Home, TrendingDown, Shield, Clock,
  CheckCircle, ArrowRight, Leaf, Battery, AlertCircle, Handshake,
} from 'lucide-react';
import MobileMenu from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import PremieKollen from '../components/ev/PremieKollen';
import BilKalkylatorn from '../components/ev/BilKalkylatorn';
import Laddanalysen from '../components/ev/Laddanalysen';
import KonverteringForm from '../components/ev/KonverteringForm';

const HERO_IMAGE = '/d158d2d6-7209-4239-986d-842219ae491d.jpg';

const STATS = [
  { value: '46 800', label: 'Kr i premie' },
  { value: '40 %', label: 'Lägre driftkostnad' },
  { value: '0 kr', label: 'Kostar dig inget' },
  { value: '36 mån', label: 'Ägandekrav' },
];

const REVIEWS = [
  {
    name: 'Maria Hansson',
    role: 'Bytte till elbil från Kiruna',
    text: 'Jag hade ingen aning om att jag kunde få 64 800 kr i premie. De hjälpte mig med allt — värdering, ny bil och laddbox.',
    img: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
    stars: 5,
  },
  {
    name: 'Erik Nilsson',
    role: 'Bytte från diesel till elbil',
    text: 'Jag tvekade länge på laddningen. Deras laddanalys visade att jag kunde ladda hemma för halva priset efter grönt avdrag.',
    img: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
    stars: 5,
  },
  {
    name: 'Lena Persson',
    role: 'Låginkomsthushåll, Dorotea',
    text: 'Jag trodde inte jag hade råd med elbil. De visste precis vilken premie som gällde och fixade hela bytet utan att jag betalade något.',
    img: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200',
    stars: 5,
  },
  {
    name: 'Anders Lindberg',
    role: 'Bytte Volvo V60 till el-SUV',
    text: 'Rådgivningen var nykter och ärlig. De sa rakt ut när något inte lönte sig. Det skapade tillit.',
    img: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=200',
    stars: 5,
  },
];

type ToolStep = 'premie' | 'kalkyl' | 'ladd' | 'konvertering';

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [activeStep, setActiveStep] = useState<ToolStep>('premie');
  const toolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600;
    let current = window.scrollY > threshold;
    setScrolled(current);
    const onScroll = () => {
      const next = window.scrollY > threshold;
      if (next !== current) { current = next; setScrolled(next); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.10 }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToTools = () => {
    toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const isVisible = (id: string) => visibleSections.has(id);

  const steps: { id: ToolStep; label: string; icon: typeof Zap }[] = [
    { id: 'premie', label: 'Premiekollen', icon: Zap },
    { id: 'kalkyl', label: 'Bilkalkylatorn', icon: Car },
    { id: 'ladd', label: 'Laddanalysen', icon: Home },
    { id: 'konvertering', label: 'Få hjälp', icon: Handshake },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white antialiased">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Sälj bil"
        onSelect={() => setMenuOpen(false)}
      />

      {/* NAV */}
      <header
        className={`fixed top-0 inset-x-0 z-30 h-[53px] lg:h-16 transition-all duration-300 ${
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
              className="hidden lg:block h-24 w-auto object-contain"
              style={{ filter: scrolled ? 'none' : 'brightness(0) invert(1)' }}
            />
          </a>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button
              type="button"
              onClick={scrollToTools}
              className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}
            >
              Premiekollen
            </button>
            <button
              type="button"
              onClick={scrollToTools}
              className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}
            >
              Bilkalkylatorn
            </button>
            <button
              type="button"
              onClick={scrollToTools}
              className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}
            >
              Laddanalysen
            </button>
            <a
              href="/sa-funkar-det"
              className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}
            >
              Så funkar det
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="/logga-in"
              className={`hidden lg:inline-flex items-center gap-2 text-[14px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}
            >
              Logga in
            </a>
            <button
              onClick={scrollToTools}
              className={`inline-flex items-center px-5 py-2.5 rounded-xl text-[12px] lg:text-[13px] font-semibold transition whitespace-nowrap ${
                scrolled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-emerald-500 text-white hover:bg-emerald-400'
              }`}
            >
              Kolla min premie
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative bg-[#0a0f1a]" style={{ minHeight: '100svh' }}>
        <img
          src={HERO_IMAGE}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          style={{ objectPosition: 'center 55%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/20 via-transparent to-[#0a0f1a]" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-5 pt-24 pb-0" style={{ minHeight: '100svh' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Zap className="w-4 h-4 text-emerald-400" strokeWidth={2} />
            <span className="text-[13px] font-medium text-emerald-300">Elbilspremie 2026: upp till 64 800 kr</span>
          </div>

          <h1 className="font-black leading-[1.0] tracking-[-0.03em] text-white mb-6 max-w-3xl"
            style={{ fontSize: 'clamp(1.75rem, 5vw, 4.5rem)' }}>
            Vi hjälper dig byta till elbil — utan att du pratar med en bilhandlare.
          </h1>

          <p className="text-white/65 text-[16px] sm:text-[19px] font-normal max-w-lg leading-relaxed mb-10">
            Vi säljer din gamla bil till högsta bud, förhandlar fram den nya, löser laddningen och sätter rätt elavtal. Du bestämmer.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-12">
            <button
              onClick={scrollToTools}
              className="inline-flex items-center gap-2.5 h-13 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] transition group"
            >
              Kolla om du får premien
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
            <a
              href="/sa-funkar-det"
              className="inline-flex items-center gap-2.5 h-13 px-8 rounded-xl border border-white/20 hover:border-white/40 text-white font-semibold text-[15px] transition"
            >
              Så funkar det
            </a>
          </div>

          <div className="w-full flex justify-center pointer-events-none select-none overflow-hidden">
            <img
              src="/hero/files_2615643-2026-06-21T12-42-37-274Z-module-4-img.ce21cba7.svg"
              alt=""
              aria-hidden="true"
              className="w-full max-w-3xl"
              style={{ marginBottom: '-2px' }}
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[#0a0f1a] border-t border-white/8">
        <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center">
              <span className="text-white text-[30px] sm:text-[38px] font-black tracking-tight leading-none tabular-nums">
                {s.value}
              </span>
              <span className="text-white/40 text-[13px] mt-2 font-medium tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TOOLS */}
      <section ref={toolRef} className="bg-white py-24 sm:py-32 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Tre steg</p>
            <h2 className="text-[32px] sm:text-[42px] font-black text-slate-900 tracking-[-0.02em] leading-[1.05] mb-4">
              Börja med premiekollen.
            </h2>
            <p className="text-[17px] text-slate-500 leading-relaxed max-w-md mx-auto">
              Det tar under en minut. Ingen inloggning, ingen kostnad — bara svar.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isDone = steps.findIndex(s => s.id === activeStep) > i;
              return (
                <div key={step.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-medium transition whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : isDone
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-4 h-4" strokeWidth={2} />
                    ) : (
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                    )}
                    {step.label}
                  </button>
                  {i < steps.length - 1 && (
                    <div className={`w-4 sm:w-6 h-px ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Tool content */}
          <div className="transition-all duration-300">
            {activeStep === 'premie' && (
              <PremieKollen onContinue={() => setActiveStep('kalkyl')} />
            )}
            {activeStep === 'kalkyl' && (
              <BilKalkylatorn onContinue={() => setActiveStep('ladd')} />
            )}
            {activeStep === 'ladd' && (
              <Laddanalysen onContinue={() => setActiveStep('konvertering')} />
            )}
            {activeStep === 'konvertering' && (
              <KonverteringForm />
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        data-animate
        className={`bg-[#0a0f1a] py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 will-change-[opacity,transform] ${isVisible('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-[12px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-4">Processen</p>
            <h2 className="text-[36px] sm:text-[48px] font-black text-white tracking-[-0.02em] leading-[1.05] max-w-lg">
              Vi företräder dig genom hela bytet.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Vi säljer din gamla bil',
                text: 'Vi värderar och säljer till högsta bud bland certifierade handlare. Du får det bästa priset — utan att prata med en enda säljare.',
                icon: Car,
              },
              {
                step: '02',
                title: 'Vi förhandlar din nya elbil',
                text: 'Vi hittar rätt elbil för din vardag och förhandlar priset. Du får ett skarpt erbjudande utan säljpress.',
                icon: Handshake,
              },
              {
                step: '03',
                title: 'Vi löser laddning och elavtal',
                text: 'Vi koordinerar laddboxinstallation, grönt avdrag och rätt elavtal. Allt hanteras av oss.',
                icon: Battery,
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.step} className="group bg-white/4 hover:bg-white/8 rounded-xl p-8 transition-all duration-300 cursor-default border border-white/8">
                  <div className="flex items-start justify-between mb-8">
                    <span className="text-[13px] font-bold text-white/30 tabular-nums tracking-wider transition-colors">{c.step}</span>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                  </div>
                  <h3 className="text-[20px] font-bold text-white mb-3">{c.title}</h3>
                  <p className="text-white/45 text-[15px] leading-relaxed">{c.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PREMIE INFO */}
      <section
        id="premie-info"
        data-animate
        className={`bg-white py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 will-change-[opacity,transform] ${isVisible('premie-info') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Elbilspremien 2026</p>
            <h2 className="text-[36px] sm:text-[48px] font-black text-slate-900 tracking-[-0.02em] leading-[1.05]">
              46 800 kr — eller 64 800 kr med starttillägg.
            </h2>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {[
              {
                label: '01',
                title: 'Vem kan få premien?',
                text: 'Privatpersoner bosatta i landsbygdskommuner eller områden med begränsad kollektivtrafik. Hushållets inkomst ska vara under 80 % av medelinkomsten.',
                perks: ['Ca 177 berättigade kommuner', 'Ingen i hushållet ägt elbil senaste 12 mån', 'Ingen statlig inkomstskatt i hushållet'],
              },
              {
                label: '02',
                title: 'Vilka bilar omfattas?',
                text: 'Ren elbil (ej laddhybrid), ny eller begagnad. Pris mellan 64 800 och 450 000 kr. Vid leasing: månadskostnad 1 800–4 600 kr.',
                perks: ['Endast ren elbil', 'Pristak 450 000 kr', 'Leasing: 1 800–4 600 kr/mån'],
              },
              {
                label: '03',
                title: 'Vad krävs för att behålla stödet?',
                text: 'Du måste stå som ägare eller leasetagare i 36 månader. Säljer du bilen inom perioden försvinner stödet. Budgeten är begränsad — ca 115 000 hushåll kan få stödet.',
                perks: ['Ägande i 36 månader', 'Begränsad budget — först till kvarn', 'Ansökan senast 30 juni 2029'],
              },
            ].map((b) => (
              <div key={b.title} className="grid md:grid-cols-[1fr_2fr_1fr] gap-8 py-12 items-start">
                <span className="text-[13px] font-bold text-slate-300 tabular-nums tracking-wider">{b.label}</span>
                <div>
                  <h3 className="text-[22px] sm:text-[26px] font-bold text-slate-900 mb-3 tracking-tight">{b.title}</h3>
                  <p className="text-[16px] text-slate-500 leading-relaxed">{b.text}</p>
                </div>
                <ul className="flex flex-col gap-2">
                  {b.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-[14px] text-slate-600 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-xl bg-amber-50 border border-amber-200 p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
            <div className="text-[14px] text-amber-800 leading-relaxed">
              <p className="font-semibold mb-1">Två viktiga saker att veta:</p>
              <p>Stödet försvinner om du säljer bilen inom 36 månader. Budgeten är begränsad — den som väntar kan bli utan. Vi sakligt informerar om vad som gäller — du drar slutsatsen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE */}
      <section
        id="service-section"
        data-animate
        className={`bg-[#0a0f1a] py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 delay-100 will-change-[opacity,transform] ${isVisible('service-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-[12px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-4">Ditt ombud</p>
            <h2 className="text-[36px] sm:text-[48px] font-black text-white tracking-[-0.02em] leading-[1.05] mb-5">
              Vi jobbar för dig.<br />Inte för handlaren.
            </h2>
            <p className="text-white/45 text-[17px] leading-relaxed">
              Varje beslut i ett bilbyte har idag en motpart som tjänar på svaret. Ingen tar ansvar för helheten. Det gör vi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: TrendingDown,
                title: 'Vi säljer till högsta bud',
                text: 'Vi värderar din bil och skickar den till certifierade handlare. Du får det bästa budet — utan att prata med säljare.',
              },
              {
                icon: Shield,
                title: 'Vi förhandlar rätt pris',
                text: 'Vi förhandlar din nya elbil och ser till att priset är rimligt. Du bestämmer — vi ger dig underlaget.',
              },
              {
                icon: Leaf,
                title: 'Vi löser laddningen',
                text: 'Vi koordinerar laddbox, grönt avdrag och elavtal. Laddfrågan är den vanligaste anledningen till att folk inte byter — vi har svaret.',
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-xl border border-white/8 bg-white/4 p-8 hover:bg-white/8 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[18px] font-bold mb-3 text-white">{c.title}</h3>
                  <p className="text-white/45 text-[15px] leading-relaxed">{c.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <button
              onClick={scrollToTools}
              className="inline-flex items-center gap-2.5 h-12 px-8 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-[15px] transition group"
            >
              Kolla min premie
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
            <p className="text-white/35 text-[14px] flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
              Kostnadsfri rådgivning — du betalar inget
            </p>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section
        id="reviews-section"
        data-animate
        className={`bg-white py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 will-change-[opacity,transform] ${isVisible('reviews-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
            <div>
              <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Kundberättelser</p>
              <h2 className="text-[36px] sm:text-[48px] font-black text-slate-900 tracking-[-0.02em] leading-[1.05]">
                Vad kunderna säger.
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                  <path d="M10 1l2.928 5.934 6.55.95-4.74 4.62 1.12 6.526L10 16.946l-5.858 3.08 1.12-6.526L.522 7.884l6.55-.95z" />
                </svg>
              ))}
              <span className="ml-1 text-[15px] font-bold text-slate-900">4.9</span>
              <span className="text-slate-400 text-[14px]">(2 400+)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REVIEWS.map((r) => (
              <div
                key={r.name}
                className="rounded-xl border border-slate-200 bg-slate-50 p-7 hover:bg-white hover:shadow-md transition-all duration-300"
              >
                <div className="flex gap-0.5 mb-5">
                  {[...Array(r.stars)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                      <path d="M10 1l2.928 5.934 6.55.95-4.74 4.62 1.12 6.526L10 16.946l-5.858 3.08 1.12-6.526L.522 7.884l6.55-.95z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-700 text-[16px] leading-relaxed mb-6">
                  &ldquo;{r.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={r.img}
                    alt={r.name}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900">{r.name}</p>
                    <p className="text-[12px] text-slate-400">{r.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="cta-section"
        data-animate
        className={`bg-[#0a0f1a] py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 will-change-[opacity,transform] ${isVisible('cta-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[12px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-6">Redo att byta?</p>
          <h3 className="text-[32px] sm:text-[48px] font-black text-white tracking-[-0.025em] leading-[1.0] mb-6">
            Kolla om du får 64 800 kr<br />i elbilspremie.
          </h3>
          <p className="text-white/45 text-[17px] leading-relaxed mb-10 max-w-md mx-auto">
            Det tar under en minut. Ingen inloggning, ingen kostnad.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button
              onClick={scrollToTools}
              className="inline-flex items-center gap-2.5 h-13 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[16px] transition group"
            >
              Starta premiekollen
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {[
              { icon: Clock, text: 'Svar på under 1 minut' },
              { icon: Shield, text: 'Kostnadsfri och utan bindning' },
              { icon: Leaf, text: 'Vi företräder dig' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-[14px] text-white/40">
                <Icon className="w-4 h-4" strokeWidth={2} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
