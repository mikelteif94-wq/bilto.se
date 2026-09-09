import { ArrowRight, Check } from 'lucide-react';
import { setPageMeta } from '../lib/pageMeta';
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
      <header className="h-14 border-b border-slate-200 flex items-center px-5 sticky top-0 bg-[#faf8f5] z-30">
        <a href="/formedling" className="text-[18px] font-bold text-slate-900">Bilto</a>
        <span className="ml-2 text-[12px] text-slate-400">Förmedlare</span>
        <div className="ml-auto">
          <a href="/formedling/forhandlare" className="text-[13px] text-slate-500 hover:text-slate-900 transition">
            Öppna portalen
          </a>
        </div>
      </header>

      <main className="flex-1 px-5 py-16">
        <div className="max-w-lg mx-auto text-center">
          <p className="section-label mb-4">För förmedlare</p>
          <h1 className="font-black tracking-[-0.02em] text-slate-900 leading-[1.05] mb-4" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)' }}>
            Få fler bilar att sälja.
          </h1>
          <p className="text-slate-500 text-[16px] leading-relaxed mb-10">
            Få tillgång till bilägare som aktivt söker professionell hjälp med sin bilförsäljning. Ingen månadsavgift — betala endast när bilen säljs.
          </p>
          <a
            href="/formedling/forhandlare"
            className="btn-primary h-12 px-8 text-[15px]"
          >
            Bli förmedlingspartner
            <ArrowRight className="w-4 h-4" />
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

      <footer className="border-t border-slate-200 py-8 px-5 text-center">
        <p className="text-[13px] text-slate-400">Detta är en demo med påhittad data.</p>
      </footer>
    </div>
  );
}
