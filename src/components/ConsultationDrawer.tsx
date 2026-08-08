import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Lock,
  Phone,
  ShieldCheck,
  Car,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import FieldError from './forms/FieldError';
import { validateSwedishPhone } from '../lib/utils';
import RegInput from './RegInput';
import { useVehicleLookup } from '../lib/useVehicleLookup';
import BuyTrackStep, { type BuyTrack } from './forms/BuyTrackStep';
import BuyDetailsStep, { type BuyDetailsData } from './forms/BuyDetailsStep';
import BuyTradeInStep, { type BuyTradeInData } from './forms/BuyTradeInStep';

type Syfte = 'kop_bil' | 'salj_bil' | 'inbyte' | 'ovrig';

const SYFTE_OPTIONS: { value: Syfte; label: string; desc: string; img: string }[] = [
  { value: 'kop_bil',  label: 'Köpa bil',  desc: 'Jag vill ha hjälp att hitta rätt bil',   img: '/benefit1.f6fa1ca3.svg' },
  { value: 'salj_bil', label: 'Sälja bil', desc: 'Jag vill sälja min bil till bästa pris', img: '/benefit2.e5b8ac47.svg' },
  { value: 'inbyte',   label: 'Inbyte',    desc: 'Jag vill byta in min bil mot en ny',     img: '/benefit3.d9e1ec2e_(1).svg' },
  { value: 'ovrig',    label: 'Annat',     desc: 'Jag har en annan fråga',                 img: '/benefit4.dfeb51b1_(1).svg' },
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

type Step = 'syfte' | 'kop_sub' | 'kop_track' | 'kop_details' | 'kop_tradein' | 'salj_reg' | 'salj_condition' | 'inbyte_details' | 'kontakt' | 'tid' | 'bekraftelse';

interface FormData {
  syfte: Syfte | '';
  namn: string;
  telefon: string;
  email: string;
  meddelande: string;
  booking_date: string;
  booking_time: string;
  kop_status: 'hittat' | 'letar' | '';
  bil_link: string;
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
  const displayIdx = (step === 'syfte' || step === 'kop_sub' || step === 'kop_track' || step === 'kop_details' || step === 'kop_tradein' || step === 'salj_reg' || step === 'salj_condition' || step === 'inbyte_details') ? 0 : step === 'kontakt' ? 1 : step === 'tid' ? 2 : 3;

  return (
    <div className="flex items-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-bold transition-all duration-200 ${
                i < displayIdx
                  ? 'bg-[#0e6efe] text-white shadow-md shadow-blue-200'
                  : i === displayIdx
                  ? 'bg-[#0e6efe] text-white ring-4 ring-[#0e6efe]/15 shadow-md shadow-blue-200'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i < displayIdx ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : i + 1}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap ${i <= displayIdx ? 'text-slate-700' : 'text-slate-400'}`}>
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

const SKICK_OPTS = [
  { value: 'mycket_bra', label: 'Mycket bra', desc: 'Inga synliga defekter' },
  { value: 'bra',        label: 'Bra',        desc: 'Mindre brister, välskött' },
  { value: 'okej',       label: 'Okej',       desc: 'Normalt slitage för åldern' },
  { value: 'slitet',     label: 'Slitet',     desc: 'Tydligt slitage, behöver service' },
  { value: 'skadat',     label: 'Skadat',     desc: 'Skador som påverkar funktion/utseende' },
];

interface SellCarData {
  regnummer: string;
  marke: string;
  modell: string;
  ar: number;
  miltal: number;
  skick: string;
  skickKommentar: string;
}

function SellCarMiniForm({
  initialData,
  onNext,
  onBack,
  compact,
}: {
  initialData: SellCarData;
  onNext: (data: SellCarData) => void;
  onBack: () => void;
  compact?: boolean;
}) {
  const [reg, setReg] = useState(initialData.regnummer);
  const [miltal, setMiltal] = useState<string>(initialData.miltal ? String(initialData.miltal) : '');
  const [skick, setSkick] = useState(initialData.skick);
  const [autoData, setAutoData] = useState<{ marke: string; modell: string; ar: number } | null>(
    initialData.marke ? { marke: initialData.marke, modell: initialData.modell, ar: initialData.ar } : null
  );
  const [errors, setErrors] = useState<{ regnummer?: string; skick?: string }>({});
  const lookup = useVehicleLookup(reg);

  useEffect(() => {
    if (lookup.status === 'found') {
      const d = lookup.data;
      setAutoData({ marke: d.marke, modell: d.modell, ar: d.ar ?? 0 });
      if (d.miltal && d.miltal > 0) setMiltal(String(d.miltal));
    }
  }, [lookup.status]);

  const handleNext = () => {
    const errs: { regnummer?: string; skick?: string } = {};
    const regClean = reg.trim().toUpperCase().replace(/\s/g, '');
    if (!/^[A-Z0-9]{6}$/.test(regClean)) errs.regnummer = 'Ange ett giltigt regnummer (6 tecken)';
    if (!skick) errs.skick = 'Välj ett skick';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onNext({
      regnummer: regClean,
      marke: autoData?.marke ?? '',
      modell: autoData?.modell ?? '',
      ar: autoData?.ar ?? 0,
      miltal: Number(miltal) || 0,
      skick,
      skickKommentar: '',
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className={`inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition ${compact ? 'text-[12px] mb-5' : 'text-[13px] mb-6'}`}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Ändra ämne
      </button>

      <h3 className={`font-bold text-slate-900 mb-1 ${compact ? 'text-[18px]' : 'text-[18px]'}`}>Din bil</h3>
      <p className="text-slate-500 text-[13px] mb-5">Ange regnummer så hämtar vi uppgifterna automatiskt.</p>

      {/* Regnummer */}
      <div className="mb-5">
        <label className="block text-[13px] font-semibold text-slate-900 mb-2">Registreringsnummer *</label>
        <RegInput
          value={reg}
          onChange={(v) => {
            setReg(v);
            setAutoData(null);
            setErrors(e => ({ ...e, regnummer: undefined }));
          }}
          error={!!errors.regnummer}
        />
        {errors.regnummer && <p className="mt-1 text-[11px] text-red-500">{errors.regnummer}</p>}

        {/* Lookup status */}
        {lookup.status === 'loading' && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100 text-blue-700 text-[13px]">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            Hämtar uppgifter...
          </div>
        )}
        {lookup.status === 'found' && autoData && (
          <div className="mt-3 px-3 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.5} />
              <span className="text-[12px] font-semibold text-emerald-800">Bilen hittad</span>
            </div>
            <p className="text-[14px] font-bold text-slate-900">
              {autoData.marke} {autoData.modell}{autoData.ar ? ` · ${autoData.ar}` : ''}
            </p>
            {lookup.data.bransle && (
              <p className="text-[12px] text-slate-500 mt-0.5">
                {[lookup.data.bransle, lookup.data.farg].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        )}
        {(lookup.status === 'not_found' || lookup.status === 'error') && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-[13px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Kunde inte hämta uppgifter – du kan ändå fortsätta.
          </div>
        )}
      </div>

      {/* Miltal */}
      <div className="mb-5">
        <label className="block text-[13px] font-semibold text-slate-900 mb-2">
          Miltal <span className="text-slate-400 font-normal">(valfritt)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={miltal}
            onChange={e => setMiltal(e.target.value.replace(/\D/g, ''))}
            placeholder="T.ex. 850"
            className="form-control"
          />
          {lookup.status === 'found' && miltal && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-emerald-600 font-medium pointer-events-none">
              <Check className="w-3 h-3" strokeWidth={2.5} />
              Fyllt i automatiskt
            </div>
          )}
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Antal mil · fylls i automatiskt från regnumret</p>
      </div>

      {/* Skick */}
      <div className="mb-6">
        <label className="block text-[13px] font-semibold text-slate-900 mb-2">Vilket skick är bilen i? *</label>
        <div className="flex flex-wrap gap-2">
          {SKICK_OPTS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setSkick(opt.value); setErrors(e => ({ ...e, skick: undefined })); }}
              className={`px-4 h-9 rounded-xl text-[13px] font-medium transition-all ${
                skick === opt.value
                  ? 'bg-[#0e6efe] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {skick && (
          <p className="text-[11px] text-slate-500 mt-2">{SKICK_OPTS.find(o => o.value === skick)?.desc}</p>
        )}
        {errors.skick && <p className="mt-1 text-[11px] text-red-500">{errors.skick}</p>}
      </div>

      <button type="button" onClick={handleNext} className="btn-primary w-full h-12 text-[15px]">
        Fortsätt <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

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

interface ConsultationDrawerProps {
  open: boolean;
  onClose: () => void;
  initialSyfte?: Syfte;
}

export default function ConsultationDrawer({ open, onClose, initialSyfte }: ConsultationDrawerProps) {
  const [step, setStep] = useState<Step>('syfte');
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Buy sub-steps state
  const [buyTrack, setBuyTrack] = useState<BuyTrack>('found');
  const [buyDetails, setBuyDetails] = useState<BuyDetailsData>({
    linkOrSeller: '', carModel: '', carBrand: '', paymentType: '',
    buyingStage: '', fuelType: '', regnummer: '', miltal: '',
    targetCar: '', desiredMonthlyCost: '', leasingType: '',
    additionalRequests: '', carPrice: '', yearFrom: '', yearTo: '', maxMiltal: '',
    hasQuote: null,
  });
  const [buyTradeIn, setBuyTradeIn] = useState<BuyTradeInData>({
    hasTradeIn: null, tradeInReg: '', hasLoan: null, loanAmount: '', interestRate: '',
  });

  // Sell car sub-steps state
  const [sellCar, setSellCar] = useState<SellCarData>({ regnummer: '', marke: '', modell: '', ar: 0, miltal: 0, skick: '', skickKommentar: '' });
  const [sellUtrustning, setSellUtrustning] = useState<string[]>([]);

  const availableDates = useMemo(() => getAvailableDates(), []);
  const bookedSlots = useMemo(
    () => form.booking_date ? getBookedSlots(form.booking_date) : new Set<string>(),
    [form.booking_date]
  );
  const vehicleLookup = useVehicleLookup(form.regnummer);

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setStep(initialSyfte
        ? (initialSyfte === 'kop_bil' ? 'kop_track' : initialSyfte === 'salj_bil' || initialSyfte === 'inbyte' ? 'salj_condition' : 'kontakt')
        : 'syfte');
      setForm({ ...INITIAL, syfte: initialSyfte ?? '' });
      setErrors({});
      setBuyTrack('found');
      setBuyDetails({ linkOrSeller: '', carModel: '', carBrand: '', paymentType: '', buyingStage: '', fuelType: '', regnummer: '', miltal: '', targetCar: '', desiredMonthlyCost: '', leasingType: '', additionalRequests: '', carPrice: '', yearFrom: '', yearTo: '', maxMiltal: '', hasQuote: null });
      setBuyTradeIn({ hasTradeIn: null, tradeInReg: '', hasLoan: null, loanAmount: '', interestRate: '' });
      setSellCar({ regnummer: '', marke: '', modell: '', ar: 0, miltal: 0, skick: '', skickKommentar: '' });
      setSellUtrustning([]);
    }
  }, [open, initialSyfte]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Sync vehicle lookup data
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
      setStep('kop_track');
    } else if (s === 'salj_bil') {
      setStep('salj_condition');
    } else if (s === 'inbyte') {
      setStep('salj_condition');
    } else {
      setStep('kontakt');
    }
  };

  const handleKontaktNext = () => {
    if (validateKontakt()) setStep('tid');
  };

  const selectedDateLabel = availableDates.find(d => d.dateStr === form.booking_date)?.label ?? '';
  const selectedSyfte = SYFTE_OPTIONS.find(o => o.value === form.syfte);

  const handleSubmit = async () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.syfte) errs.syfte = 'Välj ett ärende';
    if (!form.booking_date) errs.booking_date = 'Välj ett datum';
    if (!form.booking_time) errs.booking_time = 'Välj en tid';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      // Build extra context from buy sub-steps
      const buyContext = form.syfte === 'kop_bil' ? [
        buyTrack === 'found' ? 'Hittat bil' : buyTrack === 'trade' ? 'Inbyte' : 'Letar',
        buyDetails.carBrand || buyDetails.carModel ? `Bil: ${[buyDetails.carBrand, buyDetails.carModel].filter(Boolean).join(' ')}` : '',
        buyDetails.linkOrSeller ? `Länk: ${buyDetails.linkOrSeller}` : '',
        buyDetails.paymentType ? `Betalning: ${buyDetails.paymentType}` : '',
        buyDetails.desiredMonthlyCost ? `Månadskostnad: ${buyDetails.desiredMonthlyCost} kr` : '',
        buyDetails.carPrice ? `Budget: ${buyDetails.carPrice}` : '',
        buyTradeIn.hasTradeIn ? `Inbytesbil: ${buyTradeIn.tradeInReg || 'Ja'}` : '',
        buyDetails.additionalRequests,
      ].filter(Boolean).join(' | ') : '';

      const sellContext = (form.syfte === 'salj_bil' || form.syfte === 'inbyte') && sellCar.regnummer ? [
        sellCar.regnummer ? `Regnummer: ${sellCar.regnummer}` : '',
        sellCar.marke || sellCar.modell ? `Bil: ${[sellCar.marke, sellCar.modell].filter(Boolean).join(' ')}${sellCar.ar ? ` (${sellCar.ar})` : ''}` : '',
        sellCar.miltal ? `Miltal: ${sellCar.miltal} mil` : '',
        sellCar.skick ? `Skick: ${sellCar.skick}` : '',
        sellCar.skickKommentar ? `Kommentar: ${sellCar.skickKommentar}` : '',
        sellUtrustning.length ? `Utrustning: ${sellUtrustning.join(', ')}` : '',
      ].filter(Boolean).join(' | ') : '';

      const fullMeddelande = [
        form.meddelande,
        buyContext,
        sellContext,
        form.kop_status === 'hittat' && form.bil_link ? `Bil-länk: ${form.bil_link}` : '',
        form.kop_status === 'letar' ? 'Letar efter bil' : '',
        form.regnummer ? `Regnummer: ${form.regnummer}` : '',
        form.bil_marke ? `Bil: ${form.bil_marke} ${form.bil_modell} (${form.bil_ar})` : '',
      ].filter(Boolean).join('\n');

      const { error } = await supabase.from('consultation_bookings').insert({
        booking_date: form.booking_date,
        booking_time: form.booking_time,
        syfte: form.syfte,
        namn: form.namn,
        telefon: form.telefon,
        email: form.email,
        meddelande: fullMeddelande,
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
          meddelande: fullMeddelande,
        },
      }).catch(() => {});

      setStep('bekraftelse');
    } catch {
      setErrors({ booking_time: 'Något gick fel – försök igen.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.32 }}
            className="relative w-full sm:max-w-[520px] max-h-[92vh] bg-white rounded-t-2xl sm:rounded-b-none flex flex-col shadow-2xl"
          >
            {/* Handle bar + header */}
            <div className="sticky top-0 z-10 bg-white rounded-t-2xl">
              <div className="flex items-center justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-200" />
              </div>
              <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-[16px] font-bold text-slate-900 leading-tight">Boka gratis konsultation</h2>
                  <p className="text-[12px] text-slate-400 mt-0.5">En expert ringer vid vald tid · Ingen bindning</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0 ml-4"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-5 pt-5 pb-8">

                {step !== 'bekraftelse' && <ProgressBar step={step} />}

                {/* Step syfte */}
                {step === 'syfte' && (
                  <div>
                    <h3 className="text-[18px] font-bold text-slate-900 mb-1">Vad behöver du hjälp med?</h3>
                    <p className="text-slate-500 text-[13px] mb-4">Välj det alternativ som passar bäst.</p>
                    <div className="space-y-2">
                      {SYFTE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSyfteSelect(opt.value)}
                          className="group w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-[#0e6efe] hover:shadow-md hover:shadow-blue-50 active:scale-[0.99] transition-all duration-150 text-left"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#0e6efe]/8 group-hover:bg-[#0e6efe]/12 flex items-center justify-center shrink-0 transition-colors">
                            <img src={opt.img} alt={opt.label} className="w-5 h-5 object-contain" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-[14px] leading-snug">{opt.label}</div>
                            <div className="text-slate-500 text-[12px] mt-0.5 truncate">{opt.desc}</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0e6efe] ml-auto shrink-0 transition-colors" />
                        </button>
                      ))}
                    </div>

                    {/* How it works + trust row */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Så funkar det</p>
                      <div className="space-y-2.5">
                        {[
                          { n: '1', title: 'Boka konsultation', desc: 'Välj ärende, fyll i dina uppgifter och välj en tid.' },
                          { n: '2', title: 'Vi ringer dig', desc: 'En av våra bilexperter ringer upp vid vald tid.' },
                          { n: '3', title: 'Få konkreta råd', desc: 'Gratis rådgivning utan säljtricks eller förpliktelser.' },
                        ].map(item => (
                          <div key={item.n} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-lg bg-[#0e6efe]/8 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[11px] font-bold text-[#0e6efe]">{item.n}</span>
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-slate-800 leading-snug">{item.title}</div>
                              <div className="text-[12px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                        {[
                          { icon: Check,       color: 'text-emerald-600', bg: 'bg-emerald-50', title: 'Kostnadsfritt' },
                          { icon: Phone,       color: 'text-[#0e6efe]',   bg: 'bg-blue-50',    title: 'Vi ringer dig' },
                          { icon: ShieldCheck, color: 'text-slate-600',   bg: 'bg-slate-100',  title: 'Inga förpliktelser' },
                        ].map(item => (
                          <div key={item.title} className="flex flex-col items-center gap-1.5 text-center">
                            <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center`}>
                              <item.icon className={`${item.color}`} strokeWidth={2} style={{ width: 16, height: 16 }} />
                            </div>
                            <span className="text-[11px] font-medium text-slate-600 leading-tight">{item.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step kop_track: track selection (found/searching/trade) */}
                {step === 'kop_track' && (
                  <div>
                    {form.syfte && (
                      <button
                        type="button"
                        onClick={() => setStep('syfte')}
                        className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 mb-5 transition"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Ändra ämne
                      </button>
                    )}
                    <BuyTrackStep
                      onChoose={(t) => {
                        setBuyTrack(t);
                        setStep('kop_details');
                      }}
                      onGuidance={() => setStep('kontakt')}
                    />
                  </div>
                )}

                {/* Step kop_details: car details */}
                {step === 'kop_details' && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setStep('kop_track')}
                      className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 mb-5 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Tillbaka
                    </button>
                    <BuyDetailsStep
                      track={buyTrack}
                      initialData={buyDetails}
                      initialBil=""
                      onNext={(data) => {
                        setBuyDetails(data);
                        if (buyTrack === 'found' || buyTrack === 'trade') {
                          setStep('kop_tradein');
                        } else {
                          setStep('kop_tradein');
                        }
                      }}
                      onExplore={() => setStep('kontakt')}
                      onQuiz={() => setStep('kontakt')}
                    />
                  </div>
                )}

                {/* Step kop_tradein: trade-in */}
                {step === 'kop_tradein' && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setStep('kop_details')}
                      className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 mb-5 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Tillbaka
                    </button>
                    <BuyTradeInStep
                      initialData={buyTradeIn}
                      onNext={(data) => {
                        setBuyTradeIn(data);
                        setStep('kontakt');
                      }}
                    />
                  </div>
                )}

                {/* Step salj_condition: reg + miltal + skick */}
                {(step === 'salj_reg' || step === 'salj_condition') && (
                  <SellCarMiniForm
                    compact
                    initialData={sellCar}
                    onBack={() => setStep('syfte')}
                    onNext={(data) => {
                      setSellCar(data);
                      setStep(form.syfte === 'inbyte' ? 'inbyte_details' : 'kontakt');
                    }}
                  />
                )}

                {/* Step inbyte_details: target car for inbyte */}
                {step === 'inbyte_details' && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setStep('salj_condition')}
                      className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 mb-5 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Tillbaka
                    </button>
                    <BuyDetailsStep
                      track="trade"
                      initialData={buyDetails}
                      initialBil=""
                      onNext={(data) => {
                        setBuyDetails(data);
                        setStep('kontakt');
                      }}
                      onExplore={() => setStep('kontakt')}
                      onQuiz={() => setStep('kontakt')}
                    />
                  </div>
                )}

                {/* Step kontakt */}
                {step === 'kontakt' && (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (form.syfte === 'kop_bil') setStep('kop_tradein');
                        else if (form.syfte === 'inbyte') setStep('inbyte_details');
                        else if (form.syfte === 'salj_bil') setStep('salj_condition');
                        else setStep('syfte');
                      }}
                      className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 mb-5 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Tillbaka
                    </button>

                    {form.syfte && (
                      <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-[#0e6efe]/5 rounded-xl border border-[#0e6efe]/15">
                        <Car className="w-4 h-4 text-[#0e6efe] shrink-0" />
                        <span className="text-[12px] font-medium text-[#0e6efe]">
                          {selectedSyfte?.label}
                          {form.kop_status === 'hittat' && form.bil_link && ` · Har hittat bil`}
                          {form.kop_status === 'letar' && ` · Letar fortfarande`}
                          {form.regnummer && ` · ${form.regnummer}`}
                          {form.bil_marke && ` – ${form.bil_marke} ${form.bil_modell}`}
                        </span>
                      </div>
                    )}

                    <h3 className="text-[18px] font-bold text-slate-900 mb-5">Dina uppgifter</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-semibold text-slate-900 mb-2">Fullständigt namn *</label>
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
                        <label className="block text-[13px] font-semibold text-slate-900 mb-2">Telefonnummer *</label>
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
                        <label className="block text-[13px] font-semibold text-slate-900 mb-2">E-postadress *</label>
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
                        <label className="block text-[13px] font-semibold text-slate-900 mb-2">
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
                      className="btn-primary w-full mt-6 h-12 text-[15px]"
                    >
                      Välj datum och tid <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Step tid */}
                {step === 'tid' && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setStep('kontakt')}
                      className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 mb-5 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Tillbaka
                    </button>
                    <h3 className="text-[18px] font-bold text-slate-900 mb-1">Välj datum och tid</h3>
                    <p className="text-slate-500 text-[13px] mb-5">Välj ett av de närmaste lediga alternativen.</p>

                    <div className="grid grid-cols-4 gap-2 mb-6">
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
                            className={`flex flex-col items-center gap-0.5 py-3 px-1 rounded-xl border transition-all duration-150 active:scale-[0.97] ${
                              selected
                                ? 'border-[#0e6efe] bg-[#0e6efe] text-white shadow-md shadow-blue-200'
                                : 'border-slate-200 bg-white hover:border-[#0e6efe]/50 hover:bg-blue-50/40 text-slate-700'
                            }`}
                          >
                            <span className={`text-[10px] font-semibold uppercase tracking-wide ${selected ? 'text-blue-100' : 'text-slate-400'}`}>{d.day}</span>
                            <span className={`text-[20px] font-bold leading-none ${selected ? 'text-white' : 'text-slate-800'}`}>{d.date2}</span>
                            <span className={`text-[10px] font-medium ${selected ? 'text-blue-100' : 'text-slate-400'}`}>{d.month}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.booking_date && <p className="text-red-500 text-xs -mt-3 mb-4">{errors.booking_date}</p>}

                    {form.booking_date && (
                      <>
                        <p className="text-[12px] font-semibold text-slate-700 mb-3">
                          Tillgängliga tider – <span className="font-normal text-slate-500">{selectedDateLabel}</span>
                        </p>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {TIME_SLOTS.map(t => {
                            const booked = bookedSlots.has(t);
                            const selected = form.booking_time === t;
                            if (booked) {
                              return (
                                <div
                                  key={t}
                                  className="flex items-center justify-center gap-1 py-2.5 rounded-xl border border-slate-100 bg-[#faf8f5] text-slate-300 cursor-not-allowed select-none"
                                >
                                  <Lock className="w-3 h-3 shrink-0" />
                                  <span className="text-[12px] font-medium">{t}</span>
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
                                className={`flex items-center justify-center gap-1 py-2.5 rounded-xl border transition-all duration-150 active:scale-[0.97] ${
                                  selected
                                    ? 'border-[#0e6efe] bg-[#0e6efe] text-white shadow-md shadow-blue-200'
                                    : 'border-slate-200 hover:border-[#0e6efe]/50 hover:bg-blue-50/40 text-slate-700'
                                }`}
                              >
                                <Clock className={`w-3 h-3 shrink-0 ${selected ? 'text-blue-100' : 'text-slate-400'}`} />
                                <span className={`text-[12px] font-semibold ${selected ? 'text-white' : ''}`}>{t}</span>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-slate-400 mb-4 flex items-center gap-1.5">
                          <Lock className="w-3 h-3 shrink-0" /> Grå tider är redan bokade
                        </p>
                      </>
                    )}

                    {errors.booking_time && <p className="text-red-500 text-xs mb-3">{errors.booking_time}</p>}

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
                    <p className="text-center text-[11px] text-slate-400 mt-2.5">
                      Ingen bindning. Avboka när som helst.
                    </p>
                  </div>
                )}

                {/* Step bekraftelse */}
                {step === 'bekraftelse' && (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-7 h-7 text-green-600" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-[22px] font-bold text-slate-900 mb-1">Tack, {form.namn.split(' ')[0]}!</h3>
                    <p className="text-slate-600 text-[14px] mb-1">Din konsultation är bokad</p>
                    <p className="font-semibold text-[#0e6efe] text-[15px] mb-7">
                      {selectedDateLabel} kl. {form.booking_time}
                    </p>

                    <div className="bg-[#faf8f5] rounded-xl p-4 text-left mb-6 border border-slate-100 max-w-sm mx-auto">
                      <h4 className="font-semibold text-[13px] text-slate-700 mb-3">Din bokning</h4>
                      <div className="grid gap-2 text-[13px]">
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
                      <p className="text-[13px] text-slate-500 mb-5">
                        En bekräftelse skickas till <span className="font-medium text-slate-700">{form.email}</span>
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-primary px-8 h-12"
                    >
                      Stäng
                    </button>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}