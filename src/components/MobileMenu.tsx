import { useEffect } from 'react';
import { X, User, ChevronRight } from 'lucide-react';

export type MobileMenuItem =
  | 'Sälj bil'
  | 'Förmedling'
  | 'Hitta bil'
  | 'Köp bil'
  | 'Köp bil med hjälp'
  | 'Om oss'
  | 'Så funkar det'
  | 'Vi förhandlar åt dig';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  active?: MobileMenuItem;
  onSelect?: (item: MobileMenuItem) => void;
}

function goToKopBilSection(sectionId: string, onClose: () => void) {
  onClose();
  const isAlreadyOnPage = window.location.pathname === '/kop-bil';
  if (isAlreadyOnPage) {
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  } else {
    window.history.pushState({}, '', '/kop-bil');
    window.dispatchEvent(new PopStateEvent('popstate'));
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  }
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

  const isKopBilActive = active === 'Köp bil med hjälp' || active === 'Hitta bil' || active === 'Köp bil';

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

        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          {/* Köp bil med hjälp */}
          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, '', '/kop-bil');
              window.dispatchEvent(new PopStateEvent('popstate'));
              onClose();
            }}
            className={`w-full text-left px-4 py-4 rounded-lg text-[20px] tracking-tight transition font-medium ${
              isKopBilActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            Köp bil med hjälp
          </button>

          {/* Sub-links */}
          <div className="ml-4 mb-2 flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => goToKopBilSection('quiz-section', onClose)}
              className="w-full text-left px-3 py-2.5 rounded-md text-[15px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition flex items-center gap-2"
            >
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" strokeWidth={2.5} />
              Bilquiz
            </button>
            <button
              type="button"
              onClick={() => goToKopBilSection('quiz-section', onClose)}
              className="w-full text-left px-3 py-2.5 rounded-md text-[15px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition flex items-center gap-2"
            >
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" strokeWidth={2.5} />
              Hur mycket kan min insats ge mig?
            </button>
            <button
              type="button"
              onClick={() => goToKopBilSection('cars-grid', onClose)}
              className="w-full text-left px-3 py-2.5 rounded-md text-[15px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition flex items-center gap-2"
            >
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" strokeWidth={2.5} />
              Experternas val
            </button>
          </div>

          <div className="mx-2 my-2 border-t border-slate-100" />

          {/* Sälj bil */}
          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
              onClose();
            }}
            className={`w-full text-left px-4 py-4 rounded-lg text-[20px] tracking-tight transition font-medium ${
              active === 'Sälj bil' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            Sälj bil
          </button>

          {/* Om oss */}
          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, '', '/om-oss');
              window.dispatchEvent(new PopStateEvent('popstate'));
              onClose();
            }}
            className={`w-full text-left px-4 py-4 rounded-lg text-[20px] tracking-tight transition font-medium ${
              active === 'Om oss' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            Om oss
          </button>
        </nav>

        <div className="border-t border-slate-100 px-4 py-4">
          <a
            href="/logga-in"
            className="inline-flex items-center justify-center gap-2 w-full px-4 h-12 rounded-full bg-[#0e6efe] text-white text-[15px] font-semibold hover:bg-[#0a57cc] transition"
          >
            <User className="w-5 h-5" strokeWidth={2.2} />
            Mina erbjudanden
          </a>
        </div>
      </aside>
    </div>
  );
}
