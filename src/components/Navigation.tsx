interface NavigationProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'sell' | 'dealer') => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e6efe] border-b border-[#0a57cc]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate('home')}
        >
          <img
            src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
            alt="Bilto"
            className="h-20 lg:h-32 w-auto object-contain"
          />
        </div>

        <div className="flex gap-4">
          {currentPage === 'home' && (
            <>
              <button
                onClick={() => onNavigate('home')}
                className="px-4 py-2 text-slate-700 font-medium hover:text-amber-600 transition"
              >
                Start
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
