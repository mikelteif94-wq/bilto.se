import { type ReactNode, useState } from 'react';
import { Menu, X, Scale, ArrowRight } from 'lucide-react';

interface ForhandlaLayoutProps {
  children: ReactNode;
  onNavigate: (path: string) => void;
  onOpenConsultation: () => void;
  activePath: string;
}

const NAV_LINKS = [
  { label: 'Sälj bil', path: '/salj' },
  { label: 'Köp bil', path: '/kop-bil' },
  { label: 'Förhandlare', path: '/forhandlare' },
  { label: 'Priser', path: '/priser' },
];

export default function ForhandlaLayout({
  children,
  onNavigate,
  onOpenConsultation,
  activePath,
}: ForhandlaLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (path: string) => {
    setMobileOpen(false);
    onNavigate(path);
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] font-forhandla text-[#17281f]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#faf7f2]/85 backdrop-blur-md border-b border-[#e8e2d6]">
        <div className="fh-max fh-section-pad h-16 flex items-center justify-between">
          <button
            onClick={() => go('/')}
            className="flex items-center gap-2.5 group"
            aria-label="Förhandla – hem"
          >
            <span className="w-9 h-9 rounded-2xl bg-[#0e6b45] flex items-center justify-center shadow-sm">
              <Scale className="w-5 h-5 text-white" strokeWidth={2.2} />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-[#17281f]">
              Förhandla
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <button
                key={l.path}
                onClick={() => go(l.path)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activePath === l.path
                    ? 'text-[#0e6b45] bg-[#0e6b45]/8'
                    : 'text-[#5a6b62] hover:text-[#17281f] hover:bg-[#f1ece1]'
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onOpenConsultation}
              className="fh-btn !px-5 !py-2.5 !text-sm"
            >
              Gratis konsultation
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f1ece1] transition"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Meny"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#e8e2d6] bg-[#faf7f2] px-5 py-4 space-y-1">
            {NAV_LINKS.map((l) => (
              <button
                key={l.path}
                onClick={() => go(l.path)}
                className={`block w-full text-left px-4 py-3 rounded-2xl text-base font-medium transition ${
                  activePath === l.path
                    ? 'text-[#0e6b45] bg-[#0e6b45]/8'
                    : 'text-[#17281f] hover:bg-[#f1ece1]'
                }`}
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenConsultation();
              }}
              className="fh-btn w-full mt-2"
            >
              Gratis konsultation
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-[#e8e2d6] bg-[#f3eee4] mt-16">
        <div className="fh-max fh-section-pad py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-8 h-8 rounded-xl bg-[#0e6b45] flex items-center justify-center">
                  <Scale className="w-4 h-4 text-white" strokeWidth={2.2} />
                </span>
                <span className="font-display text-lg font-semibold">Förhandla</span>
              </div>
              <p className="text-sm text-[#5a6b62] leading-relaxed">
 Sveriges certifierade bilförhandlare. På din sida av bordet.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9aa89e] mb-3">Tjänster</p>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => go('/salj')} className="text-[#5a6b62] hover:text-[#0e6b45] transition">Sälj bil</button></li>
                <li><button onClick={() => go('/kop-bil')} className="text-[#5a6b62] hover:text-[#0e6b45] transition">Köp bil</button></li>
                <li><button onClick={() => go('/forhandlare')} className="text-[#5a6b62] hover:text-[#0e6b45] transition">Förhandlare</button></li>
                <li><button onClick={() => go('/priser')} className="text-[#5a6b62] hover:text-[#0e6b45] transition">Priser</button></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9aa89e] mb-3">Företaget</p>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => go('/om-oss')} className="text-[#5a6b62] hover:text-[#0e6b45] transition">Om oss</button></li>
                <li><button onClick={() => go('/anvandarvillkor')} className="text-[#5a6b62] hover:text-[#0e6b45] transition">Villkor</button></li>
                <li><button onClick={() => go('/integritetspolicy')} className="text-[#5a6b62] hover:text-[#0e6b45] transition">Integritet</button></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9aa89e] mb-3">Kom igång</p>
              <button onClick={onOpenConsultation} className="fh-btn w-full !py-2.5 !text-sm">
                Boka konsultation
              </button>
            </div>
          </div>

          <div className="fh-divider my-8" />
          <p className="text-xs text-[#9aa89e]">
            © {new Date().getFullYear()} Förhandla. Vi representerar alltid kunden — aldrig handlaren.
          </p>
        </div>
      </footer>
    </div>
  );
}
