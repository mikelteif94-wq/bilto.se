import { Check } from 'lucide-react';

interface RegInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  size?: 'sm' | 'md';
}

export default function RegInput({ value, onChange, disabled, error, size = 'md' }: RegInputProps) {
  const isValid = /^[A-Z]{3}\d{2}[A-Z0-9]$/.test(value);

  const INVALID_LETTERS = new Set(['I', 'Q', 'Å', 'Ä', 'Ö']);

  const handleChange = (raw: string) => {
    const cleaned = raw.toUpperCase().replace(/[^A-ZÅÄÖ0-9]/g, '');
    let result = '';
    for (const ch of cleaned) {
      if (INVALID_LETTERS.has(ch)) continue;
      const pos = result.length;
      if (pos < 3 && /[A-Z]/.test(ch)) {
        result += ch;
      } else if (pos >= 3 && pos < 5 && /[0-9]/.test(ch)) {
        result += ch;
      } else if (pos === 5 && /[A-Z0-9]/.test(ch)) {
        result += ch;
      }
    }
    onChange(result);
  };

  return (
    <label
      className={`flex items-stretch ${size === 'sm' ? 'h-12' : 'h-14'} rounded-xl border overflow-hidden transition focus-within:ring-2 focus-within:ring-[#0e6efe]/20 focus-within:border-[#0e6efe] ${
        error
          ? 'border-red-400 bg-red-50'
          : 'border-slate-300 bg-white'
      }`}
    >
      <span className={`flex items-center justify-center ${size === 'sm' ? 'w-10 text-[15px]' : 'w-12 text-[20px]'} bg-[#0e6efe] text-white font-bold shrink-0`}>
        S
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="ABC12M"
        maxLength={6}
        autoComplete="off"
        disabled={disabled}
        className={`flex-1 min-w-0 px-3 bg-white ${size === 'sm' ? 'text-[15px]' : 'text-[18px]'} font-bold tracking-widest text-slate-900 italic text-center focus:outline-none placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal placeholder:not-italic disabled:opacity-50`}
      />
      {isValid && (
        <span className="flex items-center justify-center w-10 shrink-0">
          <span className={`${size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'} rounded-full bg-emerald-500 flex items-center justify-center`}>
            <Check className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-white`} strokeWidth={3} />
          </span>
        </span>
      )}
    </label>
  );
}
