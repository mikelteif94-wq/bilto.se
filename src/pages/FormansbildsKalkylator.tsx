import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, Info, Briefcase, Car, Zap, Fuel, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta } from '../lib/pageMeta';
import { getAllComparisonCars } from '../lib/comparison';
import { useCatalogCars } from '../hooks/useCatalogCars';
import { useCarImages } from '../hooks/useCarImages';
import MobileMenu from '../components/MobileMenu';

interface FormansbildsKalkylatornProps {
  onBack: () => void;
  onNavigateConsultation: () => void;
}

const ALL_CARS = getAllComparisonCars();

// Skatteverket factors by income year
const YEAR_FACTORS: Record<number, number> = {
  2026: 0.317,
  2025: 0.299,
  2024: 0.290,
  2023: 0.290,
  2022: 0.290,
  2021: 0.290,
};
const INCOME_YEARS = [2026, 2025, 2024, 2023, 2022, 2021];

// Skatteverket formula: factor × nybilspris + 2 × fordonsskatt
// El/laddhybrid: multiply total by 0.60 (−40%)
// >3000 mil i tjänsten: multiply total by 0.75
function calcFormansvardeAr({
  nybilspris,
  extrautrustning,
  fordonsskatt,
  isElOrLaddhybrid,
  tjanstekorsning,
  year,
}: {
  nybilspris: number;
  extrautrustning: number;
  fordonsskatt: number;
  isElOrLaddhybrid: boolean;
  tjanstekorsning: boolean;
  year: number;
}): number {
  const factor = YEAR_FACTORS[year] ?? 0.290;
  const totalBilpris = nybilspris + extrautrustning;
  let annual = factor * totalBilpris + 2 * fordonsskatt;
  if (isElOrLaddhybrid) annual *= 0.60;
  if (tjanstekorsning) annual *= 0.75;
  return Math.round(annual);
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('sv-SE');
}

function parseSEK(s: string): number {
  const cleaned = s.replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

const MARGINALSKATTER = [
  { label: '32%', desc: 'Låg inkomst', value: 0.32 },
  { label: '42%', desc: 'Medel', value: 0.42 },
  { label: '52%', desc: 'Standard', value: 0.52 },
  { label: '57%', desc: 'Hög inkomst', value: 0.57 },
];

const BRANSLE_TYPES = [
  { id: 'bensin', label: 'Bensin / Diesel', Icon: Fuel },
  { id: 'laddhybrid', label: 'Laddhybrid (−40%)', Icon: Zap },
  { id: 'el', label: 'El (−40%)', Icon: Zap },
];

const QUICK_CARS = ALL_CARS
  .filter(c => c.is_active && c.pricing.new_from_sek)
  .sort((a, b) => (a.pricing.new_from_sek ?? 0) - (b.pricing.new_from_sek ?? 0))
  .slice(0, 24);

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
  volvo_xc70: '/getImage_(18).webp',
  volvo_v60_cross_country: '/getImage_(20).webp',
  volvo_v90_cross_country: '/getImage_(21).webp',
};

const FAQ_ITEMS = [
  {
    q: 'Vad är förmånsbil?',
    a: 'En förmånsbil är en bil du får av din arbetsgivare att använda privat, som en del av din lön. Du betalar skatt på förmånsvärdet – inte på bilen. Det kan vara ekonomiskt fördelaktigt jämfört med att köpa bilen privat.',
  },
  {
    q: 'Hur beräknas förmånsvärdet enligt Skatteverket?',
    a: 'Förmånsvärdet beräknas enligt Skatteverkets formel: faktor × nybilspriset + 2 × fordonsskatten. Faktorn för 2026 är 0,317. Elbilar och laddhybrider får 40% reduktion på förmånsvärdet.',
  },
  {
    q: 'Vad kostar en förmånsbil mig i plånboken?',
    a: 'Din månadskostnad är förmånsvärdet/12 × din marginalskatt. Vid ett förmånsvärde på 57 600 kr/år och 52% marginalskatt = ca 2 500 kr/mån i extra skatt. Arbetsgivaren betalar vanligtvis drivmedel, försäkring och service.',
  },
  {
    q: 'Varför är elbil billigare som förmånsbil?',
    a: 'Elbilar har 40% lägre förmånsvärde, vilket ger lägre månadsskatt. Dessutom är driftkostnaderna lägre. Men nybilspriset är ofta högre. Kalkylatorn visar exakt vad som är billigast för dig.',
  },
  {
    q: 'Vad innebär reducering för tjänstekörning?',
    a: 'Om du kör minst 3 000 mil i tjänsten per år reduceras förmånsvärdet med 25%. Kontrollera med din arbetsgivare om detta gäller för din tjänst.',
  },
  {
    q: 'Kan Bilto hjälpa mig förhandla förmånsbil?',
    a: 'Ja! Våra experter hjälper dig välja rätt modell, förhandla bästa pris med handlaren och se till att tjänstebilsavtalet är korrekt. Kostnadsfritt för dig som privatperson.',
  },
];

export default function FormansbildsKalkylator({ onBack, onNavigateConsultation }: FormansbildsKalkylatornProps) {
  setPageMeta({
    title: 'Förmånsbilskalkylator – beräkna förmånsskatt 2026 | Bilto',
    description: 'Räkna ut vad din förmånsbil kostar i skatt per månad enligt Skatteverkets formel 2026. Jämför elbil, laddhybrid och bensin.',
  });

  const { cars: catalogCars } = useCatalogCars();
  const { getCarImage } = useCarImages(catalogCars);

  const [incomeYear, setIncomeYear] = useState(2026);
  const [nybilspris, setNybilspris] = useState(450_000);
  const [extrautrustningStr, setExtrautrustningStr] = useState('');
  const [fordonsskattStr, setFordonsskattStr] = useState('');
  const [bransledTyp, setBransledTyp] = useState<'bensin' | 'laddhybrid' | 'el'>('bensin');
  const [marginalSkatt, setMarginalSkatt] = useState(0.52);
  const [tjanstekorsning, setTjanstekorsning] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hasExtrautrustning, setHasExtrautrustning] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const extrautrustning = parseSEK(extrautrustningStr);
  const fordonsskatt = parseSEK(fordonsskattStr);
  const isElOrLaddhybrid = bransledTyp === 'el' || bransledTyp === 'laddhybrid';

  const selectedCar = useMemo(() => QUICK_CARS.find(c => c.id === selectedCarId), [selectedCarId]);
  const selectedImg = useMemo(() => {
    if (!selectedCar) return undefined;
    if (LOCAL_IMAGES[selectedCar.id]) return LOCAL_IMAGES[selectedCar.id];
    return getCarImage(selectedCar.brand_display, selectedCar.model_display);
  }, [selectedCar, getCarImage]);

  const formansvardeAr = useMemo(() => calcFormansvardeAr({
    nybilspris,
    extrautrustning,
    fordonsskatt,
    isElOrLaddhybrid,
    tjanstekorsning,
    year: incomeYear,
  }), [nybilspris, extrautrustning, fordonsskatt, isElOrLaddhybrid, tjanstekorsning, incomeYear]);

  const formansvardeMan = Math.round(formansvardeAr / 12);
  const skattPerMan = Math.round(formansvardeMan * marginalSkatt);

  const RATE = 0.0799 / 12;
  const MONTHS = 60;
  const DOWN = 0.20;
  const loan = nybilspris * (1 - DOWN) * 1.01;
  const privatKop = Math.round((loan * RATE) / (1 - Math.pow(1 + RATE, -MONTHS)));
  const besparingVsPrivatKop = privatKop - skattPerMan;

  const sliderPct = ((nybilspris - 100_000) / (1_200_000 - 100_000)) * 100;
  const factor = YEAR_FACTORS[incomeYear] ?? 0.290;

  const handleCarSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const car = QUICK_CARS.find(c => c.id === e.target.value);
    setSelectedCarId(e.target.value);
    if (car?.pricing.new_from_sek) {
      setNybilspris(car.pricing.new_from_sek);
      const isElCar = car.specs.fuel_types.includes('el');
      const isLaddhybrid = car.specs.fuel_types.includes('laddhybrid');
      setBransledTyp(isElCar ? 'el' : isLaddhybrid ? 'laddhybrid' : 'bensin');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Floating pill nav — same as rest of Bilto */}
      <header className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]/40 backdrop-blur-md'}`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white">
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
          </button>
          <button onClick={onBack} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={onBack}
              className="text-[15px] text-white/70 hover:text-white transition font-medium">
              Köp bil
            </button>
            <span className="text-[15px] text-white font-bold underline underline-offset-4 decoration-white/50">
              Förmånsbil
            </span>
            <a href="/sa-funkar-det" className="text-[15px] text-white/70 hover:text-white transition font-medium">
              Så funkar det
            </a>
          </nav>
          <div className="flex items-center ml-auto gap-3">
            <a href="/gratis-konsultation"
              className="inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} active="Köp bil med hjälp" />

      {/* Hero — primary blue */}
      <div style={{ background: 'linear-gradient(135deg, #0a57cc 0%, #0e6efe 60%, #1a7fff 100%)' }}>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 right-0 w-80 h-80 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }} />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 pt-28 pb-10 sm:pt-32 sm:pb-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 text-white/80 text-[12px] font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/20">
                  <Briefcase className="w-3.5 h-3.5" />
                  Tjänstebil &amp; förmånsbil {incomeYear}
                </div>
                <h1 className="text-[26px] sm:text-[34px] font-extrabold text-white mb-2 leading-tight">
                  Förmånsbilskalkylator
                </h1>
                <p className="text-[14px] sm:text-[16px] text-white/65 max-w-lg leading-relaxed">
                  Räkna ut exakt vad din förmånsbil kostar i skatt – enligt Skatteverkets officiella formel.
                </p>
              </div>
              {selectedImg && selectedCar && (
                <div className="shrink-0 hidden sm:block">
                  <p className="text-[11px] text-white/50 text-center mb-1">{selectedCar.brand_display} {selectedCar.model_display}</p>
                  <img src={selectedImg} alt="" className="h-20 object-contain drop-shadow-lg" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 mt-6">
          {/* ── Inputs — second on mobile (order-2), left on desktop ── */}
          <div className="lg:col-span-3 lg:order-1 order-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">

              {/* Income year */}
              <div>
                <label className="text-[13px] font-bold text-slate-700 block mb-2">Inkomstår</label>
                <div className="flex flex-wrap gap-2">
                  {INCOME_YEARS.map(y => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setIncomeYear(y)}
                      className={`h-9 px-4 rounded-xl border-2 text-[13px] font-semibold transition ${
                        incomeYear === y
                          ? 'border-[#0e6efe] bg-[#0e6efe]/8 text-[#0e6efe]'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick pick from catalog */}
              <div>
                <label className="text-[13px] font-bold text-slate-700 block mb-2">Välj bil från katalog (valfritt)</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedCarId}
                    onChange={handleCarSelect}
                    className="w-full h-11 pl-9 pr-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 appearance-none"
                  >
                    <option value="">— Välj modell för att fylla i pris automatiskt —</option>
                    {QUICK_CARS.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.brand_display} {c.model_display} — {fmt(c.pricing.new_from_sek ?? 0)} kr
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Nybilspris slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[13px] font-bold text-slate-700">Nybilspris (inkl. moms)</label>
                  <span className="text-[16px] font-extrabold text-slate-900 tabular-nums">{fmt(nybilspris)} kr</span>
                </div>
                <input
                  type="range"
                  min={100_000}
                  max={1_200_000}
                  step={5_000}
                  value={nybilspris}
                  onChange={e => { setNybilspris(Number(e.target.value)); setSelectedCarId(''); }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #0e6efe ${sliderPct}%, #e2e8f0 ${sliderPct}%)` }}
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400">100 000 kr</span>
                  <span className="text-[10px] text-slate-400">1 200 000 kr</span>
                </div>
              </div>

              {/* Fordonsskatt */}
              <div>
                <label className="text-[13px] font-bold text-slate-700 block mb-2">
                  Fordonsskatt {incomeYear} (kr/år)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fordonsskattStr}
                    onChange={e => setFordonsskattStr(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="t.ex. 4 000"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 pointer-events-none">kr</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Finns på Transportstyrelsen eller i bilens dokument.</p>
              </div>

              {/* Extrautrustning toggle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-bold text-slate-700">Extrautrustning</label>
                  <button
                    type="button"
                    onClick={() => { setHasExtrautrustning(v => !v); if (hasExtrautrustning) setExtrautrustningStr(''); }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${hasExtrautrustning ? 'bg-[#0e6efe]' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${hasExtrautrustning ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {hasExtrautrustning && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="relative mt-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={extrautrustningStr}
                          onChange={e => setExtrautrustningStr(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="t.ex. 25 000"
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 pointer-events-none">kr</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!hasExtrautrustning && (
                  <p className="text-[11px] text-slate-400">Lägg till om bilen har tillvalsutrustning.</p>
                )}
              </div>

              {/* Drivmedel */}
              <div>
                <label className="text-[13px] font-bold text-slate-700 block mb-2.5">Drivmedel</label>
                <div className="grid grid-cols-3 gap-2">
                  {BRANSLE_TYPES.map(b => {
                    const active = bransledTyp === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBransledTyp(b.id as typeof bransledTyp)}
                        className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 text-[11.5px] font-semibold transition ${
                          active
                            ? 'border-[#0e6efe] bg-[#0e6efe]/8 text-[#0e6efe]'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <b.Icon className={`w-5 h-5 ${active ? 'text-[#0e6efe]' : 'text-slate-400'}`} />
                        <span className="leading-tight text-center px-1">{b.label}</span>
                      </button>
                    );
                  })}
                </div>
                {isElOrLaddhybrid && (
                  <div className="mt-2.5 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[11.5px] text-emerald-700 leading-relaxed">
                      Elbilar &amp; laddhybrider har <strong>40% reducerat</strong> förmånsvärde – ett starkt skatteavdrag.
                    </p>
                  </div>
                )}
              </div>

              {/* Tjänstekörning reducering */}
              <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-[13px] font-bold text-slate-700">Körs bilen minst 3 000 mil i tjänsten per år?</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ger 25% reducering av förmånsvärdet</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTjanstekorsning(v => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${tjanstekorsning ? 'bg-[#0e6efe]' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${tjanstekorsning ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Marginalskatt */}
              <div>
                <label className="text-[13px] font-bold text-slate-700 block mb-2.5">Din marginalskatt</label>
                <div className="grid grid-cols-4 gap-2">
                  {MARGINALSKATTER.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMarginalSkatt(m.value)}
                      className={`flex flex-col items-center py-2.5 rounded-xl border-2 transition ${
                        marginalSkatt === m.value
                          ? 'border-[#0e6efe] bg-[#0e6efe]/8'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-[14px] font-extrabold tabular-nums ${marginalSkatt === m.value ? 'text-[#0e6efe]' : 'text-slate-700'}`}>
                        {m.label}
                      </span>
                      <span className={`text-[9px] font-medium mt-0.5 ${marginalSkatt === m.value ? 'text-[#0e6efe]/70' : 'text-slate-400'}`}>
                        {m.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Formula explanation */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-[14px] font-bold text-slate-800 mb-1 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                Skatteverkets formel {incomeYear}
              </h2>
              <p className="text-[12px] text-slate-500 mb-4">
                <span className="font-semibold text-slate-700">{factor.toString().replace('.', ',')} × nybilspris + 2 × fordonsskatt</span>
                {isElOrLaddhybrid && <span className="text-emerald-600 font-semibold"> × 0,60 (el/laddhybrid)</span>}
                {tjanstekorsning && <span className="text-[#0e6efe] font-semibold"> × 0,75 (tjänstekörning)</span>}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'Nybilspris',
                    val: `${fmt(nybilspris + extrautrustning)} kr`,
                    note: extrautrustning ? `Inkl. ${fmt(extrautrustning)} kr utrustning` : 'Inkl. moms',
                  },
                  {
                    label: 'Förmånsvärde/år',
                    val: `${fmt(formansvardeAr)} kr`,
                    note: isElOrLaddhybrid ? 'Reducerat 40% (el)' : tjanstekorsning ? 'Reducerat 25%' : 'Standardberäkning',
                  },
                  {
                    label: 'Din skattekostnad',
                    val: `${fmt(skattPerMan)} kr/mån`,
                    note: `Vid ${Math.round(marginalSkatt * 100)}% marginalskatt`,
                  },
                ].map(({ label, val, note }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-[13px] sm:text-[15px] font-extrabold text-slate-800 tabular-nums leading-tight">{val}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Results column — first on mobile, right on desktop ── */}
          <div className="lg:col-span-2 lg:order-2 order-1 space-y-4">
            {/* Main result card */}
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{
              background: 'linear-gradient(135deg, #0a57cc 0%, #0e6efe 60%, #1a7fff 100%)',
            }}>
              <div className="p-5 sm:p-6">
                <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-4">
                  Din förmånsskatt
                </p>
                <div className="mb-1">
                  <span className="text-[46px] font-extrabold tabular-nums text-white leading-none">{fmt(skattPerMan)}</span>
                </div>
                <p className="text-[14px] font-semibold text-white/60 mb-5">kr per månad</p>

                <div className="space-y-2.5 border-t border-white/20 pt-4">
                  <ResultLine label={`Inkomstår`} value={`${incomeYear}`} />
                  <ResultLine label="Förmånsvärde / år" value={`${fmt(formansvardeAr)} kr`} />
                  <ResultLine label="Förmånsvärde / mån" value={`${fmt(formansvardeMan)} kr`} />
                  <ResultLine label="Marginalskatt" value={`${Math.round(marginalSkatt * 100)}%`} />
                  {isElOrLaddhybrid && <ResultLine label="El/laddhybrid-reduktion" value="−40%" highlight />}
                  {tjanstekorsning && <ResultLine label="Tjänstekörning-reduktion" value="−25%" highlight />}
                </div>
              </div>

              {selectedImg && selectedCar && (
                <div className="px-5 pb-4 sm:hidden">
                  <img src={selectedImg} alt="" className="h-16 object-contain mx-auto drop-shadow-lg" />
                </div>
              )}
            </div>

            {/* Comparison vs private loan */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-[13px] font-bold text-slate-800 mb-4">Jämförelse vs privat billån</p>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-700">Privat lån (60 mån, 8%)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Exkl. försäkring, service, skatt</p>
                  </div>
                  <span className="text-[14px] font-bold text-slate-800 tabular-nums whitespace-nowrap">{fmt(privatKop)} kr/mån</span>
                </div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-700">Förmånsskatt</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Exkl. bränsle (om arbetsgivaren betalar)</p>
                  </div>
                  <span className="text-[14px] font-bold text-[#0e6efe] tabular-nums whitespace-nowrap">{fmt(skattPerMan)} kr/mån</span>
                </div>
                <div className={`rounded-xl px-3.5 py-3 ${besparingVsPrivatKop > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <p className={`text-[12px] font-bold ${besparingVsPrivatKop > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {besparingVsPrivatKop > 0
                      ? `Förmånsbil kan spara ~${fmt(besparingVsPrivatKop)} kr/mån`
                      : `Privat köp kan vara ~${fmt(Math.abs(besparingVsPrivatKop))} kr/mån billigare`}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Exakt besparing beror på arbetsgivaravtal.</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={onNavigateConsultation}
              className="w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition text-white"
              style={{ background: 'linear-gradient(135deg, #060e1e 0%, #0e1c2f 60%, #0a57cc 100%)' }}
            >
              Prata med en bilexpert
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="text-[22px] font-extrabold text-slate-900 mb-5">Vanliga frågor om förmånsbil</h2>
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
                      <p className="px-5 pb-5 text-[13px] text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
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
      <span className="text-white/60">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-emerald-300' : 'text-white'}`}>{value}</span>
    </div>
  );
}
