import { useEffect, useState } from 'react';
import { ArrowRight, Check, Phone, Shield, Clock, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import RegInput from '../components/RegInput';
import { setPageMeta } from '../lib/pageMeta';
import type { SeoTopic } from '../lib/seo-topics';

interface SeoTopicPageProps {
  topic: SeoTopic;
  onBack: () => void;
  onNavigateConsultation?: () => void;
  onSell?: (reg: string) => void;
}

const REVIEWS = [
  { name: 'Marcus H.', text: 'Sparade 22 000 kr på min BMW tack vare Biltos förhandlare. Otrolig service!', stars: 5 },
  { name: 'Sofie L.', text: 'Äntligen en tjänst som verkligen jobbar för mig. Fick mer än jag hoppades för min Volvo.', stars: 5 },
  { name: 'Daniel K.', text: 'Bilrade mig hela vägen – från att hitta rätt bil till att skriva under. Rekommenderar varmt.', stars: 5 },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left"
      >
        <span className="font-semibold text-slate-900 text-[15px] leading-snug">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        }
      </button>
      {open && (
        <p className="pb-5 text-slate-600 text-[14px] leading-[1.7] -mt-2">{a}</p>
      )}
    </div>
  );
}

function injectSchemaFaq(topic: SeoTopic) {
  const existing = document.getElementById('bilto-faq-schema');
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.id = 'bilto-faq-schema';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: topic.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  });
  document.head.appendChild(script);
}

function injectSchemaService(topic: SeoTopic) {
  const existing = document.getElementById('bilto-service-schema');
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.id = 'bilto-service-schema';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: topic.h1,
    provider: { '@type': 'Organization', name: 'Bilto', url: 'https://bilto.se' },
    description: topic.description,
    areaServed: { '@type': 'Country', name: 'Sverige' },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'SEK' },
    url: topic.canonical,
  });
  document.head.appendChild(script);
}

export default function SeoTopicPage({ topic, onBack, onNavigateConsultation, onSell }: SeoTopicPageProps) {
  const [regnummer, setRegnummer] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setPageMeta({
      title: topic.title,
      description: topic.description,
      canonical: topic.canonical,
    });
    injectSchemaFaq(topic);
    injectSchemaService(topic);
    return () => {
      document.getElementById('bilto-faq-schema')?.remove();
      document.getElementById('bilto-service-schema')?.remove();
    };
  }, [topic]);

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reg = regnummer.trim().toUpperCase().replace(/\s/g, '');
    if (!reg) { setFormError('Ange registreringsnummer'); return; }
    if (!/^[A-Z]{3}[0-9]{2}[A-Z0-9]$/.test(reg)) {
      setFormError('Registreringsnumret måste vara 3 bokstäver följt av 3 tecken (t.ex. ABC123)');
      return;
    }
    setFormError('');
    onSell?.(reg);
  };

  const isSellCta = topic.ctaPath === '/';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <header className="fixed top-0 inset-x-0 z-30 h-16 bg-[#0e6efe] shadow-md">
        <div className="max-w-5xl mx-auto h-full flex items-center px-5">
          <button onClick={onBack} className="flex items-center">
            <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-14 w-auto object-contain" />
          </button>
          <div className="ml-auto flex items-center gap-5">
            <button onClick={onBack} className="hidden sm:block text-[13px] text-white/80 hover:text-white font-medium transition">
              Startsidan
            </button>
            <button type="button" onClick={() => { window.history.pushState({}, '', '/bilspara'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hidden sm:block text-[13px] text-white/90 hover:text-white font-medium transition">
              Bilspara
            </button>
            <button
              onClick={onNavigateConsultation ?? (() => { window.history.pushState({}, '', '/gratis-konsultation'); window.dispatchEvent(new PopStateEvent('popstate')); })}
              className="text-[13px] text-white/80 hover:text-white font-medium transition"
            >
              Gratis konsultation
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-14 bg-[#0e6efe]">
        <div className="max-w-4xl mx-auto px-5">
          <div className="flex items-center gap-2 text-white/60 text-[13px] mb-5">
            <button onClick={onBack} className="hover:text-white transition">Bilto</button>
            <span>/</span>
            <span className="text-white">{topic.h1}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-white text-[32px] sm:text-[44px] font-bold leading-[1.05] tracking-tight">
                {topic.h1}
              </h1>
              <p className="mt-5 text-white/85 text-[15px] sm:text-[16px] leading-[1.7]">
                {topic.intro}
              </p>
              <ul className="mt-7 space-y-3">
                {topic.benefits.map(b => (
                  <li key={b.heading} className="flex items-start gap-3 text-white/90 text-[15px]">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span><strong className="font-semibold">{b.heading}</strong> – {b.body}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA card */}
            <div className="bg-white rounded-xl shadow-xl p-7">
              <h2 className="text-[18px] font-bold text-slate-900 mb-2">{topic.ctaHeading}</h2>
              <p className="text-[13px] text-slate-500 mb-5">{topic.ctaBody}</p>

              {isSellCta ? (
                <form onSubmit={handleSellSubmit} className="flex flex-col gap-3">
                  <RegInput size="sm" value={regnummer} onChange={v => { setRegnummer(v); setFormError(''); }} />
                  {formError && <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
                  <button type="submit" className="btn-primary w-full h-12 text-[15px]">
                    {topic.ctaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateConsultation ?? (() => { window.history.pushState({}, '', topic.ctaPath); window.dispatchEvent(new PopStateEvent('popstate')); })}
                  className="btn-primary w-full h-12 text-[15px]"
                >
                  {topic.ctaLabel}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <p className="mt-3 text-center text-[12px] text-slate-400">
                Gratis &middot; Ingen förpliktelse &middot; Svar inom 24h
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hur det fungerar */}
      <section className="bg-[#faf8f5] py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[26px] font-bold text-slate-900 tracking-tight mb-10">Hur fungerar det?</h2>
          <ol className="grid sm:grid-cols-3 gap-8">
            {topic.steps.map(s => (
              <li key={s.n}>
                <span className="text-[13px] font-bold text-[#0e6efe] tabular-nums">{s.n}</span>
                <h3 className="text-[17px] font-semibold text-slate-900 mt-1 mb-2">{s.heading}</h3>
                <p className="text-[14px] text-slate-600 leading-[1.6]">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Varför Bilto */}
      <section className="bg-white py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[26px] font-bold text-slate-900 tracking-tight mb-8">Varför välja Bilto?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Granskade handlare', text: 'Alla bilhandlare i Biltos nätverk är kontrollerade och godkända. Du möter bara seriösa aktörer.' },
              { icon: Clock, title: 'Snabb process', text: 'Från start till nycklarna i handen går det ofta 24–72 timmar. Vi respekterar din tid.' },
              { icon: Phone, title: 'Personlig rådgivare', text: 'En riktig person följer dig hela vägen – inte ett chatbot. Vi är alltid ett samtal bort.' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="border border-slate-100 rounded-xl p-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#0e6efe]" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-[14px] text-slate-600 leading-[1.6]">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#faf8f5] py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[26px] font-bold text-slate-900 tracking-tight mb-2">Vanliga frågor</h2>
          <p className="text-slate-500 text-[15px] mb-8">Har du fler frågor? Boka en gratis konsultation så svarar vi personligen.</p>
          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-100 px-6">
            {topic.faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* Recensioner */}
      <section className="bg-white py-16 px-5">
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

      {/* Interna SEO-länkar */}
      <section className="bg-slate-50 py-12 px-5 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[16px] font-semibold text-slate-700 mb-4">Relaterade tjänster</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Förhandla bil', path: '/forhandla-bil' },
              { label: 'Bilköpshjälp', path: '/bilkopshjalp' },
              { label: 'Spara pengar på bilköp', path: '/spara-pengar-bilkop' },
              { label: 'Sänk månadskostnad', path: '/sank-manadskostnad-bil' },
              { label: 'Byta bil', path: '/byta-bil' },
              { label: 'Bilrådgivare', path: '/bilradgivare' },
              { label: 'Gratis bilvärdering', path: '/gratis-bilvardering' },
              { label: 'Gratis konsultation', path: '/gratis-konsultation' },
            ].filter(l => l.path !== `/${topic.slug}`).map(link => (
              <a
                key={link.path}
                href={link.path}
                onClick={e => { e.preventDefault(); window.history.pushState({}, '', link.path); window.dispatchEvent(new PopStateEvent('popstate')); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-700 hover:border-[#0e6efe] hover:text-[#0e6efe] transition"
              >
                {link.label}
                <ArrowRight className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#0e6efe] py-14 px-5">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-[28px] font-bold text-white mb-3">{topic.ctaHeading}</h2>
          <p className="text-white/80 text-[15px] mb-7">{topic.ctaBody}</p>
          {isSellCta ? (
            <form onSubmit={handleSellSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
              <div className="flex-1">
                <RegInput size="sm" value={regnummer} onChange={v => { setRegnummer(v); setFormError(''); }} />
              </div>
              <button type="submit" className="h-11 px-6 rounded-xl bg-white text-[#0e6efe] font-bold text-[14px] hover:bg-slate-100 transition whitespace-nowrap inline-flex items-center gap-2">
                {topic.ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={onNavigateConsultation ?? (() => { window.history.pushState({}, '', topic.ctaPath); window.dispatchEvent(new PopStateEvent('popstate')); })}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-[#0e6efe] font-bold text-[15px] hover:bg-slate-100 transition shadow-lg"
            >
              {topic.ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {formError && <p className="mt-2 text-[12px] text-white/80">{formError}</p>}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
