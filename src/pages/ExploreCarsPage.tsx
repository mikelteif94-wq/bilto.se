import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import {
  Search, X, ChevronDown,
  Car, ChevronRight, Users, Filter, ArrowUpDown, Loader2,
  Handshake, ArrowLeftRight, ArrowRight,
} from 'lucide-react';
import { useCatalogCars, type CatalogCarFull } from '../hooks/useCatalogCars';
import { calcCarMonthlyRange } from '../lib/utils';
import { SiteFooter } from '../components/SiteFooter';
import { motion, AnimatePresence } from 'framer-motion';
import type { DetailCarData } from '../components/quiz/CarDetailSheet';

const CarDetailSheet = lazy(() =>
  import('../components/quiz/CarDetailSheet').then(m => ({ default: m.CarDetailSheet }))
);

/* ─── helpers ─── */

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

/* ─── ScoreBadge ─── */

function ScoreBadge({ value }: { value: number }) {
  const color = value >= 9 ? '#059669' : value >= 7.5 ? '#0e6efe' : '#d97706';
  return (
    <div
      className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
      style={{
        border: `2px solid ${color}`,
        boxShadow: `0 2px 8px ${color}30`,
        backgroundColor: 'rgba(255,255,255,0.93)',
      }}
    >
      <span className="text-[11px] font-extrabold tabular-nums leading-none" style={{ color }}>
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </span>
    </div>
  );
}

/* ─── CarCard ─── */

function CarCard({ car, onBuy, onDetail }: { car: CatalogCarFull; onBuy: () => void; onDetail: () => void }) {
  const img = car.cleaned_image_url || car.image_url;
  const range = car.price_new_from ? calcCarMonthlyRange(car.price_new_from, car.price_used_from ?? undefined) : null;
  const bodyLabel = car.body_type ? (BODY_LABELS[car.body_type] ?? car.body_type) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className="group relative bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-250"
    >
      {/* Image */}
      <div
        className="relative aspect-[4/3] bg-gradient-to-b from-slate-50 to-white overflow-hidden rounded-t-2xl cursor-pointer"
        onClick={onDetail}
      >
        {img ? (
          <img
            src={img}
            alt={`${car.make} ${car.model}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain p-3 transition-transform duration-400 group-hover:scale-[1.04]"
            onError={(e) => {
              e.currentTarget.src = '/car-placeholder.svg';
              e.currentTarget.className = 'w-full h-full object-contain p-6 opacity-30';
            }}
          />
        ) : (
          <img src="/car-placeholder.svg" alt="" className="w-full h-full object-contain p-6 opacity-30" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />

        {car.rating_overall != null && <ScoreBadge value={car.rating_overall} />}
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4">
        <div className="cursor-pointer" onClick={onDetail}>
          <h3 className="text-[14px] font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
            {car.make} {car.model}
          </h3>

          <div className="mt-1.5 flex flex-wrap gap-1">
            {bodyLabel && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                {bodyLabel}
              </span>
            )}
            {car.drivetrain_type?.toLowerCase().includes('awd') && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">AWD</span>
            )}
            {car.seats != null && car.seats > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 inline-flex items-center gap-0.5">
                <Users className="w-2.5 h-2.5" />{car.seats}
              </span>
            )}
          </div>

          {car.expert_comment && (
            <p className="mt-1.5 text-[11px] text-slate-400 line-clamp-2 leading-snug italic">
              {car.expert_comment}
            </p>
          )}

          {range && (
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[17px] font-extrabold tabular-nums leading-none text-blue-600">
                {fmt(range.low)}–{fmt(range.high)}
              </span>
              <span className="text-[10px] font-semibold text-blue-400">kr/mån</span>
            </div>
          )}
          {car.price_used_from && !range && (
            <div className="mt-2">
              <span className="text-[15px] font-extrabold text-slate-800">{fmt(car.price_used_from)}</span>
              <span className="text-[10px] text-slate-400 ml-1">kr begagnat</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onBuy(); }}
          className="mt-3 w-full h-10 rounded-xl text-white text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #1a7fff 0%, #0e6efe 60%, #0a57cc 100%)',
            boxShadow: '0 3px 12px rgba(14,110,254,0.28)',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 5px 18px rgba(14,110,254,0.42)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 3px 12px rgba(14,110,254,0.28)')}
        >
          Få hjälp att köpa <ChevronRight className="w-3.5 h-3.5 opacity-80" />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── FilterChip ─── */

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all duration-150 whitespace-nowrap ${
        active
          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
      }`}
    >
      {label}
    </button>
  );
}

/* ─── MobilFilterDrawer ─── */

function MobileFilterDrawer({
  open,
  onClose,
  selectedFuels,
  toggleFuel,
  selectedBodies,
  toggleBody,
  maxBudget,
  setMaxBudget,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  selectedFuels: Set<string>;
  toggleFuel: (f: string) => void;
  selectedBodies: Set<string>;
  toggleBody: (b: string) => void;
  maxBudget: number;
  setMaxBudget: (n: number) => void;
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
              <span className="font-bold text-slate-900">Filter</span>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="px-5 pb-8 pt-4 space-y-6">
              {/* Fuel */}
              <div>
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Drivmedel</p>
                <div className="flex flex-wrap gap-2">
                  {FUEL_TYPES.map(f => (
                    <FilterChip key={f} label={FUEL_LABELS[f]} active={selectedFuels.has(f)} onClick={() => toggleFuel(f)} />
                  ))}
                </div>
              </div>
              {/* Body */}
              <div>
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Karosseri</p>
                <div className="flex flex-wrap gap-2">
                  {BODY_TYPES.map(b => (
                    <FilterChip key={b} label={BODY_LABELS[b] ?? b} active={selectedBodies.has(b)} onClick={() => toggleBody(b)} />
                  ))}
                </div>
              </div>
              {/* Budget */}
              <div>
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Max månadsbudget: {maxBudget === 30000 ? 'Alla' : `${fmt(maxBudget)} kr/mån`}
                </p>
                <input
                  type="range" min={2000} max={30000} step={500}
                  value={maxBudget}
                  onChange={e => setMaxBudget(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>2 000</span><span>Alla</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={onReset} className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold">
                  Rensa filter
                </button>
                <button onClick={onClose} className="flex-1 h-10 rounded-xl text-white text-[13px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #1a7fff 0%, #0e6efe 100%)' }}>
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

/* ─── IntentSheet ─── */

function IntentSheet({
  car,
  onClose,
  onChoose,
}: {
  car: CatalogCarFull | null;
  onClose: () => void;
  onChoose: (track: 'found' | 'searching' | 'trade') => void;
}) {
  const name = car ? `${car.make} ${car.model}` : 'bil';

  return (
    <AnimatePresence>
      {car && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl"
          >
            <div className="px-5 pt-5 pb-safe-bottom">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[17px] font-bold text-slate-900">Välj hur vi kan hjälpa dig</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <p className="text-[13px] text-slate-400 mb-4">Välj det som passar dig bäst.</p>

              <div className="space-y-2.5 pb-6">
                <button
                  type="button"
                  onClick={() => onChoose('found')}
                  className="group w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-400/50 hover:bg-blue-50/50 active:scale-[0.99] transition-all duration-150 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
                    <Handshake className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900 leading-snug">Jag har hittat en {name}</p>
                    <p className="text-[12.5px] text-slate-400 mt-0.5 leading-snug">Vi förhandlar med säljaren åt dig och pressar priset.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => onChoose('searching')}
                  className="group w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-400/50 hover:bg-blue-50/50 active:scale-[0.99] transition-all duration-150 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
                    <Search className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900 leading-snug">Jag letar efter en {name}</p>
                    <p className="text-[12.5px] text-slate-400 mt-0.5 leading-snug">Vi hittar, kollar och förhandlar åt dig.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => onChoose('trade')}
                  className="group w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-400/50 hover:bg-blue-50/50 active:scale-[0.99] transition-all duration-150 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
                    <ArrowLeftRight className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900 leading-snug">Jag vill byta in</p>
                    <p className="text-[12.5px] text-slate-400 mt-0.5 leading-snug">Vi sköter inbytet och hjälper dig hitta ny bil.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Page ─── */

interface Props {
  onBackHome: () => void;
  onBuyCar: (make: string, model: string, typ?: string) => void;
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
  const [intentCar, setIntentCar] = useState<CatalogCarFull | null>(null);
  const [detailCar, setDetailCar] = useState<DetailCarData | null>(null);

  const sortRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close sort menu on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function toggleFuel(f: string) {
    setSelectedFuels(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
    setVisibleCount(24);
  }

  function toggleBody(b: string) {
    setSelectedBodies(prev => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b); else next.add(b);
      return next;
    });
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
      list = list.filter(c => {
        const fuels = c.fuel_types ?? [];
        return fuels.some(f => selectedFuels.has(f));
      });
    }

    if (selectedBodies.size > 0) {
      list = list.filter(c => c.body_type && selectedBodies.has(c.body_type));
    }

    if (maxBudget < 30000) {
      list = list.filter(c => {
        if (!c.price_new_from) return true;
        const range = calcCarMonthlyRange(c.price_new_from, c.price_used_from ?? undefined);
        return range.low <= maxBudget;
      });
    }

    // Sort
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
    <div className="min-h-screen" style={{ background: '#f8f9fc' }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 border-b border-slate-100"
        style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={onBackHome} className="shrink-0 p-1.5 -ml-1 rounded-lg hover:bg-slate-100 transition-colors">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-8 w-auto object-contain"
            />
          </button>

          {/* Search bar */}
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Sök märke eller modell…"
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(24); }}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-100 text-[13px] text-slate-800 placeholder-slate-400 border border-transparent focus:border-blue-300 focus:bg-white focus:outline-none transition-all duration-150"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="sm:hidden relative flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 hover:border-blue-300"
          >
            <Filter className="w-4 h-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort (desktop) */}
          <div ref={sortRef} className="hidden sm:block relative">
            <button
              onClick={() => setShowSortMenu(v => !v)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 hover:border-blue-300 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {SORT_OPTIONS.find(o => o.value === sort)?.label}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                >
                  {SORT_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => { setSort(o.value); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-blue-50 transition-colors ${
                        sort === o.value ? 'font-bold text-blue-600 bg-blue-50' : 'text-slate-700'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Hero row ── */}
        <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              Utforska bilar
            </h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {loading ? 'Laddar…' : `${filtered.length} modeller – välj din nästa bil`}
            </p>
          </div>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:underline mt-1"
            >
              <X className="w-3.5 h-3.5" /> Rensa filter
            </button>
          )}
        </div>

        {/* ── Desktop filter bar ── */}
        <div className="hidden sm:flex flex-wrap items-center gap-2 mb-6">
          {/* Fuel chips */}
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mr-1">Drivmedel:</span>
          {FUEL_TYPES.map(f => (
            <FilterChip key={f} label={FUEL_LABELS[f]} active={selectedFuels.has(f)} onClick={() => toggleFuel(f)} />
          ))}
          <span className="ml-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide mr-1">Karosseri:</span>
          {BODY_TYPES.map(b => (
            <FilterChip key={b} label={BODY_LABELS[b] ?? b} active={selectedBodies.has(b)} onClick={() => toggleBody(b)} />
          ))}
        </div>

        {/* ── Budget slider (desktop) ── */}
        <div className="hidden sm:flex items-center gap-4 mb-6 bg-white rounded-xl px-5 py-3.5 border border-slate-100 shadow-sm">
          <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wide shrink-0">
            Max månadsbudget:
          </span>
          <input
            type="range" min={2000} max={30000} step={500}
            value={maxBudget}
            onChange={e => { setMaxBudget(Number(e.target.value)); setVisibleCount(24); }}
            className="flex-1 accent-blue-600"
          />
          <span className="text-[13px] font-bold text-blue-700 w-28 text-right shrink-0">
            {maxBudget === 30000 ? 'Alla priser' : `${fmt(maxBudget)} kr/mån`}
          </span>
        </div>

        {/* ── Results ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-[13px] text-slate-400">Laddar bilkatalog…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Car className="w-12 h-12 text-slate-200" />
            <p className="text-[15px] font-semibold text-slate-500">Inga bilar matchade ditt filter</p>
            <button onClick={resetFilters} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold">
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
                    onBuy={() => setIntentCar(car)}
                    onDetail={() => {
                      const img = car.cleaned_image_url || car.image_url;
                      setDetailCar({
                        make: car.make,
                        model: car.model,
                        image_url: img,
                        matchScore: car.rating_overall ? car.rating_overall * 10 : 70,
                        matchReasons: car.strengths?.slice(0, 3) ?? [],
                        bodyType: car.body_type ?? undefined,
                        fuelType: car.fuel_types?.[0] ?? undefined,
                        seats: car.seats ?? undefined,
                        cargo: car.baggage_liters ? `${car.baggage_liters} l` : undefined,
                        rating: car.rating_overall ?? undefined,
                        usedPrice: car.price_used_from ?? undefined,
                      });
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount(v => v + 24)}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 shadow-sm"
                >
                  Visa fler bilar ({filtered.length - visibleCount} kvar)
                </button>
              </div>
            )}

            <p className="text-center text-[11px] text-slate-300 mt-8">
              Visar {Math.min(visibleCount, filtered.length)} av {filtered.length} modeller
            </p>
          </>
        )}
      </div>

      {/* ── Mobile filter drawer ── */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        selectedFuels={selectedFuels}
        toggleFuel={toggleFuel}
        selectedBodies={selectedBodies}
        toggleBody={toggleBody}
        maxBudget={maxBudget}
        setMaxBudget={(n) => { setMaxBudget(n); setVisibleCount(24); }}
        onReset={resetFilters}
      />

      <IntentSheet
        car={intentCar}
        onClose={() => setIntentCar(null)}
        onChoose={(track) => {
          if (!intentCar) return;
          setIntentCar(null);
          onBuyCar(intentCar.make, intentCar.model, track);
        }}
      />

      <Suspense fallback={null}>
        {detailCar && (
          <CarDetailSheet
            car={detailCar}
            onClose={() => setDetailCar(null)}
            onSelect={() => {
              const car = detailCar;
              setDetailCar(null);
              const catalogCar = cars.find(c => c.make === car.make && c.model === car.model);
              if (catalogCar) setIntentCar(catalogCar);
              else onBuyCar(car.make, car.model, 'found');
            }}
          />
        )}
      </Suspense>

      <SiteFooter />
    </div>
  );
}
