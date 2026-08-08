import { useState, useEffect } from 'react';
import {
  Menu,
  ArrowRight,
  Phone,
  Search,
  Handshake,
  ShieldCheck,
  Clock,
  Check,
  Gavel,
  Car as CarIcon,
  Wallet,
  Truck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import ReviewsSection from '../components/ReviewsSection';
import { PHONE, PHONE_TEL } from '../config/site';
import { setPageMeta } from '../lib/pageMeta';

interface SaFunkarDetPageProps {
  onBackHome: () => void;
  onSell?: () => void;
  onBuy?: () => void;
}

const STEPS = [
  {
    icon: Search,
    title: '1. Berätta vad du vill ha',
    text: 'Skriv in regnumret på bilen du hittat, eller berätta vad du letar efter. Vi hämtar uppgifterna automatiskt och kartlägger marknaden.',
  },
  {
    icon: Gavel,
    title: '2. Vi förhandlar åt dig',
    text: 'Biltos experter kontaktar handlarna, jämför priser och förhandlar ner kostnaden. Du slipper telefonångest och påtryckningar.',
  },
  {
    icon: Handshake,
    title: '3. Du väljer – vi sköter resten',
    text: 'Vi presenterar det bästa priset. Tackar du ja sköter vi papper, finansiering och upphämtning. Du hämtar nycklarna.',
  },
];

const SELL_STEPS = [
  {
    icon: Search,
    title: '1. Gratis värdering',
    text: 'Skriv in regnumret. Vi värderar din bil mot marknadsdata – opartiskt och utan bindning.',
  },
  {
    icon: Gavel,
    title: '2. Handlare bjuder',
    text: 'Granskade bilhandlare konkurrerar om din bil. Vi förhandlar och presenterar det bästa budet.',
  },
  {
    icon: Wallet,
    title: '3. Pengarna på kontot',
    text: 'Tackar du ja hämtar vi bilen gratis och pengarna landar på ditt konto. Noll krångel.',
  },
];

const FAQ = [
  {
    q: 'Vad kostar tjänsten?',
    a: 'Säljhjälpen är gratis för dig – vi tar en avgift av handlaren som köper din bil. Bilköptjänsten kostar 4 995 kr i fast avgift, betalas bara om affären blir av. Inga dolda kostnader, noll provision.',
  },
  {
    q: 'Hur snabbt får jag ett bud på min bil?',
    a: 'De flesta får det första budet inom 24 timmar. Inom 3–5 dagar har du oftast flera bud att välja mellan.',
  },
  {
    q: 'Måste jag acceptera ett bud?',
    a: 'Aldrig. Du är helt fri att tacka nej. Det kostar ingenting att avstå – du bestämmer själv om du vill sälja.',
  },
  {
    q: 'Vem hämtar bilen?',
    a: 'Vi ordnar upphämtning på en plats som passar dig – var som helst i Sverige. Det är gratis och ingår i tjänsten.',
  },
  {
    q: 'När får jag pengarna?',
    a: 'Pengarna landar på ditt konto innan du lämnar över bilen. Vid förmedling betalas slutpriset ut inom 1–3 bankdagar.',
  },
  {
    q: 'Är handlarna granskade?',
    a: 'Ja. Endast auktoriserade bilhandlare med dokumenterad historik får delta i Biltos nätverk. Vi kontrollerar omdömen och historik löpande.',
  },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, title: 'Granskade handlare', text: 'Endast auktoriserade bilhandlare med dokumenterad historik deltar.' },
  { icon: Clock, title: 'Snabb utbetalning', text: 'Pengarna landar på ditt konto innan du lämnar över bilen.' },
  { icon: Check, title: 'Noll förpliktelse', text: 'Du är aldrig bunden att sälja. Tacka nej kostnadsfritt.' },
];

export default function SaFunkarDetPage({ onBackHome, onSell, onBuy }: SaFunkarDetPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: 'Så funkar Bilto – vi förenklar din bilaffär',
      description: 'Förstå hur Bilto fungerar: gratis värdering, granskade handlare bjuder, vi förhandlar och sköter hela affären. Ingen bindning.',
      canonical: 'https://bilto.se/sa-funkar-det',
    });
  }, []);

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Sälj bil') { onSell?.(); return; }
    if (item === 'Bilköptjänsten') { onBuy?.(); return; }
    onBackHome();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Sälj bil"
        onSelect={handleMenuSelect}
      />

      {/* ── Nav ── */}
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white"
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={() => { window.history.pushState({}, '', '/salj-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 font-medium transition hover:text-white">Säljhjälpen</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/kop-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 font-medium transition hover:text-white">Bilköptjänsten</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/om-oss'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 font-medium transition hover:text-white">Om oss</button>
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

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f5ff] via-[#f7f9ff] to-white pt-28 sm:pt-36 pb-16 sm:pb-24">
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-[#0e6efe]/[0.05] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full bg-[#69a8ff]/[0.06] blur-3xl pointer-events-none" />

        <div className="relative mx-auto w-full max-w-3xl px-5 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0e6efe]/10 px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#0e6efe]" />
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-wider">Så här fungerar Bilto</span>
          </div>
          <h1 className="text-[32px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.06] tracking-[-0.04em] text-slate-800">
            Vi tar hand om hela bilaffären åt dig.
          </h1>
          <p className="mt-5 text-[16px] sm:text-[19px] leading-[1.5] text-slate-500 max-w-xl mx-auto">
            Oavsett om du säljer eller köper gör Biltos experter jobbet – värdering, förhandling, papper och upphämtning. Du bestämmer, vi sköter resten.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => { window.history.pushState({}, '', '/salj-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }}
              className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#0e6efe] text-white text-[15px] font-bold transition hover:bg-[#0a57cc] active:scale-[0.98] shadow-lg shadow-[#0e6efe]/25"
            >
              Sälj min bil
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
            <button
              type="button"
              onClick={() => { window.history.pushState({}, '', '/kop-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }}
              className="inline-flex items-center justify-center h-12 px-7 rounded-xl border-2 border-slate-200 text-slate-700 text-[15px] font-semibold transition hover:border-slate-900 hover:bg-slate-900 hover:text-white active:scale-[0.98]"
            >
              Hitta en bil
              <CarIcon className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Köp: Så funkar det ── */}
      <section className="bg-gradient-to-b from-white to-[#f7f9ff] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Bilköptjänsten
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-800">
 Så köper du bil via Bilto
            </h2>
            <p className="mt-4 text-slate-500 text-[16px] sm:text-[19px] leading-[1.5]">
              Hitta en bil – vi förhandlar priset åt dig. Du sparar tid och pengar utan att besöka en bilhall.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 transition hover:shadow-[0_8px_30px_rgba(14,110,254,0.06)] hover:border-slate-300">
                  <div className="w-12 h-12 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mb-5 shrink-0">
                    <Icon className="w-6 h-6 text-[#0e6efe]" strokeWidth={2} />
                  </div>
                  <h3 className="text-[18px] sm:text-[20px] font-bold text-slate-800 leading-tight tracking-[-0.01em] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 text-[15px] leading-[1.65]">{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Sälj: Så funkar det ── */}
      <section className="bg-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Säljhjälpen
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-800">
              Så säljer du bilen via Bilto
            </h2>
            <p className="mt-4 text-slate-500 text-[16px] sm:text-[19px] leading-[1.5]">
              Gratis värdering, granskade handlare bjuder, fri upphämtning. Du är aldrig bunden.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            {SELL_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 transition hover:shadow-[0_8px_30px_rgba(14,110,254,0.06)] hover:border-slate-300">
                  <div className="w-12 h-12 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mb-5 shrink-0">
                    <Icon className="w-6 h-6 text-[#0e6efe]" strokeWidth={2} />
                  </div>
                  <h3 className="text-[18px] sm:text-[20px] font-bold text-slate-800 leading-tight tracking-[-0.01em] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 text-[15px] leading-[1.65]">{step.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => { window.history.pushState({}, '', '/salj-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }}
              className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#0e6efe] text-white text-[15px] font-bold transition hover:bg-[#0a57cc] active:scale-[0.98] shadow-lg shadow-[#0e6efe]/25"
            >
              Värdera min bil gratis
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Vad ingår ── */}
      <section className="bg-gradient-to-b from-[#f7f9ff] to-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Vad ingår
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-800">
              Allt från idé till nyckel
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Search, title: 'Gratis värdering', text: 'Vi värderar din bil mot marknadsdata – opartiskt.' },
              { icon: Gavel, title: 'Förhandling', text: 'Vi förhandlar med handlarna åt dig – inga påtryckningar.' },
              { icon: Truck, title: 'Fri upphämtning', text: 'Vi hämtar bilen var som helst i Sverige – kostnadsfritt.' },
              { icon: Wallet, title: 'Pengarna direkt', text: 'Pengarna landar på ditt konto innan du lämnar över bilen.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-[0_8px_30px_rgba(14,110,254,0.06)] hover:border-slate-300">
                  <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mb-4 shrink-0">
                    <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 mb-1.5 tracking-[-0.01em]">{item.title}</h3>
                  <p className="text-slate-500 leading-[1.65] text-[13px]">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trygghet ── */}
      <section className="bg-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">
              Trygghet
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-800 tracking-[-0.03em] leading-[1.08]">
              Din partner för en trygg bilaffär
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {TRUST_BADGES.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 flex flex-col transition hover:shadow-[0_8px_30px_rgba(14,110,254,0.06)] hover:border-slate-300">
                  <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mb-5 shrink-0">
                    <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-800 mb-2 tracking-[-0.01em]">{b.title}</h3>
                  <p className="text-slate-500 leading-[1.65] text-[14px]">{b.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ReviewsSection variant="muted" />

      {/* ── FAQ ── */}
      <section className="bg-gradient-to-b from-[#f7f9ff] to-white px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 sm:mb-14 text-center">
            <p className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">Vanliga frågor</p>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-800 tracking-[-0.03em] leading-[1.08]">
              Vanliga frågor – vi svarar rakt på sak
            </h2>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200 rounded-2xl overflow-hidden bg-white">
            {FAQ.map((item, idx) => {
              const open = openFaq === idx;
              return (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => setOpenFaq(open ? null : idx)}
                  className="w-full text-left py-5 px-5 sm:px-6 flex items-start gap-4 group transition hover:bg-slate-50"
                >
                  <div className="flex-1">
                    <h3 className="text-[15px] sm:text-[17px] font-semibold text-slate-800 leading-snug">{item.q}</h3>
                    {open && (
                      <p className="mt-3 text-[14px] sm:text-[15px] text-slate-500 leading-[1.5]">{item.a}</p>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180 text-[#0e6efe]' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-[#f7f9ff] px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[24px] border border-[#0e6efe]/30 bg-white px-6 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14 overflow-hidden shadow-[0_20px_60px_rgba(14,110,254,0.08)] text-center">
            <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold tracking-[-0.03em] leading-[1.06] text-slate-800 mb-4">
              Redo att sätta igång?
            </h2>
            <p className="text-slate-500 text-[16px] sm:text-[19px] leading-[1.5] mb-8 max-w-lg mx-auto">
              Börja med en gratis värdering eller låt oss hitta och förhandla fram din nästa bil.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => { window.history.pushState({}, '', '/salj-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#0e6efe] text-white text-[15px] font-bold transition hover:bg-[#0a57cc] active:scale-[0.98] shadow-lg shadow-[#0e6efe]/25"
              >
                Värdera min bil gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <a
                href={PHONE_TEL}
                className="inline-flex items-center justify-center h-12 px-7 rounded-xl border-2 border-slate-200 text-slate-700 text-[15px] font-semibold transition hover:border-slate-900 hover:bg-slate-900 hover:text-white active:scale-[0.98]"
              >
                <Phone className="w-4 h-4 mr-2 shrink-0" strokeWidth={2.5} />
                Ring {PHONE}
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
