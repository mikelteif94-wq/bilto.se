import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Camera, Check } from 'lucide-react';

interface PhotoGuideModalProps {
  open: boolean;
  onClose: () => void;
}

interface GuideView {
  id: string;
  title: string;
  description: string;
  tip: string;
  image: string;
}

const VIEWS: GuideView[] = [
  {
    id: 'front-quarter',
    title: 'Framifrån snett (3/4-vy)',
    description:
      'Stå snett framför bilen – ungefär 45 grader från förarsidan. Hela bilen ska synas.',
    tip: 'Detta är huvudbilden. Håll kameran i höfthöjd och låt bilen fylla cirka 70% av bildytan.',
    image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    id: 'side',
    title: 'Sidovy',
    description:
      'Stå rakt mot förarsidan så hela bilen syns från sida – från front till bakparti.',
    tip: 'Håll kameran parallellt med bilen. Visa hela hjulbasen.',
    image: 'https://images.pexels.com/photos/707046/pexels-photo-707046.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    id: 'rear-quarter',
    title: 'Bakifrån snett (3/4-vy)',
    description:
      'Snett bakom bilen – visa baklucka och passagerarsida samtidigt.',
    tip: 'Se till att registreringsskylten syns tydligt och att bakljusen är hela.',
    image: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    id: 'interior',
    title: 'Interiör – förarplats',
    description:
      'Öppna förardörren och fota in mot ratten, instrumentpanel och framsäten.',
    tip: 'Naturligt ljus är bäst. Undvik blixt direkt på skärmen.',
    image: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    id: 'wheel',
    title: 'Fälg och däck',
    description:
      'Närbild på en framfälg – visa fälg, däckmönster och bromsskiva.',
    tip: 'Gå nära och fota rakt mot fälgen. Skarpt fokus är viktigt.',
    image: 'https://images.pexels.com/photos/244553/pexels-photo-244553.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    id: 'mileage',
    title: 'Mätarställning',
    description:
      'Fota mätarpanelen med tändning på så att miltalet syns tydligt.',
    tip: 'Håll telefonen rakt – undvik reflektioner från skärmen.',
    image: 'https://images.pexels.com/photos/1028742/pexels-photo-1028742.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
];

export default function PhotoGuideModal({ open, onClose }: PhotoGuideModalProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(VIEWS.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  if (!open) return null;

  const view = VIEWS[index];
  const isLast = index === VIEWS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Stäng"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#0e6efe]/10 text-[#0e6efe] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-tight">
                Fotoguide – så fotar du din bil
              </h2>
              <p className="text-xs text-slate-500">
                Vy {index + 1} av {VIEWS.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
            aria-label="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="relative bg-slate-100">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden">
              <img
                key={view.id}
                src={view.image}
                alt={view.title}
                className="w-full h-full object-cover animate-[fadeIn_300ms_ease-out]"
              />

              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-700 shadow-sm">
                Referensbild
              </span>

              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                aria-label="Föregående"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(VIEWS.length - 1, i + 1))}
                disabled={isLast}
                aria-label="Nästa"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-5 sm:px-7 py-5 sm:py-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0e6efe] text-white text-[11px] font-bold">
                {index + 1}
              </span>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
                {view.title}
              </h3>
            </div>
            <p className="text-sm sm:text-[15px] text-slate-600 mt-2 leading-relaxed">
              {view.description}
            </p>
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3">
              <Check className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <p className="text-[13.5px] text-amber-900 leading-relaxed">{view.tip}</p>
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-5">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2.5">
              Välj vy
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {VIEWS.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                    i === index
                      ? 'border-[#0e6efe] ring-2 ring-[#0e6efe]/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  aria-label={v.title}
                >
                  <img
                    src={v.image}
                    alt={v.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span
                    className={`absolute bottom-0 inset-x-0 px-1.5 py-1 text-[10px] font-semibold leading-tight text-center truncate ${
                      i === index
                        ? 'bg-[#0e6efe] text-white'
                        : 'bg-white/90 text-slate-700'
                    }`}
                  >
                    {v.title.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Föregående
          </button>

          <div className="flex items-center gap-1.5">
            {VIEWS.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Gå till vy ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-[#0e6efe]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-sm font-semibold transition"
            >
              Klar
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(VIEWS.length - 1, i + 1))}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-sm font-semibold transition"
            >
              Nästa
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
