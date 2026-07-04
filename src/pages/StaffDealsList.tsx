import { useEffect, useState } from 'react';
import { FileText, Plus, Search, Loader2, Clock } from 'lucide-react';
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
  draft:              { bg: '#F7F6F3',  text: '#6E6D68' },
  sent_for_approval:  { bg: '#E6F1FB',  text: '#0C447C' },
  approved:           { bg: '#E1F5EE',  text: '#085041' },
  rejected:           { bg: '#FCEBEB',  text: '#791F1F' },
  contract_sent:      { bg: '#EEEDFE',  text: '#3C3489' },
  contract_signed:    { bg: '#EEEDFE',  text: '#3C3489' },
  deposit_sent:       { bg: '#FAEEDA',  text: '#854F0B' },
  deposit_paid:       { bg: '#E1F5EE',  text: '#085041' },
  reserved:           { bg: '#E1F5EE',  text: '#085041' },
  handed_over:        { bg: '#EAF3DE',  text: '#27500A' },
  cancelled:          { bg: '#F7F6F3',  text: '#6E6D68' },
};

const ACTIVE_STATUSES = ['draft','sent_for_approval','approved','contract_sent','contract_signed','deposit_sent','deposit_paid','reserved'];
const CLOSED_STATUSES = ['handed_over','cancelled','rejected'];

type FilterTab = 'mine' | 'all' | 'pending_approval' | 'active' | 'closed';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just nu';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
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
          cars(marke, modell, ar, regnummer)
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
    { id: 'mine',             label: 'Mina ärenden' },
    { id: 'all',              label: 'Alla' },
    { id: 'pending_approval', label: 'Väntar godkännande', badge: pendingCount },
    { id: 'active',           label: 'Aktiva' },
    { id: 'closed',           label: 'Avslutade' },
  ];

  const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };

  return (
    <StaffShell activePage="deals" staffUser={staffUser} onLoggedOut={onLoggedOut} badgeCount={{ deals: pendingCount }}>
      <div>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>Ärenden</h1>
            <p className="text-[13px] mt-0.5" style={{ color: '#6E6D68' }}>{deals.length} totalt</p>
          </div>
          <button
            onClick={onNewDeal}
            className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-[13px] font-medium"
            style={{ background: '#0F6E56', color: '#FFFFFF' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Ny affär
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 p-1 rounded-lg mb-4 overflow-x-auto" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-md text-[13px] transition"
              style={{
                background: tab === t.id ? '#0F6E56' : 'transparent',
                color: tab === t.id ? '#FFFFFF' : '#6E6D68',
                fontWeight: tab === t.id ? 500 : 400,
              }}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: tab === t.id ? 'rgba(255,255,255,0.25)' : '#FCEBEB', color: tab === t.id ? '#FFFFFF' : '#791F1F' }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#6E6D68' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök affärsnummer, bil, handlare, kund…"
            className="w-full h-9 pl-8 pr-3 rounded-lg text-[14px] focus:outline-none"
            style={{ border: '1px solid #E5E4E0', background: '#FFFFFF', color: '#1C1C1A' }}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={cardStyle}>
            <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: '#E5E4E0' }} />
            <p className="text-[14px] mb-3" style={{ color: '#6E6D68' }}>Inga ärenden matchar.</p>
            <button onClick={onNewDeal} className="text-[13px] font-medium" style={{ color: '#0F6E56' }}>
              Skapa ny affär
            </button>
          </div>
        ) : (
          <div style={cardStyle}>
            {filtered.map((deal, idx) => {
              const statusStyle = STATUS_STYLE[deal.status] ?? STATUS_STYLE.draft;
              const car = deal.cars;
              const isUrgent = deal.status === 'sent_for_approval';

              return (
                <button
                  key={deal.id}
                  onClick={() => onOpenDeal(deal.id)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left transition hover:bg-[#F7F6F3]"
                  style={{
                    borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined,
                    background: isUrgent ? '#F5F9FF' : undefined,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {deal.deal_number && (
                        <span className="text-[11px] font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6E6D68' }}>
                          {deal.deal_number}
                        </span>
                      )}
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: 100 }}>
                        {STATUS_LABELS[deal.status] ?? deal.status}
                      </span>
                    </div>
                    <div className="text-[14px] font-medium truncate" style={{ color: '#1C1C1A' }}>
                      {car ? `${car.marke} ${car.modell} ${car.ar}` : 'Okänd bil'}
                      {car?.regnummer && (
                        <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                          {car.regnummer}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] mt-0.5 truncate" style={{ color: '#6E6D68' }}>
                      {deal.dealers?.foretagsnamn ?? '—'}
                      {deal.customers?.namn && ` · ${deal.customers.namn}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[12px] flex items-center gap-1 justify-end" style={{ color: '#6E6D68' }}>
                      <Clock className="w-3 h-3" />
                      {timeAgo(deal.updated_at)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </StaffShell>
  );
}
