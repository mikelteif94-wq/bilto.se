import { useState, useEffect, useRef } from 'react';
import {
  Zap, ArrowRight, Check, ChevronDown, ChevronUp,
  Car, Plug, CreditCard, BarChart2, MapPin, Home,
  Leaf, TrendingDown, Shield, Star, Phone, Mail,
  Loader2, AlertCircle,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import { useCatalogCars } from '../hooks/useCatalogCars';
import { useCarImages } from '../hooks/useCarImages';
import { supabase } from '../lib/supabase';
import { calcCarMonthlyRange } from '../lib/utils';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function formatSEK(n: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);
}

// ─── Driftkostnadskalkylator ───────────────────────────────────────────────────
function CostCalc() {
  const [mil, setMil] = useState(1500);
  const [elpris, setElpris] = useState(1.5);
  const [bensinkr, setBensinkr] = useState(20);

  const bensinLiter = (mil * 10 * 0.75) / 100;
  const bensinKostnad = bensinLiter * bensinkr;
  const elKwh = mil * 10 * 0.18;
  const elKostnad = elKwh * elpris;
  const besparing = Math.max(0, bensinKostnad - elKostnad);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_32px_rgba(0,0,0,0.06)] p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <TrendingDown className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-slate-900">Driftkostnadskalkylator</h3>
          <p className="text-[12px] text-slate-400">Bensin vs el — per år</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] font-semibold text-slate-700">Körda mil per år</label>
            <span className="text-[14px] font-extrabold text-slate-900 tabular-nums">{formatSEK(mil)} mil</span>
          </div>
          <input type="range" min={500} max={5000} step={100} value={mil}
            onChange={e => setMil(Number(e.target.value))}
            className="w-full h-1.5 accent-[#0e6efe] rounded-full" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>500</span><span>5 000</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Elpris (kr/kWh)</label>
            <input
              type="number" min={0.5} max={5} step={0.1} value={elpris}
              onChange={e => setElpris(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none focus:border-[#0e6efe]"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-600 block mb-1.5">Bensin (kr/liter)</label>
            <input
              type="number" min={10} max={35} step={0.5} value={bensinkr}
              onChange={e => setBensinkr(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none focus:border-[#0e6efe]"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { label: 'Bensinkostnad', value: formatSEK(Math.round(bensinKostnad)) + ' kr', color: 'bg-red-50 border-red-100', textColor: 'text-red-700', subColor: 'text-red-400' },
            { label: 'Elkostnad', value: formatSEK(Math.round(elKostnad)) + ' kr', color: 'bg-sky-50 border-sky-100', textColor: 'text-sky-700', subColor: 'text-sky-400' },
            { label: 'Din besparing', value: formatSEK(Math.round(besparing)) + ' kr', color: 'bg-emerald-50 border-emerald-100', textColor: 'text-emerald-700', subColor: 'text-emerald-400' },
          ].map(({ label, value, color, textColor, subColor }) => (
            <div key={label} className={`rounded-2xl border p-3 text-center ${color}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${subColor} mb-1`}>{label}</p>
              <p className={`text-[15px] sm:text-[17px] font-extrabold tabular-nums leading-none ${textColor}`}>{value}</p>
              <p className={`text-[9px] mt-0.5 ${subColor}`}>per år</p>
            </div>
          ))}
        </div>

        {besparing > 0 && (
          <p className="text-[12px] text-slate-500 text-center leading-relaxed">
            Med elbil sparar du ungefär <span className="font-bold text-emerald-600">{formatSEK(Math.round(besparing))} kr/år</span> i driftkostnad jämfört med bensin.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Steg tidslinje ────────────────────────────────────────────────────────────
const STEPS = [
  { icon: BarChart2, title: 'Behovsanalys', desc: 'Vi kartlägger dina körvanor, laddmöjligheter och budget. El, laddhybrid eller kombination?' },
  { icon: Car, title: 'Inbyte värderas', desc: 'Din nuvarande bil värderas och vi räknar ut vad du kan frigöra i kapital.' },
  { icon: Zap, title: 'Bilval & förhandling', desc: 'Vi hittar rätt elbil eller laddhybrid och förhandlar priset åt dig.' },
  { icon: Plug, title: 'Laddlösning hemma', desc: 'Vi koordinerar installation av laddbox — du behöver inte lyfta ett finger.' },
  { icon: CreditCard, title: 'Finansiering klar', desc: 'Vi sköter finansieringen med bästa ränta och lägsta mönadskostnad.' },
];

// ─── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Behöver jag ha garage för att ha elbil?', a: 'Nej, men det är en fördel. Vi hjälper dig även med laddstolpe i bostadsrätt eller utomhus. Många BRF:er kan söka stöd för gemensam laddning.' },
  { q: 'Räcker räckvidden för min vardag?', a: 'De flesta elbilar har idag 300–600 km räckvidd. Medelbilisten kör ca 40 km/dag — de allra flesta behöver aldrig ladda snabbladdare i vardagen.' },
  { q: 'Vad händer med min nuvarande bil?', a: 'Vi värderar din bil och sköter hela inbytet. Du kan använda värdet som kontantinsats på elfordonet.' },
  { q: 'Är laddhybrid ett bra mellanalternativ?', a: 'Ja, om du kör korta sträckor dagligen (30–50 km) och ibland längre resor. Laddhybrid låter dig köra på el hemma och bensin på längre sträckor.' },
  { q: 'Vad kostar Biltos tjänst?', a: 'Grundrådgivning är kostnadsfri. Vid köphjälp tar vi en fast avgift på 1 995 kr — och du sparar i snitt 15 000–40 000 kr på bilaffären.' },
];

// ─── El vs laddhybrid-kort ─────────────────────────────────────────────────────
const EL_PROFILES = [
  {
    icon: Zap,
    title: 'Elbil passar dig som...',
    color: 'sky',
    points: [
      'Kör mestadels lokalt (upp till 60 km/dag)',
      'Kan ladda hemma eller på jobbet',
      'Vill ha lägsta möjliga driftkostnad',
      'Är miljömedveten och vill köra fossilfritt',
    ],
  },
  {
    icon: Leaf,
    title: 'Laddhybrid passar dig som...',
    color: 'emerald',
    points: [
      'Kör varierat — kort vardag, lång resa ibland',
      'Inte har enkel tillgång till laddning',
      'Vill ha låg skatteförmån (förmånsbil)',
      'Vill ta ett första steg mot elektrifiering',
    ],
  },
];

// ─── Lead-formulär ─────────────────────────────────────────────────────────────
function LeadForm() {
  const [name, setName] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [regnummer, setRegnummer] = useState('');
  const [intresse, setIntresse] = useState<'el' | 'laddhybrid' | 'vet_ej'>('vet_ej');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefon.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('leads').insert({
        regnummer: regnummer.trim().toUpperCase() || '',
        telefon: telefon.trim(),
        email: email.trim(),
        guidance_requested: true,
      });
      if (insertError) throw insertError;
      setDone(true);
    } catch {
      setError('Något gick fel. Försök igen eller ring oss direkt.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-[20px] font-extrabold text-slate-900 mb-2">Vi hör av oss snart!</h3>
        <p className="text-[14px] text-slate-500 max-w-xs mx-auto leading-relaxed">
          En av våra elfordonexperter ringer dig inom 24 timmar för att hjälpa dig vidare.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Ditt namn</label>
          <input
            type="text" placeholder="Anna Andersson" value={name} onChange={e => setName(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[13px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0e6efe] transition-colors"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Telefon <span className="text-red-400">*</span></label>
          <input
            required type="tel" placeholder="070 123 45 67" value={telefon} onChange={e => setTelefon(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[13px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0e6efe] transition-colors"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">E-post</label>
          <input
            type="email" placeholder="anna@exempel.se" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[13px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0e6efe] transition-colors"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Regnummer på din bil</label>
          <input
            type="text" placeholder="ABC123" value={regnummer} onChange={e => setRegnummer(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[13px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0e6efe] transition-colors uppercase"
          />
        </div>
      </div>
      <div>
        <label className="block text-[12px] font-semibold text-slate-600 mb-2">Jag är intresserad av</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: 'el' as const, label: 'Elbil', icon: Zap },
            { val: 'laddhybrid' as const, label: 'Laddhybrid', icon: Leaf },
            { val: 'vet_ej' as const, label: 'Vet ej', icon: BarChart2 },
          ].map(opt => (
            <button
              key={opt.val} type="button"
              onClick={() => setIntresse(opt.val)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-center transition-all ${
                intresse === opt.val
                  ? 'border-[#0e6efe] bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <opt.icon className={`w-4 h-4 ${intresse === opt.val ? 'text-[#0e6efe]' : 'text-slate-400'}`} />
              <span className={`text-[11px] font-semibold leading-tight ${intresse === opt.val ? 'text-[#0e6efe]' : 'text-slate-500'}`}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[12.5px] text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit" disabled={loading || !telefon.trim()}
        className="w-full h-12 rounded-2xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-[#0e6efe]/20 active:scale-[0.99]"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Boka gratis rådgivning</>}
      </button>
      <p className="text-[11px] text-slate-400 text-center">
        Kostnadsfri rådgivning · Ingen bindning · Vi ringer inom 24 timmar
      </p>
    </form>
  );
}

// ─── Elbil-kort ────────────────────────────────────────────────────────────────
function MiniElCard({ name, imageUrl, carPrice, usedPrice, rating, pros, onClick }: {
  name: string;
  imageUrl?: string;
  carPrice?: number;
  usedPrice?: number;
  rating?: number;
  pros?: string[];
  onClick?: () => void;
}) {
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      <div className="relative aspect-[16/9] bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy"
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.05]"
            onError={e => { e.currentTarget.src = '/car-placeholder.svg'; e.currentTarget.className = 'w-full h-full object-contain p-6 opacity-25'; }}
          />
        ) : (
          <img src="/car-placeholder.svg" alt={name} loading="lazy" className="w-full h-full object-contain p-6 opacity-25" />
        )}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', boxShadow: '0 2px 8px rgba(14,165,233,0.35)' }}>
            <Zap className="w-2 h-2 fill-white" /> Elbil
          </span>
        </div>
        {rating != null && (
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 border-2 flex items-center justify-center"
            style={{ borderColor: rating >= 9 ? '#059669' : '#0e6efe' }}>
            <span className="text-[10px] font-extrabold tabular-nums" style={{ color: rating >= 9 ? '#059669' : '#0e6efe' }}>
              {Number.isInteger(rating) ? rating : rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      <div className="p-3.5">
        <h4 className="text-[13px] font-bold text-slate-900 truncate group-hover:text-[#0e6efe] transition-colors">{name}</h4>
        {pros && pros[0] && (
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">{pros[0]}</p>
        )}
        {range && (
          <p className="text-[13px] font-extrabold text-[#0e6efe] tabular-nums mt-1.5">
            {formatSEK(range.low)}–{formatSEK(range.high)} <span className="text-[10px] font-semibold text-slate-400">kr/mån</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ─── FAQ accordion ─────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left"
      >
        <span className="text-[14px] font-semibold text-slate-800 leading-snug">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        }
      </button>
      {open && (
        <p className="text-[13.5px] text-slate-500 leading-relaxed pb-5 -mt-1">{a}</p>
      )}
    </div>
  );
}

// ─── Intersection observer hook ───────────────────────────────────────────────
function useVisible(ref: React.RefObject<Element | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

// ─── Main page ────────────────────────────────────────────────────────────────
interface BytTillElPageProps {
  onBack: () => void;
}

export default function BytTillElPage({ onBack }: BytTillElPageProps) {
  const { cars, loading: carsLoading } = useCatalogCars();
  const { getCarImage } = useCarImages(cars);

  const elCars = cars
    .filter(c => c.fuel_types?.includes('el') && (c.image_url || c.cleaned_image_url))
    .sort((a, b) => (b.rating_overall ?? 0) - (a.rating_overall ?? 0))
    .slice(0, 6);

  const heroRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<HTMLDivElement>(null);
  const carsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const stepsVisible = useVisible(stepsRef as React.RefObject<Element>);
  const calcVisible = useVisible(calcRef as React.RefObject<Element>);
  const carsVisible = useVisible(carsRef as React.RefObject<Element>);
  const formVisible = useVisible(formRef as React.RefObject<Element>);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <button type="button" onClick={onBack} className="flex items-center gap-2 group">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-10 w-auto object-contain"
            />
          </button>
          <nav className="hidden sm:flex items-center gap-6">
            <button type="button" onClick={() => navigate('/kop-bil')}
              className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors font-medium">Köp bil</button>
            <button type="button" onClick={() => navigate('/sa-funkar-det')}
              className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors font-medium">Så funkar det</button>
          </nav>
          <button type="button" onClick={scrollToForm}
            className="h-9 px-5 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-bold text-[13px] flex items-center gap-1.5 transition-all shadow-md shadow-[#0e6efe]/20">
            <Zap className="w-3.5 h-3.5" /> Kom igång
          </button>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0b1220 0%, #0a1a35 55%, #0d2040 100%)' }}
      >
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 right-1/3 w-[400px] h-[300px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 65%)' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/30 bg-sky-400/10 mb-6">
            <Zap className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
            <span className="text-[12px] font-bold text-sky-300 tracking-wide">Elektrifiering — vi sköter allt</span>
          </div>

          <h1 className="text-[36px] sm:text-[56px] md:text-[68px] font-extrabold text-white leading-[1.05] tracking-[-0.03em] mb-6">
            Byt till elbil —<br />
            <span style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 60%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              vi sköter allt
            </span>
          </h1>

          <p className="text-[17px] sm:text-[19px] text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10">
            Från inbyte av din nuvarande bil till laddbox hemma och finansiering.
            En kontakt, en tjänst — hela övergången till el.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" onClick={scrollToForm}
              className="h-14 px-8 rounded-2xl text-white font-extrabold text-[15px] flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #1a7fff 0%, #0e6efe 60%, #0a57cc 100%)',
                boxShadow: '0 6px 28px rgba(14,110,254,0.45)',
              }}>
              Boka gratis rådgivning <ArrowRight className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => navigate('/kop-bil')}
              className="h-14 px-8 rounded-2xl border border-white/20 text-white/80 font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-white/8 transition-all duration-200">
              Utforska elbilar
            </button>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 mt-12 pt-10 border-t border-white/10">
            {[
              { icon: Shield, label: 'Kostnadsfri rådgivning' },
              { icon: Star, label: 'Snitt 15 000–40 000 kr sparat' },
              { icon: Check, label: 'Laddbox ingår i tjänsten' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-slate-400">
                <Icon className="w-4 h-4 text-sky-400" />
                <span className="text-[13px] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vad vi gör ────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] sm:text-[38px] font-extrabold text-slate-900 leading-tight tracking-[-0.02em]">
              Tre saker vi tar hand om
            </h2>
            <p className="mt-3 text-slate-500 text-[15px] max-w-md mx-auto">
              Du slipper koordinera med flera parter. Vi sköter allt i ett.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Car,
                color: 'from-blue-500 to-blue-600',
                title: 'Inbyte av din bil',
                desc: 'Vi värderar och säljer din nuvarande bil till bästa pris. Kapitalet används som insats på elfordonet.',
              },
              {
                icon: Plug,
                color: 'from-sky-500 to-sky-600',
                title: 'Laddbox hemma',
                desc: 'Vi koordinerar installation av laddbox hos din adress — villa, radhus eller BRF. Snabbladdning eller enkel hemmaladdning.',
              },
              {
                icon: CreditCard,
                color: 'from-emerald-500 to-emerald-600',
                title: 'Finansiering & köp',
                desc: 'Vi förhandlar priset och ordnar bästa finansiering. Du godkänner — vi genomför. Klart.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="relative bg-[#faf8f5] rounded-3xl p-6 border border-slate-100">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-[13.5px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── El vs laddhybrid ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-5 bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[26px] sm:text-[34px] font-extrabold text-slate-900 tracking-[-0.02em]">
              Elbil eller laddhybrid?
            </h2>
            <p className="mt-3 text-slate-500 text-[15px] max-w-md mx-auto">
              Rätt val beror på dina körvanor. Vi hjälper dig välja.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {EL_PROFILES.map(({ icon: Icon, title, color, points }) => (
              <div key={title} className={`rounded-3xl border p-6 ${color === 'sky' ? 'bg-sky-50 border-sky-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${color === 'sky' ? 'bg-sky-100' : 'bg-emerald-100'}`}>
                  <Icon className={`w-5 h-5 ${color === 'sky' ? 'text-sky-600' : 'text-emerald-600'}`} />
                </div>
                <h3 className={`text-[15px] font-bold mb-3 ${color === 'sky' ? 'text-sky-900' : 'text-emerald-900'}`}>{title}</h3>
                <ul className="space-y-2">
                  {points.map(p => (
                    <li key={p} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${color === 'sky' ? 'text-sky-500' : 'text-emerald-500'}`} />
                      <span className={`text-[13px] leading-snug ${color === 'sky' ? 'text-sky-800' : 'text-emerald-800'}`}>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-[13px] text-slate-400 mt-5">
            Osäker? Vi reder ut det tillsammans under rådgivningen — kostnadsfritt.
          </p>
        </div>
      </section>

      {/* ── Steg ─────────────────────────────────────────────────────────────── */}
      <section
        ref={stepsRef}
        className={`py-16 sm:py-24 px-5 bg-white transition-all duration-700 ${stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[26px] sm:text-[34px] font-extrabold text-slate-900 tracking-[-0.02em]">
              Hela processen i 5 steg
            </h2>
          </div>
          <div className="relative">
            <div className="hidden sm:block absolute left-[21px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#0e6efe] to-emerald-400" />
            <div className="space-y-6">
              {STEPS.map(({ icon: Icon, title, desc }, i) => (
                <div key={title} className="flex gap-5 sm:gap-7">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1a7fff] to-[#0e6efe] flex items-center justify-center shadow-lg shadow-[#0e6efe]/20">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border-2 border-[#0e6efe] flex items-center justify-center text-[9px] font-extrabold text-[#0e6efe]">{i + 1}</span>
                  </div>
                  <div className="pt-1.5 pb-2">
                    <h3 className="text-[15px] font-bold text-slate-900 mb-1">{title}</h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Driftkostnadskalkylator ────────────────────────────────────────────── */}
      <section
        ref={calcRef}
        className={`py-16 sm:py-24 px-5 bg-[#faf8f5] transition-all duration-700 delay-100 ${calcVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[26px] sm:text-[34px] font-extrabold text-slate-900 tracking-[-0.02em]">
              Vad sparar du på att byta?
            </h2>
            <p className="mt-3 text-slate-500 text-[15px]">Räkna på din besparing direkt.</p>
          </div>
          <CostCalc />
        </div>
      </section>

      {/* ── Populära elbilar ──────────────────────────────────────────────────── */}
      <section
        ref={carsRef}
        className={`py-16 sm:py-24 px-5 bg-white transition-all duration-700 delay-100 ${carsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[26px] sm:text-[34px] font-extrabold text-slate-900 tracking-[-0.02em]">
              Populära elbilar just nu
            </h2>
            <p className="mt-3 text-slate-500 text-[15px] max-w-md mx-auto">
              Vi hjälper dig hitta och förhandla fram bästa pris på rätt bil för dig.
            </p>
          </div>

          {carsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-slate-100 animate-pulse aspect-[4/3]" />
              ))}
            </div>
          ) : elCars.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {elCars.map(car => {
                const imageUrl = getCarImage(car.make, car.model);
                return (
                  <MiniElCard
                    key={car.id}
                    name={`${car.make} ${car.model}`}
                    imageUrl={imageUrl}
                    carPrice={car.price_new_from ?? undefined}
                    usedPrice={car.price_used_from ?? undefined}
                    rating={car.rating_overall ?? undefined}
                    pros={car.strengths ?? undefined}
                    onClick={() => navigate('/kop-bil')}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-400 text-[14px]">Elbilar laddas...</p>
          )}

          <div className="text-center mt-8">
            <button type="button" onClick={() => navigate('/kop-bil')}
              className="h-11 px-7 rounded-full border border-slate-300 hover:border-[#0e6efe] text-slate-700 hover:text-[#0e6efe] font-semibold text-[14px] inline-flex items-center gap-2 transition-all duration-200">
              Se alla elbilar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Laddning-fakta ────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-5" style={{ background: 'linear-gradient(145deg, #0b1220 0%, #0a1a35 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[26px] sm:text-[34px] font-extrabold text-white tracking-[-0.02em]">
              Allt om laddning — vi ordnar
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: Home,
                title: 'Hemmaladdning',
                desc: '7 kW laddbox ger ca 40 km räckvidd per timme. Perfekt för nattladdning. Vi koordinerar installation och ROT-avdrag.',
                badge: '~40 km/h',
              },
              {
                icon: MapPin,
                title: 'Snabbladdning',
                desc: 'DC-snabbladdare (50–350 kW) hittas längs motorvägar och i städer. Från 10% till 80% på 20–45 min.',
                badge: '50–350 kW',
              },
              {
                icon: Shield,
                title: 'BRF & bostadsrätt',
                desc: 'Vi hjälper med ansökan till BRF om gemensam laddinfrastruktur. Energimyndigheten ger stöd för gemensam installation.',
                badge: 'Bidrag finns',
              },
            ].map(({ icon: Icon, title, desc, badge }) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-400/15 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-sky-400 w-[18px] h-[18px]" />
                  </div>
                  <span className="text-[11px] font-bold text-sky-400 bg-sky-400/10 px-2.5 py-0.5 rounded-full">{badge}</span>
                </div>
                <h3 className="text-[15px] font-bold text-white mb-2">{title}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-5 bg-[#faf8f5]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[26px] sm:text-[34px] font-extrabold text-slate-900 tracking-[-0.02em]">
              Vanliga frågor
            </h2>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_32px_rgba(0,0,0,0.05)] px-6 divide-y divide-slate-100">
            {FAQS.map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* ── Lead-formulär ────────────────────────────────────────────────────── */}
      <section
        ref={formRef}
        className={`py-16 sm:py-24 px-5 bg-white transition-all duration-700 delay-150 ${formVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0e6efe]/8 border border-[#0e6efe]/15 mb-4">
              <Zap className="w-3.5 h-3.5 text-[#0e6efe]" />
              <span className="text-[12px] font-bold text-[#0e6efe]">Kostnadsfri rådgivning</span>
            </div>
            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-slate-900 tracking-[-0.02em] mb-3">
              Redo att byta till el?
            </h2>
            <p className="text-slate-500 text-[15px] leading-relaxed">
              Fyll i formuläret så ringer en av våra elfordonexperter dig inom 24 timmar — kostnadsfritt.
            </p>
          </div>
          <div className="bg-[#faf8f5] rounded-3xl border border-slate-100 p-6 sm:p-8">
            <LeadForm />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Phone, text: 'Ring oss: 08-5555 0200' },
              { icon: Mail, text: 'hej@bilto.se' },
              { icon: Shield, text: 'GDPR-anpassad' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-[12px] text-slate-400 justify-center">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
