import { useState } from 'react';
import { Lock, Eye, BarChart3 } from 'lucide-react';
import { CustomerData } from '../../pages/SellCarPage';
import FieldError from './FieldError';
import { validateSwedishPhone } from '../../lib/utils';

interface CustomerFormProps {
  initialData: CustomerData;
  onNext: (data: CustomerData) => void;
  requirePassword?: boolean;
}

export default function CustomerForm({ initialData, onNext, requirePassword = true }: CustomerFormProps) {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.namn.trim()) e.namn = 'Namn är obligatoriskt';
    const phoneErr = validateSwedishPhone(data.telefon);
    if (phoneErr) e.telefon = phoneErr;
    if (!data.mejl.trim()) {
      e.mejl = 'E-post är obligatorisk';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.mejl)) {
      e.mejl = 'Ogiltig e-postadress';
    }
    if (requirePassword && (!data.losenord || data.losenord.length < 6)) {
      e.losenord = 'Välj ett lösenord med minst 6 tecken';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onNext(data);
  };

  const field = (
    key: keyof CustomerData,
    label: string,
    type: string,
    placeholder: string,
    inputMode?: 'text' | 'tel' | 'email',
    autoComplete?: string
  ) => (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={
          autoComplete ?? (key === 'namn' ? 'name' : key === 'telefon' ? 'tel' : 'email')
        }
        value={data[key]}
        onChange={(e) => {
          setData({ ...data, [key]: e.target.value });
          setErrors((prev) => ({ ...prev, [key]: undefined }));
        }}
        placeholder={placeholder}
        className={`form-control ${errors[key] ? 'form-control-error' : ''}`}
      />
      <FieldError message={errors[key]} />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {field('namn', 'Fullständigt namn', 'text', 'Johan Andersson', 'text')}
      {field('telefon', 'Telefonnummer', 'tel', '070-123 45 67', 'tel')}
      {field('mejl', 'E-postadress', 'text', 'johan@example.com', 'email')}
      {requirePassword && (
        <div className="space-y-4">
          <div className="rounded-xl bg-[#0e6efe]/5 border border-[#0e6efe]/10 p-4">
            <p className="text-[13px] font-semibold text-slate-800 mb-2.5">
              Varför behövs ett lösenord?
            </p>
            <ul className="space-y-2">
              {[
                { icon: BarChart3, text: 'Följ buden i realtid på din personliga sida' },
                { icon: Eye, text: 'Se vilka handlare som lagt bud på din bil' },
                { icon: Lock, text: 'Dina uppgifter skyddas bakom inloggning' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#0e6efe]" />
                  </div>
                  <span className="text-[12.5px] text-slate-600">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Skapa ett lösenord för ditt konto
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={data.losenord}
              onChange={(e) => {
                setData({ ...data, losenord: e.target.value });
                setErrors((prev) => ({ ...prev, losenord: undefined }));
              }}
              placeholder="Minst 6 tecken"
              className={`form-control ${errors.losenord ? 'form-control-error' : ''}`}
            />
            <FieldError message={errors.losenord} />
            <p className="text-[12.5px] text-slate-400 mt-1.5">
              Du kan ändra ditt lösenord senare via ditt konto.
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="w-full h-12 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-[15px] rounded-full transition mt-2 shadow-sm"
      >
        Nästa
      </button>
    </form>
  );
}
