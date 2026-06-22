import { useState, useMemo, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Star, ArrowRight, Search, Zap, RotateCcw, Menu, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllComparisonCars } from '../lib/comparison';
import type { ComparisonCar } from '../lib/comparison/types';
import { calcMonthlyTCO } from '../lib/utils';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta } from '../lib/pageMeta';
import { useCatalogCars } from '../hooks/useCatalogCars';
import { useCarImages } from '../hooks/useCarImages';
import MobileMenu from '../components/MobileMenu';

interface JamforBilarPageProps {
  onBack: () => void;
  onNavigateBuy: (bil?: string) => void;
  initialIds?: string[];
}

const MAX_CARS = 3;
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

/* ─── Small ScoreBadge matching DarkCarCard ─── */
function ScoreBadge({ value }: { value: number }) {
  const color = value >= 8.5 ? '#059669' : value >= 7 ? '#0e6efe' : '#d97706';
  return (
    <div className="absolute top-3 right-3 flex items-center justify-center w-10 h-10 rounded-xl bg-white/95 shadow-md"
      style={{ border: `2.5px solid ${color}` }}>
      <span className="text-[13px] font-extrabold leading-none" style={{ color }}>{value}</span>
    </div>
  );
}

/* ─── Car pick card (same style as DarkCarCard) ─── */
function CarPickCard({
  car, selected, onSelect, onRemove, getCarImage,
}: {
  car: ComparisonCar;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  getCarImage: (b: string, m: string) => string | undefined;
}) {
  const img = resolveImage(car.id, car.brand_display, car.model_display, getCarImage);
  const tco = car.pricing.new_from_sek
    ? calcMonthlyTCO({ carPrice: car.pricing.new_from_sek, usedPrice: car.pricing.used_from_sek, fuelTypes: car.specs.fuel_types, make: car.brand_display })
    : null;
  const isEl = car.specs.fuel_types.includes('el');

  return (
    <div
      className={`group relative bg-white rounded-xl transition-all duration-200 ring-1 shadow-[0_1px_4px_rgba(0,0,0,0.07)] cursor-pointer ${
        selected
          ? 'ring-[#0e6efe] shadow-[0_4px_20px_rgba(14,110,254,0.18)]'
          : 'ring-slate-100 hover:ring-slate-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)]'
      }`}
      onClick={onSelect}
    >
      {/* Image area */}
      <div className="relative aspect-[16/10] bg-white overflow-hidden rounded-t-xl" style={{ minHeight: 140 }}>
        {img ? (
          <img src={img} alt={`${car.brand_display} ${car.model_display}`}
            className="w-full h-full object-contain p-4"
            onError={e => { e.currentTarget.src = '/car-placeholder.svg'; e.currentTarget.className = 'w-full h-full object-contain p-6 opacity-50'; }}
          />
        ) : (
          <img src="/car-placeholder.svg" alt="" className="w-full h-full object-contain p-6 opacity-50" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />
        {isEl && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' }}>
              <Zap className="w-2.5 h-2.5" /> El
            </span>
          </div>
        )}
        <ScoreBadge value={car.ratings.overall} />
        {selected && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0e6efe] flex items-center justify-center shadow-md">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      <div className="px-3.5 pt-2.5 pb-3">
        <h3 className={`text-[15px] font-bold leading-snug transition-colors duration-200 ${selected ? 'text-[#0e6efe]' : 'text-slate-900 group-hover:text-[#0e6efe]'}`}>
          {car.brand_display} {car.model_display}
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
          {BODY_LABELS[car.specs.body_type] ?? car.specs.body_type} · {car.specs.fuel_types.map(f => FUEL_LABELS[f] ?? f).join(', ')}
        </p>
        {tco && (
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-[15px] font-extrabold text-slate-900 tabular-nums leading-none">
              {fmt(tco.total)}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">kr/mån ägandekostnad</span>
          </div>
        )}
      </div>

      {selected && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="absolute bottom-3 right-3 w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ─── Car picker search ─── */
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
    description: 'Jämför upp till 3 bilar sida vid sida – betyg, ägandekostnader, specifikationer och expertanalys.',
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

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* ── Floating nav matching CompareCarsPage exactly ── */}
      <header className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]/40 backdrop-blur-md'}`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white">
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
          </button>
          <button onClick={onBack} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto"
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

      {/* ── Page content ── */}
      <div className="pt-24 sm:pt-28 pb-16">
        {/* Page header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8">
          <h1 className="text-[22px] sm:text-[30px] font-extrabold text-slate-900 mb-1">Jämför bilar sida vid sida</h1>
          <p className="text-[14px] text-slate-500">
            Välj upp till {MAX_CARS} bilar och jämför betyg, kostnader och specifikationer.
          </p>
        </div>

        {/* ── Car picker ── */}
        <section className="bg-slate-50 border-y border-slate-200 py-6 sm:py-8 mb-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[13px] font-bold text-slate-800">
                  {cars.length === 0
                    ? 'Välj bilar att jämföra'
                    : `${cars.length} av ${MAX_CARS} valda`}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Klicka på ett kort för att markera</p>
              </div>
              {cars.length < MAX_CARS && (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[13px] font-semibold transition shadow-sm shadow-[#0e6efe]/20"
                >
                  <Search className="w-3.5 h-3.5" />
                  Sök bil
                </button>
              )}
            </div>

            {/* Selected cars row */}
            {cars.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {cars.map((c, i) => (
                  <CarPickCard
                    key={c.id}
                    car={c}
                    selected
                    onSelect={() => {}}
                    onRemove={() => setCars(prev => prev.filter((_, j) => j !== i))}
                    getCarImage={getCarImage}
                  />
                ))}
              </div>
            )}

            {/* Quick-pick grid (hidden if max reached) */}
            {cars.length < MAX_CARS && (
              <>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Populära val
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {ALL_CARS
                    .filter(c => c.is_active && !excludeIds.has(c.id))
                    .sort((a, b) => b.ratings.overall - a.ratings.overall)
                    .slice(0, 8)
                    .map(c => (
                      <CarPickCard
                        key={c.id}
                        car={c}
                        selected={false}
                        onSelect={() => setCars(prev => [...prev, c])}
                        onRemove={() => {}}
                        getCarImage={getCarImage}
                      />
                    ))}
                </div>
              </>
            )}
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
                  <h2 className="text-[15px] font-bold text-slate-900">Välj bil</h2>
                  <button type="button" onClick={() => setSearchOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <CarSearch
                  exclude={excludeIds}
                  getCarImage={getCarImage}
                  onSelect={c => { setCars(prev => [...prev, c]); setSearchOpen(false); }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Comparison table (only when ≥ 2 cars) ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {cars.length === 1 && (
            <div className="text-center py-10 text-slate-400">
              <p className="text-[14px]">Lägg till ytterligare en bil för att börja jämföra.</p>
            </div>
          )}

          {cars.length >= 2 && (
            <div className="space-y-4">
              {/* ─ Ratings ─ */}
              <CompareSection title="Betyg" sectionKey="ratings"
                open={openSections.has('ratings')} onToggle={() => toggleSection('ratings')}>
                <div className="overflow-x-auto">
                  <div style={{ minWidth: `${110 + cars.length * 110}px` }}>
                <CarHeaderRow cars={cars} getCarImage={getCarImage} />
                {ratingKeys.map(({ key, label }) => {
                  const vals = cars.map(c => c.ratings[key]);
                  const best = Math.max(...vals);
                  return (
                    <CompareRow key={key} label={label}>
                      {vals.map((v, i) => (
                        <div key={i} className={`flex-1 flex flex-col items-center gap-1 px-2 py-3 border-l border-slate-100 ${v === best && cars.length > 1 ? 'bg-emerald-50' : ''}`}>
                          <span className={`text-[22px] font-extrabold tabular-nums ${v >= 8.5 ? 'text-emerald-600' : v >= 7 ? 'text-[#0e6efe]' : v >= 5.5 ? 'text-amber-600' : 'text-red-500'}`}>
                            {v.toFixed(1)}
                          </span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <div key={s} className={`w-1.5 h-1.5 rounded-full ${v >= s * 2 ? (v >= 8.5 ? 'bg-emerald-500' : v >= 7 ? 'bg-[#0e6efe]' : 'bg-amber-500') : 'bg-slate-200'}`} />
                            ))}
                          </div>
                          {v === best && cars.length > 1 && (
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
                  <div style={{ minWidth: `${110 + cars.length * 110}px` }}>
                {tcoKeys.map(({ key, label }) => {
                  const vals = tcos.map(t => t[key] as number);
                  const best = Math.min(...vals);
                  const isTotal = key === 'total';
                  return (
                    <CompareRow key={key} label={label} highlight={isTotal}>
                      {vals.map((v, i) => (
                        <div key={i} className={`flex-1 text-center px-2 py-3 border-l border-slate-100 ${v === best && cars.length > 1 ? 'bg-emerald-50' : ''}`}>
                          <span className={`${isTotal ? 'text-[18px] font-extrabold text-slate-900' : 'text-[15px] font-semibold text-slate-700'} tabular-nums`}>
                            {fmt(v)}
                          </span>
                          <span className="text-[11px] text-slate-400 ml-1">kr</span>
                          {v === best && cars.length > 1 && (
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
                  <div style={{ minWidth: `${110 + cars.length * 110}px` }}>
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
                  <div style={{ minWidth: `${140 + cars.length * 140}px` }}>
                <div className="grid" style={{ gridTemplateColumns: `140px repeat(${cars.length}, 1fr)` }}>
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80" />
                  {cars.map((c, i) => (
                    <div key={i} className="px-3 py-3 text-center text-[12px] font-bold text-slate-700 border-b border-slate-100 bg-slate-50/80 border-l border-slate-100">
                      {c.brand_display} {c.model_display}
                    </div>
                  ))}
                  <div className="px-4 py-3 border-b border-slate-50 flex items-start gap-1.5">
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
                  <div className="px-4 py-3 flex items-start gap-1.5">
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
              <div className="bg-[#0e6efe] rounded-2xl p-6 sm:p-8">
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
                        onClick={() => onNavigateBuy(`${c.brand_display} ${c.model_display}`)}
                        className="inline-flex items-center gap-2.5 bg-white text-[#0e6efe] font-bold text-[13px] px-5 h-11 rounded-xl hover:bg-slate-50 transition">
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
    </div>
  );
}

/* ─── Car header row inside compare sections ─── */
function CarHeaderRow({ cars, getCarImage }: { cars: ComparisonCar[]; getCarImage: (b: string, m: string) => string | undefined }) {
  return (
    <div className="flex items-stretch border-b border-slate-100">
      <div className="w-[110px] sm:w-[140px] shrink-0" />
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

/* ─── Section accordion ─── */
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

/* ─── Row with label ─── */
function CompareRow({ label, children, highlight = false }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex items-stretch ${highlight ? 'bg-slate-50' : ''}`}>
      <div className="w-[110px] sm:w-[140px] shrink-0 px-3 sm:px-4 py-3 flex items-center">
        <span className={`text-[10px] sm:text-[11px] font-semibold ${highlight ? 'text-slate-800' : 'text-slate-500'} uppercase tracking-wide leading-tight`}>
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
