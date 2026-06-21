import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Lock,
  Phone,
  Search,
  Tag,
  RefreshCw,
  CreditCard,
  HelpCircle,
  Menu,
  ShieldCheck,
  Car,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { setPageMeta } from '../lib/pageMeta';
import FieldError from '../components/forms/FieldError';
import { validateSwedishPhone } from '../lib/utils';
import RegInput from '../components/RegInput';
import { useVehicleLookup } from '../lib/useVehicleLookup';

interface FreeConsultationPageProps {
  onBack: () => void;
  onNavigateBuy?: () => void;
  onNavigateHowItWorks?: () => void;
}

import { Video as LucideIcon } from 'lucide-react';

type Syfte = 'kop_bil' | 'salj_bil' | 'inbyte' | 'finansiering' | 'ovrig';

const SYFTE_OPTIONS: { value: Syfte; label: string; desc: string; icon: LucideIcon }[] = [
  { value: 'kop_bil',      label: 'Köpa bil',      desc: 'Jag vill ha hjälp att hitta rätt bil',    icon: Search },
  { value: 'salj_bil',     label: 'Sälja bil',      desc: 'Jag vill sälja min bil till bästa pris',  icon: Tag },
  { value: 'inbyte',       label: 'Inbyte',         desc: 'Jag vill byta in min bil mot en ny',      icon: RefreshCw },
  { value: 'finansiering', label: 'Finansiering',   desc: 'Jag har frågor om lån eller leasing',     icon: CreditCard },
  { value: 'ovrig',        label: 'Annat',          desc: 'Jag har en annan fråga',                  icon: HelpCircle },
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

function getAvailableDates(): { date: Date; dateStr: string; label: string; day: string; date2: string; month: string }[] {
  const days: { date: Date; dateStr: string; label: string; day: string; date2: string; month: string }[] = [];
  const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  let added = 0;
  let offset = 1;
  while (added < 4) {
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

// kop_sub = sub-step for kop_bil (hittat / letar)
// salj_reg = sub-step for salj_bil / inbyte (regnummer)
type Step = 'syfte' | 'kop_sub' | 'salj_reg' | 'kontakt' | 'tid' | 'bekraftelse';

interface FormData {
  syfte: Syfte | '';
  namn: string;
  telefon: string;
  email: string;
  meddelande: string;
  booking_date: string;
  booking_time: string;
  // kop_bil extras
  kop_status: 'hittat' | 'letar' | '';
  bil_link: string;
  // salj/inbyte extras
  regnummer: string;
  bil_marke: string;
  bil_modell: string;
  bil_ar: string;
  bil_miltal: string;
}

const INITIAL: FormData = {
  syfte: '',
  namn: '',
  telefon: '',
  email: '',
  meddelande: '',
  booking_date: '',
  booking_time: '',
  kop_status: '',
  bil_link: '',
  regnummer: '',
  bil_marke: '',
  bil_modell: '',
  bil_ar: '',
  bil_miltal: '',
};

const STEP_LABELS = ['Ärende', 'Uppgifter', 'Tid'];

function ProgressBar({ step }: { step: Step }) {
  const orderedSteps: Step[] = ['syfte', 'kop_sub', 'salj_reg', 'kontakt', 'tid', 'bekraftelse'];
  const visibleSteps: Step[] = ['syfte', 'kontakt', 'tid'];
  const idx = Math.max(visibleSteps.indexOf(step as Step), orderedSteps.indexOf(step) >= orderedSteps.indexOf('kontakt') ? 1 : 0);
  const displayIdx = step === 'syfte' || step === 'kop_sub' || step === 'salj_reg' ? 0 : step === 'kontakt' ? 1 : step === 'tid' ? 2 : 3;

  return (
    <div className="flex items-center gap-0 mb-10">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all duration-200 ${
                i < displayIdx
                  ? 'bg-[#0e6efe] text-white shadow-md shadow-blue-200'
                  : i === displayIdx
                  ? 'bg-[#0e6efe] text-white ring-4 ring-[#0e6efe]/15 shadow-md shadow-blue-200'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i < displayIdx ? <Check className="w-4 h-4" strokeWidth={2.5} /> : i + 1}
            </div>
            <span className={`text-[11px] font-medium whitespace-nowrap ${i <= displayIdx ? 'text-slate-700' : 'text-slate-400'}`}>
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className={`h-[2px] flex-1 mx-2 mb-5 rounded-xl transition-all duration-300 ${i < displayIdx ? 'bg-[#0e6efe]' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Sub-component for vehicle lookup display
function VehicleCard({ regnummer }: { regnummer: string }) {
  const lookup = useVehicleLookup(regnummer);
  if (lookup.status === 'loading') {
    return (
      <div className="flex items-center gap-2 mt-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-700 text-sm">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        Hämtar uppgifter...
      </div>
    );
  }
  if (lookup.status === 'found') {
    return (
      <div className="mt-3 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
        <div className="flex items-center gap-2 mb-1">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
          <span className="text-[13px] font-semibold text-emerald-800">Bilen hittad</span>
        </div>
        <p className="text-[14px] font-bold text-slate-900">
          {lookup.data.marke} {lookup.data.modell}
          {lookup.data.ar ? ` · ${lookup.data.ar}` : ''}
        </p>
        <p className="text-[12px] text-slate-500 mt-0.5">
          {[lookup.data.bransle, lookup.data.farg, lookup.data.miltal ? `${lookup.data.miltal.toLocaleString('sv-SE')} mil` : ''].filter(Boolean).join(' · ')}
        </p>
      </div>
    );
  }
  if (lookup.status === 'not_found' || lookup.status === 'error') {
    return (
      <div className="flex items-center gap-2 mt-3 px-4 py-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-[13px]">
        <AlertCircle className="w-4 h-4 shrink-0" />
        Kunde inte hämta uppgifter – du kan ändå fortsätta.
      </div>
    );
  }
  return null;
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

  const vehicleLookup = useVehicleLookup(form.regnummer);

  useEffect(() => {
    setPageMeta({
      title: 'Gratis konsultation – Köp eller sälj bil med expertstöd | Bilto',
      description: 'Boka en kostnadsfri konsultation med Biltos experter. Vi hjälper dig förhandla, värdera och genomföra din bilaffär – oavsett om du köper eller säljer.',
      canonical: 'https://bilto.se/gratis-konsultation',
    });
  }, []);

  // Sync vehicle data into form when lookup finds a car
  useEffect(() => {
    if (vehicleLookup.status === 'found') {
      const d = vehicleLookup.data;
      setForm(f => ({
        ...f,
        bil_marke: d.marke,
        bil_modell: d.modell,
        bil_ar: d.ar ? String(d.ar) : '',
        bil_miltal: d.miltal ? String(d.miltal) : '',
      }));
    }
  }, [vehicleLookup.status]);

  const validateKontakt = () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.namn.trim()) errs.namn = 'Namn är obligatoriskt';
    const phoneErr = validateSwedishPhone(form.telefon);
    if (phoneErr) errs.telefon = phoneErr;
    if (!form.email.trim()) {
      errs.email = 'E-post är obligatorisk';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Ogiltig e-postadress';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSyfteSelect = (s: Syfte) => {
    setForm(f => ({ ...f, syfte: s }));
    if (s === 'kop_bil') {
      setStep('kop_sub');
    } else if (s === 'salj_bil' || s === 'inbyte') {
      setStep('salj_reg');
    } else {
      setStep('kontakt');
    }
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
        meddelande: [
          form.meddelande,
          form.kop_status === 'hittat' && form.bil_link ? `Bil-länk: ${form.bil_link}` : '',
          form.kop_status === 'letar' ? 'Letar efter bil' : '',
          form.regnummer ? `Regnummer: ${form.regnummer}` : '',
          form.bil_marke ? `Bil: ${form.bil_marke} ${form.bil_modell} (${form.bil_ar})` : '',
        ].filter(Boolean).join('\n'),
        status: 'pending',
      });
      if (error) throw error;

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
        active={null as unknown as 'Sälj bil'}
        onSelect={handleMenuSelect}
      />

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
            <button type="button" onClick={() => onNavigateBuy?.()} className="text-[15px] text-white/80 hover:text-white transition font-medium">
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

      {/* Hero */}
      <div className="bg-[#0e6efe] pt-32 pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-xl mb-5 tracking-wide uppercase">
            Kostnadsfritt första möte
          </div>
          <h1 className="text-[28px] sm:text-4xl font-bold text-white leading-tight tracking-tight">
            Boka din kostnadsfria konsultation
          </h1>
          <p className="mt-3 text-blue-100 text-[15px] sm:text-base max-w-lg mx-auto leading-relaxed">
            En av våra bilexperter ringer upp dig vid en tid som passar. Vi lyssnar, ger råd och hjälper dig – utan förpliktelser.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="py-10 px-4">
        <div className="max-w-lg mx-auto">
          {step !== 'bekraftelse' && <ProgressBar step={step} />}

          {/* Step 1: Syfte */}
          {step === 'syfte' && (
            <div>
              <h2 className="text-[22px] font-bold text-slate-900 mb-1">Vad kan vi hjälpa dig med?</h2>
              <p className="text-slate-500 text-[14px] mb-6">Välj det alternativ som passar bäst.</p>
              <div className="space-y-2.5">
                {SYFTE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSyfteSelect(opt.value)}
                    className="group w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-slate-200 bg-white hover:border-[#0e6efe] hover:shadow-md hover:shadow-blue-50 active:scale-[0.99] transition-all duration-150 text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#0e6efe]/8 group-hover:bg-[#0e6efe]/12 flex items-center justify-center shrink-0 transition-colors">
                      <opt.icon className="w-4.5 h-4.5 text-[#0e6efe]" strokeWidth={1.8} style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-[15px] leading-snug">{opt.label}</div>
                      <div className="text-slate-500 text-[13px] mt-0.5 truncate">{opt.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0e6efe] ml-auto shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step kop_sub: Har du hittat en bil? */}
          {step === 'kop_sub' && (
            <div>
              <button
                type="button"
                onClick={() => setStep('syfte')}
                className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-700 mb-6 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Ändra ämne
              </button>
              <h2 className="text-[22px] font-bold text-slate-900 mb-1">Har du hittat en bil?</h2>
              <p className="text-slate-500 text-[14px] mb-6">
                Svaret hjälper oss förbereda rätt hjälp inför samtalet.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm(f => ({ ...f, kop_status: 'hittat' }));
                  }}
                  className={`group w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-150 text-left ${
                    form.kop_status === 'hittat'
                      ? 'border-[#0e6efe] bg-[#0e6efe]/5 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-[#0e6efe] hover:shadow-md hover:shadow-blue-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${form.kop_status === 'hittat' ? 'bg-[#0e6efe] text-white' : 'bg-[#0e6efe]/8 text-[#0e6efe]'}`}>
                    <LinkIcon style={{ width: 18, height: 18 }} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-[15px]">Ja, jag har hittat en bil</div>
                    <div className="text-slate-500 text-[13px] mt-0.5">Jag vill ha hjälp att förhandla och granska den</div>
                  </div>
                  {form.kop_status === 'hittat' && <Check className="w-4 h-4 text-[#0e6efe] ml-auto shrink-0" strokeWidth={2.5} />}
                  {form.kop_status !== 'hittat' && <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0e6efe] ml-auto shrink-0 transition-colors" />}
                </button>

                {form.kop_status === 'hittat' && (
                  <div className="pl-[52px] pr-1 -mt-1 pb-1">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                      Länk till annonsen <span className="text-slate-400 font-normal">(valfritt)</span>
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="url"
                        inputMode="url"
                        value={form.bil_link}
                        onChange={e => setForm(f => ({ ...f, bil_link: e.target.value }))}
                        placeholder="https://www.blocket.se/annons/..."
                        className="form-control pl-9 text-[13px]"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setForm(f => ({ ...f, kop_status: 'letar' }));
                  }}
                  className={`group w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-150 text-left ${
                    form.kop_status === 'letar'
                      ? 'border-[#0e6efe] bg-[#0e6efe]/5 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-[#0e6efe] hover:shadow-md hover:shadow-blue-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${form.kop_status === 'letar' ? 'bg-[#0e6efe] text-white' : 'bg-[#0e6efe]/8 text-[#0e6efe]'}`}>
                    <Search style={{ width: 18, height: 18 }} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-[15px]">Nej, jag letar fortfarande</div>
                    <div className="text-slate-500 text-[13px] mt-0.5">Jag vill ha hjälp att hitta och jämföra alternativ</div>
                  </div>
                  {form.kop_status === 'letar' && <Check className="w-4 h-4 text-[#0e6efe] ml-auto shrink-0" strokeWidth={2.5} />}
                  {form.kop_status !== 'letar' && <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0e6efe] ml-auto shrink-0 transition-colors" />}
                </button>
              </div>

              {form.kop_status && (
                <button
                  type="button"
                  onClick={() => setStep('kontakt')}
                  className="btn-primary w-full mt-6 h-12 text-[15px]"
                >
                  Fortsätt
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Step salj_reg: Regnummer för sälja/inbyte */}
          {step === 'salj_reg' && (
            <div>
              <button
                type="button"
                onClick={() => setStep('syfte')}
                className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-700 mb-6 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Ändra ämne
              </button>
              <h2 className="text-[22px] font-bold text-slate-900 mb-1">
                {form.syfte === 'inbyte' ? 'Vilken bil vill du byta in?' : 'Vilken bil vill du sälja?'}
              </h2>
              <p className="text-slate-500 text-[14px] mb-6">
                Ange regnummer så hämtar vi uppgifter automatiskt.
              </p>

              <div className="mb-2">
                <RegInput
                  value={form.regnummer}
                  onChange={v => setForm(f => ({ ...f, regnummer: v, bil_marke: '', bil_modell: '', bil_ar: '', bil_miltal: '' }))}
                />
              </div>
              <VehicleCard regnummer={form.regnummer} />

              {vehicleLookup.status === 'found' && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Miltal (mil)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={form.bil_miltal}
                      onChange={e => setForm(f => ({ ...f, bil_miltal: e.target.value }))}
                      placeholder="t.ex. 8500"
                      className="form-control"
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('kontakt')}
                  className="flex-1 btn-primary h-12 text-[15px]"
                >
                  Fortsätt
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-[12px] text-slate-400 mt-3">
                Inget regnummer? Du kan lämna fältet tomt och berätta mer i meddelandet.
              </p>
            </div>
          )}

          {/* Step 2: Kontakt */}
          {step === 'kontakt' && (
            <div>
              <button
                type="button"
                onClick={() => {
                  if (form.syfte === 'kop_bil') setStep('kop_sub');
                  else if (form.syfte === 'salj_bil' || form.syfte === 'inbyte') setStep('salj_reg');
                  else setStep('syfte');
                }}
                className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-700 mb-6 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Tillbaka
              </button>

              {/* Summary chip */}
              {form.syfte && (
                <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-[#0e6efe]/5 rounded-xl border border-[#0e6efe]/15">
                  <Car className="w-4 h-4 text-[#0e6efe] shrink-0" />
                  <span className="text-[13px] font-medium text-[#0e6efe]">
                    {selectedSyfte?.label}
                    {form.kop_status === 'hittat' && form.bil_link && ` · Har hittat bil`}
                    {form.kop_status === 'letar' && ` · Letar fortfarande`}
                    {form.regnummer && ` · ${form.regnummer}`}
                    {form.bil_marke && ` – ${form.bil_marke} ${form.bil_modell}`}
                  </span>
                </div>
              )}

              <h2 className="text-[22px] font-bold text-slate-900 mb-6">Dina uppgifter</h2>

              <div className="space-y-5">
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
                    placeholder="Berätta gärna mer om vad du letar efter, din budget eller andra önskemål..."
                    rows={3}
                    className="form-control"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleKontaktNext}
                className="btn-primary w-full mt-7 h-12 text-[15px]"
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
                className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-700 mb-6 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Tillbaka
              </button>
              <h2 className="text-[22px] font-bold text-slate-900 mb-1">Välj datum och tid</h2>
              <p className="text-slate-500 text-[14px] mb-6">Välj ett av de närmaste lediga alternativen.</p>

              <div className="grid grid-cols-4 gap-2 mb-7">
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
                      className={`flex flex-col items-center gap-0.5 py-3.5 px-2 rounded-xl border transition-all duration-150 active:scale-[0.97] ${
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
              {errors.booking_date && <p className="text-red-500 text-xs -mt-4 mb-4">{errors.booking_date}</p>}

              {form.booking_date && (
                <>
                  <p className="text-[13px] font-semibold text-slate-700 mb-3">
                    Tillgängliga tider – <span className="font-normal text-slate-500">{selectedDateLabel}</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {TIME_SLOTS.map(t => {
                      const booked = bookedSlots.has(t);
                      const selected = form.booking_time === t;
                      if (booked) {
                        return (
                          <div
                            key={t}
                            className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed select-none"
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
                  <p className="text-[12px] text-slate-400 mb-5 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 shrink-0" /> Grå tider är redan bokade
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
                className="btn-primary w-full h-12 text-[15px] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Bokar...</>
                  : <>Boka konsultation <ArrowRight className="w-4 h-4" /></>
                }
              </button>

              <p className="text-center text-[12px] text-slate-400 mt-3">
                Ingen bindning. Avboka när som helst.
              </p>
            </div>
          )}

          {/* Step 4: Bekräftelse */}
          {step === 'bekraftelse' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-green-600" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Tack, {form.namn.split(' ')[0]}!</h2>
              <p className="text-slate-600 text-base mb-1">Din konsultation är bokad</p>
              <p className="font-semibold text-[#0e6efe] text-base mb-8">
                {selectedDateLabel} kl. {form.booking_time}
              </p>

              <div className="bg-slate-50 rounded-xl p-5 text-left mb-8 border border-slate-100 max-w-sm mx-auto">
                <h3 className="font-semibold text-sm text-slate-700 mb-3">Din bokning</h3>
                <div className="grid gap-2.5 text-sm">
                  {[
                    { label: 'Namn',   value: form.namn },
                    { label: 'Telefon', value: form.telefon },
                    { label: 'Ärende', value: selectedSyfte?.label ?? '' },
                    form.regnummer ? { label: 'Regnummer', value: form.regnummer } : null,
                    form.bil_marke ? { label: 'Bil', value: `${form.bil_marke} ${form.bil_modell}` } : null,
                    { label: 'Datum',  value: selectedDateLabel },
                    { label: 'Tid',    value: `kl. ${form.booking_time}` },
                  ].filter(Boolean).map(row => row && (
                    <div key={row.label} className="flex justify-between">
                      <span className="text-slate-400">{row.label}</span>
                      <span className="font-medium text-slate-800">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {form.email && (
                <p className="text-sm text-slate-500 mb-6">
                  En bekräftelse skickas till <span className="font-medium text-slate-700">{form.email}</span>
                </p>
              )}

              <button
                type="button"
                onClick={onBack}
                className="btn-primary px-8 h-12"
              >
                Tillbaka till startsidan
              </button>
            </div>
          )}
        </div>
      </div>

      {step !== 'bekraftelse' && (
        <div className="border-t border-slate-100 py-10 px-4 mt-4">
          <div className="max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {[
                { icon: Check,       color: 'text-emerald-600', bg: 'bg-emerald-50',  title: 'Kostnadsfritt',     desc: 'Du betalar ingenting för konsultationen.' },
                { icon: Phone,       color: 'text-[#0e6efe]',   bg: 'bg-blue-50',     title: 'Vi ringer dig',     desc: 'Vi tar initiativet – ingen väntan i kö.' },
                { icon: ShieldCheck, color: 'text-slate-600',   bg: 'bg-slate-100',   title: 'Inga förpliktelser', desc: 'Tacka nej när du vill, utan förklaring.' },
              ].map(item => (
                <div key={item.title} className="flex-1 flex items-start gap-3 py-5 sm:py-0 sm:px-6 first:pt-0 last:pb-0 sm:first:pl-0 sm:last:pr-0">
                  <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <item.icon className={`w-4.5 h-4.5 ${item.color}`} strokeWidth={2} style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <div className="font-semibold text-[14px] text-slate-900 leading-snug">{item.title}</div>
                    <div className="text-[13px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
