import { useState, useEffect, Suspense, lazy } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Star,
  MapPin,
  Users,
  TrendingUp,
  Clock,
  Shield,
  Phone,
  Car,
  Share2,
  Check,
  Menu,
  ShieldCheck,
  Banknote,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Forhandlare } from '../lib/forhandlare.types';
import { getFallbackForhandlareBySlug } from '../lib/forhandlare-data';
import { SiteFooter } from '../components/SiteFooter';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import { setPageMeta } from '../lib/pageMeta';
import { PHONE, PHONE_TEL } from '../config/site';
import { captureAttribution } from '../lib/attribution';

const ConsultationDrawer = lazy(() => import('../components/ConsultationDrawer'));

const CERT_COLOR: Record<string, string> = {
  Master:      'bg-amber-100 text-amber-800 border-amber-200',
  Elite:       'bg-blue-100 text-[#0e6efe] border-blue-200',
  Senior:      'bg-emerald-100 text-emerald-800 border-emerald-200',
  Certifierad: 'bg-slate-100 text-slate-700 border-slate-200',
  Trainee:     'bg-slate-50 text-slate-500 border-slate-200',
};

const CERT_STARS: Record<string, number> = { Master: 5, Elite: 4, Senior: 3, Certifierad: 2, Trainee: 1 };

const FAQS = [
  {
    q: 'Vad kostar det att anlita denna förhandlare?',
    a: 'Arvodet är fast och betalas bara om affären faktiskt blir av. Inget avtal, ingen kostnad. Du är aldrig bunden.',
  },
  {
    q: 'Hur går första steget till?',
    a: 'Du bokar ett kostnadsfritt samtal. Förhandlaren lyssnar på dina behov och berättar hur hen kan hjälpa dig – inga förpliktelser.',
  },
  {
    q: 'Kan förhandlaren hjälpa med inbytesbil?',
    a: 'Ja. Förhandlaren hanterar hela bytesaffären – värderar din bil, inhämtar bud och säkerställer att inbytesvärdet är marknadsmässigt.',
  },
  {
    q: 'Är förhandlaren oberoende?',
    a: 'Ja. Alla Bilto-förhandlare jobbar uteslutande för dig – inte för handlaren. Arvodet är fast och beror inte på vilken bil du väljer.',
  },
];

function CertBadge({ cert }: { cert: string }) {
  const stars = CERT_STARS[cert] ?? 2;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold border ${CERT_COLOR[cert] ?? CERT_COLOR.Certifierad}`}>
      <Shield className="w-3.5 h-3.5" />
      {cert}
      <div className="flex gap-0.5 ml-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < stars ? 'bg-current' : 'bg-current opacity-20'}`} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  slug: string;
  onBack: () => void;
  onOpenConsultation: (forhandlare?: Forhandlare) => void;
  onNavigateBuy: () => void;
  onNavigateSell: () => void;
}

export default function ForhandlarProfilPage({ slug, onBack, onOpenConsultation, onNavigateBuy, onNavigateSell }: Props) {
  const [forhandlare, setForhandlare] = useState<Forhandlare | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    captureAttribution();
  }, []);

  useEffect(() => {
    setPageMeta({
      title: 'Förhandlare | Bilto',
      description: 'Certifierad Bilto-förhandlare – betalas bara om affären blir av.',
    });
  }, [slug]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('forhandlare')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (data) {
        setForhandlare(data as Forhandlare);
      } else {
        const fallback = getFallbackForhandlareBySlug(slug);
        if (fallback) setForhandlare(fallback);
        else setNotFound(true);
      }
      setLoading(false);
    })();
  }, [slug]);

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

  const handleShare = async () => {
    const url = `${window.location.origin}/f/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silent
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#0e6efe]/20 border-t-[#0e6efe] animate-spin" />
      </div>
    );
  }

  if (notFound || !forhandlare) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center px-5 text-center">
        <p className="text-[17px] font-semibold text-slate-700 mb-2">Förhandlaren hittades inte</p>
        <p className="text-slate-400 text-[14px] mb-6">Länken kan vara felaktig eller inaktiv.</p>
        <button type="button" onClick={onBack} className="text-[#0e6efe] font-semibold text-[14px] hover:underline">
          Se alla förhandlare
        </button>
      </div>
    );
  }

  const f = forhandlare;
  const profileUrl = `${window.location.origin}/f/${f.slug}`;
  const firstName = f.name.split(' ')[0];

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
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </button>
          <nav className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <button type="button" onClick={() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 hover:text-white transition font-medium">Sälj bil</button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/kop-bil'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-[15px] text-white/80 hover:text-white transition font-medium">Köp bil</button>
            <button type="button" onClick={onBack} className="text-[15px] text-white font-semibold transition">Förhandlare</button>
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
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-[13px] text-white/70 hover:text-white mb-6 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Alla förhandlare
            </button>

            <h1 className="text-white text-[28px] sm:text-[42px] font-bold leading-[1.08] tracking-tight text-center drop-shadow-lg mb-2">
              {f.name}
            </h1>
            <p className="text-white/80 text-center text-[14px] sm:text-[15px] mb-6 sm:mb-7 drop-shadow">
              {f.certifiering} · {f.city ?? 'Hela Sverige'} · {f.deal_count} affärer
            </p>

            {/* Profile card */}
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-2">
                {/* Avatar + cert */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 shrink-0 overflow-hidden shadow-sm">
                    {f.avatar_url ? (
                      <img src={f.avatar_url} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-extrabold text-slate-500">
                        {f.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CertBadge cert={f.certifiering} />
                    {f.city && (
                      <div className="flex items-center gap-1.5 mt-2 text-[13px] text-slate-400">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {f.city}
                        {f.languages.length > 1 && (
                          <span className="ml-1">· {f.languages.join(', ')}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition shrink-0"
                    title="Kopiera länk"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {[
                    { icon: Star, label: 'Betyg', value: `${f.rating.toFixed(1)}`, sub: `(${f.review_count})`, color: 'text-amber-500', fill: 'fill-amber-400' },
                    { icon: Users, label: 'Affärer', value: String(f.deal_count), sub: 'genomförda', color: 'text-slate-500', fill: '' },
                    { icon: TrendingUp, label: 'Snitt', value: f.avg_saving_kr > 0 ? `${(f.avg_saving_kr / 1000).toFixed(0)} tkr` : '–', sub: 'per affär', color: 'text-emerald-600', fill: '' },
                    { icon: Clock, label: 'Svar', value: f.response_time_hours < 1 ? '<1h' : `${f.response_time_hours}h`, sub: 'i snitt', color: 'text-[#0e6efe]', fill: '' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-[#faf8f5] rounded-xl p-2.5 text-center">
                      <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1 ${stat.fill}`} />
                      <div className="text-[15px] font-extrabold text-slate-900 leading-tight">{stat.value}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{stat.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Bio */}
                {f.bio && (
                  <p className="text-[14px] text-slate-600 leading-relaxed mb-5">{f.bio}</p>
                )}

                {/* Specialties */}
                {f.specialties.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Specialiteter</p>
                    <div className="flex flex-wrap gap-2">
                      {f.specialties.map(s => (
                        <span key={s} className="px-3 py-1 bg-[#0e6efe]/6 text-[#0e6efe] text-[12px] font-semibold rounded-lg border border-[#0e6efe]/15">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fee note */}
                <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-2">
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold text-emerald-800">
                      {f.fee_kr.toLocaleString('sv-SE')} kr — betalas bara om affären blir av
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      {firstName} får ersättning vid avslutad affär. Det kostar dig inget extra.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="px-6 pb-6 space-y-3">
                <button
                  type="button"
                  onClick={() => onOpenConsultation(f)}
                  className="w-full h-12 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2.5 transition active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#1a7fff 0%,#0e6efe 60%,#0a57cc 100%)', boxShadow: '0 4px 16px rgba(14,110,254,0.30)' }}
                >
                  <Phone className="w-5 h-5" />
                  Boka samtal med {firstName}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { captureAttribution(); onNavigateBuy(); }}
                    className="h-11 rounded-xl border-2 border-[#0e6efe] text-[#0e6efe] font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-[#0e6efe]/5 transition active:scale-[0.98]"
                  >
                    <Car className="w-4 h-4" />
                    Köpa bil
                  </button>
                  <button
                    type="button"
                    onClick={() => { captureAttribution(); onNavigateSell(); }}
                    className="h-11 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-slate-50 transition active:scale-[0.98]"
                  >
                    Sälja bil
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-5">
              <ShieldCheck className="w-4 h-4 text-white/70 shrink-0" />
              <p className="text-white/70 text-[13px] drop-shadow">{firstName} jobbar alltid för dig – aldrig för handlaren</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Så funkar det ── */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-white py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 max-w-2xl mx-auto">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#0e6efe] uppercase tracking-[0.18em] mb-3 sm:mb-4 block">
              Så funkar det med {firstName}
            </span>
            <h2 className="text-[24px] sm:text-[40px] font-bold leading-[1.1] sm:leading-[1.05] text-slate-900 tracking-[-0.02em]">
              Tre steg till en klar affär
            </h2>
            <p className="text-slate-600 mt-4 sm:mt-6 text-[15px] sm:text-[17px] leading-[1.6] max-w-xl mx-auto">
              {firstName} tar hand om allt – från första samtal till signerat avtal.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { n: '1', title: 'Boka ett samtal', desc: 'Kostnadsfritt samtal — inget avtal, inga förpliktelser. Du berättar vad du behöver och {name} förklarar hur hen kan hjälpa dig.' },
              { n: '2', title: `${firstName} tar affären`, desc: `Fullmakt, förhandling och allt praktiskt hanteras av ${firstName}. Du får regelbundna uppdateringar under hela processen.` },
              { n: '3', title: 'Du signerar, affären är klar', desc: `${firstName}s arvode dras automatiskt vid signering. Nöjdhetspolicy ingår alltid – du är aldrig bunden.` },
            ].map(item => (
              <div key={item.n} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
                  <span className="text-[16px] font-extrabold text-[#0e6efe]">{item.n}</span>
                </div>
                <div>
                  <p className="text-[16px] font-bold text-slate-900 leading-snug">{item.title}</p>
                  <p className="text-[14px] text-slate-500 mt-1 leading-relaxed">{item.desc.replace('{name}', firstName)}</p>
                </div>
              </div>
            ))}
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
                text: `${firstName} jobbar uteslutande för dig – inte för handlaren. Arvodet är fast och beror inte på vilken bil du väljer.`,
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
                  Redo att jobba med {firstName}?
                </h2>
                <ul className="mt-6 space-y-3">
                  {[
                    'Kostnadsfritt samtal – inga förpliktelser',
                    `${firstName} tar hela affären – du signerar`,
                    'Arvode betalas bara om affären blir av',
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
                    onClick={() => onOpenConsultation(f)}
                    className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-white text-[#0e6efe] text-[15px] font-bold transition-all hover:bg-slate-100 active:scale-[0.98] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)]"
                  >
                    Boka samtal
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
                    alt={`${firstName} hjälper kund`}
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
                  <p className="text-[22px] font-bold text-slate-900 leading-none">{f.fee_kr.toLocaleString('sv-SE')} kr</p>
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

      {/* ── Share card ── */}
      <section className="bg-[#faf8f5] px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-bold text-slate-900">Dela profilen</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[220px]">{profileUrl}</p>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className={`h-9 px-4 rounded-xl text-[13px] font-bold transition flex items-center gap-1.5 ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-[#0e6efe]/8 text-[#0e6efe] hover:bg-[#0e6efe]/15'}`}
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Kopierad!</> : <><Share2 className="w-3.5 h-3.5" /> Kopiera länk</>}
            </button>
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
            <span className="text-[15px] font-bold tracking-[-0.01em] truncate">Prata med {firstName}</span>
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
