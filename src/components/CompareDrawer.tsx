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
  fwd: 'Framhjulsdrift', rwd: 'Bakhjulsdrift', awd: 'Fyrhjulsdrift',
};

function formatPrice(sek: number): string {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(sek) + ' kr';
}

function RatingDot({ value, best }: { value: number; best: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`h-full rounded-full ${best ? 'bg-[#0e6efe]' : 'bg-slate-300'}`}
        />
      </div>
      <span className={`text-[13px] font-semibold tabular-nums w-7 text-right ${best ? 'text-[#0e6efe]' : 'text-slate-500'}`}>
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
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[17px] font-bold text-slate-900">Jämförelse</h2>
                <p className="text-[12px] text-slate-400">{cars.length} bilar valda</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4.5 h-4.5 text-slate-600" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <colgroup>
                    <col className="w-[140px] sm:w-[160px]" />
                    {cars.map(c => <col key={c.id} />)}
                  </colgroup>

                  {/* Car headers */}
                  <thead>
                    <tr className="border-b border-slate-100">
                      <td className="p-4 align-top">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Bil</span>
                      </td>
                      {cars.map(car => (
                        <td key={car.id} className="p-4 align-top text-center">
                          <div className="relative inline-block">
                            <button
                              onClick={() => onRemove(car.id)}
                              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center z-10 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="w-28 h-20 sm:w-36 sm:h-24 rounded-xl bg-slate-50 overflow-hidden mx-auto mb-2">
                              {getImageUrl(car) ? (
                                <img src={getImageUrl(car)} alt={car.model_display} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car className="w-8 h-8 text-slate-200" />
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-[14px] font-bold text-slate-900 leading-tight">{car.brand_display}</p>
                          <p className="text-[13px] text-slate-500">{car.model_display}</p>
                        </td>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {/* Overall rating */}
                    <SectionHeader label="Betyg" colSpan={cars.length + 1} />
                    <CompareRow label="Totalt" icon={Star}>
                      {cars.map(car => (
                        <td key={car.id} className="px-4 py-2.5 text-center">
                          <div className={`inline-flex items-center justify-center w-11 h-11 rounded-full ${
                            bestRatings && car.ratings.overall === bestRatings.overall
                              ? 'bg-[#0e6efe] text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            <span className="text-[15px] font-bold">{car.ratings.overall}</span>
                          </div>
                        </td>
                      ))}
                    </CompareRow>
                    <CompareRow label="Körning" icon={Gauge}>
                      {cars.map(car => (
                        <td key={car.id} className="px-4 py-2">
                          <RatingDot value={car.ratings.driving} best={!!bestRatings && car.ratings.driving === bestRatings.driving} />
                        </td>
                      ))}
                    </CompareRow>
                    <CompareRow label="Komfort" icon={Armchair}>
                      {cars.map(car => (
                        <td key={car.id} className="px-4 py-2">
                          <RatingDot value={car.ratings.comfort} best={!!bestRatings && car.ratings.comfort === bestRatings.comfort} />
                        </td>
                      ))}
                    </CompareRow>
                    <CompareRow label="Praktiskt" icon={Briefcase}>
                      {cars.map(car => (
                        <td key={car.id} className="px-4 py-2">
                          <RatingDot value={car.ratings.practicality} best={!!bestRatings && car.ratings.practicality === bestRatings.practicality} />
                        </td>
                      ))}
                    </CompareRow>
                    <CompareRow label="Värde" icon={TrendingDown}>
                      {cars.map(car => (
                        <td key={car.id} className="px-4 py-2">
                          <RatingDot value={car.ratings.value} best={!!bestRatings && car.ratings.value === bestRatings.value} />
                        </td>
                      ))}
                    </CompareRow>

                    {/* Specs */}
                    <SectionHeader label="Specifikationer" colSpan={cars.length + 1} />
                    <CompareRow label="Kaross" icon={Car}>
                      {cars.map(car => (
                        <td key={car.id} className="px-4 py-2.5 text-center">
                          <span className="text-[13px] text-slate-700">{BODY_LABELS[car.specs.body_type] || car.specs.body_type}</span>
                        </td>
                      ))}
                    </CompareRow>
                    <CompareRow label="Drivmedel" icon={Fuel}>
                      {cars.map(car => {
                        const FuelIcon = car.specs.fuel_types.some(f => ['el', 'hybrid', 'laddhybrid'].includes(f)) ? Battery : Fuel;
                        return (
                          <td key={car.id} className="px-4 py-2.5 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <FuelIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[13px] text-slate-700">
                                {car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(', ')}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </CompareRow>
                    <CompareRow label="Drivlina" icon={Gauge}>
                      {cars.map(car => (
                        <td key={car.id} className="px-4 py-2.5 text-center">
                          <span className="text-[13px] text-slate-700">
                            {car.specs.drivetrain.map(d => DRIVE_LABELS[d] || d).join(', ')}
                          </span>
                        </td>
                      ))}
                    </CompareRow>
                    <CompareRow label="Bagage" icon={Briefcase}>
                      {cars.map(car => {
                        const bestTrunk = Math.max(...cars.map(c => c.specs.trunk_liters || 0));
                        const isBest = car.specs.trunk_liters === bestTrunk && bestTrunk > 0 && cars.length > 1;
                        return (
                          <td key={car.id} className="px-4 py-2.5 text-center">
                            <span className={`text-[13px] ${isBest ? 'font-semibold text-[#0e6efe]' : 'text-slate-700'}`}>
                              {car.specs.trunk_liters ? `${car.specs.trunk_liters} L` : '-'}
                            </span>
                          </td>
                        );
                      })}
                    </CompareRow>
                    <CompareRow label="Platser" icon={Car}>
                      {cars.map(car => (
                        <td key={car.id} className="px-4 py-2.5 text-center">
                          <span className="text-[13px] text-slate-700">{car.specs.seats}</span>
                        </td>
                      ))}
                    </CompareRow>

                    {/* Safety */}
                    <SectionHeader label="Säkerhet" colSpan={cars.length + 1} />
                    <CompareRow label="Euro NCAP" icon={Shield}>
                      {cars.map(car => {
                        const bestNcap = Math.max(...cars.map(c => c.safety.euro_ncap_stars || 0));
                        const isBest = (car.safety.euro_ncap_stars || 0) === bestNcap && bestNcap > 0 && cars.length > 1;
                        return (
                          <td key={car.id} className="px-4 py-2.5 text-center">
                            {car.safety.euro_ncap_stars ? (
                              <div className="inline-flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, si) => (
                                  <Star
                                    key={si}
                                    className={`w-3.5 h-3.5 ${
                                      si < (car.safety.euro_ncap_stars || 0)
                                        ? isBest ? 'fill-[#0e6efe] text-[#0e6efe]' : 'fill-amber-400 text-amber-400'
                                        : 'text-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-[12px] text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </CompareRow>

                    {/* Pricing */}
                    <SectionHeader label="Pris" colSpan={cars.length + 1} />
                    {cars.some(c => c.pricing.new_from_sek) && (
                      <CompareRow label="Ny fr." icon={TrendingDown}>
                        {cars.map(car => {
                          const allPrices = cars.map(c => c.pricing.new_from_sek).filter((p): p is number => !!p);
                          const bestPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
                          const isBest = car.pricing.new_from_sek === bestPrice && allPrices.length > 1;
                          return (
                            <td key={car.id} className="px-4 py-2.5 text-center">
                              <span className={`text-[13px] ${isBest ? 'font-semibold text-[#0e6efe]' : 'text-slate-700'}`}>
                                {car.pricing.new_from_sek ? formatPrice(car.pricing.new_from_sek) : '-'}
                              </span>
                            </td>
                          );
                        })}
                      </CompareRow>
                    )}
                    {cars.some(c => c.pricing.used_from_sek) && (
                      <CompareRow label="Begagnad från" icon={TrendingDown}>
                        {cars.map(car => {
                          const allUsed = cars.map(c => c.pricing.used_from_sek).filter((p): p is number => !!p);
                          const bestUsed = allUsed.length > 0 ? Math.min(...allUsed) : 0;
                          const isBest = car.pricing.used_from_sek === bestUsed && allUsed.length > 1;
                          return (
                            <td key={car.id} className="px-4 py-2.5 text-center">
                              <span className={`text-[13px] ${isBest ? 'font-semibold text-[#0e6efe]' : 'text-slate-700'}`}>
                                {car.pricing.used_from_sek ? formatPrice(car.pricing.used_from_sek) : '-'}
                              </span>
                              {car.pricing.used_from_sek && (
                                <p className="text-[10px] text-slate-400 mt-0.5">Äldre årsmod.</p>
                              )}
                            </td>
                          );
                        })}
                      </CompareRow>
                    )}

                    {/* Pros & Cons */}
                    <SectionHeader label="Styrkor" colSpan={cars.length + 1} />
                    <tr>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-[12px] font-medium text-slate-500">Fördelar</span>
                        </div>
                      </td>
                      {cars.map(car => (
                        <td key={car.id} className="px-4 py-3 align-top">
                          <ul className="space-y-1.5">
                            {car.pros.slice(0, 3).map((pro, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-[12px] text-slate-600 leading-snug">{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-slate-50">
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <XIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="text-[12px] font-medium text-slate-500">Nackdelar</span>
                        </div>
                      </td>
                      {cars.map(car => (
                        <td key={car.id} className="px-4 py-3 align-top">
                          <ul className="space-y-1.5">
                            {car.cons.slice(0, 3).map((con, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <XIcon className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                                <span className="text-[12px] text-slate-600 leading-snug">{con}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>

                    {/* CTA row */}
                    <tr className="border-t border-slate-100">
                      <td className="p-4" />
                      {cars.map(car => (
                        <td key={car.id} className="p-4 text-center">
                          <button
                            onClick={() => onNegotiate(car)}
                            className="w-full max-w-[180px] h-11 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 transition"
                          >
                            Förhandla pris
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SectionHeader({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 pt-5 pb-2">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{label}</span>
      </td>
    </tr>
  );
}

function CompareRow({ label, icon: Icon, children }: { label: string; icon: typeof Star; children: React.ReactNode }) {
  return (
    <tr className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-2.5 align-middle">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[12px] font-medium text-slate-500">{label}</span>
        </div>
      </td>
      {children}
    </tr>
  );
}
