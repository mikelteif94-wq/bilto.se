import { useEffect, useState } from 'react';
import { ArrowRight, Check, Phone, MapPin, Car as CarIcon, Shield, Clock, Star } from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import RegInput from '../components/RegInput';
import type { SeoCity, SeoBrand } from '../lib/seo-pages';

interface SeoLandingPageProps {
  type: 'city' | 'brand';
  city?: SeoCity;
  brand?: SeoBrand;
  onSell: (regnummer: string) => void;
  onBack: () => void;
}

const REVIEWS = [
  { name: 'Magnus T.', text: 'Fick 8 000 kr mer än jag väntat mig. Smidigt och snabbt.', stars: 5 },
  { name: 'Johanna K.', text: 'Slapp allt krångel med bluffiga köpare. Rekommenderas varmt!', stars: 5 },
  { name: 'Erik S.', text: 'Bilen hämtades hemma hos mig. Fantastisk service.', stars: 5 },
];

export default function SeoLandingPage({ type, city, brand, onSell, onBack }: SeoLandingPageProps) {
  const [regnummer, setRegnummer] = useState('');
  const [formError, setFormError] = useState('');

  const entityName = type === 'city' ? city?.name : brand?.name;
  const entityDescription = type === 'city' ? city?.description : brand?.description;
  const county = type === 'city' ? city?.county : undefined;

  const pageTitle = type === 'city'
    ? `Sälj din bil i ${entityName} | Bilto`
    : `Sälj din ${entityName} | Bilto`;

  const h1 = type === 'city'
    ? `Sälj din bil i ${entityName}`
    : `Sälj din ${entityName}`;

  const intro = type === 'city'
    ? `Bor du i ${entityName}${county ? ` (${county})` : ''} och vill sälja din bil? Bilto hjälper dig få det bästa budet från granskade bilhandlare — utan annonser, krångel eller obekväma visningar.`
    : `Har du en ${entityName} att sälja? Bilto jämför bud från granskade handlare åt dig och ser till att du får rätt pris — snabbt och tryggt.`;

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reg = regnummer.trim().toUpperCase().replace(/\s/g, '');
    if (!reg) { setFormError('Ange registreringsnummer'); return; }
    if (!/^[A-Z]{3}[0-9]{2}[A-Z0-9]$/.test(reg)) {
      setFormError('Registreringsnumret måste vara 3 bokstäver följt av 3 tecken (t.ex. ABC123)');
      return;
    }
    setFormError('');
    onSell(reg);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-30 h-16 bg-[#0e6efe] shadow-md">
        <div className="max-w-5xl mx-auto h-full flex items-center px-5">
          <button onClick={onBack} className="flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-14 w-auto object-contain" />
          </button>
          <div className="ml-auto">
            <a href="/logga-in" className="text-[13px] text-white/80 hover:text-white font-medium transition">
              Kostnadsfri konsultation
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-14 bg-[#0e6efe]">
        <div className="max-w-4xl mx-auto px-5">
          <div className="flex items-center gap-2 text-white/70 text-[13px] mb-5">
            <button onClick={onBack} className="hover:text-white transition">Bilto</button>
            <span>/</span>
            {type === 'city' && <span className="hover:text-white transition">Sälj bil</span>}
            {type === 'city' && <span>/</span>}
            <span className="text-white">{entityName}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              {type === 'city' && county && (
                <div className="inline-flex items-center gap-1.5 mb-4 text-white/75 text-[13px]">
                  <MapPin className="w-3.5 h-3.5" />
                  {county}
                </div>
              )}
              {type === 'brand' && (
                <div className="inline-flex items-center gap-1.5 mb-4 text-white/75 text-[13px]">
                  <CarIcon className="w-3.5 h-3.5" />
                  Bilförsäljning
                </div>
              )}
              <h1 className="text-white text-[36px] sm:text-[44px] font-bold leading-[1.05] tracking-tight">
                {h1}
              </h1>
              <p className="mt-4 text-white/85 text-[16px] leading-[1.6]">
                {intro}
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  'Kostnadsfritt att lägga upp',
                  'Granskade bilhandlare lägger bud',
                  'Vi hämtar bilen hos dig',
                  'Pengarna betalas ut direkt',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-white/90 text-[15px]">
                    <Check className="w-4 h-4 text-white shrink-0" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-[17px] font-bold text-slate-900 mb-1">
                {type === 'city' ? `Värdera din bil i ${entityName}` : `Vad är din ${entityName} värd?`}
              </h2>
              <p className="text-[13px] text-slate-500 mb-4">Ange registreringsnummer för att komma igång</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <RegInput size="sm" value={regnummer} onChange={(v) => { setRegnummer(v); setFormError(''); }} />
                {formError && (
                  <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
                )}
                <button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-bold text-[15px] inline-flex items-center justify-center gap-2 transition-all"
                >
                  Värdera bilen gratis
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <p className="mt-3 text-center text-[12px] text-slate-400">
                Gratis &middot; Ingen förpliktelse &middot; Svar inom 24h
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hur det fungerar */}
      <section className="bg-slate-50 py-14 px-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[26px] font-bold text-slate-900 tracking-tight mb-10">
            Hur fungerar det?
          </h2>
          <ol className="grid sm:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Ange din bil', text: 'Fyll i registreringsnummer och lite info om skick och miltal. Det tar 2 minuter.' },
              { n: '02', title: 'Vi samlar in bud', text: 'Granskade bilhandlare lägger anonyma bud. Du slipper samtal och störande kontakter.' },
              { n: '03', title: 'Du väljer och vi hämtar', text: 'Acceptera det bästa budet. Vi ordnar upphämtning och du får betalt direkt.' },
            ].map(step => (
              <li key={step.n}>
                <span className="text-[13px] font-bold text-[#0e6efe] tabular-nums">{step.n}</span>
                <h3 className="text-[17px] font-semibold text-slate-900 mt-1 mb-2">{step.title}</h3>
                <p className="text-[14px] text-slate-600 leading-[1.6]">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Varför Bilto */}
      <section className="bg-white py-14 px-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[26px] font-bold text-slate-900 tracking-tight mb-8">
            Varför sälja via Bilto?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Granskade handlare', text: 'Alla bilhandlare i vårt nätverk är kontrollerade. Du möter bara seriösa köpare.' },
              { icon: Clock, title: 'Snabb process', text: 'Från att du lägger upp bilen till att du har pengar på kontot tar det ofta 24–72 timmar.' },
              { icon: Phone, title: 'Personlig support', text: 'En rådgivare följer dig genom hela affären. Du är aldrig ensam.' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="border border-slate-100 rounded-xl p-6">
                  <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4 text-slate-600" strokeWidth={2} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-[14px] text-slate-600 leading-[1.6]">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vad är din bil värd — context block */}
      {entityDescription && (
        <section className="bg-slate-50 py-12 px-5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[22px] font-bold text-slate-900 mb-3">
              {type === 'city' ? `Bilmarknaden i ${entityName}` : `${entityName} på den svenska begagnatmarknaden`}
            </h2>
            <p className="text-[15px] text-slate-600 leading-[1.7] max-w-2xl">
              {entityDescription} Bilto samarbetar med bilhandlare i hela Sverige — oavsett var du befinner dig kan vi matcha din bil med rätt köpare och se till att du får ett konkurrenskraftigt bud.
            </p>
          </div>
        </section>
      )}

      {/* Recensioner */}
      <section className="bg-white py-14 px-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[22px] font-bold text-slate-900 mb-8">Vad säger våra kunder?</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {REVIEWS.map(r => (
              <div key={r.name} className="border border-slate-100 rounded-xl p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[14px] text-slate-700 leading-[1.6] mb-3">"{r.text}"</p>
                <p className="text-[12px] text-slate-400 font-medium">{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#0e6efe] py-12 px-5">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-[26px] font-bold text-white mb-3">
            Redo att sälja{type === 'city' ? ` i ${entityName}` : ` din ${entityName}`}?
          </h2>
          <p className="text-white/80 text-[15px] mb-6">Det tar 2 minuter och är helt kostnadsfritt.</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
            <div className="flex-1">
              <RegInput size="sm" value={regnummer} onChange={(v) => { setRegnummer(v); setFormError(''); }} />
            </div>
            <button
              type="submit"
              className="h-11 px-6 rounded-xl bg-white text-[#0e6efe] font-bold text-[14px] hover:bg-slate-100 transition whitespace-nowrap inline-flex items-center gap-2"
            >
              Värdera nu
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          {formError && <p className="mt-2 text-[12px] text-white/80">{formError}</p>}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
