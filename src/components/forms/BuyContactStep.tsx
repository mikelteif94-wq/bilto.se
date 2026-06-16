import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import FieldError from './FieldError';
import { validateSwedishPhone } from '../../lib/utils';
import EmailOtpStep from './EmailOtpStep';

const TIMES = [
  { value: 'whenever', label: 'När som helst' },
  { value: 'morning', label: 'Förmiddag' },
  { value: 'afternoon', label: 'Eftermiddag' },
];

const DEAL_READINESS_OPTIONS = [
  { value: 'ready_now',    label: 'Redo att köpa nu',          desc: 'Jag vill genomföra affären så snart som möjligt' },
  { value: 'within_month', label: 'Inom en månad',             desc: 'Jag är nästan klar och behöver lite tid' },
  { value: 'just_looking', label: 'Jag har precis börjat kolla', desc: 'Utforskar alternativ just nu' },
] as const;

export interface BuyContactData {
  namn: string;
  telefon: string;
  mejl: string;
  preferredTime: string;
  dealReadiness: string;
}

interface BuyContactStepProps {
  initialData: BuyContactData;
  onNext: (data: BuyContactData) => void;
  submitting?: boolean;
}

export default function BuyContactStep({ initialData, onNext, submitting = false }: BuyContactStepProps) {
  const [d, setD] = useState<BuyContactData>({ ...initialData, dealReadiness: initialData.dealReadiness ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOtp, setShowOtp] = useState(false);
  const [verifiedMejl, setVerifiedMejl] = useState('');

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!d.namn.trim()) e.namn = 'Namn är obligatoriskt';
    const phoneErr = validateSwedishPhone(d.telefon);
    if (phoneErr) e.telefon = phoneErr;
    if (!d.mejl.trim()) {
      e.mejl = 'E-post är obligatorisk';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.mejl)) {
      e.mejl = 'Ogiltig e-postadress';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Skip OTP if same email already verified this session
    if (verifiedMejl === d.mejl.trim().toLowerCase()) {
      onNext(d);
      return;
    }
    setShowOtp(true);
  };

  const set = (key: keyof BuyContactData, value: string) => {
    setD(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  if (showOtp) {
    return (
      <div className="py-4">
        <EmailOtpStep
          email={d.mejl.trim()}
          onVerified={(verified) => {
            setVerifiedMejl(verified.toLowerCase());
            setShowOtp(false);
            onNext(d);
          }}
          onChangeEmail={() => setShowOtp(false)}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Fullständigt namn</label>
        <input
          type="text"
          autoComplete="name"
          value={d.namn}
          onChange={e => set('namn', e.target.value)}
          placeholder="Johan Andersson"
          className={`form-control ${errors.namn ? 'form-control-error' : ''}`}
        />
        <FieldError message={errors.namn} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Telefonnummer</label>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={d.telefon}
          onChange={e => set('telefon', e.target.value)}
          placeholder="070-123 45 67"
          className={`form-control ${errors.telefon ? 'form-control-error' : ''}`}
        />
        <FieldError message={errors.telefon} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">E-postadress</label>
        <input
          type="text"
          inputMode="email"
          autoComplete="email"
          value={d.mejl}
          onChange={e => set('mejl', e.target.value)}
          placeholder="johan@example.com"
          className={`form-control ${errors.mejl ? 'form-control-error' : ''}`}
        />
        <FieldError message={errors.mejl} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Bästa tid att ringa</label>
        <div className="flex flex-wrap gap-2">
          {TIMES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('preferredTime', d.preferredTime === t.value ? '' : t.value)}
              className={`px-4 sm:px-5 h-10 rounded-full text-[14px] font-medium transition-all ${
                d.preferredTime === t.value
                  ? 'bg-[#0e6efe] text-white ring-1 ring-inset ring-[#0e6efe] shadow-sm'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* När kan du göra affär? */}
      <div className="border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="w-4 h-4 text-[#0e6efe] shrink-0" />
          <p className="text-[14px] font-semibold text-slate-800">När kan du tänka dig att köpa?</p>
        </div>
        <div className="space-y-2">
          {DEAL_READINESS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setD(prev => ({ ...prev, dealReadiness: prev.dealReadiness === opt.value ? '' : opt.value }))}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                d.dealReadiness === opt.value
                  ? 'border-[#0e6efe] bg-[#0e6efe]/[0.04]'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                d.dealReadiness === opt.value ? 'border-[#0e6efe] bg-[#0e6efe]' : 'border-slate-300'
              }`}>
                {d.dealReadiness === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <p className={`text-[13.5px] font-semibold leading-snug ${d.dealReadiness === opt.value ? 'text-slate-900' : 'text-slate-700'}`}>
                  {opt.label}
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-12 bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[15px] rounded-full transition mt-2 shadow-sm"
      >
        {submitting ? 'Skickar...' : 'Skicka förfrågan'}
      </button>
      <p className="text-[12px] text-slate-500 text-center">
        100% kostnadsfritt. Vi ringer dig inom en timme.
      </p>
    </form>
  );
}
