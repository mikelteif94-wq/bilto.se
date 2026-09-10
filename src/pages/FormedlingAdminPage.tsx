import { SiteFooter } from '../components/SiteFooter';
import { DEALERS, VEHICLES, getOffersForVehicle, formatSEK } from '../lib/formedling-data';

export default function FormedlingAdminPage() {
  const totalOffers = ['v1', 'v2', 'v3'].reduce((sum, id) => sum + getOffersForVehicle(id).length, 0);

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col">
      <header className="fixed top-3 inset-x-3 lg:top-4 lg:inset-x-32 z-30 h-14 lg:h-16 rounded-xl shadow-lg ring-1 ring-white/10 bg-[#0e6efe]">
        <div className="max-w-[1400px] mx-auto h-full flex items-center px-5 lg:px-8">
          <a href="/formedling" className="shrink-0 flex items-center">
            <img src="/a_clean_graphic_logo_on_a_transparent_background.png" alt="Bilto" className="h-20 lg:h-32 w-auto object-contain" fetchPriority="high" decoding="async" />
          </a>
          <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white/80">Admin</span>
          <div className="ml-auto flex items-center gap-3">
            <a href="/formedling" className="inline-flex items-center bg-white text-[#0e6efe] text-[13px] font-semibold px-[18px] h-9 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">
              Till publik sida
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-28 pb-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-[24px] font-bold text-slate-900 mb-2">Förmedlingsplattformen</h1>
          <p className="text-slate-500 text-[15px] mb-8">Demo-data — alla siffror är fiktiva.</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Stat label="Bilar" value={String(VEHICLES.length)} />
            <Stat label="Förmedlare" value={String(DEALERS.length)} />
            <Stat label="Erbjudanden" value={String(totalOffers)} />
            <Stat label="Aktiva uppdrag" value="2" />
          </div>

          <div className="card-base overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
              Förmedlare
            </div>
            {DEALERS.map(d => (
              <div key={d.id} className="px-5 py-4 border-t border-slate-100 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-600">
                  {d.initials}
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-slate-900">{d.name}</p>
                  <p className="text-[12px] text-slate-500">{d.city} · {d.completedSales} försäljningar</p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-semibold text-slate-900">{d.avgAchievedPct} %</p>
                  <p className="text-[11px] text-slate-400">uppnått pris</p>
                </div>
                {d.overpromiser && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
                    Lovar för mycket
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-base p-5">
      <p className="text-[12px] text-slate-400">{label}</p>
      <p className="text-[24px] font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
