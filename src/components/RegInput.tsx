import { Check } from 'lucide-react';

interface RegInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  dark?: boolean;
}

export default function RegInput({ value, onChange, disabled, error, size = 'md', dark = false }: RegInputProps) {
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

  const heightCls = size === 'sm' ? 'h-10' : size === 'lg' ? 'h-14' : 'h-12';
  const textSizeCls = size === 'sm' ? 'text-[13px]' : 'text-[15px]';
  const badgeSizeCls = size === 'sm' ? 'w-9 text-[14px]' : 'w-11 text-[18px]';
  const checkContainerCls = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const checkIconCls = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  if (dark) {
    return (
      <label
        className={`flex items-stretch ${heightCls} rounded-xl border border-white/15 overflow-hidden transition focus-within:border-white/40`}
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <span className={`flex items-center justify-center ${badgeSizeCls} bg-[#0e6efe] text-white font-bold shrink-0`}>
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
          className={`flex-1 min-w-0 w-0 px-3 bg-transparent ${textSizeCls} font-semibold tracking-wider text-white focus:outline-none placeholder:text-white/35 placeholder:font-normal placeholder:tracking-normal disabled:opacity-50`}
        />
        {isValid && (
          <span className="flex items-center justify-center w-10 shrink-0">
            <span className={`${checkContainerCls} rounded-full bg-emerald-500 flex items-center justify-center`}>
              <Check className={`${checkIconCls} text-white`} strokeWidth={3} />
            </span>
          </span>
        )}
      </label>
    );
  }

  return (
    <label
      className={`flex items-stretch ${heightCls} rounded-lg border overflow-hidden transition focus-within:ring-2 focus-within:ring-[#0e6efe]/20 focus-within:border-[#0e6efe] ${
        error
          ? 'border-red-400 bg-red-50'
          : 'border-slate-300 bg-white'
      }`}
    >
      <span className={`flex items-center justify-center ${badgeSizeCls} bg-[#0e6efe] text-white font-bold shrink-0`}>
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
        className={`flex-1 min-w-0 w-0 px-3 bg-white ${textSizeCls} font-semibold tracking-wider text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal disabled:opacity-50`}
      />
      {isValid && (
        <span className="flex items-center justify-center w-10 shrink-0">
          <span className={`${checkContainerCls} rounded-full bg-emerald-500 flex items-center justify-center`}>
            <Check className={`${checkIconCls} text-white`} strokeWidth={3} />
          </span>
        </span>
      )}
    </label>
  );
}
