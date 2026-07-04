import { useEffect } from 'react';
import { X } from 'lucide-react';

export type MobileMenuItem =
  | 'Sälj bil'
  | 'Förmedling'
  | 'Hitta bil'
  | 'Köp bil'
  | 'Köp bil med hjälp'
  | 'Om oss'
  | 'Vi förhandlar åt dig'
  | 'Bilköpshjälpen'
  | 'Guider'
  | 'Priser'
  | 'Vanliga frågor'
  | 'Bilspara';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  active?: MobileMenuItem;
  onSelect?: (item: MobileMenuItem) => void;
}

function navigate(path: string, onClose: () => void) {
  onClose();
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function MobileMenu({ open, onClose, active }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const items: { label: string; path: string; id: MobileMenuItem }[] = [
    { label: 'Säljhjälpen', path: '/salj-bil', id: 'Sälj bil' },
    { label: 'Bilköpshjälpen', path: '/kop-bil', id: 'Köp bil' },
    { label: 'Om oss', path: '/om-oss', id: 'Om oss' },
  ];

  return (
    <div
      className={`lg:hidden fixed inset-0 z-50 transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Stäng meny"
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute top-0 left-0 h-full w-[82%] max-w-[340px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 pl-6 pr-5 flex items-center justify-end border-b border-slate-100">
          <button type="button" aria-label="Stäng" onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-slate-900">
            <X className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {items.map(({ label, path, id }) => (
            <button
              key={id}
              type="button"
              onClick={() => navigate(path, onClose)}
              className={`w-full text-left px-4 py-3 rounded-lg text-[18px] tracking-tight transition font-medium ${
                active === id ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-800 hover:bg-[#faf8f5]'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-100 px-4 py-4 flex flex-col gap-2">
          <a
            href="/gratis-konsultation"
            className="inline-flex items-center justify-center gap-2 w-full px-4 h-12 rounded-xl bg-[#0e6efe] text-white text-[15px] font-semibold hover:bg-[#0a57cc] transition"
          >
            Kostnadsfri konsultation
          </a>
          <button
            type="button"
            onClick={() => navigate('/logga-in', onClose)}
            className="w-full px-4 h-10 rounded-xl border border-slate-200 text-slate-700 text-[14px] font-medium hover:bg-slate-50 transition"
          >
            Logga in
          </button>
        </div>
      </aside>
    </div>
  );
}
