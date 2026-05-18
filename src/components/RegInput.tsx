import { Check } from 'lucide-react';

interface RegInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export default function RegInput({ value, onChange, disabled, error }: RegInputProps) {
  const isValid = /^[A-Z]{3}\d{2}[A-Z0-9]$/.test(value);

  const handleChange = (raw: string) => {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let result = '';
    for (const ch of cleaned) {
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
      className={`flex items-stretch h-12 rounded-lg border overflow-hidden transition focus-within:ring-2 focus-within:ring-[#0e6efe]/20 focus-within:border-[#0e6efe] ${
        error
          ? 'border-red-400 bg-red-50'
          : 'border-slate-300 bg-white'
      }`}
    >
      <span className="flex items-center justify-center w-11 bg-[#0e6efe] text-white text-[18px] font-bold shrink-0">
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
        className="flex-1 min-w-0 w-0 px-3 bg-white text-[15px] font-semibold tracking-wider text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal disabled:opacity-50"
      />
      {isValid && (
        <span className="flex items-center justify-center w-10 shrink-0">
          <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </span>
        </span>
      )}
    </label>
  );
}
