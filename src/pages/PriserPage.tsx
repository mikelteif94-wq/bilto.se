import { useEffect, useState } from 'react';
import { Menu, Check, ArrowRight, Shield } from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta, injectJsonLd } from '../lib/pageMeta';

interface PriserPageProps {
  onBackHome: () => void;
}

const FREE_ITEMS = [
  'Värdering av din bil',
  'Personlig bilrådgivning och konsultation',
  'Bilmatch – vi hittar rätt bil åt dig',
  'Ta emot och jämföra bud från handlare',
  'Hjälp med finansierings­jämförelse',
  'Tillgång till Biltos nätverk av granskade handlare',
];

const FEE_COVERS = [
  { title: 'Förhandling', desc: 'Vi förhandlar pris, villkor och finansiering direkt med handlaren.' },
  { title: 'Granskning', desc: 'Genomgång av bilens historia, skick och avtalsvillkor.' },
  { title: 'Administration', desc: 'Kontraktsgranskning, ägarbytet och all pappershantering.' },
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
      title: 'Priser & avgifter – betala bara vid affär | Bilto',
      description: 'Biltos bilköpshjälp är gratis att prova. Du betalar en fast avgift på 1 995 kr – men bara om affären genomförs. Inga dolda avgifter, ingen provision.',
      canonical: 'https://bilto.se/priser',
    });
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Bilto bilköpshjälp',
      provider: { '@type': 'Organization', name: 'Bilto', url: 'https://bilto.se' },
      description: 'Biltos bilköpshjälp – gratis att prova, fast avgift 1 995 kr som betalas bara om affären genomförs.',
      offers: {
        '@type': 'Offer',
        price: '1995',
        priceCurrency: 'SEK',
        description: 'Fast avgift som betalas bara när affären är klar. Värdering, konsultation och bilmatch ingår alltid gratis.',
      },
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
            <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-4">
              Transparenta avgifter
            </span>
            <h1 className="text-[32px] sm:text-[50px] lg:text-[62px] font-bold leading-[1.05] tracking-tight text-slate-900 max-w-3xl mx-auto">
              Enkel prissättning – betala bara vid affär
            </h1>
            <p className="mt-5 text-[16px] sm:text-[19px] leading-[1.65] text-slate-500 max-w-2xl mx-auto">
              Värdering, konsultation och bilmatch kostar ingenting. Den fasta avgiften på 1&nbsp;995&nbsp;kr betalas bara om du faktiskt genomför en affär via Bilto.
            </p>
          </div>
        </section>

        {/* Two columns: Free + Fixed fee */}
        <section className="py-14 sm:py-20 bg-[#faf8f5]">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-start">

              {/* Free */}
              <div className="bg-white rounded-2xl p-7 sm:p-9 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50">
                    <Check className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Alltid gratis</p>
                    <p className="text-[28px] font-bold text-slate-900 leading-none">0 kr</p>
                  </div>
                </div>
                <p className="text-[14px] text-slate-500 mb-6 leading-relaxed">
                  Dessa tjänster är alltid kostnadsfria – oavsett om du genomför en affär eller inte.
                </p>
                <ul className="space-y-3">
                  {FREE_ITEMS.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                      <span className="text-[14px] text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fixed fee */}
              <div className="bg-[#0e6efe] rounded-2xl p-7 sm:p-9 shadow-lg">
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/15">
                    <Shield className="w-5 h-5 text-white" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold text-white/70 uppercase tracking-[0.2em]">Fast avgift vid affär</p>
                    <p className="text-[28px] font-bold text-white leading-none">1&nbsp;995 kr</p>
                  </div>
                </div>
                <p className="text-[14px] text-white/80 mb-7 leading-relaxed">
                  Betalas <strong className="text-white font-semibold">bara om affären genomförs</strong>. Inga dolda avgifter. Ingen provision baserad på bilens pris.
                </p>

                <p className="text-[11px] font-bold text-white/60 uppercase tracking-[0.18em] mb-4">Avgiften täcker</p>
                <div className="space-y-4">
                  {FEE_COVERS.map(item => (
                    <div key={item.title} className="flex gap-3">
                      <Check className="w-4 h-4 text-white mt-0.5 shrink-0" strokeWidth={2.5} />
                      <div>
                        <p className="text-[14px] font-semibold text-white leading-snug">{item.title}</p>
                        <p className="text-[13px] text-white/70 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-7 pt-6 border-t border-white/20">
                  <p className="text-[12px] text-white/60 leading-relaxed">
                    Genomsnittskunden sparar 12&nbsp;000–35&nbsp;000&nbsp;kr per affär. Avgiften betalar sig normalt sett många gånger om.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-[24px] sm:text-[34px] font-bold text-slate-900 mb-4 tracking-tight">
                Hur prissättningen fungerar i praktiken
              </h2>
              <div className="mt-8 space-y-4 text-left">
                {[
                  { step: '01', text: 'Du kontaktar Bilto – kostnadsfritt. Vi sätter ihop en plan för din bilaffär.' },
                  { step: '02', text: 'Vi söker, matchar och presenterar alternativ. Du väljer vad du vill gå vidare med.' },
                  { step: '03', text: 'Bilto förhandlar, granskar och sköter kontraktet. Affären genomförs.' },
                  { step: '04', text: 'Affären är klar – du betalar den fasta avgiften på 1 995 kr. Inget annat.' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex gap-4 items-start bg-[#faf8f5] rounded-xl px-5 py-4">
                    <span className="text-[13px] font-bold text-slate-300 tabular-nums pt-0.5 shrink-0 w-6">{step}</span>
                    <p className="text-[14px] sm:text-[15px] text-slate-700 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative bg-[#0e6efe] overflow-hidden">
          <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
            <h2 className="text-[28px] sm:text-[40px] font-bold text-white leading-[1.1] tracking-tight max-w-2xl mx-auto">
              Kom igång – det kostar ingenting att prova
            </h2>
            <p className="mt-4 text-white/80 text-[15px] sm:text-[17px] leading-[1.7] max-w-lg mx-auto">
              Boka en kostnadsfri konsultation och se vad Bilto kan göra för din nästa bilaffär.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/gratis-konsultation" className="inline-flex items-center justify-center gap-2 py-4 px-10 rounded-xl bg-white text-[#0e6efe] hover:bg-slate-50 font-bold text-[16px] transition shadow-lg group">
                Boka gratis konsultation
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
              </a>
              <button
                type="button"
                onClick={() => { window.history.pushState({}, '', '/kop-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                className="inline-flex items-center justify-center py-4 px-10 rounded-xl border-2 border-white/50 text-white font-semibold text-[16px] hover:border-white/80 hover:bg-white/10 transition"
              >
                Utforska bilköpshjälpen
              </button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
