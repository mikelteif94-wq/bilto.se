import { useState, useEffect, useRef } from 'react';
import {
  User, Menu, Search, XCircle, Car, Sparkles, Handshake,
  Mail, ChevronRight, Shield, Clock, TrendingUp, Star, ArrowRight, CheckCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
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
  { value: '48h', label: 'Snitt säljtid' },
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
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  const [carQuery, setCarQuery] = useState('');
  const [carSuggestions, setCarSuggestions] = useState<{ make: string; model: string }[]>([]);
  const [allCars, setAllCars] = useState<{ make: string; model: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [carSearchLoading, setCarSearchLoading] = useState(false);
  const carSearchRef = useRef<HTMLDivElement>(null);
  const carSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (carSearchRef.current && !carSearchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    supabase.from('car_catalog').select('make, model').order('make').limit(200).then(({ data }) => {
      setAllCars(data || []);
    });
  }, []);

  const handleCarQueryChange = (q: string) => {
    setCarQuery(q);
    if (carSearchTimer.current) clearTimeout(carSearchTimer.current);
    if (!q.trim()) {
      setCarSuggestions(allCars);
      setShowSuggestions(allCars.length > 0);
      return;
    }
    setCarSearchLoading(true);
    carSearchTimer.current = setTimeout(async () => {
      const lower = q.trim().toLowerCase();
      const filtered = allCars.filter(
        (c) => c.make.toLowerCase().includes(lower) || c.model.toLowerCase().includes(lower)
      );
      setCarSuggestions(filtered.length > 0 ? filtered : []);
      setShowSuggestions(true);
      setCarSearchLoading(false);
    }, 150);
  };

  const handleCarSelect = (make: string, model: string) => {
    const bil = `${make} ${model}`.trim();
    setCarQuery(bil);
    setShowSuggestions(false);
    // Model chip → price-help flow pre-filled
    const params = new URLSearchParams({ bil, typ: 'found' });
    window.history.pushState({}, '', `/kop-bil/bestall?${params}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleCarSearch = () => {
    const q = carQuery.trim();
    if (!q) return;
    setShowSuggestions(false);
    const params = new URLSearchParams({ bil: q, typ: 'searching' });
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
    if (!regTrim) { setError('Ange ett registreringsnummer'); return; }
    if (!/^[A-Z]{3}[0-9]{2}[A-Z0-9]$/.test(regTrim)) {
      setError('Registreringsnummer måste vara 3 bokstäver följt av 3 tecken (t.ex. ABC123)');
      return;
    }
    setError('');
    setSubmitting(true);
    const emailTrim = email.trim();
    await supabase.from('leads').insert({ regnummer: regTrim, telefon: '', email: emailTrim });
    try {
      const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-lead`;
      await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefon: '', regnummer: regTrim, email: emailTrim, source: 'Startsidan' }),
      });
    } catch { /* best effort */ }
    setSubmitting(false);
    onNavigate(regTrim, '');
  };

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white antialiased">
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        active="Sälj bil"
        onSelect={handleMenuSelect}
      />

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
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              fetchPriority="high"
              decoding="async"
              className="hidden lg:block h-24 w-auto object-contain"
              style={{ filter: scrolled ? 'none' : 'brightness(0) invert(1)' }}
            />
          </a>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/kop-bil');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}
            >
              Bilköpshjälpen
            </button>
            <button
              type="button"
              onClick={() => {
                setHeroTab('salj');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-[15px] font-semibold transition ${scrolled ? 'text-slate-900' : 'text-white'}`}
            >
              Säljhjälpen
            </button>
            <a
              href="/sa-funkar-det"
              className={`text-[15px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}
            >
              Så funkar det
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="/logga-in"
              className={`hidden lg:inline-flex items-center gap-2 text-[14px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}
            >
              <User className="w-4 h-4" strokeWidth={2} />
              Logga in
            </a>
            <a
              href="/gratis-konsultation"
              className={`inline-flex items-center px-5 py-2.5 rounded-xl text-[12px] lg:text-[13px] font-semibold transition whitespace-nowrap ${
                scrolled
                  ? 'bg-slate-900 text-white hover:bg-slate-700'
                  : 'bg-white text-slate-900 hover:bg-white/90'
              }`}
            >
              Kostnadsfri konsultation
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
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/20 via-transparent to-[#0a0f1a]" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-5 pt-24 pb-0" style={{ minHeight: '100svh' }}>
          {/* Main headline */}
          <h1 className="font-black leading-[1.0] tracking-[-0.03em] text-white mb-6"
            style={{ fontSize: 'clamp(2.2rem, 6vw, 5rem)' }}>
            En bilexpert på din sida – när du säljer, köper eller byter.
          </h1>

          <p className="text-white/65 text-[16px] sm:text-[19px] font-normal max-w-lg leading-relaxed mb-12">
            Vi värderar, förhandlar och granskar åt dig. Du bestämmer.
          </p>

          {/* Action card */}
          <div className="w-full max-w-xl">
            <div className="bg-white rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
              {/* Tabs */}
              <div className="flex border-b border-slate-100 px-2 pt-1">
                {(['salj', 'hitta'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setHeroTab(t)}
                    className={`px-5 sm:px-6 py-3.5 text-[14px] sm:text-[15px] font-semibold relative transition-colors duration-150 ${
                      heroTab === t ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t === 'hitta' ? 'Köp bil' : 'Sälj bil'}
                    {heroTab === t && (
                      <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-slate-900 rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-5">
                {heroTab === 'hitta' ? (
                  <div ref={carSearchRef} className="relative">
                    <div className="flex items-center h-13 rounded-xl border border-slate-200 bg-[#faf8f5] overflow-hidden focus-within:border-slate-400 focus-within:bg-white transition-all">
                      <span className="flex items-center justify-center w-12 shrink-0">
                        <Search className="w-4.5 h-4.5 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        value={carQuery}
                        onChange={(e) => handleCarQueryChange(e.target.value)}
                        onFocus={() => {
                          if (!carQuery.trim()) {
                            setCarSuggestions(allCars);
                            setShowSuggestions(allCars.length > 0);
                          } else {
                            setShowSuggestions(true);
                          }
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCarSearch(); }}
                        placeholder="Sök märke, modell..."
                        className="flex-1 min-w-0 w-0 h-full text-[15px] text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleCarSearch}
                        className="m-1.5 h-10 px-5 flex items-center gap-2 bg-slate-900 hover:bg-slate-700 active:scale-95 transition rounded-lg text-white text-[14px] font-semibold shrink-0"
                      >
                        {carSearchLoading
                          ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          : <>Sök <ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>
                        }
                      </button>
                    </div>

                        {showSuggestions && !carSearchLoading && (
                          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-72 overflow-y-auto">
                            {carSuggestions.length === 0 ? (
                              <div className="flex items-center gap-3 px-4 py-4 text-[14px] text-slate-400">
                                <Search className="w-4 h-4 shrink-0" />
                                <span>Inga träffar för <span className="font-semibold text-slate-600">"{carQuery}"</span></span>
                              </div>
                            ) : (
                              <>
                                <div className="px-4 pt-2.5 pb-1">
                                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                    {carQuery.trim() ? `${carSuggestions.length} träffar` : 'Alla bilar i katalogen'}
                                  </p>
                                </div>
                                {carSuggestions.map((s, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleCarSelect(s.make, s.model)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#faf8f5] transition group border-t border-slate-100 first:border-0"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                      <Car className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-semibold text-slate-800 text-[14px]">{s.make} </span>
                                      <span className="text-slate-500 text-[14px]">{s.model}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition" />
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                        )}

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {[
                        { make: 'Tesla', model: 'Model Y' },
                        { make: 'Volvo', model: 'XC60' },
                        { make: 'BMW', model: '3-serie' },
                        { make: 'Kia', model: 'EV6' },
                      ].map(({ make, model }) => (
                        <button
                          key={`${make} ${model}`}
                          type="button"
                          onClick={() => {
                            setCarQuery(`${make} ${model}`);
                            setShowSuggestions(false);
                            const params = new URLSearchParams({ bil: `${make} ${model}`, typ: 'found' });
                            window.history.pushState({}, '', `/kop-bil/bestall?${params}`);
                            window.dispatchEvent(new PopStateEvent('popstate'));
                          }}
                          className="text-[12px] text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-400 rounded-xl px-3 py-1 transition font-medium"
                        >
                          {make} {model}
                        </button>
                      ))}
                    </div>
                    <a
                      href="/gratis-konsultation"
                      className="mt-2.5 text-[12px] text-[#0e6efe] hover:text-[#0a57cc] font-medium transition w-full text-left inline-block"
                    >
                      Vet inte vad du vill ha? Vi hjälper dig →
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <RegInput value={regnummer} onChange={(v) => { setRegnummer(v); setError(''); }} disabled={submitting} />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="h-13 px-6 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white font-semibold text-[15px] transition active:scale-[0.99] whitespace-nowrap"
                      >
                        {submitting
                          ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Skickar…</span>
                          : 'Värdera bilen'
                        }
                      </button>
                    </div>
                    {error && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium px-3.5 py-2.5">
                        <XCircle className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                        <span>{error}</span>
                      </div>
                    )}
                    <p className="mt-2 text-slate-400 text-[12px]">Gratis och utan bindning · Svar inom 24h</p>
                  </form>
                )}
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
              <span className="text-white text-[36px] sm:text-[44px] font-black tracking-tight leading-none tabular-nums">
                {s.value}
              </span>
              <span className="text-white/40 text-[13px] mt-2 font-medium tracking-wide">{s.label}</span>
            </div>
          ))}
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
              Sälj din bil på tre steg.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Värdera din bil gratis',
                text: 'Fyll i regnummer, miltal och skick. Tar under fem minuter.',
                icon: Car,
              },
              {
                step: '02',
                title: 'Handlare tävlar om din bil',
                text: 'Utvalda bilhandlare lämnar sina bästa bud i en sluten auktion under 48 timmar.',
                icon: TrendingUp,
              },
              {
                step: '03',
                title: 'Du väljer – utan press',
                text: 'Vi presenterar det högsta budet. Du bestämmer – utan press.',
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
            <button
              onClick={() => {
                setHeroTab('salj');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2.5 h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition group"
            >
              Värdera bilen
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      {/* ── SERVICE ── */}
      <section
        id="service-section"
        data-animate
        className={`bg-[#0a0f1a] py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 delay-100 will-change-[opacity,transform] ${isVisible('service-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-[12px] font-semibold text-white/35 uppercase tracking-[0.2em] mb-4">Personlig service</p>
            <h2 className="text-[36px] sm:text-[48px] font-black text-white tracking-[-0.02em] leading-[1.05] mb-5">
              Vi mäklar.<br />Oavsett hur du vill sälja.
            </h2>
            <p className="text-white/45 text-[17px] leading-relaxed">
              En personlig bilmäklare sköter affären – du får rätt pris utan krångel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Car,
                title: 'Du berättar om bilen',
                text: 'Regnummer och miltal räcker. Din personliga mäklare hör av sig och går igenom dina alternativ.',
              },
              {
                icon: Sparkles,
                title: 'Vi föreslår bästa vägen',
                text: 'Direktbud eller förmedling – vi rekommenderar det som ger dig mest i plånboken.',
              },
              {
                icon: Shield,
                title: 'Vi sköter affären',
                text: 'Vi tar samtalen, förhandlar och ser till att affären går tryggt i mål.',
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-xl border border-white/8 bg-white/4 p-8 hover:bg-white/8 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[18px] font-bold mb-3 text-white">{c.title}</h3>
                  <p className="text-white/45 text-[15px] leading-relaxed">{c.text}</p>
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
              className="inline-flex items-center gap-2.5 h-12 px-8 rounded-xl bg-white text-slate-900 hover:bg-white/90 font-semibold text-[15px] transition group"
            >
              Prata med en mäklare
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
            <p className="text-white/35 text-[14px] flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
              Personlig rådgivning – gratis och utan bindning
            </p>
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
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Varför Bilto</p>
            <h2 className="text-[36px] sm:text-[48px] font-black text-slate-900 tracking-[-0.02em] leading-[1.05]">
              Snabbt. Tryggt. Lönsamt.
            </h2>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {[
              {
                label: '01',
                title: 'Klart på under 5 minuter',
                text: 'Vi frågar bara om det som påverkar bilens värde, så att du får ett riktigt bud på några minuter.',
                perks: ['Tar under 5 minuter', 'Inga onödiga frågor', 'Svar inom 24h'],
              },
              {
                label: '02',
                title: 'Full insyn – inga dolda avgifter',
                text: 'Se hur miltal, färg och utrustning påverkar värdet. Din mäklare förklarar hela värderingen.',
                perks: ['Tydlig prisuppdelning', 'Inga dolda avgifter', 'Du ser alla bud'],
              },
              {
                label: '03',
                title: 'Pengarna på kontot direkt',
                text: 'Du får betalt direkt av en certifierad bilhandlare – utan risk och krångel.',
                perks: ['Certifierade handlare', 'Säker transaktion', 'Inga mellanhänder'],
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

      {/* ── CTA ── */}
      <section
        id="cta-section"
        data-animate
        className={`bg-white py-24 sm:py-32 px-6 transition-[opacity,transform] duration-700 will-change-[opacity,transform] ${isVisible('cta-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-6">Redo att sälja?</p>
          <h3 className="text-[40px] sm:text-[56px] font-black text-slate-900 tracking-[-0.025em] leading-[1.0] mb-6">
            Få ett skarpt bud<br />på din bil.
          </h3>
          <p className="text-[17px] text-slate-500 leading-relaxed mb-10 max-w-md mx-auto">
            Ange regnummer – vi tar hand om resten. Gratis och utan bindning.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button
              onClick={() => {
                setHeroTab('salj');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2.5 h-13 px-8 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[16px] transition group"
            >
              Värdera bilen
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/kop-bil');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-flex items-center gap-2.5 h-13 px-8 rounded-xl border border-slate-200 hover:border-slate-400 text-slate-700 font-semibold text-[16px] transition"
            >
              Köp bil med hjälp
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {[
              { icon: Clock, text: 'Svar inom 24h' },
              { icon: Shield, text: 'Tryggt och säkert' },
              { icon: TrendingUp, text: 'Bästa marknadspris' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-[14px] text-slate-400">
                <Icon className="w-4 h-4" strokeWidth={2} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {showSeo && <SeoCarsSection />}

      <SiteFooter />
    </div>
  );
}
