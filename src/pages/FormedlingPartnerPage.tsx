import { ArrowRight, Handshake, ShieldCheck, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import { setPageMeta } from '../lib/pageMeta';
import { useEffect } from 'react';

export default function FormedlingPartnerPage() {
  useEffect(() => { setPageMeta({ title: 'För förmedlare — få fler bilar att sälja | Bilto', description: 'Få tillgång till bilägare som aktivt söker professionell hjälp med sin bilförsäljning. Ingen månadsavgift — betala endast när bilen säljs.', canonical: 'https://bilto.se/formedling/partner' }); }, []);

  return <div className="min-h-screen bg-[#faf8f5]">
    <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-5 lg:px-10">
      <a href="/formedling" className="text-[21px] font-black text-slate-900">Bilto<span className="text-bilto-500">.</span></a>
      <a href="/formedling/forhandlare" className="text-[14px] font-medium text-slate-600 hover:text-slate-900">Logga in</a>
    </header>
    <main>
      <section className="px-5 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="section-label mb-5">För förmedlare</p>
            <h1 className="text-[42px] sm:text-[64px] font-black leading-[.98] tracking-[-.04em] text-slate-900">Få fler bilar att sälja.</h1>
            <p className="text-[17px] text-slate-500 leading-relaxed mt-7 max-w-md">Få tillgång till bilägare som aktivt söker professionell hjälp med sin bilförsäljning.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-9">
              <a href="/formedling/forhandlare" className="btn-primary h-13 px-7 text-[15px]">Bli förmedlingspartner <ArrowRight className="w-4 h-4" /></a>
              <a href="#hur" className="h-13 px-7 rounded-md border border-slate-200 text-slate-700 font-semibold text-[15px] inline-flex items-center justify-center hover:bg-slate-50 transition">Se hur det fungerar</a>
            </div>
          </div>
          <div className="card-base p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-md bg-bilto-50 flex items-center justify-center"><Handshake className="w-6 h-6 text-bilto-500" /></div>
              <div><p className="font-bold text-slate-900">Din partnerportal</p><p className="text-[13px] text-slate-400">Nya möjligheter varje vecka</p></div>
            </div>
            {[['Nya matchade bilar','12'],['Aktiva erbjudanden','8'],['Sålda denna månad','12']].map(([l,v]) => (
              <div key={l} className="flex justify-between py-4 border-t border-slate-100"><span className="text-[14px] text-slate-500">{l}</span><span className="font-bold text-slate-900">{v}</span></div>
            ))}
          </div>
        </div>
      </section>
      <section id="hur" className="bg-white border-y border-slate-100 px-5 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="section-label mb-4">Därför Bilto</p>
          <h2 className="text-[36px] sm:text-[48px] font-black tracking-tight text-slate-900 mb-14">En enklare väg till fler uppdrag.</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {icon: Sparkles, title:'Ingen månadsavgift', text:'Du betalar endast när bilen faktiskt säljs.'},
              {icon: TrendingUp, title:'Välj själv', text:'Lämna erbjudanden på de bilar som passar er verksamhet.'},
              {icon: Wallet, title:'Tydlig ekonomi', text:'Se avgift, beräknad intäkt och uppdragets villkor innan du skickar.'},
            ].map(c => { const Icon = c.icon; return (
              <div key={c.title} className="card-base p-7">
                <div className="w-10 h-10 rounded-md bg-bilto-50 flex items-center justify-center mb-5"><Icon className="w-5 h-5 text-bilto-500" /></div>
                <h3 className="text-[18px] font-bold text-slate-900 mb-2">{c.title}</h3>
                <p className="text-[15px] text-slate-500 leading-relaxed">{c.text}</p>
              </div>
            ); })}
          </div>
        </div>
      </section>
      <section className="px-5 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <ShieldCheck className="w-10 h-10 text-bilto-500 mx-auto mb-5" />
          <h2 className="text-[36px] font-black text-slate-900">Redo att växa med oss?</h2>
          <p className="text-slate-500 mt-4">Ansök om att bli partner och börja se matchade bilar i portalen.</p>
          <a href="/formedling/forhandlare" className="btn-primary h-12 px-7 mt-8 text-[15px]">Öppna partnerdemo <ArrowRight className="w-4 h-4" /></a>
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>;
}
