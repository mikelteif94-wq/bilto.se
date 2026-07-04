import { useEffect, useState } from 'react';
import { ArrowRight, Menu, ShieldCheck, Handshake, Gauge } from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta } from '../lib/pageMeta';

interface AboutPageProps {
  onBackHome: () => void;
}

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Utvalda bilhandlare',
    text: 'Alla handlare går igenom en noggrann kontroll av ekonomi, kundrecensioner och tidigare affärer innan de ens får se en bil hos oss.',
  },
  {
    icon: Gauge,
    title: 'Genomtänkta flöden',
    text: 'Processerna är noggrant utformade steg för steg – så att du sparar tid, får ett bättre pris och känner dig trygg hela vägen.',
  },
  {
    icon: Handshake,
    title: 'Teknik med ett syfte',
    text: 'Varje del av plattformen är byggd kring samma mål: maximera ditt slutpris och göra affären enkel, tydlig och smidig från första klick till överlämning.',
  },
];

const PROMISES = [
  {
    num: '01',
    title: 'Transparenta bud',
    text: 'Se exakt vad varje handlare erbjuder – utan dolda påslag.',
  },
  {
    num: '02',
    title: 'Tydliga villkor',
    text: 'Inga förvirrande avgifter. Du vet vad affären kostar innan du säger ja.',
  },
  {
    num: '03',
    title: 'Dedikerad rådgivare',
    text: 'En riktig människa finns tillgänglig hela vägen – från värdering till överlämning.',
  },
];

const FOUNDERS = [
  {
    name: 'Alexander',
    role: 'VD och medgrundare',
    bio: '[Grundarens bakgrund och varför han startade Bilto – fylls i av grundaren.]',
    photo: '/daniel-portrait.jpg',
  },
  {
    name: '[Medgrundare]',
    role: '[Roll]',
    bio: '[Grundarens bakgrund och varför han/hon startade Bilto – fylls i av grundaren.]',
    photo: null,
  },
];

export default function AboutPage({ onBackHome }: AboutPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: 'Om Bilto – vi förenklar din bilaffär',
      description: 'Bilto grundades för att göra bilaffären transparent och rättvis för privatpersoner. Lär känna teamet och vår vision om en bättre bilmarknad.',
      canonical: 'https://bilto.se/om-oss',
    });
  }, []);

  const navItems: MobileMenuItem[] = ['Sälj bil', 'Bilköpshjälpen', 'Priser', 'Bilspara'];

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

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onSelect={handleMenuSelect} />

      {/* Header */}
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-4 sm:px-5 lg:px-8">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-1 w-11 h-11 flex items-center justify-center text-white"
          >
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleMenuSelect(item)}
                className="text-[15px] text-white/90 hover:text-white transition"
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center ml-auto">
            <a
              href="/gratis-konsultation"
              className="inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap"
            >
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative pt-24 sm:pt-28 overflow-hidden bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-0">
            <div className="max-w-3xl">
              <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-4">
                Om Bilto
              </span>
              <h1 className="text-[34px] sm:text-[52px] lg:text-[64px] font-bold leading-[1.05] tracking-tight text-slate-900">
                Vi gör bilaffären transparent – och lönsam för dig.
              </h1>
              <p className="mt-5 text-[16px] sm:text-[19px] leading-[1.65] text-slate-500 max-w-2xl">
                Bilto förbinder privatpersoner med granskade bilhandlare – för ett högre slutpris, en enklare process och en affär som håller hela vägen.
              </p>
            </div>
          </div>

          {/* Hero image */}
          <div className="mt-8 sm:mt-12 pb-10 sm:pb-16 relative">
            <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
              <div className="relative rounded-xl overflow-hidden aspect-[21/8] sm:aspect-[21/7] bg-slate-100">
                <img
                  src="/files_2615643-2026-06-20T00-26-02-459Z-header8.jpg"
                  alt="Nöjda bilköpare"
                  className="w-full h-full object-cover object-center"
                  fetchPriority="high"
                  decoding="async"
                  width="1200"
                  height="400"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Mission + Values + Promise */}
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">
              {/* Left: mission text */}
              <div>
                <span className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-4 block">
                  Vår mission
                </span>
                <h2 className="text-[26px] sm:text-[38px] font-bold text-slate-900 leading-[1.1] tracking-tight">
                  Handlaren har alltid haft ett expertövertag. Nu har du en expert på din sida.
                </h2>
                <div className="mt-5 space-y-4 text-slate-500 text-[15px] sm:text-[16px] leading-[1.75]">
                  <p>
                    Bilmarknaden har länge präglats av otydliga priser, dolda avgifter och ett informationsövertag på handlarens sida. Vi bestämde oss för att ändra på det.
                  </p>
                  <p>
                    Bilto är en ny tjänst byggd för transparens – vi ser till att bilaffären är tydlig och rättvis för dig som privatperson, med handlare som granskas noggrant innan de ens tillåts lägga ett bud.
                  </p>
                </div>
              </div>

              {/* Right: values + promise list */}
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-4 block">
                    Det vi står för
                  </span>
                  <div className="space-y-4">
                    {VALUES.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="flex gap-4 p-5 rounded-xl bg-[#faf8f5] hover:bg-[#0e6efe] group transition-colors duration-300">
                          <div className="w-10 h-10 rounded-xl bg-[#0e6efe] group-hover:bg-white/20 flex items-center justify-center shrink-0 transition-colors duration-300">
                            <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                          </div>
                          <div>
                            <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-white mb-1 transition-colors duration-300">
                              {item.title}
                            </h3>
                            <p className="text-[14px] text-slate-500 group-hover:text-white/80 leading-[1.65] transition-colors duration-300">
                              {item.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#faf8f5] rounded-xl p-6 sm:p-7">
                  <span className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-4 block">
                    Vårt löfte
                  </span>
                  <dl className="divide-y divide-slate-200">
                    {PROMISES.map((item) => (
                      <div key={item.title} className="grid grid-cols-[32px_1fr] gap-x-4 py-4">
                        <dt className="text-[12px] font-semibold text-slate-300 tabular-nums pt-0.5">
                          {item.num}
                        </dt>
                        <dd>
                          <p className="text-[15px] font-bold text-slate-900 tracking-tight mb-1">
                            {item.title}
                          </p>
                          <p className="text-[13.5px] text-slate-500 leading-[1.6]">
                            {item.text}
                          </p>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our story */}
        <section className="py-14 sm:py-20 bg-[#faf8f5]">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-4 block">
                Vår historia
              </span>
              <h2 className="text-[26px] sm:text-[38px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-6">
                Varför vi startade Bilto
              </h2>
              <div className="space-y-4 text-slate-500 text-[15px] sm:text-[16px] leading-[1.75]">
                <p>
                  [Här berättar grundarna varför Bilto skapades – vad de upplevde, vad de saknade på marknaden och vad som drev dem att bygga en bättre lösning.]
                </p>
                <p>
                  [Bakgrund, inspiration och den insikt som ledde till att Bilto grundades. Fylls i av grundarna.]
                </p>
                <p>
                  [Hur resan har sett ut – från idé till den plattform som Bilto är idag.]
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founders */}
        <section className="py-14 sm:py-20 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <span className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-4 block">
              Grundarna
            </span>
            <h2 className="text-[26px] sm:text-[38px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-10">
              Människorna bakom Bilto
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
              {FOUNDERS.map((founder) => (
                <div key={founder.name} className="rounded-xl border border-slate-200 bg-[#faf8f5] overflow-hidden">
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    {founder.photo ? (
                      <img
                        src={founder.photo}
                        alt={founder.name}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                        decoding="async"
                        width="480"
                        height="360"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <span className="text-[13px] text-slate-400 font-medium">Foto kommer</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 sm:p-6">
                    <p className="text-[17px] font-bold text-slate-900 leading-tight">{founder.name}</p>
                    <p className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-wide mt-1 mb-3">{founder.role}</p>
                    <p className="text-[14px] text-slate-500 leading-[1.65]">{founder.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative bg-[#0e6efe] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/files_2615643-2026-06-20T00-26-02-459Z-header8.jpg"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover object-center opacity-20"
              loading="lazy"
              decoding="async"
              width="1200"
              height="400"
            />
          </div>
          <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
            <h2 className="text-[28px] sm:text-[44px] font-bold text-white leading-[1.1] tracking-tight max-w-2xl mx-auto">
              Sälja på dina villkor? Börja här.
            </h2>
            <p className="mt-4 sm:mt-5 text-white/80 text-[15px] sm:text-[17px] leading-[1.7] max-w-lg mx-auto">
              Få bud från granskade handlare på några minuter. Du väljer det bästa – vi hämtar bilen.
            </p>
            <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={onBackHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-4 px-10 rounded-xl bg-white text-[#0e6efe] hover:bg-[#faf8f5] font-bold text-[16px] transition shadow-lg group"
              >
                Värdera bilen
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
              </button>
              <a
                href="/gratis-konsultation"
                className="w-full sm:w-auto inline-flex items-center justify-center py-4 px-10 rounded-xl border-2 border-white/50 text-white font-semibold text-[16px] hover:border-white/80 hover:bg-white/10 transition"
              >
                Boka konsultation
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

