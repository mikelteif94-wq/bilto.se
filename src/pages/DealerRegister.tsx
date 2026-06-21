import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Check, Menu, User, ArrowRight, Plus, Trash2, Ligature as FileSignature, Send, Phone, Handshake, Mail, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import ErrorBanner from '../components/ErrorBanner';

interface DealerRegisterProps {
  onBack: () => void;
  mode?: 'landing' | 'form';
  onNavigateApply?: () => void;
}

export default function DealerRegister({ onBack, mode = 'landing', onNavigateApply }: DealerRegisterProps) {
  const showForm = mode === 'form';
  const showLanding = mode === 'landing';
  const goApply = () => {
    if (onNavigateApply) onNavigateApply();
  };
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
  const [foretagsnamn, setForetagsnamn] = useState('');
  const [adresser, setAdresser] = useState<string[]>(['']);
  const [moderbolag, setModerbolag] = useState('');
  const [extraOrgnr, setExtraOrgnr] = useState<string[]>([]);
  const [fakturaEpost, setFakturaEpost] = useState('');
  const [fornamn, setFornamn] = useState('');
  const [efternamn, setEfternamn] = useState('');
  const [mejl, setMejl] = useState('');
  const [telefon, setTelefon] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navItems: MobileMenuItem[] = ['Sälj bil', 'Köp bil'];

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
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
    onBack();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const renaAdresser = adresser.map((a) => a.trim()).filter(Boolean);
    const renaOrgnr = [moderbolag.trim(), ...extraOrgnr.map((o) => o.trim())].filter(Boolean);

    if (
      !foretagsnamn.trim() ||
      renaAdresser.length === 0 ||
      !moderbolag.trim() ||
      !fakturaEpost.trim() ||
      !fornamn.trim() ||
      !efternamn.trim() ||
      !mejl.trim() ||
      !telefon.trim()
    ) {
      setError('Fyll i alla obligatoriska fält.');
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        await supabase.auth.signOut();
      }
    } catch {
      // Non-fatal - continue with insert
    }

    const { error: insertError } = await supabase
      .from('dealers')
      .insert({
        foretagsnamn: foretagsnamn.trim(),
        orgnr: moderbolag.trim(),
        moderbolag: moderbolag.trim(),
        organisationsnummer: renaOrgnr,
        adresser: renaAdresser,
        faktura_epost: fakturaEpost.trim(),
        fornamn: fornamn.trim(),
        efternamn: efternamn.trim(),
        kontaktperson: `${fornamn.trim()} ${efternamn.trim()}`.trim(),
        telefon: telefon.trim(),
        mejl: mejl.trim(),
        user_id: null,
        godkand: false,
      });

    if (insertError) {
      const msg = (insertError?.message ?? '').toLowerCase();
      let userMessage = 'Något gick fel. Vänligen ring oss på 08-5555 0200 så hjälper vi dig direkt.';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        userMessage = 'En ansökan med samma uppgifter finns redan. Kontakta oss på 08-5555 0200 så hjälper vi dig.';
      } else if (msg.includes('network') || msg.includes('failed to fetch')) {
        userMessage = 'Vi kunde inte nå servern. Kontrollera din internetuppkoppling och försök igen.';
      }
      setError(userMessage);
      setLoading(false);
      return;
    }

    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-dealer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealer: {
            foretagsnamn: foretagsnamn.trim(),
            orgnr: moderbolag.trim(),
            kontaktperson: `${fornamn.trim()} ${efternamn.trim()}`.trim(),
            telefon: telefon.trim(),
            mejl: mejl.trim(),
          },
        }),
      });
    } catch {
      // Non-fatal
    }

    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-10">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#0e6efe]/10 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-[#0e6efe]" strokeWidth={2.5} />
          </div>
          <h1 className="text-[28px] font-semibold text-slate-900 mb-3 tracking-tight">
            Tack för din ansökan!
          </h1>
          <p className="text-slate-600 mb-7 leading-relaxed text-[15.5px]">
            Vi har tagit emot din ansökan och granskar dina uppgifter. Du hör från oss inom 24 timmar.
          </p>

          <div className="bg-[#0e6efe]/5 border border-[#0e6efe]/15 rounded-xl p-5 mb-7 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 ring-1 ring-[#0e6efe]/15">
                <Mail className="w-5 h-5 text-[#0e6efe]" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-slate-900 mb-1">
                  Ett tack-mail är på väg
                </p>
                <p className="text-[13.5px] text-slate-600 leading-[1.55] break-all">
                  Vi har skickat en bekräftelse till <span className="font-semibold text-slate-900">{mejl || 'din e-postadress'}</span>. Kolla även skräpposten om du inte ser det inom några minuter.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[13px] text-slate-500 leading-relaxed mb-7">
            När kontot är godkänt får du ett separat mejl med inloggningsuppgifter till handlarportalen.
          </p>

          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[14px] transition"
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
      <header className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-20 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${showForm || scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]/40 backdrop-blur-md'}`}>
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
              href="/handlare/logga-in"
              className="inline-flex items-center gap-2 bg-white text-[#0e6efe] text-[14px] font-semibold px-5 h-10 rounded-full hover:bg-slate-100 transition whitespace-nowrap"
            >
              <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
              Logga in
            </a>
          </div>
        </div>
      </header>

      <main>
        {showLanding && (<>
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
                Förregistrera dig<br />hos Bilto
              </h1>
              <p className="mt-6 text-white/90 text-[17px] leading-[1.6] max-w-lg">
                Vi levererar kvalitetsleads direkt till dig. Förhandlingen sköter
                vi — registrera dig nu och var först när vi lanserar.
              </p>

              {/* Countdown timer */}
              <CountdownTimer />

              <ul className="mt-8 space-y-3 text-[16px] text-white">
                <li className="flex items-center gap-2.5">
                  <Check className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
                  Förhandsgranskade säljare
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
                  Vi förhandlar med kunden
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
                  Personligt samtal efter ansökan
                </li>
              </ul>
              <div className="mt-9">
                <button
                  type="button"
                  onClick={goApply}
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-white text-[#0e6efe] hover:bg-white/90 font-semibold text-[15px] transition"
                >
                  Förregistrera dig
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://www.truecar.com/assets/_next/static/media/audi-a5.06472ad9.png?auto=format&h=484&w=960"
                alt="Bil"
                className="w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </section>

        <section id="sa-fungerar-det" className="bg-[#f5f8fc] py-16 sm:py-24 px-5 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 sm:mb-16 max-w-xl">
              <span className="text-[12px] font-medium text-slate-500 mb-3 block">
                — Så funkar det
              </span>
              <h2 className="text-[34px] sm:text-[48px] font-semibold leading-[1.02] text-slate-900 tracking-[-0.02em]">
                Tre steg — vi jobbar, du köper.
              </h2>
              <p className="text-slate-600 mt-5 text-[17px] leading-[1.6] max-w-2xl">
                Från kvalitetslead till avslutad affär — utan att du behöver jaga samtal.
              </p>
            </div>

            <ol className="relative lg:grid lg:grid-cols-3 lg:gap-10">
              {[
                {
                  icon: Send,
                  title: 'Vi skickar leadsen',
                  text: 'Förhandsgranskade säljare med verifierade uppgifter landar direkt hos dig.',
                },
                {
                  icon: Phone,
                  title: 'Vi förhandlar åt dig',
                  text: 'Du lägger ditt bud — vi sköter alla samtal och prisdiskussioner med säljaren.',
                },
                {
                  icon: Handshake,
                  title: 'Du gör affären',
                  text: 'När säljaren accepterar hjälper vi er hela vägen till ägarbyte.',
                },
              ].map((step, i, arr) => {
                const Icon = step.icon;
                const isLast = i === arr.length - 1;
                return (
                  <li key={step.title} className="relative pl-14 sm:pl-20 pb-10 sm:pb-12 last:pb-0 lg:pl-0 lg:pb-0 lg:pt-[70px]">
                    {!isLast && (
                      <span aria-hidden className="absolute left-[19px] sm:left-[27px] top-10 sm:top-14 bottom-0 w-px bg-slate-200 lg:left-[54px] lg:right-0 lg:top-[27px] lg:bottom-auto lg:w-auto lg:h-px" />
                    )}
                    <div className="absolute left-0 top-0 flex items-center justify-center w-10 h-10 sm:w-[54px] sm:h-[54px] rounded-full bg-white ring-1 ring-slate-200">
                      <Icon className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-[#0e6efe]" strokeWidth={2} />
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

        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
            <div className="grid md:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="md:col-span-6">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] mb-4 block">
                  Nästa steg
                </span>
                <h2 className="text-[32px] sm:text-[44px] font-semibold text-slate-900 tracking-[-0.02em] leading-[1.08]">
                  Vi tar ett samtal för mer info.
                </h2>
                <p className="text-[17px] text-slate-600 mt-5 leading-[1.6] max-w-lg">
                  Ansök nedan så ringer vi upp dig och går igenom upplägget,
                  villkoren och prissättning. När du är godkänd får du tillgång
                  till plattformen.
                </p>
                <ul className="mt-8 space-y-3.5">
                  {[
                    'Personligt samtal inom 24 timmar',
                    'Transparent upplägg och villkor',
                    'Tillgång till plattformen vid godkännande',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-[#0e6efe] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                      <span className="text-[15.5px] text-slate-700 leading-[1.55]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10">
                  <button
                    type="button"
                    onClick={goApply}
                    className="h-12 px-7 rounded-lg bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[15px] transition inline-flex items-center justify-center gap-2 group"
                  >
                    Ansök nu
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>
              </div>
              <div className="md:col-span-6">
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src="/BSM_car_sale_key_woman_handover_101122.jpg"
                    alt="Samtal med rådgivare"
                    className="w-full h-[260px] sm:h-[380px] md:h-[480px] object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  <div className="hidden sm:block absolute left-6 bottom-6 bg-white rounded-xl p-5 shadow-lg max-w-xs">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="w-9 h-9 rounded-full bg-[#0e6efe]/10 text-[#0e6efe] flex items-center justify-center">
                        <Phone className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div className="text-[14px] font-semibold text-slate-900">
                        Vi ringer upp dig
                      </div>
                    </div>
                    <p className="text-[13.5px] text-slate-600 leading-[1.55]">
                      En rådgivare går igenom upplägget och svarar på dina frågor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        </>)}

        {showForm && (
        <section id="ansok" className="bg-slate-100 py-14 sm:py-20 px-6 pt-32">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] block mb-3">
                Ansök nu
              </span>
              <h2 className="text-[32px] sm:text-[44px] font-semibold text-slate-900 leading-[1.1] tracking-tight">
                Bli en del av Bilto
              </h2>
              <p className="mt-4 text-[16px] text-slate-600 leading-[1.65] max-w-xl mx-auto">
                Påbörja din ansökan nedan. Vi återkommer med ett samarbetsavtal
                för signering via BankID.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-8 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center">
                  <FileSignature className="w-5 h-5 text-[#0e6efe]" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-slate-900 leading-tight">Företagsuppgifter</h3>
                  <p className="text-[12.5px] text-slate-500">
                    Alla fält är obligatoriska om inget annat anges.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate className="p-8 sm:p-10 space-y-10">
                <FormGroup title="Företag">
                  <Field label="Företagsnamn" value={foretagsnamn} onChange={setForetagsnamn} />
                </FormGroup>

                <FormGroup
                  title="Adresser"
                  description="Ange adresser till samtliga anläggningar dit ni kan tänka er att köpa in bilar."
                >
                  <div className="space-y-3">
                    {adresser.map((adr, i) => (
                      <div key={i} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Field
                            label={i === 0 ? 'Primär adress' : `Adress ${i + 1}`}
                            value={adr}
                            onChange={(v) => {
                              const next = [...adresser];
                              next[i] = v;
                              setAdresser(next);
                            }}
                          />
                        </div>
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => setAdresser(adresser.filter((_, j) => j !== i))}
                            className="h-11 w-11 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                            aria-label="Ta bort adress"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAdresser([...adresser, ''])}
                      className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0e6efe] hover:text-[#0a57cc] transition"
                    >
                      <Plus className="w-4 h-4" />
                      Lägg till adress
                    </button>
                  </div>
                </FormGroup>

                <FormGroup
                  title="Organisationsnummer"
                  description="Lägg till alla organisationsnummer där ni kan tänka er att köpa in bilar."
                >
                  <Field label="Moderbolag" value={moderbolag} onChange={setModerbolag} placeholder="556677-8899" />
                  <div className="space-y-3 mt-4">
                    {extraOrgnr.map((o, i) => (
                      <div key={i} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Field
                            label={`Organisationsnummer ${i + 2}`}
                            value={o}
                            onChange={(v) => {
                              const next = [...extraOrgnr];
                              next[i] = v;
                              setExtraOrgnr(next);
                            }}
                            placeholder="556677-8899"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setExtraOrgnr(extraOrgnr.filter((_, j) => j !== i))}
                          className="h-11 w-11 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                          aria-label="Ta bort organisationsnummer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setExtraOrgnr([...extraOrgnr, ''])}
                      className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0e6efe] hover:text-[#0a57cc] transition"
                    >
                      <Plus className="w-4 h-4" />
                      Lägg till Org nummer
                    </button>
                  </div>
                </FormGroup>

                <FormGroup title="Fakturering">
                  <Field
                    label="Faktura e-postadress"
                    value={fakturaEpost}
                    onChange={setFakturaEpost}
                    type="email"
                    placeholder="faktura@företaget.se"
                  />
                </FormGroup>

                <FormGroup title="Kontaktperson">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Förnamn" value={fornamn} onChange={setFornamn} />
                    <Field label="Efternamn" value={efternamn} onChange={setEfternamn} />
                  </div>
                  <div className="mt-4">
                    <Field
                      label="E-post (används för inloggning)"
                      value={mejl}
                      onChange={setMejl}
                      type="email"
                    />
                  </div>
                  <div className="mt-4">
                    <Field label="Telefonnummer" value={telefon} onChange={setTelefon} type="tel" />
                  </div>
                </FormGroup>

                <ErrorBanner message={error} />

                <div className="pt-4 md:border-t md:border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-400 text-white font-semibold text-[14.5px] rounded-full transition"
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

                <p className="text-center text-[13px] text-slate-500">
                  Har du redan ett konto?{' '}
                  <a href="/handlare/logga-in" className="text-[#0e6efe] hover:underline font-medium">
                    Logga in
                  </a>
                </p>
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

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const launchDate = new Date('2026-05-25T07:00:00Z').getTime();

    const update = () => {
      const diff = Math.max(0, launchDate - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-8">
      <div className="inline-flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-white/70" />
        <span className="text-[13px] font-medium text-white/70 uppercase tracking-wider">Lansering om</span>
      </div>
      <div className="flex items-center gap-3">
        <TimeBlock value={timeLeft.days} label="dagar" />
        <span className="text-white/50 text-[24px] font-light">:</span>
        <TimeBlock value={timeLeft.hours} label="tim" />
        <span className="text-white/50 text-[24px] font-light">:</span>
        <TimeBlock value={timeLeft.minutes} label="min" />
        <span className="text-white/50 text-[24px] font-light">:</span>
        <TimeBlock value={timeLeft.seconds} label="sek" />
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
        <span className="text-[22px] sm:text-[26px] font-bold text-white tabular-nums">
          {pad(value)}
        </span>
      </div>
      <span className="text-[10px] sm:text-[11px] text-white/60 font-medium mt-1.5 uppercase tracking-wider">
        {label}
      </span>
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
        inputMode={type === 'tel' ? 'tel' : undefined}
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
        {description && (
          <p className="mt-1 text-[13px] text-slate-500 leading-[1.55]">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
