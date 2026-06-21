import { useState, useMemo } from 'react';
import { Calculator, ChevronDown, ChevronUp, ArrowRight, Info, Briefcase, Car, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta } from '../lib/pageMeta';
import { getAllComparisonCars } from '../lib/comparison';

interface FormansbildsKalkylatornProps {
  onBack: () => void;
  onNavigateConsultation: () => void;
}

const ALL_CARS = getAllComparisonCars();

// Förmånsvärdesberäkning (Skatteverket 2025-2026)
// Nybilspris × 0.29 + 0.75 × prisbasbeloppet
// Prisbasbeloppet 2025: 58 800 kr
// El-bilar: reduktion 40% (faktorn 0.60 fram t.o.m. 2026)
const PRISBASBELOPP_2025 = 58_800;

function calcFormansvardeAr(nybilspris: number, isEl: boolean): number {
  const raw = 0.29 * nybilspris + 0.75 * PRISBASBELOPP_2025;
  return isEl ? raw * 0.60 : raw;
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('sv-SE');
}

const MARGINALSKATTER = [
  { label: '32% (låg inkomst)', value: 0.32 },
  { label: '42% (medel)', value: 0.42 },
  { label: '52% (standard)', value: 0.52 },
  { label: '57% (hög inkomst)', value: 0.57 },
];

const BRANSLE_TYPES = [
  { id: 'bensin', label: 'Bensin / Diesel', icon: '⛽' },
  { id: 'hybrid', label: 'Hybrid', icon: '🔋' },
  { id: 'el', label: 'El (40% reduktion)', icon: '⚡' },
];

const QUICK_CARS = ALL_CARS
  .filter(c => c.is_active && c.pricing.new_from_sek)
  .sort((a, b) => (a.pricing.new_from_sek ?? 0) - (b.pricing.new_from_sek ?? 0))
  .slice(0, 20);

const FAQ_ITEMS = [
  {
    q: 'Vad är förmånsbil?',
    a: 'En förmånsbil är en bil du får av din arbetsgivare att använda privat, som en del av din lön. Du betalar skatt på förmånsvärdet – inte på bilen. Det kan vara ekonomiskt fördelaktigt jämfört med att köpa bilen privat.',
  },
  {
    q: 'Hur beräknas förmånsvärdet?',
    a: 'Förmånsvärdet beräknas enligt Skatteverkets regler: 0,29 × nybilspriset + 0,75 × prisbasbeloppet (58 800 kr 2025). Elbilar och laddhybrider (t.o.m. juni 2026) får 40 % rabatt på förmånsvärdet.',
  },
  {
    q: 'Vad kostar en förmånsbil mig i plånboken?',
    a: 'Din månadskostnad är förmånsvärdet/12 × din marginalskatt. Vid en bil med förmånsvärde 90 000 kr/år och 52% marginalskatt = 3 900 kr/mån i extra skatt. Arbetsgivaren betalar vanligtvis drivmedel, försäkring och service.',
  },
  {
    q: 'Är elbil alltid bäst som förmånsbil?',
    a: 'Elbilar har 40% lägre förmånsvärde, vilket ger lägre månadsskatt. Dessutom är driftkostnaderna lägre. Men nybilspriset är ofta högre. Kalkylatorn visar exakt vad som är billigast för dig.',
  },
  {
    q: 'Kan Bilto hjälpa mig förhandla förmånsbil?',
    a: 'Ja! Våra experter hjälper dig välja rätt modell, förhandla bästa pris med handlaren och se till att tjänstebilsavtalet är korrekt. Kostnadsfritt för dig som privatperson.',
  },
];

export default function FormansbildsKalkylator({ onBack, onNavigateConsultation }: FormansbildsKalkylatornProps) {
  setPageMeta({
    title: 'Förmånsbilskalkylator – beräkna förmånsskatt | Bilto',
    description: 'Räkna ut vad din förmånsbil kostar i skatt per månad. Jämför elbil, bensin och diesel enligt Skatteverkets regler 2025.',
  });

  const [nybilspris, setNybilspris] = useState(450_000);
  const [bransledTyp, setBransledTyp] = useState<'bensin' | 'hybrid' | 'el'>('bensin');
  const [marginalSkatt, setMarginalSkatt] = useState(0.52);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedCar, setSelectedCar] = useState<string>('');

  const isEl = bransledTyp === 'el';

  const formansvardeAr = useMemo(() => calcFormansvardeAr(nybilspris, isEl), [nybilspris, isEl]);
  const formansvardeMan = formansvardeAr / 12;
  const skattPerMan = formansvardeMan * marginalSkatt;

  // Jämförelse: köp privat (lån 60 mån, 8%)
  const RATE = 0.0799 / 12;
  const MONTHS = 60;
  const DOWN = 0.20;
  const loan = nybilspris * (1 - DOWN) * 1.01;
  const privatKop = (loan * RATE) / (1 - Math.pow(1 + RATE, -MONTHS));

  const besparingVsPrivatKop = privatKop - skattPerMan;

  const sliderPct = ((nybilspris - 100_000) / (1_200_000 - 100_000)) * 100;

  const handleCarSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const car = QUICK_CARS.find(c => c.id === e.target.value);
    setSelectedCar(e.target.value);
    if (car && car.pricing.new_from_sek) {
      setNybilspris(car.pricing.new_from_sek);
      const isElCar = car.specs.fuel_types.includes('el');
      const isHybrid = car.specs.fuel_types.includes('laddhybrid') || car.specs.fuel_types.includes('hybrid') || car.specs.fuel_types.includes('mildhybrid');
      setBransledTyp(isElCar ? 'el' : isHybrid ? 'hybrid' : 'bensin');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-900 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-10 w-auto object-contain" />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#0e6efe]/10 text-[#0e6efe] text-[12px] font-semibold px-4 py-1.5 rounded-full mb-4">
            <Briefcase className="w-3.5 h-3.5" />
            Tjänstebil &amp; förmånsbil
          </div>
          <h1 className="text-[28px] sm:text-[38px] font-extrabold text-slate-900 mb-3">
            Förmånsbilskalkylator
          </h1>
          <p className="text-[15px] sm:text-[17px] text-slate-500 max-w-xl mx-auto leading-relaxed">
            Beräkna vad din förmånsbil kostar i skatt – och jämför mot att köpa privat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Inputs ── */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
              {/* Quick pick */}
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-2">Välj bil snabbt</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedCar}
                    onChange={handleCarSelect}
                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 appearance-none"
                  >
                    <option value="">— Välj från katalog (valfritt) —</option>
                    {QUICK_CARS.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.brand_display} {c.model_display} — {fmt(c.pricing.new_from_sek ?? 0)} kr
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Price slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-semibold text-slate-700">Nybilspris (inkl. moms)</label>
                  <span className="text-[14px] font-extrabold text-slate-800 tabular-nums">{fmt(nybilspris)} kr</span>
                </div>
                <input
                  type="range"
                  min={100_000}
                  max={1_200_000}
                  step={5_000}
                  value={nybilspris}
                  onChange={e => { setNybilspris(Number(e.target.value)); setSelectedCar(''); }}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #0e6efe ${sliderPct}%, #e2e8f0 ${sliderPct}%)`,
                  }}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-400">100 000 kr</span>
                  <span className="text-[10px] text-slate-400">1 200 000 kr</span>
                </div>
              </div>

              {/* Fuel type */}
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-2">Drivmedel</label>
                <div className="grid grid-cols-3 gap-2">
                  {BRANSLE_TYPES.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBransledTyp(b.id as typeof bransledTyp)}
                      className={`flex flex-col items-center gap-1 h-16 rounded-xl border-2 text-[12px] font-semibold transition ${
                        bransledTyp === b.id
                          ? 'border-[#0e6efe] bg-[#0e6efe]/8 text-[#0e6efe]'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[18px]">{b.icon}</span>
                      <span className="leading-tight text-center px-1">{b.label}</span>
                    </button>
                  ))}
                </div>
                {isEl && (
                  <p className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 flex items-start gap-1.5">
                    <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Elbilar &amp; laddhybrider har 40% reducerat förmånsvärde – ett starkt skatteavdrag.
                  </p>
                )}
              </div>

              {/* Marginalskatt */}
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-2">Marginalskatt</label>
                <div className="grid grid-cols-2 gap-2">
                  {MARGINALSKATTER.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMarginalSkatt(m.value)}
                      className={`h-11 rounded-xl border-2 text-[12px] font-semibold transition ${
                        marginalSkatt === m.value
                          ? 'border-[#0e6efe] bg-[#0e6efe]/8 text-[#0e6efe]'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Results ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main result */}
            <div className="bg-[#0e6efe] rounded-2xl p-5 sm:p-6 text-white">
              <p className="text-[12px] font-semibold text-white/70 uppercase tracking-wide mb-3">
                Din förmånsbil kostar
              </p>
              <div className="mb-4">
                <span className="text-[40px] font-extrabold tabular-nums leading-none">{fmt(skattPerMan)}</span>
                <span className="text-[16px] font-semibold text-white/70 ml-2">kr/mån</span>
                <p className="text-[12px] text-white/60 mt-1">i extra inkomstskatt</p>
              </div>

              <div className="space-y-2 border-t border-white/20 pt-3">
                <ResultLine label="Förmånsvärde / år" value={`${fmt(formansvardeAr)} kr`} />
                <ResultLine label="Förmånsvärde / mån" value={`${fmt(formansvardeMan)} kr`} />
                <ResultLine label="Marginalskatt" value={`${Math.round(marginalSkatt * 100)}%`} />
                {isEl && <ResultLine label="El-reduktion" value="−40%" highlight />}
              </div>
            </div>

            {/* Comparison */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-[13px] font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-400" />
                Jämförelse vs privat billån
              </p>
              <div className="space-y-2.5">
                <CompareResultLine
                  label="Privat lån (60 mån, 8%)"
                  value={`${fmt(privatKop)} kr/mån`}
                  sub="Exkl. försäkring, service, skatt"
                />
                <CompareResultLine
                  label="Förmånsskatt"
                  value={`${fmt(skattPerMan)} kr/mån`}
                  sub="Exkl. bränsle (om arbetsgivare betalar)"
                />
                <div className={`rounded-xl px-3 py-2.5 ${besparingVsPrivatKop > 0 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <p className={`text-[11px] font-semibold ${besparingVsPrivatKop > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {besparingVsPrivatKop > 0
                      ? `Förmånsbil kan spara ~${fmt(besparingVsPrivatKop)} kr/mån`
                      : `Privat köp kan vara ~${fmt(Math.abs(besparingVsPrivatKop))} kr/mån billigare`}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Jämförelse varierar – konsultera din rådgivare.</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={onNavigateConsultation}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition"
            >
              Prata med en bilexpert
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Forklaring */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-[16px] font-bold text-slate-900 mb-1">Hur beräknas förmånsvärdet?</h2>
          <p className="text-[13px] text-slate-500 mb-4">Formel: <span className="font-semibold text-slate-700">0,29 × nybilspris + 0,75 × prisbasbeloppet (58 800 kr)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Nybilspris', val: `${fmt(nybilspris)} kr`, note: 'Inklusive moms och extrautrustning' },
              { label: 'Förmånsvärde/år', val: `${fmt(formansvardeAr)} kr`, note: isEl ? 'Reducerat med 40% (el)' : 'Standardberäkning' },
              { label: 'Din skattekostnad', val: `${fmt(skattPerMan)} kr/mån`, note: `Vid ${Math.round(marginalSkatt * 100)}% marginalskatt` },
            ].map(({ label, val, note }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-[18px] font-extrabold text-slate-800 tabular-nums">{val}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8">
          <h2 className="text-[20px] font-extrabold text-slate-900 mb-4">Vanliga frågor om förmånsbil</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
                >
                  <span className="text-[14px] font-semibold text-slate-800 pr-4">{item.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-[13px] text-slate-600 leading-relaxed border-t border-slate-100">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SiteFooter onNavigate={() => onBack()} />
    </div>
  );
}

function ResultLine({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-white/70">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-emerald-300' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function CompareResultLine({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[12px] font-semibold text-slate-700">{label}</p>
        <p className="text-[10px] text-slate-400">{sub}</p>
      </div>
      <span className="text-[13px] font-bold text-slate-800 tabular-nums whitespace-nowrap">{value}</span>
    </div>
  );
}
