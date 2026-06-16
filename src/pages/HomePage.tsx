import { useState, useEffect, useRef } from 'react';
import { User, Menu, Search, Phone, Circle as XCircle, Car, Sparkles, Handshake, Mail, Shield, Clock, TrendingUp, Star, ArrowRight, CircleCheck as CheckCircle } from 'lucide-react';
import { validateSwedishPhone } from '../lib/utils';
import { supabase } from '../lib/supabase';
import MobileMenu, { type MobileMenuItem } from '../components/MobileMenu';
import { SiteFooter } from '../components/SiteFooter';
import SeoCarsSection from '../components/SeoCarsSection';
import RegInput from '../components/RegInput';

interface HomePageProps {
  onNavigate: (regnummer: string, telefon: string) => void;
  showSeo?: boolean;
  pageTitle?: string;
}

const HERO_IMAGE = '/d158d2d6-7209-4239-986d-842219ae491d.jpg';

const STATS = [
  { value: '12 000+', label: 'Bilar sålda' },
  { value: '48h', label: 'Genomsnittlig säljtid' },
  { value: '500+', label: 'Certifierade handlare' },
  { value: '4.9 / 5', label: 'Kundbetyg' },
];

const REVIEWS = [
  {
    name: 'Johan Eriksson',
    role: 'Sålde Volvo V90',
    text: 'Allt var enkelt och snabbt. Jag fick ett bra bud redan från start och pengar på kontot samma dag.',
    img: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
    stars: 5,
  },
  {
    name: 'Sara Lindgren',
    role: 'Sålde BMW 3-serie',
    text: 'Jag rekommenderar verkligen Bilto om du ska sälja din bil, man blir väl omhändertagen hela vägen.',
    img: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
    stars: 5,
  },
  {
    name: 'David Karlsson',
    role: 'Sålde Tesla Model 3',
    text: 'Alla på Bilto var professionella, trevliga och följde upp om jag hade frågor. Fick mer än förväntat.',
    img: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=200',
    stars: 5,
  },
  {
    name: 'Anna Bergström',
    role: 'Sålde Audi A4',
    text: 'Hela teamet jag jobbade med var professionella, snabba och informativa. 10 av 10.',
    img: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200',
    stars: 5,
  },
];

export default function HomePage({ onNavigate, showSeo = false, pageTitle }: HomePageProps) {
  useEffect(() => {
    if (pageTitle) document.title = pageTitle;
  }, [pageTitle]);

  const [heroTab, setHeroTab] = useState<'hitta' | 'salj'>('salj');
  const [regnummer, setRegnummer] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  const [carQuery, setCarQuery] = useState('');
  const [carSuggestions, setCarSuggestions] = useState<{ make: string; model: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [carSearchLoading, setCarSearchLoading] = useState(false);
  const carSearchRef = useRef<HTMLDivElement>(null);
  const carSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Intersection observer for fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (carSearchRef.current && !carSearchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCarQueryChange = (q: string) => {
    setCarQuery(q);
    if (carSearchTimer.current) clearTimeout(carSearchTimer.current);
    if (!q.trim()) { setCarSuggestions([]); setShowSuggestions(false); return; }
    setCarSearchLoading(true);
    carSearchTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('car_catalog')
        .select('make, model')
        .or(`make.ilike.%${q.trim()}%,model.ilike.%${q.trim()}%`)
        .limit(8);
      setCarSuggestions(data || []);
      setShowSuggestions(true);
      setCarSearchLoading(false);
    }, 250);
  };

  const handleCarSelect = (make: string, model: string) => {
    const bil = `${make} ${model}`.trim();
    setCarQuery(bil);
    setShowSuggestions(false);
    const params = new URLSearchParams({ bil });
    window.history.pushState({}, '', `/kop-bil/bestall?${params}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleCarSearch = () => {
    if (!carQuery.trim()) return;
    const params = new URLSearchParams({ bil: carQuery.trim() });
    window.history.pushState({}, '', `/kop-bil/bestall?${params}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleMenuSelect = (item: MobileMenuItem) => {
    if (item === 'Sälj bil') {
      setHeroTab('salj');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Hitta bil': '/kop-bil',
      'Om oss': '/om-oss',
      'Så funkar det': '/sa-funkar-det',
    };
    const route = routes[item];
    if (route) {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const regTrim = regnummer.trim().toUpperCase().replace(/\s/g, '');
    const telTrim = telefon.trim();
    if (!regTrim) { setError('Ange ett registreringsnummer'); return; }
    if (!/^[A-Z]{3}[0-9]{2}[A-Z0-9]$/.test(regTrim)) {
      setError('Registreringsnummer måste vara 3 bokstäver följt av 3 tecken (t.ex. ABC123)');
      return;
    }
    const phoneErr = validateSwedishPhone(telTrim);
    if (phoneErr) { setError(phoneErr); return; }
    setError('');
    setSubmitting(true);
    const emailTrim = email.trim();
    await supabase.from('leads').insert({ regnummer: regTrim, telefon: telTrim, email: emailTrim } as any);
    try {
      const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-lead`;
      await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefon: telTrim, regnummer: regTrim, email: emailTrim, source: 'Startsidan' }),
      });
    } catch { /* best effort */ }
    setSubmitting(false);
    onNavigate(regTrim, telTrim);
  };

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Sälj bil"
        onSelect={handleMenuSelect}
      />

      {/* ── NAV ── */}
      <header
        className={`fixed top-3 inset-x-3 lg:top-4 lg:inset-x-6 z-30 h-16 rounded-full shadow-lg ring-1 transition-all duration-300 ${
          scrolled
            ? 'bg-white ring-slate-200 shadow-xl'
            : 'bg-white/85 backdrop-blur-md ring-white/30 shadow-md'
        }`}
      >
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button
            type="button"
            aria-label="Meny"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center text-slate-900"
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <a href="/" className="shrink-0 lg:mr-10 -ml-1 lg:-ml-3 flex items-center">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              fetchPriority="high"
              decoding="async"
              className="hidden lg:block h-16 lg:h-32 w-auto object-contain"
            />
          </a>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/kop-bil');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0e6efe]/12 border border-[#0e6efe]/25 text-[#0e6efe] text-[14px] font-semibold hover:bg-[#0e6efe]/22 transition"
            >
              Köp bil med hjälp
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setHeroTab('salj');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[15px] font-semibold text-slate-800 hover:text-[#0e6efe] transition"
            >
              Sälj bil
            </a>
            <a
              href="/sa-funkar-det"
              className="text-[15px] font-semibold text-slate-800 hover:text-[#0e6efe] transition"
            >
              Så funkar det
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="/logga-in"
              className="hidden lg:inline-flex items-center gap-2 text-[14px] font-semibold text-slate-700 hover:text-slate-900 transition"
            >
              <User className="w-4 h-4" strokeWidth={2} />
              Logga in
            </a>
            <a
              href="/logga-in"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#0e6efe] text-white text-[13px] font-bold uppercase tracking-[0.07em] shadow hover:bg-[#0a57cc] active:scale-[0.98] transition"
            >
              Mina erbjudanden
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-16" style={{ backgroundColor: '#0b1220' }}>
        <div className="relative w-full overflow-hidden" style={{ minHeight: '100svh' }}>
          <img
            src={HERO_IMAGE}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 72%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/85" />
          {/* subtle grain */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

          <div className="relative z-10 flex flex-col items-center justify-center min-h-[100svh] px-5 py-28 text-center">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/85 text-[12px] font-semibold uppercase tracking-[0.12em] mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Över 12 000 bilar sålda
            </div>

            <h1 className="text-white font-black leading-[1.0] text-[40px] sm:text-[58px] lg:text-[72px] tracking-tight max-w-4xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)] uppercase">
              {heroTab === 'hitta'
                ? <><span className="text-white">Hitta din</span><br /><span className="text-[#4d9fff]">drömvagn.</span></>
                : <><span className="text-white">Sälj bilen</span><br /><span className="text-[#4d9fff]">på 48 timmar.</span></>
              }
            </h1>
            <p className="text-white/75 mt-5 text-[16px] sm:text-[20px] lg:text-[22px] font-normal max-w-xl leading-relaxed">
              {heroTab === 'hitta'
                ? <>Låt våra experter <strong className="text-white font-semibold">hitta exakt rätt bil</strong> för dig — utan stress.</>
                : <>Jämför <strong className="text-white font-semibold">bud från hundratals handlare</strong> och få bästa pris.</>
              }
            </p>

            {/* Search card */}
            <div className="mt-10 w-full max-w-[480px]">
              <div className="bg-[#111827]/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] border border-white/8">
                <div className="flex border-b border-white/8">
                  {(['salj', 'hitta'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setHeroTab(t)}
                      className={`flex-1 py-3.5 text-[13px] font-bold tracking-[0.06em] uppercase relative transition-colors duration-200 ${
                        heroTab === t ? 'text-white' : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {t === 'hitta' ? 'Hitta bil' : 'Sälj bil'}
                      {heroTab === t && (
                        <span className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#0e6efe] rounded-t-full" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {heroTab === 'hitta' ? (
                    <div ref={carSearchRef} className="relative">
                      <div className="flex items-center h-12 rounded-xl bg-white overflow-hidden shadow-sm ring-2 ring-transparent focus-within:ring-[#0e6efe]/50 transition-all">
                        <span className="flex items-center justify-center w-12 shrink-0">
                          <Search className="w-4 h-4 text-slate-400" />
                        </span>
                        <input
                          type="text"
                          value={carQuery}
                          onChange={(e) => handleCarQueryChange(e.target.value)}
                          onFocus={() => carQuery.trim() && setShowSuggestions(true)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleCarSearch(); }}
                          placeholder="Sök märke eller modell..."
                          className="flex-1 min-w-0 w-0 h-full pr-2 text-[15px] text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={handleCarSearch}
                          className="h-9 mx-1 px-4 flex items-center bg-[#0e6efe] hover:bg-[#0a57cc] active:scale-95 transition rounded-lg text-white font-semibold text-[13px]"
                        >
                          {carSearchLoading
                            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : 'Sök'
                          }
                        </button>
                      </div>
                      {showSuggestions && carSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                          {carSuggestions.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleCarSelect(s.make, s.model)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition text-[14px] text-slate-800 border-b border-slate-100 last:border-0"
                            >
                              <Car className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="font-semibold">{s.make}</span>
                              <span className="text-slate-500">{s.model}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="mt-3">
                        <p className="text-white/40 text-[11px] mb-2 uppercase tracking-wider">Populärt just nu</p>
                        <div className="flex flex-wrap gap-1.5">
                          {['Tesla Model 3', 'Volvo XC60', 'BMW 3-serie', 'Audi A4'].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                const [make, ...rest] = s.split(' ');
                                handleCarSelect(make, rest.join(' '));
                              }}
                              className="text-[12px] text-white/65 hover:text-white bg-white/8 hover:bg-white/16 border border-white/12 rounded-full px-3 py-1 transition"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2.5">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/35 text-[12px]">eller</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          window.history.pushState({}, '', '/kop-bil/bestall');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                        className="mt-3 w-full h-11 rounded-xl border border-white/20 text-white/80 text-[14px] font-semibold hover:bg-white/8 transition flex items-center justify-center gap-2"
                      >
                        Beskriv vad du söker
                        <ArrowRight className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="flex flex-col gap-2.5">
                        <RegInput value={regnummer} onChange={(v) => { setRegnummer(v); setError(''); }} disabled={submitting} />
                        <div className="flex items-center h-12 rounded-xl border border-white/15 bg-white/8 overflow-hidden focus-within:border-[#0e6efe]/60 focus-within:bg-white/12 transition">
                          <span className="flex items-center justify-center w-11 shrink-0">
                            <Phone className="w-4 h-4 text-white/50" />
                          </span>
                          <input
                            type="tel"
                            value={telefon}
                            onChange={(e) => { setTelefon(e.target.value); setError(''); }}
                            placeholder="Telefonnummer"
                            autoComplete="tel"
                            disabled={submitting}
                            className="flex-1 min-w-0 w-0 h-full pr-4 text-[15px] text-white bg-transparent focus:outline-none placeholder:text-white/35"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="h-12 w-full rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-600 text-white font-bold text-[15px] transition shadow-[0_6px_24px_rgba(14,110,254,0.45)] hover:shadow-[0_8px_32px_rgba(14,110,254,0.55)] active:scale-[0.99]"
                        >
                          {submitting
                            ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Skickar…</span>
                            : 'Värdera bilen gratis'
                          }
                        </button>
                      </div>
                      {error && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/20 border border-red-400/30 text-white text-[13px] font-medium px-3.5 py-2.5">
                          <XCircle className="w-4 h-4 text-red-300 shrink-0" strokeWidth={2.5} />
                          <span>{error}</span>
                        </div>
                      )}
                      <p className="mt-3 text-center text-white/35 text-[11px]">
                        Gratis och utan bindning &middot; Svar inom 24h
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Scroll hint */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-35">
              <div className="w-[1px] h-10 bg-gradient-to-b from-transparent to-white" />
              <div className="w-1 h-1 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-[#0e6efe]">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center">
              <span className="text-white text-[28px] sm:text-[32px] font-black tracking-tight leading-none">
                {s.value}
              </span>
              <span className="text-white/70 text-[13px] mt-1.5 font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SÅ FUNKAR DET ── */}
      <section
        id="how-it-works"
        data-animate
        className={`bg-white py-20 sm:py-28 px-6 transition-all duration-700 ${isVisible('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">
              Processen
            </span>
            <h2 className="text-[32px] sm:text-[40px] font-bold text-slate-900 tracking-tight">
              Sälj din bil på tre steg
            </h2>
          </div>
          <div className="relative flex flex-col md:flex-row md:items-start gap-12 md:gap-6">
            {/* connecting line */}
            <div className="hidden md:block absolute top-6 left-[calc(16.67%)] right-[calc(16.67%)] h-px bg-slate-200" />
            {[
              {
                step: 1,
                title: 'Registrera din bil',
                text: 'Fyll i regnummer, miltal, skick och några bilder. Tar under fem minuter.',
                icon: Car,
              },
              {
                step: 2,
                title: 'Handlare lägger bud',
                text: 'Utvalda bilhandlare lämnar sina bästa bud i en sluten auktion under 48 timmar.',
                icon: TrendingUp,
              },
              {
                step: 3,
                title: 'Du väljer själv',
                text: 'Vi presenterar det högsta budet. Du bestämmer om du accepterar — utan press.',
                icon: Handshake,
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.step} className="flex flex-col items-center text-center flex-1 relative">
                  <div className="w-12 h-12 rounded-full bg-[#0e6efe] flex items-center justify-center mb-5 shadow-[0_4px_16px_rgba(14,110,254,0.35)] relative z-10">
                    <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-bold text-[#0e6efe] uppercase tracking-widest mb-2">
                    Steg {c.step}
                  </span>
                  <h3 className="text-[19px] font-bold text-slate-900 mb-3">{c.title}</h3>
                  <p className="text-slate-500 text-[15px] leading-relaxed max-w-xs">{c.text}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => {
                setHeroTab('salj');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[15px] transition group"
            >
              Värdera min bil
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      {/* ── PERSONLIG SERVICE ── */}
      <section
        id="service-section"
        data-animate
        className={`bg-slate-50 py-20 sm:py-28 px-6 transition-all duration-700 delay-100 ${isVisible('service-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-16">
            <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">
              Personlig service
            </span>
            <h2 className="text-[32px] sm:text-[42px] font-bold leading-[1.1] text-slate-900 tracking-tight">
              Vi mäklar — oavsett hur du vill sälja.
            </h2>
            <p className="text-slate-500 mt-4 text-[17px] leading-[1.65]">
              En personlig bilmäklare sköter affären — du får rätt pris utan krångel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Car,
                title: 'Du berättar om bilen',
                text: 'Regnummer och miltal räcker. Din personliga mäklare hör av sig och går igenom dina alternativ.',
              },
              {
                icon: Sparkles,
                title: 'Vi föreslår bästa vägen',
                text: 'Direktbud eller förmedling — vi rekommenderar det som ger dig mest i plånboken.',
              },
              {
                icon: Shield,
                title: 'Vi sköter affären',
                text: 'Vi tar samtalen, förhandlar och ser till att affären går tryggt i mål.',
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="bg-white rounded-2xl p-7 shadow-sm ring-1 ring-slate-100 hover:shadow-md hover:ring-slate-200 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-[#0e6efe]/8 flex items-center justify-center mb-5 group-hover:bg-[#0e6efe]/15 transition-colors">
                    <Icon className="w-6 h-6 text-[#0e6efe]" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[18px] font-bold mb-2.5 text-slate-900">{c.title}</h3>
                  <p className="text-slate-500 text-[15px] leading-[1.65]">{c.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <button
              onClick={() => {
                window.history.pushState({}, '', '/kop-bil');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold text-[15px] transition group shadow-[0_4px_20px_rgba(14,110,254,0.3)]"
            >
              Prata med en mäklare
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
            <p className="text-slate-400 text-[14px] flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
              Personlig rådgivning — gratis och utan bindning
            </p>
          </div>
        </div>
      </section>

      {/* ── FÖRDELAR ── */}
      <section
        id="benefits-section"
        data-animate
        className={`bg-white py-20 sm:py-28 px-6 transition-all duration-700 ${isVisible('benefits-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">
              Varför Bilto
            </span>
            <h2 className="text-[32px] sm:text-[40px] font-bold text-slate-900 tracking-tight">
              Fördelar med Bilto
            </h2>
          </div>
          <div className="flex flex-col gap-16 sm:gap-20">
            {[
              {
                title: 'Snabbt och enkelt',
                text: 'Vi frågar bara om det som påverkar bilens värde, så att du får ett riktigt bud på några minuter.',
                img: '/benefit3.d9e1ec2e_(1).svg',
                reverse: false,
                perks: ['Tar under 5 minuter', 'Inga onödiga frågor', 'Svar inom 24h'],
              },
              {
                title: 'Full transparens',
                text: 'Se hur miltal, färg och utrustning påverkar värdet. Din mäklare förklarar hela värderingen.',
                img: '/benefit1.f6fa1ca3.svg',
                reverse: true,
                perks: ['Tydlig prisuppdelning', 'Ingen dold avgift', 'Du ser alla bud'],
              },
              {
                title: 'Tryggt betalt',
                text: 'Du får betalt direkt av en certifierad bilhandlare — utan risk och krångel.',
                img: '/benefit2.e5b8ac47.svg',
                reverse: false,
                perks: ['Certifierade handlare', 'Säker transaktion', 'Inga mellanhänder'],
              },
            ].map((b) => (
              <div
                key={b.title}
                className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${b.reverse ? 'md:[&>*:first-child]:order-2' : ''}`}
              >
                <div>
                  <h3 className="text-[26px] sm:text-[32px] font-bold text-slate-900 mb-4 tracking-tight">
                    {b.title}
                  </h3>
                  <p className="text-[17px] text-slate-500 leading-relaxed mb-6">
                    {b.text}
                  </p>
                  <ul className="flex flex-col gap-2.5">
                    {b.perks.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-[15px] text-slate-700 font-medium">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-center">
                  <img
                    src={b.img}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full max-w-[280px] h-[200px] object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section
        id="reviews-section"
        data-animate
        className={`bg-slate-50 py-20 sm:py-28 px-6 transition-all duration-700 ${isVisible('reviews-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">
              Kundrecensioner
            </span>
            <h2 className="text-[32px] sm:text-[40px] font-bold text-slate-900 tracking-tight mb-3">
              Vad våra kunder säger
            </h2>
            <div className="flex items-center justify-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" strokeWidth={1} />
              ))}
              <span className="ml-2 text-[15px] font-semibold text-slate-700">4.9 av 5</span>
              <span className="text-slate-400 text-[14px] ml-1">(2 400+ recensioner)</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {REVIEWS.map((r) => (
              <div
                key={r.name}
                className="bg-white rounded-2xl p-6 sm:p-7 flex gap-5 shadow-sm ring-1 ring-slate-100 hover:shadow-md hover:ring-slate-200 transition-all duration-300"
              >
                <img
                  src={r.img}
                  alt={r.name}
                  loading="lazy"
                  decoding="async"
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100"
                />
                <div className="flex flex-col">
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(r.stars)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" strokeWidth={1} />
                    ))}
                  </div>
                  <p className="text-slate-700 text-[15px] leading-relaxed mb-3 flex-1">
                    &ldquo;{r.text}&rdquo;
                  </p>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{r.name}</p>
                    <p className="text-[12px] text-slate-400">{r.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        id="cta-section"
        data-animate
        className={`bg-white py-20 sm:py-28 px-6 transition-all duration-700 ${isVisible('cta-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-[11px] font-bold text-[#0e6efe] uppercase tracking-[0.18em] mb-3">
                Redo att sälja?
              </span>
              <h3 className="text-[30px] sm:text-[38px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-4">
                Få ett skarpt bud på din bil
              </h3>
              <p className="text-[17px] text-slate-500 leading-relaxed mb-6">
                Ange regnummer och telefon — vi tar hand om resten. Gratis och utan bindning.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { icon: Clock, text: 'Svar inom 24h' },
                  { icon: Shield, text: 'Tryggt och säkert' },
                  { icon: TrendingUp, text: 'Bästa marknadspriset' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-[14px] font-medium text-slate-600">
                    <Icon className="w-4 h-4 text-[#0e6efe]" strokeWidth={2} />
                    {text}
                  </div>
                ))}
              </div>
              <img
                src="https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Bilförsäljning"
                loading="lazy"
                decoding="async"
                className="w-full max-w-sm rounded-2xl object-cover h-52 shadow-md"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.2)] ring-1 ring-slate-100 p-6 sm:p-8">
              <h4 className="text-[20px] font-bold text-slate-900 mb-5">Värdera din bil</h4>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <RegInput value={regnummer} onChange={(v) => { setRegnummer(v); setError(''); }} disabled={submitting} />
                <label className="relative flex items-center h-12 rounded-xl border border-slate-200 bg-white focus-within:border-[#0e6efe] focus-within:ring-2 focus-within:ring-[#0e6efe]/20 transition">
                  <span className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                    <Phone className="w-4 h-4 text-slate-400" strokeWidth={2} />
                  </span>
                  <input
                    type="tel"
                    value={telefon}
                    onChange={(e) => { setTelefon(e.target.value); setError(''); }}
                    placeholder="Telefonnummer"
                    autoComplete="tel"
                    disabled={submitting}
                    className="flex-1 min-w-0 w-0 h-full pl-12 pr-4 bg-transparent text-[15px] text-slate-900 focus:outline-none placeholder:text-slate-400"
                  />
                </label>
                <label className="relative flex items-center h-12 rounded-xl border border-slate-200 bg-white focus-within:border-[#0e6efe] focus-within:ring-2 focus-within:ring-[#0e6efe]/20 transition">
                  <span className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" strokeWidth={2} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="E-postadress (valfritt)"
                    autoComplete="email"
                    disabled={submitting}
                    className="flex-1 min-w-0 w-0 h-full pl-12 pr-4 bg-transparent text-[15px] text-slate-900 focus:outline-none placeholder:text-slate-400"
                  />
                </label>
                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium px-3 py-2.5">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-[1px]" strokeWidth={2.5} />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 h-12 w-full rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-400 text-white font-bold text-[15px] transition shadow-[0_4px_20px_rgba(14,110,254,0.35)] hover:shadow-[0_6px_28px_rgba(14,110,254,0.45)] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Skickar…</>
                    : 'Värdera min bil'
                  }
                </button>
                <p className="text-center text-slate-400 text-[12px] mt-1">
                  Gratis &middot; Inga dolda avgifter &middot; Ingen bindning
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {showSeo && <SeoCarsSection />}

      <SiteFooter />
    </div>
  );
}
