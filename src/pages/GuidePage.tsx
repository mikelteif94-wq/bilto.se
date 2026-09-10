import { useEffect, useState } from 'react';
import { Menu, ArrowRight, Clock, ChevronRight, User, Calendar, ChevronDown, BookOpen, TrendingUp, Shield } from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta, injectJsonLd } from '../lib/pageMeta';
import { GUIDES, getGuideBySlug, type Guide } from '../lib/guides';

interface GuidePageProps {
  slug?: string;
  onBackHome: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const CATEGORY_META: Record<string, { icon: typeof BookOpen; color: string }> = {
  'Bilförsäljning': { icon: TrendingUp, color: 'text-emerald-600' },
  'Bilköp': { icon: Shield, color: 'text-[#0e6efe]' },
  'Förhandling': { icon: BookOpen, color: 'text-amber-600' },
};

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
  const totalGuides = GUIDES.length;

  return (
    <main>
      {/* Hero — dark slate, HowItWorks style */}
      <section className="bg-slate-900 pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,110,254,0.18),transparent_60%)] pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 relative">
          <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-4">Guider &amp; råd</p>
          <h1 className="text-[36px] sm:text-[54px] lg:text-[68px] font-bold leading-[1.04] tracking-tight text-white max-w-3xl">
            Allt du behöver veta om bilaffärer
          </h1>
          <p className="mt-5 text-[16px] sm:text-[19px] leading-[1.65] text-white/60 max-w-2xl">
            Praktiska guider från Biltos experter – om att sälja, köpa och förhandla bilar i Sverige.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-white/50 text-[13px]">
              <BookOpen className="w-4 h-4 text-[#0e6efe]" />
              <span>{totalGuides} guider publicerade</span>
            </div>
            <div className="flex items-center gap-2 text-white/50 text-[13px]">
              <User className="w-4 h-4 text-[#0e6efe]" />
              <span>Skrivna av Biltos experter</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category sections */}
      {categories.map((cat, catIdx) => {
        const catGuides = GUIDES.filter(g => g.category === cat);
        const isLight = catIdx % 2 === 0;
        return (
          <section key={cat} className={`py-14 sm:py-20 ${isLight ? 'bg-white' : 'bg-[#faf8f5]'}`}>
            <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
              <div className="flex items-baseline gap-3 mb-8 sm:mb-10">
                <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest">{cat}</p>
                <span className="text-slate-300 text-[12px]">{catGuides.length} guider</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {catGuides.map((guide, i) => (
                  <button
                    key={guide.slug}
                    type="button"
                    onClick={() => onNavigateGuide(guide.slug)}
                    className="text-left bg-white rounded-2xl p-6 border border-slate-100 hover:border-[#0e6efe]/30 hover:shadow-[0_8px_32px_-8px_rgba(14,110,254,0.18)] transition-all duration-300 group flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.15em]">
                        <span className="text-slate-400 font-semibold tabular-nums text-[10px]">0{i + 1}</span>
                      </span>
                      <span className="text-slate-200">·</span>
                      <span className="flex items-center gap-1 text-[12px] text-slate-400">
                        <Clock className="w-3 h-3" />{guide.readingTime}
                      </span>
                    </div>
                    <h3 className="text-[16px] sm:text-[17px] font-bold text-slate-900 leading-snug mb-3 group-hover:text-[#0e6efe] transition-colors flex-1">
                      {guide.title}
                    </h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mb-5">{guide.intro}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-[12px] text-slate-400">
                        <Calendar className="w-3 h-3" />{formatDate(guide.publishedDate)}
                      </span>
                      <span className="flex items-center gap-1 text-[#0e6efe] text-[13px] font-semibold group-hover:gap-2 transition-all">
                        Läs <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* CTA — dark slate */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(14,110,254,0.2),transparent_55%)] pointer-events-none" />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-4">Nästa steg</p>
          <h2 className="text-[28px] sm:text-[42px] font-bold text-white leading-[1.1] tracking-tight max-w-2xl">
            Vill du ha personlig hjälp med din bilaffär?
          </h2>
          <p className="mt-4 text-white/60 text-[15px] sm:text-[17px] leading-[1.7] max-w-xl">
            Biltos experter hjälper dig med hela affären – från värdering till signerat kontrakt.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[15px] transition shadow-[0_4px_18px_-4px_rgba(14,110,254,0.5)] group"
            >
              Värdera bilen
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </button>
            <a
              href="/gratis-konsultation"
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl border border-white/20 hover:border-white/40 text-white font-semibold text-[15px] transition"
            >
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function TableOfContents({ sections, faqCount }: { sections: Guide['sections']; faqCount: number }) {
  const [open, setOpen] = useState(true);
  const items = sections.map(s => ({ label: s.heading, id: slugify(s.heading) }));
  if (faqCount > 0) items.push({ label: 'Vanliga frågor', id: 'vanliga-fragor' });

  return (
    <nav className="bg-slate-900 rounded-2xl p-5 sm:p-6 mb-8 sm:mb-10">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.18em]">Innehåll</span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ol className="mt-4 space-y-1 list-none">
          {items.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="flex items-start gap-3 text-[14px] text-white/60 hover:text-white transition-colors py-1 group"
              >
                <span className="text-[11px] font-bold text-[#0e6efe] tabular-nums mt-0.5 w-4 shrink-0">0{i + 1}</span>
                <span className="group-hover:underline underline-offset-2 leading-snug">{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}

function FaqSection({ faq, guideTitle }: { faq: Guide['faq']; guideTitle: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    if (faq.length === 0) return;
    const existing = document.querySelector('script[data-faq-jsonld]');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-faq-jsonld', 'true');
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      name: `Vanliga frågor – ${guideTitle}`,
      mainEntity: faq.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    });
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [faq, guideTitle]);

  if (faq.length === 0) return null;

  return (
    <div id="vanliga-fragor" className="bg-white rounded-2xl p-7 sm:p-9 border border-slate-100 scroll-mt-24">
      <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-2">FAQ</p>
      <h2 className="text-[20px] sm:text-[24px] font-bold text-slate-900 mb-6 leading-tight tracking-tight">Vanliga frågor</h2>
      <dl className="divide-y divide-slate-100">
        {faq.map((item, i) => (
          <div key={i} className="py-4 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="flex items-start justify-between w-full text-left gap-4 group"
            >
              <dt className="text-[15px] font-semibold text-slate-900 leading-snug group-hover:text-[#0e6efe] transition-colors">
                {item.question}
              </dt>
              <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 mt-0.5 transition-transform duration-200 ${openIdx === i ? 'rotate-180' : ''}`} />
            </button>
            {openIdx === i && (
              <dd className="mt-3 text-[14px] sm:text-[15px] text-slate-600 leading-[1.8]">
                {item.answer}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}

function GuideArticle({ guide, onBack, onNavigateGuide, onBackHome }: { guide: Guide; onBack: () => void; onNavigateGuide: (slug: string) => void; onBackHome: () => void }) {
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
      author: { '@type': 'Organization', name: guide.author, url: 'https://bilto.se' },
      datePublished: guide.publishedDate,
      publisher: { '@type': 'Organization', name: 'Bilto', logo: { '@type': 'ImageObject', url: 'https://bilto.se/bilto_logo_transparent.svg' } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://bilto.se/guider/${guide.slug}` },
    });
  }, [guide]);

  const related = GUIDES.filter(g => g.slug !== guide.slug && g.category === guide.category).slice(0, 3);
  const fallbackRelated = GUIDES.filter(g => g.slug !== guide.slug).slice(0, 3);
  const relatedGuides = related.length >= 2 ? related : fallbackRelated;

  return (
    <main>
      {/* Article hero — dark */}
      <section className="bg-slate-900 pt-28 sm:pt-36 pb-12 sm:pb-16 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,110,254,0.15),transparent_60%)] pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition mb-6">
              <ChevronRight className="w-4 h-4 rotate-180" />Alla guider
            </button>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-5">
              <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest">{guide.category}</p>
              <span className="text-white/20">·</span>
              <span className="flex items-center gap-1 text-[12px] text-white/40">
                <Clock className="w-3.5 h-3.5" />{guide.readingTime} läsning
              </span>
            </div>
            <h1 className="text-[28px] sm:text-[44px] lg:text-[54px] font-bold leading-[1.08] tracking-tight text-white">
              {guide.title}
            </h1>
            <p className="mt-5 text-[15px] sm:text-[18px] leading-[1.75] text-white/60">{guide.intro}</p>

            {/* Author byline */}
            <div className="mt-7 pt-6 border-t border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white/60" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/80 leading-tight">{guide.author}</p>
                <p className="text-[12px] text-white/40 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Publicerad {formatDate(guide.publishedDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article body */}
      <section className="py-10 sm:py-14 bg-[#faf8f5]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <TableOfContents sections={guide.sections} faqCount={guide.faq.length} />

            <div className="space-y-5">
              {guide.sections.map((section, i) => (
                <div
                  key={i}
                  id={slugify(section.heading)}
                  className="bg-white rounded-2xl p-7 sm:p-9 border border-slate-100 scroll-mt-24"
                >
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-[11px] font-bold text-[#0e6efe] tabular-nums shrink-0">0{i + 1}</span>
                    <h2 className="text-[19px] sm:text-[22px] font-bold text-slate-900 leading-tight tracking-tight">{section.heading}</h2>
                  </div>
                  <p className="text-[15px] sm:text-[16px] text-slate-600 leading-[1.8]">{section.body}</p>
                  {section.subsections?.map((sub, j) => (
                    <div key={j} className="mt-6 pl-5 border-l-2 border-[#0e6efe]/20">
                      <h3 className="text-[16px] font-bold text-slate-800 mb-2 leading-snug">{sub.heading}</h3>
                      <p className="text-[15px] text-slate-600 leading-[1.8]">{sub.body}</p>
                    </div>
                  ))}
                </div>
              ))}

              <FaqSection faq={guide.faq} guideTitle={guide.title} />
            </div>

            {/* Dual CTA — dark slate */}
            <div className="mt-8 rounded-2xl bg-slate-900 p-7 sm:p-9 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(14,110,254,0.25),transparent_60%)] pointer-events-none" />
              <div className="relative">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.18em] mb-3">Nästa steg</p>
                <h3 className="text-[20px] sm:text-[26px] font-bold text-white leading-snug tracking-tight mb-2">
                  Redo att göra din bästa bilaffär?
                </h3>
                <p className="text-white/60 text-[14px] sm:text-[15px] leading-relaxed mb-6">
                  Sätt ett pris på din bil eller boka ett kostnadsfritt samtal med en av våra rådgivare.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={onBackHome}
                    className="inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-xl bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[14px] transition shadow-[0_4px_18px_-4px_rgba(14,110,254,0.5)] group"
                  >
                    Värdera bilen
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </button>
                  <a
                    href="/gratis-konsultation"
                    className="inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-xl border border-white/20 hover:border-white/40 text-white font-semibold text-[14px] transition"
                  >
                    Kostnadsfri konsultation
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related guides */}
      {relatedGuides.length > 0 && (
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-6">Fler guider</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl">
              {relatedGuides.map(g => (
                <button key={g.slug} type="button" onClick={() => onNavigateGuide(g.slug)} className="text-left bg-[#faf8f5] hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-md rounded-2xl p-5 transition-all duration-200 group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.15em]">{g.category}</span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1 text-[12px] text-slate-400">
                      <Clock className="w-3 h-3" />{g.readingTime}
                    </span>
                  </div>
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
    if (route) {
      window.history.pushState({}, '', route);
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
            <img src="/a_clean_graphic_logo_on_a_transparent_background.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map(({ id, label }) => (
              <button key={id} type="button" onClick={() => handleMenuSelect(id)} className="text-[15px] text-white/90 hover:text-white transition">
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

      {guide ? (
        <GuideArticle guide={guide} onBack={navigateIndex} onNavigateGuide={navigateGuide} onBackHome={onBackHome} />
      ) : (
        <GuideIndex onBackHome={onBackHome} onNavigateGuide={navigateGuide} />
      )}

      <SiteFooter />
    </div>
  );
}
