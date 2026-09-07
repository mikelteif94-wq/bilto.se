interface NavigationProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'sell' | 'dealer') => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      background: 'linear-gradient(180deg, #0a57cc 0%, #0e6efe 100%)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(10,87,204,0.28)',
    }}>
      {/* Accent line top */}
      <div className="h-[2px] w-full" style={{
        background: 'linear-gradient(90deg, rgba(251,191,36,0.7) 0%, rgba(255,255,255,0.4) 40%, rgba(56,189,248,0.6) 100%)',
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => onNavigate('home')}
          aria-label="Bilto startsida"
        >
          <img
            src="/a_clean_graphic_logo_on_a_transparent_background.png"
            alt="Bilto"
            className="h-16 lg:h-24 w-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        <div className="flex items-center gap-2">
          {currentPage === 'home' && (
            <button
              onClick={() => onNavigate('home')}
              className="px-4 py-2 text-white/80 text-[14px] font-medium hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              Start
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
