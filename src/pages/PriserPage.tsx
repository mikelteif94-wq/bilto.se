import { useEffect, useState } from 'react';
import { Menu, Check, X, ArrowRight, Shield, ShieldCheck } from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta, injectJsonLd } from '../lib/pageMeta';

interface PriserPageProps {
  onBackHome: () => void;
}

const FREE_FEATURES = [
  'Gratis värdering av din bil',
  'Kostnadsfri konsultation med bilexpert',
  'Bilmatch – hitta rätt modell',
  'Ta emot bud från granskade handlare',
];

const EXPERT_EXTRAS = [
  'En dedikerad expert sköter hela förhandlingen',
  'Vi granskar bilen: historik, skick, pris mot marknaden',
  'Vi granskar avtal och villkor innan du skriver på',
  'Vi sköter all kontakt – handlare ser aldrig ditt nummer',
  'Upphämtning eller leverans koordineras åt dig',
];

const TABLE_ROWS: { label: string; free: boolean; expert: boolean }[] = [
  { label: 'Värdering',                 free: true,  expert: true  },
  { label: 'Konsultation',              free: true,  expert: true  },
  { label: 'Bud från handlare',         free: true,  expert: true  },
  { label: 'Personlig expert',          free: false, expert: true  },
  { label: 'Förhandling',               free: false, expert: true  },
  { label: 'Granskning av bil',         free: false, expert: true  },
  { label: 'Avtalsgranskning',          free: false, expert: true  },
  { label: 'Skyddade kontaktuppgifter', free: false, expert: true  },
  { label: 'Leveranskoordinering',      free: false, expert: true  },
];

const CONTROLS = [
  { icon: ShieldCheck, text: 'Du godkänner varje bud – vi gör aldrig affär utan ditt ja' },
  { icon: Shield,      text: 'Handlare ser aldrig dina kontaktuppgifter – vi tar samtalen' },
  { icon: Check,       text: 'Ångra dig när som helst innan affär – då kostar det ingenting' },
];

const FAQ_ITEMS = [
  {
    q: 'Vad räknas som en affär?',
    a: 'En bil du köper eller säljer via Bilto. Du kan jämföra hur många alternativ du vill – avgiften gäller först när en affär genomförs.',
  },
  {
    q: 'När betalar jag?',
    a: 'Först när affären är genomförd. Inte innan, inte under – bara när du och motparten är överens och affären stängs.',
  },
  {
    q: 'Vad händer om jag tackar nej till alla bud?',
    a: 'Då kostar det ingenting. Ingen bindning, inga avgifter, inget förbehåll. Du bestämmer.',
  },
  {
    q: 'Tar ni provision från handlare?',
    a: 'Nej. Vi arbetar för dig, aldrig för handlaren. Vår intäkt är den fasta avgiften från dig – det skapar ett rent incitament att hitta det bästa möjliga för din räkning.',
  },
  {
    q: 'Gäller priset både köp och sälj?',
    a: 'Ja, samma fasta avgift på 4 995 kr gäller oavsett om du köper eller säljer via Bilto Expert.',
  },
];

function FaqRow({ item }: { item: typeof FAQ_ITEMS[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span className="text-[15px] sm:text-[16px] font-semibold text-slate-900 group-hover:text-[#0e6efe] transition-colors leading-snug">
          {item.q}
        </span>
        <span className={`shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-[#0e6efe] text-white' : 'bg-slate-100 group-hover:bg-[#0e6efe]/10'}`}>
          <span className="text-[16px] font-light leading-none">{open ? '−' : '+'}</span>
        </span>
      </button>
      {open && (
        <p className="pb-5 text-[14px] sm:text-[15px] text-slate-500 leading-[1.8] pr-10">
          {item.a}
        </p>
      )}
    </div>
  );
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function PriserPage({ onBackHome }: PriserPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: { id: MobileMenuItem; label: string }[] = [
    { id: 'Sälj bil', label: 'Säljhjälpen' },
    { id: 'Köp bil', label: 'Bilköpshjälpen' },
    { id: 'Om oss', label: 'Om oss' },
  ];

  const handleMenuSelect = (id: MobileMenuItem) => {
    setMenuOpen(false);
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Köp bil': '/kop-bil',
      'Om oss': '/om-oss',
    };
    const route = routes[id];
    if (route) { navigate(route); return; }
    onBackHome();
  };

  useEffect(() => {
    setPageMeta({
      title: 'Priser – fast avgift 4 995 kr, betala bara vid affär | Bilto',
      description: 'Bilto Expert kostar 4 995 kr – en fast engångsavgift som bara betalas om affären genomförs. Värdering, konsultation och bilmatch ingår alltid gratis.',
      canonical: 'https://bilto.se/priser',
    });
    injectJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Service',
          name: 'Bilto Expert – bilköpshjälp och bilförsäljning',
          provider: { '@type': 'Organization', name: 'Bilto', url: 'https://bilto.se' },
          description: 'Fast avgift 4 995 kr per affär, betalas bara om affären genomförs.',
          offers: {
            '@type': 'Offer',
            price: '4995',
            priceCurrency: 'SEK',
            description: 'Engångsavgift per affär – betalas bara när affären genomförs.',
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: FAQ_ITEMS.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onSelect={handleMenuSelect} />

      {/* ── Nav – identical to HowItWorks ── */}
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)} className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white">
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img src="/a_clean_graphic_logo_on_a_transparent_background.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map(({ id, label }) => (
              <button key={id} type="button" onClick={() => handleMenuSelect(id)} className="text-[15px] text-white/90 font-medium transition hover:text-white">
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center ml-auto">
            <a href="/gratis-konsultation" className="inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero – same image + gradient as HowItWorks ── */}
        <section className="relative min-h-[100svh] flex flex-col overflow-hidden">
          <img
            src="/files_2615643-2026-06-21T06-29-18-662Z-b858d9c8-9893-488f-8103-98fee9292c16 copy.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-[50%_65%]"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-transparent pointer-events-none" />

          <div className="relative flex-1 flex flex-col items-center justify-center pt-24 sm:pt-36 pb-16 px-4 sm:px-8">
            <div className="text-center w-full max-w-xl mx-auto">
              <span className="inline-block text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-[0.22em] mb-4">
                Transparenta avgifter
              </span>
              <h1 className="text-white text-[clamp(22px,5.5vw,50px)] font-bold leading-[1.08] tracking-tight drop-shadow-lg mb-4 sm:mb-5">
                Ett fast pris.<br />Inga provisioner.<br />Inga dolda avgifter.
              </h1>
              <p className="text-white/80 text-[15px] sm:text-[18px] leading-[1.65] drop-shadow mb-8 sm:mb-10 max-w-sm sm:max-w-lg mx-auto px-2">
                Du betalar bara om affären blir av – och du godkänner varje steg.
              </p>

              {/* Price pill */}
              <div className="inline-flex items-center gap-3 sm:gap-4 bg-black/30 backdrop-blur-md border border-white/15 rounded-2xl px-5 sm:px-8 py-4 sm:py-5 mb-8 sm:mb-10">
                <div className="text-left">
                  <p className="text-white/50 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] mb-0.5">Bilto Expert</p>
                  <p className="text-white text-[30px] sm:text-[42px] font-bold leading-none whitespace-nowrap">4 995 kr</p>
                </div>
                <div className="w-px h-10 sm:h-12 bg-white/15" />
                <p className="text-white/60 text-[12px] sm:text-[13px] leading-snug text-left max-w-[100px] sm:max-w-[120px]">
                  Engångsavgift<br />per affär
                </p>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 px-2">
                <button
                  type="button"
                  onClick={() => navigate('/kop-bil')}
                  className="flex items-center justify-center gap-2 h-12 sm:h-[52px] px-7 sm:px-8 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-bold text-[15px] transition-all shadow-[0_4px_20px_-4px_rgba(14,110,254,0.55)] group"
                >
                  Kom igång gratis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={onBackHome}
                  className="flex items-center justify-center gap-2 h-12 sm:h-[52px] px-7 sm:px-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[15px] transition-all backdrop-blur-sm"
                >
                  Värdera bilen
                </button>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="relative flex justify-center pb-8 pointer-events-none">
            <div className="flex flex-col items-center gap-1 opacity-40">
              <span className="text-white text-[11px] tracking-widest uppercase font-medium">Läs mer</span>
              <svg className="w-4 h-4 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </section>

        {/* ── Price cards ── */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.25em] mb-4">Välj nivå</span>
              <h2 className="text-[28px] sm:text-[42px] font-bold tracking-tight text-slate-900 leading-tight">Välj vad som passar dig</h2>
              <p className="mt-4 text-[15px] sm:text-[17px] text-slate-500 max-w-xl mx-auto leading-relaxed">
                Kom igång kostnadsfritt. Uppgradera när du vill ha en dedikerad rådgivare.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">

              {/* Free */}
              <div className="bg-[#faf8f5] rounded-2xl p-7 sm:p-9 border border-slate-200 flex flex-col">
                <div className="mb-6">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.22em] mb-3">Kostnadsfritt</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-[46px] font-bold text-slate-900 leading-none">0 kr</span>
                  </div>
                  <p className="text-[13px] text-slate-400">Alltid kostnadsfritt – ingen tidsgräns</p>
                </div>

                <ul className="space-y-3.5 flex-1 mb-8">
                  {FREE_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                      </span>
                      <span className="text-[14px] text-slate-700 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={onBackHome}
                  className="w-full py-4 rounded-xl border-2 border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold text-[15px] transition-all flex items-center justify-center gap-2 group"
                >
                  Värdera bilen
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Expert */}
              <div className="relative bg-[#0e6efe] rounded-2xl p-7 sm:p-9 flex flex-col shadow-2xl shadow-[#0e6efe]/25">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center px-5 py-1.5 rounded-full bg-white text-[#0e6efe] text-[11px] font-bold uppercase tracking-[0.18em] shadow-lg">
                  Populärast
                </span>

                <div className="mb-6">
                  <p className="text-[11px] font-bold text-white/50 uppercase tracking-[0.22em] mb-3">Bilto Expert</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-[46px] font-bold text-white leading-none">4 995 kr</span>
                  </div>
                  <p className="text-[13px] text-white/55">Engångsavgift per affär. Betalas bara om affären genomförs.</p>
                </div>

                <ul className="space-y-3.5 flex-1 mb-8">
                  <li className="text-[11px] font-bold text-white/40 uppercase tracking-[0.18em] pb-1">Allt i Gratis, plus:</li>
                  {EXPERT_EXTRAS.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                      <span className="text-[14px] text-white/90 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => navigate('/kop-bil')}
                  className="w-full py-4 rounded-xl bg-white text-[#0e6efe] hover:bg-slate-50 font-bold text-[15px] transition-all flex items-center justify-center gap-2 group shadow-lg"
                >
                  Få prishjälp
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparison table ── */}
        <section className="py-16 sm:py-24 bg-[#faf8f5]">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.25em] mb-4">Jämförelse</span>
                <h2 className="text-[26px] sm:text-[36px] font-bold text-slate-900 tracking-tight">Vad ingår var?</h2>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
                <div className="grid grid-cols-[1fr_72px_72px] sm:grid-cols-[1fr_120px_120px] bg-slate-50 border-b border-slate-100">
                  <div className="px-4 sm:px-5 py-4" />
                  <div className="px-2 sm:px-3 py-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Gratis</p>
                    <p className="text-[13px] font-bold text-slate-700">0 kr</p>
                  </div>
                  <div className="px-2 sm:px-3 py-4 text-center bg-[#0e6efe]/5">
                    <p className="text-[10px] font-bold text-[#0e6efe] uppercase tracking-[0.15em] mb-0.5">Expert</p>
                    <p className="text-[13px] font-bold text-[#0e6efe]">4 995 kr</p>
                  </div>
                </div>

                {TABLE_ROWS.map((row, i) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-[1fr_72px_72px] sm:grid-cols-[1fr_120px_120px] items-center border-b border-slate-50 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
                  >
                    <div className="px-4 sm:px-5 py-3.5">
                      <span className="text-[13px] sm:text-[14px] text-slate-700 font-medium">{row.label}</span>
                    </div>
                    <div className="px-2 sm:px-3 py-3.5 flex items-center justify-center">
                      {row.free
                        ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" strokeWidth={2.5} />
                        : <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-200" strokeWidth={2.5} />
                      }
                    </div>
                    <div className="px-2 sm:px-3 py-3.5 flex items-center justify-center bg-[#0e6efe]/[0.03]">
                      {row.expert
                        ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#0e6efe]" strokeWidth={2.5} />
                        : <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-200" strokeWidth={2.5} />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Guarantees ── */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.25em] mb-4">Trygghet</span>
                <h2 className="text-[26px] sm:text-[36px] font-bold text-slate-900 tracking-tight">Du har alltid full kontroll</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {CONTROLS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex sm:flex-col items-start sm:items-center text-left sm:text-center gap-4 bg-[#faf8f5] rounded-2xl p-5 sm:p-7 border border-slate-100 hover:border-[#0e6efe]/20 hover:shadow-md transition-all">
                    <span className="w-11 h-11 rounded-xl bg-[#0e6efe]/8 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={1.8} />
                    </span>
                    <p className="text-[14px] sm:text-[15px] text-slate-700 font-medium leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA box ── */}
        <section className="py-10 sm:py-16 bg-[#faf8f5]">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="relative max-w-2xl mx-auto rounded-3xl overflow-hidden">
              <img
                src="/files_2615643-2026-06-21T06-29-18-662Z-b858d9c8-9893-488f-8103-98fee9292c16 copy.webp"
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover object-[50%_40%]"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/50" />
              <div className="relative px-8 sm:px-12 py-12 sm:py-16 text-center">
                <span className="inline-block text-[11px] font-bold text-white/50 uppercase tracking-[0.25em] mb-4">Osäker?</span>
                <h2 className="text-[24px] sm:text-[32px] font-bold text-white mb-4 leading-snug tracking-tight">
                  Boka ett kostnadsfritt samtal
                </h2>
                <p className="text-[15px] text-white/70 leading-[1.75] mb-8 max-w-sm mx-auto">
                  Vi lyssnar och rekommenderar rätt väg – ingen säljpitch.
                </p>
                <a
                  href="/gratis-konsultation"
                  className="inline-flex items-center justify-center gap-2 py-4 px-10 rounded-xl bg-[#0e6efe] text-white hover:bg-[#0a57cc] font-bold text-[15px] transition-all shadow-[0_4px_20px_-4px_rgba(14,110,254,0.6)] group"
                >
                  Kostnadsfri konsultation
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-10">
                <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.25em] mb-4">FAQ</span>
                <h2 className="text-[26px] sm:text-[36px] font-bold text-slate-900 tracking-tight">
                  Vanliga frågor om priset
                </h2>
              </div>
              <div>
                {FAQ_ITEMS.map(item => (
                  <FaqRow key={item.q} item={item} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
