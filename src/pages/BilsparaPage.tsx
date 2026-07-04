import { useEffect, useState, useMemo } from 'react';
import {
  Menu, ArrowRight, Heart, Clock, Car as CarIcon,
  Filter, X, Bell, CheckCircle2, Eye, Zap, Search,
} from 'lucide-react';
import MobileMenu, { MobileMenuItem } from '../components/MobileMenu';
import BilsparaFilterPanel, {
  Filters, Mode, SortKey, DEFAULT_FILTERS, isDefaultFilters, QUICK_PICKS,
} from '../components/BilsparaFilterPanel';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta } from '../lib/pageMeta';
import { supabase } from '../lib/supabase';

interface BilsparaPageProps {
  onBackHome: () => void;
}

interface CampaignCar {
  id: string;
  dealer_id: string;
  dealer_name: string;
  dealer_stad: string | null;
  regnr: string | null;
  make: string;
  model: string;
  year: number | null;
  image_url: string | null;
  regular_price: number;
  campaign_price: number;
  campaign_type: string | null;
  valid_until: string;
  sale_type: string;
  drivmedel: string | null;
  kaross: string | null;
  giftcard_amount: number | null;
  created_at: string;
}

const CAMPAIGN_TYPE_STYLES: Record<string, string> = {
  Nybilskampanj:  'bg-[#003399] text-white',
  Förhandlingsklar: 'bg-[#FFD500] text-[#0E1B33]',
  Offert:         'bg-white/90 text-[#0E1B33]',
  Lagerrensning:  'bg-[#00A85A] text-white',
  Demobil:        'bg-[#0E1B33] text-[#FFD500]',
  Kampanj:        'bg-[#003399] text-white',
};

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Störst besparing (kr)',  value: 'savings' },
  { label: 'Störst rabatt (%)',      value: 'pct' },
  { label: 'Lägst pris',            value: 'price' },
  { label: 'Slutar snart',          value: 'ending' },
];

function daysLeft(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

function fmt(n: number) { return n.toLocaleString('sv-SE'); }

function pct(regular: number, campaign: number) {
  return Math.round(((regular - campaign) / regular) * 100);
}

function savings(c: CampaignCar) { return c.regular_price - c.campaign_price; }

function SavingsTag({ amount }: { amount: number }) {
  return (
    <div className="absolute top-2 right-2 z-10" style={{ transform: 'rotate(4deg)' }}>
      <div
        className="px-2.5 py-1.5 rounded-md text-center"
        style={{
          background: '#FFD500',
          color: '#0E1B33',
          border: '1.5px solid #0E1B33',
          boxShadow: '2px 3px 0 rgba(14,27,51,0.35)',
          fontFamily: '"Anton", "Impact", sans-serif',
        }}
      >
        <span className="block text-[9px] font-bold">SPARA</span>
        <span className="block text-[14px] font-bold">{fmt(amount)} KR</span>
      </div>
    </div>
  );
}

function CarCard({ car, favourite, onToggleFav }: { car: CampaignCar; favourite: boolean; onToggleFav: () => void }) {
  const s = savings(car);
  const savingsPct = pct(car.regular_price, car.campaign_price);
  const days = daysLeft(car.valid_until);
  const urgent = days <= 7;
  const typeStyle = CAMPAIGN_TYPE_STYLES[car.campaign_type ?? ''] ?? 'bg-white/90 text-[#0E1B33]';

  function openConsultation() {
    const label = `${car.make} ${car.model}${car.year ? ' ' + car.year : ''}`;
    window.history.pushState({}, '', '/gratis-konsultation');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { carLabel: label, dealerName: car.dealer_name } }));
  }

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300"
      style={{ border: '1px solid #E8ECF3', boxShadow: '0 1px 2px rgb(14 27 51 / .04), 0 10px 30px -12px rgb(14 27 51 / .10)' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgb(14 27 51 / .06), 0 24px 44px -14px rgb(14 27 51 / .18)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgb(14 27 51 / .04), 0 10px 30px -12px rgb(14 27 51 / .10)';
      }}
    >
      <div className="relative aspect-[16/9] bg-[#F7F8FB] overflow-hidden">
        {car.image_url ? (
          <img
            src={car.image_url}
            alt={`${car.make} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CarIcon className="w-10 h-10 text-slate-300" />
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          <span
            className="inline-flex items-center font-bold text-white text-[12px] px-2.5 py-1 rounded-md"
            style={{ background: '#E4002B', fontFamily: '"Anton", "Impact", sans-serif', letterSpacing: '0.02em' }}
          >
            -{savingsPct}%
          </span>
          {car.campaign_type && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${typeStyle}`}>
              {car.campaign_type}
            </span>
          )}
          {urgent && days > 0 && (
            <span className="inline-flex items-center gap-1 bg-[#FFD500] text-[#0E1B33] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              <Clock className="w-3 h-3" />{days} dgr kvar
            </span>
          )}
        </div>

        <SavingsTag amount={s} />

        {/* Bottom actions */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleFav}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow hover:scale-110 transition"
            aria-label={favourite ? 'Ta bort favorit' : 'Spara som favorit'}
          >
            <Heart className={`w-4 h-4 ${favourite ? 'fill-[#E4002B] text-[#E4002B]' : 'text-slate-400'}`} />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow"
          >
            <Eye className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-[#0E1B33]/75 backdrop-blur-[2px] px-3 py-1.5">
          <p className="text-[11px] font-semibold text-white/80 truncate">
            {car.dealer_name}{car.dealer_stad ? ` · ${car.dealer_stad}` : ''}
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-[15px] font-bold leading-tight" style={{ color: '#1A2233', fontFamily: '"Signika", ui-sans-serif' }}>
            {car.make} {car.model}
            {car.year && <span className="text-[#6B7486] font-normal ml-1">{car.year}</span>}
          </p>
          {car.regnr && (
            <span className="shrink-0 flex items-center overflow-hidden rounded text-[10px] font-bold" style={{ fontFamily: '"Anton", "Impact", sans-serif' }}>
              <span className="bg-[#003399] text-white px-1.5 py-0.5">EU</span>
              <span className="bg-[#FFD500] text-[#0E1B33] px-1.5 py-0.5">{car.regnr.toUpperCase()}</span>
            </span>
          )}
        </div>

        {(car.drivmedel || car.kaross) && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {car.drivmedel && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F7F8FB', color: '#6B7486', border: '1px solid #E8ECF3' }}>
                {car.drivmedel}
              </span>
            )}
            {car.kaross && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F7F8FB', color: '#6B7486', border: '1px solid #E8ECF3' }}>
                {car.kaross}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[20px] font-bold" style={{ color: '#0E1B33', fontFamily: '"Anton", "Impact", sans-serif', letterSpacing: '-0.01em' }}>
            {fmt(car.campaign_price)} kr
          </span>
          <span className="text-[13px] line-through" style={{ color: '#6B7486' }}>{fmt(car.regular_price)} kr</span>
        </div>

        <button
          type="button"
          onClick={openConsultation}
          className="mt-4 w-full h-10 rounded-full font-bold text-[13px] transition inline-flex items-center justify-center gap-1.5 group/btn"
          style={{
            background: 'linear-gradient(135deg, #00A85A 0%, #007a42 100%)',
            color: 'white',
            boxShadow: '0 4px 14px -4px rgba(0,168,90,0.45)',
            fontFamily: '"Signika", ui-sans-serif',
          }}
        >
          <Zap className="w-3.5 h-3.5" />
          Få prishjälp
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onSubscribe }: { onSubscribe: (email: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    await onSubscribe(email.trim());
    setDone(true);
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: '#F7F8FB', border: '1px solid #E8ECF3' }}>
        <CarIcon className="w-8 h-8" style={{ color: '#6B7486' }} />
      </div>
      <h3 className="text-[22px] font-bold mb-2" style={{ color: '#0E1B33', fontFamily: '"Anton", "Impact", sans-serif' }}>
        INGA AKTIVA KLIPP JUST NU
      </h3>
      <p className="text-[14px] max-w-sm mb-8" style={{ color: '#6B7486' }}>
        Nya klipp släpps löpande – bevaka sidan så missar du inte nästa prissänkning.
      </p>
      {done ? (
        <div className="inline-flex items-center gap-2 text-[14px] font-semibold px-5 py-3 rounded-full" style={{ background: '#00A85A', color: 'white' }}>
          <CheckCircle2 className="w-5 h-5" />
          Vi meddelar dig när nya klipp dyker upp!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm w-full">
          <input
            type="email"
            placeholder="din@mejl.se"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="flex-1 h-11 px-4 text-[14px] focus:outline-none transition"
            style={{ borderRadius: 999, border: '1.5px solid #E8ECF3', background: 'white', color: '#1A2233' }}
          />
          <button
            type="submit"
            disabled={submitting}
            className="h-11 px-5 font-bold text-[13px] transition inline-flex items-center gap-1.5 shrink-0"
            style={{ borderRadius: 999, background: '#0E1B33', color: '#FFD500', fontFamily: '"Signika", ui-sans-serif' }}
          >
            <Bell className="w-4 h-4" />
            Meddela mig
          </button>
        </form>
      )}
    </div>
  );
}

export default function BilsparaPage({ onBackHome }: BilsparaPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cars, setCars] = useState<CampaignCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [favourites, setFavourites] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('bilspara_favs') ?? '[]')); }
    catch { return new Set(); }
  });
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [mode, setMode] = useState<Mode>('alla');
  const [sort, setSort] = useState<SortKey>('savings');
  const [search, setSearch] = useState('');

  const navItems: MobileMenuItem[] = ['Sälj bil', 'Bilköpshjälpen', 'Guider', 'Priser', 'Vanliga frågor', 'Bilspara'];

  const handleMenuSelect = (item: MobileMenuItem) => {
    setMenuOpen(false);
    const routes: Partial<Record<MobileMenuItem, string>> = {
      'Bilköpshjälpen': '/kop-bil',
      'Guider': '/guider',
      'Priser': '/priser',
      'Vanliga frågor': '/vanliga-fragor',
      'Bilspara': '/bilspara',
    };
    const route = routes[item];
    if (route) {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    onBackHome();
  };

  useEffect(() => {
    setPageMeta({
      title: 'Bilspara – veckans klipp från granskade handlare | Bilto',
      description: 'Hitta prissänkta bilar från granskade handlare. Se exakt vad du sparar – i kronor och procent. Uppdateras löpande.',
      canonical: 'https://bilto.se/bilspara',
    });
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('campaign_cars')
        .select('*')
        .order('created_at', { ascending: false });
      setCars((data as CampaignCar[]) ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem('bilspara_favs', JSON.stringify([...favourites]));
  }, [favourites]);

  function toggleFav(id: string) {
    setFavourites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubscribe(email: string) {
    await supabase.from('bilspara_alerts').insert({ email });
  }

  function handleFiltersChange(partial: Partial<Filters>) {
    setFilters(prev => ({ ...prev, ...partial }));
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
    setMode('alla');
    setSearch('');
  }

  function applyQuickPick(pick: typeof QUICK_PICKS[0]) {
    setFilters({ ...DEFAULT_FILTERS, ...pick.filtersOverride });
    if (pick.modeOverride) setMode(pick.modeOverride);
  }

  const availableMakes = useMemo(() => [...new Set(cars.map(c => c.make))].sort(), [cars]);

  const filtered = useMemo(() => {
    let list = [...cars];

    // Mode
    if (mode !== 'alla') {
      list = list.filter(c => {
        const st = (c.sale_type ?? '').toLowerCase().replace(/å/g, 'a');
        if (mode === 'kop') return st === 'kop' || st === 'kop' || c.sale_type === 'Köp';
        if (mode === 'leasing') return st === 'leasing' || st === 'privatleasing' || c.sale_type === 'Privatleasing';
        return true;
      });
    }

    // Min savings
    if (filters.minSavings > 0) list = list.filter(c => savings(c) >= filters.minSavings);

    // Max price (only when not leasing)
    if (mode !== 'leasing' && filters.maxPrice < 700000) {
      list = list.filter(c => c.campaign_price <= filters.maxPrice);
    }

    // Kampanjtyper
    if (filters.kampanjtyper.length > 0) {
      list = list.filter(c => filters.kampanjtyper.includes(c.campaign_type as any));
    }

    // Märken
    if (filters.marken.length > 0) {
      list = list.filter(c => filters.marken.includes(c.make));
    }

    // Drivmedel
    if (filters.drivmedel.length > 0) {
      list = list.filter(c => c.drivmedel && filters.drivmedel.includes(c.drivmedel as any));
    }

    // Karosser
    if (filters.karosser.length > 0) {
      list = list.filter(c => c.kaross && filters.karosser.includes(c.kaross as any));
    }

    // Bonus only
    if (filters.bonusOnly) {
      list = list.filter(c => (c.giftcard_amount ?? 0) > 0);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        `${c.make} ${c.model} ${c.dealer_name} ${c.dealer_stad ?? ''}`.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sort === 'savings') return savings(b) - savings(a);
      if (sort === 'pct')     return pct(b.regular_price, b.campaign_price) - pct(a.regular_price, a.campaign_price);
      if (sort === 'price')   return a.campaign_price - b.campaign_price;
      if (sort === 'ending')  return daysLeft(a.valid_until) - daysLeft(b.valid_until);
      return 0;
    });

    return list;
  }, [cars, filters, mode, search, sort]);

  const totalSavings = useMemo(() => filtered.reduce((s, c) => s + savings(c), 0), [filtered]);
  const hasActive = !isDefaultFilters(filters, mode) || search.trim().length > 0;

  return (
    <div className="min-h-screen text-[#1A2233]" style={{ background: '#F7F8FB' }}>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onSelect={handleMenuSelect} />

      {/* Standard Bilto floating pill header */}
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-40 h-[53px] lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-4 sm:px-5 lg:px-8">
          <button type="button" aria-label="Meny" onClick={() => setMenuOpen(true)} className="lg:hidden -ml-1 w-11 h-11 flex items-center justify-center text-white">
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
          </button>
          <button onClick={onBackHome} className="shrink-0 lg:mr-10 -ml-2 lg:-ml-3 flex items-center gap-2">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
            <span className="hidden lg:flex items-center gap-1.5">
              <span className="text-white/40 text-[13px] font-medium">/</span>
              <span
                className="text-[13px] font-bold px-2 py-0.5 rounded"
                style={{ fontFamily: '"Anton", "Impact", sans-serif', background: '#FFD500', color: '#0E1B33', letterSpacing: '0.02em' }}
              >
                bilspara
              </span>
            </span>
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map(item => (
              <button key={item} type="button" onClick={() => handleMenuSelect(item)} className="text-[15px] text-white/90 hover:text-white transition">
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden lg:flex items-center gap-1.5 text-[12px] font-semibold text-white/70">
              <span className="w-2 h-2 rounded-full bg-[#00A85A] animate-pulse" />
              {loading ? '...' : filtered.length} aktiva klipp
            </div>
            <a href="/gratis-konsultation" className="inline-flex items-center bg-white text-[#0e6efe] text-[11px] lg:text-[13px] font-semibold px-[14px] lg:px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden pt-28 sm:pt-36 pb-16 sm:pb-20" style={{ background: '#0e6efe' }}>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%)', transform: 'translate(20%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,213,0,0.10) 0%, transparent 65%)', transform: 'translate(-20%, 30%)' }} />

          <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
              <div className="max-w-2xl">
                <span
                  className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white' }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#FFD500] animate-pulse" />
                  Sparveckan pågår
                </span>

                <h1
                  className="leading-[0.92] tracking-tight"
                  style={{ fontFamily: '"Anton", "Impact", sans-serif', fontSize: 'clamp(64px, 10vw, 120px)', color: 'white' }}
                >
                  VECKANS{' '}
                  <span style={{ color: '#FFD500' }}>KLIPP</span>
                </h1>

                <p className="mt-5 text-[16px] sm:text-[18px] leading-[1.65]" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: '"Signika", ui-sans-serif' }}>
                  Alla priser jämförs mot handlarens ordinarie pris — du ser exakt vad du sparar, i kronor.
                </p>

                {/* Hero search */}
                <div
                  className="mt-6 flex items-center gap-3 px-4 h-12 max-w-md"
                  style={{ background: 'white', borderRadius: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
                >
                  <Search className="w-4 h-4 shrink-0" style={{ color: '#6B7486' }} />
                  <input
                    type="text"
                    placeholder="Sök märke, modell eller handlare..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-[14px] focus:outline-none"
                    style={{ color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch('')}>
                      <X className="w-4 h-4" style={{ color: '#6B7486' }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Savings card */}
              <div className="shrink-0 w-full lg:w-64">
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{ background: '#00A85A', boxShadow: '0 8px 40px -8px rgba(0,168,90,0.5)' }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: '"Signika", ui-sans-serif' }}>
                    Totalt på sidan
                  </p>
                  <p
                    className="leading-none"
                    style={{ fontFamily: '"Anton", "Impact", sans-serif', fontSize: 'clamp(36px, 5vw, 52px)', color: 'white', letterSpacing: '-0.01em' }}
                  >
                    {loading ? '–' : fmt(cars.reduce((s, c) => s + savings(c), 0))} kr
                  </p>
                  <p className="text-[12px] mt-2" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: '"Signika", ui-sans-serif' }}>
                    i rabatter just nu
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FILTER + GRID */}
        <section className="py-8 sm:py-12">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8">

            {/* Quick picks */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-6">
              {QUICK_PICKS.map(pick => {
                const Icon = pick.icon;
                return (
                  <button
                    key={pick.label}
                    type="button"
                    onClick={() => applyQuickPick(pick)}
                    className="shrink-0 flex items-center gap-2 px-4 h-9 rounded-full text-[13px] font-bold transition-all hover:shadow-md"
                    style={{
                      background: 'white',
                      border: '1px solid #E8ECF3',
                      color: '#0E1B33',
                      fontFamily: '"Signika", ui-sans-serif',
                      boxShadow: '0 1px 3px rgba(14,27,51,0.06)',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {pick.label}
                  </button>
                );
              })}
              {hasActive && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="shrink-0 flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-bold transition-all"
                  style={{ background: '#FFD500', color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}
                >
                  <X className="w-3.5 h-3.5" />
                  Rensa filter
                </button>
              )}
            </div>

            <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
              {/* Sidebar */}
              <aside>
                {/* Mobile filter toggle */}
                <button
                  type="button"
                  onClick={() => setFilterOpen(o => !o)}
                  className="lg:hidden w-full flex items-center justify-between px-4 h-11 mb-4 text-[14px] font-bold uppercase tracking-wider transition"
                  style={{ background: hasActive ? '#0E1B33' : 'white', border: `1px solid ${hasActive ? '#0E1B33' : '#E8ECF3'}`, borderRadius: 12, color: hasActive ? '#FFD500' : '#E4002B', fontFamily: '"Signika", ui-sans-serif' }}
                >
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Sparfilter
                    {hasActive && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FFD500', color: '#0E1B33' }}>
                        Aktiva
                      </span>
                    )}
                  </span>
                  <span className="text-[12px] font-normal" style={{ color: filterOpen ? '#E4002B' : '#6B7486' }}>
                    {filterOpen ? 'Dölj' : 'Visa'}
                  </span>
                </button>

                <BilsparaFilterPanel
                  filters={filters}
                  mode={mode}
                  onChange={handleFiltersChange}
                  onModeChange={setMode}
                  onReset={handleReset}
                  availableMakes={availableMakes}
                  filteredCount={filtered.length}
                  totalSavings={totalSavings}
                  hasActive={hasActive}
                  open={filterOpen}
                />
              </aside>

              {/* Car grid */}
              <div>
                {/* Sort + count bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <p className="text-[14px] font-semibold" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
                    <strong style={{ color: '#0E1B33' }}>{filtered.length}</strong> bilar
                    {hasActive && <span className="ml-2 text-[12px] text-[#0e6efe]">(filtrerat)</span>}
                  </p>
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort-select" className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#6B7486' }}>Sortera:</label>
                    <select
                      id="sort-select"
                      value={sort}
                      onChange={e => setSort(e.target.value as SortKey)}
                      className="text-[13px] bg-white focus:outline-none transition pl-3 pr-8 h-9"
                      style={{ border: '1px solid #E8ECF3', borderRadius: 10, color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}
                    >
                      {SORT_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse" style={{ border: '1px solid #E8ECF3' }}>
                        <div className="aspect-[16/9]" style={{ background: '#E8ECF3' }} />
                        <div className="p-4 space-y-2">
                          <div className="h-4 rounded w-3/4" style={{ background: '#E8ECF3' }} />
                          <div className="h-3 rounded w-1/2" style={{ background: '#F7F8FB' }} />
                          <div className="h-8 rounded-full mt-4" style={{ background: '#F7F8FB' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <EmptyState onSubscribe={handleSubscribe} />
                ) : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(car => (
                      <CarCard
                        key={car.id}
                        car={car}
                        favourite={favourites.has(car.id)}
                        onToggleFav={() => toggleFav(car.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CTA FOOTER */}
        <section
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0E1B33 0%, #2a1a4a 55%, #E4002B 100%)' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at bottom left, rgba(255,213,0,0.08) 0%, transparent 55%)' }} />
          <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-24">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#FFD500', fontFamily: '"Signika", ui-sans-serif' }}>
              Biltos experter
            </p>
            <h2
              className="leading-[0.95] tracking-tight max-w-2xl mb-5"
              style={{ fontFamily: '"Anton", "Impact", sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', color: 'white' }}
            >
              HITTA ETT KLIPP?<br />VI FÖRHANDLAR ÅT DIG.
            </h2>
            <p className="text-[16px] sm:text-[18px] leading-[1.65] max-w-xl mb-8" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: '"Signika", ui-sans-serif' }}>
              Biltos experter granskar avtalet, förhandlar pris och ränta, och säkerställer att du betalar rätt.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/gratis-konsultation"
                className="inline-flex items-center justify-center gap-2 py-3.5 px-8 font-bold text-[15px] transition group"
                style={{ borderRadius: 999, background: '#FFD500', color: '#0E1B33', boxShadow: '0 4px 24px -4px rgba(255,213,0,0.4)', fontFamily: '"Signika", ui-sans-serif' }}
              >
                Få prishjälp gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </a>
              <button
                type="button"
                onClick={onBackHome}
                className="inline-flex items-center justify-center gap-2 py-3.5 px-8 font-semibold text-[15px] transition"
                style={{ borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.18)', fontFamily: '"Signika", ui-sans-serif' }}
              >
                Värdera din bil
              </button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
