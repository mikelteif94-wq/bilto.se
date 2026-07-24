import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Menu,
  User,
  Loader2,
  Plus,
  Trash2,
  Send,
  Handshake,
  ShieldCheck,
  TrendingUp,
  Star,
  Sparkles,
  Award,
  Clock,
  Mail,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import ErrorBanner from '../components/ErrorBanner';
import { setPageMeta } from '../lib/pageMeta';

interface Props {
  onBack: () => void;
  mode?: 'landing' | 'form';
  onNavigateApply?: () => void;
}

const SPECIALTY_OPTIONS = [
  'Lyxbilar',
  'Elbilar',
  'Hybrid',
  'Familjebilar',
  'SUV',
  'Transportbilar',
  'Småbilar',
  'Prisförhandling',
  'Finansiering',
  'Inbyte',
  'TCO',
  'Säkerhet',
];

const LANGUAGE_OPTIONS = ['Svenska', 'Engelska', 'Tyska', 'Norska', 'Danska', 'Finska', 'Spanska', 'Franska'];

const STEPS = [
  { icon: Send, title: 'Skicka ansökan', text: 'Fyll i formuläret med din erfarenhet och dina specialiteter.' },
  { icon: Handshake, title: 'Intervju', text: 'Vi tar ett kort samtal för att lära känna dig och ditt arbetssätt.' },
  { icon: Award, title: 'Certifiering', text: 'Genomgå utbildning och prov – sedan är du redo att ta emot leads.' },
];

const BENEFITS = [
  { icon: TrendingUp, title: 'Inkomst på dina villkor', text: 'Du tar de uppdrag du vill – arvodet betalas per avslutad affär.' },
  { icon: ShieldCheck, title: 'Tryggt och transparent', text: 'Alla villkor är tydliga från start. Inga dolda avgifter.' },
  { icon: Clock, title: 'Flexibilitet', text: 'Du bestämmer din egen tid. Arbeta hemifrån eller på plats – helt upp till dig.' },
  { icon: Star, title: 'Bygg din reputation', text: 'Varje avslutad affär bygger din profil med verifierade betyg.' },
];

export default function ForhandlareOnboarding({ onBack, mode = 'landing', onNavigateApply }: Props) {
  const showForm = mode === 'form';
  const showLanding = mode === 'landing';
  const goApply = () => {
    if (onNavigateApply) onNavigateApply();
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: 'Bli förhandlare – Bilto',
      description: 'Ansök för att bli certifierad Bilto-förhandlare. Ta uppdrag på dina villkor.',
      canonical: 'https://bilto.se/forhandlare/registrera',
    });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [fornamn, setFornamn] = useState('');
  const [efternamn, setEfternamn] = useState('');
  const [mejl, setMejl] = useState('');
  const [telefon, setTelefon] = useState('');
  const [stad, setStad] = useState('');
  const [erfarenhetAr, setErfarenhetAr] = useState('');
  const [specialiteter, setSpecialiteter] = useState<string[]>([]);
  const [sprak, setSprak] = useState<string[]>(['Svenska']);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navItems: MobileMenuItem[] = ['Sälj bil', 'Bilköpshjälpen', 'Priser', 'Bilspara'];

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Bilköpshjälpen': '/kop-bil',
      'Priser': '/priser',
      'Bilspara': '/bilspara',
    };
    const route = routes[item];
    if (route) {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onBack();
  };

  const toggleSpecialty = (s: string) => {
    setSpecialiteter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const toggleLang = (l: string) => {
    setSprak((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fornamn.trim() || !efternamn.trim() || !mejl.trim() || !telefon.trim() || !stad.trim()) {
      setError('Fyll i alla obligatoriska fält.');
      return;
    }

    if (sprak.length === 0) {
      setError('Välj minst ett språk.');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('forhandlare_applications').insert({
        fornamn: fornamn.trim(),
        efternamn: efternamn.trim(),
        mejl: mejl.trim(),
        telefon: telefon.trim(),
        stad: stad.trim(),
        erfarenhet_ar: parseInt(erfarenhetAr, 10) || 0,
        specialiteter: specialiteter,
        sprak: sprak,
        linkedin_url: linkedinUrl.trim(),
        bio: bio.trim(),
        status: 'pending',
      });

      if (insertError) {
        const msg = (insertError?.message ?? '').toLowerCase();
        let userMessage = 'Något gick fel. Försök igen eller kontakta oss.';
        if (msg.includes('duplicate') || msg.includes('unique')) {
          userMessage = 'En ansökan med denna e-post finns redan. Kontakta oss om du tror det är ett fel.';
        } else if (msg.includes('network') || msg.includes('failed to fetch')) {
          userMessage = 'Vi kunde inte nå servern. Kontrollera din internetuppkoppling och försök igen.';
        } else if (msg.includes('relation') && msg.includes('does not exist')) {
          userMessage = 'Ansökan är inte tillgänglig ännu. Försök igen senare.';
        }
        setError(userMessage);
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(true);
    } catch {
      setError('Något gick fel. Försök igen.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-10">
        <div className="max-w-lg w-full bg-white rounded-xl border border-slate-200 p-8 sm:p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-[#0e6efe]" strokeWidth={2.5} />
          </div>
          <h1 className="text-[28px] font-semibold text-slate-900 mb-3 tracking-tight">
            Tack för din ansökan!
          </h1>
          <p className="text-slate-600 mb-7 leading-relaxed text-[15.5px]">
            Vi har tagit emot din ansökan och granskar dina uppgifter. Du hör från oss inom 48 timmar med nästa steg.
          </p>

          <div className="bg-[#0e6efe]/5 border border-[#0e6efe]/15 rounded-xl p-5 mb-7 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 ring-1 ring-[#0e6efe]/15">
                <Mail className="w-5 h-5 text-[#0e6efe]" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-slate-900 mb-1">
                  Bekräftelse skickad
                </p>
                <p className="text-[13.5px] text-slate-600 leading-[1.55] break-all">
                  Vi har skickat en bekräftelse till <span className="font-semibold text-slate-900">{mejl || 'din e-postadress'}</span>. Kolla även skräpposten om du inte ser det inom några minuter.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[13px] text-slate-500 leading-relaxed mb-7">
            När din ansökan är godkänd bjuder vi in dig till ett introduktionssamtal och certifieringsprocess.
          </p>

          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[14px] transition"
          >
            Till startsidan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelect={handleMenuSelect}
      />
      <header
        className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${
          showForm || scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]/40 backdrop-blur-md'
        }`}
      >
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white"
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={onBack} className="shrink-0 lg:mr-10 ml-2 lg:ml-0 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
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
              href="/forhandlare"
              className="inline-flex items-center gap-2 bg-white text-[#0e6efe] text-[14px] font-semibold px-5 h-10 rounded-xl hover:bg-slate-100 transition whitespace-nowrap"
            >
              <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
              Hitta förhandlare
            </a>
          </div>
        </div>
      </header>

      <main>
        {showLanding && (
          <>
            {/* ── Hero ── */}
            <section className="relative bg-[#0e6efe] overflow-hidden pt-24">
              <div className="absolute -left-32 -top-10 w-[480px] h-[480px] rounded-full bg-[#3d8cff] opacity-60" />
              <div className="absolute right-10 -bottom-40 w-[560px] h-[560px] rounded-full bg-[#3d8cff] opacity-50" />
              <div className="absolute left-1/2 -translate-x-1/2 top-40 w-[380px] h-[380px] rounded-full bg-[#66a5ff] opacity-40" />

              <div className="relative max-w-[1280px] mx-auto px-6 pt-10 pb-16 lg:pt-20 lg:pb-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
                <div>
                  <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-[14px] text-white/80 hover:text-white transition mb-6"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Tillbaka
                  </button>
                  <h1 className="text-white text-[40px] sm:text-[56px] lg:text-[64px] font-semibold leading-[1.05] tracking-tight">
                    Bli en certifierad<br />Bilto-förhandlare
                  </h1>
                  <p className="mt-6 text-white/90 text-[17px] leading-[1.6] max-w-lg">
                    Hjälp kunder förhandla fram bättre bilaffärer – och tjäna pengar
                    på dina villkor. Flexibelt, tryggt och med fullt stöd från Bilto.
                  </p>

                  <ul className="mt-8 space-y-3 text-[16px] text-white">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
                      Arvode per avslutad affär
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
                      Sätt din egen schema
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
                      Certifiering och utbildning ingår
                    </li>
                  </ul>
                  <div className="mt-9">
                    <button
                      type="button"
                      onClick={goApply}
                      className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-white text-[#0e6efe] hover:bg-white/90 font-semibold text-[15px] transition"
                    >
                      Ansök nu
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <img
                    src="/BSM_car_sale_key_woman_handover_101122.jpg"
                    alt="Förhandlare hjälper kund"
                    className="w-full h-[280px] sm:h-[400px] lg:h-[460px] object-cover object-center rounded-xl shadow-2xl"
                    loading="eager"
                  />
                  <div className="absolute -bottom-5 -left-3 sm:-left-5 bg-white rounded-xl shadow-xl p-4 sm:p-5 max-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-[15px] font-bold text-slate-900">4.8 snittbetyg</span>
                    </div>
                    <p className="text-[12px] text-slate-500 leading-snug">Baserat på verifierade affärer</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Så funkar det ── */}
            <section className="bg-[#f5f8fc] py-16 sm:py-24 px-5 sm:px-6">
              <div className="max-w-5xl mx-auto">
                <div className="mb-12 sm:mb-16 max-w-xl">
                  <span className="text-[12px] font-medium text-slate-500 mb-3 block">– Så funkar det</span>
                  <h2 className="text-[34px] sm:text-[48px] font-semibold leading-[1.02] text-slate-900 tracking-[-0.02em]">
                    Tre steg till certifiering.
                  </h2>
                  <p className="text-slate-600 mt-5 text-[17px] leading-[1.6] max-w-2xl">
                    Från ansökan till certifierad förhandlare – vi gör processen enkel och tydlig.
                  </p>
                </div>

                <ol className="relative lg:grid lg:grid-cols-3 lg:gap-10">
                  {STEPS.map((step, i, arr) => {
                    const Icon = step.icon;
                    const isLast = i === arr.length - 1;
                    return (
                      <li
                        key={step.title}
                        className="relative pl-14 sm:pl-20 pb-10 sm:pb-12 last:pb-0 lg:pl-0 lg:pb-0 lg:pt-[70px]"
                      >
                        {!isLast && (
                          <span
                            aria-hidden
                            className="absolute left-[19px] sm:left-[27px] top-10 sm:top-14 bottom-0 w-px bg-slate-200 lg:left-[54px] lg:right-0 lg:top-[27px] lg:bottom-auto lg:w-auto lg:h-px"
                          />
                        )}
                        <div className="absolute left-0 top-0 flex items-center justify-center w-10 h-10 sm:w-[54px] sm:h-[54px] rounded-full bg-white ring-1 ring-slate-200">
                          <Icon className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-[#0e6efe]" strokeWidth={2} />
                        </div>
                        <div className="flex items-baseline gap-3 mb-2">
                          <span className="text-[13px] font-medium text-slate-400 tabular-nums">0{i + 1}</span>
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

            {/* ── Fördelar ── */}
            <section className="bg-white py-16 sm:py-24 px-5 sm:px-6">
              <div className="max-w-5xl mx-auto">
                <div className="mb-10 sm:mb-14 max-w-2xl">
                  <span className="text-[11px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-4 block">
                    Fördelar
                  </span>
                  <h2 className="text-[32px] sm:text-[44px] font-semibold text-slate-900 tracking-[-0.02em] leading-[1.08]">
                    Varför bli förhandlare hos Bilto?
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-px bg-slate-200 rounded-xl overflow-hidden ring-1 ring-slate-200">
                  {BENEFITS.map((b) => {
                    const Icon = b.icon;
                    return (
                      <div key={b.title} className="bg-white p-7 sm:p-9 flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mb-5 shrink-0">
                          <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
                        </div>
                        <h3 className="text-[16px] font-bold text-slate-900 mb-2 tracking-[-0.01em]">{b.title}</h3>
                        <p className="text-slate-500 leading-[1.65] text-[14px]">{b.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── CTA ── */}
            <section className="bg-[#faf8f5] px-4 sm:px-6 py-16 sm:py-24">
              <div className="max-w-5xl mx-auto">
                <div className="relative rounded-[7px] bg-[#0e6efe] px-6 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14 overflow-hidden">
                  <div className="absolute -right-20 -top-20 w-[360px] h-[360px] rounded-full bg-white/5 pointer-events-none" />
                  <div className="absolute -left-12 -bottom-16 w-[280px] h-[280px] rounded-full bg-white/5 pointer-events-none" />

                  <div className="relative">
                    <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold tracking-[-0.02em] leading-[1.06] text-white">
                      Redo att komma igång?
                    </h2>
                    <p className="mt-4 text-white/80 text-[16px] leading-[1.6] max-w-lg">
                      Ansök idag – det tar mindre än fem minuter. Vi återkommer inom 48 timmar.
                    </p>
                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={goApply}
                        className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-white text-[#0e6efe] text-[15px] font-bold transition-all hover:bg-slate-100 active:scale-[0.98] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)]"
                      >
                        Ansök nu
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {showForm && (
          <section id="ansok" className="bg-slate-100 py-14 sm:py-20 px-6 pt-32">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] block mb-3">
                  Ansök nu
                </span>
                <h2 className="text-[32px] sm:text-[44px] font-semibold text-slate-900 leading-[1.1] tracking-tight">
                  Bli certifierad förhandlare
                </h2>
                <p className="mt-4 text-[16px] text-slate-600 leading-[1.65] max-w-xl mx-auto">
                  Fyll i dina uppgifter nedan. Vi återkommer inom 48 timmar med nästa steg.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden">
                <div className="bg-[#faf8f5] border-b border-slate-200 px-8 py-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#0e6efe]" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-slate-900 leading-tight">Din profil</h3>
                    <p className="text-[12.5px] text-slate-500">Alla fält med * är obligatoriska.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="p-8 sm:p-10 space-y-10">
                  {/* Personuppgifter */}
                  <FormGroup title="Personuppgifter">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Förnamn *" value={fornamn} onChange={setFornamn} />
                      <Field label="Efternamn *" value={efternamn} onChange={setEfternamn} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                      <Field label="E-post *" value={mejl} onChange={setMejl} type="email" placeholder="namn@exempel.se" />
                      <Field label="Telefon *" value={telefon} onChange={setTelefon} type="tel" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                      <Field label="Stad *" value={stad} onChange={setStad} placeholder="Stockholm" />
                      <Field
                        label="Erfarenhet (år)"
                        value={erfarenhetAr}
                        onChange={setErfarenhetAr}
                        type="number"
                        placeholder="5"
                      />
                    </div>
                  </FormGroup>

                  {/* Specialiteter */}
                  <FormGroup title="Specialiteter" description="Välj de områden du känner dig mest bekväm med.">
                    <div className="flex flex-wrap gap-2">
                      {SPECIALTY_OPTIONS.map((s) => {
                        const selected = specialiteter.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSpecialty(s)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium border transition ${
                              selected
                                ? 'bg-[#0e6efe] text-white border-[#0e6efe]'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {selected && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </FormGroup>

                  {/* Språk */}
                  <FormGroup title="Språk" description="Vilka språk behärskar du?">
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGE_OPTIONS.map((l) => {
                        const selected = sprak.includes(l);
                        return (
                          <button
                            key={l}
                            type="button"
                            onClick={() => toggleLang(l)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium border transition ${
                              selected
                                ? 'bg-[#0e6efe] text-white border-[#0e6efe]'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {selected && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </FormGroup>

                  {/* LinkedIn + Bio */}
                  <FormGroup title="Mer om dig">
                    <Field
                      label="LinkedIn-profil"
                      value={linkedinUrl}
                      onChange={setLinkedinUrl}
                      placeholder="https://linkedin.com/in/din-profil"
                    />
                    <div className="mt-4">
                      <label className="block">
                        <span className="block text-[13px] font-medium text-slate-700 mb-1.5">Kort beskrivning</span>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          placeholder="Berätta kort om dig själv och varför du vill bli förhandlare..."
                          className="form-control resize-none"
                        />
                      </label>
                    </div>
                  </FormGroup>

                  <ErrorBanner message={error} />

                  <div className="pt-4 md:border-t md:border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-400 text-white font-semibold text-[14.5px] rounded-xl transition"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Skicka ansökan
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}

function Field({ label, value, onChange, type = 'text', placeholder }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-slate-700 mb-1.5">{label}</span>
      <input
        type={type}
        inputMode={type === 'tel' ? 'tel' : type === 'number' ? 'numeric' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-control"
      />
    </label>
  );
}

interface FormGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function FormGroup({ title, description, children }: FormGroupProps) {
  return (
    <div>
      <div className="pb-3 mb-5 border-b border-slate-100">
        <h4 className="text-[15px] font-semibold text-slate-900 tracking-tight">{title}</h4>
        {description && <p className="mt-1 text-[13px] text-slate-500 leading-[1.55]">{description}</p>}
      </div>
      {children}
    </div>
  );
}
