import { useState, Suspense, lazy } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  LineChart,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { type MobileMenuItem } from '../components/MobileMenu';
import { setPageMeta } from '../lib/pageMeta';

const BuyDrawer = lazy(() => import('../components/BuyDrawer'));

interface HomePageProps {
  onNavigate: (regnummer: string, telefon: string) => void;
  onNavigateBuy?: () => void;
  onNavigateSell?: () => void;
  onNavigateHowItWorks?: () => void;
  showSeo?: boolean;
  pageTitle?: string;
}

const savings = [
  { name: 'Patrick D.', car: '2023 Ford F-150 Lariat', amount: '4 100' },
  { name: 'Nattalie K.', car: '2026 Mazda CX-70', amount: '3 250' },
  { name: 'Julie & Adrienne T.', car: 'Kia K5 GT', amount: '2 400' },
  { name: 'David D.', car: '2026 Kia Sportage EX', amount: '2 900' },
  { name: 'Fernando B.', car: '2025 Toyota Tacoma SR5', amount: '3 100' },
  { name: 'Grant G.', car: '2018 Toyota RAV4 XLE', amount: '4 800' },
  { name: 'Eric S.', car: '2026 Toyota Crown Signia', amount: '3 200' },
  { name: 'Erin B.', car: '2026 Mini Countryman S', amount: '2 700' },
];

const comparison = [
  { label: 'Vem ringer vem', usual: 'Du fyller i ett formulär. Fem handlare ringer dig en hel vecka.', bilto: 'Vi kontaktar handlarna. Ditt nummer når dem aldrig.' },
  { label: 'Prisinformationen', usual: 'Handlaren har alla siffror. Du ser prislappen och hoppas.', bilto: 'Vi visar fakturapris, målspris och total kostnad. Samma siffror som handlaren.' },
  { label: 'Förhandlingen', usual: 'Du sitter i showroom i fyra timmar under press, utan spelrum.', bilto: 'En erfaren förhandlare sköter dialogen innan du ens besöker handlaren.' },
  { label: 'Det finstilta', usual: 'Dolda avgifter och tillägg för 20 000 kr smygs in i avtalet.', bilto: 'Varje rad kontrolleras. Skräpavgifter rensas bort innan du skriver på.' },
];

const plans = [
  {
    name: 'Gratis',
    price: '0 kr',
    period: 'för alltid',
    desc: 'Marknadsdata, sök bland bilar, och rådgivning via chatt.',
    cta: 'Börja gratis',
    icon: Search,
    features: ['Marknadsdata och priser', 'Sök bland 50 000+ bilar', 'Fråga våra bilrådgivare'],
  },
  {
    name: 'Bilto Pro',
    price: '49 kr',
    period: '/månad',
    desc: 'Fakturapriser, målspriser och totala kostnadsuppskattningar.',
    cta: 'Skaffa Pro',
    icon: LineChart,
    features: ['Allt i Gratis, plus:', 'Fakturapriser och målspriser', 'OTD-uppskattningar', 'Jämförelseverktyg'],
  },
  {
    name: 'AI-förhandlare',
    price: '790 kr',
    period: 'per sökning',
    desc: 'AI förhandlar totalpriset och rensar bort dolda avgifter.',
    cta: 'Starta AI-sökning',
    icon: Zap,
    badge: 'Beta',
    features: ['Allt i Pro, plus:', 'AI förhandlar OTD', 'Rensar bort skräpavgifter', 'En fast avgift oavsett antal bilar'],
  },
  {
    name: 'Concierge',
    price: '9 995 kr',
    period: 'per bilköp',
    desc: 'En erfaren proffs sköter hela affären från start till mål.',
    cta: 'Boka Concierge',
    icon: BadgeCheck,
    features: ['Allt i AI-förhandlare, plus:', '20-årig branschexpert', 'Samtal, sms och escalation', 'Hela vägen till signering'],
  },
];

const testimonials = [
  { quote: 'Inom 48 timmar hade jag fyra bilar att titta på. Min rådgivare förhandlade fram ett totalpris på 35 337 kr. Bilens nya listpris var 43 995 kr. Det här är sättet att köpa bil på.', name: 'Dave E.' },
  { quote: 'Stuart förhandlade hela min affär från start till mål. Allt jag behövde göra var att gå till handlaren, skriva på pappren och köra hem min nya bil. Det var lika enkelt.', name: 'H. Garrett' },
  { quote: 'Jerry hittade exakt den bil jag letade efter på mindre än tre dagar till ett betydligt lägre totalpris. Otroligt! Rekommenderas varmt!', name: 'Gina O.' },
];

const faqs = [
  { q: 'Vad är skillnaden mellan AI-förhandlare och Concierge?', a: 'AI-förhandlare (790 kr i beta) är mjukvara som mailar handlare, förhandlar totalpriset och rensar bort dolda avgifter. Concierge (9 995 kr) är en erfaren branschexpert som sköter hela affären från samtal till signering.' },
  { q: 'Kommer handlare att ringa mig?', a: 'Aldrig. Ditt nummer stays hos dig. Vi hanterar varje mejl, samtal och sms å dina vägnar. Noll spam.' },
  { q: 'Hur lång tid tar förhandlingen?', a: 'Det beror på hur snabbt du vill gå framåt. Första svaren från handlare kommer oftast inom 24 timmar och motbud inom 48. De flesta avslutas på 3–5 dagar.' },
  { q: 'Vad händer om jag inte köper en bil?', a: 'AI-förhandlare kostar 790 kr i beta och du behåller all data även om du avbryter. Concierge faktureras per affär och endast när vi levererar en bil du faktiskt vill köpa.' },
  { q: 'Måste jag betala för att börja?', a: 'Nej. Gratis ger dig marknadsdata, rådgivning via chatt och tillgång till 50 000+ bilar för alltid. Uppgradera först när du vill ha målspriser, OTD-uppskattningar eller förhandlingshjälp.' },
];

function StarRating() {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b1b3a]">
        <span className="text-[15px] font-extrabold text-white">B</span>
      </span>
      <span className="text-[22px] font-extrabold tracking-[-0.04em] text-[#0b1b3a]">Bilto</span>
    </span>
  );
}

export default function HomePage({ onNavigateBuy, onNavigateSell, onNavigateHowItWorks, pageTitle }: HomePageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [buyDrawerCar, setBuyDrawerCar] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (pageTitle) document.title = pageTitle;
  else setPageMeta({ title: 'Bilto – Vi förhandlar din bilaffar', description: 'Bilto förhandlar din bilaffär åt dig. Spara 25 000 kr eller mer på ditt nästa bilköp.', canonical: 'https://bilto.se/' });

  const openBuyDrawer = () => setBuyDrawerCar('');
  const closeBuyDrawer = () => setBuyDrawerCar(null);

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Sälj bil') onNavigateSell?.();
    if (item === 'Bilköptjänsten') onNavigateBuy?.();
  };

  return (
    <div className="min-h-screen bg-white text-[#0b1b3a]">
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} active="Bilköptjänsten" onSelect={handleMenuSelect} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 lg:px-8">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Bilto startsida">
            <BrandMark />
          </button>
          <nav className="hidden items-center gap-7 text-[14px] font-medium text-[#3a4a63] md:flex">
            <button type="button" onClick={() => onNavigateBuy?.()} className="hover:text-[#0b1b3a]">Köp bil</button>
            <button type="button" onClick={() => onNavigateSell?.()} className="hover:text-[#0b1b3a]">Sälj bil</button>
            <button type="button" onClick={() => onNavigateHowItWorks?.()} className="hover:text-[#0b1b3a]">Så fungerar det</button>
            <button type="button" onClick={() => window.history.pushState({}, '', '/om-oss')} className="hover:text-[#0b1b3a]">Om oss</button>
            <button type="button" onClick={() => window.history.pushState({}, '', '/vanliga-fragor')} className="hover:text-[#0b1b3a]">Vanliga frågor</button>
          </nav>
          <div className="flex items-center gap-3">
            <button type="button" onClick={openBuyDrawer} className="hidden rounded-lg bg-[#0b1b3a] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#172d58] sm:block">
              Förhandla min bil
            </button>
            <button type="button" aria-label="Öppna meny" onClick={() => setMenuOpen(true)} className="p-2 md:hidden">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0b1b3a] py-16 lg:py-24">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 70% 30%, rgba(56,189,248,0.15) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(99,102,241,0.12) 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-[1200px] px-5 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-medium text-white/80 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              Live nu – förhandling varje vardag
            </div>
            <h1 className="text-[42px] font-bold leading-[1.05] tracking-[-0.03em] text-white sm:text-[56px] lg:text-[64px]">
              Spara <span className="text-emerald-400">25 000 kr</span> eller mer på ditt nästa bilköp – utan att sätta foten på en bilhall.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-white/70">
              Oavsett om du köper eller säljer, kontaktar Bilto handlarna åt dig, förhandlar fram bästa pris och hanterar varje steg. Du sparar tid och pengar.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button type="button" onClick={openBuyDrawer} className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-[15px] font-bold text-[#0b1b3a] transition hover:bg-slate-100">
                Starta gratis konsultation <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => onNavigateHowItWorks?.()} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-white/10">
                Se hur det fungerar
              </button>
            </div>
            <p className="mt-4 text-[13px] text-white/50">Få tillgång till målspriser, fakturadata och OTD-uppskattningar.</p>
          </div>
        </div>
      </section>

      {/* Real customers savings */}
      <section className="border-b border-slate-100 bg-white py-14">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <h2 className="mb-2 text-center text-[28px] font-bold tracking-[-0.02em] text-[#0b1b3a]">Riktiga kunder. Riktiga besparingar.</h2>
          <p className="mb-10 text-center text-[15px] text-slate-500">Tusentals svenska bilköpare har sparat med Bilto.</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {savings.map((s) => (
              <div key={s.name + s.car} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md">
                <div className="mb-2 flex items-center gap-1 text-emerald-600">
                  <span className="text-[13px] font-bold">Sparade</span>
                </div>
                <p className="text-[28px] font-bold tracking-[-0.02em] text-[#0b1b3a]">{s.amount} kr</p>
                <p className="mt-1 text-[13px] font-medium text-slate-700">{s.name}</p>
                <p className="text-[12px] text-slate-400">{s.car}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* As featured in */}
      <section className="border-b border-slate-100 bg-[#f8f9fb] py-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 lg:px-8">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Om oss i</span>
          {['Aftonbladet', 'Dagens Industri', 'SVT Nyheter', 'Teknikens Värld', 'Auto Motor & Sport'].map((m) => (
            <span key={m} className="text-[16px] font-bold text-slate-300">{m}</span>
          ))}
        </div>
      </section>

      {/* Comparison: usual way vs Bilto way */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <div className="mb-3 text-center">
            <span className="text-[13px] font-bold uppercase tracking-wider text-emerald-600">Varför våra kunder sparar 25 000 kr</span>
          </div>
          <h2 className="mb-12 text-center text-[32px] font-bold tracking-[-0.02em] text-[#0b1b3a] sm:text-[40px]">
            Handlarna har en orättvis fördel.<br />Fram tills nu.
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-[16px] leading-relaxed text-slate-500">
            Ett vanligt handlarbesök tar fyra timmar och kostar de flesta köpare 20 000–40 000 kr mer än det borde. Så här ändras allt när Bilto sköter affären:
          </p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50">
              <div className="px-5 py-4 text-[13px] font-bold uppercase tracking-wider text-slate-400">Område</div>
              <div className="border-l border-slate-200 px-5 py-4 text-[14px] font-bold text-slate-500">Det vanliga sättet</div>
              <div className="border-l border-slate-200 bg-[#0b1b3a] px-5 py-4 text-[14px] font-bold text-white">Bilto sättet</div>
            </div>
            {comparison.map((row, i) => (
              <div key={row.label} className={`grid grid-cols-3 ${i !== comparison.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="px-5 py-5 text-[14px] font-semibold text-[#0b1b3a]">{row.label}</div>
                <div className="border-l border-slate-100 px-5 py-5 text-[14px] leading-relaxed text-slate-500">{row.usual}</div>
                <div className="border-l border-slate-100 bg-[#f0f7ff] px-5 py-5 text-[14px] leading-relaxed font-medium text-[#0b1b3a]">{row.bilto}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-slate-100 bg-[#f8f9fb] py-16 lg:py-24">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <div className="mb-3 text-center">
            <span className="text-[13px] font-bold uppercase tracking-wider text-emerald-600">Priser i korthet</span>
          </div>
          <h2 className="mb-3 text-center text-[32px] font-bold tracking-[-0.02em] text-[#0b1b3a] sm:text-[40px]">Från gör-det-själv till klart-åt-dig.</h2>
          <p className="mb-12 text-center text-[15px] text-slate-500">
            <button type="button" onClick={() => window.history.pushState({}, '', '/vanliga-fragor')} className="font-semibold text-[#0b1b3a] underline underline-offset-2">Se fullständig jämförelse</button>
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div key={plan.name} className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-lg">
                  {plan.badge && (
                    <span className="absolute -top-3 right-6 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold uppercase text-white">{plan.badge}</span>
                  )}
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                    <Icon className="h-6 w-6 text-[#0b1b3a]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[18px] font-bold text-[#0b1b3a]">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-[32px] font-bold tracking-[-0.02em] text-[#0b1b3a]">{plan.price}</span>
                    <span className="text-[13px] text-slate-400">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{plan.desc}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((f, i) => (
                      <li key={f} className={`flex items-start gap-2 text-[13px] ${i === 0 && plan.features.length > 1 ? 'font-semibold text-[#0b1b3a]' : 'text-slate-600'}`}>
                        {i === 0 && plan.features.length > 1 ? null : <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={openBuyDrawer}
                    className={`mt-6 h-11 rounded-lg text-[14px] font-semibold transition ${
                      plan.name === 'AI-förhandlare'
                        ? 'bg-[#0b1b3a] text-white hover:bg-[#172d58]'
                        : 'border border-slate-300 text-[#0b1b3a] hover:bg-slate-50'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <h2 className="mb-3 text-center text-[28px] font-bold tracking-[-0.02em] text-[#0b1b3a]">Ta inte bara vårt ord för det.</h2>
          <div className="mb-10 flex items-center justify-center gap-4">
            <StarRating />
            <span className="text-[14px] text-slate-500">
              <strong className="text-[#0b1b3a]">4,4 på Trustpilot</strong> · <strong className="text-[#0b1b3a]">4,9 på Google</strong>
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="mb-4"><StarRating /></div>
                <p className="text-[15px] leading-relaxed text-slate-700">"{t.quote}"</p>
                <p className="mt-5 text-[13px] font-semibold text-[#0b1b3a]">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder story */}
      <section className="border-y border-slate-100 bg-[#f8f9fb] py-16 lg:py-24">
        <div className="mx-auto max-w-[900px] px-5 text-center lg:px-8">
          <div className="mb-6 flex justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0b1b3a] text-[20px] font-bold text-white">D</div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#172d58] text-[20px] font-bold text-white">E</div>
          </div>
          <h2 className="mb-4 text-[28px] font-bold tracking-[-0.02em] text-[#0b1b3a]">Byggt av Daniel & Erik</h2>
          <p className="text-[14px] font-semibold uppercase tracking-wider text-slate-400">Far och son. 40+ år inom bilbranschen. Nu på din sida.</p>
          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-slate-600">
            Daniel tillbringade 40 år som bilhandlare. Erik växte upp i branschen. Tillsammans har de spenderat det senaste decenniet med att lära köpare vad handlare inte berättar. De höll ständigt samma sak: <em>"Jag önskar bara att någon jag litade på kunde göra det här åt mig."</em>
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-slate-600">Det är Bilto. Expertvänner på insidan, backade av data, AI och ett team av människor som sett varje knep.</p>
          <button type="button" onClick={() => window.history.pushState({}, '', '/om-oss')} className="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-[#0b1b3a] underline underline-offset-2">
            Möt experterna <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-[800px] px-5 lg:px-8">
          <h2 className="mb-10 text-center text-[28px] font-bold tracking-[-0.02em] text-[#0b1b3a]">Vanliga frågor</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-[16px] font-semibold text-[#0b1b3a]">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-[15px] leading-relaxed text-slate-600">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#0b1b3a] py-16 lg:py-24">
        <div className="mx-auto max-w-[800px] px-5 text-center lg:px-8">
          <h2 className="text-[32px] font-bold tracking-[-0.02em] text-white sm:text-[40px]">Så här ska bilköp fungera.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-white/70">
            Börja med ett gratis samtal på 15 minuter med vårt team. Vi berättar exakt vad som passar dig – även om svaret är "du behöver oss inte än."
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button type="button" onClick={openBuyDrawer} className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-[15px] font-bold text-[#0b1b3a] transition hover:bg-slate-100">
              Starta gratis konsultation <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => window.history.pushState({}, '', '/vanliga-fragor')} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-white/10">
              Se priser och paket
            </button>
          </div>
        </div>
      </section>

      {/* Trust badges strip */}
      <section className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-6 px-5 lg:px-8">
          {[
            { icon: ShieldCheck, label: 'Säker betalning' },
            { icon: Users, label: 'Granskade handlare' },
            { icon: BadgeCheck, label: 'Nöjd kund-garanti' },
            { icon: Sparkles, label: 'Oberoende rådgivning' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
              <Icon className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
              {label}
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />

      <Suspense fallback={null}>
        <BuyDrawer car={buyDrawerCar} onClose={closeBuyDrawer} onBack={() => onNavigateBuy?.()} />
      </Suspense>
    </div>
  );
}
