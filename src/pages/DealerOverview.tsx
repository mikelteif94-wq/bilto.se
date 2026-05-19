import { useEffect, useState } from 'react';
import {
  Loader2,
  LogOut,
  Settings as SettingsIcon,
  Sparkles,
  Clock,
  ChevronRight,
  LayoutDashboard,
  Car as CarIcon,
  Gavel,
  TrendingUp,
  AlertCircle,
  Trophy,
  ArrowUpRight,
  Circle,
  CheckCircle2,
  Flame,
  Send,
  ShoppingCart,
  RefreshCw,
  Star,
  Inbox,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatKr, formatTimeLeftSimple } from '../lib/dealer-utils';

interface DealerOverviewProps {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
  onOpenCar: (id: string) => void;
  onAddCar: () => void;
  onNavigateCars: () => void;
  onNavigateSettings: () => void;
}

interface Stats {
  aktiva: number;
  endingSoon: number;
  myBidsCount: number;
  leadingCount: number;
  outbidCount: number;
  wonCount: number;
  conversionRate: number;
  avgResponseMin: number;
  dispatchedLeads: number;
}

type LeadTab = 'sell' | 'buy' | 'all';

interface DispatchedLead {
  id: string;
  response_status: string;
  deadline_at: string | null;
  message: string;
  created_at: string;
  car_id: string | null;
  quote_request_id: string | null;
  car_label: string;
  lead_type: 'sell' | 'buy';
  budget?: string;
}

interface CarLite {
  id: string;
  regnummer: string;
  marke: string;
  modell: string;
  ar: number | null;
  miltal: number;
  auktion_slut: string | null;
  status: string;
  car_images: { id: string }[];
}

interface MyBidRow {
  car_id: string;
  belopp: number;
  max_bid: number | null;
  car: CarLite | null;
  highest: number;
  isLeading: boolean;
}

const formatTimeLeft = formatTimeLeftSimple;

const DISPATCH_STATUS: Record<string, { label: string; cls: string }> = {
  sent: { label: 'Mottaget', cls: 'bg-slate-100 text-slate-600' },
  opened: { label: 'Öppnat', cls: 'bg-blue-100 text-blue-600' },
  read: { label: 'Läst', cls: 'bg-blue-100 text-blue-700' },
  replied: { label: 'Svarat', cls: 'bg-amber-100 text-amber-700' },
  offered: { label: 'Offert lämnad', cls: 'bg-green-100 text-green-700' },
  ignored: { label: 'Ej besvarat', cls: 'bg-red-100 text-red-600' },
};

export default function DealerOverview({
  dealerId,
  foretagsnamn,
  onLoggedOut,
  onOpenCar,
  onAddCar,
  onNavigateCars,
  onNavigateSettings,
}: DealerOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [stats, setStats] = useState<Stats>({
    aktiva: 0,
    endingSoon: 0,
    myBidsCount: 0,
    leadingCount: 0,
    outbidCount: 0,
    wonCount: 0,
    conversionRate: 0,
    avgResponseMin: 0,
    dispatchedLeads: 0,
  });
  const [endingCars, setEndingCars] = useState<CarLite[]>([]);
  const [myBids, setMyBids] = useState<MyBidRow[]>([]);
  const [newCars, setNewCars] = useState<CarLite[]>([]);
  const [dispatchedLeads, setDispatchedLeads] = useState<DispatchedLead[]>([]);
  const [leadTab, setLeadTab] = useState<LeadTab>('all');

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    void load();
  }, [dealerId]);

  const load = async () => {
    setLoading(true);
    const nowIso = new Date().toISOString();
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const [activeRes, endingRes, myBidsRes, wonRes, recentRes, dealerRes, dispatchRes] = await Promise.all([
      supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'aktiv').neq('sales_type', 'brokerage').eq('hidden_from_dealers', false).gt('auktion_slut', nowIso),
      supabase.from('cars').select('id, regnummer, marke, modell, ar, miltal, auktion_slut, status, car_images(id)').eq('status', 'aktiv').neq('sales_type', 'brokerage').eq('hidden_from_dealers', false).gt('auktion_slut', nowIso).lte('auktion_slut', in24h).order('auktion_slut', { ascending: true }).limit(8),
      supabase.from('bids').select('car_id, belopp, max_bid, cars:car_id(id, regnummer, marke, modell, ar, miltal, auktion_slut, status, car_images(id))').eq('dealer_id', dealerId).order('created_at', { ascending: false }),
      supabase.from('bids').select('id', { count: 'exact', head: true }).eq('dealer_id', dealerId).eq('status', 'vinnande'),
      supabase.from('cars').select('id, regnummer, marke, modell, ar, miltal, auktion_slut, status, car_images(id)').eq('status', 'aktiv').neq('sales_type', 'brokerage').eq('hidden_from_dealers', false).gt('auktion_slut', nowIso).order('created_at', { ascending: false }).limit(6),
      supabase.from('dealers').select('win_count, lost_count, avg_response_minutes, conversion_rate').eq('id', dealerId).maybeSingle(),
      supabase.from('dealer_dispatches').select(`
        id, car_id, quote_request_id, response_status, deadline_at, message, created_at,
        cars(regnummer, marke, modell, ar),
        quote_requests(car_model, budget, search_option)
      `).eq('dealer_id', dealerId).order('created_at', { ascending: false }).limit(50),
    ]);

    setEndingCars((endingRes.data ?? []) as unknown as CarLite[]);
    setNewCars((recentRes.data ?? []) as unknown as CarLite[]);

    // Process dispatched leads
    const dLeads: DispatchedLead[] = (dispatchRes.data ?? []).map((d: any) => {
      const car = Array.isArray(d.cars) ? d.cars[0] : d.cars;
      const quote = Array.isArray(d.quote_requests) ? d.quote_requests[0] : d.quote_requests;
      const isSell = !!d.car_id;
      return {
        id: d.id,
        response_status: d.response_status,
        deadline_at: d.deadline_at,
        message: d.message,
        created_at: d.created_at,
        car_id: d.car_id,
        quote_request_id: d.quote_request_id,
        lead_type: isSell ? 'sell' : 'buy',
        car_label: isSell
          ? [car?.marke, car?.modell, car?.ar].filter(Boolean).join(' ') || car?.regnummer || '—'
          : (quote?.car_model || 'Bil sökes'),
        budget: quote?.budget,
      };
    });
    setDispatchedLeads(dLeads);

    const myBidRowsRaw = (myBidsRes.data ?? []) as unknown as Array<{
      car_id: string;
      belopp: number;
      max_bid: number | null;
      cars: CarLite | null;
    }>;

    const byCar = new Map<string, { belopp: number; max_bid: number | null; car: CarLite | null }>();
    for (const r of myBidRowsRaw) {
      const cur = byCar.get(r.car_id);
      if (!cur || r.belopp > cur.belopp) {
        byCar.set(r.car_id, { belopp: r.belopp, max_bid: r.max_bid, car: r.cars });
      }
    }

    const carIds = Array.from(byCar.keys());
    let highestByCar: Record<string, number> = {};
    if (carIds.length > 0) {
      const { data: allBids } = await supabase.from('bids').select('car_id, belopp').in('car_id', carIds);
      (allBids ?? []).forEach((b) => {
        const bid = b as unknown as { car_id: string; belopp: number };
        const cur = highestByCar[bid.car_id] ?? 0;
        if (bid.belopp > cur) highestByCar[bid.car_id] = bid.belopp;
      });
    }

    const rows: MyBidRow[] = Array.from(byCar.entries()).map(([carId, v]) => {
      const highest = highestByCar[carId] ?? v.belopp;
      return { car_id: carId, belopp: v.belopp, max_bid: v.max_bid, car: v.car, highest, isLeading: v.belopp >= highest };
    });

    const activeRows = rows.filter(
      (r) => r.car && r.car.status === 'aktiv' && r.car.auktion_slut && new Date(r.car.auktion_slut).getTime() > Date.now(),
    );

    const dealerData = dealerRes.data;

    setMyBids(activeRows.slice(0, 8));
    setStats({
      aktiva: activeRes.count ?? 0,
      endingSoon: endingRes.data?.length ?? 0,
      myBidsCount: activeRows.length,
      leadingCount: activeRows.filter((r) => r.isLeading).length,
      outbidCount: activeRows.filter((r) => !r.isLeading).length,
      wonCount: wonRes.count ?? 0,
      conversionRate: dealerData?.conversion_rate ?? 0,
      avgResponseMin: dealerData?.avg_response_minutes ?? 0,
      dispatchedLeads: dLeads.length,
    });

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  const initials = foretagsnamn
    ? foretagsnamn.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <header className="bg-[#0e6efe] h-14 sm:h-16 flex items-center px-3 sm:px-5 lg:px-8 sticky top-0 z-20 gap-2">
        <a href="/" className="flex items-center shrink-0">
          <img src="/ChatGPT_Image_9_maj_2026_15_33_44.png" alt="Bilto" className="h-20 sm:h-28 w-auto object-contain" />
        </a>
        <nav className="flex items-center gap-0.5 ml-1 sm:ml-4">
          <button className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-medium text-white bg-white/20">
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Översikt</span>
          </button>
          <button
            onClick={onNavigateCars}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-sm font-medium text-white/75 hover:text-white hover:bg-white/10 transition"
          >
            <CarIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Aktiva uppdrag</span>
            {stats.aktiva > 0 && (
              <span className="hidden sm:inline-flex h-4 min-w-[16px] px-1 rounded-full bg-white/20 text-white text-[10px] font-bold items-center justify-center">
                {stats.aktiva}
              </span>
            )}
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm font-medium text-white/90 truncate max-w-[180px]">{foretagsnamn}</span>
          </div>
          <button
            onClick={onAddCar}
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white text-[#0e6efe] hover:bg-white/90 text-sm font-semibold transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Få bud på en bil
          </button>
          <button onClick={onNavigateSettings} className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition" title="Inställningar">
            <SettingsIcon className="w-4 h-4" />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logga ut</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6">

        {/* Page title + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Översikt</h1>
            <p className="text-sm text-slate-500 mt-1">
              {foretagsnamn ? `Välkommen, ${foretagsnamn}.` : 'Realtidsbild av dina pågående bud.'}
            </p>
          </div>
          <button
            onClick={onAddCar}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold transition shadow-sm shrink-0 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Få bud på en bil
          </button>
        </div>

        {loading ? (
          <div className="py-32 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-slate-300" />
          </div>
        ) : (
          <>
            {/* Outbid alert */}
            {stats.outbidCount > 0 && (
              <button
                onClick={onNavigateCars}
                className="w-full flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-left hover:bg-red-100 transition"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-red-900">
                    Du är överbjuden på {stats.outbidCount} {stats.outbidCount === 1 ? 'auktion' : 'auktioner'}
                  </div>
                  <div className="text-xs text-red-700 mt-0.5">Höj ditt bud innan auktionen stänger</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-red-500 shrink-0" />
              </button>
            )}

            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <KpiCard
                label="Aktiva auktioner"
                value={stats.aktiva}
                icon={<CarIcon className="w-4 h-4" />}
                iconBg="bg-[#0e6efe]/10 text-[#0e6efe]"
                onClick={onNavigateCars}
              />
              <KpiCard
                label="Slutar inom 24 h"
                value={stats.endingSoon}
                icon={<Clock className="w-4 h-4" />}
                iconBg={stats.endingSoon > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}
                highlight={stats.endingSoon > 0}
                highlightColor="amber"
              />
              <KpiCard
                label="Mina aktiva bud"
                value={stats.myBidsCount}
                icon={<Gavel className="w-4 h-4" />}
                iconBg="bg-slate-100 text-slate-600"
              />
              <KpiCard
                label="Vunna affärer"
                value={stats.wonCount}
                icon={<Trophy className="w-4 h-4" />}
                iconBg="bg-emerald-50 text-emerald-600"
              />
            </div>

            {/* Extended KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatusPill icon={<Circle className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />} label="Leder" value={stats.leadingCount} valueColor={stats.leadingCount > 0 ? 'text-emerald-700' : 'text-slate-900'} />
              <StatusPill icon={<Circle className="w-2.5 h-2.5 fill-red-400 text-red-400" />} label="Överbjuden" value={stats.outbidCount} valueColor={stats.outbidCount > 0 ? 'text-red-600' : 'text-slate-900'} />
              <StatusPill icon={<Circle className="w-2.5 h-2.5 fill-sky-400 text-sky-400" />} label="Nya bilar" value={newCars.length} valueColor="text-slate-900" />
              <StatusPill icon={<Circle className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />} label="Slutar snart" value={endingCars.length} valueColor="text-slate-900" />
              <StatusPill icon={<Circle className="w-2.5 h-2.5 fill-blue-400 text-blue-400" />} label="Mottagna leads" value={stats.dispatchedLeads} valueColor="text-slate-900" />
              <StatusPill
                icon={<Circle className="w-2.5 h-2.5 fill-purple-400 text-purple-400" />}
                label={stats.avgResponseMin > 0 ? `Svarstid ${stats.avgResponseMin}m` : 'Svarstid'}
                value={stats.conversionRate ? Math.round(stats.conversionRate) : 0}
                valueColor="text-slate-900"
                suffix="%"
              />
            </div>

            {/* Dispatched leads panel */}
            {dispatchedLeads.length > 0 && (
              <div>
                <SectionHeader
                  title={
                    <span className="flex items-center gap-2">
                      <Inbox className="w-4 h-4 text-blue-500" />
                      Mina leads
                    </span>
                  }
                  action={undefined}
                />
                {/* Lead type tabs */}
                <div className="flex gap-1 mb-3">
                  {([
                    { key: 'all' as LeadTab, label: 'Alla', count: dispatchedLeads.length },
                    { key: 'sell' as LeadTab, label: 'Säljleads', count: dispatchedLeads.filter((d) => d.lead_type === 'sell').length },
                    { key: 'buy' as LeadTab, label: 'Köpleads', count: dispatchedLeads.filter((d) => d.lead_type === 'buy').length },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setLeadTab(tab.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        leadTab === tab.key
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label} <span className={leadTab === tab.key ? 'text-slate-300' : 'text-slate-400'}>{tab.count}</span>
                    </button>
                  ))}
                </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {dispatchedLeads
                    .filter((d) => leadTab === 'all' || d.lead_type === leadTab)
                    .map((lead) => {
                      const status = DISPATCH_STATUS[lead.response_status] ?? DISPATCH_STATUS.sent;
                      const isOverdue = lead.deadline_at && new Date(lead.deadline_at) < new Date() && !['replied', 'offered'].includes(lead.response_status);
                      const deadlineDiff = lead.deadline_at ? new Date(lead.deadline_at).getTime() - Date.now() : null;
                      const deadlineLabel = deadlineDiff == null ? null : deadlineDiff < 0 ? 'Förfallen' : `${Math.floor(deadlineDiff / 3600000)}h kvar`;
                      return (
                        <div
                          key={lead.id}
                          className={`px-4 py-3.5 ${isOverdue ? 'bg-red-50' : ''} ${lead.car_id ? 'cursor-pointer hover:bg-slate-50' : ''} transition`}
                          onClick={() => lead.car_id && onOpenCar(lead.car_id)}
                        >
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lead.lead_type === 'buy' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                {lead.lead_type === 'buy' ? 'Köplead' : 'Säljlead'}
                              </span>
                              <span className="font-semibold text-sm text-slate-900">{lead.car_label}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${status.cls}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {lead.budget && <span>Budget: {lead.budget}</span>}
                            {deadlineLabel && (
                              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>{deadlineLabel}</span>
                            )}
                            <span className="ml-auto">{new Date(lead.created_at).toLocaleDateString('sv-SE')}</span>
                          </div>
                          {lead.message && (
                            <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">{lead.message}</p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Main two-col */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Ending soon */}
              <div>
                <SectionHeader
                  title={
                    <span className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      Slutar snart
                    </span>
                  }
                  action={endingCars.length > 0 ? <NavLink label="Visa alla" onClick={onNavigateCars} /> : undefined}
                />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {endingCars.length === 0 ? (
                    <EmptyState icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} text="Inga auktioner slutar inom 24 h" />
                  ) : (
                    endingCars.map((c) => {
                      const ms = c.auktion_slut ? new Date(c.auktion_slut).getTime() - now : Infinity;
                      const urgent = ms < 3 * 3600000;
                      return (
                        <button
                          key={c.id}
                          onClick={() => onOpenCar(c.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition group"
                        >
                          <div className={`w-1.5 h-8 rounded-full shrink-0 ${urgent ? 'bg-red-400' : 'bg-amber-300'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {[c.marke, c.modell].filter(Boolean).join(' ') || c.regnummer}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {c.regnummer} · {c.ar || '—'} · {c.miltal.toLocaleString('sv-SE')} mil
                            </div>
                          </div>
                          <span className={`text-xs font-semibold shrink-0 ${urgent ? 'text-red-600' : 'text-amber-700'}`}>
                            {formatTimeLeft(c.auktion_slut, now)}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:text-slate-400 transition" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* My bids */}
              <div>
                <SectionHeader
                  title="Mina aktiva bud"
                  action={stats.myBidsCount > 0 ? <NavLink label="Visa alla" onClick={onNavigateCars} /> : undefined}
                />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {myBids.length === 0 ? (
                    <EmptyState icon={<Gavel className="w-5 h-5 text-slate-300" />} text="Du har inga aktiva bud just nu" />
                  ) : (
                    myBids.map((b) => (
                      <button
                        key={b.car_id}
                        onClick={() => onOpenCar(b.car_id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${b.isLeading ? 'bg-emerald-50' : 'bg-red-50'}`}>
                          {b.isLeading
                            ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                            : <AlertCircle className="w-4 h-4 text-red-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {b.car ? [b.car.marke, b.car.modell].filter(Boolean).join(' ') || b.car.regnummer : '—'}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {b.car?.regnummer} · Ditt bud: {formatKr(b.belopp)} kr
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-xs font-bold ${b.isLeading ? 'text-emerald-700' : 'text-red-600'}`}>
                            {b.isLeading ? 'Leder' : 'Överbjuden'}
                          </div>
                          {!b.isLeading && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Högsta: {formatKr(b.highest)} kr
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:text-slate-400 transition" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* New listings feed */}
            {newCars.length > 0 && (
              <div>
                <SectionHeader
                  title="Nyligen inlagda bilar"
                  action={<NavLink label="Visa alla" onClick={onNavigateCars} />}
                />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {newCars.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onOpenCar(c.id)}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-slate-50 transition group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <CarIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {[c.marke, c.modell].filter(Boolean).join(' ') || c.regnummer}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {c.regnummer} · {c.ar || '—'} · {c.miltal.toLocaleString('sv-SE')} mil
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {c.auktion_slut && (
                          <span className="text-xs text-slate-500">
                            {formatTimeLeft(c.auktion_slut, now)} kvar
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {c.car_images.length} foto{c.car_images.length !== 1 ? 'n' : ''}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:text-slate-400 transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function KpiCard({
  label, value, icon, iconBg, onClick, highlight, highlightColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  onClick?: () => void;
  highlight?: boolean;
  highlightColor?: 'amber' | 'red';
}) {
  const Tag = onClick ? 'button' : 'div';
  const ringMap = { amber: 'border-amber-300 ring-1 ring-amber-200', red: 'border-red-300 ring-1 ring-red-200' };
  const valMap = { amber: 'text-amber-700', red: 'text-red-600' };
  return (
    <Tag
      onClick={onClick}
      className={`text-left bg-white border rounded-xl p-4 sm:p-5 transition ${
        onClick ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : ''
      } ${highlight && highlightColor ? ringMap[highlightColor] : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
        {onClick && <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />}
      </div>
      <div className={`text-2xl sm:text-3xl font-bold leading-none tabular-nums ${highlight && highlightColor ? valMap[highlightColor] : 'text-slate-900'}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1.5">{label}</div>
    </Tag>
  );
}

function StatusPill({ icon, label, value, valueColor, suffix }: { icon: React.ReactNode; label: string; value: number; valueColor: string; suffix?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div>
        <div className="text-[11px] text-slate-500 leading-none">{label}</div>
        <div className={`text-lg font-semibold mt-0.5 ${valueColor}`}>{value}{suffix}</div>
      </div>
    </div>
  );
}

function SectionHeader({ title, action }: { title: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {action}
    </div>
  );
}

function NavLink({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="text-xs font-semibold text-[#0e6efe] hover:underline">
      {label}
    </button>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      {icon}
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
