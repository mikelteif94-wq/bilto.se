import { XCircle } from 'lucide-react';

interface ErrorBannerProps {
  message?: string | null;
  className?: string;
  align?: 'left' | 'center';
}

export default function ErrorBanner({ message, className = '', align = 'left' }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-xl bg-[#0e6efe] text-white text-[14px] font-medium shadow-sm px-4 py-3 ${align === 'center' ? 'justify-center text-center' : ''} ${className}`}
    >
      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-[1px]" strokeWidth={2.5} />
      <span className="leading-snug">{message}</span>
    </div>
  );
}
