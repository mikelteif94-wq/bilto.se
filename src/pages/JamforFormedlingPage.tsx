import { useState, useEffect, useRef } from 'react';
import {
  Menu, X, ArrowRight, ArrowLeft, Check, CheckCircle2, Star, Shield, ShieldCheck,
  Search, TrendingUp, Clock, ChevronDown, ChevronRight, Car, Camera, Mail,
  Phone, MapPin, FileText, Sparkles, Award, Zap, Users, BarChart3, Loader2,
  Image as ImageIcon, AlertCircle, Handshake, Eye, Calendar, Wallet,
} from 'lucide-react';
import {
  DEMO_VEHICLE, DEMO_OFFERS, DEMO_REVIEWS, FAQ_ITEMS, COMPARISON_OPTIONS,
  TRUST_CARDS, formatSEK, PLATFORM_FEE,
  type FormedlingOffer,
} from '../lib/formedling-data';

type Step = 'landing' | 'vehicle-found' | 'vehicle-info' | 'images' | 'contact' | 'matching' | 'matched' | 'dashboard' | 'offer-detail' | 'accept' | 'success' | 'my-cars';

interface VehicleInfo {
  mileage: string;
  serviceHistory: 'full' | 'partial' | 'missing' | '';
  numKeys: number | '';
  tires: 'summer' | 'winter' | 'both' | '';
  condition: 'excellent' | 'good' | 'normal' | 'needs_work' | '';
  hasDamage: 'yes' | 'no' | '';
  damageDescription: string;
  equipment: string[];
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postalCode: string;
  consent: boolean;
}

const EQUIPMENT_OPTIONS = ['Dragkrok', 'Panoramatak', '360-kamera', 'Värmere', 'Premiumljud', 'Annat'];
const IMAGE_SLOTS = [
  'Framifrån', 'Bakifrån', 'Förarsida', 'Passagerarsida',
  'Interiör fram', 'Interiör bak', 'Instrumentpanel', 'Bagageutrymme',
  'Fälgar', 'Eventuella skador',
];

export default function JamforFormedlingPage() {
  const [step, setStep] = useState<Step>('landing');
  const [regnummer, setRegnummer] = useState('');
  const [regError, setRegError] = useState('');
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [matchingPhase, setMatchingPhase] = useState(0);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    mileage: '6420', serviceHistory: '', numKeys: '', tires: '', condition: '', hasDamage: '', damageDescription: '', equipment: [],
  });
  const [contact, setContact] = useState<ContactInfo>({
    firstName: '', lastName: '', email: '', phone: '', postalCode: '', consent: false,
  });
  const [contactError, setContactError] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [acceptConsent, setAcceptConsent] = useState(false);
  const [sortBy, setSortBy] = useState<'net' | 'commission' | 'time' | 'rating'>('net');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [imageSlots, setImageSlots] = useState<Record<string, string>>({});

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
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
  }, [step]);

  const isVisible = (id: string) => visibleSections.has(id);

  const handleRegSubmit = () => {
    const trimmed = regnummer.trim().toUpperCase().replace(/\s/g, '');
    if (!trimmed) { setRegError('Ange ett registreringsnummer'); return; }
    if (trimmed.length < 5) { setRegError('Ogiltigt registreringsnummer'); return; }
    setRegError('');
    setLoadingVehicle(true);
    setTimeout(() => {
      setLoadingVehicle(false);
      setStep('vehicle-found');
    }, 1000);
  };

  const startMatching = () => {
    setStep('matching');
    setMatchingPhase(0);
    const phases = [
      () => setMatchingPhase(1),
      () => setMatchingPhase(2),
      () => setMatchingPhase(3),
    ];
    phases.forEach((fn, i) => setTimeout(fn, (i + 1) * 900));
    setTimeout(() => setStep('matched'), 4200);
  };

  const handleContactSubmit = () => {
    if (!contact.firstName || !contact.lastName || !contact.email || !contact.phone || !contact.postalCode) {
      setContactError('Fyll i alla fält');
      return;
    }
    if (!contact.consent) {
      setContactError('Du måste godkänna att biluppgifter delas med förmedlare');
      return;
    }
    setContactError('');
    startMatching();
  };

  const sortedOffers = [...DEMO_OFFERS].sort((a, b) => {
    switch (sortBy) {
      case 'net': return b.expectedOwnerNet - a.expectedOwnerNet;
      case 'commission': return a.commission - b.commission;
      case 'time': return parseInt(a.expectedSaleTime) - parseInt(b.expectedSaleTime);
      case 'rating': return b.rating - a.rating;
      default: return 0;
    }
  });

  const selectedOffer = DEMO_OFFERS.find(o => o.id === selectedOfferId);
  const compareOffers = DEMO_OFFERS.filter(o => compareIds.includes(o.id));

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  // ── LANDING ──
  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white">
        <FormedlingNav scrolled={scrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} onLogo={() => setStep('landing')} />

        {/* HERO */}
        <section className="relative pt-24 pb-20 px-5" style={{ minHeight: 'calc(100svh - 0px)' }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(14,110,254,0.08) 0%, transparent 70%)' }} />
          </div>

          <div className="relative max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                  <Sparkles className="w-3.5 h-3.5 text-bilto-400" strokeWidth={2} />
                  <span className="text-[12px] font-medium text-white/70">Ny tjänst — Bilförmedling</span>
                </div>

                <h1 className="font-black leading-[1.0] tracking-[-0.03em] text-white mb-6"
                  style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
                  Sälj bilen<br />smartare.
                </h1>

                <p className="text-white/55 text-[17px] leading-relaxed max-w-md mb-10">
                  Låt verifierade bilförmedlare konkurrera om att sälja din bil. Jämför pris, avgift och försäljningstid — och välj erbjudandet som passar dig.
                </p>

                {/* Reg input */}
                <div className="max-w-md">
                  <label className="block text-[13px] font-semibold text-white/50 mb-2.5">Registreringsnummer</label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-stretch h-14 rounded-xl border border-white/10 bg-white/5 overflow-hidden focus-within:border-bilto-500 focus-within:ring-2 focus-within:ring-bilto-500/20 transition">
                      <span className="flex items-center justify-center w-12 bg-bilto-500 text-white font-bold text-[20px] shrink-0">S</span>
                      <input
                        type="text"
                        value={regnummer}
                        onChange={(e) => { setRegnummer(e.target.value); setRegError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleRegSubmit()}
                        placeholder="ABC 123"
                        maxLength={7}
                        className="flex-1 min-w-0 px-3 bg-transparent text-[18px] font-bold tracking-widest text-white placeholder:text-white/25 placeholder:font-normal placeholder:tracking-normal focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleRegSubmit}
                      disabled={loadingVehicle}
                      className="h-14 px-6 rounded-xl bg-white text-slate-900 hover:bg-white/90 font-semibold text-[15px] transition active:scale-[0.98] whitespace-nowrap inline-flex items-center gap-2"
                    >
                      {loadingVehicle ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Värdera min bil <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                  {regError && <p className="mt-2 text-[13px] text-red-400">{regError}</p>}

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
                    {['100 % kostnadsfritt', 'Ingen bindning', 'Tar ca 2 minuter'].map(t => (
                      <span key={t} className="flex items-center gap-1.5 text-[13px] text-white/40">
                        <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Car image side */}
              <div className="hidden lg:block relative">
                <div className="relative rounded-2xl overflow-hidden border border-white/8">
                  <img
                    src="https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg?auto=compress&cs=tinysrgb&w=900"
                    alt="Modern bil"
                    className="w-full h-[440px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-bilto-500/20 flex items-center justify-center">
                          <Handshake className="w-5 h-5 text-bilto-400" strokeWidth={1.8} />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-white">En bil. En förfrågan. Flera förmedlare.</p>
                          <p className="text-[12px] text-white/50">Du jämför — du väljer.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="bg-[#0a0f1a] border-t border-white/8 py-16 px-5">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-[12px] font-bold text-white/30 uppercase tracking-[0.2em] mb-10">Jämför. Välj. Sälj.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { value: '4,8/5', label: 'Genomsnittligt betyg', icon: Star },
                { value: '50+', label: 'Verifierade förmedlare', icon: ShieldCheck },
                { value: '1 200+', label: 'Genomförda förmedlingar', icon: Handshake },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex flex-col items-center text-center">
                    <Icon className="w-6 h-6 text-bilto-400 mb-3" strokeWidth={1.5} />
                    <span className="text-[32px] font-black text-white tabular-nums">{s.value}</span>
                    <span className="text-[13px] text-white/40 mt-1">{s.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-[11px] text-white/20 mt-6">Demo-data — fiktiv statistik</p>
          </div>
        </section>

        {/* SÅ FUNGERAR DET */}
        <section id="how" data-animate className={`bg-white py-24 sm:py-32 px-5 transition-[opacity,transform] duration-700 ${isVisible('how') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-5xl mx-auto">
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Processen</p>
            <h2 className="text-[36px] sm:text-[48px] font-black text-slate-900 tracking-[-0.02em] leading-[1.05] text-center mb-16">
              Så fungerar det
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Lägg till bilen', text: 'Ange registreringsnummer och svara på några frågor om bilen.', icon: Car },
                { step: '02', title: 'Få erbjudanden', text: 'Verifierade bilförmedlare lämnar erbjudanden om att sälja bilen åt dig.', icon: TrendingUp },
                { step: '03', title: 'Välj förmedlare', text: 'Jämför nettobelopp, avgift, försäljningstid och betyg innan du bestämmer dig.', icon: Handshake },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.step} className="group bg-[#faf8f5] hover:bg-slate-900 rounded-xl p-8 transition-all duration-300">
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

            <div className="mt-10 text-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-2.5 h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition group"
              >
                Få erbjudanden
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
              </button>
            </div>
          </div>
        </section>

        {/* VARFÖR INTE BARA SÄLJA DIREKT */}
        <section id="compare-options" data-animate className={`bg-[#0a0f1a] py-24 sm:py-32 px-5 transition-[opacity,transform] duration-700 ${isVisible('compare-options') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="mb-16 text-center">
              <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Tre vägar att sälja</p>
              <h2 className="text-[36px] sm:text-[48px] font-black text-white tracking-[-0.02em] leading-[1.05]">
                Varför inte bara sälja direkt?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {COMPARISON_OPTIONS.map((opt) => (
                <div key={opt.title} className={`relative rounded-xl p-8 transition-all duration-300 ${
                  opt.recommended
                    ? 'bg-bilto-500/10 border-2 border-bilto-500/40'
                    : 'bg-white/4 border border-white/8'
                }`}>
                  {opt.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-bilto-500 text-white text-[11px] font-bold uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" /> Rekommenderat
                      </span>
                    </div>
                  )}
                  <h3 className={`text-[20px] font-bold mb-4 ${opt.recommended ? 'text-white' : 'text-white/90'}`}>{opt.title}</h3>
                  <p className="text-white/45 text-[14px] leading-relaxed mb-6">{opt.description}</p>
                  <div className="pt-4 border-t border-white/8">
                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-2">Bekvämlighet</p>
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= opt.comfortLevel ? 'bg-bilto-500' : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <p className="text-[13px] text-white/50 mt-2">{opt.comfort}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section id="trust" data-animate className={`bg-white py-24 sm:py-32 px-5 transition-[opacity,transform] duration-700 ${isVisible('trust') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="mb-16 text-center">
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Trygghet</p>
              <h2 className="text-[36px] sm:text-[48px] font-black text-slate-900 tracking-[-0.02em] leading-[1.05]">
                Tryggare bilförmedling.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TRUST_CARDS.map((c) => {
                const Icon = trustIcon(c.icon);
                return (
                  <div key={c.title} className="bg-[#faf8f5] rounded-xl p-7 hover:shadow-card-hover transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5 text-slate-700" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-900 mb-2">{c.title}</h3>
                    <p className="text-slate-500 text-[14px] leading-relaxed">{c.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section id="reviews" data-animate className={`bg-[#0a0f1a] py-24 sm:py-32 px-5 transition-[opacity,transform] duration-700 ${isVisible('reviews') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="mb-14">
              <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Kundrecensioner</p>
              <h2 className="text-[36px] sm:text-[48px] font-black text-white tracking-[-0.02em] leading-[1.05]">
                Vad kunderna säger.
              </h2>
              <p className="text-[11px] text-white/20 mt-3">Demo-recensioner — fiktivt innehåll</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEMO_REVIEWS.map((r, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/4 p-7 hover:bg-white/8 transition-all duration-300">
                  <div className="flex gap-0.5 mb-5">
                    {[...Array(r.stars)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" strokeWidth={1} />
                    ))}
                  </div>
                  <p className="text-white/70 text-[16px] leading-relaxed mb-6">&ldquo;{r.text}&rdquo;</p>
                  <p className="text-[14px] font-semibold text-white">{r.name}</p>
                  <p className="text-[12px] text-white/35">{r.city}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" data-animate className={`bg-white py-24 sm:py-32 px-5 transition-[opacity,transform] duration-700 ${isVisible('faq') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-3xl mx-auto">
            <div className="mb-14 text-center">
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Frågor och svar</p>
              <h2 className="text-[36px] sm:text-[48px] font-black text-slate-900 tracking-[-0.02em] leading-[1.05]">
                Vanliga frågor
              </h2>
            </div>
            <div className="flex flex-col">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="border-b border-slate-100">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between py-5 text-left group"
                  >
                    <span className="text-[16px] font-semibold text-slate-900 pr-4">{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <p className="pb-5 text-[15px] text-slate-500 leading-relaxed">{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0a0f1a] py-24 sm:py-32 px-5 border-t border-white/8">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-[32px] sm:text-[48px] font-black text-white tracking-[-0.025em] leading-[1.0] mb-6">
              En förfrågan.<br />Flera förmedlare.
            </h3>
            <p className="text-white/45 text-[17px] leading-relaxed mb-10 max-w-md mx-auto">
              Lägg in din bil en gång och låt verifierade förmedlare konkurrera om att sälja den.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2.5 h-13 px-8 rounded-xl bg-white text-slate-900 hover:bg-white/90 font-semibold text-[16px] transition group"
            >
              Få erbjudanden
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
          </div>
        </section>

        <FormedlingFooter />
      </div>
    );
  }

  // ── VEHICLE FOUND ──
  if (step === 'vehicle-found') {
    return (
      <FlowShell onLogo={() => setStep('landing')}>
        <div className="max-w-lg mx-auto px-5 py-8">
          <button onClick={() => setStep('landing')} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Tillbaka
          </button>

          <div className="bg-white rounded-xl shadow-card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" strokeWidth={2} />
            </div>
            <h2 className="text-[24px] font-black text-slate-900 mb-2">Vi hittade din bil</h2>
            <p className="text-slate-500 text-[15px] mb-8">Är detta din bil?</p>

            <div className="bg-[#faf8f5] rounded-xl p-6 mb-8 text-left">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                  <Car className="w-7 h-7 text-slate-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[18px] font-bold text-slate-900">{DEMO_VEHICLE.make} {DEMO_VEHICLE.model}</p>
                  <p className="text-[14px] text-slate-500">{DEMO_VEHICLE.variant}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                {[
                  { label: 'Årsmodell', value: String(DEMO_VEHICLE.modelYear) },
                  { label: 'Miltal', value: `${DEMO_VEHICLE.mileage.toLocaleString('sv-SE')} mil` },
                  { label: 'Växellåda', value: DEMO_VEHICLE.transmission },
                  { label: 'Drivmedel', value: DEMO_VEHICLE.fuel },
                  { label: 'Färg', value: DEMO_VEHICLE.color },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{s.label}</p>
                    <p className="text-[15px] font-semibold text-slate-900">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('vehicle-info')}
                className="flex-1 h-13 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition active:scale-[0.98]"
              >
                Ja, fortsätt
              </button>
              <button
                onClick={() => setStep('landing')}
                className="flex-1 h-13 rounded-xl border border-slate-200 hover:border-slate-400 text-slate-700 font-semibold text-[15px] transition"
              >
                Ändra
              </button>
            </div>
          </div>
        </div>
      </FlowShell>
    );
  }

  // ── VEHICLE INFO ──
  if (step === 'vehicle-info') {
    return (
      <FlowShell onLogo={() => setStep('landing')}>
        <div className="max-w-lg mx-auto px-5 py-8">
          <FlowProgress current={2} total={4} />
          <button onClick={() => setStep('vehicle-found')} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Tillbaka
          </button>

          <h1 className="text-[24px] font-bold text-slate-900 mb-8">Berätta lite om bilen</h1>

          <div className="bg-white rounded-xl shadow-card p-6 space-y-6">
            <FormField label="Nuvarande miltal">
              <input
                type="text"
                value={vehicleInfo.mileage}
                onChange={(e) => setVehicleInfo(v => ({ ...v, mileage: e.target.value }))}
                placeholder="t.ex. 6 420"
                className="form-control"
              />
            </FormField>

            <FormField label="Servicehistorik">
              <ChoiceGroup
                options={[{ v: 'full', l: 'Fullständig' }, { v: 'partial', l: 'Delvis' }, { v: 'missing', l: 'Saknas' }]}
                value={vehicleInfo.serviceHistory}
                onChange={(v) => setVehicleInfo(s => ({ ...s, serviceHistory: v as VehicleInfo['serviceHistory'] }))}
              />
            </FormField>

            <FormField label="Antal nycklar">
              <ChoiceGroup
                options={[{ v: '1', l: '1' }, { v: '2', l: '2' }, { v: '3', l: '3+' }]}
                value={vehicleInfo.numKeys !== '' ? String(vehicleInfo.numKeys) : ''}
                onChange={(v) => setVehicleInfo(s => ({ ...s, numKeys: parseInt(v) }))}
              />
            </FormField>

            <FormField label="Däck">
              <ChoiceGroup
                options={[{ v: 'summer', l: 'Sommar' }, { v: 'winter', l: 'Vinter' }, { v: 'both', l: 'Båda' }]}
                value={vehicleInfo.tires}
                onChange={(v) => setVehicleInfo(s => ({ ...s, tires: v as VehicleInfo['tires'] }))}
              />
            </FormField>

            <FormField label="Skick">
              <ChoiceGroup
                options={[
                  { v: 'excellent', l: 'Mycket bra' },
                  { v: 'good', l: 'Bra' },
                  { v: 'normal', l: 'Normalt' },
                  { v: 'needs_work', l: 'Behöver åtgärdas' },
                ]}
                value={vehicleInfo.condition}
                onChange={(v) => setVehicleInfo(s => ({ ...s, condition: v as VehicleInfo['condition'] }))}
              />
            </FormField>

            <FormField label="Finns kända skador?">
              <ChoiceGroup
                options={[{ v: 'no', l: 'Nej' }, { v: 'yes', l: 'Ja' }]}
                value={vehicleInfo.hasDamage}
                onChange={(v) => setVehicleInfo(s => ({ ...s, hasDamage: v as 'yes' | 'no' }))}
              />
            </FormField>

            {vehicleInfo.hasDamage === 'yes' && (
              <FormField label="Beskriv skadan">
                <textarea
                  value={vehicleInfo.damageDescription}
                  onChange={(e) => setVehicleInfo(v => ({ ...v, damageDescription: e.target.value }))}
                  placeholder="Beskriv skadan..."
                  className="form-control h-24 resize-none"
                />
              </FormField>
            )}

            <FormField label="Extrautrustning">
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map(eq => {
                  const selected = vehicleInfo.equipment.includes(eq);
                  return (
                    <button
                      key={eq}
                      onClick={() => setVehicleInfo(v => ({
                        ...v,
                        equipment: selected ? v.equipment.filter(x => x !== eq) : [...v.equipment, eq],
                      }))}
                      className={`px-4 py-2.5 rounded-xl text-[14px] font-medium transition ${
                        selected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {eq}
                    </button>
                  );
                })}
              </div>
            </FormField>
          </div>

          <button
            onClick={() => setStep('images')}
            className="w-full h-13 mt-6 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition active:scale-[0.98] inline-flex items-center justify-center gap-2"
          >
            Fortsätt <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </FlowShell>
    );
  }

  // ── IMAGES ──
  if (step === 'images') {
    return (
      <FlowShell onLogo={() => setStep('landing')}>
        <div className="max-w-lg mx-auto px-5 py-8">
          <FlowProgress current={3} total={4} />
          <button onClick={() => setStep('vehicle-info')} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Tillbaka
          </button>

          <h1 className="text-[24px] font-bold text-slate-900 mb-2">Lägg till bilder</h1>
          <p className="text-slate-500 text-[15px] mb-8">Bra bilder hjälper förmedlarna att göra en bättre bedömning.</p>

          <div className="grid grid-cols-2 gap-3">
            {IMAGE_SLOTS.map(slot => (
              <button
                key={slot}
                onClick={() => setImageSlots(prev => ({ ...prev, [slot]: 'uploaded' }))}
                className={`aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition ${
                  imageSlots[slot] ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-[#faf8f5] hover:border-slate-400'
                }`}
              >
                {imageSlots[slot] ? (
                  <Check className="w-6 h-6 text-emerald-500" strokeWidth={2} />
                ) : (
                  <Camera className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
                )}
                <span className="text-[12px] font-medium text-slate-500">{slot}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setStep('contact')}
              className="flex-1 h-13 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition active:scale-[0.98] inline-flex items-center justify-center gap-2"
            >
              Fortsätt <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setStep('contact')}
              className="flex-1 h-13 rounded-xl border border-slate-200 hover:border-slate-400 text-slate-700 font-semibold text-[15px] transition"
            >
              Gör detta senare
            </button>
          </div>
        </div>
      </FlowShell>
    );
  }

  // ── CONTACT ──
  if (step === 'contact') {
    return (
      <FlowShell onLogo={() => setStep('landing')}>
        <div className="max-w-lg mx-auto px-5 py-8">
          <FlowProgress current={4} total={4} />
          <button onClick={() => setStep('images')} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Tillbaka
          </button>

          <h1 className="text-[24px] font-bold text-slate-900 mb-2">Vart ska vi skicka dina erbjudanden?</h1>
          <p className="text-slate-500 text-[15px] mb-8">Vi skickar erbjudandena från förmedlarna till din e-post.</p>

          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Förnamn">
                <input type="text" value={contact.firstName} onChange={e => setContact(c => ({ ...c, firstName: e.target.value }))} className="form-control" placeholder="Förnamn" />
              </FormField>
              <FormField label="Efternamn">
                <input type="text" value={contact.lastName} onChange={e => setContact(c => ({ ...c, lastName: e.target.value }))} className="form-control" placeholder="Efternamn" />
              </FormField>
            </div>
            <FormField label="E-post">
              <input type="email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} className="form-control" placeholder="namn@email.se" />
            </FormField>
            <FormField label="Telefonnummer">
              <input type="tel" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} className="form-control" placeholder="070 123 4567" />
            </FormField>
            <FormField label="Postnummer">
              <input type="text" value={contact.postalCode} onChange={e => setContact(c => ({ ...c, postalCode: e.target.value }))} className="form-control" placeholder="123 45" />
            </FormField>

            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <button
                type="button"
                onClick={() => setContact(c => ({ ...c, consent: !c.consent }))}
                className={`w-5 h-5 rounded shrink-0 mt-0.5 flex items-center justify-center transition ${
                  contact.consent ? 'bg-slate-900' : 'border-2 border-slate-300'
                }`}
              >
                {contact.consent && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
              <span className="text-[13px] text-slate-600 leading-relaxed">
                Jag godkänner att mina biluppgifter delas med verifierade bilförmedlare för att få erbjudanden.
              </span>
            </label>
          </div>

          {contactError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              <span>{contactError}</span>
            </div>
          )}

          <button
            onClick={handleContactSubmit}
            className="w-full h-13 mt-6 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition active:scale-[0.98] inline-flex items-center justify-center gap-2"
          >
            Skicka min bil <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </FlowShell>
    );
  }

  // ── MATCHING ──
  if (step === 'matching') {
    const phases = ['Analyserar bilen...', 'Matchar med relevanta förmedlare...', 'Jämför förmedlarnas erbjudanden...'];
    return (
      <FlowShell onLogo={() => setStep('landing')}>
        <div className="min-h-screen flex items-center justify-center px-5">
          <div className="text-center max-w-md">
            <div className="relative w-24 h-24 mx-auto mb-10">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-bilto-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Car className="w-8 h-8 text-bilto-500" strokeWidth={1.5} />
              </div>
            </div>
            <div className="h-7 mb-3">
              <p className="text-[20px] font-bold text-slate-900 transition-opacity">
                {matchingPhase > 0 ? phases[matchingPhase - 1] : phases[0]}
              </p>
            </div>
            <div className="flex justify-center gap-1.5">
              {[1,2,3].map(i => (
                <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${matchingPhase >= i ? 'bg-bilto-500' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>
        </div>
      </FlowShell>
    );
  }

  // ── MATCHED ──
  if (step === 'matched') {
    return (
      <FlowShell onLogo={() => setStep('landing')}>
        <div className="max-w-lg mx-auto px-5 py-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={2} />
          </div>
          <h2 className="text-[28px] font-black text-slate-900 mb-3">Din bil har matchats!</h2>
          <p className="text-slate-500 text-[16px] mb-10">
            Vi har hittat <span className="font-bold text-slate-900">3 förmedlare</span> som vill sälja din {DEMO_VEHICLE.make} {DEMO_VEHICLE.model}.
          </p>
          <button
            onClick={() => setStep('dashboard')}
            className="inline-flex items-center gap-2.5 h-13 px-8 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[16px] transition active:scale-[0.98]"
          >
            Se erbjudanden <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </FlowShell>
    );
  }

  // ── DASHBOARD / OFFERS ──
  if (step === 'dashboard') {
    return (
      <FlowShell onLogo={() => setStep('landing')}>
        <div className="max-w-5xl mx-auto px-5 py-8">
          <button onClick={() => setStep('landing')} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Till startsidan
          </button>

          {/* Vehicle header */}
          <div className="bg-white rounded-xl shadow-card p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Car className="w-7 h-7 text-slate-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h1 className="text-[20px] font-bold text-slate-900">Din {DEMO_VEHICLE.make} {DEMO_VEHICLE.model}</h1>
                <p className="text-[14px] text-slate-500">{DEMO_VEHICLE.variant} · {DEMO_VEHICLE.modelYear} · {DEMO_VEHICLE.mileage.toLocaleString('sv-SE')} mil</p>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-bilto-50 text-bilto-600 text-[13px] font-semibold">
                3 erbjudanden
              </span>
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-slate-900">Jämför erbjudanden</h2>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-slate-400 hidden sm:inline">Sortera:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="text-[13px] font-medium border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-bilto-500"
              >
                <option value="net">Mest pengar till dig</option>
                <option value="commission">Lägst avgift</option>
                <option value="time">Snabbast försäljning</option>
                <option value="rating">Högst betyg</option>
              </select>
            </div>
          </div>

          {/* Offers */}
          <div className="space-y-4">
            {sortedOffers.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onOpen={() => { setSelectedOfferId(offer.id); setStep('offer-detail'); }}
                onCompare={() => toggleCompare(offer.id)}
                compared={compareIds.includes(offer.id)}
              />
            ))}
          </div>

          {/* Compare bar */}
          {compareIds.length >= 2 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={() => setShowCompare(true)}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-slate-900 text-white font-semibold text-[14px] shadow-lg hover:bg-slate-700 transition"
              >
                Jämför {compareIds.length} erbjudanden
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Compare modal */}
          {showCompare && (
            <CompareModal offers={compareOffers} onClose={() => setShowCompare(false)} onSelect={(id) => { setSelectedOfferId(id); setShowCompare(false); setStep('offer-detail'); }} />
          )}
        </div>
      </FlowShell>
    );
  }

  // ── OFFER DETAIL ──
  if (step === 'offer-detail' && selectedOffer) {
    return (
      <FlowShell onLogo={() => setStep('landing')}>
        <div className="max-w-2xl mx-auto px-5 py-8">
          <button onClick={() => setStep('dashboard')} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Tillbaka till jämförelsen
          </button>

          {/* Dealer profile */}
          <div className="bg-white rounded-xl shadow-card p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-[24px] font-black text-slate-900">{selectedOffer.dealerName}</h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold">
                    <ShieldCheck className="w-3 h-3" /> Verifierad
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[14px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" strokeWidth={1} />
                    {selectedOffer.rating.toFixed(1)} / 5
                  </span>
                  <span>{selectedOffer.completedSales} genomförda försäljningar</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Stockholm</span>
                </div>
              </div>
              {selectedOffer.badge && (
                <span className="px-3 py-1.5 rounded-full bg-bilto-50 text-bilto-600 text-[12px] font-bold whitespace-nowrap">
                  {selectedOffer.badge}
                </span>
              )}
            </div>

            {/* Offer summary */}
            <div className="bg-[#faf8f5] rounded-xl p-6 mb-6">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Ditt erbjudande</p>
              <div className="space-y-3">
                <OfferRow label="Förväntat försäljningspris" value={formatSEK(selectedOffer.expectedSalePrice)} />
                <OfferRow label="Förmedlingsavgift" value={`– ${formatSEK(selectedOffer.commission)}`} negative />
                <div className="h-px bg-slate-200" />
                <OfferRow label="Beräknat till dig" value={formatSEK(selectedOffer.expectedOwnerNet)} bold />
                <OfferRow label="Försäljningstid" value={selectedOffer.expectedSaleTime} />
              </div>
            </div>

            {/* Included services */}
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Detta ingår</p>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 mb-6">
              {selectedOffer.includedServices.map(s => (
                <div key={s} className="flex items-center gap-2 text-[14px] text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
                  {s}
                </div>
              ))}
            </div>

            {/* Villkor */}
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Villkor</p>
            <div className="space-y-2.5 text-[14px] text-slate-600 mb-8">
              <div className="flex justify-between"><span>Bilen förvaras</span><span className="font-semibold text-slate-900">{selectedOffer.vehicleStorage === 'dealer' ? 'Hos förmedlaren' : selectedOffer.vehicleStorage === 'owner' ? 'Hos bilägaren' : 'Efter överenskommelse'}</span></div>
              <div className="flex justify-between"><span>Uppsägningstid</span><span className="font-semibold text-slate-900">7 dagar</span></div>
              <div className="flex justify-between"><span>Erbjudandet gäller</span><span className="font-semibold text-slate-900">{selectedOffer.offerExpiration} timmar</span></div>
            </div>

            {selectedOffer.comment && (
              <div className="bg-slate-50 rounded-xl p-5 mb-8">
                <p className="text-[14px] text-slate-600 leading-relaxed italic">&ldquo;{selectedOffer.comment}&rdquo;</p>
                <p className="text-[12px] text-slate-400 mt-3">— {selectedOffer.dealerName}</p>
              </div>
            )}

            <button
              onClick={() => setStep('accept')}
              className="w-full h-13 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[16px] transition active:scale-[0.98]"
            >
              Välj {selectedOffer.dealerName}
            </button>
          </div>
        </div>
      </FlowShell>
    );
  }

  // ── ACCEPT ──
  if (step === 'accept' && selectedOffer) {
    return (
      <FlowShell onLogo={() => setStep('landing')}>
        <div className="max-w-lg mx-auto px-5 py-12">
          <div className="bg-white rounded-xl shadow-card p-8">
            <h2 className="text-[24px] font-black text-slate-900 mb-2">Du väljer {selectedOffer.dealerName}</h2>
            <p className="text-slate-500 text-[15px] mb-8">Granska erbjudandet innan du går vidare.</p>

            <div className="bg-[#faf8f5] rounded-xl p-6 mb-6 space-y-3">
              <OfferRow label="Förväntat försäljningspris" value={formatSEK(selectedOffer.expectedSalePrice)} />
              <OfferRow label="Förmedlingsavgift" value={`– ${formatSEK(selectedOffer.commission)}`} negative />
              <div className="h-px bg-slate-200" />
              <OfferRow label="Beräknat till dig" value={formatSEK(selectedOffer.expectedOwnerNet)} bold />
            </div>

            <p className="text-[14px] text-slate-600 mb-4">
              Du får möjlighet att läsa igenom förmedlingsavtalet innan uppdraget blir bindande.
            </p>

            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <button
                type="button"
                onClick={() => setAcceptConsent(!acceptConsent)}
                className={`w-5 h-5 rounded shrink-0 mt-0.5 flex items-center justify-center transition ${
                  acceptConsent ? 'bg-slate-900' : 'border-2 border-slate-300'
                }`}
              >
                {acceptConsent && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
              <span className="text-[13px] text-slate-600 leading-relaxed">
                Jag förstår att försäljningspriset är en uppskattning och inte ett garanterat slutpris.
              </span>
            </label>

            <button
              onClick={() => acceptConsent && setStep('success')}
              disabled={!acceptConsent}
              className="w-full h-13 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300 text-white font-semibold text-[15px] transition active:scale-[0.98]"
            >
              Fortsätt till avtal
            </button>
          </div>
        </div>
      </FlowShell>
    );
  }

  // ── SUCCESS ──
  if (step === 'success' && selectedOffer) {
    const timeline = [
      { label: 'Erbjudande accepterat', done: true },
      { label: 'Förmedlaren kontaktar dig', done: false },
      { label: 'Bilen inspekteras', done: false },
      { label: 'Bilen annonseras', done: false },
      { label: 'Bilen säljs', done: false },
      { label: 'Du får betalt', done: false },
    ];
    return (
      <FlowShell onLogo={() => setStep('landing')}>
        <div className="max-w-lg mx-auto px-5 py-12">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={2} />
            </div>
            <h2 className="text-[28px] font-black text-slate-900 mb-3">Din förmedlare är vald.</h2>
            <p className="text-slate-500 text-[16px]">{selectedOffer.dealerName} kontaktar dig för att boka nästa steg.</p>
          </div>

          <div className="bg-white rounded-xl shadow-card p-8 mb-8">
            <div className="space-y-4">
              {timeline.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    item.done ? 'bg-emerald-500' : 'bg-slate-100'
                  }`}>
                    {item.done ? <Check className="w-4 h-4 text-white" strokeWidth={3} /> : <span className="text-[12px] font-bold text-slate-400">{i + 1}</span>}
                  </div>
                  <span className={`text-[15px] ${item.done ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep('my-cars')}
            className="w-full h-13 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[15px] transition active:scale-[0.98]"
          >
            Till min bil
          </button>
        </div>
      </FlowShell>
    );
  }

  // ── MY CARS ──
  if (step === 'my-cars') {
    const progress = [
      { label: 'Bil registrerad', done: true },
      { label: 'Förmedlare vald', done: true },
      { label: 'Inspektion bokas', done: false },
      { label: 'Annonsering', done: false },
      { label: 'Försäljning', done: false },
      { label: 'Utbetalning', done: false },
    ];
    return (
      <FlowShell onLogo={() => setStep('landing')}>
        <div className="max-w-3xl mx-auto px-5 py-8">
          <button onClick={() => setStep('landing')} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Till startsidan
          </button>

          <h1 className="text-[28px] font-black text-slate-900 mb-8">Mina bilar</h1>

          <div className="bg-white rounded-xl shadow-card p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Car className="w-7 h-7 text-slate-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-[18px] font-bold text-slate-900">{DEMO_VEHICLE.make} {DEMO_VEHICLE.model}</h2>
                <p className="text-[14px] text-slate-500">{DEMO_VEHICLE.variant} · {DEMO_VEHICLE.modelYear}</p>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[13px] font-semibold">
                Förmedlare vald
              </span>
            </div>

            <div className="space-y-3">
              {progress.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    p.done ? 'bg-emerald-500' : 'bg-slate-100'
                  }`}>
                    {p.done ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /> : <span className="text-[11px] font-bold text-slate-400">{i + 1}</span>}
                  </div>
                  <span className={`text-[14px] ${p.done ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dealer portal demo link */}
          <div className="bg-bilto-50 rounded-xl p-6 border border-bilto-100">
            <h3 className="text-[16px] font-bold text-slate-900 mb-2">Se från förmedlarens perspektiv</h3>
            <p className="text-[14px] text-slate-600 mb-4">Byt till förmedlarportalen och se samma Volvo XC60 från förmedlarens sida.</p>
            <a href="/formedling/forhandlare" className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[14px] transition">
              Öppna förmedlarportalen <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </FlowShell>
    );
  }

  return null;
}

// ── Sub-components ──

function FormedlingNav({ scrolled, menuOpen, setMenuOpen, onLogo }: {
  scrolled: boolean; menuOpen: boolean; setMenuOpen: (v: boolean) => void; onLogo: () => void;
}) {
  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-30 h-16 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'
      }`}>
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-10">
          <button className="lg:hidden -ml-2 w-11 h-11 flex items-center justify-center" onClick={() => setMenuOpen(true)}>
            <Menu className={`w-6 h-6 ${scrolled ? 'text-slate-900' : 'text-white'}`} strokeWidth={2} />
          </button>
          <button onClick={onLogo} className="shrink-0 lg:mr-10 flex items-center">
            <span className={`text-[20px] font-black tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              Bilto<span className="text-bilto-500">.</span>
            </span>
            <span className={`ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${scrolled ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/60'}`}>
              Förmedling
            </span>
          </button>
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {['Så fungerar det', 'För bilägare', 'För förmedlare', 'Vanliga frågor'].map(item => (
              <a key={item} href="#" className={`text-[14px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}>
                {item}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a href="#" className={`hidden lg:inline-flex text-[14px] font-medium transition ${scrolled ? 'text-slate-700 hover:text-slate-900' : 'text-white/70 hover:text-white'}`}>
              Logga in
            </a>
            <a href="/formedling" className={`inline-flex items-center px-5 py-2.5 rounded-xl text-[13px] font-semibold transition ${
              scrolled ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-white text-slate-900 hover:bg-white/90'
            }`}>
              Sälj din bil
            </a>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <aside className="absolute top-0 left-0 h-full w-[82%] max-w-[340px] bg-white shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-end px-5 border-b border-slate-100">
              <button onClick={() => setMenuOpen(false)} className="w-10 h-10 flex items-center justify-center">
                <X className="w-6 h-6 text-slate-700" />
              </button>
            </div>
            <nav className="flex-1 px-2 py-3">
              {['Så fungerar det', 'För bilägare', 'För förmedlare', 'Vanliga frågor', 'Logga in'].map(item => (
                <button key={item} className="w-full text-left px-4 py-3 rounded-lg text-[16px] font-medium text-slate-800 hover:bg-[#faf8f5]">
                  {item}
                </button>
              ))}
            </nav>
            <div className="border-t border-slate-100 px-4 py-4">
              <a href="/formedling" className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-slate-900 text-white text-[15px] font-semibold">
                Sälj din bil
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function FormedlingFooter() {
  return (
    <footer className="bg-[#060e1e] text-white">
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(14,110,254,0.6) 30%, rgba(56,189,248,0.5) 60%, transparent)' }} />
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-white/7">
          <div className="col-span-2 md:col-span-1">
            <span className="text-[20px] font-black text-white">Bilto<span className="text-bilto-500">.</span></span>
            <p className="text-[13px] text-slate-400 mt-4 max-w-[210px]">Jämför förmedlare. Sälj smartare.</p>
          </div>
          {[
            { title: 'Tjänster', links: ['Sälj din bil', 'För förmedlare', 'Så fungerar det'] },
            { title: 'Resurser', links: ['Vanliga frågor', 'Priser', 'Guider'] },
            { title: 'Trygghet', links: ['Integritetspolicy', 'Användarvillkor', 'Kontakt'] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] mb-5 text-slate-300">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(l => (
                  <li key={l}><a href="#" className="text-[13px] text-slate-500 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-6 flex justify-between items-center text-[12px] text-slate-600">
          <p>&copy; {new Date().getFullYear()} Bilto AB · Alla rättigheter förbehållna</p>
          <p>Demo — all data är fiktiv</p>
        </div>
      </div>
    </footer>
  );
}

function FlowShell({ children, onLogo }: { children: React.ReactNode; onLogo: () => void }) {
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-14 lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <button onClick={onLogo} className="flex items-center">
            <span className="text-[20px] font-black text-white">Bilto<span className="text-white/60">.</span></span>
            <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white/80">Förmedling</span>
          </button>
        </div>
      </header>
      <div className="pt-24">{children}</div>
    </div>
  );
}

function FlowProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex gap-1.5 flex-1">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < current ? 'bg-bilto-500' : 'bg-slate-200'}`} />
        ))}
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap font-medium">Steg {current} av {total}</span>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-2">{label}</label>
      {children}
    </div>
  );
}

function ChoiceGroup({ options, value, onChange }: {
  options: { v: string; l: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.v}
          onClick={() => onChange(opt.v)}
          className={`px-4 py-2.5 rounded-xl text-[14px] font-medium transition ${
            value === opt.v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {opt.l}
        </button>
      ))}
    </div>
  );
}

function OfferCard({ offer, onOpen, onCompare, compared }: {
  offer: FormedlingOffer;
  onOpen: () => void;
  onCompare: () => void;
  compared: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <span className="text-[16px] font-black text-slate-600">{offer.dealerName.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-bold text-slate-900">{offer.dealerName}</h3>
              <ShieldCheck className="w-4 h-4 text-emerald-500" strokeWidth={2} />
            </div>
            <div className="flex items-center gap-3 text-[12px] text-slate-500 mt-0.5">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" strokeWidth={1} />
                {offer.rating.toFixed(1)}
              </span>
              <span>{offer.completedSales} försäljningar</span>
            </div>
          </div>
        </div>
        {offer.badge && (
          <span className="px-2.5 py-1 rounded-full bg-bilto-50 text-bilto-600 text-[11px] font-bold whitespace-nowrap">
            {offer.badge}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Till dig</p>
          <p className="text-[18px] font-black text-slate-900">{formatSEK(offer.expectedOwnerNet)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avgift</p>
          <p className="text-[15px] font-bold text-slate-700">{formatSEK(offer.commission)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Försäljningstid</p>
          <p className="text-[15px] font-bold text-slate-700">{offer.expectedSaleTime}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button onClick={onOpen} className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[14px] transition active:scale-[0.98]">
          Visa erbjudande
        </button>
        <button
          onClick={onCompare}
          className={`h-11 px-4 rounded-xl border font-semibold text-[14px] transition ${
            compared ? 'border-bilto-500 bg-bilto-50 text-bilto-600' : 'border-slate-200 text-slate-600 hover:border-slate-400'
          }`}
        >
          {compared ? 'Vald' : 'Jämför'}
        </button>
      </div>
    </div>
  );
}

function OfferRow({ label, value, bold, negative }: { label: string; value: string; bold?: boolean; negative?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-[14px] ${bold ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-[15px] ${bold ? 'font-black text-slate-900' : negative ? 'text-red-500 font-semibold' : 'font-semibold text-slate-900'}`}>
        {value}
      </span>
    </div>
  );
}

function CompareModal({ offers, onClose, onSelect }: {
  offers: FormedlingOffer[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const rows = [
    { label: 'Förväntat försäljningspris', key: 'expectedSalePrice', format: (v: number) => formatSEK(v) },
    { label: 'Förmedlingsavgift', key: 'commission', format: (v: number) => formatSEK(v) },
    { label: 'Beräknat till dig', key: 'expectedOwnerNet', format: (v: number) => formatSEK(v) },
    { label: 'Försäljningstid', key: 'expectedSaleTime', format: (v: string) => v },
    { label: 'Betyg', key: 'rating', format: (v: number) => `${v.toFixed(1)} / 5` },
    { label: 'Genomförda affärer', key: 'completedSales', format: (v: number) => String(v) },
  ];
  const serviceRows = [
    'Bilen förvaras', 'Fotografering', 'Annonsering', 'Provkörningar',
    'Finansiering för köpare', 'Betalningshantering', 'Ägarbyte',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-slate-900">Jämför erbjudanden</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-[12px] font-bold text-slate-400 uppercase tracking-wider pb-4 pr-4"></th>
                {offers.map(o => (
                  <th key={o.id} className="text-left text-[14px] font-bold text-slate-900 pb-4 px-4 min-w-[140px]">
                    {o.dealerName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key} className="border-t border-slate-100">
                  <td className="py-3 pr-4 text-[13px] text-slate-500 font-medium">{row.label}</td>
                  {offers.map(o => (
                    <td key={o.id} className="py-3 px-4 text-[14px] font-semibold text-slate-900">
                      {row.format((o as never)[row.key] as never)}
                    </td>
                  ))}
                </tr>
              ))}
              {serviceRows.map(svc => (
                <tr key={svc} className="border-t border-slate-100">
                  <td className="py-3 pr-4 text-[13px] text-slate-500 font-medium">{svc}</td>
                  {offers.map(o => (
                    <td key={o.id} className="py-3 px-4">
                      <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200">
                <td className="pt-5 pr-4"></td>
                {offers.map(o => (
                  <td key={o.id} className="pt-5 px-4">
                    <button
                      onClick={() => onSelect(o.id)}
                      className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[13px] transition"
                    >
                      Välj
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function trustIcon(name: string) {
  const map: Record<string, typeof Shield> = {
    shield: ShieldCheck,
    receipt: FileText,
    compare: BarChart3,
    check: CheckCircle2,
  };
  return map[name] ?? Shield;
}
