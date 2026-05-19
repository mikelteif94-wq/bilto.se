import { useEffect, useState } from 'react';
import {
  Loader2,
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
  CheckCircle2,
  Flame,
  Inbox,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatKr, formatTimeLeftSimple } from '../lib/dealer-utils';
import PortalLayout from '../components/PortalLayout';

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

  const navItems = [
    { icon: <LayoutDashboard className="w-[18px] h-[18px]" />, label: 'Översikt', active: true, onClick: undefined },
    { icon: <CarIcon className="w-[18px] h-[18px]" />, label: 'Aktiva uppdrag', onClick: onNavigateCars, badge: stats.aktiva || undefined },
    { icon: <SettingsIcon className="w-[18px] h-[18px]" />, label: 'Inställningar', onClick: onNavigateSettings },
  ];

  const headerAction = (
    <button
      onClick={onAddCar}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-sm font-semibold transition shadow-sm"
    >
      <Sparkles className="w-4 h-4" />
      <span className="hidden sm:inline">Få bud på en bil</span>
    </button>
  );

  return (
    <PortalLayout
      navItems={navItems}
      identity={foretagsnamn}
      identityRole="Handlare"
      onLogout={handleLogout}
      headerAction={headerAction}
      pageTitle="Översikt"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Översikt</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {foretagsnamn ? foretagsnamn : 'Realtidsbild av dina pågående bud.'}
            </p>
          </div>
          <button
            onClick={onAddCar}
            className="sm:hidden inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white font-semibold transition shadow-sm text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Få bud på bil
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
                className="w-full flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 text-left hover:bg-red-100 transition"
              >
                <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-red-900">
                    Du är överbjuden på {stats.outbidCount} {stats.outbidCount === 1 ? 'auktion' : 'auktioner'}
                  </div>
                  <div className="text-xs text-red-700/70 mt-0.5">Höj ditt bud innan auktionen stänger</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-red-500 shrink-0" />
              </button>
            )}

            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <DealerKpiCard
                label="Aktiva auktioner"
                value={stats.aktiva}
                icon={<CarIcon className="w-4 h-4" />}
                topColor="bg-[#0e6efe]"
                iconCls="bg-[#0e6efe]/10 text-[#0e6efe]"
                onClick={onNavigateCars}
              />
              <DealerKpiCard
                label="Slutar inom 24 h"
                value={stats.endingSoon}
                icon={<Clock className="w-4 h-4" />}
                topColor={stats.endingSoon > 0 ? 'bg-amber-400' : 'bg-slate-200'}
                iconCls={stats.endingSoon > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}
                highlight={stats.endingSoon > 0}
              />
              <DealerKpiCard
                label="Mina aktiva bud"
                value={stats.myBidsCount}
                icon={<Gavel className="w-4 h-4" />}
                topColor="bg-slate-300"
                iconCls="bg-slate-100 text-slate-600"
              />
              <DealerKpiCard
                label="Vunna affärer"
                value={stats.wonCount}
                icon={<Trophy className="w-4 h-4" />}
                topColor="bg-emerald-500"
                iconCls="bg-emerald-50 text-emerald-600"
              />
            </div>

            {/* Secondary stats */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-slate-100">
                {[
                  { label: 'Leder', value: stats.leadingCount, icon: <TrendingUp className="w-3.5 h-3.5" />, iconCls: 'text-emerald-500', valCls: stats.leadingCount > 0 ? 'text-emerald-700' : 'text-slate-900' },
                  { label: 'Överbjuden', value: stats.outbidCount, icon: <AlertCircle className="w-3.5 h-3.5" />, iconCls: 'text-red-500', valCls: stats.outbidCount > 0 ? 'text-red-600' : 'text-slate-900' },
                  { label: 'Nya bilar', value: newCars.length, icon: <Zap className="w-3.5 h-3.5" />, iconCls: 'text-sky-500', valCls: 'text-slate-900' },
                  { label: 'Slutar snart', value: endingCars.length, icon: <Flame className="w-3.5 h-3.5" />, iconCls: 'text-amber-500', valCls: 'text-slate-900' },
                  { label: 'Mottagna leads', value: stats.dispatchedLeads, icon: <Inbox className="w-3.5 h-3.5" />, iconCls: 'text-blue-500', valCls: 'text-slate-900' },
                  { label: stats.avgResponseMin > 0 ? `Svarstid ${stats.avgResponseMin}m` : 'Konvertering', value: stats.conversionRate ? Math.round(stats.conversionRate) : 0, icon: <Trophy className="w-3.5 h-3.5" />, iconCls: 'text-slate-400', valCls: 'text-slate-900', suffix: '%' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2.5 px-4 py-3.5">
                    <span className={s.iconCls}>{s.icon}</span>
                    <div>
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-none">{s.label}</div>
                      <div className={`text-lg font-bold mt-0.5 tabular-nums ${s.valCls}`}>{s.value}{'suffix' in s ? s.suffix : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispatched leads panel */}
            {dispatchedLeads.length > 0 && (
              <div>
                <SectionLabel text="Mina leads" icon={<Inbox className="w-3.5 h-3.5 text-blue-500" />} />
                <div className="flex gap-1.5 mb-3">
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
                      {tab.label}{' '}
                      <span className={`tabular-nums ${leadTab === tab.key ? 'text-slate-300' : 'text-slate-400'}`}>{tab.count}</span>
                    </button>
                  ))}
                </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
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
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`shrink-0 inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${lead.lead_type === 'buy' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                {lead.lead_type === 'buy' ? 'Köplead' : 'Säljlead'}
                              </span>
                              <span className="font-semibold text-sm text-slate-900 truncate">{lead.car_label}</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${status.cls}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            {lead.budget && <span>Budget: {lead.budget}</span>}
                            {deadlineLabel && (
                              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>{deadlineLabel}</span>
                            )}
                            <span className="ml-auto text-slate-400">{new Date(lead.created_at).toLocaleDateString('sv-SE')}</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Ending soon */}
              <div>
                <SectionLabel
                  text="Slutar snart"
                  icon={<Flame className="w-3.5 h-3.5 text-amber-500" />}
                  action={endingCars.length > 0 ? <NavLink label="Visa alla" onClick={onNavigateCars} /> : undefined}
                />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                  {endingCars.length === 0 ? (
                    <EmptyState icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} text="Inga auktioner slutar inom 24 h" />
                  ) : (
                    endingCars.map((c) => {
                      const ms = c.auktion_slut ? new Date(c.auktion_slut).getTime() - now : Infinity;
                      const critical = ms < 3600000;
                      const urgent = ms < 3 * 3600000;
                      return (
                        <button
                          key={c.id}
                          onClick={() => onOpenCar(c.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition group"
                        >
                          <div className="relative shrink-0">
                            <div className={`w-2 h-8 rounded-full ${critical ? 'bg-red-400' : urgent ? 'bg-amber-400' : 'bg-slate-200'}`} />
                            {critical && <div className="absolute inset-0 w-2 rounded-full bg-red-400 animate-pulse" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {[c.marke, c.modell].filter(Boolean).join(' ') || c.regnummer}
                            </div>
                            <div className="text-xs font-mono text-slate-400 mt-0.5">
                              {c.regnummer} · {c.ar || '—'} · {c.miltal.toLocaleString('sv-SE')} mil
                            </div>
                          </div>
                          <span className={`text-xs font-bold shrink-0 tabular-nums ${critical ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-slate-500'}`}>
                            {formatTimeLeft(c.auktion_slut, now)}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition shrink-0" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* My bids */}
              <div>
                <SectionLabel
                  text="Mina aktiva bud"
                  icon={<Gavel className="w-3.5 h-3.5 text-slate-400" />}
                  action={stats.myBidsCount > 0 ? <NavLink label="Visa alla" onClick={onNavigateCars} /> : undefined}
                />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
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
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-400">{b.car?.regnummer}</span>
                            <span className="text-slate-200">·</span>
                            <span className="text-xs font-semibold text-slate-700">{formatKr(b.belopp)} kr</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${b.isLeading ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                            {b.isLeading ? 'Leder' : 'Överbjuden'}
                          </span>
                          {!b.isLeading && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              Högsta: {formatKr(b.highest)} kr
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* New listings feed */}
            {newCars.length > 0 && (
              <div>
                <SectionLabel text="Nyligen inlagda bilar" icon={<Zap className="w-3.5 h-3.5 text-sky-500" />} action={<NavLink label="Visa alla" onClick={onNavigateCars} />} />
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                  {newCars.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onOpenCar(c.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <CarIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {[c.marke, c.modell].filter(Boolean).join(' ') || c.regnummer}
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          {c.regnummer} · {c.ar || '—'} · {c.miltal.toLocaleString('sv-SE')} mil
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {c.auktion_slut && (
                          <span className="text-xs text-slate-500 font-semibold">
                            {formatTimeLeft(c.auktion_slut, now)} kvar
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {c.car_images.length} foto{c.car_images.length !== 1 ? 'n' : ''}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  );
}

function DealerKpiCard({
  label, value, icon, topColor, iconCls, onClick, highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  topColor: string;
  iconCls: string;
  onClick?: () => void;
  highlight?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`relative text-left bg-white border rounded-xl overflow-hidden transition shadow-sm ${
        onClick ? 'hover:shadow-md cursor-pointer' : ''
      } ${highlight ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}
    >
      <div className={`h-0.5 w-full ${topColor}`} />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconCls}`}>{icon}</div>
          {onClick && <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />}
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 leading-none tabular-nums">{value}</div>
        <div className="text-xs text-slate-500 mt-1.5 leading-snug">{label}</div>
      </div>
    </Tag>
  );
}

function SectionLabel({ text, icon, action }: { text: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{text}</span>
      </div>
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
    <div className="flex flex-col items-center gap-2.5 px-4 py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}
