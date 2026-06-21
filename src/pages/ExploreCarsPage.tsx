import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, X, ChevronDown, SlidersHorizontal, Zap,
  ChevronRight, Filter, ArrowUpDown, Loader2, Car,
} from 'lucide-react';
import { useCatalogCars, type CatalogCarFull } from '../hooks/useCatalogCars';
import { calcCarMonthlyRange } from '../lib/utils';
import { SiteFooter } from '../components/SiteFooter';
import { motion, AnimatePresence } from 'framer-motion';

function fmt(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

const BODY_LABELS: Record<string, string> = {
  sedan: 'Sedan', kombi: 'Kombi', suv: 'SUV', hatchback: 'Halvkombi',
  coupe: 'Coupé', cab: 'Cab', mpv: 'MPV',
};

const BODY_TYPES = ['suv', 'kombi', 'hatchback', 'sedan', 'mpv', 'coupe', 'cab'];
const FUEL_TYPES = ['el', 'laddhybrid', 'hybrid', 'bensin', 'diesel'];
const FUEL_LABELS: Record<string, string> = {
  el: 'Elbil', laddhybrid: 'Laddhybrid', hybrid: 'Hybrid', bensin: 'Bensin', diesel: 'Diesel',
};

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevans' },
  { value: 'price_asc', label: 'Lägst pris' },
  { value: 'price_desc', label: 'Högst pris' },
  { value: 'rating_desc', label: 'Bäst betyg' },
  { value: 'name_asc', label: 'Namn A–Ö' },
];

/* ── FilterChip ── */
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all duration-150 whitespace-nowrap ${
        active
          ? 'bg-[#0e6efe] border-[#0e6efe] text-white shadow-sm'
          : 'bg-white border-slate-200 text-slate-600 hover:border-[#0e6efe] hover:text-[#0e6efe]'
      }`}
    >
      {label}
    </button>
  );
}

/* ── ScoreBadge ── */
function ScoreBadge({ value }: { value: number }) {
  const color = value >= 9 ? '#059669' : value >= 7.5 ? '#0e6efe' : '#d97706';
  return (
    <div
      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center bg-white/95"
      style={{ border: `2px solid ${color}`, boxShadow: `0 1px 6px ${color}30` }}
    >
      <span className="text-[10px] font-extrabold tabular-nums" style={{ color }}>
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </span>
    </div>
  );
}

/* ── CarCard ── */
function CarCard({ car, onBuy, onDetail }: { car: CatalogCarFull; onBuy: () => void; onDetail: () => void }) {
  const img = car.cleaned_image_url || car.image_url;
  const fuels = car.fuel_types ?? [];
  const isElectric = fuels.includes('el');
  const range = car.price_new_from
    ? calcCarMonthlyRange(car.price_new_from, car.price_used_from ?? undefined)
    : null;
  const bodyLabel = car.body_type ? (BODY_LABELS[car.body_type] ?? car.body_type) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
      onClick={onDetail}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-slate-50 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={`${car.make} ${car.model}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain p-3 sm:p-4 transition-transform duration-300 group-hover:scale-[1.05]"
            onError={e => {
              e.currentTarget.src = '/car-placeholder.svg';
              e.currentTarget.className = 'w-full h-full object-contain p-6 opacity-20';
            }}
          />
        ) : (
          <img src="/car-placeholder.svg" alt="" className="w-full h-full object-contain p-6 opacity-20" />
        )}

        {/* Only show Elbil badge */}
        {isElectric && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Zap className="w-2.5 h-2.5" />
              Elbil
            </span>
          </div>
        )}

        {car.rating_overall != null && <ScoreBadge value={car.rating_overall} />}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-2">
        <div>
          <h3 className="text-[13px] sm:text-[14px] font-bold text-slate-900 leading-tight group-hover:text-[#0e6efe] transition-colors truncate">
            {car.make} {car.model}
          </h3>

          {/* Tags row — body + AWD only */}
          <div className="mt-1 flex flex-wrap gap-1">
            {bodyLabel && (
              <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                {bodyLabel}
              </span>
            )}
            {car.drivetrain_type?.toLowerCase().includes('awd') && (
              <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600">
                AWD
              </span>
            )}
          </div>

          {/* Expert comment */}
          {car.expert_comment && (
            <p className="mt-1.5 text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 leading-snug italic hidden sm:block">
              {car.expert_comment}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto">
          {range ? (
            <div className="flex items-baseline gap-1">
              <span className="text-[15px] sm:text-[16px] font-extrabold tabular-nums text-[#0e6efe] leading-none">
                {fmt(range.low)}–{fmt(range.high)}
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-blue-400">kr/mån</span>
            </div>
          ) : car.price_used_from ? (
            <div className="flex items-baseline gap-1">
              <span className="text-[14px] font-extrabold text-slate-800">{fmt(car.price_used_from)}</span>
              <span className="text-[9px] text-slate-400">kr</span>
            </div>
          ) : null}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onBuy(); }}
          className="w-full h-9 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[11px] sm:text-[12px] font-bold flex items-center justify-center gap-1 transition-colors duration-150 active:scale-[0.97] mt-1"
        >
          Få prishjälp <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── MobileFilterDrawer ── */
function MobileFilterDrawer({
  open, onClose, selectedFuels, toggleFuel, selectedBodies, toggleBody,
  maxBudget, setMaxBudget, onReset,
}: {
  open: boolean; onClose: () => void;
  selectedFuels: Set<string>; toggleFuel: (f: string) => void;
  selectedBodies: Set<string>; toggleBody: (b: string) => void;
  maxBudget: number; setMaxBudget: (n: number) => void;
  onReset: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white px-5 py-4 flex items-center justify-between border-b border-slate-100">
              <span className="font-bold text-slate-900 text-[16px]">Filter</span>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="px-5 pb-8 pt-5 space-y-6">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Drivmedel</p>
                <div className="flex flex-wrap gap-2">
                  {FUEL_TYPES.map(f => (
                    <FilterChip key={f} label={FUEL_LABELS[f]} active={selectedFuels.has(f)} onClick={() => toggleFuel(f)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Karosseri</p>
                <div className="flex flex-wrap gap-2">
                  {BODY_TYPES.map(b => (
                    <FilterChip key={b} label={BODY_LABELS[b] ?? b} active={selectedBodies.has(b)} onClick={() => toggleBody(b)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Max månadsbudget: <span className="text-slate-700 normal-case">{maxBudget === 30000 ? 'Alla' : `${fmt(maxBudget)} kr/mån`}</span>
                </p>
                <input
                  type="range" min={2000} max={30000} step={500}
                  value={maxBudget}
                  onChange={e => setMaxBudget(Number(e.target.value))}
                  className="w-full accent-[#0e6efe]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>2 000 kr/mån</span><span>Alla priser</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={onReset} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50 transition-colors">
                  Rensa
                </button>
                <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-[#0e6efe] text-white text-[13px] font-bold hover:bg-[#0a57cc] transition-colors">
                  Visa resultat
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Main Page ── */
interface Props {
  onBackHome: () => void;
  onBuyCar: (make: string, model: string) => void;
}

export default function ExploreCarsPage({ onBackHome, onBuyCar }: Props) {
  const { cars, loading } = useCatalogCars();

  const [search, setSearch] = useState('');
  const [selectedFuels, setSelectedFuels] = useState<Set<string>>(new Set());
  const [selectedBodies, setSelectedBodies] = useState<Set<string>>(new Set());
  const [maxBudget, setMaxBudget] = useState(30000);
  const [sort, setSort] = useState('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function toggleFuel(f: string) {
    setSelectedFuels(prev => { const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n; });
    setVisibleCount(24);
  }

  function toggleBody(b: string) {
    setSelectedBodies(prev => { const n = new Set(prev); n.has(b) ? n.delete(b) : n.add(b); return n; });
    setVisibleCount(24);
  }

  function resetFilters() {
    setSelectedFuels(new Set());
    setSelectedBodies(new Set());
    setMaxBudget(30000);
    setSearch('');
    setVisibleCount(24);
  }

  const hasFilters = selectedFuels.size > 0 || selectedBodies.size > 0 || maxBudget < 30000 || search.length > 0;
  const activeFilterCount = selectedFuels.size + selectedBodies.size + (maxBudget < 30000 ? 1 : 0);

  const filtered = useMemo(() => {
    let list = [...cars];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => `${c.make} ${c.model}`.toLowerCase().includes(q));
    }
    if (selectedFuels.size > 0) {
      list = list.filter(c => (c.fuel_types ?? []).some(f => selectedFuels.has(f)));
    }
    if (selectedBodies.size > 0) {
      list = list.filter(c => c.body_type && selectedBodies.has(c.body_type));
    }
    if (maxBudget < 30000) {
      list = list.filter(c => {
        if (!c.price_new_from) return true;
        return calcCarMonthlyRange(c.price_new_from, c.price_used_from ?? undefined).low <= maxBudget;
      });
    }

    if (sort === 'price_asc') {
      list.sort((a, b) => (a.price_used_from ?? a.price_new_from ?? 9e9) - (b.price_used_from ?? b.price_new_from ?? 9e9));
    } else if (sort === 'price_desc') {
      list.sort((a, b) => (b.price_new_from ?? 0) - (a.price_new_from ?? 0));
    } else if (sort === 'rating_desc') {
      list.sort((a, b) => (b.rating_overall ?? 0) - (a.rating_overall ?? 0));
    } else if (sort === 'name_asc') {
      list.sort((a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`, 'sv'));
    }

    return list;
  }, [cars, search, selectedFuels, selectedBodies, maxBudget, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={onBackHome}
            className="shrink-0 p-1 -ml-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-8 w-auto object-contain" />
          </button>

          {/* Search */}
          <div className="flex-1 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Sök märke eller modell…"
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(24); }}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-100 text-[13px] text-slate-800 placeholder-slate-400 border border-transparent focus:border-[#0e6efe] focus:bg-white focus:outline-none transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Mobile filter */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="sm:hidden relative flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full bg-[#0e6efe] text-white text-[9px] font-bold flex items-center justify-center px-1">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Desktop sort */}
            <div ref={sortRef} className="hidden sm:block relative">
              <button
                onClick={() => setShowSortMenu(v => !v)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 hover:border-[#0e6efe] hover:text-[#0e6efe] transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {SORT_OPTIONS.find(o => o.value === sort)?.label}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                  >
                    {SORT_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => { setSort(o.value); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-blue-50 transition-colors ${
                          sort === o.value ? 'font-bold text-[#0e6efe] bg-blue-50' : 'text-slate-700'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop filter icon */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 hover:border-[#0e6efe] hover:text-[#0e6efe] transition-colors relative"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-[#0e6efe] text-white text-[9px] font-bold flex items-center justify-center px-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-10">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h1 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900 leading-tight">
              Utforska bilar
            </h1>
            <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5">
              {loading ? 'Laddar…' : `${filtered.length} modeller att utforska`}
            </p>
          </div>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-[12px] font-semibold text-[#0e6efe] hover:underline shrink-0"
            >
              <X className="w-3.5 h-3.5" /> Rensa filter
            </button>
          )}
        </div>

        {/* Desktop filter chips */}
        <div className="hidden sm:flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drivmedel:</span>
          {FUEL_TYPES.map(f => (
            <FilterChip key={f} label={FUEL_LABELS[f]} active={selectedFuels.has(f)} onClick={() => toggleFuel(f)} />
          ))}
          <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Karosseri:</span>
          {BODY_TYPES.map(b => (
            <FilterChip key={b} label={BODY_LABELS[b] ?? b} active={selectedBodies.has(b)} onClick={() => toggleBody(b)} />
          ))}
        </div>

        {/* Budget slider (desktop) */}
        <div className="hidden sm:flex items-center gap-4 mb-5 bg-white rounded-xl px-5 py-3 border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide shrink-0">
            Max månadsbudget:
          </span>
          <input
            type="range" min={2000} max={30000} step={500}
            value={maxBudget}
            onChange={e => { setMaxBudget(Number(e.target.value)); setVisibleCount(24); }}
            className="flex-1 accent-[#0e6efe]"
          />
          <span className="text-[13px] font-bold text-[#0e6efe] w-28 text-right shrink-0">
            {maxBudget === 30000 ? 'Alla priser' : `${fmt(maxBudget)} kr/mån`}
          </span>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-[13px] text-slate-400">Laddar bilkatalog…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Car className="w-12 h-12 text-slate-200" />
            <p className="text-[15px] font-semibold text-slate-500">Inga bilar matchade ditt filter</p>
            <button onClick={resetFilters} className="px-5 py-2.5 rounded-xl bg-[#0e6efe] text-white text-[13px] font-bold">
              Rensa filter
            </button>
          </div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
            >
              <AnimatePresence>
                {visible.map(car => (
                  <CarCard
                    key={car.id}
                    car={car}
                    onBuy={() => onBuyCar(car.make, car.model)}
                    onDetail={() => onBuyCar(car.make, car.model)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount(v => v + 24)}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:border-[#0e6efe] hover:text-[#0e6efe] transition-all shadow-sm"
                >
                  Visa fler bilar ({filtered.length - visibleCount} kvar)
                </button>
              </div>
            )}

            <p className="text-center text-[11px] text-slate-300 mt-6">
              Visar {Math.min(visibleCount, filtered.length)} av {filtered.length} modeller
            </p>
          </>
        )}
      </div>

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        selectedFuels={selectedFuels}
        toggleFuel={toggleFuel}
        selectedBodies={selectedBodies}
        toggleBody={toggleBody}
        maxBudget={maxBudget}
        setMaxBudget={n => { setMaxBudget(n); setVisibleCount(24); }}
        onReset={resetFilters}
      />

      <SiteFooter />
    </div>
  );
}
