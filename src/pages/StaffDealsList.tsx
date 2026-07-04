import { useEffect, useState } from 'react';
import {
  FileText, Plus, Search, Filter, Loader2, ArrowRight,
  Clock, CheckCircle2,
} from 'lucide-react';
import StaffShell from '../components/StaffShell';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

interface StaffDealsListProps {
  staffUser: StaffUser;
  onLoggedOut: () => void;
  onOpenDeal: (id: string) => void;
  onNewDeal: () => void;
}

interface Deal {
  id: string;
  deal_number: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  dealer_id: string | null;
  assigned_staff_user_id: string | null;
  dealers: { foretagsnamn: string } | null;
  customers: { namn: string } | null;
  cars: { marke: string; modell: string; ar: number; regnummer: string | null } | null;
  staff_users: { fornamn: string; efternamn: string } | null;
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

const ACTIVE_STATUSES = ['draft','sent_for_approval','approved','contract_sent','contract_signed','deposit_sent','deposit_paid','reserved'];
const CLOSED_STATUSES = ['handed_over','cancelled','rejected'];

type FilterTab = 'mine' | 'all' | 'pending_approval' | 'active' | 'closed';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function StaffDealsList({ staffUser, onLoggedOut, onOpenDeal, onNewDeal }: StaffDealsListProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('mine');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('deals')
        .select(`
          id, deal_number, status, created_at, updated_at, dealer_id, assigned_staff_user_id,
          dealers(foretagsnamn),
          customers(namn),
          cars(marke, modell, ar, regnummer),
          staff_users!assigned_staff_user_id(fornamn, efternamn)
        `)
        .order('updated_at', { ascending: false })
        .limit(200);

      setDeals((data ?? []) as unknown as Deal[]);
      setLoading(false);
    })();
  }, []);

  const filtered = deals.filter(d => {
    if (tab === 'mine' && d.assigned_staff_user_id !== staffUser.id) return false;
    if (tab === 'pending_approval' && d.status !== 'sent_for_approval') return false;
    if (tab === 'active' && !ACTIVE_STATUSES.includes(d.status)) return false;
    if (tab === 'closed' && !CLOSED_STATUSES.includes(d.status)) return false;

    if (search) {
      const q = search.toLowerCase();
      const car = d.cars;
      return (
        (d.deal_number ?? '').toLowerCase().includes(q) ||
        (car ? `${car.marke} ${car.modell} ${car.ar}`.toLowerCase().includes(q) : false) ||
        (d.dealers?.foretagsnamn ?? '').toLowerCase().includes(q) ||
        (d.customers?.namn ?? '').toLowerCase().includes(q) ||
        (car?.regnummer ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = deals.filter(d => d.status === 'sent_for_approval').length;

  const TABS: { id: FilterTab; label: string; badge?: number }[] = [
    { id: 'mine', label: 'Mina affärer' },
    { id: 'all', label: 'Alla' },
    { id: 'pending_approval', label: 'Väntar godkännande', badge: pendingCount },
    { id: 'active', label: 'Aktiva' },
    { id: 'closed', label: 'Avslutade' },
  ];

  return (
    <StaffShell activePage="deals" staffUser={staffUser} onLoggedOut={onLoggedOut} badgeCount={{ deals: pendingCount }}>
      <div className="max-w-6xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-500" />
              Affärer
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{deals.length} totalt</p>
          </div>
          <button
            onClick={onNewDeal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: '#00A85A', color: 'white' }}
          >
            <Plus className="w-4 h-4" />
            Ny affär
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-5 w-full overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition"
              style={{
                background: tab === t.id ? '#0A1628' : 'transparent',
                color: tab === t.id ? 'white' : '#6B7280',
              }}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: tab === t.id ? 'rgba(255,255,255,0.2)' : '#FEF3C7',
                    color: tab === t.id ? 'white' : '#D97706',
                  }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök affärsnummer, bil, handlare, kund…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm text-slate-400">Inga affärer matchar.</p>
            <button onClick={onNewDeal} className="mt-3 text-sm font-semibold text-blue-600 hover:underline">
              Skapa ny affär
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-50">
              {filtered.map(deal => {
                const statusStyle = STATUS_COLORS[deal.status] ?? STATUS_COLORS.draft;
                const car = deal.cars;
                const isUrgent = deal.status === 'sent_for_approval';

                return (
                  <button
                    key={deal.id}
                    onClick={() => onOpenDeal(deal.id)}
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition text-left"
                    style={{ background: isUrgent ? '#FFFBEB' : undefined }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-slate-400">{deal.deal_number ?? '—'}</span>
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: statusStyle.bg, color: statusStyle.text }}
                        >
                          {STATUS_LABELS[deal.status] ?? deal.status}
                        </span>
                        {isUrgent && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                        {car ? `${car.marke} ${car.modell} ${car.ar}` : 'Okänd bil'}
                        {car?.regnummer && (
                          <span className="ml-2 text-xs font-mono text-slate-400">{car.regnummer}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {deal.dealers?.foretagsnamn ?? '—'}
                        {deal.customers?.namn && ` · ${deal.customers.namn}`}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(deal.updated_at)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="hidden">{navigate}</div>
    </StaffShell>
  );
}
