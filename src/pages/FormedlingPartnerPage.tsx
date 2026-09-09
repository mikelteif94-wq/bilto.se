import { ArrowRight, Check } from 'lucide-react';
import { setPageMeta } from '../lib/pageMeta';
import { SiteFooter } from '../components/SiteFooter';
import { useEffect } from 'react';

export default function FormedlingPartnerPage() {
  useEffect(() => {
    setPageMeta({
      title: 'För förmedlare — få fler bilar att sälja | Bilto',
      description: 'Få tillgång till bilägare som aktivt söker professionell hjälp med sin bilförsäljning.',
      canonical: 'https://bilto.se/formedling/partner',
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col">
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-14 lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <a href="/formedling" className="shrink-0 flex items-center">
            <img src="/a_clean_graphic_logo_on_a_transparent_background.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </a>
          <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white/80">Förmedlare</span>
          <div className="ml-auto flex items-center gap-3">
            <a href="/formedling/forhandlare" className="inline-flex items-center bg-white text-[#0e6efe] text-[13px] font-semibold px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">
              Öppna portalen
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-28 pb-16">
        <div className="max-w-lg mx-auto text-center">
          <p className="section-label mb-4">För förmedlare</p>
          <h1 className="font-black tracking-[-0.02em] text-slate-900 leading-[1.05] mb-4" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)' }}>
            Få fler bilar att sälja.
          </h1>
          <p className="text-slate-500 text-[16px] leading-relaxed mb-10">
            Få tillgång till bilägare som aktivt söker professionell hjälp med sin bilförsäljning. Ingen månadsavgift — betala endast när bilen säljs.
          </p>
          <a href="/formedling/forhandlare" className="btn-primary h-12 px-8 text-[15px]">
            Bli förmedlingspartner <ArrowRight className="w-4 h-4" />
          </a>

          <div className="mt-16 space-y-4 text-left">
            {[
              'Ingen månadsavgift — du betalar när bilen säljs',
              'Välj själv vilka bilar du lämnar erbjudande på',
              'Se avgift, beräknad intäkt och villkor innan du skickar',
            ].map(t => (
              <div key={t} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-bilto-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                <span className="text-[15px] text-slate-600">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
