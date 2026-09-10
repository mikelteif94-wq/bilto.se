import { useState, useEffect } from 'react';
import { LogOut, Menu, X } from 'lucide-react';

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}

interface PortalLayoutProps {
  navItems: NavItem[];
  identity?: string;
  identityRole?: string;
  onLogout?: () => void;
  headerAction?: React.ReactNode;
  pageTitle?: string;
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
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

  // Close sidebar when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [navItems.find((n) => n.active)?.label]);

  const initials = identity
    ? identity.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo / brand */}
      <div className={`flex items-center border-b border-white/10 shrink-0 h-14 ${compactSidebar && !isMobile ? 'justify-center px-0' : 'px-4 gap-2.5'}`}>
        <div className="w-7 h-7 rounded-lg bg-[#0e6efe] flex items-center justify-center shrink-0">
          <img src="/a_clean_graphic_logo_on_a_transparent_background.png" alt="Bilto" className="w-5 h-5 object-contain" />
        </div>
        {(!compactSidebar || isMobile) && (
          <span className="text-[15px] font-bold tracking-tight text-white">Bilto</span>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {navItems.map((item, i) => (
          <button
            key={i}
            onClick={() => { item.onClick?.(); if (isMobile) setMobileOpen(false); }}
            className={`
              w-full flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all
              ${compactSidebar && !isMobile ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
              ${item.active
                ? 'bg-[#0e6efe] text-white shadow-sm'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }
            `}
            title={compactSidebar && !isMobile ? item.label : undefined}
          >
            <span className={`shrink-0 ${item.active ? 'text-white' : 'text-slate-400'}`}>
              {item.icon}
            </span>
            {(!compactSidebar || isMobile) && (
              <span className="truncate">{item.label}</span>
            )}
            {(!compactSidebar || isMobile) && item.badge != null && item.badge > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
            {compactSidebar && !isMobile && item.badge != null && item.badge > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </nav>

      {/* User / logout */}
      <div className={`border-t border-white/10 shrink-0 ${compactSidebar && !isMobile ? 'px-2 py-3' : 'px-4 py-3'}`}>
        {(!compactSidebar || isMobile) && identity && (
          <div className="flex items-center gap-2.5 mb-3 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#0e6efe] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">{identity}</p>
              {identityRole && <p className="text-[11px] text-slate-400 truncate">{identityRole}</p>}
            </div>
          </div>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className={`flex items-center gap-2 text-[12px] font-medium text-slate-400 hover:text-white transition-colors rounded-lg py-1.5 w-full ${compactSidebar && !isMobile ? 'justify-center' : ''}`}
            title="Logga ut"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(!compactSidebar || isMobile) && <span>Logga ut</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#f4f5f7] font-sans">
      {/* ── Desktop sidebar ── hidden on mobile */}
      <aside
        className={`
          hidden md:flex fixed inset-y-0 left-0 z-40 flex-col
          bg-[#111827] text-white
          ${compactSidebar ? 'w-[56px]' : 'w-[220px]'}
        `}
      >
        {sidebarContent(false)}
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col w-[260px]
          bg-[#111827] text-white
          transition-transform duration-250 ease-in-out
          md:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent(true)}
      </aside>

      {/* ── Main area ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${compactSidebar ? 'md:ml-[56px]' : 'md:ml-[220px]'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-14 flex items-center px-4 sm:px-6 gap-3 shrink-0">
          {/* Hamburger – mobile only */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 transition shrink-0"
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
          {headerAction && <div className="shrink-0">{headerAction}</div>}

          {/* Identity */}
          {identity && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-[13px] font-medium text-slate-700 max-w-[160px] truncate">
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
