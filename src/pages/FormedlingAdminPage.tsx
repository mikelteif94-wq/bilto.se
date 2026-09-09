import { Activity, ArrowLeft, BarChart3, Building2, Car, CheckCircle2, DollarSign, FileText } from 'lucide-react';
import { DEMO_ADMIN_STATS, formatSEK } from '../lib/formedling-data';

export default function FormedlingAdminPage() {
  const metrics = [
    { label:'Inkomna bilar', value:DEMO_ADMIN_STATS.incomingVehicles, icon:Car },
    { label:'Aktiva förmedlare', value:DEMO_ADMIN_STATS.activeDealers, icon:Building2 },
    { label:'Erbjudanden', value:DEMO_ADMIN_STATS.offers, icon:FileText },
    { label:'Accepterade erbjudanden', value:DEMO_ADMIN_STATS.acceptedOffers, icon:CheckCircle2 },
    { label:'Sålda bilar', value:DEMO_ADMIN_STATS.sold, icon:Activity },
    { label:'Platform revenue', value:formatSEK(DEMO_ADMIN_STATS.platformRevenue), icon:DollarSign },
  ];
  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-5 lg:px-10">
        <div className="flex items-center gap-3">
          <span className="text-[20px] font-black text-slate-900">Bilto<span className="text-bilto-500">.</span></span>
          <span className="text-[12px] text-slate-400">Admin · Förmedling</span>
        </div>
        <a href="/formedling" className="text-[13px] text-slate-500 hover:text-slate-900 flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Publik sida</a>
      </header>
      <main className="max-w-7xl mx-auto p-5 lg:p-8">
        <div className="mb-8">
          <p className="section-label mb-2">Översikt</p>
          <h1 className="text-[30px] font-black text-slate-900">Förmedlingsplattformen</h1>
          <p className="text-[15px] text-slate-500 mt-2">Demo-data — alla siffror är fiktiva.</p>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-8">
          {metrics.map(m => { const Icon = m.icon; return (
            <div key={m.label} className="card-base p-5">
              <Icon className="w-5 h-5 text-bilto-500 mb-4" />
              <p className="text-[24px] font-black text-slate-900 break-words">{m.value}</p>
              <p className="text-[12px] text-slate-500 mt-1">{m.label}</p>
            </div>
          ); })}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-base p-6">
            <div className="flex items-center gap-2 mb-6"><BarChart3 className="w-5 h-5 text-bilto-500" /><h2 className="text-[17px] font-bold text-slate-900">Nyckeltal</h2></div>
            <div className="space-y-5">
              {[['Offer rate',`${DEMO_ADMIN_STATS.offerRate} %`],['Genomsnittlig plattformsavgift',formatSEK(DEMO_ADMIN_STATS.avgPlatformFee)],['Genomsnittliga dagar till försäljning',`${DEMO_ADMIN_STATS.avgDaysToSale} dagar`],['GMV',formatSEK(DEMO_ADMIN_STATS.gmv)]].map(([l,v]) => (
                <div key={l} className="flex justify-between border-b border-slate-100 pb-4"><span className="text-[14px] text-slate-500">{l}</span><span className="font-bold text-slate-900">{v}</span></div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900 text-white rounded-md p-6">
            <h2 className="text-[18px] font-bold">Plattformens flöde</h2>
            <p className="text-[14px] text-white/45 leading-relaxed mt-3">En bilägare lägger in bilen en gång. Plattformen matchar bilen mot relevanta verifierade förmedlare.</p>
            <div className="space-y-3 mt-7">
              {['Bil registrerad','Förmedlare matchade','Erbjudande accepterat','Bil såld'].map((x,i) => (
                <div key={x} className="flex items-center gap-3 text-[13px] text-white/70"><div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[11px]">{i+1}</div>{x}</div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
