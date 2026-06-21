import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Lock,
  Mail,
  Phone,
  User,
  Search,
  Tag,
  RefreshCw,
  CreditCard,
  HelpCircle,
  Calendar,
  Menu,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { setPageMeta } from '../lib/pageMeta';

interface FreeConsultationPageProps {
  onBack: () => void;
  onNavigateBuy?: () => void;
  onNavigateHowItWorks?: () => void;
}

import { Video as LucideIcon } from 'lucide-react';

type Syfte = 'kop_bil' | 'salj_bil' | 'inbyte' | 'finansiering' | 'ovrig';

const SYFTE_OPTIONS: { value: Syfte; label: string; desc: string; icon: LucideIcon }[] = [
  { value: 'kop_bil', label: 'Köpa bil', desc: 'Jag vill ha hjälp att hitta rätt bil', icon: Search },
  { value: 'salj_bil', label: 'Sälja bil', desc: 'Jag vill sälja min bil till bästa pris', icon: Tag },
  { value: 'inbyte', label: 'Inbyte', desc: 'Jag vill byta in min bil mot en ny', icon: RefreshCw },
  { value: 'finansiering', label: 'Finansiering', desc: 'Jag har frågor om lån eller leasing', icon: CreditCard },
  { value: 'ovrig', label: 'Annat', desc: 'Jag har en annan fråga', icon: HelpCircle },
];

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

function getBookedSlots(dateStr: string): Set<string> {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = ((seed * 31) + dateStr.charCodeAt(i)) >>> 0;
  }
  const booked = new Set<string>();
  const available = [...TIME_SLOTS];
  let s = seed;
  while (booked.size < 4 && available.length > 0) {
    s = ((s * 1664525) + 1013904223) >>> 0;
    const idx = s % available.length;
    booked.add(available[idx]);
    available.splice(idx, 1);
  }
  return booked;
}

function getAvailableDates(): { date: Date; dateStr: string; label: string }[] {
  const days: { date: Date; dateStr: string; label: string }[] = [];
  const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  let added = 0;
  let offset = 1;
  while (added < 4) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    offset++;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    const dateStr = d.toISOString().split('T')[0];
    const label = `${dayNames[dow]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
    days.push({ date: d, dateStr, label });
    added++;
  }
  return days;
}

type Step = 'syfte' | 'kontakt' | 'tid' | 'bekraftelse';

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

function ProgressBar({ step }: { step: Step }) {
  const steps: Step[] = ['syfte', 'kontakt', 'tid', 'bekraftelse'];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.slice(0, 3).map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              i < idx
                ? 'bg-[#0e6efe] text-white'
                : i === idx
                ? 'bg-[#0e6efe] text-white ring-4 ring-blue-100'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {i < idx ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          {i < 2 && (
            <div className={`h-0.5 w-12 rounded ${i < idx ? 'bg-[#0e6efe]' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function FreeConsultationPage({ onBack, onNavigateBuy, onNavigateHowItWorks }: FreeConsultationPageProps) {
  const [step, setStep] = useState<Step>('syfte');
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
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

  const validateKontakt = () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.namn.trim()) errs.namn = 'Ange ditt namn';
    if (!form.telefon.trim() || form.telefon.replace(/\D/g, '').length < 7)
      errs.telefon = 'Ange ett giltigt telefonnummer';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Ange en giltig e-postadress';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSyfteSelect = (s: Syfte) => {
    setForm(f => ({ ...f, syfte: s }));
    setStep('kontakt');
  };

  const handleKontaktNext = () => {
    if (validateKontakt()) setStep('tid');
  };

  const selectedDateLabel = availableDates.find(d => d.dateStr === form.booking_date)?.label ?? '';

  const handleSubmit = async () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.booking_date) errs.booking_date = 'Välj ett datum';
    if (!form.booking_time) errs.booking_time = 'Välj en tid';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('consultation_bookings').insert({
        booking_date: form.booking_date,
        booking_time: form.booking_time,
        syfte: form.syfte,
        namn: form.namn,
        telefon: form.telefon,
        email: form.email,
        meddelande: form.meddelande,
        status: 'pending',
      });
      if (error) throw error;

      // Fire-and-forget email notification
      supabase.functions.invoke('notify-consultation-booking', {
        body: {
          namn: form.namn,
          telefon: form.telefon,
          email: form.email,
          syfte: form.syfte,
          booking_date: form.booking_date,
          booking_time: form.booking_time,
          meddelande: form.meddelande,
        },
      }).catch(() => {});

      setStep('bekraftelse');
    } catch {
      setErrors({ booking_time: 'Något gick fel – försök igen.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Sälj bil') { onBack(); return; }
    if (item === 'Köp bil') { onNavigateBuy?.(); return; }
    if (item === 'Så funkar det') { onNavigateHowItWorks?.(); return; }
    onBack();
  };

  const selectedSyfte = SYFTE_OPTIONS.find(o => o.value === form.syfte);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Köp bil"
        onSelect={handleMenuSelect}
      />

      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-40 h-16 rounded-full shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
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
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={onBack} className="text-[15px] text-white/80 hover:text-white transition font-medium">
              Sälj bil
            </button>
            <button type="button" onClick={() => onNavigateBuy?.()} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 border border-white/40 text-white text-[14px] font-semibold hover:bg-white/30 transition backdrop-blur-sm">
              Köp bil med hjälp
            </button>
          </nav>
          <div className="ml-auto">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Tillbaka</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero band */}
      <div className="bg-[#0e6efe] pt-32 pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            100% kostnadsfritt
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
            Boka din kostnadsfria konsultation
          </h1>
          <p className="mt-3 text-blue-100 text-base lg:text-lg max-w-xl mx-auto">
            En av våra bilexperter ringer upp dig vid en tid som passar. Vi lyssnar, ger råd och hjälper dig — utan förpliktelser.
          </p>
        </div>
      </div>

      <div className="bg-[#0e6efe] -mb-1">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
          <path d="M0 48 C360 0 1080 0 1440 48 L1440 48 L0 48 Z" fill="white" />
        </svg>
      </div>

      {/* Form card */}
      <div className="py-12 px-4">
        <div className="max-w-xl mx-auto">
          {step !== 'bekraftelse' && <ProgressBar step={step} />}

          {/* Step 1: Syfte */}
          {step === 'syfte' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Vad kan vi hjälpa dig med?</h2>
              <p className="text-slate-500 text-sm mb-6">Välj det alternativ som passar bäst.</p>
              <div className="grid gap-3">
                {SYFTE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSyfteSelect(opt.value)}
                    className="group flex items-center gap-4 w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-[#0e6efe] hover:bg-blue-50/50 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition">
                      <opt.icon className="w-5 h-5 text-[#0e6efe]" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{opt.label}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{opt.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0e6efe] ml-auto transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Kontakt */}
          {step === 'kontakt' && (
            <div>
              {selectedSyfte && (
                <button
                  type="button"
                  onClick={() => setStep('syfte')}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Ändra ämne
                </button>
              )}
              <h2 className="text-xl font-bold text-slate-900 mb-1">Dina kontaktuppgifter</h2>
              <p className="text-slate-500 text-sm mb-6">Vi ringer upp dig — lämna gärna en e-post så skickar vi en bokningsbekräftelse.</p>

              <div className="grid gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Namn *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={form.namn}
                      onChange={e => setForm(f => ({ ...f, namn: e.target.value }))}
                      placeholder="Förnamn Efternamn"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] transition ${errors.namn ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                    />
                  </div>
                  {errors.namn && <p className="text-red-500 text-xs mt-1">{errors.namn}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Telefon *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={form.telefon}
                      onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                      placeholder="07X XXX XX XX"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] transition ${errors.telefon ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                    />
                  </div>
                  {errors.telefon && <p className="text-red-500 text-xs mt-1">{errors.telefon}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    E-post <span className="text-slate-400 normal-case font-normal">(valfritt – för bokningsbekräftelse)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="din@epost.se"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] transition ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Meddelande <span className="text-slate-400 normal-case font-normal">(valfritt)</span>
                  </label>
                  <textarea
                    value={form.meddelande}
                    onChange={e => setForm(f => ({ ...f, meddelande: e.target.value }))}
                    placeholder="Berätta gärna mer om vad du letar efter, din budget eller andra önskemål..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe] resize-none transition"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleKontaktNext}
                className="mt-6 w-full bg-[#0e6efe] hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition"
              >
                Välj datum och tid
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 3: Tid */}
          {step === 'tid' && (
            <div>
              <button
                type="button"
                onClick={() => setStep('kontakt')}
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Tillbaka
              </button>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Välj datum</h2>
              <p className="text-slate-500 text-sm mb-4">Välj ett av de närmaste lediga dagarna.</p>

              {/* Date selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-7">
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
                      className={`flex flex-col items-center gap-1 px-3 py-3.5 rounded-xl border-2 transition-all ${
                        selected
                          ? 'border-[#0e6efe] bg-blue-50 text-[#0e6efe]'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <Calendar className={`w-4 h-4 ${selected ? 'text-[#0e6efe]' : 'text-slate-400'}`} />
                      <span className="text-[13px] font-semibold leading-tight text-center">{d.label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.booking_date && <p className="text-red-500 text-xs -mt-4 mb-4">{errors.booking_date}</p>}

              {/* Time grid */}
              {form.booking_date && (
                <>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    Välj tid — <span className="font-normal text-slate-500">{selectedDateLabel}</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5 mb-1">
                    {TIME_SLOTS.map(t => {
                      const booked = bookedSlots.has(t);
                      const selected = form.booking_time === t;
                      if (booked) {
                        return (
                          <div
                            key={t}
                            className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed select-none"
                          >
                            <Lock className="w-3 h-3 shrink-0" />
                            <span className="text-[13px] font-medium">{t}</span>
                          </div>
                        );
                      }
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setForm(f => ({ ...f, booking_time: t }));
                            setErrors(e => ({ ...e, booking_time: undefined }));
                          }}
                          className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-all ${
                            selected
                              ? 'border-[#0e6efe] bg-blue-50 text-[#0e6efe]'
                              : 'border-slate-200 hover:border-[#0e6efe]/50 text-slate-700'
                          }`}
                        >
                          <Clock className={`w-3.5 h-3.5 shrink-0 ${selected ? 'text-[#0e6efe]' : 'text-slate-400'}`} />
                          <span className="text-[13px] font-medium">{t}</span>
                          {selected && <Check className="w-3 h-3 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mb-5 mt-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> = Redan bokad
                  </p>
                </>
              )}

              {errors.booking_time && (
                <p className="text-red-500 text-xs mb-3">{errors.booking_time}</p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#0e6efe] hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition"
              >
                {submitting ? 'Bokar...' : 'Boka konsultation'}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>

              <p className="text-center text-xs text-slate-400 mt-3">
                Ingen bindning. Avboka när som helst.
              </p>
            </div>
          )}

          {/* Step 4: Bekräftelse */}
          {step === 'bekraftelse' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-green-600" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Tack, {form.namn.split(' ')[0]}!</h2>
              <p className="text-slate-600 text-base mb-1">
                Din konsultation är bokad
              </p>
              <p className="font-semibold text-[#0e6efe] text-base mb-6">
                {selectedDateLabel} kl. {form.booking_time}
              </p>

              <div className="bg-slate-50 rounded-2xl p-5 text-left mb-8 border border-slate-100 max-w-sm mx-auto">
                <h3 className="font-semibold text-sm text-slate-700 mb-3">Din bokning</h3>
                <div className="grid gap-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Namn</span>
                    <span className="font-medium text-slate-800">{form.namn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telefon</span>
                    <span className="font-medium text-slate-800">{form.telefon}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ärende</span>
                    <span className="font-medium text-slate-800">{selectedSyfte?.label ?? ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Datum</span>
                    <span className="font-medium text-slate-800">{selectedDateLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tid</span>
                    <span className="font-medium text-slate-800">kl. {form.booking_time}</span>
                  </div>
                </div>
              </div>

              {form.email && (
                <p className="text-sm text-slate-500 mb-6">
                  En bekräftelse har skickats till <span className="font-medium text-slate-700">{form.email}</span>
                </p>
              )}

              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 bg-[#0e6efe] text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-600 transition"
              >
                Tillbaka till startsidan
              </button>
            </div>
          )}
        </div>
      </div>

      {step !== 'bekraftelse' && (
        <div className="bg-slate-50 border-y border-slate-100 py-8 px-4 mt-4">
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: <Check className="w-5 h-5 text-green-600" />, title: '100% kostnadsfritt', desc: 'Du betalar ingenting för konsultationen.' },
              { icon: <Phone className="w-5 h-5 text-[#0e6efe]" />, title: 'Vi ringer dig', desc: 'Ingen väntan i telefonkö — vi tar initiativet.' },
              { icon: <ChevronDown className="w-5 h-5 text-slate-400" />, title: 'Inga förpliktelser', desc: 'Tacka nej utan förklaring, när du vill.' },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  {item.icon}
                </div>
                <div className="font-semibold text-sm text-slate-800">{item.title}</div>
                <div className="text-xs text-slate-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
