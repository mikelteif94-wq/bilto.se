import { useEffect, useState, Suspense, lazy } from 'react';
import { ArrowRight, ChevronDown, Menu, Phone, Star } from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { setPageMeta } from '../lib/pageMeta';
import { PHONE, PHONE_TEL, EXPERT_PHOTO } from '../config/site';
import ReviewsSection from '../components/ReviewsSection';

const BuyDrawer = lazy(() => import('../components/BuyDrawer'));

interface KopBilConciergProps {
  onBack: () => void;
  onNavigateHowItWorks: () => void;
}

const FAQS = [
  { q: 'Vad händer om jag inte hittar en bil?', a: 'Ingenting. Du tackar nej och betalar inget om ingen affär blir av.' },
  { q: 'Kan ni hjälpa mig om jag redan hittat en bil?', a: 'Absolut. Skicka länken så granskar vi bilen, kontrollerar priset och förhandlar med säljaren åt dig.' },
  { q: 'Hur lång tid tar det?', a: 'De flesta kunder har ett klart erbjudande inom 3–7 dagar. Har du redan hittat bilen kan det gå snabbare.' },
  { q: 'Hanterar ni kontakten med handlaren?', a: 'Ja. Vi tar samtalen, mejlen, förhandlingen och det finstilta. Du slipper säljsamtal och onödig stress.' },
  { q: 'Hjälper ni till med inbytesbil?', a: 'Ja. Vi värderar din bil och hämtar konkurrerande bud från handlare för att få en bättre helhetsaffär.' },
];

const COMPARISON = [
  { label: 'Vem ringer vem?', usual: 'Du fyller i formulär och får samtal från flera handlare.', bilto: 'Vi kontaktar handlaren. Ditt nummer behöver aldrig lämnas ut.' },
  { label: 'Priset', usual: 'Du får handlarens första pris och hoppas att det är bra.', bilto: 'Vi jämför marknaden och förhandlar pris, ränta och tillval.' },
  { label: 'Förhandlingen', usual: 'Du sitter själv i bilhallen under press.', bilto: 'En erfaren bilexpert förhandlar innan du behöver bestämma dig.' },
  { label: 'Det finstilta', usual: 'Avgifter och tillval kan gömma sig i avtalet.', bilto: 'Vi går igenom villkoren och ser till att affären är tydlig.' },
];

const PRICING = [
  { name: 'Gör det själv', price: '0 kr', detail: 'Du söker, jämför och förhandlar själv.', action: 'Sök själv', muted: true },
  { name: 'Bilto Bilköptjänsten', price: '4 995 kr', detail: 'En personlig expert sköter hela bilaffären åt dig.', action: 'Kom igång', featured: true },
  { name: 'Kostnadsfritt samtal', price: '0 kr', detail: '15 minuter med någon i vårt team. Vi rekommenderar rätt väg.', action: 'Boka samtal', muted: true },
];

const CUSTOMER_RESULTS = [
  { name: 'Nina', car: 'Volkswagen Tiguan', saving: '22 000 kr', text: 'Jag fick hjälp med hela bilköpet och slapp all stress. Processen var super smidig.' },
  { name: 'Jako', car: 'Porsche Macan', saving: '18 500 kr', text: 'De hittade rätt bil, bytte min gamla och förhandlade den nya. Allt gick snabbt och professionellt.' },
  { name: 'Michael', car: 'Volvo XC60', saving: '15 000 kr', text: 'Jag fick bättre pris och vinterhjul utan extra kostnad. Rekommenderar verkligen Bilto.' },
];

export default function KopBilConcierge({ onBack }: KopBilConciergProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [buyDrawerCar, setBuyDrawerCar] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const openBuyDrawer = (car?: string) => setBuyDrawerCar(car ?? '');

  useEffect(() => {
    setPageMeta({
      title: 'Bilköptjänsten – Bilto',
      description: 'Låt Biltos experter hitta, förhandla och köpa rätt bil åt dig.',
      canonical: 'https://bilto.se/kop-bil',
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Sälj bil') { onBack(); return; }
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Bilköptjänsten': '/kop-bil',
      'Bilköptjänsten': '/kop-bil',
      'Guider': '/guider',
      'Vanliga frågor': '/vanliga-fragor',
    };
    const route = routes[item];
    if (route) {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} active="Bilköptjänsten" onSelect={handleMenuSelect} />

      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)} className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white"><Menu className="w-6 h-6" /></button>
          <button type="button" onClick={onBack} className="shrink-0 flex items-center"><img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" /></button>
          <nav className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={onBack} className="text-[15px] text-white/80 hover:text-white transition font-medium">Sälj bil</button>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-[15px] text-white font-semibold">Bilköptjänsten</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/om-oss'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 hover:text-white transition font-medium">Om oss</button>
          </nav>
          <a href="/gratis-konsultation" className="ml-auto inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">Kostnadsfri konsultation</a>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-[#e7f3ff] via-[#f2f8ff] to-[#f7f9fc] pt-32 sm:pt-40 pb-16 sm:pb-24">
          <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-8">
            <div className="max-w-4xl mb-10 sm:mb-14">
              <p className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.2em] text-[#0e6efe] mb-4">Bilto Bilköptjänsten</p>
              <h1 className="text-[32px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.05] tracking-[-0.04em] text-slate-700">Vi förhandlar din nästa bil.<br /><span>Du hämtar nycklarna.</span></h1>
              <p className="mt-7 max-w-3xl text-[16px] sm:text-[19px] leading-[1.5] text-slate-500">En personlig bilexpert sköter sökning, research, förhandling och papper åt dig. Köp eller leasing, ny eller begagnad, alla märken.</p>
              <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => openBuyDrawer()} className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#0e6efe] text-white font-bold hover:bg-[#0a57cc] transition shadow-lg shadow-[#0e6efe]/20">Kom igång <ArrowRight className="w-5 h-5" /></button><a href="/gratis-konsultation" className="inline-flex items-center h-12 px-6 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-[#0e6efe] transition">Boka ett gratis samtal</a></div>
            </div>
            <div className="rounded-[28px] border border-[#69a8ff] bg-white/80 p-6 sm:p-10 shadow-[0_20px_60px_rgba(14,110,254,0.12)]">
              <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
                {[['1', 'Berätta vad du söker', 'Vi lyssnar på behov, budget och önskemål.'], ['2', 'Vi gör jobbet', 'Vi söker, granskar och förhandlar åt dig.'], ['3', 'Du väljer tryggt', 'Du får ett tydligt erbjudande och hämtar nycklarna.']].map(([number, title, text]) => <div key={number} className="flex gap-4"><span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-[#0e6efe] text-white font-bold">{number}</span><div><h2 className="font-bold text-slate-700">{title}</h2><p className="mt-1 text-[14px] leading-[1.5] text-slate-500">{text}</p></div></div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f7f9fc] px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-5xl mx-auto"><div className="max-w-2xl mb-10"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0e6efe] mb-3">Varför våra kunder sparar pengar</p><h2 className="text-[28px] sm:text-[42px] font-bold leading-[1.05] tracking-[-0.04em] text-slate-700">Handlaren har en orättvis fördel. Tills nu.</h2><p className="mt-4 text-[16px] sm:text-[18px] leading-[1.5] text-slate-500">Ett vanligt handlarbesök tar tid och kostar ofta mer än det borde. Så här ändras bilköpet när Bilto står på din sida.</p></div>
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-start"><div className="space-y-2">{COMPARISON.map((item) => <div key={item.label} className="py-5 border-b border-slate-200"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">{item.label}</p><p className="text-[15px] sm:text-[17px] leading-[1.5] text-slate-500">{item.usual}</p></div>)}</div><div className="rounded-[24px] border-2 border-[#b9d5ff] bg-[#e8f1ff] p-6 sm:p-8"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0e6efe] mb-2">Vårt sätt</p>{COMPARISON.map((item) => <div key={item.label} className="py-5 border-b last:border-0 border-[#c9dcf7]"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0e6efe] mb-2">{item.label}</p><p className="text-[15px] sm:text-[17px] leading-[1.5] text-slate-700">{item.bilto}</p></div>)}</div></div>
          </div>
        </section>

        <section className="bg-[#eef4fb] px-5 sm:px-8 py-16 sm:py-20"><div className="max-w-5xl mx-auto"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0e6efe] mb-3">Priset i korthet</p><div className="flex flex-wrap items-end justify-between gap-4 mb-8"><h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.04em] text-slate-700">Från gör-det-själv till helt klart.</h2><a href="/gratis-konsultation" className="text-[#0e6efe] font-semibold hover:underline">Osäker? Prata med oss <ArrowRight className="inline w-4 h-4" /></a></div><div className="grid md:grid-cols-3 gap-4">{PRICING.map((plan) => <div key={plan.name} className={`rounded-2xl p-6 border ${plan.featured ? 'border-[#0e6efe] bg-[#0e6efe] text-white shadow-xl shadow-[#0e6efe]/20' : 'border-slate-200 bg-white text-slate-700'}`}><p className={`text-[12px] font-bold uppercase tracking-[0.15em] ${plan.featured ? 'text-white/70' : 'text-slate-400'}`}>{plan.name}</p><p className="mt-4 text-[32px] font-bold tracking-[-0.04em]">{plan.price}</p><p className={`mt-2 min-h-[48px] text-[14px] leading-[1.5] ${plan.featured ? 'text-white/80' : 'text-slate-500'}`}>{plan.detail}</p><button type="button" onClick={() => plan.name === 'Kostnadsfritt samtal' ? undefined : openBuyDrawer()} className={`mt-6 font-semibold text-[14px] ${plan.featured ? 'text-white' : 'text-[#0e6efe]'}`}>{plan.action} <ArrowRight className="inline w-4 h-4" /></button></div>)}</div></div></section>

        <section className="bg-white px-5 sm:px-8 py-16 sm:py-24 overflow-hidden"><div className="max-w-6xl mx-auto"><div className="text-center mb-10"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0e6efe] mb-3">Riktiga kunder. Riktiga besparingar.</p><h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.04em] text-slate-700">Se vad Bilto har gjort för andra.</h2></div><div className="grid md:grid-cols-3 gap-5">{CUSTOMER_RESULTS.map((customer) => <article key={customer.name} className="relative min-h-[270px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#173f79] to-[#0e6efe] p-6 flex flex-col justify-end text-white"><div className="absolute top-5 right-5 rounded-full bg-emerald-400 px-3 py-1 text-[12px] font-bold text-white">Sparade {customer.saving}</div><div className="mb-auto"><div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 text-amber-300" fill="currentColor" strokeWidth={0} />)}</div></div><p className="text-[16px] leading-[1.5] font-medium">“{customer.text}”</p><div className="mt-5 pt-4 border-t border-white/20"><p className="font-bold">{customer.name}</p><p className="text-[13px] text-white/70">{customer.car}</p></div></article>)}</div></div></section>

        <section className="bg-[#edf4fc] px-5 sm:px-8 py-16 sm:py-24"><div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"><img src="/BSM_car_sale_key_woman_handover_101122.jpg" alt="Bilexpert hjälper kund med bilköp" className="w-full h-[320px] sm:h-[420px] object-cover rounded-[28px] shadow-lg" loading="lazy" /><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0e6efe] mb-4">På din sida</p><h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.05] tracking-[-0.04em] text-slate-700">År på handlarens sida. Nu på din.</h2><p className="mt-5 text-[16px] sm:text-[18px] leading-[1.6] text-slate-500">Vi har sett hur bilaffärer fungerar från insidan. Nu använder vi den erfarenheten för att ge dig bättre beslutsunderlag, bättre villkor och en lugnare väg till rätt bil.</p><div className="mt-7 flex items-center gap-4"><img src={EXPERT_PHOTO} alt="Bilto-expert" className="w-14 h-14 rounded-xl object-cover object-top" /><div><p className="font-bold text-slate-700">Din personliga Bilto-expert</p><p className="text-[14px] text-slate-500">Med dig från första samtal till nycklar.</p></div></div><a href="/om-oss" className="mt-7 inline-flex items-center gap-2 text-[#0e6efe] font-semibold">Lär känna teamet <ArrowRight className="w-4 h-4" /></a></div></div></section>

        <ReviewsSection variant="muted" />

        <section className="bg-[#172b63] px-5 sm:px-8 py-16 sm:py-24 text-white"><div className="max-w-3xl mx-auto"><h2 className="text-center text-[28px] sm:text-[40px] font-bold tracking-[-0.04em]">Vanliga frågor</h2><div className="mt-10 divide-y divide-white/15">{FAQS.map((faq, i) => { const open = openFaq === i; return <button key={faq.q} type="button" onClick={() => setOpenFaq(open ? null : i)} className="w-full py-5 text-left flex items-start gap-4"><div className="flex-1"><h3 className="text-[16px] sm:text-[18px] font-semibold">{faq.q}</h3>{open && <p className="mt-3 text-[14px] sm:text-[16px] leading-[1.6] text-blue-100">{faq.a}</p>}</div><ChevronDown className={`w-5 h-5 shrink-0 mt-0.5 text-blue-200 transition-transform ${open ? 'rotate-180' : ''}`} /></button>; })}</div></div></section>

        <section className="bg-[#f7f9fc] px-5 sm:px-8 py-16 sm:py-24 text-center"><div className="max-w-2xl mx-auto"><h2 className="text-[30px] sm:text-[44px] font-bold tracking-[-0.04em] text-slate-700">Så borde bilköp fungera.</h2><p className="mt-4 text-[16px] sm:text-[18px] leading-[1.5] text-slate-500">Börja med ett kostnadsfritt samtal på 15 minuter. Vi berättar vad som passar dig, även om svaret är att du inte behöver vår hjälp än.</p><div className="mt-7 flex flex-col sm:flex-row justify-center gap-3"><button type="button" onClick={() => openBuyDrawer()} className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#0e6efe] text-white font-bold hover:bg-[#0a57cc] transition">Starta med Bilto <ArrowRight className="w-5 h-5" /></button><a href={PHONE_TEL} className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold"><Phone className="w-4 h-4" /> Ring {PHONE}</a></div></div></section>
      </main>

      <SiteFooter />
      {scrolled && <a href={PHONE_TEL} className="md:hidden fixed bottom-4 left-3 right-3 z-40 flex items-center gap-3 px-4 h-[58px] rounded-xl bg-[#0e6efe] text-white font-semibold shadow-lg"><img src={EXPERT_PHOTO} alt="Expert" className="w-9 h-9 rounded object-cover object-top" /><span className="flex-1 text-[15px]">Ring en bilexpert</span><span className="text-[13px]">Ring <Phone className="inline w-4 h-4" /></span></a>}
      <Suspense fallback={null}><BuyDrawer car={buyDrawerCar} onBack={onBack} onClose={() => setBuyDrawerCar(null)} /></Suspense>
    </div>
  );
}
