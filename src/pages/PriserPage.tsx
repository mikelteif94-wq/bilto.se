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
  { label: 'Värdering',                      free: true,  expert: true  },
  { label: 'Konsultation',                   free: true,  expert: true  },
  { label: 'Bud från handlare',              free: true,  expert: true  },
  { label: 'Personlig expert',               free: false, expert: true  },
  { label: 'Förhandling',                    free: false, expert: true  },
  { label: 'Granskning av bil',              free: false, expert: true  },
  { label: 'Avtalsgranskning',               free: false, expert: true  },
  { label: 'Skyddade kontaktuppgifter',      free: false, expert: true  },
  { label: 'Leveranskoordinering',           free: false, expert: true  },
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
    a: 'Ja, samma fasta avgift på 1 995 kr gäller oavsett om du köper eller säljer via Bilto Expert.',
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

export default function PriserPage({ onBackHome }: PriserPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: MobileMenuItem[] = ['Sälj bil', 'Bilköpshjälpen', 'Guider', 'Priser', 'Vanliga frågor', 'Bilspara'];

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Bilköpshjälpen': '/kop-bil',
      'Guider': '/guider',
      'Priser': '/priser',
      'Vanliga frågor': '/vanliga-fragor',
      'Bilspara': '/bilspara',
    };
    const route = routes[item];
    if (route) {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onBackHome();
  };

  useEffect(() => {
    setPageMeta({
      title: 'Priser – fast avgift 1 995 kr, betala bara vid affär | Bilto',
      description: 'Bilto Expert kostar 1 995 kr – en fast engångsavgift som bara betalas om affären genomförs. Värdering, konsultation och bilmatch ingår alltid gratis.',
      canonical: 'https://bilto.se/priser',
    });
    injectJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Service',
          name: 'Bilto Expert – bilköpshjälp och bilförsäljning',
          provider: { '@type': 'Organization', name: 'Bilto', url: 'https://bilto.se' },
          description: 'Fast avgift 1 995 kr per affär, betalas bara om affären genomförs. Förhandling, granskning och avtalsgranskning ingår.',
          offers: {
            '@type': 'Offer',
            price: '1995',
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

      {/* ── Navigation ── */}
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)} className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white">
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map(item => (
              <button key={item} type="button" onClick={() => handleMenuSelect(item)} className="text-[15px] text-white/80 hover:text-white transition font-medium">
                {item}
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
        {/* ── Hero ── */}
        <section className="relative min-h-[100svh] flex flex-col overflow-hidden">
          <img
            src="/BSM_car_sale_key_woman_handover_101122.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-[50%_40%]"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/10 pointer-events-none" />

          <div className="relative flex-1 flex flex-col items-center justify-center pt-28 sm:pt-32 pb-16 px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-block text-[11px] font-bold text-white/60 uppercase tracking-[0.25em] mb-5">
                Transparenta avgifter
              </span>
              <h1 className="text-white text-[clamp(28px,6vw,58px)] font-bold leading-[1.07] tracking-tight drop-shadow-lg mb-5">
                Ett fast pris.<br />Inga provisioner.<br />Inga dolda avgifter.
              </h1>
              <p className="text-white/80 text-[16px] sm:text-[19px] leading-[1.6] drop-shadow mb-8 max-w-lg mx-auto">
                Du betalar bara om affären blir av – och du godkänner varje steg.
              </p>
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-7 py-4">
                <span className="text-white text-[28px] sm:text-[36px] font-bold">1&nbsp;995 kr</span>
                <span className="text-white/60 text-[13px] leading-snug text-left">
                  Engångsavgift<br />per affär
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Price cards ── */}
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-[26px] sm:text-[38px] font-bold tracking-tight text-slate-900">Välj vad som passar dig</h2>
              <p className="mt-3 text-[15px] sm:text-[17px] text-slate-500 max-w-xl mx-auto leading-relaxed">
                Kom igång kostnadsfritt. Uppgradera till Expert när du vill ha en dedikerad rådgivare som sköter hela affären.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">

              {/* Card A – Free */}
              <div className="bg-[#faf8f5] rounded-2xl p-7 sm:p-9 border border-slate-200 flex flex-col">
                <div className="mb-5">
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Kostnadsfritt</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[42px] font-bold text-slate-900">0 kr</span>
                  </div>
                  <p className="text-[13px] text-slate-400 mt-1">Alltid kostnadsfritt – ingen tidsgräns</p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {FREE_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                      <span className="text-[14px] text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={onBackHome}
                  className="w-full py-3.5 rounded-xl border-2 border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold text-[15px] transition flex items-center justify-center gap-2 group"
                >
                  Värdera bilen
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </button>
              </div>

              {/* Card B – Expert */}
              <div className="relative bg-[#0e6efe] rounded-2xl p-7 sm:p-9 flex flex-col shadow-xl shadow-[#0e6efe]/20">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center px-4 py-1 rounded-full bg-white text-[#0e6efe] text-[11px] font-bold uppercase tracking-[0.18em] shadow-md">
                  Populärast
                </span>

                <div className="mb-5">
                  <p className="text-[12px] font-bold text-white/60 uppercase tracking-[0.2em] mb-2">Bilto Expert</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[42px] font-bold text-white">1&nbsp;995 kr</span>
                  </div>
                  <p className="text-[13px] text-white/60 mt-1">Engångsavgift per affär. Betalas endast om affären genomförs.</p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  <li className="text-[12px] font-semibold text-white/50 uppercase tracking-[0.15em] pb-1">
                    Allt i Gratis, plus:
                  </li>
                  {EXPERT_EXTRAS.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-white mt-0.5 shrink-0" strokeWidth={2.5} />
                      <span className="text-[14px] text-white/90">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => { window.history.pushState({}, '', '/kop-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                  className="w-full py-3.5 rounded-xl bg-white text-[#0e6efe] hover:bg-slate-50 font-bold text-[15px] transition flex items-center justify-center gap-2 group shadow-sm"
                >
                  Få prishjälp
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparison table ── */}
        <section className="py-14 sm:py-20 bg-[#faf8f5]">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-[22px] sm:text-[30px] font-bold text-slate-900 text-center mb-8 tracking-tight">
                Vad ingår var?
              </h2>

              <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
                {/* Header row */}
                <div className="grid grid-cols-[1fr_88px_88px] sm:grid-cols-[1fr_110px_110px] bg-slate-50 border-b border-slate-100">
                  <div className="px-5 py-3" />
                  <div className="px-3 py-3 text-center">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Gratis</p>
                    <p className="text-[13px] font-bold text-slate-700">0 kr</p>
                  </div>
                  <div className="px-3 py-3 text-center bg-[#0e6efe]/5">
                    <p className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.15em]">Expert</p>
                    <p className="text-[13px] font-bold text-[#0e6efe]">1&nbsp;995 kr</p>
                  </div>
                </div>

                {TABLE_ROWS.map((row, i) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-[1fr_88px_88px] sm:grid-cols-[1fr_110px_110px] items-center border-b border-slate-50 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
                  >
                    <div className="px-5 py-3.5">
                      <span className="text-[14px] text-slate-700 font-medium">{row.label}</span>
                    </div>
                    <div className="px-3 py-3.5 flex items-center justify-center">
                      {row.free
                        ? <Check className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
                        : <X className="w-4 h-4 text-slate-300" strokeWidth={2} />
                      }
                    </div>
                    <div className="px-3 py-3.5 flex items-center justify-center bg-[#0e6efe]/[0.03]">
                      {row.expert
                        ? <Check className="w-5 h-5 text-[#0e6efe]" strokeWidth={2.5} />
                        : <X className="w-4 h-4 text-slate-300" strokeWidth={2} />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Control / reassurance ── */}
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-[22px] sm:text-[30px] font-bold text-slate-900 text-center mb-10 tracking-tight">
                Du har alltid full kontroll
              </h2>
              <div className="grid sm:grid-cols-3 gap-5">
                {CONTROLS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex flex-col items-center text-center gap-4 bg-[#faf8f5] rounded-2xl p-6 border border-slate-100">
                    <span className="w-11 h-11 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={1.8} />
                    </span>
                    <p className="text-[14px] sm:text-[15px] text-slate-700 font-medium leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── "Osäker?" box ── */}
        <section className="py-10 sm:py-14 bg-[#faf8f5]">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sm:p-10 text-center">
              <span className="inline-block text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Osäker?</span>
              <h2 className="text-[22px] sm:text-[28px] font-bold text-slate-900 mb-3 leading-snug tracking-tight">
                Boka ett kostnadsfritt samtal
              </h2>
              <p className="text-[15px] text-slate-500 leading-[1.75] mb-7 max-w-md mx-auto">
                Vi lyssnar och rekommenderar rätt väg – ingen säljpitch. Oavsett om du ska sälja, köpa eller byta bil.
              </p>
              <a
                href="/gratis-konsultation"
                className="inline-flex items-center justify-center gap-2 py-4 px-10 rounded-xl bg-[#0e6efe] text-white hover:bg-[#0047B3] font-bold text-[15px] transition group"
              >
                Kostnadsfri konsultation
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </a>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-[22px] sm:text-[30px] font-bold text-slate-900 mb-8 tracking-tight">
                Vanliga frågor om priset
              </h2>
              <div className="divide-y divide-slate-100">
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
