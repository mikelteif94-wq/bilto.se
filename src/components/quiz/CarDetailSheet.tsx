import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Gauge, Armchair, Briefcase, TrendingDown, Shield,
  Fuel, Battery, Car, Check, X as XIcon, Info, Users, ArrowRight,
  BarChart2, AlertTriangle, HelpCircle, X, Wallet, Zap, PhoneCall, MessageSquare, BadgeCheck,
} from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { type ComparisonCar, getAllComparisonCars } from '@/lib/comparison';
import { useCarCatalogLookup } from '@/lib/comparison/useCarCatalogLookup';
import type { QuizAnswers } from './QuizTypes';
import { inferPersona, type Persona } from './persona';
import { calcCarMonthlyRange, calcCarMonthly, calcMonthlyTCO, type TCOBreakdown } from '@/lib/utils';
import { CalcPanel } from '@/components/CalcPanel';

export interface DetailCarData {
  make: string;
  model: string;
  image_url: string | null;
  cleaned_image_url?: string | null;
  matchScore: number;
  matchReasons: string[];
  bodyType?: string;
  fuelType?: string;
  seats?: number;
  cargo?: string;
  drivetrain?: string;
  rating?: number;
  usedPrice?: number;
  fuelLabel?: string;
}

interface CarDetailSheetProps {
  car: DetailCarData | null;
  open?: boolean;
  onClose: () => void;
  onSelect?: () => void;
  onFitQuiz?: () => void;
  quizAnswers?: QuizAnswers;
}

function formatSEK(n: number): string {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

function formatPriceSEK(price: number): string {
  return formatSEK(price) + ' kr';
}

function getWhoItSuitsFor(data: ComparisonCar): string[] {
  const suits: string[] = [];
  if (data.specs.fuel_types.includes('el')) suits.push('Den som vill köra billigast i driftskostnad');
  if (data.specs.trunk_liters && data.specs.trunk_liters >= 500 && data.specs.seats >= 5) suits.push('Barnfamiljen som behöver utrymme');
  if (data.ratings.comfort >= 8) suits.push('Den som värdesätter komfort och tyst kupé');
  if (data.ratings.driving >= 8) suits.push('Den som gillar sportig och engagerande körning');
  if (data.ratings.value >= 8) suits.push('Den som vill ha bra valuta för pengarna');
  if (data.specs.drivetrain.includes('awd')) suits.push('Den som kör mycket på vintern');
  if (data.specs.body_type === 'suv') suits.push('Den som vill ha högt sittläge och bra överblick');
  if (data.specs.fuel_types.includes('hybrid') || data.specs.fuel_types.includes('laddhybrid')) suits.push('Pendlaren som kör korta och långa sträckor');
  return suits.slice(0, 4);
}

function getFuelIcon(fuelTypes: string[]) {
  if (fuelTypes.includes('el') || fuelTypes.includes('hybrid') || fuelTypes.includes('laddhybrid')) return Battery;
  return Fuel;
}

function getBodyLabel(bodyType: string): string {
  const labels: Record<string, string> = {
    sedan: 'Sedan', kombi: 'Kombi', suv: 'SUV', coupe: 'Coupé',
    hatchback: 'Halvkombi', cab: 'Cabriolet', mpv: 'MPV',
  };
  return labels[bodyType] || bodyType;
}

function getDrivetrainLabel(drivetrain: string[]): string {
  const labels: Record<string, string> = { fwd: 'Framhjul', rwd: 'Bakhjul', awd: 'Fyrhjul' };
  if (drivetrain.length > 1) return '2- eller 4-hjul';
  return drivetrain.map(d => labels[d] || d).join(', ');
}

function getFuelLabel(fuelTypes: string[]): string {
  const labels: Record<string, string> = {
    bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Mildhybrid',
    laddhybrid: 'Laddhybrid', el: 'El',
  };
  if (fuelTypes.length > 2) return fuelTypes.slice(0, 2).map(f => labels[f] || f).join(', ') + '…';
  return fuelTypes.map(f => labels[f] || f).join(', ');
}

// ─── Ownership cost meter ─────────────────────────────────────────────────────
function OwnershipMeter({ tco }: { tco: TCOBreakdown }) {
  const [open, setOpen] = useState(false);
  const { total } = tco;
  const level = total < 6000 ? 1 : total < 9000 ? 2 : total < 13000 ? 3 : total < 18000 ? 4 : 5;
  const label = level <= 1 ? 'Mycket billig' : level === 2 ? 'Billig' : level === 3 ? 'Måttlig' : level === 4 ? 'Dyr' : 'Mycket dyr';
  const activeColor = level <= 2 ? '#16a34a' : level === 3 ? '#ea580c' : '#dc2626';
  const trackColor = level <= 2 ? '#dcfce7' : level === 3 ? '#ffedd5' : '#fee2e2';
  const pct = (level / 5) * 100;
  const fmt = (n: number) => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
  const rows: { label: string; value: number; note?: string }[] = [
    { label: 'Finansiering (lån)', value: tco.financing, note: 'Gäller vid billån — faller bort om du köper kontant' },
    { label: 'Bränsle / el', value: tco.fuel },
    { label: 'Försäkring', value: tco.insurance },
    { label: 'Service & reparation', value: tco.service },
  ];
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Uppskattad total ägarkostnad / mån</p>
      <p className="text-[26px] font-extrabold text-slate-900 tabular-nums leading-none">
        ~{fmt(total)}<span className="text-[14px] font-semibold text-slate-400 ml-1.5">kr/mån</span>
      </p>
      <p className="text-[10.5px] text-slate-400 mt-1 mb-3">Inkl. finansiering (vid lån) · bränsle/el · försäkring · service — <span className="italic">ungefärliga riktvärden</span></p>
      <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: trackColor }}>
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ backgroundColor: activeColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
        />
      </div>
      <div className="flex justify-between mt-1.5 mb-3">
        <span className="text-[9px] text-slate-400">Billig att äga</span>
        <span className="text-[10px] font-bold" style={{ color: activeColor }}>{label}</span>
        <span className="text-[9px] text-slate-400">Dyr att äga</span>
      </div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white/60 hover:bg-white active:bg-slate-50 transition-colors"
      >
        <span className="text-[12px] font-semibold text-slate-600">Kostnaderna i detalj</span>
        <span className="text-[10px] text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="tco-breakdown"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-2 rounded-xl overflow-hidden border border-slate-100">
              {rows.map((row, i) => (
                <div key={row.label} className={`px-3 py-2.5 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-500">{row.label}</span>
                    <span className="text-[13px] font-semibold text-slate-800 tabular-nums">~{fmt(row.value)} kr</span>
                  </div>
                  {row.note && <p className="text-[9px] text-slate-400 mt-0.5 italic">{row.note}</p>}
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-3 bg-slate-900">
                <span className="text-[12px] font-bold text-white">Totalt per månad</span>
                <span className="text-[14px] font-extrabold tabular-nums" style={{ color: activeColor }}>~{fmt(total)} kr</span>
              </div>
            </div>
            <div className="mt-2 px-1 space-y-1">
              <p className="text-[10px] text-slate-500 leading-snug">
                <span className="font-semibold text-slate-600">Finansiering</span> gäller dig som tar billån (20% kontantinsats, 6,49% ränta, 36 mån). Köper du kontant faller den posten bort.
              </p>
              <p className="text-[9.5px] text-slate-400 leading-snug">
                Alla siffror är uppskattningar baserade på ~1 500 mil/år och marknadspris för just den här bilen. Faktiska kostnader varierar.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Rating bar ───────────────────────────────────────────────────────────────
function RatingBar({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Star }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="text-[12px] text-slate-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#0047B3] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      <span className="text-[13px] font-bold text-slate-900 w-6 text-right tabular-nums">{value}</span>
    </div>
  );
}

// ─── Monthly cost tooltip ─────────────────────────────────────────────────────
function MonthlyTooltip({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute bottom-full left-0 mb-2 w-64 z-30 rounded-xl bg-slate-900 shadow-2xl p-3.5"
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
      <p className="text-[11px] font-bold text-white mb-1.5">Hur räknar vi?</p>
      <p className="text-[10px] text-slate-400 leading-relaxed">
        Spannet baseras på snittpriset mellan begagnad och ny, vid 55% respektive 50% restvärde.
      </p>
      <p className="text-[10px] text-slate-300 leading-relaxed mt-1.5">
        20% kontantinsats · 1% uppläggning · 6,49% ränta · 36 månader
      </p>
      <div className="mt-2 pt-2 border-t border-slate-700">
        <p className="text-[9px] text-slate-500">Uppskattning. Slutlig ränta sätts av finansiär.</p>
      </div>
    </div>
  );
}

function MonthlyCostBlock({
  carPrice, usedPrice, monthlyUsed, monthlyUsedMin, monthlyUsedMax,
}: {
  carPrice: number;
  usedPrice?: number;
  monthlyUsed?: number;
  monthlyUsedMin?: number;
  monthlyUsedMax?: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hasDbMonthly = !!(monthlyUsed || (monthlyUsedMin && monthlyUsedMax));
  const low = monthlyUsedMin ?? (hasDbMonthly ? monthlyUsed! : calcCarMonthlyRange(carPrice, usedPrice).low);
  const high = monthlyUsedMax ?? (hasDbMonthly ? monthlyUsed! : calcCarMonthlyRange(carPrice, usedPrice).high);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Uppskattad månadskostnad</p>
        <div className="relative">
          <button type="button" onClick={() => setShowTooltip(v => !v)} className="text-slate-300 hover:text-slate-500 transition-colors">
            <HelpCircle className="w-3 h-3" />
          </button>
          {showTooltip && <MonthlyTooltip onClose={() => setShowTooltip(false)} />}
        </div>
      </div>
      <p className="text-[26px] font-extrabold text-slate-900 tabular-nums leading-none">
        {low === high ? formatSEK(low) : `${formatSEK(low)}–${formatSEK(high)}`}
        <span className="text-[14px] font-semibold text-slate-400 ml-1.5">kr/mån</span>
      </p>
    </div>
  );
}

// ─── Spec pill ────────────────────────────────────────────────────────────────
function SpecPill({ icon: Icon, label, value, highlight }: { icon: typeof Car; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${highlight ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${highlight ? 'bg-emerald-100' : 'bg-white border border-slate-200'}`}>
        <Icon className={`w-3.5 h-3.5 ${highlight ? 'text-emerald-700' : 'text-slate-400'}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 leading-none mb-0.5">{label}</p>
        <p className={`text-[12px] font-semibold leading-tight truncate ${highlight ? 'text-emerald-700' : 'text-slate-800'}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ value, size = 56 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = value / 10;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#0047B3" strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-[14px] font-extrabold text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}

// ─── Persona insight ──────────────────────────────────────────────────────────
function PersonaInsightSection({ persona, data }: { persona: Persona; data: ComparisonCar }) {
  const insights: Record<Persona, { title: string; items: string[] } | null> = {
    first_time_buyer: {
      title: 'Som förstagångsköpare — tänk på',
      items: [
        data.safety.euro_ncap_stars
          ? `Euro NCAP: ${data.safety.euro_ncap_stars} stjärnor — ${data.safety.euro_ncap_stars >= 5 ? 'utmärkt säkerhetsbetyg' : 'kontrollera testår'}`
          : 'Be alltid om besiktningsprotokoll och servicehistorik',
        'Begär ett oberoende besiktningsutlåtande',
        'Kolla att garantin gäller och vad den täcker',
      ],
    },
    family: {
      title: 'Familjetest',
      items: [
        data.specs.trunk_liters ? `${data.specs.trunk_liters} liter bagageutrymme` : 'Mät om barnvagnen passar',
        data.specs.seats >= 7 ? '7-sitsig — plats för hela familjen' : `${data.specs.seats} sittplatser`,
        data.specs.drivetrain.includes('awd') ? 'Fyrhjulsdrift — trygg i alla väder' : 'Bra vinterdäck rekommenderas',
      ],
    },
    researcher: {
      title: 'Marknadsjämförelse',
      items: [
        data.pricing.used_from_sek ? `Begagnad från ${formatPriceSEK(data.pricing.used_from_sek)} — förhandla mot detta` : 'Jämför mot marknadssnittet',
        `Expertbetyg ${data.ratings.overall}/10 — ${data.ratings.overall >= 8 ? 'toppklass i segmentet' : 'bra alternativ'}`,
        data.ratings.value >= 8 ? 'Högt värdebetyg — priset är rätt' : 'Utrymme att pressa priset',
      ],
    },
    enthusiast: {
      title: 'Kördynamik & prestanda',
      items: [
        `Körbetyg: ${data.ratings.driving}/10`,
        getDrivetrainLabel(data.specs.drivetrain),
        data.pros[0] ?? 'Se specifikationer nedan',
      ],
    },
    pragmatist: {
      title: 'Total ägandekostnad',
      items: [
        `Värdebetyg: ${data.ratings.value}/10`,
        data.specs.fuel_types.includes('el') ? 'El — låg driftskostnad ~1–2 kr/mil' : data.specs.fuel_types.includes('hybrid') ? 'Hybrid — sänker bränslekostnad' : 'Jämför driftskostnad mot alternativ',
        data.pricing.used_from_sek ? `Begagnad från ${formatPriceSEK(data.pricing.used_from_sek)}` : 'Se marknadsdata för pris',
      ],
    },
  };

  const insight = insights[persona];
  if (!insight) return null;

  const iconMap: Record<Persona, typeof BarChart2> = {
    first_time_buyer: AlertTriangle,
    family: Users,
    researcher: BarChart2,
    enthusiast: Gauge,
    pragmatist: TrendingDown,
  };
  const Icon = iconMap[persona];

  return (
    <section className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">{insight.title}</p>
      </div>
      <div className="space-y-2">
        {insight.items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-amber-400 shrink-0 mt-2" />
            <span className="text-[12.5px] text-slate-700 leading-snug">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Equity calculator ────────────────────────────────────────────────────────
function fmt(n: number) { return Math.round(n).toLocaleString('sv-SE'); }

function EqSlider({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pct = ((value - min) / (max - min)) * 100;
  const valueFromX = useCallback((clientX: number) => {
    const t = trackRef.current;
    if (!t) return value;
    const rect = t.getBoundingClientRect();
    return Math.round((min + Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * (max - min)) / step) * step;
  }, [min, max, step, value]);
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true; onChange(valueFromX(e.clientX));
    const mv = (ev: MouseEvent) => { if (dragging.current) onChange(valueFromX(ev.clientX)); };
    const up = () => { dragging.current = false; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  }, [onChange, valueFromX]);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation(); dragging.current = true; onChange(valueFromX(e.touches[0].clientX));
    const mv = (ev: TouchEvent) => { ev.preventDefault(); if (dragging.current) onChange(valueFromX(ev.touches[0].clientX)); };
    const end = () => { dragging.current = false; window.removeEventListener('touchmove', mv); window.removeEventListener('touchend', end); };
    window.addEventListener('touchmove', mv, { passive: false }); window.addEventListener('touchend', end);
  }, [onChange, valueFromX]);
  return (
    <div ref={trackRef} className="relative h-9 flex items-center cursor-pointer select-none" onMouseDown={onMouseDown} onTouchStart={onTouchStart}>
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-slate-200">
        <div className="absolute left-0 top-0 h-full rounded-full bg-[#0e6efe]" style={{ width: `${pct}%` }} />
      </div>
      <div className="absolute w-5 h-5 rounded-full bg-white border-2 border-[#0e6efe] shadow-md -translate-x-1/2" style={{ left: `${pct}%` }} />
    </div>
  );
}

type EquityStep = 'start' | 'car' | 'debt' | 'cash' | 'result';

function CarEquityCalc({ carPrice, usedPrice, carName, bodyType }: { carPrice: number; usedPrice?: number; carName?: string; bodyType?: string }) {
  const basePrice = usedPrice ? Math.round((carPrice + usedPrice) / 2) : carPrice;
  const depositNeeded = Math.round(basePrice * 0.20);
  const monthlyBase = Math.round(calcCarMonthly(basePrice, 0.55));

  const [step, setStep] = useState<EquityStep>('start');
  const [hasCar, setHasCar] = useState<boolean | null>(null);
  const [carValue, setCarValue] = useState(150_000);
  const [carDebt, setCarDebt] = useState(0);
  const [cash, setCash] = useState(0);

  const equity = Math.max(0, (hasCar ? carValue - carDebt : 0) + cash);
  const extraNeeded = Math.max(0, depositNeeded - equity);
  const freed = Math.max(0, equity - depositNeeded);
  const loanBase = basePrice - Math.min(equity, depositNeeded) + basePrice * 0.01;
  const r = 0.0649 / 12; const n = 36; const residual = basePrice * 0.55;
  const monthly = Math.round(((loanBase - residual / Math.pow(1 + r, n)) * r) / (1 - Math.pow(1 + r, -n)));
  const monthlySaving = monthlyBase - monthly;

  const affordableAlts = useMemo((): { brand: string; model: string; price: number; depositNeeded: number; monthly: number; image?: string }[] => {
    if (equity === 0) return [];
    const all = getAllComparisonCars();
    return all
      .filter(c => {
        const price = c.pricing.used_from_sek || c.pricing.new_from_sek;
        if (!price || price >= basePrice) return false;
        const dep = Math.round(price * 0.20);
        if (dep > equity) return false;
        return `${c.brand_display} ${c.model_display}` !== carName;
      })
      .sort((a, b) => {
        const pa = a.pricing.used_from_sek || a.pricing.new_from_sek || 0;
        const pb = b.pricing.used_from_sek || b.pricing.new_from_sek || 0;
        const sameA = bodyType && a.specs.body_type === bodyType ? 1 : 0;
        const sameB = bodyType && b.specs.body_type === bodyType ? 1 : 0;
        if (sameB !== sameA) return sameB - sameA;
        return pb - pa;
      })
      .slice(0, 3)
      .map(c => {
        const price = (c.pricing.used_from_sek || c.pricing.new_from_sek)!;
        return { brand: c.brand_display, model: c.model_display, price, depositNeeded: Math.round(price * 0.20), monthly: Math.round(calcCarMonthly(price, 0.55)), image: c.image_url };
      });
  }, [equity, basePrice, bodyType, carName]);

  if (step === 'start') {
    return (
      <button
        type="button"
        onClick={() => setStep('car')}
        className="w-full flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-4 py-3.5 transition-all duration-150 group text-left active:scale-[0.99]"
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white">Beräkna vad din insats ger</p>
          <p className="text-[11px] text-emerald-100 mt-0.5">
            Insatskrav: <span className="font-semibold text-white">{fmt(depositNeeded)} kr</span> · ~{fmt(monthlyBase)} kr/mån
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:text-white transition-colors shrink-0" />
      </button>
    );
  }

  return (
    <div onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#0e6efe]" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Din insats för {carName ?? 'denna bil'}</span>
        </div>
        <button type="button" onClick={() => { setStep('start'); setHasCar(null); setCarValue(150_000); setCarDebt(0); setCash(0); }} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex h-1">
          {(['car', 'debt', 'cash', 'result'] as EquityStep[]).map((s, i) => {
            const steps: EquityStep[] = ['car', 'debt', 'cash', 'result'];
            const currentIdx = steps.indexOf(step);
            return <div key={s} className={`flex-1 transition-colors duration-300 ${i <= currentIdx ? 'bg-[#0e6efe]' : 'bg-slate-200'} ${i > 0 ? 'ml-0.5' : ''}`} />;
          })}
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait" initial={false}>
            {step === 'car' && (
              <motion.div key="car" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-3">
                <p className="text-[13px] font-semibold text-slate-800">Har du en bil att byta in?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ val: true, label: 'Ja, byta in', icon: Car }, { val: false, label: 'Nej, enbart kontanter', icon: Wallet }].map(opt => (
                    <button key={String(opt.val)} type="button"
                      onClick={() => { setHasCar(opt.val); setStep(opt.val ? 'debt' : 'cash'); }}
                      className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 text-center transition-all ${hasCar === opt.val ? 'border-[#0e6efe] bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <opt.icon className={`w-5 h-5 ${hasCar === opt.val ? 'text-[#0e6efe]' : 'text-slate-400'}`} />
                      <span className={`text-[11px] font-semibold leading-tight ${hasCar === opt.val ? 'text-[#0e6efe]' : 'text-slate-600'}`}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'debt' && (
              <motion.div key="debt" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-3">
                <p className="text-[13px] font-semibold text-slate-800">Vad är din bil värd?</p>
                <div className="text-center py-1">
                  <span className="text-[28px] font-bold text-slate-900 tabular-nums">{fmt(carValue)} kr</span>
                </div>
                <EqSlider value={carValue} min={20_000} max={600_000} step={5_000} onChange={setCarValue} />
                <div className="flex justify-between text-[10px] text-slate-400 -mt-2"><span>20 000 kr</span><span>600 000 kr</span></div>
                <div>
                  <p className="text-[12px] font-semibold text-slate-700 mb-1">Kvarvarande skuld</p>
                  <div className="text-center py-1">
                    <span className="text-[22px] font-bold text-slate-900 tabular-nums">
                      {carDebt === 0 ? 'Ingen skuld' : `${fmt(carDebt)} kr`}
                    </span>
                    {carDebt > 0 && <span className="text-[11px] text-emerald-600 font-semibold ml-2">Netto: {fmt(Math.max(0, carValue - carDebt))} kr</span>}
                  </div>
                  <EqSlider value={carDebt} min={0} max={Math.max(carValue, 300_000)} step={5_000} onChange={setCarDebt} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setStep('car')} className="h-10 px-4 rounded-xl border border-slate-200 text-slate-500 text-[12px] font-semibold hover:border-slate-300 transition-colors">Tillbaka</button>
                  <button type="button" onClick={() => setStep('cash')} className="flex-1 h-10 rounded-xl bg-[#0e6efe] text-white text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5">Fortsätt <ArrowRight className="w-3.5 h-3.5" /></button>
                </div>
              </motion.div>
            )}

            {step === 'cash' && (
              <motion.div key="cash" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-3">
                <p className="text-[13px] font-semibold text-slate-800">Extra kontanter till insatsen?</p>
                <div className="text-center py-1">
                  <span className="text-[28px] font-bold text-slate-900 tabular-nums">{cash === 0 ? 'Inga extra' : `${fmt(cash)} kr`}</span>
                </div>
                <EqSlider value={cash} min={0} max={500_000} step={5_000} onChange={setCash} />
                <div className="flex justify-between text-[10px] text-slate-400 -mt-2"><span>0 kr</span><span>500 000 kr</span></div>
                {hasCar && (
                  <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Total insats</span>
                    <span className="text-[13px] font-bold text-slate-900 tabular-nums">{fmt(Math.max(0, carValue - carDebt) + cash)} kr</span>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setStep(hasCar ? 'debt' : 'car')} className="h-10 px-4 rounded-xl border border-slate-200 text-slate-500 text-[12px] font-semibold hover:border-slate-300 transition-colors">Tillbaka</button>
                  <button type="button" onClick={() => setStep('result')} className="flex-1 h-10 rounded-xl bg-[#0e6efe] text-white text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5">Se resultat <ArrowRight className="w-3.5 h-3.5" /></button>
                </div>
              </motion.div>
            )}

            {step === 'result' && (
              <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }} className="space-y-3">
                {extraNeeded === 0 ? (
                  <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12.5px] font-bold text-emerald-800">Din insats täcker!</p>
                      <p className="text-[11.5px] text-emerald-700 mt-0.5">
                        {freed > 0 ? `Du har ${fmt(freed)} kr över efter insatsen.` : `Din insats matchar exakt kontantinsatskravet.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-3">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12.5px] font-bold text-amber-800">Saknas {fmt(extraNeeded)} kr</p>
                      <p className="text-[11.5px] text-amber-700 mt-0.5">Din insats {fmt(equity)} kr — behöver {fmt(depositNeeded)} kr (20%).</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Din insats</p>
                    <p className="text-[20px] font-extrabold text-slate-900 tabular-nums leading-none">{fmt(equity)}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">kr</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Månadskostnad</p>
                    <p className={`text-[20px] font-extrabold tabular-nums leading-none ${extraNeeded === 0 ? 'text-[#0e6efe]' : 'text-slate-700'}`}>{fmt(monthly)}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">kr/mån</p>
                  </div>
                </div>
                {monthlySaving > 100 && extraNeeded === 0 && (
                  <div className="flex items-center gap-2 bg-[#0e6efe]/5 border border-[#0e6efe]/15 rounded-xl px-3 py-2.5">
                    <TrendingDown className="w-3.5 h-3.5 text-[#0e6efe] shrink-0" />
                    <p className="text-[11.5px] text-[#0e6efe] font-semibold">Insatsen sänker månadskostnad med {fmt(monthlySaving)} kr/mån</p>
                  </div>
                )}
                <button type="button" onClick={() => { setStep('car'); setHasCar(null); setCarValue(150_000); setCarDebt(0); setCash(0); }} className="w-full h-9 rounded-xl border border-slate-200 text-slate-500 text-[12px] font-semibold hover:border-slate-300 transition-colors">Räkna om</button>
                {extraNeeded > 0 && affordableAlts.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <p className="text-[11.5px] font-bold text-slate-700">Bilar du har råd med</p>
                    {affordableAlts.map(alt => (
                      <div key={`${alt.brand}-${alt.model}`} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-3 py-2.5">
                        {alt.image ? <img src={alt.image} alt={`${alt.brand} ${alt.model}`} className="w-14 h-10 object-contain rounded-lg shrink-0 bg-slate-50 p-1" /> : <div className="w-14 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Car className="w-5 h-5 text-slate-300" /></div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-slate-800 truncate">{alt.brand} {alt.model}</p>
                          <p className="text-[10.5px] text-slate-500 mt-0.5">Insats: {fmt(alt.depositNeeded)} kr · {fmt(alt.monthly)} kr/mån</p>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-bold shrink-0">Passar</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── How it works strip ───────────────────────────────────────────────────────
function HowItWorksStrip() {
  const steps = [
    { icon: PhoneCall, label: 'Konsultation', desc: 'Vi lyssnar på dina behov — bilbyte eller enbart köp' },
    { icon: MessageSquare, label: 'Vi förhandlar', desc: 'Bilto förhandlar priset mot handlaren åt dig' },
    { icon: BadgeCheck, label: 'Klart!', desc: 'Du hämtar bilen på dina villkor, vi sköter pappren' },
  ];
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden">
      <div className="px-4 pt-3.5 pb-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Så fungerar det</p>
      </div>
      <div className="divide-y divide-slate-100">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
              <s.icon className="w-3.5 h-3.5 text-[#0e6efe]" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-slate-800">{i + 1}. {s.label}</p>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function getPersonaCTA(persona: Persona | null, brand: string, model: string): { headline: string; sub: string } {
  switch (persona) {
    case 'first_time_buyer': return { headline: 'Köp tryggt — vi guidar dig hela vägen', sub: `Rådgivare hjälper dig med ${brand} ${model} från provkörning till kontrakt` };
    case 'family': return { headline: `Vi hittar rätt ${brand} ${model} för familjen`, sub: 'Förhandlar pris, checkar historik och ser till att bilen håller' };
    case 'researcher': return { headline: 'Vi pressar priset — du har gjort research', sub: `Låt oss förhandla ${brand} ${model} och spara 15 000–40 000 kr` };
    case 'enthusiast': return { headline: 'Du vet vad du vill — vi ser till rätt pris', sub: `Vi förhandlar ${brand} ${model} baserat på marknadsdata` };
    case 'pragmatist': return { headline: `Bästa priset på ${brand} ${model}`, sub: 'Fast avgift 1 995 kr. Snitt besparing 15 000–40 000 kr.' };
    default: return { headline: 'Låt oss hitta bästa priset', sub: `Vi förhandlar ${brand} ${model} åt dig — gratis att testa` };
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function CarDetailSheet({ car, open, onClose, onSelect, onFitQuiz, quizAnswers }: CarDetailSheetProps) {
  const isOpen = open !== undefined ? open : !!car;
  const { data: comparisonData, loading } = useCarCatalogLookup(car?.make ?? '', car?.model ?? '');

  const persona = useMemo(() => {
    if (!quizAnswers) return null;
    return inferPersona(quizAnswers);
  }, [quizAnswers]);

  if (!car) return null;

  const heroImage = comparisonData?.image_url ?? car.cleaned_image_url ?? car.image_url;

  return (
    <Sheet open={isOpen} onClose={onClose}>
      <div className="pb-8">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="relative">
          {/* Image area */}
          <div className="mx-4 mb-4">
            {loading ? (
              <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                <svg viewBox="0 0 220 80" className="w-40 opacity-10" fill="none">
                  <path d="M30 55 L30 45 Q30 38 38 36 L60 30 Q70 22 90 20 L140 20 Q160 20 170 30 L190 36 Q198 38 198 45 L198 55 Q198 60 193 60 L183 60 Q182 52 174 52 Q166 52 165 60 L75 60 Q74 52 66 52 Q58 52 57 60 L37 60 Q30 60 30 55 Z" fill="currentColor" className="text-slate-400" />
                  <ellipse cx="66" cy="60" rx="8" ry="8" fill="currentColor" className="text-slate-300" />
                  <ellipse cx="174" cy="60" rx="8" ry="8" fill="currentColor" className="text-slate-300" />
                </svg>
              </div>
            ) : heroImage ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full bg-gradient-to-b from-slate-50 to-white rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ height: '180px' }}
              >
                <img
                  src={heroImage}
                  alt={`${car.make} ${car.model}`}
                  className="max-w-full max-h-full object-contain px-6 py-3"
                />
              </motion.div>
            ) : (
              <div className="w-full h-20 flex items-center justify-center">
                <Car className="w-12 h-12 text-slate-200" />
              </div>
            )}
          </div>

          {/* Title row */}
          <div className="px-4 mb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[22px] font-extrabold text-slate-900 leading-tight tracking-tight">
                  {car.make} <span className="text-[#0047B3]">{car.model}</span>
                </h2>
                {comparisonData?.generation && (
                  <p className="text-[12px] text-slate-400 mt-0.5 font-medium">{comparisonData.generation}</p>
                )}
              </div>
              {(comparisonData || car.rating != null) && (
                <div className="shrink-0 mt-1">
                  <ScoreRing value={car.rating ?? comparisonData!.ratings.overall} size={52} />
                </div>
              )}
              {loading && car.rating == null && (
                <div className="relative w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 mt-1">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                </div>
              )}
            </div>

            {/* Badge row */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {comparisonData?.specs.fuel_types.includes('el') && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                  <Zap className="w-3 h-3" /> El
                </Badge>
              )}
              {comparisonData?.safety.euro_ncap_stars && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="w-3 h-3" /> {comparisonData.safety.euro_ncap_stars} NCAP
                </Badge>
              )}
              {persona && persona.confidence >= 30 && (
                <Badge variant="outline" className="gap-1 text-[#0047B3] border-[#0047B3]/30">
                  <Users className="w-3 h-3" /> Anpassad för {persona.label.toLowerCase()}
                </Badge>
              )}
              {loading && (
                <>
                  <div className="relative h-5 w-12 rounded-full bg-slate-100 overflow-hidden"><div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" /></div>
                  <div className="relative h-5 w-20 rounded-full bg-slate-100 overflow-hidden"><div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" /></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="px-4">
          {loading ? (
            <LoadingSkeleton />
          ) : comparisonData ? (
            <ComparisonContent data={comparisonData} persona={persona?.type ?? null} onSelect={onSelect} onFitQuiz={onFitQuiz} carName={`${car.make} ${car.model}`} />
          ) : (
            <BasicContent car={car} onSelect={onSelect} onFitQuiz={onFitQuiz} />
          )}
        </div>
      </div>
    </Sheet>
  );
}

// ─── Loading skeleton inside sheet content ────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2.5 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <div className="h-3 w-32 rounded bg-slate-200" />
        <div className="h-8 w-48 rounded-lg bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="relative h-14 rounded-2xl bg-slate-100 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="relative h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        ))}
      </div>
      <div className="relative rounded-2xl bg-slate-50 p-4 space-y-3 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-slate-200 shrink-0" />
            <div className="w-20 h-3 rounded bg-slate-200" />
            <div className="flex-1 h-2 rounded-full bg-slate-200" />
            <div className="w-5 h-3 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{children}</h3>;
}

// ─── Comparison content ───────────────────────────────────────────────────────
function ComparisonContent({ data, persona, onSelect, onFitQuiz, carName }: { data: ComparisonCar; persona: Persona | null; onSelect?: () => void; onFitQuiz?: () => void; carName?: string }) {
  const FuelIcon = getFuelIcon(data.specs.fuel_types);
  const whoSuits = getWhoItSuitsFor(data);
  const cta = getPersonaCTA(persona, data.brand_display, data.model_display);
  const carPrice = data.pricing.new_from_sek ?? null;
  const usedPrice = data.pricing.used_from_sek ?? undefined;
  const [calcOpen, setCalcOpen] = useState(false);
  const [showEquity, setShowEquity] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowEquity(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Price + expert text ── */}
      <section className="p-4 bg-gradient-to-br from-[#0047B3]/5 to-[#0047B3]/[0.03] rounded-2xl border border-[#0047B3]/10">
        {carPrice ? (
          <OwnershipMeter tco={calcMonthlyTCO({ carPrice, usedPrice, fuelTypes: data.specs.fuel_types, make: data.brand_display })} />
        ) : (
          <p className="text-[13px] text-slate-400 italic">Pris ej tillgängligt</p>
        )}
        {carPrice && usedPrice && (
          <div className="mt-3 pt-3 border-t border-[#0047B3]/10">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] text-slate-400">Ny från</p>
                <p className="text-[13px] font-bold text-slate-700 tabular-nums">{formatSEK(carPrice)} kr</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <p className="text-[10px] text-slate-400">Begagnad från</p>
                <p className="text-[13px] font-bold text-slate-700 tabular-nums">{formatSEK(usedPrice)} kr</p>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 mt-2 leading-snug">
              Faktiska priser varierar beroende på årsmodell, miltal och utrustning
            </p>
          </div>
        )}
        {data.meta_description && (
          <p className="text-[12.5px] text-slate-600 leading-relaxed mt-3 pt-3 border-t border-[#0047B3]/10">{data.meta_description}</p>
        )}
      </section>

      {/* ── How it works ── */}
      <HowItWorksStrip />

      {/* ── CTAs ── */}
      <div className="space-y-2.5">
        {onSelect && (
          <button
            type="button"
            onClick={onSelect}
            className="w-full flex flex-col items-center gap-0.5 py-3.5 rounded-2xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.99] text-white transition-all duration-200 shadow-lg shadow-[#0e6efe]/25"
          >
            <span className="text-[14px] font-bold inline-flex items-center gap-2">
              {cta.headline} <ArrowRight className="w-4 h-4" />
            </span>
            <span className="text-[11px] text-white/65">{cta.sub}</span>
          </button>
        )}
        {(carPrice || onFitQuiz) && (
          <div className="grid grid-cols-2 gap-2">
            {carPrice && (
              <button
                type="button"
                onClick={() => setCalcOpen(v => !v)}
                className={`flex items-center justify-center gap-2 h-12 rounded-2xl border text-[12px] font-semibold transition-all duration-150 active:scale-[0.97] ${calcOpen ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                <Gauge className="w-3.5 h-3.5" />
                {calcOpen ? 'Stäng kalkyl' : 'Räkna kalkyl'}
              </button>
            )}
            {onFitQuiz && (
              <button
                type="button"
                onClick={onFitQuiz}
                className="flex items-center justify-center gap-2 h-12 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-[12px] font-semibold transition-all duration-150 active:scale-[0.97]"
              >
                <Users className="w-3.5 h-3.5" />
                Passar den mig?
              </button>
            )}
          </div>
        )}
        <AnimatePresence initial={false}>
          {calcOpen && carPrice && (
            <motion.div key="calc" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
              <CalcPanel carPrice={carPrice} usedPrice={usedPrice} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Specs grid ── */}
      <section>
        <SectionTitle>Specifikationer</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <SpecPill icon={Car} label="Kaross" value={getBodyLabel(data.specs.body_type)} />
          <SpecPill icon={FuelIcon} label="Drivmedel" value={getFuelLabel(data.specs.fuel_types)} highlight={data.specs.fuel_types.includes('el')} />
          <SpecPill icon={Gauge} label="Drivlina" value={getDrivetrainLabel(data.specs.drivetrain)} />
          <SpecPill icon={Briefcase} label="Bagageutrymme" value={data.specs.trunk_liters ? `${data.specs.trunk_liters} L` : '–'} />
          {data.specs.seats && <SpecPill icon={Armchair} label="Sittplatser" value={`${data.specs.seats} pers`} />}
        </div>

        {/* EV specs panel */}
        {data.ev_specs && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-sky-200 bg-sky-50">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-sky-100 border-b border-sky-200">
              <Zap className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wide">Elbilsdata</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-sky-100 bg-sky-50/60">
              <div className="px-3.5 py-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Räckvidd WLTP</p>
                <p className="text-[15px] font-bold text-slate-900 tabular-nums mt-0.5">{data.ev_specs.range_wltp_km} <span className="text-[11px] font-normal text-slate-400">km</span></p>
              </div>
              <div className="px-3.5 py-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Vinterräckvidd</p>
                <p className="text-[15px] font-bold text-slate-900 tabular-nums mt-0.5">~{data.ev_specs.range_winter_km} <span className="text-[11px] font-normal text-slate-400">km</span></p>
              </div>
              <div className="px-3.5 py-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Batteri</p>
                <p className="text-[15px] font-bold text-slate-900 tabular-nums mt-0.5">{data.ev_specs.battery_kwh} <span className="text-[11px] font-normal text-slate-400">kWh</span></p>
              </div>
              <div className="px-3.5 py-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Snabbladdning</p>
                <p className="text-[15px] font-bold text-slate-900 tabular-nums mt-0.5">{data.ev_specs.charge_kw_max} <span className="text-[11px] font-normal text-slate-400">kW DC</span></p>
              </div>
              <div className="px-3.5 py-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Laddtid 10–80%</p>
                <p className="text-[15px] font-bold text-slate-900 tabular-nums mt-0.5">{data.ev_specs.charge_time_10_80_min} <span className="text-[11px] font-normal text-slate-400">min</span></p>
              </div>
              <div className="px-3.5 py-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Förbrukning</p>
                <p className="text-[15px] font-bold text-slate-900 tabular-nums mt-0.5">{data.ev_specs.consumption_wh_km} <span className="text-[11px] font-normal text-slate-400">Wh/km</span></p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Ratings ── */}
      <section>
        <SectionTitle>Betyg</SectionTitle>
        <div className="p-4 bg-slate-50 rounded-2xl space-y-3.5">
          <RatingBar label="Körning" value={data.ratings.driving} icon={Gauge} />
          <RatingBar label="Komfort" value={data.ratings.comfort} icon={Armchair} />
          <RatingBar label="Praktiskt" value={data.ratings.practicality} icon={Briefcase} />
          <RatingBar label="Värde" value={data.ratings.value} icon={TrendingDown} />
        </div>
      </section>

      {/* ── Persona insight ── */}
      {persona && <PersonaInsightSection persona={persona} data={data} />}

      {/* ── Pros & cons ── */}
      {(data.pros.length > 0 || data.cons.length > 0) && (
        <section>
          <SectionTitle>Styrkor & svagheter</SectionTitle>
          <div className="space-y-1.5">
            {data.pros.map((pro, i) => (
              <div key={i} className="flex items-start gap-2.5 py-1">
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-[13px] text-slate-700 leading-snug">{pro}</span>
              </div>
            ))}
            {data.cons.length > 0 && <div className="h-px bg-slate-100 my-2" />}
            {data.cons.map((con, i) => (
              <div key={i} className="flex items-start gap-2.5 py-1">
                <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5 border border-red-100">
                  <XIcon className="w-3 h-3 text-red-500" />
                </div>
                <span className="text-[13px] text-slate-700 leading-snug">{con}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Who it suits ── */}
      {whoSuits.length > 0 && (
        <section>
          <SectionTitle>Passar för</SectionTitle>
          <div className="space-y-1.5">
            {whoSuits.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1">
                <div className="w-5 h-5 rounded-full bg-[#0047B3]/8 flex items-center justify-center shrink-0 border border-[#0047B3]/15">
                  <Users className="w-3 h-3 text-[#0047B3]" />
                </div>
                <span className="text-[13px] text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Equity calc ── */}
      {carPrice && showEquity && (
        <CarEquityCalc carPrice={carPrice} usedPrice={usedPrice} carName={carName} bodyType={data.specs.body_type} />
      )}
    </div>
  );
}

// ─── Basic content (no DB data) ───────────────────────────────────────────────
function BasicContent({ car, onSelect, onFitQuiz }: { car: DetailCarData; onSelect?: () => void; onFitQuiz?: () => void }) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [showEquity, setShowEquity] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowEquity(true), 400); return () => clearTimeout(t); }, []);
  const carPrice = car.usedPrice ?? null;

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        {onSelect && (
          <button type="button" onClick={onSelect} className="w-full flex flex-col items-center gap-0.5 py-3.5 rounded-2xl bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-[0.99] text-white transition-all duration-200 shadow-lg shadow-[#0e6efe]/25">
            <span className="text-[14px] font-bold inline-flex items-center gap-2">Låt oss hitta bästa priset <ArrowRight className="w-4 h-4" /></span>
            <span className="text-[11px] text-white/65">Vi förhandlar {car.make} {car.model} åt dig — gratis att testa</span>
          </button>
        )}
        {(carPrice || onFitQuiz) && (
          <div className="grid grid-cols-2 gap-2">
            {carPrice && (
              <button type="button" onClick={() => setCalcOpen(v => !v)} className={`flex items-center justify-center gap-2 h-12 rounded-2xl border text-[12px] font-semibold transition-all duration-150 active:scale-[0.97] ${calcOpen ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                <Gauge className="w-3.5 h-3.5" /> {calcOpen ? 'Stäng kalkyl' : 'Räkna kalkyl'}
              </button>
            )}
            {onFitQuiz && (
              <button type="button" onClick={onFitQuiz} className="flex items-center justify-center gap-2 h-12 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-[12px] font-semibold transition-all duration-150 active:scale-[0.97]">
                <Users className="w-3.5 h-3.5" /> Passar den mig?
              </button>
            )}
          </div>
        )}
        <AnimatePresence initial={false}>
          {calcOpen && carPrice && (
            <motion.div key="calc" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
              <CalcPanel carPrice={carPrice} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-start gap-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-[13px] text-slate-500">Detaljerad data för denna modell läggs till löpande.</p>
      </div>

      {carPrice && showEquity && <CarEquityCalc carPrice={carPrice} carName={`${car.make} ${car.model}`} />}

      {car.matchReasons.length > 0 && (
        <section>
          <SectionTitle>Varför vi rekommenderar den</SectionTitle>
          <div className="space-y-1.5">
            {car.matchReasons.map((reason, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1">
                <div className="w-5 h-5 rounded-full bg-[#0047B3]/8 flex items-center justify-center shrink-0 border border-[#0047B3]/15">
                  <Star className="w-3 h-3 text-[#0047B3]" />
                </div>
                <span className="text-[13px] text-slate-700">{reason}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
