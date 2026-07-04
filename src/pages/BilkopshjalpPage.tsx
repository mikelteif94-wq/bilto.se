import { useState, useEffect } from 'react';
import {
  ArrowRight, Check, X, ChevronDown, Phone, Menu, User,
  ShieldCheck, Handshake, Search,
  Clock, Users, CheckCircle,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu from '../components/MobileMenu';
import { setPageMeta } from '../lib/pageMeta';
import { PHONE, PHONE_TEL } from '../config/site';

interface BilkopshjalpPageProps {
  onBackHome: () => void;
}

const PRICE_MAKLARE = '1 995';

const PACKAGES = [
  {
    id: 'pris',
    badge: null,
    title: 'Prisförslag',
    price: 'Gratis',
    priceSub: '',
    description: 'Berätta vilken bil du vill ha – vi hämtar in konkreta priser från handlare i vårt nätverk och skickar dig de bästa.',
    features: [
      'Riktiga priser från riktiga handlare',
      'Svar inom 48 timmar',
      'Ingen bindning, inga samtal från handlare',
    ],
    cta: 'Få prisförslag',
    ctaTyp: 'searching' as const,
    highlight: false,
  },
  {
    id: 'maklare',
    badge: 'Populärast',
    title: 'Personlig bilmäklare',
    price: `${PRICE_MAKLARE} kr`,
    priceSub: '– betalas endast om affären går i lås',
    description: 'En dedikerad mäklare driver hela affären åt dig: hittar bilen, förhandlar priset, granskar avtal och villkor, ordnar inbyte och leverans. Du signerar och hämtar nycklarna.',
    features: [
      'Samma kontaktperson från start till nyckel',
      'Vi förhandlar pris, inbyte och villkor åt dig',
      'Granskning av avtal innan du skriver på',
      'Hemleverans eller hämtning – vi samordnar allt',
      'Kostar inget om det inte blir affär',
    ],
    cta: 'Boka gratis rådgivning',
    ctaTyp: 'found' as const,
    highlight: true,
  },
];

const COMPARE_ROWS: { label: string; pris: boolean; maklare: boolean }[] = [
  { label: 'Priser från handlarnätverket', pris: true, maklare: true },
  { label: 'Vi kontaktar handlarna åt dig', pris: true, maklare: true },
  { label: 'Aktiv förhandling av priset', pris: false, maklare: true },
  { label: 'Värdering och förhandling av ditt inbyte', pris: false, maklare: true },
  { label: 'Granskning av avtal och villkor', pris: false, maklare: true },
  { label: 'Samordnad leverans', pris: false, maklare: true },
  { label: 'Dedikerad kontaktperson', pris: false, maklare: true },
];

const STEPS = [
  {
    n: '1',
    title: 'Berätta vad du letar efter',
    desc: 'Bil, budget och eventuellt inbyte – vi tar emot allt.',
  },
  {
    n: '2',
    title: 'Vi hämtar in och förhandlar',
    desc: 'Handlarna konkurrerar. Ditt nummer stannar hos oss.',
  },
  {
    n: '3',
    title: 'Du väljer',
    desc: 'Vi presenterar det bästa erbjudandet. Du bestämmer i lugn och ro.',
  },
  {
    n: '4',
    title: 'Vi ror det i land',
    desc: 'Avtal, inbyte och leverans ordnas – du hämtar nycklarna.',
  },
];

const FAQS = [
  {
    q: 'Vem betalar er – jag eller handlaren?',
    a: 'Handlarna betalar oss provision när affärer blir av. Men vi tjänar bara pengar när DU tackar ja – så vårt jobb är att få fram ett erbjudande du vill säga ja till. Mäklararvodet betalar du endast vid genomförd affär.',
  },
  {
    q: 'Vad händer om jag inte hittar rätt bil?',
    a: 'Då kostar det ingenting. Du betalar bara om affären går i lås.',
  },
  {
    q: 'Får handlarna mitt telefonnummer?',
    a: 'Nej. All kontakt går genom oss tills du själv väljer att gå vidare.',
  },
  {
    q: 'Fungerar det med inbytesbil?',
    a: 'Ja – vi värderar din bil med fotodokumenterat protokoll och förhandlar inbytet som en del av affären.',
  },
  {
    q: 'Hur snabbt går det?',
    a: 'Första priserna brukar komma inom 48 timmar. De flesta affärer är klara inom en vecka.',
  },
];

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function BilkopshjalpPage({ onBackHome }: BilkopshjalpPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Bilköpshjälp – köp bil utan att förhandla själv | Bilto',
      description: 'Vi hämtar priser, förhandlar och granskar åt dig. Betala bara vid affär.',
      canonical: 'https://bilto.se/kop-bil',
    });
  }, []);

  useEffect(() => {
    let cur = window.scrollY > 20;
    setScrolled(cur);
    const onScroll = () => {
      const next = window.scrollY > 20;
      if (next !== cur) { cur = next; setScrolled(next); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goForm = (typ: 'found' | 'searching' | 'trade') => {
    navigate(`/kop-bil/bestall?typ=${typ}`);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Köp bil med hjälp"
        onSelect={() => setMenuOpen(false)}
      />

      {/* NAV */}
      <header className={`fixed top-0 inset-x-0 z-30 h-16 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-10">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)} className={`lg:hidden -ml-2 w-11 h-11 flex items-center justify-center ${scrolled ? 'text-slate-900' : 'text-white'}`}>
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="hidden lg:block h-24 w-auto object-contain"
              style={{ filter: scrolled ? 'none' : 'brightness(0) invert(1)' }}
            />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={() => { navigate('/sa-funkar-det'); }}
              className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}>
              Säljhjälpen
            </button>
            <span className={`text-[15px] font-semibold ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              Bilköpshjälpen
            </span>
            <button type="button" onClick={() => navigate('/om-oss')}
              className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}>
              Om oss
            </button>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a href="/logga-in" className={`hidden lg:inline-flex items-center gap-2 text-[14px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}>
              <User className="w-4 h-4" />
              Logga in
            </a>
            <a href="/gratis-konsultation" className={`inline-flex items-center px-5 py-2.5 rounded-xl text-[12px] lg:text-[13px] font-semibold transition whitespace-nowrap ${scrolled ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-white text-slate-900 hover:bg-white/90'}`}>
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative bg-[#0a0f1a] pt-32 pb-24 px-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e6efe]/20 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-[11px] font-bold uppercase tracking-[0.18em] px-4 py-1.5 rounded-full mb-6">
            Bilköpshjälpen
          </div>
          <h1 className="text-white text-[clamp(28px,5vw,56px)] font-bold leading-[1.08] tracking-tight mb-5">
            Köp bil utan att förhandla själv
          </h1>
          <p className="text-white/75 text-[17px] sm:text-[19px] leading-relaxed max-w-xl mx-auto mb-10">
            Vi hämtar in priser från handlarna, förhandlar åt dig och presenterar bara det bästa erbjudandet. Du bestämmer – vi gör jobbet.
          </p>
          <button
            type="button"
            onClick={() => goForm('searching')}
            className="inline-flex items-center gap-2 h-13 px-8 rounded-xl bg-white text-slate-900 font-bold text-[16px] hover:bg-slate-100 active:scale-[0.98] transition shadow-xl"
          >
            Kom igång gratis
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate('/bilar')}
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-[14px] transition"
            >
              <Search className="w-3.5 h-3.5" />
              Utforska och jämför bilar
            </button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {['Kostnadsfritt', 'Inga bindningar', 'Svar inom 48h'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-white/60 text-[13px]">
                <Check className="w-3.5 h-3.5 text-white/50" strokeWidth={2.5} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAKET ── */}
      <section className="bg-slate-50 px-5 py-20 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-5">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-2xl border p-7 flex flex-col ${
                  pkg.highlight
                    ? 'bg-white border-[#0e6efe]/30 shadow-[0_8px_40px_-12px_rgba(14,110,254,0.25)]'
                    : 'bg-white border-slate-200'
                }`}
              >
                {pkg.badge && (
                  <span className="absolute -top-3 left-6 bg-[#0e6efe] text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {pkg.badge}
                  </span>
                )}
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2">{pkg.title}</p>
                <div className="mb-1">
                  <span className="text-[32px] font-black text-slate-900 leading-none">{pkg.price}</span>
                </div>
                {pkg.priceSub && (
                  <p className="text-[12px] text-slate-500 mb-4 leading-snug">{pkg.priceSub}</p>
                )}
                <p className="text-[14px] text-slate-600 leading-relaxed mb-5">{pkg.description}</p>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${pkg.highlight ? 'text-[#0e6efe]' : 'text-emerald-500'}`} strokeWidth={2} />
                      <span className="text-[13.5px] text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    if (pkg.id === 'maklare') {
                      navigate('/gratis-konsultation');
                    } else {
                      goForm(pkg.ctaTyp);
                    }
                  }}
                  className={`h-11 rounded-xl font-semibold text-[14px] transition active:scale-[0.98] ${
                    pkg.highlight
                      ? 'bg-[#0e6efe] hover:bg-[#0a57cc] text-white shadow-[0_4px_16px_-4px_rgba(14,110,254,0.5)]'
                      : 'bg-slate-900 hover:bg-slate-700 text-white'
                  }`}
                >
                  {pkg.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JÄMFÖRELSETABELL ── */}
      <section className="bg-white px-5 py-20 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[24px] sm:text-[32px] font-bold text-slate-900 text-center mb-3 tracking-tight">
            Vad ingår?
          </h2>
          <p className="text-slate-500 text-center text-[15px] mb-10">Jämför paketen sida vid sida.</p>
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_100px_130px] bg-slate-50 border-b border-slate-200">
              <div className="px-5 py-3.5 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Funktion</div>
              <div className="px-3 py-3.5 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-center">Prisförslag</div>
              <div className="px-3 py-3.5 text-[12px] font-bold text-[#0e6efe] uppercase tracking-wider text-center">Pers. mäklare</div>
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1fr_100px_130px] border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
              >
                <div className="px-5 py-3.5 text-[14px] text-slate-700">{row.label}</div>
                <div className="px-3 py-3.5 flex items-center justify-center">
                  {row.pris
                    ? <Check className="w-4.5 h-4.5 text-emerald-500" strokeWidth={2.5} />
                    : <X className="w-4 h-4 text-slate-300" strokeWidth={2} />}
                </div>
                <div className="px-3 py-3.5 flex items-center justify-center">
                  {row.maklare
                    ? <Check className="w-4.5 h-4.5 text-[#0e6efe]" strokeWidth={2.5} />
                    : <X className="w-4 h-4 text-slate-300" strokeWidth={2} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MELLANSEKTION ── */}
      <section className="bg-[#0e6efe] px-5 py-16 sm:py-20">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-white text-[22px] sm:text-[28px] font-bold mb-3 tracking-tight">
            Osäker på vad du behöver?
          </h2>
          <p className="text-white/80 text-[16px] leading-relaxed mb-8">
            Boka ett kostnadsfritt samtal på 15 minuter så lyssnar vi och rekommenderar rätt väg – ingen säljpitch.
          </p>
          <a
            href="/gratis-konsultation"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-[#0e6efe] font-bold text-[15px] hover:bg-slate-100 active:scale-[0.98] transition shadow-lg"
          >
            Boka samtal
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── SÅ FUNKAR DET ── */}
      <section className="bg-white px-5 py-20 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[24px] sm:text-[32px] font-bold text-slate-900 text-center mb-3 tracking-tight">
            Så funkar det
          </h2>
          <p className="text-slate-500 text-center text-[15px] mb-12">Fyra steg från intresse till nyckel i hand.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {STEPS.map((step) => (
              <div key={step.n} className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-[#0e6efe] text-white flex items-center justify-center shrink-0 font-black text-[15px]">
                  {step.n}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-[15px] leading-snug">{step.title}</p>
                  <p className="text-slate-500 text-[13.5px] mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-slate-50 px-5 py-20 sm:py-24">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[24px] sm:text-[32px] font-bold text-slate-900 text-center mb-10 tracking-tight">
            Vanliga frågor
          </h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-semibold text-slate-900 text-[14.5px] leading-snug pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-[14px] text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FÖRTROENDE ── */}
      <section className="bg-white px-5 py-20 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0e6efe]/10 flex items-center justify-center mx-auto mb-6">
            <Handshake className="w-7 h-7 text-[#0e6efe]" strokeWidth={1.8} />
          </div>
          <h2 className="text-[22px] sm:text-[28px] font-bold text-slate-900 mb-4 tracking-tight">
            Från branschens insida – nu på din sida
          </h2>
          <p className="text-slate-600 text-[16px] leading-relaxed max-w-lg mx-auto">
            Vi har suttit på andra sidan bordet, på en av Sveriges största bilhandlares bytesavdelning, och vet exakt hur affärerna görs. Nu använder vi den kunskapen åt dig.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-8">
            {[
              { icon: Users, label: '500+ nöjda kunder' },
              { icon: Clock, label: 'Svar inom 48h' },
              { icon: ShieldCheck, label: 'Betala bara vid affär' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-slate-600 text-[14px]">
                <Icon className="w-4 h-4 text-[#0e6efe]" strokeWidth={2} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVSLUTANDE CTA ── */}
      <section className="bg-[#0a0f1a] px-5 py-20 sm:py-24">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-white text-[24px] sm:text-[32px] font-bold mb-4 tracking-tight">
            Redo att slippa förhandla?
          </h2>
          <p className="text-white/70 text-[16px] leading-relaxed mb-8">
            Det kostar ingenting att komma igång. Vi hör av oss inom en arbetsdag.
          </p>
          <button
            type="button"
            onClick={() => goForm('searching')}
            className="inline-flex items-center gap-2 h-13 px-8 rounded-xl bg-white text-slate-900 font-bold text-[16px] hover:bg-slate-100 active:scale-[0.98] transition shadow-xl"
          >
            Kom igång gratis
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="mt-6">
            <a href={PHONE_TEL} className="inline-flex items-center gap-2 text-white/60 hover:text-white text-[14px] transition">
              <Phone className="w-4 h-4" />
              Föredrar du att ringa? {PHONE}
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
