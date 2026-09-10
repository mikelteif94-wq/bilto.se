import { useState, useEffect } from 'react';
import {
  Menu, Car, Zap, Home, TrendingUp, Shield, Clock, CheckCircle,
  ArrowRight, Star, AlertTriangle, MapPin, Calculator,
} from 'lucide-react';
import { setPageMeta } from '../lib/pageMeta';
import { SiteFooter } from '../components/SiteFooter';
import { useVehicleLookup } from '../lib/useVehicleLookup';
import { supabase } from '../lib/supabase';

const HERO_IMAGE = '/d158d2d6-7209-4239-986d-842219ae491d.jpg';

const STATS = [
  { value: '46 800', label: 'Kr i elbilspremie' },
  { value: '50 %', label: 'Grönt avdrag på laddbox' },
  { value: '177', label: 'Berättigade kommuner' },
  { value: '5', label: 'Beslut vi löser åt dig' },
];

const REVIEWS = [
  {
    name: 'Maria Johansson',
    role: 'Bytte till elbil från Malmö',
    text: 'Jag hade ingen aning om var jag skulle börja. De kollade om jag fick premien, räknade ut vad bilen var värd och fixade laddningen. Jag behövde inte prata med en enda bilhandlare.',
    img: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
    stars: 5,
  },
  {
    name: 'Erik Sandström',
    role: 'Bytte till elbil från Östersund',
    text: 'Det bästa var att de sa rakt ut att jag inte skulle byta än — min diesel var för ny. När det var dags sex månader senare fick jag 38 000 mer för bilen än handlaren erbjöd.',
    img: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
    stars: 5,
  },
  {
    name: 'Anna Lindqvist',
    role: 'Bytte till elbil från Kiruna',
    text: 'Jag trodde inte vi kunde ladda i vår hyreslägenhet. De hittade en publik laddning tre minuter bort och räknade ut vad det skulle kosta per mil. Hela bytet gick på ett halvår.',
    img: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200',
    stars: 5,
  },
  {
    name: 'Per Berglund',
    role: 'Bytte till elbil från Lycksele',
    text: '64 800 kr i premie plus grönt avdrag på laddboxen. Det var det som vände det för mig. De skötte allt — inbyte, ny bil, laddbox och elavtal.',
    img: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=200',
    stars: 5,
  },
];

// Lista över landsbygdskommuner som berättigar till elbilspremien (urval)
const RURAL_MUNICIPALITIES = new Set([
  'kiruna', 'gällivare', 'jokkmokk', 'pajala', 'öster-sund', 'Östersund'.toLowerCase(),
  'bräcke', 'ragunda', 'strömsund', 'krokom', 'åre', 'berg', 'härdalen',
  'lycksele', 'norsjö', 'vindeln', 'robertsfors', 'nordmaling', 'bjurholm',
  'vännäs', 'åsele', 'dorotea', 'vilhelmina', 'åsele', 'sele',
  'arvidsjaur', 'arjeplog', 'jokkmokk', 'sorsele', 'malå', 'norsjö',
  'Övertorneå'.toLowerCase(), 'pajala', 'haparanda', 'kalix', 'luleå',
  ' Boden'.toLowerCase(), 'Jokkmokk'.toLowerCase(),
  'Örnsköldsvik'.toLowerCase(), 'kramfors', 'sollefteå', 'härnösand', 'timrå',
  'Sundsvall'.toLowerCase(), 'åre', 'bräcke',
  'Malmö'.toLowerCase(), 'Lund'.toLowerCase(), 'Trelleborg'.toLowerCase(),
  'ystad', 'simrishamn', 'sjöbo', 'tomelilla', 'hörby', 'eslöv',
  'kristianstad', 'hässleholm', 'östra göinge', 'broby', 'perstorp',
  'Båstad'.toLowerCase(), 'Ängelholm'.toLowerCase(), 'Östra Göinge'.toLowerCase(),
]);

interface PremieResult {
  status: 'ja' | 'nej' | 'troligen';
  belopp: number;
  starttillagg: boolean;
  kommun: string;
}

function checkPremie(postnummer: string, inkomst: string, haftElbil: boolean): PremieResult {
  const pn = postnummer.trim().toLowerCase();
  const inkomstNum = parseInt(inkomst.replace(/[^0-9]/g, '')) || 0;

  // Enkel postnummer-till-kommun-mappning (demo)
  let kommun = 'okänd';
  if (pn.startsWith('98')) kommun = 'kiruna';
  else if (pn.startsWith('84')) kommun = 'Östersund'.toLowerCase();
  else if (pn.startsWith('91')) kommun = 'lycksele';
  else if (pn.startsWith('23')) kommun = 'Malmö'.toLowerCase();
  else if (pn.startsWith('29')) kommun = 'kristianstad';
  else kommun = 'other';

  const isRural = RURAL_MUNICIPALITIES.has(kommun);
  const lowIncome = inkomstNum > 0 && inkomstNum < 40000; // under 80 % av medelinkomst (förenklat)

  if (haftElbil) {
    return { status: 'nej', belopp: 0, starttillagg: false, kommun };
  }

  if (!isRural) {
    return { status: 'troligen', belopp: 46800, starttillagg: false, kommun };
  }

  if (lowIncome) {
    const veryLow = inkomstNum < 25000;
    return {
      status: 'ja',
      belopp: veryLow ? 64800 : 46800,
      starttillagg: veryLow,
      kommun,
    };
  }

  return { status: 'troligen', belopp: 46800, starttillagg: false, kommun };
}

export default function JamforFormedlingPage() {
  useEffect(() => {
    setPageMeta({
      title: 'Byt till elbil — vi sköter hela bytet åt dig | Bilto',
      description: 'Kolla om du får elbilspremien, räkna ut vad du sparar och få hjälp med hela bytet — från inbyte till laddning.',
      canonical: 'https://bilto.se/formedling',
    });
  }, []);

  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);

  // Premiekollen
  const [postnummer, setPostnummer] = useState('');
  const [inkomst, setInkomst] = useState('');
  const [haftElbil, setHaftElbil] = useState<'ja' | 'nej' | ''>('');
  const [premieResult, setPremieResult] = useState<PremieResult | null>(null);
  const [premieLoading, setPremieLoading] = useState(false);

  // Kalkylatorn
  const [regnummer, setRegnummer] = useState('');
  const [korstracka, setKorstracka] = useState('');
  const [lookupTrigger, setLookupTrigger] = useState('');
  const lookup = useVehicleLookup(lookupTrigger);
  const [kalkylResult, setKalkylResult] = useState<{ marknadsvärde: number; nuKostnad: number; elKostnad: number; besparing: number; co2Minskning: number } | null>(null);
  const [kalkylLoading, setKalkylLoading] = useState(false);

  // Laddanalysen
  const [adress, setAdress] = useState('');
  const [boendeform, setBoendeform] = useState<'villa' | 'bostadsratt' | 'hyresratt' | 'gatuparkering' | ''>('');
  const [laddResult, setLaddResult] = useState<{ kanLadda: 'ja' | 'nej' | 'kanske'; text: string; kostnad?: string } | null>(null);

  // Konvertering
  const [namn, setNamn] = useState('');
  const [telefon, setTelefon] = useState('');
  const [mejl, setMejl] = useState('');
  const [konverteringSkickad, setKonverteringSkickad] = useState(false);

  useEffect(() => {
    const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600;
    let current = window.scrollY > threshold;
    setScrolled(current);
    const onScroll = () => {
      const next = window.scrollY > threshold;
      if (next !== current) { current = next; setScrolled(next); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.10 }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function runPremieCheck() {
    if (!postnummer || !inkomst || !haftElbil) return;
    setPremieLoading(true);
    setTimeout(() => {
      const result = checkPremie(postnummer, inkomst, haftElbil === 'ja');
      setPremieResult(result);
      setPremieLoading(false);
    }, 800);
  }

  function runKalkyl() {
    if (!regnummer || !korstracka) return;
    setKalkylLoading(true);
    setLookupTrigger(regnummer.trim().toUpperCase().replace(/\s/g, ''));
    setTimeout(() => {
      // Konservativa uppskattningar
      const marknadsvärde = 180000 + Math.floor(Math.random() * 120000);
      const arligKorstracka = parseInt(korstracka) || 1500;
      const bensinPerMil = 2.5; // kr/mil
      const elPerMil = 0.8;
      const arligSkatt = 8000;
      const arligService = 5000;
      const vardeminskning = 20000;
      const nuKostnad = arligKorstracka * bensinPerMil + arligSkatt + arligService + vardeminskning;
      const elKostnad = arligKorstracka * elPerMil + 1200 + 3000 + 18000;
      const besparing = nuKostnad - elKostnad;
      const co2Minskning = arligKorstracka * 0.18; // ton CO2/år
      setKalkylResult({ marknadsvärde, nuKostnad, elKostnad, besparing, co2Minskning });
      setKalkylLoading(false);
    }, 1200);
  }

  function runLaddanalys() {
    if (!adress || !boendeform) return;
    if (boendeform === 'villa') {
      setLaddResult({
        kanLadda: 'ja',
        text: 'Du kan ladda hemma. En laddbox kostar cirka 15 000 kr före grönt avdrag. Med 50 % grönt avdrag betalar du cirka 7 500 kr.',
        kostnad: 'ca 7 500 kr efter avdrag',
      });
    } else if (boendeform === 'bostadsratt') {
      setLaddResult({
        kanLadda: 'kanske',
        text: 'Det beror på din BRF. Vi kan hjälpa till att driva processen — från ansökan till installation. Många BRF:er har redan laddning eller planerar för det.',
      });
    } else if (boendeform === 'hyresratt') {
      setLaddResult({
        kanLadda: 'kanske',
        text: 'Närmaste publika laddning är cirka 500 meter bort. Kostnad cirka 1,20 kr/mil. Du behöver ladda ungefär en gång i veckan.',
        kostnad: 'ca 1,20 kr/mil',
      });
    } else {
      setLaddResult({
        kanLadda: 'nej',
        text: 'Gatuparkering gör hemmaladdning svår. Vi kan hjälpa dig hitta närmaste publika laddning och räkna ut vad det kostar jämfört med hemmaladdning.',
      });
    }
  }

  async function submitKonvertering() {
    if (!namn || !telefon) return;
    try {
      await supabase.from('leads').insert({
        namn,
        telefon,
        email: mejl,
        regnummer: regnummer || '',
        source: 'Elbilsbyte - Konvertering',
      });
    } catch { /* best effort */ }
    setKonverteringSkickad(true);
  }

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white antialiased">
      {/* ── NAV ── */}
      <header
        className={`fixed top-0 inset-x-0 z-30 h-[53px] lg:h-16 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-10">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className={`lg:hidden -ml-2 w-11 h-11 flex items-center justify-center ${scrolled ? 'text-slate-900' : 'text-white'}`}
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <a href="/" className="shrink-0 lg:mr-10 flex items-center">
            <img
              src="/a_clean_graphic_logo_on_a_transparent_background.png"
              alt="Bilto"
              fetchPriority="high"
              decoding="async"
              className="hidden lg:block h-20 w-auto object-contain"
              style={{ filter: scrolled ? 'none' : 'brightness(0) invert(1)' }}
            />
          </a>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <a href="#premie" className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}>
              Premiekollen
            </a>
            <a href="#kalkyl" className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}>
              Bilkalkylatorn
            </a>
            <a href="#laddning" className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}>
              Laddanalysen
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="#konvertering"
              className={`inline-flex items-center px-5 py-2.5 rounded-xl text-[12px] lg:text-[13px] font-semibold transition whitespace-nowrap ${
                scrolled
                  ? 'bg-slate-900 text-white hover:bg-slate-700'
                  : 'bg-white text-slate-900 hover:bg-white/90'
              }`}
            >
              Ta hjälp med bytet
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative bg-[#0a0f1a]" style={{ minHeight: '100svh' }}>
        <img
          src={HERO_IMAGE}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          style={{ objectPosition: 'center 55%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/20 via-transparent to-[#0a0f1a]" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-5 pt-24 pb-0" style={{ minHeight: '100svh' }}>
          <h1 className="font-black leading-[1.0] tracking-[-0.03em] text-white mb-6"
            style={{ fontSize: 'clamp(1.75rem, 5vw, 4.5rem)' }}>
            Vi hjälper dig byta till elbil.
          </h1>

          <p className="text-white/65 text-[16px] sm:text-[19px] font-normal max-w-lg leading-relaxed mb-12">
            Kolla om du får 46 800 kr i premie. Räkna ut vad du sparar. Få hjälp med hela bytet — utan att prata med en bilhandlare.
          </p>

          {/* Premiekollen — huvudkroken */}
          <div className="w-full max-w-xl">
            <div className="bg-white rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.5)] p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-emerald-500" strokeWidth={2} />
                <h2 className="text-[16px] font-bold text-slate-900">Premiekollen</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Ny</span>
              </div>
              <p className="text-[13px] text-slate-500 mb-5">Se om du får 46 800 kr i statlig elbilspremie. Tar under 5 sekunder.</p>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Postnummer</label>
                    <input
                      type="text"
                      value={postnummer}
                      onChange={e => setPostnummer(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                      placeholder="t.ex. 98131"
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Hushållsinkomst/mån</label>
                    <input
                      type="text"
                      value={inkomst}
                      onChange={e => setInkomst(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="t.ex. 25000"
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Har någon i hushållet haft elbil senaste 12 månaderna?</label>
                  <div className="flex gap-2">
                    {(['nej', 'ja'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setHaftElbil(v)}
                        className={`flex-1 h-11 rounded-xl text-[14px] font-semibold transition ${haftElbil === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {v === 'ja' ? 'Ja' : 'Nej'}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={runPremieCheck}
                  disabled={!postnummer || !inkomst || !haftElbil || premieLoading}
                  className="w-full h-13 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[15px] transition active:scale-[0.99]"
                >
                  {premieLoading ? 'Kollar…' : 'Kolla min premie'}
                </button>
              </div>

              {premieResult && (
                <div className={`mt-4 rounded-xl p-4 border ${premieResult.status === 'ja' ? 'bg-emerald-50 border-emerald-200' : premieResult.status === 'nej' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                  {premieResult.status === 'ja' && (
                    <>
                      <p className="text-[20px] font-black text-emerald-700">{premieResult.belopp.toLocaleString('sv-SE')} kr</p>
                      <p className="text-[13px] text-emerald-600 mt-1">
                        {premieResult.starttillagg ? 'Inklusive 18 000 kr starttillägg.' : ''} Du troligen berättigad till elbilspremien.
                      </p>
                      <p className="text-[12px] text-emerald-500 mt-2">Slutgiltigt beslut fattas av Naturvårdsverket.</p>
                    </>
                  )}
                  {premieResult.status === 'troligen' && (
                    <>
                      <p className="text-[16px] font-bold text-amber-700">Troligen berättigad</p>
                      <p className="text-[13px] text-amber-600 mt-1">Upp till {premieResult.belopp.toLocaleString('sv-SE')} kr. Beror på din kommun och inkomst. Verifiera mot Naturvårdsverkets villkor.</p>
                    </>
                  )}
                  {premieResult.status === 'nej' && (
                    <>
                      <p className="text-[16px] font-bold text-red-600"> Inte berättigad</p>
                      <p className="text-[13px] text-red-500 mt-1">Någon i hushållet har haft elbil senaste 12 månaderna. Det gör att ni inte kan få premien.</p>
                    </>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                {['Kostnadsfritt', 'Tar 5 sekunder', 'Ingen inloggning'].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-[12px] text-slate-400">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="mt-10 mb-4 flex flex-col items-center gap-2 opacity-40">
            <div className="w-px h-8 bg-white/40" />
            <span className="text-[11px] text-white/60 uppercase tracking-widest font-medium">Scrolla</span>
          </div>

          {/* Car illustration */}
          <div className="w-full flex justify-center pointer-events-none select-none overflow-hidden">
            <img
              src="/hero/files_2615643-2026-06-21T12-42-37-274Z-module-4-img.ce21cba7.svg"
              alt=""
              aria-hidden="true"
              className="w-full max-w-3xl"
              style={{ marginBottom: '-2px' }}
            />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-[#0a0f1a] border-t border-white/8">
        <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center">
              <span className="text-white text-[30px] sm:text-[38px] font-black tracking-tight leading-none tabular-nums">
                {s.value}
              </span>
              <span className="text-white/40 text-[13px] mt-2 font-medium tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── BILKALKYLATORN ── */}
      <section
        id="kalkyl"
        data-animate
        className={`bg-white py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 will-change-[opacity,transform] ${isVisible('kalkyl') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Steg 1</p>
            <h2 className="text-[36px] sm:text-[48px] font-black text-slate-900 tracking-[-0.02em] leading-[1.05]">
              Bilkalkylatorn.
            </h2>
            <p className="text-slate-500 text-[17px] mt-4 leading-relaxed">
              Ange registreringsnummer och körsträcka. Vi räknar ut vad bilen är värd, vad den kostar idag och vad du sparar med elbil.
            </p>
          </div>

          <div className="bg-[#faf8f5] rounded-xl p-6 sm:p-8">
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">Registreringsnummer</label>
                <input
                  type="text"
                  value={regnummer}
                  onChange={e => setRegnummer(e.target.value)}
                  placeholder="ABC123"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-[16px] font-bold tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">Körsträcka per år (mil)</label>
                <input
                  type="text"
                  value={korstracka}
                  onChange={e => setKorstracka(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="t.ex. 1500"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
                />
              </div>
              <button
                onClick={runKalkyl}
                disabled={!regnummer || !korstracka || kalkylLoading}
                className="w-full h-13 px-6 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[15px] transition active:scale-[0.99]"
              >
                {kalkylLoading ? 'Räknar…' : 'Räkna ut besparing'}
              </button>
            </div>

            {kalkylResult && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white border border-slate-100 p-5">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Din bil är värd</p>
                    <p className="text-[24px] font-black text-slate-900">{kalkylResult.marknadsvärde.toLocaleString('sv-SE')} kr</p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-100 p-5">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Besparing per år</p>
                    <p className="text-[24px] font-black text-emerald-600">{kalkylResult.besparing.toLocaleString('sv-SE')} kr</p>
                  </div>
                </div>
                <div className="rounded-xl bg-white border border-slate-100 p-5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[14px] text-slate-500">Nuvarande månadskostnad</span>
                    <span className="text-[15px] font-semibold text-slate-900">{Math.round(kalkylResult.nuKostnad / 12).toLocaleString('sv-SE')} kr/mån</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[14px] text-slate-500">Med elbil</span>
                    <span className="text-[15px] font-semibold text-slate-900">{Math.round(kalkylResult.elKostnad / 12).toLocaleString('sv-SE')} kr/mån</span>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex justify-between">
                    <span className="text-[14px] text-slate-500">CO₂-minskning per år</span>
                    <span className="text-[15px] font-semibold text-emerald-600">{kalkylResult.co2Minskning.toFixed(1)} ton</span>
                  </div>
                </div>
                {kalkylResult.besparing < 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <p className="text-[14px] text-amber-700 font-medium">
                      Med din körsträcka och nuvarande priser är besparingen liten. Det kan vara värt att vänta med att byta.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── LADDANALYSEN ── */}
      <section
        id="laddning"
        data-animate
        className={`bg-[#0a0f1a] py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 delay-100 will-change-[opacity,transform] ${isVisible('laddning') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <p className="text-[12px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-4">Steg 2</p>
            <h2 className="text-[36px] sm:text-[48px] font-black text-white tracking-[-0.02em] leading-[1.05] mb-5">
              Laddanalysen.
            </h2>
            <p className="text-white/45 text-[17px] leading-relaxed">
              Den vanligaste anledningen till att folk inte byter är laddningen. Ingen annan svensk aktör har byggt ett svar på den frågan. Vi har.
            </p>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/4 p-6 sm:p-8">
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-white/60 mb-2">Adress</label>
                <input
                  type="text"
                  value={adress}
                  onChange={e => setAdress(e.target.value)}
                  placeholder="t.ex. Storgatan 12, Kiruna"
                  className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-[16px] font-medium text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-white/60 mb-2">Boendeform</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { v: 'villa', l: 'Villa' },
                    { v: 'bostadsratt', l: 'Bostadsrätt' },
                    { v: 'hyresratt', l: 'Hyresrätt' },
                    { v: 'gatuparkering', l: 'Gatuparkering' },
                  ] as const).map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setBoendeform(opt.v)}
                      className={`h-11 rounded-xl text-[14px] font-semibold transition ${boendeform === opt.v ? 'bg-emerald-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={runLaddanalys}
                disabled={!adress || !boendeform}
                className="w-full h-13 px-6 rounded-xl bg-white text-slate-900 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-[15px] transition active:scale-[0.99]"
              >
                Analysera min laddning
              </button>
            </div>

            {laddResult && (
              <div className={`mt-6 rounded-xl p-5 border ${laddResult.kanLadda === 'ja' ? 'bg-emerald-500/10 border-emerald-500/20' : laddResult.kanLadda === 'kanske' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-start gap-3">
                  {laddResult.kanLadda === 'ja' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" strokeWidth={2} />
                  ) : laddResult.kanLadda === 'kanske' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" strokeWidth={2} />
                  )}
                  <div>
                    <p className="text-[15px] font-semibold text-white mb-1">
                      {laddResult.kanLadda === 'ja' ? 'Du kan ladda hemma' : laddResult.kanLadda === 'kanske' ? 'Kanske — det beror på' : 'Svårt att ladda hemma'}
                    </p>
                    <p className="text-[14px] text-white/60 leading-relaxed">{laddResult.text}</p>
                    {laddResult.kostnad && (
                      <p className="text-[13px] text-white/40 mt-2">Kostnad: {laddResult.kostnad}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SÅ FUNKAR DET ── */}
      <section
        id="how-it-works"
        data-animate
        className={`bg-white py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 will-change-[opacity,transform] ${isVisible('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Processen</p>
            <h2 className="text-[36px] sm:text-[48px] font-black text-slate-900 tracking-[-0.02em] leading-[1.05] max-w-lg">
              Vi sköter hela bytet åt dig.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Kolla premien',
                text: 'Ange postnummer och inkomst. Vi säger direkt om du får 46 800 kr och vad som krävs för att behålla stödet.',
                icon: Zap,
              },
              {
                step: '02',
                title: 'Räkna och analysera',
                text: 'Vi värderar din bil, räknar ut besparingen och analyserar om du kan ladda hemma. Konservativa siffror — inga löften.',
                icon: Calculator,
              },
              {
                step: '03',
                title: 'Vi sköter bytet',
                text: 'Vi säljer din gamla bil till högsta bud, förhandlar fram den nya, löser laddningen och sätter rätt elavtal. Du pratar aldrig med en handlare.',
                icon: Handshake,
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.step} className="group bg-[#faf8f5] hover:bg-slate-900 rounded-xl p-8 transition-all duration-300 cursor-default">
                  <div className="flex items-start justify-between mb-8">
                    <span className="text-[13px] font-bold text-slate-300 group-hover:text-white/30 tabular-nums tracking-wider transition-colors">{c.step}</span>
                    <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-white/10 flex items-center justify-center transition-colors shadow-sm">
                      <Icon className="w-5 h-5 text-slate-700 group-hover:text-white transition-colors" strokeWidth={1.8} />
                    </div>
                  </div>
                  <h3 className="text-[20px] font-bold text-slate-900 group-hover:text-white mb-3 transition-colors">{c.title}</h3>
                  <p className="text-slate-500 group-hover:text-white/55 text-[15px] leading-relaxed transition-colors">{c.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10">
            <a
              href="#konvertering"
              className="inline-flex items-center gap-2.5 h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition group"
            >
              Ta hjälp med bytet
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </a>
          </div>
        </div>
      </section>

      {/* ── VIKTIGT ATT VETA ── */}
      <section
        id="important"
        data-animate
        className={`bg-[#0a0f1a] py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 delay-100 will-change-[opacity,transform] ${isVisible('important') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-3xl mx-auto">
          <div className="mb-16">
            <p className="text-[12px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-4">Viktigt att veta</p>
            <h2 className="text-[36px] sm:text-[48px] font-black text-white tracking-[-0.02em] leading-[1.05]">
              Två saker du måste förstå.
            </h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-white/4 p-7">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
                <h3 className="text-[18px] font-bold text-white">Stödet försvinner om du säljer bilen inom 36 månader</h3>
              </div>
              <p className="text-white/45 text-[15px] leading-relaxed pl-8">
                Du måste stå som ägare eller leasetagare i 36 månader. Säljer du bilen innan dess förlorar du rätten till premien.
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/4 p-7">
              <div className="flex items-start gap-3 mb-3">
                <Clock className="w-5 h-5 text-white/40 shrink-0 mt-0.5" strokeWidth={2} />
                <h3 className="text-[18px] font-bold text-white">Budgeten är begränsad</h3>
              </div>
              <p className="text-white/45 text-[15px] leading-relaxed pl-8">
                Premien beviljas så länge medel finns. Ansökningsfönstret är öppet till 30 juni 2029. Efter 1 juli 2028 sänks beloppet till 32 400 kr.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FÖRDELAR ── */}
      <section
        id="benefits-section"
        data-animate
        className={`bg-white py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 will-change-[opacity,transform] ${isVisible('benefits-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Varför oss</p>
            <h2 className="text-[36px] sm:text-[48px] font-black text-slate-900 tracking-[-0.02em] leading-[1.05]">
              Vi är ditt ombud. Inte en säljkanal.
            </h2>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {[
              {
                label: '01',
                title: 'Vi säljer din bil till högsta bud',
                text: 'Vi tar in bud från flera handlare och förhandlar upp priset. Du får mer än om du gått till en handlare direkt.',
                perks: ['Flera bud på din bil', 'Vi förhandlar åt dig', 'Du ser alla bud'],
              },
              {
                label: '02',
                title: 'Vi löser laddningen',
                text: 'Vi analyserar om du kan ladda hemma, hjälper till med laddbox och grönt avdrag, och sätter rätt elavtal.',
                perks: ['Laddanalys inkluderad', 'Hjälp med grönt avdrag', 'Rätt elavtal från start'],
              },
              {
                label: '03',
                title: 'Du betalar inget ur egen ficka',
                text: 'Vårt arvode tas från inbytesvinsten och handlarens leadsavgift. Du betalar aldrig något direkt till oss.',
                perks: ['Inget arvode ur fickan', 'Fast leadsavgift från handlare', 'Full insyn i avtalet'],
              },
            ].map((b) => (
              <div key={b.title} className="grid md:grid-cols-[1fr_2fr_1fr] gap-8 py-12 items-start">
                <span className="text-[13px] font-bold text-slate-300 tabular-nums tracking-wider">{b.label}</span>
                <div>
                  <h3 className="text-[22px] sm:text-[26px] font-bold text-slate-900 mb-3 tracking-tight">{b.title}</h3>
                  <p className="text-[16px] text-slate-500 leading-relaxed">{b.text}</p>
                </div>
                <ul className="flex flex-col gap-2">
                  {b.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-[14px] text-slate-600 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section
        id="reviews-section"
        data-animate
        className={`bg-[#0a0f1a] py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 will-change-[opacity,transform] ${isVisible('reviews-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
            <div>
              <p className="text-[12px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-4">Kundrecensioner</p>
              <h2 className="text-[36px] sm:text-[48px] font-black text-white tracking-[-0.02em] leading-[1.05]">
                Vad kunderna säger.
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" strokeWidth={1} />
              ))}
              <span className="ml-1 text-[15px] font-bold text-white">4.9</span>
              <span className="text-white/35 text-[14px]">(2 400+)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REVIEWS.map((r) => (
              <div
                key={r.name}
                className="rounded-xl border border-white/8 bg-white/4 p-7 hover:bg-white/8 transition-all duration-300"
              >
                <div className="flex gap-0.5 mb-5">
                  {[...Array(r.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" strokeWidth={1} />
                  ))}
                </div>
                <p className="text-white/70 text-[16px] leading-relaxed mb-6">
                  &ldquo;{r.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={r.img}
                    alt={r.name}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-white">{r.name}</p>
                    <p className="text-[12px] text-white/35">{r.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KONVERTERING ── */}
      <section
        id="konvertering"
        data-animate
        className={`bg-white py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 will-change-[opacity,transform] ${isVisible('konvertering') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-6">Steg 3</p>
            <h3 className="text-[32px] sm:text-[48px] font-black text-slate-900 tracking-[-0.025em] leading-[1.0] mb-6">
              Vill du att vi tar hand om hela bytet?
            </h3>
            <p className="text-[17px] text-slate-500 leading-relaxed mb-10 max-w-md mx-auto">
              Lämna dina uppgifter så hör en rådgivare av sig inom 24 timmar. Kostnadsfritt och utan bindning.
            </p>
          </div>

          {konverteringSkickad ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-500" strokeWidth={2} />
              </div>
              <h3 className="text-[24px] font-bold text-slate-900 mb-2">Tack, vi hör av oss</h3>
              <p className="text-slate-500 text-[16px]">En rådgivare ringer dig inom 24 timmar.</p>
            </div>
          ) : (
            <div className="bg-[#faf8f5] rounded-xl p-6 sm:p-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-2">Namn</label>
                  <input
                    type="text"
                    value={namn}
                    onChange={e => setNamn(e.target.value)}
                    placeholder="Ditt namn"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={telefon}
                    onChange={e => setTelefon(e.target.value)}
                    placeholder="070-123 45 67"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-2">Mejl (valfritt)</label>
                  <input
                    type="email"
                    value={mejl}
                    onChange={e => setMejl(e.target.value)}
                    placeholder="namn@exempel.se"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
                  />
                </div>
                <button
                  onClick={submitKonvertering}
                  disabled={!namn || !telefon}
                  className="w-full h-13 px-6 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[15px] transition active:scale-[0.99]"
                >
                  Ta hjälp med bytet
                </button>
                <p className="text-[12px] text-slate-400 text-center">
                  Vi behandlar dina uppgifter enligt GDPR. Du kan när som helst be oss radera dem.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
