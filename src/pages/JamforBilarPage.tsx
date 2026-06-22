import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, Star, ArrowRight, Search, Zap, RotateCcw, Plus, Columns2, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllComparisonCars } from '../lib/comparison';
import type { ComparisonCar } from '../lib/comparison/types';
import { calcMonthlyTCO } from '../lib/utils';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta } from '../lib/pageMeta';
import { useCatalogCars } from '../hooks/useCatalogCars';
import { useCarImages } from '../hooks/useCarImages';

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
function fmtPrice(n?: number) {
  if (!n) return '–';
  return fmt(n) + ' kr';
}
function ratingColor(v: number) {
  if (v >= 8.5) return 'text-emerald-400';
  if (v >= 7) return 'text-[#60a5fa]';
  if (v >= 5.5) return 'text-amber-400';
  return 'text-red-400';
}

const FUEL_LABELS: Record<string, string> = {
  bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid',
  mildhybrid: 'Mildhybrid', laddhybrid: 'Laddhybrid', el: 'El',
};
const BODY_LABELS: Record<string, string> = {
  sedan: 'Sedan', kombi: 'Kombi', suv: 'SUV', coupe: 'Coupé',
  hatchback: 'Halvkombi', cab: 'Cab', mpv: 'MPV',
};

const CARD_GRADIENTS = [
  'from-[#0e6efe] to-[#0a57cc]',
  'from-[#0e1c2f] to-[#1e3a5f]',
  'from-[#374151] to-[#1f2937]',
];

function CarPicker({ onSelect, exclude, getCarImage }: {
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
        {filtered.map(c => {
          const img = resolveImage(c.id, c.brand_display, c.model_display, getCarImage);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className="w-full text-left px-3 py-2.5 hover:bg-[#0e6efe]/5 transition flex items-center gap-3"
            >
              {img ? (
                <img src={img} alt="" className="w-10 h-7 object-contain shrink-0 rounded" />
              ) : (
                <div className="w-10 h-7 rounded bg-slate-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-semibold text-slate-800">{c.brand_display} {c.model_display}</span>
                <span className="text-[11px] text-slate-400 ml-2">{FUEL_LABELS[c.specs.fuel_types[0]] ?? c.specs.fuel_types[0]}</span>
              </div>
              <span className="text-[12px] text-[#0e6efe] font-bold tabular-nums shrink-0">{c.ratings.overall}/10</span>
            </button>
          );
        })}
        {filtered.length === 0 && <p className="text-[12px] text-slate-400 px-3 py-3">Inga bilar matchade sökningen.</p>}
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
  const [pickerOpenIdx, setPickerOpenIdx] = useState<number | null>(null);

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

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Nav — matches site style */}
      <nav className="sticky top-0 z-40" style={{
        background: 'linear-gradient(180deg, #0a57cc 0%, #0e6efe 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(10,87,204,0.28)',
      }}>
        <div className="h-[2px] w-full" style={{
          background: 'linear-gradient(90deg, rgba(251,191,36,0.7) 0%, rgba(255,255,255,0.4) 40%, rgba(56,189,248,0.6) 100%)',
        }} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-white/80 hover:text-white transition text-[13px] font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-10 w-auto object-contain" />
          {cars.length > 0 && (
            <button
              type="button"
              onClick={() => setCars([])}
              className="ml-auto flex items-center gap-1.5 text-[12px] text-white/60 hover:text-white/90 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rensa
            </button>
          )}
        </div>
      </nav>

      {/* Hero — its own dark block so text is always readable */}
      <div className="bg-[#060e1e]">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-64 rounded-full opacity-25"
              style={{ background: 'radial-gradient(circle, rgba(14,110,254,0.6) 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 right-1/4 w-64 h-48 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.5) 0%, transparent 70%)' }} />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-10 sm:pt-12 sm:pb-12 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-[12px] font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/10">
              <Columns2 className="w-3.5 h-3.5" />
              Upp till 3 bilar sida vid sida
            </div>
            <h1 className="text-[26px] sm:text-[34px] lg:text-[40px] font-extrabold text-white mb-3 leading-tight">
              Jämför bilar sida vid sida
            </h1>
            <p className="text-[14px] sm:text-[16px] text-white/50 max-w-xl mx-auto">
              Välj modeller nedan och jämför betyg, ägandekostnader och specifikationer.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        {/* Car picker cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 -mt-4">
          {Array.from({ length: MAX_CARS }).map((_, i) => {
            const car = cars[i];
            const img = car ? resolveImage(car.id, car.brand_display, car.model_display, getCarImage) : undefined;
            const gradient = CARD_GRADIENTS[i];

            if (car) {
              return (
                <div key={car.id} className={`relative rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br ${gradient}`}>
                  {img && (
                    <div className="absolute inset-0 opacity-20">
                      <img src={img} alt="" className="w-full h-full object-cover object-center" />
                    </div>
                  )}
                  <div className="relative p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Bil {i + 1}</span>
                      <button
                        onClick={() => setCars(prev => prev.filter((_, j) => j !== i))}
                        className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {img && (
                      <div className="h-24 flex items-center justify-center mb-3">
                        <img src={img} alt={`${car.brand_display} ${car.model_display}`}
                          className="max-h-full max-w-full object-contain drop-shadow-lg" />
                      </div>
                    )}
                    <p className="text-[18px] font-extrabold text-white leading-tight">{car.brand_display}</p>
                    <p className="text-[14px] font-semibold text-white/70">{car.model_display}</p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {car.specs.fuel_types.includes('el') && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full px-2 py-0.5 font-semibold">
                          <Zap className="w-2.5 h-2.5" /> El
                        </span>
                      )}
                      <span className="text-[10px] bg-white/10 text-white/60 rounded-full px-2 py-0.5 font-medium">
                        {BODY_LABELS[car.specs.body_type] ?? car.specs.body_type}
                      </span>
                      {car.pricing.new_from_sek && (
                        <span className="text-[10px] text-white/50">{fmt(car.pricing.new_from_sek)} kr</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-white/50">Bilto-betyg</span>
                      <span className={`text-[18px] font-extrabold tabular-nums ${ratingColor(car.ratings.overall)}`}>
                        {car.ratings.overall.toFixed(1)}<span className="text-[12px] text-white/30">/10</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={`empty-${i}`} className="relative">
                <button
                  type="button"
                  onClick={() => setPickerOpenIdx(pickerOpenIdx === i ? null : i)}
                  className="w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0e6efe] hover:bg-[#0e6efe]/3 transition bg-white/80 backdrop-blur-sm p-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-[#0e6efe] min-h-[160px]"
                >
                  <div className="w-9 h-9 rounded-full border-2 border-current flex items-center justify-center">
                    <Plus className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[13px] font-semibold">
                    {i === 0 ? 'Välj första bilen' : `Lägg till bil ${i + 1}`}
                  </span>
                </button>
                <AnimatePresence>
                  {pickerOpenIdx === i && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-20"
                    >
                      <CarPicker
                        exclude={excludeIds}
                        getCarImage={getCarImage}
                        onSelect={c => {
                          setCars(prev => {
                            const next = [...prev];
                            next[i] = c;
                            return next.filter(Boolean) as ComparisonCar[];
                          });
                          setPickerOpenIdx(null);
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Hint: add more */}
        {cars.length === 1 && (
          <div className="text-center py-6 mb-4">
            <p className="text-[14px] text-slate-500">Lägg till ytterligare en bil ovan för att börja jämföra.</p>
          </div>
        )}

        {cars.length === 0 && (
          <div className="text-center py-12">
            <Columns2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-[16px] font-semibold text-slate-500">Välj bilar ovan för att börja jämföra.</p>
            <p className="text-[13px] text-slate-400 mt-1">Du kan jämföra upp till 3 bilar sida vid sida.</p>
          </div>
        )}

        {cars.length >= 2 && (
          <div className="space-y-4">
            {/* Ratings */}
            <CompareSection
              title="Betyg"
              sectionKey="ratings"
              open={openSections.has('ratings')}
              onToggle={() => toggleSection('ratings')}
            >
              {/* Car headers */}
              <div className="flex items-stretch border-b border-slate-100">
                <div className="w-32 sm:w-40 shrink-0" />
                {cars.map((c, i) => {
                  const img = resolveImage(c.id, c.brand_display, c.model_display, getCarImage);
                  return (
                    <div key={i} className="flex-1 px-3 py-3 text-center border-l border-slate-100 bg-slate-50/50">
                      {img && <img src={img} alt="" className="h-8 object-contain mx-auto mb-1" />}
                      <p className="text-[11px] font-bold text-slate-700">{c.brand_display}</p>
                      <p className="text-[10px] text-slate-500">{c.model_display}</p>
                    </div>
                  );
                })}
              </div>
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
                          {[1,2,3,4,5].map(s => (
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
            </CompareSection>

            {/* TCO */}
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
            </CompareSection>

            {/* Specs */}
            <CompareSection
              title="Specifikationer"
              sectionKey="specs"
              open={openSections.has('specs')}
              onToggle={() => toggleSection('specs')}
            >
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
            </CompareSection>

            {/* Pros & Cons */}
            <CompareSection
              title="Plus & minus"
              sectionKey="proscons"
              open={openSections.has('proscons')}
              onToggle={() => toggleSection('proscons')}
            >
              <div className="grid" style={{ gridTemplateColumns: `140px repeat(${cars.length}, 1fr)` }}>
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50" />
                {cars.map((c, i) => (
                  <div key={i} className="px-3 py-3 text-center text-[12px] font-bold text-slate-700 border-b border-slate-100 bg-slate-50 border-l border-slate-100">
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
                          <span className="text-emerald-500 mt-0.5 shrink-0 text-[10px]">✓</span>{p}
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
                          <span className="text-red-400 mt-0.5 shrink-0 text-[10px]">✗</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CompareSection>

            {/* CTA */}
            <div className="relative overflow-hidden rounded-2xl" style={{
              background: 'linear-gradient(135deg, #060e1e 0%, #0e1c2f 50%, #0a57cc 100%)',
            }}>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
                  style={{ background: 'radial-gradient(circle, rgba(14,110,254,0.8) 0%, transparent 70%)' }} />
              </div>
              <div className="relative p-6 sm:p-8">
                <div className="text-center mb-6">
                  <h2 className="text-[20px] sm:text-[24px] font-extrabold text-white mb-2">Redo att ta nästa steg?</h2>
                  <p className="text-[14px] text-white/60 max-w-lg mx-auto">
                    Låt en bilexpert hjälpa dig välja rätt och förhandla bästa pris – helt kostnadsfritt.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {cars.map((c, i) => {
                    const img = resolveImage(c.id, c.brand_display, c.model_display, getCarImage);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onNavigateBuy(`${c.brand_display} ${c.model_display}`)}
                        className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[13px] px-5 h-12 rounded-xl transition"
                      >
                        {img && <img src={img} alt="" className="h-7 w-10 object-contain" />}
                        <span>Hjälp med {c.model_display}</span>
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <SiteFooter onNavigate={() => onBack()} />
    </div>
  );
}

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
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />}
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

function CompareRow({ label, children, highlight = false }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex items-stretch ${highlight ? 'bg-slate-50' : ''}`}>
      <div className="w-32 sm:w-40 shrink-0 px-4 py-3 flex items-center">
        <span className={`text-[11px] font-semibold ${highlight ? 'text-slate-800' : 'text-slate-500'} uppercase tracking-wide leading-tight`}>
          {label}
        </span>
      </div>
      <div className="flex flex-1">
        {children}
      </div>
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
