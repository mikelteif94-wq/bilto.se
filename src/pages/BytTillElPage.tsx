import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, Check, ChevronDown, Phone, Zap, Car, Plug,
  CreditCard, BarChart2, Home, Leaf, Menu, User,
  TrendingDown, AlertCircle, Loader2, CheckCircle2, X,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu from '../components/MobileMenu';
import { useCatalogCars } from '../hooks/useCatalogCars';
import { useCarImages } from '../hooks/useCarImages';
import { useVehicleLookup } from '../lib/useVehicleLookup';
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

// ─── Cost calc ────────────────────────────────────────────────────────────────
function CostCalc() {
  const [mil, setMil] = useState(1500);
  const [elpris, setElpris] = useState(1.5);
  const [bensinkr, setBensinkr] = useState(20);

  const bensinKostnad = (mil * 10 * 0.75 / 100) * bensinkr;
  const elKostnad = (mil * 10 * 0.18) * elpris;
  const besparing = Math.max(0, bensinKostnad - elKostnad);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-7 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
          <TrendingDown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-slate-900">Driftkostnadskalkylator</h3>
          <p className="text-[13px] text-slate-400">Bensin vs el — per år</p>
        </div>
      </div>
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] font-semibold text-slate-700">Körda mil per år</label>
            <span className="text-[15px] font-bold text-slate-900 tabular-nums">{formatSEK(mil)} mil</span>
          </div>
          <input type="range" min={500} max={5000} step={100} value={mil}
            onChange={e => setMil(Number(e.target.value))}
            className="w-full accent-[#0e6efe]" />
          <div className="flex justify-between text-[11px] text-slate-400 mt-0.5"><span>500</span><span>5 000</span></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[13px] font-semibold text-slate-600 block mb-1.5">Elpris (kr/kWh)</label>
            <input type="number" min={0.5} max={5} step={0.1} value={elpris}
              onChange={e => setElpris(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#0e6efe]" />
          </div>
          <div>
            <label className="text-[13px] font-semibold text-slate-600 block mb-1.5">Bensin (kr/liter)</label>
            <input type="number" min={10} max={35} step={0.5} value={bensinkr}
              onChange={e => setBensinkr(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#0e6efe]" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: 'Bensinkostnad', value: formatSEK(Math.round(bensinKostnad)) + ' kr', color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
            { label: 'Elkostnad', value: formatSEK(Math.round(elKostnad)) + ' kr', color: 'text-[#0e6efe]', bg: 'bg-blue-50 border-blue-100' },
            { label: 'Din besparing', value: formatSEK(Math.round(besparing)) + ' kr', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</p>
              <p className={`text-[14px] font-bold tabular-nums ${color}`}>{value}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">per år</p>
            </div>
          ))}
        </div>
        {besparing > 0 && (
          <p className="text-[13px] text-slate-500 text-center">
            Med elbil sparar du ungefär <span className="font-semibold text-slate-900">{formatSEK(Math.round(besparing))} kr/år</span> i driftkostnad.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Vehicle lookup chip ──────────────────────────────────────────────────────
function VehicleChip({ regnummer }: { regnummer: string }) {
  const lookup = useVehicleLookup(regnummer);
  if (lookup.status === 'loading') {
    return (
      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
        <span className="text-[12px] text-slate-500">Hämtar bilinfo…</span>
      </div>
    );
  }
  if (lookup.status === 'found') {
    const d = lookup.data;
    return (
      <div className="flex items-start gap-2.5 mt-2 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-slate-900">{d.marke} {d.modell} {d.variant}</p>
          <p className="text-[11px] text-slate-500">{d.ar} · {d.bransle} · {d.farg}</p>
        </div>
      </div>
    );
  }
  if (lookup.status === 'not_found') {
    return (
      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[12px] text-amber-700">Hittade ingen bil på det registreringsnumret.</span>
      </div>
    );
  }
  return null;
}

// ─── Lead form ────────────────────────────────────────────────────────────────
function LeadForm() {
  const [name, setName] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [regnummer, setRegnummer] = useState('');
  const [harIngenBil, setHarIngenBil] = useState(false);
  const [intresse, setIntresse] = useState<'el' | 'laddhybrid' | 'vet_ej'>('vet_ej');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useVehicleLookup(regnummer);
  const vehicleInfo = lookup.status === 'found' ? lookup.data : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefon.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const reg = harIngenBil ? '' : regnummer.trim().toUpperCase();
      const nameParts = name.trim().split(' ');
      const firstname = nameParts[0] || '';
      const lastname = nameParts.slice(1).join(' ') || '';

      const vehicleNote = vehicleInfo && !harIngenBil
        ? `Nuvarande bil: ${vehicleInfo.marke} ${vehicleInfo.modell} ${vehicleInfo.variant} (${vehicleInfo.ar}, ${vehicleInfo.bransle})`
        : harIngenBil ? 'Inget inbyte' : '';
      const interesseLabel = intresse === 'el' ? 'Elbil' : intresse === 'laddhybrid' ? 'Laddhybrid' : 'Vet ej';
      const notes = [vehicleNote, `Intresse: ${interesseLabel}`].filter(Boolean).join(' · ');

      const { error: leadErr } = await supabase.from('leads').insert({
        regnummer: reg || null,
        telefon: telefon.trim(),
        email: email.trim() || null,
        guidance_requested: true,
      });
      if (leadErr) throw leadErr;

      const { error: quoteErr } = await supabase.from('quote_requests').insert({
        search_option: 'Byt till el',
        regnummer: reg || null,
        firstname,
        lastname,
        email: email.trim() || null,
        phone: telefon.trim(),
        fuel_type: intresse,
        has_trade_in: !harIngenBil && !!reg,
        trade_in_reg: reg || null,
        target_car: intresse === 'el' ? 'Elbil' : intresse === 'laddhybrid' ? 'Laddhybrid' : 'El eller laddhybrid',
        notes,
        status: 'new',
      });
      if (quoteErr) throw quoteErr;

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
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-emerald-600" strokeWidth={2.5} />
        </div>
        <h3 className="text-[20px] font-bold text-slate-900 mb-2">Vi hör av oss!</h3>
        <p className="text-[14px] text-slate-500 max-w-xs mx-auto leading-relaxed">
          En av våra experter ringer dig inom 24 timmar för att hjälpa dig byta till el.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Ditt namn</label>
          <input type="text" placeholder="Anna Andersson" value={name} onChange={e => setName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e6efe] transition" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
            Telefon <span className="text-red-400">*</span>
          </label>
          <input required type="tel" placeholder="070 123 45 67" value={telefon} onChange={e => setTelefon(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e6efe] transition" />
        </div>
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">E-post</label>
        <input type="email" placeholder="anna@exempel.se" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e6efe] transition" />
      </div>

      {/* Trade-in section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[13px] font-semibold text-slate-700">Regnummer (bil att byta in)</label>
          <button
            type="button"
            onClick={() => { setHarIngenBil(!harIngenBil); setRegnummer(''); }}
            className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full border transition ${
              harIngenBil
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {harIngenBil
              ? <><X className="w-3 h-3" /> Har bil att byta in</>
              : 'Har ingen bil att byta in'}
          </button>
        </div>
        {harIngenBil ? (
          <div className="h-12 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center">
            <span className="text-[13px] text-slate-400">Inget inbyte — vi hjälper dig ändå</span>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="ABC123"
              value={regnummer}
              onChange={e => setRegnummer(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e6efe] transition uppercase"
              maxLength={10}
            />
            <VehicleChip regnummer={regnummer} />
          </>
        )}
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-slate-700 mb-2">Jag är intresserad av</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: 'el' as const, label: 'Elbil' },
            { val: 'laddhybrid' as const, label: 'Laddhybrid' },
            { val: 'vet_ej' as const, label: 'Vet ej' },
          ].map(opt => (
            <button key={opt.val} type="button" onClick={() => setIntresse(opt.val)}
              className={`h-11 rounded-xl border-2 font-semibold text-[13px] transition ${
                intresse === opt.val
                  ? 'border-[#0e6efe] bg-[#0e6efe]/5 text-[#0e6efe]'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      <button type="submit" disabled={loading || !telefon.trim()}
        className="w-full h-12 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-[15px] flex items-center justify-center gap-2 transition active:scale-[0.99]">
        {loading
          ? <Loader2 className="w-5 h-5 animate-spin" />
          : <><span>Boka gratis rådgivning</span><ArrowRight className="w-4 h-4" /></>}
      </button>
      <p className="text-[12px] text-slate-400 text-center">Kostnadsfri · Utan bindning · Vi ringer inom 24 timmar</p>
    </form>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Behöver jag ha garage för att ha elbil?', a: 'Nej, men det underlättar. Vi hjälper dig även med laddstolpe i bostadsrätt eller utomhus. Många BRF:er kan söka stöd för gemensam laddning.' },
  { q: 'Räcker räckvidden för min vardag?', a: 'De flesta elbilar har idag 300–600 km räckvidd. Medelbilisten kör ca 40 km/dag — de allra flesta behöver aldrig använda snabbladdare i vardagen.' },
  { q: 'Vad händer med min nuvarande bil?', a: 'Vi värderar din bil och sköter hela inbytet. Värdet kan användas som kontantinsats på ditt nya elfordon.' },
  { q: 'Är laddhybrid ett bra mellanalternativ?', a: 'Ja, om du kör korta sträckor dagligen (30–50 km) men ibland längre resor. Du kör på el hemma och bensin på längre sträckor.' },
  { q: 'Vad kostar Biltos tjänst?', a: 'Grundrådgivning är kostnadsfri. Vid köphjälp tar vi en fast avgift på 1 995 kr — och du sparar i snitt 15 000–40 000 kr på bilaffären.' },
];

// ─── Car card ─────────────────────────────────────────────────────────────────
function ElBilCard({ name, imageUrl, carPrice, usedPrice, rating, pros, onClick }: {
  name: string; imageUrl?: string; carPrice?: number; usedPrice?: number;
  rating?: number; pros?: string[]; onClick?: () => void;
}) {
  const range = carPrice ? calcCarMonthlyRange(carPrice, usedPrice) : null;
  return (
    <div onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
      <div className="relative aspect-[16/9] bg-slate-50 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy"
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
            onError={e => { e.currentTarget.src = '/car-placeholder.svg'; e.currentTarget.className = 'w-full h-full object-contain p-6 opacity-20'; }} />
        ) : (
          <img src="/car-placeholder.svg" alt={name} loading="lazy" className="w-full h-full object-contain p-6 opacity-20" />
        )}
        {rating != null && (
          <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
            <span className="text-[10px] font-bold tabular-nums text-slate-800">{Number.isInteger(rating) ? rating : rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-slate-100">
        <h4 className="text-[14px] font-bold text-slate-900 truncate">{name}</h4>
        {pros && pros[0] && <p className="text-[12px] text-slate-400 mt-0.5 line-clamp-1">{pros[0]}</p>}
        {range && (
          <p className="text-[14px] font-bold text-[#0e6efe] tabular-nums mt-2">
            {formatSEK(range.low)}–{formatSEK(range.high)} <span className="text-[11px] font-medium text-slate-400">kr/mån</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
interface BytTillElPageProps {
  onBack: () => void;
}

export default function BytTillElPage({ onBack }: BytTillElPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { cars, loading: carsLoading } = useCatalogCars();
  const { getCarImage } = useCarImages(cars);

  const elCars = cars
    .filter(c => c.fuel_types?.includes('el') && (c.image_url || c.cleaned_image_url))
    .sort((a, b) => (b.rating_overall ?? 0) - (a.rating_overall ?? 0))
    .slice(0, 6);

  useEffect(() => {
    document.title = 'Byt till Elbil — vi sköter allt | Bilto';
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Byt till el"
        onSelect={() => setMenuOpen(false)}
      />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]/40 backdrop-blur-md'}`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white">
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={onBack} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={onBack}
              className="text-[15px] text-white/85 hover:text-white font-medium transition">Sälj bil</button>
            <button type="button" onClick={() => navigate('/kop-bil')}
              className="text-[15px] text-white/85 hover:text-white font-medium transition">Köp bil</button>
            <span className="inline-flex items-center gap-1.5 text-white text-[15px] font-semibold">
              <Zap className="w-4 h-4 fill-white" strokeWidth={0} /> Byt till el
            </span>
          </nav>
          <div className="flex items-center ml-auto">
            <a href="/logga-in"
              className="inline-flex items-center gap-2 bg-white text-[#0e6efe] text-[14px] font-semibold px-5 h-10 rounded-full hover:bg-slate-100 transition whitespace-nowrap">
              <User className="w-[18px] h-[18px]" strokeWidth={2.2} />
              Mina erbjudanden
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0e6efe] pt-28 pb-24 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/manrope_(1920_x_1080_px)_(Instagram_Post_(34))_(2).png')] bg-center bg-cover opacity-[0.07] pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
          {/* Left */}
          <div>
            <p className="text-white/70 text-[13px] font-semibold uppercase tracking-[0.15em] mb-5">
              Inbyte · Laddbox · Finansiering
            </p>
            <h1 className="text-white text-[36px] lg:text-[54px] font-bold leading-[1.05] tracking-tight">
              Byt till elbil —<br />vi sköter allt
            </h1>
            <p className="mt-5 text-white/75 text-[16px] lg:text-[18px] leading-[1.65] max-w-lg">
              Från inbyte av din bil till laddbox hemma och finansiering. En kontakt, hela övergången.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                'Vi värderar och säljer din nuvarande bil',
                'Laddbox installerad hemma, vi koordinerar',
                'Vi förhandlar pris, ränta och finansiering',
              ].map(p => (
                <li key={p} className="flex items-center gap-3 text-[15px] lg:text-[16px] text-white/90">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={scrollToForm}
                className="h-12 px-7 rounded-full bg-white text-[#0e6efe] font-bold text-[15px] hover:bg-slate-100 transition inline-flex items-center gap-2">
                Kom igång gratis <ArrowRight className="w-4 h-4" />
              </button>
              <a href="tel:+46855550200"
                className="h-12 px-7 rounded-full border border-white/30 text-white font-semibold text-[15px] hover:bg-white/10 transition inline-flex items-center gap-2">
                <Phone className="w-4 h-4" /> Ring oss
              </a>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-1 border-b border-slate-100">
              <p className="text-[17px] font-bold text-slate-900">Boka gratis rådgivning</p>
              <p className="text-[13px] text-slate-500 mt-0.5 mb-4">En expert ringer dig inom 24 timmar.</p>
            </div>
            <div className="px-6 py-5">
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-100 py-9">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: '5 000+', label: 'Bilaffärer genomförda' },
              { value: '~15 000 kr', label: 'Genomsnittlig besparing' },
              { value: '100%', label: 'På kundens sida' },
              { value: '1 995 kr', label: 'Fast avgift, inget mer' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[24px] sm:text-[28px] font-bold text-slate-900 tabular-nums leading-none">{s.value}</p>
                <p className="text-[12px] text-slate-500 mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hur det fungerar ─────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.16em] mb-3">Processen</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold leading-[1.08] text-slate-900 tracking-tight">
              Fem steg — du gör nästan ingenting
            </h2>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-9 left-[10%] right-[10%] h-px bg-slate-200" />
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-4">
              {[
                { n: '1', icon: BarChart2, title: 'Behovsanalys', body: 'Vi kartlägger dina körvanor och laddmöjligheter.' },
                { n: '2', icon: Car, title: 'Inbyte värderas', body: 'Din bil värderas av flera handlare — du får marknadspris.' },
                { n: '3', icon: Zap, title: 'Bilval & förhandling', body: 'Vi hittar rätt elbil och förhandlar pris och ränta åt dig.' },
                { n: '4', icon: Plug, title: 'Laddbox hemma', body: 'Vi koordinerar installation — du behöver inte lyfta ett finger.' },
                { n: '5', icon: CreditCard, title: 'Finansiering klar', body: 'Vi sköter finansieringen med lägsta möjliga månadskostnad.' },
              ].map(step => {
                const Icon = step.icon;
                return (
                  <div key={step.n} className="relative text-center flex flex-col items-center">
                    <div className="relative z-10 w-[72px] h-[72px] rounded-2xl bg-slate-900 flex items-center justify-center mb-4 shadow-sm">
                      <Icon className="w-7 h-7 text-white" strokeWidth={1.8} />
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#0e6efe] text-white text-[10px] font-bold flex items-center justify-center">{step.n}</span>
                    </div>
                    <h3 className="text-[14px] font-bold text-slate-900 mb-1.5">{step.title}</h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed max-w-[150px]">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-14 text-center">
            <button type="button" onClick={scrollToForm}
              className="h-12 px-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] transition inline-flex items-center gap-2">
              Boka gratis rådgivning <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Elbil vs laddhybrid ───────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.16em] mb-3">Vilket passar dig?</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-slate-900 leading-tight tracking-tight">
              Elbil eller laddhybrid?
            </h2>
            <p className="text-slate-500 mt-3 text-[15px] max-w-xl leading-relaxed">
              Rätt val beror på dina körvanor. Vi hjälper dig välja — kostnadsfritt.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Zap,
                title: 'Elbil passar dig som...',
                points: [
                  'Kör mestadels lokalt (upp till 60 km/dag)',
                  'Kan ladda hemma eller på jobbet',
                  'Vill ha lägsta möjliga driftkostnad',
                  'Vill köra 100 % fossilfritt',
                ],
              },
              {
                icon: Leaf,
                title: 'Laddhybrid passar dig som...',
                points: [
                  'Kör varierat — kort vardag, långa resor ibland',
                  'Inte har enkel tillgång till laddning',
                  'Vill ha låg förmånsbeskattning',
                  'Vill ta ett första steg mot elektrifiering',
                ],
              },
            ].map(({ icon: Icon, title, points }) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-7 bg-slate-50">
                <div className="flex items-center gap-2.5 mb-5">
                  <Icon className="w-5 h-5 text-slate-700" strokeWidth={2} />
                  <h3 className="text-[16px] font-bold text-slate-900">{title}</h3>
                </div>
                <ul className="space-y-3">
                  {points.map(p => (
                    <li key={p} className="flex items-start gap-3 text-[14px] text-slate-600 leading-snug">
                      <Check className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" strokeWidth={2.5} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Driftkostnadskalkylator ────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <p className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.16em] mb-3">Räkna själv</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-slate-900 leading-tight tracking-tight">
              Vad sparar du på att byta?
            </h2>
          </div>
          <CostCalc />
        </div>
      </section>

      {/* ── Populära elbilar ─────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.16em] mb-3">Experternas val</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-slate-900 leading-tight tracking-tight">
              Populära elbilar just nu
            </h2>
            <p className="text-slate-500 mt-3 text-[15px] max-w-xl leading-relaxed">
              Vi hjälper dig hitta och förhandla fram bästa pris på rätt bil.
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
              {elCars.map(car => (
                <ElBilCard key={car.id}
                  name={`${car.make} ${car.model}`}
                  imageUrl={getCarImage(car.make, car.model)}
                  carPrice={car.price_new_from ?? undefined}
                  usedPrice={car.price_used_from ?? undefined}
                  rating={car.rating_overall ?? undefined}
                  pros={car.strengths ?? undefined}
                  onClick={() => navigate('/kop-bil')}
                />
              ))}
            </div>
          ) : null}
          <div className="mt-10">
            <button type="button" onClick={() => navigate('/kop-bil')}
              className="h-11 px-7 rounded-full border border-slate-300 text-slate-700 hover:border-slate-400 font-semibold text-[14px] inline-flex items-center gap-2 transition">
              Se alla elbilar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Vad ingår ─────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h2 className="text-[28px] sm:text-[40px] font-bold text-white leading-tight tracking-tight">
              Vad ingår i el-tjänsten?
            </h2>
            <p className="text-slate-400 mt-3 text-[15px] max-w-xl leading-relaxed">
              Allt du behöver för att gå från bensinbil till elbil — utan att du behöver göra jobbet.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Inbytesförhandling', desc: 'Vi hämtar konkurrerande bud på din nuvarande bil och maximerar värdet.' },
              { title: 'Elbilssökning & match', desc: 'Vi söker i hela marknaden och matchar rätt bil efter dina körvanor.' },
              { title: 'Prisförhandling', desc: 'Vi vet var marginalen finns — och pressar priset utan att du behöver fråga.' },
              { title: 'Laddbox koordinering', desc: 'Vi ordnar godkänd installatör och koordinerar installation hemma eller i BRF.' },
              { title: 'Ränteförhandling', desc: 'Vi jämför finansiering och pressar räntan mot flera aktörer.' },
              { title: 'Leverans hem', desc: 'Vi koordinerar hemleverans — du behöver aldrig besöka en handlare.' },
            ].map(item => (
              <div key={item.title}
                className="flex items-start gap-4 bg-white/5 rounded-2xl p-5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-[#0e6efe]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-[#0e6efe]" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-white font-semibold text-[14px]">{item.title}</p>
                  <p className="text-slate-400 text-[13px] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <button type="button" onClick={scrollToForm}
              className="h-12 px-8 rounded-full bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[15px] transition inline-flex items-center gap-2">
              Kom igång nu <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Laddning ─────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.16em] mb-3">Laddning</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-slate-900 leading-tight tracking-tight">
              Allt om laddning — vi ordnar
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Home, title: 'Hemmaladdning', badge: '~40 km/h', desc: '7 kW laddbox ger ca 40 km räckvidd per timme. Perfekt för nattladdning. Vi koordinerar installation och ROT-avdrag.' },
              { icon: Zap, title: 'Snabbladdning', badge: '50–350 kW', desc: 'DC-snabbladdare finns längs motorvägar och i städer. Från 10% till 80% på 20–45 minuter.' },
              { icon: Leaf, title: 'BRF & bostadsrätt', badge: 'Bidrag finns', desc: 'Vi hjälper med ansökan till BRF om gemensam laddinfrastruktur. Energimyndigheten ger stöd för installation.' },
            ].map(({ icon: Icon, title, badge, desc }) => (
              <div key={title} className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">{badge}</span>
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <p className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.16em] mb-3">Vanliga frågor</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-slate-900 leading-tight tracking-tight">
              Allt du behöver veta
            </h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
                  <span className="text-[14px] font-semibold text-slate-900 leading-snug">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 pt-0">
                    <p className="text-[14px] text-slate-500 leading-[1.65]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section ref={formRef} className="py-20 sm:py-28 px-5 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-900 leading-[1.08] tracking-tight">
              Redo att byta till el?
            </h2>
            <p className="text-slate-500 mt-3 text-[15px] leading-relaxed">
              Fyll i formuläret — en expert ringer dig inom 24 timmar. Kostnadsfritt.
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8">
            <LeadForm />
          </div>
          <div className="mt-6 flex items-center gap-3">
            <a href="tel:+46855550200"
              className="h-11 px-6 rounded-full border border-slate-300 text-slate-700 font-semibold text-[14px] hover:border-slate-400 transition inline-flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Ring oss direkt
            </a>
            <span className="text-[13px] text-slate-400">Gratis · Utan bindning</span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
