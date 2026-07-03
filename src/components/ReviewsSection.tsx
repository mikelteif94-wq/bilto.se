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
  const bg = variant === 'muted' ? 'bg-[#faf8f5]' : 'bg-white';
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
          <h2 className="text-[28px] sm:text-[40px] font-semibold text-slate-900 tracking-tight">
            Vad våra kunder säger
          </h2>
          <p className="mt-4 text-[16px] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Vi är en ny tjänst byggd för transparens – och vi samlar löpande in omdömen från de kunder vi hjälper.
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
                  <div className="text-[12px] text-slate-500">
                    Kund
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
                    <div className="text-[12px] text-slate-500">
                      Kund
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
