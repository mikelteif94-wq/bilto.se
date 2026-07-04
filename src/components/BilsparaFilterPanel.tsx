import { useState } from 'react';
import { X, Zap, Leaf, Users, Crown, Gauge, ChevronDown, ChevronUp, Search, Gift } from 'lucide-react';

export type Kampanjtyp = 'Demobil' | 'Lagerrensning' | 'Nybilskampanj';
export type Drivmedel = 'Bensin' | 'Diesel' | 'El' | 'Hybrid' | 'Laddhybrid';
export type Kaross = 'SUV' | 'Kombi' | 'Sedan' | 'Halvkombi' | 'Coupé';
export type Mode = 'alla' | 'kop' | 'leasing';
export type SortKey = 'savings' | 'pct' | 'price' | 'ending';

export interface Filters {
  minSavings: number;
  maxPrice: number;
  kampanjtyper: Kampanjtyp[];
  marken: string[];
  drivmedel: Drivmedel[];
  karosser: Kaross[];
  bonusOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  minSavings: 0,
  maxPrice: 700000,
  kampanjtyper: [],
  marken: [],
  drivmedel: [],
  karosser: [],
  bonusOnly: false,
};

export function isDefaultFilters(f: Filters, mode: Mode): boolean {
  return (
    f.minSavings === 0 &&
    f.maxPrice === 700000 &&
    f.kampanjtyper.length === 0 &&
    f.marken.length === 0 &&
    f.drivmedel.length === 0 &&
    f.karosser.length === 0 &&
    !f.bonusOnly &&
    mode === 'alla'
  );
}

const POPULAR_MAKES = ['Volvo', 'BMW', 'Audi', 'Volkswagen', 'Tesla', 'Kia', 'Toyota', 'Mercedes-Benz'];
const KAMPANJTYPER: Kampanjtyp[] = ['Demobil', 'Lagerrensning', 'Nybilskampanj'];
const DRIVMEDEL: Drivmedel[] = ['Bensin', 'Diesel', 'El', 'Hybrid', 'Laddhybrid'];
const KAROSSER: Kaross[] = ['SUV', 'Kombi', 'Sedan', 'Halvkombi', 'Coupé'];

export interface QuickPickDef {
  label: string;
  icon: React.ElementType;
  filtersOverride: Partial<Filters>;
  modeOverride?: Mode;
}

export const QUICK_PICKS: QuickPickDef[] = [
  { label: 'El-boom',    icon: Zap,    filtersOverride: { drivmedel: ['El'] } },
  { label: 'Miljöklipp', icon: Leaf,   filtersOverride: { drivmedel: ['El', 'Hybrid', 'Laddhybrid'], minSavings: 30000 } },
  { label: 'Familjebil', icon: Users,  filtersOverride: { karosser: ['SUV', 'Kombi'], minSavings: 20000 } },
  { label: 'Lyxdeal',   icon: Crown,  filtersOverride: { marken: ['Volvo', 'BMW', 'Audi'], minSavings: 50000 } },
  { label: 'Blixt',     icon: Gauge,  filtersOverride: { minSavings: 40000 }, modeOverride: 'kop' },
];

interface FilterPanelProps {
  filters: Filters;
  mode: Mode;
  onChange: (f: Partial<Filters>) => void;
  onModeChange: (m: Mode) => void;
  onReset: () => void;
  availableMakes: string[];
  filteredCount: number;
  totalSavings: number;
  hasActive: boolean;
  open: boolean;
}

function fmt(n: number) { return n.toLocaleString('sv-SE'); }

function toggleArr<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

function ChipBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
      style={{
        background: active ? '#0E1B33' : '#F7F8FB',
        color: active ? 'white' : '#6B7486',
        border: `1px solid ${active ? '#0E1B33' : '#E8ECF3'}`,
        fontFamily: '"Signika", ui-sans-serif',
      }}
    >
      {children}
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #E8ECF3' }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function ToggleRow({ icon, label, subLabel, active, onToggle, activeColor = '#00A85A' }: {
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  active: boolean;
  onToggle: () => void;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full bg-white rounded-2xl px-4 py-3 flex items-center justify-between text-left transition"
      style={{ border: '1px solid #E8ECF3' }}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <div>
          <span className="text-[13px] font-semibold block" style={{ color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}>
            {label}
          </span>
          {subLabel && (
            <span className="text-[10px]" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>{subLabel}</span>
          )}
        </div>
      </div>
      <div
        className="w-10 h-5 rounded-full relative shrink-0 transition-colors duration-200"
        style={{ background: active ? activeColor : '#E8ECF3' }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: active ? 'translateX(20px)' : 'translateX(2px)' }}
        />
      </div>
    </button>
  );
}

export default function BilsparaFilterPanel({
  filters,
  mode,
  onChange,
  onModeChange,
  onReset,
  availableMakes,
  filteredCount,
  totalSavings,
  hasActive,
  open,
}: FilterPanelProps) {
  const [makeSearch, setMakeSearch] = useState('');
  const [showAllMakes, setShowAllMakes] = useState(false);

  // Popular first, then alphabetical
  const allMakes = [...new Set([...POPULAR_MAKES, ...availableMakes])].sort((a, b) => {
    const ap = POPULAR_MAKES.includes(a) ? 0 : 1;
    const bp = POPULAR_MAKES.includes(b) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.localeCompare(b, 'sv');
  });

  const displayedMakes = makeSearch
    ? allMakes.filter(m => m.toLowerCase().includes(makeSearch.toLowerCase()))
    : showAllMakes ? allMakes : allMakes.slice(0, 8);

  const elvehicleOnly = filters.drivmedel.length === 1 && filters.drivmedel[0] === 'El';

  return (
    <div className={`${open ? 'block' : 'hidden'} lg:block space-y-3`}>
      {/* Heading + reset — desktop */}
      <div className="hidden lg:flex items-center justify-between mb-1">
        <p className="text-[13px] font-bold uppercase tracking-[0.18em]" style={{ color: '#E4002B', fontFamily: '"Signika", ui-sans-serif' }}>
          Sparfilter
        </p>
        {hasActive && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[11px] font-semibold hover:text-[#0E1B33] transition"
            style={{ color: '#6B7486' }}
          >
            <X className="w-3 h-3" />Rensa
          </button>
        )}
      </div>

      {/* 1. Läge */}
      <SectionCard title="Typ av affär">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F7F8FB' }}>
          {(['alla', 'kop', 'leasing'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className="flex-1 py-1.5 rounded-lg text-[12px] font-bold transition"
              style={{
                background: mode === m ? '#0E1B33' : 'transparent',
                color: mode === m ? 'white' : '#6B7486',
                fontFamily: '"Signika", ui-sans-serif',
              }}
            >
              {m === 'alla' ? 'Alla' : m === 'kop' ? 'Köp' : 'Leasing'}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* 2. Minsta besparing */}
      <SectionCard title={`Minsta besparing — ${fmt(filters.minSavings)} kr`}>
        <input
          type="range"
          min={0} max={100000} step={5000}
          value={filters.minSavings}
          onChange={e => onChange({ minSavings: parseInt(e.target.value) })}
          className="w-full"
          style={{ accentColor: '#FFD500' }}
        />
        <div className="flex justify-between text-[10px] mt-1" style={{ color: '#6B7486' }}>
          <span>0 kr</span><span>100 000 kr</span>
        </div>
      </SectionCard>

      {/* 3. Visa bara elbilar */}
      <ToggleRow
        icon={<Zap className="w-4 h-4 shrink-0" style={{ color: '#00A85A' }} strokeWidth={2.5} />}
        label="Visa bara elbilar"
        active={elvehicleOnly}
        onToggle={() => onChange({ drivmedel: elvehicleOnly ? [] : ['El'] })}
        activeColor="#00A85A"
      />

      {/* 4. Ingår i köpet */}
      <ToggleRow
        icon={<Gift className="w-4 h-4 shrink-0" style={{ color: '#FFD500' }} strokeWidth={2.5} />}
        label="Ingår i köpet"
        subLabel="Bonus du väljer själv"
        active={filters.bonusOnly}
        onToggle={() => onChange({ bonusOnly: !filters.bonusOnly })}
        activeColor="#FFD500"
      />

      {/* 5. Kampanjtyp */}
      <SectionCard title="Kampanjtyp">
        <div className="flex flex-wrap gap-1.5">
          {KAMPANJTYPER.map(kt => (
            <ChipBtn
              key={kt}
              active={filters.kampanjtyper.includes(kt)}
              onClick={() => onChange({ kampanjtyper: toggleArr(filters.kampanjtyper, kt) })}
            >
              {kt}
            </ChipBtn>
          ))}
        </div>
      </SectionCard>

      {/* 6. Märke */}
      <SectionCard title="Märke">
        <div
          className="flex items-center gap-2 px-3 h-8 mb-2.5 rounded-xl"
          style={{ background: '#F7F8FB', border: '1px solid #E8ECF3' }}
        >
          <Search className="w-3 h-3 shrink-0" style={{ color: '#6B7486' }} />
          <input
            type="text"
            placeholder="Sök märke..."
            value={makeSearch}
            onChange={e => setMakeSearch(e.target.value)}
            className="flex-1 bg-transparent text-[12px] focus:outline-none"
            style={{ color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}
          />
          {makeSearch && (
            <button type="button" onClick={() => setMakeSearch('')}>
              <X className="w-3 h-3" style={{ color: '#6B7486' }} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {displayedMakes.map(make => (
            <ChipBtn
              key={make}
              active={filters.marken.includes(make)}
              onClick={() => onChange({ marken: toggleArr(filters.marken, make) })}
            >
              {make}
            </ChipBtn>
          ))}
        </div>
        {!makeSearch && allMakes.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAllMakes(v => !v)}
            className="mt-2.5 flex items-center justify-center gap-1 text-[11px] font-semibold w-full transition hover:text-[#0E1B33]"
            style={{ color: '#6B7486' }}
          >
            {showAllMakes ? (
              <><ChevronUp className="w-3 h-3" />Visa färre</>
            ) : (
              <><ChevronDown className="w-3 h-3" />Visa alla ({allMakes.length})</>
            )}
          </button>
        )}
      </SectionCard>

      {/* 7. Drivmedel */}
      <SectionCard title="Drivmedel">
        <div className="flex flex-wrap gap-1.5">
          {DRIVMEDEL.map(d => (
            <ChipBtn
              key={d}
              active={filters.drivmedel.includes(d)}
              onClick={() => onChange({ drivmedel: toggleArr(filters.drivmedel, d) })}
            >
              {d}
            </ChipBtn>
          ))}
        </div>
      </SectionCard>

      {/* 8. Kaross */}
      <SectionCard title="Karosseri">
        <div className="flex flex-wrap gap-1.5">
          {KAROSSER.map(k => (
            <ChipBtn
              key={k}
              active={filters.karosser.includes(k)}
              onClick={() => onChange({ karosser: toggleArr(filters.karosser, k) })}
            >
              {k}
            </ChipBtn>
          ))}
        </div>
      </SectionCard>

      {/* 9. Maxpris — hidden for leasing */}
      {mode !== 'leasing' && (
        <SectionCard title={`Maxpris — ${fmt(filters.maxPrice)} kr`}>
          <input
            type="range"
            min={250000} max={700000} step={10000}
            value={filters.maxPrice}
            onChange={e => onChange({ maxPrice: parseInt(e.target.value) })}
            className="w-full"
            style={{ accentColor: '#0E1B33' }}
          />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: '#6B7486' }}>
            <span>250 000 kr</span><span>700 000 kr</span>
          </div>
        </SectionCard>
      )}

      {/* Sparpotential widget */}
      {filteredCount > 0 && (
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: 'linear-gradient(135deg, #0E1B33 0%, #16264a 100%)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: '"Signika", ui-sans-serif' }}>
            Sparpotential just nu
          </p>
          <p
            className="text-[26px] font-bold leading-none mb-1"
            style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#FFD500', letterSpacing: '-0.01em' }}
          >
            {fmt(totalSavings)} kr
          </p>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: '"Signika", ui-sans-serif' }}>
            snitt {fmt(Math.round(totalSavings / filteredCount))} kr / bil
          </p>
        </div>
      )}

      {/* Mobile — reset */}
      {hasActive && (
        <button
          type="button"
          onClick={onReset}
          className="lg:hidden w-full flex items-center justify-center gap-1.5 text-[12px] font-semibold py-2 transition"
          style={{ color: '#6B7486' }}
        >
          <X className="w-3.5 h-3.5" />Rensa alla filter
        </button>
      )}
    </div>
  );
}
