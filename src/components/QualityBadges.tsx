import { Flame, Clock, CheckCircle2, CreditCard, ArrowLeftRight } from 'lucide-react';

// ─── Badge definitions ────────────────────────────────────────────────────────

interface BadgeDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  /** Tailwind classes for the active/display pill */
  activeCls: string;
  /** Tailwind classes for the inactive toggle button */
  inactiveCls: string;
}

const SM_ICON = 'w-2.5 h-2.5';
const MD_ICON = 'w-3 h-3';

function makeDefs(iconSize: string): BadgeDef[] {
  return [
    {
      key: 'hot',
      label: 'HOT',
      icon: <Flame className={iconSize} />,
      activeCls: 'bg-red-600 text-white font-bold',
      inactiveCls: 'border-red-200 text-red-400 hover:border-red-400 hover:text-red-600',
    },
    {
      key: 'nyss_varderad',
      label: 'Nyss värderad',
      icon: <Clock className={iconSize} />,
      activeCls: 'bg-amber-400 text-amber-900 font-medium',
      inactiveCls: 'border-amber-200 text-amber-400 hover:border-amber-400 hover:text-amber-600',
    },
    {
      key: 'redo_idag',
      label: 'Redo idag',
      icon: <CheckCircle2 className={iconSize} />,
      activeCls: 'bg-green-500 text-white font-medium',
      inactiveCls: 'border-green-200 text-green-400 hover:border-green-400 hover:text-green-600',
    },
    {
      key: 'finans_klar',
      label: 'Finans klar',
      icon: <CreditCard className={iconSize} />,
      activeCls: 'bg-blue-500 text-white font-medium',
      inactiveCls: 'border-blue-200 text-blue-400 hover:border-blue-400 hover:text-blue-600',
    },
    {
      key: 'inbyte_mojligt',
      label: 'Inbyte möjligt',
      icon: <ArrowLeftRight className={iconSize} />,
      activeCls: 'bg-teal-500 text-white font-medium',
      inactiveCls: 'border-teal-200 text-teal-400 hover:border-teal-400 hover:text-teal-600',
    },
  ];
}

// ─── QualityBadgeList ─────────────────────────────────────────────────────────

interface QualityBadgeListProps {
  badges: string[];
  size?: 'sm' | 'md';
}

export function QualityBadgeList({ badges, size = 'sm' }: QualityBadgeListProps) {
  if (!badges || badges.length === 0) return null;

  const iconSize = size === 'sm' ? SM_ICON : MD_ICON;
  const defs = makeDefs(iconSize);

  const pillBase =
    size === 'sm'
      ? 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] leading-none'
      : 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs leading-none';

  const activeDefs = defs.filter((d) => badges.includes(d.key));
  if (activeDefs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {activeDefs.map((d) => (
        <span key={d.key} className={`${pillBase} ${d.activeCls}`}>
          {d.icon}
          {d.label}
        </span>
      ))}
    </div>
  );
}

// ─── QualityBadgePicker ───────────────────────────────────────────────────────

interface QualityBadgePickerProps {
  badges: string[];
  onChange: (badges: string[]) => void;
  saving?: boolean;
}

export function QualityBadgePicker({ badges, onChange, saving = false }: QualityBadgePickerProps) {
  const defs = makeDefs(SM_ICON);

  function toggle(key: string) {
    if (saving) return;
    const next = badges.includes(key)
      ? badges.filter((b) => b !== key)
      : [...badges, key];
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {defs.map((d) => {
        const active = badges.includes(d.key);
        return (
          <button
            key={d.key}
            type="button"
            onClick={() => toggle(d.key)}
            disabled={saving}
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] leading-none
              border transition-all
              ${active
                ? `${d.activeCls} border-transparent shadow-sm`
                : `bg-white ${d.inactiveCls}`
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {d.icon}
            {d.label}
          </button>
        );
      })}
    </div>
  );
}
