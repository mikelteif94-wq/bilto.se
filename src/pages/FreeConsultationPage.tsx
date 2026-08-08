import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Lock,
  Phone,
  Menu,
  ShieldCheck,
  Car,
  Loader2,
  AlertCircle,
  Calendar,
  ChevronDown,
  Sparkles,
  Handshake,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { setPageMeta } from '../lib/pageMeta';
import FieldError from '../components/forms/FieldError';
import { validateSwedishPhone } from '../lib/utils';

type Syfte = 'kop_bil' | 'salj_bil' | 'inbyte' | 'ovrig';

const SYFTE_OPTIONS: { value: Syfte; label: string; desc: string }[] = [
  { value: 'kop_bil',  label: 'Köpa bil',  desc: 'Hitta rätt bil till rätt pris' },
  { value: 'salj_bil', label: 'Sälja bil', desc: 'Få bästa pris för din bil' },
  { value: 'inbyte',   label: 'Inbyte',    desc: 'Byt in din bil mot en ny' },
  { value: 'ovrig',    label: 'Annat',     desc: 'En annan fråga om bil' },
];

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

function getBookedSlots(dateStr: string): Set<string> {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = ((seed * 31) + dateStr.charCodeAt(i)) >>> 0;
  }
  const booked = new Set<string>();
  const available = [...TIME_SLOTS];
  let s = seed;
  while (booked.size < 5 && available.length > 0) {
    s = ((s * 1664525) + 1013904223) >>> 0;
    const idx = s % available.length;
    booked.add(available[idx]);
    available.splice(idx, 1);
  }
  return booked;
}

function getAvailableDates(): { date: Date; dateStr: string; label: string; day: string; date2: string; month: string }[] {
  const days: { date: Date; dateStr: string; label: string; day: string; date2: string; month: string }[] = [];
  const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  let added = 0;
  let offset = 1;
  while (added < 8) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    offset++;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: d,
      dateStr,
      label: `${dayNames[dow]} ${d.getDate()} ${monthNames[d.getMonth()]}`,
      day: dayNames[dow],
      date2: String(d.getDate()),
      month: monthNames[d.getMonth()],
    });
    added++;
  }
  return days;
}

interface FormData {
  syfte: Syfte | '';
  namn: string;
  telefon: string;
  email: string;
  meddelande: string;
  booking_date: string;
  booking_time: string;
}

const INITIAL: FormData = {
  syfte: '',
  namn: '',
  telefon: '',
  email: '',
  meddelande: '',
  booking_date: '',
  booking_time: '',
};

const FAQS = [
  {
    q: 'Är verkligen konsultationen gratis?',
    a: 'Ja, helt gratis. Ingen bindning, ingen dold avgift. Om vi inte kan hjälpa dig säger vi det rakt ut.',
  },
  {
    q: 'Måste jag bestämma mig under samtalet?',
    a: 'Nej. De flesta tar sig ett par dagar på sig. Vi hör av oss en gång och lämnar dig sedan ifred.',
  },
  {
    q: 'Vad händer om jag inte är redo att köpa än?',
    a: 'Vi berättar vad du ska hålla utkik efter – pristrender, rabatter, tillgänglighet – och när det är rätt läge att slå till. Ibland är det bästa rådet "vänta två månader".',
  },
  {
    q: 'Vem är det jag pratar med?',
    a: 'En riktig person från Biltos team. Ingen bot, inget callcenter. Någon som kan bilar och ger dig ärliga råd – även om det betyder att du inte behöver vår hjälp just nu.',
  },
  {
    q: 'Hur lång tid tar samtalet?',
    a: 'Vanligtvis 15 minuter. Vi håller det kort och konkret – bara det du behöver veta.',
  },
];

function FaqItem({ faq, defaultOpen }: { faq: typeof FAQS[number]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-b border-slate-200">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="font-semibold text-[15px] text-slate-900 group-hover:text-[#0e6efe] transition">{faq.q}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 pb-5' : 'max-h-0'}`}>
        <p className="text-[14px] text-slate-600 leading-relaxed pr-8">{faq.a}</p>
      </div>
    </div>
  );
}

export default function FreeConsultationPage({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'choose' | 'schedule' | 'callback'>('choose');
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const availableDates = useMemo(() => getAvailableDates(), []);
  const bookedSlots = useMemo(
    () => form.booking_date ? getBookedSlots(form.booking_date) : new Set<string>(),
    [form.booking_date]
  );

  useEffect(() => {
    setPageMeta({
      title: 'Gratis konsultation – Köp eller sälj bil med expertstöd | Bilto',
      description: 'Boka en kostnadsfri konsultation med Biltos experter. Vi hjälper dig förhandla, värdera och genomföra din bilaffär – oavsett om du köper eller säljer.',
      canonical: 'https://bilto.se/gratis-konsultation',
    });
  }, []);

  const validate = () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.syfte) errs.syfte = 'Välj ett ärende';
    if (!form.namn.trim()) errs.namn = 'Namn är obligatoriskt';
    const phoneErr = validateSwedishPhone(form.telefon);
    if (phoneErr) errs.telefon = phoneErr;
    if (!form.email.trim()) {
      errs.email = 'E-post är obligatorisk';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Ogiltig e-postadress';
    }
    if (mode === 'schedule') {
      if (!form.booking_date) errs.booking_date = 'Välj ett datum';
      if (!form.booking_time) errs.booking_time = 'Välj en tid';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('consultation_bookings').insert({
        booking_date: mode === 'schedule' ? form.booking_date : null,
        booking_time: mode === 'schedule' ? form.booking_time : null,
        syfte: form.syfte,
        namn: form.namn,
        telefon: form.telefon,
        email: form.email,
        meddelande: form.meddelande || (mode === 'callback' ? 'Begär återringning' : ''),
        status: 'pending',
      });
      if (error) throw error;

      supabase.functions.invoke('notify-consultation-booking', {
        body: {
          namn: form.namn,
          telefon: form.telefon,
          email: form.email,
          syfte: form.syfte,
          booking_date: mode === 'schedule' ? form.booking_date : null,
          booking_time: mode === 'schedule' ? form.booking_time : null,
          meddelande: form.meddelande || (mode === 'callback' ? 'Begär återringning' : ''),
        },
      }).catch(() => {});

      setDone(true);
    } catch {
      setErrors({ booking_time: 'Något gick fel – försök igen.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Sälj bil') { onBack(); return; }
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Bilköptjänsten': '/kop-bil',
      'Guider': '/guider',
      'Priser': '/priser',
      'Vanliga frågor': '/vanliga-fragor',
    };
    const route = routes[item];
    if (route) {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onBack();
  };

  const selectedDateLabel = availableDates.find(d => d.dateStr === form.booking_date)?.label ?? '';

  if (done) {
    return (
      <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col">
        <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
          <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
            <button onClick={onBack} className="shrink-0 flex items-center">
              <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
            </button>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 pt-32 pb-20">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-5">
              <Check className="w-8 h-8 text-green-600" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Tack, {form.namn.split(' ')[0]}!</h2>
            <p className="text-slate-600 text-base mb-1">
              {mode === 'schedule'
                ? 'Din konsultation är bokad.'
                : 'Vi ringer dig inom 15 minuter under kontorstid.'}
            </p>
            {mode === 'schedule' && (
              <p className="font-semibold text-[#0e6efe] text-base mb-6">
                {selectedDateLabel} kl. {form.booking_time}
              </p>
            )}
            {form.email && (
              <p className="text-sm text-slate-500 mb-8">
                En bekräftelse skickas till <span className="font-medium text-slate-700">{form.email}</span>
              </p>
            )}
            <button type="button" onClick={onBack} className="btn-primary px-8 h-12">
              Tillbaka till startsidan
            </button>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active={null as unknown as 'Sälj bil'}
        onSelect={handleMenuSelect}
      />

      {/* Header */}
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
          <button onClick={onBack} className="shrink-0 flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </button>
          <nav className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={onBack} className="text-[15px] text-white/80 hover:text-white transition font-medium">Sälj bil</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/kop-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 hover:text-white transition font-medium">Bilköptjänsten</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/om-oss'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 hover:text-white transition font-medium">Om oss</button>
          </nav>
          <div className="ml-auto">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Tillbaka</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#0e6efe] pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-xl mb-6 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            100% gratis · Ingen bindning
          </div>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-white leading-[1.15] tracking-tight">
            Osäker på vad som passar dig?<br />Vi tar reda på det tillsammans.
          </h1>
          <p className="mt-5 text-blue-100 text-[16px] sm:text-[18px] max-w-xl mx-auto leading-relaxed">
            Lägg 15 minuter med en av våra experter. Vi lyssnar på vad du vill uppnå och rekommenderar rätt väg framåt. Även om det ärliga svaret är att du inte behöver oss än.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-blue-100 text-[14px]">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Kostnadsfritt</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Ingen säljpitch</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Under 15 minuter</span>
          </div>
        </div>
      </section>

      {/* Contact cards */}
      {mode === 'choose' && (
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-[22px] font-bold text-slate-900 text-center mb-1">Hur vill du ha kontakt?</h2>
            <p className="text-slate-500 text-[15px] text-center mb-8">Välj det alternativ som passar dig bäst.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Schedule a call */}
              <button
                type="button"
                onClick={() => setMode('schedule')}
                className="group flex flex-col items-start p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#0e6efe] hover:shadow-xl hover:shadow-blue-50 active:scale-[0.99] transition-all duration-150 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-[#0e6efe]/10 group-hover:bg-[#0e6efe]/15 flex items-center justify-center mb-4 transition-colors">
                  <Calendar className="w-6 h-6 text-[#0e6efe]" />
                </div>
                <h3 className="text-[17px] font-bold text-slate-900 mb-1">Boka ett samtal</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed mb-4">
                  Välj en tid som passar dig. Vi skickar en kalenderinbjudan med samtalsdetaljerna.
                </p>
                <span className="inline-flex items-center gap-1.5 text-[#0e6efe] font-semibold text-[14px] group-hover:gap-2.5 transition-all">
                  Välj en tid
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>

              {/* Request callback */}
              <button
                type="button"
                onClick={() => setMode('callback')}
                className="group flex flex-col items-start p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#0e6efe] hover:shadow-xl hover:shadow-blue-50 active:scale-[0.99] transition-all duration-150 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center mb-4 transition-colors">
                  <Phone className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-[17px] font-bold text-slate-900 mb-1">Ring mig</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed mb-4">
                  Vi ringer dig inom 15 minuter under kontorstid. Ingen väntmusik, ingen kö.
                </p>
                <span className="inline-flex items-center gap-1.5 text-[#0e6efe] font-semibold text-[14px] group-hover:gap-2.5 transition-all">
                  Begär återringning
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Schedule / Callback form */}
      {mode !== 'choose' && (
        <section className="py-10 px-4">
          <div className="max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-700 mb-6 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Tillbaka
            </button>

            <h2 className="text-[24px] font-bold text-slate-900 mb-1">
              {mode === 'schedule' ? 'Boka din 15-minuters konsultation' : 'Vi ringer dig'}
            </h2>
            <p className="text-slate-500 text-[14px] mb-7">
              {mode === 'schedule'
                ? 'Välj en ledig tid nedan. Vi skickar en kalenderinbjudan.'
                : 'Fyll i dina uppgifter så ringer vi dig inom 15 minuter under kontorstid.'}
            </p>

            {/* Syfte */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-2">Vad behöver du hjälp med?</label>
              <div className="grid grid-cols-2 gap-2">
                {SYFTE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, syfte: opt.value })); setErrors(e => ({ ...e, syfte: undefined })); }}
                    className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all ${
                      form.syfte === opt.value
                        ? 'border-[#0e6efe] bg-[#0e6efe]/5 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className={`text-[14px] font-semibold ${form.syfte === opt.value ? 'text-[#0e6efe]' : 'text-slate-800'}`}>{opt.label}</span>
                    <span className="text-[12px] text-slate-500 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
              {errors.syfte && <p className="mt-1.5 text-xs text-red-500">{errors.syfte}</p>}
            </div>

            {/* Schedule: date + time */}
            {mode === 'schedule' && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Välj dag</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {availableDates.map(d => {
                      const selected = form.booking_date === d.dateStr;
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => {
                            setForm(f => ({ ...f, booking_date: d.dateStr, booking_time: '' }));
                            setErrors(e => ({ ...e, booking_date: undefined, booking_time: undefined }));
                          }}
                          className={`flex flex-col items-center gap-0.5 py-3.5 px-3.5 rounded-xl border transition-all duration-150 active:scale-[0.97] shrink-0 min-w-[68px] ${
                            selected
                              ? 'border-[#0e6efe] bg-[#0e6efe] text-white shadow-md shadow-blue-200'
                              : 'border-slate-200 bg-white hover:border-[#0e6efe]/50 hover:bg-blue-50/40 text-slate-700'
                          }`}
                        >
                          <span className={`text-[11px] font-semibold uppercase tracking-wide ${selected ? 'text-blue-100' : 'text-slate-400'}`}>{d.day}</span>
                          <span className={`text-[22px] font-bold leading-none ${selected ? 'text-white' : 'text-slate-800'}`}>{d.date2}</span>
                          <span className={`text-[11px] font-medium ${selected ? 'text-blue-100' : 'text-slate-400'}`}>{d.month}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.booking_date && <p className="text-red-500 text-xs mt-2">{errors.booking_date}</p>}
                </div>

                {form.booking_date && (
                  <div className="mb-6">
                    <p className="text-[13px] font-semibold text-slate-700 mb-3">
                      Lediga tider – <span className="font-normal text-slate-500">{selectedDateLabel}</span>
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {TIME_SLOTS.map(t => {
                        const booked = bookedSlots.has(t);
                        const selected = form.booking_time === t;
                        if (booked) {
                          return (
                            <div key={t} className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-100 bg-[#faf8f5] text-slate-300 cursor-not-allowed select-none">
                              <Lock className="w-3 h-3 shrink-0" />
                              <span className="text-[13px] font-medium">{t}</span>
                            </div>
                          );
                        }
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => { setForm(f => ({ ...f, booking_time: t })); setErrors(e => ({ ...e, booking_time: undefined })); }}
                            className={`flex items-center justify-center gap-1.5 py-3 rounded-xl border transition-all duration-150 active:scale-[0.97] ${
                              selected
                                ? 'border-[#0e6efe] bg-[#0e6efe] text-white shadow-md shadow-blue-200'
                                : 'border-slate-200 hover:border-[#0e6efe]/50 hover:bg-blue-50/40 text-slate-700'
                            }`}
                          >
                            <Clock className={`w-3.5 h-3.5 shrink-0 ${selected ? 'text-blue-100' : 'text-slate-400'}`} />
                            <span className={`text-[13px] font-semibold ${selected ? 'text-white' : ''}`}>{t}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[12px] text-slate-400 mt-3 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 shrink-0" /> Grå tider är redan bokade
                    </p>
                    {errors.booking_time && <p className="text-red-500 text-xs mt-2">{errors.booking_time}</p>}
                  </div>
                )}
              </>
            )}

            {/* Contact info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Fullständigt namn *</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={form.namn}
                  onChange={e => { setForm(f => ({ ...f, namn: e.target.value })); setErrors(p => ({ ...p, namn: undefined })); }}
                  placeholder="Johan Andersson"
                  className={`form-control ${errors.namn ? 'form-control-error' : ''}`}
                />
                <FieldError message={errors.namn} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Telefonnummer *</label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.telefon}
                  onChange={e => { setForm(f => ({ ...f, telefon: e.target.value })); setErrors(p => ({ ...p, telefon: undefined })); }}
                  placeholder="070-123 45 67"
                  className={`form-control ${errors.telefon ? 'form-control-error' : ''}`}
                />
                <FieldError message={errors.telefon} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">E-postadress *</label>
                <input
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(p => ({ ...p, email: undefined })); }}
                  placeholder="johan@example.com"
                  className={`form-control ${errors.email ? 'form-control-error' : ''}`}
                />
                <FieldError message={errors.email} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Meddelande <span className="text-slate-400 font-normal">(valfritt)</span>
                </label>
                <textarea
                  value={form.meddelande}
                  onChange={e => setForm(f => ({ ...f, meddelande: e.target.value }))}
                  placeholder="Berätta gärna mer om vad du behöver hjälp med..."
                  rows={3}
                  className="form-control"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary w-full h-12 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Bokar...</>
                : mode === 'schedule'
                  ? <>Boka konsultation <ArrowRight className="w-4 h-4" /></>
                  : <>Begär återringning <ArrowRight className="w-4 h-4" /></>
              }
            </button>
            <p className="text-center text-[12px] text-slate-400 mt-3">
              Ingen bindning. Avboka när som helst.
            </p>
          </div>
        </section>
      )}

      {/* Trust badges */}
      {mode === 'choose' && (
        <section className="py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {[
                { icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50', title: 'Kostnadsfritt', desc: 'Du betalar ingenting för konsultationen.' },
                { icon: Phone, color: 'text-[#0e6efe]', bg: 'bg-blue-50', title: 'Vi ringer dig', desc: 'Vi tar initiativet – ingen väntan i kö.' },
                { icon: ShieldCheck, color: 'text-slate-600', bg: 'bg-slate-100', title: 'Inga förpliktelser', desc: 'Tacka nej när du vill, utan förklaring.' },
              ].map(item => (
                <div key={item.title} className="flex-1 flex items-start gap-3 py-5 sm:py-0 sm:px-6 first:pt-0 last:pb-0 sm:first:pl-0 sm:last:pr-0">
                  <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <item.icon className={item.color} strokeWidth={2} style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <div className="font-semibold text-[14px] text-slate-900 leading-snug">{item.title}</div>
                    <div className="text-[13px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[26px] font-bold text-slate-900 mb-3">Riktiga människor. Som svarar i telefon.</h2>
          <p className="text-slate-500 text-[15px] max-w-xl mx-auto leading-relaxed mb-10">
            När du bokar ett samtal pratar du med någon från Biltos team. De lyssnar på din situation, rekommenderar vad som passar dig – och säger rakt ifall vi inte är rätt för dig. Ingen säljpitch, ingen provision.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'Daniel', role: 'Grundare & expert', img: '/daniel-portrait.jpg' },
              { name: 'Team Bilto', role: 'Bilexpert', img: '/Man_in_car_showroom_portrait.png' },
              { name: 'Team Bilto', role: 'Bilexpert', img: '/Man_in_car_showroom_portrait copy.png' },
              { name: 'Team Bilto', role: 'Bilexpert', img: '/Man_in_car_showroom_portrait copy copy.png' },
            ].map((member, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-100 ring-2 ring-slate-100 mb-3">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="font-semibold text-[14px] text-slate-900">{member.name}</div>
                <div className="text-[12px] text-slate-500">{member.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we help with */}
      <section className="py-16 px-4 bg-[#faf8f5]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[24px] font-bold text-slate-900 text-center mb-10">Vad vi kan hjälpa dig med</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Car, title: 'Köpa bil', desc: 'Hitta rätt bil, kolla priset och förhandla ner det åt dig.' },
              { icon: TrendingUp, title: 'Sälja bil', desc: 'Värdera din bil och få ut bud från flera handlare.' },
              { icon: Handshake, title: 'Inbyte', desc: 'Byt in din bil och få ett bra pris på nästa.' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-[#0e6efe]" />
                </div>
                <h3 className="font-bold text-[15px] text-slate-900 mb-1.5">{item.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[24px] font-bold text-slate-900 text-center mb-8">Vanliga frågor</h2>
          <div className="bg-white rounded-2xl border border-slate-200 px-6">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} faq={faq} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-[22px] font-bold text-slate-900 mb-2">Redo att prata med oss?</h2>
          <p className="text-slate-500 text-[14px] mb-6">15 minuter. Helt gratis. Ingen bindning.</p>
          <button
            type="button"
            onClick={() => { setMode('schedule'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="btn-primary px-8 h-12"
          >
            <Calendar className="w-4 h-4" />
            Boka ett samtal
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
