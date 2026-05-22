import { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}

interface PortalLayoutProps {
  /** Sidebar nav items */
  navItems: NavItem[];
  /** Top-right info — company name / user name */
  identity?: string;
  /** Small subtitle under identity */
  identityRole?: string;
  /** Callback for logout button */
  onLogout?: () => void;
  /** Optional extra action button in header (e.g. "Få bud") */
  headerAction?: React.ReactNode;
  /** Page title shown in the main content header bar */
  pageTitle?: string;
  /** Breadcrumb path e.g. "Bilar / ABC123" */
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
  /** Whether to show a narrow icon-only sidebar (default false = full) */
  compactSidebar?: boolean;
}

export default function PortalLayout({
  navItems,
  identity,
  identityRole,
  onLogout,
  headerAction,
  pageTitle,
  breadcrumb,
  children,
  compactSidebar = false,
}: PortalLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = identity
    ? identity.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="min-h-screen flex bg-[#f4f5f7] font-sans">
      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col
          bg-[#111827] text-white
          transition-transform duration-200
          ${compactSidebar ? 'w-[56px]' : 'w-[220px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo / brand */}
        <div className={`flex items-center gap-2.5 border-b border-white/10 shrink-0 ${compactSidebar ? 'h-14 justify-center px-0' : 'h-14 px-4'}`}>
          <div className="w-7 h-7 rounded-lg bg-[#0e6efe] flex items-center justify-center shrink-0">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="w-5 h-5 object-contain"
            />
          </div>
          {!compactSidebar && (
            <span className="text-[15px] font-bold tracking-tight text-white">Bilto</span>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {navItems.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick?.();
                setMobileOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all
                ${compactSidebar ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
                ${item.active
                  ? 'bg-[#0e6efe] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }
              `}
              title={compactSidebar ? item.label : undefined}
            >
              <span className={`shrink-0 ${item.active ? 'text-white' : 'text-slate-400'}`}>
                {item.icon}
              </span>
              {!compactSidebar && (
                <span className="truncate">{item.label}</span>
              )}
              {!compactSidebar && item.badge != null && item.badge > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              {compactSidebar && item.badge != null && item.badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </nav>

        {/* User / logout at bottom */}
        <div className={`border-t border-white/10 shrink-0 ${compactSidebar ? 'px-2 py-3' : 'px-4 py-3'}`}>
          {!compactSidebar && identity && (
            <div className="flex items-center gap-2.5 mb-3 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#0e6efe] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-white truncate">{identity}</p>
                {identityRole && (
                  <p className="text-[11px] text-slate-400 truncate">{identityRole}</p>
                )}
              </div>
            </div>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className={`
                flex items-center gap-2 text-[12px] font-medium text-slate-400
                hover:text-white transition-colors rounded-lg py-1.5
                ${compactSidebar ? 'justify-center w-full' : 'w-full'}
              `}
              title="Logga ut"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!compactSidebar && <span>Logga ut</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Main area ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${compactSidebar ? 'lg:ml-[56px]' : 'lg:ml-[220px]'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-14 flex items-center px-4 sm:px-6 gap-3 shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-900 mr-1"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb / title */}
          <div className="flex-1 min-w-0">
            {breadcrumb ? (
              <div className="text-[13px] text-slate-500">{breadcrumb}</div>
            ) : pageTitle ? (
              <h1 className="text-[15px] font-semibold text-slate-900 truncate">{pageTitle}</h1>
            ) : null}
          </div>

          {/* Header action */}
          {headerAction && (
            <div className="shrink-0">{headerAction}</div>
          )}

          {/* Identity (desktop) */}
          {identity && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                {initials}
              </div>
              <span className="text-[13px] font-medium text-slate-700 max-w-[160px] truncate">
                {identity}
              </span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
