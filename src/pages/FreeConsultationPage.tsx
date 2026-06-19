import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
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

type CallbackSlot = {
  label: string;
  value: string;
};

function getCallbackSlots(): CallbackSlot[] {
  const slots: CallbackSlot[] = [
    { label: 'Så snart som möjligt', value: 'asap' },
  ];
  const today = new Date();
  const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
  const timeWindows = [
    { label: '09:00–11:00', start: 9 },
    { label: '11:00–13:00', start: 11 },
    { label: '13:00–16:00', start: 13 },
    { label: '16:00–18:00', start: 16 },
  ];
  for (let d = 0; d < 5; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d + 1);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    const dayStr = d === 0 ? 'Imorgon' : dayNames[dow];
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
    for (const tw of timeWindows) {
      slots.push({
        label: `${dayStr} ${dateStr}, ${tw.label}`,
        value: `${date.toISOString().split('T')[0]}_${tw.start}`,
      });
    }
  }
  return slots;
}

type Step = 'syfte' | 'kontakt' | 'tid' | 'bekraftelse';

interface FormData {
  syfte: Syfte | '';
  namn: string;
  telefon: string;
  email: string;
  meddelande: string;
  preferred_callback_time: string;
}

const INITIAL: FormData = {
  syfte: '',
  namn: '',
  telefon: '',
  email: '',
  meddelande: '',
  preferred_callback_time: '',
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
  const [scrolled] = useState(false);

  const slots = getCallbackSlots();

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

  const handleSubmit = async () => {
    if (!form.preferred_callback_time) {
      setErrors({ preferred_callback_time: 'Välj ett alternativ' });
      return;
    }
    setSubmitting(true);
    try {
      const slotLabel = slots.find(s => s.value === form.preferred_callback_time)?.label ?? form.preferred_callback_time;
      const { error } = await supabase.from('leads').insert({
        namn: form.namn,
        telefon: form.telefon,
        email: form.email,
        meddelande: form.meddelande,
        konsultation_syfte: form.syfte,
        preferred_callback_time: slotLabel,
        lead_source: 'konsultation',
        regnummer: '',
        kontaktad: false,
      });
      if (error) throw error;
      setStep('bekraftelse');
    } catch {
      setErrors({ preferred_callback_time: 'Något gick fel – försök igen.' });
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

      {/* Nav */}
      <header
        className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${
          scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]'
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

      {/* Wave */}
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
              <p className="text-slate-500 text-sm mb-6">Vi ringer upp dig — lämna gärna en e-post så kan vi också skicka en bekräftelse.</p>

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
                    E-post <span className="text-slate-400 normal-case font-normal">(valfritt)</span>
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
                Välj tid för uppringning
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
              <h2 className="text-xl font-bold text-slate-900 mb-1">När passar det dig?</h2>
              <p className="text-slate-500 text-sm mb-6">Välj en tid som passar, så ringer vi upp precis då.</p>

              <div className="grid gap-2.5">
                {slots.map(slot => {
                  const isAsap = slot.value === 'asap';
                  const selected = form.preferred_callback_time === slot.value;
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, preferred_callback_time: slot.value }));
                        setErrors(e => ({ ...e, preferred_callback_time: undefined }));
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-[#0e6efe] bg-blue-50 text-[#0e6efe]'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-[#0e6efe] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {isAsap ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-medium">{slot.label}</span>
                      {selected && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                  );
                })}
              </div>

              {errors.preferred_callback_time && (
                <p className="text-red-500 text-xs mt-2">{errors.preferred_callback_time}</p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 w-full bg-[#0e6efe] hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition"
              >
                {submitting ? 'Skickar...' : 'Boka konsultation'}
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
                Vi har tagit emot din förfrågan och ringer upp dig
              </p>
              <p className="font-semibold text-[#0e6efe] text-base mb-6">
                {slots.find(s => s.value === form.preferred_callback_time)?.label ?? 'vid vald tid'}.
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
                    <span className="text-slate-400">Ring mig</span>
                    <span className="font-medium text-slate-800">{slots.find(s => s.value === form.preferred_callback_time)?.label ?? ''}</span>
                  </div>
                </div>
              </div>

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

      {/* Why trust us strip */}
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
