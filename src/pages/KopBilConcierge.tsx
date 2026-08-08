import { useEffect, useState, Suspense, lazy } from 'react';
import { ArrowRight, Check, ChevronDown, Menu, Minus, Phone, Star, X } from 'lucide-react';
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
  { q: 'Vad ingår i Bilköptjänsten?', a: 'Vi söker bilar åt dig, granskar alternativ, bokar provkörning, förhandlar pris, kontrollerar kontrakt och ser till att affären är trygg från start till slut.' },
  { q: 'Kostar Bilköptjänsten något?', a: 'Bilköptjänsten kostar 4 995 kr i fast avgift – betalas bara om affären blir av. Inga dolda kostnader, noll provision.' },
  { q: 'Kan ni hjälpa med leasing?', a: 'Ja, vi jämför leasingalternativ, förklarar villkoren och ser till att du inte binder dig till ett ofördelaktigt avtal.' },
  { q: 'Vad är er återbetalningspolicy?', a: 'Betalar du avgiften i förskott och ingen affär blir av, får du tillbaka hela beloppet. Ingen risk för dig.' },
  { q: 'Hur lång tid tar det att komma igång?', a: 'Efter ditt första samtal börjar vi söka inom 24 timmar. De flesta kunder har ett konkret alternativ inom 3–7 dagar.' },
];

const COMPARISON_GROUPS = [
  {
    group: 'Handlarkontakt & förhandling',
    rows: [
      { label: 'Kontaktar handlare åt dig', desc: 'Vi ringer upp först – ditt nummer lämnas aldrig ut.', diy: false, bilto: true },
      { label: 'Förhandlar totalpris', desc: 'Pris inklusive avgifter och skatt, inte bara listpriset.', diy: false, bilto: true },
      { label: 'Sorterar bort dolda avgifter', desc: 'Tackar nej till onödiga tillägg, dokumentavgifter och påhittade kostnader.', diy: false, bilto: true },
      { label: 'Förhandlar med flera handlare parallellt', desc: 'Flera handlare konkurrerar om din affär samtidigt.', diy: false, bilto: true },
      { label: 'Motbud och uppföljning', desc: 'Vi pressar tillbaka på dåliga bud och låter handlarna tävla.', diy: false, bilto: true },
    ],
  },
  {
    group: 'Mänsklig expertis',
    rows: [
      { label: 'Dedikerad bilexpert på din affär', desc: 'En namngiven expert som äger affären från start till slut.', diy: false, bilto: true },
      { label: 'Tar handlarsamtalen', desc: 'Vi plockar upp telefonen när det spelar roll.', diy: false, bilto: true },
      { label: 'Direkt kontakt med din expert', desc: 'Mejl, telefon, sms eller chatt – du når oss när du vill.', diy: false, bilto: true },
      { label: 'Provkörning bokas åt dig', desc: 'Vi ringer handlaren och bekräftar tiden med dig.', diy: false, bilto: true },
      { label: 'Granskning av papper', desc: 'Vi läser varje sida innan du skriver under.', diy: false, bilto: true },
      { label: 'Leverans & upphämtning', desc: 'Vi bokar hemkörning, transport eller upphämtning.', diy: false, bilto: true },
    ],
  },
  {
    group: 'Hastighet & tillgänglighet',
    rows: [
      { label: 'Tid till första uppdatering', desc: 'Vi kontaktar handlare direkt efter ditt första samtal.', diy: 'Dagar till veckor', bilto: '24–48 timmar' },
      { label: 'Kvällar & helger', desc: 'Vi finns tillgängliga när det passar dig.', diy: false, bilto: true },
    ],
  },
  {
    group: 'Biltyper',
    rows: [
      { label: 'Nya bilar', desc: '', diy: true, bilto: true },
      { label: 'Begagnade bilar', desc: '', diy: true, bilto: true },
      { label: 'Leasing', desc: '', diy: true, bilto: true },
      { label: 'Inbyteskoordinering', desc: 'Vi hämtar bud på din gamla bil och förhandlar inbytespriset.', diy: false, bilto: true },
      { label: 'Köp i hela Sverige', desc: '', diy: true, bilto: true },
    ],
  },
  {
    group: 'Pris',
    rows: [
      { label: 'Fast avgift', desc: 'Engångsbelopp. Inga provisioner, inga dolda kostnader.', diy: '0 kr', bilto: '4 995 kr' },
      { label: 'Vad avgiften täcker', desc: 'En bilsökning = en bil du försöker köpa. Jämför så många modeller du vill – fortfarande en avgift.', diy: '—', bilto: 'En bilsökning' },
      { label: 'När betalas det', desc: '', diy: '—', bilto: 'Vid affärens slut' },
      { label: 'Alla märken och modeller', desc: '', diy: true, bilto: true },
    ],
  },
];

const FEATURE_CARDS = [
  { icon: 'phone', title: 'Kontaktar handlare åt dig', body: 'Vi ringer upp först. Ditt telefonnummer lämnas aldrig ut till handlaren.' },
  { icon: 'tag', title: 'Förhandlar totalpris', body: 'Vi siktar på totalpriset inklusive avgifter och skatt – inte bara listpriset.' },
  { icon: 'scissors', title: 'Sorterar bort dolda avgifter', body: 'Vi tackar nej till dokumentavgifter, lacklaminering och andra påhittade tillägg.' },
  { icon: 'layers', title: 'Förhandlar med flera parallellt', body: 'Flera handlare konkurrerar om din affär samtidigt – det ger dig bättre pris.' },
  { icon: 'user', title: 'Dedikerad bilexpert', body: 'En namngiven expert med års erfarenhet äger din affär från start till slut.' },
  { icon: 'file', title: 'Granskar papperen', body: 'Vi läser varje sida innan du skriver under. Inga konstiga villkor.' },
  { icon: 'car', title: 'Provkörning & leverans', body: 'Vi bokar provkörning, hemkörning eller upphämtning – som passar dig.' },
  { icon: 'repeat', title: 'Inbyteskoordinering', body: 'Vi hämtar bud på din gamla bil och förhandlar inbytespriset åt dig.' },
];

const STATS = [
  { value: '15 000+ kr', label: 'Genomsnittlig besparing per affär' },
  { value: '6 år', label: 'På bilens sida' },
  { value: '100+', label: 'Genomförda bilaffärer' },
  { value: 'Hela Sverige', label: 'Vi jobbar överallt' },
];

const CUSTOMER_RESULTS = [
  { name: 'Nina', car: 'Volkswagen Tiguan', saving: '22 000 kr', text: 'Jag fick hjälp med hela bilköpet och slapp all stress. Processen var super smidig.' },
  { name: 'Jako', car: 'Porsche Macan', saving: '18 500 kr', text: 'De hittade rätt bil, bytte min gamla och förhandlade den nya. Allt gick snabbt och professionellt.' },
  { name: 'Michael', car: 'Volvo XC60', saving: '15 000 kr', text: 'Jag fick bättre pris och vinterhjul utan extra kostnad. Rekommenderar verkligen Bilto.' },
];

function FeatureIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z',
    scissors: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6-12l8-8m-8 0l8 8',
    layers: 'M12 2l9 5-9 5-9-5 9-5zm0 12l9 5-9 5-9-5 9-5z',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    car: 'M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M3 11l1.5-5h15L21 11M3 11h18v6H3z',
    repeat: 'M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
  };
  const d = icons[name] || icons.phone;
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

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
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#e7f3ff] via-[#f2f8ff] to-[#f7f9fc] pt-32 sm:pt-40 pb-16 sm:pb-24">
          <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-8">
            <div className="max-w-4xl mb-10 sm:mb-14">
              <p className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.2em] text-[#0e6efe] mb-4">Bilto Bilköptjänsten</p>
              <h1 className="text-[32px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.05] tracking-[-0.04em] text-slate-700">Vi förhandlar din nästa bil.<br /><span>Du hämtar nycklarna.</span></h1>
              <p className="mt-7 max-w-3xl text-[16px] sm:text-[19px] leading-[1.5] text-slate-500">En personlig bilexpert sköter sökning, research, förhandling och papper åt dig. Köp eller leasing, ny eller begagnad, alla märken. Osäker på vad som passar? <a href="/gratis-konsultation" className="text-[#0e6efe] font-semibold underline">Boka ett gratis samtal</a> – vi lyssnar och rekommenderar rätt väg, utan säljtryck.</p>
              <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => openBuyDrawer()} className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#0e6efe] text-white font-bold hover:bg-[#0a57cc] transition shadow-lg shadow-[#0e6efe]/20">Kom igång <ArrowRight className="w-5 h-5" /></button><a href="/gratis-konsultation" className="inline-flex items-center h-12 px-6 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:border-[#0e6efe] transition">Boka ett gratis samtal</a></div>
            </div>
            <div className="rounded-[28px] border border-[#69a8ff] bg-white/80 p-6 sm:p-10 shadow-[0_20px_60px_rgba(14,110,254,0.12)]">
              <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
                {[['1', 'Berätta vad du söker', 'Vi lyssnar på behov, budget och önskemål.'], ['2', 'Vi gör jobbet', 'Vi söker, granskar och förhandlar åt dig.'], ['3', 'Du väljer tryggt', 'Du får ett tydligt erbjudande och hämtar nycklarna.']].map(([number, title, text]) => <div key={number} className="flex gap-4"><span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-[#0e6efe] text-white font-bold">{number}</span><div><h2 className="font-bold text-slate-700">{title}</h2><p className="mt-1 text-[14px] leading-[1.5] text-slate-500">{text}</p></div></div>)}
              </div>
            </div>
          </div>
        </section>

        {/* Service overview - Concierge style */}
        <section className="bg-white px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-3xl mb-10">
              <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.05] tracking-[-0.04em] text-slate-700">Bilto Bilköptjänsten</h2>
              <p className="mt-4 text-[16px] sm:text-[18px] leading-[1.5] text-slate-500">En dedikerad expert från vårt team hanterar allt, från start till slut. Du skriver under papperen och hämtar nycklarna.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-[#f7f9fc] p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <img src={EXPERT_PHOTO} alt="Bilto-expert" className="w-20 h-20 rounded-2xl object-cover object-top shrink-0" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0e6efe] mb-2">År på handlarens sida. Nu på din.</p>
                  <p className="text-[15px] sm:text-[17px] leading-[1.5] text-slate-600">Vår expert har sett hur bilaffärer fungerar från insidan. Nu används den erfarenheten för att ge dig bättre villkor och en lugnare väg till rätt bil.</p>
                  <a href="/om-oss" className="mt-4 inline-flex items-center gap-2 text-[#0e6efe] font-semibold text-[14px]">Lär känna teamet <ArrowRight className="w-4 h-4" /></a>
                </div>
              </div>
            </div>
            <p className="mt-6 text-center text-[15px] sm:text-[17px] font-semibold text-slate-600">En fast avgift täcker hela sökningen. Alla märken, alla modeller – jämför så många du vill.</p>
          </div>
        </section>

        {/* Detailed comparison table */}
        <section className="bg-[#f7f9fc] px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="max-w-2xl mb-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0e6efe] mb-3">Vem sköter din affär?</p>
              <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.05] tracking-[-0.04em] text-slate-700">Gör-det-själv eller Bilto?</h2>
              <p className="mt-4 text-[16px] sm:text-[18px] leading-[1.5] text-slate-500">Båda är sätt att köpa bil. Men bara ett av dem ger dig en expert som tar samtalen, läser papperen och förhandlar priset åt dig.</p>
            </div>

            <div className="overflow-x-auto rounded-[20px] border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-5 sm:p-6 text-[13px] font-bold uppercase tracking-[0.12em] text-slate-400 align-bottom">Funktion</th>
                    <th className="text-center p-5 sm:p-6 align-bottom">
                      <p className="text-[15px] sm:text-[17px] font-bold text-slate-700">Gör det själv</p>
                      <p className="mt-1 text-[13px] text-slate-400">0 kr</p>
                    </th>
                    <th className="text-center p-5 sm:p-6 align-bottom bg-[#e8f1ff] rounded-tr-[20px]">
                      <p className="text-[15px] sm:text-[17px] font-bold text-[#0e6efe]">Bilto Bilköptjänsten</p>
                      <p className="mt-1 text-[13px] text-[#0e6efe]/70">4 995 kr fast</p>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_GROUPS.map((group) => (
                    <>
                      <tr key={group.group} className="bg-slate-50/60">
                        <td colSpan={3} className="px-5 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">{group.group}</td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.label} className="border-b border-slate-100 last:border-0">
                          <td className="p-5 sm:p-6">
                            <p className="text-[14px] sm:text-[15px] font-semibold text-slate-700">{row.label}</p>
                            {row.desc && <p className="mt-1 text-[12px] sm:text-[13px] leading-[1.4] text-slate-400">{row.desc}</p>}
                          </td>
                          <td className="p-5 sm:p-6 text-center">
                            {typeof row.diy === 'boolean' ? (
                              row.diy ? <Check className="inline w-5 h-5 text-slate-400" /> : <X className="inline w-5 h-5 text-slate-300" />
                            ) : (
                              <span className="text-[13px] sm:text-[14px] text-slate-500">{row.diy}</span>
                            )}
                          </td>
                          <td className="p-5 sm:p-6 text-center bg-[#e8f1ff]/50">
                            {typeof row.bilto === 'boolean' ? (
                              row.bilto ? <Check className="inline w-5 h-5 text-[#0e6efe]" /> : <Minus className="inline w-5 h-5 text-slate-300" />
                            ) : (
                              <span className="text-[13px] sm:text-[14px] font-semibold text-[#0e6efe]">{row.bilto}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[13px] text-slate-400">En bilsökning = en bil du försöker köpa. Jämför så många modeller, tillval och handlare du vill – fortfarande en avgift tills du kör hem en.</p>
          </div>
        </section>

        {/* Feature cards */}
        <section className="bg-white px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0e6efe] mb-3">Vad som ingår</p>
              <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.04em] text-slate-700">Allt du behöver – inget du inte behöver.</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURE_CARDS.map((card) => (
                <div key={card.title} className="rounded-2xl border border-slate-200 bg-[#f7f9fc] p-6 hover:border-[#0e6efe]/40 hover:shadow-md transition">
                  <div className="w-11 h-11 rounded-xl bg-[#0e6efe]/10 text-[#0e6efe] flex items-center justify-center mb-4">
                    <FeatureIcon name={card.icon} />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-700">{card.title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.5] text-slate-500">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats section */}
        <section className="bg-[#172b63] px-5 sm:px-8 py-16 sm:py-20 text-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300 mb-3">Siffrorna talar för sig själva</p>
              <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.04em]">Riktiga besparingar. Riktiga affärer.</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] text-white">{stat.value}</p>
                  <p className="mt-2 text-[13px] sm:text-[14px] leading-[1.4] text-blue-200">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Customer results */}
        <section className="bg-white px-5 sm:px-8 py-16 sm:py-24 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0e6efe] mb-3">Riktiga kunder. Riktiga besparingar.</p>
              <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.04em] text-slate-700">Se vad Bilto har gjort för andra.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {CUSTOMER_RESULTS.map((customer) => (
                <article key={customer.name} className="relative min-h-[270px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#173f79] to-[#0e6efe] p-6 flex flex-col justify-end text-white">
                  <div className="absolute top-5 right-5 rounded-full bg-emerald-400 px-3 py-1 text-[12px] font-bold text-white">Sparade {customer.saving}</div>
                  <div className="mb-auto">
                    <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 text-amber-300" fill="currentColor" strokeWidth={0} />)}</div>
                  </div>
                  <p className="text-[16px] leading-[1.5] font-medium">"{customer.text}"</p>
                  <div className="mt-5 pt-4 border-t border-white/20">
                    <p className="font-bold">{customer.name}</p>
                    <p className="text-[13px] text-white/70">{customer.car}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Expert section */}
        <section className="bg-[#edf4fc] px-5 sm:px-8 py-16 sm:py-24">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <img src="/BSM_car_sale_key_woman_handover_101122.jpg" alt="Bilexpert hjälper kund med bilköp" className="w-full h-[320px] sm:h-[420px] object-cover rounded-[28px] shadow-lg" loading="lazy" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0e6efe] mb-4">På din sida</p>
              <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.05] tracking-[-0.04em] text-slate-700">År på handlarens sida. Nu på din.</h2>
              <p className="mt-5 text-[16px] sm:text-[18px] leading-[1.6] text-slate-500">Vi har sett hur bilaffärer fungerar från insidan. Nu använder vi den erfarenheten för att ge dig bättre beslutsunderlag, bättre villkor och en lugnare väg till rätt bil.</p>
              <div className="mt-7 flex items-center gap-4">
                <img src={EXPERT_PHOTO} alt="Bilto-expert" className="w-14 h-14 rounded-xl object-cover object-top" />
                <div>
                  <p className="font-bold text-slate-700">Din personliga Bilto-expert</p>
                  <p className="text-[14px] text-slate-500">Med dig från första samtal till nycklar.</p>
                </div>
              </div>
              <a href="/om-oss" className="mt-7 inline-flex items-center gap-2 text-[#0e6efe] font-semibold">Lär känna teamet <ArrowRight className="w-4 h-4" /></a>
            </div>
          </div>
        </section>

        <ReviewsSection variant="muted" />

        {/* Pricing section */}
        <section className="bg-[#eef4fb] px-5 sm:px-8 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0e6efe] mb-3">Priset i korthet</p>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.04em] text-slate-700">En fast avgift. Inget krångel.</h2>
              <a href="/gratis-konsultation" className="text-[#0e6efe] font-semibold hover:underline">Osäker? Prata med oss <ArrowRight className="inline w-4 h-4" /></a>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl p-6 border border-slate-200 bg-white text-slate-700">
                <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-slate-400">Gör det själv</p>
                <p className="mt-4 text-[32px] font-bold tracking-[-0.04em]">0 kr</p>
                <p className="mt-2 min-h-[48px] text-[14px] leading-[1.5] text-slate-500">Du söker, jämför och förhandlar själv.</p>
                <a href="/" className="mt-6 inline-flex items-center font-semibold text-[14px] text-[#0e6efe]">Sök själv <ArrowRight className="inline w-4 h-4" /></a>
              </div>
              <div className="rounded-2xl p-6 border-2 border-[#0e6efe] bg-[#0e6efe] text-white shadow-xl shadow-[#0e6efe]/20 relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-[11px] font-bold text-slate-800 uppercase tracking-wide">Populärast</span>
                <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-white/70">Bilto Bilköptjänsten</p>
                <p className="mt-4 text-[32px] font-bold tracking-[-0.04em]">4 995 kr</p>
                <p className="mt-2 min-h-[48px] text-[14px] leading-[1.5] text-white/80">En personlig expert sköter hela bilaffären åt dig. Betalas bara om affären blir av.</p>
                <button type="button" onClick={() => openBuyDrawer()} className="mt-6 inline-flex items-center font-semibold text-[14px] text-white">Kom igång <ArrowRight className="inline w-4 h-4" /></button>
              </div>
              <div className="rounded-2xl p-6 border border-slate-200 bg-white text-slate-700">
                <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-slate-400">Kostnadsfritt samtal</p>
                <p className="mt-4 text-[32px] font-bold tracking-[-0.04em]">0 kr</p>
                <p className="mt-2 min-h-[48px] text-[14px] leading-[1.5] text-slate-500">15 minuter med någon i vårt team. Vi rekommenderar rätt väg.</p>
                <a href="/gratis-konsultation" className="mt-6 inline-flex items-center font-semibold text-[14px] text-[#0e6efe]">Boka samtal <ArrowRight className="inline w-4 h-4" /></a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#172b63] px-5 sm:px-8 py-16 sm:py-24 text-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center text-[28px] sm:text-[40px] font-bold tracking-[-0.04em]">Vanliga frågor</h2>
            <p className="mt-3 text-center text-[15px] text-blue-200">Frågorna vi får oftast innan kunder kommer igång. Saknas något? Teamet finns ett samtal bort.</p>
            <div className="mt-10 divide-y divide-white/15">
              {FAQS.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <button key={faq.q} type="button" onClick={() => setOpenFaq(open ? null : i)} className="w-full py-5 text-left flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-[16px] sm:text-[18px] font-semibold">{faq.q}</h3>
                      {open && <p className="mt-3 text-[14px] sm:text-[16px] leading-[1.6] text-blue-100">{faq.a}</p>}
                    </div>
                    <ChevronDown className={`w-5 h-5 shrink-0 mt-0.5 text-blue-200 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#f7f9fc] px-5 sm:px-8 py-16 sm:py-24 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-[30px] sm:text-[44px] font-bold tracking-[-0.04em] text-slate-700">Så borde bilköp fungera.</h2>
            <p className="mt-4 text-[16px] sm:text-[18px] leading-[1.5] text-slate-500">Börja med ett kostnadsfritt samtal på 15 minuter. Vi berättar vad som passar dig, även om svaret är att du inte behöver vår hjälp än.</p>
            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
              <button type="button" onClick={() => openBuyDrawer()} className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#0e6efe] text-white font-bold hover:bg-[#0a57cc] transition">Starta med Bilto <ArrowRight className="w-5 h-5" /></button>
              <a href={PHONE_TEL} className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold"><Phone className="w-4 h-4" /> Ring {PHONE}</a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      {scrolled && <a href={PHONE_TEL} className="md:hidden fixed bottom-4 left-3 right-3 z-40 flex items-center gap-3 px-4 h-[58px] rounded-xl bg-[#0e6efe] text-white font-semibold shadow-lg"><img src={EXPERT_PHOTO} alt="Expert" className="w-9 h-9 rounded object-cover object-top" /><span className="flex-1 text-[15px]">Ring en bilexpert</span><span className="text-[13px]">Ring <Phone className="inline w-4 h-4" /></span></a>}
      <Suspense fallback={null}><BuyDrawer car={buyDrawerCar} onBack={onBack} onClose={() => setBuyDrawerCar(null)} /></Suspense>
    </div>
  );
}
