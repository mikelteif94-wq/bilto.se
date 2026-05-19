import { useState } from 'react';
import FieldError from './FieldError';
import { validateSwedishPhone } from '../../lib/utils';

const TIMES = [
  { value: 'morning', label: '08–12' },
  { value: 'lunch', label: '12–14' },
  { value: 'afternoon', label: '14–17' },
  { value: 'evening', label: '17–20' },
];

export interface BuyContactData {
  namn: string;
  telefon: string;
  mejl: string;
  preferredTime: string;
}

interface BuyContactStepProps {
  initialData: BuyContactData;
  onNext: (data: BuyContactData) => void;
  submitting?: boolean;
}

export default function BuyContactStep({ initialData, onNext, submitting = false }: BuyContactStepProps) {
  const [d, setD] = useState<BuyContactData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (validate()) onNext(d);
  };

  const set = (key: keyof BuyContactData, value: string) => {
    setD(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

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
