import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-[#0047B3] rounded-xl transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
