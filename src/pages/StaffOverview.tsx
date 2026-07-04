import { useEffect, useState } from 'react';
import {
  FileText, Package, CheckSquare, Star, TrendingUp,
  Clock, AlertCircle, ArrowRight, Plus, Loader2,
} from 'lucide-react';
import StaffShell from '../components/StaffShell';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

interface StaffOverviewProps {
  staffUser: StaffUser;
  onLoggedOut: () => void;
  onNavigate: (path: string) => void;
}

interface OverviewStats {
  myOpenDeals: number;
  pendingApprovals: number;
  myTasksDueToday: number;
  poolCarsAvailable: number;
  dealsThisMonth: number;
  dealsWonThisMonth: number;
}

interface RecentDeal {
  id: string;
  deal_number: string | null;
  status: string;
  dealer_id: string | null;
  dealers: { foretagsnamn: string } | null;
  customers: { namn: string } | null;
  cars: { marke: string; modell: string; ar: number } | null;
  updated_at: string;
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast',
  sent_for_approval: 'Väntar godkännande',
  approved: 'Godkänd',
  rejected: 'Avvisad',
  contract_sent: 'Kontrakt skickat',
  contract_signed: 'Kontrakt signerat',
  deposit_sent: 'Handpenning skickad',
  deposit_paid: 'Handpenning betald',
  reserved: 'Reserverad',
  handed_over: 'Levererad',
  cancelled: 'Avbruten',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  sent_for_approval: { bg: '#FEF3C7', text: '#D97706' },
  approved: { bg: '#D1FAE5', text: '#065F46' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
  contract_sent: { bg: '#DBEAFE', text: '#1D4ED8' },
  contract_signed: { bg: '#C7D2FE', text: '#4338CA' },
  deposit_sent: { bg: '#FDE68A', text: '#92400E' },
  deposit_paid: { bg: '#A7F3D0', text: '#065F46' },
  reserved: { bg: '#BBF7D0', text: '#065F46' },
  handed_over: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#F3F4F6', text: '#9CA3AF' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h sedan`;
  return `${Math.floor(h / 24)} d sedan`;
}

export default function StaffOverview({ staffUser, onLoggedOut, onNavigate }: StaffOverviewProps) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const now = new Date().toISOString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const todayEnd = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();

      const [dealsRes, tasksRes, poolRes, recentRes] = await Promise.all([
        supabase
          .from('deals')
          .select('id, status, assigned_staff_user_id, created_at')
          .eq('assigned_staff_user_id', staffUser.id)
          .not('status', 'in', '(handed_over,cancelled)'),
        supabase
          .from('deal_tasks')
          .select('id, status, due_at')
          .eq('assigned_to_staff_user_id', staffUser.id)
          .eq('status', 'pending')
          .lte('due_at', todayEnd)
          .gte('due_at', now),
        supabase
          .from('cars')
          .select('id')
          .eq('available_for_staff_sales', true)
          .eq('pool_status', 'available'),
        supabase
          .from('deals')
          .select('id, deal_number, status, updated_at, dealers(foretagsnamn), customers(namn), cars(marke, modell, ar), dealer_id')
          .eq('assigned_staff_user_id', staffUser.id)
          .order('updated_at', { ascending: false })
          .limit(5),
      ]);

      const openDeals = dealsRes.data ?? [];
      const pendingApprovals = openDeals.filter(d => d.status === 'sent_for_approval').length;
      const monthDeals = openDeals.filter(d => d.created_at >= monthStart);
      const wonDeals = monthDeals.filter(d => d.status === 'handed_over').length;

      setStats({
        myOpenDeals: openDeals.length,
        pendingApprovals,
        myTasksDueToday: (tasksRes.data ?? []).length,
        poolCarsAvailable: (poolRes.data ?? []).length,
        dealsThisMonth: monthDeals.length,
        dealsWonThisMonth: wonDeals,
      });

      setRecentDeals((recentRes.data ?? []) as unknown as RecentDeal[]);
      setLoading(false);
    })();
  }, [staffUser.id]);

  if (loading) {
    return (
      <StaffShell activePage="overview" staffUser={staffUser} onLoggedOut={onLoggedOut}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </StaffShell>
    );
  }

  const quickActions = [
    { label: 'Ny affär', icon: Plus, action: () => navigate('/staff/affarer/ny'), color: '#00A85A' },
    { label: 'Nätverkslager', icon: Package, action: () => navigate('/staff/lager'), color: '#3B82F6' },
    { label: 'Ny värdering', icon: Star, action: () => navigate('/staff/varderingar/ny'), color: '#F59E0B' },
    { label: 'Mina uppgifter', icon: CheckSquare, action: () => navigate('/staff/uppgifter'), color: '#8B5CF6' },
  ];

  return (
    <StaffShell
      activePage="overview"
      staffUser={staffUser}
      onLoggedOut={onLoggedOut}
      badgeCount={{
        deals: stats?.pendingApprovals ?? 0,
        tasks: stats?.myTasksDueToday ?? 0,
      }}
    >
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Hej, {staffUser.fornamn}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Öppna affärer', value: stats?.myOpenDeals ?? 0, icon: FileText, color: '#3B82F6', sub: 'just nu' },
            { label: 'Väntar godkännande', value: stats?.pendingApprovals ?? 0, icon: Clock, color: '#F59E0B', sub: 'hos handlare', urgent: (stats?.pendingApprovals ?? 0) > 0 },
            { label: 'Uppgifter idag', value: stats?.myTasksDueToday ?? 0, icon: CheckSquare, color: '#8B5CF6', sub: 'förfaller idag', urgent: (stats?.myTasksDueToday ?? 0) > 0 },
            { label: 'Bilar i poolen', value: stats?.poolCarsAvailable ?? 0, icon: Package, color: '#00A85A', sub: 'tillgängliga' },
          ].map(kpi => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="bg-white rounded-2xl p-5 border"
                style={{ borderColor: kpi.urgent ? '#FDE68A' : '#E5E7EB', background: kpi.urgent ? '#FFFBEB' : 'white' }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${kpi.color}15` }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: kpi.color }} strokeWidth={2} />
                  </div>
                  {kpi.urgent && <AlertCircle className="w-4 h-4 text-amber-500" />}
                </div>
                <div className="text-3xl font-bold text-slate-900">{kpi.value}</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">{kpi.label}</div>
                <div className="text-[11px] text-slate-400">{kpi.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.action}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition text-left"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${action.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: action.color }} />
                </div>
                <span className="text-sm font-semibold text-slate-700">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Month stats + Recent deals */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Month summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-900">Denna månad</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-500">Affärer skapade</span>
                  <span className="text-xs font-bold text-slate-900">{stats?.dealsThisMonth ?? 0}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(((stats?.dealsThisMonth ?? 0) / 20) * 100, 100)}%`, background: '#3B82F6' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-500">Levererade</span>
                  <span className="text-xs font-bold text-slate-900">{stats?.dealsWonThisMonth ?? 0}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(((stats?.dealsWonThisMonth ?? 0) / 10) * 100, 100)}%`, background: '#00A85A' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent deals */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Senaste affärer</h2>
              <button
                onClick={() => navigate('/staff/affarer')}
                className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
              >
                Visa alla <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {recentDeals.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-slate-400">
                  Inga affärer ännu. <button onClick={() => navigate('/staff/affarer/ny')} className="text-blue-600 font-semibold">Skapa din första affär.</button>
                </div>
              ) : (
                recentDeals.map(deal => {
                  const statusStyle = STATUS_COLORS[deal.status] ?? STATUS_COLORS.draft;
                  const car = deal.cars;
                  const dealer = deal.dealers;
                  return (
                    <button
                      key={deal.id}
                      onClick={() => navigate(`/staff/affarer/${deal.id}`)}
                      className="w-full px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">{deal.deal_number ?? '—'}</span>
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: statusStyle.bg, color: statusStyle.text }}
                          >
                            {STATUS_LABELS[deal.status] ?? deal.status}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
                          {car ? `${car.marke} ${car.modell} ${car.ar}` : 'Okänd bil'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {dealer?.foretagsnamn ?? '—'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] text-slate-400">{timeAgo(deal.updated_at)}</div>
                        <ArrowRight className="w-4 h-4 text-slate-300 ml-auto mt-1" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffShell>
  );

  void onNavigate;
}
