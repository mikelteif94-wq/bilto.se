import { useEffect, useState } from 'react';
import { Menu, Check, ArrowRight, X } from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta, injectJsonLd } from '../lib/pageMeta';

interface PriserPageProps {
  onBackHome: () => void;
}

const SELL_FEATURES = [
  'Gratis värdering av din bil',
  'Fri upphämtning i hela Sverige',
  'Konkurrerande bud från granskade handlare',
  'Personlig rådgivare hela vägen',
  'Pengar på kontot vid överlämning',
  'Inga dolda avgifter för dig som privatperson',
];

const BUY_FEATURES = [
  'Kostnadsfri bilsökning och matchning',
  'Experter förhandlar priset åt dig',
  'Genomgång av skicket och historiken',
  'Granskning av finansieringsvillkor',
  'Hjälp med kontraktet och signering',
  'Ingen provision för dig – vi ersätts av handlaren',
];

const COMPARISON = [
  { label: 'Pris för säljaren', bilto: 'Gratis', other: '2 000–5 000 kr' },
  { label: 'Antal köpare', bilto: 'Flera granskade handlare', other: '1 okänd köpare' },
  { label: 'Förhandling', bilto: 'Bilto förhandlar åt dig', other: 'På egen hand' },
  { label: 'Upphämtning', bilto: 'Fri i hela Sverige', other: 'Du kör dit själv' },
  { label: 'Trygghet', bilto: 'Kontrollerade handlare', other: 'Okänt' },
  { label: 'Uppskattad prisskillnad', bilto: '+15–25 % vs Blocket', other: 'Marknadspris' },
];

export default function PriserPage({ onBackHome }: PriserPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: MobileMenuItem[] = ['Sälj bil', 'Bilköpshjälpen'];

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Bilköpshjälpen') {
      window.history.pushState({}, '', '/kop-bil');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onBackHome();
  };

  useEffect(() => {
    setPageMeta({
      title: 'Priser & avgifter | Bilto',
      description: 'Bilto är helt gratis för privatpersoner. Inga listningsavgifter, inga dolda kostnader – vi finansieras av handlarna när affären är klar.',
      canonical: 'https://bilto.se/priser',
    });
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Bilto – Bilförsäljning och bilköpshjälp',
      provider: { '@type': 'Organization', name: 'Bilto', url: 'https://bilto.se' },
      description: 'Gratis för privatpersoner – sälja och köpa bil via Bilto är kostnadsfritt. Vi finansieras av ett arvode från handlaren.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'SEK', description: 'Gratis för privatpersoner' },
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onSelect={handleMenuSelect} />

      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-4 sm:px-5 lg:px-8">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)} className="lg:hidden -ml-1 w-11 h-11 flex items-center justify-center text-white">
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map(item => (
              <button key={item} type="button" onClick={() => handleMenuSelect(item)} className="text-[15px] text-white/90 hover:text-white transition">
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
        {/* Hero */}
        <section className="pt-28 sm:pt-36 pb-14 sm:pb-20 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 text-center">
            <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-4">Transparenta avgifter</span>
            <h1 className="text-[34px] sm:text-[52px] lg:text-[64px] font-bold leading-[1.05] tracking-tight text-slate-900 max-w-3xl mx-auto">
              Helt gratis för dig
            </h1>
            <p className="mt-5 text-[16px] sm:text-[19px] leading-[1.65] text-slate-500 max-w-2xl mx-auto">
              Bilto tar aldrig betalt av privatpersoner. Inga listningsavgifter, inga dolda kostnader, inga provisioner. Vi finansieras av handlarna – bara när affären är klar.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 bg-[#0e6efe]/8 text-[#0e6efe] font-bold text-[22px] sm:text-[28px] px-8 py-4 rounded-2xl">
              <span>0 kr</span>
              <span className="text-[14px] font-medium text-[#0e6efe]/70">för dig som privatperson</span>
            </div>
          </div>
        </section>

        {/* Two cards */}
        <section className="py-14 sm:py-20 bg-[#faf8f5]">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {/* Sell card */}
              <div className="bg-white rounded-2xl p-7 sm:p-9 border border-slate-100 shadow-sm">
                <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.2em] mb-3">Sälja bil</span>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[42px] font-bold text-slate-900">0 kr</span>
                </div>
                <p className="text-[14px] text-slate-500 mb-6 leading-relaxed">
                  Allt ingår. Gratis värdering, fri upphämtning och handlare som tävlar om din bil.
                </p>
                <ul className="space-y-3 mb-8">
                  {SELL_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-[#0e6efe] mt-0.5 shrink-0" strokeWidth={2.5} />
                      <span className="text-[14px] text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={onBackHome}
                  className="w-full py-3.5 rounded-xl bg-[#0e6efe] text-white font-bold text-[15px] hover:bg-[#0047B3] transition flex items-center justify-center gap-2 group"
                >
                  Värdera min bil
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </button>
              </div>

              {/* Buy card */}
              <div className="bg-white rounded-2xl p-7 sm:p-9 border border-slate-100 shadow-sm">
                <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.2em] mb-3">Köpa bil</span>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[42px] font-bold text-slate-900">0 kr</span>
                </div>
                <p className="text-[14px] text-slate-500 mb-6 leading-relaxed">
                  Experthjälp med att hitta, granska och förhandla din nästa bil. Ingenting kostar dig.
                </p>
                <ul className="space-y-3 mb-8">
                  {BUY_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-[#0e6efe] mt-0.5 shrink-0" strokeWidth={2.5} />
                      <span className="text-[14px] text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => { window.history.pushState({}, '', '/kop-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                  className="w-full py-3.5 rounded-xl bg-[#0e6efe] text-white font-bold text-[15px] hover:bg-[#0047B3] transition flex items-center justify-center gap-2 group"
                >
                  Utforska bilköpshjälp
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-[26px] sm:text-[36px] font-bold text-slate-900 text-center mb-10 tracking-tight">
                Bilto vs. att sälja på Blocket
              </h2>
              <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                <div className="grid grid-cols-[1fr_auto_auto] bg-slate-50 text-[12px] font-bold text-slate-400 uppercase tracking-[0.15em] px-5 py-3">
                  <span></span>
                  <span className="text-center px-4 text-[#0e6efe]">Bilto</span>
                  <span className="text-center px-4">Blocket/privat</span>
                </div>
                {COMPARISON.map((row, i) => (
                  <div key={row.label} className={`grid grid-cols-[1fr_auto_auto] items-center px-5 py-4 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <span className="text-[14px] text-slate-700 font-medium">{row.label}</span>
                    <span className="text-center px-4 text-[13px] font-semibold text-[#0e6efe] flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />{row.bilto}
                    </span>
                    <span className="text-center px-4 text-[13px] text-slate-400 flex items-center justify-center gap-1.5">
                      <X className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />{row.other}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How dealer fee works */}
        <section className="py-14 sm:py-20 bg-[#faf8f5]">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-[26px] sm:text-[36px] font-bold text-slate-900 mb-5 tracking-tight">
                Hur tjänar Bilto pengar?
              </h2>
              <p className="text-[15px] sm:text-[17px] text-slate-500 leading-[1.75]">
                Bilto tar ett arvode från handlaren när en bil byter ägare via plattformen. Arvodet ingår i handlarens pris och påverkar inte det du som säljare eller köpare betalar. Det är ett rakt incitament: vi tjänar bara pengar när du gör en lyckad affär.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
