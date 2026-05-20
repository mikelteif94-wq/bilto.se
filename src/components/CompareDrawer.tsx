import { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, Gauge, Armchair, Briefcase, TrendingDown,
  Shield, Car, Check, X as XIcon, ArrowRight, Fuel, Battery,
} from 'lucide-react';
import type { ComparisonCar } from '../lib/comparison/types';

interface CompareDrawerProps {
  cars: ComparisonCar[];
  open: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
  onNegotiate: (car: ComparisonCar) => void;
  getImageUrl: (car: ComparisonCar) => string | undefined;
}

const FUEL_LABELS: Record<string, string> = {
  bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid', laddhybrid: 'Laddhybrid', el: 'El',
};
const BODY_LABELS: Record<string, string> = {
  sedan: 'Sedan', kombi: 'Kombi', suv: 'SUV', coupe: 'Coupe',
  hatchback: 'Halvkombi', cab: 'Cabriolet', mpv: 'MPV',
};
const DRIVE_LABELS: Record<string, string> = {
  fwd: 'Framdrift', rwd: 'Bakdrift', awd: '4WD',
};

function formatPrice(sek: number): string {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(sek) + ' kr';
}

function RatingDot({ value, best }: { value: number; best: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-0">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`h-full rounded-full ${best ? 'bg-[#0e6efe]' : 'bg-slate-300'}`}
        />
      </div>
      <span className={`text-[12px] font-semibold tabular-nums w-5 text-right shrink-0 ${best ? 'text-[#0e6efe]' : 'text-slate-500'}`}>
        {value}
      </span>
    </div>
  );
}

export default function CompareDrawer({ cars, open, onClose, onRemove, onNegotiate, getImageUrl }: CompareDrawerProps) {
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const bestRatings = useMemo(() => {
    if (cars.length < 2) return null;
    return {
      overall: Math.max(...cars.map(c => c.ratings.overall)),
      driving: Math.max(...cars.map(c => c.ratings.driving)),
      comfort: Math.max(...cars.map(c => c.ratings.comfort)),
      practicality: Math.max(...cars.map(c => c.ratings.practicality)),
      value: Math.max(...cars.map(c => c.ratings.value)),
    };
  }, [cars]);

  // Label column width: narrower on mobile
  const labelColClass = 'w-[90px] sm:w-[140px] shrink-0';

  return (
    <AnimatePresence>
      {open && cars.length > 0 && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 max-h-[94vh] bg-white rounded-t-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">Jämförelse</h2>
                <p className="text-[11px] text-slate-400">{cars.length} bilar valda</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Scrollable content — no horizontal overflow needed */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {/* Sticky car header row */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-100 flex">
                <div className={`${labelColClass} shrink-0 px-3 py-3`} />
                {cars.map(car => (
                  <div key={car.id} className="flex-1 min-w-0 px-2 py-3 text-center">
                    <div className="relative inline-block mb-1">
                      <button
                        onClick={() => onRemove(car.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center z-10 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="w-16 h-11 sm:w-24 sm:h-16 rounded-lg bg-slate-50 overflow-hidden mx-auto">
                        {getImageUrl(car) ? (
                          <img src={getImageUrl(car)} alt={car.model_display} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-6 h-6 text-slate-200" />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] sm:text-[13px] font-bold text-slate-900 leading-tight truncate px-1">{car.brand_display}</p>
                    <p className="text-[10px] sm:text-[12px] text-slate-500 truncate px-1">{car.model_display}</p>
                  </div>
                ))}
              </div>

              {/* Sections */}
              <SectionHeader label="Betyg" />

              <CompareRow label="Totalt" icon={Star} labelColClass={labelColClass}>
                {cars.map(car => (
                  <div key={car.id} className="flex-1 min-w-0 px-2 py-2 flex justify-center">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                      bestRatings && car.ratings.overall === bestRatings.overall
                        ? 'bg-[#0e6efe] text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      <span className="text-[13px] sm:text-[14px] font-bold">{car.ratings.overall}</span>
                    </div>
                  </div>
                ))}
              </CompareRow>

              <CompareRow label="Körning" icon={Gauge} labelColClass={labelColClass}>
                {cars.map(car => (
                  <div key={car.id} className="flex-1 min-w-0 px-2 py-2">
                    <RatingDot value={car.ratings.driving} best={!!bestRatings && car.ratings.driving === bestRatings.driving} />
                  </div>
                ))}
              </CompareRow>

              <CompareRow label="Komfort" icon={Armchair} labelColClass={labelColClass}>
                {cars.map(car => (
                  <div key={car.id} className="flex-1 min-w-0 px-2 py-2">
                    <RatingDot value={car.ratings.comfort} best={!!bestRatings && car.ratings.comfort === bestRatings.comfort} />
                  </div>
                ))}
              </CompareRow>

              <CompareRow label="Praktiskt" icon={Briefcase} labelColClass={labelColClass}>
                {cars.map(car => (
                  <div key={car.id} className="flex-1 min-w-0 px-2 py-2">
                    <RatingDot value={car.ratings.practicality} best={!!bestRatings && car.ratings.practicality === bestRatings.practicality} />
                  </div>
                ))}
              </CompareRow>

              <CompareRow label="Värde" icon={TrendingDown} labelColClass={labelColClass}>
                {cars.map(car => (
                  <div key={car.id} className="flex-1 min-w-0 px-2 py-2">
                    <RatingDot value={car.ratings.value} best={!!bestRatings && car.ratings.value === bestRatings.value} />
                  </div>
                ))}
              </CompareRow>

              <SectionHeader label="Specifikationer" />

              <CompareRow label="Kaross" icon={Car} labelColClass={labelColClass}>
                {cars.map(car => (
                  <div key={car.id} className="flex-1 min-w-0 px-2 py-2 text-center">
                    <span className="text-[11px] sm:text-[13px] text-slate-700">{BODY_LABELS[car.specs.body_type] || car.specs.body_type}</span>
                  </div>
                ))}
              </CompareRow>

              <CompareRow label="Drivmedel" icon={Fuel} labelColClass={labelColClass}>
                {cars.map(car => {
                  const FuelIcon = car.specs.fuel_types.some(f => ['el', 'hybrid', 'laddhybrid'].includes(f)) ? Battery : Fuel;
                  return (
                    <div key={car.id} className="flex-1 min-w-0 px-2 py-2 text-center">
                      <div className="inline-flex items-center gap-1 flex-wrap justify-center">
                        <FuelIcon className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[10px] sm:text-[12px] text-slate-700">
                          {car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(', ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CompareRow>

              <CompareRow label="Drivlina" icon={Gauge} labelColClass={labelColClass}>
                {cars.map(car => (
                  <div key={car.id} className="flex-1 min-w-0 px-2 py-2 text-center">
                    <span className="text-[10px] sm:text-[12px] text-slate-700">
                      {car.specs.drivetrain.map(d => DRIVE_LABELS[d] || d).join(', ')}
                    </span>
                  </div>
                ))}
              </CompareRow>

              <CompareRow label="Bagage" icon={Briefcase} labelColClass={labelColClass}>
                {cars.map(car => {
                  const bestTrunk = Math.max(...cars.map(c => c.specs.trunk_liters || 0));
                  const isBest = car.specs.trunk_liters === bestTrunk && bestTrunk > 0 && cars.length > 1;
                  return (
                    <div key={car.id} className="flex-1 min-w-0 px-2 py-2 text-center">
                      <span className={`text-[11px] sm:text-[13px] ${isBest ? 'font-semibold text-[#0e6efe]' : 'text-slate-700'}`}>
                        {car.specs.trunk_liters ? `${car.specs.trunk_liters} L` : '-'}
                      </span>
                    </div>
                  );
                })}
              </CompareRow>

              <CompareRow label="Platser" icon={Car} labelColClass={labelColClass}>
                {cars.map(car => (
                  <div key={car.id} className="flex-1 min-w-0 px-2 py-2 text-center">
                    <span className="text-[11px] sm:text-[13px] text-slate-700">{car.specs.seats}</span>
                  </div>
                ))}
              </CompareRow>

              <SectionHeader label="Säkerhet" />

              <CompareRow label="Euro NCAP" icon={Shield} labelColClass={labelColClass}>
                {cars.map(car => {
                  const bestNcap = Math.max(...cars.map(c => c.safety.euro_ncap_stars || 0));
                  const isBest = (car.safety.euro_ncap_stars || 0) === bestNcap && bestNcap > 0 && cars.length > 1;
                  return (
                    <div key={car.id} className="flex-1 min-w-0 px-2 py-2 flex justify-center">
                      {car.safety.euro_ncap_stars ? (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star
                              key={si}
                              className={`w-3 h-3 ${
                                si < (car.safety.euro_ncap_stars || 0)
                                  ? isBest ? 'fill-[#0e6efe] text-[#0e6efe]' : 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300">-</span>
                      )}
                    </div>
                  );
                })}
              </CompareRow>

              <SectionHeader label="Pris" />

              {cars.some(c => c.pricing.new_from_sek) && (
                <CompareRow label="Ny från" icon={TrendingDown} labelColClass={labelColClass}>
                  {cars.map(car => {
                    const allPrices = cars.map(c => c.pricing.new_from_sek).filter((p): p is number => !!p);
                    const bestPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
                    const isBest = car.pricing.new_from_sek === bestPrice && allPrices.length > 1;
                    return (
                      <div key={car.id} className="flex-1 min-w-0 px-2 py-2 text-center">
                        <span className={`text-[10px] sm:text-[12px] leading-snug ${isBest ? 'font-semibold text-[#0e6efe]' : 'text-slate-700'}`}>
                          {car.pricing.new_from_sek ? formatPrice(car.pricing.new_from_sek) : '-'}
                        </span>
                      </div>
                    );
                  })}
                </CompareRow>
              )}

              {cars.some(c => c.pricing.used_from_sek) && (
                <CompareRow label="Begagnad" icon={TrendingDown} labelColClass={labelColClass}>
                  {cars.map(car => {
                    const allUsed = cars.map(c => c.pricing.used_from_sek).filter((p): p is number => !!p);
                    const bestUsed = allUsed.length > 0 ? Math.min(...allUsed) : 0;
                    const isBest = car.pricing.used_from_sek === bestUsed && allUsed.length > 1;
                    return (
                      <div key={car.id} className="flex-1 min-w-0 px-2 py-2 text-center">
                        <span className={`text-[10px] sm:text-[12px] ${isBest ? 'font-semibold text-[#0e6efe]' : 'text-slate-700'}`}>
                          {car.pricing.used_from_sek ? formatPrice(car.pricing.used_from_sek) : '-'}
                        </span>
                      </div>
                    );
                  })}
                </CompareRow>
              )}

              <SectionHeader label="Styrkor & Svagheter" />

              {/* Pros */}
              <div className="flex border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                <div className={`${labelColClass} shrink-0 px-3 py-3`}>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-500">Fördelar</span>
                  </div>
                </div>
                {cars.map(car => (
                  <div key={car.id} className="flex-1 min-w-0 px-2 py-3">
                    <ul className="space-y-1">
                      {car.pros.slice(0, 3).map((pro, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-[10px] sm:text-[11px] text-slate-600 leading-snug">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Cons */}
              <div className="flex border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                <div className={`${labelColClass} shrink-0 px-3 py-3`}>
                  <div className="flex items-center gap-1.5">
                    <XIcon className="w-3 h-3 text-red-400 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-500">Nackdelar</span>
                  </div>
                </div>
                {cars.map(car => (
                  <div key={car.id} className="flex-1 min-w-0 px-2 py-3">
                    <ul className="space-y-1">
                      {car.cons.slice(0, 3).map((con, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <XIcon className="w-2.5 h-2.5 text-red-400 shrink-0 mt-0.5" />
                          <span className="text-[10px] sm:text-[11px] text-slate-600 leading-snug">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* CTA row */}
              <div className="flex border-t border-slate-100 pb-6">
                <div className={`${labelColClass} shrink-0`} />
                {cars.map(car => (
                  <div key={car.id} className="flex-1 min-w-0 p-3 flex justify-center">
                    <button
                      onClick={() => onNegotiate(car)}
                      className="w-full max-w-[160px] h-10 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[12px] sm:text-[13px] font-semibold inline-flex items-center justify-center gap-1 transition"
                    >
                      Hjälp mig köpa
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1.5 bg-slate-50/80">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function CompareRow({
  label, icon: Icon, children, labelColClass,
}: {
  label: string;
  icon: typeof Star;
  children: React.ReactNode;
  labelColClass: string;
}) {
  return (
    <div className="flex border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
      <div className={`${labelColClass} shrink-0 px-3 py-2 flex items-center`}>
        <div className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-[10px] sm:text-[12px] font-medium text-slate-500 leading-tight">{label}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
