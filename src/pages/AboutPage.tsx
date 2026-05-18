import { useState } from 'react';
import { ArrowRight, Menu, User, ShieldCheck, Handshake, Gauge } from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from './BrokerageLanding';

interface AboutPageProps {
  onBackHome: () => void;
}

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

      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
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
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" />
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
              href="/logga-in"
              className="inline-flex items-center gap-2 bg-white text-[#0e6efe] text-[14px] font-semibold px-5 h-10 rounded-full hover:bg-slate-100 transition whitespace-nowrap"
            >
              <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
              Logga in
            </a>
          </div>
        </div>
      </header>

      <main className="pt-24 sm:pt-28">
        <section className="bg-white">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-6 pt-10 pb-10 sm:pt-20 sm:pb-16">
            <span className="inline-block text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.24em] mb-5 sm:mb-6">
              Om Bilto
            </span>
            <h1 className="text-[34px] sm:text-[56px] lg:text-[78px] font-semibold leading-[1.05] tracking-[-0.02em] text-slate-900 max-w-4xl">
              En tryggare väg genom den svenska bilaffären.
            </h1>
            <p className="mt-6 sm:mt-8 text-[16px] sm:text-[19px] leading-[1.65] text-slate-600 max-w-2xl">
              Bilto är offerttjänsten som kopplar samman privatpersoner med kvalitetsgranskade
              bilhandlare — för ett högre slutpris, en enklare process och en affär som håller hela
              vägen.
            </p>
          </div>

          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 pb-14 sm:pb-24">
            <div className="relative rounded-[18px] sm:rounded-[24px] overflow-hidden aspect-[16/10] sm:aspect-[16/8] bg-slate-100">
              <img
                src="/reklamation.webp"
                alt="Bilförsäljning"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border-t border-slate-100">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-6 py-14 sm:py-24">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-20">
              <div className="lg:col-span-4">
                <span className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.24em]">
                  Vår mission
                </span>
              </div>
              <div className="lg:col-span-8">
                <h2 className="mt-3 lg:mt-0 text-[26px] sm:text-[40px] font-semibold text-slate-900 leading-[1.15] tracking-[-0.02em]">
                  Vi är här för att göra bilförsäljning rättvis, transparent och enkel — för alla.
                </h2>
                <div className="mt-6 sm:mt-8 space-y-5 text-slate-600 text-[16px] sm:text-[17px] leading-[1.75]">
                  <p>
                    Alltför länge har den svenska bilmarknaden präglats av osäkerhet: otydliga
                    värderingar, dolda avgifter och köpare som sitter med informationsövertaget. Vi
                    bestämde oss för att ändra på det.
                  </p>
                  <p>
                    Idag hjälper Bilto tusentals bilägare att sälja sin bil på egna villkor — med
                    konkurrerande bud från handlare som är granskade innan de ens släpps in i vårt
                    nätverk. Resultatet är enklare affärer, bättre priser och en upplevelse som
                    säljaren faktiskt kan känna sig trygg med.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 border-t border-slate-100">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-14 sm:py-24">
            <div className="grid lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-5">
                <div className="relative rounded-[16px] sm:rounded-[20px] overflow-hidden bg-slate-200 aspect-[4/5]">
                  <img
                    src="/Man_in_car_showroom_portrait.png"
                    alt="Alexander, VD och medgrundare"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-4 sm:mt-5">
                  <p className="text-[16px] sm:text-[17px] font-semibold text-slate-900">Alexander</p>
                  <p className="text-[13px] sm:text-[14px] text-slate-500">VD och medgrundare</p>
                </div>
              </div>

              <div className="lg:col-span-7">
                <span className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.24em] mb-4 sm:mb-5 block">
                  Vår historia
                </span>
                <h2 className="text-[26px] sm:text-[38px] font-semibold text-slate-900 leading-[1.18] tracking-[-0.01em]">
                  Det började med en egen bilförsäljning som inte gick som planerat.
                </h2>
                <div className="mt-6 sm:mt-7 space-y-5 text-slate-600 text-[15.5px] sm:text-[16.5px] leading-[1.75]">
                  <p>
                    Redan efter några år i bilbranschen blev det tydligt hur utsatt man är som
                    privat säljare. Värderingen på exakt samma bil kunde skilja sig dramatiskt
                    mellan olika handlare, och vägen till en rimlig affär krävde både tålamod,
                    kunskap och många timmar i telefon.
                  </p>
                  <p>
                    Det fanns helt enkelt ingen plats där vanliga bilägare kunde mötas av flera
                    seriösa handlare på en och samma gång — på lika villkor. Den luckan ville vi
                    stänga. Bilto är tjänsten vi själva saknade: enkel, öppen och byggd för att
                    säljaren alltid ska gå därifrån som vinnare.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-t border-slate-100">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-6 py-14 sm:py-24">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-20 mb-10 sm:mb-14">
              <div className="lg:col-span-4">
                <span className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.24em]">
                  Det vi står för
                </span>
              </div>
              <div className="lg:col-span-8">
                <h2 className="mt-3 lg:mt-0 text-[26px] sm:text-[40px] font-semibold text-slate-900 leading-[1.15] tracking-[-0.02em]">
                  Tre grundpelare som genomsyrar hela Bilto.
                </h2>
                <p className="mt-5 sm:mt-6 text-slate-600 text-[16px] sm:text-[17px] leading-[1.7] max-w-2xl">
                  Vi har utvecklat våra egna kvalitetskrav, rutiner och digitala verktyg för att
                  lyfta standarden i varje affär — så att både du som säljer och handlaren som
                  köper vet precis vilka villkor som gäller.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-px bg-slate-200 rounded-[16px] sm:rounded-[20px] overflow-hidden border border-slate-200">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Utvalda bilhandlare',
                  text: 'Alla handlare i nätverket går igenom en noggrann kontroll — av ekonomi, kundrecensioner och tidigare affärer — innan de ens får se en enda bil hos oss.',
                },
                {
                  icon: Gauge,
                  title: 'Genomtänkta flöden',
                  text: 'Processerna är slipade genom tusentals verkliga affärer — steg för steg, så att du som säljare sparar tid, får ett bättre pris och känner dig trygg hela vägen.',
                },
                {
                  icon: Handshake,
                  title: 'Teknik med ett syfte',
                  text: 'Varje del av plattformen är byggd kring samma mål: att maximera ditt slutpris och göra affären enkel, tydlig och smidig från första klick till överlämning.',
                },
              ].map((item) => (
                <div key={item.title} className="bg-white p-6 sm:p-10">
                  <div className="w-11 h-11 rounded-xl bg-[#0e6efe] text-white flex items-center justify-center mb-5 sm:mb-6">
                    <item.icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <h3 className="text-[18px] sm:text-[19px] font-semibold text-slate-900 mb-2 sm:mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-[14.5px] sm:text-[15px] text-slate-600 leading-[1.7]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white border-t border-slate-100">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-6 py-14 sm:py-24">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">
              <div>
                <span className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.24em] mb-4 sm:mb-5 block">
                  Vårt löfte
                </span>
                <h2 className="text-[26px] sm:text-[38px] font-semibold text-slate-900 leading-[1.18] tracking-[-0.01em]">
                  Allt vi gör börjar och slutar med dig som kund.
                </h2>
                <p className="mt-5 sm:mt-6 text-slate-600 text-[16px] sm:text-[17px] leading-[1.7]">
                  Genom att lyssna, förenkla och förfina växer vi — och det är så vi fortsätter att
                  förändra en bransch som alltför länge stått still.
                </p>
              </div>

              <div>
                <dl className="border-t border-slate-200">
                  {[
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
                  ].map((item) => (
                    <div key={item.title} className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-8 py-5 sm:py-6 border-b border-slate-200">
                      <dt className="text-[13px] font-medium text-slate-400 tabular-nums pt-0.5">
                        {item.num}
                      </dt>
                      <dd>
                        <p className="text-[17px] sm:text-[18px] font-semibold text-slate-900 tracking-[-0.01em] mb-1.5">{item.title}</p>
                        <p className="text-[15px] text-slate-600 leading-[1.65]">{item.text}</p>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0e6efe] text-white">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-6 py-14 sm:py-24">
            <div className="grid lg:grid-cols-12 gap-8 lg:items-end">
              <div className="lg:col-span-8">
                <span className="text-[11px] font-semibold text-white/70 uppercase tracking-[0.24em] mb-4 sm:mb-5 block">
                  Kom igång
                </span>
                <h2 className="text-[28px] sm:text-[44px] font-semibold leading-[1.12] tracking-[-0.02em] text-white">
                  Redo att sälja på dina villkor?
                </h2>
                <p className="mt-5 sm:mt-6 text-white/85 text-[16px] sm:text-[17px] leading-[1.7] max-w-xl">
                  Få in bud från granskade handlare på några minuter. Du väljer — vi sköter resten.
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <button
                  type="button"
                  onClick={onBackHome}
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-white text-[#0e6efe] hover:bg-slate-100 font-semibold text-[15px] transition"
                >
                  Värdera din bil
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
