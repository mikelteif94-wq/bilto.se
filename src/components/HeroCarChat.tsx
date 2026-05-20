import { useState, useRef, useEffect } from 'react';
import { Send, Car, ArrowRight, RotateCcw } from 'lucide-react';
import { getAllComparisonCars } from '../lib/comparison';
import type { ComparisonCar } from '../lib/comparison/types';
import { useCarImages } from '../hooks/useCarImages';

/* ── scoring helpers (minimal subset from CompareCarsPage) ── */

const BODY_ALIASES: Record<string, string[]> = {
  suv: ['suv', 'jeep', 'crossover', 'terrängbil', 'stadsjeep', 'offroad'],
  kombi: ['kombi', 'stationsvagn', 'herrgårdsvagn', 'estate', 'touring', 'avant'],
  sedan: ['sedan', 'saloon', 'limousine'],
  hatchback: ['halvkombi', 'hatchback', 'småbil', 'kompakt', 'liten', 'stadsbil'],
  mpv: ['mpv', 'minivan', 'familjebuss'],
};
const FUEL_ALIASES: Record<string, string[]> = {
  el: ['el', 'elbil', 'electric', 'elektrisk', 'batteri', 'räckvidd', 'ladda', 'ev'],
  hybrid: ['hybrid', 'phev', 'laddhybrid', 'plug', 'mild'],
  bensin: ['bensin', 'petrol'],
  diesel: ['diesel'],
};
const TRAIT_MAP: Array<{ keys: string[]; check: (c: ComparisonCar) => boolean; weight: number }> = [
  { keys: ['familj', 'barn', 'barnfamilj'], check: c => c.specs.seats >= 5 && (c.specs.trunk_liters || 0) >= 400, weight: 20 },
  { keys: ['hund', 'hundar', 'husdjur', 'djur'], check: c => (c.specs.trunk_liters || 0) >= 450 && (c.specs.body_type === 'suv' || c.specs.body_type === 'kombi'), weight: 22 },
  { keys: ['bagage', 'bagageutrymme', 'lastbar'], check: c => (c.specs.trunk_liters || 0) >= 450, weight: 18 },
  { keys: ['billig', 'prisvärd', 'budget', 'billigt'], check: c => c.ratings.value >= 8, weight: 18 },
  { keys: ['lyxig', 'lyx', 'premium', 'exklusiv'], check: c => c.segment === 'premium' || c.segment === 'luxury', weight: 18 },
  { keys: ['sportig', 'sport', 'rolig'], check: c => c.ratings.driving >= 8, weight: 18 },
  { keys: ['snabb', 'prestanda', 'kraft'], check: c => c.ratings.driving >= 8, weight: 16 },
  { keys: ['bekväm', 'komfort', 'tyst'], check: c => c.ratings.comfort >= 8, weight: 16 },
  { keys: ['rymlig', 'plats', 'stor', 'utrymme'], check: c => c.ratings.practicality >= 8, weight: 14 },
  { keys: ['säker', 'säkerhet', 'trygg'], check: c => (c.safety.euro_ncap_stars || 0) >= 5, weight: 14 },
  { keys: ['stad', 'city', 'urban', 'parkera'], check: c => c.specs.body_type === 'hatchback' || c.specs.body_type === 'suv', weight: 14 },
  { keys: ['sju', '7-sitsig', '7 sits', '7sits'], check: c => c.specs.seats >= 7, weight: 22 },
  { keys: ['miljövänlig', 'grön', 'klimat', 'co2'], check: c => c.specs.fuel_types.some(f => f === 'el' || f === 'hybrid' || f === 'laddhybrid'), weight: 16 },
  { keys: ['bäst', 'bästa', 'topp', 'populär'], check: c => c.ratings.overall >= 8, weight: 12 },
];

const BRANDS: [string, string][] = [
  ['volvo', 'volvo'], ['tesla', 'tesla'], ['bmw', 'bmw'], ['audi', 'audi'],
  ['mercedes', 'mercedes'], ['toyota', 'toyota'], ['vw', 'volkswagen'], ['volkswagen', 'volkswagen'],
  ['hyundai', 'hyundai'], ['kia', 'kia'], ['skoda', 'skoda'], ['ford', 'ford'],
  ['polestar', 'polestar'], ['honda', 'honda'], ['mazda', 'mazda'],
  ['porsche', 'porsche'], ['alfa', 'alfa romeo'], ['genesis', 'genesis'],
];

function detectBrand(q: string): string | null {
  for (const [a, b] of BRANDS) { if (q.includes(a)) return b; }
  return null;
}
function parseBodyTypes(q: string): string[] {
  return Object.entries(BODY_ALIASES).filter(([bt, aliases]) => aliases.some(a => q.includes(a)) || q.includes(bt)).map(([bt]) => bt);
}
function parseFuelTypes(q: string): string[] {
  return Object.entries(FUEL_ALIASES).filter(([ft, aliases]) => aliases.some(a => q.includes(a)) || q.includes(ft)).map(([ft]) => ft);
}

function scoreCar(car: ComparisonCar, q: string): number {
  const name = `${car.brand_display} ${car.model_display}`.toLowerCase();
  const brandLower = car.brand_display.toLowerCase();
  let score = 0;
  const rb = detectBrand(q);
  const rbt = parseBodyTypes(q);
  const rft = parseFuelTypes(q);
  if (name.includes(q.trim())) return 100;
  if (rb) {
    if (brandLower.includes(rb) || rb.includes(brandLower)) score += 35;
    else score -= 50;
  } else {
    for (const t of q.split(/[\s,]+/).filter(t => t.length >= 2)) {
      if (name.includes(t)) score += 12;
    }
  }
  if (rbt.length > 0) { if (rbt.includes(car.specs.body_type)) score += 30; else score -= 20; }
  if (rft.length > 0) { if (rft.some(ft => car.specs.fuel_types.includes(ft as never))) score += 28; else score -= 20; }
  for (const { keys, check, weight } of TRAIT_MAP) {
    if (keys.some(k => q.includes(k)) && check(car)) score += weight;
  }
  return score;
}

function buildResponse(q: string, count: number, fuzzy: boolean): string {
  if (count === 0) return 'Inga bilar matchade exakt. Prova t.ex. "familje-SUV", "elbil under 400 000 kr" eller "sportig kombi".';
  if (fuzzy) return 'Jag är inte 100% säker, men dessa liknar det du söker:';
  const q_lower = q.toLowerCase();
  const rb = detectBrand(q_lower);
  const rbt = parseBodyTypes(q_lower);
  const rft = parseFuelTypes(q_lower);
  const fuelLabel: Record<string, string> = { el: 'elbilar', hybrid: 'hybridbilar', bensin: 'bensinbilar', diesel: 'dieselbilar' };
  const bodyLabel: Record<string, string> = { suv: 'SUV', kombi: 'kombis', sedan: 'sedaner', hatchback: 'halvkombis', mpv: 'familjebilar' };
  const parts = [
    rb ? rb.charAt(0).toUpperCase() + rb.slice(1) : '',
    rbt.length > 0 ? (bodyLabel[rbt[0]] || rbt[0]) : '',
    rft.length > 0 ? (fuelLabel[rft[0]] || rft[0]) : '',
  ].filter(Boolean);
  const traitHints = [
    /sportig|sport/.test(q_lower) && 'sportig körning',
    /hund|husdjur/.test(q_lower) && 'stort lastutrymme',
    /familj|barn/.test(q_lower) && 'familjepraktisk',
    /billig|budget/.test(q_lower) && 'prisvärda',
  ].filter(Boolean) as string[];
  if (parts.length > 0) {
    let intro = `Här är de bästa ${parts.join('-')} alternativen`;
    if (traitHints.length > 0) intro += ` med ${traitHints[0]}`;
    return intro + ':';
  }
  if (traitHints.length > 0) return `Här är ${count} förslag med ${traitHints[0]}:`;
  return count <= 2 ? `Här är ${count === 1 ? 'ett förslag' : 'två förslag'} som matchar:` : `Jag hittade ${count} bilar som passar:`;
}

/* ── types ── */

interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
  cars?: ComparisonCar[];
  reformulations?: string[];
}

const LOCAL_IMAGES: Record<string, string> = {
  skoda_enyaq: '/getImage.webp', tesla_model_3: '/getImage_(1).webp',
  skoda_octavia: '/getImage_(2).webp', toyota_corolla: '/getImage_(3).webp',
  hyundai_ioniq5: '/getImage_ioniq5.webp', polestar_2: '/getImage_polestar2.webp',
  bmw_ix1: '/getImage_(6).webp', mercedes_eqc: '/getImage_(7).webp',
  bmw_2_series: '/getImage_(8).webp', skoda_superb: '/getImage_(9).webp',
  volvo_xc90: '/getImage_(11).webp', volvo_v60: '/getImage_(15).webp',
};

const FUEL_LABELS: Record<string, string> = {
  bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid', laddhybrid: 'Laddhybrid', el: 'El',
};

const QUICK_QUERIES = [
  { label: 'Familje-SUV', query: 'Familje-SUV under 400k' },
  { label: 'Bästa elbilen', query: 'Bästa elbilen' },
  { label: 'Sportig kombi', query: 'Sportig kombi' },
  { label: 'Billig första bil', query: 'Billig första bil' },
  { label: 'Bil för hund', query: 'Bil för hund' },
  { label: 'SUV med 7 platser', query: 'SUV med 7 platser' },
];

interface Props {
  onNegotiate?: (carName: string) => void;
  /** compact = fits inside the small hero widget, full = standalone */
  variant?: 'compact' | 'full';
}

export default function HeroCarChat({ onNegotiate, variant = 'compact' }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const { getCarImage } = useCarImages();
  const allCars = getAllComparisonCars();

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages]);

  const getImg = (car: ComparisonCar): string | undefined =>
    LOCAL_IMAGES[car.id] || getCarImage(car.brand_display, car.model_display);

  const submit = (override?: string) => {
    const q = (override ?? input).trim().toLowerCase();
    if (!q) return;

    const scored = allCars
      .map(car => ({ car, score: scoreCar(car, q) }))
      .sort((a, b) => b.score + b.car.ratings.overall * 0.3 - (a.score + a.car.ratings.overall * 0.3));

    const brandCount: Record<string, number> = {};
    let candidates = scored.filter(r => r.score >= 15).filter(r => {
      const b = r.car.brand_display;
      brandCount[b] = (brandCount[b] || 0) + 1;
      return brandCount[b] <= 2;
    }).slice(0, 6).map(r => r.car);

    let fuzzy = false;
    if (candidates.length === 0) {
      candidates = scored.filter(r => r.score >= 5).slice(0, 4).map(r => r.car);
      fuzzy = candidates.length > 0;
    }

    const reformulations: string[] = candidates.length === 0
      ? ['Familje-SUV under 400k', 'Bästa elbilen', 'Sportig kombi']
      : [];

    setMessages(prev => [
      ...prev,
      { role: 'user', text: override ?? input },
      { role: 'assistant', text: buildResponse(q, candidates.length, fuzzy), cars: candidates, reformulations },
    ]);
    setInput('');
  };

  const isCompact = variant === 'compact';

  return (
    <div className="flex flex-col">
      {/* Message thread */}
      {messages.length > 0 && (
        <div
          className={`overflow-y-auto overscroll-contain space-y-3 p-3 ${
            isCompact ? 'max-h-[260px]' : 'max-h-[400px] p-4 sm:p-5'
          }`}
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[92%]">
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-full bg-[#0e6efe] flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white leading-none">B</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">Bilto</span>
                  </div>
                )}
                <div className={`px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#0e6efe] text-white rounded-br-sm'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.text}
                </div>

                {/* Car chips */}
                {msg.cars && msg.cars.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {msg.cars.slice(0, isCompact ? 4 : 6).map((car) => {
                      const img = getImg(car);
                      return (
                        <button
                          key={car.id}
                          type="button"
                          onClick={() => onNegotiate?.(`${car.brand_display} ${car.model_display}`)}
                          className="flex items-center gap-2 bg-white ring-1 ring-slate-200 rounded-lg px-2 py-1.5 hover:ring-[#0e6efe] hover:shadow-sm transition text-left group"
                        >
                          <div className="w-10 h-7 rounded bg-slate-100 overflow-hidden shrink-0">
                            {img
                              ? <img src={img} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><Car className="w-3 h-3 text-slate-300" /></div>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-900 truncate leading-tight">{car.brand_display}</p>
                            <p className="text-[10px] text-slate-500 truncate leading-tight">{car.model_display}</p>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-[#0e6efe] shrink-0 ml-auto transition" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fuel tags */}
                {msg.cars && msg.cars.length > 0 && !isCompact && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {[...new Set(msg.cars.flatMap(c => c.specs.fuel_types))].map(f => (
                      <span key={f} className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                        {FUEL_LABELS[f] || f}
                      </span>
                    ))}
                  </div>
                )}

                {/* Reformulations */}
                {msg.reformulations && msg.reformulations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.reformulations.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => submit(r)}
                        className="text-[11px] text-[#0e6efe] bg-blue-50 rounded-full px-2.5 py-1 hover:bg-[#0e6efe] hover:text-white transition"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}

      {/* Quick suggestions — only when empty */}
      {messages.length === 0 && (
        <div className="px-3 pt-3 pb-2 flex flex-wrap gap-1.5">
          {QUICK_QUERIES.map(({ label, query }) => (
            <button
              key={label}
              type="button"
              onClick={() => submit(query)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#0e6efe] hover:text-white text-[11px] text-slate-600 font-medium transition"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className={`border-t border-slate-100 bg-white ${isCompact ? 'p-3' : 'p-3 sm:p-4'}`}>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 transition"
              title="Börja om"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder='T.ex. "elbil för familj" eller "sportig SUV"...'
            className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[12px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/20 focus:border-[#0e6efe] transition placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => submit()}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-lg bg-[#0e6efe] hover:bg-[#0a57cc] disabled:opacity-40 text-white flex items-center justify-center transition shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
