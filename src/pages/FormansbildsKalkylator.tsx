import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, Info, Briefcase, Car, Zap, Fuel, ChevronLeft, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta } from '../lib/pageMeta';
import { getAllComparisonCars } from '../lib/comparison';
import { useCatalogCars } from '../hooks/useCatalogCars';
import { useCarImages } from '../hooks/useCarImages';

interface FormansbildsKalkylatornProps {
  onBack: () => void;
  onNavigateConsultation: () => void;
}

const ALL_CARS = getAllComparisonCars();

const PRISBASBELOPP_2025 = 58_800;

function calcFormansvardeAr(nybilspris: number, isEl: boolean): number {
  const raw = 0.29 * nybilspris + 0.75 * PRISBASBELOPP_2025;
  return isEl ? raw * 0.60 : raw;
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('sv-SE');
}

const MARGINALSKATTER = [
  { label: '32%', desc: 'Låg inkomst', value: 0.32 },
  { label: '42%', desc: 'Medel', value: 0.42 },
  { label: '52%', desc: 'Standard', value: 0.52 },
  { label: '57%', desc: 'Hög inkomst', value: 0.57 },
];

const BRANSLE_TYPES = [
  { id: 'bensin', label: 'Bensin / Diesel', Icon: Fuel },
  { id: 'hybrid', label: 'Hybrid', Icon: Zap },
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

  const { cars: catalogCars } = useCatalogCars();
  const { getCarImage } = useCarImages(catalogCars);

  const [nybilspris, setNybilspris] = useState(450_000);
  const [bransledTyp, setBransledTyp] = useState<'bensin' | 'hybrid' | 'el'>('bensin');
  const [marginalSkatt, setMarginalSkatt] = useState(0.52);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<string>('');

  const selectedCar = useMemo(() => QUICK_CARS.find(c => c.id === selectedCarId), [selectedCarId]);
  const selectedImg = useMemo(() => {
    if (!selectedCar) return undefined;
    if (LOCAL_IMAGES[selectedCar.id]) return LOCAL_IMAGES[selectedCar.id];
    return getCarImage(selectedCar.brand_display, selectedCar.model_display);
  }, [selectedCar, getCarImage]);

  const isEl = bransledTyp === 'el';

  const formansvardeAr = useMemo(() => calcFormansvardeAr(nybilspris, isEl), [nybilspris, isEl]);
  const formansvardeMan = formansvardeAr / 12;
  const skattPerMan = formansvardeMan * marginalSkatt;

  const RATE = 0.0799 / 12;
  const MONTHS = 60;
  const DOWN = 0.20;
  const loan = nybilspris * (1 - DOWN) * 1.01;
  const privatKop = (loan * RATE) / (1 - Math.pow(1 + RATE, -MONTHS));
  const besparingVsPrivatKop = privatKop - skattPerMan;

  const sliderPct = ((nybilspris - 100_000) / (1_200_000 - 100_000)) * 100;

  const handleCarSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const car = QUICK_CARS.find(c => c.id === e.target.value);
    setSelectedCarId(e.target.value);
    if (car?.pricing.new_from_sek) {
      setNybilspris(car.pricing.new_from_sek);
      const isElCar = car.specs.fuel_types.includes('el');
      const isHybrid = car.specs.fuel_types.some(f => ['laddhybrid', 'hybrid', 'mildhybrid'].includes(f));
      setBransledTyp(isElCar ? 'el' : isHybrid ? 'hybrid' : 'bensin');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #060e1e 0%, #0a1628 6%, #f8f9fb 18%)' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-40" style={{
        background: 'linear-gradient(180deg, #0a57cc 0%, #0e6efe 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(10,87,204,0.28)',
      }}>
        <div className="h-[2px] w-full" style={{
          background: 'linear-gradient(90deg, rgba(251,191,36,0.7) 0%, rgba(255,255,255,0.4) 40%, rgba(56,189,248,0.6) 100%)',
        }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-white/80 hover:text-white transition text-[13px] font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-10 w-auto object-contain" />
          <div className="flex items-center gap-2 ml-1">
            <Calculator className="w-4 h-4 text-white/60" />
            <span className="text-[14px] font-bold text-white">Förmånsbilskalkylator</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(14,110,254,0.6) 0%, transparent 70%)' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-[12px] font-semibold px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm border border-white/10">
                <Briefcase className="w-3.5 h-3.5" />
                Tjänstebil &amp; förmånsbil 2025
              </div>
              <h1 className="text-[26px] sm:text-[36px] font-extrabold text-white mb-2 leading-tight">
                Förmånsbilskalkylator
              </h1>
              <p className="text-[14px] sm:text-[16px] text-white/60 max-w-lg leading-relaxed">
                Räkna ut exakt vad din förmånsbil kostar i skatt – och jämför mot privat billån.
              </p>
            </div>
            {selectedImg && selectedCar && (
              <div className="shrink-0 hidden sm:block">
                <p className="text-[11px] text-white/40 text-center mb-1">{selectedCar.brand_display} {selectedCar.model_display}</p>
                <img src={selectedImg} alt="" className="h-20 object-contain drop-shadow-lg" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 -mt-4">
          {/* Inputs */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
              {/* Quick pick */}
              <div>
                <label className="text-[13px] font-bold text-slate-700 block mb-2">Välj bil från katalog</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedCarId}
                    onChange={handleCarSelect}
                    className="w-full h-11 pl-9 pr-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 appearance-none"
                  >
                    <option value="">— Valfritt: välj från katalog —</option>
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

              {/* Fuel type */}
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
                        className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 text-[12px] font-semibold transition ${
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
                {isEl && (
                  <div className="mt-2.5 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[11.5px] text-emerald-700 leading-relaxed">
                      Elbilar &amp; laddhybrider har <strong>40% reducerat</strong> förmånsvärde – ett starkt skatteavdrag.
                    </p>
                  </div>
                )}
              </div>

              {/* Marginalskatt */}
              <div>
                <label className="text-[13px] font-bold text-slate-700 block mb-2.5">Marginalskatt</label>
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

            {/* Formula card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-[14px] font-bold text-slate-800 mb-1 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                Hur beräknas förmånsvärdet?
              </h2>
              <p className="text-[12px] text-slate-500 mb-4">
                Formel: <span className="font-semibold text-slate-700">0,29 × nybilspris + 0,75 × 58 800 kr</span>
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Nybilspris', val: `${fmt(nybilspris)} kr`, note: 'Inkl. moms och utrustning' },
                  { label: 'Förmånsvärde/år', val: `${fmt(formansvardeAr)} kr`, note: isEl ? 'Reducerat med 40% (el)' : 'Standardberäkning' },
                  { label: 'Din skattekostnad', val: `${fmt(skattPerMan)} kr/mån`, note: `Vid ${Math.round(marginalSkatt * 100)}% marginalskatt` },
                ].map(({ label, val, note }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-[15px] font-extrabold text-slate-800 tabular-nums leading-tight">{val}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main result */}
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{
              background: 'linear-gradient(135deg, #0a57cc 0%, #0e6efe 60%, #1a7fff 100%)',
            }}>
              <div className="p-5 sm:p-6">
                <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-4">
                  Din förmånsbil kostar
                </p>
                <div className="mb-1">
                  <span className="text-[46px] font-extrabold tabular-nums text-white leading-none">{fmt(skattPerMan)}</span>
                </div>
                <p className="text-[14px] font-semibold text-white/60 mb-5">kr per månad i inkomstskatt</p>

                <div className="space-y-2.5 border-t border-white/20 pt-4">
                  <ResultLine label="Förmånsvärde / år" value={`${fmt(formansvardeAr)} kr`} />
                  <ResultLine label="Förmånsvärde / mån" value={`${fmt(formansvardeMan)} kr`} />
                  <ResultLine label="Marginalskatt" value={`${Math.round(marginalSkatt * 100)}%`} />
                  {isEl && <ResultLine label="El-reduktion" value="−40%" highlight />}
                </div>
              </div>

              {selectedImg && selectedCar && (
                <div className="px-5 pb-4 sm:hidden">
                  <img src={selectedImg} alt="" className="h-16 object-contain mx-auto drop-shadow-lg" />
                </div>
              )}
            </div>

            {/* Comparison */}
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
              className="w-full h-13 py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition text-white"
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
