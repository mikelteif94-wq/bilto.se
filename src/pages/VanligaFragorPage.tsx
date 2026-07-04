import { useEffect, useState } from 'react';
import { Menu, Plus, Minus, ArrowRight } from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta, injectJsonLd } from '../lib/pageMeta';

interface VanligaFragorPageProps {
  onBackHome: () => void;
}

interface FaqItem {
  q: string;
  a: string;
}

interface FaqGroup {
  heading: string;
  items: FaqItem[];
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: 'Sälja bil',
    items: [
      { q: 'Vad kostar det att sälja bil via Bilto?', a: 'Det är helt gratis för dig som privatperson. Du får gratis värdering, gratis marknadsföring mot handlare och fri upphämtning. Bilto tar ett arvode från handlaren när affären är klar – inget från dig.' },
      { q: 'Hur snabbt kan jag sälja min bil?', a: 'De flesta bilar säljs inom 24–48 timmar. Så fort du har skickat in din bil tar vi kontakt med granskade handlare och du får bud redan samma dag.' },
      { q: 'Hämtar Bilto bilen hos mig?', a: 'Ja, vi erbjuder fri upphämtning i hela Sverige. Du behöver aldrig köra din bil till en handlare.' },
      { q: 'Vad händer om jag inte är nöjd med buden?', a: 'Du är aldrig bunden att sälja. Väljer du att tacka nej till alla bud är det helt utan kostnad. Du bestämmer alltid om och till vem du säljer.' },
      { q: 'Hur vet jag att jag får marknadspriset?', a: 'Vi skickar din bil till flera granskade handlare som tävlar mot varandra. Det skapar en naturlig auktionsdynamik som driver upp priset och ger dig ett transparent budgivningsresultat.' },
      { q: 'Kan jag sälja om bilen har ett pågående lån?', a: 'Ja, det går bra. Vi hjälper dig lösa ut lånet i samband med affären, så att allt hanteras smidigt vid överlämning.' },
    ],
  },
  {
    heading: 'Köpa bil',
    items: [
      { q: 'Vad innebär Biltos bilköpshjälp?', a: 'En av våra experter hjälper dig hitta rätt bil, granskar skicket, förhandlar priset och ser till att kontraktet är korrekt. Du betalar inte extra – vi finansieras av handlaren.' },
      { q: 'Kostar bilköpshjälpen något?', a: 'Nej, tjänsten är gratis för dig. Bilto ersätts av handlaren när en affär slutförs.' },
      { q: 'Hur mycket kan jag spara med Biltos förhandlingshjälp?', a: 'Det beror på bil och situation. Genom att ha en expert som förhandlar pris, ränta och tillval på din sida – och som vet vad handlare faktiskt kan gå med på – ökar dina chanser att göra en bättre affär än om du förhandlar ensam.' },
      { q: 'Kan Bilto hjälpa mig att hitta en specifik bil?', a: 'Absolut. Berätta vilken bil du letar efter så söker vi i hela Sverige och presenterar alternativ som passar ditt behov och budget.' },
    ],
  },
  {
    heading: 'Om Bilto och processen',
    items: [
      { q: 'Hur kontrollerar Bilto handlarna?', a: 'Alla handlare genomgår en noggrann granskning av ekonomi, kundrecensioner och tidigare affärer innan de godkänns. De utvärderas löpande – handlare med dåligt rykte tas bort.' },
      { q: 'Var i Sverige är Bilto tillgängligt?', a: 'Vi är aktiva i hela Sverige. Oavsett om du bor i Malmö, Göteborg, Stockholm eller Umeå kan du använda Biltos tjänster.' },
      { q: 'Hur kontaktar jag er om jag har frågor?', a: 'Du kan boka en kostnadsfri konsultation direkt på bilto.se eller kontakta oss via e-post. En personlig rådgivare svarar vanligtvis inom ett par timmar.' },
      { q: 'Är mina uppgifter säkra hos Bilto?', a: 'Ja. Vi behandlar alla personuppgifter i enlighet med GDPR och delar aldrig dina uppgifter med tredje part utan ditt medgivande.' },
    ],
  },
];

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-slate-100">
      {items.map((item, i) => (
        <div key={i} className="py-4">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-start justify-between gap-4 text-left group"
          >
            <span className="text-[15px] sm:text-[16px] font-semibold text-slate-900 group-hover:text-[#0e6efe] transition-colors leading-snug">
              {item.q}
            </span>
            <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center bg-slate-100 group-hover:bg-[#0e6efe]/10 transition-colors">
              {open === i
                ? <Minus className="w-3.5 h-3.5 text-[#0e6efe]" />
                : <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#0e6efe]" />}
            </span>
          </button>
          {open === i && (
            <p className="mt-3 text-[14px] sm:text-[15px] text-slate-500 leading-[1.75] pr-10">
              {item.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function VanligaFragorPage({ onBackHome }: VanligaFragorPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: MobileMenuItem[] = ['Sälj bil', 'Köp bil', 'Om oss'];

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Köp bil': '/kop-bil',
      'Om oss': '/om-oss',
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
      title: 'Vanliga frågor om bilköp och bilförsäljning | Bilto',
      description: 'Svar på de vanligaste frågorna om att sälja eller köpa bil via Bilto. Hur funkar det, vad kostar det och vad ingår?',
      canonical: 'https://bilto.se/vanliga-fragor',
    });
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_GROUPS.flatMap(g =>
        g.items.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        }))
      ),
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
        <section className="pt-28 sm:pt-36 pb-12 sm:pb-16 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-4">Hjälp &amp; Support</span>
            <h1 className="text-[34px] sm:text-[52px] lg:text-[64px] font-bold leading-[1.05] tracking-tight text-slate-900 max-w-3xl">
              Vanliga frågor
            </h1>
            <p className="mt-5 text-[16px] sm:text-[19px] leading-[1.65] text-slate-500 max-w-2xl">
              Har du frågor om att sälja eller köpa bil via Bilto? Här hittar du svar på det mesta.
            </p>
          </div>
        </section>

        {/* FAQ sections */}
        <section className="py-12 sm:py-16 bg-[#faf8f5]">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {FAQ_GROUPS.map(group => (
                <div key={group.heading} className="mb-10">
                  <h2 className="text-[18px] sm:text-[22px] font-bold text-slate-900 mb-4 pb-3 border-b border-slate-200">
                    {group.heading}
                  </h2>
                  <FaqAccordion items={group.items} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative bg-[#0e6efe] overflow-hidden">
          <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
            <h2 className="text-[28px] sm:text-[40px] font-bold text-white leading-[1.1] tracking-tight max-w-2xl mx-auto">
              Hittar du inte svaret du söker?
            </h2>
            <p className="mt-4 text-white/80 text-[15px] sm:text-[17px] leading-[1.7] max-w-lg mx-auto">
              Boka en kostnadsfri konsultation så svarar en av våra rådgivare på dina frågor.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/gratis-konsultation" className="inline-flex items-center justify-center gap-2 py-4 px-10 rounded-xl bg-white text-[#0e6efe] hover:bg-slate-50 font-bold text-[16px] transition shadow-lg group">
                Kostnadsfri konsultation
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
