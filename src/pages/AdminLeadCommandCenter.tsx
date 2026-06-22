import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Loader2, Search, ChevronDown, ChevronRight,
  Car as CarIcon, Bell, CheckCircle2, XCircle, Flame,
  UserCheck, Eye, EyeOff, Download, RefreshCw,
  CarFront, ArrowLeftRight, TrendingDown, Phone,
  Clock, Tag, User, Award, MessageCircle, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PortalLayout from '../components/PortalLayout';
import { useAdminNav, type AdminPage } from '../hooks/useAdminNav';
import { QualityBadgeList, QualityBadgePicker } from '../components/QualityBadges';
import CrmActivityPanel from '../components/CrmActivityPanel';

interface AdminLeadCommandCenterProps {
  adminUserId: string;
  adminName: string;
  onLoggedOut: () => void;
  onOpenCar: (id: string) => void;
  onOpenQuote: (id: string) => void;
  onNavigate: (page: AdminPage) => void;
}

type LeadCategory = 'all' | 'hittat-bil' | 'letar-bil' | 'inbyte' | 'salj' | 'urgent' | 'uncontacted' | 'won' | 'lost';

interface UnifiedLead {
  id: string;
  type: 'car' | 'quote' | 'lead';
  category: LeadCategory;
  customer_name: string;
  customer_phone: string;
  car_label: string;
  highest_bid: number | null;
  assigned_to_name: string;
  status: string;
  crm_status: string | null;
  tags: string[];
  last_activity_at: string | null;
  next_activity_at: string | null;
  deadline_at: string | null;
  created_at: string;
  hidden_from_dealers?: boolean;
  email?: string;
  budget?: string;
  search_option?: string;
  quality_badges: string[];
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

const CATEGORY_TABS: { key: LeadCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'all',        label: 'Alla',       icon: null,                                          color: '' },
  { key: 'hittat-bil', label: 'Hittat bil', icon: <CarFront className="w-3.5 h-3.5" />,          color: 'text-blue-600' },
  { key: 'letar-bil',  label: 'Letar bil',  icon: <Search className="w-3.5 h-3.5" />,            color: 'text-sky-600' },
  { key: 'inbyte',     label: 'Inbyte',     icon: <ArrowLeftRight className="w-3.5 h-3.5" />,    color: 'text-emerald-600' },
  { key: 'salj',       label: 'Sälj',       icon: <TrendingDown className="w-3.5 h-3.5" />,      color: 'text-orange-600' },
  { key: 'urgent',     label: 'Akuta',      icon: <Flame className="w-3.5 h-3.5" />,             color: 'text-red-600' },
  { key: 'uncontacted',label: 'Ej kontaktade', icon: <Bell className="w-3.5 h-3.5" />,           color: 'text-amber-600' },
  { key: 'won',        label: 'Vunna',      icon: <CheckCircle2 className="w-3.5 h-3.5" />,      color: 'text-green-600' },
  { key: 'lost',       label: 'Förlorade',  icon: <XCircle className="w-3.5 h-3.5" />,           color: 'text-slate-500' },
];

const CATEGORY_PILL: Record<LeadCategory, { label: string; cls: string }> = {
  'all':        { label: 'Alla',          cls: 'bg-slate-200 text-slate-700' },
  'hittat-bil': { label: 'Hittat bil',    cls: 'bg-blue-500 text-white' },
  'letar-bil':  { label: 'Letar bil',     cls: 'bg-emerald-500 text-white' },
  'inbyte':     { label: 'Inbyte',        cls: 'bg-teal-500 text-white' },
  'salj':       { label: 'Sälj',          cls: 'bg-orange-500 text-white' },
  'urgent':     { label: 'Akut',          cls: 'bg-red-500 text-white' },
  'uncontacted':{ label: 'Ej kontaktad',  cls: 'bg-amber-500 text-white' },
  'won':        { label: 'Vunnen',        cls: 'bg-green-500 text-white' },
  'lost':       { label: 'Förlorad',      cls: 'bg-slate-400 text-white' },
};

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

function statusBadge(status: string, crmStatus: string | null): { label: string; cls: string } {
  if (crmStatus === 'sald' || status === 'sold') return { label: 'Vunnen', cls: 'bg-green-100 text-green-700' };
  if (crmStatus === 'forlorad' || status === 'lost') return { label: 'Förlorad', cls: 'bg-red-100 text-red-700' };
  if (status === 'ny' || status === 'new') return { label: 'Ny', cls: 'bg-blue-100 text-blue-700' };
  if (status === 'active' || status === 'aktiv') return { label: 'Aktiv', cls: 'bg-emerald-100 text-emerald-700' };
  if (status === 'contacted' || status === 'kontaktad' || crmStatus === 'ring') return { label: 'Kontaktad', cls: 'bg-orange-100 text-orange-700' };
  if (crmStatus === 'het') return { label: 'Het', cls: 'bg-red-100 text-red-700' };
  if (status === 'converted') return { label: 'Konverterad', cls: 'bg-teal-100 text-teal-700' };
  if (status === 'won') return { label: 'Vunnen', cls: 'bg-green-100 text-green-700' };
  return { label: status || '–', cls: 'bg-slate-100 text-slate-500' };
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '–';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m sedan`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h sedan`;
  const days = Math.floor(hours / 24);
  return `${days}d sedan`;
}

function formatDeadline(dateStr: string | null): { label: string; cls: string } {
  if (!dateStr) return { label: '–', cls: 'text-slate-300' };
  const diff = new Date(dateStr).getTime() - Date.now();
  const hours = Math.floor(diff / 3600000);
  if (hours < 0) return { label: 'Förfallen', cls: 'text-red-600 font-semibold' };
  if (hours < 24) return { label: `${hours}h kvar`, cls: 'text-orange-500 font-medium' };
  const days = Math.floor(hours / 24);
  return { label: `${days}d kvar`, cls: 'text-slate-500' };
}

function formatPhone(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1-$2 $3 $4');
}

export default function AdminLeadCommandCenter({
  adminUserId,
  adminName,
  onLoggedOut,
  onOpenCar,
  onOpenQuote,
  onNavigate,
}: AdminLeadCommandCenterProps) {
  const navItems = useAdminNav({ activePage: 'leads', onNavigate });
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<UnifiedLead[]>([]);
  const [category, setCategory] = useState<LeadCategory>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [counts, setCounts] = useState<Partial<Record<LeadCategory, number>>>({});
  const [badgePopover, setBadgePopover] = useState<string | null>(null); // lead.id
  const [savingBadge, setSavingBadge] = useState(false);
  const badgePopoverRef = useRef<HTMLDivElement>(null);
  const [crmPanelId, setCrmPanelId] = useState<string | null>(null);

  // Close badge popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (badgePopover && badgePopoverRef.current && !badgePopoverRef.current.contains(e.target as Node)) {
        setBadgePopover(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [badgePopover]);

  async function saveBadges(lead: UnifiedLead, newBadges: string[]) {
    setSavingBadge(true);
    const table = lead.type === 'car' ? 'cars' : 'quote_requests';
    await supabase.from(table).update({ quality_badges: newBadges }).eq('id', lead.id);
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, quality_badges: newBadges } : l))
    );
    setSavingBadge(false);
  }

  const load = useCallback(async () => {
    setLoading(true);

    const { data: admins } = await supabase.from('admin_users').select('id, name, email');
    setAdminUsers(admins ?? []);

    // Sell leads – cars being sold
    const { data: cars } = await supabase
      .from('cars')
      .select(`
        id, regnummer, marke, modell, ar, status, crm_status, lead_type,
        assigned_to_name, tags, hidden_from_dealers, quality_badges,
        next_activity_at, deadline_at, created_at,
        customers!inner(namn, telefon),
        bids!car_id(belopp)
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    // Buy/trade leads – quote requests
    const { data: quotes } = await supabase
      .from('quote_requests')
      .select(`
        id, search_option, car_model, budget, status,
        assigned_to_name, tags, phone, email,
        firstname, lastname,
        next_activity_at, deadline_at, created_at, quality_badges
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
        category: 'salj',
        customer_name: customer?.namn ?? '–',
        customer_phone: customer?.telefon ?? '',
        car_label: [c.marke, c.modell, c.ar].filter(Boolean).join(' ') || c.regnummer,
        highest_bid: highestBid,
        assigned_to_name: c.assigned_to_name ?? '',
        status: c.status,
        crm_status: c.crm_status,
        tags: c.tags ?? [],
        last_activity_at: c.created_at,
        next_activity_at: c.next_activity_at,
        deadline_at: c.deadline_at,
        created_at: c.created_at,
        hidden_from_dealers: c.hidden_from_dealers,
        quality_badges: c.quality_badges ?? [],
      });
    });

    (quotes ?? []).forEach((q: any) => {
      const cat: LeadCategory =
        q.search_option === 'found' ? 'hittat-bil' :
        q.search_option === 'searching' ? 'letar-bil' :
        q.search_option === 'trade' ? 'inbyte' : 'hittat-bil';
      unified.push({
        id: q.id,
        type: 'quote',
        category: cat,
        customer_name: [q.firstname, q.lastname].filter(Boolean).join(' ') || '–',
        customer_phone: q.phone ?? '',
        email: q.email ?? '',
        car_label: q.car_model
          ? `${q.car_model}${q.budget ? ` · ${q.budget}` : ''}`
          : q.budget ?? '–',
        highest_bid: null,
        assigned_to_name: q.assigned_to_name ?? '',
        status: q.status ?? 'new',
        crm_status: null,
        tags: q.tags ?? [],
        last_activity_at: q.created_at,
        next_activity_at: q.next_activity_at,
        deadline_at: q.deadline_at,
        created_at: q.created_at,
        budget: q.budget,
        search_option: q.search_option,
        quality_badges: q.quality_badges ?? [],
      });
    });

    unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setLeads(unified);

    const c: Partial<Record<LeadCategory, number>> = { all: unified.length };
    unified.forEach((l) => {
      c[l.category] = (c[l.category] ?? 0) + 1;
      if (l.tags.includes('het lead') || l.crm_status === 'het') c.urgent = (c.urgent ?? 0) + 1;
      if (!l.assigned_to_name && l.status !== 'sold' && l.status !== 'lost' && l.status !== 'won') {
        c.uncontacted = (c.uncontacted ?? 0) + 1;
      }
      if (l.status === 'sold' || l.crm_status === 'sald' || l.status === 'won') c.won = (c.won ?? 0) + 1;
      if (l.status === 'lost' || l.crm_status === 'forlorad') c.lost = (c.lost ?? 0) + 1;
    });
    setCounts(c);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = leads.filter((l) => {
    if (category !== 'all') {
      if (category === 'urgent' && !l.tags.includes('het lead') && l.crm_status !== 'het') return false;
      if (category === 'uncontacted' && (l.assigned_to_name !== '' || l.status === 'sold' || l.status === 'lost')) return false;
      if (category === 'won' && l.status !== 'sold' && l.crm_status !== 'sald' && l.status !== 'won') return false;
      if (category === 'lost' && l.status !== 'lost' && l.crm_status !== 'forlorad') return false;
      if (!['urgent','uncontacted','won','lost'].includes(category) && l.category !== category) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!l.customer_name.toLowerCase().includes(q) &&
          !l.car_label.toLowerCase().includes(q) &&
          !l.customer_phone.includes(q) &&
          !(l.email ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((l) => l.id)));
  }

  async function bulkAssign(adminId: string, adminNameStr: string) {
    const carIds = [...selected].filter((id) => leads.find((l) => l.id === id)?.type === 'car');
    const quoteIds = [...selected].filter((id) => leads.find((l) => l.id === id)?.type === 'quote');
    if (carIds.length) await supabase.from('cars').update({ assigned_to: adminId, assigned_to_name: adminNameStr }).in('id', carIds);
    if (quoteIds.length) await supabase.from('quote_requests').update({ assigned_to: adminId, assigned_to_name: adminNameStr }).in('id', quoteIds);
    setBulkAssignOpen(false);
    setSelected(new Set());
    load();
  }

  async function bulkHideFromDealers(hide: boolean) {
    const carIds = [...selected].filter((id) => leads.find((l) => l.id === id)?.type === 'car');
    if (carIds.length) await supabase.from('cars').update({ hidden_from_dealers: hide }).in('id', carIds);
    setSelected(new Set());
    load();
  }

  function exportCSV() {
    const rows = [
      ['Kund', 'Telefon', 'E-post', 'Bil/Ärende', 'Kategori', 'Högsta bud', 'Ansvarig', 'Status', 'Taggar', 'Skapad'],
      ...filtered.map((l) => [
        l.customer_name, l.customer_phone, l.email ?? '',
        l.car_label, l.category, l.highest_bid ?? '',
        l.assigned_to_name, l.status, l.tags.join(', '), l.created_at,
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

  function openLead(lead: UnifiedLead) {
    if (lead.type === 'car') onOpenCar(lead.id);
    else onOpenQuote(lead.id);
  }

  const activeTab = CATEGORY_TABS.find((t) => t.key === category)!;

  return (
    <PortalLayout
      navItems={navItems}
      identity="Admin"
      identityRole="Bilto"
      onLogout={onLoggedOut}
      pageTitle="Leads"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">

        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leads</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? '...' : `${filtered.length} av ${leads.length} leads`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-[#faf8f5] text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Uppdatera</span>
            </button>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-[#faf8f5] text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportera</span>
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 sm:mx-0 px-3 sm:px-0">
          {CATEGORY_TABS.map((tab) => {
            const count = counts[tab.key] ?? 0;
            const active = category === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setCategory(tab.key)}
                className={`
                  flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium border transition shrink-0
                  ${active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : `bg-[#faf8f5] border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 ${tab.color}`
                  }
                `}
              >
                {tab.icon}
                {tab.label}
                {count > 0 && (
                  <span className={`text-[11px] font-semibold ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + bulk actions bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök namn, bil, telefon..."
              className="w-full pl-8 pr-3 h-8 rounded-lg border border-slate-200 bg-[#faf8f5] text-xs focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent"
            />
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                {selected.size} valda
              </span>

              <div className="relative">
                <button
                  onClick={() => setBulkAssignOpen((v) => !v)}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-[#faf8f5] text-xs text-slate-700 hover:bg-slate-50 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Tilldela
                  <ChevronDown className="w-3 h-3" />
                </button>
                {bulkAssignOpen && (
                  <div className="absolute top-9 left-0 z-20 bg-[#faf8f5] border border-slate-200 rounded-xl shadow-lg min-w-44 py-1 text-sm">
                    {adminUsers.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => bulkAssign(a.id, a.name || a.email)}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50"
                      >
                        {a.name || a.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => bulkHideFromDealers(true)}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-[#faf8f5] text-xs text-slate-700 hover:bg-slate-50 transition"
                title="Dölj från handlare"
              >
                <EyeOff className="w-3.5 h-3.5" /> Dölj
              </button>
              <button
                onClick={() => bulkHideFromDealers(false)}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-[#faf8f5] text-xs text-slate-700 hover:bg-slate-50 transition"
                title="Visa för handlare"
              >
                <Eye className="w-3.5 h-3.5" /> Visa
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="h-8 px-2.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-600 hover:bg-red-100 transition"
              >
                Rensa
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-slate-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
              {activeTab.icon ?? <Search className="w-5 h-5" />}
            </div>
            <p className="text-sm font-medium text-slate-400">Inga leads</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 underline hover:text-slate-600"
              >
                Rensa sökning
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block bg-[#faf8f5] rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-slate-300 accent-slate-900"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Kund</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Ärende</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Badges</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Kategori</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Bud</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Ansvarig</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Inkommen</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Deadline</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">CRM</th>
                    <th className="w-8 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((lead) => {
                    const { label: statusLbl, cls: statusCls } = statusBadge(lead.status, lead.crm_status);
                    const { label: deadlineLbl, cls: deadlineCls } = formatDeadline(lead.deadline_at);
                    const catPill = CATEGORY_PILL[lead.category];
                    const isSelected = selected.has(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => openLead(lead)}
                        className={`hover:bg-slate-50/60 transition cursor-pointer ${isSelected ? 'bg-blue-50/60' : ''}`}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const next = new Set(selected);
                              if (isSelected) next.delete(lead.id); else next.add(lead.id);
                              setSelected(next);
                            }}
                            className="rounded border-slate-300 accent-slate-900"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 text-[13px]">{lead.customer_name}</div>
                          {lead.customer_phone && (
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {lead.customer_phone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <div className="text-[13px] text-slate-800 font-medium truncate">{lead.car_label}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lead.tags.slice(0, 2).map((t) => (
                              <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tagClass(t)}`}>{t}</span>
                            ))}
                            {lead.hidden_from_dealers && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400 flex items-center gap-0.5">
                                <EyeOff className="w-2.5 h-2.5" /> Dold
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Quality badges cell */}
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="relative" ref={badgePopover === lead.id ? badgePopoverRef : undefined}>
                            <button
                              onClick={() => setBadgePopover(badgePopover === lead.id ? null : lead.id)}
                              className={`inline-flex items-center gap-1 h-6 px-2 rounded-xl border text-[10px] transition
                                ${lead.quality_badges.length > 0
                                  ? 'border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                  : 'border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-500'
                                }`}
                              title="Redigera badges"
                            >
                              <Award className="w-3 h-3" />
                              {lead.quality_badges.length > 0 ? lead.quality_badges.length : '+'}
                            </button>
                            {lead.quality_badges.length > 0 && (
                              <div className="mt-1">
                                <QualityBadgeList badges={lead.quality_badges} size="sm" />
                              </div>
                            )}
                            {badgePopover === lead.id && (
                              <div className="absolute top-8 left-0 z-30 bg-[#faf8f5] border border-slate-200 rounded-xl shadow-xl p-3 min-w-[260px]">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Kvalitetsbadges</p>
                                <QualityBadgePicker
                                  badges={lead.quality_badges}
                                  saving={savingBadge}
                                  onChange={(next) => saveBadges(lead, next)}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-xs font-medium ${catPill.cls}`}>
                            {catPill.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-xl text-xs font-medium ${statusCls}`}>
                            {statusLbl}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] font-semibold text-slate-700">
                          {lead.highest_bid != null
                            ? `${lead.highest_bid.toLocaleString('sv-SE')} kr`
                            : <span className="text-slate-200 font-normal">–</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          {lead.assigned_to_name
                            ? <span className="text-[13px] text-slate-700">{lead.assigned_to_name}</span>
                            : <span className="text-xs text-slate-300 italic">Ej tilldelad</span>}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-400">
                          {timeAgo(lead.last_activity_at)}
                        </td>
                        <td className={`px-4 py-3.5 text-xs ${deadlineCls}`}>
                          {deadlineLbl}
                        </td>
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          {lead.type === 'car' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCrmPanelId(lead.id);
                              }}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition border ${
                                crmPanelId === lead.id
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-[#faf8f5] text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                              title="Öppna CRM-aktiviteter"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <ChevronRight className="w-4 h-4 text-slate-200" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet cards */}
            <div className="lg:hidden space-y-2">
              {filtered.map((lead) => {
                const { label: statusLbl, cls: statusCls } = statusBadge(lead.status, lead.crm_status);
                const { label: deadlineLbl, cls: deadlineCls } = formatDeadline(lead.deadline_at);
                const catPill = CATEGORY_PILL[lead.category];
                return (
                  <div
                    key={lead.id}
                    onClick={() => openLead(lead)}
                    className="bg-[#faf8f5] rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-sm transition active:scale-[0.99]"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">{lead.customer_name}</div>
                        {lead.customer_phone && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {lead.customer_phone}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-xl text-[11px] font-medium ${catPill.cls}`}>
                          {catPill.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-xl text-[11px] font-medium ${statusCls}`}>
                          {statusLbl}
                        </span>
                      </div>
                    </div>

                    {/* Car/subject */}
                    <div className="text-xs text-slate-600 font-medium truncate mb-1">{lead.car_label}</div>

                    {/* Quality badges */}
                    {lead.quality_badges.length > 0 && (
                      <div className="mb-2">
                        <QualityBadgeList badges={lead.quality_badges} size="sm" />
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      {lead.highest_bid != null && (
                        <span className="font-semibold text-slate-700">
                          {lead.highest_bid.toLocaleString('sv-SE')} kr
                        </span>
                      )}
                      {lead.assigned_to_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {lead.assigned_to_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(lead.last_activity_at)}
                      </span>
                      {lead.deadline_at && (
                        <span className={`flex items-center gap-1 ${deadlineCls}`}>
                          <Clock className="w-3 h-3" />
                          {deadlineLbl}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {lead.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lead.tags.map((t) => (
                          <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 ${tagClass(t)}`}>
                            <Tag className="w-2.5 h-2.5" />
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* CRM Activity slide-in panel */}
      {crmPanelId && (
        <>
          {/* Backdrop (mobile) */}
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setCrmPanelId(null)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 shadow-2xl border-l border-slate-200">
            <div className="h-full flex flex-col bg-[#faf8f5]">
              {/* Panel header with close */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-800">CRM-aktiviteter</span>
                </div>
                <button
                  onClick={() => setCrmPanelId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                  aria-label="Stäng CRM-panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* CRM panel content (no own header/close since we handle it above) */}
              <div className="flex-1 overflow-hidden">
                <CrmActivityPanel
                  carId={crmPanelId}
                  adminUserId={adminUserId}
                  adminName={adminName}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </PortalLayout>
  );
}
