import { ReactNode } from 'react';
import {
  LayoutDashboard, Package, FileText, ClipboardList,
  Star, CheckSquare, Users, LogOut,
} from 'lucide-react';
import type { StaffUser } from '../hooks/useStaffAuth';

export type StaffPage =
  | 'overview' | 'pool' | 'deals' | 'deal-detail'
  | 'valuations' | 'tasks' | 'users';

interface NavItem {
  id: StaffPage;
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  roles?: StaffUser['role'][];
}

const NAV: NavItem[] = [
  { id: 'overview',   label: 'Översikt',       icon: LayoutDashboard, path: '/staff/oversikt' },
  { id: 'pool',       label: 'Nätverkslager',  icon: Package,         path: '/staff/lager' },
  { id: 'deals',      label: 'Affärer',        icon: FileText,        path: '/staff/affarer' },
  { id: 'valuations', label: 'Värderingar',    icon: Star,            path: '/staff/varderingar' },
  { id: 'tasks',      label: 'Uppgifter',      icon: CheckSquare,     path: '/staff/uppgifter' },
  { id: 'users',      label: 'Personal',       icon: Users,           path: '/staff/anvandare',
    roles: ['teamlead'] },
];

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

interface StaffShellProps {
  activePage: StaffPage;
  staffUser: StaffUser;
  onLoggedOut: () => void;
  children: ReactNode;
  badgeCount?: Partial<Record<StaffPage, number>>;
}

const MOBILE_NAV: StaffPage[] = ['overview', 'pool', 'deals', 'tasks'];

export default function StaffShell({ activePage, staffUser, onLoggedOut, children, badgeCount = {} }: StaffShellProps) {
  const visibleNav = NAV.filter(
    item => !item.roles || item.roles.includes(staffUser.role)
  );

  const roleLabel: Record<StaffUser['role'], string> = {
    salesperson: 'Säljare',
    valuator: 'Värderare',
    teamlead: 'Teamledare',
    delivery_coordinator: 'Leveranskoordinator',
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#F2F4F8' }}>

      {/* DESKTOP SIDEBAR */}
      <aside
        className="hidden lg:flex flex-col w-60 shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{ background: '#0A1628' }}
      >
        <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <span
              className="text-[18px] font-bold leading-none"
              style={{ fontFamily: '"Anton","Impact",sans-serif', color: 'white' }}
            >
              Bytesavdelningen
            </span>
          </div>
          <p className="mt-2 text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {staffUser.fornamn} {staffUser.efternamn} · {roleLabel[staffUser.role]}
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {visibleNav.map(item => {
            const active = activePage === item.id;
            const Icon = item.icon;
            const badge = badgeCount[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left"
                style={{
                  background: active ? 'rgba(0,168,90,0.15)' : 'transparent',
                  color: active ? '#00A85A' : 'rgba(255,255,255,0.55)',
                  borderLeft: active ? '3px solid #00A85A' : '3px solid transparent',
                }}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span className="flex-1">{item.label}</span>
                {badge != null && badge > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                    style={{ background: '#E53E3E', color: 'white' }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <button
            type="button"
            onClick={onLoggedOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={2} />
            Logga ut
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header
          className="lg:hidden sticky top-0 z-30 w-full"
          style={{ background: '#0A1628', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="px-4 h-14 flex items-center justify-between">
            <span style={{ fontFamily: '"Anton","Impact",sans-serif', color: 'white', fontSize: 16 }}>
              Bytesavdelningen
            </span>
            <button
              type="button"
              onClick={onLoggedOut}
              className="text-[12px] font-semibold px-3 h-8 rounded-full"
              style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Logga ut
            </button>
          </div>
          <div className="px-3 pb-3 flex gap-1 overflow-x-auto scrollbar-none">
            {visibleNav.filter(n => MOBILE_NAV.includes(n.id)).map(item => {
              const active = activePage === item.id;
              const Icon = item.icon;
              const badge = badgeCount[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-bold transition-all relative"
                  style={{
                    background: active ? '#00A85A' : 'rgba(255,255,255,0.08)',
                    color: active ? 'white' : 'rgba(255,255,255,0.55)',
                  }}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  {item.label}
                  {badge != null && badge > 0 && (
                    <span
                      className="absolute -top-1 -right-1 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: '#E53E3E', color: 'white' }}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-7 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
