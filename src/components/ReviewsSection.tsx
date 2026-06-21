import { useEffect, useRef, useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

type Review = {
  name: string;
  text: string;
  initial: string;
  color: string;
};

const REVIEWS: Review[] = [
  {
    name: 'Nina Zehra',
    initial: 'N',
    color: 'bg-rose-500',
    text: 'Fick hjälp med mitt bilköp och är så tacksam för all support! Jag sparade 22 000 kr och hela processen var super smidig. Kan verkligen rekommendera detta starkt.',
  },
  {
    name: 'Zana Yousefi',
    initial: 'Z',
    color: 'bg-amber-500',
    text: 'De hjälpte mig att smidigt och professionellt genomföra mitt bilköp och förhandling. Eftersom jag inte hade så mycket kunskap om de aktuella bilmodellerna gav de mig värdefull vägledning.',
  },
  {
    name: 'Jako Keric',
    initial: 'J',
    color: 'bg-emerald-500',
    text: 'Det löste hela processen! De hjälpte mig hitta rätt bil, bytte min gamla bil och förhandlade samt inspekterade den nya åt mig. Allt gick snabbt, smidigt och professionellt!',
  },
  {
    name: 'Andreas',
    initial: 'A',
    color: 'bg-sky-500',
    text: 'Tack! Älskade att slippa förhandling och stress! Älskar min nya Porsche. Rekommenderas starkt!',
  },
  {
    name: 'M.',
    initial: 'M',
    color: 'bg-teal-500',
    text: 'Oerhört proffsiga från start till slut. De hittade helt rätt bil och löste en jättebra affär för mig. Kan varmt rekommendera.',
  },
  {
    name: 'Billy',
    initial: 'B',
    color: 'bg-blue-500',
    text: 'Jag rekommenderar starkt! Har fått det stöd jag behöver med inflationen och de höga räntekostnaderna.',
  },
  {
    name: 'Felix Hammarström',
    initial: 'F',
    color: 'bg-orange-500',
    text: 'Tack för bra service och svar och grymt bemötande – fick verkligen hjälp med allt.',
  },
  {
    name: 'Michael Pena',
    initial: 'M',
    color: 'bg-cyan-500',
    text: 'Fixade bättre pris och vinterhjul helt gratis! Tusen tack amigos!',
  },
];

interface Props {
  variant?: 'light' | 'muted';
}

export default function ReviewsSection({ variant = 'light' }: Props) {
  const bg = variant === 'muted' ? 'bg-slate-50' : 'bg-white';
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const scrollToIdx = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const children = Array.from(el.children) as HTMLElement[];
      const center = el.scrollLeft + el.clientWidth / 2;
      let closest = 0;
      let min = Infinity;
      children.forEach((c, i) => {
        const mid = c.offsetLeft - el.offsetLeft + c.clientWidth / 2;
        const d = Math.abs(mid - center);
        if (d < min) {
          min = d;
          closest = i;
        }
      });
      setActiveIdx(closest);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className={`${bg} md:border-t md:border-slate-100 py-20 sm:py-24 px-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 text-amber-500" fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <span className="text-[14px] font-semibold text-slate-700">4,9 / 5</span>
            <span className="text-[13px] text-slate-500">på Google</span>
          </div>
          <h2 className="text-[28px] sm:text-[40px] font-semibold text-slate-900 tracking-tight">
            Våra kunder berättar
          </h2>
          <p className="mt-4 text-[16px] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Tusentals svenskar har redan sålt och köpt bil tryggare genom oss. Här är några av deras röster.
          </p>
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {REVIEWS.map((r, idx) => (
            <article
              key={idx}
              className="relative bg-white rounded-xl border border-slate-200/70 p-6 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_30px_-10px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Quote className="absolute top-5 right-5 w-6 h-6 text-slate-200" strokeWidth={2} />
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-500" fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <p className="text-[15px] text-slate-700 leading-[1.6] mb-6">
                {r.text}
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className={`w-10 h-10 rounded-xl ${r.color} text-white flex items-center justify-center font-semibold text-[15px]`}>
                  {r.initial}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-slate-900 truncate">{r.name}</div>
                  <div className="text-[12px] text-slate-500 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                    </svg>
                    Recension från Google
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="sm:hidden -mx-6">
          <div
            ref={scrollerRef}
            style={{ touchAction: 'pan-y' }}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-4 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {REVIEWS.map((r, idx) => (
              <article
                key={idx}
                className="relative bg-white rounded-xl border border-slate-200/70 p-6 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)] shrink-0 w-[85%] snap-center"
              >
                <Quote className="absolute top-5 right-5 w-6 h-6 text-slate-200" strokeWidth={2} />
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-500" fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <p className="text-[15px] text-slate-700 leading-[1.6] mb-6">
                  {r.text}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className={`w-10 h-10 rounded-xl ${r.color} text-white flex items-center justify-center font-semibold text-[15px]`}>
                    {r.initial}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-slate-900 truncate">{r.name}</div>
                    <div className="text-[12px] text-slate-500 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                      </svg>
                      Recension från Google
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between px-6 mt-4">
            <button
              type="button"
              onClick={() => scrollToIdx(Math.max(0, activeIdx - 1))}
              aria-label="Föregående recension"
              className="w-10 h-10 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-700 active:scale-95 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              {REVIEWS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToIdx(i)}
                  aria-label={`Gå till recension ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === activeIdx ? 'w-6 bg-slate-900' : 'w-1.5 bg-slate-300'}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollToIdx(Math.min(REVIEWS.length - 1, activeIdx + 1))}
              aria-label="Nästa recension"
              className="w-10 h-10 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-700 active:scale-95 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
