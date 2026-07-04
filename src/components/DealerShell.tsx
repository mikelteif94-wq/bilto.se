import { ReactNode } from 'react';
import {
  LayoutGrid, Plus, Calculator, Package, LayoutTemplate,
  Inbox, Trophy, Swords, BarChart3, Plug, User, LogOut,
  ClipboardCheck,
} from 'lucide-react';

export type DealerPage =
  | 'dashboard' | 'ny' | 'bygg' | 'lager' | 'mallar'
  | 'leads' | 'vardering-leads' | 'motbud' | 'statistik'
  | 'integrationer' | 'profil' | 'godkannanden';

interface NavItem {
  id: DealerPage;
  label: string;
  icon: typeof LayoutGrid;
  path: string;
}

const NAV: NavItem[] = [
  { id: 'dashboard',        label: 'Kampanjer',       icon: LayoutGrid,     path: '/handlare' },
  { id: 'ny',               label: 'Ny kampanj',       icon: Plus,           path: '/handlare/ny' },
  { id: 'bygg',             label: 'Mån-byggaren',     icon: Calculator,     path: '/handlare/bygg' },
  { id: 'lager',            label: 'Lager',            icon: Package,        path: '/handlare/lager-b' },
  { id: 'mallar',           label: 'Mallar',           icon: LayoutTemplate, path: '/handlare/mallar' },
  { id: 'leads',            label: 'Leads',            icon: Inbox,          path: '/handlare/leads-b' },
  { id: 'vardering-leads',  label: 'Värdera & Vinn',   icon: Trophy,         path: '/handlare/vardering-leads' },
  { id: 'motbud',           label: 'Motbud',           icon: Swords,         path: '/handlare/motbud' },
  { id: 'godkannanden',     label: 'Godkännanden',     icon: ClipboardCheck, path: '/handlare/godkannanden' },
  { id: 'statistik',        label: 'Statistik',        icon: BarChart3,      path: '/handlare/statistik' },
  { id: 'integrationer',    label: 'Integrationer',    icon: Plug,           path: '/handlare/integrationer' },
  { id: 'profil',           label: 'Profil',           icon: User,           path: '/handlare/profil' },
];

interface DealerShellProps {
  activePage: DealerPage;
  foretagsnamn: string;
  onLoggedOut: () => void;
  children: ReactNode;
  badgeCount?: Partial<Record<DealerPage, number>>;
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

// Mobile pill nav — top 5 most used items
const MOBILE_NAV: DealerPage[] = ['dashboard', 'ny', 'leads', 'statistik', 'profil'];

export default function DealerShell({ activePage, foretagsnamn, onLoggedOut, children, badgeCount = {} }: DealerShellProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#F7F8FB' }}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className="hidden lg:flex flex-col w-60 shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{ background: '#0E1B33' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => navigate('/handlare')}
            className="flex items-center gap-1.5"
          >
            <span
              className="text-[20px] font-bold leading-none"
              style={{ fontFamily: '"Anton", "Impact", sans-serif', color: 'white' }}
            >
              bil
            </span>
            <span
              className="text-[20px] font-bold leading-none px-1 py-0.5 rounded"
              style={{ fontFamily: '"Anton", "Impact", sans-serif', background: '#FFD500', color: '#0E1B33' }}
            >
              spara
            </span>
          </button>
          <p className="mt-2 text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {foretagsnamn}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(item => {
            const active = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left"
                style={{
                  background: active ? 'rgba(255,213,0,0.12)' : 'transparent',
                  color: active ? '#FFD500' : 'rgba(255,255,255,0.55)',
                  borderLeft: active ? '3px solid #FFD500' : '3px solid transparent',
                  fontFamily: '"Signika", ui-sans-serif, system-ui',
                }}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
                {item.label}
                {item.id === 'ny' && (
                  <span
                    className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                    style={{ background: '#00A85A', color: 'white' }}
                  >
                    NY
                  </span>
                )}
                {(badgeCount[item.id] ?? 0) > 0 && item.id !== 'ny' && (
                  <span
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: active ? 'rgba(255,255,255,0.2)' : '#FEF3C7', color: active ? 'white' : '#D97706' }}
                  >
                    {badgeCount[item.id]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={onLoggedOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left"
            style={{ color: 'rgba(255,255,255,0.35)', fontFamily: '"Signika", ui-sans-serif' }}
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={2} />
            Logga ut
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header
          className="lg:hidden sticky top-0 z-30 w-full"
          style={{ background: '#0E1B33', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="px-4 h-14 flex items-center justify-between">
            <button onClick={() => navigate('/handlare')} className="flex items-center gap-1">
              <span style={{ fontFamily: '"Anton", "Impact", sans-serif', color: 'white', fontSize: 18 }}>bil</span>
              <span style={{ fontFamily: '"Anton", "Impact", sans-serif', background: '#FFD500', color: '#0E1B33', fontSize: 18, padding: '1px 5px', borderRadius: 4 }}>spara</span>
            </button>
            <button
              type="button"
              onClick={onLoggedOut}
              className="text-[12px] font-semibold px-3 h-8 rounded-full"
              style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Logga ut
            </button>
          </div>

          {/* Pill nav */}
          <div className="px-3 pb-3 flex gap-1 overflow-x-auto scrollbar-none">
            {NAV.filter(n => MOBILE_NAV.includes(n.id)).map(item => {
              const active = activePage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-bold transition-all"
                  style={{
                    background: active ? '#FFD500' : 'rgba(255,255,255,0.08)',
                    color: active ? '#0E1B33' : 'rgba(255,255,255,0.55)',
                    fontFamily: '"Signika", ui-sans-serif',
                  }}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 sm:p-7 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
