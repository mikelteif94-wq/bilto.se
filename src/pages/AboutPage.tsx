import { useState } from 'react';
import { ArrowRight, Menu, ShieldCheck, Handshake, Gauge, Star, Users, TrendingUp, Clock } from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';

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
    text: 'Processerna är slipade genom tusentals verkliga affärer — steg för steg, så att du sparar tid, får ett bättre pris och känner dig trygg hela vägen.',
  },
  {
    icon: Handshake,
    title: 'Teknik med ett syfte',
    text: 'Varje del av plattformen är byggd kring samma mål: maximera ditt slutpris och göra affären enkel, tydlig och smidig från första klick till överlämning.',
  },
];

const STATS = [
  { value: '5 000+', label: 'Bilar förmedlade', icon: TrendingUp },
  { value: '~15 000 kr', label: 'Genomsnittlig besparing', icon: Star },
  { value: '10+ år', label: 'Erfarenhet i branschen', icon: Clock },
  { value: '100%', label: 'På kundens sida', icon: Users },
];

const PROMISES = [
  {
    num: '01',
    title: 'Transparenta bud',
    text: 'Se exakt vad varje handlare erbjuder — utan dolda påslag eller efterhandsjusteringar.',
  },
  {
    num: '02',
    title: 'Tydliga villkor',
    text: 'Inga förvirrande avgifter. Du vet vad affären kostar innan du säger ja.',
  },
  {
    num: '03',
    title: 'Dedikerad rådgivare',
    text: 'En riktig människa finns tillgänglig hela vägen — från värdering till överlämning.',
  },
];

export default function AboutPage({ onBackHome }: AboutPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: MobileMenuItem[] = ['Sälj bil', 'Köp bil'];

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Köp bil') {
      window.history.pushState({}, '', '/kop-bil');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onBackHome();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onSelect={handleMenuSelect} />

      {/* Header */}
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-40 h-16 rounded-full shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
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
              className="inline-flex items-center bg-white text-[#0e6efe] text-[12px] lg:text-[14px] font-semibold px-4 lg:px-5 h-10 rounded-full hover:bg-slate-100 transition whitespace-nowrap"
            >
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative pt-24 sm:pt-28 overflow-hidden bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-0">
            <div className="max-w-3xl">
              <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-5">
                Om Bilto
              </span>
              <h1 className="text-[38px] sm:text-[56px] lg:text-[72px] font-bold leading-[1.05] tracking-tight text-slate-900">
                En tryggare väg genom den svenska bilaffären.
              </h1>
              <p className="mt-6 text-[17px] sm:text-[20px] leading-[1.65] text-slate-500 max-w-2xl">
                Bilto är tjänsten som kopplar samman privatpersoner med kvalitetsgranskade bilhandlare — för ett högre slutpris, en enklare process och en affär som håller hela vägen.
              </p>
            </div>
          </div>

          {/* Hero image */}
          <div className="mt-10 sm:mt-14 relative">
            <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[21/8] sm:aspect-[21/7] bg-slate-100">
                <img
                  src="/files_2615643-2026-06-20T00-26-02-459Z-header8.jpg"
                  alt="Nöjda bilköpare"
                  className="w-full h-full object-cover object-center"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="bg-[#0e6efe] py-10 sm:py-12">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              {STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex flex-col items-center text-center">
                    <Icon className="w-5 h-5 text-white/60 mb-2" strokeWidth={1.8} />
                    <p className="text-[28px] sm:text-[34px] font-bold text-white tabular-nums leading-none tracking-tight">
                      {s.value}
                    </p>
                    <p className="text-[12px] sm:text-[13px] text-white/70 font-medium mt-1.5 leading-snug">
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 sm:py-28 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-5 block">
                  Vår mission
                </span>
                <h2 className="text-[28px] sm:text-[42px] font-bold text-slate-900 leading-[1.1] tracking-tight">
                  Vi gör bilförsäljning rättvis, transparent och enkel — för alla.
                </h2>
                <div className="mt-7 space-y-5 text-slate-500 text-[16px] sm:text-[17px] leading-[1.75]">
                  <p>
                    Alltför länge har den svenska bilmarknaden präglats av osäkerhet: otydliga värderingar, dolda avgifter och köpare som sitter med informationsövertaget. Vi bestämde oss för att ändra på det.
                  </p>
                  <p>
                    Idag hjälper Bilto tusentals bilägare att sälja sin bil på egna villkor — med konkurrerande bud från handlare som är granskade innan de ens släpps in i vårt nätverk.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3] bg-slate-100">
                  <img
                    src="/Man_in_car_showroom_portrait.png"
                    alt="Alexander, VD och medgrundare"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 border border-slate-100 max-w-[200px] sm:max-w-[220px]">
                  <p className="text-[15px] sm:text-[16px] font-bold text-slate-900 leading-tight">Alexander</p>
                  <p className="text-[12px] sm:text-[13px] text-slate-400 mt-0.5">VD och medgrundare</p>
                  <div className="flex gap-0.5 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 sm:py-28 bg-slate-50">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
              <span className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-5 block">
                Vår historia
              </span>
              <h2 className="text-[28px] sm:text-[42px] font-bold text-slate-900 leading-[1.1] tracking-tight">
                Det började med en bilförsäljning som inte gick som planerat.
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 sm:gap-10">
              <div className="bg-white rounded-2xl p-7 sm:p-10 border border-slate-100">
                <p className="text-[16px] sm:text-[17px] text-slate-600 leading-[1.75]">
                  Redan efter några år i bilbranschen blev det tydligt hur utsatt man är som privat säljare. Värderingen på exakt samma bil kunde skilja sig dramatiskt mellan olika handlare, och vägen till en rimlig affär krävde tålamod, kunskap och många timmar i telefon.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-7 sm:p-10 border border-slate-100">
                <p className="text-[16px] sm:text-[17px] text-slate-600 leading-[1.75]">
                  Det fanns ingen plats där vanliga bilägare kunde mötas av flera seriösa handlare på en och samma gång — på lika villkor. Den luckan ville vi stänga. Bilto är tjänsten vi själva saknade: enkel, öppen och byggd för att säljaren alltid ska gå därifrån som vinnare.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 sm:py-28 bg-white">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12 sm:mb-16">
              <span className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-5 block">
                Det vi står för
              </span>
              <h2 className="text-[28px] sm:text-[42px] font-bold text-slate-900 leading-[1.1] tracking-tight">
                Tre grundpelare som genomsyrar hela Bilto.
              </h2>
              <p className="mt-5 text-[16px] sm:text-[17px] text-slate-500 leading-[1.7]">
                Vi har utvecklat egna kvalitetskrav, rutiner och digitala verktyg för att lyfta standarden i varje affär.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              {VALUES.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="group bg-slate-50 hover:bg-[#0e6efe] rounded-2xl p-7 sm:p-8 transition-colors duration-300">
                    <div className="w-11 h-11 rounded-xl bg-[#0e6efe] group-hover:bg-white/20 flex items-center justify-center mb-6 transition-colors duration-300">
                      <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <h3 className="text-[17px] sm:text-[18px] font-bold text-slate-900 group-hover:text-white mb-3 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-[14.5px] sm:text-[15px] text-slate-500 group-hover:text-white/80 leading-[1.7] transition-colors duration-300">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Promise */}
        <section className="py-16 sm:py-28 bg-slate-50">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <div>
                <span className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.22em] mb-5 block">
                  Vårt löfte
                </span>
                <h2 className="text-[28px] sm:text-[42px] font-bold text-slate-900 leading-[1.1] tracking-tight">
                  Allt vi gör börjar och slutar med dig som kund.
                </h2>
                <p className="mt-6 text-[16px] sm:text-[17px] text-slate-500 leading-[1.7]">
                  Genom att lyssna, förenkla och förfina växer vi — och det är så vi fortsätter att förändra en bransch som alltför länge stått still.
                </p>
                <button
                  type="button"
                  onClick={onBackHome}
                  className="mt-8 inline-flex items-center gap-2 h-12 px-7 rounded-full bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-[15px] transition group"
                >
                  Värdera din bil
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </button>
              </div>

              <dl className="divide-y divide-slate-200 border-t border-slate-200">
                {PROMISES.map((item) => (
                  <div key={item.title} className="grid grid-cols-[36px_1fr] gap-x-5 sm:gap-x-8 py-6 sm:py-7">
                    <dt className="text-[13px] font-semibold text-slate-300 tabular-nums pt-1">
                      {item.num}
                    </dt>
                    <dd>
                      <p className="text-[17px] sm:text-[18px] font-bold text-slate-900 tracking-tight mb-1.5">
                        {item.title}
                      </p>
                      <p className="text-[14.5px] sm:text-[15px] text-slate-500 leading-[1.65]">
                        {item.text}
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>
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
            />
          </div>
          <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <h2 className="text-[30px] sm:text-[48px] font-bold text-white leading-[1.1] tracking-tight max-w-2xl mx-auto">
              Redo att sälja på dina villkor?
            </h2>
            <p className="mt-5 sm:mt-6 text-white/80 text-[16px] sm:text-[18px] leading-[1.7] max-w-lg mx-auto">
              Få in bud från granskade handlare på några minuter. Du väljer — vi sköter resten.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={onBackHome}
                className="inline-flex items-center justify-center gap-2 h-13 sm:h-14 px-8 rounded-full bg-white text-[#0e6efe] hover:bg-slate-50 font-bold text-[15px] sm:text-[16px] transition shadow-lg group"
              >
                Värdera din bil gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
              </button>
              <a
                href="/gratis-konsultation"
                className="inline-flex items-center justify-center h-13 sm:h-14 px-8 rounded-full border-2 border-white/40 text-white font-semibold text-[15px] sm:text-[16px] hover:border-white/70 transition"
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
