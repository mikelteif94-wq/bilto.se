import { useState, useEffect, lazy, Suspense } from 'react';
import { ArrowRight, Check, Car, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllComparisonCars } from '../lib/comparison';
import type { ComparisonCar } from '../lib/comparison/types';
import { useCarImages } from '../hooks/useCarImages';
import { useCatalogCars } from '../hooks/useCatalogCars';
import CompactCarCard from '../components/CompactCarCard';
import ElCarCard from '../components/ElCarCard';
import QuizFlow from '../components/quiz/QuizFlow';
import { QuizComplete } from '../components/quiz/QuizComplete';
import { QuizResults } from '../components/quiz/QuizResults';
import type { QuizAnswers } from '../components/quiz/QuizTypes';
import { SiteFooter } from '../components/SiteFooter';

const CarFitQuiz = lazy(() => import('../components/CarFitQuiz').then(m => ({ default: m.CarFitQuiz })));

const LOCAL_IMAGES: Record<string, string> = {
  skoda_enyaq: '/getImage.webp',
  tesla_model_3: '/getImage_(1).webp',
  skoda_octavia: '/getImage_(2).webp',
  toyota_corolla: '/getImage_(3).webp',
  hyundai_ioniq5: '/getImage_ioniq5.webp',
  polestar_2: '/getImage_polestar2.webp',
  bmw_ix1: '/getImage_(6).webp',
  mercedes_eqc: '/getImage_(7).webp',
};

function resolveCarImage(carId: string, brand: string, model: string, getCarImage: (b: string, m: string) => string | undefined): string | undefined {
  if (LOCAL_IMAGES[carId]) return LOCAL_IMAGES[carId];
  return getCarImage(brand, model);
}

const FUEL_LABELS: Record<string, string> = {
  el: 'El', bensin: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid', laddhybrid: 'Laddhybrid',
};

const POPULAR_IDS = ['tesla_model_y', 'volvo_xc60', 'kia_ev6', 'toyota_rav4', 'volvo_xc40', 'vw_golf'];

const EV_SHOWCASE = [
  { id: 'tesla_model_y', tagline: 'Sveriges mest sålda' },
  { id: 'volvo_ex30', tagline: 'Kompakt och snabb' },
  { id: 'kia_ev6', tagline: 'Snabbladdningskung' },
  { id: 'hyundai_ioniq5', tagline: 'Ultrasnabb laddning' },
  { id: 'tesla_model_3', tagline: 'Sportig elsedan' },
  { id: 'polestar_2', tagline: 'Svensk sportelbil' },
];

type QuizStep = 'idle' | 'active' | 'analyzing' | 'results';

interface Props {
  onBack: () => void;
}

export default function UtforskaSida({ onBack }: Props) {
  const [allCars, setAllCars] = useState<ComparisonCar[]>([]);
  const { cars: dbCars } = useCatalogCars();
  const { getCarImage } = useCarImages(dbCars);
  const [fitQuizCar, setFitQuizCar] = useState<ComparisonCar | null>(null);
  const [quizStep, setQuizStep] = useState<QuizStep>('idle');
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null);
  const [analysisReady, setAnalysisReady] = useState(false);

  useEffect(() => {
    import('../lib/comparison').then(m => setAllCars(m.getAllComparisonCars()));
  }, []);

  const popularCars = POPULAR_IDS
    .map(id => allCars.find(c => c.id === id))
    .filter((c): c is ComparisonCar => !!c);

  const handleQuizComplete = (answers: QuizAnswers) => {
    setQuizAnswers(answers);
    setQuizStep('analyzing');
    setAnalysisReady(false);
    setTimeout(() => setAnalysisReady(true), 2200);
  };

  const handleQuizReset = () => {
    setQuizStep('idle');
    setQuizAnswers(null);
    setAnalysisReady(false);
  };

  const navigateToBuy = (carLabel: string) => {
    window.history.pushState({}, '', `/kop-bil/bestall?bil=${encodeURIComponent(carLabel)}&typ=found`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-50 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button onClick={onBack} className="shrink-0 -ml-2 lg:-ml-3 flex items-center">
            <img
              src="/a_clean_graphic_logo_on_a_transparent_background.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
            />
          </button>
          <div className="flex items-center ml-auto">
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/gratis-konsultation');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap"
            >
              Kostnadsfri konsultation
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#0e6efe] px-4 sm:px-6 pt-[calc(69px+48px)] sm:pt-[calc(80px+56px)] pb-14 sm:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-[11px] font-bold uppercase tracking-[0.18em] px-4 py-1.5 rounded-full mb-6">
            Experternas val
          </div>
          <h1 className="text-[32px] sm:text-[52px] lg:text-[60px] font-bold text-white leading-[1.04] tracking-[-0.025em]">
            Hitta bilen som passar dig
          </h1>
          <p className="mt-5 text-white/80 text-[16px] sm:text-[19px] leading-[1.65] max-w-xl mx-auto">
            Handplockade rekommendationer, personlig bilmatch och de hetaste elbilarna – allt på ett ställe.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                document.getElementById('bilmatch-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-xl bg-white text-[#0e6efe] font-bold text-[15px] hover:bg-slate-100 transition shadow-lg"
            >
              Testa bilmatch
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Experternas val */}
      {popularCars.length > 0 && (
        <section className="bg-white px-4 sm:px-6 py-14 sm:py-20">
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-3">EXPERTERNAS VAL</p>
              <h2 className="text-[24px] sm:text-[34px] font-bold text-slate-900 leading-[1.08] tracking-[-0.02em]">
                Bilar vår expert rekommenderar just nu
              </h2>
              <p className="mt-3 text-slate-500 text-[15px] max-w-xl leading-[1.65]">
                Handplockade modeller med bäst balans mellan pris, driftskostnad och tillförlitlighet. Berätta vad du söker – vi förhandlar priset.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularCars.slice(0, 6).map((car, i) => {
                const imageUrl = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
                const fuelLabelStr = car.specs.fuel_types.map(f => FUEL_LABELS[f] || f).join(' / ');
                const isEl = car.specs.fuel_types.includes('el');
                if (isEl) {
                  return (
                    <ElCarCard
                      key={car.id}
                      name={`${car.brand_display} ${car.model_display}`}
                      make={car.brand_display}
                      imageUrl={imageUrl}
                      rating={car.ratings.overall}
                      topBadge={i === 0}
                      pros={car.pros}
                      fuelLabel={fuelLabelStr}
                      fuelTypes={car.specs.fuel_types}
                      bodyType={car.specs.body_type}
                      drivetrain={car.specs.drivetrain}
                      seats={car.specs.seats}
                      carPrice={car.pricing.new_from_sek ?? undefined}
                      usedPrice={car.pricing.used_from_sek ?? undefined}
                      cardMode="beg"
                      onNegotiate={() => navigateToBuy(`${car.brand_display} ${car.model_display}`)}
                      onDetail={() => {}}
                      onFitQuiz={() => setFitQuizCar(car)}
                    />
                  );
                }
                return (
                  <CompactCarCard
                    key={car.id}
                    name={`${car.brand_display} ${car.model_display}`}
                    make={car.brand_display}
                    imageUrl={imageUrl}
                    rating={car.ratings.overall}
                    topBadge={i === 0}
                    expertComment={car.pros[0]}
                    fuelLabel={fuelLabelStr}
                    fuelTypes={car.specs.fuel_types}
                    carPrice={car.pricing.new_from_sek ?? undefined}
                    usedPrice={car.pricing.used_from_sek ?? undefined}
                    cardMode="beg"
                    onNegotiate={() => navigateToBuy(`${car.brand_display} ${car.model_display}`)}
                    onDetail={() => {}}
                    onFitQuiz={() => setFitQuizCar(car)}
                    index={i}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Bilmatch Section */}
      <section id="bilmatch-section" className="py-14 sm:py-20 sm:px-6 bg-gradient-to-b from-slate-50 to-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {quizStep === 'idle' && (
              <motion.div key="quiz-idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Mobile card */}
                <div className="block sm:hidden px-4 py-6">
                  <div className="rounded-xl bg-[#0e6efe] overflow-hidden">
                    <div className="px-5 pt-7 pb-5">
                      <h2 className="text-[30px] font-extrabold text-white tracking-tight leading-[1.1] mb-5">
                        Hitta din{'\n'}bilmatch
                      </h2>
                      <ul className="flex flex-col gap-2.5 mb-6">
                        {[
                          'Personlig rekommendation på 60 sek',
                          'Jämför matchade bilar sida vid sida',
                          'Vi hjälper dig köpa till bästa pris',
                        ].map(item => (
                          <li key={item} className="flex items-center gap-2.5 text-[14px] text-white/90">
                            <div className="w-[18px] h-[18px] rounded-full bg-white/25 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </div>
                            {item}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => setQuizStep('active')}
                        className="w-full h-[52px] rounded-xl bg-white text-[#0e6efe] font-bold text-[15px] flex items-center justify-center gap-2 group transition-all duration-200 active:scale-[0.98] shadow-lg shadow-black/10"
                      >
                        Hitta din bilmatch
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <p className="text-[11px] text-white/50 text-center mt-2.5">Tar 60 sekunder · Helt gratis</p>
                    </div>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:flex flex-col lg:flex-row lg:items-center lg:gap-16 px-4 sm:px-0">
                  <div className="flex flex-col items-center lg:items-start lg:flex-1 w-full">
                    <h2 className="text-[36px] sm:text-[42px] lg:text-[52px] font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-3 text-center lg:text-left">
                      Hitta din{' '}
                      <span className="text-[#0e6efe]">bilmatch</span>
                    </h2>
                    <p className="text-slate-500 text-[15px] sm:text-[17px] leading-relaxed mb-6 max-w-sm sm:max-w-md mx-auto lg:mx-0 text-center lg:text-left">
                      Svara på 5 korta frågor om hur du kör, vad du prioriterar och din budget – vi matchar dig med de bilar som passar dig bäst.
                    </p>
                    <ul className="flex flex-col gap-3 mb-7 w-full max-w-sm mx-auto lg:mx-0">
                      {[
                        'Personlig rekommendation på under 60 sekunder',
                        'Jämför matchade bilar sida vid sida',
                        'Låt oss hjälpa dig köpa till bästa pris',
                      ].map(item => (
                        <li key={item} className="flex items-center gap-3 text-[14px] sm:text-[15px] text-slate-700">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="w-full max-w-sm mx-auto lg:mx-0 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setQuizStep('active')}
                        className="w-full h-[54px] rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-bold text-[16px] flex items-center justify-center gap-2.5 group transition-all duration-200 shadow-lg shadow-[#0e6efe]/30 hover:shadow-xl hover:shadow-[#0e6efe]/35 hover:-translate-y-0.5 active:scale-[0.98]"
                      >
                        Hitta din bilmatch
                        <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <p className="text-[12px] text-slate-400 text-center">Tar 60 sekunder · Helt gratis</p>
                    </div>
                  </div>
                  <div className="hidden lg:grid grid-cols-2 gap-4 w-[420px] shrink-0">
                    {(['tesla_model_y', 'volvo_xc60', 'kia_ev6', 'hyundai_ioniq5'] as const).map((cid, i) => {
                      const car = allCars.find(c => c.id === cid);
                      if (!car) return null;
                      const img = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
                      return (
                        <motion.div
                          key={cid}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.1 }}
                          className="aspect-[4/3] rounded-xl bg-white border border-slate-100 shadow-sm flex items-end justify-center overflow-hidden p-2"
                        >
                          {img && <img src={img} alt={`${car.brand_display} ${car.model_display}`} className="w-full h-auto object-contain" loading="lazy" decoding="async" />}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {quizStep === 'active' && (
              <motion.div key="quiz-active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto px-4 sm:px-0 py-6 sm:py-0">
                <QuizFlow onComplete={handleQuizComplete} onBack={handleQuizReset} />
              </motion.div>
            )}

            {quizStep === 'analyzing' && quizAnswers && (
              <motion.div key="quiz-analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-sm mx-auto">
                <QuizComplete answers={quizAnswers} isAnalysisReady={analysisReady} onShowResults={() => setQuizStep('results')} />
              </motion.div>
            )}

            {quizStep === 'results' && quizAnswers && (
              <motion.div key="quiz-results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4 sm:px-0">
                <QuizResults
                  answers={quizAnswers}
                  onBack={handleQuizReset}
                  onSelectCar={(car) => navigateToBuy(`${car.make} ${car.model}`)}
                />
                <div className="mt-6 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleQuizReset}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Gör om bilmatch
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Populära elbilar just nu */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-[22px] sm:text-[32px] font-extrabold text-slate-900 tracking-tight uppercase">
            Populära elbilar just nu
          </h2>
          <p className="text-slate-500 text-[14px] sm:text-[16px] mt-1 mb-8">
            Lägre driftskostnader, snabbare acceleration och noll utsläpp.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {EV_SHOWCASE.map((ev) => {
              const car = allCars.find(c => c.id === ev.id);
              if (!car) return null;
              const img = resolveCarImage(car.id, car.brand_display, car.model_display, getCarImage);
              return (
                <div
                  key={car.id}
                  onClick={() => navigateToBuy(`${car.brand_display} ${car.model_display}`)}
                  className="flex flex-col rounded-xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 ring-1 ring-white hover:ring-slate-200"
                >
                  <div className="relative w-full aspect-[4/3] bg-white flex items-end justify-center overflow-hidden">
                    {img ? (
                      <img src={img} alt={`${car.brand_display} ${car.model_display}`} loading="lazy" className="w-full h-auto object-contain group-hover:scale-[1.04] transition-transform duration-500" />
                    ) : (
                      <Car className="w-12 h-12 text-slate-300 mb-4" />
                    )}
                    {car.ratings.overall != null && (
                      <div className={`absolute top-2 right-2 w-8 h-8 rounded-xl shadow-md flex items-center justify-center ${car.ratings.overall >= 9 ? 'bg-emerald-500' : 'bg-[#0e6efe]'}`}>
                        <span className="text-[11px] font-bold text-white">{car.ratings.overall}</span>
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-3 bg-white">
                    <h3 className="text-[13px] sm:text-[14px] font-bold text-slate-900 group-hover:text-[#0e6efe] transition-colors truncate">
                      {car.brand_display} {car.model_display}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{ev.tagline}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0e6efe] py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[28px] sm:text-[40px] font-bold text-white tracking-tight leading-[1.08]">
            Hittade du din nästa bil?
          </h2>
          <p className="text-white/80 mt-4 text-[16px] sm:text-[18px] leading-relaxed mb-8 max-w-md mx-auto">
            Vi förhandlar priset och sköter hela affären åt dig. Gratis och utan bindning.
          </p>
          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, '', '/kop-bil/bestall');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="inline-flex items-center gap-2 h-13 px-8 rounded-xl bg-white text-[#0e6efe] font-bold text-[15px] hover:bg-slate-100 transition shadow-lg"
          >
            Kom igång – det är gratis
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <SiteFooter />

      <Suspense fallback={null}>
        <CarFitQuiz
          car={fitQuizCar!}
          open={!!fitQuizCar}
          onClose={() => setFitQuizCar(null)}
          onNegotiate={() => {
            if (fitQuizCar) {
              const name = encodeURIComponent(`${fitQuizCar.brand_display} ${fitQuizCar.model_display}`);
              setFitQuizCar(null);
              window.history.pushState({}, '', `/kop-bil/bestall?bil=${name}&typ=found`);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
        />
      </Suspense>
    </div>
  );
}
