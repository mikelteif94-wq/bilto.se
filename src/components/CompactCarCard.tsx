import { Star, Check, ChevronRight, Users, Info, Scale } from 'lucide-react';
import { calcCarMonthlyRange, calcMonthlyTCO } from '../lib/utils';

const BODY_LABELS: Record<string, string> = {
  sedan: 'Sedan', kombi: 'Kombi', suv: 'SUV', hatchback: 'Halvkombi',
  coupe: 'Coupé', cab: 'Cab', mpv: 'MPV',
};

interface CompactCarCardProps {
  name: string;
  imageUrl?: string | null;
  rating?: number;
  topBadge?: boolean;
  expertComment?: string;
  fuelLabel?: string;
  bodyType?: string;
  drivetrain?: string[];
  seats?: number;
  pros?: string[];
  carPrice?: number;
  usedPrice?: number;
  monthlySaving?: number;
  equityFreed?: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onNegotiate: () => void;
  onDetail?: () => void;
  onFitQuiz?: () => void;
  onTcoCompare?: () => void;
  isTcoCompared?: boolean;
  index?: number;
  disableMotion?: boolean;
  cardMode?: 'ny' | 'beg';
}

function formatSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

function fuelLabelToTypes(fuelLabel?: string): string[] {
  if (!fuelLabel) return [];
  const l = fuelLabel.toLowerCase();
  if (l.includes('laddhybrid') || l.includes('plug')) return ['laddhybrid'];
  if (l.includes('hybrid')) return ['hybrid'];
  if (l.includes('el') || l.includes('electric')) return ['el'];
  if (l.includes('diesel')) return ['diesel'];
  return ['bensin'];
}

function OwnershipMeter({ carPrice, usedPrice, fuelLabel, make, mode }: { carPrice: number; usedPrice?: number; fuelLabel?: string; make?: string; mode: 'ny' | 'beg' }) {
  const effectivePrice = (mode === 'beg' && usedPrice) ? usedPrice : carPrice;
  const tco = calcMonthlyTCO({ carPrice: effectivePrice, fuelTypes: fuelLabelToTypes(fuelLabel), make });
  const { total } = tco;
  const level = total < 6000 ? 1 : total < 9000 ? 2 : total < 13000 ? 3 : total < 18000 ? 4 : 5;
  const label = level <= 1 ? 'mycket billig' : level === 2 ? 'billig' : level === 3 ? 'måttlig' : level === 4 ? 'dyr' : 'mycket dyr';
  const activeColor = level <= 2 ? '#16a34a' : level === 3 ? '#ea580c' : '#dc2626';
  const fmt = (n: number) => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-400 font-medium">{fmt(effectivePrice)} kr</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Ägarkostnad</span>
        <div className="flex items-center gap-[3px]">
          {[1,2,3,4,5].map(s => (
            <div key={s} className="rounded-sm" style={{ width: 13, height: 7, backgroundColor: s <= level ? activeColor : '#e2e8f0', opacity: s <= level ? (0.45 + (s / level) * 0.55) : 1 }} />
          ))}
        </div>
        <span className="text-[10px] text-slate-400">~{fmt(Math.round(total / 100) * 100)} kr/mån</span>
      </div>
      <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">({label} · finansiering + bränsle + service)</p>
    </div>
  );
}

function ScoreBadge({ value }: { value: number }) {
  const color = value >= 8 ? '#16a34a' : value >= 6 ? '#d97706' : '#dc2626';
  return (
    <div
      className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-xl"
      style={{
        border: `2px solid ${color}`,
        boxShadow: `0 2px 8px ${color}30`,
        backgroundColor: 'rgba(255,255,255,0.95)',
      }}
    >
      <span className="text-[10px] font-extrabold tabular-nums leading-none" style={{ color }}>
        {Number.isInteger(value) ? value : value.toFixed(1)}
      </span>
    </div>
  );
}

export default function CompactCarCard({
  name, imageUrl, rating, topBadge, expertComment,
  fuelLabel, bodyType, drivetrain, seats, pros,
  carPrice, usedPrice, monthlySaving, equityFreed,
  isSelected, cardMode = 'beg',
  onSelect, onNegotiate, onDetail, onTcoCompare, isTcoCompared,
}: CompactCarCardProps) {
  const mode: 'ny' | 'beg' = (cardMode === 'beg' && usedPrice) ? 'beg' : 'ny';
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;
  const displayComment = (pros && pros.length > 0) ? pros[0] : expertComment;
  const bodyLabel = bodyType ? BODY_LABELS[bodyType] : null;

  const handleCardClick = () => {
    if (onSelect) { onSelect(); return; }
    if (onDetail) { onDetail(); return; }
  };

  const ringClass = isSelected
    ? 'ring-2 ring-[#0e6efe] shadow-[0_0_0_4px_rgba(14,110,254,0.12)]'
    : 'ring-1 ring-slate-200 shadow-sm hover:shadow-md hover:ring-slate-300';

  return (
    <div
      className={`group relative bg-white rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${ringClass}`}
    >
      {/* Mobile: horizontal layout */}
      <div className="flex sm:hidden" onClick={handleCardClick}>
        {/* Image */}
        <div className="relative w-[110px] shrink-0 bg-gradient-to-b from-slate-50 to-white self-stretch flex items-center">
          {imageUrl && (
            <img
              src={imageUrl} alt={name} loading="lazy" decoding="async"
              className="w-full h-full object-contain p-2"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          {topBadge && !isSelected && (
            <div className="absolute top-1.5 left-1.5">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#fff' }}>
                <Star className="w-2 h-2 fill-white text-white" />
                Topp
              </span>
            </div>
          )}
          {onSelect && (
            <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected ? 'bg-[#0e6efe] border-[#0e6efe]' : 'bg-white/90 border-slate-300'
            }`}>
              {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </div>
          )}
          {monthlySaving != null && monthlySaving > 0 && (
            <div className="absolute top-1.5 right-1.5 text-white px-1 py-0.5 rounded text-[8px] font-bold"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              -{formatSEK(monthlySaving)}
            </div>
          )}
          {rating != null && !(monthlySaving && monthlySaving > 0) && !(equityFreed && equityFreed > 0) && !isSelected && (
            <ScoreBadge value={rating} />
          )}
          {/* no isCompared state */}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col p-3 gap-1">
          <h3 className="text-[13px] font-bold text-slate-900 leading-snug truncate">{name}</h3>
          <div className="flex flex-wrap items-center gap-1">
            {fuelLabel && <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{fuelLabel}</span>}
            {bodyLabel && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">{bodyLabel}</span>}
            {drivetrain?.includes('awd') && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-600">AWD</span>}
            {seats != null && seats > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                <Users className="w-2 h-2" />{seats}
              </span>
            )}
          </div>
          {displayComment && (
            <p className="text-[10px] text-slate-500 leading-snug line-clamp-1 italic">{displayComment}</p>
          )}
          {range && <OwnershipMeter carPrice={carPrice!} usedPrice={usedPrice} fuelLabel={fuelLabel} make={name.split(' ')[0]} mode={mode} />}
          {monthlySaving != null && monthlySaving > 0 && (
            <p className="text-[9px] font-semibold text-emerald-600">Sparar {formatSEK(monthlySaving)} kr/mån</p>
          )}
          {!onSelect && (
            <div className="flex items-center gap-1.5 mt-auto pt-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
                className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-white text-[11px] font-bold transition-all active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #1a7fff 0%, #0e6efe 60%, #0a57cc 100%)', boxShadow: '0 2px 8px rgba(14,110,254,0.28)' }}
              >
                Få prishjälp <ChevronRight className="w-3 h-3 opacity-80" />
              </button>
              {onDetail && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDetail(); }}
                  className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center transition-all active:scale-[0.97] hover:border-[#0e6efe]/40 hover:text-[#0e6efe]"
                >
                  <Info className="w-3 h-3" />
                </button>
              )}
              {onTcoCompare && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onTcoCompare(); }}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all active:scale-[0.97] ${isTcoCompared ? 'bg-[#0e6efe] border-[#0e6efe] text-white' : 'border-slate-200 text-slate-400 hover:border-[#0e6efe]/40 hover:text-[#0e6efe]'}`}
                  title={isTcoCompared ? 'Ta bort från jämförelse' : 'Jämför ägandekostnad'}
                >
                  <Scale className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: vertical layout */}
      <div className="hidden sm:block" onClick={handleCardClick}>
        <div className="relative aspect-[16/9] overflow-hidden">
          {imageUrl && (
            <img
              src={imageUrl} alt={name} loading="lazy" decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/70 to-transparent pointer-events-none" />
          {topBadge && !isSelected && (
            <div className="absolute top-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#fff', boxShadow: '0 2px 8px rgba(245,158,11,0.35)' }}>
                <Star className="w-2.5 h-2.5 fill-white text-white" />
                Toppval
              </span>
            </div>
          )}
          {onSelect && (
            <div className={`absolute top-2.5 left-2.5 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected ? 'bg-[#0e6efe] border-[#0e6efe] shadow-md scale-110' : 'bg-white/85 border-slate-300 backdrop-blur-sm'
            }`}>
              {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </div>
          )}
          {monthlySaving != null && monthlySaving > 0 && (
            <div className="absolute top-2.5 right-2.5 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 2px 8px rgba(16,185,129,0.35)' }}>
              -{formatSEK(monthlySaving)} kr/mån
            </div>
          )}
          {equityFreed != null && equityFreed > 0 && !(monthlySaving && monthlySaving > 0) && (
            <div className="absolute top-2.5 right-2.5 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 2px 8px rgba(16,185,129,0.35)' }}>
              +{formatSEK(equityFreed)} kr
            </div>
          )}
          {rating != null && !(monthlySaving && monthlySaving > 0) && !(equityFreed && equityFreed > 0) && !isSelected && (
            <ScoreBadge value={rating} />
          )}
        </div>

        <div className="px-3.5 pt-3 pb-2">
          <h3 className="text-[14px] font-bold text-slate-900 leading-snug truncate group-hover:text-[#0e6efe] transition-colors">
            {name}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {fuelLabel && <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{fuelLabel}</span>}
            {bodyType && BODY_LABELS[bodyType] && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">{BODY_LABELS[bodyType]}</span>
            )}
            {drivetrain?.includes('awd') && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-600">AWD</span>
            )}
            {seats != null && seats > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">
                <Users className="w-2.5 h-2.5" />{seats}
              </span>
            )}
          </div>
          {displayComment && (
            <p className="mt-1 text-[11px] text-slate-500 leading-snug line-clamp-1 italic">{displayComment}</p>
          )}
          {range && <div className="mt-1"><OwnershipMeter carPrice={carPrice!} usedPrice={usedPrice} fuelLabel={fuelLabel} make={name.split(' ')[0]} /></div>}
          {monthlySaving != null && monthlySaving > 0 && (
            <p className="mt-1 text-[10.5px] font-semibold text-emerald-600">Sparar {formatSEK(monthlySaving)} kr/mån</p>
          )}
          {equityFreed != null && equityFreed > 0 && (
            <p className="mt-1 text-[10.5px] font-semibold text-emerald-600">+{formatSEK(equityFreed)} kr frigörs</p>
          )}
        </div>
      </div>

      {/* Desktop actions */}
      {!onSelect && (
        <div className="hidden sm:block px-3.5 pb-3.5 space-y-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNegotiate(); }}
            className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl text-white text-[12.5px] font-bold transition-all active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #1a7fff 0%, #0e6efe 60%, #0a57cc 100%)', boxShadow: '0 3px 12px rgba(14,110,254,0.30)' }}
          >
            Få prishjälp <ChevronRight className="w-3.5 h-3.5 opacity-80" />
          </button>
          <div className="flex gap-1.5">
            {onDetail && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDetail(); }}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 text-[11px] font-semibold transition-all active:scale-[0.97] hover:border-[#0e6efe]/30 hover:text-[#0e6efe] hover:bg-[#0e6efe]/5"
              >
                <Info className="w-3 h-3" />
                Läs mer
              </button>
            )}
            {onTcoCompare && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onTcoCompare(); }}
                className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl border text-[11px] font-semibold transition-all active:scale-[0.97] ${isTcoCompared ? 'bg-[#0e6efe] border-[#0e6efe] text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-[#0e6efe]/30 hover:text-[#0e6efe] hover:bg-[#0e6efe]/5'}`}
                title={isTcoCompared ? 'Ta bort från jämförelse' : 'Jämför ägandekostnad'}
              >
                <Scale className="w-3 h-3" />
                {isTcoCompared ? 'Jämförs' : 'Jämför'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
