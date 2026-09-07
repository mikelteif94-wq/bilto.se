import { useEffect } from 'react';
import { ExternalLink, MapPin, Car as CarIcon } from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import { SEO_CITIES, SEO_BRANDS } from '../lib/seo-pages';

interface WebbplatskartaPageProps {
  onBack: () => void;
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export default function WebbplatskartaPage({ onBack }: WebbplatskartaPageProps) {
  useEffect(() => {
    document.title = 'Webbplatskarta | Bilto';
  }, []);

  const staticPages = [
    { label: 'Startsida', path: '/', desc: 'Biltos startsida – värdera och sälj din bil' },
    { label: 'Sälj din bil', path: '/salj-din-bil', desc: 'Steg-för-steg guide för att sälja din bil via Bilto' },
    { label: 'Köp bil med hjälp', path: '/kop-bil', desc: 'Låt oss hitta och förhandla fram rätt bil åt dig' },
    { label: 'Köp bil – beställ', path: '/kop-bil/bestall', desc: 'Starta din köpprocess' },
    { label: 'Om oss', path: '/om-oss', desc: 'Lär känna teamet bakom Bilto' },
    { label: 'Blogg', path: '/blogg', desc: 'Tips och råd för smarta bilaffärer' },
    { label: 'Bli handlare', path: '/handlare/registrera', desc: 'Ansök om att bli Bilto-handlare' },
    { label: 'Logga in', path: '/logga-in', desc: 'Kundportal – se dina erbjudanden' },
    { label: 'Användarvillkor', path: '/anvandarvillkor', desc: 'Våra användarvillkor' },
    { label: 'Integritetspolicy', path: '/integritetspolicy', desc: 'Hur vi hanterar dina personuppgifter' },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-30 h-16 bg-[#0e6efe]">
        <div className="max-w-5xl mx-auto h-full flex items-center px-5">
          <button onClick={onBack} className="flex items-center">
            <img src="/a_clean_graphic_logo_on_a_transparent_background.png" alt="Bilto" className="h-14 w-auto object-contain" />
          </button>
        </div>
      </header>

      <main className="pt-24 pb-20 px-5">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-2">Webbplatskarta</h1>
          <p className="text-slate-500 text-[15px] mb-12">Alla sidor på bilto.se samlade på ett ställe.</p>

          {/* Statiska sidor */}
          <section className="mb-14">
            <h2 className="text-[18px] font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100">
              Sidor
            </h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {staticPages.map(p => (
                <li key={p.path}>
                  <button
                    onClick={() => navigate(p.path)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-[#faf8f5] transition group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0 group-hover:text-[#0e6efe] transition" />
                    <div>
                      <span className="text-[14px] font-medium text-slate-800 group-hover:text-[#0e6efe] transition">{p.label}</span>
                      <p className="text-[12px] text-slate-400 mt-0.5">{p.desc}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Sälj per stad */}
          <section className="mb-14">
            <h2 className="text-[18px] font-bold text-slate-900 mb-1 pb-3 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-slate-400" />
              Sälj din bil per ort
            </h2>
            <p className="text-[13px] text-slate-400 mb-5">Bilto hjälper säljare i hela Sverige.</p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {SEO_CITIES.map(city => (
                <li key={city.slug}>
                  <button
                    onClick={() => navigate(`/salj-din-bil-i-${city.slug}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#faf8f5] text-[14px] text-slate-700 hover:text-[#0e6efe] transition font-medium"
                  >
                    {city.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Sälj per märke */}
          <section className="mb-14">
            <h2 className="text-[18px] font-bold text-slate-900 mb-1 pb-3 border-b border-slate-100 flex items-center gap-2">
              <CarIcon className="w-4.5 h-4.5 text-slate-400" />
              Sälj din bil per märke
            </h2>
            <p className="text-[13px] text-slate-400 mb-5">Specifika sidor för de vanligaste bilmärkena i Sverige.</p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {SEO_BRANDS.map(brand => (
                <li key={brand.slug}>
                  <button
                    onClick={() => navigate(`/salj-din-${brand.slug}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#faf8f5] text-[14px] text-slate-700 hover:text-[#0e6efe] transition font-medium"
                  >
                    Sälj din {brand.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
