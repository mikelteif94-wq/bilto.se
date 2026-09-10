import { useState, useMemo, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Star, ArrowRight, Search, Zap, RotateCcw, Menu, CheckCircle2, XCircle, Check } from 'lucide-react';
import CompactCarCard from '../components/CompactCarCard';
import BuyDrawer from '../components/BuyDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllComparisonCars } from '../lib/comparison';
import type { ComparisonCar } from '../lib/comparison/types';
import { calcMonthlyTCO } from '../lib/utils';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta } from '../lib/pageMeta';
import { useCatalogCars } from '../hooks/useCatalogCars';
import { useCarImages } from '../hooks/useCarImages';
import MobileMenu from '../components/MobileMenu';
import ScoreBadge from '../components/ScoreBadge';


interface JamforBilarPageProps {
  onBack: () => void;
  onNavigateBuy: (bil?: string) => void;
  initialIds?: string[];
}

const MAX_CARS = 2;
const ALL_CARS = getAllComparisonCars();

const LOCAL_IMAGES: Record<string, string> = {
  skoda_enyaq: '/getImage.webp',
  tesla_model_3: '/getImage_(1).webp',
  skoda_octavia: '/getImage_(2).webp',
  toyota_corolla: '/getImage_(3).webp',
  hyundai_ioniq5: '/getImage_ioniq5.webp',
  polestar_2: '/getImage_polestar2.webp',
  bmw_ix1: '/getImage_(6).webp',
  mercedes_eqc: '/getImage_(7).webp',
  bmw_2_series: '/getImage_(8).webp',
  skoda_superb: '/getImage_(9).webp',
  volvo_xc90: '/getImage_(11).webp',
  volvo_v60: '/getImage_(15).webp',
  volvo_v40: '/getImage_(17).webp',
  volvo_v40_cross_country: '/getImage_(17).webp',
  volvo_xc70: '/getImage_(18).webp',
  volvo_v60_cross_country: '/getImage_(20).webp',
  volvo_v90_cross_country: '/getImage_(21).webp',
};

function resolveImage(carId: string, brand: string, model: string, getCarImage: (b: string, m: string) => string | undefined): string | undefined {
  if (LOCAL_IMAGES[carId]) return LOCAL_IMAGES[carId];
  return getCarImage(brand, model);
}

function fmt(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}
function fmtPrice(n?: number) { return n ? fmt(n) + ' kr' : '–'; }

const FUEL_LABELS: Record<string, string> = {
  bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid',
  mildhybrid: 'Mildhybrid', laddhybrid: 'Laddhybrid', el: 'El',
};
const BODY_LABELS: Record<string, string> = {
  sedan: 'Sedan', kombi: 'Kombi', suv: 'SUV', coupe: 'Coupé',
  hatchback: 'Halvkombi', cab: 'Cab', mpv: 'MPV',
};


/* ─── Car card — exact DarkCarCard style + selection state ─── */
function CarPickCard({
  car, selected, onSelect, onRemove, onNegotiate, getCarImage, small = false,
}: {
  car: ComparisonCar;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onNegotiate: () => void;
  getCarImage: (b: string, m: string) => string | undefined;
  small?: boolean;
}) {
  const img = resolveImage(car.id, car.brand_display, car.model_display, getCarImage);
  const tco = car.pricing.new_from_sek
    ? calcMonthlyTCO({ carPrice: car.pricing.new_from_sek, usedPrice: car.pricing.used_from_sek, fuelTypes: car.specs.fuel_types, make: car.brand_display })
    : null;
  const isEl = car.specs.fuel_types.includes('el');
  const isTop = car.ratings.overall >= 8.5;

  return (
    <div className={`group relative bg-white rounded-xl transition-all duration-200 ring-1 shadow-[0_1px_4px_rgba(0,0,0,0.07)] ${
      selected
        ? 'ring-[#0e6efe] shadow-[0_4px_20px_rgba(14,110,254,0.18)]'
        : 'ring-slate-100 hover:ring-slate-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)]'
    }`}>
      {/* Clickable image + info */}
      <div className="cursor-pointer" onClick={selected ? onRemove : onSelect}>
        <div className={`relative bg-white overflow-hidden rounded-t-xl ${small ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
          {img ? (
            <img src={img} alt={`${car.brand_display} ${car.model_display}`}
              className={`w-full h-full object-contain ${small ? 'p-2' : 'p-3 sm:p-4'}`}
              onError={e => { e.currentTarget.src = '/car-placeholder.svg'; e.currentTarget.className = 'w-full h-full object-contain p-6 opacity-50'; }}
            />
          ) : (
            <img src="/car-placeholder.svg" alt="" className="w-full h-full object-contain p-6 opacity-50" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />

          {/* Top-left badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isEl && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' }}>
                <Zap className="w-2 h-2" /> EL
              </span>
            )}
            {isTop && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/95 text-[9px] font-bold text-[#0e6efe] shadow-sm">
                <Star className="w-2 h-2 fill-[#0e6efe] text-[#0e6efe]" /> Topp
              </span>
            )}
          </div>

          {/* Score badge */}
          <ScoreBadge value={car.ratings.overall} small={small} className="absolute top-2.5 right-2.5" />

          {/* Selected checkmark overlay */}
          {selected && (
            <div className="absolute inset-0 bg-[#0e6efe]/8 rounded-t-xl flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-[#0e6efe] flex items-center justify-center shadow-lg">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </div>
          )}
        </div>

        <div className={`${small ? 'px-2.5 pt-2 pb-2' : 'px-3.5 pt-2.5 pb-2'}`}>
          <h3 className={`font-bold leading-snug transition-colors duration-200 ${selected ? 'text-[#0e6efe]' : 'text-slate-900 group-hover:text-[#0e6efe]'} ${small ? 'text-[12px]' : 'text-[14px] sm:text-[15px]'}`}>
            {car.brand_display} {car.model_display}
          </h3>
          <p className={`text-slate-400 mt-0.5 line-clamp-1 ${small ? 'text-[10px]' : 'text-[11px]'}`}>
            {BODY_LABELS[car.specs.body_type] ?? car.specs.body_type} · {car.specs.fuel_types.map(f => FUEL_LABELS[f] ?? f).join(', ')}
          </p>
          {tco && !small && (
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-[14px] font-extrabold text-slate-900 tabular-nums leading-none">{fmt(tco.total)}</span>
              <span className="text-[9px] font-semibold text-slate-400">kr/mån</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className={`${small ? 'px-2.5 pb-2.5 space-y-1' : 'px-3.5 pb-3.5 space-y-1.5'}`}>
        {selected ? (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className={`w-full flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-all active:scale-[0.98] font-semibold ${small ? 'h-7 text-[10px]' : 'h-9 text-[11px]'}`}
          >
            <X className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> Ta bort
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onSelect(); }}
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.98] text-white font-bold transition-all shadow-sm shadow-[#0e6efe]/20 ${small ? 'h-7 text-[10px]' : 'h-9 text-[12px]'}`}
            >
              <Check className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} strokeWidth={3} />
              Välj för jämförelse
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onNegotiate(); }}
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all active:scale-[0.98] ${small ? 'h-6 text-[9px]' : 'h-7 text-[10px]'} font-medium`}
            >
              Få prishjälp
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Car picker search modal ─── */
function CarSearch({ onSelect, exclude, getCarImage }: {
  onSelect: (c: ComparisonCar) => void;
  exclude: Set<string>;
  getCarImage: (b: string, m: string) => string | undefined;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return ALL_CARS
      .filter(c => c.is_active && !exclude.has(c.id))
      .filter(c => !q || `${c.brand_display} ${c.model_display}`.toLowerCase().includes(term))
      .slice(0, 24);
  }, [q, exclude]);

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Sök märke eller modell…"
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {filtered.map(c => {
          const img = resolveImage(c.id, c.brand_display, c.model_display, getCarImage);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className="text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#0e6efe]/5 border border-transparent hover:border-[#0e6efe]/20 transition"
            >
              {img
                ? <img src={img} alt="" className="w-12 h-8 object-contain shrink-0" />
                : <div className="w-12 h-8 bg-slate-100 rounded shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 truncate">{c.brand_display} {c.model_display}</p>
                <p className="text-[10px] text-slate-400">{FUEL_LABELS[c.specs.fuel_types[0]] ?? c.specs.fuel_types[0]}</p>
              </div>
              <span className="text-[12px] font-bold text-[#0e6efe] tabular-nums shrink-0">{c.ratings.overall}/10</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-2 text-[13px] text-slate-400 text-center py-6">Inga bilar matchade.</p>
        )}
      </div>
    </div>
  );
}

type SectionKey = 'ratings' | 'tco' | 'specs' | 'proscons';

export default function JamforBilarPage({ onBack, onNavigateBuy, initialIds = [] }: JamforBilarPageProps) {
  setPageMeta({
    title: 'Jämför bilar sida vid sida | Bilto',
    description: 'Jämför 2 bilar sida vid sida – betyg, ägandekostnader, specifikationer och expertanalys.',
  });

  const { cars: catalogCars } = useCatalogCars();
  const { getCarImage } = useCarImages(catalogCars);

  const initCars = useMemo(() =>
    initialIds.flatMap(id => ALL_CARS.filter(c => c.id === id)).slice(0, MAX_CARS),
    [initialIds],
  );

  const [cars, setCars] = useState<ComparisonCar[]>(initCars);
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(['ratings', 'tco', 'specs', 'proscons']));
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [buyModalCar, setBuyModalCar] = useState<string | null>(null);
  const [cardMode, setCardMode] = useState<'ny' | 'beg'>('beg');

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const excludeIds = useMemo(() => new Set(cars.map(c => c.id)), [cars]);

  const toggleSection = (k: SectionKey) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const tcos = useMemo(() =>
    cars.map(c => calcMonthlyTCO({
      carPrice: c.pricing.new_from_sek ?? 300_000,
      usedPrice: c.pricing.used_from_sek,
      fuelTypes: c.specs.fuel_types,
      make: c.brand_display,
    })),
    [cars],
  );

  const ratingKeys: { key: keyof ComparisonCar['ratings']; label: string }[] = [
    { key: 'overall', label: 'Bilto-betyg' },
    { key: 'driving', label: 'Körglädje' },
    { key: 'comfort', label: 'Komfort' },
    { key: 'practicality', label: 'Praktisk' },
    { key: 'value', label: 'Prisvärdhet' },
  ];

  const tcoKeys: { key: keyof typeof tcos[0]; label: string }[] = [
    { key: 'total', label: 'Total /mån' },
    { key: 'financing', label: 'Finansiering' },
    { key: 'fuel', label: 'Bränsle / el' },
    { key: 'insurance', label: 'Försäkring' },
    { key: 'service', label: 'Service' },
    { key: 'tax', label: 'Fordonsskatt' },
  ];

  const quickPick = useMemo(() =>
    ALL_CARS
      .filter(c => c.is_active)
      .sort((a, b) => b.ratings.overall - a.ratings.overall)
      .slice(0, 12),
    [],
  );

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* ── Floating nav ── */}
      <header className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]/40 backdrop-blur-md'}`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white">
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
          </button>
          <button onClick={onBack} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img src="/a_clean_graphic_logo_on_a_transparent_background.png" alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={onBack}
              className="text-[15px] text-white/70 hover:text-white transition font-medium">
              Köp bil
            </button>
            <span className="text-[15px] text-white font-bold underline underline-offset-4 decoration-white/50">
              Jämför bilar
            </span>
            <a href="/sa-funkar-det" className="text-[15px] text-white/70 hover:text-white transition font-medium">
              Så funkar det
            </a>
          </nav>
          <div className="flex items-center ml-auto gap-3">
            {cars.length > 0 && (
              <button type="button" onClick={() => setCars([])}
                className="hidden sm:flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition">
                <RotateCcw className="w-3.5 h-3.5" /> Rensa
              </button>
            )}
            <a href="/gratis-konsultation"
              className="inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} active="Köp bil med hjälp" />

      {/* ── Blue hero ── */}
      <div className="bg-[#0e6efe]" style={{ background: 'linear-gradient(135deg, #0a57cc 0%, #0e6efe 60%, #1a7fff 100%)' }}>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 right-0 w-80 h-80 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-1/4 w-64 h-40 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)' }} />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-10 sm:pt-32 sm:pb-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/15 text-white/80 text-[11px] font-semibold px-3 py-1.5 rounded-full mb-4 border border-white/20">
                Jämför sida vid sida · Upp till 2 bilar
              </div>
              <h1 className="text-[26px] sm:text-[36px] font-extrabold text-white mb-2.5 leading-tight">
                Jämför bilar sida vid sida
              </h1>
              <p className="text-[14px] sm:text-[16px] text-white/65 leading-relaxed">
                Välj 2 bilar och jämför betyg, ägandekostnader, specifikationer och expertanalys.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-16">
        {/* ── Car picker section ── */}
        <section className="bg-white border-b border-slate-200 py-6 sm:py-8 mb-8 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">

            {/* Selected cars chips */}
            {cars.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 mb-5 pb-5 border-b border-slate-100">
                <span className="text-[12px] font-semibold text-slate-500 shrink-0">Valda:</span>
                {cars.map(car => (
                  <div key={car.id} className="flex items-center gap-1.5 h-8 pl-3 pr-1 rounded-full bg-[#0e6efe] text-white text-[12px] font-semibold shadow-sm">
                    {car.brand_display} {car.model_display}
                    <button
                      type="button"
                      onClick={() => setCars(prev => prev.filter(c => c.id !== car.id))}
                      className="ml-0.5 w-5 h-5 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {cars.length === MAX_CARS && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                    Scrolla ned för jämförelse
                  </span>
                )}
              </div>
            )}

            {/* Header row */}
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <p className="text-[14px] font-bold text-slate-800">
                {cars.length === 0
                  ? 'Välj 2 bilar att jämföra'
                  : cars.length === 1
                  ? 'Välj ytterligare en bil'
                  : 'Byt ut en bil nedan'}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0 rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCardMode('beg')}
                    className={`px-3 h-8 text-[12px] font-semibold transition-colors ${cardMode === 'beg' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    Begagnad
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardMode('ny')}
                    className={`px-3 h-8 text-[12px] font-semibold transition-colors ${cardMode === 'ny' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    Ny bil
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[11px] font-semibold transition shadow-sm"
                >
                  <Search className="w-3 h-3" /> Sök alla bilar
                </button>
              </div>
            </div>

            {/* Quick pick grid with CompactCarCard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {quickPick.map(c => {
                const imgUrl = resolveImage(c.id, c.brand_display, c.model_display, getCarImage);
                const fuelLabel = c.specs.fuel_types.map(f => FUEL_LABELS[f] ?? f).join(' / ');
                const isCarSelected = cars.some(sel => sel.id === c.id);
                const canAdd = cars.length < MAX_CARS;
                return (
                  <CompactCarCard
                    key={c.id}
                    name={`${c.brand_display} ${c.model_display}`}
                    make={c.brand_display}
                    imageUrl={imgUrl}
                    rating={c.ratings.overall}
                    fuelLabel={fuelLabel}
                    fuelTypes={c.specs.fuel_types}
                    bodyType={c.specs.body_type}
                    drivetrain={c.specs.drivetrain}
                    seats={c.specs.seats}
                    pros={c.pros}
                    carPrice={c.pricing.new_from_sek ?? undefined}
                    usedPrice={c.pricing.used_from_sek ?? undefined}
                    isSelected={isCarSelected}
                    cardMode={cardMode}
                    onSelect={
                      isCarSelected
                        ? () => setCars(prev => prev.filter(sel => sel.id !== c.id))
                        : canAdd
                        ? () => setCars(prev => [...prev, c])
                        : undefined
                    }
                    onNegotiate={() => setBuyModalCar(`${c.brand_display} ${c.model_display}`)}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Search modal ── */}
        <AnimatePresence>
          {searchOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                onClick={() => setSearchOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 16 }}
                className="fixed inset-x-4 top-20 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[560px] z-50 bg-white rounded-2xl shadow-2xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[15px] font-bold text-slate-900">Välj bil att jämföra</h2>
                  <button type="button" onClick={() => setSearchOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <CarSearch
                  exclude={excludeIds}
                  getCarImage={getCarImage}
                  onSelect={c => {
                    if (cars.length < MAX_CARS) setCars(prev => [...prev, c]);
                    setSearchOpen(false);
                  }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Comparison table ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {cars.length === 1 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-[15px] font-medium">Välj ytterligare en bil för att börja jämföra.</p>
              <button type="button" onClick={() => setSearchOpen(true)}
                className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0e6efe] text-white text-[13px] font-semibold hover:bg-[#0a57cc] transition shadow-sm">
                <Search className="w-4 h-4" /> Sök bil
              </button>
            </div>
          )}

          {cars.length >= 2 && (
            <div className="space-y-4">
              {/* ─ Ratings ─ */}
              <CompareSection title="Betyg" sectionKey="ratings"
                open={openSections.has('ratings')} onToggle={() => toggleSection('ratings')}>
                <div className="overflow-x-auto">
                  <div style={{ minWidth: `${110 + cars.length * 120}px` }}>
                    <CarHeaderRow cars={cars} getCarImage={getCarImage} />
                    {ratingKeys.map(({ key, label }) => {
                      const vals = cars.map(c => c.ratings[key]);
                      const best = Math.max(...vals);
                      return (
                        <CompareRow key={key} label={label}>
                          {vals.map((v, i) => (
                            <div key={i} className={`flex-1 flex flex-col items-center gap-1 px-2 py-3 border-l border-slate-100 ${v === best ? 'bg-emerald-50' : ''}`}>
                              <span className={`text-[22px] font-extrabold tabular-nums ${v >= 8.5 ? 'text-emerald-600' : v >= 7 ? 'text-[#0e6efe]' : v >= 5.5 ? 'text-amber-600' : 'text-red-500'}`}>
                                {v.toFixed(1)}
                              </span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <div key={s} className={`w-1.5 h-1.5 rounded-full ${v >= s * 2 ? (v >= 8.5 ? 'bg-emerald-500' : v >= 7 ? 'bg-[#0e6efe]' : 'bg-amber-500') : 'bg-slate-200'}`} />
                                ))}
                              </div>
                              {v === best && (
                                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Bäst</span>
                              )}
                            </div>
                          ))}
                        </CompareRow>
                      );
                    })}
                  </div>
                </div>
              </CompareSection>

              {/* ─ TCO ─ */}
              <CompareSection title="Ägandekostnad / mån" sectionKey="tco"
                open={openSections.has('tco')} onToggle={() => toggleSection('tco')}>
                <div className="overflow-x-auto">
                  <div style={{ minWidth: `${110 + cars.length * 120}px` }}>
                    {tcoKeys.map(({ key, label }) => {
                      const vals = tcos.map(t => t[key] as number);
                      const best = Math.min(...vals);
                      const isTotal = key === 'total';
                      return (
                        <CompareRow key={key} label={label} highlight={isTotal}>
                          {vals.map((v, i) => (
                            <div key={i} className={`flex-1 text-center px-2 py-3 border-l border-slate-100 ${v === best ? 'bg-emerald-50' : ''}`}>
                              <span className={`${isTotal ? 'text-[18px] font-extrabold text-slate-900' : 'text-[15px] font-semibold text-slate-700'} tabular-nums`}>
                                {fmt(v)}
                              </span>
                              <span className="text-[11px] text-slate-400 ml-1">kr</span>
                              {v === best && (
                                <div><span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Lägst</span></div>
                              )}
                            </div>
                          ))}
                        </CompareRow>
                      );
                    })}
                    <CompareRow label="Nytt från">
                      {cars.map((c, i) => (
                        <div key={i} className="flex-1 text-center py-3 border-l border-slate-100">
                          <span className="text-[14px] font-semibold text-slate-700">{fmtPrice(c.pricing.new_from_sek)}</span>
                        </div>
                      ))}
                    </CompareRow>
                    <CompareRow label="Begagnat från">
                      {cars.map((c, i) => (
                        <div key={i} className="flex-1 text-center py-3 border-l border-slate-100">
                          <span className="text-[14px] font-semibold text-slate-700">{fmtPrice(c.pricing.used_from_sek)}</span>
                        </div>
                      ))}
                    </CompareRow>
                  </div>
                </div>
              </CompareSection>

              {/* ─ Specs ─ */}
              <CompareSection title="Specifikationer" sectionKey="specs"
                open={openSections.has('specs')} onToggle={() => toggleSection('specs')}>
                <div className="overflow-x-auto">
                  <div style={{ minWidth: `${110 + cars.length * 120}px` }}>
                    <CompareRow label="Kaross">
                      {cars.map((c, i) => <Cell key={i}>{BODY_LABELS[c.specs.body_type] ?? c.specs.body_type}</Cell>)}
                    </CompareRow>
                    <CompareRow label="Drivmedel">
                      {cars.map((c, i) => <Cell key={i}>{c.specs.fuel_types.map(f => FUEL_LABELS[f] ?? f).join(', ')}</Cell>)}
                    </CompareRow>
                    <CompareRow label="Drivlina">
                      {cars.map((c, i) => <Cell key={i}>{c.specs.drivetrain.map(d => d.toUpperCase()).join(', ')}</Cell>)}
                    </CompareRow>
                    <CompareRow label="Sittplatser">
                      {cars.map((c, i) => <Cell key={i}>{c.specs.seats} pers</Cell>)}
                    </CompareRow>
                    <CompareRow label="Bagageutrymme">
                      {cars.map((c, i) => <Cell key={i}>{c.specs.trunk_liters ? `${c.specs.trunk_liters} L` : '–'}</Cell>)}
                    </CompareRow>
                    <CompareRow label="Euro NCAP">
                      {cars.map((c, i) => (
                        <div key={i} className="flex-1 flex items-center justify-center border-l border-slate-100 py-3">
                          {c.safety.euro_ncap_stars ? (
                            <span className="flex gap-0.5">
                              {Array.from({ length: c.safety.euro_ncap_stars }).map((_, s) => (
                                <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                              ))}
                            </span>
                          ) : <span className="text-[13px] text-slate-400">–</span>}
                        </div>
                      ))}
                    </CompareRow>
                  </div>
                </div>
              </CompareSection>

              {/* ─ Pros & Cons ─ */}
              <CompareSection title="Plus & minus" sectionKey="proscons"
                open={openSections.has('proscons')} onToggle={() => toggleSection('proscons')}>
                <div className="overflow-x-auto">
                  <div style={{ minWidth: `${110 + cars.length * 150}px` }}>
                    <div className="grid" style={{ gridTemplateColumns: `110px repeat(${cars.length}, 1fr)` }}>
                      <div className="px-3 py-3 border-b border-slate-100 bg-[#faf8f5]/80" />
                      {cars.map((c, i) => (
                        <div key={i} className="px-3 py-3 text-center text-[12px] font-bold text-slate-700 border-b border-slate-100 bg-slate-50/80 border-l border-slate-100">
                          {c.brand_display} {c.model_display}
                        </div>
                      ))}
                      <div className="px-3 py-3 border-b border-slate-50 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-semibold text-emerald-700">Fördelar</span>
                      </div>
                      {cars.map((c, i) => (
                        <div key={i} className="px-3 py-3 border-b border-slate-50 border-l border-slate-100">
                          <ul className="space-y-1.5">
                            {c.pros.map((p, j) => (
                              <li key={j} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                                <span className="text-emerald-500 shrink-0 text-[10px]">✓</span>{p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <div className="px-3 py-3 flex items-start gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-semibold text-red-600">Nackdelar</span>
                      </div>
                      {cars.map((c, i) => (
                        <div key={i} className="px-3 py-3 border-l border-slate-100">
                          <ul className="space-y-1.5">
                            {c.cons.map((p, j) => (
                              <li key={j} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                                <span className="text-red-400 shrink-0 text-[10px]">✗</span>{p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CompareSection>

              {/* ─ CTA ─ */}
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #0a57cc 0%, #0e6efe 60%, #1a7fff 100%)' }}>
                <div className="text-center mb-5">
                  <h2 className="text-[20px] font-extrabold text-white mb-2">Redo att ta nästa steg?</h2>
                  <p className="text-[14px] text-white/70 max-w-lg mx-auto">
                    Låt en expert förhandla bästa pris åt dig – kostnadsfritt.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {cars.map(c => {
                    const img = resolveImage(c.id, c.brand_display, c.model_display, getCarImage);
                    return (
                      <button key={c.id} type="button"
                        onClick={() => setBuyModalCar(`${c.brand_display} ${c.model_display}`)}
                        className="inline-flex items-center gap-2.5 bg-white text-[#0e6efe] font-bold text-[13px] px-5 h-11 rounded-xl hover:bg-[#faf8f5] transition">
                        {img && <img src={img} alt="" className="h-7 w-10 object-contain" />}
                        Hjälp med {c.model_display}
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <SiteFooter onNavigate={() => onBack()} />

      {/* ── Buy drawer ── */}
      <BuyDrawer car={buyModalCar} onClose={() => setBuyModalCar(null)} />
    </div>
  );
}

function CarHeaderRow({ cars, getCarImage }: { cars: ComparisonCar[]; getCarImage: (b: string, m: string) => string | undefined }) {
  return (
    <div className="flex items-stretch border-b border-slate-100">
      <div className="w-[110px] shrink-0" />
      {cars.map((c, i) => {
        const img = resolveImage(c.id, c.brand_display, c.model_display, getCarImage);
        return (
          <div key={i} className="flex-1 px-3 py-3 text-center border-l border-slate-100 bg-slate-50/60">
            {img && <img src={img} alt="" className="h-8 object-contain mx-auto mb-1" />}
            <p className="text-[11px] font-bold text-slate-700">{c.brand_display}</p>
            <p className="text-[10px] text-slate-500">{c.model_display}</p>
          </div>
        );
      })}
    </div>
  );
}

function CompareSection({ title, sectionKey, open, onToggle, children }: {
  title: string; sectionKey: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition">
        <span className="text-[15px] font-bold text-slate-900">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-slate-100 divide-y divide-slate-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CompareRow({ label, children, highlight = false }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex items-stretch ${highlight ? 'bg-slate-50' : ''}`}>
      <div className="w-[110px] shrink-0 px-3 py-3 flex items-center">
        <span className={`text-[10px] font-semibold ${highlight ? 'text-slate-800' : 'text-slate-500'} uppercase tracking-wide leading-tight`}>
          {label}
        </span>
      </div>
      <div className="flex flex-1">{children}</div>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 text-center px-2 py-3 flex items-center justify-center border-l border-slate-100">
      <span className="text-[13px] font-semibold text-slate-700">{children}</span>
    </div>
  );
}
