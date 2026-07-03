import { useState } from 'react';

const TOOLTIP_TEXT =
  'Bilto Score (1–10) är vår samlade expertbedömning av bilen. ' +
  'Vi väger in: pris mot marknaden, ägarkostnad, tillförlitlighet och utrustningsnivå.';

function scoreColor(value: number) {
  if (value >= 8.0) return '#059669'; // green
  if (value >= 6.0) return '#0e6efe'; // blue
  return '#d97706';                   // orange
}

function fmt(value: number) {
  return value.toFixed(1);
}

interface ScoreBadgeProps {
  value: number;
  small?: boolean;
  className?: string;
}

export default function ScoreBadge({ value, small = false, className = '' }: ScoreBadgeProps) {
  const [tip, setTip] = useState(false);
  const color = scoreColor(value);
  const size = small ? 'w-8 h-8' : 'w-10 h-10';
  const fontSize = small ? 'text-[10px]' : 'text-[13px]';

  return (
    <div
      className={`flex items-center justify-center ${size} rounded-xl bg-white/95 shadow-md cursor-pointer select-none ${className}`}
      style={{ border: `2.5px solid ${color}` }}
      onClick={e => { e.stopPropagation(); setTip(t => !t); }}
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
      aria-label={`Bilto Score ${fmt(value)}`}
    >
      <span className={`${fontSize} font-extrabold tabular-nums leading-none`} style={{ color }}>
        {fmt(value)}
      </span>

      {tip && (
        <div
          className="absolute z-50 bottom-full right-0 mb-2 w-56 rounded-xl bg-slate-900 text-white text-[11px] leading-[1.5] px-3 py-2.5 shadow-xl pointer-events-none"
          onClick={e => e.stopPropagation()}
        >
          <p className="font-bold mb-1 text-[12px]">Bilto Score</p>
          {TOOLTIP_TEXT}
          <div className="absolute bottom-[-5px] right-3 w-2.5 h-2.5 bg-slate-900 rotate-45" />
        </div>
      )}
    </div>
  );
}
