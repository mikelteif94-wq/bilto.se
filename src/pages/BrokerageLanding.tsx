import { useState, useEffect } from 'react';
import { Menu, User, ArrowRight, Check, Users, PenLine, ThumbsUp, XCircle, X, Megaphone, Phone, Wallet, Camera, Info } from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import ReviewsSection from '../components/ReviewsSection';
import RegInput from '../components/RegInput';

interface BrokerageLandingProps {
  onContinue: (regnummer: string, miltal: number) => void;
  onBackHome: () => void;
}

export default function BrokerageLanding({ onContinue, onBackHome }: BrokerageLandingProps) {
  const [regnummer, setRegnummer] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [carsModalOpen, setCarsModalOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMenuSelect = (item: MobileMenuItem) => {
    if (item === 'Förmedling') return;
    if (item === 'Köp bil') {
      window.history.pushState({}, '', '/kop-bil');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    if (item === 'Så funkar det') {
      window.history.pushState({}, '', '/sa-funkar-det');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onBackHome();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reg = regnummer.trim().toUpperCase().replace(/\s/g, '');
    if (!reg) {
      setError('Ange registreringsnummer');
      return;
    }
    if (!/^[A-Z]{3}[0-9]{2}[A-Z0-9]$/.test(reg)) {
      setError('Registreringsnummer måste vara 3 bokstäver följt av 3 tecken (t.ex. ABC123)');
      return;
    }
    setError('');
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 200));
    onContinue(reg, 0);
  };

  const navItems = ['Direktbud', 'Förmedling'];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Förmedling"
        onSelect={handleMenuSelect}
      />
      <header className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]/40 backdrop-blur-md'}`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white"
          >
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
            />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === 'Förmedling') return;
                  onBackHome();
                }}
                className={`text-[15px] transition ${
                  item === 'Förmedling'
                    ? 'text-white font-semibold'
                    : 'text-white/80 hover:text-white'
                }`}
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

      <section className="lg:hidden pt-16 relative bg-[#0e6efe] overflow-hidden">
        <div className="absolute -right-20 top-80 w-[240px] h-[240px] rounded-full bg-[#3d8cff] opacity-40" />

        <div className="relative px-6 pt-8 pb-10">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/info-content.a96a55cf copy copy copy.svg"
              alt=""
              loading="eager"
              fetchPriority="high"
              className="w-[220px] h-auto object-contain"
            />
          </div>

          <h1 className="text-center text-white text-[28px] font-semibold leading-[1.15] tracking-tight px-2">
            Få ut mest för din bil&nbsp;– vi driver försäljningen
          </h1>

          <ul className="mt-8 space-y-4 text-[16px] font-medium text-white flex flex-col items-center">
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
              Vi annonserar och förhandlar åt dig
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
              Ofta högre slutpris än första handlarbudet
            </li>
            <li className="flex items-center gap-3">
              <Check className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
              Du betalar bara om bilen säljs
            </li>
          </ul>

          <div className="mt-8 bg-white rounded-2xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] p-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              <RegInput value={regnummer} onChange={(v) => { setRegnummer(v); setError(''); }} disabled={submitting} />
              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg bg-[#0e6efe] text-white text-[13px] font-semibold px-3 py-2 shadow-sm">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-[1px]" strokeWidth={2.5} />
                  <span className="leading-snug">{error}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="mt-1 h-12 w-full rounded-lg bg-[#0047B3] hover:bg-[#003a94] disabled:bg-slate-400 text-white font-semibold text-[15px] transition inline-flex items-center justify-center gap-2 group"
              >
                {submitting ? 'Skickar…' : 'Starta förmedling'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setCarsModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0e6efe] hover:text-[#0a57cc] transition group"
              >
                Vilka bilar köper Bilto?
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="hidden lg:block relative bg-[#0e6efe] pt-28 pb-32 overflow-hidden">
        <div className="absolute -left-40 top-20 w-[620px] h-[620px] rounded-full bg-[#3d8cff] opacity-60" />
        <div className="absolute right-10 -bottom-40 w-[560px] h-[560px] rounded-full bg-[#3d8cff] opacity-50" />
        <img
          src="/manrope_(1920_x_1080_px)_(Instagram_Post_(34))_(2).png"
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 top-0 w-[780px] h-[780px] object-contain pointer-events-none select-none opacity-70 mix-blend-multiply"
        />

        <div className="relative max-w-[1280px] mx-auto px-6 grid grid-cols-[1.1fr_0.9fr] gap-14 items-center">
          <div>
            <h1 className="text-white text-[56px] font-semibold leading-[1.05] tracking-tight">
              Få ut mest för din bil&nbsp;– vi driver försäljningen
            </h1>

            <ul className="mt-8 space-y-4 text-[19px] font-medium text-white">
              <li className="flex items-center gap-3">
                <Check className="w-7 h-7 text-white shrink-0" strokeWidth={3} />
                Vi annonserar, förhandlar och hanterar spekulanterna åt dig
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-7 h-7 text-white shrink-0" strokeWidth={3} />
                Ofta högre slutpris än första handlarbudet
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-7 h-7 text-white shrink-0" strokeWidth={3} />
                Du betalar bara om bilen säljs
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] p-6 max-w-[440px] w-full justify-self-end">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              <RegInput value={regnummer} onChange={(v) => { setRegnummer(v); setError(''); }} disabled={submitting} />
              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg bg-[#0e6efe] text-white text-[13px] font-semibold px-3 py-2 shadow-sm">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-[1px]" strokeWidth={2.5} />
                  <span className="leading-snug">{error}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="mt-1 h-12 w-full rounded-lg bg-[#0047B3] hover:bg-[#003a94] disabled:bg-slate-400 text-white font-semibold text-[15px] transition inline-flex items-center justify-center gap-2 group"
              >
                {submitting ? 'Skickar…' : 'Starta förmedling'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setCarsModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0e6efe] hover:text-[#0a57cc] transition group"
              >
                Vilka bilar köper Bilto?
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-slate-100 px-5 sm:px-6 py-10 sm:py-14">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-10">
            <span className="text-[11px] sm:text-[12px] font-medium text-slate-500 mb-2 sm:mb-3 block">
              &mdash; Två sätt att sälja
            </span>
            <h2 className="text-[24px] sm:text-[34px] font-semibold leading-[1.15] text-slate-900 tracking-[-0.02em]">
              Direktbud eller Maxpris&nbsp;– vad är skillnaden?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-2">Direktbud</div>
              <h3 className="text-[18px] sm:text-[20px] font-semibold text-slate-900 mb-2 leading-tight">Snabbt bud från en handlare</h3>
              <p className="text-[14.5px] sm:text-[15px] text-slate-600 leading-[1.6]">
                Du får ett konkret bud från en bilhandlare och kan sälja direkt. Smidigt när det måste gå snabbt.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-[#0e6efe] bg-[#0e6efe]/5 p-5 sm:p-7 relative">
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 inline-flex items-center text-[10px] font-semibold text-[#0e6efe] bg-white border border-[#0e6efe]/30 rounded-full px-2.5 py-1 uppercase tracking-wider">Du är här</div>
              <div className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-2">Maxpris &mdash; förmedling</div>
              <h3 className="text-[18px] sm:text-[20px] font-semibold text-slate-900 mb-2 leading-tight">Vi annonserar och förhandlar mot privatköpare</h3>
              <p className="text-[14.5px] sm:text-[15px] text-slate-600 leading-[1.6]">
                Vi tar fram annonsen, hanterar samtalen och driver budgivningen tills du får ett skarpt bud du vill säga ja till.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f8fc] py-12 sm:py-24 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 sm:mb-16 flex items-end justify-between flex-wrap gap-6">
            <div className="max-w-xl">
              <span className="text-[11px] sm:text-[12px] font-medium text-slate-500 mb-2 sm:mb-3 block">
                &mdash; Maxpris
              </span>
              <h2 className="text-[26px] sm:text-[48px] font-semibold leading-[1.05] text-slate-900 tracking-[-0.02em]">
                Så enkelt är det
              </h2>
            </div>
          </div>

          <ol className="relative lg:grid lg:grid-cols-3 lg:gap-10">
            {[
              {
                icon: Camera,
                title: 'Vi fixar proffsiga bilder',
                text: 'Vi tar fram professionella annonsbilder åt dig och skapar en skarp annons som lyfter bilens bästa sidor.',
              },
              {
                icon: Megaphone,
                title: 'Vi hittar köparen och driver budgivningen',
                text: 'Vi lägger upp annonsen, tar alla samtal och driver budgivningen med spekulanterna. Du sköter själva visningen — köparen kommer till dig.',
              },
              {
                icon: Phone,
                title: 'Du tar ställning först när det finns ett skarpt bud',
                text: 'Vi ringer dig när ett konkret bud är på bordet. Du betalar bara om bilen säljs.',
              },
            ].map((step, i, arr) => {
              const Icon = step.icon;
              const isLast = i === arr.length - 1;
              return (
                <li key={step.title} className="relative pl-12 sm:pl-14 pb-10 sm:pb-12 last:pb-0 lg:pl-0 lg:pb-0 lg:pt-[54px]">
                  {!isLast && (
                    <span aria-hidden className="absolute left-[17px] sm:left-[21px] top-9 sm:top-[46px] bottom-0 w-px bg-slate-200 lg:left-[44px] lg:right-0 lg:top-[21px] lg:bottom-auto lg:w-auto lg:h-px" />
                  )}
                  <div className="absolute left-0 top-0 flex items-center justify-center w-9 h-9 sm:w-[42px] sm:h-[42px] rounded-full bg-[#0e6efe] shadow-[0_8px_18px_-6px_rgba(14,110,254,0.5)] ring-4 ring-[#0e6efe]/10">
                    <Icon className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] text-white" strokeWidth={2.4} />
                  </div>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-[13px] font-medium text-slate-400 tabular-nums">
                      0{i + 1}
                    </span>
                    <h3 className="text-[20px] sm:text-[24px] font-semibold text-slate-900 leading-tight tracking-[-0.01em]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-[15px] sm:text-[16px] leading-[1.65] max-w-xl">
                    {step.text}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-24 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-14 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-medium text-slate-500 mb-2 sm:mb-3 block">
              &mdash; Vem gör vad
            </span>
            <h2 className="text-[24px] sm:text-[44px] font-semibold leading-[1.1] sm:leading-[1.04] text-slate-900 tracking-[-0.02em]">
              Vi hanterar försäljningen. Du visar bilen när det passar dig.
            </h2>
            <p className="text-slate-600 mt-4 sm:mt-5 text-[15px] sm:text-[17px] leading-[1.6]">
              Tydlig ansvarsfördelning gör att vi kan jobba snabbt och du slipper bli störd i onödan.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-7">
            <div className="rounded-2xl border-2 border-[#0e6efe]/15 bg-[#0e6efe]/5 p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-[#0e6efe] text-white flex items-center justify-center">
                  <Check className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <h3 className="text-[20px] font-semibold text-slate-900 tracking-tight">Bilto sköter</h3>
              </div>
              <ul className="space-y-3.5">
                {[
                  'Värdering och prissättning',
                  'Proffsiga annonsbilder',
                  'Annonsering på Sveriges största sajter',
                  'Alla samtal och mejl från intressenter',
                  'Förhandling och budgivning',
                  'Kontraktsskrivning och ägarbyte',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#0e6efe] shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-[15px] text-slate-700 leading-[1.5]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Users className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <h3 className="text-[20px] font-semibold text-slate-900 tracking-tight">Du sköter</h3>
              </div>
              <ul className="space-y-3.5">
                {[
                  'Visar bilen för intresserade köpare hemma',
                  'Provkörningen — du är med under tiden',
                  'Tar emot köparen och lämnar över nycklarna',
                  'Kör bilen som vanligt under tiden den är till salu',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="text-[15px] text-slate-700 leading-[1.5]">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#0e6efe] shrink-0 mt-0.5" strokeWidth={2.2} />
                <p className="text-[13.5px] text-slate-600 leading-[1.55]">
                  <span className="font-semibold text-slate-900">Du är aldrig ensam.</span> Vi finns med på telefon under hela visningen — så du känner dig trygg och kan ringa oss direkt om något känns konstigt eller om köparen vill förhandla.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12 sm:py-20">
          <div className="grid md:grid-cols-12 gap-6 sm:gap-10 items-center">
            <div className="md:col-span-5 order-2 md:order-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-3 sm:mb-4 block">
                Så mycket mer kan du få för bilen
              </span>
              <h2 className="text-[24px] sm:text-[42px] font-semibold leading-[1.15] sm:leading-[1.08] text-slate-900 tracking-[-0.02em]">
                "Jag fick 34 000 kr mer än första direktbudet."
              </h2>
              <p className="text-slate-600 mt-4 sm:mt-5 text-[15px] sm:text-[16px] leading-[1.65] max-w-md">
                Jonas fortsatte köra bilen som vanligt medan vi tog hand om försäljningen. Proffsiga bilder, aktiv annonsering och alla samtal — såld på nio dagar.
              </p>
              <dl className="mt-6 sm:mt-8 divide-y divide-slate-200 border-y border-slate-200">
                <div className="flex items-baseline justify-between py-3 sm:py-4">
                  <dt className="text-[14px] text-slate-500">Direktbud</dt>
                  <dd className="text-[16px] sm:text-[18px] font-semibold text-slate-900 tabular-nums">218 000 kr</dd>
                </div>
                <div className="flex items-baseline justify-between py-3 sm:py-4">
                  <dt className="text-[14px] text-slate-500">Såld för</dt>
                  <dd className="text-[16px] sm:text-[18px] font-semibold text-slate-900 tabular-nums">257 000 kr</dd>
                </div>
                <div className="flex items-baseline justify-between py-3 sm:py-4">
                  <dt className="text-[14px] font-medium text-[#0e6efe]">I fickan</dt>
                  <dd className="text-[20px] sm:text-[22px] font-semibold text-[#0e6efe] tabular-nums">+34 100 kr</dd>
                </div>
              </dl>
              <p className="text-[13px] text-slate-500 mt-4 sm:mt-5">
                Jonas A. &mdash; Toyota RAV4, 2021
              </p>
            </div>
            <div className="md:col-span-7 order-1 md:order-2">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src="/manrope_(1920_x_1080_px)_(1280_x_720_px)_(Instagram_Post_(45))_copy_copy_copy_copy_copy.jpg"
                  alt="Jonas framför sin Toyota RAV4"
                  className="w-full h-[380px] sm:h-[580px] md:h-[680px] object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="absolute left-4 bottom-24 sm:left-7 sm:bottom-7 inline-flex items-center gap-3 bg-white rounded-full pl-2 pr-5 py-2 shadow-lg">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[13px] font-bold shrink-0">9</div>
                  <div className="text-[13px] sm:text-[14px] font-semibold text-slate-900 whitespace-nowrap">dagar till såld</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f8fc] pb-8 px-5 sm:px-6 pt-12 sm:pt-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-[26px] sm:text-[34px] font-semibold text-slate-900 mb-8 sm:mb-14 leading-[1.1]">
            Fördelar med Maxpris
          </h2>
          <div className="flex flex-col">
            {[
              {
                title: 'Slipp samtal, prutning och annonsering',
                text: 'Alla samtal, mejl och förhandlingar går via din personliga rådgivare. Visningen gör du själv hemma — vi hör av oss först när det finns ett skarpt bud att ta ställning till.',
                img: '/benefit3.d9e1ec2e_(1).svg',
                reverse: false,
              },
              {
                title: 'Vi tar proffsiga bilder åt dig',
                text: 'Bra bilder säljer bilen. Vi skapar professionella annonsbilder så att din bil sticker ut bland tusentals andra annonser.',
                img: '/benefit2.e5b8ac47.svg',
                reverse: true,
              },
              {
                title: 'Vi förhandlar aktivt för att maximera slutpriset',
                text: 'Genom rätt annons, rätt pris och aktiv förhandling driver vi upp slutpriset jämfört med ett direktbud från en handlare.',
                img: '/benefit1.f6fa1ca3.svg',
                reverse: false,
              },
              {
                title: 'Tydlig prissättning. Inga överraskningar.',
                text: 'En uppläggningsavgift tas ut vid start. När bilen är såld tillkommer 2 % av priset (minst 3 995 kr).',
                img: '/benefit2.e5b8ac47.svg',
                reverse: true,
              },
            ].map((b, i) => (
              <div
                key={b.title}
                className={`py-8 sm:py-12 ${i % 2 === 1 ? 'bg-slate-50 -mx-5 sm:-mx-6 px-5 sm:px-6 rounded-none' : ''}`}
              >
                <div className={`max-w-5xl mx-auto grid md:grid-cols-2 gap-6 sm:gap-10 items-center ${b.reverse ? 'md:[&>*:first-child]:order-2' : ''}`}>
                  <div>
                    <h3 className="text-[22px] sm:text-[30px] font-semibold text-slate-900 mb-3 sm:mb-4 leading-[1.2]">
                      {b.title}
                    </h3>
                    <p className="text-[15px] sm:text-[17px] text-slate-600 leading-relaxed max-w-lg">
                      {b.text}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src={b.img}
                      alt=""
                      className="w-full max-w-[200px] sm:max-w-[260px] h-[140px] sm:h-[180px] object-contain"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ReviewsSection variant="muted" />

      <section className="bg-[#f5f8fc] py-12 sm:py-20 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-3 sm:mb-4 block">
              Kom igång
            </span>
            <h3 className="text-[26px] sm:text-[44px] font-semibold text-slate-900 leading-[1.15] sm:leading-[1.08] tracking-tight">
              Se vad din bil kan säljas för
            </h3>
            <p className="text-[15px] sm:text-[17px] text-slate-600 mt-4 sm:mt-5 leading-[1.6] max-w-md">
              Fyll i ditt regnummer — en personlig rådgivare hör av sig för att gå igenom ditt maxpris.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] border border-slate-100 p-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              <RegInput value={regnummer} onChange={(v) => { setRegnummer(v); setError(''); }} disabled={submitting} />
              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg bg-[#0e6efe] text-white text-[13px] font-semibold px-3 py-2 shadow-sm">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-[1px]" strokeWidth={2.5} />
                  <span className="leading-snug">{error}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="mt-1 h-12 w-full rounded-lg bg-[#0047B3] hover:bg-[#003a94] disabled:bg-slate-400 text-white font-semibold text-[15px] transition inline-flex items-center justify-center gap-2 group"
              >
                {submitting ? 'Skickar…' : 'Starta värdering'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <SiteFooter />

      {carsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setCarsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCarsModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Stäng"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 sm:p-10">
              <h2 className="text-[24px] sm:text-[28px] font-semibold text-slate-900 tracking-tight mb-4">
                Vilka bilar köper Bilto?
              </h2>
              <p className="text-slate-600 text-[15px] leading-[1.65]">
                Bilto hjälper till att förmedla och sälja de flesta typer av bilar – oavsett märke, modell eller skick.
                Vi arbetar både med privatpersoner och ett nätverk av seriösa bilhandlare över hela Sverige, vilket gör
                att vi kan hitta köpare för många olika typer av fordon.
              </p>

              <h3 className="mt-6 text-[16px] font-semibold text-slate-900">Vi hjälper bland annat till med:</h3>
              <ul className="mt-2 space-y-1 text-slate-600 text-[15px] leading-[1.65] list-disc pl-5">
                <li>Personbilar</li>
                <li>Kombibilar</li>
                <li>SUV:ar</li>
                <li>Elbilar och hybridbilar</li>
                <li>Transportbilar och lätta företagsbilar</li>
                <li>Fyrhjulsdrivna bilar</li>
                <li>Sport- och premiumbilar</li>
                <li>Äldre bilar med högre miltal</li>
              </ul>

              <h3 className="mt-6 text-[16px] font-semibold text-slate-900">Bilar vi oftast kan sälja snabbt</h3>
              <p className="mt-1 text-slate-600 text-[15px] leading-[1.65]">
                Vissa bilar är extra eftertraktade på marknaden och får ofta många intressenter:
              </p>
              <ul className="mt-2 space-y-1 text-slate-600 text-[15px] leading-[1.65] list-disc pl-5">
                <li>Nyare bilar</li>
                <li>Svensksålda bilar</li>
                <li>Bilar med servicehistorik</li>
                <li>Automatlåda</li>
                <li>El- och hybridbilar</li>
                <li>Populära märken som Volvo, BMW, Audi, Volkswagen, Tesla och Toyota</li>
              </ul>

              <h3 className="mt-6 text-[16px] font-semibold text-slate-900">Kan ni hjälpa till med äldre eller skadade bilar?</h3>
              <p className="mt-1 text-slate-600 text-[15px] leading-[1.65]">
                Ja. Även äldre bilar, bilar med kosmetiska skador eller högre miltal kan vara intressanta för våra köpare och handlare.
                Det viktigaste är att informationen om bilen är korrekt när du skickar in din förfrågan.
              </p>

              <h3 className="mt-6 text-[16px] font-semibold text-slate-900">Hur vet jag om min bil är intressant?</h3>
              <p className="mt-1 text-slate-600 text-[15px] leading-[1.65]">
                Det kostar inget att skicka in bilen till Bilto för en första bedömning. När vi fått in information och
                bilder gör vi en värdering och ser vilka köpare eller handlare som kan vara intresserade. Du väljer
                alltid själv om du vill gå vidare med försäljningen eller inte.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#0e6efe] text-white/80 pt-12 pb-8 px-6 sm:pt-14 sm:pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center md:hidden pb-8">
          <img
            src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
            alt="Bilto"
            className="h-40 w-auto object-contain"
          />
          <p className="mt-2 text-[14px] text-white/85 leading-relaxed max-w-xs">
            Sälj din bil tryggt och till bästa pris. Jämför bud från hundratals handlare.
          </p>
        </div>

        <div className="hidden md:grid md:grid-cols-4 gap-10 pb-10 border-b border-white/20">
          <div className="md:col-span-1">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain -ml-2"
            />
            <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-xs">
              Sälj din bil tryggt och till bästa pris. Jämför bud från hundratals handlare.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Sälj
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/" className="hover:text-white transition">Värdera din bil</a></li>
              <li><a href="/salj-din-bil" className="hover:text-white transition">Sälj din bil</a></li>
              <li><a href="/kop-bil" className="hover:text-white transition">Köp bil</a></li>
              <li><a href="#" className="hover:text-white transition">Elbilar</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Företag
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/om-oss" className="hover:text-white transition">Om Bilto</a></li>
              <li><a href="/sa-funkar-det" className="hover:text-white transition">Så funkar det</a></li>
              <li><a href="/blogg" className="hover:text-white transition">Blogg</a></li>
              <li><a href="/handlare/registrera" className="hover:text-white transition">Bli handlare</a></li>
              <li><a href="/handlare/logga-in" className="hover:text-white transition">Logga in som handlare</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Kontakt
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a href="tel:+46855550200" className="hover:text-white transition">08-5555 0200</a></li>
              <li><a href="mailto:hej@bilto.se" className="hover:text-white transition">hej@bilto.se</a></li>
              <li><a href="/anvandarvillkor" className="hover:text-white transition">Användarvillkor</a></li>
              <li><a href="/integritetspolicy" className="hover:text-white transition">Integritetspolicy</a></li>
            </ul>
          </div>
        </div>

        <div className="md:hidden grid grid-cols-2 gap-x-6 gap-y-8 py-8">
          <div>
            <h4 className="text-white font-semibold mb-3 text-[12px] uppercase tracking-wider">
              Sälj
            </h4>
            <ul className="space-y-2.5 text-[14px]">
              <li><a href="/" className="hover:text-white transition">Värdera din bil</a></li>
              <li><a href="/salj-din-bil" className="hover:text-white transition">Sälj din bil</a></li>
              <li><a href="/kop-bil" className="hover:text-white transition">Köp bil</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-[12px] uppercase tracking-wider">
              Företag
            </h4>
            <ul className="space-y-2.5 text-[14px]">
              <li><a href="/om-oss" className="hover:text-white transition">Om Bilto</a></li>
              <li><a href="/sa-funkar-det" className="hover:text-white transition">Så funkar det</a></li>
              <li><a href="/blogg" className="hover:text-white transition">Blogg</a></li>
              <li><a href="/handlare/registrera" className="hover:text-white transition">Bli handlare</a></li>
              <li><a href="/handlare/logga-in" className="hover:text-white transition">Logga in som handlare</a></li>
              <li><a href="/admin" className="hover:text-white transition">Admin</a></li>
            </ul>
          </div>
          <div className="col-span-2">
            <h4 className="text-white font-semibold mb-3 text-[12px] uppercase tracking-wider">
              Kontakt
            </h4>
            <ul className="space-y-2.5 text-[14px]">
              <li><a href="tel:+46855550200" className="hover:text-white transition">08-5555 0200</a></li>
              <li><a href="mailto:hej@bilto.se" className="hover:text-white transition">hej@bilto.se</a></li>
              <li><a href="/anvandarvillkor" className="hover:text-white transition">Användarvillkor</a></li>
              <li><a href="/integritetspolicy" className="hover:text-white transition">Integritetspolicy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-[12px] sm:text-xs text-white/70 text-center">
          <p>&copy; {new Date().getFullYear()} Bilto AB. Alla rättigheter förbehållna.</p>
          <div className="flex items-center gap-4">
            <a href="/admin" className="hidden md:inline hover:text-white transition">Admin</a>
            <span className="hidden md:inline text-white/30">·</span>
            <p>Gjord med omsorg i Sverige.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
