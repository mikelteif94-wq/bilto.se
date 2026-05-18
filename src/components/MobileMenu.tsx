import { useEffect } from 'react';
import { X, User } from 'lucide-react';

export type MobileMenuItem =
  | 'Sälj bil'
  | 'Förmedling'
  | 'Köp bil'
  | 'Om oss'
  | 'Så funkar det';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  active?: MobileMenuItem;
  onSelect: (item: MobileMenuItem) => void;
}

const ITEMS: MobileMenuItem[] = [
  'Sälj bil',
  'Köp bil',
  'Om oss',
];

export default function MobileMenu({ open, onClose, active, onSelect }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={`lg:hidden fixed inset-0 z-50 transition ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Stäng meny"
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        className={`absolute top-0 left-0 h-full w-[82%] max-w-[340px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 pl-6 pr-5 flex items-center justify-end border-b border-slate-100">
          <button
            type="button"
            aria-label="Stäng"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-slate-900"
          >
            <X className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>
        <nav className="flex-1 px-2 py-6 overflow-y-auto">
          {ITEMS.map((item) => {
            const isActive = active === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === 'Om oss') {
                    window.history.pushState({}, '', '/om-oss');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                    onClose();
                    return;
                  }
                  if (item === 'Sälj bil') {
                    window.history.pushState({}, '', '/');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                    onClose();
                    return;
                  }
                  if (item === 'Köp bil') {
                    window.history.pushState({}, '', '/kop-bil');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                    onClose();
                    return;
                  }
                  onSelect(item);
                  onClose();
                }}
                className={`w-full text-left px-4 py-5 rounded-lg text-[22px] tracking-tight transition ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-800 hover:bg-slate-50 font-medium'
                }`}
              >
                {item}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 px-4 py-4">
          <a
            href="/logga-in"
            className="inline-flex items-center justify-center gap-2 w-full px-4 h-12 rounded-full bg-[#0e6efe] text-white text-[15px] font-semibold hover:bg-[#0a57cc] transition"
          >
            <User className="w-5 h-5" strokeWidth={2.2} />
            Logga in
          </a>
        </div>
      </aside>
    </div>
  );
}
