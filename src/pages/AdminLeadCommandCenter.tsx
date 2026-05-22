import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, Search, ChevronDown, ChevronRight,
  Car as CarIcon, TrendingUp, Bell,
  CheckCircle2, XCircle, Flame,
  LayoutDashboard, Building2, MessageSquareText, UserCheck,
  Eye, EyeOff, Download, RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PortalLayout from '../components/PortalLayout';
import { useAdminBadges } from '../hooks/useAdminBadges';

interface AdminLeadCommandCenterProps {
  adminUserId: string;
  adminName: string;
  onLoggedOut: () => void;
  onOpenCar: (id: string) => void;
  onOpenQuote: (id: string) => void;
  onNavigateOverview: () => void;
  onNavigateCars: () => void;
  onNavigateDealers: () => void;
}

type LeadType = 'all' | 'sell' | 'buy' | 'trade_in' | 'urgent' | 'uncontacted' | 'won' | 'lost';

interface UnifiedLead {
  id: string;
  type: 'car' | 'quote';
  lead_type: string;
  customer_name: string;
  customer_phone: string;
  car_label: string;
  highest_bid: number | null;
  assigned_to_name: string;
  source: string;
  status: string;
  crm_status: string | null;
  tags: string[];
  last_activity_at: string | null;
  next_activity_at: string | null;
  deadline_at: string | null;
  created_at: string;
  hidden_from_dealers?: boolean;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

const FILTER_TABS: { key: LeadType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Alla', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { key: 'sell', label: 'Säljleads', icon: <CarIcon className="w-3.5 h-3.5" /> },
  { key: 'buy', label: 'Köpleads', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: 'trade_in', label: 'Inbyte', icon: <RefreshCw className="w-3.5 h-3.5" /> },
  { key: 'urgent', label: 'Akuta', icon: <Flame className="w-3.5 h-3.5" /> },
  { key: 'uncontacted', label: 'Ej kontaktade', icon: <Bell className="w-3.5 h-3.5" /> },
  { key: 'won', label: 'Vunna', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { key: 'lost', label: 'Förlorade', icon: <XCircle className="w-3.5 h-3.5" /> },
];

const TAG_COLORS: Record<string, string> = {
  VIP: 'bg-amber-100 text-amber-800',
  'het lead': 'bg-red-100 text-red-700',
  osäker: 'bg-slate-100 text-slate-600',
  'hög sannolikhet': 'bg-green-100 text-green-700',
  återkommande: 'bg-blue-100 text-blue-700',
};

function tagClass(tag: string) {
  return TAG_COLORS[tag] ?? 'bg-slate-100 text-slate-600';
}

function statusLabel(status: string, crmStatus: string | null): { label: string; cls: string } {
  if (crmStatus === 'sald' || status === 'sold') return { label: 'Vunnen', cls: 'bg-green-100 text-green-700' };
  if (crmStatus === 'forlorad' || status === 'lost') return { label: 'Förlorad', cls: 'bg-red-100 text-red-700' };
  if (status === 'ny' || status === 'new') return { label: 'Ny', cls: 'bg-blue-100 text-blue-700' };
  if (status === 'active' || status === 'aktiv') return { label: 'Aktiv', cls: 'bg-emerald-100 text-emerald-700' };
  if (status === 'kontaktad' || crmStatus === 'ring') return { label: 'Kontaktad', cls: 'bg-orange-100 text-orange-700' };
  if (crmStatus === 'het') return { label: 'Het', cls: 'bg-red-100 text-red-700' };
  return { label: status || '—', cls: 'bg-slate-100 text-slate-500' };
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m sedan`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h sedan`;
  const days = Math.floor(hours / 24);
  return `${days}d sedan`;
}

function formatDeadline(dateStr: string | null): { label: string; cls: string } {
  if (!dateStr) return { label: '—', cls: 'text-slate-400' };
  const diff = new Date(dateStr).getTime() - Date.now();
  const hours = Math.floor(diff / 3600000);
  if (hours < 0) return { label: 'Förfallen', cls: 'text-red-600 font-semibold' };
  if (hours < 24) return { label: `${hours}h kvar`, cls: 'text-orange-600 font-medium' };
  const days = Math.floor(hours / 24);
  return { label: `${days}d kvar`, cls: 'text-slate-500' };
}

export default function AdminLeadCommandCenter({
  adminUserId,
  adminName,
  onLoggedOut,
  onOpenCar,
  onOpenQuote,
  onNavigateOverview,
  onNavigateCars,
  onNavigateDealers,
}: AdminLeadCommandCenterProps) {
  const badges = useAdminBadges();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<UnifiedLead[]>([]);
  const [filter, setFilter] = useState<LeadType>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [counts, setCounts] = useState<Record<LeadType, number>>({} as Record<LeadType, number>);

  const load = useCallback(async () => {
    setLoading(true);

    // Load admin users for assignment dropdown
    const { data: admins } = await supabase.from('admin_users').select('id, name, email');
    setAdminUsers(admins ?? []);

    // Load sell leads (cars table)
    const { data: cars } = await supabase
      .from('cars')
      .select(`
        id, regnummer, marke, modell, ar, status, crm_status, lead_type,
        assigned_to_name, tags, notes, hidden_from_dealers,
        next_activity_at, deadline_at, created_at,
        customers!inner(namn, telefon),
        bids!car_id(belopp)
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    // Load buy leads (quote_requests)
    const { data: quotes } = await supabase
      .from('quote_requests')
      .select(`
        id, search_option, car_model, budget, status,
        assigned_to_name, tags, notes, phone,
        firstname, lastname,
        next_activity_at, deadline_at, created_at
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    const unified: UnifiedLead[] = [];

    (cars ?? []).forEach((c: any) => {
      const bids: number[] = (c.bids ?? []).map((b: any) => b.belopp);
      const highestBid = bids.length ? Math.max(...bids) : null;
      const customer = Array.isArray(c.customers) ? c.customers[0] : c.customers;
      unified.push({
        id: c.id,
        type: 'car',
        lead_type: c.lead_type ?? 'sell',
        customer_name: customer?.namn ?? '—',
        customer_phone: customer?.telefon ?? '',
        car_label: [c.marke, c.modell, c.ar].filter(Boolean).join(' ') || c.regnummer,
        highest_bid: highestBid,
        assigned_to_name: c.assigned_to_name ?? '',
        source: 'Sälj',
        status: c.status,
        crm_status: c.crm_status,
        tags: c.tags ?? [],
        last_activity_at: c.created_at,
        next_activity_at: c.next_activity_at,
        deadline_at: c.deadline_at,
        created_at: c.created_at,
        hidden_from_dealers: c.hidden_from_dealers,
      });
    });

    (quotes ?? []).forEach((q: any) => {
      let leadType = 'buy';
      if (q.search_option === 'trade') leadType = 'trade_in';
      unified.push({
        id: q.id,
        type: 'quote',
        lead_type: leadType,
        customer_name: [q.firstname, q.lastname].filter(Boolean).join(' ') || '—',
        customer_phone: q.phone ?? '',
        car_label: q.car_model || q.budget ? `${q.car_model || 'Ej angiven'} (${q.budget || '—'})` : '—',
        highest_bid: null,
        assigned_to_name: q.assigned_to_name ?? '',
        source: 'Köp',
        status: q.status ?? 'ny',
        crm_status: null,
        tags: q.tags ?? [],
        last_activity_at: q.created_at,
        next_activity_at: q.next_activity_at,
        deadline_at: q.deadline_at,
        created_at: q.created_at,
      });
    });

    unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setLeads(unified);

    // Compute counts
    const c: Partial<Record<LeadType, number>> = { all: unified.length };
    unified.forEach((l) => {
      if (l.lead_type === 'sell') c.sell = (c.sell ?? 0) + 1;
      if (l.lead_type === 'buy') c.buy = (c.buy ?? 0) + 1;
      if (l.lead_type === 'trade_in') c.trade_in = (c.trade_in ?? 0) + 1;
      if (l.tags.includes('het lead') || l.crm_status === 'het') c.urgent = (c.urgent ?? 0) + 1;
      if (l.assigned_to_name === '' && l.status !== 'sold' && l.status !== 'lost') c.uncontacted = (c.uncontacted ?? 0) + 1;
      if (l.status === 'sold' || l.crm_status === 'sald') c.won = (c.won ?? 0) + 1;
      if (l.status === 'lost' || l.crm_status === 'forlorad') c.lost = (c.lost ?? 0) + 1;
    });
    setCounts(c as Record<LeadType, number>);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = leads.filter((l) => {
    if (filter === 'sell' && l.lead_type !== 'sell') return false;
    if (filter === 'buy' && l.lead_type !== 'buy') return false;
    if (filter === 'trade_in' && l.lead_type !== 'trade_in') return false;
    if (filter === 'urgent' && !l.tags.includes('het lead') && l.crm_status !== 'het') return false;
    if (filter === 'uncontacted' && (l.assigned_to_name !== '' || l.status === 'sold' || l.status === 'lost')) return false;
    if (filter === 'won' && l.status !== 'sold' && l.crm_status !== 'sald') return false;
    if (filter === 'lost' && l.status !== 'lost' && l.crm_status !== 'forlorad') return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.customer_name.toLowerCase().includes(q) &&
          !l.car_label.toLowerCase().includes(q) &&
          !l.customer_phone.includes(q)) return false;
    }
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.id)));
    }
  }

  async function bulkAssign(adminId: string, adminNameStr: string) {
    const carIds = [...selected].filter((id) => leads.find((l) => l.id === id)?.type === 'car');
    const quoteIds = [...selected].filter((id) => leads.find((l) => l.id === id)?.type === 'quote');

    if (carIds.length) {
      await supabase.from('cars').update({ assigned_to: adminId, assigned_to_name: adminNameStr }).in('id', carIds);
    }
    if (quoteIds.length) {
      await supabase.from('quote_requests').update({ assigned_to: adminId, assigned_to_name: adminNameStr }).in('id', quoteIds);
    }
    setBulkAssignOpen(false);
    setSelected(new Set());
    load();
  }

  async function bulkHideFromDealers(hide: boolean) {
    const carIds = [...selected].filter((id) => leads.find((l) => l.id === id)?.type === 'car');
    if (carIds.length) {
      await supabase.from('cars').update({ hidden_from_dealers: hide }).in('id', carIds);
    }
    setSelected(new Set());
    load();
  }

  function exportCSV() {
    const rows = [
      ['Kund', 'Telefon', 'Bil', 'Typ', 'Högsta bud', 'Ansvarig', 'Status', 'Taggar', 'Skapad'],
      ...filtered.map((l) => [
        l.customer_name,
        l.customer_phone,
        l.car_label,
        l.lead_type,
        l.highest_bid ?? '',
        l.assigned_to_name,
        l.status,
        l.tags.join(', '),
        l.created_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PortalLayout
      navItems={[
        { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Översikt', onClick: onNavigateOverview },
        { icon: <TrendingUp className="w-4 h-4" />, label: 'Leads', active: true },
        { icon: <CarIcon className="w-4 h-4" />, label: 'Bilar', onClick: onNavigateCars, badge: badges.newCars },
        { icon: <MessageSquareText className="w-4 h-4" />, label: 'Förfrågningar', badge: badges.newQuotes },
        { icon: <Building2 className="w-4 h-4" />, label: 'Handlare', onClick: onNavigateDealers, badge: badges.pendingDealers },
      ]}
      identity="Admin"
      identityRole="Bilto"
      onLogout={onLoggedOut}
      pageTitle="Lead Command Center"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Page title + actions */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Lead Command Center</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? '...' : `${leads.length} totala leads`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Uppdatera
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Exportera
            </button>
            <button
              onClick={onNavigateCars}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition"
            >
              <CarIcon className="w-3.5 h-3.5" />
              Bilar
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                filter === tab.key
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {counts[tab.key] != null && (
                <span className={`ml-0.5 ${filter === tab.key ? 'text-slate-300' : 'text-slate-400'}`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search + bulk actions */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök kund, bil, telefon..."
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">{selected.size} valda</span>

              {/* Bulk assign */}
              <div className="relative">
                <button
                  onClick={() => setBulkAssignOpen((v) => !v)}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Tilldela
                  <ChevronDown className="w-3 h-3" />
                </button>
                {bulkAssignOpen && (
                  <div className="absolute top-10 left-0 z-20 bg-white border border-slate-200 rounded-xl shadow-lg min-w-48 py-1">
                    {adminUsers.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => bulkAssign(a.id, a.name || a.email)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {a.name || a.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bulk hide/show */}
              <button
                onClick={() => bulkHideFromDealers(true)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 transition"
                title="Dölj från handlare"
              >
                <EyeOff className="w-3.5 h-3.5" />
                Dölj
              </button>
              <button
                onClick={() => bulkHideFromDealers(false)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 transition"
                title="Visa för handlare"
              >
                <Eye className="w-3.5 h-3.5" />
                Visa
              </button>

              <button
                onClick={() => setSelected(new Set())}
                className="h-9 px-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600 hover:bg-red-100 transition"
              >
                Rensa val
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Kund</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Bil</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Högsta bud</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Ansvarig</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Källa</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Senaste</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Deadline</th>
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-slate-400 text-sm">
                        Inga leads matchar filtret
                      </td>
                    </tr>
                  )}
                  {filtered.map((lead) => {
                    const { label: statusLbl, cls: statusCls } = statusLabel(lead.status, lead.crm_status);
                    const { label: deadlineLbl, cls: deadlineCls } = formatDeadline(lead.deadline_at);
                    const isSelected = selected.has(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        className={`border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          if (lead.type === 'car') onOpenCar(lead.id);
                          else onOpenQuote(lead.id);
                        }}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const next = new Set(selected);
                              if (isSelected) next.delete(lead.id); else next.add(lead.id);
                              setSelected(next);
                            }}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{lead.customer_name}</div>
                          <div className="text-xs text-slate-400">{lead.customer_phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{lead.car_label}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lead.tags.map((t) => (
                              <span key={t} className={`px-1.5 py-0.5 rounded text-xs font-medium ${tagClass(t)}`}>{t}</span>
                            ))}
                            {lead.hidden_from_dealers && (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-500 flex items-center gap-0.5">
                                <EyeOff className="w-2.5 h-2.5" /> Dold
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {lead.highest_bid != null
                            ? `${lead.highest_bid.toLocaleString('sv-SE')} kr`
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {lead.assigned_to_name
                            ? <span className="text-slate-700">{lead.assigned_to_name}</span>
                            : <span className="text-slate-300 italic text-xs">Ej tilldelad</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            lead.source === 'Köp' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {lead.source}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCls}`}>
                            {statusLbl}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {timeAgo(lead.last_activity_at)}
                        </td>
                        <td className={`px-4 py-3 text-xs ${deadlineCls}`}>
                          {deadlineLbl}
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.length === 0 && (
                <p className="text-center py-12 text-slate-400 text-sm">Inga leads matchar filtret</p>
              )}
              {filtered.map((lead) => {
                const { label: statusLbl, cls: statusCls } = statusLabel(lead.status, lead.crm_status);
                const { label: deadlineLbl, cls: deadlineCls } = formatDeadline(lead.deadline_at);
                return (
                  <div
                    key={lead.id}
                    className="px-4 py-4 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => {
                      if (lead.type === 'car') onOpenCar(lead.id);
                      else onOpenQuote(lead.id);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{lead.customer_name}</div>
                        <div className="text-xs text-slate-400">{lead.car_label}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusCls}`}>
                        {statusLbl}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {lead.highest_bid != null && (
                        <span className="font-medium text-slate-700">
                          {lead.highest_bid.toLocaleString('sv-SE')} kr
                        </span>
                      )}
                      <span className={deadlineCls}>{deadlineLbl}</span>
                      <span className="ml-auto">{timeAgo(lead.last_activity_at)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lead.tags.map((t) => (
                        <span key={t} className={`px-1.5 py-0.5 rounded text-xs font-medium ${tagClass(t)}`}>{t}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </div>
    </PortalLayout>
  );
}
