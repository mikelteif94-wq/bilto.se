import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Scale } from 'lucide-react';
import { calcMonthlyTCO } from '../lib/utils';

export interface TcoCompareCar {
  id: string;
  name: string;
  imageUrl?: string | null;
  carPrice?: number;
  usedPrice?: number;
  fuelTypes?: string[];
}

interface TcoCompareBarProps {
  cars: TcoCompareCar[];
  onRemove: (id: string) => void;
  onGetHelp: (name: string) => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

const COST_LABELS: Record<string, string> = {
  financing: 'Finansiering',
  fuel: 'Drivmedel',
  insurance: 'Försäkring',
  service: 'Service',
};

const COST_COLORS: Record<string, string> = {
  financing: '#0e6efe',
  fuel: '#10b981',
  insurance: '#f59e0b',
  service: '#6366f1',
};

function CarSlot({ car, onRemove }: { car: TcoCompareCar; onRemove: () => void }) {
  const hasCost = !!car.carPrice;
  const tco = hasCost
    ? calcMonthlyTCO({ carPrice: car.carPrice!, usedPrice: car.usedPrice, fuelTypes: car.fuelTypes ?? [] })
    : null;

  return (
    <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
      {/* Car image + name */}
      <div className="relative w-full flex items-center gap-2">
        <div className="w-14 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
          {car.imageUrl ? (
            <img src={car.imageUrl} alt={car.name} className="w-full h-full object-contain p-1" />
          ) : (
            <div className="w-6 h-6 text-slate-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h2l2-4h8l2 4h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-4 0a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-slate-900 leading-tight truncate">{car.name}</p>
          {tco && (
            <p className="text-[11px] text-slate-500 font-medium">~{fmt(tco.total)} kr/mån</p>
          )}
        </div>
        <button
          onClick={onRemove}
          className="shrink-0 w-6 h-6 rounded-xl bg-slate-100 hover:bg-red-100 flex items-center justify-center transition-colors"
          aria-label="Ta bort"
        >
          <X className="w-3 h-3 text-slate-400 hover:text-red-500" />
        </button>
      </div>

      {/* Cost bars */}
      {tco && (
        <div className="w-full space-y-1">
          {(Object.entries(COST_LABELS) as [keyof typeof COST_LABELS, string][]).map(([key, label]) => {
            const val = tco[key as keyof typeof tco] as number;
            const pct = Math.round((val / tco.total) * 100);
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="h-full rounded-xl"
                    style={{ backgroundColor: COST_COLORS[key] }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 w-[52px] text-right shrink-0 tabular-nums">
                  {fmt(val)} kr
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-xl py-3 px-3">
      <p className="text-[11px] font-semibold text-slate-400 text-center leading-tight">Välj ytterligare en bil</p>
    </div>
  );
}

export default function TcoCompareBar({ cars, onRemove, onGetHelp }: TcoCompareBarProps) {
  const visible = cars.length > 0;

  // Find the winner (lowest total cost) when 2 cars are selected
  const winner = cars.length === 2 && cars[0].carPrice && cars[1].carPrice
    ? (() => {
        const t0 = calcMonthlyTCO({ carPrice: cars[0].carPrice!, usedPrice: cars[0].usedPrice, fuelTypes: cars[0].fuelTypes ?? [] }).total;
        const t1 = calcMonthlyTCO({ carPrice: cars[1].carPrice!, usedPrice: cars[1].usedPrice, fuelTypes: cars[1].fuelTypes ?? [] }).total;
        return t0 < t1 ? cars[0].name : t1 < t0 ? cars[1].name : null;
      })()
    : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          className="fixed bottom-0 inset-x-0 z-40 pb-safe"
        >
          <div className="mx-3 mb-3 bg-white rounded-xl shadow-[0_-8px_40px_rgba(15,23,42,0.14)] ring-1 ring-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-white/70" />
                <span className="text-[12px] font-bold text-white uppercase tracking-wide">Jämför ägandekostnad / mån</span>
              </div>
              {winner && (
                <span className="text-[11px] text-emerald-400 font-semibold">
                  {winner.split(' ').slice(0, 2).join(' ')} billigast
                </span>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 border-b border-slate-100 overflow-x-auto scrollbar-hide">
              {Object.entries(COST_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1 shrink-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COST_COLORS[key] }} />
                  <span className="text-[10px] text-slate-500">{label}</span>
                </div>
              ))}
            </div>

            {/* Cars comparison */}
            <div className="px-4 py-3 flex gap-4">
              {cars.map(car => (
                <CarSlot key={car.id} car={car} onRemove={() => onRemove(car.id)} />
              ))}
              {cars.length === 1 && <EmptySlot />}
            </div>

            {/* CTA */}
            {cars.length > 0 && (
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => onGetHelp(cars[winner ? cars.findIndex(c => c.name === winner) : 0]?.name ?? cars[0].name)}
                  className="w-full h-11 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  Få prishjälp
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
