import { ReactNode, useEffect, useState } from 'react';
import {
  FileText, Star, Package, ThumbsUp, TrendingUp, Settings, LogOut, Search,
} from 'lucide-react';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

export type StaffPage =
  | 'overview' | 'pool' | 'deals' | 'deal-detail'
  | 'valuations' | 'tasks' | 'users' | 'approvals';

interface NavItem {
  id: StaffPage;
  label: string;
  icon: typeof FileText;
  path: string;
  roles?: StaffUser['role'][];
}

const NAV: NavItem[] = [
  { id: 'deals',      label: 'Ärenden',      icon: FileText,   path: '/staff/affarer' },
  { id: 'valuations', label: 'Värderingar',  icon: Star,       path: '/staff/varderingar' },
  { id: 'pool',       label: 'Handlarpool',  icon: Package,    path: '/staff/lager' },
  { id: 'approvals',  label: 'Godkännanden', icon: ThumbsUp,   path: '/staff/affarer' },
  { id: 'tasks',      label: 'Ekonomi',      icon: TrendingUp, path: '/staff/uppgifter' },
  { id: 'users',      label: 'Inställningar',icon: Settings,   path: '/staff/anvandare', roles: ['teamlead'] },
];

export function navigate(path: string) {
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

const MOBILE_NAV: StaffPage[] = ['deals', 'pool', 'valuations', 'tasks'];

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

  const initials = (staffUser.fornamn[0] ?? '') + (staffUser.efternamn[0] ?? '');

  return (
    <div className="min-h-screen flex" style={{ background: '#F7F6F3', fontFamily: 'Inter, sans-serif' }}>

      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-52 shrink-0 sticky top-0 h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E5E4E0' }}>
        {/* Logo */}
        <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E4E0' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: '#0F6E56' }}>
              <span className="text-white text-[11px] font-bold">B</span>
            </div>
            <span className="text-[15px] font-medium" style={{ color: '#1C1C1A' }}>Bytesmotorn</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map(item => {
            const active = activePage === item.id;
            const Icon = item.icon;
            const badge = badgeCount[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] transition-all text-left"
                style={{
                  background: active ? '#EEF7F4' : 'transparent',
                  color: active ? '#0F6E56' : '#6E6D68',
                  fontWeight: active ? 500 : 400,
                }}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2 : 1.75} />
                <span className="flex-1">{item.label}</span>
                {badge != null && badge > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center" style={{ background: '#FCEBEB', color: '#791F1F' }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Stats */}
        <div className="px-4 py-3 border-t" style={{ borderColor: '#E5E4E0' }}>
          <div className="text-[11px] font-medium mb-2" style={{ color: '#6E6D68' }}>Mina siffror</div>
          {([
            ['Sålda', myStats.solda],
            ['Väntar på avslut', myStats.vantar],
            ['Levererade', myStats.levererade],
          ] as [string, number][]).map(([label, val]) => (
            <div key={label} className="flex items-center justify-between py-0.5">
              <span className="text-[12px]" style={{ color: '#6E6D68' }}>{label}</span>
              <span className="text-[12px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* User */}
        <div className="px-4 py-3 border-t" style={{ borderColor: '#E5E4E0' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0" style={{ background: '#EEF7F4', color: '#0F6E56' }}>
              {initials || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium truncate" style={{ color: '#1C1C1A' }}>{staffUser.fornamn} {staffUser.efternamn}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLoggedOut}
            className="flex items-center gap-2 text-[13px] transition-all"
            style={{ color: '#6E6D68' }}
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            Logga ut
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global search bar */}
        <header className="sticky top-0 z-20 flex items-center gap-4 px-6" style={{ height: 52, background: '#FFFFFF', borderBottom: '1px solid #E5E4E0' }}>
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6E6D68' }} />
            <input
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && globalSearch.trim()) navigate('/staff/affarer'); }}
              placeholder="Sök regnummer, kund eller ärende..."
              className="w-full h-9 pl-9 pr-4 rounded-lg text-[14px] focus:outline-none transition"
              style={{ border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A' }}
            />
          </div>
          {/* Mobile: show name */}
          <div className="lg:hidden flex items-center gap-2">
            <span className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{staffUser.fornamn}</span>
            <button onClick={onLoggedOut} className="text-[12px] px-3 h-7 rounded-lg" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>Logga ut</button>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="lg:hidden flex gap-1 px-3 py-2 overflow-x-auto scrollbar-none" style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E4E0' }}>
          {visibleNav.filter(n => MOBILE_NAV.includes(n.id)).map(item => {
            const active = activePage === item.id;
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={() => navigate(item.path)}
                className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] transition-all"
                style={{ background: active ? '#EEF7F4' : 'transparent', color: active ? '#0F6E56' : '#6E6D68', fontWeight: active ? 500 : 400 }}>
                <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                {item.label}
              </button>
            );
          })}
        </div>

        <main className="flex-1 p-5 sm:p-6 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
