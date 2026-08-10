import { useState, Suspense, lazy } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  Check,
  CircleDollarSign,
  Gem,
  LockKeyhole,
  Menu,
  MessageSquare,
  Percent,
  ShieldCheck,
  Tag,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { type MobileMenuItem } from '../components/MobileMenu';
import { setPageMeta } from '../lib/pageMeta';

const BuyDrawer = lazy(() => import('../components/BuyDrawer'));

interface HomePageProps {
  onNavigate: (regnummer: string, telefon: string) => void;
  onNavigateBuy?: (bil?: string) => void;
  onNavigateSell?: () => void;
  onNavigateHowItWorks?: () => void;
  showSeo?: boolean;
  pageTitle?: string;
}

type IconType = typeof Tag;

const packages: Array<{
  name: string;
  description: string;
  price: string;
  icon: IconType;
  popular?: boolean;
  items: string[];
}> = [
  {
    name: 'Bas',
    description: 'För dig som vill ha hjälp med förhandlingen.',
    price: '4 995 kr',
    icon: CarFront,
    items: ['Personlig rådgivare', 'Kontakt med relevanta handlare', 'Förhandling av pris', 'Jämförelse av bud', 'Presentation av bästa alternativ'],
  },
  {
    name: 'Plus',
    description: 'Mer än bara förhandling – vi hjälper dig hela vägen.',
    price: '9 995 kr',
    icon: BadgeCheck,
    popular: true,
    items: ['Allt i Bas, plus:', 'Granskning av bil och historik', 'Förhandling av villkor och garanti', 'Hjälp med inbyte av din bil', 'Rådgivning kring finansiering', 'Stöd genom hela affären'],
  },
  {
    name: 'Premium',
    description: 'Vår mest omfattande tjänst för en trygg och smidig affär.',
    price: '14 995 kr',
    icon: Gem,
    items: ['Allt i Plus, plus:', 'Leverans av bilen till dig', 'Hämtning av nuvarande bil', 'Administrativ hantering av avtal', 'Prioriterad handläggning', 'Efteraffärsuppföljning'],
  },
];

const extras = [
  { icon: Wrench, name: 'Besiktning & testkörning', detail: 'Oberoende kontroll av bilen.', price: '2 495 kr' },
  { icon: CarFront, name: 'Värdering av din bil', detail: 'Professionell värdering inför försäljning eller inbyte.', price: '1 495 kr' },
  { icon: ShieldCheck, name: 'Försäkringshjälp', detail: 'Vi hjälper dig hitta rätt försäkring.', price: '1 495 kr' },
  { icon: CircleDollarSign, name: 'Snabbare process', detail: 'Prioriterad handläggning.', price: '1 995 kr' },
];

const processSteps = [
  ['Berätta vad du vill göra', 'Köp, sälj eller byt – och beskriv dina önskemål.'],
  ['Vi hittar rätt handlare', 'Vi kontaktar relevanta och granskade handlare.'],
  ['Vi förhandlar', 'Vi jämför bud, ställer handlarna mot varandra och förhandlar pris och villkor.'],
  ['Du får bästa alternativ', 'Vi presenterar resultatet tydligt och du väljer själv om du vill genomföra affären.'],
];

const trustItems = [
  { icon: UserRound, title: 'Du bestämmer alltid', text: 'Du väljer själv om du vill genomföra affären.' },
  { icon: BadgeCheck, title: 'Ingen förpliktelse', text: 'Det kostar inget att få hjälp med rådgivning.' },
  { icon: LockKeyhole, title: 'Säker betalning', text: 'Trygga betalningslösningar genom vår partner.' },
  { icon: Check, title: 'Nöjd kund-garanti', text: 'Skulle du inte vara nöjd får du hjälp tills allt känns rätt.' },
];

function BrandMark() {
  return (
    <span className="flex items-center gap-2.5 text-[#0b1b3a]">
      <span className="relative flex h-7 w-7 items-center justify-center rounded-[3px] border-[1.5px] border-[#0b1b3a]">
        <span className="absolute h-[1.5px] w-8 rotate-45 bg-[#0b1b3a]" />
        <span className="absolute h-[1.5px] w-8 -rotate-45 bg-[#0b1b3a]" />
      </span>
      <span className="text-[22px] font-extrabold tracking-[-0.05em]">BILTO</span>
    </span>
  );
}

function ProcessIllustration() {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-[0_3px_12px_rgba(15,23,42,0.04)]">
      <div className="mb-3 text-center text-[12px] font-semibold text-slate-800">Så kan en förhandling se ut</div>
      <div className="grid grid-cols-[1fr_24px_1fr_24px_1fr] items-stretch">
        <div className="flex flex-col items-center justify-between border border-slate-200 p-3 text-center">
          <p className="text-[10px] font-semibold text-slate-800">Bilhandlarens<br />första pris</p>
          <p className="my-3 text-[16px] font-bold text-slate-900">349 000 kr</p>
          <CarFront className="h-10 w-14 text-slate-400" strokeWidth={1} />
          <div className="mt-3 w-full space-y-1"><div className="h-1.5 rounded bg-slate-200" /><div className="h-1.5 w-3/4 rounded bg-slate-200" /></div>
        </div>
        <div className="flex items-center justify-center text-slate-500"><ArrowRight className="h-5 w-5" strokeWidth={1.4} /></div>
        <div className="flex flex-col items-center justify-center border border-slate-200 bg-[#f1f5fb] p-3 text-center">
          <p className="text-[10px] font-semibold text-slate-800">Bilto förhandlar</p>
          <MessageSquare className="my-5 h-10 w-10 text-slate-700" strokeWidth={1.2} />
          <p className="text-[10px] leading-[1.45] text-slate-600">Vi jämför handlare<br />och förhandlar<br />åt dig.</p>
        </div>
        <div className="flex items-center justify-center text-slate-500"><ArrowRight className="h-5 w-5" strokeWidth={1.4} /></div>
        <div className="flex flex-col items-center justify-between border border-slate-200 p-3 text-center">
          <p className="text-[10px] font-semibold text-slate-800">Nytt pris efter<br />förhandling</p>
          <p className="my-3 text-[16px] font-bold text-slate-900">332 000 kr</p>
          <CarFront className="h-10 w-14 text-slate-400" strokeWidth={1} />
          <p className="mt-3 text-[10px] text-slate-600">Du sparar<br /><strong className="text-[16px] text-emerald-700">17 000 kr</strong></p>
        </div>
      </div>
      <p className="mt-2 text-center text-[9px] text-slate-400">Exemplet är illustrativt.</p>
    </div>
  );
}

export default function HomePage({ onNavigateBuy, onNavigateSell, onNavigateHowItWorks, pageTitle }: HomePageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [buyDrawerCar, setBuyDrawerCar] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  if (pageTitle) document.title = pageTitle;
  else setPageMeta({ title: 'Bilto – Vi förhandlar din bilaffär', description: 'Bilto förhandlar din bilaffär åt dig.', canonical: 'https://bilto.se/' });

  const openBuyDrawer = () => setBuyDrawerCar('');
  const closeBuyDrawer = () => setBuyDrawerCar(null);
  const toggleExtra = (name: string) => setSelectedExtras((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  const extrasTotal = extras.filter((item) => selectedExtras.includes(item.name)).reduce((sum, item) => sum + Number(item.price.replace(/\D/g, '')), 0);
  const total = 9995 + extrasTotal;

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Sälj bil') onNavigateSell?.();
    if (item === 'Bilköptjänsten') onNavigateBuy?.();
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#16233e]">
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} active="Bilköptjänsten" onSelect={handleMenuSelect} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[62px] max-w-[1200px] items-center justify-between px-5 lg:px-8">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Bilto startsida"><BrandMark /></button>
          <nav className="hidden items-center gap-8 text-[12px] font-medium text-[#18243b] md:flex">
            <button type="button" onClick={() => onNavigateBuy?.()}>Köp bil</button>
            <button type="button" onClick={() => onNavigateSell?.()}>Sälj bil</button>
            <button type="button" onClick={() => onNavigateBuy?.()}>Byt bil</button>
            <button type="button" onClick={() => onNavigateHowItWorks?.()}>Så fungerar Bilto</button>
            <button type="button" onClick={() => window.history.pushState({}, '', '/om-oss')}>Om oss</button>
            <button type="button" onClick={() => window.history.pushState({}, '', '/vanliga-fragor')}>Vanliga frågor</button>
          </nav>
          <div className="flex items-center gap-3">
            <button type="button" onClick={openBuyDrawer} className="hidden rounded-[3px] bg-[#0b1b3a] px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#172d58] sm:block">Förhandla min bil</button>
            <button type="button" aria-label="Öppna meny" onClick={() => setMenuOpen(true)} className="p-2 md:hidden"><Menu className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-5 pb-6 lg:px-8">
        <section className="grid gap-5 pb-5 pt-7 lg:grid-cols-[280px_1fr_178px] lg:items-center">
          <div className="pr-3">
            <h1 className="text-[35px] font-bold leading-[1.03] tracking-[-0.045em] text-[#16233e] sm:text-[42px]">Vi förhandlar<br />din bilaffär.</h1>
            <p className="mt-4 text-[15px] font-semibold leading-snug text-[#16233e]">Köp billigare. Sälj dyrare. Slipp förhandla själv.</p>
            <p className="mt-2 text-[11px] leading-[1.5] text-slate-600">Bilto tar dialogen med bilhandlarna, jämför bud och förhandlar pris och villkor åt dig. Du bestämmer – vi gör jobbet.</p>
            <div className="mt-5 grid grid-cols-4 gap-2 text-center">
              {[{ icon: Tag, text: 'Fast pris\nfrån 4 995 kr' }, { icon: Percent, text: 'Ingen\nprovision' }, { icon: UserRound, text: 'Oberoende\nrådgivning' }, { icon: ShieldCheck, text: 'Granskade\nhandlare' }].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1 text-[9px] leading-tight text-slate-600"><Icon className="h-6 w-6 text-slate-700" strokeWidth={1.25} /><span className="whitespace-pre-line">{text}</span></div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3">
              <button type="button" onClick={openBuyDrawer} className="rounded-[3px] bg-[#0b1b3a] px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#172d58]">Se våra paket och priser</button>
              <span className="text-[10px] leading-tight text-slate-600"><ArrowRight className="mr-1 inline h-4 w-4" />Tar 2 minuter att<br />komma igång</span>
            </div>
          </div>
          <ProcessIllustration />
          <aside className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-[0_3px_12px_rgba(15,23,42,0.04)]">
            <h2 className="text-center text-[12px] font-bold text-slate-800">Så fungerar det</h2>
            <ol className="mt-3 space-y-3">
              {processSteps.map(([title, text], index) => <li key={title} className="relative pl-7"><span className="absolute left-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#0b1b3a] text-[9px] font-bold text-white">{index + 1}</span><p className="text-[10px] font-bold text-slate-800">{title}</p><p className="mt-0.5 text-[9px] leading-[1.35] text-slate-500">{text}</p></li>)}
            </ol>
            <button type="button" onClick={() => onNavigateHowItWorks?.()} className="mt-4 text-[10px] font-semibold text-slate-700 underline underline-offset-2">Läs mer om processen <ArrowRight className="ml-1 inline h-3 w-3" /></button>
          </aside>
        </section>

        <section className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-slate-100 bg-white px-4 py-3 text-[10px] text-slate-600">
          <strong className="mr-2 text-[12px] text-slate-800">Vi arbetar med<br />granskade handlare</strong>
          {['Auktoriserad handlare', 'Ekonomiskt kontrollerade', 'Kundomdömen och historik', 'Löpande uppföljning'].map((label) => <span key={label} className="flex items-center gap-2 border-l border-slate-200 pl-4"><span className="flex h-7 w-7 items-center justify-center border border-slate-300 text-[7px] font-bold text-slate-400">LOGO</span>{label}</span>)}
          <span className="ml-auto text-right text-[16px] tracking-[0.12em] text-emerald-700">★★★★★<small className="block text-[9px] tracking-normal text-slate-600">4,8 av 5 i kundbetyg</small></span>
        </section>

        <section className="grid gap-5 py-4 lg:grid-cols-[1fr_278px]">
          <div>
            <h2 className="mb-3 text-center text-[18px] font-bold text-[#16233e]">Välj paket som passar dig</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {packages.map((pkg) => { const Icon = pkg.icon; return <div key={pkg.name} className={`relative flex flex-col rounded-[4px] border bg-white p-4 ${pkg.popular ? 'border-[#0b1b3a] shadow-[0_4px_14px_rgba(15,23,42,0.1)]' : 'border-slate-200'}`}>
                {pkg.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-[3px] bg-[#0b1b3a] px-3 py-1 text-[9px] font-bold uppercase text-white">Mest populär</span>}
                <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50"><Icon className="h-6 w-6 text-slate-600" strokeWidth={1.2} /></span><div><h3 className="text-[15px] font-bold">{pkg.name}</h3><p className="text-[10px] leading-[1.35] text-slate-500">{pkg.description}</p></div></div>
                <div className="my-3 border-t border-slate-200 pt-2"><strong className="text-[16px]">{pkg.price}</strong><span className="ml-1 text-[10px] text-slate-500">Fast pris</span></div>
                <ul className="flex-1 space-y-1.5 text-[10px] text-slate-600">{pkg.items.map((item, index) => <li key={item} className={index === 0 && pkg.popular ? 'font-semibold text-slate-700' : ''}><Check className="mr-1.5 inline h-3 w-3 text-slate-500" strokeWidth={1.5} />{item}</li>)}</ul>
                <button type="button" onClick={openBuyDrawer} className={`mt-4 h-9 rounded-[3px] border text-[11px] font-semibold ${pkg.popular ? 'border-[#0b1b3a] bg-[#0b1b3a] text-white' : 'border-slate-400 text-[#16233e] hover:bg-slate-50'}`}>Välj {pkg.name}</button>
              </div>; })}
            </div>
          </div>
          <aside className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-[0_3px_12px_rgba(15,23,42,0.04)]">
            <h2 className="text-[13px] font-bold">Tilläggstjänster</h2>
            <div className="mt-2 divide-y divide-slate-100">{extras.map(({ icon: Icon, name, detail, price }) => <label key={name} className="flex cursor-pointer items-center gap-2 py-2"><Icon className="h-5 w-5 shrink-0 text-slate-600" strokeWidth={1.25} /><span className="min-w-0 flex-1"><strong className="block text-[10px] text-slate-800">{name}</strong><small className="block text-[8px] leading-tight text-slate-500">{detail}</small></span><b className="text-[10px] whitespace-nowrap">{price}</b><input type="checkbox" checked={selectedExtras.includes(name)} onChange={() => toggleExtra(name)} className="h-4 w-4 accent-[#0b1b3a]" /></label>)}</div>
            <div className="mt-3 border-t border-slate-200 pt-3"><div className="flex items-end justify-between"><span className="text-[10px] font-semibold">Totalt (exempel)<small className="block font-normal text-slate-500">Plus-paket + {selectedExtras.length || 2} tilläggstjänster</small></span><strong className="text-[18px]">{total.toLocaleString('sv-SE')} kr</strong></div><button type="button" onClick={openBuyDrawer} className="mt-3 h-9 w-full rounded-[3px] bg-[#0b1b3a] text-[11px] font-semibold text-white transition hover:bg-[#172d58]">Kom igång</button></div>
          </aside>
        </section>

        <section className="grid border-y border-slate-100 bg-white py-3 sm:grid-cols-4">{trustItems.map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-3 border-b border-slate-100 px-4 py-2 last:border-0 sm:border-b-0 sm:border-r sm:last:border-0"><Icon className="mt-0.5 h-6 w-6 shrink-0 text-slate-500" strokeWidth={1.2} /><span><strong className="block text-[10px] text-slate-800">{title}</strong><small className="block text-[9px] leading-tight text-slate-500">{text}</small></span></div>)}</section>
      </main>
      <SiteFooter />
      <Suspense fallback={null}><BuyDrawer car={buyDrawerCar} onClose={closeBuyDrawer} onBack={() => onNavigateBuy?.()} /></Suspense>
    </div>
  );
}
