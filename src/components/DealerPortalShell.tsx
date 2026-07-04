import { ReactNode, useState } from 'react';
import { Bell, Package, FileText, BarChart2, Settings, LogOut } from 'lucide-react';

export type DealerPortalPage = 'atgarder' | 'arenden' | 'mitt-lager' | 'ekonomi' | 'provisioner';

interface NavItem {
  id: DealerPortalPage;
  label: string;
  icon: typeof Bell;
  path: string;
}

const NAV: NavItem[] = [
  { id: 'atgarder',   label: 'Åtgärder',   icon: Bell,     path: '/handlare/atgarder' },
  { id: 'arenden',    label: 'Ärenden',     icon: FileText, path: '/handlare/arenden' },
  { id: 'mitt-lager', label: 'Mitt lager',  icon: Package,  path: '/handlare/mitt-lager' },
  { id: 'ekonomi',    label: 'Ekonomi',     icon: BarChart2, path: '/handlare/ekonomi' },
  { id: 'provisioner',label: 'Provisioner', icon: Settings, path: '/handlare/provisioner' },
];

interface Props {
  activePage: DealerPortalPage;
  foretagsnamn: string;
  onLoggedOut: () => void;
  children: ReactNode;
  badgeCount?: number;
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export { navigate as dealerNavigate };

export default function DealerPortalShell({ activePage, foretagsnamn, onLoggedOut, children, badgeCount = 0 }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: '#F7F6F3', fontFamily: 'Inter, sans-serif' }}>
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-52 shrink-0 sticky top-0 h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E5E4E0' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E4E0' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: '#0F6E56' }}>
              <span className="text-white text-[11px] font-bold">B</span>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium truncate" style={{ color: '#1C1C1A' }}>Bytesmotorn</div>
              <div className="text-[11px] truncate" style={{ color: '#6E6D68' }}>{foretagsnamn}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map(item => {
            const active = activePage === item.id;
            const Icon = item.icon;
            const showBadge = item.id === 'atgarder' && badgeCount > 0;
            return (
              <button
                key={item.id}
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
                {showBadge && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center" style={{ background: '#FCEBEB', color: '#791F1F' }}>{badgeCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t" style={{ borderColor: '#E5E4E0' }}>
          <button onClick={onLoggedOut} className="flex items-center gap-2 text-[13px]" style={{ color: '#6E6D68' }}>
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            Logga ut
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile nav */}
        <div className="lg:hidden flex gap-1 px-3 py-2 overflow-x-auto" style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E4E0' }}>
          {NAV.map(item => {
            const active = activePage === item.id;
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => navigate(item.path)}
                className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px]"
                style={{ background: active ? '#EEF7F4' : 'transparent', color: active ? '#0F6E56' : '#6E6D68', fontWeight: active ? 500 : 400 }}>
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
          <button onClick={onLoggedOut} className="shrink-0 ml-auto flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px]" style={{ color: '#6E6D68' }}>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        <main className="flex-1 p-5 sm:p-6 lg:p-7">
          {children}
        </main>
      </div>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 lg:hidden" style={{ background: 'rgba(0,0,0,0.3)' }} />}
    </div>
  );
}
