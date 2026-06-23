import { useState, useMemo } from 'react';
import {
  Phone, ChevronRight, ArrowRight, Star, TrendingUp, CheckCircle,
  Zap, Car, Search,
} from 'lucide-react';
import { useCatalogCars, CatalogCarFull } from '@/hooks/useCatalogCars';
import { SiteFooter } from '@/components/SiteFooter';
import { findComparisonCarByMakeModel } from '@/lib/comparison/lookup';
import BuyDrawer from '@/components/BuyDrawer';

interface Props {
  onBack: () => void;
  onNavigateBuy: (car?: string) => void;
  onNavigateConsultation: () => void;
}

type Category = 'alla' | 'el' | 'suv' | 'hybrid' | 'sedan' | 'budget' | 'premium';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'alla', label: 'Alla erbjudanden' },
  { id: 'el', label: 'Topp elbilar' },
  { id: 'suv', label: 'SUV' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'sedan', label: 'Sedan & Kombi' },
  { id: 'budget', label: 'Under 400 000 kr' },
  { id: 'premium', label: 'Premium & Lyx' },
];

const FEATURED = [
  {
    make: 'Tesla', model: 'Model Y',
    headline: 'Spara upp till 45\u00a0000 kr på en ny Tesla Model Y',
    description: 'Model Y är den mest eftersökta bilen i Sverige. Med Biltos förhandlingsexperter säkrar du rätt pris utan att behöva göra jobbet själv. Perfekt för familjen som vill gå electric.',
    tag: 'Elbil',
  },
  {
    make: 'Volvo', model: 'XC60',
    headline: 'Spara upp till 55\u00a0000 kr på en ny Volvo XC60',
    description: 'XC60 är en av Europas mest populära premium-SUV:ar. Bilto förhandlar fram ett pris som annars kräver månaders research och flera återbesök till återförsäljaren.',
    tag: 'Hybrid',
  },
  {
    make: 'Kia', model: 'EV9',
    headline: 'Spara upp till 75\u00a0000 kr på en ny Kia EV9',
    description: 'EV9 är en av de mest imponerande el-SUV:arna just nu. Enormt bagageutrymme, lång räckvidd och 7 säten – med rätt förhandlare kan du spara rejält.',
    tag: 'Elbil',
  },
];

function getNewPrice(car: CatalogCarFull): number | null {
  const local = findComparisonCarByMakeModel(car.make, car.model);
  if (local?.pricing.new_from_sek) return local.pricing.new_from_sek;
  return car.price_new_from ?? null;
}

function estimateSavings(price: number): number {
  const pct = price > 700000 ? 0.08 : price > 500000 ? 0.07 : price > 350000 ? 0.06 : 0.055;
  return Math.max(10000, Math.round((price * pct) / 5000) * 5000);
}

function getTag(car: CatalogCarFull): string {
  const f = car.fuel_types ?? [];
  if (f.includes('el')) return 'Elbil';
  if (f.includes('laddhybrid')) return 'Laddhybrid';
  if (f.includes('hybrid') || f.includes('mildhybrid')) return 'Hybrid';
  if (f.includes('diesel')) return 'Diesel';
  return 'Bensin';
}

function tagStyle(tag: string): string {
  switch (tag) {
    case 'Elbil': return 'bg-emerald-100 text-emerald-800';
    case 'Laddhybrid': return 'bg-sky-100 text-sky-800';
    case 'Hybrid': return 'bg-teal-100 text-teal-800';
    case 'Diesel': return 'bg-orange-100 text-orange-800';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function filterCars(cars: CatalogCarFull[], cat: Category): CatalogCarFull[] {
  const base = cars.filter(c =>
    !FEATURED.some(f =>
      c.make.toLowerCase() === f.make.toLowerCase() &&
      c.model.toLowerCase() === f.model.toLowerCase()
    )
  );
  switch (cat) {
    case 'el':
      return base.filter(c => c.fuel_types?.includes('el'));
    case 'suv':
      return base.filter(c => (c.body_type ?? '').toLowerCase() === 'suv');
    case 'hybrid':
      return base.filter(c => {
        const f = c.fuel_types ?? [];
        return f.includes('laddhybrid') || f.includes('hybrid') || f.includes('mildhybrid');
      });
    case 'sedan':
      return base.filter(c =>
        ['sedan', 'kombi', 'hatchback', 'halvkombi'].includes((c.body_type ?? '').toLowerCase())
      );
    case 'budget':
      return base.filter(c => {
        const p = getNewPrice(c);
        return p !== null && p > 0 && p < 400000;
      });
    case 'premium':
      return base.filter(c => {
        const p = getNewPrice(c);
        return p !== null && p > 600000;
      });
    default:
      return base;
  }
}

export default function NyaBilarPage({ onBack, onNavigateBuy, onNavigateConsultation }: Props) {
  const { cars, loading } = useCatalogCars();
  const [activeCategory, setActiveCategory] = useState<Category>('alla');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerCar, setDrawerCar] = useState<string | null>(null);

  const featuredCars = useMemo(() =>
    FEATURED.map(fd => ({
      ...fd,
      car: cars.find(
        c =>
          c.make.toLowerCase() === fd.make.toLowerCase() &&
          c.model.toLowerCase() === fd.model.toLowerCase()
      ),
    })),
    [cars]
  );

  const gridCars = useMemo(() => {
    let filtered = filterCars(cars, activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.make.toLowerCase().includes(q) || c.model.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [cars, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Sticky navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button onClick={onBack} className="flex-none">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-8 w-auto object-contain"
            />
          </button>
          <nav className="hidden md:flex items-center gap-5">
            {[
              { label: 'Startsida', action: onBack },
              { label: 'Köp bil', action: () => onNavigateBuy() },
              { label: 'Gratis konsultation', action: onNavigateConsultation },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="tel:+46855550200"
              className="hidden sm:flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              08-5555 0200
            </a>
            <button
              onClick={() => onNavigateBuy()}
              className="h-8 px-4 bg-black text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-colors"
            >
              Kom igång
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #060e1e 0%, #0a1628 60%, #0e1f3a 100%)' }}
      >
        {/* Blue glow */}
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(14,110,254,0.18) 0%, transparent 70%)' }}
        />
        {/* Subtle top accent line */}
        <div
          aria-hidden
          className="absolute top-0 inset-x-0 h-[2px] pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(14,110,254,0.7) 40%, rgba(56,189,248,0.5) 60%, transparent 100%)' }}
        />

        {/* Faint car imagery on sides */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-64 md:w-96 opacity-[0.07] pointer-events-none"
          style={{ maskImage: 'linear-gradient(to right, transparent 10%, black 60%, transparent 100%)' }}
        >
          <img src="/getImage_(1).webp" alt="" className="w-full h-full object-cover object-right" />
        </div>
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-64 md:w-96 opacity-[0.07] pointer-events-none"
          style={{ maskImage: 'linear-gradient(to left, transparent 10%, black 60%, transparent 100%)' }}
        >
          <img src="/getImage_(2).webp" alt="" className="w-full h-full object-cover object-left scale-x-[-1]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-widest"
            style={{ background: 'rgba(14,110,254,0.18)', border: '1px solid rgba(14,110,254,0.35)', color: '#60a5fa' }}
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            Biltos bästa erbjudanden 2025
          </div>

          <h1 className="text-[clamp(3.2rem,11vw,7.5rem)] font-black leading-[0.92] tracking-tighter uppercase mb-5 text-white">
            Bästa
            <br />
            <span style={{ color: '#0e6efe' }}>Bilaffärerna</span>
          </h1>

          <p className="text-lg md:text-xl max-w-lg mx-auto leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Hitta din nästa bil och låt Biltos experter förhandla fram marknadens bästa pris – helt gratis.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <button
              onClick={() => onNavigateBuy()}
              className="h-12 px-8 font-semibold rounded-xl transition-all text-sm text-white"
              style={{ background: '#0e6efe' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0d5fe0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0e6efe')}
            >
              Välj en bil
            </button>
            <button
              onClick={onNavigateConsultation}
              className="h-12 px-8 font-semibold rounded-xl transition-all text-sm"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            >
              Vet du inte vad du vill ha?
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {[
              'Kostnadsfritt för dig',
              'Sparar i snitt 42\u00a0000 kr',
              'Ingen bindningstid',
            ].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#0e6efe' }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Category filter bar */}
      <div className="sticky top-14 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
                className={`flex-none h-9 px-4 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured editorial deals — only shown in "Alla" tab */}
      {activeCategory === 'alla' && (
        <section className="bg-[#f7f6f3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-4">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-950">
              Våra toppval
            </h2>
            <p className="text-slate-500 mt-1 text-sm">Handplockat av Biltos experter</p>
          </div>

          {featuredCars.map((fd, idx) => {
            const img = fd.car?.cleaned_image_url ?? fd.car?.image_url;
            const price = fd.car ? getNewPrice(fd.car) : null;
            const savings = price ? estimateSavings(price) : 55000;
            const isEven = idx % 2 === 0;

            return (
              <div
                key={`${fd.make}-${fd.model}`}
                className="border-t border-slate-200"
              >
                <div className={`max-w-7xl mx-auto flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Car image */}
                  <div className="md:w-1/2 flex items-center justify-center p-8 md:p-14 min-h-[260px] md:min-h-[380px]">
                    {img ? (
                      <img
                        src={img}
                        alt={`${fd.make} ${fd.model}`}
                        className="w-full max-w-md object-contain"
                        style={{ mixBlendMode: 'multiply' }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full max-w-md h-52 bg-slate-200 rounded-2xl flex items-center justify-center">
                        <Car className="w-14 h-14 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Text block */}
                  <div className="md:w-1/2 bg-white flex flex-col justify-center p-8 md:p-12 lg:p-16">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                        <TrendingUp className="w-3 h-3" />
                        Spara upp till {Math.round(savings / 1000)}&nbsp;000 kr*
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tagStyle(fd.tag)}`}>
                        {fd.tag}
                      </span>
                    </div>

                    <h3 className="text-2xl md:text-[1.75rem] font-black text-slate-950 leading-tight mb-4">
                      {fd.headline}
                    </h3>

                    <p className="text-slate-600 leading-relaxed mb-6">{fd.description}</p>

                    {price && (
                      <p className="text-sm text-slate-500 mb-6">
                        Ny från{' '}
                        <span className="font-bold text-slate-900 text-base">
                          {price.toLocaleString('sv-SE')} kr
                        </span>
                      </p>
                    )}

                    <button
                      onClick={() => setDrawerCar(`${fd.make} ${fd.model}`)}
                      className="self-start inline-flex items-center gap-2 h-12 px-7 bg-black text-white font-semibold rounded-xl hover:bg-slate-800 transition-all text-sm group"
                    >
                      {fd.make} {fd.model} – Få hjälp att köpa
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* All deals grid */}
      <section className="py-14 md:py-18 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section header with search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-950">
                {activeCategory === 'alla' ? 'Alla erbjudanden' : CATEGORIES.find(c => c.id === activeCategory)?.label}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">{gridCars.length} bilar tillgängliga</p>
            </div>
            {/* Search */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Sök märke eller modell…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-slate-50"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-slate-100 h-64 animate-pulse" />
              ))}
            </div>
          ) : gridCars.length === 0 ? (
            <div className="text-center py-24 text-slate-400">
              <Car className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Inga bilar hittades</p>
              <button
                onClick={() => { setActiveCategory('alla'); setSearchQuery(''); }}
                className="mt-4 text-sm text-slate-600 underline hover:text-slate-900"
              >
                Rensa filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {gridCars.map(car => {
                const img = car.cleaned_image_url ?? car.image_url;
                const price = getNewPrice(car);
                const savings = price ? estimateSavings(price) : null;
                const tag = getTag(car);
                return (
                  <button
                    key={car.id}
                    onClick={() => setDrawerCar(`${car.make} ${car.model}`)}
                    className="group text-left bg-[#f9f8f6] rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all duration-200"
                  >
                    {/* Image area */}
                    <div className="aspect-[16/10] flex items-center justify-center p-3 overflow-hidden">
                      {img ? (
                        <img
                          src={img}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          style={{ mixBlendMode: 'multiply' }}
                          loading="lazy"
                        />
                      ) : (
                        <Car className="w-10 h-10 text-slate-300" />
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{car.make}</p>
                          <p className="font-bold text-slate-900 truncate">{car.model}</p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${tagStyle(tag)}`}>
                          {tag}
                        </span>
                      </div>

                      {price ? (
                        <p className="text-sm text-slate-600">
                          Ny fr.{' '}
                          <span className="font-semibold text-slate-900">
                            {price.toLocaleString('sv-SE')} kr
                          </span>
                        </p>
                      ) : null}

                      {savings ? (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                          <TrendingUp className="w-3 h-3 shrink-0" />
                          Spara upp till {Math.round(savings / 1000)}&nbsp;000 kr*
                        </div>
                      ) : null}

                      <div className="mt-3 w-full h-8 bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 group-hover:bg-black transition-colors">
                        Få hjälp att köpa
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="bg-slate-950 text-white py-16 md:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            <Zap className="w-3 h-3 text-amber-400" />
            Alltid kostnadsfritt
          </div>

          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4 leading-tight">
            Vet du inte vilken bil du vill ha?
          </h2>

          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Boka en gratis konsultation och prata direkt med en av Biltos bilexperter.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onNavigateConsultation}
              className="h-12 px-8 bg-white text-slate-950 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm"
            >
              Boka gratis konsultation
            </button>
            <a
              href="tel:+46855550200"
              className="h-12 px-8 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Ring 08-5555 0200
            </a>
          </div>

          <p className="mt-8 text-xs text-slate-600 max-w-sm mx-auto">
            *Besparingsestimat baserade på genomsnittliga kundresultat jämfört med listpris. Faktiska besparingar varierar.
          </p>
        </div>
      </section>

      <SiteFooter />

      <BuyDrawer
        car={drawerCar}
        initialTrack="know"
        skipToContact={true}
        onClose={() => setDrawerCar(null)}
      />
    </div>
  );
}
