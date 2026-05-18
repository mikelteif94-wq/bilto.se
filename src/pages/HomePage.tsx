import { useState, useEffect } from 'react';
import { User, Menu, Search, Phone, XCircle, Car, Sparkles, Handshake, Mail } from 'lucide-react';

import { supabase } from '../lib/supabase';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from './BrokerageLanding';
import SeoCarsSection from '../components/SeoCarsSection';
import RegInput from '../components/RegInput';

interface HomePageProps {
  onNavigate: (regnummer: string, telefon: string) => void;
  showSeo?: boolean;
  pageTitle?: string;
}

const HERO_IMAGE = '/d158d2d6-7209-4239-986d-842219ae491d.jpg';

export default function HomePage({ onNavigate, showSeo = false, pageTitle }: HomePageProps) {
  useEffect(() => {
    if (pageTitle) {
      document.title = pageTitle;
    }
  }, [pageTitle]);
  const [tab, setTab] = useState<'direkt' | 'maxpris'>('direkt');
  const [regnummer, setRegnummer] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [variant, setVariant] = useState<'default' | 'elbil'>('default');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    if (item === 'Sälj bil') {
      setTab('direkt');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (item === 'Köp bil') {
      window.history.pushState({}, '', '/kop-bil');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    if (item === 'Om oss') {
      window.history.pushState({}, '', '/om-oss');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    if (item === 'Så funkar det') {
      window.history.pushState({}, '', '/sa-funkar-det');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
  };

  const heroTitle =
    tab === 'maxpris'
      ? variant === 'elbil'
        ? 'Maxpris på din elbil.'
        : 'Få maxpris för din bil.'
      : 'Värdera och sälj din bil till bästa pris.';
  const heroTitleMobile =
    tab === 'maxpris' ? (
      variant === 'elbil' ? (
        <>Maxpris på<br />din elbil.</>
      ) : (
        <>Få maxpris<br />för din bil.</>
      )
    ) : (
      <>Värdera och sälj din bil till bästa pris.</>
    );
  const heroSubtitle =
    tab === 'maxpris' ? (
      <>Låt handlare <span className="font-bold">tävla om att förmedla</span> din bil till högst pris — lägst arvode vinner.</>
    ) : variant === 'elbil' ? (
      <>Jämför <span className="font-bold">bud från elbilshandlare</span> och sälj din elbil tryggt inom 48 timmar.</>
    ) : (
      <>Jämför <span className="font-bold">bud från hundratals handlare</span> och sälj din bil tryggt inom 48 timmar.</>
    );
  const heroSubtitleMobile =
    tab === 'maxpris' ? (
      <>Låt handlare <span className="font-bold">tävla om högst pris</span>.</>
    ) : variant === 'elbil' ? (
      <>Jämför <span className="font-bold">bud från elbilshandlare</span>.</>
    ) : (
      <>Jämför <span className="font-bold">bud från hundratals handlare</span>.</>
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const regTrim = regnummer.trim().toUpperCase().replace(/\s/g, '');
    const telTrim = telefon.trim();
    if (!regTrim) {
      setError('Ange ett registreringsnummer');
      return;
    }
    if (!/^[A-Z]{3}[0-9]{2}[A-Z0-9]$/.test(regTrim)) {
      setError('Registreringsnummer måste vara 3 bokstäver följt av 3 tecken (t.ex. ABC123)');
      return;
    }
    if (!telTrim || telTrim.replace(/\D/g, '').length < 6) {
      setError('Ange ett giltigt telefonnummer');
      return;
    }
    setError('');
    setSubmitting(true);
    const emailTrim = email.trim();
    await supabase.from('leads').insert({ regnummer: regTrim, telefon: telTrim, email: emailTrim });
    try {
      const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-lead`;
      await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefon: telTrim, regnummer: regTrim, email: emailTrim, source: 'Startsidan' }),
      });
    } catch { /* best effort */ }
    setSubmitting(false);
    onNavigate(regTrim, telTrim);
  };

  const navItems = ['Sälj bil', 'Köp bil'];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Sälj bil"
        onSelect={handleMenuSelect}
      />
      <header className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-slate-200 transition-colors duration-300 ${scrolled ? 'bg-white' : 'bg-white/80 backdrop-blur-md'}`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-slate-900"
          >
            <Menu className="w-6 h-6 text-slate-900" strokeWidth={2} />
          </button>
          <a href="/" className="shrink-0 lg:mr-10 -ml-1 lg:-ml-3 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="hidden lg:block h-16 lg:h-32 w-auto object-contain"
            />
          </a>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (item === 'Sälj bil') {
                    setTab('direkt');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                  }
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
                }}
                className="text-[15px] font-semibold text-slate-900 hover:text-[#0e6efe] transition"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center ml-auto">
<a
              href="/logga-in"
              className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#0e6efe] text-white text-[14px] font-extrabold uppercase tracking-[0.08em] shadow-md hover:bg-[#0a57cc] active:scale-[0.98] transition"
            >
              LOGGA IN
            </a>
          </div>
        </div>
      </header>

      <section className="hidden lg:block relative pt-16">
        <div
          className="relative w-full overflow-hidden"
          style={{
            minHeight: 'calc((100vh - 72px) * 1.05)',
            backgroundColor: '#0a1220',
          }}
        >
          <img
            src={HERO_IMAGE}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 80%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          <div className="relative z-10 h-full flex flex-col items-center pt-16 px-0 lg:px-4">
            <h1 className="text-center text-white font-bold leading-[1.05] text-[44px] lg:text-[64px] tracking-tight px-6 lg:px-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.55)]">
              {heroTitle}
            </h1>
            <p className="text-center text-white mt-6 text-[20px] lg:text-[26px] font-medium max-w-3xl px-8 lg:px-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
              {heroSubtitle}
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 w-full max-w-[640px] px-6 lg:px-0"
            >
              <div className="hidden lg:flex flex-col gap-2.5 w-full max-w-md">
                <RegInput value={regnummer} onChange={(v) => { setRegnummer(v); setError(''); }} disabled={submitting} />
                <div className="flex items-center h-12 rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-[#0e6efe] focus-within:ring-2 focus-within:ring-[#0e6efe]/20 transition">
                  <span className="flex items-center justify-center w-11 shrink-0">
                    <Phone className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="tel"
                    value={telefon}
                    onChange={(e) => { setTelefon(e.target.value); setError(''); }}
                    placeholder="Telefonnummer"
                    autoComplete="tel"
                    disabled={submitting}
                    className="flex-1 min-w-0 w-0 h-full pr-4 text-[15px] text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center h-12 rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-[#0e6efe] focus-within:ring-2 focus-within:ring-[#0e6efe]/20 transition">
                  <span className="flex items-center justify-center w-11 shrink-0">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="E-postadress (valfritt)"
                    autoComplete="email"
                    disabled={submitting}
                    className="flex-1 min-w-0 w-0 h-full pr-4 text-[15px] text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-400 text-white font-semibold text-[15px] transition"
                >
                  {submitting ? '...' : tab === 'maxpris' ? 'Maxbud' : 'Värdera'}
                </button>
              </div>

              <div className="lg:hidden flex flex-col gap-2.5">
                <RegInput value={regnummer} onChange={(v) => { setRegnummer(v); setError(''); }} disabled={submitting} />
                <div className="flex items-center h-12 rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-[#0e6efe] focus-within:ring-2 focus-within:ring-[#0e6efe]/20 transition">
                  <span className="flex items-center justify-center w-11 shrink-0">
                    <Phone className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="tel"
                    value={telefon}
                    onChange={(e) => { setTelefon(e.target.value); setError(''); }}
                    placeholder="Telefonnummer"
                    autoComplete="tel"
                    disabled={submitting}
                    className="flex-1 min-w-0 w-0 h-full pr-4 text-[15px] text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center h-12 rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-[#0e6efe] focus-within:ring-2 focus-within:ring-[#0e6efe]/20 transition">
                  <span className="flex items-center justify-center w-11 shrink-0">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="E-postadress (valfritt)"
                    autoComplete="email"
                    disabled={submitting}
                    className="flex-1 min-w-0 w-0 h-full pr-4 text-[15px] text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 w-full rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-400 text-white font-semibold text-[14px] transition"
                >
                  {submitting ? '...' : tab === 'maxpris' ? 'Maxbud' : 'Värdera'}
                </button>
              </div>
              {error && (
                <div className="flex justify-center mt-3">
                  <div role="alert" className="inline-flex items-center gap-2 rounded-full bg-[#0e6efe] text-white text-[13px] font-semibold px-4 py-1.5 shadow-sm">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" strokeWidth={2.5} />
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-6 flex items-center gap-8">
              <button
                type="button"
                onClick={() => setTab('direkt')}
                className="relative pb-1 text-[18px] font-semibold text-white"
              >
                Direktbud
                {tab === 'direkt' && (
                  <span className="absolute left-0 right-0 -bottom-0 h-[2px] bg-white" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/kop-bil');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="relative pb-1 text-[18px] font-semibold text-white"
              >
                Maxpris
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="hidden lg:block bg-white">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <div className="flex items-center gap-12">
            <div className="flex-1">
              <p className="text-[#0e6efe] text-sm font-bold uppercase tracking-[0.12em] mb-4">
                Så enkelt är det
              </p>
              <h2 className="text-slate-900 font-bold text-[44px] leading-[1.1] tracking-tight mb-5">
                Värdera, sälj och luta dig tillbaka.
              </h2>
              <p className="text-slate-600 text-[18px] leading-relaxed max-w-xl">
                Ange ditt registreringsnummer, få ett bud från en verifierad bilhandlare
                och få bilen hämtad — helt gratis och utan krångel.
              </p>
            </div>
            <div className="shrink-0">
              <img
                src="/Bl%C3%A5_bilikon_i_vit_cirkel.png"
                alt="Bilto"
                className="w-[340px] h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="lg:hidden pt-16 bg-white">
        <div className="bg-[#e8f4ef]">
          <div className="relative w-full">
            <img
              src={HERO_IMAGE}
              alt=""
              fetchPriority="high"
              decoding="async"
              className="w-full h-[220px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <h1 className="text-white font-bold leading-[1.1] text-[30px] tracking-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.6)]">
                {heroTitleMobile}
              </h1>
              <p className="text-white mt-2 text-[14px] font-medium max-w-xs drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                {heroSubtitleMobile}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-8 bg-white">
          <div className="flex items-center mb-4 rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab('direkt')}
              className={`flex-1 h-10 rounded-full text-[14px] font-semibold transition ${
                tab === 'direkt'
                  ? 'bg-black text-white'
                  : 'bg-transparent text-slate-600'
              }`}
            >
              Direktbud
            </button>
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/kop-bil');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="flex-1 h-10 rounded-full text-[14px] font-semibold transition bg-transparent text-slate-600"
            >
              Maxpris
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <RegInput value={regnummer} onChange={(v) => { setRegnummer(v); setError(''); }} disabled={submitting} />
            <input
              type="tel"
              value={telefon}
              onChange={(e) => {
                setTelefon(e.target.value);
                setError('');
              }}
              placeholder="Telefonnummer"
              autoComplete="tel"
              disabled={submitting}
              className="form-control"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="E-postadress (valfritt)"
              autoComplete="email"
              disabled={submitting}
              className="form-control"
            />
            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg bg-[#0e6efe] text-white text-[13px] font-semibold px-3 py-2 shadow-sm">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-[1px]" strokeWidth={2.5} />
                <span className="leading-snug">{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 h-12 w-full rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-400 text-white font-semibold text-[15px] transition"
            >
              {submitting ? '...' : tab === 'maxpris' ? 'Maxbud' : 'Värdera'}
            </button>
          </form>
        </div>
      </section>

      <section className="bg-[#f5f8fc] py-14 sm:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl sm:text-[34px] font-semibold text-slate-900 mb-14">
            Så funkar det
          </h2>
          <div className="flex flex-col md:flex-row md:items-start gap-12 md:gap-8">
            {[
              {
                step: 1,
                title: 'Registrera din bil',
                text: 'Fyll i regnummer, miltal, skick och några bilder. Tar under fem minuter.',
              },
              {
                step: 2,
                title: 'Handlare lägger bud',
                text: 'Utvalda bilhandlare lämnar sina bästa bud i en sluten auktion under 48 timmar.',
              },
              {
                step: 3,
                title: 'Du väljer själv',
                text: 'Din personliga bilmäklare presenterar högsta budet. Du bestämmer om du säljer.',
              },
            ].map((c) => (
              <div key={c.step} className="flex flex-col items-center text-center flex-1">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-[16px] font-bold text-white mb-5">
                  {c.step}
                </div>
                <h3 className="text-[20px] font-bold text-slate-900 mb-3">
                  {c.title}
                </h3>
                <p className="text-slate-600 leading-relaxed max-w-md">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-14">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
              Personlig service
            </span>
            <h2 className="text-[34px] sm:text-[44px] font-semibold leading-[1.08] text-slate-900 tracking-tight">
              Vi mäklar — oavsett hur du vill sälja.
            </h2>
            <p className="text-slate-600 mt-5 text-[17px] leading-[1.6] max-w-2xl">
              En personlig bilmäklare sköter affären — du får rätt pris utan krångel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 max-w-5xl mx-auto">
            {[
              {
                icon: Car,
                title: 'Du berättar om bilen',
                text: 'Regnummer och miltal räcker. Din personliga mäklare hör av sig och går igenom dina alternativ.',
              },
              {
                icon: Sparkles,
                title: 'Vi föreslår bästa vägen',
                text: 'Direktbud eller förmedling — vi rekommenderar det som ger dig mest i plånboken och lägst krångel.',
              },
              {
                icon: Handshake,
                title: 'Vi sköter affären',
                text: 'Oavsett väg tar vi samtalen, förhandlar och ser till att affären går tryggt i mål.',
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="flex flex-col items-center text-center px-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e8f0ff] to-[#d6e4ff] flex items-center justify-center mb-6 shadow-sm ring-1 ring-[#0e6efe]/10">
                    <Icon className="w-8 h-8 text-[#0e6efe]" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[20px] md:text-[21px] font-semibold mb-3 text-slate-900 leading-snug tracking-tight">
                    {c.title}
                  </h3>
                  <p className="text-slate-600 text-[15px] md:text-[16px] leading-[1.65] max-w-sm">
                    {c.text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-5">
            <button
              onClick={() => {
                window.history.pushState({}, '', '/kop-bil');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[15px] transition"
            >
              Prata med en mäklare
            </button>
            <p className="text-slate-500 text-[14px]">
              Personlig rådgivning — gratis och utan bindning.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f8fc] pb-8 px-6 pt-14 sm:pt-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl sm:text-[34px] font-semibold text-slate-900 mb-14">
            Fördelar med Bilto
          </h2>
          <div className="flex flex-col">
            {[
              {
                title: 'Snabbt och enkelt',
                text: 'Vi frågar bara om det som påverkar bilens värde, så att du får ett riktigt bud på några minuter.',
                img: '/benefit3.d9e1ec2e_(1).svg',
                reverse: false,
              },
              {
                title: 'Full transparens',
                text: 'Se hur miltal, färg och utrustning påverkar värdet. Din mäklare förklarar hela värderingen.',
                img: '/benefit1.f6fa1ca3.svg',
                reverse: true,
              },
              {
                title: 'Tryggt betalt',
                text: 'Du får betalt direkt av en certifierad bilhandlare — utan risk och krångel.',
                img: '/benefit2.e5b8ac47.svg',
                reverse: false,
              },
            ].map((b, i) => (
              <div
                key={b.title}
                className={`py-12 ${i % 2 === 1 ? 'bg-slate-50 -mx-6 px-6 rounded-none' : ''}`}
              >
                <div className={`max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center ${b.reverse ? 'md:[&>*:first-child]:order-2' : ''}`}>
                  <div>
                    <h3 className="text-[26px] sm:text-[30px] font-semibold text-slate-900 mb-4">
                      {b.title}
                    </h3>
                    <p className="text-[17px] text-slate-600 leading-relaxed max-w-lg">
                      {b.text}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src={b.img}
                      alt=""
                      className="w-full max-w-[260px] h-[180px] object-contain"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14 sm:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl sm:text-[34px] font-semibold text-slate-900 mb-12">
            Verifierade kundrecensioner
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: 'Johan Eriksson',
                text: 'Allt var enkelt och snabbt. Jag fick ett bra bud redan från start.',
                img: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
                mobile: true,
              },
              {
                name: 'Sara Lindgren',
                text: 'Jag rekommenderar verkligen Bilto om du ska sälja din bil, man blir väl omhändertagen hela vägen.',
                img: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
                mobile: false,
              },
              {
                name: 'David Karlsson',
                text: 'Alla på Bilto var professionella, trevliga och följde upp om jag hade frågor.',
                img: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=200',
                mobile: false,
              },
              {
                name: 'Anna Bergström',
                text: 'Hela teamet jag jobbade med var professionella, snabba och informativa.',
                img: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200',
                mobile: false,
              },
            ].map((r) => (
              <div
                key={r.name}
                className={`bg-white rounded-md p-6 sm:p-8 flex items-start gap-5 shadow-sm border border-slate-200 ${r.mobile ? '' : 'hidden md:flex'}`}
              >
                <img
                  src={r.img}
                  alt={r.name}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                />
                <div>
                  <p className="text-slate-800 leading-relaxed mb-3">
                    {r.text}
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    {r.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14 sm:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col items-center text-center md:text-left md:items-start">
              <h3 className="text-[28px] sm:text-[34px] font-semibold text-slate-900 leading-tight">
                Vill du sälja din bil?
              </h3>
              <p className="text-[18px] sm:text-[20px] text-slate-600 mt-3 mb-6">
                Få ett skarpt bud från utvalda handlare på några minuter
              </p>
              <img
                src="https://www.truecar.com/assets/_next/static/media/audi-a5.06472ad9.png?auto=format&h=484&w=960"
                alt="Audi A5"
                className="w-full max-w-md object-contain"
              />
            </div>
            <div className="bg-white rounded-2xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] p-5">
              <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                <RegInput value={regnummer} onChange={(v) => { setRegnummer(v); setError(''); }} disabled={submitting} />
                <label className="relative flex items-center h-12 rounded-lg border border-slate-300 bg-white focus-within:border-slate-900 transition">
                  <span className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                    <Phone className="w-5 h-5 text-slate-500" strokeWidth={2} />
                  </span>
                  <input
                    type="tel"
                    value={telefon}
                    onChange={(e) => {
                      setTelefon(e.target.value);
                      setError('');
                    }}
                    placeholder="Telefonnummer"
                    autoComplete="tel"
                    disabled={submitting}
                    className="flex-1 min-w-0 w-0 h-full pl-[60px] pr-3 bg-transparent text-[15px] text-slate-900 focus:outline-none placeholder:text-slate-400"
                  />
                </label>
                <label className="relative flex items-center h-12 rounded-lg border border-slate-300 bg-white focus-within:border-slate-900 transition">
                  <span className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-500" strokeWidth={2} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="E-postadress (valfritt)"
                    autoComplete="email"
                    disabled={submitting}
                    className="flex-1 min-w-0 w-0 h-full pl-[60px] pr-3 bg-transparent text-[15px] text-slate-900 focus:outline-none placeholder:text-slate-400"
                  />
                </label>
                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-lg bg-[#0e6efe] text-white text-[13px] font-semibold px-3 py-2 shadow-sm">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-[1px]" strokeWidth={2.5} />
                    <span className="leading-snug">{error}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 h-12 w-full rounded-lg bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-400 text-white font-semibold text-[15px] transition"
                >
                  {submitting ? 'Skickar…' : 'Värdera min bil'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {showSeo && <SeoCarsSection />}

      <SiteFooter />

    </div>
  );
}
