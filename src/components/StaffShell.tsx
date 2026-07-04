import { ReactNode, useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, FileText, Star,
  Users, LogOut, Search, ThumbsUp,
  TrendingUp,
} from 'lucide-react';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

export type StaffPage =
  | 'overview' | 'pool' | 'deals' | 'deal-detail'
  | 'valuations' | 'tasks' | 'users' | 'approvals';

interface NavItem {
  id: StaffPage;
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  roles?: StaffUser['role'][];
}

const NAV: NavItem[] = [
  { id: 'overview',   label: 'Översikt',     icon: LayoutDashboard, path: '/staff/oversikt' },
  { id: 'deals',      label: 'Ärenden',      icon: FileText,        path: '/staff/affarer' },
  { id: 'valuations', label: 'Värderingar',  icon: Star,            path: '/staff/varderingar' },
  { id: 'pool',       label: 'Handlarpool',  icon: Package,         path: '/staff/lager' },
  { id: 'approvals',  label: 'Godkännanden', icon: ThumbsUp,        path: '/staff/affarer' },
  { id: 'tasks',      label: 'Min intjäning',icon: TrendingUp,      path: '/staff/uppgifter' },
  { id: 'users',      label: 'Säljare',      icon: Users,           path: '/staff/anvandare', roles: ['teamlead'] },
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
  const visibleNav = NAV.filter(item => !item.roles || item.roles.includes(staffUser.role));
  const [globalSearch, setGlobalSearch] = useState('');
  const [myStats, setMyStats] = useState({ solda: 0, vantar: 0, levererade: 0 });

  useEffect(() => {
    if (staffUser.id === 'local') return;
    (async () => {
      const [openRes, wonRes] = await Promise.all([
        supabase.from('deals').select('id, status').eq('assigned_staff_user_id', staffUser.id).not('status', 'in', '(handed_over,cancelled,rejected)'),
        supabase.from('deals').select('id').eq('assigned_staff_user_id', staffUser.id).eq('status', 'handed_over'),
      ]);
      const open = openRes.data ?? [];
      const won = wonRes.data ?? [];
      setMyStats({
        solda: won.length,
        vantar: open.filter(d => d.status === 'sent_for_approval').length,
        levererade: open.filter(d => ['reserved', 'deposit_paid'].includes(d.status)).length,
      });
    })();
  }, [staffUser.id]);

  const roleLabel: Record<StaffUser['role'], string> = {
    salesperson: 'Säljare',
    valuator: 'Värderare',
    teamlead: 'Admin',
    delivery_coordinator: 'Leveranskoord.',
  };

  const initials = (staffUser.fornamn[0] ?? '') + (staffUser.efternamn[0] ?? '');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#F2F4F8' }}>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen overflow-y-auto" style={{ background: '#0F1B2D' }}>
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#00A85A' }}>
              <span className="text-white text-xs font-black">B</span>
            </div>
            <span className="text-[15px] font-bold text-white">Bytesmotorn</span>
          </div>
        </div>

        {/* Nav */}
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
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left"
                style={{
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: active ? 'white' : 'rgba(255,255,255,0.5)',
                }}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span className="flex-1">{item.label}</span>
                {badge != null && badge > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center" style={{ background: '#E53E3E', color: 'white' }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* My stats */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>MINA SIFFROR</div>
          <div className="space-y-1.5">
            {([
              ['Mina sålda', myStats.solda],
              ['Väntar på avslut', myStats.vantar],
              ['Mina levererade', myStats.levererade],
            ] as [string, number][]).map(([label, val]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: '#00A85A', color: 'white' }}>
              {initials || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-white truncate">{staffUser.fornamn} {staffUser.efternamn}</div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{roleLabel[staffUser.role]}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLoggedOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            Logga ut
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top search bar */}
        <header className="hidden lg:flex sticky top-0 z-20 items-center gap-4 px-6 h-13 bg-white border-b border-slate-200" style={{ height: 52 }}>
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && globalSearch.trim()) navigate('/staff/affarer'); }}
              placeholder="Sök regnummer, kund eller ärende..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition"
            />
          </div>
        </header>

        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 w-full" style={{ background: '#0F1B2D', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-4 h-12 flex items-center justify-between">
            <span className="text-sm font-bold text-white">Bytesmotorn</span>
            <button type="button" onClick={onLoggedOut} className="text-[11px] font-semibold px-3 h-7 rounded-full" style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}>
              Logga ut
            </button>
          </div>
          <div className="px-3 pb-2 flex gap-1 overflow-x-auto scrollbar-none">
            {visibleNav.filter(n => MOBILE_NAV.includes(n.id)).map(item => {
              const active = activePage === item.id;
              const Icon = item.icon;
              const badge = badgeCount[item.id];
              return (
                <button key={item.id} type="button" onClick={() => navigate(item.path)}
                  className="shrink-0 flex items-center gap-1.5 px-3 h-7 rounded-full text-[11px] font-bold transition-all relative"
                  style={{ background: active ? '#00A85A' : 'rgba(255,255,255,0.08)', color: active ? 'white' : 'rgba(255,255,255,0.55)' }}>
                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  {item.label}
                  {badge != null && badge > 0 && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#E53E3E', color: 'white' }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-6 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
