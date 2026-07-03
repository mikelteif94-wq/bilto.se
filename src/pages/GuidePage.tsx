import { useEffect, useState } from 'react';
import { Menu, ArrowRight, Clock, ChevronRight } from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta, injectJsonLd } from '../lib/pageMeta';
import { GUIDES, getGuideBySlug, type Guide } from '../lib/guides';

interface GuidePageProps {
  slug?: string;
  onBackHome: () => void;
}

function GuideIndex({ onBackHome, onNavigateGuide }: { onBackHome: () => void; onNavigateGuide: (slug: string) => void }) {
  useEffect(() => {
    setPageMeta({
      title: 'Guider om att sälja och köpa bil | Bilto',
      description: 'Läs Biltos guider om bilköp, bilförsäljning och prisförhandling. Praktiska råd från experter som hjälper dig göra en bättre bilaffär.',
      canonical: 'https://bilto.se/guider',
    });
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Bilto Guider',
      description: 'Guider om att sälja och köpa bil i Sverige',
      url: 'https://bilto.se/guider',
      publisher: { '@type': 'Organization', name: 'Bilto', url: 'https://bilto.se' },
    });
  }, []);

  const categories = [...new Set(GUIDES.map(g => g.category))];

  return (
    <main>
      <section className="pt-28 sm:pt-36 pb-12 sm:pb-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
          <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-4">Guider</span>
          <h1 className="text-[34px] sm:text-[52px] lg:text-[64px] font-bold leading-[1.05] tracking-tight text-slate-900 max-w-3xl">
            Allt du behöver veta om bilaffärer
          </h1>
          <p className="mt-5 text-[16px] sm:text-[19px] leading-[1.65] text-slate-500 max-w-2xl">
            Praktiska guider från Biltos experter – om att sälja, köpa och förhandla bilar i Sverige.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-[#faf8f5]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
          {categories.map(cat => (
            <div key={cat} className="mb-12">
              <h2 className="text-[18px] font-bold text-slate-900 mb-5 pb-3 border-b border-slate-200">{cat}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {GUIDES.filter(g => g.category === cat).map(guide => (
                  <button
                    key={guide.slug}
                    type="button"
                    onClick={() => onNavigateGuide(guide.slug)}
                    className="text-left bg-white rounded-xl p-6 border border-slate-100 hover:border-[#0e6efe]/30 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.15em]">{guide.category}</span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1 text-[12px] text-slate-400">
                        <Clock className="w-3 h-3" />{guide.readingTime}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-900 leading-snug mb-2 group-hover:text-[#0e6efe] transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2">{guide.intro}</p>
                    <div className="flex items-center gap-1 mt-4 text-[#0e6efe] text-[13px] font-semibold">
                      Läs guide <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative bg-[#0e6efe] overflow-hidden">
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <h2 className="text-[28px] sm:text-[40px] font-bold text-white leading-[1.1] tracking-tight max-w-2xl mx-auto">
            Vill du ha personlig hjälp?
          </h2>
          <p className="mt-4 text-white/80 text-[15px] sm:text-[17px] leading-[1.7] max-w-lg mx-auto">
            Biltos experter hjälper dig med hela affären – från värdering till signerat kontrakt.
          </p>
          <div className="mt-7">
            <a href="/gratis-konsultation" className="inline-flex items-center justify-center gap-2 py-4 px-10 rounded-xl bg-white text-[#0e6efe] hover:bg-slate-50 font-bold text-[16px] transition shadow-lg group">
              Boka kostnadsfri konsultation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function GuideArticle({ guide, onBack, onNavigateGuide }: { guide: Guide; onBack: () => void; onNavigateGuide: (slug: string) => void }) {
  useEffect(() => {
    setPageMeta({
      title: guide.metaTitle,
      description: guide.metaDescription,
      canonical: `https://bilto.se/guider/${guide.slug}`,
      ogType: 'article',
    });
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.metaDescription,
      author: { '@type': 'Organization', name: 'Bilto', url: 'https://bilto.se' },
      publisher: { '@type': 'Organization', name: 'Bilto', logo: { '@type': 'ImageObject', url: 'https://bilto.se/bilto_logo_transparent.svg' } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://bilto.se/guider/${guide.slug}` },
    });
  }, [guide]);

  const related = GUIDES.filter(g => g.slug !== guide.slug).slice(0, 2);

  return (
    <main>
      {/* Article header */}
      <section className="pt-28 sm:pt-36 pb-10 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-700 transition mb-6">
              <ChevronRight className="w-4 h-4 rotate-180" />Alla guider
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.2em]">{guide.category}</span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1 text-[12px] text-slate-400">
                <Clock className="w-3.5 h-3.5" />{guide.readingTime} läsning
              </span>
            </div>
            <h1 className="text-[28px] sm:text-[42px] lg:text-[52px] font-bold leading-[1.1] tracking-tight text-slate-900">
              {guide.title}
            </h1>
            <p className="mt-5 text-[16px] sm:text-[18px] leading-[1.75] text-slate-500">{guide.intro}</p>
          </div>
        </div>
      </section>

      {/* Article body */}
      <section className="py-10 sm:py-14 bg-[#faf8f5]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-10">
            {guide.sections.map((section, i) => (
              <div key={i} className="bg-white rounded-xl p-7 sm:p-9 border border-slate-100">
                <h2 className="text-[19px] sm:text-[22px] font-bold text-slate-900 mb-4 leading-tight">{section.heading}</h2>
                <p className="text-[15px] sm:text-[16px] text-slate-600 leading-[1.8]">{section.body}</p>
              </div>
            ))}
          </div>

          {/* CTA inline */}
          <div className="max-w-3xl mt-10">
            <div className="bg-[#0e6efe] rounded-2xl p-7 sm:p-9 text-white">
              <h3 className="text-[20px] sm:text-[24px] font-bold mb-2">Vill du ha hjälp av en expert?</h3>
              <p className="text-white/80 text-[14px] sm:text-[15px] leading-relaxed mb-5">Biltos rådgivare hjälper dig kostnadsfritt – från värdering och sökning till förhandling och signering.</p>
              <a href="/gratis-konsultation" className="inline-flex items-center gap-2 py-3 px-7 rounded-xl bg-white text-[#0e6efe] font-bold text-[14px] hover:bg-slate-50 transition group">
                Boka gratis konsultation
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Related guides */}
      {related.length > 0 && (
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <h2 className="text-[20px] font-bold text-slate-900 mb-6">Fler guider</h2>
            <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
              {related.map(g => (
                <button key={g.slug} type="button" onClick={() => onNavigateGuide(g.slug)} className="text-left bg-[#faf8f5] hover:bg-[#0e6efe]/5 rounded-xl p-5 transition group">
                  <span className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.15em] block mb-1">{g.category}</span>
                  <h3 className="text-[15px] font-bold text-slate-900 leading-snug group-hover:text-[#0e6efe] transition-colors">{g.title}</h3>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default function GuidePage({ slug, onBackHome }: GuidePageProps) {
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

  const navigateGuide = (s: string) => {
    window.history.pushState({}, '', `/guider/${s}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const navigateIndex = () => {
    window.history.pushState({}, '', '/guider');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const guide = slug ? getGuideBySlug(slug) : undefined;

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

      {guide ? (
        <GuideArticle guide={guide} onBack={navigateIndex} onNavigateGuide={navigateGuide} />
      ) : (
        <GuideIndex onBackHome={onBackHome} onNavigateGuide={navigateGuide} />
      )}

      <SiteFooter />
    </div>
  );
}
