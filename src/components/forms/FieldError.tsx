import { XCircle } from 'lucide-react';

interface FieldErrorProps {
  message?: string;
  className?: string;
}

export default function FieldError({ message, className = '' }: FieldErrorProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={`mt-2 inline-flex items-start gap-2 px-3 py-2 rounded-lg bg-[#0e6efe] text-white text-[13px] font-medium shadow-sm ${className}`}
    >
      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-[1px]" strokeWidth={2.5} />
      <span className="leading-snug">{message}</span>
    </div>
  );
}
