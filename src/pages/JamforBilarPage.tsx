import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, Star, ArrowRight, Search, Zap, Fuel, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllComparisonCars } from '../lib/comparison';
import type { ComparisonCar } from '../lib/comparison/types';
import { calcMonthlyTCO } from '../lib/utils';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta } from '../lib/pageMeta';

interface JamforBilarPageProps {
  onBack: () => void;
  onNavigateBuy: (bil?: string) => void;
  initialIds?: string[];
}

const MAX_CARS = 3;

const ALL_CARS = getAllComparisonCars();

function fmt(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

function fmtPrice(n?: number) {
  if (!n) return '–';
  return fmt(n) + ' kr';
}

function ratingColor(v: number) {
  if (v >= 8.5) return 'text-emerald-600';
  if (v >= 7) return 'text-[#0e6efe]';
  if (v >= 5.5) return 'text-amber-600';
  return 'text-red-500';
}

function ratingBg(v: number) {
  if (v >= 8.5) return 'bg-emerald-50 border-emerald-200';
  if (v >= 7) return 'bg-blue-50 border-blue-200';
  if (v >= 5.5) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

const FUEL_LABELS: Record<string, string> = {
  bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid',
  mildhybrid: 'Mildhybrid', laddhybrid: 'Laddhybrid', el: 'El',
};
const BODY_LABELS: Record<string, string> = {
  sedan: 'Sedan', kombi: 'Kombi', suv: 'SUV', coupe: 'Coupé',
  hatchback: 'Halvkombi', cab: 'Cab', mpv: 'MPV',
};

function CarPicker({ onSelect, exclude }: { onSelect: (c: ComparisonCar) => void; exclude: Set<string> }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return ALL_CARS
      .filter(c => c.is_active && !exclude.has(c.id))
      .filter(c => !q || `${c.brand_display} ${c.model_display}`.toLowerCase().includes(term))
      .slice(0, 30);
  }, [q, exclude]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Sök märke eller modell…"
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30"
        />
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
        {filtered.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className="w-full text-left px-3 py-2.5 hover:bg-[#0e6efe]/5 transition flex items-center gap-2"
          >
            <span className="text-[13px] font-semibold text-slate-800">{c.brand_display} {c.model_display}</span>
            <span className="text-[11px] text-slate-400">{FUEL_LABELS[c.specs.fuel_types[0]] ?? c.specs.fuel_types[0]}</span>
            <span className="ml-auto text-[11px] text-[#0e6efe] font-semibold">{c.ratings.overall}/10</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-[12px] text-slate-400 px-3 py-3">Inga bilar matchade sökningen.</p>}
      </div>
    </div>
  );
}

function AddCarSlot({ onPick, exclude }: { onPick: (c: ComparisonCar) => void; exclude: Set<string> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex-1 min-w-[220px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0e6efe] hover:bg-[#0e6efe]/3 transition flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-[#0e6efe]"
      >
        <div className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center">
          <span className="text-[18px] font-bold leading-none">+</span>
        </div>
        <span className="text-[12px] font-semibold">Lägg till bil</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-10"
          >
            <CarPicker
              exclude={exclude}
              onSelect={c => { onPick(c); setOpen(false); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type SectionKey = 'ratings' | 'tco' | 'specs' | 'proscons';

export default function JamforBilarPage({ onBack, onNavigateBuy, initialIds = [] }: JamforBilarPageProps) {
  setPageMeta({
    title: 'Jämför bilar sida vid sida | Bilto',
    description: 'Jämför upp till 3 bilar sida vid sida – betyg, ägandekostnader, specifikationer och expertanalys.',
  });

  const initCars = useMemo(() =>
    initialIds.flatMap(id => ALL_CARS.filter(c => c.id === id)).slice(0, MAX_CARS),
    [initialIds],
  );

  const [cars, setCars] = useState<ComparisonCar[]>(initCars);
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(['ratings', 'tco', 'specs', 'proscons']));

  const excludeIds = useMemo(() => new Set(cars.map(c => c.id)), [cars]);
  const canAdd = cars.length < MAX_CARS;

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

  const colW = cars.length === 1 ? 'flex-1' : cars.length === 2 ? 'flex-1' : 'flex-1 min-w-0';

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-900 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-10 w-auto object-contain" />
          <span className="text-[14px] font-bold text-slate-800 ml-1">Jämför bilar</span>
          {cars.length > 0 && (
            <button
              type="button"
              onClick={() => setCars([])}
              className="ml-auto flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-900 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rensa
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-[24px] sm:text-[32px] font-extrabold text-slate-900 mb-2">Jämför bilar sida vid sida</h1>
          <p className="text-[14px] sm:text-[16px] text-slate-500">Välj upp till {MAX_CARS} bilar och jämför betyg, kostnader och specifikationer.</p>
        </div>

        {/* Car picker row */}
        <div className="flex gap-3 flex-wrap mb-8">
          {cars.map((c, i) => (
            <div key={c.id} className={`${colW} relative bg-white rounded-2xl border border-slate-200 shadow-sm p-4`}>
              <button
                onClick={() => setCars(prev => prev.filter((_, j) => j !== i))}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-400 flex items-center justify-center transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Bil {i + 1}</p>
              <p className="text-[16px] font-extrabold text-slate-900 leading-tight pr-6">{c.brand_display}</p>
              <p className="text-[14px] font-semibold text-slate-600">{c.model_display}</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {c.specs.fuel_types.includes('el') && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-semibold">
                    <Zap className="w-2.5 h-2.5" /> El
                  </span>
                )}
                <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-medium">{BODY_LABELS[c.specs.body_type] ?? c.specs.body_type}</span>
                {c.pricing.new_from_sek && (
                  <span className="text-[10px] text-slate-400">{fmt(c.pricing.new_from_sek)} kr</span>
                )}
              </div>
            </div>
          ))}
          {canAdd && (
            <div className={colW}>
              <AddCarSlot exclude={excludeIds} onPick={c => setCars(prev => [...prev, c])} />
            </div>
          )}
        </div>

        {cars.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-[16px] font-semibold">Välj bilar ovan för att börja jämföra.</p>
          </div>
        )}

        {cars.length >= 2 && (
          <div className="space-y-4">
            {/* ─── Ratings ─── */}
            <CompareSection
              title="Betyg"
              sectionKey="ratings"
              open={openSections.has('ratings')}
              onToggle={() => toggleSection('ratings')}
            >
              {ratingKeys.map(({ key, label }) => {
                const vals = cars.map(c => c.ratings[key]);
                const best = Math.max(...vals);
                return (
                  <CompareRow key={key} label={label}>
                    {vals.map((v, i) => (
                      <div key={i} className={`flex-1 flex flex-col items-center gap-1 px-2 py-3 ${v === best && cars.length > 1 ? 'bg-emerald-50 rounded-xl' : ''}`}>
                        <span className={`text-[22px] font-extrabold tabular-nums ${ratingColor(v)}`}>{v.toFixed(1)}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <div key={s} className={`w-1.5 h-1.5 rounded-full ${v >= s * 2 ? 'bg-current' : 'bg-slate-200'} ${ratingColor(v)}`} />
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
            </CompareSection>

            {/* ─── TCO ─── */}
            <CompareSection
              title="Uppskattad ägandekostnad / mån"
              sectionKey="tco"
              open={openSections.has('tco')}
              onToggle={() => toggleSection('tco')}
            >
              {tcoKeys.map(({ key, label }) => {
                const vals = tcos.map(t => t[key] as number);
                const best = Math.min(...vals);
                const isTotal = key === 'total';
                return (
                  <CompareRow key={key} label={label} highlight={isTotal}>
                    {vals.map((v, i) => (
                      <div key={i} className={`flex-1 text-center px-2 py-3 ${v === best && cars.length > 1 ? 'bg-emerald-50 rounded-xl' : ''}`}>
                        <span className={`${isTotal ? 'text-[18px] font-extrabold' : 'text-[15px] font-semibold'} tabular-nums text-slate-800`}>
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
                  <div key={i} className="flex-1 text-center py-3">
                    <span className="text-[14px] font-semibold text-slate-700">{fmtPrice(c.pricing.new_from_sek)}</span>
                  </div>
                ))}
              </CompareRow>
              <CompareRow label="Begagnat från">
                {cars.map((c, i) => (
                  <div key={i} className="flex-1 text-center py-3">
                    <span className="text-[14px] font-semibold text-slate-700">{fmtPrice(c.pricing.used_from_sek)}</span>
                  </div>
                ))}
              </CompareRow>
            </CompareSection>

            {/* ─── Specs ─── */}
            <CompareSection
              title="Specifikationer"
              sectionKey="specs"
              open={openSections.has('specs')}
              onToggle={() => toggleSection('specs')}
            >
              <CompareRow label="Kaross">
                {cars.map((c, i) => (
                  <Cell key={i}>{BODY_LABELS[c.specs.body_type] ?? c.specs.body_type}</Cell>
                ))}
              </CompareRow>
              <CompareRow label="Drivmedel">
                {cars.map((c, i) => (
                  <Cell key={i}>{c.specs.fuel_types.map(f => FUEL_LABELS[f] ?? f).join(', ')}</Cell>
                ))}
              </CompareRow>
              <CompareRow label="Drivlina">
                {cars.map((c, i) => (
                  <Cell key={i}>{c.specs.drivetrain.map(d => d.toUpperCase()).join(', ')}</Cell>
                ))}
              </CompareRow>
              <CompareRow label="Sittplatser">
                {cars.map((c, i) => (
                  <Cell key={i}>{c.specs.seats} pers</Cell>
                ))}
              </CompareRow>
              <CompareRow label="Bagageutrymme">
                {cars.map((c, i) => (
                  <Cell key={i}>{c.specs.trunk_liters ? `${c.specs.trunk_liters} L` : '–'}</Cell>
                ))}
              </CompareRow>
              <CompareRow label="Max bagageutrymme">
                {cars.map((c, i) => (
                  <Cell key={i}>{c.specs.trunk_liters_max ? `${c.specs.trunk_liters_max} L` : '–'}</Cell>
                ))}
              </CompareRow>
              <CompareRow label="Euro NCAP">
                {cars.map((c, i) => (
                  <Cell key={i}>
                    {c.safety.euro_ncap_stars ? (
                      <span className="flex items-center gap-0.5 justify-center">
                        {Array.from({ length: c.safety.euro_ncap_stars }).map((_, s) => (
                          <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                    ) : '–'}
                  </Cell>
                ))}
              </CompareRow>
            </CompareSection>

            {/* ─── Pros & Cons ─── */}
            <CompareSection
              title="Plus & minus"
              sectionKey="proscons"
              open={openSections.has('proscons')}
              onToggle={() => toggleSection('proscons')}
            >
              <div className="grid gap-0" style={{ gridTemplateColumns: `auto repeat(${cars.length}, 1fr)` }}>
                {/* Header row */}
                <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100" />
                {cars.map((c, i) => (
                  <div key={i} className="px-3 py-2 text-center text-[12px] font-bold text-slate-700 border-b border-slate-100 bg-slate-50">
                    {c.brand_display} {c.model_display}
                  </div>
                ))}

                {/* Pros */}
                <div className="px-3 py-2 text-[11px] font-semibold text-emerald-700 border-b border-slate-50 flex items-start gap-1 whitespace-nowrap">
                  <span className="mt-0.5">+</span> Fördelar
                </div>
                {cars.map((c, i) => (
                  <div key={i} className="px-3 py-2 border-b border-slate-50">
                    <ul className="space-y-1">
                      {c.pros.map((p, j) => (
                        <li key={j} className="text-[11px] text-slate-700 flex items-start gap-1">
                          <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Cons */}
                <div className="px-3 py-2 text-[11px] font-semibold text-red-600 flex items-start gap-1 whitespace-nowrap">
                  <span className="mt-0.5">−</span> Nackdelar
                </div>
                {cars.map((c, i) => (
                  <div key={i} className="px-3 py-2">
                    <ul className="space-y-1">
                      {c.cons.map((p, j) => (
                        <li key={j} className="text-[11px] text-slate-700 flex items-start gap-1">
                          <span className="text-red-400 mt-0.5 shrink-0">✗</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CompareSection>

            {/* CTA */}
            <div className="bg-[#0e6efe] rounded-2xl p-6 sm:p-8 text-center">
              <h2 className="text-[20px] font-extrabold text-white mb-2">Redo att ta nästa steg?</h2>
              <p className="text-[14px] text-white/80 mb-5 max-w-lg mx-auto">Låt en bilexpert hjälpa dig välja rätt och förhandla bästa pris – helt kostnadsfritt.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {cars.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onNavigateBuy(`${c.brand_display} ${c.model_display}`)}
                    className="inline-flex items-center gap-2 bg-white text-[#0e6efe] font-bold text-[13px] px-5 h-11 rounded-xl hover:bg-slate-50 transition"
                  >
                    Få hjälp med {c.model_display}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {cars.length === 1 && (
          <div className="text-center py-8 text-slate-400">
            <Fuel className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-[14px]">Lägg till ytterligare en bil för att börja jämföra.</p>
          </div>
        )}
      </div>

      <SiteFooter onNavigate={() => onBack()} />
    </div>
  );
}

/* ─── Section wrapper ─── */
function CompareSection({
  title, sectionKey, open, onToggle, children,
}: {
  title: string; sectionKey: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
      >
        <span className="text-[15px] font-bold text-slate-900">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 divide-y divide-slate-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Row with label column ─── */
function CompareRow({ label, children, highlight = false }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex items-stretch ${highlight ? 'bg-slate-50' : ''}`}>
      <div className="w-28 sm:w-36 shrink-0 px-4 py-3 flex items-center">
        <span className={`text-[11px] font-semibold ${highlight ? 'text-slate-700' : 'text-slate-500'} uppercase tracking-wide leading-tight`}>
          {label}
        </span>
      </div>
      <div className="flex flex-1 divide-x divide-slate-100">
        {children}
      </div>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 text-center px-2 py-3 flex items-center justify-center">
      <span className="text-[13px] font-semibold text-slate-700">{children}</span>
    </div>
  );
}
