import { useState, useEffect, Suspense, lazy } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Phone,
  ShieldCheck,
  Menu,
  Clock,
  Search,
  Sparkles,
  Shield,
  Star,
  MapPin,
  Users,
  TrendingUp,
  ChevronRight,
  Banknote,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Forhandlare } from '../lib/forhandlare.types';
import { FALLBACK_FORHANDLARE } from '../lib/forhandlare-data';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { setPageMeta } from '../lib/pageMeta';
import { PHONE, PHONE_TEL } from '../config/site';

const ConsultationDrawer = lazy(() => import('../components/ConsultationDrawer'));

const CERT_ORDER: Record<string, number> = { Master: 5, Elite: 4, Senior: 3, Certifierad: 2, Trainee: 1 };
const CERT_COLOR: Record<string, string> = {
  Master:      'bg-amber-100 text-amber-800 border-amber-200',
  Elite:       'bg-blue-100 text-[#0e6efe] border-blue-200',
  Senior:      'bg-emerald-100 text-emerald-800 border-emerald-200',
  Certifierad: 'bg-slate-100 text-slate-700 border-slate-200',
  Trainee:     'bg-slate-50 text-slate-500 border-slate-200',
};

const INCLUDED = [
  { title: 'Certifierade experter', desc: 'Alla förhandlare har genomgått utbildning, prov och bakgrundskontroll.' },
  { title: 'Betalas vid avslutad affär', desc: 'Förhandlaren får arvode bara om affären blir av – aldrig i förväg.' },
  { title: 'Verifierade betyg', desc: 'Betyg baseras enbart på genomförda och verifierade affärer.' },
  { title: 'Oberoende rådgivning', desc: 'Förhandlaren jobbar för dig – inte för handlaren.' },
  { title: 'Matchning efter behov', desc: 'Vi matchar dig med rätt förhandlare baserat på din situation.' },
  { title: 'Nöjdhetsgaranti', desc: 'Nöjdhetspolicy ingår alltid – du är aldrig bunden.' },
];

const FAQS = [
  {
    q: 'Vad är en Bilto-förhandlare?',
    a: 'En certifierad expert som hjälper dig förhandla pris, ränta och villkor när du köper eller säljer bil. Förhandlaren får betalt bara om affären blir av.',
  },
  {
    q: 'Hur väljer jag förhandlare?',
    a: 'Du kan antingen bläddra bland alla certifierade förhandlare själv, eller använda vår matchningstjänst så para vi ihop dig med den som passar dina behov bäst.',
  },
  {
    q: 'Vad kostar det?',
    a: 'Varje förhandlare har ett fast arvode (ofta 4 995 kr) som betalas bara om affären faktiskt blir av. Inget avtal, ingen kostnad.',
  },
  {
    q: 'Kan förhandlaren hjälpa med både köp och försäljning?',
    a: 'Ja. Alla förhandlare kan hjälpa till med både köp, försäljning och inbytesaffärer. Vissa har specialiteter som elbilar eller lyxbilar.',
  },
  {
    q: 'Hur certifieras förhandlarna?',
    a: 'Alla genomgår bakgrundskontroll, utbildning och prov innan de certifieras. Därefter granskas betyg och affärer kontinuerligt.',
  },
];

function ForhandlarCard({ f, onSelect }: { f: Forhandlare; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full bg-white rounded-2xl border border-slate-200 hover:border-[#0e6efe]/40 hover:shadow-lg hover:shadow-blue-50 transition-all duration-200 text-left p-5 active:scale-[0.99]"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 shrink-0 overflow-hidden">
          {f.avatar_url ? (
            <img src={f.avatar_url} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-500">
              {f.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-slate-900 truncate">{f.name}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${CERT_COLOR[f.certifiering] ?? CERT_COLOR.Certifierad}`}>
              <Shield className="w-3 h-3" />
              {f.certifiering}
            </span>
          </div>
          {f.city && (
            <div className="flex items-center gap-1 mt-0.5 text-[12px] text-slate-400">
              <MapPin className="w-3 h-3 shrink-0" />
              {f.city}
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-[13px] font-bold text-slate-800">{f.rating.toFixed(1)}</span>
              <span className="text-[12px] text-slate-400">({f.review_count})</span>
            </div>
            <div className="flex items-center gap-1 text-[12px] text-slate-500">
              <Users className="w-3.5 h-3.5 shrink-0" />
              {f.deal_count} affärer
            </div>
            <div className="flex items-center gap-1 text-[12px] text-emerald-700 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              {f.avg_saving_kr > 0 ? `${f.avg_saving_kr.toLocaleString('sv-SE')} kr snitt` : '–'}
            </div>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0e6efe] shrink-0 mt-1 transition-colors" />
      </div>

      {f.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {f.specialties.slice(0, 4).map(s => (
            <span key={s} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-medium rounded-lg border border-slate-100">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[12px] text-slate-400">
            Svarar inom {f.response_time_hours < 1 ? '< 1 timme' : `${f.response_time_hours} h`}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[14px] font-bold text-slate-900">{f.fee_kr.toLocaleString('sv-SE')} kr</span>
          <span className="text-[11px] text-slate-400 block">bara om affären blir av</span>
        </div>
      </div>
    </button>
  );
}

interface Props {
  onBack: () => void;
  onSelectForhandlare: (slug: string) => void;
  onOpenConsultation: () => void;
}

export default function ForhandlarListPage({ onBack, onSelectForhandlare, onOpenConsultation }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [forhandlare, setForhandlare] = useState<Forhandlare[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: 'Förhandlare – Certifierade bilförhandlare | Bilto',
      description: 'Hitta din certifierade Bilto-förhandlare. Betalas bara om affären blir av – aldrig i förväg.',
      canonical: 'https://bilto.se/forhandlare',
    });
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('forhandlare')
        .select('*')
        .eq('is_active', true)
        .order('certifiering');
      if (data && data.length > 0) {
        setForhandlare([...data].sort((a, b) => (CERT_ORDER[b.certifiering] ?? 0) - (CERT_ORDER[a.certifiering] ?? 0)));
      } else {
        setForhandlare(FALLBACK_FORHANDLARE);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    if (item === 'Sälj bil') { onBack(); return; }
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Köp bil': '/kop-bil',
      'Bilköpshjälpen': '/kop-bil',
      'Förhandlare': '/forhandlare',
      'Guider': '/guider',
      'Priser': '/priser',
      'Vanliga frågor': '/vanliga-fragor',
    };
    const route = routes[item];
    if (route) {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onBack();
  };

  const cities = [...new Set(forhandlare.map(f => f.city).filter(Boolean))] as string[];

  const filtered = forhandlare.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.name.toLowerCase().includes(q) || f.city?.toLowerCase().includes(q) || f.specialties.some(s => s.toLowerCase().includes(q));
    const matchCity = !filterCity || f.city === filterCity;
    return matchSearch && matchCity;
  });

  const totalDeals = forhandlare.reduce((s, f) => s + f.deal_count, 0);
  const avgRating = forhandlare.length > 0 ? (forhandlare.reduce((s, f) => s + f.rating, 0) / forhandlare.length).toFixed(1) : '–';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Förhandlare"
        onSelect={handleMenuSelect}
      />

      {/* Nav */}
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-white"
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <button onClick={onBack} className="shrink-0 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </button>
          <nav className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={onBack} className="text-[15px] text-white/80 hover:text-white transition font-medium">Sälj bil</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/kop-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 hover:text-white transition font-medium">Köp bil</button>
            <button type="button" onClick={() => {}} className="text-[15px] text-white font-semibold transition">Förhandlare</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/om-oss'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 hover:text-white transition font-medium">Om oss</button>
          </nav>
          <div className="flex items-center ml-auto">
            <a
              href="/gratis-konsultation"
              className="inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap"
            >
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-[100svh] flex flex-col overflow-hidden">
        <img
          src="/files_2615643-2026-06-21T06-29-18-662Z-b858d9c8-9893-488f-8103-98fee9292c16 copy.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-[50%_65%]"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/30 to-transparent pointer-events-none" />

        <div className="relative flex-1 flex flex-col items-center justify-start pt-28 sm:pt-32 pb-10 px-5 sm:px-8">
          <div className="w-full max-w-md">
            <h1 className="text-white text-[28px] sm:text-[42px] font-bold leading-[1.08] tracking-tight text-center drop-shadow-lg mb-2">
              Hitta din<br />certifierade förhandlare
            </h1>
            <p className="text-white/80 text-center text-[14px] sm:text-[15px] mb-6 sm:mb-7 drop-shadow">
              Betalas bara om affären blir av · Oberoende · Certifierade experter
            </p>

            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-2">
                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-4">Så funkar det</p>
                <ul className="space-y-3 mb-5">
                  {[
                    'Välj en certifierad förhandlare – eller låt oss matcha dig',
                    'Kostnadsfritt samtal, inga förpliktelser',
                    'Förhandlaren tar hela affären – du signerar',
                    'Arvode betalas bara om affären blir av',
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-3 text-slate-700 text-[14px] sm:text-[15px]">
                      <div className="w-5 h-5 rounded-full bg-[#0e6efe]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#0e6efe]" strokeWidth={3} />
                      </div>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-6 pb-6 space-y-3">
                <button
                  type="button"
                  onClick={onOpenConsultation}
                  className="w-full h-11 rounded-xl bg-[#0e6efe] text-white font-bold text-[15px] hover:bg-[#0a57cc] transition inline-flex items-center justify-center gap-2 group"
                >
                  Matcha mig automatiskt
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
                </button>
                <p className="text-center text-slate-400 text-[12px]">Kostnadsfritt · Ingen bindning</p>
                <a
                  href={PHONE_TEL}
                  className="w-full h-11 rounded-xl border border-slate-200 text-slate-600 font-medium text-[14px] hover:bg-[#faf8f5] transition inline-flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  Ring oss: {PHONE}
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-5">
              <ShieldCheck className="w-4 h-4 text-white/70 shrink-0" />
              <p className="text-white/70 text-[13px] drop-shadow">Alla förhandlare jobbar för dig – aldrig för handlaren</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats + filter + list ── */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-white py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 sm:mb-4 block">
              Våra förhandlare
            </span>
            <h2 className="text-[24px] sm:text-[40px] font-bold leading-[1.1] sm:leading-[1.05] text-slate-900 tracking-[-0.02em]">
              Certifierade experter redo att ta din affär
            </h2>
            <p className="text-slate-600 mt-4 sm:mt-6 text-[15px] sm:text-[17px] leading-[1.6] max-w-xl mx-auto">
              Alla förhandlare är utbildade, granskade och betygssatta baserat på verkliga affärer.
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 mb-10">
            <div className="text-center">
              <div className="text-[22px] sm:text-[28px] font-extrabold text-slate-900">{forhandlare.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">aktiva förhandlare</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <div className="text-[22px] sm:text-[28px] font-extrabold text-slate-900">{totalDeals.toLocaleString('sv-SE')}</div>
              <div className="text-[11px] text-slate-400 font-medium">genomförda affärer</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-[22px] sm:text-[28px] font-extrabold text-slate-900">{avgRating}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">snittbetyg</div>
            </div>
          </div>

          {/* Search + city filter */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Sök på namn, stad eller specialitet..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-11 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-[14px] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe]"
              />
            </div>
            {cities.length > 1 && (
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="h-11 px-3 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30"
              >
                <option value="">Alla städer</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-1/2" />
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-[15px]">Inga förhandlare hittades.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(f => (
                <ForhandlarCard
                  key={f.id}
                  f={f}
                  onSelect={() => onSelectForhandlare(f.slug)}
                />
              ))}
            </div>
          )}

          {/* Matchning CTA */}
          <div className="mt-10 p-6 bg-white rounded-2xl border border-slate-200 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#0e6efe]" />
              <p className="text-[15px] font-bold text-slate-900">Osäker på vem du ska välja?</p>
            </div>
            <p className="text-[13px] text-slate-500 mb-4 max-w-md mx-auto leading-relaxed">
              Låt oss matcha dig med rätt förhandlare baserat på din situation – kostnadsfritt och utan bindning.
            </p>
            <button
              type="button"
              onClick={onOpenConsultation}
              className="inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl text-white font-bold text-[15px] transition active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#1a7fff 0%,#0e6efe 60%,#0a57cc 100%)', boxShadow: '0 4px 16px rgba(14,110,254,0.30)' }}
            >
              <Sparkles className="w-4 h-4" />
              Matcha mig automatiskt
            </button>
          </div>
        </div>
      </section>

      {/* ── Vad ingår ── */}
      <section className="bg-[#0e6efe] py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-12">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">Ingår alltid</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-white leading-[1.08] tracking-[-0.02em]">
              Tryggt från första kontakt till signerat avtal
            </h2>
            <p className="text-white/70 mt-3 text-[15px] leading-[1.65] max-w-xl">
              Vi säkerställer att varje affär hanteras professionellt – oavsett vilken förhandlare du väljer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 rounded-xl overflow-hidden ring-1 ring-white/10">
            {INCLUDED.map((item) => (
              <div key={item.title} className="flex items-start gap-4 bg-white/[0.07] p-6 sm:p-7">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-white font-semibold text-[14px] sm:text-[15px] leading-snug">{item.title}</p>
                  <p className="text-white/60 text-[13px] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 sm:mt-12">
            <button
              type="button"
              onClick={onOpenConsultation}
              className="h-12 px-8 sm:px-10 rounded-xl bg-white text-[#0e6efe] font-bold text-[15px] hover:bg-[#faf8f5] transition shadow-lg inline-flex items-center gap-2 group"
            >
              Kom igång
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Trygghet ── */}
      <section className="bg-[#faf8f5] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-14 max-w-2xl">
            <p className="text-xs font-semibold text-[#0e6efe] uppercase tracking-widest mb-3">Trygghet</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-slate-900 tracking-[-0.02em] leading-[1.08]">
              Din partner för en trygg och lönsam bilaffär
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-px bg-slate-200 rounded-xl overflow-hidden ring-1 ring-slate-200">
            {[
              {
                icon: ShieldCheck,
                title: 'Oberoende rådgivning',
                text: 'Förhandlaren jobbar uteslutande för dig – inte för handlaren. Arvodet är fast och beroer inte på vilken bil du väljer.',
              },
              {
                icon: Clock,
                title: 'Sparar dig tid',
                text: 'Sluta scrolla Blocket och Bytbil. Förhandlaren gör jobbet åt dig och återkommer med ett klart erbjudande.',
              },
              {
                icon: Banknote,
                title: 'Sparar dig pengar',
                text: 'Snittbesparing på tusentals kronor per affär. Förhandlaren pressar pris, ränta och tillval – du betalar bara om affären blir av.',
              },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white p-7 sm:p-9 flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center mb-5 shrink-0">
                    <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={2} />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900 mb-2 tracking-[-0.01em]">{b.title}</h3>
                  <p className="text-slate-500 leading-[1.65] text-[14px]">{b.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="bg-white px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[7px] bg-[#0e6efe] px-6 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14 overflow-hidden">
            <div className="absolute -right-20 -top-20 w-[360px] h-[360px] rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -left-12 -bottom-16 w-[280px] h-[280px] rounded-full bg-white/5 pointer-events-none" />

            <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <h2 className="text-[28px] sm:text-[36px] lg:text-[42px] font-bold tracking-[-0.02em] leading-[1.06] text-white">
                  Redo att få en expert i ditt hörn?
                </h2>
                <ul className="mt-6 space-y-3">
                  {[
                    'Välj en certifierad förhandlare själv – eller låt oss matcha dig',
                    'Kostnadsfritt samtal, inga förpliktelser',
                    'Du betalar bara om affären faktiskt blir av',
                  ].map((text) => (
                    <li key={text} className="flex items-center gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-white/20">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                      <span className="text-[15px] text-white/90 font-medium">{text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={onOpenConsultation}
                    className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-white text-[#0e6efe] text-[15px] font-bold transition-all hover:bg-slate-100 active:scale-[0.98] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)]"
                  >
                    Kom igång
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                  <a
                    href={PHONE_TEL}
                    className="inline-flex items-center justify-center h-12 px-7 rounded-xl border-2 border-white/40 text-white text-[15px] font-semibold transition-all hover:bg-white/10 active:scale-[0.98]"
                  >
                    <Phone className="w-4 h-4 mr-2 shrink-0" strokeWidth={2.5} />
                    Ring {PHONE}
                  </a>
                </div>
              </div>

              <div className="hidden lg:block relative h-[280px]">
                <div className="absolute left-0 top-0 w-[72%] h-full rounded-[18px] overflow-hidden">
                  <img
                    src="/BSM_car_sale_key_woman_handover_101122.jpg"
                    alt="Bilto-förhandlare hjälper kund"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                    width="480"
                    height="320"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 right-0 bg-white rounded-xl shadow-xl p-4 w-[160px]">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avgift</p>
                  <p className="text-[22px] font-bold text-slate-900 leading-none">4 995 kr</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">Betalas bara om affären blir av</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#0e6efe] px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">Vanliga frågor</p>
            <h2 className="text-[28px] sm:text-[38px] font-bold text-white tracking-[-0.02em] leading-[1.08]">
              Vanliga frågor – vi svarar rakt på sak.
            </h2>
          </div>
          <div className="divide-y divide-white/15 border-y border-white/15">
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full text-left py-5 flex items-start gap-4 group"
                >
                  <div className="flex-1">
                    <h3 className="text-[16px] font-semibold text-white leading-snug">{faq.q}</h3>
                    {open && (
                      <p className="mt-3 text-[14px] text-white/75 leading-[1.65]">{faq.a}</p>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180 text-white/60' : 'text-white/40'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* ── Scrolled mobile CTA ── */}
      {scrolled && (
        <a
          href={PHONE_TEL}
          className="md:hidden fixed bottom-4 left-3 right-3 z-40 flex items-center gap-3 px-4 h-[58px] rounded bg-[#0e6efe] active:bg-[#0047B3] text-white font-semibold text-[15px] shadow-[0_8px_24px_rgba(14,110,254,0.45)] transition-all duration-200 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#1a7fff 0%,#0e6efe 50%,#0a57cc 100%)' }}
        >
          <div className="relative shrink-0">
            <Shield className="w-9 h-9 p-1 rounded object-cover border-2 border-white/30" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[15px] font-bold tracking-[-0.01em] truncate">Prata med en expert</span>
            <span className="text-[11px] text-white/70 font-normal">Gratis · svar direkt</span>
          </div>
          <div className="ml-auto shrink-0 flex items-center gap-1.5 bg-white/15 rounded px-3 py-1.5">
            <Phone className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="text-[13px] font-semibold">Ring</span>
          </div>
        </a>
      )}

      <Suspense fallback={null}>
        <ConsultationDrawer open={false} onClose={() => {}} />
      </Suspense>
    </div>
  );
}
