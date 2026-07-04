import { useEffect, useState } from 'react';
import {
  FileText, Package, CheckSquare, Star, TrendingUp,
  Clock, AlertCircle, ArrowRight, Plus, Loader2,
} from 'lucide-react';
import StaffShell, { navigate } from '../components/StaffShell';
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
  dealers: { foretagsnamn: string } | null;
  customers: { namn: string } | null;
  cars: { marke: string; modell: string; ar: number } | null;
  updated_at: string;
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

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  draft:             { bg: '#F7F6F3', text: '#6E6D68' },
  sent_for_approval: { bg: '#E6F1FB', text: '#0C447C' },
  approved:          { bg: '#E1F5EE', text: '#085041' },
  rejected:          { bg: '#FCEBEB', text: '#791F1F' },
  contract_sent:     { bg: '#EEEDFE', text: '#3C3489' },
  contract_signed:   { bg: '#EEEDFE', text: '#3C3489' },
  deposit_sent:      { bg: '#FAEEDA', text: '#854F0B' },
  deposit_paid:      { bg: '#E1F5EE', text: '#085041' },
  reserved:          { bg: '#E1F5EE', text: '#085041' },
  handed_over:       { bg: '#EAF3DE', text: '#27500A' },
  cancelled:         { bg: '#F7F6F3', text: '#6E6D68' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just nu';
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h sedan`;
  return `${Math.floor(h / 24)} d sedan`;
}

const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };

export default function StaffOverview({ staffUser, onLoggedOut }: StaffOverviewProps) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const now = new Date().toISOString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const todayEnd = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();

      const [dealsRes, tasksRes, poolRes, recentRes] = await Promise.all([
        supabase.from('deals').select('id, status, assigned_staff_user_id, created_at')
          .eq('assigned_staff_user_id', staffUser.id)
          .not('status', 'in', '(handed_over,cancelled)'),
        supabase.from('deal_tasks').select('id, status, due_at')
          .eq('assigned_to_staff_user_id', staffUser.id)
          .eq('status', 'pending').lte('due_at', todayEnd).gte('due_at', now),
        supabase.from('cars').select('id')
          .eq('available_for_staff_sales', true).eq('pool_status', 'available'),
        supabase.from('deals')
          .select('id, deal_number, status, updated_at, dealers(foretagsnamn), customers(namn), cars(marke, modell, ar)')
          .eq('assigned_staff_user_id', staffUser.id)
          .order('updated_at', { ascending: false }).limit(5),
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
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
        </div>
      </StaffShell>
    );
  }

  const quickActions = [
    { label: 'Ny affär', icon: Plus, path: '/staff/affarer/ny' },
    { label: 'Handlarpool', icon: Package, path: '/staff/lager' },
    { label: 'Ny värdering', icon: Star, path: '/staff/varderingar/ny' },
    { label: 'Uppgifter', icon: CheckSquare, path: '/staff/uppgifter' },
  ];

  return (
    <StaffShell
      activePage="overview"
      staffUser={staffUser}
      onLoggedOut={onLoggedOut}
      badgeCount={{ deals: stats?.pendingApprovals ?? 0 }}
    >
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>
            Hej, {staffUser.fornamn}!
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#6E6D68' }}>
            {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Öppna affärer', value: stats?.myOpenDeals ?? 0, icon: FileText, urgent: false },
            { label: 'Väntar godkännande', value: stats?.pendingApprovals ?? 0, icon: Clock, urgent: (stats?.pendingApprovals ?? 0) > 0 },
            { label: 'Uppgifter idag', value: stats?.myTasksDueToday ?? 0, icon: CheckSquare, urgent: (stats?.myTasksDueToday ?? 0) > 0 },
            { label: 'Bilar i poolen', value: stats?.poolCarsAvailable ?? 0, icon: Package, urgent: false },
          ].map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="p-4" style={{ ...cardStyle, background: kpi.urgent ? '#FFFBF0' : '#FFFFFF', borderColor: kpi.urgent ? '#F5D99A' : '#E5E4E0' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F7F6F3' }}>
                    <Icon className="w-4 h-4" style={{ color: kpi.urgent ? '#854F0B' : '#6E6D68' }} />
                  </div>
                  {kpi.urgent && <AlertCircle className="w-3.5 h-3.5" style={{ color: '#854F0B' }} />}
                </div>
                <div className="text-[28px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{kpi.value}</div>
                <div className="text-[12px] mt-0.5" style={{ color: '#6E6D68' }}>{kpi.label}</div>
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition hover:bg-[#EEF7F4]"
                style={cardStyle}
              >
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: '#EEF7F4' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: '#0F6E56' }} />
                </div>
                <span className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Month stats + Recent deals */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Month summary */}
          <div className="p-5" style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: '#6E6D68' }} />
              <h2 className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>Denna månad</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Affärer skapade', value: stats?.dealsThisMonth ?? 0, max: 20, color: '#0C447C' },
                { label: 'Levererade', value: stats?.dealsWonThisMonth ?? 0, max: 10, color: '#0F6E56' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[12px]" style={{ color: '#6E6D68' }}>{row.label}</span>
                    <span className="text-[12px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{row.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F7F6F3' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min((row.value / row.max) * 100, 100)}%`, background: row.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent deals */}
          <div className="lg:col-span-2" style={cardStyle}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid #E5E4E0' }}>
              <h2 className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>Senaste affärer</h2>
              <button
                onClick={() => navigate('/staff/affarer')}
                className="text-[12px] flex items-center gap-1 font-medium"
                style={{ color: '#0F6E56' }}
              >
                Visa alla <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div>
              {recentDeals.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px]" style={{ color: '#6E6D68' }}>
                  Inga affärer ännu.{' '}
                  <button onClick={() => navigate('/staff/affarer/ny')} className="font-medium" style={{ color: '#0F6E56' }}>
                    Skapa din första affär.
                  </button>
                </div>
              ) : (
                recentDeals.map((deal, idx) => {
                  const statusStyle = STATUS_STYLE[deal.status] ?? STATUS_STYLE.draft;
                  const car = deal.cars;
                  return (
                    <button
                      key={deal.id}
                      onClick={() => navigate(`/staff/affarer/${deal.id}`)}
                      className="w-full px-5 py-3.5 flex items-center gap-3 text-left transition hover:bg-[#F7F6F3]"
                      style={{ borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          {deal.deal_number && (
                            <span className="text-[11px] font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6E6D68' }}>{deal.deal_number}</span>
                          )}
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: 100 }}>
                            {STATUS_LABELS[deal.status] ?? deal.status}
                          </span>
                        </div>
                        <div className="text-[14px] font-medium truncate" style={{ color: '#1C1C1A' }}>
                          {car ? `${car.marke} ${car.modell} ${car.ar}` : 'Okänd bil'}
                        </div>
                        <div className="text-[12px]" style={{ color: '#6E6D68' }}>{deal.dealers?.foretagsnamn ?? '—'}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[12px]" style={{ color: '#6E6D68' }}>{timeAgo(deal.updated_at)}</div>
                        <ArrowRight className="w-3.5 h-3.5 ml-auto mt-1" style={{ color: '#E5E4E0' }} />
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
}
