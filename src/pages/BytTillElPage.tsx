import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, Check, ChevronDown, Phone, Zap, Car, Plug,
  CreditCard, BarChart2, Home, Leaf, Menu, User,
  TrendingDown, ShieldCheck, AlertCircle, Loader2,
} from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu from '../components/MobileMenu';
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

// ─── Cost calc ────────────────────────────────────────────────────────────────
function CostCalc() {
  const [mil, setMil] = useState(1500);
  const [elpris, setElpris] = useState(1.5);
  const [bensinkr, setBensinkr] = useState(20);

  const bensinKostnad = (mil * 10 * 0.75 / 100) * bensinkr;
  const elKostnad = (mil * 10 * 0.18) * elpris;
  const besparing = Math.max(0, bensinKostnad - elKostnad);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0e6efe] flex items-center justify-center shadow-md shadow-[#0e6efe]/25">
          <TrendingDown className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-[17px] font-bold text-slate-900">Driftkostnadskalkylator</h3>
          <p className="text-[13px] text-slate-500">Bensin vs el — per år</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[14px] font-semibold text-slate-700">Körda mil per år</label>
            <span className="text-[16px] font-bold text-slate-900 tabular-nums">{formatSEK(mil)} mil</span>
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
            { label: 'Bensinkostnad', value: formatSEK(Math.round(bensinKostnad)) + ' kr', bg: 'bg-red-50 border-red-100', text: 'text-red-700', sub: 'text-red-400' },
            { label: 'Elkostnad', value: formatSEK(Math.round(elKostnad)) + ' kr', bg: 'bg-[#0e6efe]/5 border-[#0e6efe]/10', text: 'text-[#0e6efe]', sub: 'text-[#0e6efe]/60' },
            { label: 'Din besparing', value: formatSEK(Math.round(besparing)) + ' kr', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', sub: 'text-emerald-500' },
          ].map(({ label, value, bg, text, sub }) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${sub}`}>{label}</p>
              <p className={`text-[14px] sm:text-[16px] font-bold tabular-nums leading-none ${text}`}>{value}</p>
              <p className={`text-[9px] mt-0.5 ${sub}`}>per år</p>
            </div>
          ))}
        </div>

        {besparing > 0 && (
          <p className="text-[13px] text-slate-500 text-center leading-relaxed">
            Med elbil sparar du ungefär <span className="font-bold text-emerald-600">{formatSEK(Math.round(besparing))} kr/år</span> i driftkostnad.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Lead form ────────────────────────────────────────────────────────────────
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
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
        </div>
        <h3 className="text-[22px] font-bold text-slate-900 mb-2">Vi hör av oss snart!</h3>
        <p className="text-[15px] text-slate-500 max-w-xs mx-auto leading-relaxed">
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
            className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0e6efe] transition" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Telefon <span className="text-red-400">*</span></label>
          <input required type="tel" placeholder="070 123 45 67" value={telefon} onChange={e => setTelefon(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0e6efe] transition" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">E-post</label>
          <input type="email" placeholder="anna@exempel.se" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0e6efe] transition" />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Regnummer (nuvarande bil)</label>
          <input type="text" placeholder="ABC123" value={regnummer} onChange={e => setRegnummer(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0e6efe] transition uppercase" />
        </div>
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
                intresse === opt.val ? 'border-[#0e6efe] bg-[#0e6efe]/5 text-[#0e6efe]' : 'border-slate-200 text-slate-500 hover:border-slate-300'
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
        className="w-full h-14 rounded-full bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[16px] flex items-center justify-center gap-2 transition shadow-sm">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Boka gratis rådgivning</span> <ArrowRight className="w-5 h-5" /></>}
      </button>
      <p className="text-[12px] text-slate-400 text-center">
        Kostnadsfri rådgivning · Ingen bindning · Vi ringer inom 24 timmar
      </p>
    </form>
  );
}

// ─── FAQ item ─────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Behöver jag ha garage för att ha elbil?', a: 'Nej, men det underlättar. Vi hjälper dig även med laddstolpe i bostadsrätt eller utomhus. Många BRF:er kan söka stöd för gemensam laddning.' },
  { q: 'Räcker räckvidden för min vardag?', a: 'De flesta elbilar har idag 300–600 km räckvidd. Medelbilisten kör ca 40 km/dag — de allra flesta behöver aldrig använda snabbladdare i vardagen.' },
  { q: 'Vad händer med min nuvarande bil?', a: 'Vi värderar din bil och sköter hela inbytet. Värdet kan användas som kontantinsats på ditt nya elfordon.' },
  { q: 'Är laddhybrid ett bra mellanalternativ?', a: 'Ja, om du kör korta sträckor dagligen (30–50 km) och ibland längre resor. Du kör på el hemma och bensin på längre sträckor.' },
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
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden">
      <div className="relative aspect-[16/9] bg-[#f5f8fc] overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy"
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
            onError={e => { e.currentTarget.src = '/car-placeholder.svg'; e.currentTarget.className = 'w-full h-full object-contain p-6 opacity-25'; }} />
        ) : (
          <img src="/car-placeholder.svg" alt={name} loading="lazy" className="w-full h-full object-contain p-6 opacity-25" />
        )}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0e6efe] text-white text-[10px] font-bold">
            <Zap className="w-2.5 h-2.5 fill-white" /> Elbil
          </span>
        </div>
        {rating != null && (
          <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white border-2 border-[#0e6efe] flex items-center justify-center">
            <span className="text-[10px] font-extrabold tabular-nums text-[#0e6efe]">{Number.isInteger(rating) ? rating : rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="text-[14px] font-bold text-slate-900 truncate group-hover:text-[#0e6efe] transition-colors">{name}</h4>
        {pros && pros[0] && <p className="text-[12px] text-slate-400 mt-0.5 line-clamp-1 italic">{pros[0]}</p>}
        {range && (
          <p className="text-[15px] font-bold text-[#0e6efe] tabular-nums mt-2">
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
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
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
        onSelect={() => setMenuOpen(false)}
      />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 ring-white/10 transition-colors duration-300 ${
          scrolled ? 'bg-[#0e6efe]' : 'bg-[#0e6efe]'
        }`}
      >
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white">
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={onBack} className="shrink-0 flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={onBack}
              className="text-[15px] text-white/80 hover:text-white transition font-medium">
              Sälj bil
            </button>
            <button type="button" onClick={() => navigate('/kop-bil')}
              className="text-[15px] text-white/80 hover:text-white transition font-medium">
              Köp bil
            </button>
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 border border-white/40 text-white text-[14px] font-semibold">
              <Zap className="w-4 h-4 fill-white" />
              Byt till el
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
      <section className="relative bg-[#0e6efe] pt-28 pb-0 overflow-hidden">
        <div className="absolute -left-60 -top-40 w-[800px] h-[800px] rounded-full bg-[#1a7cff] opacity-50 pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-[500px] h-[500px] rounded-full bg-[#0a57cc] opacity-40 pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 items-end">
            {/* Left copy */}
            <div className="pb-14 lg:pb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-[13px] font-semibold mb-8">
                <ShieldCheck className="w-4 h-4" />
                Komplett tjänst — inbyte, laddning och finansiering
              </div>
              <h1 className="text-white text-[40px] sm:text-[56px] lg:text-[64px] font-bold leading-[1.0] tracking-tight">
                Byt till elbil —<br />
                <span className="text-white/85">vi sköter allt</span>
              </h1>
              <p className="mt-6 text-white/85 text-[17px] sm:text-[20px] leading-[1.6] max-w-[480px]">
                Från inbyte av din nuvarande bil till laddbox hemma och finansiering. En kontakt — hela övergången till el.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  'Vi värderar och säljer din nuvarande bil',
                  'Laddbox installerad hemma, vi koordinerar allt',
                  'Vi förhandlar bästa elpris och finansiering',
                  'Gratis rådgivning — ingen bindning',
                ].map((point) => (
                  <li key={point} className="flex items-center gap-3 text-white text-[15px] font-medium">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={scrollToForm}
                  className="h-14 px-8 rounded-full bg-white text-[#0e6efe] font-bold text-[16px] hover:bg-slate-50 transition shadow-lg inline-flex items-center gap-2 group justify-center">
                  Kom igång gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
                </button>
                <a href="tel:+46855550200"
                  className="h-14 px-7 rounded-full border-2 border-white/30 text-white font-semibold text-[15px] hover:border-white/60 transition inline-flex items-center gap-2 justify-center">
                  <Phone className="w-4 h-4" />
                  Ring oss: 08-5555 0200
                </a>
              </div>
              <p className="mt-4 text-white/60 text-[13px]">Vi hör av oss inom en arbetsdag.</p>
            </div>

            {/* Right: what's included cards */}
            <div className="hidden lg:flex flex-col gap-4 pb-10 justify-end">
              {[
                { icon: Car, title: 'Inbyte av din bil', desc: 'Vi värderar och säljer till bästa pris — kapitalet används som insats.' },
                { icon: Plug, title: 'Laddbox hemma', desc: 'Vi koordinerar installation hos villa, radhus eller BRF.' },
                { icon: CreditCard, title: 'Finansiering & köp', desc: 'Vi förhandlar pris och ordnar bästa ränta. Du godkänner.' },
              ].map((item) => (
                <div key={item.title}
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4">
                  <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6 text-white" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-[15px] leading-tight">{item.title}</p>
                    <p className="text-white/70 text-[13px] mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <p className="text-emerald-200 text-[13px] font-medium">En expert är tillgänglig nu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="relative h-16 mt-0">
          <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none" fill="white">
            <path d="M0,32 C360,80 1080,-16 1440,32 L1440,64 L0,64 Z" />
          </svg>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <section className="bg-white py-10 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: '5 000+', label: 'Bilaffärer genomförda' },
              { value: '~15 000 kr', label: 'Genomsnittlig besparing' },
              { value: '100%', label: 'På kundens sida' },
              { value: '1 995 kr', label: 'Fast avgift, inget mer' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[26px] sm:text-[30px] font-bold text-[#0e6efe] tabular-nums tracking-tight leading-none">{s.value}</p>
                <p className="text-[12px] sm:text-[13px] text-slate-500 font-medium mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Processen ─────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">Processen</span>
            <h2 className="text-[32px] sm:text-[48px] font-bold leading-[1.05] text-slate-900 tracking-tight">
              Fem steg — du gör nästan ingenting
            </h2>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-px bg-slate-200" />
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-4">
              {[
                { n: '01', icon: BarChart2, title: 'Behovsanalys', body: 'Vi kartlägger dina körvanor och laddmöjligheter. El, laddhybrid — eller en kombination?' },
                { n: '02', icon: Car, title: 'Inbyte värderas', body: 'Din bil värderas av flera handlare. Vi ser till att du får marknadspris.' },
                { n: '03', icon: Zap, title: 'Bilval & förhandling', body: 'Vi hittar rätt elbil och förhandlar pris, ränta och tillval åt dig.' },
                { n: '04', icon: Plug, title: 'Laddbox hemma', body: 'Vi koordinerar installation — du behöver inte lyfta ett finger.' },
                { n: '05', icon: CreditCard, title: 'Finansiering klar', body: 'Vi sköter finansieringen med lägsta möjliga månadskostand. Klart.' },
              ].map(step => {
                const Icon = step.icon;
                return (
                  <div key={step.n} className="relative text-center flex flex-col items-center">
                    <div className="relative z-10 w-20 h-20 rounded-2xl bg-[#0e6efe] flex items-center justify-center mb-5 shadow-lg shadow-[#0e6efe]/25">
                      <Icon className="w-8 h-8 text-white" strokeWidth={1.8} />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-[#0e6efe] text-[#0e6efe] text-[10px] font-bold flex items-center justify-center">{step.n}</span>
                    </div>
                    <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 mb-2 leading-snug">{step.title}</h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed max-w-[160px]">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-14 text-center">
            <button type="button" onClick={scrollToForm}
              className="h-14 px-10 rounded-full bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-bold text-[16px] transition shadow-sm inline-flex items-center gap-2 group">
              Boka gratis rådgivning
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
            <p className="mt-3 text-[13px] text-slate-400">Gratis och utan förpliktelse.</p>
          </div>
        </div>
      </section>

      {/* ── Elbil vs laddhybrid ────────────────────────────────────────────────── */}
      <section className="bg-[#f5f8fc] py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">Vilket passar dig?</span>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-900 leading-tight tracking-tight">
              Elbil eller laddhybrid?
            </h2>
            <p className="text-slate-500 mt-4 text-[15px] sm:text-[17px] max-w-md mx-auto leading-relaxed">
              Rätt val beror på dina körvanor. Vi hjälper dig välja — kostnadsfritt.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Zap,
                title: 'Elbil passar dig som...',
                color: 'text-[#0e6efe]',
                bg: 'bg-white border-slate-200',
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
                color: 'text-emerald-600',
                bg: 'bg-white border-slate-200',
                points: [
                  'Kör varierat — kort vardag, långa resor ibland',
                  'Inte har enkel tillgång till laddning',
                  'Vill ha låg förmånsbeskattning',
                  'Vill ta ett första steg mot elektrifiering',
                ],
              },
            ].map(({ icon: Icon, title, color, bg, points }) => (
              <div key={title} className={`rounded-2xl border p-7 sm:p-8 shadow-sm ${bg}`}>
                <div className="flex items-center gap-3 mb-5">
                  <Icon className={`w-7 h-7 ${color}`} strokeWidth={1.8} />
                  <h3 className="text-[17px] font-bold text-slate-900">{title}</h3>
                </div>
                <ul className="space-y-3">
                  {points.map(p => (
                    <li key={p} className="flex items-start gap-3 text-[14.5px] text-slate-600 leading-snug">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${color === 'text-[#0e6efe]' ? 'bg-[#0e6efe]/10' : 'bg-emerald-50'}`}>
                        <Check className={`w-3 h-3 ${color}`} strokeWidth={3} />
                      </div>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Driftkostnadskalkylator ─────────────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">Räkna själv</span>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-900 leading-tight tracking-tight">
              Vad sparar du på att byta?
            </h2>
          </div>
          <CostCalc />
        </div>
      </section>

      {/* ── Populära elbilar ─────────────────────────────────────────────────────── */}
      <section className="bg-[#f5f8fc] py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">Experternas val</span>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-900 leading-tight tracking-tight">
              Populära elbilar just nu
            </h2>
            <p className="text-slate-500 mt-4 text-[15px] sm:text-[17px] max-w-md mx-auto leading-relaxed">
              Vi hjälper dig hitta och förhandla fram bästa pris på rätt bil.
            </p>
          </div>

          {carsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white border border-slate-100 animate-pulse aspect-[4/3]" />
              ))}
            </div>
          ) : elCars.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {elCars.map(car => (
                <ElBilCard
                  key={car.id}
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

          <div className="mt-10 text-center">
            <button type="button" onClick={() => navigate('/kop-bil')}
              className="h-12 px-8 rounded-full border-2 border-slate-300 text-slate-700 hover:border-[#0e6efe] hover:text-[#0e6efe] font-semibold text-[15px] inline-flex items-center gap-2 transition">
              Se alla elbilar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Vad ingår ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#0e6efe] py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] sm:text-[44px] font-bold text-white leading-tight tracking-tight">
              Vad ingår i el-tjänsten?
            </h2>
            <p className="text-white/75 mt-4 text-[15px] sm:text-[17px] max-w-xl mx-auto">
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
                className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-white font-semibold text-[15px] leading-snug">{item.title}</p>
                  <p className="text-white/65 text-[13px] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button type="button" onClick={scrollToForm}
              className="h-14 px-10 rounded-full bg-white text-[#0e6efe] font-bold text-[16px] hover:bg-slate-50 transition shadow-lg inline-flex items-center gap-2 group">
              Kom igång nu
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Laddning ────────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">Laddning</span>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-900 leading-tight tracking-tight">
              Allt om laddning — vi ordnar
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Home, title: 'Hemmaladdning', badge: '~40 km/h', desc: '7 kW laddbox ger ca 40 km räckvidd per timme. Perfekt för nattladdning. Vi koordinerar installation och ROT-avdrag.' },
              { icon: Zap, title: 'Snabbladdning', badge: '50–350 kW', desc: 'DC-snabbladdare finns längs motorvägar och i städer. Från 10 % till 80 % på 20–45 minuter.' },
              { icon: Leaf, title: 'BRF & bostadsrätt', badge: 'Bidrag finns', desc: 'Vi hjälper med ansökan till BRF om gemensam laddinfrastruktur. Energimyndigheten ger stöd för gemensam installation.' },
            ].map(({ icon: Icon, title, badge, desc }) => (
              <div key={title} className="bg-[#f5f8fc] rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0e6efe] flex items-center justify-center shadow-md shadow-[#0e6efe]/25">
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                  </div>
                  <span className="text-[11px] font-bold text-[#0e6efe] bg-[#0e6efe]/8 px-2.5 py-1 rounded-full">{badge}</span>
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-[13.5px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 block">Vanliga frågor</span>
            <h2 className="text-[28px] sm:text-[40px] font-bold text-slate-900 leading-tight tracking-tight">
              Allt du behöver veta
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50 transition-colors">
                  <span className="text-[15px] font-semibold text-slate-900 leading-snug">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-[14.5px] text-slate-600 leading-[1.65]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead form (final CTA) ─────────────────────────────────────────────── */}
      <section ref={formRef} className="bg-[#f5f8fc] py-20 sm:py-28 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[32px] sm:text-[52px] font-bold text-slate-900 leading-[1.05] tracking-tight">
              Redo att byta till el?
            </h2>
            <p className="text-slate-600 mt-5 text-[16px] sm:text-[18px] leading-[1.6] max-w-xl mx-auto">
              Fyll i formuläret så ringer en av våra experter dig inom 24 timmar — kostnadsfritt.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-10">
            <LeadForm />
          </div>
          <p className="mt-6 text-[13px] text-slate-400 text-center">
            Gratis · Utan förpliktelse · Vi hör av oss inom en arbetsdag
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
